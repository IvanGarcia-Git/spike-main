'use client';

import { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ComparisonPdfPreview from '@/components/comparativas/ComparisonPdfPreview';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { authGetFetch } from '@/helpers/server-fetch.helper';
import { getCookie } from 'cookies-next';
import * as jose from 'jose';

export default function ComparativasPersonalizadaPage() {
  const router = useRouter();
  const previewRef = useRef(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [pdfData, setPdfData] = useState(null);
  const [shouldAutoDownload, setShouldAutoDownload] = useState(false);
  const [colors, setColors] = useState({
    background: '#ffffff',
    primaryText: '#ef4444',
    secondaryText: '#f97316',
  });
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    profileImageUri: '/avatar.png'
  });

  // Load saved colors from localStorage on first client render
  useEffect(() => {
    const savedColors = localStorage.getItem('comparativaColors');
    if (savedColors) {
      try {
        const parsedColors = JSON.parse(savedColors);
        setColors(parsedColors);
      } catch (e) {
        console.error('Error parsing saved colors:', e);
      }
    }
  }, []);

  // Get logged in user data
  useEffect(() => {
    const fetchUserData = async () => {
      const jwtToken = getCookie('factura-token');
      if (jwtToken) {
        try {
          const payload = jose.decodeJwt(jwtToken);

          // Get user profile picture
          const response = await authGetFetch(`users/profile-picture/${payload.userId}`, jwtToken);
          let profileImageUri = '/avatar.png';

          if (response.ok) {
            const data = await response.json();
            profileImageUri = data.profileImageUri || '/avatar.png';
          }

          setUserData({
            name: payload.userName || payload.userEmail?.split('@')[0] || 'Usuario',
            email: payload.userEmail || '',
            profileImageUri: profileImageUri
          });
        } catch (error) {
          console.error('Error obteniendo datos del usuario:', error);
        }
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    const storedData = sessionStorage.getItem('pdfDataForGeneration');
    const autoDownload = sessionStorage.getItem('autoDownloadPDF') === 'true';

    if (storedData) {
      try {
        const data = JSON.parse(storedData);
        setPdfData(data);
        sessionStorage.removeItem('pdfDataForGeneration');

        // If auto download flag is set, activate state
        if (autoDownload) {
          sessionStorage.removeItem('autoDownloadPDF');
          setShouldAutoDownload(true);
        }
      } catch (error) {
        console.error("Failed to parse PDF data from sessionStorage", error);
        sessionStorage.removeItem('pdfDataForGeneration');
        sessionStorage.removeItem('autoDownloadPDF');
      }
    }
  }, []);

  const handleColorChange = (e) => {
    const { name, value } = e.target;
    setColors(prev => {
      const newColors = { ...prev, [name]: value };
      // Save colors to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('comparativaColors', JSON.stringify(newColors));
      }
      return newColors;
    });
  };

  const handleDownloadPdf = async () => {
    const reportContainer = previewRef.current;
    if (!reportContainer) return;

    setIsDownloading(true);

    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pages = reportContainer.querySelectorAll('.pdf-page');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        if (i > 0) {
          pdf.addPage();
        }

        const canvas = await html2canvas(page, {
          scale: 3,
          useCORS: true,
          backgroundColor: colors.background,
          windowWidth: 1920,
          windowHeight: 1080,
          logging: false,
          onclone: (clonedDoc) => {
            // Find all PDF pages in cloned document
            const clonedPages = clonedDoc.querySelectorAll('.pdf-page');
            clonedPages.forEach((clonedPage) => {
              if (clonedPage instanceof HTMLElement) {
                // Apply colors directly to cloned element
                clonedPage.style.backgroundColor = colors.background;
                clonedPage.style.color = colors.primaryText;
              }
            });

            const allElements = clonedDoc.querySelectorAll('*');
            allElements.forEach((el) => {
              if (el instanceof HTMLElement) {
                el.style.setProperty('font-family', 'Arial, sans-serif', 'important');

                // Apply primary text color to all elements that have color
                // Preserve inline styles that include color
                const originalStyle = el.getAttribute('style');
                if (originalStyle && originalStyle.includes('color:')) {
                  // Extract and preserve the color from inline style if it's primaryText
                  const colorMatch = originalStyle.match(/color:\s*([^;]+)/);
                  if (colorMatch) {
                    // If color matches primaryText, apply with important
                    const currentColor = colorMatch[1].trim();
                    if (currentColor === colors.primaryText || currentColor === 'rgb(31, 41, 55)' || currentColor === '#1f2937') {
                      el.style.setProperty('color', colors.primaryText, 'important');
                    } else {
                      el.style.setProperty('color', currentColor, 'important');
                    }
                  }
                } else if (!el.classList.contains('text-white') && !el.classList.contains('text-green-500') && !el.classList.contains('text-rose-500') && !el.classList.contains('text-emerald-500')) {
                  // If no specific color and not an element with fixed color, apply primaryText
                  el.style.setProperty('color', colors.primaryText, 'important');
                }

                // Convert inputs and textareas to divs for better rendering
                if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                  const div = clonedDoc.createElement('div');
                  div.textContent = el.value;
                  div.className = el.className;

                  // Copy computed styles including color
                  const computedStyle = window.getComputedStyle(el);
                  div.style.cssText = computedStyle.cssText;
                  div.style.whiteSpace = 'nowrap';
                  div.style.overflow = 'visible';
                  div.style.width = 'auto';
                  div.style.minWidth = computedStyle.width;

                  // Ensure color is maintained
                  if (el.style.color) {
                    div.style.setProperty('color', el.style.color, 'important');
                  } else if (computedStyle.color) {
                    div.style.setProperty('color', computedStyle.color, 'important');
                  } else {
                    div.style.setProperty('color', colors.primaryText, 'important');
                  }

                  el.parentNode?.replaceChild(div, el);
                }
              }
            });
          }
        });

        const imgData = canvas.toDataURL('image/png');

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      }

      pdf.save('comparativa.pdf');
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  // Effect to handle automatic download
  useEffect(() => {
    if (shouldAutoDownload && pdfData && previewRef.current) {
      // Wait a bit to ensure component is fully rendered
      const timer = setTimeout(async () => {
        await handleDownloadPdf();
        setShouldAutoDownload(false);
        // Return to comparativas page after download
        setTimeout(() => {
          router.push('/comparativas');
        }, 500);
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [shouldAutoDownload, pdfData]);

  return (
    <div className="p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
              Personalizar Comparativa
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Ajusta el estilo y descarga la comparativa en formato PDF.
            </p>
          </div>
          <button
            onClick={handleDownloadPdf}
            disabled={isDownloading}
            className="neumorphic-button flex items-center justify-center px-6 py-3 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDownloading ? (
              <>
                <span className="material-icons-outlined animate-spin mr-2">sync</span>
                Descargando...
              </>
            ) : (
              <>
                <span className="material-icons-outlined mr-2">download</span>
                Descargar en PDF
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Style Options Card */}
          <div className="lg:col-span-1">
            <div className="neumorphic-card p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
                  Opciones de Estilo
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Personaliza la apariencia del PDF.
                </p>
              </div>

              <div className="space-y-5">
                {/* Background Color */}
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="background"
                    className="text-sm font-medium text-slate-700 dark:text-slate-300"
                  >
                    Color de Fondo
                  </label>
                  <div className="relative">
                    <input
                      id="background"
                      name="background"
                      type="color"
                      value={colors.background}
                      onChange={handleColorChange}
                      className="w-14 h-10 rounded-lg cursor-pointer border-0 p-1 neumorphic-card-inset"
                    />
                  </div>
                </div>

                {/* Primary Text Color */}
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="primaryText"
                    className="text-sm font-medium text-slate-700 dark:text-slate-300"
                  >
                    Texto Principal
                  </label>
                  <div className="relative">
                    <input
                      id="primaryText"
                      name="primaryText"
                      type="color"
                      value={colors.primaryText}
                      onChange={handleColorChange}
                      className="w-14 h-10 rounded-lg cursor-pointer border-0 p-1 neumorphic-card-inset"
                    />
                  </div>
                </div>

                {/* Secondary Text Color */}
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="secondaryText"
                    className="text-sm font-medium text-slate-700 dark:text-slate-300"
                  >
                    Texto Secundario
                  </label>
                  <div className="relative">
                    <input
                      id="secondaryText"
                      name="secondaryText"
                      type="color"
                      value={colors.secondaryText}
                      onChange={handleColorChange}
                      className="w-14 h-10 rounded-lg cursor-pointer border-0 p-1 neumorphic-card-inset"
                    />
                  </div>
                </div>
              </div>

              {/* Color Preview */}
              <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  Vista previa de colores
                </p>
                <div className="flex gap-3">
                  <div
                    className="flex-1 h-12 rounded-lg neumorphic-card-inset flex items-center justify-center"
                    style={{ backgroundColor: colors.background }}
                  >
                    <span className="text-xs text-slate-500">Fondo</span>
                  </div>
                  <div
                    className="flex-1 h-12 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: colors.primaryText }}
                  >
                    <span className="text-xs text-white">Principal</span>
                  </div>
                  <div
                    className="flex-1 h-12 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: colors.secondaryText }}
                  >
                    <span className="text-xs text-white">Secundario</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  Acciones rápidas
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const defaultColors = {
                        background: '#ffffff',
                        primaryText: '#ef4444',
                        secondaryText: '#f97316',
                      };
                      setColors(defaultColors);
                      localStorage.setItem('comparativaColors', JSON.stringify(defaultColors));
                    }}
                    className="flex-1 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 neumorphic-button"
                  >
                    Restablecer
                  </button>
                  <button
                    onClick={() => router.push('/comparativas')}
                    className="flex-1 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 neumorphic-button"
                  >
                    Volver
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* PDF Preview */}
          <div className="lg:col-span-2">
            <div className="neumorphic-card p-6">
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
                  Vista Previa
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Así se verá tu comparativa en PDF.
                </p>
              </div>
              <div ref={previewRef} className="neumorphic-card-inset p-4 rounded-lg">
                <ComparisonPdfPreview
                  key={`${colors.background}-${colors.primaryText}-${colors.secondaryText}`}
                  pdfData={pdfData}
                  colors={colors}
                  userData={userData}
                />
              </div>
            </div>
          </div>
        </div>
    </div>
  );
}
