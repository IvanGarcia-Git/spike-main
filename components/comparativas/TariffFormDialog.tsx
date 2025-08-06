'use client';

import { useState, useEffect } from 'react';
import type { CompanyTariff, ComparisonType, CompanyLightTariff, CompanyGasTariff, CustomerType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface TariffFormDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  tariff: CompanyTariff | null;
  onSave: (tariffData: Partial<CompanyTariff>) => void;
}

const getInitialFormData = (tariff: CompanyTariff | null): Partial<CompanyTariff> => {
    if (tariff) return { ...tariff };
    return {
        type: 'luz',
        customerType: 'residencial',
        companyName: '',
        tariffName: '',
        tariffType: '2.0',
        powerPrices: [0, 0],
        energyPrices: [0, 0, 0],
        surplusPrice: 0,
        fixedPrice: 0,
        energyPrice: 0,
    };
};


export default function TariffFormDialog({ isOpen, onOpenChange, tariff, onSave }: TariffFormDialogProps) {
  const [formData, setFormData] = useState<Partial<CompanyTariff>>(getInitialFormData(tariff));

  useEffect(() => {
    if (isOpen) {
      setFormData(getInitialFormData(tariff));
    }
  }, [isOpen, tariff]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) || 0 : value }));
  };
  
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>, priceType: 'powerPrices' | 'energyPrices', index: number) => {
    const { value } = e.target;
    const newPrices = [...((formData as CompanyLightTariff)[priceType] || [])];
    newPrices[index] = parseFloat(value) || 0;
    setFormData(prev => ({ ...prev, [priceType]: newPrices }));
  };

  const handleTariffTypeChange = (value: '2.0' | '3.0' | '6.1') => {
    setFormData(prev => {
        const isChangingToHighPeriods = value === '3.0' || value === '6.1';
        const wasHighPeriods = (prev as CompanyLightTariff).tariffType === '3.0' || (prev as CompanyLightTariff).tariffType === '6.1';
        
        let newPowerPrices = [...(prev.powerPrices || [0,0])];
        let newEnergyPrices = [...(prev.energyPrices || [0,0,0])];

        if (isChangingToHighPeriods && !wasHighPeriods) {
            newPowerPrices = Array(6).fill(0).map((_, i) => newPowerPrices[i] || 0);
            newEnergyPrices = Array(6).fill(0).map((_, i) => newEnergyPrices[i] || 0);
        } else if (!isChangingToHighPeriods && wasHighPeriods) {
            newPowerPrices = newPowerPrices.slice(0, 2);
            newEnergyPrices = newEnergyPrices.slice(0, 3);
        }
        
        return {
            ...prev,
            tariffType: value,
            powerPrices: newPowerPrices,
            energyPrices: newEnergyPrices,
        }
    });
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };
  
  const title = tariff ? 'Editar Tarifa' : 'Añadir Nueva Tarifa';
  const description = tariff ? 'Actualiza los detalles de esta tarifa.' : 'Introduce los detalles de la nueva tarifa.';
  
  const renderLightPriceInputs = (priceType: 'powerPrices' | 'energyPrices', label: string) => (
     <div className="grid grid-cols-4 items-center gap-4">
      <Label className="text-right">{label}</Label>
      <div className={`col-span-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2`}>
        {(formData as CompanyLightTariff)[priceType]?.map((price, index) => (
          <Input
            key={`${priceType}-${index}`}
            type="number"
            step="0.001"
            placeholder={`${label.charAt(0)}${index + 1}`}
            value={price}
            onChange={(e) => handlePriceChange(e, priceType, index)}
          />
        ))}
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] z-50">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="type" className="text-right">Tipo de Suministro</Label>
                <select
                    name="type"
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({...prev, type: e.target.value as ComparisonType, tariffType: e.target.value === 'luz' ? '2.0' : 'RL.1'}))}
                    className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                    <option value="">Selecciona tipo</option>
                    <option value="luz">Luz</option>
                    <option value="gas">Gas</option>
                </select>
            </div>

             <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="customerType" className="text-right">Tipo de Cliente</Label>
                <select
                    name="customerType"
                    value={formData.customerType}
                    onChange={(e) => setFormData(prev => ({...prev, customerType: e.target.value as CustomerType}))}
                    className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                    <option value="">Selecciona tipo de cliente</option>
                    <option value="residencial">Residencial/Autónomo</option>
                    <option value="empresa">Empresa</option>
                </select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="companyName" className="text-right">Empresa</Label>
              <Input id="companyName" name="companyName" value={formData.companyName || ''} onChange={handleInputChange} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tariffName" className="text-right">Nombre de Tarifa</Label>
              <Input id="tariffName" name="tariffName" value={formData.tariffName || ''} onChange={handleInputChange} className="col-span-3" required />
            </div>
            
            {formData.type === 'luz' && (
                <>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Tipo de Tarifa</Label>
                        <RadioGroup 
                            value={formData.tariffType} 
                            onValueChange={(val) => handleTariffTypeChange(val as '2.0'|'3.0'|'6.1')} 
                            className="col-span-3 flex gap-4"
                        >
                            {(['2.0', '3.0', '6.1'] as const).map(val => (
                                <div key={val} className="flex items-center space-x-2">
                                    <RadioGroupItem value={val} id={`form-t-${val}`} />
                                    <Label htmlFor={`form-t-${val}`} className="font-normal">{val}</Label>
                                </div>
                            ))}
                        </RadioGroup>
                    </div>

                    {renderLightPriceInputs('powerPrices', 'Precios de Potencia')}
                    {renderLightPriceInputs('energyPrices', 'Precios de Energía')}

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="surplusPrice" className="text-right">Precio Excedente</Label>
                        <Input id="surplusPrice" name="surplusPrice" type="number" step="0.001" value={(formData as CompanyLightTariff).surplusPrice} onChange={handleInputChange} className="col-span-3" />
                    </div>
                </>
            )}

            {formData.type === 'gas' && (
                <>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Tipo de Tarifa</Label>
                        <RadioGroup 
                            value={formData.tariffType} 
                            onValueChange={(val) => setFormData(prev => ({...prev, tariffType: val}))} 
                            className="col-span-3 flex gap-4"
                        >
                            {(['RL.1', 'RL.2', 'RL.3'] as const).map(val => (
                                <div key={val} className="flex items-center space-x-2">
                                    <RadioGroupItem value={val} id={`form-t-${val}`} />
                                    <Label htmlFor={`form-t-${val}`} className="font-normal">{val}</Label>
                                </div>
                            ))}
                        </RadioGroup>
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="fixedPrice" className="text-right">Precio Fijo (€/día)</Label>
                        <Input id="fixedPrice" name="fixedPrice" type="number" step="0.001" value={(formData as CompanyGasTariff).fixedPrice || 0} onChange={handleInputChange} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="energyPrice" className="text-right">Precio Energía (€/kWh)</Label>
                        <Input id="energyPrice" name="energyPrice" type="number" step="0.001" value={(formData as CompanyGasTariff).energyPrice || 0} onChange={handleInputChange} className="col-span-3" />
                    </div>
                </>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">Cancelar</Button>
            </DialogClose>
            <Button type="submit">Guardar Cambios</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
