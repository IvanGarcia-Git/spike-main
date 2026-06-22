'use client';

import { useState, type ChangeEvent, useEffect } from 'react';
import Image from 'next/image';
import { Phone, Mail, Globe, Check } from 'lucide-react';
import type { PdfData, CompanyLightTariff, CompanyGasTariff } from '@/lib/types';

const formatCurrency = (value: number | undefined | null) => {
  if (value === undefined || value === null || isNaN(value)) {
    return '0,00€';
  }
  return `${value.toFixed(2).replace('.', ',')}€`;
};
const parseCurrency = (value: string) => parseFloat(value.replace('€', '').replace(',', '.')) || 0;


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

interface EditableDetail {
    id: string;
    label: string;
    value: string;
}
interface EditableCardData {
    potencia: EditableDetail[];
    energia: EditableDetail[];
    impuestos: EditableDetail[];
}

const initialCurrentBillDetails: EditableCardData = {
    potencia: [
        { id: 'curr-p1', label: 'XkW x Ndias x PrecioP1', value: '0,00€' },
        { id: 'curr-p2', label: 'XkW x Ndias x PrecioP2', value: '0,00€' },
    ],
    energia: [
        { id: 'curr-e1', label: 'Energía E1', value: '0,00€' },
    ],
    impuestos: [
        { id: 'curr-rental', label: 'Alquiler Equipos', value: '0,00€' },
        { id: 'curr-bonus', label: 'Bono Social', value: '0,00€' },
        { id: 'curr-tax', label: 'Imp. Electricidad', value: '0,00€' },
        { id: 'curr-vat', label: 'IVA', value: '0,00€' },
    ],
};

const initialBestTariffDetails: EditableCardData = {
    potencia: [
        { id: 'best-p1', label: 'XkW x Ndias x PrecioP1', value: '0,00€' },
    ],
    energia: [
        { id: 'best-e1', label: 'Coste Energía E1', value: '0,00€' },
    ],
    impuestos: [
        { id: 'best-i1', label: 'Alquiler Equipos', value: '0,00€' },
    ],
};


export default function ComparisonPdfPreview({ pdfData, colors, userData }: ComparisonPdfPreviewProps) {
    const defaultLogos = [
        'https://placehold.co/80x35.png',
        'https://placehold.co/80x35.png',
        'https://placehold.co/80x35.png',
        'https://placehold.co/80x35.png',
    ];
    const [logos, setLogos] = useState<string[]>(defaultLogos);
    const [headerLine1, setHeaderLine1] = useState('Comparado entre');
    const [headerLine2, setHeaderLine2] = useState('+ 150 compañías');

    const [mainLogoSrc, setMainLogoSrc] = useState('/images/logo.svg');
    const [footerLogoSrc, setFooterLogoSrc] = useState('/images/logo.svg');

    // Load saved logos from localStorage on first render
    useEffect(() => {
        const savedLogos = localStorage.getItem('comparativaLogos');
        const savedMainLogo = localStorage.getItem('comparativaMainLogo');
        const savedFooterLogo = localStorage.getItem('comparativaFooterLogo');
        const savedHeader1 = localStorage.getItem('comparativaHeader1');
        const savedHeader2 = localStorage.getItem('comparativaHeader2');

        if (savedLogos) {
            try {
                setLogos(JSON.parse(savedLogos));
            } catch (e) {
                console.error('Error parsing saved logos:', e);
            }
        }
        if (savedMainLogo) setMainLogoSrc(savedMainLogo);
        if (savedFooterLogo) setFooterLogoSrc(savedFooterLogo);
        if (savedHeader1) setHeaderLine1(savedHeader1);
        if (savedHeader2) setHeaderLine2(savedHeader2);
    }, []);

    const [currentBillDetails, setCurrentBillDetails] = useState<EditableCardData>(initialCurrentBillDetails);
    const [bestTariffDetails, setBestTariffDetails] = useState<EditableCardData>(initialBestTariffDetails);
    const [totalCurrent, setTotalCurrent] = useState('84,64€');
    const [totalBest, setTotalBest] = useState('84,64€');

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


    useEffect(() => {
        if (pdfData && pdfData.bestTariff?.tariff) {
            const numDias = pdfData.numDias || 0;
            const bestTariff = pdfData.bestTariff.tariff;

            if (pdfData.comparisonType === 'luz') {
                const bestLightTariff = bestTariff as CompanyLightTariff;
                const potencias = pdfData.potencias || [];
                const energias = pdfData.energias || [];
                const excedentes = pdfData.excedentes || 0;

                const bestTariffPowerPrices = bestLightTariff.powerPrices || [];
                const bestTariffEnergyPrices = bestLightTariff.energyPrices || [];
                const bestTariffSurplusPrice = bestLightTariff.surplusPrice || 0;
                
                const bestImpuestos = [
                    { id: 'best-rental', label: 'Alquiler Equipos', value: formatCurrency(pdfData.bestTariff?.breakdown?.equipmentRental || 0) },
                    { id: 'best-bonus', label: 'Bono Social', value: formatCurrency(pdfData.bestTariff?.breakdown?.socialBonus || 0) }
                ];

                if ((bestLightTariff as any).maintenanceCost > 0) {
                    bestImpuestos.push({ id: 'best-maintenance', label: 'Servicios Adicionales', value: formatCurrency((bestLightTariff as any).maintenanceCost) });
                }

                bestImpuestos.push({ id: 'best-tax', label: 'Imp. Electricidad', value: formatCurrency(pdfData.bestTariff?.breakdown?.electricityTax || 0) });
                bestImpuestos.push({ id: 'best-vat', label: 'IVA', value: formatCurrency(pdfData.bestTariff?.breakdown?.vat || 0) });

                setBestTariffDetails({
                    potencia: (pdfData.bestTariff?.breakdown?.powerCosts || []).map((cost, i) => ({
                        id: `best-p-cost-${i}`,
                        label: `${potencias[i] || 'X'}kW x ${numDias}dias x ${bestTariffPowerPrices[i] !== undefined ? bestTariffPowerPrices[i].toFixed(3) : `PrecioP${i + 1}`}`,
                        value: formatCurrency(cost)
                    })),
                    energia: [
                        ...(pdfData.bestTariff?.breakdown?.energyCosts || []).map((cost, i) => ({
                            id: `best-e-cost-${i}`,
                            label: `${energias[i] || 'X'}kWh x ${bestTariffEnergyPrices[i] !== undefined ? bestTariffEnergyPrices[i].toFixed(3) : `PrecioE${i + 1}`}€/kWh`,
                            value: formatCurrency(cost)
                        })),
                        ...((pdfData.bestTariff?.breakdown?.surplusCredit ?? 0) > 0 ? [{
                            id: 'best-surplus',
                            label: `Abono Excedentes: ${excedentes}kWh x ${bestTariffSurplusPrice.toFixed(3)}€/kWh`,
                            value: formatCurrency(-(pdfData.bestTariff?.breakdown?.surplusCredit || 0))
                        }] : [])
                    ],
                    impuestos: bestImpuestos
                });
                
                if (pdfData.showCurrentBill && pdfData.clientPrices?.power && pdfData.clientPrices?.energy) {
                    const clientPowerPrices = pdfData.clientPrices.power;
                    const clientEnergyPrices = pdfData.clientPrices.energy;
                    const clientSurplusPrice = pdfData.clientPrices.surplus || 0;
                    const maintenanceCost = pdfData.clientPrices.maintenance || 0;
                    const regulatedCosts = pdfData.regulatedCosts;

                    const powerCosts = potencias.map((p, i) => p * numDias * (clientPowerPrices[i] || 0));
                    const energyCosts = energias.map((e, i) => e * (clientEnergyPrices[i] || 0));
                    const costePotencia = powerCosts.reduce((a, b) => a + b, 0);
                    const costeEnergia = energyCosts.reduce((a, b) => a + b, 0);
                    const surplusCredit = (excedentes || 0) * clientSurplusPrice;
                    const equipmentRental = numDias * (regulatedCosts?.alquiler || 0);
                    const socialBonus = numDias * (regulatedCosts?.social || 0);
                    const baseIH = costePotencia + costeEnergia - surplusCredit + equipmentRental + socialBonus;
                    const electricityTax = baseIH > 0 ? baseIH * ((regulatedCosts?.ihp || 0) / 100) : 0;
                    const baseIVA = baseIH + electricityTax + maintenanceCost;
                    const vat = baseIVA > 0 ? baseIVA * ((regulatedCosts?.iva || 0) / 100) : 0;

                    const currentImpuestos = [
                        { id: 'curr-rental', label: 'Alquiler Equipos', value: formatCurrency(equipmentRental) },
                        { id: 'curr-bonus', label: 'Bono Social', value: formatCurrency(socialBonus) }
                    ];

                    if (maintenanceCost > 0) {
                        currentImpuestos.push({ id: 'curr-maintenance', label: 'Mantenimiento', value: formatCurrency(maintenanceCost) });
                    }
                    currentImpuestos.push({ id: 'curr-tax', label: 'Imp. Electricidad', value: formatCurrency(electricityTax) });
                    currentImpuestos.push({ id: 'curr-vat', label: 'IVA', value: formatCurrency(vat) });

                    setCurrentBillDetails({
                        potencia: powerCosts.map((cost, i) => ({
                            id: `curr-p${i + 1}`,
                            label: `${potencias[i] || 'X'}kW x ${numDias}dias x ${(clientPowerPrices[i] || 0).toFixed(3)}`,
                            value: formatCurrency(cost)
                        })),
                        energia: [
                            ...energyCosts.map((cost, i) => ({
                                id: `curr-e${i + 1}`,
                                label: `${energias[i] || 'X'}kWh x ${(clientEnergyPrices[i] || 0).toFixed(3)}€/kWh`,
                                value: formatCurrency(cost)
                            })),
                            ...(excedentes > 0 ? [{
                                id: 'curr-surplus',
                                label: `Abono Excedentes: ${excedentes}kWh x ${clientSurplusPrice.toFixed(3)}€/kWh`,
                                value: formatCurrency(-surplusCredit)
                            }] : [])
                        ],
                        impuestos: currentImpuestos,
                    });
                } else {
                     setCurrentBillDetails(initialCurrentBillDetails);
                }

            } else if (pdfData.comparisonType === 'gas') {
                const bestGasTariff = bestTariff as CompanyGasTariff;
                const energia = pdfData.energia || 0;

                const bestImpuestos = [
                    { id: 'best-gas-rental', label: 'Alquiler Equipos', value: formatCurrency(pdfData.bestTariff?.breakdown?.equipmentRental || 0) },
                ];
                
                if ((bestGasTariff as any).maintenanceCost > 0) {
                    bestImpuestos.push({ id: 'best-gas-maintenance', label: 'Servicios Adicionales', value: formatCurrency((bestGasTariff as any).maintenanceCost) });
                }

                bestImpuestos.push({ id: 'best-gas-tax', label: 'Imp. Hidrocarburos', value: formatCurrency(pdfData.bestTariff?.breakdown?.hydrocarbonTax || 0) });
                bestImpuestos.push({ id: 'best-gas-vat', label: 'IVA', value: formatCurrency(pdfData.bestTariff?.breakdown?.vat || 0) });

                setBestTariffDetails({
                    potencia: [{
                        id: 'best-fixed',
                        label: `Término Fijo: ${numDias}dias x ${bestGasTariff.fixedPrice.toFixed(3)}€/día`,
                        value: formatCurrency(pdfData.bestTariff?.breakdown?.fixedCost || 0)
                    }],
                    energia: [{
                        id: 'best-gas-energy',
                        label: `Energía: ${energia}kWh x ${bestGasTariff.energyPrice.toFixed(3)}€/kWh`,
                        value: formatCurrency(pdfData.bestTariff?.breakdown?.energyCost || 0)
                    }],
                    impuestos: bestImpuestos
                });

                if (pdfData.showCurrentBill && pdfData.clientPrices?.fixed !== undefined && pdfData.clientPrices?.variable !== undefined) {
                    const clientFixed = pdfData.clientPrices.fixed;
                    const clientVariable = pdfData.clientPrices.variable;
                    const maintenanceCost = pdfData.clientPrices.maintenance || 0;
                    const regulatedCosts = pdfData.regulatedCosts;

                    const fixedCost = clientFixed * numDias;
                    const energyCost = energia * clientVariable;
                    const equipmentRental = (regulatedCosts.alquiler || 0) * numDias;
                    const hydrocarbonTax = (regulatedCosts.hydrocarbon || 0) * energia;
                    const baseCost = fixedCost + energyCost + equipmentRental + hydrocarbonTax;
                    const vat = (baseCost + maintenanceCost) > 0 ? (baseCost + maintenanceCost) * ((regulatedCosts?.iva || 0) / 100) : 0;
                    
                    const currentImpuestos = [
                        { id: 'curr-gas-rental', label: 'Alquiler Equipos', value: formatCurrency(equipmentRental) },
                    ];

                    if (maintenanceCost > 0) {
                        currentImpuestos.push({ id: 'curr-gas-maintenance', label: 'Mantenimiento', value: formatCurrency(maintenanceCost) });
                    }
                    currentImpuestos.push({ id: 'curr-gas-tax', label: 'Imp. Hidrocarburos', value: formatCurrency(hydrocarbonTax) });
                    currentImpuestos.push({ id: 'curr-gas-vat', label: 'IVA', value: formatCurrency(vat) });

                    setCurrentBillDetails({
                       potencia: [{
                           id: 'curr-fixed',
                           label: `Término Fijo: ${numDias}dias x ${clientFixed.toFixed(3)}€/día`,
                           value: formatCurrency(fixedCost)
                       }],
                       energia: [{
                           id: 'curr-gas-energy',
                           label: `Energía: ${energia}kWh x ${clientVariable.toFixed(3)}€/kWh`,
                           value: formatCurrency(energyCost)
                       }],
                       impuestos: currentImpuestos,
                    });
                }
            }

            setTotalBest(formatCurrency(pdfData.bestTariff?.totalCost || 0));
            setTotalCurrent(formatCurrency(pdfData.currentBillAmount || 0));

        } else {
            setBestTariffDetails(initialBestTariffDetails);
            setCurrentBillDetails(initialCurrentBillDetails);
            setTotalBest('84,64€');
            setTotalCurrent('84,64€');
        }
    }, [pdfData]);


    const handleLogoChange = (e: ChangeEvent<HTMLInputElement>, index: number) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const newLogos = [...logos];
                newLogos[index] = reader.result as string;
                setLogos(newLogos);
                // Save to localStorage
                localStorage.setItem('comparativaLogos', JSON.stringify(newLogos));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleMainLogoChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const logoData = reader.result as string;
                setMainLogoSrc(logoData);
                // Save to localStorage
                localStorage.setItem('comparativaMainLogo', logoData);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleFooterLogoChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const logoData = reader.result as string;
                setFooterLogoSrc(logoData);
                // Save to localStorage
                localStorage.setItem('comparativaFooterLogo', logoData);
            };
            reader.readAsDataURL(file);
        }
    };

    const showCurrentBill = pdfData?.showCurrentBill ?? true;
    const annualSaving = pdfData?.annualSaving || 0;
    const monthlySaving = pdfData?.monthlySaving || 0;
    const bestCompanyName = pdfData?.bestTariff?.tariff?.companyName?.toUpperCase() ?? "MEJOR";
    const sectionTitlePotencia = pdfData?.comparisonType === 'gas' ? 'Término Fijo' : 'Potencia';

    // ---------------------------------------------------------------------------
    // Página 2 — diseño "Luzia": agregados derivados del desglose ya calculado
    // (reutiliza currentBillDetails / bestTariffDetails para no duplicar la lógica
    //  de cálculo de luz/gas, excedentes, costes regulados y precios del cliente).
    // ---------------------------------------------------------------------------
    const isGas = pdfData?.comparisonType === 'gas';
    const potenciasArr = pdfData?.potencias || [];
    const consumoTotal = isGas ? (pdfData?.energia || 0) : (pdfData?.energias || []).reduce((a, b) => a + (b || 0), 0);
    const importeFactura = pdfData?.currentBillAmount || 0;

    const sumDetails = (arr: EditableDetail[] = []) => arr.reduce((a, d) => a + parseCurrency(d.value), 0);
    const pickDetail = (arr: EditableDetail[] = [], frag: string) => {
        const d = arr.find(x => x.id.includes(frag));
        return d ? parseCurrency(d.value) : 0;
    };
    const taxLabel = isGas ? 'Imp. Hidrocarburos' : 'Impuesto eléctrico';
    const potLabel = isGas ? 'Término fijo' : 'Coste potencia';

    const buildRows = (details: EditableCardData, includeBono: boolean) => {
        const alquiler = pickDetail(details.impuestos, 'rental');
        const bono = pickDetail(details.impuestos, 'bonus');
        const mant = pickDetail(details.impuestos, 'maintenance');
        const tax = pickDetail(details.impuestos, 'tax');
        const iva = pickDetail(details.impuestos, 'vat');
        const rows = [
            { label: 'Coste energía', value: sumDetails(details.energia) },
            { label: potLabel, value: sumDetails(details.potencia) },
            { label: 'Alquiler equipos', value: alquiler },
            ...(includeBono ? [{ label: 'Bono social', value: bono }] : []),
            { label: 'Mantenimiento', value: mant },
            { label: taxLabel, value: tax },
            { label: 'IVA', value: iva },
        ];
        // No mostrar filas a 0 (requisito: ningún dato debe quedarse en 0). El TOTAL
        // se muestra siempre aparte (importe real de la factura / mejor tarifa).
        return rows.filter((r) => Math.abs(r.value) > 0.0001);
    };
    const currentRows = buildRows(currentBillDetails, !isGas);
    const bestRows = buildRows(bestTariffDetails, !isGas);

    const bestTariffObj = pdfData?.bestTariff?.tariff;
    const newPowerPrices: number[] = !isGas ? (((bestTariffObj as CompanyLightTariff)?.powerPrices) || []) : [];
    const newEnergyPrices: number[] = !isGas ? (((bestTariffObj as CompanyLightTariff)?.energyPrices) || []) : [];
    const newGasFixed = isGas ? ((bestTariffObj as CompanyGasTariff)?.fixedPrice ?? null) : null;
    const newGasEnergy = isGas ? ((bestTariffObj as CompanyGasTariff)?.energyPrice ?? null) : null;
    const bestTariffName = bestTariffObj?.tariffName || '';
    const bestCompanyDisplay = bestTariffObj?.companyName || bestCompanyName;


    return (
        <div className="space-y-8">
            {/* Page 1: Cover — diseño "Luzia" */}
            <div
                className="pdf-page aspect-[210/297] shadow-lg rounded-lg p-10 flex flex-col font-sans"
                style={{ backgroundColor: '#ffffff' }}
            >
                {/* Cabecera: texto editable + logos comparados */}
                <header className="flex items-start justify-between">
                    <div>
                        <input
                            type="text"
                            value={headerLine1}
                            onChange={(e) => {
                                setHeaderLine1(e.target.value);
                                localStorage.setItem('comparativaHeader1', e.target.value);
                            }}
                            className="font-bold text-sm bg-transparent border-none p-0 m-0 w-full focus:ring-1 focus:ring-emerald-500 rounded-sm"
                            style={{ color: '#0f766e' }}
                        />
                        <input
                            type="text"
                            value={headerLine2}
                            onChange={(e) => {
                                setHeaderLine2(e.target.value);
                                localStorage.setItem('comparativaHeader2', e.target.value);
                            }}
                            className="text-lg font-extrabold bg-transparent border-none p-0 m-0 w-full focus:ring-1 focus:ring-emerald-500 rounded-sm"
                            style={{ color: '#059669' }}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        {logos.map((logoSrc, index) => (
                            <label key={index} className="logo-container cursor-pointer group relative border-2 border-dashed rounded-md p-1 hover:border-primary transition-colors duration-200">
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleLogoChange(e, index)} />
                                <Image data-ai-hint="company logo" src={logoSrc} alt={`Company logo ${index + 1}`} width={56} height={28} className="object-contain" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                    <p className="text-white text-xs font-bold">Cambiar</p>
                                </div>
                            </label>
                        ))}
                    </div>
                </header>

                {/* Logo principal */}
                <div className="flex-grow flex flex-col items-center justify-center text-center">
                    <label className="logo-container cursor-pointer group relative border-2 border-dashed rounded-md p-1 hover:border-primary transition-colors duration-200 block w-64 h-32 mx-auto">
                        <input type="file" accept="image/*" className="hidden" onChange={handleMainLogoChange} />
                        <Image data-ai-hint="company logo" src={mainLogoSrc} alt="Main Logo" fill className="object-contain" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <p className="text-white text-xs font-bold">Cambiar Logo Principal</p>
                        </div>
                    </label>
                </div>

                {/* Hero: saludo + ahorro anual destacado */}
                <div className="rounded-2xl px-8 py-8 text-center" style={{ backgroundColor: '#065f46' }}>
                    <h1 className="text-4xl font-extrabold text-white">{pdfData?.clientName || 'Cliente'},</h1>
                    <h2 className="text-2xl font-medium text-white" style={{ opacity: 0.92 }}>aquí tienes tu comparativa</h2>
                    <div className="mt-5 inline-block rounded-xl px-6 py-3" style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}>
                        <p className="text-[11px] font-semibold tracking-widest text-white" style={{ opacity: 0.85 }}>AHORRO ANUAL ESTIMADO</p>
                        <p className="text-4xl font-extrabold text-white">{formatCurrency(annualSaving)}</p>
                    </div>
                </div>

                {/* Logo footer */}
                <div className="flex justify-center mt-6">
                    <label className="logo-container cursor-pointer group relative border-2 border-dashed rounded-md p-1 hover:border-primary transition-colors duration-200 block w-72 h-14">
                        <input type="file" accept="image/*" className="hidden" onChange={handleFooterLogoChange} />
                        <Image data-ai-hint="company logo" src={footerLogoSrc} alt="Footer Logo" fill className="object-contain" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <p className="text-white text-xs font-bold">Cambiar Logo Footer</p>
                        </div>
                    </label>
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

                {/* Sección 1: Desglose de Comparativa */}
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
                            <div className="rounded-lg p-3" style={{ border: '1px solid #fecaca', backgroundColor: '#fff' }}>
                                <p className="text-[10px] font-bold tracking-wide mb-0.5" style={{ color: '#dc2626' }}>FACTURA ACTUAL</p>
                                <p className="text-[10px] font-semibold mb-2" style={{ color: '#6b7280' }}>{supplyData.comercializadora || 'Tu compañía actual'}</p>
                                {currentRows.map((r, i) => (
                                    <div key={i} className="flex justify-between items-baseline py-0.5" style={{ borderBottom: '1px solid #f3f4f6' }}>
                                        <span className="text-[11px]" style={{ color: '#4b5563' }}>{r.label}</span>
                                        <span className="text-[11px] font-semibold" style={{ color: '#111827' }}>{formatCurrency(r.value)}</span>
                                    </div>
                                ))}
                                <div className="flex justify-between items-baseline pt-2 mt-1">
                                    <span className="text-xs font-bold" style={{ color: '#dc2626' }}>TOTAL FACTURA</span>
                                    <input
                                        type="text"
                                        value={totalCurrent}
                                        onChange={(e) => setTotalCurrent(e.target.value)}
                                        className="text-base font-extrabold bg-transparent border-none p-0 m-0 w-24 text-right focus:ring-1 focus:ring-emerald-500 rounded-sm"
                                        style={{ color: '#dc2626' }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Mejor alternativa */}
                        <div className="rounded-lg p-3" style={{ border: '1px solid #a7f3d0', backgroundColor: '#fff' }}>
                            <p className="text-[10px] font-bold tracking-wide mb-0.5" style={{ color: '#059669' }}>MEJOR ALTERNATIVA</p>
                            <p className="text-[10px] font-semibold mb-2" style={{ color: '#6b7280' }}>{bestCompanyDisplay}{bestTariffName ? ` — ${bestTariffName}` : ''}</p>
                            {bestRows.map((r, i) => (
                                <div key={i} className="flex justify-between items-baseline py-0.5" style={{ borderBottom: '1px solid #f3f4f6' }}>
                                    <span className="text-[11px]" style={{ color: '#4b5563' }}>{r.label}</span>
                                    <span className="text-[11px] font-semibold" style={{ color: '#111827' }}>{formatCurrency(r.value)}</span>
                                </div>
                            ))}
                            <div className="flex justify-between items-baseline pt-2 mt-1">
                                <span className="text-xs font-bold" style={{ color: '#059669' }}>TOTAL</span>
                                <input
                                    type="text"
                                    value={totalBest}
                                    onChange={(e) => setTotalBest(e.target.value)}
                                    className="text-base font-extrabold bg-transparent border-none p-0 m-0 w-24 text-right focus:ring-1 focus:ring-emerald-500 rounded-sm"
                                    style={{ color: '#059669' }}
                                />
                            </div>
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

            {/* Page 3: About Us — diseño "Luzia" */}
            <div
                className="pdf-page aspect-[210/297] shadow-lg rounded-lg p-10 flex flex-col font-sans text-sm"
                style={{ backgroundColor: '#ffffff' }}
            >
                <header className="flex justify-center mb-6">
                    <div className="rounded-full px-12 py-3" style={{ backgroundColor: '#065f46' }}>
                        <h1 className="text-2xl font-extrabold text-white">Sobre nosotros</h1>
                    </div>
                </header>

                <main className="flex-grow grid grid-cols-2 gap-8">
                    <div className="flex flex-col justify-between">
                        <div>
                            <ul className="space-y-2 mb-6">
                                {['Precio fijo 24h / 12 meses', 'Compromiso ahorro', 'Sin mantenimientos', 'Sin permanencias'].map((t) => (
                                    <li key={t} className="flex items-center gap-3">
                                        <Check className="w-5 h-5 flex-shrink-0" style={{ color: '#059669' }} />
                                        <span className="font-semibold" style={{ color: '#111827' }}>{t}</span>
                                    </li>
                                ))}
                            </ul>
                            <div>
                                <h2 className="font-bold text-base tracking-wider" style={{ color: '#0f766e' }}>VISÍTANOS</h2>
                                <p className="font-semibold" style={{ color: '#374151' }}>Calle Virgen de Luján 20</p>
                                <p className="font-semibold" style={{ color: '#374151' }}>41011 Sevilla</p>
                                <Image
                                    data-ai-hint="office building"
                                    src="https://placehold.co/280x180.png"
                                    alt="Oficina"
                                    width={280}
                                    height={170}
                                    className="rounded-xl mt-3 shadow-md object-cover"
                                />
                            </div>
                        </div>
                        <div className="flex items-end gap-4 mt-4">
                            <div>
                                <p className="text-lg font-extrabold leading-tight" style={{ color: '#065f46' }}>CONOCE</p>
                                <p className="text-lg font-extrabold leading-tight" style={{ color: '#065f46' }}>NUESTRAS</p>
                                <p className="text-lg font-extrabold leading-tight" style={{ color: '#065f46' }}>RESEÑAS</p>
                            </div>
                            <div className="relative">
                                <div className="absolute -top-2.5 right-0 text-[10px] font-bold px-1.5 py-0.5 rounded-sm text-white" style={{ backgroundColor: '#059669' }}>
                                    ESCANEA AQUÍ
                                </div>
                                <Image
                                    data-ai-hint="QR code"
                                    src="https://placehold.co/100x100.png"
                                    alt="QR Code"
                                    width={100}
                                    height={100}
                                    className="rounded-lg p-0.5"
                                    style={{ border: '4px solid #059669' }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-center pt-2">
                        <h2 className="font-bold text-base tracking-wider" style={{ color: '#0f766e' }}>TU ASESOR</h2>
                        <Image
                            data-ai-hint="portrait person"
                            src={userData?.profileImageUri || "https://images.unsplash.com/photo-1633332755192-727a05c4013d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw2fHxwZXJzb25hfGVufDB8fHx8MTc1MTczNTY2OXww&ixlib=rb-4.1.0&q=80&w=1080"}
                            alt={`Asesor ${userData?.name || 'Usuario'}`}
                            width={120}
                            height={120}
                            className="rounded-full my-2 object-cover"
                            style={{ border: '4px solid #d1fae5' }}
                        />
                        <p className="text-2xl font-extrabold mb-4" style={{ color: '#111827' }}>{userData?.name || 'Usuario'}</p>
                        <div className="space-y-2.5 w-full max-w-xs text-center">
                            {['Asesoramiento GRATIS', 'Asistencia 365 días', 'Recordatorio Renovaciones'].map((t) => (
                                <div key={t} className="rounded-full py-2.5" style={{ backgroundColor: '#065f46' }}>
                                    <p className="font-bold text-sm text-white">{t}</p>
                                </div>
                            ))}
                        </div>
                        <div className="text-center mt-4 font-semibold">
                            <p style={{ color: '#374151' }}>Contacto: 621 19 36 34</p>
                            <p style={{ color: '#374151' }}>Nombre: {userData?.name || 'Usuario'}</p>
                        </div>
                    </div>
                </main>

                <footer className="text-center mt-6 pt-2" style={{ borderTop: '1px solid #e5e7eb' }}>
                    <p className="text-[10px]" style={{ color: '#6b7280' }}>
                        Política Privacidad: <a href="https://bajaturafactura.es/politica-de-privacidad/" className="underline font-semibold" style={{ color: '#059669' }}>https://bajaturafactura.es/politica-de-privacidad/</a>
                    </p>
                </footer>
            </div>
        </div>
    );
}
