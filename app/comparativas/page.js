'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Flame,
  Lightbulb,
  MoreVertical,
  CircleDot,
  Trash,
  X,
  CheckSquare,
  Square,
  ArrowLeft,
  ArrowRight,
  Download,
  Edit2,
  Edit3,
  Trash2
} from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import ComparativasHeader from '@/components/comparativas/Header';
import { getRecentComparativas, deleteComparativa, createComparativa } from '@/helpers/server-fetch.helper';

// Helper function to get JWT token from cookies
const getJWTToken = () => {
  if (typeof document !== 'undefined') {
    const cookies = document.cookie.split(';');
    const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('factura-token='));
    return tokenCookie ? tokenCookie.split('=')[1] : null;
  }
  return null;
};

// Empty initial state - will be filled from backend or remain empty

const ProgressDots = ({ step, totalSteps, invalidSteps = [] }) => (
    <div className="flex justify-center gap-2">
      {Array.from({ length: totalSteps }).map((_, index) => {
        const stepNumber = index + 1;
        const isInvalid = invalidSteps.includes(stepNumber);
        const isActive = step === stepNumber;
        
        let colorClass = 'bg-gray-300'; // Default
        if (isActive) {
          colorClass = 'bg-blue-600';
        } else if (isInvalid) {
          colorClass = 'bg-red-500';
        }

        return (
          <span
            key={index}
            className={`h-2 w-2 rounded-full ${colorClass} transition-colors duration-300`}
          ></span>
        );
      })}
    </div>
);

export default function ComparativasPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [comparisons, setComparisons] = useState([]); // Start with empty array
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [formStep, setFormStep] = useState(1);
  const [supplyType, setSupplyType] = useState(null);

  // Form state
  const [customerType, setCustomerType] = useState(null);
  const [selectedLightTariff, setSelectedLightTariff] = useState(null);
  const [solarPanelActive, setSolarPanelActive] = useState(null);
  const [comparativeExcedentes, setComparativeExcedentes] = useState('');
  const [comparativePotencia, setComparativePotencia] = useState(Array(2).fill(''));
  const [numDias, setNumDias] = useState('');
  const [comparativeEnergy, setComparativeEnergy] = useState(Array(3).fill(''));
  const [hasMainServices, setHasMainServices] = useState(null);
  const [mainMaintenanceCost, setMainMaintenanceCost] = useState('');
  const [currentBillAmount, setCurrentBillAmount] = useState('');
  const [selectedGasTariff, setSelectedGasTariff] = useState(null);
  const [gasEnergy, setGasEnergy] = useState('');
  const [addClientBillData, setAddClientBillData] = useState(false);
  
  const [clientName, setClientName] = useState('');
  const [clientPowerPrices, setClientPowerPrices] = useState(['', '']);
  const [clientEnergyPrices, setClientEnergyPrices] = useState(['', '', '']);
  const [clientSurplusPrice, setClientSurplusPrice] = useState('');
  const [clientFixedPrice, setClientFixedPrice] = useState('');
  const [clientGasEnergyPrice, setClientGasEnergyPrice] = useState('');
  const [hasClientServices, setHasClientServices] = useState(null);
  const [clientMaintenanceCost, setClientMaintenanceCost] = useState('');

  const [maxStepReached, setMaxStepReached] = useState(1);
  const [invalidSteps, setInvalidSteps] = useState([]);
  const [isLoadingComparativas, setIsLoadingComparativas] = useState(true); // Start as loading
  const [hasLoadedFromBackend, setHasLoadedFromBackend] = useState(false);

  // Function to load comparativas from backend
  const loadComparativas = async () => {
    setIsLoadingComparativas(true);
    try {
      const token = getJWTToken();
      if (!token) {
        console.log('No token available for loading comparativas');
        setIsLoadingComparativas(false);
        return;
      }

      console.log('Loading comparativas from backend...');
      const response = await getRecentComparativas(10, token);
      
      if (response && response.ok) {
        const data = await response.json();
        console.log('Loaded comparativas:', data);
        
        // Transform backend data to match frontend format
        const transformedData = data.map(comparativa => {
          // Calculate relative time
          const createdDate = new Date(comparativa.createdAt);
          const now = new Date();
          const diffInMs = now - createdDate;
          const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
          const diffInDays = Math.floor(diffInHours / 24);
          
          let lastAccessed;
          if (diffInHours < 1) {
            lastAccessed = 'hace menos de 1 hora';
          } else if (diffInHours < 24) {
            lastAccessed = `hace ${diffInHours} hora${diffInHours !== 1 ? 's' : ''}`;
          } else if (diffInDays < 7) {
            lastAccessed = `hace ${diffInDays} día${diffInDays !== 1 ? 's' : ''}`;
          } else if (diffInDays < 30) {
            const weeks = Math.floor(diffInDays / 7);
            lastAccessed = `hace ${weeks} semana${weeks !== 1 ? 's' : ''}`;
          } else {
            const months = Math.floor(diffInDays / 30);
            lastAccessed = `hace ${months} mes${months !== 1 ? 'es' : ''}`;
          }
          
          return {
            type: comparativa.comparisonType,
            name: comparativa.clientName,
            tariffType: comparativa.tariffType,
            lastAccessed,
            oldPrice: `${parseFloat(comparativa.calculatedOldPrice).toFixed(2)}€`,
            newPrice: `${parseFloat(comparativa.calculatedNewPrice).toFixed(2)}€`,
            id: comparativa.id,
            uuid: comparativa.uuid,
          };
        });
        
        // Set backend data if available
        if (transformedData.length > 0) {
          setComparisons(transformedData);
          setHasLoadedFromBackend(true);
          console.log('Loaded comparativas from backend:', transformedData.length);
        } else {
          // No data in backend
          console.log('No comparativas in backend');
          setHasLoadedFromBackend(false);
          setComparisons([]);
        }
      } else {
        console.log('Failed to load comparativas from backend');
        setHasLoadedFromBackend(false);
        setComparisons([]);
      }
    } catch (error) {
      console.log('Error loading comparativas from backend:', error);
      setHasLoadedFromBackend(false);
      setComparisons([]);
    } finally {
      setIsLoadingComparativas(false);
    }
  };

  // Load comparativas from backend on component mount
  useEffect(() => {
    loadComparativas();
  }, []);


  useEffect(() => {
    if (!selectedLightTariff) return;
    const numPowerPeriods = selectedLightTariff === '2.0' ? 2 : 6;
    const numEnergyPeriods = selectedLightTariff === '2.0' ? 3 : 6;
    
    const resizeArray = (current, newSize) => {
        const newArray = Array(newSize).fill('');
        for (let i = 0; i < Math.min(current.length, newSize); i++) {
            newArray[i] = current[i] || '';
        }
        return newArray;
    }

    setComparativePotencia(current => resizeArray(current, numPowerPeriods));
    setComparativeEnergy(current => resizeArray(current, numEnergyPeriods));
    setClientPowerPrices(current => resizeArray(current, numPowerPeriods));
    setClientEnergyPrices(current => resizeArray(current, numEnergyPeriods));

  }, [selectedLightTariff]);

  useEffect(() => {
    if (formStep > maxStepReached) {
      setMaxStepReached(formStep);
    }
  }, [formStep, maxStepReached]);

  const nextStep = () => {
    if (formStep < totalSteps) {
        setFormStep(prev => prev + 1);
    }
  }

  const validateStep = useCallback((step) => {
    if (supplyType === 'luz') {
        switch(step) {
            case 1: return supplyType !== null;
            case 2: return customerType !== null;
            case 3: return selectedLightTariff !== null;
            case 4: return solarPanelActive !== null && (!solarPanelActive || comparativeExcedentes.trim() !== '');
            case 5: return comparativePotencia.every(p => p.trim() !== '' && !isNaN(parseFloat(p)));
            case 6: return numDias.trim() !== '' && !isNaN(parseInt(numDias));
            case 7: return comparativeEnergy.every(e => e.trim() !== '' && !isNaN(parseFloat(e)));
            case 8: return clientName.trim() !== '';
            case 9: return hasMainServices !== null && (!hasMainServices || (mainMaintenanceCost.trim() !== '' && !isNaN(parseFloat(mainMaintenanceCost))));
            case 10: return currentBillAmount.trim() !== '' && !isNaN(parseFloat(currentBillAmount));
            case 11: return true; // Decision step, always valid
            case 12: return !addClientBillData || clientPowerPrices.every(p => p.trim() !== '' && !isNaN(parseFloat(p)));
            case 13: return !addClientBillData || (clientEnergyPrices.every(e => e.trim() !== '' && !isNaN(parseFloat(e))) && (!solarPanelActive || (clientSurplusPrice.trim() !== '' && !isNaN(parseFloat(clientSurplusPrice)))));
            case 14: return !addClientBillData || hasClientServices !== null && (!hasClientServices || (clientMaintenanceCost.trim() !== '' && !isNaN(parseFloat(clientMaintenanceCost))));
            default: return true;
        }
    }
    if (supplyType === 'gas') {
        switch(step) {
            case 1: return supplyType !== null;
            case 2: return customerType !== null;
            case 3: return selectedGasTariff !== null;
            case 4: return numDias.trim() !== '' && !isNaN(parseInt(numDias));
            case 5: return gasEnergy.trim() !== '' && !isNaN(parseFloat(gasEnergy));
            case 6: return clientName.trim() !== '';
            case 7: return hasMainServices !== null && (!hasMainServices || (mainMaintenanceCost.trim() !== '' && !isNaN(parseFloat(mainMaintenanceCost))));
            case 8: return currentBillAmount.trim() !== '' && !isNaN(parseFloat(currentBillAmount));
            case 9: return true; // Decision step
            case 10: return !addClientBillData || (clientFixedPrice.trim() !== '' && !isNaN(parseFloat(clientFixedPrice)));
            case 11: return !addClientBillData || (clientGasEnergyPrice.trim() !== '' && !isNaN(parseFloat(clientGasEnergyPrice)));
            case 12: return !addClientBillData || hasClientServices !== null && (!hasClientServices || (clientMaintenanceCost.trim() !== '' && !isNaN(parseFloat(clientMaintenanceCost))));
            default: return true;
        }
    }
    return true;
  }, [
      supplyType, customerType, selectedLightTariff, solarPanelActive, comparativeExcedentes,
      comparativePotencia, numDias, comparativeEnergy, hasMainServices, mainMaintenanceCost,
      currentBillAmount, addClientBillData, clientName, clientPowerPrices, clientEnergyPrices,
      clientSurplusPrice, hasClientServices, clientMaintenanceCost, selectedGasTariff,
      gasEnergy, clientFixedPrice, clientGasEnergyPrice
  ]);

  const totalSteps = useMemo(() => {
    if (!supplyType) return 1;
    if (supplyType === 'luz') {
      return addClientBillData ? 14 : 11;
    } else { // gas
      return addClientBillData ? 12 : 9;
    }
  }, [supplyType, addClientBillData]);

  const isFormValid = useMemo(() => {
    for (let i = 1; i < totalSteps; i++) { // Validate all steps except the last one with the button
        if (!validateStep(i)) {
            return false;
        }
    }
    return true;
  }, [totalSteps, validateStep]);

  useEffect(() => {
    const invalids = [];
    const stepsToCheck = Math.min(maxStepReached, totalSteps);
    for (let i = 1; i < stepsToCheck; i++) {
        if (!validateStep(i)) {
            invalids.push(i);
        }
    }
    setInvalidSteps(invalids);
  }, [formStep, maxStepReached, totalSteps, validateStep]);

  const toggleSelection = (index) => {
    setSelectedItems((prev) =>
      prev.includes(index)
        ? prev.filter((i) => i !== index)
        : [...prev, index]
    );
  };

  const handleToggleSelectionMode = () => {
    setSelectionMode(true);
  };

  const handleCancelSelection = () => {
    setSelectionMode(false);
    setSelectedItems([]);
  };

  const handleExport = (index) => {
    const comp = comparisons[index];
    const data = {
      nombre: comp.name,
      tipo: comp.type,
      tarifa: comp.tariffType,
      precioAnterior: comp.oldPrice,
      precioNuevo: comp.newPrice,
      ultimoAcceso: comp.lastAccessed
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportName = `comparativa_${comp.name.replace(/ /g, '_')}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportName);
    linkElement.click();
    
    toast({
      title: "Comparativa exportada",
      description: `${comp.name} ha sido exportada correctamente`
    });
  };

  const handleRename = (index) => {
    setEditingIndex(index);
    setEditingName(comparisons[index].name);
  };

  const handleSaveRename = () => {
    if (editingIndex !== null && editingName.trim()) {
      const updatedComparisons = [...comparisons];
      updatedComparisons[editingIndex].name = editingName.trim();
      setComparisons(updatedComparisons);
      
      toast({
        title: "Nombre actualizado",
        description: `La comparativa ha sido renombrada a "${editingName.trim()}"`
      });
      
      setEditingIndex(null);
      setEditingName('');
    }
  };

  const handleCancelRename = () => {
    setEditingIndex(null);
    setEditingName('');
  };

  const handleEdit = (index) => {
    const comp = comparisons[index];
    toast({
      title: "Editar comparativa",
      description: `Abriendo editor para ${comp.name}...`
    });
    // TODO: Implementar navegación a página de edición
    // router.push(`/comparativas/editar/${comp.id}`);
  };

  const handleDelete = async (index) => {
    const comp = comparisons[index];
    
    try {
      // Delete from backend if it has an ID
      if (comp.id) {
        const token = getJWTToken();
        if (token) {
          const response = await deleteComparativa(comp.id, token);
          if (!response.ok) {
            toast({
              title: "Error al eliminar",
              description: "No se pudo eliminar la comparativa del servidor",
              variant: "destructive"
            });
            return;
          }
        }
      }
      
      // Remove from local state
      const updatedComparisons = comparisons.filter((_, i) => i !== index);
      setComparisons(updatedComparisons);
      
      // Si el elemento estaba seleccionado, lo removemos de la selección
      if (selectedItems.includes(index)) {
        setSelectedItems(selectedItems.filter(i => i !== index));
      }
      
      toast({
        title: "Comparativa eliminada",
        description: `${comp.name} ha sido eliminada correctamente`
      });
    } catch (error) {
      console.error('Error deleting comparativa:', error);
      toast({
        title: "Error",
        description: "Ocurrió un error al eliminar la comparativa",
        variant: "destructive"
      });
    }
  };

  const handleDeleteSelected = () => {
    const remaining = comparisons.filter((_, index) => !selectedItems.includes(index));
    const deletedCount = selectedItems.length;
    
    setComparisons(remaining);
    setSelectedItems([]);
    setSelectionMode(false);
    
    toast({
      title: "Comparativas eliminadas",
      description: `${deletedCount} comparativa(s) han sido eliminadas`
    });
  };

  const handleSupplyTypeSelection = (type) => {
    setSupplyType(type);
    nextStep();
  };

  const handleCustomerTypeSelection = (type) => {
    setCustomerType(type);
    nextStep();
  };

  const handleBack = () => {
    if (formStep > 1) {
      if ((formStep === 12 && supplyType === 'luz') || (formStep === 10 && supplyType === 'gas')) {
        if(addClientBillData) setAddClientBillData(false);
      }
      setFormStep(formStep - 1);
    }
  };

   const handleCalculate = async () => {
    if (!isFormValid) {
        toast({
            title: "Formulario Incompleto",
            description: "Por favor, revisa los pasos marcados en rojo y completa todos los campos.",
        });
        return;
    }

    // Calculate estimated prices for saving to database
    const calculateEstimatedPrices = () => {
      let oldPrice = parseFloat(currentBillAmount) || 0;
      let newPrice = oldPrice * 0.85; // Default 15% savings estimate
      
      // More realistic calculation based on type
      if (supplyType === 'luz') {
        // Basic estimation logic for electricity
        const avgPotencia = comparativePotencia.reduce((sum, p) => sum + parseFloat(p || 0), 0) / comparativePotencia.length;
        const avgEnergia = comparativeEnergy.reduce((sum, e) => sum + parseFloat(e || 0), 0) / comparativeEnergy.length;
        
        // Rough estimate: potencia costs + energy costs
        const potenciaCost = avgPotencia * 0.12 * parseInt(numDias); // €0.12/kW/day estimate
        const energiaCost = avgEnergia * 0.15; // €0.15/kWh estimate
        
        if (potenciaCost + energiaCost > 0) {
          oldPrice = potenciaCost + energiaCost;
          newPrice = oldPrice * 0.82; // 18% savings estimate
        }
      } else if (supplyType === 'gas') {
        // Basic estimation logic for gas
        const gasConsumption = parseFloat(gasEnergy) || 0;
        oldPrice = gasConsumption * 0.08; // €0.08/kWh estimate
        newPrice = oldPrice * 0.88; // 12% savings estimate
      }
      
      return { oldPrice, newPrice };
    };

    const { oldPrice, newPrice } = calculateEstimatedPrices();

    // Prepare data for database
    const comparativaData = {
      clientName: clientName || 'Cliente Sin Nombre',
      comparisonType: supplyType,
      customerType: customerType === 'particular' ? 'particular' : 'empresa',
      tariffType: supplyType === 'luz' ? selectedLightTariff : selectedGasTariff,
      solarPanelActive: solarPanelActive || false,
      excedentes: solarPanelActive ? parseFloat(comparativeExcedentes) : null,
      potencias: supplyType === 'luz' ? comparativePotencia.map(p => parseFloat(p)) : null,
      energias: supplyType === 'luz' ? comparativeEnergy.map(e => parseFloat(e)) : null,
      numDias: parseInt(numDias, 10),
      currentBillAmount: parseFloat(currentBillAmount),
      hasMainServices,
      mainMaintenanceCost: hasMainServices ? parseFloat(mainMaintenanceCost) : null,
      hasClientServices: hasClientServices || false,
      clientMaintenanceCost: hasClientServices ? parseFloat(clientMaintenanceCost) : null,
      clientPowerPrices: addClientBillData && supplyType === 'luz' ? clientPowerPrices.map(p => parseFloat(p)) : null,
      clientEnergyPrices: addClientBillData && supplyType === 'luz' ? clientEnergyPrices.map(e => parseFloat(e)) : null,
      clientSurplusPrice: addClientBillData && solarPanelActive ? parseFloat(clientSurplusPrice) : null,
      clientFixedPrice: addClientBillData && supplyType === 'gas' ? parseFloat(clientFixedPrice) : null,
      clientGasEnergyPrice: addClientBillData && supplyType === 'gas' ? parseFloat(clientGasEnergyPrice) : null,
      calculatedOldPrice: oldPrice,
      calculatedNewPrice: newPrice,
      savings: oldPrice - newPrice,
    };

    // Save to database
    try {
      const token = getJWTToken();
      if (token) {
        const response = await createComparativa(comparativaData, token);
        if (response && response.ok) {
          console.log('Comparativa saved to database');
          // Reload comparativas list after saving
          setTimeout(() => {
            loadComparativas();
          }, 500);
        } else {
          console.log('Failed to save comparativa to database');
        }
      }
    } catch (error) {
      console.error('Error saving comparativa:', error);
    }

    const comparisonData = {
        // Common
        comparisonType: supplyType,
        customerType: customerType === 'particular' ? 'residencial' : 'empresa',
        numDias: parseInt(numDias, 10),
        currentBillAmount: parseFloat(currentBillAmount),
        hasMainServices,
        mainMaintenanceCost: hasMainServices ? parseFloat(mainMaintenanceCost) : 0,

        // Client Bill Data
        showCurrentBill: addClientBillData,
        clientName,
        hasClientServices,
        clientMaintenanceCost: hasClientServices ? parseFloat(clientMaintenanceCost) : 0,
        
        // Light specific
        ...(supplyType === 'luz' && {
            selectedLightTariff,
            solarPanelActive,
            potencias: comparativePotencia.map(p => parseFloat(p)),
            energias: comparativeEnergy.map(e => parseFloat(e)),
            excedentes: solarPanelActive ? parseFloat(comparativeExcedentes) : 0,
            clientPowerPrices: clientPowerPrices.map(p => parseFloat(p)),
            clientEnergyPrices: clientEnergyPrices.map(e => parseFloat(e)),
            clientSurplusPrice: solarPanelActive ? parseFloat(clientSurplusPrice) : 0,
        }),

        // Gas specific
        ...(supplyType === 'gas' && {
            selectedGasTariff,
            energia: parseFloat(gasEnergy),
            clientFixedPrice: parseFloat(clientFixedPrice),
            clientGasEnergyPrice: parseFloat(clientGasEnergyPrice),
        })
    };

    sessionStorage.setItem('comparisonData', JSON.stringify(comparisonData));
    router.push('/comparativas/resultados');
  };
  
  const renderFormStep = () => {
     switch (formStep) {
      case 1:
        return (
            <div className="flex gap-4">
                <Button variant="outline" className="w-full" onClick={() => handleSupplyTypeSelection('luz')}>
                  Luz
                </Button>
                <Button variant="outline" className="w-full" onClick={() => handleSupplyTypeSelection('gas')}>
                  Gas
                </Button>
            </div>
        );
      case 2:
        return (
            <div className="flex flex-col gap-4">
                <div className="flex gap-4">
                <Button variant="outline" className="w-full" onClick={() => handleCustomerTypeSelection('particular')}>
                    Particular/Autónomo
                </Button>
                <Button variant="outline" className="w-full" onClick={() => handleCustomerTypeSelection('empresa')}>
                    Empresa
                </Button>
                </div>
            </div>
        );
      default:
        if (supplyType === 'luz') return renderLuzSteps();
        if (supplyType === 'gas') return renderGasSteps();
        return null;
    }
  }

  const renderLuzSteps = () => {
    switch (formStep) {
        case 3:
            return (
                <div className="flex flex-col items-center">
                    <Label className="text-base font-semibold">Tipo de Tarifa</Label>
                    <RadioGroup 
                        value={selectedLightTariff || ''}
                        onValueChange={(v) => {
                            setSelectedLightTariff(v);
                            nextStep();
                        }} 
                        className="flex gap-4 mt-2"
                    >
                        {(['2.0', '3.0', '6.1']).map(val => (
                            <div key={val}>
                                <RadioGroupItem value={val} id={`t-${val}`} className="peer sr-only" />
                                <Label htmlFor={`t-${val}`} className="flex h-14 w-14 cursor-pointer items-center justify-center rounded-md border-2 border-gray-300 bg-white p-3 text-sm font-medium hover:bg-gray-50 peer-data-[state=checked]:border-blue-600 [&:has([data-state=checked])]:border-blue-600">
                                    {val}
                                </Label>
                            </div>
                        ))}
                    </RadioGroup>
                </div>
            );
        case 4:
            return (
                <div className="flex flex-col items-center">
                    <Label className="text-base font-semibold">¿Tiene placas solares?</Label>
                    <RadioGroup 
                        value={solarPanelActive === null ? '' : (solarPanelActive ? 'yes' : 'no')}
                        onValueChange={(v) => {
                            const isActive = v === 'yes';
                            setSolarPanelActive(isActive);
                            if (!isActive) {
                                nextStep();
                            }
                        }} 
                        className="flex gap-4 mt-2"
                    >
                        <RadioGroupItem value="yes" id="solar-yes" />
                        <Label htmlFor="solar-yes">Sí</Label>
                        <RadioGroupItem value="no" id="solar-no" />
                        <Label htmlFor="solar-no">No</Label>
                    </RadioGroup>
                    {solarPanelActive && (
                      <div className="mt-4 w-full max-w-xs">
                          <Label htmlFor="excedentes">Valor de Excedentes (kWh)</Label>
                          <Input id="excedentes" className="h-8 mt-1" type="number" placeholder="kWh" value={comparativeExcedentes} onChange={(e) => setComparativeExcedentes(e.target.value)} />
                      </div>
                    )}
                </div>
            );
        case 5:
            return (
                <div className="flex flex-col items-center w-full">
                    <Label className="font-semibold text-base">Potencia</Label>
                    <div className={`grid ${comparativePotencia.length > 3 ? 'grid-cols-3' : `grid-cols-2`} gap-2 mt-2 w-full max-w-md`}>
                        {comparativePotencia.map((p, index) => (
                            <Input key={`comp-potencia-${index}`} type="number" placeholder={`P${index + 1}`} className="h-8" value={p}
                                onChange={(e) => {
                                    const newPotencia = [...comparativePotencia];
                                    newPotencia[index] = e.target.value;
                                    setComparativePotencia(newPotencia);
                                }}
                            />
                        ))}
                    </div>
                </div>
            );
        case 6:
              return (
                  <div className="flex flex-col items-center w-full">
                      <Label className="font-semibold text-base">Nº Días</Label>
                      <Input className="h-8 mt-2 w-full max-w-xs" type="number" placeholder="e.g. 30" value={numDias} onChange={(e) => setNumDias(e.target.value)} />
                  </div>
              );
        case 7:
            return (
                <div className="flex flex-col items-center w-full">
                    <Label className="font-semibold text-base">Energía</Label>
                    <div className={`grid ${comparativeEnergy.length > 3 ? 'grid-cols-3' : 'grid-cols-3'} gap-2 mt-2 w-full max-w-md`}>
                        {comparativeEnergy.map((e, index) => (
                          <Input key={`comp-energia-${index}`} type="number" placeholder={`E${index + 1}`} className="h-8" value={e}
                              onChange={(event) => {
                                  const newEnergy = [...comparativeEnergy];
                                  newEnergy[index] = event.target.value;
                                  setComparativeEnergy(newEnergy);
                              }}
                          />
                        ))}
                    </div>
                </div>
            );
        case 8:
            return (
                <div className="flex flex-col items-center w-full">
                    <Label className="font-semibold text-base">Nombre Cliente</Label>
                    <Input className="h-8 mt-2 w-full max-w-xs" placeholder="e.g. Juan Pérez" value={clientName} onChange={(e) => setClientName(e.target.value)} />
                </div>
            );
        case 9:
              return (
                  <div className="flex flex-col items-center">
                      <Label className="text-base font-semibold">¿Servicios adicionales?</Label>
                      <RadioGroup 
                          value={hasMainServices === null ? '' : (hasMainServices ? 'yes' : 'no')} 
                          onValueChange={(v) => {
                              const hasServices = v === 'yes';
                              setHasMainServices(hasServices);
                              if (!hasServices) {
                                  nextStep();
                              }
                          }} 
                          className="flex gap-4 mt-2"
                      >
                        <RadioGroupItem value="yes" id="main-serv-yes" />
                        <Label htmlFor="main-serv-yes">Sí</Label>
                        <RadioGroupItem value="no" id="main-serv-no" />
                        <Label htmlFor="main-serv-no">No</Label>
                      </RadioGroup>
                      {hasMainServices && (
                          <div className="mt-4 w-full max-w-xs">
                              <Label htmlFor="main-maintenance">Importe Mantenimiento</Label>
                              <Input id="main-maintenance" type="number" placeholder="e.g. 5.99" value={mainMaintenanceCost} className="h-8 mt-1" onChange={(e) => setMainMaintenanceCost(e.target.value)} />
                          </div>
                      )}
                  </div>
              );
        case 10:
            return (
                <div className="flex flex-col items-center w-full">
                    <Label className="font-semibold text-base">Importe Factura Actual</Label>
                    <Input className="h-8 mt-2 w-full max-w-xs" type="number" placeholder="€" value={currentBillAmount} onChange={(e) => setCurrentBillAmount(e.target.value)} />
                </div>
            );
        case 11:
             return (
                <div className="flex flex-col items-center gap-4">
                    <Label className="text-base font-semibold text-center">¿Quieres añadir datos de la actual factura del cliente a la comparativa?</Label>
                    <div className="flex gap-4">
                        <Button variant="outline" onClick={() => { setAddClientBillData(true); nextStep(); }}>Sí</Button>
                        <Button variant="outline" onClick={() => { setAddClientBillData(false); handleCalculate(); }}>No, Calcular</Button>
                    </div>
                </div>
            );
        case 12:
            return (
                <div className="flex flex-col items-center w-full">
                    <Label className="font-semibold text-base">Precios Potencia Cliente (€/kW día)</Label>
                    <div className={`grid ${clientPowerPrices.length > 3 ? 'grid-cols-3' : 'grid-cols-2'} gap-2 mt-2 w-full max-w-md`}>
                        {clientPowerPrices.map((price, index) => (
                            <Input key={`client-p-${index}`} type="number" placeholder={`P${index + 1}`} value={price} className="h-8"
                                onChange={(e) => {
                                    const newPrices = [...clientPowerPrices];
                                    newPrices[index] = e.target.value;
                                    setClientPowerPrices(newPrices);
                                }}
                            />
                        ))}
                    </div>
                </div>
            );
        case 13:
            return (
                <div className="flex flex-col items-center w-full">
                    <Label className="font-semibold text-base">Precios Energía Cliente (€/kWh)</Label>
                    <div className={`grid ${clientEnergyPrices.length > 3 ? 'grid-cols-3' : 'grid-cols-2'} gap-2 mt-2 w-full max-w-md`}>
                        {clientEnergyPrices.map((price, index) => (
                            <Input key={`client-e-${index}`} type="number" placeholder={`E${index + 1}`} value={price} className="h-8"
                                onChange={(e) => {
                                    const newPrices = [...clientEnergyPrices];
                                    newPrices[index] = e.target.value;
                                    setClientEnergyPrices(newPrices);
                                }}
                            />
                        ))}
                    </div>
                     {solarPanelActive && (
                        <div className="mt-4 w-full max-w-xs">
                            <Label htmlFor="client-surplus">Precio Excedente Cliente (€/kWh)</Label>
                            <Input id="client-surplus" type="number" placeholder="Excedente" value={clientSurplusPrice} className="h-8 mt-1" onChange={(e) => setClientSurplusPrice(e.target.value)} />
                        </div>
                    )}
                </div>
            );
         case 14:
            return (
                 <div className="flex flex-col items-center">
                    <Label className="text-base font-semibold">¿Servicios adicionales cliente?</Label>
                    <RadioGroup 
                        value={hasClientServices === null ? '' : (hasClientServices ? 'yes' : 'no')} 
                        onValueChange={(v) => {
                            const hasServices = v === 'yes';
                            setHasClientServices(hasServices);
                            if (!hasServices) {
                                handleCalculate();
                            }
                        }} 
                        className="flex gap-4 mt-2"
                    >
                      <RadioGroupItem value="yes" id="client-serv-yes" />
                      <Label htmlFor="client-serv-yes">Sí</Label>
                      <RadioGroupItem value="no" id="client-serv-no" />
                      <Label htmlFor="client-serv-no">No</Label>
                    </RadioGroup>
                    {hasClientServices && (
                        <div className="mt-4 w-full max-w-xs">
                            <Label htmlFor="client-maintenance">Importe Mantenimiento Cliente</Label>
                            <Input id="client-maintenance" type="number" placeholder="e.g. 5.99" value={clientMaintenanceCost} className="h-8 mt-1" onChange={(e) => setClientMaintenanceCost(e.target.value)} />
                        </div>
                    )}
                    <Button className="mt-4" disabled={!isFormValid} onClick={handleCalculate}>Calcular Comparativa</Button>
                </div>
            );
        default:
            return null;
    }
  }

   const renderGasSteps = () => {
    switch (formStep) {
        case 3:
            return (
                <div className="flex flex-col items-center">
                    <Label className="text-base font-semibold">Tipo de Tarifa</Label>
                    <RadioGroup 
                        value={selectedGasTariff || ''}
                        onValueChange={(v) => {
                            setSelectedGasTariff(v);
                            nextStep();
                        }} 
                        className="flex gap-4 mt-2"
                    >
                        {(['RL.1', 'RL.2', 'RL.3']).map(val => (
                            <div key={val}>
                                <RadioGroupItem value={val} id={`t-gas-${val}`} className="peer sr-only" />
                                <Label htmlFor={`t-gas-${val}`} className="flex h-14 w-14 cursor-pointer items-center justify-center rounded-md border-2 border-gray-300 bg-white p-3 text-sm font-medium hover:bg-gray-50 peer-data-[state=checked]:border-blue-600 [&:has([data-state=checked])]:border-blue-600">
                                    {val}
                                </Label>
                            </div>
                        ))}
                    </RadioGroup>
                </div>
            );
        case 4:
            return (
                <div className="flex flex-col items-center w-full">
                    <Label className="font-semibold text-base">Nº Días</Label>
                    <Input className="h-8 mt-2 w-full max-w-xs" type="number" placeholder="e.g. 30" value={numDias} onChange={(e) => setNumDias(e.target.value)} />
                </div>
            );
        case 5:
            return (
                <div className="flex flex-col items-center w-full">
                    <Label className="font-semibold text-base">Energía (kWh)</Label>
                    <Input className="h-8 mt-2 w-full max-w-xs" type="number" placeholder="kWh" value={gasEnergy} onChange={(e) => setGasEnergy(e.target.value)} />
                </div>
            );
        case 6:
             return (
                <div className="flex flex-col items-center w-full">
                    <Label className="font-semibold text-base">Nombre Cliente</Label>
                    <Input className="h-8 mt-2 w-full max-w-xs" placeholder="e.g. Juan Pérez" value={clientName} onChange={(e) => setClientName(e.target.value)} />
                </div>
            );
        case 7:
            return (
                <div className="flex flex-col items-center">
                    <Label className="text-base font-semibold">¿Servicios adicionales?</Label>
                    <RadioGroup 
                        value={hasMainServices === null ? '' : (hasMainServices ? 'yes' : 'no')} 
                        onValueChange={(v) => {
                            const hasServices = v === 'yes';
                            setHasMainServices(hasServices);
                            if (!hasServices) {
                                nextStep();
                            }
                        }} 
                        className="flex gap-4 mt-2"
                    >
                        <RadioGroupItem value="yes" id="main-serv-yes-gas" />
                        <Label htmlFor="main-serv-yes-gas">Sí</Label>
                        <RadioGroupItem value="no" id="main-serv-no-gas" />
                        <Label htmlFor="main-serv-no-gas">No</Label>
                    </RadioGroup>
                    {hasMainServices && (
                        <div className="mt-4 w-full max-w-xs">
                            <Label htmlFor="main-maintenance-gas">Importe Mantenimiento</Label>
                            <Input id="main-maintenance-gas" type="number" placeholder="e.g. 5.99" value={mainMaintenanceCost} className="h-8 mt-1" onChange={(e) => setMainMaintenanceCost(e.target.value)} />
                        </div>
                    )}
                </div>
            );
        case 8:
            return (
                <div className="flex flex-col items-center w-full">
                    <Label className="font-semibold text-base">Importe Factura Actual</Label>
                    <Input className="h-8 mt-2 w-full max-w-xs" type="number" placeholder="€" value={currentBillAmount} onChange={(e) => setCurrentBillAmount(e.target.value)} />
                </div>
            );
        case 9:
             return (
                <div className="flex flex-col items-center gap-4">
                    <Label className="text-base font-semibold text-center">¿Quieres añadir datos de la actual factura del cliente a la comparativa?</Label>
                    <div className="flex gap-4">
                        <Button variant="outline" onClick={() => { setAddClientBillData(true); nextStep(); }}>Sí</Button>
                        <Button variant="outline" onClick={() => { setAddClientBillData(false); handleCalculate(); }}>No, Calcular</Button>
                    </div>
                </div>
            );
        case 10:
            return (
                <div className="flex flex-col items-center w-full">
                    <Label className="font-semibold text-base">Término Fijo Cliente (€/día)</Label>
                    <Input className="h-8 mt-2 w-full max-w-xs" type="number" placeholder="e.g. 0.20" value={clientFixedPrice} onChange={(e) => setClientFixedPrice(e.target.value)} />
                </div>
            );
        case 11:
            return (
                <div className="flex flex-col items-center w-full">
                    <Label className="font-semibold text-base">Precio Energía Cliente (€/kWh)</Label>
                    <Input className="h-8 mt-2 w-full max-w-xs" type="number" placeholder="e.g. 0.08" value={clientGasEnergyPrice} onChange={(e) => setClientGasEnergyPrice(e.target.value)} />
                </div>
            );
         case 12:
            return (
                 <div className="flex flex-col items-center">
                    <Label className="text-base font-semibold">¿Servicios adicionales cliente?</Label>
                    <RadioGroup 
                        value={hasClientServices === null ? '' : (hasClientServices ? 'yes' : 'no')} 
                        onValueChange={(v) => {
                            const hasServices = v === 'yes';
                            setHasClientServices(hasServices);
                            if (!hasServices) {
                                handleCalculate();
                            }
                        }} 
                        className="flex gap-4 mt-2"
                    >
                      <RadioGroupItem value="yes" id="client-serv-yes-gas" />
                      <Label htmlFor="client-serv-yes-gas">Sí</Label>
                      <RadioGroupItem value="no" id="client-serv-no-gas" />
                      <Label htmlFor="client-serv-no-gas">No</Label>
                    </RadioGroup>
                    {hasClientServices && (
                        <div className="mt-4 w-full max-w-xs">
                            <Label htmlFor="client-maintenance-gas">Importe Mantenimiento Cliente</Label>
                            <Input id="client-maintenance-gas" type="number" placeholder="e.g. 5.99" value={clientMaintenanceCost} className="h-8 mt-1" onChange={(e) => setClientMaintenanceCost(e.target.value)} />
                        </div>
                    )}
                    <Button className="mt-4" disabled={!isFormValid} onClick={handleCalculate}>Calcular Comparativa</Button>
                </div>
            );
        default:
            return null;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <ComparativasHeader />
      <main className="flex-grow p-8">
        <div className="container mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Column */}
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-bold">Comparativas de Tarifas</h1>
              <p className="text-gray-600 mt-2">Encuentra la mejor tarifa para tu cliente</p>
            </div>
            <Card className="bg-white border border-gray-200">
              <CardHeader>
                <CardTitle>¿Qué comparativa quieres hacer hoy?</CardTitle>
              </CardHeader>
              <CardContent className="min-h-[250px] flex items-center justify-center p-6">
                {renderFormStep()}
              </CardContent>
              {formStep > 1 && (
                  <div className="flex items-center justify-between gap-4 px-6 pb-6">
                    <Button variant="ghost" size="icon" onClick={handleBack} disabled={formStep <= 1} className="h-8 w-8">
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                   
                    <ProgressDots step={formStep} totalSteps={totalSteps} invalidSteps={invalidSteps} />
                   
                    <Button variant="ghost" size="icon" onClick={nextStep} disabled={formStep >= totalSteps || (supplyType === 'luz' && formStep === 11 && !addClientBillData) || (supplyType === 'gas' && formStep === 9 && !addClientBillData)} className="h-8 w-8">
                        <ArrowRight className="h-4 w-4" />
                    </Button>
                </div>
              )}
            </Card>
          </div>

          {/* Right Column */}
          <div>
            <Card className="bg-white border border-gray-200">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Últimas Comparativas</CardTitle>
                 <div className="flex items-center gap-2">
                  {selectionMode && selectedItems.length > 0 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={handleDeleteSelected}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  )}
                  
                  {selectionMode ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={handleCancelSelection}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={handleToggleSelectionMode}
                    >
                      <CircleDot className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingComparativas && (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-gray-500">Cargando comparativas...</div>
                  </div>
                )}
                {!isLoadingComparativas && comparisons.length === 0 && (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-gray-500">No hay comparativas guardadas</div>
                  </div>
                )}
                {!isLoadingComparativas && comparisons.length > 0 && (
                <div className="space-y-4">
                  {comparisons.map((comp, index) => {
                    const isSelected = selectedItems.includes(index);
                    const isEditing = editingIndex === index;
                    
                    return (
                      <div
                        key={index}
                        className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${
                          isSelected ? 'bg-blue-50' : 'bg-gray-50'
                        }`}
                        onClick={() => selectionMode && toggleSelection(index)}
                      >
                        {selectionMode && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSelection(index);
                            }}
                            className="p-1 cursor-pointer focus:outline-none"
                            type="button"
                          >
                            {isSelected ? (
                              <CheckSquare className="h-5 w-5 text-blue-600" />
                            ) : (
                              <Square className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                            )}
                          </button>
                        )}
                        {comp.type === 'luz' ? (
                          <Lightbulb className="h-6 w-6 text-yellow-400" />
                        ) : (
                          <Flame className="h-6 w-6 text-orange-500" />
                        )}
                        <div className="flex-grow">
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <Input
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveRename();
                                  if (e.key === 'Escape') handleCancelRename();
                                }}
                                className="h-8"
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSaveRename();
                                }}
                                className="h-8 px-2"
                              >
                                ✓
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCancelRename();
                                }}
                                className="h-8 px-2"
                              >
                                ✕
                              </Button>
                            </div>
                          ) : (
                            <>
                              <p className="font-semibold">{comp.name}</p>
                              <p className="text-sm text-gray-600">
                                {comp.tariffType} &bull; {comp.lastAccessed}
                              </p>
                            </>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-lg">{comp.newPrice}</p>
                          <p className="text-sm text-gray-600 line-through">
                            {comp.oldPrice}
                          </p>
                        </div>
                        {!selectionMode && !isEditing && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem 
                                onSelect={(e) => {
                                  e.preventDefault();
                                  handleExport(index);
                                }}
                                className="cursor-pointer flex items-center gap-2"
                              >
                                <Download className="h-4 w-4" />
                                <span>Exportar</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onSelect={(e) => {
                                  e.preventDefault();
                                  handleRename(index);
                                }}
                                className="cursor-pointer flex items-center gap-2"
                              >
                                <Edit2 className="h-4 w-4" />
                                <span>Renombrar</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onSelect={(e) => {
                                  e.preventDefault();
                                  handleEdit(index);
                                }}
                                className="cursor-pointer flex items-center gap-2"
                              >
                                <Edit3 className="h-4 w-4" />
                                <span>Editar</span>
                              </DropdownMenuItem>
                              <div className="my-1 h-px bg-gray-200"></div>
                              <DropdownMenuItem 
                                onSelect={(e) => {
                                  e.preventDefault();
                                  handleDelete(index);
                                }}
                                className="text-red-600 focus:text-red-600 cursor-pointer flex items-center gap-2"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span>Borrar</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    );
                  })}
                </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}