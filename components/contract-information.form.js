"use client";
import React, { useState, useEffect } from "react";
import { getCookie } from "cookies-next";
import * as jose from "jose";
import { authGetFetch } from "@/helpers/server-fetch.helper";

export default function ContractForm({
  contract,
  isActive,
  companies,
  onSubmit,
  childCustomerFormRef,
}) {
  const [rates, setRates] = useState({});
  const [filteredRates, setFilteredRates] = useState([]);
  const [isManager, setIsManager] = useState(false);
  const [userGroupId, setUserGroupId] = useState(null);

  const [formData, setFormData] = useState({
    isDraft: contract?.isDraft || false,
    contractedPowers: (contract?.contractedPowers || []).map(v => typeof v === 'string' ? parseFloat(v) || 0 : (v || 0)),
    companyId: contract.company?.id || "",
    rateId: contract.rateId || "",
    cups: contract?.cups || "",
    extraInfo: contract?.extraInfo || "",
    maintenance: contract?.maintenance === true,
    electronicBill: contract?.electronicBill === true,
    virtualBat: contract?.virtualBat || false,
    solarPlates: contract?.solarPlates || false,
    product: contract?.product || "",
  });

  const getRates = async () => {
    const jwtToken = getCookie("factura-token");

    try {
      // Filtrar tarifas por serviceType (Luz o Gas) según el tipo de contrato
      const serviceType = contract?.type || "";
      const response = await authGetFetch(`rates/group/company-name?serviceType=${serviceType}`, jwtToken);
      if (response.ok) {
        const ratesData = await response.json();
        setRates(ratesData);

        const currentCompanyRates = ratesData[contract.company?.name];
        setFilteredRates(currentCompanyRates || []);
      } else {
        alert("Error al cargar las tarifas disponibles");
      }
    } catch (error) {
      console.error("Error al obtener las tarifas:", error);
    }
  };

  useEffect(() => {
    if (contract) {
      setFormData({
        isDraft: contract?.isDraft || false,
        contractedPowers: (contract?.contractedPowers || []).map(v => typeof v === 'string' ? parseFloat(v) || 0 : (v || 0)),
        companyName: contract?.company?.name || "",
        companyId: contract.company?.id || "",
        cups: contract?.cups || "",
        rateId: contract?.rate?.id || "",
        extraInfo: contract?.extraInfo || "",
        maintenance: contract?.maintenance === true,
        electronicBill: contract?.electronicBill === true,
        virtualBat: contract?.virtualBat || false,
        solarPlates: contract?.solarPlates || false,
        product: contract?.product || "",
      });

      const jwtToken = getCookie("factura-token");

      if (jwtToken) {
        const payload = jose.decodeJwt(jwtToken);
        setIsManager(payload.isManager || false);
        setUserGroupId(payload.groupId || null);
      }
    }
    getRates();
  }, [contract]);

  const [selectedRateType, setSelectedRateType] = useState(
    contract.rate?.type || ""
  );
  const [filteredSelectRates, setFilteredSelectRates] = useState([]);

  const filterRatesByType = (rateType) => {
    if (!filteredRates) return [];
    // Para Gas no filtramos por tipo de tarifa
    if (contract.type === "Gas") {
      return filteredRates;
    }
    if (!rateType) return [];
    const filteredRatesByType = filteredRates.filter(
      (rate) => rate.type === rateType
    );
    return filteredRatesByType;
  };

  useEffect(() => {
    // Para Gas mostramos todas las tarifas, para Luz filtramos por tipo
    if (contract.type === "Gas") {
      setFilteredSelectRates(filteredRates);
    } else if (selectedRateType) {
      const rates = filterRatesByType(selectedRateType);
      setFilteredSelectRates(rates);
    }
  }, [selectedRateType, filteredRates, contract.type]);

  useEffect(() => {
    if (contract.type === "Gas") {
      // Para Gas, mostrar todas las tarifas de la compañía
      setFilteredSelectRates(filteredRates);
      if (filteredRates.length > 0 && contract.rate) {
        const matchingRate = filteredRates.find(
          (rate) => rate.id === contract.rate.id
        );
        setFormData((prevFormData) => ({
          ...prevFormData,
          rateId: matchingRate ? matchingRate.id : contract.rate?.id || "",
        }));
      }
    } else if (contract.rate && contract.rate?.type) {
      setSelectedRateType(contract.rate.type);
      const rates = filterRatesByType(contract.rate.type);
      setFilteredSelectRates(rates);

      if (rates.length > 0) {
        const matchingRate = rates.find(
          (rate) => rate.id === contract.rate.id
        );
        setFormData((prevFormData) => ({
          ...prevFormData,
          rateId: matchingRate ? matchingRate.id : rates[0].id,
        }));
      }
    }
  }, [contract.rate, filteredRates]);

  const handleRateTypeChange = (newRateType) => {
    setSelectedRateType(newRateType);

    setFormData((prevFormData) => {
      const updatedPowers =
        newRateType === "2.0"
          ? prevFormData.contractedPowers.slice(0, 2)
          : prevFormData.contractedPowers;

      return {
        ...prevFormData,
        contractedPowers: updatedPowers,
        rateId: "",
      };
    });
  };

  useEffect(() => {
    if (formData.companyId && rates) {
      const selectedCompany = companies.find(
        (company) => company.id == formData.companyId
      );

      if (selectedCompany && rates[selectedCompany.name]) {
        const companyRates = rates[selectedCompany.name];

        setFilteredRates(companyRates);
      } else {
        setFilteredRates([]);
      }
    }
  }, [formData.companyId, rates, companies]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prevData) => ({
      ...prevData,
      [name]: name === "rateId" ? Number(value) : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (childCustomerFormRef && childCustomerFormRef.current) {
      const isValid = childCustomerFormRef.current.handleSubmit(true);
      if (!isValid) {
        return;
      }
    }

    // Preparar datos para enviar, convirtiendo strings vacíos a null y booleanos correctamente
    const submitFormData = {
      ...formData,
      type: contract.type,
      isDraft: false,
      rateId: formData.rateId === "" ? null : formData.rateId,
      companyId: formData.companyId === "" ? null : formData.companyId,
      // Asegurar que los booleanos se envíen como booleanos, no strings
      maintenance: formData.maintenance === true || formData.maintenance === "true",
      electronicBill: formData.electronicBill === true || formData.electronicBill === "true",
      virtualBat: formData.virtualBat === true || formData.virtualBat === "true",
      solarPlates: formData.solarPlates === true || formData.solarPlates === "true",
    };

    if (contract.type === "Luz") {
      if (
        isActive &&
        formData.cups &&
        formData.contractedPowers.length > 0 &&
        contract.type === "Luz"
      ) {
        onSubmit(submitFormData);
      } else {
        alert("El CUPS y al menos una potencia son requeridos");
      }
    }
    if (contract.type === "Gas") {
      if (isActive && formData.cups && contract.type === "Gas") {
        onSubmit(submitFormData);
      } else {
        alert("El CUPS es requerido");
      }
    }
  };

  const handleSaveAsDraft = (e) => {
    e.preventDefault();
    if (childCustomerFormRef && childCustomerFormRef.current) {
      const isValid = childCustomerFormRef.current.handleSubmit();
      if (!isValid) {
        return;
      }
    }

    const draftFormData = {
      ...formData,
      type: contract.type,
      isDraft: true,
      rateId: formData.rateId === "" ? null : formData.rateId,
      companyId: formData.companyId === "" ? null : formData.companyId,
      // Asegurar que los booleanos se envíen como booleanos, no strings
      maintenance: formData.maintenance === true || formData.maintenance === "true",
      electronicBill: formData.electronicBill === true || formData.electronicBill === "true",
      virtualBat: formData.virtualBat === true || formData.virtualBat === "true",
      solarPlates: formData.solarPlates === true || formData.solarPlates === "true",
    };
    onSubmit(draftFormData);
  };

  // Solo Supervisores (isManager) o Admin (groupId === 1) pueden editar fichas no borrador
  const fieldDisabled = !formData.isDraft && !isManager && userGroupId !== 1;

  const contractIcon = contract.type === "Luz" ? "bolt" : "local_fire_department";
  const contractColor = contract.type === "Luz" ? "yellow" : "orange";

  return (
    <div
      className={`p-6 rounded-xl ${
        isActive ? "neumorphic-card ring-2 ring-primary" : "neumorphic-card-inset"
      }`}
    >
      {/* Header con icono - igual que en creación */}
      <div className="flex items-center gap-3 mb-6">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-neumorphic-light-lg dark:shadow-neumorphic-dark-lg bg-${contractColor}-500 bg-opacity-10`}>
          <span className={`material-icons-outlined text-2xl text-${contractColor}-500`}>{contractIcon}</span>
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            {contract.type === "Luz" ? "Contrato Luz" : "Contrato Gas"}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {contract.type === "Luz" ? "Electricidad" : "Gas natural"}
          </p>
        </div>
      </div>

      {/* Selector Producto (Solo para Gas) - Movido arriba igual que en creación */}
      {contract.type === "Gas" && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2" htmlFor="product">
            Producto *
          </label>
          <div className="neumorphic-card-inset rounded-lg">
            <select
              id="product"
              name="product"
              value={formData.product}
              onChange={handleChange}
              className="w-full bg-transparent border-none focus:ring-0 px-4 py-3 text-slate-800 dark:text-slate-200"
              disabled={fieldDisabled || !isActive}
              required
            >
              <option value="" disabled>
                Selecciona un producto
              </option>
              {["RL1", "RL2", "RL3", "RL4", "RL5", "RL6"].map((product) => (
                <option key={product} value={product}>
                  {product}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Selección de tipo de tarifa - Solo para Luz igual que en creación */}
      {contract.type === "Luz" && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Tipo de Tarifa
          </label>
          <div className="flex gap-2">
            {["2.0", "3.0", "6.1"].map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => !fieldDisabled && isActive && handleRateTypeChange(option)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedRateType === option
                    ? "neumorphic-button active bg-primary text-white"
                    : "neumorphic-button text-slate-600 dark:text-slate-400"
                } ${fieldDisabled || !isActive ? "opacity-50 cursor-not-allowed" : ""}`}
                disabled={fieldDisabled || !isActive}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Compañía */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2" htmlFor="companyId">
            Compañía *
          </label>
          <div className="neumorphic-card-inset rounded-lg">
            <select
              id="companyId"
              name="companyId"
              value={formData.companyId}
              onChange={handleChange}
              className="w-full bg-transparent border-none focus:ring-0 px-4 py-3 text-slate-800 dark:text-slate-200"
              disabled={fieldDisabled || !isActive}
              required
            >
              <option value="" disabled>
                Selecciona una compañía
              </option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* CUPS */}
        <div>
          <label
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
            htmlFor={`cups-${contract.uuid}`}
          >
            CUPS *
          </label>
          <input
            type="text"
            id={`cups-${contract.uuid}`}
            name="cups"
            className="w-full px-4 py-3 rounded-lg neumorphic-card-inset text-slate-800 dark:text-slate-200 focus:outline-none bg-transparent"
            placeholder="ES0000000000000000XX"
            value={formData.cups}
            onChange={handleChange}
            disabled={fieldDisabled || !isActive}
            required={!contract.isDraft}
          />
        </div>

        {/* Tarifa */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2" htmlFor="rateId">
            Tarifa *
          </label>
          <div className="neumorphic-card-inset rounded-lg">
            <select
              id="rateId"
              name="rateId"
              value={formData.rateId || ""}
              onChange={handleChange}
              className="w-full bg-transparent border-none focus:ring-0 px-4 py-3 text-slate-800 dark:text-slate-200"
              disabled={fieldDisabled || !isActive}
              required
            >
              <option value="" disabled>
                Elige la tarifa
              </option>
              {filteredSelectRates.length > 0 ? (
                filteredSelectRates.map((rate) => (
                  <option key={rate.id} value={rate.id}>
                    {rate.name}
                  </option>
                ))
              ) : (
                <option value="" disabled>
                  No hay tarifas disponibles
                </option>
              )}
            </select>
          </div>
        </div>

        {/* Potencias - Solo para contratos de luz */}
        {contract.type === "Luz" && (
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Potencias Contratadas (kW)
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {Array.from({
                length: selectedRateType === "2.0" ? 2 : 6,
              }).map((_, index) => (
                <input
                  key={index}
                  type="text"
                  name={`powerSlot${index + 1}`}
                  value={formData.contractedPowers?.[index] || ""}
                  onChange={(e) => {
                    const value = e.target.value.replace(",", ".");
                    const numericValue = parseFloat(value) || 0;
                    const updatedPowers = [...formData.contractedPowers];
                    updatedPowers[index] = numericValue;
                    setFormData((prevData) => ({
                      ...prevData,
                      contractedPowers: updatedPowers,
                    }));
                  }}
                  className="w-full px-3 py-3 rounded-lg neumorphic-card-inset text-slate-800 dark:text-slate-200 focus:outline-none bg-transparent text-center"
                  placeholder={`P${index + 1}`}
                  disabled={
                    (selectedRateType === "2.0" && index > 1) ||
                    fieldDisabled ||
                    !isActive
                  }
                  required={!contract.isDraft && index == 0}
                />
              ))}
            </div>
          </div>
        )}

        {/* Placas Solares - Solo para Luz, igual que en creación */}
        {contract.type === "Luz" && (
          <div className="neumorphic-card-inset rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-icons-outlined text-yellow-500">solar_power</span>
                <span className="text-slate-700 dark:text-slate-300 font-medium">Placas Solares</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  id="solarPlates"
                  name="solarPlates"
                  checked={formData.solarPlates}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      solarPlates: e.target.checked,
                      virtualBat: !e.target.checked ? false : formData.virtualBat,
                    })
                  }
                  className="sr-only peer"
                  disabled={fieldDisabled || !isActive}
                />
                <div className={`w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-primary ${fieldDisabled || !isActive ? 'opacity-50' : ''}`}></div>
              </label>
            </div>

            {/* BAT Virtual - solo visible si hay placas */}
            {formData.solarPlates && (
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    BAT Virtual
                  </label>
                  <div className="neumorphic-card-inset rounded-lg">
                    <select
                      id="virtualBat"
                      name="virtualBat"
                      value={formData.virtualBat ? "true" : "false"}
                      onChange={(e) => {
                        const newVirtualBatValue = e.target.value === "true";
                        setFormData({
                          ...formData,
                          virtualBat: newVirtualBatValue,
                        });
                      }}
                      className="bg-transparent border-none focus:ring-0 px-4 py-2 text-slate-800 dark:text-slate-200"
                      disabled={!formData.solarPlates || !isActive || fieldDisabled}
                    >
                      <option value="true">Sí</option>
                      <option value="false">No</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mantenimiento y Factura Electrónica en grid 2 columnas - igual que en creación */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Selector de Mantenimiento */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2" htmlFor="maintenance">
              Mantenimiento
            </label>
            <div className="neumorphic-card-inset rounded-lg">
              <select
                id="maintenance"
                name="maintenance"
                value={formData.maintenance ? "true" : "false"}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maintenance: e.target.value === "true",
                  })
                }
                className="w-full bg-transparent border-none focus:ring-0 px-4 py-3 text-slate-800 dark:text-slate-200"
                disabled={fieldDisabled || !isActive}
                required
              >
                <option value="true">Sí</option>
                <option value="false">No</option>
              </select>
            </div>
          </div>

          {/* Selector de Factura Electrónica */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2" htmlFor="electronicBill">
              Factura Electrónica
            </label>
            <div className="neumorphic-card-inset rounded-lg">
              <select
                id="electronicBill"
                name="electronicBill"
                value={formData.electronicBill ? "true" : "false"}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    electronicBill: e.target.value === "true",
                  })
                }
                className="w-full bg-transparent border-none focus:ring-0 px-4 py-3 text-slate-800 dark:text-slate-200"
                disabled={fieldDisabled || !isActive}
                required
              >
                <option value="true">Sí</option>
                <option value="false">No</option>
              </select>
            </div>
          </div>
        </div>

        {/* Observaciones */}
        <div>
          <label
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
            htmlFor={`extraInfo-${contract.uuid}`}
          >
            Observaciones
          </label>
          <textarea
            id={`extraInfo-${contract.uuid}`}
            name="extraInfo"
            className="w-full px-4 py-3 rounded-lg neumorphic-card-inset text-slate-800 dark:text-slate-200 focus:outline-none bg-transparent resize-none"
            placeholder="Notas adicionales..."
            value={formData.extraInfo}
            onChange={handleChange}
            disabled={fieldDisabled || !isActive}
            rows={3}
          />
        </div>

        {isActive && (
          <div className="flex flex-wrap gap-3 mt-6">
            <button
              type="button"
              onClick={handleSaveAsDraft}
              className="px-6 py-2.5 rounded-lg neumorphic-button font-medium text-yellow-600 hover:text-yellow-700 transition-colors"
            >
              Guardar como borrador
            </button>

            {/* Botón de envío solo visible si el contrato es activo */}
            {!fieldDisabled && (
              <button
                type="submit"
                className="px-6 py-2.5 rounded-lg bg-primary text-white font-semibold neumorphic-button hover:bg-primary/90 transition-colors"
              >
                Guardar cambios
              </button>
            )}
          </div>
        )}
      </form>
    </div>
  );
}
