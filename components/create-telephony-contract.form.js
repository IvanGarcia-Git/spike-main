"use client";
import React, { useState, useEffect, useCallback } from "react";
import { getCookie } from "cookies-next";
import { authGetFetch } from "@/helpers/server-fetch.helper";
import { FaTrash } from "react-icons/fa";
import { FiPlus } from "react-icons/fi";

export default function CreateTelephonyContractForm({ companies, onContractUpdate }) {
  const [isSelected, setIsSelected] = useState(false);
  const [selectedDocumentation, setSelectedDocumentation] = useState([]);
  const [hasExtraServices, setHasExtraServices] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);

  const [contractState, setContractState] = useState([]);

  const [formData, setFormData] = useState({
    type: "Telefonía",
    isDraft: true,
    companyId: "",
    extraInfo: "",
    electronicBill: true,
    isSelected: false,
    telephoneLines: [0, 0],
    landlinePhone: 0,
    rates: [],
    extraServices: [],
    selectedFiles: [],
  });

  useEffect(() => {
    if (isSelected) {
      onContractUpdate(formData);
    }
  }, [formData, isSelected]);

  const getRates = useCallback(async () => {
    const jwtToken = getCookie("factura-token");

    try {
      const response = await authGetFetch(`rates/group/company-name`, jwtToken);
      if (response.ok) {
        const ratesData = await response.json();
        const filteredRates = [];
        for (const company in ratesData) {
          if (ratesData.hasOwnProperty(company)) {
            filteredRates.push(
              ...ratesData[company].filter((rate) => rate.company?.type === "Telefonía")
            );
          }
        }

        setContractState(filteredRates);
      } else {
        alert("Error al cargar las tarifas disponibles");
      }
    } catch (error) {
      console.error("Error al obtener las tarifas:", error);
    }
  }, []);

  useEffect(() => {
    getRates();
  }, [getRates]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const updatedFormData = {
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    };

    setFormData(updatedFormData);
  };

  const handleExtraServicesSelect = (e) => {
    const value = e.target.value === "yes";
    setHasExtraServices(value);

    if (!value) {
      setFormData((prev) => ({
        ...prev,
        extraServices: [],
      }));
    }
  };

  const addExtraService = () => {
    setFormData((prev) => ({ ...prev, extraServices: [...prev.extraServices, ""] }));
  };

  const handleExtraServiceChange = (index, value) => {
    setFormData((prev) => {
      const updatedServices = [...prev.extraServices];
      updatedServices[index] = value;

      const updatedFormData = { ...prev, extraServices: updatedServices };

      setTimeout(() => onContractUpdate(updatedFormData), 0);
      return updatedFormData;
    });
  };

  const handleIsSelectedChange = () => {
    const newIsSelected = !isSelected;
    setIsSelected(newIsSelected);

    const updatedFormData = {
      ...formData,
      isSelected: newIsSelected,
    };

    setFormData(updatedFormData);
  };

  const handleCompanyChange = (e) => {
    const selectedCompany = e.target.value;

    setFormData((prev) => {
      const updatedFormData = {
        ...prev,
        companyId: selectedCompany,
        rates: [],
      };

      if (isSelected) {
        //Quita el warn de la consola
        setTimeout(() => onContractUpdate(updatedFormData), 0);
      }

      return updatedFormData;
    });
  };

  const handleDeleteFile = (contractType, fileName) => {
    const updatedFiles = {
      ...selectedFiles,
      [contractType]: selectedFiles[contractType].filter((file) => file.name !== fileName),
    };

    setSelectedFiles(updatedFiles);
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

  const addTelephoneLine = () => {
    setFormData((prev) => ({
      ...prev,
      telephoneLines: [...prev.telephoneLines, 0],
    }));
  };

  return (
    <div className="p-4 border rounded-lg bg-background">
      <h3 className="text-xl font-bold text-black">Contrato Telefonía</h3>

      <div className="mb-4 flex items-center">
        <input
          type="checkbox"
          id="selectContract-Telefonía"
          name="isSelected"
          checked={formData.isSelected}
          onChange={handleIsSelectedChange}
          className="mr-2"
        />
        <label htmlFor="selectContract-Telefonía" className="text-black">
          Crear Contrato de Telefonía
        </label>
      </div>

      {formData.isSelected && (
        <form>
          <div className="mb-4">
            <label className="block text-black mb-2" htmlFor="companyId">
              Compañía
            </label>
            <select
              id="companyId"
              name="companyId"
              value={formData.companyId}
              onChange={handleCompanyChange}
              className="w-full px-4 py-2 rounded bg-backgroundHoverBold text-black focus:outline-none"
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

          <div className="mb-4">
            <label className="block text-black mb-2">Tarifas</label>
            <div className="grid grid-cols-1 gap-2">
              {contractState
                .filter((rate) => rate.companyId == formData.companyId)
                .map((rate) => (
                  <label key={rate.id} className="flex text-black items-center space-x-2">
                    <input
                      type="checkbox"
                      value={rate.id}
                      checked={formData.rates.includes(rate.id)}
                      onChange={(e) => {
                        const isChecked = e.target.checked;

                        setFormData((prev) => {
                          const newRates = isChecked
                            ? [...prev.rates, rate.id]
                            : prev.rates.filter((id) => id !== rate.id);

                          const selectedRates = isChecked
                            ? [...prev.rates, rate.id].map(
                                (id) =>
                                  contractState.find((rate) => rate.id === id)?.documentation || []
                              )
                            : prev.rates
                                .filter((id) => id !== rate.id)
                                .map(
                                  (id) =>
                                    contractState.find((rate) => rate.id === id)?.documentation ||
                                    []
                                );

                          // Aplana el array y elimina duplicados
                          const newDocumentation = Array.from(new Set(selectedRates.flat()));

                          setSelectedDocumentation(newDocumentation);

                          return { ...prev, rates: newRates };
                        });
                      }}
                    />

                    <span>{rate.name}</span>
                  </label>
                ))}
            </div>
          </div>

          {/* Línea Principal */}
          <div className="mb-4">
            <label className="block text-black mb-2" htmlFor="mainLine">
              Línea Principal
            </label>
            <input
              type="text"
              id="mainLine"
              name="mainLine"
              value={formData.telephoneLines[0] !== 0 ? formData.telephoneLines[0] : ""}
              onChange={(e) => handleTelephoneChange(0, e.target.value)}
              className="w-full px-4 py-2 rounded bg-backgroundHoverBold text-black focus:outline-none"
            />
          </div>

          {/* Línea Adicional */}
          <div className="mb-4">
            <label className="block text-black mb-2" htmlFor="additionalLine">
              Línea Adicional
            </label>
            <input
              type="text"
              id="additionalLine"
              name="additionalLine"
              value={formData.telephoneLines[1] !== 0 ? formData.telephoneLines[1] : ""}
              onChange={(e) => handleTelephoneChange(1, e.target.value)}
              className="w-full px-4 py-2 rounded bg-backgroundHoverBold text-black focus:outline-none"
            />
          </div>

          {/* Líneas dinámicas adicionales */}
          {formData.telephoneLines.slice(2).map((line, index) => (
            <div key={index + 2} className="mb-4">
              <label className="block text-black mb-2" htmlFor={`telephoneLine-${index + 2}`}>
                Línea Adicional {index + 2}
              </label>
              <input
                type="text"
                id={`telephoneLine-${index + 2}`}
                name={`telephoneLine-${index + 2}`}
                value={line !== 0 ? line : ""}
                onChange={(e) => handleTelephoneChange(index + 2, e.target.value)}
                className="w-full px-4 py-2 rounded bg-backgroundHoverBold text-black focus:outline-none"
                placeholder={`Número de línea adicional ${index + 2}`}
              />
            </div>
          ))}

          {/* Botón para añadir una nueva línea */}
          <button
            type="button"
            onClick={addTelephoneLine}
            className="flex items-center gap-2  py-2 rounded text-black"
          >
            <FiPlus className="text-lg" /> Añadir Línea
          </button>

          <div className="mb-4">
            <label className="block text-black mb-2" htmlFor="landlinePhone">
              Fijo
            </label>
            <input
              type="text"
              id="landlinePhone"
              name="landlinePhone"
              value={formData.landlinePhone !== 0 ? formData.landlinePhone : ""}
              onChange={(e) => handleLandlineChange(e.target.value)}
              className="w-full px-4 py-2 rounded bg-backgroundHoverBold text-black focus:outline-none"
              placeholder="Número de líneas fijas"
            />
          </div>

          <div className="mb-4">
            <label className="block text-black mb-2" htmlFor="hasExtraServices">
              Servicios Extra
            </label>
            <select
              id="hasExtraServices"
              name="hasExtraServices"
              value={hasExtraServices ? "yes" : "no"}
              onChange={handleExtraServicesSelect}
              className="w-full px-4 py-2 rounded bg-backgroundHoverBold text-black focus:outline-none"
            >
              <option value="no">No</option>
              <option value="yes">Sí</option>
            </select>
          </div>

          {hasExtraServices && (
            <div>
              {formData.extraServices.map((service, index) => (
                <div key={index} className="mb-2 flex items-center">
                  <input
                    type="text"
                    value={service}
                    onChange={(e) => handleExtraServiceChange(index, e.target.value)}
                    className="w-full px-4 py-2 rounded bg-backgroundHoverBold text-black focus:outline-none"
                    placeholder={`Servicio Extra ${index + 1}`}
                  />
                </div>
              ))}

              <button
                type="button"
                onClick={addExtraService}
                className="flex items-center gap-2 py-2 rounded text-black"
              >
                <FiPlus className="text-lg" /> Añadir Servicio Extra
              </button>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-black mb-2" htmlFor="electronicBill">
              Factura Electrónica
            </label>
            <select
              id="electronicBill"
              name="electronicBill"
              value={formData.electronicBill}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  electronicBill: e.target.value === "true",
                }))
              }
              className="w-full px-4 py-2 rounded bg-backgroundHoverBold text-black focus:outline-none"
              required
            >
              <option value="true">Sí</option>
              <option value="false">No</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-black mb-2" htmlFor="extraInfo">
              Observaciones
            </label>
            <textarea
              id="extraInfo"
              name="extraInfo"
              value={formData.extraInfo}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded bg-backgroundHoverBold text-black focus:outline-none"
              placeholder="Escribe cualquier observación adicional"
            />
          </div>
          {selectedDocumentation.length > 0 && (
            <>
              <div className="mt-4">
                <h4 className="text-black font-bold">Documentación necesaria:</h4>
                <ul className="list-disc list-inside text-black">
                  {selectedDocumentation.map((item, index) => (
                    <li key={index}>
                      {item}
                      <div className="mb-4 mt-4">
                        <input
                          type="file"
                          id={`file-upload-${index}`}
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (!file) return;

                            const updatedFiles = [...selectedFiles, file];
                            setSelectedFiles(updatedFiles);

                            setFormData((prevFormData) => ({
                              ...prevFormData,
                              selectedFiles: updatedFiles,
                            }));
                          }}
                          className="hidden"
                        />
                        <label
                          htmlFor={`file-upload-${index}`}
                          className="px-4 py-2 bg-backgroundHoverBold text-black rounded-md cursor-pointer"
                        >
                          Seleccionar archivo para {item}
                        </label>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="mt-4">
                  {selectedFiles.length > 0 ? (
                    <ul className="list-disc list-inside text-black">
                      {selectedFiles.map((file, fileIndex) => (
                        <li key={fileIndex} className="flex items-center gap-2">
                          <span>
                            {file.name} - {(file.size / 1024).toFixed(2)} KB
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteFile(file.name)}
                            className="text-red-600 hover:text-red-800 focus:outline-none"
                            aria-label="Eliminar archivo"
                          >
                            <FaTrash />
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-600">No hay archivos seleccionados.</p>
                  )}
                </div>
              </div>
            </>
          )}
        </form>
      )}
    </div>
  );
}
