'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
import {
  calculateCurrentLightBillBreakdown,
  calculateCurrentGasBillBreakdown,
  buildLightBreakdownRows,
  buildGasBreakdownRows,
  type BreakdownRow,
} from '@/lib/comparativa-breakdown';

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

/** Lista de desglose: cada concepto con su importe y, debajo, la fórmula de cálculo (estilo factura). */
const BreakdownList = ({ rows }: { rows: BreakdownRow[] }) => (
  <div className="space-y-2">
    {rows.map((row, i) => (
      <div key={i} className="border-b border-dashed border-muted/70 pb-2 last:border-b-0 last:pb-0">
        <div className="flex justify-between items-baseline gap-2">
          <span className="text-xs font-medium text-foreground">{row.label}</span>
          <span className={`text-xs font-bold whitespace-nowrap ${row.isCredit ? 'text-green-600' : ''}`}>
            {formatCurrency(row.value)}
          </span>
        </div>
        {row.formula && (
          <p className="mt-0.5 text-[11px] italic leading-snug text-muted-foreground">{row.formula}</p>
        )}
      </div>
    ))}
  </div>
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


    // Construye el PdfData (lo que consume la vista previa / PDF) para una tarifa concreta.
    const buildPdfData = useCallback((result: TariffComparisonResult, annualSaving: number): PdfData => {
      const monthlySaving = annualSaving / 12;

      // Pasamos los precios unitarios del cliente EXACTAMENTE como los usa la página de
      // Resultados (en crudo, sin filtrar). El filtro anterior (hasPrices: algún valor > 0)
      // descartaba casos válidos —p.ej. factura con precios de energía pero potencia a 0 por
      // OCR parcial— que Resultados SÍ desglosa, provocando "Sin datos" en la preview/PDF.
      const clientPrices = {
        power: formData.clientPowerPrices,
        energy: formData.clientEnergyPrices,
        surplus: formData.clientSurplusPrice,
        fixed: formData.clientFixedPrice,
        variable: formData.clientGasEnergyPrice,
        maintenance: formData.clientMaintenanceCost,
      }

      return {
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
    }, [formData, currentBillAmount, clientName, showCurrentBill, comparisonType, numDias, regulatedCosts]);

    const handleDownload = useCallback((result: TariffComparisonResult, annualSaving: number) => {
      sessionStorage.setItem('pdfDataForGeneration', JSON.stringify(buildPdfData(result, annualSaving)));
      router.push('/comparativas/personalizada');
    }, [buildPdfData, router]);

    // El botón "Personalizar Comparativa" de la cabecera (components/comparativas/Header.js)
    // navega a /comparativas/personalizada SIN pasar datos. Para que esa vista (y el PDF)
    // muestren la comparativa ACTUAL —igual que en Resultados— persistimos de forma pasiva el
    // PdfData de la MEJOR tarifa (#1) cada vez que hay resultados. El icono de descarga por
    // fila lo sobreescribe con la tarifa concreta elegida justo antes de navegar.
    useEffect(() => {
      if (results.length === 0 || typeof window === 'undefined') return;
      const best = results[0];
      const saving = currentBillAmount - best.totalCost;
      const annualSaving = currentBillAmount > 0 && numDias > 0 ? (saving / numDias) * 365 : 0;
      try {
        sessionStorage.setItem('pdfDataForGeneration', JSON.stringify(buildPdfData(best, annualSaving)));
      } catch (e) {
        console.error('No se pudo preparar la comparativa para personalizar:', e);
      }
    }, [results, currentBillAmount, numDias, buildPdfData]);

    // Auto-acción al abrir una comparativa guardada desde el historial: se recalcula aquí
    // (mejor tarifa + desglose + ahorro, que el backend NO guarda) y luego, según el flag que
    // active app/comparativas/page.js:
    //   - `autoDownloadComparativa` → "Exportar": va a la vista previa y descarga el PDF solo.
    //   - `autoViewComparativa`     → "Ver": va a la vista previa SIN descargar (para mirarla).
    const autoActionedRef = useRef(false);
    useEffect(() => {
        if (autoActionedRef.current || results.length === 0) return;
        if (typeof window === 'undefined') return;
        const wantsDownload = sessionStorage.getItem('autoDownloadComparativa') === 'true';
        const wantsView = sessionStorage.getItem('autoViewComparativa') === 'true';
        if (!wantsDownload && !wantsView) return;
        autoActionedRef.current = true;
        sessionStorage.removeItem('autoDownloadComparativa');
        sessionStorage.removeItem('autoViewComparativa');
        const best = results[0];
        const saving = currentBillAmount - best.totalCost;
        const annualSaving = currentBillAmount > 0 && numDias > 0 ? (saving / numDias) * 365 : 0;
        // Solo "Exportar" descarga automáticamente; "Ver" deja la vista previa abierta.
        if (wantsDownload) sessionStorage.setItem('autoDownloadPDF', 'true');
        handleDownload(best, annualSaving);
    }, [results, currentBillAmount, numDias, handleDownload]);

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
                          
                          const currentRows = comparisonType === 'luz'
                            ? buildLightBreakdownRows(currentBreakdown, formData, regulatedCosts, {
                                powerPrices: formData.clientPowerPrices,
                                energyPrices: formData.clientEnergyPrices,
                                surplusPrice: formData.clientSurplusPrice,
                              })
                            : buildGasBreakdownRows(currentBreakdown, formData, regulatedCosts, {
                                fixedPrice: formData.clientFixedPrice,
                                energyPrice: formData.clientGasEnergyPrice,
                              });

                          return (
                            <div className="space-y-3">
                              <div className="flex justify-between items-center pb-2 border-b border-red-200 dark:border-red-800">
                                <span className="text-xs font-medium text-red-700 dark:text-red-400">TOTAL</span>
                                <span className="text-lg font-bold text-red-700 dark:text-red-400">{formatCurrency(currentBillAmount)}</span>
                              </div>
                              <BreakdownList rows={currentRows} />
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
                          <BreakdownList rows={
                            comparisonType === 'luz'
                              ? buildLightBreakdownRows(results[0].breakdown, formData, regulatedCosts, {
                                  powerPrices: (results[0].tariff as CompanyLightTariff).powerPrices,
                                  energyPrices: (results[0].tariff as CompanyLightTariff).energyPrices,
                                  surplusPrice: (results[0].tariff as CompanyLightTariff).surplusPrice,
                                })
                              : buildGasBreakdownRows(results[0].breakdown, formData, regulatedCosts, {
                                  fixedPrice: (results[0].tariff as CompanyGasTariff).fixedPrice,
                                  energyPrice: (results[0].tariff as CompanyGasTariff).energyPrice,
                                })
                          } />
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
                                                  <BreakdownList rows={
                                                    isLight
                                                      ? buildLightBreakdownRows(breakdown, formData, regulatedCosts, {
                                                          powerPrices: (tariff as CompanyLightTariff).powerPrices,
                                                          energyPrices: (tariff as CompanyLightTariff).energyPrices,
                                                          surplusPrice: (tariff as CompanyLightTariff).surplusPrice,
                                                        })
                                                      : buildGasBreakdownRows(breakdown, formData, regulatedCosts, {
                                                          fixedPrice: (tariff as CompanyGasTariff).fixedPrice,
                                                          energyPrice: (tariff as CompanyGasTariff).energyPrice,
                                                        })
                                                  } />
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
