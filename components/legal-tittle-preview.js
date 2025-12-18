import React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import LegalTittleDocument from "./legal-tittle-document";

const LegalTittlePreview = ({ formData, documentType }) => {
    const isMobile = useIsMobile();

    // Escala el documento para que quepa bien en la pantalla
    // A4 = 210mm × 297mm, escalamos para que se vea bien en el contenedor
    const scale = isMobile ? 0.35 : 0.5;

    // Calculamos la altura del contenedor basada en la escala
    // A4 height = 297mm ≈ 1123px at 96dpi
    const scaledHeight = isMobile ? 400 : 600;

    return (
        <div className="legal-preview-wrapper">
            <div
                className="legal-preview-container overflow-auto rounded-lg neumorphic-card-inset"
                style={{
                    height: `${scaledHeight}px`,
                    padding: '16px',
                }}
            >
                <div
                    style={{
                        transform: `scale(${scale})`,
                        transformOrigin: 'top center',
                        width: '210mm',
                        margin: '0 auto',
                    }}
                >
                    <div className="shadow-xl border border-gray-200 rounded">
                        <LegalTittleDocument formData={formData} documentType={documentType} />
                    </div>
                </div>
            </div>

            <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-4">
                <span className="material-icons-outlined text-sm align-middle mr-1">info</span>
                Esta previsualización muestra cómo se verá el documento final en PDF
            </p>
        </div>
    );
};

export default LegalTittlePreview;
