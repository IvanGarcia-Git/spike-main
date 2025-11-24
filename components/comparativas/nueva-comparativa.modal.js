"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BaseModal, { ModalButton } from "../base-modal.component";

export default function NuevaComparativaModal({ isOpen, onClose }) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Paso 1: Tipo de comparativa
    comparisonType: "",
    customerType: "particular",

    // Paso 2: Datos del cliente
    clientName: "",
    currentBillAmount: "",
    numDias: "30",
    showCurrentBill: true,

    // Paso 3: Datos de luz (si aplica)
    selectedLightTariff: "2.0TD",
    potencias: ["", "", ""],
    energias: ["", "", ""],
    excedentes: "0",
    isSolar: false,

    // Paso 3: Datos de gas (si aplica)
    selectedGasTariff: "RL.1",
    consumo: "",
  });

  const steps = [
    { number: 1, title: "Tipo", description: "Selecciona el tipo de comparativa" },
    { number: 2, title: "Datos del Cliente", description: "Información del cliente" },
    { number: 3, title: "Consumos", description: "Datos de consumo" },
    { number: 4, title: "Resumen", description: "Verificar datos" },
  ];

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleArrayInputChange = (field, index, value) => {
    setFormData((prev) => {
      const newArray = [...prev[field]];
      newArray[index] = value;
      return { ...prev, [field]: newArray };
    });
  };

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    // Guardar datos en sessionStorage para usar en la página de resultados
    sessionStorage.setItem("comparisonData", JSON.stringify(formData));
    router.push("/comparativas/resultados");
    onClose();
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.comparisonType !== "";
      case 2:
        return formData.clientName.trim() !== "" && formData.numDias !== "";
      case 3:
        if (formData.comparisonType === "luz") {
          return formData.potencias.some((p) => p !== "") && formData.energias.some((e) => e !== "");
        } else {
          return formData.consumo !== "";
        }
      case 4:
        return true;
      default:
        return false;
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-4xl"
      showCloseButton={true}
    >
      <div className="max-h-[70vh] overflow-y-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            Nueva Comparativa
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Completa el formulario para crear tu comparativa
          </p>
        </div>

          {/* Timeline */}
          <div className="mb-8">
            <div className="flex justify-between items-center">
              {steps.map((step, index) => (
                <div key={step.number} className="flex-1">
                  <div className="flex items-center">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                          currentStep >= step.number
                            ? "bg-primary text-white shadow-lg"
                            : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                        }`}
                      >
                        {currentStep > step.number ? (
                          <span className="material-icons-outlined text-lg">check</span>
                        ) : (
                          step.number
                        )}
                      </div>
                      <div className="text-center mt-2">
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                          {step.title}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 hidden md:block">
                          {step.description}
                        </p>
                      </div>
                    </div>
                    {index < steps.length - 1 && (
                      <div
                        className={`flex-1 h-1 mx-2 transition-all ${
                          currentStep > step.number
                            ? "bg-primary"
                            : "bg-slate-200 dark:bg-slate-700"
                        }`}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form Steps */}
          <div className="min-h-[400px]">
            {/* Paso 1: Tipo de Comparativa */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
                    Selecciona el tipo de suministro
                  </h4>
                  <div className="flex items-center justify-center space-x-8">
                    <button
                      onClick={() => handleInputChange("comparisonType", "luz")}
                      className={`neumorphic-button flex flex-col items-center justify-center p-8 w-48 h-48 rounded-xl transition-all duration-200 ${
                        formData.comparisonType === "luz"
                          ? "active text-primary shadow-neumorphic-inset-light dark:shadow-neumorphic-inset-dark"
                          : "text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary"
                      }`}
                    >
                      <span className="material-icons-outlined text-6xl mb-2">
                        lightbulb
                      </span>
                      <span className="font-semibold text-xl">Luz</span>
                    </button>

                    <button
                      onClick={() => handleInputChange("comparisonType", "gas")}
                      className={`neumorphic-button flex flex-col items-center justify-center p-8 w-48 h-48 rounded-xl transition-all duration-200 ${
                        formData.comparisonType === "gas"
                          ? "active text-orange-400 shadow-neumorphic-inset-light dark:shadow-neumorphic-inset-dark"
                          : "text-slate-600 dark:text-slate-400 hover:text-orange-400 dark:hover:text-orange-400"
                      }`}
                    >
                      <span className="material-icons-outlined text-6xl mb-2">
                        local_fire_department
                      </span>
                      <span className="font-semibold text-xl">Gas</span>
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
                    Tipo de cliente
                  </h4>
                  <div className="flex items-center justify-center space-x-4">
                    <button
                      onClick={() => handleInputChange("customerType", "particular")}
                      className={`neumorphic-button px-6 py-3 rounded-lg font-semibold transition-all ${
                        formData.customerType === "particular"
                          ? "active text-primary shadow-neumorphic-inset-light dark:shadow-neumorphic-inset-dark"
                          : "text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      Particular
                    </button>
                    <button
                      onClick={() => handleInputChange("customerType", "empresa")}
                      className={`neumorphic-button px-6 py-3 rounded-lg font-semibold transition-all ${
                        formData.customerType === "empresa"
                          ? "active text-primary shadow-neumorphic-inset-light dark:shadow-neumorphic-inset-dark"
                          : "text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      Empresa
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Paso 2: Datos del Cliente */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
                  Datos del Cliente
                </h4>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Nombre del Cliente *
                  </label>
                  <input
                    type="text"
                    value={formData.clientName}
                    onChange={(e) => handleInputChange("clientName", e.target.value)}
                    className="w-full px-4 py-3 rounded-lg neumorphic-card-inset bg-transparent text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Ej: Juan Pérez"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Importe Factura Actual (€)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.currentBillAmount}
                      onChange={(e) => handleInputChange("currentBillAmount", e.target.value)}
                      className="w-full px-4 py-3 rounded-lg neumorphic-card-inset bg-transparent text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Número de Días *
                    </label>
                    <input
                      type="number"
                      value={formData.numDias}
                      onChange={(e) => handleInputChange("numDias", e.target.value)}
                      className="w-full px-4 py-3 rounded-lg neumorphic-card-inset bg-transparent text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="30"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="showCurrentBill"
                    checked={formData.showCurrentBill}
                    onChange={(e) => handleInputChange("showCurrentBill", e.target.checked)}
                    className="w-5 h-5 rounded text-primary focus:ring-primary"
                  />
                  <label
                    htmlFor="showCurrentBill"
                    className="text-sm font-medium text-slate-700 dark:text-slate-300"
                  >
                    Mostrar factura actual en comparativa
                  </label>
                </div>
              </div>
            )}

            {/* Paso 3: Datos de Consumo - LUZ */}
            {currentStep === 3 && formData.comparisonType === "luz" && (
              <div className="space-y-6">
                <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
                  Datos de Consumo de Luz
                </h4>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Tipo de Tarifa
                  </label>
                  <select
                    value={formData.selectedLightTariff}
                    onChange={(e) => handleInputChange("selectedLightTariff", e.target.value)}
                    className="w-full px-4 py-3 rounded-lg neumorphic-card-inset bg-transparent text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="2.0TD">2.0TD - Hogares (hasta 10 kW)</option>
                    <option value="3.0TD">3.0TD - Empresas (hasta 15 kW)</option>
                    <option value="6.1TD">6.1TD - Empresas (más de 15 kW)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Potencias Contratadas (kW) *
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    {["P1", "P2", "P3"].map((label, index) => (
                      <div key={label}>
                        <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                          {label}
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.potencias[index]}
                          onChange={(e) => handleArrayInputChange("potencias", index, e.target.value)}
                          className="w-full px-4 py-3 rounded-lg neumorphic-card-inset bg-transparent text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="0.00"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Consumos de Energía (kWh) *
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    {["P1", "P2", "P3"].map((label, index) => (
                      <div key={label}>
                        <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                          {label}
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.energias[index]}
                          onChange={(e) => handleArrayInputChange("energias", index, e.target.value)}
                          className="w-full px-4 py-3 rounded-lg neumorphic-card-inset bg-transparent text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="0.00"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <input
                      type="checkbox"
                      id="isSolar"
                      checked={formData.isSolar}
                      onChange={(e) => handleInputChange("isSolar", e.target.checked)}
                      className="w-5 h-5 rounded text-primary focus:ring-primary"
                    />
                    <label
                      htmlFor="isSolar"
                      className="text-sm font-medium text-slate-700 dark:text-slate-300"
                    >
                      Instalación con Placas Solares
                    </label>
                  </div>

                  {formData.isSolar && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Excedentes (kWh)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.excedentes}
                        onChange={(e) => handleInputChange("excedentes", e.target.value)}
                        className="w-full px-4 py-3 rounded-lg neumorphic-card-inset bg-transparent text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="0.00"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Paso 3: Datos de Consumo - GAS */}
            {currentStep === 3 && formData.comparisonType === "gas" && (
              <div className="space-y-6">
                <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
                  Datos de Consumo de Gas
                </h4>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Tipo de Tarifa
                  </label>
                  <select
                    value={formData.selectedGasTariff}
                    onChange={(e) => handleInputChange("selectedGasTariff", e.target.value)}
                    className="w-full px-4 py-3 rounded-lg neumorphic-card-inset bg-transparent text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="RL.1">RL.1 - Uso doméstico (hasta 5.000 kWh/año)</option>
                    <option value="RL.2">RL.2 - Uso doméstico (5.000-50.000 kWh/año)</option>
                    <option value="RL.3">RL.3 - Uso industrial (50.000-100.000 kWh/año)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Consumo de Gas (kWh) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.consumo}
                    onChange={(e) => handleInputChange("consumo", e.target.value)}
                    className="w-full px-4 py-3 rounded-lg neumorphic-card-inset bg-transparent text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="0.00"
                  />
                </div>
              </div>
            )}

            {/* Paso 4: Resumen */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
                  Resumen de la Comparativa
                </h4>

                <div className="neumorphic-card p-6 space-y-4">
                  <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                    <span className="text-slate-600 dark:text-slate-400">Tipo de Suministro:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-100 uppercase">
                      {formData.comparisonType}
                    </span>
                  </div>

                  <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                    <span className="text-slate-600 dark:text-slate-400">Tipo de Cliente:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-100 capitalize">
                      {formData.customerType}
                    </span>
                  </div>

                  <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                    <span className="text-slate-600 dark:text-slate-400">Cliente:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-100">
                      {formData.clientName}
                    </span>
                  </div>

                  <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                    <span className="text-slate-600 dark:text-slate-400">Días:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-100">
                      {formData.numDias}
                    </span>
                  </div>

                  {formData.currentBillAmount && (
                    <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                      <span className="text-slate-600 dark:text-slate-400">Factura Actual:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-100">
                        {formData.currentBillAmount}€
                      </span>
                    </div>
                  )}

                  {formData.comparisonType === "luz" && (
                    <>
                      <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                        <span className="text-slate-600 dark:text-slate-400">Tarifa:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-100">
                          {formData.selectedLightTariff}
                        </span>
                      </div>
                      {formData.isSolar && (
                        <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                          <span className="text-slate-600 dark:text-slate-400">Excedentes:</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-100">
                            {formData.excedentes} kWh
                          </span>
                        </div>
                      )}
                    </>
                  )}

                  {formData.comparisonType === "gas" && (
                    <>
                      <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                        <span className="text-slate-600 dark:text-slate-400">Tarifa:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-100">
                          {formData.selectedGasTariff}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                        <span className="text-slate-600 dark:text-slate-400">Consumo:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-100">
                          {formData.consumo} kWh
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <ModalButton
            onClick={handleBack}
            disabled={currentStep === 1}
            variant="ghost"
            icon="arrow_back"
          >
            Anterior
          </ModalButton>

          <ModalButton
            onClick={handleNext}
            disabled={!isStepValid()}
            variant="primary"
            icon={currentStep !== steps.length ? "arrow_forward" : undefined}
          >
            {currentStep === steps.length ? "Comparar" : "Siguiente"}
          </ModalButton>
        </div>
      </div>
    </BaseModal>
  );
}
