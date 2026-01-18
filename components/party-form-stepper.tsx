
"use client";

import React, { useState, useEffect } from 'react';
import { useFormContext, useWatch } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { cn } from '@/lib/utils';
import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';

interface PartyFormStepperProps {
  party: "partyA" | "partyB";
  setFocusedField: (name: string | null) => void;
}

export const PartyFormStepper: React.FC<PartyFormStepperProps> = ({ party, setFocusedField }) => {
  const { control } = useFormContext();
  const partyType = useWatch({ control, name: `${party}.type` });
  const [currentStep, setCurrentStep] = useState(1);
  const isCompany = partyType === 'empresa';
  const totalSteps = isCompany ? 4 : 3;

  useEffect(() => {
    // Reset step to 1 if party type changes, to avoid being on a non-existent step
    setCurrentStep(1);
  }, [partyType]);


  const commonProps = (name: string) => ({
    onFocus: () => setFocusedField(name),
    onBlur: () => setFocusedField(null),
  });

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, totalSteps));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));
  
  const isStepComplete = currentStep === totalSteps;

  return (
    <div className={cn(
        "neumorphic-card rounded-xl transition-all",
        isStepComplete ? 'ring-2 ring-green-500' : ''
    )}>
      <div className="p-4 pb-2">
        <h3 className="text-center font-normal text-lg text-slate-800 dark:text-slate-100">
            {currentStep === 1 && "Paso 1: Tipo de parte"}
            {currentStep === 2 && isCompany && "Paso 2: Datos de la Empresa"}
            {currentStep === 2 && !isCompany && "Paso 2: Datos del Particular"}
            {currentStep === 3 && isCompany && "Paso 3: Representante Legal"}
            {currentStep === 3 && !isCompany && "Paso 3: ¡Terminado!"}
            {currentStep === 4 && isCompany && "Paso 4: ¡Terminado!"}
        </h3>
      </div>
      <div className="p-4 pt-2 min-h-[250px] flex items-center justify-center">
        <div className="w-full space-y-4 text-center">
          {currentStep === 1 && (
            <FormField
              control={control}
              name={`${party}.type`}
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>¿La Parte {party === 'partyA' ? 'A' : 'B'} es una empresa o un particular?</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={(value) => {
                          field.onChange(value);
                      }}
                      value={field.value}
                      className="flex justify-center space-x-8 pt-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="empresa" id={`${party}-empresa`} />
                        <FormLabel htmlFor={`${party}-empresa`} className="font-normal cursor-pointer text-base">Empresa</FormLabel>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="particular" id={`${party}-particular`} />
                        <FormLabel htmlFor={`${party}-particular`} className="font-normal cursor-pointer text-base">Particular</FormLabel>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {currentStep === 2 && isCompany && (
             <div className="space-y-4 text-left">
                <FormField control={control} name={`${party}.razonSocial`} render={({ field }) => <FormItem><FormLabel>Razón Social</FormLabel><FormControl><Input placeholder="ej. Acme Corp" {...field} {...commonProps(`${party}_razonSocial`)} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>} />
                <FormField control={control} name={`${party}.cif`} render={({ field }) => <FormItem><FormLabel>CIF</FormLabel><FormControl><Input placeholder="ej. B12345678" {...field} {...commonProps(`${party}_cif`)} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>} />
                <FormField control={control} name={`${party}.domicilioSocial`} render={({ field }) => <FormItem><FormLabel>Domicilio Social</FormLabel><FormControl><Input placeholder="ej. C/ Principal 123, Ciudad" {...field} {...commonProps(`${party}_domicilioSocial`)} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>} />
             </div>
          )}
          
          {currentStep === 2 && !isCompany && (
             <div className="space-y-4 text-left">
                <FormField control={control} name={`${party}.nombreCompleto`} render={({ field }) => <FormItem><FormLabel>Nombre Completo</FormLabel><FormControl><Input placeholder="ej. María García" {...field} {...commonProps(`${party}_nombreCompleto`)} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>} />
                <FormField control={control} name={`${party}.dni`} render={({ field }) => <FormItem><FormLabel>DNI</FormLabel><FormControl><Input placeholder="ej. 12345678X" {...field} {...commonProps(`${party}_dni`)} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>} />
                <FormField control={control} name={`${party}.domicilio`} render={({ field }) => <FormItem><FormLabel>Domicilio</FormLabel><FormControl><Input placeholder="ej. C/ Luna 45, Pueblo" {...field} {...commonProps(`${party}_domicilio`)} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>} />
             </div>
          )}

          {currentStep === 3 && isCompany && (
            <div className="space-y-4 text-left">
                <FormField control={control} name={`${party}.representanteLegal`} render={({ field }) => <FormItem><FormLabel>Representante Legal</FormLabel><FormControl><Input placeholder="ej. Juan Pérez" {...field} {...commonProps(`${party}_representanteLegal`)} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>} />
                <FormField control={control} name={`${party}.dniRepresentante`} render={({ field }) => <FormItem><FormLabel>DNI del Representante</FormLabel><FormControl><Input placeholder="ej. 12345678X" {...field} {...commonProps(`${party}_dniRepresentante`)} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>} />
            </div>
          )}

          {currentStep === 3 && !isCompany && (
            <div className="flex flex-col items-center justify-center space-y-2">
                <CheckCircle className="w-16 h-16 text-green-500" />
                <p className="text-muted-foreground">Datos de particular completados.</p>
                <p>Puedes editar los detalles en la vista previa.</p>
            </div>
          )}
           {currentStep === 4 && isCompany && (
            <div className="flex flex-col items-center justify-center space-y-2">
                <CheckCircle className="w-16 h-16 text-green-500" />
                <p className="text-muted-foreground">Datos de empresa completados.</p>
                <p>Puedes editar los detalles en la vista previa.</p>
            </div>
          )}
        </div>
      </div>
      <div className="p-4 pt-0 flex justify-between items-center">
         <button
           type="button"
           onClick={prevStep}
           disabled={currentStep === 1}
           className={cn(
             "w-10 h-10 rounded-full neumorphic-button flex items-center justify-center transition-all",
             currentStep === 1
               ? "text-slate-300 dark:text-slate-600 cursor-not-allowed opacity-50"
               : "text-slate-600 dark:text-slate-400 hover:text-primary"
           )}
         >
            <ArrowLeft className="w-5 h-5" />
         </button>
        <div className="flex items-center space-x-3">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrentStep(i + 1)}
              className={cn(
                "rounded-full transition-all duration-300",
                i + 1 === currentStep
                  ? "w-3 h-3 bg-primary shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1)]"
                  : i + 1 < currentStep
                    ? "w-2.5 h-2.5 bg-primary/60 hover:bg-primary/80"
                    : "w-2.5 h-2.5 bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500"
              )}
            />
          ))}
        </div>
         <button
           type="button"
           onClick={nextStep}
           disabled={currentStep === totalSteps}
           className={cn(
             "w-10 h-10 rounded-full neumorphic-button flex items-center justify-center transition-all",
             currentStep === totalSteps
               ? "text-slate-300 dark:text-slate-600 cursor-not-allowed opacity-50"
               : "text-slate-600 dark:text-slate-400 hover:text-primary"
           )}
         >
            <ArrowRight className="w-5 h-5" />
         </button>
      </div>
    </div>
  );
};
