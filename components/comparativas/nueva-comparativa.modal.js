"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCookie } from "cookies-next";
import BaseModal, { ModalButton } from "../base-modal.component";
import { extractInvoiceData, getComparativaById } from "@/helpers/server-fetch.helper";

// Periodos de POTENCIA por tarifa: 2.0TD → 2 (P1 punta, P2 valle); 3.0/6.1 → 6.
const getPowerPeriods = (tariff) => {
  switch (tariff) {
    case "3.0TD":
    case "6.1TD":
      return 6; // P1-P6
    case "2.0TD":
    default:
      return 2; // P1, P2
  }
};

// Periodos de ENERGÍA por tarifa: 2.0TD → 3 (P1 punta, P2 llano, P3 valle); 3.0/6.1 → 6.
const getEnergyPeriods = (tariff) => {
  switch (tariff) {
    case "3.0TD":
    case "6.1TD":
      return 6; // P1-P6
    case "2.0TD":
    default:
      return 3; // P1, P2, P3
  }
};

// Generate array with empty strings based on count
const generateEmptyArray = (count) => Array(count).fill("");

// Generate period labels based on count
const getPeriodLabels = (count) => Array.from({ length: count }, (_, i) => `P${i + 1}`);

// Estado inicial del formulario (reutilizado al abrir/crear y tras enviar).
const getDefaultFormData = () => ({
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
  potencias: generateEmptyArray(getPowerPeriods("2.0TD")), // 2 para 2.0TD
  energias: generateEmptyArray(getEnergyPeriods("2.0TD")), // 3 para 2.0TD
  excedentes: "0",
  isSolar: false,

  // Paso 3: Datos de gas (si aplica)
  selectedGasTariff: "RL.1",
  consumo: "",
});

export default function NuevaComparativaModal({ isOpen, editId, onClose, onCreated }) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // PRES-018 B1 — extracción de factura con IA
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState("");
  const [extractedFields, setExtractedFields] = useState([]); // campos de baja confianza a revisar
  const [invoiceAnalyzed, setInvoiceAnalyzed] = useState(false); // PRES-018 — la factura ya fue analizada por la IA
  const [isLoadingEdit, setIsLoadingEdit] = useState(false); // cargando datos de la comparativa a editar
  const [formData, setFormData] = useState(getDefaultFormData());

  const steps = [
    { number: 1, title: "Tipo", description: "Selecciona el tipo de comparativa" },
    { number: 2, title: "Datos del Cliente", description: "Información del cliente" },
    { number: 3, title: "Consumos", description: "Datos de consumo" },
    { number: 4, title: "Resumen", description: "Verificar datos" },
  ];

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Redimensiona potencias y energías de forma INDEPENDIENTE al cambiar de tarifa
  // (2.0TD usa 2 potencias y 3 energías; 3.0/6.1 usan 6 y 6).
  useEffect(() => {
    const powerCount = getPowerPeriods(formData.selectedLightTariff);
    const energyCount = getEnergyPeriods(formData.selectedLightTariff);

    if (powerCount !== formData.potencias.length || energyCount !== formData.energias.length) {
      setFormData((prev) => ({
        ...prev,
        potencias: Array(powerCount).fill("").map((_, i) => prev.potencias[i] || ""),
        energias: Array(energyCount).fill("").map((_, i) => prev.energias[i] || ""),
      }));
    }
  }, [formData.selectedLightTariff]);

  // Al abrir el modal: en modo edición (editId) hace GET de la comparativa y
  // precarga los primeros pasos del wizard; en modo creación resetea el form.
  useEffect(() => {
    if (!isOpen) return;

    // Modo creación: parte de un formulario limpio.
    if (!editId) {
      setFormData(getDefaultFormData());
      setCurrentStep(1);
      setInvoiceAnalyzed(false);
      setExtractedFields([]);
      setExtractError("");
      return;
    }

    // Modo edición: carga los datos existentes para precargar el wizard.
    let cancelled = false;
    const loadForEdit = async () => {
      setIsLoadingEdit(true);
      setCurrentStep(1);
      try {
        const token = getCookie("factura-token");
        const response = await getComparativaById(editId, token);
        if (!response.ok) {
          console.error("Error loading comparativa for edit:", response.status);
          return;
        }
        const d = await response.json();
        if (cancelled) return;

        const isGas = d.comparisonType === "gas";
        const lightTariff = !isGas && d.tariffType ? d.tariffType : "2.0TD";
        const gasTariff = isGas && d.tariffType ? d.tariffType : "RL.1";
        const powerCount = getPowerPeriods(lightTariff);
        const energyCount = getEnergyPeriods(lightTariff);

        setFormData({
          comparisonType: d.comparisonType || "",
          customerType: d.customerType || "particular",
          clientName: d.clientName || "",
          currentBillAmount:
            d.currentBillAmount != null
              ? String(d.currentBillAmount)
              : d.calculatedOldPrice != null
              ? String(d.calculatedOldPrice)
              : "",
          numDias: d.numDias != null ? String(d.numDias) : "30",
          showCurrentBill: d.showCurrentBill !== false,
          selectedLightTariff: lightTariff,
          potencias: Array(powerCount)
            .fill("")
            .map((_, i) =>
              Array.isArray(d.potencias) && d.potencias[i] != null ? String(d.potencias[i]) : ""
            ),
          energias: Array(energyCount)
            .fill("")
            .map((_, i) =>
              Array.isArray(d.energias) && d.energias[i] != null ? String(d.energias[i]) : ""
            ),
          excedentes: d.excedentes != null ? String(d.excedentes) : "0",
          isSolar: d.solarPanelActive || false,
          selectedGasTariff: gasTariff,
          consumo: d.energia != null ? String(d.energia) : "",
        });
        setInvoiceAnalyzed(false);
        setExtractedFields([]);
        setExtractError("");
      } catch (error) {
        console.error("Error loading comparativa for edit:", error);
      } finally {
        if (!cancelled) setIsLoadingEdit(false);
      }
    };
    loadForEdit();
    return () => {
      cancelled = true;
    };
  }, [isOpen, editId]);

  const handleArrayInputChange = (field, index, value) => {
    setFormData((prev) => {
      const newArray = [...prev[field]];
      newArray[index] = value;
      return { ...prev, [field]: newArray };
    });
  };

  // PRES-018 B1 — Sube una factura, la procesa con IA y pre-rellena el formulario.
  const handleInvoiceUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // permite re-subir el mismo fichero
    if (!file) return;

    setExtractError("");
    setExtractedFields([]);
    setInvoiceAnalyzed(false);
    setIsExtracting(true);
    try {
      const token = getCookie("factura-token");
      const res = await extractInvoiceData(file, token);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const msg = body?.error?.message || body?.error || "No se pudo procesar la factura";
        throw new Error(msg);
      }
      const d = await res.json();

      setFormData((prev) => {
        const next = { ...prev };
        if (d.comparisonType === "luz" || d.comparisonType === "gas") next.comparisonType = d.comparisonType;
        if (d.customerType === "particular" || d.customerType === "empresa") next.customerType = d.customerType;
        if (d.clientName) next.clientName = d.clientName;
        if (d.currentBillAmount != null) next.currentBillAmount = String(d.currentBillAmount);
        if (d.numDias != null) next.numDias = String(d.numDias);

        if (d.comparisonType === "luz") {
          const validTariffs = ["2.0TD", "3.0TD", "6.1TD"];
          const tariff = validTariffs.includes(d.tariffType) ? d.tariffType : prev.selectedLightTariff;
          next.selectedLightTariff = tariff;
          const powerCount = getPowerPeriods(tariff);
          const energyCount = getEnergyPeriods(tariff);
          if (Array.isArray(d.potencias)) {
            next.potencias = Array(powerCount).fill("").map((_, i) =>
              d.potencias[i] != null ? String(d.potencias[i]) : ""
            );
          }
          if (Array.isArray(d.energias)) {
            next.energias = Array(energyCount).fill("").map((_, i) =>
              d.energias[i] != null ? String(d.energias[i]) : ""
            );
          }
        } else if (d.comparisonType === "gas") {
          const validGas = ["RL.1", "RL.2", "RL.3"];
          if (validGas.includes(d.tariffType)) next.selectedGasTariff = d.tariffType;
          if (d.consumo != null) next.consumo = String(d.consumo);
        }
        return next;
      });

      setExtractedFields(Array.isArray(d.lowConfidenceFields) ? d.lowConfidenceFields : []);
      setInvoiceAnalyzed(true);
      // Avanza al paso de datos del cliente para que el usuario revise lo extraído.
      setCurrentStep(2);
    } catch (err) {
      setExtractError(err.message || "Error al procesar la factura");
    } finally {
      setIsExtracting(false);
    }
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

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Store comparison data for results page (list of all company prices)
      // The results page will save the comparativa to backend after calculating results
      sessionStorage.setItem("comparisonData", JSON.stringify({
        // En modo edición arrastra el id para que la página de resultados
        // actualice (PUT) la comparativa existente en vez de crear un duplicado.
        ...(editId ? { id: editId } : {}),
        clientName: formData.clientName,
        comparisonType: formData.comparisonType,
        customerType: formData.customerType,
        selectedLightTariff: formData.selectedLightTariff,
        selectedGasTariff: formData.selectedGasTariff,
        tariffType: formData.comparisonType === "luz" ? formData.selectedLightTariff : formData.selectedGasTariff,
        potencias: formData.potencias?.map(p => parseFloat(p) || 0) || [],
        energias: formData.energias?.map(e => parseFloat(e) || 0) || [],
        energia: formData.consumo ? parseFloat(formData.consumo) || 0 : 0,
        numDias: parseInt(formData.numDias) || 30,
        showCurrentBill: formData.showCurrentBill,
        currentBillAmount: parseFloat(formData.currentBillAmount) || 0,
        excedentes: parseFloat(formData.excedentes) || 0,
        solarPanelActive: formData.isSolar || false,
      }));

      // Reset form
      setCurrentStep(1);
      setFormData(getDefaultFormData());
      setInvoiceAnalyzed(false);
      setExtractedFields([]);
      setExtractError("");

      // Call onCreated callback to refresh the list
      if (onCreated) {
        onCreated();
      }

      onClose();
      router.push("/comparativas/resultados");
    } catch (error) {
      console.error("Error submitting comparativa:", error);
    } finally {
      setIsSubmitting(false);
    }
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
      <div>
        {/* Header */}
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            {editId ? "Editar Comparativa" : "Nueva Comparativa"}
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            {editId
              ? "Modifica los datos de la comparativa y vuelve a calcular"
              : "Completa el formulario para crear tu comparativa"}
          </p>
          {isLoadingEdit && (
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2">
              <span className="material-icons-outlined animate-spin text-base">sync</span>
              Cargando datos de la comparativa…
            </p>
          )}
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

          {/* PRES-018 B1 — Autorrelleno desde factura con IA.
              Esta caja se renderiza por encima de todos los pasos, por lo que el icono de
              "factura analizada" persiste visible en los demás pasos del stepper (PRES-018). */}
          <div className={`mb-6 rounded-xl border p-4 transition-colors ${
            invoiceAnalyzed
              ? "border-green-500/40 bg-green-500/5"
              : "border-primary/30 bg-primary/5"
          }`}>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="flex items-start gap-2">
                <span className={`material-icons-outlined ${
                  invoiceAnalyzed ? "text-green-600 dark:text-green-400" : "text-primary"
                }`}>
                  {invoiceAnalyzed ? "fact_check" : "auto_awesome"}
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {invoiceAnalyzed
                      ? "Factura analizada"
                      : "Rellenar automáticamente desde una factura"}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {invoiceAnalyzed
                      ? "Los datos se han rellenado automáticamente. Revísalos en cada paso antes de continuar."
                      : "Sube la factura (PNG, JPG o PDF) y la IA extraerá los datos. Revísalos antes de continuar."}
                  </p>
                </div>
              </div>
              <label className={`shrink-0 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold cursor-pointer transition-all ${
                isExtracting
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed dark:bg-slate-700"
                  : invoiceAnalyzed
                  ? "bg-green-600 text-white hover:opacity-90"
                  : "bg-primary text-white hover:opacity-90"
              }`}>
                <span className="material-icons-outlined text-lg">
                  {isExtracting ? "hourglass_top" : invoiceAnalyzed ? "fact_check" : "upload_file"}
                </span>
                {isExtracting ? "Procesando…" : invoiceAnalyzed ? "Cambiar factura" : "Subir factura"}
                <input
                  type="file"
                  accept="image/png,image/jpeg,application/pdf"
                  className="hidden"
                  disabled={isExtracting}
                  onChange={handleInvoiceUpload}
                />
              </label>
            </div>
            {extractError && (
              <p className="mt-2 text-xs text-red-600 dark:text-red-400">{extractError}</p>
            )}
            {extractedFields.length > 0 && (
              <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                Revisa estos campos (baja confianza): {extractedFields.join(", ")}
              </p>
            )}
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
                  <div className={`grid gap-4 ${formData.potencias.length <= 3 ? "grid-cols-3" : "grid-cols-3 md:grid-cols-6"}`}>
                    {getPeriodLabels(formData.potencias.length).map((label, index) => (
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
                  <div className={`grid gap-4 ${formData.energias.length <= 3 ? "grid-cols-3" : "grid-cols-3 md:grid-cols-6"}`}>
                    {getPeriodLabels(formData.energias.length).map((label, index) => (
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
            {currentStep === steps.length
              ? editId
                ? "Guardar cambios"
                : "Comparar"
              : "Siguiente"}
          </ModalButton>
        </div>
      </div>
    </BaseModal>
  );
}
