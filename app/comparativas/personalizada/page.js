'use client';

import { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Loader2 } from 'lucide-react';
import ComparisonPdfPreview from '@/components/comparativas/ComparisonPdfPreview';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import ComparativasHeader from '@/components/comparativas/Header';
import { authGetFetch } from '@/helpers/server-fetch.helper';
import { getCookie } from 'cookies-next';
import * as jose from 'jose';

export default function ComparativasPersonalizadaPage() {
  const previewRef = useRef(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [pdfData, setPdfData] = useState(null);
  const [colors, setColors] = useState({
    background: '#ffffff', // White background
    primaryText: '#ef4444', // Red text (matches the input shown)
    secondaryText: '#f97316', // Orange text
  });
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    profileImageUri: '/avatar.png'
  });

  // Cargar colores guardados del localStorage en el primer render del cliente
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

  // Obtener datos del usuario logueado
  useEffect(() => {
    const fetchUserData = async () => {
      const jwtToken = getCookie('factura-token');
      if (jwtToken) {
        try {
          const payload = jose.decodeJwt(jwtToken);
          
          // Obtener imagen de perfil del usuario
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
    if (storedData) {
      try {
        const data = JSON.parse(storedData);
        setPdfData(data);
        sessionStorage.removeItem('pdfDataForGeneration');
      } catch (error) {
        console.error("Failed to parse PDF data from sessionStorage", error);
        sessionStorage.removeItem('pdfDataForGeneration');
      }
    }
  }, []);

  const handleColorChange = (e) => {
    const { name, value } = e.target;
    setColors(prev => {
      const newColors = { ...prev, [name]: value };
      // Guardar colores en localStorage
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
            // Buscar todas las páginas PDF en el documento clonado
            const clonedPages = clonedDoc.querySelectorAll('.pdf-page');
            clonedPages.forEach((clonedPage) => {
              if (clonedPage instanceof HTMLElement) {
                // Aplicar colores directamente al elemento clonado
                clonedPage.style.backgroundColor = colors.background;
                clonedPage.style.color = colors.primaryText;
              }
            });
            
            const allElements = clonedDoc.querySelectorAll('*');
            allElements.forEach((el) => {
              if (el instanceof HTMLElement) {
                el.style.setProperty('font-family', 'Arial, sans-serif', 'important');
                
                // Aplicar color de texto principal a todos los elementos que tienen color
                // Preservar estilos inline que incluyan color
                const originalStyle = el.getAttribute('style');
                if (originalStyle && originalStyle.includes('color:')) {
                  // Extraer y preservar el color del estilo inline si es el primaryText
                  const colorMatch = originalStyle.match(/color:\s*([^;]+)/);
                  if (colorMatch) {
                    // Si el color coincide con primaryText, aplicarlo con important
                    const currentColor = colorMatch[1].trim();
                    if (currentColor === colors.primaryText || currentColor === 'rgb(31, 41, 55)' || currentColor === '#1f2937') {
                      el.style.setProperty('color', colors.primaryText, 'important');
                    } else {
                      el.style.setProperty('color', currentColor, 'important');
                    }
                  }
                } else if (!el.classList.contains('text-white') && !el.classList.contains('text-green-500') && !el.classList.contains('text-rose-500') && !el.classList.contains('text-emerald-500')) {
                  // Si no tiene color específico y no es un elemento con color fijo, aplicar primaryText
                  el.style.setProperty('color', colors.primaryText, 'important');
                }
                
                // Convertir inputs y textareas a divs para mejor renderizado
                if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                  const div = clonedDoc.createElement('div');
                  div.textContent = el.value;
                  div.className = el.className;
                  
                  // Copiar estilos computados incluyendo el color
                  const computedStyle = window.getComputedStyle(el);
                  div.style.cssText = computedStyle.cssText;
                  div.style.whiteSpace = 'nowrap';
                  div.style.overflow = 'visible';
                  div.style.width = 'auto';
                  div.style.minWidth = computedStyle.width;
                  
                  // Asegurar que el color se mantenga
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

  return (
    <div>
      <ComparativasHeader />
      <div className="container mx-auto p-4 md:p-8">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold">Personalizar Comparativa</h1>
          <p className="text-gray-600">
            Ajusta el estilo y descarga la comparativa en formato PDF.
          </p>
        </div>
        <Button onClick={handleDownloadPdf} disabled={isDownloading}>
          {isDownloading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          {isDownloading ? 'Descargando...' : 'Descargar en PDF'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Opciones de Estilo</CardTitle>
              <CardDescription>
                Personaliza la apariencia del PDF.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="background">Color de Fondo</Label>
                <Input
                  id="background"
                  name="background"
                  type="color"
                  value={colors.background}
                  onChange={handleColorChange}
                  className="p-0 h-8 w-14 border-none rounded-md cursor-pointer"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="primaryText">Texto Principal</Label>
                <Input
                  id="primaryText"
                  name="primaryText"
                  type="color"
                  value={colors.primaryText}
                  onChange={handleColorChange}
                  className="p-0 h-8 w-14 border-none rounded-md cursor-pointer"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="secondaryText">Texto Secundario</Label>
                <Input
                  id="secondaryText"
                  name="secondaryText"
                  type="color"
                  value={colors.secondaryText}
                  onChange={handleColorChange}
                  className="p-0 h-8 w-14 border-none rounded-md cursor-pointer"
                />
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-2">
          <div ref={previewRef}>
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