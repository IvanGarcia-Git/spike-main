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
    <form className="bg-background p-6 rounded-lg shadow-lg border border-white mb-7">
      {/* Selector de Particular/Empresa */}
      <div className="mb-4">
        <div className="flex space-x-4">
          {/* Tipo de Cliente */}
          <div className="flex-1">
            <label className="block text-black mb-2" htmlFor="type">
              Tipo de Cliente
            </label>
            <select
              id="type"
              name="type"
              className="w-full px-4 py-2 rounded bg-backgroundHoverBold text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.type}
              onChange={handleChange}
            >
              <option value="B2C">Particular</option>
              <option value="B2B">Empresa</option>
            </select>
          </div>

          {/* Origen */}
          <div className="flex-1">
            <label className="block text-black mb-2" htmlFor="origin">
              Origen
            </label>
            <select
              id="origin"
              name="originId"
              className="w-full px-4 py-2 rounded bg-backgroundHoverBold text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        <>
          <div className="mb-4">
            <label className="block text-black mb-2" htmlFor="cif">
              CIF
            </label>
            <input
              type="text"
              id="cif"
              name="cif"
              className="w-full px-4 py-2 rounded bg-backgroundHoverBold text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.cif}
              onChange={handleChange}
            />
          </div>
          <div className="mb-4">
            <label className="block text-black mb-2" htmlFor="tradeName">
              Razón social
            </label>
            <input
              type="text"
              id="tradeName"
              name="tradeName"
              className="w-full px-4 py-2 rounded bg-backgroundHoverBold text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.tradeName}
              onChange={handleChange}
            />
          </div>
        </>
      )}

      {/* Campo Nombre */}
      <div className="mb-4">
        <label className="block text-black mb-2" htmlFor="name">
          Nombre
        </label>
        <input
          type="text"
          id="name"
          name="name"
          className="w-full px-4 py-2 rounded bg-backgroundHoverBold text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={formData.name}
          onChange={handleChange}
          required
        />
      </div>

      {/* Campo Apellidos */}
      <div className="mb-4">
        <label className="block text-black mb-2" htmlFor="surnames">
          Apellidos
        </label>
        <input
          type="text"
          id="surnames"
          name="surnames"
          className="w-full px-4 py-2 rounded bg-backgroundHoverBold text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={formData.surnames}
          onChange={handleChange}
          required
        />
      </div>

      {/* Campo nationalId y nacionalidad*/}
      <div className="mb-4 flex items-center gap-4 flex-wrap">
        <div className="relative">
          <label
            htmlFor="documentType"
            className="absolute left-3 top-1.5 text-xs text-sky-700 pointer-events-none"
          >
            Tipo de documento
          </label>
          <select
            id="documentType"
            name="documentType"
            className="pt-6 pb-2 pr-8 pl-[7px] rounded bg-white text-black border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 w-auto"
            onChange={handleSelectChange}
            defaultValue="NIF / DNI"
          >
            <option value="NIF / DNI">NIF / DNI</option>
            <option value="NIE">NIE</option>
            <option value="Pasaporte">Pasaporte</option>
          </select>
        </div>
        <div className="flex-1 flex flex-col">
          <label className="text-xs text-sky-700 mb-1 sr-only" htmlFor="documentInput">
            Número de documento
          </label>
          <input
            type="text"
            id="documentInput"
            name="nationalId"
            className="w-full px-4 py-[11px] rounded bg-white text-black border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.nationalId}
            onChange={handleChange}
            required
            placeholder="Número de documento"
          />
        </div>

        {(documentType === "NIE" || documentType === "Pasaporte") && (
          <div className="flex-2">
            <label className="sr-only" htmlFor="nationality">
              Nacionalidad
            </label>
            <input
              type="text"
              id="nationality"
              name="nationality"
              list="countryList"
              className="w-full px-4 py-2 rounded bg-backgroundHoverBold text-black border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.nationality}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              placeholder="Seleccione un país"
            />
            <datalist id="countryList">
              {countries.map((country) => (
                <option
                  key={country.code}
                  value={country.name}
                  className="px-4 py-2 hover:bg-gray-200"
                />
              ))}
            </datalist>
          </div>
        )}

      </div>

      {/* Campo Correo */}
      <div className="mb-4">
        <label className="block text-black mb-2" htmlFor="email">
          Correo
        </label>
        <input
          type="email"
          id="email"
          name="email"
          className="w-full px-4 py-2 rounded bg-backgroundHoverBold text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={formData.email}
          onChange={handleChange}
          required
        />
      </div>

      {/* Campo Dirección */}
      <div className="mb-4">
        <label className="block text-black mb-2" htmlFor="address">
          Dirección
        </label>
        <input
          type="text"
          id="address"
          name="address"
          className="w-full px-4 py-2 rounded bg-backgroundHoverBold text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={formData.address}
          onChange={handleChange}
        />
      </div>

      {/* Campo CP, Provincia y Población en filas separadas en móvil */}
      <div className="mb-4 space-y-4 sm:space-y-0 sm:flex sm:space-x-4">
        {/* Campo CP */}
        <div className="w-full sm:flex-1">
          <label className="block text-black mb-2" htmlFor="zipCode">
            Código Postal
          </label>
          <input
            type="text"
            id="zipCode"
            name="zipCode"
            className="w-full px-4 py-2 rounded bg-backgroundHoverBold text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.zipCode}
            onChange={handleChange}
          />
        </div>

        {/* Campo Provincia */}
        <div className="w-full sm:flex-1">
          <label className="block text-black mb-2" htmlFor="province">
            Provincia
          </label>
          <input
            type="text"
            id="province"
            name="province"
            className="w-full px-4 py-2 rounded bg-backgroundHoverBold text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.province}
            onChange={handleChange}
          />
        </div>

        {/* Campo Población */}
        <div className="w-full sm:flex-1">
          <label className="block text-black mb-2" htmlFor="populace">
            Población
          </label>
          <input
            type="text"
            id="populace"
            name="populace"
            className="w-full px-4 py-2 rounded bg-backgroundHoverBold text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.populace}
            onChange={handleChange}
          />
        </div>
      </div>

      {/* Campo Teléfono */}
      <div className="mb-4">
        <label className="block text-black mb-2" htmlFor="phoneNumber">
          Teléfono
        </label>
        <input
          type="text"
          id="phoneNumber"
          name="phoneNumber"
          className="w-full px-4 py-2 rounded bg-backgroundHoverBold text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={formData.phoneNumber}
          onChange={handleChange}
        />
      </div>

      {/* Campo IBAN */}
      <div className="mb-4">
        <label className="block text-black mb-2" htmlFor="iban">
          IBAN
        </label>
        <input
          type="text"
          id="iban"
          name="iban"
          className="w-full px-4 py-2 rounded bg-backgroundHoverBold text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={formData.iban}
          onChange={handleChange}
        />
      </div>

      {/* Checkboxes Cambio de Titular y Nuevo Alta en una fila */}
      <div className="mb-4 flex items-center space-x-4">
        <label className="text-black flex items-center">
          <input
            type="checkbox"
            name="holderChange"
            checked={formData.holderChange}
            onChange={handleChange}
            className="mr-2"
          />
          Cambio Titular
        </label>

        <label className="text-black flex items-center">
          <input
            type="checkbox"
            name="newCreation"
            checked={formData.newCreation}
            onChange={handleChange}
            className="mr-2"
          />
          Nuevo Alta
        </label>
      </div>
    </form>
  );
}
