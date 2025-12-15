"use client";
import React, { useState, useEffect, useImperativeHandle, forwardRef } from "react";
import { getCookie } from "cookies-next";
import { authGetFetch } from "@/helpers/server-fetch.helper";
import { validateIBANMath } from "@/helpers/validation.helper";
import { countries } from "@/public/countries";

function CustomerForm({ fieldsDisabled, customerData, onCustomerUpdate, contractIsDraft, electronicBill = true }, ref) {
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
    getOrigins();
    if (customerData) {
      setFormData({
        name: customerData.name || "",
        surnames: customerData.surnames || "",
        nationalId: customerData.nationalId || "",
        nationality: customerData.nationality || "",
        email: customerData.email || "",
        address: customerData.address || "",
        zipCode: customerData.zipCode || "",
        province: customerData.province || "",
        populace: customerData.populace || "",
        phoneNumber: customerData.phoneNumber || "",
        iban: customerData.iban || "",
        holderChange: customerData.holderChange || false,
        newCreation: customerData.newCreation || false,
        type: customerData.type || "B2C",
        cif: customerData?.cif || "",
        tradeName: customerData?.tradeName || "",
        originId: customerData.originId || null,
      });
    }
  }, [customerData]);

  const formRef = React.useRef(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

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

  const handleSubmit = (validateField = false) => {
    if (formRef.current && !formRef.current.reportValidity()) {
      return false;
    }

    if (validateField) {
      const requiredFields = [
        "name",
        "surnames",
        "nationalId",
        "address",
        "zipCode",
        "province",
        "populace",
        "phoneNumber",
        "iban",
      ];

      // Email solo es obligatorio si es factura electrónica
      if (electronicBill) {
        requiredFields.push("email");
      }

      for (const field of requiredFields) {
        if (!formData[field] || formData[field].toString().trim() === "") {
          alert(`Faltan campos del cliente por rellenar`);
          return false;
        }
      }
    }

    if (!validateIBANMath(formData.iban) && validateField) {
      alert("El IBAN no es válido. Por favor, introduce un IBAN correcto.");
      return false;
    }

    const adjustedFormData = {
      ...formData,
      originId: formData.originId === "" ? null : formData.originId,
    };

    onCustomerUpdate(adjustedFormData);
    return true;
  };

  useImperativeHandle(ref, () => ({
    handleSubmit,
  }));

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

  const [isNIE, setIsNIE] = useState(false);

  useEffect(() => {
    const niePattern = /^[XYZ]\d{7}[A-Z]$/;
    setIsNIE(niePattern.test(formData.nationalId));
  }, [formData.nationalId]);

  return (
    <form ref={formRef} className="neumorphic-card p-6 rounded-xl mb-7">
      {/* Selector de Particular/Empresa */}
      <div className="mb-4">
        <div className="flex space-x-4">
          {/* Tipo de Cliente */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2" htmlFor="type">
              Tipo de Cliente
            </label>
            <select
              id="type"
              name="type"
              className="w-full px-4 py-2.5 rounded-lg neumorphic-card-inset text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary bg-transparent"
              value={formData.type}
              disabled={fieldsDisabled}
              onChange={handleChange}
            >
              <option value="B2C">Particular</option>
              <option value="B2B">Empresa</option>
            </select>
          </div>

          {/* Origen */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2" htmlFor="origin">
              Origen
            </label>
            <select
              id="origin"
              name="originId"
              className="w-full px-4 py-2.5 rounded-lg neumorphic-card-inset text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary bg-transparent"
              value={formData.originId || ""}
              disabled={fieldsDisabled}
              onChange={handleChange}
            >
              <option value="">Sin origen</option>

              {origins.map((origin) => (
                <option key={origin.id} value={origin.id}>
                  {origin.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {formData.type == "B2B" && (
        <>
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2" htmlFor="cif">
              CIF
            </label>
            <input
              type="text"
              id="cif"
              name="cif"
              className="w-full px-4 py-2.5 rounded-lg neumorphic-card-inset text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary bg-transparent"
              value={formData.cif}
              disabled={fieldsDisabled}
              onChange={handleChange}
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2" htmlFor="tradeName">
              Razón social
            </label>
            <input
              type="text"
              id="tradeName"
              name="tradeName"
              className="w-full px-4 py-2.5 rounded-lg neumorphic-card-inset text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary bg-transparent"
              value={formData.tradeName}
              disabled={fieldsDisabled}
              onChange={handleChange}
            />
          </div>
        </>
      )}

      {/* Campo Nombre */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2" htmlFor="name">
          Nombre
        </label>
        <input
          type="text"
          id="name"
          name="name"
          className="w-full px-4 py-2.5 rounded-lg neumorphic-card-inset text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary bg-transparent"
          value={formData.name}
          disabled={fieldsDisabled}
          onChange={handleChange}
          required={!contractIsDraft}
        />
      </div>

      {/* Campo Apellidos */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2" htmlFor="surnames">
          Apellidos
        </label>
        <input
          type="text"
          id="surnames"
          name="surnames"
          className="w-full px-4 py-2.5 rounded-lg neumorphic-card-inset text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary bg-transparent"
          value={formData.surnames}
          disabled={fieldsDisabled}
          onChange={handleChange}
          required={!contractIsDraft}
        />
      </div>

      {/* Campo nationalId */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2" htmlFor="nationalId">
          {isNIE ? "NIE" : "DNI"}
        </label>
        <div className="flex gap-4">
          <input
            type="text"
            pattern={isNIE ? "^[XYZ]\\d{7}[A-Z]$" : "^\\d{8}[A-Z]$"}
            id="nationalId"
            name="nationalId"
            className="w-full px-4 py-2.5 rounded-lg neumorphic-card-inset text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary bg-transparent"
            value={formData.nationalId}
            disabled={fieldsDisabled}
            onChange={handleChange}
            required={!contractIsDraft}
            title={isNIE ? "El NIE debe tener el formato X1234567A" : "El DNI debe tener 8 números seguidos de una letra (ejemplo: 12345678A)"}
          />
          {isNIE && (
            <div className="flex-2">
              <label className="sr-only" htmlFor="nationality">
                Nacionalidad
              </label>
              <input
                type="text"
                id="nationality"
                name="nationality"
                list="countryList"
                className="w-full px-4 py-2.5 rounded-lg neumorphic-card-inset text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary bg-transparent"
                value={formData.nationality}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                placeholder="Seleccione un país"
              />
              <datalist
                id="countryList"
              >
                {countries.map((country) => (
                  <option key={country.code} value={country.name} className="px-4 py-2 hover:bg-gray-200" />
                ))}
              </datalist>
            </div>
          )}
        </div>
      </div>

      {/* Campo Correo */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2" htmlFor="email">
          Correo {electronicBill ? "*" : "(opcional fra. papel)"}
        </label>
        <input
          type="email"
          id="email"
          name="email"
          className="w-full px-4 py-2.5 rounded-lg neumorphic-card-inset text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary bg-transparent"
          value={formData.email}
          disabled={fieldsDisabled}
          onChange={handleChange}
          required={!contractIsDraft && electronicBill}
        />
      </div>

      {/* Campo Dirección */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2" htmlFor="address">
          Dirección
        </label>
        <input
          type="text"
          id="address"
          name="address"
          className="w-full px-4 py-2.5 rounded-lg neumorphic-card-inset text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary bg-transparent"
          value={formData.address}
          disabled={fieldsDisabled}
          onChange={handleChange}
          required={!contractIsDraft}
        />
      </div>

      {/* Campo CP, Provincia y Población en filas separadas en móvil */}
      <div className="mb-4 space-y-4 sm:space-y-0 sm:flex sm:space-x-4">
        {/* Campo CP */}
        <div className="w-full sm:flex-1">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2" htmlFor="zipCode">
            Código Postal
          </label>
          <input
            type="text"
            id="zipCode"
            name="zipCode"
            pattern="^(0[1-9]|[1-4][0-9]|5[0-2])\d{3}$"
            className="w-full px-4 py-2.5 rounded-lg neumorphic-card-inset text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary bg-transparent"
            value={formData.zipCode}
            onChange={handleChange}
            title="Por favor, introduce un código postal válido de España (5 dígitos, entre 01000 y 52999)."
          />
        </div>

        {/* Campo Provincia */}
        <div className="w-full sm:flex-1">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2" htmlFor="province">
            Provincia
          </label>
          <input
            type="text"
            id="province"
            name="province"
            className="w-full px-4 py-2.5 rounded-lg neumorphic-card-inset text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary bg-transparent"
            value={formData.province}
            onChange={handleChange}
            required={!contractIsDraft}
          />
        </div>

        {/* Campo Población */}
        <div className="w-full sm:flex-1">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2" htmlFor="populace">
            Población
          </label>
          <input
            type="text"
            id="populace"
            name="populace"
            className="w-full px-4 py-2.5 rounded-lg neumorphic-card-inset text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary bg-transparent"
            value={formData.populace}
            onChange={handleChange}
          />
        </div>
      </div>

      {/* Campo Teléfono */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2" htmlFor="phoneNumber">
          Teléfono
        </label>
        <input
          type="text"
          pattern="^\d{9,}$"
          id="phoneNumber"
          name="phoneNumber"
          className="w-full px-4 py-2.5 rounded-lg neumorphic-card-inset text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary bg-transparent"
          value={formData.phoneNumber}
          disabled={fieldsDisabled}
          onChange={handleChange}
          required={!contractIsDraft}
          title="Por favor, introduce un número de teléfono válido."
        />
      </div>

      {/* Campo IBAN */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2" htmlFor="iban">
          IBAN
        </label>
        <input
          type="text"
          id="iban"
          name="iban"
          className="w-full px-4 py-2.5 rounded-lg neumorphic-card-inset text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary bg-transparent"
          value={formData.iban}
          disabled={fieldsDisabled}
          onChange={handleChange}
          required={!contractIsDraft}
          title="Por favor, introduce un ISBN válido."
        />
      </div>

      {/* Checkboxes Cambio de Titular y Nuevo Alta en una fila */}
      <div className="mb-4 flex items-center space-x-6">
        <label className="text-slate-700 dark:text-slate-300 flex items-center cursor-pointer">
          <input
            type="checkbox"
            name="holderChange"
            checked={formData.holderChange}
            onChange={handleChange}
            disabled={fieldsDisabled}
            className="mr-2 w-4 h-4 accent-primary"
          />
          Cambio Titular
        </label>

        <label className="text-slate-700 dark:text-slate-300 flex items-center cursor-pointer">
          <input
            type="checkbox"
            name="newCreation"
            checked={formData.newCreation}
            onChange={handleChange}
            disabled={fieldsDisabled}
            className="mr-2 w-4 h-4 accent-primary"
          />
          Nuevo Alta
        </label>
      </div>
    </form>
  );
}

export default forwardRef(CustomerForm);
