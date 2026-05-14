"use client";

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import Image from "next/image";
import React, { useEffect } from "react";
import jsPDF from "jspdf";

interface ContractPreviewProps {
  content: string;
  setContent: (content: string) => void;
  focusedField: string | null;
  companyLogo: string | null;
}

// Carga la imagen como data URL y devuelve también sus dimensiones naturales,
// necesarias para preservar el aspect ratio del logo dentro del PDF.
const loadImageAsDataUrl = (
  src: string
): Promise<{ dataUrl: string; width: number; height: number }> =>
  new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }
      ctx.drawImage(img, 0, 0);
      resolve({
        dataUrl: canvas.toDataURL("image/png"),
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });

export function ContractPreview({ content, setContent, focusedField, companyLogo }: ContractPreviewProps) {
  const handleDownloadPDF = async () => {
    try {
      // PDF A4 vertical, milímetros, con compresión activada para tamaños mínimos.
      const pdf = new jsPDF({
        orientation: "p",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      const pageWidth = pdf.internal.pageSize.getWidth(); // 210 mm
      const pageHeight = pdf.internal.pageSize.getHeight(); // 297 mm
      const marginX = 20; // 2 cm laterales
      const marginTop = 25; // 2,5 cm superior
      const marginBottom = 25; // 2,5 cm inferior
      const contentWidth = pageWidth - marginX * 2;
      const fontSize = 11;
      const lineHeight = 5; // mm aprox para fontSize 11

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(fontSize);

      let cursorY = marginTop;

      // Logo opcional centrado, manteniendo aspect ratio.
      if (companyLogo) {
        try {
          const { dataUrl, width, height } = await loadImageAsDataUrl(companyLogo);
          const maxLogoWidthMm = 40;
          const maxLogoHeightMm = 20;
          const ratio = width / height || 1;
          let logoWidth = maxLogoWidthMm;
          let logoHeight = logoWidth / ratio;
          if (logoHeight > maxLogoHeightMm) {
            logoHeight = maxLogoHeightMm;
            logoWidth = logoHeight * ratio;
          }
          const logoX = (pageWidth - logoWidth) / 2;
          pdf.addImage(dataUrl, "PNG", logoX, cursorY, logoWidth, logoHeight, undefined, "FAST");
          cursorY += logoHeight + 8;
        } catch (logoError) {
          console.warn("No se pudo añadir el logo al PDF:", logoError);
        }
      }

      // Trocea el texto en líneas que respetan el ancho útil y la paginación.
      const paragraphs = plainTextContentForPrinting.split("\n");

      for (const paragraph of paragraphs) {
        if (paragraph.trim() === "") {
          cursorY += lineHeight;
          if (cursorY > pageHeight - marginBottom) {
            pdf.addPage();
            cursorY = marginTop;
          }
          continue;
        }

        const wrappedLines: string[] = pdf.splitTextToSize(paragraph, contentWidth);

        for (const line of wrappedLines) {
          if (cursorY > pageHeight - marginBottom) {
            pdf.addPage();
            cursorY = marginTop;
          }
          pdf.text(line, marginX, cursorY);
          cursorY += lineHeight;
        }
      }

      const now = new Date();
      const dateStr = now.toISOString().split("T")[0];
      pdf.save(`contrato-${dateStr}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Error al generar el PDF. Por favor, inténtalo de nuevo.");
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
