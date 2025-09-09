"use client";

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import Image from "next/image";
import React, { useEffect } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface ContractPreviewProps {
  content: string;
  setContent: (content: string) => void;
  focusedField: string | null;
  companyLogo: string | null;
}

export function ContractPreview({ content, setContent, focusedField, companyLogo }: ContractPreviewProps) {
  const handleDownloadPDF = async () => {
    // Create a temporary div with the contract content for PDF generation
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.top = '0';
    tempDiv.style.left = '0';
    tempDiv.style.width = '210mm';
    tempDiv.style.background = 'white';
    tempDiv.style.color = 'black';
    tempDiv.style.padding = '20px';
    tempDiv.style.fontFamily = 'Arial, sans-serif';
    tempDiv.style.fontSize = '14px';
    tempDiv.style.lineHeight = '1.6';

    // Add company logo if exists
    if (companyLogo) {
      const logoDiv = document.createElement('div');
      logoDiv.style.textAlign = 'center';
      logoDiv.style.marginBottom = '30px';
      
      const logoImg = document.createElement('img');
      logoImg.src = companyLogo;
      logoImg.style.maxWidth = '150px';
      logoImg.style.maxHeight = '75px';
      logoDiv.appendChild(logoImg);
      tempDiv.appendChild(logoDiv);
    }

    // Add contract content
    const contentDiv = document.createElement('div');
    contentDiv.style.whiteSpace = 'pre-wrap';
    contentDiv.textContent = plainTextContentForPrinting;
    tempDiv.appendChild(contentDiv);

    // Append to body temporarily
    document.body.appendChild(tempDiv);

    try {
      // Wait for images to load
      await new Promise(resolve => setTimeout(resolve, 500));

      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      
      // Create PDF with A4 dimensions
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      
      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if content is longer
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Generate filename with current date
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD format
      const filename = `contrato-${dateStr}.pdf`;

      pdf.save(filename);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error al generar el PDF. Por favor, inténtalo de nuevo.');
    } finally {
      // Remove temporary element
      document.body.removeChild(tempDiv);
    }
  };

  const previewRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (previewRef.current) {
      // Primero, elimina el resaltado de todos los campos
      previewRef.current.querySelectorAll('span[data-field-id]').forEach(el => {
        el.classList.remove('highlight');
      });

      // Luego, añade el resaltado al campo enfocado
      if (focusedField) {
        previewRef.current.querySelectorAll(`span[data-field-id="${focusedField}"]`).forEach(el => {
          el.classList.add('highlight');
        });
      }
    }
  }, [focusedField, content]); // Re-run when focusedField or content changes
  
  // Para la vista de impresión, eliminamos los spans y reemplazamos los marcadores de posición vacíos.
  const plainTextContentForPrinting = content
    .replace(/<span data-field-id=".*?">(.*?)<\/span>/g, '$1') // Extrae el texto del span
    .replace(/\[(.*?)\]/g, '________________'); // Reemplaza los placeholders vacíos `[field]` con una línea

  return (
    <Card id="contract-preview" className="printable-content">
      <CardHeader className="flex flex-row items-center justify-between no-print">
        <CardTitle className="font-headline">Contrato</CardTitle>
        <Button onClick={handleDownloadPDF} variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Descargar PDF
        </Button>
      </CardHeader>
      <CardContent>
        {companyLogo && (
          <div className="mb-8 flex justify-center print:justify-start">
            <Image src={companyLogo} alt="Logo de la empresa" width={150} height={75} className="object-contain" data-ai-hint="company logo" />
          </div>
        )}
        <div className="prose prose-sm max-w-none print:prose-base">
          <pre 
            ref={previewRef}
            className="whitespace-pre-wrap font-body text-sm bg-background p-4 rounded-md border"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
