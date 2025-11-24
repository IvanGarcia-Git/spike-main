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
        <div className="min-h-screen p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 flex items-center">
                        <span className="material-icons-outlined text-primary mr-3">description</span>
                        Generar Justo Título
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-2">
                        Crea documentos legales de transferencia de titularidad
                    </p>
                </div>

                <div className="neumorphic-card p-8 rounded-xl">
                    {/* Progress Steps */}
                    <div className="mb-8">
                        <div className="flex justify-between items-center mb-4">
                            {Array.from({ length: 5 }).map((_, index) => (
                                <div key={index} className="flex items-center flex-1">
                                    <div className="flex flex-col items-center flex-1">
                                        <div
                                            className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                                                index + 1 <= currentStep
                                                    ? 'bg-primary text-white shadow-neumorphic-light dark:shadow-neumorphic-dark'
                                                    : 'neumorphic-card-inset text-slate-400 dark:text-slate-600'
                                            }`}
                                        >
                                            {index + 1}
                                        </div>
                                        <span className={`text-xs mt-2 font-medium ${
                                            index + 1 <= currentStep
                                                ? 'text-primary'
                                                : 'text-slate-400 dark:text-slate-600'
                                        }`}>
                                            Paso {index + 1}
                                        </span>
                                    </div>
                                    {index < 4 && (
                                        <div className={`h-1 flex-1 mx-2 rounded-full transition-all ${
                                            index + 1 < currentStep
                                                ? 'bg-primary'
                                                : 'bg-slate-200 dark:bg-slate-700'
                                        }`}></div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="text-center">
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Paso <span className="font-bold text-primary">{currentStep}</span> de <span className="font-bold">5</span>
                            </p>
                        </div>
                    </div>

                    {/* Form Content */}
                    <LegalTitleForms
                        formData={formData}
                        setFormData={setFormData}
                        currentStep={currentStep}
                        nextStep={nextStep}
                        documentType={documentType}
                        setDocumentType={setDocumentType}
                        printableAreaRef={printableAreaRef}
                    />

                    {/* Navigation Buttons */}
                    <div className="mt-8 flex justify-between items-center gap-4">
                        {currentStep > 1 && (
                            <button
                                onClick={prevStep}
                                className="neumorphic-button px-6 py-3 rounded-lg font-semibold text-slate-700 dark:text-slate-300 hover:shadow-neumorphic-inset-light dark:hover:shadow-neumorphic-inset-dark transition-all flex items-center"
                            >
                                <span className="material-icons-outlined mr-2">arrow_back</span>
                                Anterior
                            </button>
                        )}

                        <div className="flex-1"></div>

                        {currentStep === 2 && (
                            <button
                                onClick={() => nextStep(formData.oldOwner)}
                                className="neumorphic-button px-6 py-3 rounded-lg bg-primary text-white font-semibold hover:shadow-neumorphic-inset-light dark:hover:shadow-neumorphic-inset-dark transition-all flex items-center"
                            >
                                Siguiente
                                <span className="material-icons-outlined ml-2">arrow_forward</span>
                            </button>
                        )}

                        {currentStep === 3 && (
                            <button
                                onClick={() => nextStep(formData.newOwner)}
                                className="neumorphic-button px-6 py-3 rounded-lg bg-primary text-white font-semibold hover:shadow-neumorphic-inset-light dark:hover:shadow-neumorphic-inset-dark transition-all flex items-center"
                            >
                                Siguiente
                                <span className="material-icons-outlined ml-2">arrow_forward</span>
                            </button>
                        )}

                        {currentStep === 4 && (
                            <button
                                onClick={nextStep}
                                className="neumorphic-button px-6 py-3 rounded-lg bg-primary text-white font-semibold hover:shadow-neumorphic-inset-light dark:hover:shadow-neumorphic-inset-dark transition-all flex items-center"
                            >
                                <span className="material-icons-outlined mr-2">visibility</span>
                                Previsualización
                            </button>
                        )}

                        {currentStep === 5 && (
                            <button
                                onClick={handleDownloadPdf}
                                className="neumorphic-button px-6 py-3 rounded-lg bg-green-600 text-white font-semibold hover:shadow-neumorphic-inset-light dark:hover:shadow-neumorphic-inset-dark transition-all flex items-center"
                            >
                                <span className="material-icons-outlined mr-2">download</span>
                                Descargar PDF
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default GenerarJustoTitulo
