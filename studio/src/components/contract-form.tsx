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
import React, { useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { PartyFormStepper } from "./party-form-stepper";

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string | null) => void) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        callback(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
        callback(null)
    }
  };

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
        <Form {...form}>
          <form className="space-y-8">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold font-headline">Logo de la Empresa</h3>
               <FormItem>
                <FormLabel>Subir Logo</FormLabel>
                <FormControl>
                    <Input type="file" accept="image/png, image/jpeg" onChange={(e) => handleFileChange(e, onLogoChange)} className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
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
                    <FormItem className="flex flex-col">
                      <FormLabel>Fecha de Inicio</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                               {...commonProps('general_fechaInicio')}
                            >
                              {field.value ? (
                                format(field.value, "PPP", { locale: es })
                              ) : (
                                <span>Elige una fecha</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date > new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                            locale={es}
                          />
                        </PopoverContent>
                      </Popover>
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
        </Form>
      </CardContent>
    </Card>
  );
}
