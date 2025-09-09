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
import { createComparativa } from '@/helpers/server-fetch.helper';
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
        <div className="flex flex-col items-center justify-center p-2 rounded-md bg-muted/50 text-center">
            <span className="text-xs text-muted-foreground">{label}</span>
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
        <Card className="mb-6 bg-muted/20">
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

                    const response = await createComparativa(comparativaData, token);
                    
                    if (response && response.ok) {
                        const savedComparativa = await response.json();
                        console.log('Comparativa saved successfully:', savedComparativa);
                        setComparativaSaved(true);
                        toast({
                            title: "Comparativa guardada",
                            description: "La comparativa se ha guardado correctamente en tu historial.",
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

      const clientPrices = {
        power: formData.clientPowerPrices,
        energy: formData.clientEnergyPrices,
        surplus: formData.clientSurplusPrice,
        fixed: formData.clientFixedPrice,
        variable: formData.clientGasEnergyPrice,
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
        <Card className="mt-8">
            <CardHeader>
                <CardTitle>Resultados de la Comparativa</CardTitle>
                <CardDescription>Tarifas ordenadas de la más económica a la más cara, según los datos introducidos.</CardDescription>
            </CardHeader>
            <CardContent>
                <RegulatedCosts costs={regulatedCosts} type={comparisonType} onCostChange={handleRegulatedCostChange}/>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
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
                        {results.map(({ tariff, totalCost, breakdown }, index) => {
                            const saving = currentBillAmount > 0 ? currentBillAmount - totalCost : 0;
                            const savingPercentage = currentBillAmount > 0 && saving > 0 ? (saving / currentBillAmount) * 100 : 0;
                            const annualSaving = currentBillAmount > 0 && numDias > 0 ? (saving / numDias) * 365 : 0;
                            
                            const lightTariff = tariff as CompanyLightTariff;
                            const gasTariff = tariff as CompanyGasTariff;

                            const isOpen = openRowId === tariff.id;

                            return (
                                <React.Fragment key={tariff.id}>
                                    <TableRow className={index === 0 ? "bg-primary/10" : ""} data-state={isOpen ? 'open' : 'closed'}>
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
                                      <TableRow className="bg-muted/30 hover:bg-muted/30">
                                          <TableCell colSpan={isLight ? 11 : 10} className="p-0">
                                              <div className="p-4">
                                                  <h4 className="text-md font-semibold mb-2">Desglose de Factura</h4>
                                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                                                    {isLight ? <LightBreakdown breakdown={breakdown} /> : <GasBreakdown breakdown={breakdown} />}
                                                  </div>
                                                  <div className="mt-4 pt-4 border-t border-muted">
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
            </CardContent>
        </Card>
    );
}
