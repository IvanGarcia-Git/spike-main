"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/page-header.component";
import { toast } from "react-toastify";

const ProgressDots = ({ step, totalSteps, invalidSteps = [] }) => (
  <div className="flex justify-center gap-2 mb-6">
    {Array.from({ length: totalSteps }).map((_, index) => {
      const stepNumber = index + 1;
      const isInvalid = invalidSteps.includes(stepNumber);
      const isActive = step === stepNumber;

      let colorClass = "bg-slate-300 dark:bg-slate-600";
      if (isActive) {
        colorClass = "bg-primary";
      } else if (isInvalid) {
        colorClass = "bg-red-500";
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
  const [formStep, setFormStep] = useState(1);
  const [supplyType, setSupplyType] = useState(null);

  // Form state
  const [customerType, setCustomerType] = useState(null);
  const [selectedLightTariff, setSelectedLightTariff] = useState(null);
  const [solarPanelActive, setSolarPanelActive] = useState(null);
  const [comparativeExcedentes, setComparativeExcedentes] = useState("");
  const [comparativePotencia, setComparativePotencia] = useState(Array(2).fill(""));
  const [numDias, setNumDias] = useState("");
  const [comparativeEnergy, setComparativeEnergy] = useState(Array(3).fill(""));
  const [hasMainServices, setHasMainServices] = useState(null);
  const [mainMaintenanceCost, setMainMaintenanceCost] = useState("");
  const [currentBillAmount, setCurrentBillAmount] = useState("");
  const [selectedGasTariff, setSelectedGasTariff] = useState(null);
  const [gasEnergy, setGasEnergy] = useState("");
  const [addClientBillData, setAddClientBillData] = useState(false);

  const [clientName, setClientName] = useState("");
  const [clientPowerPrices, setClientPowerPrices] = useState(["", ""]);
  const [clientEnergyPrices, setClientEnergyPrices] = useState(["", "", ""]);
  const [clientSurplusPrice, setClientSurplusPrice] = useState("");
  const [clientFixedPrice, setClientFixedPrice] = useState("");
  const [clientGasEnergyPrice, setClientGasEnergyPrice] = useState("");
  const [hasClientServices, setHasClientServices] = useState(null);
  const [clientMaintenanceCost, setClientMaintenanceCost] = useState("");

  const [maxStepReached, setMaxStepReached] = useState(1);
  const [invalidSteps, setInvalidSteps] = useState([]);

  useEffect(() => {
    if (!selectedLightTariff) return;
    const numPowerPeriods = selectedLightTariff === "2.0" ? 2 : 6;
    const numEnergyPeriods = selectedLightTariff === "2.0" ? 3 : 6;

    const resizeArray = (current, newSize) => {
      const newArray = Array(newSize).fill("");
      for (let i = 0; i < Math.min(current.length, newSize); i++) {
        newArray[i] = current[i] || "";
      }
      return newArray;
    };

    setComparativePotencia((current) => resizeArray(current, numPowerPeriods));
    setComparativeEnergy((current) => resizeArray(current, numEnergyPeriods));
    setClientPowerPrices((current) => resizeArray(current, numPowerPeriods));
    setClientEnergyPrices((current) => resizeArray(current, numEnergyPeriods));
  }, [selectedLightTariff]);

  useEffect(() => {
    if (formStep > maxStepReached) {
      setMaxStepReached(formStep);
    }
  }, [formStep, maxStepReached]);

  const nextStep = () => {
    if (formStep < totalSteps) {
      setFormStep((prev) => prev + 1);
    }
  };

  const validateStep = useCallback(
    (step) => {
      if (supplyType === "luz") {
        switch (step) {
          case 1:
            return supplyType !== null;
          case 2:
            return customerType !== null;
          case 3:
            return selectedLightTariff !== null;
          case 4:
            return (
              solarPanelActive !== null &&
              (!solarPanelActive || comparativeExcedentes.trim() !== "")
            );
          case 5:
            return comparativePotencia.every(
              (p) => p.trim() !== "" && !isNaN(parseFloat(p))
            );
          case 6:
            return numDias.trim() !== "" && !isNaN(parseInt(numDias));
          case 7:
            return comparativeEnergy.every(
              (e) => e.trim() !== "" && !isNaN(parseFloat(e))
            );
          case 8:
            return clientName.trim() !== "";
          case 9:
            return (
              hasMainServices !== null &&
              (!hasMainServices ||
                (mainMaintenanceCost.trim() !== "" &&
                  !isNaN(parseFloat(mainMaintenanceCost))))
            );
          case 10:
            return (
              currentBillAmount.trim() !== "" &&
              !isNaN(parseFloat(currentBillAmount))
            );
          case 11:
            return true;
          case 12:
            return (
              !addClientBillData ||
              clientPowerPrices.every(
                (p) => p.trim() !== "" && !isNaN(parseFloat(p))
              )
            );
          case 13:
            return (
              !addClientBillData ||
              (clientEnergyPrices.every(
                (e) => e.trim() !== "" && !isNaN(parseFloat(e))
              ) &&
                (!solarPanelActive ||
                  (clientSurplusPrice.trim() !== "" &&
                    !isNaN(parseFloat(clientSurplusPrice)))))
            );
          case 14:
            return (
              !addClientBillData ||
              (hasClientServices !== null &&
                (!hasClientServices ||
                  (clientMaintenanceCost.trim() !== "" &&
                    !isNaN(parseFloat(clientMaintenanceCost)))))
            );
          default:
            return true;
        }
      }
      if (supplyType === "gas") {
        switch (step) {
          case 1:
            return supplyType !== null;
          case 2:
            return customerType !== null;
          case 3:
            return selectedGasTariff !== null;
          case 4:
            return numDias.trim() !== "" && !isNaN(parseInt(numDias));
          case 5:
            return gasEnergy.trim() !== "" && !isNaN(parseFloat(gasEnergy));
          case 6:
            return clientName.trim() !== "";
          case 7:
            return (
              hasMainServices !== null &&
              (!hasMainServices ||
                (mainMaintenanceCost.trim() !== "" &&
                  !isNaN(parseFloat(mainMaintenanceCost))))
            );
          case 8:
            return (
              currentBillAmount.trim() !== "" &&
              !isNaN(parseFloat(currentBillAmount))
            );
          case 9:
            return true;
          case 10:
            return (
              !addClientBillData ||
              (clientFixedPrice.trim() !== "" &&
                !isNaN(parseFloat(clientFixedPrice)))
            );
          case 11:
            return (
              !addClientBillData ||
              (clientGasEnergyPrice.trim() !== "" &&
                !isNaN(parseFloat(clientGasEnergyPrice)))
            );
          case 12:
            return (
              !addClientBillData ||
              (hasClientServices !== null &&
                (!hasClientServices ||
                  (clientMaintenanceCost.trim() !== "" &&
                    !isNaN(parseFloat(clientMaintenanceCost)))))
            );
          default:
            return true;
        }
      }
      return true;
    },
    [
      supplyType,
      customerType,
      selectedLightTariff,
      solarPanelActive,
      comparativeExcedentes,
      comparativePotencia,
      numDias,
      comparativeEnergy,
      hasMainServices,
      mainMaintenanceCost,
      currentBillAmount,
      addClientBillData,
      clientName,
      clientPowerPrices,
      clientEnergyPrices,
      clientSurplusPrice,
      hasClientServices,
      clientMaintenanceCost,
      selectedGasTariff,
      gasEnergy,
      clientFixedPrice,
      clientGasEnergyPrice,
    ]
  );

  const totalSteps = useMemo(() => {
    if (!supplyType) return 1;
    if (supplyType === "luz") {
      return addClientBillData ? 14 : 11;
    } else {
      return addClientBillData ? 12 : 9;
    }
  }, [supplyType, addClientBillData]);

  const isFormValid = useMemo(() => {
    for (let i = 1; i < totalSteps; i++) {
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
      if (
        (formStep === 12 && supplyType === "luz") ||
        (formStep === 10 && supplyType === "gas")
      ) {
        if (addClientBillData) setAddClientBillData(false);
      }
      setFormStep(formStep - 1);
    }
  };

  const handleCalculate = () => {
    if (!isFormValid) {
      toast.error(
        "Por favor, revisa los pasos marcados en rojo y completa todos los campos."
      );
      return;
    }

    const comparisonData = {
      comparisonType: supplyType,
      customerType: customerType === "particular" ? "residencial" : "empresa",
      numDias: parseInt(numDias, 10),
      currentBillAmount: parseFloat(currentBillAmount),
      hasMainServices,
      mainMaintenanceCost: hasMainServices
        ? parseFloat(mainMaintenanceCost)
        : 0,
      showCurrentBill: addClientBillData,
      clientName,
      hasClientServices,
      clientMaintenanceCost: hasClientServices
        ? parseFloat(clientMaintenanceCost)
        : 0,

      ...(supplyType === "luz" && {
        selectedLightTariff,
        solarPanelActive,
        potencias: comparativePotencia.map((p) => parseFloat(p)),
        energias: comparativeEnergy.map((e) => parseFloat(e)),
        excedentes: solarPanelActive ? parseFloat(comparativeExcedentes) : 0,
        clientPowerPrices: clientPowerPrices.map((p) => parseFloat(p)),
        clientEnergyPrices: clientEnergyPrices.map((e) => parseFloat(e)),
        clientSurplusPrice: solarPanelActive
          ? parseFloat(clientSurplusPrice)
          : 0,
      }),

      ...(supplyType === "gas" && {
        selectedGasTariff,
        energia: parseFloat(gasEnergy),
        clientFixedPrice: parseFloat(clientFixedPrice),
        clientGasEnergyPrice: parseFloat(clientGasEnergyPrice),
      }),
    };

    sessionStorage.setItem("comparisonData", JSON.stringify(comparisonData));
    toast.success("Comparativa creada correctamente");
    router.push("/comparativas/resultados");
  };

  const renderFormStep = () => {
    switch (formStep) {
      case 1:
        return (
          <div className="flex flex-col items-center gap-4">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              Selecciona el tipo de suministro
            </h3>
            <div className="flex gap-4">
              <button
                onClick={() => handleSupplyTypeSelection("luz")}
                className="flex flex-col items-center justify-center p-8 w-48 h-48 rounded-xl neumorphic-button hover:shadow-neumorphic-inset-light dark:hover:shadow-neumorphic-inset-dark transition-all"
              >
                <span className="material-icons-outlined text-6xl text-primary mb-2">
                  lightbulb
                </span>
                <span className="font-semibold text-xl">Luz</span>
              </button>
              <button
                onClick={() => handleSupplyTypeSelection("gas")}
                className="flex flex-col items-center justify-center p-8 w-48 h-48 rounded-xl neumorphic-button hover:shadow-neumorphic-inset-light dark:hover:shadow-neumorphic-inset-dark transition-all"
              >
                <span className="material-icons-outlined text-6xl text-orange-500 mb-2">
                  local_fire_department
                </span>
                <span className="font-semibold text-xl">Gas</span>
              </button>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="flex flex-col items-center gap-4">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              Tipo de cliente
            </h3>
            <div className="flex gap-4">
              <button
                onClick={() => handleCustomerTypeSelection("particular")}
                className="px-8 py-3 rounded-lg neumorphic-button font-medium text-slate-700 dark:text-slate-300 hover:bg-primary/10"
              >
                Particular/Autónomo
              </button>
              <button
                onClick={() => handleCustomerTypeSelection("empresa")}
                className="px-8 py-3 rounded-lg neumorphic-button font-medium text-slate-700 dark:text-slate-300 hover:bg-primary/10"
              >
                Empresa
              </button>
            </div>
          </div>
        );
      default:
        if (supplyType === "luz") return renderLuzSteps();
        if (supplyType === "gas") return renderGasSteps();
        return null;
    }
  };

  const renderLuzSteps = () => {
    switch (formStep) {
      case 3:
        return (
          <div className="flex flex-col items-center gap-4">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              Tipo de Tarifa
            </h3>
            <div className="flex gap-4">
              {["2.0", "3.0", "6.1"].map((val) => (
                <button
                  key={val}
                  onClick={() => {
                    setSelectedLightTariff(val);
                    nextStep();
                  }}
                  className={`w-20 h-20 rounded-lg neumorphic-button font-semibold text-lg ${
                    selectedLightTariff === val
                      ? "active text-primary"
                      : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>
        );
      case 4:
        return (
          <div className="flex flex-col items-center gap-4 w-full max-w-md">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              ¿Tiene placas solares?
            </h3>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setSolarPanelActive(true);
                }}
                className={`px-8 py-3 rounded-lg neumorphic-button font-medium ${
                  solarPanelActive === true
                    ? "active text-primary"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                Sí
              </button>
              <button
                onClick={() => {
                  setSolarPanelActive(false);
                  nextStep();
                }}
                className={`px-8 py-3 rounded-lg neumorphic-button font-medium ${
                  solarPanelActive === false
                    ? "active text-primary"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                No
              </button>
            </div>
            {solarPanelActive && (
              <div className="w-full mt-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Valor de Excedentes (kWh)
                </label>
                <input
                  type="number"
                  placeholder="kWh"
                  value={comparativeExcedentes}
                  onChange={(e) => setComparativeExcedentes(e.target.value)}
                  className="w-full neumorphic-card-inset p-3 rounded-lg border-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 bg-transparent"
                />
              </div>
            )}
          </div>
        );
      case 5:
        return (
          <div className="flex flex-col items-center gap-4 w-full max-w-md">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              Potencia
            </h3>
            <div
              className={`grid ${
                comparativePotencia.length > 3 ? "grid-cols-3" : "grid-cols-2"
              } gap-3 w-full`}
            >
              {comparativePotencia.map((p, index) => (
                <input
                  key={`comp-potencia-${index}`}
                  type="number"
                  placeholder={`P${index + 1}`}
                  value={p}
                  onChange={(e) => {
                    const newPotencia = [...comparativePotencia];
                    newPotencia[index] = e.target.value;
                    setComparativePotencia(newPotencia);
                  }}
                  className="neumorphic-card-inset p-3 rounded-lg border-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 bg-transparent"
                />
              ))}
            </div>
          </div>
        );
      case 6:
        return (
          <div className="flex flex-col items-center gap-4 w-full max-w-md">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              Nº Días
            </h3>
            <input
              type="number"
              placeholder="e.g. 30"
              value={numDias}
              onChange={(e) => setNumDias(e.target.value)}
              className="w-full neumorphic-card-inset p-3 rounded-lg border-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 bg-transparent"
            />
          </div>
        );
      case 7:
        return (
          <div className="flex flex-col items-center gap-4 w-full max-w-md">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              Energía
            </h3>
            <div
              className={`grid ${
                comparativeEnergy.length > 3 ? "grid-cols-3" : "grid-cols-3"
              } gap-3 w-full`}
            >
              {comparativeEnergy.map((e, index) => (
                <input
                  key={`comp-energia-${index}`}
                  type="number"
                  placeholder={`E${index + 1}`}
                  value={e}
                  onChange={(event) => {
                    const newEnergy = [...comparativeEnergy];
                    newEnergy[index] = event.target.value;
                    setComparativeEnergy(newEnergy);
                  }}
                  className="neumorphic-card-inset p-3 rounded-lg border-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 bg-transparent"
                />
              ))}
            </div>
          </div>
        );
      case 8:
        return (
          <div className="flex flex-col items-center gap-4 w-full max-w-md">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              Nombre Cliente
            </h3>
            <input
              type="text"
              placeholder="e.g. Juan Pérez"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full neumorphic-card-inset p-3 rounded-lg border-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 bg-transparent"
            />
          </div>
        );
      case 9:
        return (
          <div className="flex flex-col items-center gap-4 w-full max-w-md">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              ¿Servicios adicionales?
            </h3>
            <div className="flex gap-4">
              <button
                onClick={() => setHasMainServices(true)}
                className={`px-8 py-3 rounded-lg neumorphic-button font-medium ${
                  hasMainServices === true
                    ? "active text-primary"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                Sí
              </button>
              <button
                onClick={() => {
                  setHasMainServices(false);
                  nextStep();
                }}
                className={`px-8 py-3 rounded-lg neumorphic-button font-medium ${
                  hasMainServices === false
                    ? "active text-primary"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                No
              </button>
            </div>
            {hasMainServices && (
              <div className="w-full mt-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Importe Mantenimiento
                </label>
                <input
                  type="number"
                  placeholder="e.g. 5.99"
                  value={mainMaintenanceCost}
                  onChange={(e) => setMainMaintenanceCost(e.target.value)}
                  className="w-full neumorphic-card-inset p-3 rounded-lg border-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 bg-transparent"
                />
              </div>
            )}
          </div>
        );
      case 10:
        return (
          <div className="flex flex-col items-center gap-4 w-full max-w-md">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              Importe Factura Actual
            </h3>
            <input
              type="number"
              placeholder="€"
              value={currentBillAmount}
              onChange={(e) => setCurrentBillAmount(e.target.value)}
              className="w-full neumorphic-card-inset p-3 rounded-lg border-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 bg-transparent"
            />
          </div>
        );
      case 11:
        return (
          <div className="flex flex-col items-center gap-4">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 text-center max-w-md">
              ¿Quieres añadir datos de la actual factura del cliente a la
              comparativa?
            </h3>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setAddClientBillData(true);
                  nextStep();
                }}
                className="px-8 py-3 rounded-lg neumorphic-button font-medium text-slate-700 dark:text-slate-300"
              >
                Sí
              </button>
              <button
                onClick={() => {
                  setAddClientBillData(false);
                  handleCalculate();
                }}
                className="px-8 py-3 rounded-lg neumorphic-button active bg-primary text-white font-semibold"
              >
                No, Calcular
              </button>
            </div>
          </div>
        );
      case 12:
        return (
          <div className="flex flex-col items-center gap-4 w-full max-w-md">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              Precios Potencia Cliente (€/kW día)
            </h3>
            <div
              className={`grid ${
                clientPowerPrices.length > 3 ? "grid-cols-3" : "grid-cols-2"
              } gap-3 w-full`}
            >
              {clientPowerPrices.map((price, index) => (
                <input
                  key={`client-p-${index}`}
                  type="number"
                  placeholder={`P${index + 1}`}
                  value={price}
                  onChange={(e) => {
                    const newPrices = [...clientPowerPrices];
                    newPrices[index] = e.target.value;
                    setClientPowerPrices(newPrices);
                  }}
                  className="neumorphic-card-inset p-3 rounded-lg border-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 bg-transparent"
                />
              ))}
            </div>
          </div>
        );
      case 13:
        return (
          <div className="flex flex-col items-center gap-4 w-full max-w-md">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              Precios Energía Cliente (€/kWh)
            </h3>
            <div
              className={`grid ${
                clientEnergyPrices.length > 3 ? "grid-cols-3" : "grid-cols-2"
              } gap-3 w-full`}
            >
              {clientEnergyPrices.map((price, index) => (
                <input
                  key={`client-e-${index}`}
                  type="number"
                  placeholder={`E${index + 1}`}
                  value={price}
                  onChange={(e) => {
                    const newPrices = [...clientEnergyPrices];
                    newPrices[index] = e.target.value;
                    setClientEnergyPrices(newPrices);
                  }}
                  className="neumorphic-card-inset p-3 rounded-lg border-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 bg-transparent"
                />
              ))}
            </div>
            {solarPanelActive && (
              <div className="w-full mt-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Precio Excedente Cliente (€/kWh)
                </label>
                <input
                  type="number"
                  placeholder="Excedente"
                  value={clientSurplusPrice}
                  onChange={(e) => setClientSurplusPrice(e.target.value)}
                  className="w-full neumorphic-card-inset p-3 rounded-lg border-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 bg-transparent"
                />
              </div>
            )}
          </div>
        );
      case 14:
        return (
          <div className="flex flex-col items-center gap-4 w-full max-w-md">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              ¿Servicios adicionales cliente?
            </h3>
            <div className="flex gap-4">
              <button
                onClick={() => setHasClientServices(true)}
                className={`px-8 py-3 rounded-lg neumorphic-button font-medium ${
                  hasClientServices === true
                    ? "active text-primary"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                Sí
              </button>
              <button
                onClick={() => {
                  setHasClientServices(false);
                  handleCalculate();
                }}
                className={`px-8 py-3 rounded-lg neumorphic-button font-medium ${
                  hasClientServices === false
                    ? "active text-primary"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                No
              </button>
            </div>
            {hasClientServices && (
              <div className="w-full mt-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Importe Mantenimiento Cliente
                </label>
                <input
                  type="number"
                  placeholder="e.g. 5.99"
                  value={clientMaintenanceCost}
                  onChange={(e) => setClientMaintenanceCost(e.target.value)}
                  className="w-full neumorphic-card-inset p-3 rounded-lg border-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 bg-transparent"
                />
              </div>
            )}
            {hasClientServices !== null && (
              <button
                onClick={handleCalculate}
                disabled={!isFormValid}
                className="mt-4 px-8 py-3 rounded-lg neumorphic-button active bg-primary text-white font-semibold disabled:opacity-50"
              >
                Calcular Comparativa
              </button>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  const renderGasSteps = () => {
    switch (formStep) {
      case 3:
        return (
          <div className="flex flex-col items-center gap-4">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              Tipo de Tarifa
            </h3>
            <div className="flex gap-4">
              {["RL.1", "RL.2", "RL.3"].map((val) => (
                <button
                  key={val}
                  onClick={() => {
                    setSelectedGasTariff(val);
                    nextStep();
                  }}
                  className={`w-20 h-20 rounded-lg neumorphic-button font-semibold text-lg ${
                    selectedGasTariff === val
                      ? "active text-primary"
                      : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>
        );
      case 4:
        return (
          <div className="flex flex-col items-center gap-4 w-full max-w-md">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              Nº Días
            </h3>
            <input
              type="number"
              placeholder="e.g. 30"
              value={numDias}
              onChange={(e) => setNumDias(e.target.value)}
              className="w-full neumorphic-card-inset p-3 rounded-lg border-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 bg-transparent"
            />
          </div>
        );
      case 5:
        return (
          <div className="flex flex-col items-center gap-4 w-full max-w-md">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              Energía (kWh)
            </h3>
            <input
              type="number"
              placeholder="kWh"
              value={gasEnergy}
              onChange={(e) => setGasEnergy(e.target.value)}
              className="w-full neumorphic-card-inset p-3 rounded-lg border-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 bg-transparent"
            />
          </div>
        );
      case 6:
        return (
          <div className="flex flex-col items-center gap-4 w-full max-w-md">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              Nombre Cliente
            </h3>
            <input
              type="text"
              placeholder="e.g. Juan Pérez"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full neumorphic-card-inset p-3 rounded-lg border-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 bg-transparent"
            />
          </div>
        );
      case 7:
        return (
          <div className="flex flex-col items-center gap-4 w-full max-w-md">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              ¿Servicios adicionales?
            </h3>
            <div className="flex gap-4">
              <button
                onClick={() => setHasMainServices(true)}
                className={`px-8 py-3 rounded-lg neumorphic-button font-medium ${
                  hasMainServices === true
                    ? "active text-primary"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                Sí
              </button>
              <button
                onClick={() => {
                  setHasMainServices(false);
                  nextStep();
                }}
                className={`px-8 py-3 rounded-lg neumorphic-button font-medium ${
                  hasMainServices === false
                    ? "active text-primary"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                No
              </button>
            </div>
            {hasMainServices && (
              <div className="w-full mt-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Importe Mantenimiento
                </label>
                <input
                  type="number"
                  placeholder="e.g. 5.99"
                  value={mainMaintenanceCost}
                  onChange={(e) => setMainMaintenanceCost(e.target.value)}
                  className="w-full neumorphic-card-inset p-3 rounded-lg border-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 bg-transparent"
                />
              </div>
            )}
          </div>
        );
      case 8:
        return (
          <div className="flex flex-col items-center gap-4 w-full max-w-md">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              Importe Factura Actual
            </h3>
            <input
              type="number"
              placeholder="€"
              value={currentBillAmount}
              onChange={(e) => setCurrentBillAmount(e.target.value)}
              className="w-full neumorphic-card-inset p-3 rounded-lg border-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 bg-transparent"
            />
          </div>
        );
      case 9:
        return (
          <div className="flex flex-col items-center gap-4">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 text-center max-w-md">
              ¿Quieres añadir datos de la actual factura del cliente a la
              comparativa?
            </h3>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setAddClientBillData(true);
                  nextStep();
                }}
                className="px-8 py-3 rounded-lg neumorphic-button font-medium text-slate-700 dark:text-slate-300"
              >
                Sí
              </button>
              <button
                onClick={() => {
                  setAddClientBillData(false);
                  handleCalculate();
                }}
                className="px-8 py-3 rounded-lg neumorphic-button active bg-primary text-white font-semibold"
              >
                No, Calcular
              </button>
            </div>
          </div>
        );
      case 10:
        return (
          <div className="flex flex-col items-center gap-4 w-full max-w-md">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              Precio Fijo Cliente (€/día)
            </h3>
            <input
              type="number"
              placeholder="€/día"
              value={clientFixedPrice}
              onChange={(e) => setClientFixedPrice(e.target.value)}
              className="w-full neumorphic-card-inset p-3 rounded-lg border-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 bg-transparent"
            />
          </div>
        );
      case 11:
        return (
          <div className="flex flex-col items-center gap-4 w-full max-w-md">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              Precio Energía Gas Cliente (€/kWh)
            </h3>
            <input
              type="number"
              placeholder="€/kWh"
              value={clientGasEnergyPrice}
              onChange={(e) => setClientGasEnergyPrice(e.target.value)}
              className="w-full neumorphic-card-inset p-3 rounded-lg border-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 bg-transparent"
            />
          </div>
        );
      case 12:
        return (
          <div className="flex flex-col items-center gap-4 w-full max-w-md">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              ¿Servicios adicionales cliente?
            </h3>
            <div className="flex gap-4">
              <button
                onClick={() => setHasClientServices(true)}
                className={`px-8 py-3 rounded-lg neumorphic-button font-medium ${
                  hasClientServices === true
                    ? "active text-primary"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                Sí
              </button>
              <button
                onClick={() => {
                  setHasClientServices(false);
                  handleCalculate();
                }}
                className={`px-8 py-3 rounded-lg neumorphic-button font-medium ${
                  hasClientServices === false
                    ? "active text-primary"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                No
              </button>
            </div>
            {hasClientServices && (
              <div className="w-full mt-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Importe Mantenimiento Cliente
                </label>
                <input
                  type="number"
                  placeholder="e.g. 5.99"
                  value={clientMaintenanceCost}
                  onChange={(e) => setClientMaintenanceCost(e.target.value)}
                  className="w-full neumorphic-card-inset p-3 rounded-lg border-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 bg-transparent"
                />
              </div>
            )}
            {hasClientServices !== null && (
              <button
                onClick={handleCalculate}
                disabled={!isFormValid}
                className="mt-4 px-8 py-3 rounded-lg neumorphic-button active bg-primary text-white font-semibold disabled:opacity-50"
              >
                Calcular Comparativa
              </button>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-6">
      <PageHeader title="Nueva Comparativa" />

      <div className="neumorphic-card p-8">
        <ProgressDots
          step={formStep}
          totalSteps={totalSteps}
          invalidSteps={invalidSteps}
        />

        <div className="min-h-[400px] flex flex-col items-center justify-center">
          {renderFormStep()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={handleBack}
            disabled={formStep === 1}
            className="px-5 py-2 rounded-lg neumorphic-button font-medium text-slate-600 dark:text-slate-400 disabled:opacity-50 flex items-center"
          >
            <span className="material-icons-outlined mr-2">arrow_back</span>
            Atrás
          </button>

          {formStep > 2 &&
            formStep !== 11 &&
            formStep !== 14 &&
            formStep !== 9 &&
            formStep !== 12 &&
            validateStep(formStep) && (
              <button
                onClick={nextStep}
                className="px-5 py-2 rounded-lg neumorphic-button active bg-primary text-white font-semibold flex items-center"
              >
                Siguiente
                <span className="material-icons-outlined ml-2">
                  arrow_forward
                </span>
              </button>
            )}
        </div>
      </div>
    </div>
  );
}
