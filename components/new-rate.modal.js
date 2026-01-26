"use client";

import { authFetch } from "@/helpers/server-fetch.helper";
import { useState, useEffect } from "react";
import { getCookie } from "cookies-next";
import BaseModal, { ModalActions, ModalButton, ModalInput } from "./base-modal.component";

export default function NewRateModal({
  isOpen,
  onClose,
  onSave,
  companyId,
  rateToEdit,
}) {
  const [activeTab, setActiveTab] = useState("prices");
  const [documentationValues, setDocumentationValues] = useState([]);
  const [error, setError] = useState({ name: "", type: "", renewDays: "", serviceType: "" });

  const [newRate, setNewRate] = useState({
    name: "",
    type: "",
    serviceType: "Luz",
    renewDays: 0,
    powerSlot1: "",
    powerSlot2: "",
    powerSlot3: "",
    powerSlot4: "",
    powerSlot5: "",
    powerSlot6: "",
    energySlot1: "",
    energySlot2: "",
    energySlot3: "",
    energySlot4: "",
    energySlot5: "",
    energySlot6: "",
    surplusSlot1: "",
    products: "",
    finalPrice: 0,
  });

  useEffect(() => {
    setActiveTab("prices");
    setDocumentationValues([]);
    setError({ name: "", type: "", renewDays: "", serviceType: "" });
    if (rateToEdit) {
      const normalizedRate = Object.keys(newRate).reduce((acc, key) => {
        acc[key] = rateToEdit[key] !== undefined && rateToEdit[key] !== null ? rateToEdit[key] : "";
        return acc;
      }, {});
      // Asegurar que serviceType tenga un valor por defecto si no viene
      if (!normalizedRate.serviceType) {
        normalizedRate.serviceType = "Luz";
      }
      setNewRate(normalizedRate);
    }
    if (rateToEdit && rateToEdit.documentation) {
      setDocumentationValues(rateToEdit.documentation);
    }
  }, [rateToEdit]);

  const cleanData = (data) => {
    const cleanedData = { ...data };

    for (let key in cleanedData) {
      if (cleanedData[key] === "") {
        cleanedData[key] = null;
      } else if (!isNaN(cleanedData[key]) && key !== "type") {
        cleanedData[key] = parseFloat(cleanedData[key]);
      }
    }

    return cleanedData;
  };

  const handleAddRate = async (e) => {
    e.preventDefault();
    setError({ name: "", type: "", renewDays: "", serviceType: "" });

    if (!newRate.name) {
      setError((prev) => ({
        ...prev,
        name: "El nombre de la tarifa es obligatorio.",
      }));
      return;
    }

    if (!newRate.serviceType) {
      setError((prev) => ({
        ...prev,
        serviceType: "El tipo de servicio es obligatorio.",
      }));
      return;
    }

    if (!newRate.type && newRate.serviceType !== "Telefonía") {
      setError((prev) => ({
        ...prev,
        type: "El tipo de tarifa es obligatorio.",
      }));
      return;
    }

    if (!newRate.renewDays || isNaN(newRate.renewDays) || newRate.renewDays <= 0) {
      setError((prev) => ({
        ...prev,
        renewDays: "El número de días para renovación es obligatorio y debe ser mayor a 0.",
      }));
      return;
    }

    const jwtToken = getCookie("factura-token");

    const cleanedRate = cleanData({
      ...newRate,
      companyId,
      documentation: documentationValues,
    });

    if (cleanedRate.finalPrice === 0) {
      cleanedRate.finalPrice = null;
    }

    try {
      const response = await authFetch(
        rateToEdit ? "PATCH" : "POST",
        rateToEdit ? `rates/${rateToEdit.id}` : "rates/",
        cleanedRate,
        jwtToken
      );

      if (response.ok) {
        const addedRate = await response.json();
        onSave(addedRate);

        setNewRate({
          ...newRate,
          documentation: [],
        });
        setDocumentationValues([]);
        onClose();
      } else {
        alert("Error agregando el nuevo estado");
      }
    } catch (error) {
      console.error("Error enviando la solicitud:", error);
    }
  };

  const handleCheckboxChange = (e) => {
    const { value, checked } = e.target;

    setDocumentationValues((prevValues) =>
      checked ? [...prevValues, value] : prevValues.filter((v) => v !== value)
    );
  };

  const serviceTypes = [
    { id: "Luz", label: "Luz", icon: "bolt", color: "blue" },
    { id: "Gas", label: "Gas", icon: "local_fire_department", color: "yellow" },
    { id: "Telefonía", label: "Telefonía", icon: "phone_android", color: "purple" },
  ];

  const rateTypes = [
    { id: "2.0", label: "2.0" },
    { id: "3.0", label: "3.0" },
    { id: "6.1", label: "6.1" },
  ];

  const documentationOptions = [
    { value: "DNI", label: "DNI" },
    { value: "CIF", label: "CIF" },
    { value: "FACTURA", label: "FACTURA" },
    { value: "ESCRITURAS", label: "ESCRITURAS" },
    { value: "GRABACION", label: "GRABACION" },
    { value: "CIE", label: "CIE" },
    { value: "OTRO", label: "OTRO" },
  ];

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={rateToEdit ? "Editar tarifa" : "Crear nueva tarifa"}
      maxWidth="max-w-lg"
    >
      {/* Tabs */}
      <div className="flex mb-6 border-b border-slate-200 dark:border-slate-700">
        <button
          type="button"
          onClick={() => setActiveTab("prices")}
          className={`px-6 py-3 font-medium transition-all ${
            activeTab === "prices"
              ? "border-b-2 border-primary text-primary"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          Precios
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("documentation")}
          className={`px-6 py-3 font-medium transition-all ${
            activeTab === "documentation"
              ? "border-b-2 border-primary text-primary"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          Documentación
        </button>
      </div>

      <form onSubmit={handleAddRate}>
        {activeTab === "prices" && (
          <div className="space-y-4">
            {/* Tipo de Servicio */}
            <div className="mb-4">
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-3">
                Tipo de Servicio
              </label>
              <div className="grid grid-cols-3 gap-3">
                {serviceTypes.map((service) => (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => setNewRate({ ...newRate, serviceType: service.id, type: "" })}
                    className={`flex flex-col items-center justify-center p-4 rounded-lg transition-all ${
                      newRate.serviceType === service.id
                        ? `neumorphic-card ring-2 ring-primary bg-primary bg-opacity-5`
                        : "neumorphic-card-inset hover:shadow-md"
                    }`}
                  >
                    <span
                      className={`material-icons-outlined text-2xl mb-2 ${
                        newRate.serviceType === service.id
                          ? "text-primary"
                          : "text-slate-400"
                      }`}
                    >
                      {service.icon}
                    </span>
                    <span
                      className={`text-sm font-medium ${
                        newRate.serviceType === service.id
                          ? "text-primary"
                          : "text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      {service.label}
                    </span>
                  </button>
                ))}
              </div>
              {error.serviceType && (
                <p className="text-danger text-sm mt-2">{error.serviceType}</p>
              )}
            </div>

            {/* Tipo de Tarifa (solo para Luz) */}
            {newRate.serviceType === "Luz" && (
              <div className="mb-4">
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-3">
                  Tipo de Tarifa
                </label>
                <div className="flex gap-3">
                  {rateTypes.map((rate) => (
                    <button
                      key={rate.id}
                      type="button"
                      onClick={() => setNewRate({ ...newRate, type: rate.id })}
                      className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                        newRate.type === rate.id
                          ? "neumorphic-card ring-2 ring-primary text-primary"
                          : "neumorphic-card-inset text-slate-600 dark:text-slate-400 hover:shadow-md"
                      }`}
                    >
                      {rate.label}
                    </button>
                  ))}
                </div>
                {error.type && (
                  <p className="text-danger text-sm mt-2">{error.type}</p>
                )}
              </div>
            )}

            {/* Nombre de la Tarifa */}
            <ModalInput
              label="Nombre de la Tarifa"
              type="text"
              id="name"
              value={newRate.name}
              onChange={(e) => setNewRate({ ...newRate, name: e.target.value })}
              required
            />
            {error.name && (
              <p className="text-danger text-sm -mt-3 mb-4">{error.name}</p>
            )}

            {/* Retro */}
            <ModalInput
              label="Retro (días)"
              type="number"
              id="renewDays"
              value={newRate.renewDays}
              onChange={(e) =>
                setNewRate({
                  ...newRate,
                  renewDays: parseFloat(e.target.value) || 0,
                })
              }
              required
            />
            {error.renewDays && (
              <p className="text-danger text-sm -mt-3 mb-4">{error.renewDays}</p>
            )}

            {/* Campos de Luz */}
            {newRate.serviceType === "Luz" && (
              <div className="neumorphic-card-inset p-4 rounded-lg space-y-4">
                <h4 className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <span className="material-icons-outlined text-blue-500">bolt</span>
                  Configuración de Luz
                </h4>

                {/* Potencia */}
                <div>
                  <label className="block text-sm text-slate-600 dark:text-slate-400 mb-2">
                    Potencia (kW)
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {(newRate.type === "2.0" ? [1, 2] : [1, 2, 3, 4, 5, 6]).map((slot) => (
                      <div key={`power-${slot}`}>
                        <input
                          type="number"
                          id={`powerSlot${slot}`}
                          placeholder={`Slot ${slot}`}
                          className="w-full px-3 py-2 rounded-lg bg-background-light dark:bg-background-dark text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                          value={newRate[`powerSlot${slot}`] || ""}
                          onChange={(e) =>
                            setNewRate({
                              ...newRate,
                              [`powerSlot${slot}`]: e.target.value,
                            })
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Energía */}
                <div>
                  <label className="block text-sm text-slate-600 dark:text-slate-400 mb-2">
                    Energía (€/kWh)
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {(newRate.type === "2.0" ? [1, 2, 3] : [1, 2, 3, 4, 5, 6]).map((slot) => (
                      <div key={`energy-${slot}`}>
                        <input
                          type="number"
                          id={`energySlot${slot}`}
                          placeholder={`Slot ${slot}`}
                          className="w-full px-3 py-2 rounded-lg bg-background-light dark:bg-background-dark text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                          value={newRate[`energySlot${slot}`] || ""}
                          onChange={(e) =>
                            setNewRate({
                              ...newRate,
                              [`energySlot${slot}`]: e.target.value,
                            })
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Excedente */}
                <ModalInput
                  label="Excedente (€/kWh)"
                  type="number"
                  id="surplusSlot1"
                  value={newRate.surplusSlot1}
                  onChange={(e) => setNewRate({ ...newRate, surplusSlot1: e.target.value })}
                />
              </div>
            )}

            {/* Campos de Telefonía */}
            {newRate.serviceType === "Telefonía" && (
              <div className="neumorphic-card-inset p-4 rounded-lg space-y-4">
                <h4 className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <span className="material-icons-outlined text-purple-500">phone_android</span>
                  Configuración de Telefonía
                </h4>

                <ModalInput
                  label="Producto"
                  type="text"
                  id="products"
                  value={newRate.products}
                  onChange={(e) => setNewRate({ ...newRate, products: e.target.value })}
                  required
                />

                <ModalInput
                  label="Precio final (€/mes)"
                  type="number"
                  id="finalPrice"
                  value={newRate.finalPrice}
                  onChange={(e) =>
                    setNewRate({ ...newRate, finalPrice: parseFloat(e.target.value) || 0 })
                  }
                  required
                />
              </div>
            )}

            {/* Campos de Gas */}
            {newRate.serviceType === "Gas" && (
              <div className="neumorphic-card-inset p-4 rounded-lg space-y-4">
                <h4 className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <span className="material-icons-outlined text-yellow-500">local_fire_department</span>
                  Configuración de Gas
                </h4>

                <ModalInput
                  label="Energía Slot 1 (€/kWh)"
                  type="number"
                  id="energySlot1"
                  value={newRate.energySlot1}
                  onChange={(e) => setNewRate({ ...newRate, energySlot1: e.target.value })}
                />

                <ModalInput
                  label="Excedente (€/kWh)"
                  type="number"
                  id="surplusSlot1"
                  value={newRate.surplusSlot1}
                  onChange={(e) => setNewRate({ ...newRate, surplusSlot1: e.target.value })}
                />
              </div>
            )}
          </div>
        )}

        {activeTab === "documentation" && (
          <div className="space-y-4">
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Selecciona la documentación requerida para esta tarifa:
            </p>
            <div className="grid grid-cols-2 gap-3">
              {documentationOptions.map((doc) => (
                <label
                  key={doc.value}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                    documentationValues.includes(doc.value)
                      ? "neumorphic-card ring-2 ring-primary bg-primary bg-opacity-5"
                      : "neumorphic-card-inset hover:shadow-md"
                  }`}
                >
                  <input
                    type="checkbox"
                    name={doc.value.toLowerCase()}
                    value={doc.value}
                    checked={documentationValues.includes(doc.value)}
                    onChange={handleCheckboxChange}
                    className="w-5 h-5 rounded text-primary focus:ring-primary"
                  />
                  <span
                    className={`font-medium ${
                      documentationValues.includes(doc.value)
                        ? "text-primary"
                        : "text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {doc.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Botones de Acción */}
        <ModalActions>
          <ModalButton variant="ghost" onClick={onClose}>
            Cancelar
          </ModalButton>
          <ModalButton
            variant="primary"
            type="submit"
            icon={rateToEdit ? "save" : "add"}
          >
            {rateToEdit ? "Guardar cambios" : "Crear tarifa"}
          </ModalButton>
        </ModalActions>
      </form>
    </BaseModal>
  );
}
