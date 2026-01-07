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
    contractedPowers: contract?.contractedPowers || [],
    companyId: contract.company?.id || "",
    rateId: contract.rateId,
    cups: contract?.cups || "",
    extraInfo: contract?.extraInfo || "",
    maintenance: contract?.maintenance === true ? "true" : "false",
    electronicBill: contract?.electronicBill === true ? "true" : "false",
    virtualBat: contract?.virtualBat === true ? "true" : "false",
    solarPlates: contract?.solarPlates || false,
  });

  const getRates = async () => {
    const jwtToken = getCookie("factura-token");

    try {
      const response = await authGetFetch(`rates/group/company-name`, jwtToken);
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
        contractedPowers: contract?.contractedPowers || [],
        companyName: contract?.company?.name || "",
        companyId: contract.company?.id || "",
        cups: contract?.cups || "",
        rateId: contract?.rate?.id || "",
        extraInfo: contract?.extraInfo || "",
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
    if (!filteredRates || !rateType) return [];
    const filteredRatesByType = filteredRates.filter(
      (rate) => rate.type === rateType
    );
    return filteredRatesByType;
  };

  useEffect(() => {
    if (selectedRateType) {
      const filteredRates = filterRatesByType(selectedRateType);
      setFilteredSelectRates(filteredRates);
    }
  }, [selectedRateType, filteredRates]);

  useEffect(() => {
    if (contract.rate && contract.rate?.type) {
      setSelectedRateType(contract.rate.type);
      const filteredRates = filterRatesByType(contract.rate.type);
      setFilteredSelectRates(filteredRates);

      if (filteredRates.length > 0) {
        const matchingRate = filteredRates.find(
          (rate) => rate.id === contract.rate.id
        );
        setFormData((prevFormData) => ({
          ...prevFormData,
          rateId: matchingRate ? matchingRate.id : filteredRates[0].id,
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

    if (contract.type === "Luz") {
      if (
        isActive &&
        formData.cups &&
        formData.contractedPowers.length > 0 &&
        contract.type === "Luz"
      ) {
        onSubmit({ ...formData, isDraft: false });
      } else {
        alert("El CUPS y al menos una potencia son requeridos");
      }
    }
    if (contract.type === "Gas") {
      if (isActive && formData.cups && contract.type === "Gas") {
        onSubmit({ ...formData, isDraft: false });
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
      isDraft: true,
      rateId: formData.rateId === "" ? null : formData.rateId,
      companyId: formData.companyId === "" ? null : formData.companyId,
    };
    onSubmit(draftFormData);
  };

  // Solo Supervisores (isManager) o Admin (groupId === 1) pueden editar fichas no borrador
  const fieldDisabled = !formData.isDraft && !isManager && userGroupId !== 1;

  return (
    <div
      className={`p-6 rounded-xl ${
        isActive ? "neumorphic-card ring-2 ring-primary" : "neumorphic-card-inset"
      }`}
    >
      {/* Formulario de contrato */}
      <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">
        {contract.type === "Luz" ? "Contrato Luz" : "Contrato Gas"}
      </h3>

      {/* Selección de tipo de tarifa */}
      <div className="mb-4">
        <div className="flex gap-4">
          {["2.0", "3.0", "6.1"].map((option) => (
            <label key={option} className="flex text-slate-700 dark:text-slate-300 items-center cursor-pointer">
              <input
                type="radio"
                name="rateType"
                value={option}
                checked={selectedRateType === option}
                onChange={() => handleRateTypeChange(option)}
                className="mr-2 accent-primary"
                disabled={fieldDisabled || !isActive}
              />
              {option}
            </label>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Compañía */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2" htmlFor="companyId">
            Compañía
          </label>
          <select
            id="companyId"
            name="companyId"
            value={formData.companyId}
            onChange={handleChange}
            className="w-full px-4 py-2.5 rounded-lg neumorphic-card-inset text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary bg-transparent"
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

        {/* CUPS */}
        <div className="mb-4">
          <label
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
            htmlFor={`cups-${contract.uuid}`}
          >
            CUPS
          </label>
          <input
            type="text"
            id={`cups-${contract.uuid}`}
            name="cups"
            className="w-full px-4 py-2.5 rounded-lg neumorphic-card-inset text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary bg-transparent"
            value={formData.cups}
            onChange={handleChange}
            disabled={fieldDisabled || !isActive}
            required={!contract.isDraft}
          />
        </div>

        {/* Selector Producto (Solo para Gas) */}
        {contract.type === "Gas" && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2" htmlFor="product">
              Producto
            </label>
            <select
              id="product"
              name="product"
              value={formData.product}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-lg neumorphic-card-inset text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary bg-transparent"
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
        )}

        {/* Tarifa */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2" htmlFor="rateId">
            Tarifa
          </label>
          <select
            id="rateId"
            name="rateId"
            value={formData.rateId || ""}
            onChange={handleChange}
            className="w-full px-4 py-2.5 rounded-lg neumorphic-card-inset text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary bg-transparent"
            disabled={fieldDisabled || !isActive}
            required
          >
            <option value="" disabled>
              Elige una tarifa
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

        {/* Potencias - Solo para contratos de luz */}
        {contract.type === "Luz" && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Potencias Contratadas (kW)
            </label>
            <div className="flex flex-wrap gap-2">
              {Array.from({
                length: selectedRateType === "2.0" ? 2 : 6,
              }).map((_, index) => (
                <input
                  key={index}
                  type="number"
                  min="0"
                  step="0.001"
                  name={`powerSlot${index + 1}`}
                  value={formData.contractedPowers?.[index] || ""}
                  onChange={(e) => {
                    const updatedPowers = [...formData.contractedPowers];
                    updatedPowers[index] = parseFloat(e.target.value) || 0;
                    setFormData((prevData) => ({
                      ...prevData,
                      contractedPowers: updatedPowers,
                    }));
                  }}
                  className="w-28 px-4 py-2.5 rounded-lg neumorphic-card-inset text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary bg-transparent"
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

        {contract.type === "Luz" && (
          <>
            {/* Checkbox Placas */}
            <div className="mb-4 flex items-center">
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
                className="mr-2 w-4 h-4 accent-primary"
                disabled={fieldDisabled || !isActive}
              />
              <label htmlFor="solarPlates" className="text-slate-700 dark:text-slate-300 cursor-pointer">
                Placas
              </label>
            </div>

            {/* Selector BAT Virtual */}
            {formData.solarPlates && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2" htmlFor="virtualBat">
                  BAT Virtual
                </label>
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
                  className="w-full px-4 py-2.5 rounded-lg neumorphic-card-inset text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary bg-transparent"
                  disabled={!formData.solarPlates || !isActive}
                  required
                >
                  <option value="true">Sí</option>
                  <option value="false">No</option>
                </select>
              </div>
            )}
          </>
        )}

        {/* Selector de Mantenimiento */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2" htmlFor="maintenance">
            Mantenimiento
          </label>
          <select
            id="maintenance"
            name="maintenance"
            value={formData.maintenance}
            onChange={(e) =>
              setFormData({
                ...formData,
                maintenance: e.target.value === "true",
              })
            }
            className="w-full px-4 py-2.5 rounded-lg neumorphic-card-inset text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary bg-transparent"
            disabled={fieldDisabled || !isActive}
            required
          >
            <option value="true">Sí</option>
            <option value="false">No</option>
          </select>
        </div>

        {/* Selector de Factura Electrónica */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2" htmlFor="electronicBill">
            Factura Electrónica
          </label>
          <select
            id="electronicBill"
            name="electronicBill"
            value={formData.electronicBill}
            onChange={(e) =>
              setFormData({
                ...formData,
                electronicBill: e.target.value === "true",
              })
            }
            className="w-full px-4 py-2.5 rounded-lg neumorphic-card-inset text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary bg-transparent"
            disabled={fieldDisabled || !isActive}
            required
          >
            <option value="true">Sí</option>
            <option value="false">No</option>
          </select>
        </div>

        {/* Observaciones */}
        <div className="mb-4">
          <label
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
            htmlFor={`extraInfo-${contract.uuid}`}
          >
            Observaciones
          </label>
          <textarea
            id={`extraInfo-${contract.uuid}`}
            name="extraInfo"
            className="w-full px-4 py-2.5 rounded-lg neumorphic-card-inset text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary bg-transparent resize-none"
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
