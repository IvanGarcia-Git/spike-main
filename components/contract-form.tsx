"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import React, { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { PartyFormStepper } from "./party-form-stepper";
import { FormProvider } from "react-hook-form";

const formSchema = z.object({
  partyA: z.object({
    type: z.enum(["empresa", "particular"]),
    razonSocial: z.string().optional(),
    cif: z.string().optional(),
    domicilioSocial: z.string().optional(),
    representanteLegal: z.string().optional(),
    dniRepresentante: z.string().optional(),
    nombreCompleto: z.string().optional(),
    dni: z.string().optional(),
    domicilio: z.string().optional(),
  }),
  partyB: z.object({
    type: z.enum(["empresa", "particular"]),
    razonSocial: z.string().optional(),
    cif: z.string().optional(),
    domicilioSocial: z.string().optional(),
    representanteLegal: z.string().optional(),
    dniRepresentante: z.string().optional(),
    nombreCompleto: z.string().optional(),
    dni: z.string().optional(),
    domicilio: z.string().optional(),
  }),
  general: z.object({
    ciudad: z.string().optional(),
    fechaInicio: z.date().optional(),
  }).optional(),
});

export type ContractFormState = z.infer<typeof formSchema>;

interface ContractFormProps {
  onDataChange: (data: ContractFormState) => void;
  setFocusedField: (name: string | null) => void;
  onLogoChange: (url: string | null) => void;
}

export function ContractForm({ onDataChange, setFocusedField, onLogoChange }: ContractFormProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  
  const form = useForm<ContractFormState>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      partyA: {
        type: 'empresa',
        razonSocial: '',
        cif: '',
        domicilioSocial: '',
        representanteLegal: '',
        dniRepresentante: '',
        nombreCompleto: '',
        dni: '',
        domicilio: '',
      },
      partyB: {
        type: 'empresa',
        razonSocial: '',
        cif: '',
        domicilioSocial: '',
        representanteLegal: '',
        dniRepresentante: '',
        nombreCompleto: '',
        dni: '',
        domicilio: '',
      },
      general: {
        ciudad: '',
        fechaInicio: undefined,
      }
    },
  });

  const watchedData = useWatch({ control: form.control });

  useEffect(() => {
    onDataChange(watchedData as ContractFormState);
  }, [watchedData, onDataChange]);

  const processFile = useCallback((file: File, callback: (url: string | null) => void) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona solo archivos de imagen (PNG, JPG, etc.)');
      return;
    }
    
    // Validate file size (max 1GB)
    if (file.size > 1024 * 1024 * 1024) {
      alert('El archivo es demasiado grande. Máximo 1GB.');
      return;
    }
    
    const reader = new FileReader();
    reader.onloadend = () => {
      callback(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string | null) => void) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0], callback);
    } else {
      callback(null);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>, callback: (url: string | null) => void) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      processFile(files[0], callback);
    }
  }, [processFile]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const commonProps = (name: string) => ({
    onFocus: () => setFocusedField(name),
    onBlur: () => setFocusedField(null),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Detalles del Contrato</CardTitle>
      </CardHeader>
      <CardContent>
        <FormProvider {...form}>
          <form className="space-y-8">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold font-headline">Logo de la Empresa</h3>
               <FormItem>
                <FormLabel>Subir Logo</FormLabel>
                <FormControl>
                  <div
                    className={`relative border-2 border-dashed rounded-lg p-6 transition-all duration-200 ${
                      isDragOver 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onDrop={(e) => handleDrop(e, onLogoChange)}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                  >
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <div className="text-center">
                        <p className="text-sm text-gray-600 font-medium">
                          Arrastra una imagen aquí o{' '}
                          <label className="text-blue-600 hover:text-blue-500 cursor-pointer underline">
                            selecciona un archivo
                            <Input 
                              type="file" 
                              accept="image/*" 
                              onChange={(e) => handleFileChange(e, onLogoChange)} 
                              className="hidden" 
                            />
                          </label>
                        </p>
                        <p className="text-xs text-gray-400 mt-1">PNG, JPG hasta 1GB</p>
                      </div>
                    </div>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            </div>

            <Separator />
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold font-headline">Datos Generales</h3>
                <FormField
                    control={form.control}
                    name="general.ciudad"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Ciudad de firma del contrato</FormLabel>
                        <FormControl>
                            <Input placeholder="ej. Madrid" {...field} {...commonProps('general_ciudad')} value={field.value ?? ''} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                 />
                <FormField
                  control={form.control}
                  name="general.fechaInicio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha de Inicio</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          value={field.value ? field.value.toISOString().split('T')[0] : ''}
                          onChange={(e) => {
                            const dateValue = e.target.value ? new Date(e.target.value) : undefined;
                            field.onChange(dateValue);
                          }}
                          max={new Date().toISOString().split('T')[0]}
                          min="1900-01-01"
                          {...commonProps('general_fechaInicio')}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-lg font-semibold font-headline">Parte A</h3>
              <PartyFormStepper party="partyA" setFocusedField={setFocusedField} />
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-lg font-semibold font-headline">Parte B</h3>
              <PartyFormStepper party="partyB" setFocusedField={setFocusedField} />
            </div>

          </form>
        </FormProvider>
      </CardContent>
    </Card>
  );
}
