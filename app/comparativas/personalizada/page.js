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

export default function ComparativasPersonalizadaPage() {
  const previewRef = useRef(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [pdfData, setPdfData] = useState(null);
  const [colors, setColors] = useState({
    background: '#e5e7eb', // Corresponds to bg-gray-200
    primaryText: '#1f2937', // Corresponds to text-gray-800
    secondaryText: '#f59e0b', // Corresponds to text-amber-500
  });

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
    setColors(prev => ({ ...prev, [name]: value }));
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
          scale: 2, 
          useCORS: true,
          backgroundColor: null, 
          onclone: (clonedDoc) => {
            const allElements = clonedDoc.querySelectorAll('*');
            allElements.forEach((el) => {
              if (el instanceof HTMLElement) {
                el.style.setProperty('font-family', 'Arial, sans-serif', 'important');
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
            <ComparisonPdfPreview pdfData={pdfData} colors={colors} />
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}