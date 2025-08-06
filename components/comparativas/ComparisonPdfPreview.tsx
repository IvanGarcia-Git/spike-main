'use client';

import { useState, type ChangeEvent, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Phone, Mail, Globe, Check } from 'lucide-react';
import type { PdfData, CompanyLightTariff, CompanyGasTariff } from '@/lib/types';

const formatCurrency = (value: number) => `${value.toFixed(2).replace('.', ',')}€`;
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

const EditableCostDetail = ({ label, value, onLabelChange, onValueChange, className = '' }: { label: string; value: string; onLabelChange: (e: ChangeEvent<HTMLTextAreaElement>) => void; onValueChange: (e: ChangeEvent<HTMLInputElement>) => void; className?: string }) => {
    const textAreaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (textAreaRef.current) {
            textAreaRef.current.style.height = 'auto';
            textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
        }
    }, [label]);

    return (
        <div className={`flex justify-between items-start text-xs ${className}`}>
            <textarea
                ref={textAreaRef}
                value={label}
                onChange={onLabelChange}
                className="w-full bg-transparent border-none p-0 m-0 focus:ring-1 focus:ring-primary focus:bg-white/50 rounded-sm resize-none text-xs"
                rows={1}
            />
            <input
                type="text"
                value={value}
                onChange={onValueChange}
                className="font-medium bg-transparent border-none p-0 m-0 w-20 text-right focus:ring-1 focus:ring-primary focus:bg-white/50 rounded-sm text-xs"
            />
        </div>
    );
};

const Section = ({ title, color, children }: { title: string; color: string; children: React.ReactNode }) => (
    <div className="mb-6">
        <h4 className={`text-xl font-bold ${color}`}>{title}</h4>
        <div className={`border-t-2 ${color.replace('text-', 'border-').replace('-500', '-400')} w-24 my-2`}></div>
        <div className="space-y-1">{children}</div>
    </div>
);

const EditableTotalSection = ({ color, total, onTotalChange }: { color: string; total: string; onTotalChange: (e: ChangeEvent<HTMLInputElement>) => void }) => (
    <div>
        <div className={`border-t-2 ${color.replace('text-', 'border-').replace('-500', '-400')} w-full my-3`}></div>
        <div className="flex justify-between items-baseline">
            <span className={`text-3xl font-extrabold ${color}`}>Total</span>
             <input
                type="text"
                value={total}
                onChange={onTotalChange}
                className="text-4xl font-extrabold bg-transparent border-none p-0 m-0 w-32 text-right focus:ring-1 focus:ring-primary focus:bg-white/50 rounded-sm"
                style={{ color: 'inherit' }}
            />
        </div>
    </div>
);

const CompanyCard = ({
    title,
    subtitle,
    subtitleColor,
    borderColor,
    children
}: {
    title: string;
    subtitle: string;
    subtitleColor: string;
    borderColor: string;
    children: React.ReactNode;
}) => (
    <div className={`bg-white shadow-lg rounded-md overflow-hidden ${borderColor}`}>
        <div className="bg-black p-4 text-center text-white">
            <h2 className="text-lg font-semibold tracking-widest">{title}</h2>
            <h3 className={`text-4xl font-bold tracking-wider ${subtitleColor}`}>{subtitle}</h3>
        </div>
        <div className="p-6">
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


export default function ComparisonPdfPreview({ pdfData, colors }: ComparisonPdfPreviewProps) {
    const [logos, setLogos] = useState<string[]>([
        'https://placehold.co/80x35.png',
        'https://placehold.co/80x35.png',
        'https://placehold.co/80x35.png',
        'https://placehold.co/80x35.png',
    ]);
    const [headerLine1, setHeaderLine1] = useState('Comparado entre');
    const [headerLine2, setHeaderLine2] = useState('+ 150 compañías');
    
    const [mainLogoSrc, setMainLogoSrc] = useState('/images/logo.svg');
    const [footerLogoSrc, setFooterLogoSrc] = useState('/images/logo.svg');

    const [currentBillDetails, setCurrentBillDetails] = useState<EditableCardData>(initialCurrentBillDetails);
    const [bestTariffDetails, setBestTariffDetails] = useState<EditableCardData>(initialBestTariffDetails);
    const [totalCurrent, setTotalCurrent] = useState('84,64€');
    const [totalBest, setTotalBest] = useState('84,64€');


    useEffect(() => {
        if (pdfData) {
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
                    { id: 'best-rental', label: 'Alquiler Equipos', value: formatCurrency(pdfData.bestTariff.breakdown.equipmentRental!) },
                    { id: 'best-bonus', label: 'Bono Social', value: formatCurrency(pdfData.bestTariff.breakdown.socialBonus!) }
                ];

                if ((bestLightTariff as any).maintenanceCost > 0) {
                    bestImpuestos.push({ id: 'best-maintenance', label: 'Servicios Adicionales', value: formatCurrency((bestLightTariff as any).maintenanceCost) });
                }

                bestImpuestos.push({ id: 'best-tax', label: 'Imp. Electricidad', value: formatCurrency(pdfData.bestTariff.breakdown.electricityTax!) });
                bestImpuestos.push({ id: 'best-vat', label: 'IVA', value: formatCurrency(pdfData.bestTariff.breakdown.vat) });

                setBestTariffDetails({
                    potencia: pdfData.bestTariff.breakdown.powerCosts!.map((cost, i) => ({
                        id: `best-p-cost-${i}`,
                        label: `${potencias[i] || 'X'}kW x ${numDias}dias x ${bestTariffPowerPrices[i] !== undefined ? bestTariffPowerPrices[i].toFixed(3) : `PrecioP${i + 1}`}`,
                        value: formatCurrency(cost)
                    })),
                    energia: [
                        ...pdfData.bestTariff.breakdown.energyCosts!.map((cost, i) => ({
                            id: `best-e-cost-${i}`,
                            label: `${energias[i] || 'X'}kWh x ${bestTariffEnergyPrices[i] !== undefined ? bestTariffEnergyPrices[i].toFixed(3) : `PrecioE${i + 1}`}€/kWh`,
                            value: formatCurrency(cost)
                        })),
                        ...(pdfData.bestTariff.breakdown.surplusCredit! > 0 ? [{
                            id: 'best-surplus',
                            label: `Abono Excedentes: ${excedentes}kWh x ${bestTariffSurplusPrice.toFixed(3)}€/kWh`,
                            value: formatCurrency(-pdfData.bestTariff.breakdown.surplusCredit!)
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
                    { id: 'best-gas-rental', label: 'Alquiler Equipos', value: formatCurrency(pdfData.bestTariff.breakdown.equipmentRental!) },
                ];
                
                if ((bestGasTariff as any).maintenanceCost > 0) {
                    bestImpuestos.push({ id: 'best-gas-maintenance', label: 'Servicios Adicionales', value: formatCurrency((bestGasTariff as any).maintenanceCost) });
                }

                bestImpuestos.push({ id: 'best-gas-tax', label: 'Imp. Hidrocarburos', value: formatCurrency(pdfData.bestTariff.breakdown.hydrocarbonTax!) });
                bestImpuestos.push({ id: 'best-gas-vat', label: 'IVA', value: formatCurrency(pdfData.bestTariff.breakdown.vat) });

                setBestTariffDetails({
                    potencia: [{
                        id: 'best-fixed',
                        label: `Término Fijo: ${numDias}dias x ${bestGasTariff.fixedPrice.toFixed(3)}€/día`,
                        value: formatCurrency(pdfData.bestTariff.breakdown.fixedCost!)
                    }],
                    energia: [{
                        id: 'best-gas-energy',
                        label: `Energía: ${energia}kWh x ${bestGasTariff.energyPrice.toFixed(3)}€/kWh`,
                        value: formatCurrency(pdfData.bestTariff.breakdown.energyCost!)
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

            setTotalBest(formatCurrency(pdfData.bestTariff.totalCost));
            setTotalCurrent(formatCurrency(pdfData.currentBillAmount ?? 0));

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
            };
            reader.readAsDataURL(file);
        }
    };

    const handleMainLogoChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setMainLogoSrc(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleFooterLogoChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFooterLogoSrc(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const showCurrentBill = pdfData?.showCurrentBill ?? true;
    const annualSaving = pdfData ? pdfData.annualSaving : 351;
    const monthlySaving = pdfData ? pdfData.monthlySaving : 27.53;
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
                                onChange={(e) => setHeaderLine1(e.target.value)}
                                className="font-bold bg-transparent border-none p-0 m-0 w-full focus:ring-1 focus:ring-primary focus:bg-white/50 rounded-sm"
                                style={{ color: colors.primaryText }}
                            />
                            <input 
                                type="text"
                                value={headerLine2}
                                onChange={(e) => setHeaderLine2(e.target.value)}
                                className="text-lg font-bold bg-transparent border-none p-0 m-0 w-full focus:ring-1 focus:ring-primary focus:bg-white/50 rounded-sm"
                                style={{ color: colors.primaryText }}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                           {logos.map((logoSrc, index) => (
                                <label key={index} className="cursor-pointer group relative border-2 border-dashed rounded-md p-1 hover:border-primary transition-colors duration-200">
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
                        <label className="cursor-pointer group relative border-2 border-dashed rounded-md p-1 hover:border-primary transition-colors duration-200 block w-64 h-32 mx-auto my-12">
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
                        
                        <label className="cursor-pointer group relative border-2 border-dashed rounded-md p-1 hover:border-primary transition-colors duration-200 block w-80 h-16 mx-auto">
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
                    <h1 className="text-5xl font-bold">{pdfData?.clientName || 'Marcos'},</h1>
                    <h2 className="text-4xl">aquí tienes tu comparativa</h2>
                    <p className="text-green-500 text-4xl font-bold mt-6">{formatCurrency(annualSaving)} Ahorro Anual</p>
                </footer>
            </div>

            {/* Page 2: Content */}
            <div 
                className="pdf-page aspect-[210/297] p-8 font-sans rounded-lg flex flex-col justify-center"
                style={{ backgroundColor: colors.background }}
            >
                <div className="w-full">
                    <h1 
                        className="text-center text-4xl lg:text-6xl font-extrabold mb-4 lg:mb-8 tracking-tighter"
                        style={{ color: colors.secondaryText }}
                    >
                        Comparativa
                    </h1>
                    <div className={`max-w-5xl mx-auto ${showCurrentBill ? 'grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-8' : 'flex justify-center'}`}>
                        {/* Current Company Card */}
                        {showCurrentBill && (
                            <CompanyCard
                                title="COMPAÑÍA"
                                subtitle="ACTUAL"
                                subtitleColor="text-rose-500"
                                borderColor="border-8 border-white ring-4 ring-black"
                            >
                                <Section title={sectionTitlePotencia} color="text-rose-500">
                                    {currentBillDetails.potencia.map((detail, index) => (
                                        <EditableCostDetail
                                            key={detail.id}
                                            label={detail.label}
                                            value={detail.value}
                                            onLabelChange={(e) => handleDetailChange(setCurrentBillDetails, 'potencia', index, 'label', e.target.value)}
                                            onValueChange={(e) => handleDetailChange(setCurrentBillDetails, 'potencia', index, 'value', e.target.value)}
                                            className={index > 0 ? 'mt-1' : ''}
                                        />
                                    ))}
                                </Section>
                                <Section title="Energía" color="text-rose-500">
                                     {currentBillDetails.energia.map((detail, index) => (
                                        <EditableCostDetail
                                            key={detail.id}
                                            label={detail.label}
                                            value={detail.value}
                                            onLabelChange={(e) => handleDetailChange(setCurrentBillDetails, 'energia', index, 'label', e.target.value)}
                                            onValueChange={(e) => handleDetailChange(setCurrentBillDetails, 'energia', index, 'value', e.target.value)}
                                            className={index > 0 ? 'mt-1' : ''}
                                        />
                                    ))}
                                </Section>
                                <Section title="Impuestos y Extras" color="text-rose-500">
                                    {currentBillDetails.impuestos.map((detail, index) => (
                                        <EditableCostDetail
                                            key={detail.id}
                                            label={detail.label}
                                            value={detail.value}
                                            onLabelChange={(e) => handleDetailChange(setCurrentBillDetails, 'impuestos', index, 'label', e.target.value)}
                                            onValueChange={(e) => handleDetailChange(setCurrentBillDetails, 'impuestos', index, 'value', e.target.value)}
                                            className={index > 0 ? 'mt-1' : ''}
                                        />
                                    ))}
                                </Section>
                                <EditableTotalSection color="text-rose-500" total={totalCurrent} onTotalChange={(e) => setTotalCurrent(e.target.value)} />
                            </CompanyCard>
                        )}

                        {/* Best Company Card */}
                        <div className={!showCurrentBill ? 'w-full max-w-lg' : ''}>
                            <CompanyCard
                                title={bestCompanyName}
                                subtitle="COMPAÑÍA"
                                subtitleColor="text-emerald-500"
                                borderColor="border-8 border-emerald-500"
                            >
                                <Section title={sectionTitlePotencia} color="text-emerald-500">
                                    {bestTariffDetails.potencia.map((detail, index) => (
                                        <EditableCostDetail
                                            key={detail.id}
                                            label={detail.label}
                                            value={detail.value}
                                            onLabelChange={(e) => handleDetailChange(setBestTariffDetails, 'potencia', index, 'label', e.target.value)}
                                            onValueChange={(e) => handleDetailChange(setBestTariffDetails, 'potencia', index, 'value', e.target.value)}
                                            className={index > 0 ? 'mt-1' : ''}
                                        />
                                    ))}
                                </Section>
                                <Section title="Energía" color="text-emerald-500">
                                    {bestTariffDetails.energia.map((detail, index) => (
                                        <EditableCostDetail
                                            key={detail.id}
                                            label={detail.label}
                                            value={detail.value}
                                            onLabelChange={(e) => handleDetailChange(setBestTariffDetails, 'energia', index, 'label', e.target.value)}
                                            onValueChange={(e) => handleDetailChange(setBestTariffDetails, 'energia', index, 'value', e.target.value)}
                                            className={index > 0 ? 'mt-1' : ''}
                                        />
                                    ))}
                                </Section>
                                <Section title="Impuestos y Extras" color="text-emerald-500">
                                    {bestTariffDetails.impuestos.map((detail, index) => (
                                        <EditableCostDetail
                                            key={detail.id}
                                            label={detail.label}
                                            value={detail.value}
                                            onLabelChange={(e) => handleDetailChange(setBestTariffDetails, 'impuestos', index, 'label', e.target.value)}
                                            onValueChange={(e) => handleDetailChange(setBestTariffDetails, 'impuestos', index, 'value', e.target.value)}
                                            className={index > 0 ? 'mt-1' : ''}
                                        />
                                    ))}
                                </Section>
                                <EditableTotalSection color="text-emerald-500" total={totalBest} onTotalChange={(e) => setTotalBest(e.target.value)} />
                            </CompanyCard>
                        </div>
                    </div>

                    {/* Savings Section */}
                    {showCurrentBill && (
                        <div className="p-4 mt-4 lg:mt-8 max-w-5xl mx-auto flex justify-center items-center gap-6 rounded-md">
                            <p className="text-xl lg:text-3xl font-bold tracking-wider" style={{color: colors.primaryText}}>AHORRO MENSUAL</p>
                            <p className="text-4xl lg:text-6xl font-extrabold text-emerald-500">{formatCurrency(monthlySaving)}</p>
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
                                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                                    <span className="font-semibold">Precio fijo 24h / 12 meses</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                                    <span className="font-semibold">Compromiso ahorro</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                                    <span className="font-semibold">Sin mantenimientos</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                                    <span className="font-semibold">Sin permanencias</span>
                                </li>
                            </ul>
                            <div>
                                <h2 className="font-bold text-lg tracking-wider" style={{ color: colors.secondaryText }}>VISÍTANOS</h2>
                                <p className="font-semibold">Calle Virgen de Luján 20</p>
                                <p className="font-semibold">41011 Sevilla</p>
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
                                <p className="text-xl font-bold">CONOCE</p>
                                <p className="text-xl font-bold" style={{ color: colors.secondaryText }}>NUESTRAS</p>
                                <p className="text-xl font-bold">RESEÑAS</p>
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
                        <h2 className="font-bold text-lg tracking-wider">TU ASESOR:</h2>
                        <Image
                            data-ai-hint="portrait person"
                            src="https://images.unsplash.com/photo-1633332755192-727a05c4013d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw2fHxwZXJzb25hfGVufDB8fHx8MTc1MTczNTY2OXww&ixlib=rb-4.1.0&q=80&w=1080"
                            alt="Asesor Sergio"
                            width={120}
                            height={120}
                            className="rounded-full my-1.5 object-cover"
                        />
                        <p className="text-3xl font-bold mb-4">Sergio</p>
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
                            <p>Contacto: 621 19 36 34</p>
                            <p>Mail: estudio@bajaturafactura.es</p>
                        </div>
                    </div>
                </main>

                <footer className="text-center mt-6 border-t border-gray-300 pt-2">
                    <p className="text-[10px] text-gray-700">
                        Política Privacidad: <a href="https://bajaturafactura.es/politica-de-privacidad/" className="underline font-semibold">https://bajaturafactura.es/politica-de-privacidad/</a>
                    </p>
                </footer>
            </div>
        </div>
    );
}
