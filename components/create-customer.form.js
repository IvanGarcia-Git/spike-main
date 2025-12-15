"use client";
import { useState, useEffect } from "react";
import { getCookie } from "cookies-next";
import { authGetFetch } from "@/helpers/server-fetch.helper";
import { countries } from "@/public/countries";

export default function CreateCustomerForm({
  customerData,
  onCustomerUpdate,
  documentType,
  onDocumentTypeChange,
  electronicBill = true,
}) {
  const [origins, setOrigins] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    surnames: "",
    nationalId: "",
    nationality: "",
    email: "",
    address: "",
    zipCode: "",
    province: "",
    populace: "",
    phoneNumber: "",
    iban: "",
    holderChange: false,
    newCreation: false,
    type: "B2C",
    cif: "",
    tradeName: "",
    originId: "",
  });

  useEffect(() => {
    if (customerData) {
      setFormData(customerData);
    }
  }, [customerData]);

  useEffect(() => {
    getOrigins();
  }, []);

  const getOrigins = async () => {
    const jwtToken = getCookie("factura-token");

    try {
      const response = await authGetFetch("origins/all", jwtToken);

      if (response.ok) {
        const originsResponse = await response.json();
        setOrigins(originsResponse);
      } else {
        alert("Error cargando tu informacion");
      }
    } catch (error) {
      console.error("Error sending request:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const updatedFormData = {
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    };

    setFormData(updatedFormData);
    onCustomerUpdate(updatedFormData);
  };

  const handleSelectChange = (e) => {
    onDocumentTypeChange(e);
  };

  const handleBlur = (event) => {
    const newValue = event.target.value;
    const isValid = countries.some((country) => country.name === newValue);

    if (!isValid) {
      handleChange({
        target: {
          name: "nationality",
          value: "",
        },
      });
    }
  };

  return (
    <form className="neumorphic-card p-6 mb-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-neumorphic-light-lg dark:shadow-neumorphic-dark-lg bg-primary bg-opacity-10">
          <span className="material-icons-outlined text-2xl text-primary">person</span>
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Datos del Cliente</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Información personal y de contacto</p>
        </div>
      </div>

      {/* Selector de Tipo y Origen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {/* Tipo de Cliente */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2" htmlFor="type">
            Tipo de Cliente
          </label>
          <div className="neumorphic-card-inset rounded-lg">
            <select
              id="type"
              name="type"
              className="w-full bg-transparent border-none focus:ring-0 px-4 py-3 text-slate-800 dark:text-slate-200"
              value={formData.type}
              onChange={handleChange}
            >
              <option value="B2C">Particular</option>
              <option value="B2B">Empresa</option>
            </select>
          </div>
        </div>

        {/* Origen */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2" htmlFor="origin">
            Origen
          </label>
          <div className="neumorphic-card-inset rounded-lg">
            <select
              id="origin"
              name="originId"
              className="w-full bg-transparent border-none focus:ring-0 px-4 py-3 text-slate-800 dark:text-slate-200"
              value={formData.originId}
              onChange={handleChange}
            >
              <option value="">Seleccionar origen</option>
              {origins.map((origin) => (
                <option key={origin.id} value={origin.id}>
                  {origin.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Campos de Empresa */}
      {formData.type == "B2B" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2" htmlFor="cif">
              CIF
            </label>
            <input
              type="text"
              id="cif"
              name="cif"
              className="w-full neumorphic-card-inset px-4 py-3 rounded-lg border-none focus:outline-none bg-transparent text-slate-800 dark:text-slate-200"
              value={formData.cif}
              onChange={handleChange}
              placeholder="B12345678"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2" htmlFor="tradeName">
              Razón social
            </label>
            <input
              type="text"
              id="tradeName"
              name="tradeName"
              className="w-full neumorphic-card-inset px-4 py-3 rounded-lg border-none focus:outline-none bg-transparent text-slate-800 dark:text-slate-200"
              value={formData.tradeName}
              onChange={handleChange}
              placeholder="Nombre de la empresa"
            />
          </div>
        </div>
      )}

      {/* Nombre y Apellidos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2" htmlFor="name">
            Nombre *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            className="w-full neumorphic-card-inset px-4 py-3 rounded-lg border-none focus:outline-none bg-transparent text-slate-800 dark:text-slate-200"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="Juan"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2" htmlFor="surnames">
            Apellidos *
          </label>
          <input
            type="text"
            id="surnames"
            name="surnames"
            className="w-full neumorphic-card-inset px-4 py-3 rounded-lg border-none focus:outline-none bg-transparent text-slate-800 dark:text-slate-200"
            value={formData.surnames}
            onChange={handleChange}
            required
            placeholder="Pérez García"
          />
        </div>
      </div>

      {/* Documento de Identidad */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Documento de Identidad *
        </label>
        <div className="flex flex-wrap gap-3">
          <div className="neumorphic-card-inset rounded-lg">
            <select
              id="documentType"
              name="documentType"
              className="bg-transparent border-none focus:ring-0 px-4 py-3 text-slate-800 dark:text-slate-200"
              onChange={handleSelectChange}
              defaultValue="NIF / DNI"
            >
              <option value="NIF / DNI">NIF / DNI</option>
              <option value="NIE">NIE</option>
              <option value="Pasaporte">Pasaporte</option>
            </select>
          </div>
          <div className="flex-1">
            <input
              type="text"
              id="documentInput"
              name="nationalId"
              className="w-full neumorphic-card-inset px-4 py-3 rounded-lg border-none focus:outline-none bg-transparent text-slate-800 dark:text-slate-200"
              value={formData.nationalId}
              onChange={handleChange}
              required
              placeholder="12345678A"
            />
          </div>
          {(documentType === "NIE" || documentType === "Pasaporte") && (
            <div className="flex-1">
              <input
                type="text"
                id="nationality"
                name="nationality"
                list="countryList"
                className="w-full neumorphic-card-inset px-4 py-3 rounded-lg border-none focus:outline-none bg-transparent text-slate-800 dark:text-slate-200"
                value={formData.nationality}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                placeholder="Seleccione un país"
              />
              <datalist id="countryList">
                {countries.map((country) => (
                  <option key={country.code} value={country.name} />
                ))}
              </datalist>
            </div>
          )}
        </div>
      </div>

      {/* Email */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2" htmlFor="email">
          Correo Electrónico {electronicBill ? "*" : "(opcional fra. papel)"}
        </label>
        <div className="relative">
          <span className="material-icons-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            email
          </span>
          <input
            type="email"
            id="email"
            name="email"
            className="w-full neumorphic-card-inset pl-12 pr-4 py-3 rounded-lg border-none focus:outline-none bg-transparent text-slate-800 dark:text-slate-200"
            value={formData.email}
            onChange={handleChange}
            required={electronicBill}
            placeholder="cliente@ejemplo.com"
          />
        </div>
      </div>

      {/* Dirección */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2" htmlFor="address">
          Dirección
        </label>
        <div className="relative">
          <span className="material-icons-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            location_on
          </span>
          <input
            type="text"
            id="address"
            name="address"
            className="w-full neumorphic-card-inset pl-12 pr-4 py-3 rounded-lg border-none focus:outline-none bg-transparent text-slate-800 dark:text-slate-200"
            value={formData.address}
            onChange={handleChange}
            placeholder="Calle Principal, 123"
          />
        </div>
      </div>

      {/* CP, Provincia, Población */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2" htmlFor="zipCode">
            Código Postal
          </label>
          <input
            type="text"
            id="zipCode"
            name="zipCode"
            className="w-full neumorphic-card-inset px-4 py-3 rounded-lg border-none focus:outline-none bg-transparent text-slate-800 dark:text-slate-200"
            value={formData.zipCode}
            onChange={handleChange}
            placeholder="28001"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2" htmlFor="province">
            Provincia
          </label>
          <input
            type="text"
            id="province"
            name="province"
            className="w-full neumorphic-card-inset px-4 py-3 rounded-lg border-none focus:outline-none bg-transparent text-slate-800 dark:text-slate-200"
            value={formData.province}
            onChange={handleChange}
            placeholder="Madrid"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2" htmlFor="populace">
            Población
          </label>
          <input
            type="text"
            id="populace"
            name="populace"
            className="w-full neumorphic-card-inset px-4 py-3 rounded-lg border-none focus:outline-none bg-transparent text-slate-800 dark:text-slate-200"
            value={formData.populace}
            onChange={handleChange}
            placeholder="Madrid"
          />
        </div>
      </div>

      {/* Teléfono */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2" htmlFor="phoneNumber">
          Teléfono
        </label>
        <div className="relative">
          <span className="material-icons-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            phone
          </span>
          <input
            type="text"
            id="phoneNumber"
            name="phoneNumber"
            className="w-full neumorphic-card-inset pl-12 pr-4 py-3 rounded-lg border-none focus:outline-none bg-transparent text-slate-800 dark:text-slate-200"
            value={formData.phoneNumber}
            onChange={handleChange}
            placeholder="612345678"
          />
        </div>
      </div>

      {/* IBAN */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2" htmlFor="iban">
          IBAN
        </label>
        <div className="relative">
          <span className="material-icons-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            account_balance
          </span>
          <input
            type="text"
            id="iban"
            name="iban"
            className="w-full neumorphic-card-inset pl-12 pr-4 py-3 rounded-lg border-none focus:outline-none bg-transparent text-slate-800 dark:text-slate-200"
            value={formData.iban}
            onChange={handleChange}
            placeholder="ES00 0000 0000 0000 0000 0000"
          />
        </div>
      </div>

      {/* Checkboxes */}
      <div className="neumorphic-card-inset p-4 rounded-lg">
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              name="holderChange"
              checked={formData.holderChange}
              onChange={handleChange}
              className="mr-3 w-5 h-5 rounded text-primary focus:ring-primary"
            />
            <span className="text-sm text-slate-700 dark:text-slate-300">Cambio de Titular</span>
          </label>

          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              name="newCreation"
              checked={formData.newCreation}
              onChange={handleChange}
              className="mr-3 w-5 h-5 rounded text-primary focus:ring-primary"
            />
            <span className="text-sm text-slate-700 dark:text-slate-300">Nuevo Alta</span>
          </label>
        </div>
      </div>
    </form>
  );
}
