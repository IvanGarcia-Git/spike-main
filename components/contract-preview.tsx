"use client";

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import Image from "next/image";
import React, { useEffect } from "react";

interface ContractPreviewProps {
  content: string;
  setContent: (content: string) => void;
  focusedField: string | null;
  companyLogo: string | null;
}

export function ContractPreview({ content, setContent, focusedField, companyLogo }: ContractPreviewProps) {
  const handlePrint = () => {
    window.print();
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
        <Button onClick={handlePrint} variant="outline" size="sm">
          <Printer className="mr-2 h-4 w-4" />
          Guardar como PDF
        </Button>
      </CardHeader>
      <CardContent>
        {companyLogo && (
          <div className="mb-8 flex justify-center print:justify-start">
            <Image src={companyLogo} alt="Logo de la empresa" width={150} height={75} className="object-contain" data-ai-hint="company logo" />
          </div>
        )}
        <div className="prose prose-sm max-w-none print:prose-base">
          {/* Vista para la pantalla */}
          <pre 
            ref={previewRef}
            className="whitespace-pre-wrap font-body text-sm bg-background p-4 rounded-md border print:hidden"
            dangerouslySetInnerHTML={{ __html: content }}
          />
           {/* Vista para impresión */}
           <div className="hidden print:block">
              <pre className="whitespace-pre-wrap font-body text-sm">{plainTextContentForPrinting}</pre>
           </div>
        </div>
      </CardContent>
    </Card>
  );
}
