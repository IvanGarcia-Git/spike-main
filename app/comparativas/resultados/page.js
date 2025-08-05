'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import TariffComparisonResults from '@/components/comparativas/tariffs/TariffComparisonResults';
import { getTariffs } from '@/lib/tariff-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function ComparativasResultadosPage() {
    const router = useRouter();
    const { toast } = useToast();
    const allTariffs = useMemo(() => getTariffs(), []);
    const [formData, setFormData] = useState(null);

    useEffect(() => {
        const storedData = sessionStorage.getItem('comparisonData');
        if (!storedData) {
            toast({
                title: 'No hay datos para comparar',
                description: 'Por favor, vuelve al inicio y completa el formulario.',
            });
            router.push('/comparativas');
            return;
        }

        const data = JSON.parse(storedData);
        setFormData(data);
    }, [router, toast]);

    const filteredTariffs = useMemo(() => {
        if (!formData) return [];

        const { comparisonType, selectedLightTariff, selectedGasTariff, customerType } = formData;

        if (comparisonType === 'luz') {
            return allTariffs.filter(
                (t) =>
                    t.type === 'luz' &&
                    t.tariffType === selectedLightTariff &&
                    t.customerType === customerType
            );
        } else {
            return allTariffs.filter(
                (t) =>
                    t.type === 'gas' &&
                    t.tariffType === selectedGasTariff &&
                    t.customerType === customerType
            );
        }
    }, [formData, allTariffs]);

    if (!formData) {
        return <div className="container mx-auto p-8 text-center">Cargando resultados...</div>;
    }

    const defaultRegulatedCosts = {
        ihp: 0.5,
        alquiler: 0.026712,
        social: 0.038466,
        hydrocarbon: 0.00234,
        iva: 21
    };

    return (
        <div className="container mx-auto p-4 md:p-8">
             {formData && filteredTariffs.length > 0 && (
                <TariffComparisonResults
                    tariffs={filteredTariffs}
                    formData={formData}
                    initialRegulatedCosts={defaultRegulatedCosts}
                />
            )}
            {formData && filteredTariffs.length === 0 && (
                 <Card className="mt-8">
                    <CardHeader>
                        <CardTitle>No se encontraron resultados</CardTitle>
                        <CardDescription>No hay tarifas que coincidan con los criterios de búsqueda. Prueba a cambiar las opciones en el formulario.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={() => router.push('/comparativas')}>Volver al Inicio</Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}