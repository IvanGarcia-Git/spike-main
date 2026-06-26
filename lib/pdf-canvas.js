// Opciones compartidas de html2canvas para exportar el PDF de comparativas.
// Se usan TANTO en la descarga real (app/comparativas/personalizada) como en el harness de
// verificación visual, para que lo que se prueba sea EXACTAMENTE lo que se descarga.
//
// Nota sobre el centrado vertical: html2canvas 1.4.1 NO centra el texto usando el half-leading
// del line-height (dibuja el glifo arriba del line-box). Por eso, en el componente del PDF, el
// centrado vertical de "botones"/badges se hace con padding simétrico + line-height:1 (que sí
// respeta html2canvas), no con flex `items-center`.

export function buildPdfCanvasOptions({ background = '#ffffff', scale = 2.5 } = {}) {
  return {
    scale,
    useCORS: true,
    backgroundColor: background,
    windowWidth: 800,
    windowHeight: 1130,
    logging: false,
    imageTimeout: 15000,
    removeContainer: false,
    onclone: (clonedDoc) => {
      // Solo forzamos el FONDO de cada página (los colores de texto son inline en el diseño,
      // así que el canvas los respeta igual que la vista previa — no recoloreamos nada).
      const clonedPages = clonedDoc.querySelectorAll('.pdf-page');
      clonedPages.forEach((clonedPage) => {
        if (clonedPage instanceof HTMLElement) clonedPage.style.backgroundColor = background;
      });

      // Quitar bordes punteados de contenedores de imagen (UI de subida de logos).
      const imageLabels = clonedDoc.querySelectorAll('.logo-container, label.border-dashed, label.border-2');
      imageLabels.forEach((label) => {
        if (label instanceof HTMLElement) {
          label.style.setProperty('border', 'none', 'important');
          label.style.setProperty('outline', 'none', 'important');
          label.classList.remove('border-2', 'border-dashed', 'rounded-md');
        }
      });

      // Ocultar overlays de hover (botón "Cambiar").
      const hoverOverlays = clonedDoc.querySelectorAll('.group-hover\\:opacity-100');
      hoverOverlays.forEach((overlay) => {
        if (overlay instanceof HTMLElement) overlay.style.setProperty('display', 'none', 'important');
      });

      const allElements = clonedDoc.querySelectorAll('*');
      allElements.forEach((el) => {
        if (!(el instanceof HTMLElement)) return;

        // Fuente uniforme (Geist no siempre embebe bien en el canvas).
        el.style.setProperty('font-family', 'Arial, sans-serif', 'important');

        // Convertir inputs/textarea a divs para que html2canvas pinte el texto.
        // Centrado: en vez de line-height = altura (que html2canvas alinea arriba), usamos
        // line-height:1 y dejamos que el contenedor flex `items-center` centre el div, igual
        // que hace con los iconos (que sí se centran). Así el texto del input queda centrado.
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          const cs = window.getComputedStyle(el);
          const hasValue = !!el.value;
          const div = clonedDoc.createElement('div');
          div.textContent = hasValue ? el.value : (el.getAttribute('placeholder') || '');

          div.style.fontFamily = 'Arial, sans-serif';
          div.style.fontSize = cs.fontSize;
          div.style.fontWeight = cs.fontWeight;
          div.style.fontStyle = cs.fontStyle;
          div.style.letterSpacing = cs.letterSpacing;
          div.style.textAlign = cs.textAlign;
          div.style.width = cs.width;
          div.style.lineHeight = '1'; // sin leading → html2canvas no lo descuadra
          div.style.padding = '0';
          div.style.margin = cs.margin;
          div.style.whiteSpace = 'nowrap';
          div.style.overflow = 'visible';
          div.style.color = hasValue ? (el.style.color || cs.color) : '#9ca3af';

          el.parentNode?.replaceChild(div, el);
        }
      });
    },
  };
}
