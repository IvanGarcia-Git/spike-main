'use client';

import { useState, useEffect } from 'react';
import { getTariffs, addTariff, updateTariff, deleteTariff } from '@/lib/tariff-store';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import TariffFormDialog from '@/components/comparativas/TariffFormDialog';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ComparativasHeader from '@/components/comparativas/Header';

export default function TariffManagerPage() {
  const [tariffs, setTariffs] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTariff, setEditingTariff] = useState(null);

  const refreshTariffs = () => {
    setTariffs(getTariffs());
  };

  useEffect(() => {
    refreshTariffs();
  }, []);

  const handleAddNew = () => {
    setEditingTariff(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (tariff) => {
    setEditingTariff(tariff);
    setIsDialogOpen(true);
  };

  const handleDelete = (tariffId) => {
    deleteTariff(tariffId);
    refreshTariffs();
  };

  const handleSave = (tariffData) => {
    if (editingTariff) {
      updateTariff({ ...editingTariff, ...tariffData });
    } else {
      addTariff(tariffData);
    }
    refreshTariffs();
    setIsDialogOpen(false);
    setEditingTariff(null);
  };

  return (
    <div>
      <ComparativasHeader />
      <div className="container mx-auto p-4 md:p-8">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Gestionar Tarifas de Empresas</CardTitle>
              <CardDescription>
                Aquí puedes añadir, editar o eliminar datos de tarifas de empresas.
              </CardDescription>
            </div>
            <Button onClick={handleAddNew}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Añadir Nueva Tarifa
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Suministro</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Nombre Tarifa</TableHead>
                  <TableHead>Detalles</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tariffs.map(tariff => {
                  const isLight = tariff.type === 'luz';
                  
                  return (
                    <TableRow key={tariff.id}>
                      <TableCell className="font-medium uppercase">{tariff.type}</TableCell>
                      <TableCell>
                        <Badge variant={tariff.customerType === 'empresa' ? 'secondary' : 'outline'}>
                          {tariff.customerType}
                        </Badge>
                      </TableCell>
                      <TableCell>{tariff.companyName}</TableCell>
                      <TableCell>{tariff.tariffName}</TableCell>
                      <TableCell className="text-xs">
                        {isLight ? (
                          <>
                            Pot: {tariff.powerPrices.join(', ')} | 
                            Energ: {tariff.energyPrices.join(', ')} | 
                            Exc: {tariff.surplusPrice}
                          </>
                        ) : (
                          <>
                            Fijo: {tariff.fixedPrice} | 
                            Energía: {tariff.energyPrice}
                          </>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                         <Button variant="ghost" size="icon" onClick={() => handleEdit(tariff)}>
                             <Edit className="h-4 w-4" />
                         </Button>
                         <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-600" onClick={() => handleDelete(tariff.id)}>
                             <Trash2 className="h-4 w-4" />
                         </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      <TariffFormDialog
        isOpen={isDialogOpen}
        onOpenChange={(isOpen) => {
          setIsDialogOpen(isOpen);
          if (!isOpen) {
            setEditingTariff(null);
          }
        }}
        tariff={editingTariff}
        onSave={handleSave}
      />
      </div>
    </div>
  );
}