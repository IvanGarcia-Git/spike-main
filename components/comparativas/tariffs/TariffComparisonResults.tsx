'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { TariffComparisonResult, PdfData, ComparisonType, CompanyLightTariff, CompanyGasTariff, BillBreakdown, CompanyTariff } from '@/lib/types';
import { Award, ChevronDown, Download, Info } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { createComparativa, updateComparativa } from '@/helpers/server-fetch.helper';
import { useToast } from '@/hooks/use-toast';

interface TariffComparisonResultsProps {
  tariffs: CompanyTariff[];
  formData: any;
  initialRegulatedCosts: {
    ihp?: number;
    alquiler: number;
    social?: number;
    hydrocarbon?: number;
    iva: number;
  };
}


const formatCurrency = (value: number) => `${value.toFixed(2)} €`;

/** Calcula el desglose de la factura actual de luz con los precios unitarios del cliente. */
const calculateCurrentLightBillBreakdown = (
  formData: any,
  regulatedCosts: { ihp?: number; alquiler: number; social?: number; iva: number }
): BillBreakdown | null => {
  const { potencias, energias, numDias, solarPanelActive, excedentes, clientPowerPrices, clientEnergyPrices, clientSurplusPrice, clientMaintenanceCost } = formData;
  
  if (!potencias || !energias || !numDias || !clientPowerPrices || !clientEnergyPrices) return null;

  const powerCosts = potencias.map((p: number, i: number) => {
    const price = clientPowerPrices?.[i] ?? clientPowerPrices?.[clientPowerPrices.length - 1] ?? 0;
    return p * price * numDias;
  });

  const energyCosts = energias.map((e: number, i: number) => {
    const price = clientEnergyPrices?.[i] ?? clientEnergyPrices?.[clientEnergyPrices.length - 1] ?? 0;
    return e * price;
  });

  const surplusCredit = solarPanelActive && excedentes ? excedentes * (clientSurplusPrice ?? 0) : 0;
  const equipmentRental = numDias * (regulatedCosts.alquiler || 0);
  const socialBonus = numDias * (regulatedCosts.social || 0);
  const maintenanceCost = clientMaintenanceCost ?? 0;

  const baseForTax = powerCosts.reduce((a: number, b: number) => a + b, 0) + energyCosts.reduce((a: number, b: number) => a + b, 0) - surplusCredit + equipmentRental + socialBonus + maintenanceCost;
  const electricityTax = baseForTax > 0 ? baseForTax * ((regulatedCosts.ihp || 0) / 100) : 0;
  
  const baseIVA = baseForTax + electricityTax;
  const vat = baseIVA > 0 ? baseIVA * ((regulatedCosts.iva || 0) / 100) : 0;

  return {
    powerCosts,
    energyCosts,
    surplusCredit,
    socialBonus,
    equipmentRental,
    maintenanceCost,
    electricityTax,
    vat,
  };
};

/** Calcula el desglose de la factura actual de gas con los precios unitarios del cliente. */
const calculateCurrentGasBillBreakdown = (
  formData: any,
  regulatedCosts: { hydrocarbon?: number; alquiler: number; iva: number }
): BillBreakdown | null => {
  const { energia, numDias, clientFixedPrice, clientGasEnergyPrice, clientMaintenanceCost } = formData;
  
  if (!energia || !numDias || clientFixedPrice === undefined || clientGasEnergyPrice === undefined) return null;

  const fixedCost = clientFixedPrice * numDias;
  const energyCost = energia * clientGasEnergyPrice;
  const equipmentRental = numDias * (regulatedCosts.alquiler || 0);
  const maintenanceCost = clientMaintenanceCost ?? 0;
  const hydrocarbonTax = energia * (regulatedCosts.hydrocarbon || 0);

  const baseForTax = fixedCost + energyCost + equipmentRental + hydrocarbonTax + maintenanceCost;
  const vat = baseForTax > 0 ? baseForTax * ((regulatedCosts.iva || 0) / 100) : 0;

  return {
    fixedCost,
    energyCost,
    equipmentRental,
    maintenanceCost,
    hydrocarbonTax,
    vat,
  };
};

const BreakdownDetail = ({ label, value }: { label: string, value: string }) => (
    <div className="flex justify-between py-1 border-b border-muted last:border-b-0">
        <p className="text-muted-foreground text-xs">{label}</p>
        <p className="font-medium text-xs">{value}</p>
    </div>
);

const LightBreakdown = ({ breakdown }: { breakdown: BillBreakdown }) => (
  <>
    <div className="space-y-1">
        {breakdown.powerCosts?.map((cost, i) => (
            <BreakdownDetail key={`p-${i}`} label={`Coste Potencia P${i + 1}`} value={formatCurrency(cost)} />
        ))}
        {breakdown.energyCosts?.map((cost, i) => (
            <BreakdownDetail key={`e-${i}`} label={`Coste Energía E${i + 1}`} value={formatCurrency(cost)} />
        ))}
    </div>
    <div className="space-y-1">
        {breakdown.surplusCredit && breakdown.surplusCredit > 0 && <BreakdownDetail label="Abono Excedentes" value={formatCurrency(-breakdown.surplusCredit)} />}
        {breakdown.socialBonus !== undefined && <BreakdownDetail label="Bono Social" value={formatCurrency(breakdown.socialBonus)} />}
        <BreakdownDetail label="Alquiler Equipos" value={formatCurrency(breakdown.equipmentRental ?? 0)} />
        {breakdown.maintenanceCost && breakdown.maintenanceCost > 0 && <BreakdownDetail label="Servicios Adicionales" value={formatCurrency(breakdown.maintenanceCost)} />}
        {breakdown.electricityTax !== undefined && <BreakdownDetail label="Imp. Electricidad" value={formatCurrency(breakdown.electricityTax)} />}
        <BreakdownDetail label="IVA" value={formatCurrency(breakdown.vat)} />
    </div>
  </>
);

const GasBreakdown = ({ breakdown }: { breakdown: BillBreakdown }) => (
  <>
    <div className="space-y-1">
      {breakdown.fixedCost !== undefined && <BreakdownDetail label="Coste Término Fijo" value={formatCurrency(breakdown.fixedCost)} />}
      {breakdown.energyCost !== undefined && <BreakdownDetail label="Coste Energía" value={formatCurrency(breakdown.energyCost)} />}
    </div>
    <div className="space-y-1">
        <BreakdownDetail label="Alquiler Equipos" value={formatCurrency(breakdown.equipmentRental ?? 0)} />
        {breakdown.maintenanceCost && breakdown.maintenanceCost > 0 && <BreakdownDetail label="Servicios Adicionales" value={formatCurrency(breakdown.maintenanceCost)} />}
        {breakdown.hydrocarbonTax !== undefined && <BreakdownDetail label="Imp. Hidrocarburos" value={formatCurrency(breakdown.hydrocarbonTax)} />}
        <BreakdownDetail label="IVA" value={formatCurrency(breakdown.vat)} />
    </div>
  </>
);


const EditableRegulatedCostItem = ({ label, value, unit, onChange, name }: { label: string, value?: number, unit: string, onChange: (name: string, value: number) => void, name: string }) => {
    if (value === undefined) return null;

    const [editingValue, setEditingValue] = useState(value.toString());

    useEffect(() => {
        setEditingValue(value.toString());
    }, [value]);

    const handleBlur = () => {
        const numValue = parseFloat(editingValue);
        if (!isNaN(numValue) && numValue !== value) {
            onChange(name, numValue);
        }
    };
    
    return (
        <div className="flex flex-col items-center justify-center p-2 rounded-md bg-slate-100 dark:bg-slate-800 text-center">
            <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
            <div className="flex items-center">
                <Input
                    type="number"
                    step="any"
                    value={editingValue}
                    onChange={(e) => setEditingValue(e.target.value)}
                    onBlur={handleBlur}
                    className="font-bold text-center h-7 p-1 w-20 bg-transparent border-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:bg-background"
                />
                 <span className="font-bold text-sm">{unit}</span>
            </div>
        </div>
    )
};

const RegulatedCosts = ({ costs, type, onCostChange }: { costs: TariffComparisonResultsProps['initialRegulatedCosts'], type: ComparisonType, onCostChange: (name: string, value: number) => void }) => (
    <Collapsible>
        <Card className="mb-6 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
            <CollapsibleTrigger asChild>
                <CardHeader className="p-4 cursor-pointer">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Info className="h-4 w-4 text-muted-foreground" />
                            <CardTitle className="text-base">Costes Regulados Aplicados</CardTitle>
                        </div>
                        <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" />
                    </div>
                </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
                <CardContent className="p-4 pt-0">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 text-sm">
                        <EditableRegulatedCostItem name="alquiler" label="Alquiler Equipos" value={costs.alquiler} unit=" €/día" onChange={onCostChange} />
                        <EditableRegulatedCostItem name="iva" label="IVA" value={costs.iva} unit="%" onChange={onCostChange} />
                        {type === 'luz' && (
                            <>
                                <EditableRegulatedCostItem name="ihp" label="Imp. Eléctrico" value={costs.ihp} unit="%" onChange={onCostChange} />
                                <EditableRegulatedCostItem name="social" label="Bono Social" value={costs.social} unit=" €/día" onChange={onCostChange} />
                            </>
                        )}
                        {type === 'gas' && (
                            <EditableRegulatedCostItem name="hydrocarbon" label="Imp. Hidrocarburos" value={costs.hydrocarbon} unit=" €/kWh" onChange={onCostChange} />
                        )}
                    </div>
                </CardContent>
            </CollapsibleContent>
        </Card>
    </Collapsible>
);

export default function TariffComparisonResults(props: TariffComparisonResultsProps) {
    const { tariffs, formData, initialRegulatedCosts } = props;
    const { currentBillAmount, numDias, clientName, showCurrentBill, comparisonType } = formData;
    const router = useRouter();
    const { toast } = useToast();

    const [regulatedCosts, setRegulatedCosts] = useState(initialRegulatedCosts);
    const [results, setResults] = useState<TariffComparisonResult[]>([]);
    const [openRowId, setOpenRowId] = useState<string | null>(null);
    const [comparativaSaved, setComparativaSaved] = useState(false);
    // Paginación de resultados: arranca mostrando 5 y amplía de 5 en 5.
    const PAGE_SIZE = 5;
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    useEffect(() => { setVisibleCount(PAGE_SIZE); }, [results.length]);


    const handleRegulatedCostChange = (name: string, value: number) => {
        setRegulatedCosts(prev => ({...prev, [name]: value}));
    }

    const calculateLightTariffCosts = useCallback((
      tariff: CompanyLightTariff,
      potencias: number[],
      energias: number[],
      excedentes: number,
      dias: number,
      isSolar: boolean,
      currentRegulatedCosts: typeof regulatedCosts
    ): { totalCost: number; breakdown: BillBreakdown } => {
      const { powerPrices, energyPrices, surplusPrice } = tariff;
      const maintenanceCost = (tariff as any).maintenanceCost ?? 0;

      const powerCosts = potencias.map((p, i) => {
        const price = powerPrices[i] ?? powerPrices[powerPrices.length - 1];
        return p * price * dias;
      });
      const costePotencia = powerCosts.reduce((acc, cost) => acc + cost, 0);

      const energyCosts = energias.map((e, i) => {
        const price = energyPrices[i] ?? energyPrices[energyPrices.length - 1];
        return e * price;
      });
      const costeEnergia = energyCosts.reduce((acc, cost) => acc + cost, 0);

      const surplusCredit = isSolar ? excedentes * surplusPrice : 0;
      const equipmentRental = dias * (currentRegulatedCosts.alquiler || 0);
      const socialBonus = dias * (currentRegulatedCosts.social || 0);

      const baseForTax = costePotencia + costeEnergia - surplusCredit + equipmentRental + socialBonus;
      const electricityTax = baseForTax > 0 ? baseForTax * ((currentRegulatedCosts.ihp || 0) / 100) : 0;
      
      const baseIVA = baseForTax + electricityTax + maintenanceCost;
      const vat = baseIVA > 0 ? baseIVA * ((currentRegulatedCosts.iva || 0) / 100) : 0;
      
      const totalCost = baseIVA + vat;

      return {
        totalCost: totalCost > 0 ? totalCost : 0,
        breakdown: {
          powerCosts,
          energyCosts,
          surplusCredit,
          socialBonus,
          equipmentRental,
          maintenanceCost,
          electricityTax,
          vat,
        },
      };
    }, []);

    const calculateGasTariffCosts = useCallback((
      tariff: CompanyGasTariff,
      energia: number,
      dias: number,
      currentRegulatedCosts: typeof regulatedCosts
    ): { totalCost: number; breakdown: BillBreakdown } => {
        const { fixedPrice, energyPrice } = tariff;
        const maintenanceCost = (tariff as any).maintenanceCost ?? 0;
        
        const fixedCost = fixedPrice * dias;
        const energyCost = energia * energyPrice;
        
        const equipmentRental = dias * (currentRegulatedCosts.alquiler || 0);
        
        const hydrocarbonTax = energia * (currentRegulatedCosts.hydrocarbon || 0);

        const baseForTax = fixedCost + energyCost + equipmentRental + hydrocarbonTax;
        const baseIVA = baseForTax + maintenanceCost;
        const vat = baseIVA > 0 ? baseIVA * ((currentRegulatedCosts.iva || 0) / 100) : 0;
        const totalCost = baseIVA + vat;

        return {
            totalCost: totalCost > 0 ? totalCost : 0,
            breakdown: {
                fixedCost,
                energyCost,
                equipmentRental,
                maintenanceCost,
                hydrocarbonTax,
                vat,
            },
        };
    }, []);

    useEffect(() => {
        const processedTariffs = tariffs.map(t => ({
            ...t,
            maintenanceCost: formData.hasMainServices ? formData.mainMaintenanceCost : 0,
        }));

        let newResults: TariffComparisonResult[] = [];
        if (comparisonType === 'luz') {
            newResults = processedTariffs
                .map(tariff => {
                    const { totalCost, breakdown } = calculateLightTariffCosts(
                        tariff as CompanyLightTariff,
                        formData.potencias,
                        formData.energias,
                        formData.excedentes,
                        formData.numDias,
                        formData.solarPanelActive,
                        regulatedCosts
                    );
                    return { tariff, totalCost, breakdown };
                })
                .sort((a, b) => a.totalCost - b.totalCost);
        } else { // gas
            newResults = processedTariffs
                .map(tariff => {
                    const { totalCost, breakdown } = calculateGasTariffCosts(
                        tariff as CompanyGasTariff,
                        formData.energia,
                        formData.numDias,
                        regulatedCosts
                    );
                    return { tariff, totalCost, breakdown };
                })
                .sort((a, b) => a.totalCost - b.totalCost);
        }
        setResults(newResults);
    }, [tariffs, formData, regulatedCosts, calculateLightTariffCosts, calculateGasTariffCosts, comparisonType]);

    // Save comparativa to backend when results are calculated
    useEffect(() => {
        const saveComparativa = async () => {
            if (results.length > 0 && !comparativaSaved) {
                try {
                    // Get JWT token from cookies
                    const cookies = document.cookie.split(';');
                    const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('factura-token='));
                    const token = tokenCookie ? tokenCookie.split('=')[1] : null;

                    if (!token) {
                        console.log('No token available for saving comparativa');
                        return;
                    }

                    // Get the best tariff (first in sorted results)
                    const bestResult = results[0];
                    
                    const comparativaData = {
                        ...formData,
                        tariffType: formData.selectedLightTariff || formData.selectedGasTariff || 'N/A',
                        calculatedOldPrice: currentBillAmount,
                        calculatedNewPrice: bestResult.totalCost,
                        savings: currentBillAmount - bestResult.totalCost,
                        calculationDetails: JSON.stringify({
                            formData,
                            results: results.slice(0, 3), // Save top 3 results
                            regulatedCosts,
                            timestamp: new Date().toISOString(),
                        }),
                    };

                    // En modo edición (formData.id) actualiza la comparativa
                    // existente (PUT); si no, crea una nueva (POST).
                    const response = formData.id
                        ? await updateComparativa(formData.id, comparativaData, token)
                        : await createComparativa(comparativaData, token);

                    if (response && response.ok) {
                        const savedComparativa = await response.json();
                        console.log('Comparativa saved successfully:', savedComparativa);
                        setComparativaSaved(true);
                        toast({
                            title: formData.id ? "Comparativa actualizada" : "Comparativa guardada",
                            description: formData.id
                                ? "Los cambios se han guardado correctamente."
                                : "La comparativa se ha guardado correctamente en tu historial.",
                        });
                    } else {
                        console.error('Failed to save comparativa');
                        toast({
                            title: "Error al guardar",
                            description: "No se pudo guardar la comparativa. Por favor, intenta de nuevo.",
                            variant: "destructive",
                        });
                    }
                } catch (error) {
                    console.error('Error saving comparativa:', error);
                    toast({
                        title: "Error",
                        description: "Ocurrió un error al guardar la comparativa.",
                        variant: "destructive",
                    });
                }
            }
        };

        saveComparativa();
    }, [results, comparativaSaved, formData, currentBillAmount, regulatedCosts, toast]);


    if (results.length === 0) {
        return (
            <Card className="mt-8">
                <CardHeader>
                    <CardTitle>No se encontraron resultados</CardTitle>
                    <CardDescription>No hay tarifas que coincidan con los criterios de búsqueda. Prueba a cambiar las opciones en el formulario.</CardDescription>
                </CardHeader>
                 <CardContent>
                    <Button onClick={() => router.push('/')}>Volver al Inicio</Button>
                </CardContent>
            </Card>
        )
    }

    const handleDownload = (result: TariffComparisonResult, annualSaving: number) => {
      const monthlySaving = annualSaving / 12;

      // Solo enviamos los precios de la tarifa actual si la factura aportó datos reales;
      // así la previsualización muestra el desglose de la "tarifa antigua" cuando hay datos
      // extraídos y cae al placeholder cuando no los hay (en vez de pintar ceros).
      const hasPrices = (arr?: number[]) => Array.isArray(arr) && arr.some((n) => n > 0);
      const clientPrices = {
        power: hasPrices(formData.clientPowerPrices) ? formData.clientPowerPrices : undefined,
        energy: hasPrices(formData.clientEnergyPrices) ? formData.clientEnergyPrices : undefined,
        surplus: formData.clientSurplusPrice,
        fixed: formData.clientFixedPrice ? formData.clientFixedPrice : undefined,
        variable: formData.clientGasEnergyPrice ? formData.clientGasEnergyPrice : undefined,
        maintenance: formData.clientMaintenanceCost,
      }

      const data: PdfData = {
          bestTariff: result,
          currentBillAmount,
          annualSaving,
          monthlySaving,
          clientName,
          showCurrentBill,
          comparisonType,
          cups: formData.cups,
          comercializadora: formData.comercializadora,
          tariffType: formData.selectedLightTariff || formData.selectedGasTariff,
          potencias: formData.potencias,
          energias: formData.energias,
          excedentes: formData.excedentes,
          energia: formData.energia,
          numDias,
          clientPrices: clientPrices,
          regulatedCosts: regulatedCosts,
      };

      sessionStorage.setItem('pdfDataForGeneration', JSON.stringify(data));
      router.push('/comparativas/personalizada');
    };

    const isLight = comparisonType === 'luz';

    return (
        <Card className="mt-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm">
            <CardHeader>
                <CardTitle className="text-slate-800 dark:text-slate-100">Resultados de la Comparativa</CardTitle>
                <CardDescription className="text-slate-500 dark:text-slate-400">Tarifas ordenadas de la más económica a la más cara, según los datos introducidos.</CardDescription>
            </CardHeader>
            <CardContent>
                <RegulatedCosts costs={regulatedCosts} type={comparisonType} onCostChange={handleRegulatedCostChange}/>
                
                {/* Tarjetas comparativas: Factura Actual vs Mejor Alternativa */}
                {results.length > 0 && showCurrentBill && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {/* Factura Actual */}
                    <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold text-red-700 dark:text-red-400">FACTURA ACTUAL</CardTitle>
                        <CardDescription className="text-xs text-red-600 dark:text-red-500">Desglose de tu factura actual</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {(() => {
                          const currentBreakdown = comparisonType === 'luz'
                            ? calculateCurrentLightBillBreakdown(formData, regulatedCosts)
                            : calculateCurrentGasBillBreakdown(formData, regulatedCosts);
                          
                          if (!currentBreakdown) {
                            return <p className="text-sm text-muted-foreground">Sin datos de precios unitarios de la factura actual</p>;
                          }
                          
                          return (
                            <div className="space-y-3">
                              <div className="flex justify-between items-center pb-2 border-b border-red-200 dark:border-red-800">
                                <span className="text-xs font-medium text-red-700 dark:text-red-400">TOTAL</span>
                                <span className="text-lg font-bold text-red-700 dark:text-red-400">{formatCurrency(currentBillAmount)}</span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                {comparisonType === 'luz' ? (
                                  <>
                                    {currentBreakdown.powerCosts?.map((cost, i) => (
                                      <div key={`curr-p${i}`} className="flex justify-between">
                                        <span className="text-muted-foreground">Potencia P{i + 1}</span>
                                        <span className="font-medium">{formatCurrency(cost)}</span>
                                      </div>
                                    ))}
                                    {currentBreakdown.energyCosts?.map((cost, i) => (
                                      <div key={`curr-e${i}`} className="flex justify-between">
                                        <span className="text-muted-foreground">Energía E{i + 1}</span>
                                        <span className="font-medium">{formatCurrency(cost)}</span>
                                      </div>
                                    ))}
                                    {currentBreakdown.surplusCredit && currentBreakdown.surplusCredit > 0 && (
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Excedentes</span>
                                        <span className="font-medium text-green-600">-{formatCurrency(currentBreakdown.surplusCredit)}</span>
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Término Fijo</span>
                                      <span className="font-medium">{formatCurrency(currentBreakdown.fixedCost || 0)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Energía</span>
                                      <span className="font-medium">{formatCurrency(currentBreakdown.energyCost || 0)}</span>
                                    </div>
                                  </>
                                )}
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Alquiler equipos</span>
                                  <span className="font-medium">{formatCurrency(currentBreakdown.equipmentRental || 0)}</span>
                                </div>
                                {currentBreakdown.socialBonus && currentBreakdown.socialBonus > 0 && (
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Bono social</span>
                                    <span className="font-medium">{formatCurrency(currentBreakdown.socialBonus)}</span>
                                  </div>
                                )}
                                {currentBreakdown.maintenanceCost && currentBreakdown.maintenanceCost > 0 && (
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Mantenimiento</span>
                                    <span className="font-medium">{formatCurrency(currentBreakdown.maintenanceCost)}</span>
                                  </div>
                                )}
                                {currentBreakdown.electricityTax !== undefined && (
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Imp. Electricidad</span>
                                    <span className="font-medium">{formatCurrency(currentBreakdown.electricityTax)}</span>
                                  </div>
                                )}
                                {currentBreakdown.hydrocarbonTax !== undefined && (
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Imp. Hidrocarburos</span>
                                    <span className="font-medium">{formatCurrency(currentBreakdown.hydrocarbonTax)}</span>
                                  </div>
                                )}
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">IVA</span>
                                  <span className="font-medium">{formatCurrency(currentBreakdown.vat || 0)}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </CardContent>
                    </Card>

                    {/* Mejor Alternativa */}
                    <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold text-green-700 dark:text-green-400">MEJOR ALTERNATIVA</CardTitle>
                        <CardDescription className="text-xs text-green-600 dark:text-green-500">{results[0].tariff.companyName} - {results[0].tariff.tariffName}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center pb-2 border-b border-green-200 dark:border-green-800">
                            <span className="text-xs font-medium text-green-700 dark:text-green-400">TOTAL</span>
                            <span className="text-lg font-bold text-green-700 dark:text-green-400">{formatCurrency(results[0].totalCost)}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            {comparisonType === 'luz' ? (
                              <LightBreakdown breakdown={results[0].breakdown} />
                            ) : (
                              <GasBreakdown breakdown={results[0].breakdown} />
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
                <div className="rounded-md border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <Table className="[&_tr]:border-slate-200 dark:[&_tr]:border-slate-700">
                        <TableHeader className="bg-slate-50 dark:bg-slate-800">
                            <TableRow className="[&>th]:text-slate-600 dark:[&>th]:text-slate-300">
                                <TableHead className="w-[80px]">#</TableHead>
                                <TableHead>Compañía</TableHead>
                                <TableHead>Tarifa</TableHead>
                                {isLight ? (
                                  <>
                                    <TableHead>P. Potencia</TableHead>
                                    <TableHead>P. Energía</TableHead>
                                    <TableHead>P. Excedente</TableHead>
                                  </>
                                ) : (
                                  <>
                                    <TableHead>P. Fijo (€/día)</TableHead>
                                    <TableHead>P. Energía (€/kWh)</TableHead>
                                  </>
                                )}
                                <TableHead className="text-right">Coste Total</TableHead>
                                <TableHead className="text-right">Ahorro</TableHead>
                                <TableHead className="text-right">% Ahorro</TableHead>
                                <TableHead className="text-right">Ahorro Anual</TableHead>
                                <TableHead className="w-[240px] text-center">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                        {results.slice(0, visibleCount).map(({ tariff, totalCost, breakdown }, index) => {
                            const saving = currentBillAmount > 0 ? currentBillAmount - totalCost : 0;
                            const savingPercentage = currentBillAmount > 0 && saving > 0 ? (saving / currentBillAmount) * 100 : 0;
                            const annualSaving = currentBillAmount > 0 && numDias > 0 ? (saving / numDias) * 365 : 0;
                            
                            const lightTariff = tariff as CompanyLightTariff;
                            const gasTariff = tariff as CompanyGasTariff;

                            const isOpen = openRowId === tariff.id;

                            return (
                                <React.Fragment key={tariff.id}>
                                    <TableRow className={index === 0 ? "bg-primary/10 hover:bg-primary/10" : "hover:bg-slate-50 dark:hover:bg-slate-800/50"} data-state={isOpen ? 'open' : 'closed'}>
                                        <TableCell>
                                            <div className="flex items-center gap-2 font-bold">
                                                <span>{index + 1}</span>
                                                {index === 0 && (
                                                    <Badge variant="default" className="bg-amber-500 text-white hover:bg-amber-600">
                                                        <Award className="mr-1 h-3 w-3" />
                                                        Mejor
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium">{tariff.companyName}</TableCell>
                                        <TableCell>{tariff.tariffName}</TableCell>
                                        {isLight ? (
                                          <>
                                            <TableCell className="text-xs">{lightTariff.powerPrices.join(', ')}</TableCell>
                                            <TableCell className="text-xs">{lightTariff.energyPrices.join(', ')}</TableCell>
                                            <TableCell>{lightTariff.surplusPrice.toFixed(3)}</TableCell>
                                          </>
                                        ) : (
                                          <>
                                            <TableCell>{gasTariff.fixedPrice.toFixed(4)}</TableCell>
                                            <TableCell>{gasTariff.energyPrice.toFixed(4)}</TableCell>
                                          </>
                                        )}
                                        <TableCell className="text-right font-bold">{formatCurrency(totalCost)}</TableCell>
                                        <TableCell className="text-right font-bold">
                                          {currentBillAmount > 0 && (
                                            <span className={saving >= 0 ? 'text-green-600' : 'text-red-600'}>
                                              {formatCurrency(saving)}
                                            </span>
                                          )}
                                        </TableCell>
                                        <TableCell className="text-right font-bold">
                                          {currentBillAmount > 0 && (
                                            <span className={savingPercentage > 0 ? 'text-green-600' : ''}>
                                              {savingPercentage.toFixed(2)}%
                                            </span>
                                          )}
                                        </TableCell>
                                        <TableCell className="text-right font-bold">
                                          {currentBillAmount > 0 && (
                                            <span className={annualSaving >= 0 ? 'text-green-600' : 'text-red-600'}>
                                              {formatCurrency(annualSaving)}
                                            </span>
                                          )}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={() => setOpenRowId(isOpen ? null : tariff.id)}
                                                >
                                                  Ver detalles
                                                  <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDownload({ tariff, totalCost, breakdown }, annualSaving)}>
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                    {isOpen && (
                                      <TableRow className="bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                          <TableCell colSpan={isLight ? 11 : 10} className="p-0">
                                              <div className="p-4">
                                                  <h4 className="text-md font-semibold mb-2">Desglose de Factura</h4>
                                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                                                    {isLight ? <LightBreakdown breakdown={breakdown} /> : <GasBreakdown breakdown={breakdown} />}
                                                  </div>
                                                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                                                    <div className="flex justify-between items-center font-bold">
                                                      <p>Coste Total Factura</p>
                                                      <p className="text-lg">{formatCurrency(totalCost)}</p>
                                                    </div>
                                                  </div>
                                              </div>
                                          </TableCell>
                                      </TableRow>
                                    )}
                                  </React.Fragment>
                            )
                        })}
                        </TableBody>
                    </Table>
                </div>

                {results.length > PAGE_SIZE && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                            Mostrando {Math.min(visibleCount, results.length)} de {results.length} tarifas
                        </span>
                        <div className="flex gap-2">
                            {visibleCount < results.length && (
                                <Button
                                    variant="outline"
                                    onClick={() => setVisibleCount((v) => Math.min(v + PAGE_SIZE, results.length))}
                                >
                                    Mostrar más
                                    <ChevronDown className="h-4 w-4 ml-2" />
                                </Button>
                            )}
                            {visibleCount > PAGE_SIZE && (
                                <Button variant="ghost" onClick={() => setVisibleCount(PAGE_SIZE)}>
                                    Mostrar menos
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
