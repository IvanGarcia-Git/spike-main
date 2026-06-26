'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Phone } from 'lucide-react';
import type { PdfData, CompanyLightTariff, CompanyGasTariff } from '@/lib/types';
import {
  calculateCurrentLightBillBreakdown,
  calculateCurrentGasBillBreakdown,
  buildLightBreakdownRows,
  buildGasBreakdownRows,
  type BreakdownRow,
} from '@/lib/comparativa-breakdown';

const formatCurrency = (value: number | undefined | null) => {
  if (value === undefined || value === null || isNaN(value)) {
    return '0,00€';
  }
  return `${value.toFixed(2).replace('.', ',')}€`;
};


const getContrastColor = (hexcolor: string): 'black' | 'white' => {
  if (!hexcolor) return 'black';
  const hex = hexcolor.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? 'black' : 'white';
};

interface ComparisonPdfPreviewProps {
  pdfData: PdfData | null;
  colors: {
    background: string;
    primaryText: string;
    secondaryText: string;
  };
  userData?: {
    name: string;
    email: string;
    profileImageUri: string;
  };
}

/** Lista de desglose para el PDF: concepto + importe y, debajo, la fórmula (estilo factura).
 *  Usa estilos inline (no clases de Tailwind) para que html2canvas reproduzca exactamente
 *  los mismos colores que la vista previa al descargar. */
const PdfBreakdownList = ({ rows }: { rows: BreakdownRow[] }) => (
    <div>
        {rows.map((row, i) => (
            <div
                key={i}
                style={{ borderBottom: '1px dashed #e5e7eb', paddingTop: 3, paddingBottom: 3 }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ fontSize: 10, fontWeight: 500, color: '#374151' }}>{row.label}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap', color: row.isCredit ? '#059669' : '#111827' }}>
                        {formatCurrency(row.value)}
                    </span>
                </div>
                {row.formula && (
                    <p style={{ margin: 0, marginTop: 1, fontSize: 8, fontStyle: 'italic', lineHeight: 1.25, color: '#9ca3af' }}>
                        {row.formula}
                    </p>
                )}
            </div>
        ))}
    </div>
);


export default function ComparisonPdfPreview({ pdfData, colors, userData }: ComparisonPdfPreviewProps) {
    // Logos de las compañías comparadas (portada). Fijos, desde Recursos del proyecto.
    const COMPANY_LOGOS = [
        { src: '/images/comparativa/octopus.png', alt: 'Octopus Energy' },
        { src: '/images/comparativa/endesa.png', alt: 'Endesa' },
        { src: '/images/comparativa/naturgy.png', alt: 'Naturgy' },
        { src: '/images/comparativa/repsol.png', alt: 'Repsol' },
    ];
    const [headerLine1, setHeaderLine1] = useState('Comparado entre');
    const [headerLine2, setHeaderLine2] = useState('+ 60 compañías');

    // Load saved header texts from localStorage on first render
    useEffect(() => {
        const savedHeader1 = localStorage.getItem('comparativaHeader1');
        const savedHeader2 = localStorage.getItem('comparativaHeader2');
        if (savedHeader1) setHeaderLine1(savedHeader1);
        if (savedHeader2) setHeaderLine2(savedHeader2);
    }, []);

    // --- Página 2 (rediseño "Luzia"): datos del suministro editables (no vienen en pdfData) ---
    const [supplyData, setSupplyData] = useState({ cups: '', comercializadora: '', tarifa: '', periodo: '' });
    const [contactPhone, setContactPhone] = useState('');

    // El teléfono de contacto es de la agencia → se recuerda entre comparativas.
    useEffect(() => {
        const savedPhone = localStorage.getItem('comparativaPhone');
        if (savedPhone) setContactPhone(savedPhone);
    }, []);

    // Pre-rellena los datos del suministro con lo que viene de la factura (OCR) / wizard:
    // CUPS, comercializadora actual, tarifa y período (nº de días). El asesor puede
    // corregir cualquiera de ellos; por eso solo se rellenan los que estén vacíos.
    useEffect(() => {
        if (!pdfData) return;
        const tarifaReal = pdfData.tariffType || pdfData.bestTariff?.tariff?.tariffType || '';
        const periodoReal = pdfData.numDias ? `${pdfData.numDias} días` : '';
        setSupplyData(prev => ({
            cups: prev.cups || pdfData.cups || '',
            comercializadora: prev.comercializadora || pdfData.comercializadora || '',
            tarifa: prev.tarifa || tarifaReal,
            periodo: prev.periodo || periodoReal,
        }));
    }, [pdfData]);

    const handleSupplyChange = (field: 'cups' | 'comercializadora' | 'tarifa' | 'periodo', value: string) =>
        setSupplyData(prev => ({ ...prev, [field]: value }));
    const handlePhoneChange = (value: string) => {
        setContactPhone(value);
        localStorage.setItem('comparativaPhone', value);
    };

    const showCurrentBill = pdfData?.showCurrentBill ?? true;
    const annualSaving = pdfData?.annualSaving || 0;
    const monthlySaving = pdfData?.monthlySaving || 0;
    const bestCompanyName = pdfData?.bestTariff?.tariff?.companyName?.toUpperCase() ?? "MEJOR";

    // ---------------------------------------------------------------------------
    // Página 2 — diseño "Luzia": datos de cabecera (consumo, potencia, importe).
    // ---------------------------------------------------------------------------
    const isGas = pdfData?.comparisonType === 'gas';
    const potenciasArr = pdfData?.potencias || [];
    const consumoTotal = isGas ? (pdfData?.energia || 0) : (pdfData?.energias || []).reduce((a, b) => a + (b || 0), 0);
    const importeFactura = pdfData?.currentBillAmount || 0;

    // Desglose de la comparativa: reutiliza EXACTAMENTE la misma lógica que las
    // tarjetas "FACTURA ACTUAL" y "MEJOR ALTERNATIVA" de la página de resultados
    // (concepto + importe + fórmula), vía el módulo compartido lib/comparativa-breakdown.
    const bestTariffObj = pdfData?.bestTariff?.tariff;

    // Objeto tipo `formData` que esperan los builders, construido desde pdfData.
    const breakdownFormData = {
        potencias: pdfData?.potencias ?? [],
        energias: pdfData?.energias ?? [],
        numDias: pdfData?.numDias ?? 0,
        excedentes: pdfData?.excedentes ?? 0,
        solarPanelActive: (pdfData?.excedentes ?? 0) > 0,
        energia: pdfData?.energia ?? 0,
        clientPowerPrices: pdfData?.clientPrices?.power,
        clientEnergyPrices: pdfData?.clientPrices?.energy,
        clientSurplusPrice: pdfData?.clientPrices?.surplus,
        clientFixedPrice: pdfData?.clientPrices?.fixed,
        clientGasEnergyPrice: pdfData?.clientPrices?.variable,
        clientMaintenanceCost: pdfData?.clientPrices?.maintenance,
    };
    const regulated = pdfData?.regulatedCosts ?? { alquiler: 0, iva: 0 };

    // FACTURA ACTUAL: desglose con los precios unitarios del cliente (igual que en resultados).
    // Si no hay precios unitarios, el builder devuelve null → se muestra el aviso "sin datos".
    const currentBreakdown = pdfData
        ? (isGas
            ? calculateCurrentGasBillBreakdown(breakdownFormData, regulated)
            : calculateCurrentLightBillBreakdown(breakdownFormData, regulated))
        : null;
    const currentRows: BreakdownRow[] = currentBreakdown
        ? (isGas
            ? buildGasBreakdownRows(currentBreakdown, breakdownFormData, regulated, {
                fixedPrice: pdfData?.clientPrices?.fixed,
                energyPrice: pdfData?.clientPrices?.variable,
            })
            : buildLightBreakdownRows(currentBreakdown, breakdownFormData, regulated, {
                powerPrices: pdfData?.clientPrices?.power,
                energyPrices: pdfData?.clientPrices?.energy,
                surplusPrice: pdfData?.clientPrices?.surplus,
            }))
        : [];

    // MEJOR ALTERNATIVA: desglose de la mejor tarifa (igual que en resultados).
    const bestBreakdown = pdfData?.bestTariff?.breakdown;
    const bestRows: BreakdownRow[] = bestBreakdown
        ? (isGas
            ? buildGasBreakdownRows(bestBreakdown, breakdownFormData, regulated, {
                fixedPrice: (bestTariffObj as CompanyGasTariff)?.fixedPrice,
                energyPrice: (bestTariffObj as CompanyGasTariff)?.energyPrice,
            })
            : buildLightBreakdownRows(bestBreakdown, breakdownFormData, regulated, {
                powerPrices: (bestTariffObj as CompanyLightTariff)?.powerPrices,
                energyPrices: (bestTariffObj as CompanyLightTariff)?.energyPrices,
                surplusPrice: (bestTariffObj as CompanyLightTariff)?.surplusPrice,
            }))
        : [];

    const newPowerPrices: number[] = !isGas ? (((bestTariffObj as CompanyLightTariff)?.powerPrices) || []) : [];
    const newEnergyPrices: number[] = !isGas ? (((bestTariffObj as CompanyLightTariff)?.energyPrices) || []) : [];
    const newGasFixed = isGas ? ((bestTariffObj as CompanyGasTariff)?.fixedPrice ?? null) : null;
    const newGasEnergy = isGas ? ((bestTariffObj as CompanyGasTariff)?.energyPrice ?? null) : null;
    const bestTariffName = bestTariffObj?.tariffName || '';
    const bestCompanyDisplay = bestTariffObj?.companyName || bestCompanyName;


    return (
        <div className="space-y-8">
            {/* Page 1: Cover — diseño locomparo (fondo gris) */}
            {/* El fondo gris va en un wrapper interno: el onclone de la página de
                descarga fuerza el backgroundColor de cada `.pdf-page` a colors.background
                (blanco por defecto), así que el gris debe vivir en un hijo a pantalla completa. */}
            <div
                className="pdf-page aspect-[210/297] shadow-lg rounded-lg font-sans"
                style={{ backgroundColor: '#757575' }}
            >
                <div className="w-full h-full rounded-lg p-10 flex flex-col" style={{ backgroundColor: '#757575' }}>
                    {/* Cabecera: texto editable + logos comparados */}
                    <header className="flex items-start justify-between gap-4">
                        <div>
                            <input
                                type="text"
                                value={headerLine1}
                                onChange={(e) => {
                                    setHeaderLine1(e.target.value);
                                    localStorage.setItem('comparativaHeader1', e.target.value);
                                }}
                                className="font-bold text-sm bg-transparent border-none p-0 m-0 w-full focus:ring-1 focus:ring-emerald-500 rounded-sm"
                                style={{ color: '#ffffff' }}
                            />
                            <input
                                type="text"
                                value={headerLine2}
                                onChange={(e) => {
                                    setHeaderLine2(e.target.value);
                                    localStorage.setItem('comparativaHeader2', e.target.value);
                                }}
                                className="text-lg font-extrabold bg-transparent border-none p-0 m-0 w-full focus:ring-1 focus:ring-emerald-500 rounded-sm"
                                style={{ color: '#ffffff' }}
                            />
                        </div>
                        <div className="flex items-center gap-3 flex-wrap justify-end max-w-[55%]">
                            {COMPANY_LOGOS.map((logo) => (
                                <Image
                                    key={logo.src}
                                    data-ai-hint="company logo"
                                    src={logo.src}
                                    alt={logo.alt}
                                    width={120}
                                    height={40}
                                    className="h-5 w-auto max-w-[80px] object-contain"
                                    unoptimized
                                    priority
                                />
                            ))}
                        </div>
                    </header>

                    {/* Imagen central: "COMPARATIVA De Ahorro" */}
                    <div className="flex-grow flex flex-col items-center justify-center text-center">
                        <Image
                            data-ai-hint="comparativa de ahorro"
                            src="/images/comparativa/comparativa-ahorro.png"
                            alt="Comparativa de Ahorro"
                            width={1400}
                            height={385}
                            className="w-4/5 h-auto object-contain"
                            unoptimized
                            priority
                        />
                    </div>

                    {/* Hero: saludo + ahorro anual destacado */}
                    <div className="rounded-3xl px-8 py-8 text-center" style={{ backgroundColor: '#41ab7b' }}>
                        <h1 className="text-4xl font-extrabold" style={{ color: '#ffffff' }}>{pdfData?.clientName || 'Cliente'},</h1>
                        <h2 className="text-2xl font-medium" style={{ color: '#ffffff', opacity: 0.95 }}>aquí tienes tu comparativa</h2>
                        {/* Contenedor de bloque (flex) en vez de inline-block: html2canvas
                            colapsa a veces el ancho de un inline-block con letter-spacing
                            (tracking-widest) a 0 y oculta su contenido → el importe del ahorro
                            no aparecía en la portada del PDF descargado. */}
                        <div className="mt-5 flex justify-center">
                            <div className="rounded-2xl px-8 py-3 text-center" style={{ backgroundColor: '#46c88c' }}>
                                <p className="text-[11px] font-semibold tracking-widest" style={{ color: '#ffffff' }}>AHORRO ANUAL ESTIMADO</p>
                                <p className="text-4xl font-extrabold" style={{ color: '#ffffff' }}>{formatCurrency(annualSaving)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Logo footer: locomparo.com (versión blanca para fondo gris) */}
                    <div className="flex justify-center mt-6">
                        <Image
                            data-ai-hint="company logo"
                            src="/images/comparativa/locomparo-blanco.png"
                            alt="locomparo.com"
                            width={1000}
                            height={174}
                            className="h-9 w-auto object-contain"
                            unoptimized
                            priority
                        />
                    </div>
                </div>
            </div>

            {/* Page 2: Content — diseño "Luzia" (reciclado del chatbot Luzia) */}
            <div
                className="pdf-page aspect-[210/297] p-6 font-sans rounded-lg flex flex-col gap-3 pdf-content-page"
                style={{ backgroundColor: '#ffffff' }}
            >
                {/* Cabecera: Datos del suministro + Consumo y potencia */}
                <div className={`grid gap-3 ${showCurrentBill ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    {/* Datos del suministro (editable) */}
                    <div className="rounded-lg overflow-hidden shadow-sm" style={{ border: '1px solid #e5e7eb' }}>
                        <div className="px-3 py-2 text-white text-[11px] font-bold tracking-wide" style={{ backgroundColor: '#0f766e' }}>
                            DATOS DEL SUMINISTRO
                        </div>
                        <div className="p-3 space-y-1">
                            {([
                                ['CUPS', 'cups', 'ES00...'],
                                ['Comercializadora', 'comercializadora', 'Compañía actual'],
                                ['Tarifa', 'tarifa', '2.0TD'],
                                ['Período', 'periodo', 'dd/mm – dd/mm'],
                            ] as [string, 'cups' | 'comercializadora' | 'tarifa' | 'periodo', string][]).map(([label, field, ph]) => (
                                <div key={field} className="flex justify-between items-center gap-2">
                                    <span className="text-[10px] font-medium flex-shrink-0" style={{ color: '#6b7280' }}>{label}</span>
                                    <input
                                        type="text"
                                        value={supplyData[field]}
                                        placeholder={ph}
                                        onChange={(e) => handleSupplyChange(field, e.target.value)}
                                        className="text-[10px] font-semibold text-right bg-transparent border-none p-0 m-0 w-32 focus:ring-1 focus:ring-emerald-500 focus:bg-white rounded-sm"
                                        style={{ color: '#111827' }}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Consumo y potencia (calculado) */}
                    <div className="rounded-lg overflow-hidden shadow-sm" style={{ border: '1px solid #e5e7eb' }}>
                        <div className="px-3 py-2 text-white text-[11px] font-bold tracking-wide" style={{ backgroundColor: '#047857' }}>
                            CONSUMO Y POTENCIA
                        </div>
                        <div className="p-3 space-y-1">
                            {!isGas && potenciasArr.map((p, i) => (
                                <div key={i} className="flex justify-between items-center">
                                    <span className="text-[10px] font-medium" style={{ color: '#6b7280' }}>Potencia P{i + 1}</span>
                                    <span className="text-[10px] font-semibold" style={{ color: '#111827' }}>{p} kW</span>
                                </div>
                            ))}
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-medium" style={{ color: '#6b7280' }}>Consumo total</span>
                                <span className="text-[10px] font-semibold" style={{ color: '#111827' }}>{consumoTotal} kWh</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-medium" style={{ color: '#6b7280' }}>Importe factura</span>
                                <span className="text-[10px] font-semibold" style={{ color: '#111827' }}>{formatCurrency(importeFactura)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Banner: Ahorro anual estimado + acciones */}
                <div className="rounded-xl px-5 py-4 flex items-center justify-between" style={{ backgroundColor: '#065f46' }}>
                    <div>
                        <p className="text-white text-[10px] font-semibold tracking-widest" style={{ opacity: 0.9 }}>AHORRO ANUAL ESTIMADO</p>
                        <p className="text-white text-[11px] font-medium" style={{ opacity: 0.85 }}>{bestCompanyDisplay}</p>
                        <p className="text-white text-3xl font-extrabold leading-tight">{formatCurrency(annualSaving)}</p>
                    </div>
                    <div className="flex flex-col gap-2 items-stretch">
                        <div className="flex items-center gap-1.5 bg-white rounded-full px-3 py-1.5">
                            <Phone className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#065f46' }} />
                            <input
                                type="text"
                                value={contactPhone}
                                placeholder="Llamar"
                                onChange={(e) => handlePhoneChange(e.target.value)}
                                className="text-[11px] font-bold bg-transparent border-none p-0 m-0 w-24 focus:ring-1 focus:ring-emerald-500 rounded-sm"
                                style={{ color: '#065f46' }}
                            />
                        </div>
                        <div className="rounded-full px-4 py-1.5 text-center text-white text-[11px] font-semibold" style={{ border: '1px solid rgba(255,255,255,0.6)' }}>
                            Contratar Online
                        </div>
                    </div>
                </div>

                {/* Sección 1: Desglose de Comparativa
                    Reproduce EXACTAMENTE las tarjetas "FACTURA ACTUAL" y "MEJOR ALTERNATIVA"
                    de la página de resultados (concepto + importe + fórmula de cálculo). */}
                <div>
                    <div className="flex items-center gap-2 mb-0.5">
                        <span className="w-5 h-5 rounded-full text-white text-[11px] font-bold flex items-center justify-center" style={{ backgroundColor: '#059669' }}>1</span>
                        <h3 className="text-sm font-bold" style={{ color: '#111827' }}>Desglose de Comparativa</h3>
                    </div>
                    <p className="text-[10px] mb-2 ml-7" style={{ color: '#6b7280' }}>
                        Desglose detallado por partes de lo que has pagado y lo que pagarías con la nueva tarifa
                    </p>
                    <div className={`grid gap-3 ${showCurrentBill ? 'grid-cols-2' : 'grid-cols-1'}`}>
                        {/* Factura actual */}
                        {showCurrentBill && (
                            <div className="rounded-lg p-3" style={{ border: '1px solid #fecaca', backgroundColor: '#fef2f2' }}>
                                <p className="text-[10px] font-bold tracking-wide" style={{ color: '#b91c1c' }}>FACTURA ACTUAL</p>
                                <p className="text-[9px] font-semibold mb-2" style={{ color: '#dc2626' }}>Desglose de tu factura actual</p>
                                {currentBreakdown ? (
                                    <>
                                        <div className="flex justify-between items-center pb-1 mb-2" style={{ borderBottom: '1px solid #fecaca' }}>
                                            <span className="text-[10px] font-medium" style={{ color: '#b91c1c' }}>TOTAL</span>
                                            <span className="text-base font-extrabold" style={{ color: '#b91c1c' }}>{formatCurrency(importeFactura)}</span>
                                        </div>
                                        <PdfBreakdownList rows={currentRows} />
                                    </>
                                ) : (
                                    <p className="text-[10px]" style={{ color: '#6b7280' }}>Sin datos de precios unitarios de la factura actual</p>
                                )}
                            </div>
                        )}

                        {/* Mejor alternativa */}
                        <div className="rounded-lg p-3" style={{ border: '1px solid #a7f3d0', backgroundColor: '#f0fdf4' }}>
                            <p className="text-[10px] font-bold tracking-wide" style={{ color: '#047857' }}>MEJOR ALTERNATIVA</p>
                            <p className="text-[9px] font-semibold mb-2" style={{ color: '#059669' }}>{bestCompanyDisplay}{bestTariffName ? ` - ${bestTariffName}` : ''}</p>
                            <div className="flex justify-between items-center pb-1 mb-2" style={{ borderBottom: '1px solid #a7f3d0' }}>
                                <span className="text-[10px] font-medium" style={{ color: '#047857' }}>TOTAL</span>
                                <span className="text-base font-extrabold" style={{ color: '#047857' }}>{formatCurrency(pdfData?.bestTariff?.totalCost || 0)}</span>
                            </div>
                            <PdfBreakdownList rows={bestRows} />
                        </div>
                    </div>
                </div>

                {/* Ahorro en esta factura */}
                {showCurrentBill && (
                    <div className="rounded-lg px-4 py-3 flex items-center justify-between" style={{ backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0' }}>
                        <div>
                            <p className="text-xs font-bold" style={{ color: '#065f46' }}>Ahorro en esta factura</p>
                            <p className="text-[10px]" style={{ color: '#047857' }}>Esto es lo que pagarías de menos con la nueva tarifa</p>
                        </div>
                        <p className="text-2xl font-extrabold" style={{ color: '#059669' }}>{formatCurrency(monthlySaving)}</p>
                    </div>
                )}

                {/* Sección 2: Precios de la Nueva Tarifa */}
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="w-5 h-5 rounded-full text-white text-[11px] font-bold flex items-center justify-center" style={{ backgroundColor: '#059669' }}>2</span>
                        <h3 className="text-sm font-bold" style={{ color: '#111827' }}>Precios de la Nueva Tarifa</h3>
                    </div>
                    {isGas ? (
                        <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-lg p-2" style={{ backgroundColor: '#f0fdf4', border: '1px solid #dcfce7' }}>
                                <p className="text-[10px] font-bold mb-1" style={{ color: '#166534' }}>TÉRMINO FIJO (€/día)</p>
                                <p className="text-sm font-bold" style={{ color: '#111827' }}>{newGasFixed != null ? newGasFixed.toFixed(3) : '—'}</p>
                            </div>
                            <div className="rounded-lg p-2" style={{ backgroundColor: '#f0fdf4', border: '1px solid #dcfce7' }}>
                                <p className="text-[10px] font-bold mb-1" style={{ color: '#166534' }}>ENERGÍA (€/kWh)</p>
                                <p className="text-sm font-bold" style={{ color: '#111827' }}>{newGasEnergy != null ? newGasEnergy.toFixed(3) : '—'}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-lg p-2" style={{ backgroundColor: '#f0fdf4', border: '1px solid #dcfce7' }}>
                                <p className="text-[10px] font-bold mb-1" style={{ color: '#166534' }}>TÉRMINO POTENCIA (€/kW)</p>
                                <div className="flex gap-4">
                                    {newPowerPrices.length > 0 ? newPowerPrices.map((v, i) => (
                                        <div key={i} className="text-center">
                                            <p className="text-[10px]" style={{ color: '#6b7280' }}>P{i + 1}</p>
                                            <p className="text-[11px] font-bold" style={{ color: '#111827' }}>{v.toFixed(3)}</p>
                                        </div>
                                    )) : <p className="text-[11px]" style={{ color: '#9ca3af' }}>—</p>}
                                </div>
                            </div>
                            <div className="rounded-lg p-2" style={{ backgroundColor: '#f0fdf4', border: '1px solid #dcfce7' }}>
                                <p className="text-[10px] font-bold mb-1" style={{ color: '#166534' }}>ENERGÍA (€/kWh)</p>
                                <div className="flex gap-4">
                                    {newEnergyPrices.length > 0 ? newEnergyPrices.map((v, i) => (
                                        <div key={i} className="text-center">
                                            <p className="text-[10px]" style={{ color: '#6b7280' }}>P{i + 1}</p>
                                            <p className="text-[11px] font-bold" style={{ color: '#111827' }}>{v.toFixed(3)}</p>
                                        </div>
                                    )) : <p className="text-[11px]" style={{ color: '#9ca3af' }}>—</p>}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Page 3: About Us — diseño locomparo */}
            <div
                className="pdf-page aspect-[210/297] shadow-lg rounded-lg p-8 flex flex-col font-sans text-sm"
                style={{ backgroundColor: '#ffffff' }}
            >
                <header className="flex justify-center mb-4">
                    <div className="rounded-full px-12 py-2.5" style={{ backgroundColor: '#10b981' }}>
                        <h1 className="text-2xl font-extrabold" style={{ color: '#ffffff' }}>Sobre nosotros</h1>
                    </div>
                </header>

                {/* Fila: reseñas (Trustpilot) + tu asesor */}
                <div className="grid grid-cols-3 gap-5 items-start">
                    <div className="col-span-2">
                        <Image
                            data-ai-hint="reseñas trustpilot"
                            src="/images/comparativa/resenas.png"
                            alt="Reseñas de clientes"
                            width={1500}
                            height={1311}
                            className="w-full h-auto object-contain"
                            unoptimized
                            priority
                        />
                    </div>

                    <div className="col-span-1 flex flex-col items-center text-center">
                        <h2 className="font-bold text-sm tracking-wider mb-2" style={{ color: '#0f766e' }}>TU ASESOR</h2>
                        <Image
                            data-ai-hint="portrait person"
                            src={userData?.profileImageUri || "/images/comparativa/locomparo-negro.png"}
                            alt={`Asesor ${userData?.name || 'Usuario'}`}
                            width={110}
                            height={110}
                            className="rounded-full object-cover"
                            style={{ border: '4px solid #d1fae5', width: '96px', height: '96px' }}
                            unoptimized
                        />
                        <p className="text-lg font-extrabold mt-2" style={{ color: '#111827' }}>{userData?.name || 'Usuario'}</p>
                        <div className="mt-2 font-semibold text-xs space-y-0.5">
                            <p style={{ color: '#374151' }}>Contacto: {contactPhone || '621 19 36 34'}</p>
                            <p style={{ color: '#374151' }}>Nombre: {userData?.name || 'Usuario'}</p>
                        </div>
                    </div>
                </div>

                {/* Nuestros servicios */}
                <div className="mt-4">
                    <h2 className="text-center text-xl font-extrabold mb-2">
                        <span style={{ color: '#111827' }}>Nuestros </span>
                        <span style={{ color: '#10b981', fontStyle: 'italic' }}>servicios.</span>
                    </h2>
                    <Image
                        data-ai-hint="servicios características"
                        src="/images/comparativa/caracteristicas.png"
                        alt="Nuestros servicios"
                        width={1600}
                        height={553}
                        className="w-full h-auto object-contain"
                        unoptimized
                        priority
                    />
                </div>

                {/* Aviso legal */}
                <div className="mt-4 rounded-lg px-4 py-3" style={{ backgroundColor: '#fef9c3' }}>
                    <p className="text-[9px] leading-snug mb-2" style={{ color: '#374151' }}>
                        *Los precios, tarifas y condiciones económicas reflejados en la presente comparativa corresponden a la información disponible en la fecha de su elaboración. Dichos importes tienen carácter meramente informativo y orientativo, y no constituyen una oferta vinculante ni un compromiso contractual por parte de las compañías proveedoras.
                    </p>
                    <p className="text-[9px] leading-snug" style={{ color: '#374151' }}>
                        La reserva o garantía del precio únicamente se producirá una vez que la contratación haya sido formalizada y aceptada por la compañía correspondiente, de acuerdo con sus procedimientos y condiciones de contratación vigentes en ese momento.
                    </p>
                </div>

                <footer className="text-center mt-auto pt-3" style={{ borderTop: '1px solid #e5e7eb' }}>
                    <p className="text-[10px]" style={{ color: '#6b7280' }}>
                        Política Privacidad: <a href="https://locomparo.com/politicas-de-privacidad/" className="underline font-semibold" style={{ color: '#10b981' }}>https://locomparo.com/politicas-de-privacidad/</a>
                    </p>
                </footer>
            </div>
        </div>
    );
}
