"use client"
import LegalTitleForms from '@/components/legal-tittle-forms';
import React, { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

function GenerarJustoTitulo() {
    const [currentStep, setCurrentStep] = useState(1);

    const [formData, setFormData] = useState({
        relationshipType: '',
        oldOwner: {
            type: '',
            data: {}
        },
        newOwner: {
            type: '',
            data: {}
        },
        signatureDate: '',
        signatureProvince: '',
        serviceAddress: ''
    });

    const [documentType, setDocumentType] = useState("NIF / DNI");

    const cpRegex = /^(0[1-9]|[1-4][0-9]|5[0-2])\d{3}$/;
    const dniRegex = /^[0-9]{8}[A-Z]$/;
    const nieRegex = /^[X|Y|Z]\d{7}[A-Z]$/;

    const cifRegex = /^[ABCDEFGHJKLNPQRSW]\d{7}[0-9A-Z]$/;

    const printableAreaRef = useRef(null);

    const nextStep = (currentOwner) => {

        if (currentStep === 2 || currentStep === 3) {
            if (currentOwner?.type === 'Particular') {
                if (currentOwner?.data?.name === '') {
                    alert(
                        "Por favor, introduce el nombre del titular."
                    );
                    return;
                } else if (documentType === "NIE" && !nieRegex.test(currentOwner?.data?.nationalId)) {
                    alert("Por favor, introduce un NIE válido.");
                    return;
                } else if (documentType === "NIF / DNI" && !dniRegex.test(currentOwner?.data?.nationalId)) {
                    alert("Por favor, introduce un DNI válido.");
                    return;
                } else if (currentOwner?.data?.address === '') {
                    alert(
                        "Por favor, introduce una dirección."
                    );
                    return;
                } else if (!cpRegex.test(currentOwner?.data?.zipcode)) {
                    alert(
                        "Por favor, introduce un código postal válido de España (5 dígitos, entre 01000 y 52999)."
                    );
                    return;
                }  else if (currentOwner?.data?.province === '') {
                    alert(
                        "Por favor, introduce una provincia."
                    );
                    return;
                } else if (currentOwner?.data?.populace === '') {
                    alert(
                        "Por favor, introduce una población."
                    );
                    return;
                } 
            } else {
                if (currentOwner?.data?.companyName === '') {
                    alert(
                        "Por favor, introduce el nombre de la empresa."
                    );
                    return;
                } else if (!cifRegex.test(currentOwner?.data?.cif)) {
                    alert("Por favor, introduce un CIF válido.");
                    return;
                } else if (currentOwner?.data?.fiscalAddress === '') {
                    alert("Por favor, introduce una dirección fiscal.");
                    return;
                }
            }
        }

        if (currentStep === 4) {
            if (formData.signatureDate === '') {
                alert(
                    "Por favor, introduce una fecha de firma."
                );
                return;
            } else if (formData.signatureProvince === '') {
                alert(
                    "Por favor, introduce una provincia donde realizar la firma."
                );
                return;
            } else if (formData.serviceAddress === '') {
                alert(
                    "Por favor, introduce una dirección de suministro."
                );
                return;
            }
        }

        if (currentStep < 5) {
            setCurrentStep(prevStep => prevStep + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(prevStep => prevStep - 1);
        }
    };

    const handleDownloadPdf = async () => {
        const input = printableAreaRef.current;

        if (!input) {
            console.error('El área imprimible no fue encontrada.');
            return;
        }

        try {
            const canvas = await html2canvas(input, {
                scale: 2,
                logging: true,
                useCORS: true,
            });

            const imgData = canvas.toDataURL('image/png');

            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
            });

            const imgWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;


            while (heightLeft > 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            pdf.save('justo-titulo.pdf');

            setCurrentStep(1);

            resetFormData();

        } catch (error) {
            console.error('Error al generar el PDF:', error);
        }
    };

    const resetFormData = () => {
        setFormData({
            relationshipType: '',
            oldOwner: {
                type: '',
                data: {}
            },
            newOwner: {
                type: '',
                data: {}
            },
            signatureDate: '',
            signatureProvince: '',
            serviceAddress: ''
        });
    };

    return (
        <div
            className="flex justify-center items-start bg-background min-h-screen p-5 text-black"
        >
            <div className="w-full max-w-screen-xl bg-foreground rounded-lg p-5">
                <div className="mb-6">
                    <div className="flex justify-center items-center mb-3 space-x-2 w-full">

                        {Array.from({ length: 5 }).map((_, index) => (
                            <div
                                key={index}
                                className={`w-16 h-1.5 rounded-full ${index + 1 <= currentStep ? 'bg-blue-500' : 'bg-gray-300'
                                    }`}
                            ></div>
                        ))}
                    </div>

                    {/* Texto del Paso Actual */}
                    <div className="text-center text-gray-600 text-xs">
                        Paso {currentStep} de 5
                    </div>
                </div>

                <LegalTitleForms formData={formData} setFormData={setFormData} currentStep={currentStep} nextStep={nextStep} documentType={documentType} setDocumentType={setDocumentType} printableAreaRef={printableAreaRef}/>

                {/* Botones de navegación */}
                <div className="mt-6 flex justify-between">
                    {currentStep > 1 && (
                        <button
                            onClick={prevStep}
                            className="px-4 py-2 bg-red-500 font-bold text-white rounded hover:bg-red-600"
                        >
                            Anterior
                        </button>
                    )}

                    {currentStep === 2 && (
                        <button
                            onClick={() => nextStep(formData.oldOwner)}
                            className={'px-4 py-2 rounded bg-yellow-400 font-bold text-white hover:bg-yellow-500'}
                        >
                            Siguiente
                        </button>
                    )}

                    {currentStep === 3 && (
                        <button
                            onClick={() => nextStep(formData.newOwner)}
                            className={'px-4 py-2 rounded bg-yellow-400 font-bold text-white hover:bg-yellow-500'}
                        >
                            Siguiente
                        </button>
                    )}

                    {currentStep === 4 && (
                        <button
                            onClick={nextStep}
                            className={'px-4 py-2 rounded bg-yellow-400 font-bold text-white hover:bg-yellow-500'}
                        >
                            Previsualizacion
                        </button>
                    )}

                    {currentStep === 5 && (
                        <button
                            onClick={handleDownloadPdf}
                            className="px-4 py-2 bg-orange-400 font-bold rounded text-white hover:bg-orange-500"
                        >
                            Descargar PDF
                        </button>
                    )}

                </div>
            </div>
        </div>
    )
}

export default GenerarJustoTitulo