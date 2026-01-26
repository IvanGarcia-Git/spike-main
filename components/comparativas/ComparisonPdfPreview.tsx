'use client';

import { useState, type ChangeEvent, useEffect, useRef } from 'react';
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

const EditableCostDetail = ({ label, value, onLabelChange, onValueChange, className = '', textColor }: { label: string; value: string; onLabelChange: (e: ChangeEvent<HTMLTextAreaElement>) => void; onValueChange: (e: ChangeEvent<HTMLInputElement>) => void; className?: string; textColor?: string }) => {
    const textAreaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (textAreaRef.current) {
            textAreaRef.current.style.height = 'auto';
            textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
        }
    }, [label]);

    const effectiveColor = textColor || 'inherit';

    return (
        <div className={`flex justify-between items-start text-xs ${className} min-h-[20px]`} style={{ color: effectiveColor }}>
            <textarea
                ref={textAreaRef}
                value={label}
                onChange={onLabelChange}
                className="flex-1 bg-transparent border-none p-0 m-0 pr-2 focus:ring-1 focus:ring-primary focus:bg-white/50 rounded-sm resize-none text-xs overflow-hidden"
                style={{ lineHeight: '1.4', minHeight: '20px', color: effectiveColor }}
                rows={1}
            />
            <input
                type="text"
                value={value}
                onChange={onValueChange}
                className="font-medium bg-transparent border-none p-0 m-0 w-24 text-right focus:ring-1 focus:ring-primary focus:bg-white/50 rounded-sm text-xs flex-shrink-0"
                style={{ lineHeight: '1.4', color: effectiveColor }}
            />
        </div>
    );
};

const Section = ({ title, color, children, textColor }: { title: string; color: string; children: React.ReactNode; textColor?: string }) => (
    <div className="mb-6">
        <h4 className="text-xl font-bold" style={{ color: textColor || '#000000' }}>{title}</h4>
        <div className="border-t-2 border-gray-400 w-24 my-2"></div>
        <div className="space-y-2" style={{ color: textColor || 'inherit' }}>{children}</div>
    </div>
);

const EditableTotalSection = ({ color, total, onTotalChange, textColor }: { color: string; total: string; onTotalChange: (e: ChangeEvent<HTMLInputElement>) => void; textColor?: string }) => (
    <div>
        <div className="border-t-2 border-gray-400 w-full my-3"></div>
        <div className="flex justify-between items-baseline">
            <span className="text-3xl font-extrabold" style={{ color: textColor || '#000000' }}>Total</span>
             <input
                type="text"
                value={total}
                onChange={onTotalChange}
                className="text-4xl font-extrabold bg-transparent border-none p-0 m-0 w-32 text-right focus:ring-1 focus:ring-primary focus:bg-white/50 rounded-sm"
                style={{ color: textColor || '#000000', WebkitTextFillColor: textColor || '#000000' }}
            />
        </div>
    </div>
);

const CompanyCard = ({
    title,
    subtitle,
    subtitleColor,
    borderColor,
    children,
    textColor
}: {
    title: string;
    subtitle: string;
    subtitleColor: string;
    borderColor: string;
    children: React.ReactNode;
    textColor?: string;
}) => (
    <div className={`bg-white shadow-lg rounded-md overflow-visible ${borderColor}`}>
        <div className="bg-black p-4 text-center">
            <h2 className="text-lg font-semibold tracking-widest text-white">{title}</h2>
            <h3 className={`text-4xl font-bold tracking-wider ${subtitleColor}`}>{subtitle}</h3>
        </div>
        <div className="p-8" style={{ color: textColor || '#000000' }}>
            {children}
        </div>
    </div>
);

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


    const handleDetailChange = (
        setter: React.Dispatch<React.SetStateAction<EditableCardData>>,
        section: 'potencia' | 'energia' | 'impuestos',
        index: number,
        field: 'label' | 'value',
        text: string
    ) => {
        setter(prevDetails => {
            const newSectionDetails = [...prevDetails[section]];
            newSectionDetails[index] = { ...newSectionDetails[index], [field]: text };
            return {
                ...prevDetails,
                [section]: newSectionDetails
            };
        });
    };


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


    return (
        <div className="space-y-8">
            {/* Page 1: Cover */}
            <div 
                className="pdf-page aspect-[210/297] shadow-lg rounded-lg p-12 flex flex-col font-sans"
                style={{ backgroundColor: colors.background, color: colors.primaryText }}
            >
                <div className="flex-grow flex flex-col">
                    {/* Top Section */}
                    <header className="flex items-center justify-between">
                        <div>
                           <input
                                type="text"
                                value={headerLine1}
                                onChange={(e) => {
                                    setHeaderLine1(e.target.value);
                                    localStorage.setItem('comparativaHeader1', e.target.value);
                                }}
                                className="font-bold bg-transparent border-none p-0 m-0 w-full focus:ring-1 focus:ring-primary focus:bg-white/50 rounded-sm"
                                style={{ color: colors.primaryText }}
                            />
                            <input
                                type="text"
                                value={headerLine2}
                                onChange={(e) => {
                                    setHeaderLine2(e.target.value);
                                    localStorage.setItem('comparativaHeader2', e.target.value);
                                }}
                                className="text-lg font-bold bg-transparent border-none p-0 m-0 w-full focus:ring-1 focus:ring-primary focus:bg-white/50 rounded-sm"
                                style={{ color: colors.primaryText }}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                           {logos.map((logoSrc, index) => (
                                <label key={index} className="logo-container cursor-pointer group relative border-2 border-dashed rounded-md p-1 hover:border-primary transition-colors duration-200">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => handleLogoChange(e, index)}
                                    />
                                    <Image
                                        data-ai-hint="company logo"
                                        src={logoSrc}
                                        alt={`Company logo ${index + 1}`}
                                        width={60}
                                        height={30}
                                        className="object-contain"
                                    />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                        <p className="text-white text-xs font-bold">Cambiar</p>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </header>

                    {/* Middle Section */}
                    <div className="flex-grow flex flex-col items-center justify-center text-center">
                        <label className="logo-container cursor-pointer group relative border-2 border-dashed rounded-md p-1 hover:border-primary transition-colors duration-200 block w-64 h-32 mx-auto my-12">
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleMainLogoChange}
                            />
                            <Image
                                data-ai-hint="company logo"
                                src={mainLogoSrc}
                                alt="Main Logo"
                                fill
                                className="object-contain"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <p className="text-white text-xs font-bold">Cambiar Logo Principal</p>
                            </div>
                        </label>

                        <label className="logo-container cursor-pointer group relative border-2 border-dashed rounded-md p-1 hover:border-primary transition-colors duration-200 block w-80 h-16 mx-auto">
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleFooterLogoChange}
                            />
                            <Image
                                data-ai-hint="company logo"
                                src={footerLogoSrc}
                                alt="Footer Logo"
                                fill
                                className="object-contain"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <p className="text-white text-xs font-bold">Cambiar Logo Footer</p>
                            </div>
                        </label>
                    </div>
                </div>

                {/* Bottom Section */}
                <footer className="text-center">
                    <h1 className="text-5xl font-bold" style={{ color: colors.primaryText }}>{pdfData?.clientName || 'Marcos'},</h1>
                    <h2 className="text-4xl" style={{ color: colors.primaryText }}>aquí tienes tu comparativa</h2>
                    <p className="text-4xl font-bold mt-6" style={{ color: colors.primaryText }}>{formatCurrency(annualSaving)} Ahorro Anual</p>
                </footer>
            </div>

            {/* Page 2: Content */}
            <div 
                className="pdf-page aspect-[210/297] p-8 font-sans rounded-lg flex flex-col justify-center pdf-content-page"
                style={{ backgroundColor: colors.background, color: colors.primaryText }}
            >
                <div className="w-full">
                    <h1 
                        className="text-center text-4xl lg:text-6xl font-extrabold mb-4 lg:mb-8 tracking-tighter"
                        style={{ color: colors.primaryText }}
                    >
                        Comparativa
                    </h1>
                    <div className={`max-w-5xl mx-auto ${showCurrentBill ? 'grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-8' : 'flex justify-center'}`}>
                        {/* Current Company Card */}
                        {showCurrentBill && (
                            <CompanyCard
                                title="COMPAÑÍA"
                                subtitle="ACTUAL"
                                subtitleColor="text-white"
                                borderColor="border-8 border-white ring-4 ring-black"
                                textColor={colors.primaryText}
                            >
                                <Section title={sectionTitlePotencia} color="text-rose-500" textColor={colors.primaryText}>
                                    {currentBillDetails.potencia.map((detail, index) => (
                                        <EditableCostDetail
                                            key={detail.id}
                                            label={detail.label}
                                            value={detail.value}
                                            onLabelChange={(e) => handleDetailChange(setCurrentBillDetails, 'potencia', index, 'label', e.target.value)}
                                            onValueChange={(e) => handleDetailChange(setCurrentBillDetails, 'potencia', index, 'value', e.target.value)}
                                            className={index > 0 ? 'mt-1' : ''}
                                            textColor={colors.primaryText}
                                        />
                                    ))}
                                </Section>
                                <Section title="Energía" color="text-rose-500" textColor={colors.primaryText}>
                                     {currentBillDetails.energia.map((detail, index) => (
                                        <EditableCostDetail
                                            key={detail.id}
                                            label={detail.label}
                                            value={detail.value}
                                            onLabelChange={(e) => handleDetailChange(setCurrentBillDetails, 'energia', index, 'label', e.target.value)}
                                            onValueChange={(e) => handleDetailChange(setCurrentBillDetails, 'energia', index, 'value', e.target.value)}
                                            className={index > 0 ? 'mt-1' : ''}
                                            textColor={colors.primaryText}
                                        />
                                    ))}
                                </Section>
                                <Section title="Impuestos y Extras" color="text-rose-500" textColor={colors.primaryText}>
                                    {currentBillDetails.impuestos.map((detail, index) => (
                                        <EditableCostDetail
                                            key={detail.id}
                                            label={detail.label}
                                            value={detail.value}
                                            onLabelChange={(e) => handleDetailChange(setCurrentBillDetails, 'impuestos', index, 'label', e.target.value)}
                                            onValueChange={(e) => handleDetailChange(setCurrentBillDetails, 'impuestos', index, 'value', e.target.value)}
                                            className={index > 0 ? 'mt-1' : ''}
                                            textColor={colors.primaryText}
                                        />
                                    ))}
                                </Section>
                                <EditableTotalSection color="text-rose-500" total={totalCurrent} onTotalChange={(e) => setTotalCurrent(e.target.value)} textColor={colors.primaryText} />
                            </CompanyCard>
                        )}

                        {/* Best Company Card */}
                        <div className={!showCurrentBill ? 'w-full max-w-lg' : ''}>
                            <CompanyCard
                                title={bestCompanyName}
                                subtitle="COMPAÑÍA"
                                subtitleColor="text-white"
                                borderColor="border-8 border-emerald-500"
                                textColor={colors.primaryText}
                            >
                                <Section title={sectionTitlePotencia} color="text-emerald-500" textColor={colors.primaryText}>
                                    {bestTariffDetails.potencia.map((detail, index) => (
                                        <EditableCostDetail
                                            key={detail.id}
                                            label={detail.label}
                                            value={detail.value}
                                            onLabelChange={(e) => handleDetailChange(setBestTariffDetails, 'potencia', index, 'label', e.target.value)}
                                            onValueChange={(e) => handleDetailChange(setBestTariffDetails, 'potencia', index, 'value', e.target.value)}
                                            className={index > 0 ? 'mt-1' : ''}
                                            textColor={colors.primaryText}
                                        />
                                    ))}
                                </Section>
                                <Section title="Energía" color="text-emerald-500" textColor={colors.primaryText}>
                                    {bestTariffDetails.energia.map((detail, index) => (
                                        <EditableCostDetail
                                            key={detail.id}
                                            label={detail.label}
                                            value={detail.value}
                                            onLabelChange={(e) => handleDetailChange(setBestTariffDetails, 'energia', index, 'label', e.target.value)}
                                            onValueChange={(e) => handleDetailChange(setBestTariffDetails, 'energia', index, 'value', e.target.value)}
                                            className={index > 0 ? 'mt-1' : ''}
                                            textColor={colors.primaryText}
                                        />
                                    ))}
                                </Section>
                                <Section title="Impuestos y Extras" color="text-emerald-500" textColor={colors.primaryText}>
                                    {bestTariffDetails.impuestos.map((detail, index) => (
                                        <EditableCostDetail
                                            key={detail.id}
                                            label={detail.label}
                                            value={detail.value}
                                            onLabelChange={(e) => handleDetailChange(setBestTariffDetails, 'impuestos', index, 'label', e.target.value)}
                                            onValueChange={(e) => handleDetailChange(setBestTariffDetails, 'impuestos', index, 'value', e.target.value)}
                                            className={index > 0 ? 'mt-1' : ''}
                                            textColor={colors.primaryText}
                                        />
                                    ))}
                                </Section>
                                <EditableTotalSection color="text-emerald-500" total={totalBest} onTotalChange={(e) => setTotalBest(e.target.value)} textColor={colors.primaryText} />
                            </CompanyCard>
                        </div>
                    </div>

                    {/* Savings Section */}
                    {showCurrentBill && (
                        <div className="p-4 mt-4 lg:mt-8 max-w-5xl mx-auto flex justify-center items-center gap-6 rounded-md">
                            <p className="text-xl lg:text-3xl font-bold tracking-wider" style={{color: colors.primaryText}}>AHORRO MENSUAL</p>
                            <p className="text-4xl lg:text-6xl font-extrabold" style={{color: colors.primaryText}}>{formatCurrency(monthlySaving)}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Page 3: About Us */}
            <div 
                className="pdf-page aspect-[210/297] shadow-lg rounded-lg p-12 flex flex-col font-sans text-sm"
                style={{ backgroundColor: colors.background, color: colors.primaryText }}
            >
                <header className="flex justify-center mb-6">
                    <div 
                        className="rounded-full px-12 py-3"
                        style={{ backgroundColor: colors.secondaryText }}
                    >
                        <h1 
                            className="text-3xl font-bold"
                            style={{ color: getContrastColor(colors.secondaryText) }}
                        >
                            Sobre nosotros
                        </h1>
                    </div>
                </header>

                <main className="flex-grow grid grid-cols-2 gap-10">
                    <div className="flex flex-col justify-between">
                        <div>
                            <ul className="space-y-2 mb-6">
                                <li className="flex items-center gap-3">
                                    <Check className="w-5 h-5 flex-shrink-0 text-green-500" />
                                    <span className="font-semibold" style={{ color: colors.primaryText }}>Precio fijo 24h / 12 meses</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <Check className="w-5 h-5 flex-shrink-0 text-green-500" />
                                    <span className="font-semibold" style={{ color: colors.primaryText }}>Compromiso ahorro</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <Check className="w-5 h-5 flex-shrink-0 text-green-500" />
                                    <span className="font-semibold" style={{ color: colors.primaryText }}>Sin mantenimientos</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <Check className="w-5 h-5 flex-shrink-0 text-green-500" />
                                    <span className="font-semibold" style={{ color: colors.primaryText }}>Sin permanencias</span>
                                </li>
                            </ul>
                            <div>
                                <h2 className="font-bold text-lg tracking-wider" style={{ color: colors.primaryText }}>VISÍTANOS</h2>
                                <p className="font-semibold" style={{ color: colors.primaryText }}>Calle Virgen de Luján 20</p>
                                <p className="font-semibold" style={{ color: colors.primaryText }}>41011 Sevilla</p>
                                <Image 
                                    data-ai-hint="office building"
                                    src="https://placehold.co/280x180.png"
                                    alt="Oficina Baja Tu Factura"
                                    width={280}
                                    height={180}
                                    className="rounded-lg mt-3 shadow-md object-cover"
                                />
                            </div>
                        </div>
                        <div className="flex items-end gap-4">
                            <div>
                                <p className="text-xl font-bold" style={{ color: colors.primaryText }}>CONOCE</p>
                                <p className="text-xl font-bold" style={{ color: colors.primaryText }}>NUESTRAS</p>
                                <p className="text-xl font-bold" style={{ color: colors.primaryText }}>RESEÑAS</p>
                            </div>
                            <div className="relative">
                                <div 
                                    className="absolute -top-2.5 right-0 text-[10px] font-bold px-1.5 py-0.5 rounded-sm"
                                    style={{ backgroundColor: colors.secondaryText, color: getContrastColor(colors.secondaryText) }}
                                >
                                    ESCANEA AQUÍ
                                </div>
                                <Image
                                    data-ai-hint="QR code"
                                    src="https://placehold.co/100x100.png"
                                    alt="QR Code"
                                    width={100}
                                    height={100}
                                    className="border-4 rounded-lg p-0.5"
                                    style={{ borderColor: colors.secondaryText }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-center pt-4">
                        <h2 className="font-bold text-lg tracking-wider" style={{ color: colors.primaryText }}>TU ASESOR:</h2>
                        <Image
                            data-ai-hint="portrait person"
                            src={userData?.profileImageUri || "https://images.unsplash.com/photo-1633332755192-727a05c4013d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw2fHxwZXJzb25hfGVufDB8fHx8MTc1MTczNTY2OXww&ixlib=rb-4.1.0&q=80&w=1080"}
                            alt={`Asesor ${userData?.name || 'Usuario'}`}
                            width={120}
                            height={120}
                            className="rounded-full my-1.5 object-cover"
                        />
                        <p className="text-3xl font-bold mb-4" style={{ color: colors.primaryText }}>{userData?.name || 'Usuario'}</p>
                        <div className="space-y-2.5 w-full max-w-xs text-center">
                            <div className="rounded-full py-2.5" style={{ backgroundColor: colors.secondaryText }}>
                                <p className="font-bold text-sm" style={{ color: getContrastColor(colors.secondaryText) }}>Asesoramiento GRATIS</p>
                            </div>
                            <div className="rounded-full py-2.5" style={{ backgroundColor: colors.secondaryText }}>
                                <p className="font-bold text-sm" style={{ color: getContrastColor(colors.secondaryText) }}>Asistencia 365 días</p>
                            </div>
                            <div className="rounded-full py-2.5" style={{ backgroundColor: colors.secondaryText }}>
                                <p className="font-bold text-sm" style={{ color: getContrastColor(colors.secondaryText) }}>Recordatorio Renovaciones</p>
                            </div>
                        </div>
                        <div className="text-center mt-4 font-semibold">
                            <p style={{ color: colors.primaryText }}>Contacto: 621 19 36 34</p>
                            <p style={{ color: colors.primaryText }}>Nombre: {userData?.name || 'Usuario'}</p>
                        </div>
                    </div>
                </main>

                <footer className="text-center mt-6 border-t border-gray-300 pt-2">
                    <p className="text-[10px]" style={{ color: colors.primaryText }}>
                        Política Privacidad: <a href="https://bajaturafactura.es/politica-de-privacidad/" className="underline font-semibold" style={{ color: colors.primaryText }}>https://bajaturafactura.es/politica-de-privacidad/</a>
                    </p>
                </footer>
            </div>
        </div>
    );
}
