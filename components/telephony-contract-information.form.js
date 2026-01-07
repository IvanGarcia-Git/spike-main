"use client";
import React, { useState, useEffect } from "react";
import { getCookie } from "cookies-next";
import * as jose from "jose";
import { authGetFetch } from "@/helpers/server-fetch.helper";
import { FiPlus } from "react-icons/fi";

export default function TelephonyContractForm({
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
  const [hasExtraServices, setHasExtraServices] = useState(true);

  const [formData, setFormData] = useState({
    isDraft: false,
    companyId: "",
    extraInfo: "",
    electronicBill: true,
    isSelected: false,
    telephoneLines: [],
    landlinePhone: 0,
    rates: [],
    extraServices: [],
    type: "Telefonía",
  });

  useEffect(() => {
    if (contract) {
      setFormData({
        isDraft: contract.isDraft || false,
        companyId: contract.company?.id || "",
        rates: contract?.telephonyData?.rates || [],
        extraInfo: contract?.extraInfo || "",
        electronicBill: contract?.electronicBill || false,
        telephoneLines: contract?.telephonyData?.telephoneLines || [],
        landlinePhone: contract?.telephonyData?.landlinePhone || 0,
        extraServices: contract?.telephonyData?.extraServices || [],
        type: "Telefonía",
      });

      setHasExtraServices((contract?.telephonyData?.extraServices ?? []).length > 0);

      const jwtToken = getCookie("factura-token");
      if (jwtToken) {
        const payload = jose.decodeJwt(jwtToken);
        setIsManager(payload.isManager || false);
        setUserGroupId(payload.groupId || null);
      }
    }
  }, [contract]);

  useEffect(() => {
    const fetchRates = async () => {
      const jwtToken = getCookie("factura-token");
      try {
        const response = await authGetFetch(`rates/group/company-name`, jwtToken);
        if (response.ok) {
          const ratesData = await response.json();
          setRates(ratesData);
        } else {
          alert("Error al cargar las tarifas disponibles");
        }
      } catch (error) {
        console.error("Error al obtener las tarifas:", error);
      }
    };
    fetchRates();
  }, []);

  useEffect(() => {
    if (formData.companyId && rates) {
      const selectedCompany = companies.find((company) => company.id == formData.companyId);
      if (selectedCompany && rates[selectedCompany.name]) {
        setFilteredRates(rates[selectedCompany.name]);
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

    if (isActive && formData.rates.length > 0) {
      setFormData((prev) => {
        const updatedFormData = { ...prev, isDraft: false };
        if (!hasExtraServices) {
          updatedFormData.extraServices = [];
        }
        onSubmit(updatedFormData);
        return updatedFormData;
      });
    } else {
      alert("Al menos una tarifa es requerida");
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
      companyId: formData.companyId === "" ? null : formData.companyId,
    };
    onSubmit(draftFormData);
  };

  const addTelephoneLine = () => {
    setFormData((prev) => ({
      ...prev,
      telephoneLines: [...prev.telephoneLines, 0],
    }));
  };

  const handleTelephoneChange = (index, value) => {
    if (/^\d{0,9}$/.test(value)) {
      setFormData((prev) => {
        const updatedTelephoneLines = [...prev.telephoneLines];
        updatedTelephoneLines[index] = parseInt(value, 10) || 0;
        return { ...prev, telephoneLines: updatedTelephoneLines };
      });
    }
  };

  const handleLandlineChange = (value) => {
    if (/^\d{0,9}$/.test(value)) {
      setFormData((prev) => ({
        ...prev,
        landlinePhone: parseInt(value, 10) || 0,
      }));
    }
  };

  const handleExtraServicesSelect = (e) => {
    setHasExtraServices(e.target.value === "yes");
  };

  const addExtraService = () => {
    setFormData((prev) => ({
      ...prev,
      extraServices: [...prev.extraServices, ""],
    }));
  };

  const handleExtraServiceChange = (index, value) => {
    setFormData((prev) => {
      const updatedServices = [...prev.extraServices];
      updatedServices[index] = value;
      return { ...prev, extraServices: updatedServices };
    });
  };

  // Solo Supervisores (isManager) o Admin (groupId === 1) pueden editar fichas no borrador
  const fieldDisabled = !formData.isDraft && !isManager && userGroupId !== 1;

  return (
    <div className={`p-6 rounded-xl ${isActive ? "neumorphic-card ring-2 ring-primary" : "neumorphic-card-inset"}`}>
      {/* Formulario de contrato */}
      <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Contrato Telefonía</h3>

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

        {/* Tarifa */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Tarifas</label>
          <div className="grid grid-cols-1 gap-2 neumorphic-card-inset p-4 rounded-lg">
            {filteredRates
              .filter((rate) => rate.companyId == formData.companyId)
              .map((rate) => (
                <label key={rate.id} className="flex text-slate-700 dark:text-slate-300 items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    value={rate.id}
                    checked={formData.rates.some((r) => r.id === rate.id)}
                    onChange={(e) => {
                      const isChecked = e.target.checked;
                      setFormData((prev) => {
                        const isDifferentCompany = prev.companyId !== rate.companyId;

                        const newRates = isChecked
                          ? isDifferentCompany
                            ? [rate]
                            : [...prev.rates, rate]
                          : prev.rates.filter((r) => r.id !== rate.id);

                        return {
                          ...prev,
                          rates: newRates,
                          companyId: isDifferentCompany ? rate.companyId : prev.companyId,
                        };
                      });
                    }}
                    className="w-4 h-4 accent-primary"
                  />
                  <span>{rate.name}</span>
                </label>
              ))}
          </div>
        </div>

        {/* Líneas telefónicas */}
        {formData.telephoneLines.map((line, index) => (
          <div key={index} className="mb-4">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2" htmlFor={`telephoneLine-${index}`}>
              {index === 0 ? "Línea Principal" : `Línea Adicional ${index}`}
            </label>
            <input
              type="text"
              id={`telephoneLine-${index}`}
              value={line !== 0 ? line : ""}
              onChange={(e) => handleTelephoneChange(index, e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg neumorphic-card-inset text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary bg-transparent"
              placeholder={`Número de línea ${index === 0 ? "principal" : "adicional"}`}
              disabled={fieldDisabled || !isActive}
            />
          </div>
        ))}

        {/* Botón para añadir una nueva línea */}
        <button
          type="button"
          onClick={addTelephoneLine}
          className="flex items-center gap-2 px-4 py-2 rounded-lg neumorphic-button text-slate-700 dark:text-slate-300 hover:text-primary transition-colors mb-4"
        >
          <FiPlus className="text-lg" /> Añadir Línea
        </button>

        {/* Línea fija */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2" htmlFor="landlinePhone">
            Número de línea fija
          </label>
          <input
            type="text"
            id="landlinePhone"
            value={formData.landlinePhone || ""}
            onChange={(e) => handleLandlineChange(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg neumorphic-card-inset text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary bg-transparent"
            placeholder="Número de línea fija"
            disabled={fieldDisabled || !isActive}
          />
        </div>

        {/* Extra Services */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Servicios Extra</label>
          <select
            id="hasExtraServices"
            name="hasExtraServices"
            value={hasExtraServices ? "yes" : "no"}
            onChange={handleExtraServicesSelect}
            className="w-full px-4 py-2.5 rounded-lg neumorphic-card-inset text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary bg-transparent"
            disabled={fieldDisabled || !isActive}
          >
            <option value="no">No</option>
            <option value="yes">Sí</option>
          </select>
        </div>

        {hasExtraServices && (
          <div className="mb-4">
            {formData.extraServices.length > 0 ? (
              formData.extraServices.map((service, index) => (
                <div key={index} className="flex items-center mb-2">
                  <input
                    type="text"
                    value={service}
                    onChange={(e) => handleExtraServiceChange(index, e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg neumorphic-card-inset text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary bg-transparent"
                    placeholder={`Servicio Extra ${index + 1}`}
                    disabled={fieldDisabled || !isActive}
                  />
                </div>
              ))
            ) : (
              <p className="text-slate-500 dark:text-slate-400">No hay servicios extra añadidos.</p>
            )}

            <button
              type="button"
              onClick={addExtraService}
              className="flex items-center gap-2 px-4 py-2 rounded-lg neumorphic-button text-slate-700 dark:text-slate-300 hover:text-primary transition-colors mt-2"
              disabled={fieldDisabled || !isActive}
            >
              <FiPlus className="text-lg" /> Añadir Servicio Extra
            </button>
          </div>
        )}

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
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2" htmlFor={`extraInfo-${contract.uuid}`}>
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

        {/* Botón de envío solo visible si el contrato es activo */}
        {isActive && (
          <div className="flex flex-wrap gap-3 mt-6">
            <button
              type="button"
              onClick={handleSaveAsDraft}
              className="px-6 py-2.5 rounded-lg neumorphic-button font-medium text-yellow-600 hover:text-yellow-700 transition-colors"
            >
              Guardar como borrador
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-lg bg-primary text-white font-semibold neumorphic-button hover:bg-primary/90 transition-colors"
            >
              Guardar cambios
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
