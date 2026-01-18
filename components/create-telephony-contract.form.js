"use client";
import React, { useState, useEffect, useCallback } from "react";
import { getCookie } from "cookies-next";
import { authGetFetch } from "@/helpers/server-fetch.helper";

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
        setTimeout(() => onContractUpdate(updatedFormData), 0);
      }

      return updatedFormData;
    });
  };

  const handleDeleteFile = (fileName) => {
    const updatedFiles = selectedFiles.filter((file) => file.name !== fileName);
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
    <div className={`neumorphic-card p-6 transition-all ${isSelected ? "ring-2 ring-primary" : ""}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-neumorphic-light-lg dark:shadow-neumorphic-dark-lg bg-blue-500 bg-opacity-10">
            <span className="material-icons-outlined text-2xl text-blue-500">phone_android</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Contrato Telefonía</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Móvil y fijo</p>
          </div>
        </div>

        {/* Toggle Switch */}
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            id="selectContract-Telefonía"
            name="isSelected"
            checked={formData.isSelected}
            onChange={handleIsSelectedChange}
            className="absolute opacity-0 w-0 h-0 peer"
          />
          <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-primary"></div>
        </label>
      </div>

      {formData.isSelected && (
        <div className="space-y-6">
          {/* Company Select */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2" htmlFor="companyId">
              Compañía *
            </label>
            <div className="neumorphic-card-inset rounded-lg">
              <select
                id="companyId"
                name="companyId"
                value={formData.companyId}
                onChange={handleCompanyChange}
                className="w-full bg-transparent border-none focus:ring-0 px-4 py-3 text-slate-800 dark:text-slate-200"
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

          {/* Rates */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
              Tarifas *
            </label>
            <div className="neumorphic-card-inset p-4 rounded-lg">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {contractState
                  .filter((rate) => rate.companyId == formData.companyId)
                  .map((rate) => (
                    <label
                      key={rate.id}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                        formData.rates.includes(rate.id)
                          ? "bg-primary bg-opacity-10 ring-1 ring-primary"
                          : "bg-background-light dark:bg-background-dark hover:bg-slate-100 dark:hover:bg-slate-700"
                      }`}
                    >
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

                            const newDocumentation = Array.from(new Set(selectedRates.flat()));
                            setSelectedDocumentation(newDocumentation);

                            return { ...prev, rates: newRates };
                          });
                        }}
                        className="w-5 h-5 rounded text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">{rate.name}</span>
                    </label>
                  ))}
              </div>
              {contractState.filter((rate) => rate.companyId == formData.companyId).length === 0 && (
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                  Selecciona una compañía para ver las tarifas disponibles
                </p>
              )}
            </div>
          </div>

          {/* Phone Lines */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
              Líneas Telefónicas
            </label>
            <div className="space-y-3">
              {/* Main Line */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full neumorphic-card flex items-center justify-center flex-shrink-0">
                  <span className="material-icons-outlined text-primary text-sm">phone</span>
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    id="mainLine"
                    name="mainLine"
                    value={formData.telephoneLines[0] !== 0 ? formData.telephoneLines[0] : ""}
                    onChange={(e) => handleTelephoneChange(0, e.target.value)}
                    className="w-full neumorphic-card-inset px-4 py-3 rounded-lg border-none focus:outline-none bg-transparent text-slate-800 dark:text-slate-200"
                    placeholder="Línea Principal"
                  />
                </div>
              </div>

              {/* Additional Line */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full neumorphic-card flex items-center justify-center flex-shrink-0">
                  <span className="material-icons-outlined text-slate-400 text-sm">phone</span>
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    id="additionalLine"
                    name="additionalLine"
                    value={formData.telephoneLines[1] !== 0 ? formData.telephoneLines[1] : ""}
                    onChange={(e) => handleTelephoneChange(1, e.target.value)}
                    className="w-full neumorphic-card-inset px-4 py-3 rounded-lg border-none focus:outline-none bg-transparent text-slate-800 dark:text-slate-200"
                    placeholder="Línea Adicional"
                  />
                </div>
              </div>

              {/* Dynamic Lines */}
              {formData.telephoneLines.slice(2).map((line, index) => (
                <div key={index + 2} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full neumorphic-card flex items-center justify-center flex-shrink-0">
                    <span className="material-icons-outlined text-slate-400 text-sm">phone</span>
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      id={`telephoneLine-${index + 2}`}
                      name={`telephoneLine-${index + 2}`}
                      value={line !== 0 ? line : ""}
                      onChange={(e) => handleTelephoneChange(index + 2, e.target.value)}
                      className="w-full neumorphic-card-inset px-4 py-3 rounded-lg border-none focus:outline-none bg-transparent text-slate-800 dark:text-slate-200"
                      placeholder={`Línea Adicional ${index + 2}`}
                    />
                  </div>
                </div>
              ))}

              {/* Add Line Button */}
              <button
                type="button"
                onClick={addTelephoneLine}
                className="flex items-center gap-2 px-4 py-2 rounded-lg neumorphic-button text-primary font-medium transition-colors hover:text-primary/80"
              >
                <span className="material-icons-outlined text-lg">add</span>
                Añadir Línea
              </button>
            </div>
          </div>

          {/* Landline */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2" htmlFor="landlinePhone">
              Teléfono Fijo
            </label>
            <div className="relative">
              <span className="material-icons-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                call
              </span>
              <input
                type="text"
                id="landlinePhone"
                name="landlinePhone"
                value={formData.landlinePhone !== 0 ? formData.landlinePhone : ""}
                onChange={(e) => handleLandlineChange(e.target.value)}
                className="w-full neumorphic-card-inset pl-12 pr-4 py-3 rounded-lg border-none focus:outline-none bg-transparent text-slate-800 dark:text-slate-200"
                placeholder="912345678"
              />
            </div>
          </div>

          {/* Extra Services */}
          <div className="neumorphic-card-inset p-4 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="material-icons-outlined text-purple-500">extension</span>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Servicios Extra</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasExtraServices}
                  onChange={(e) => handleExtraServicesSelect({ target: { value: e.target.checked ? "yes" : "no" } })}
                  className="absolute opacity-0 w-0 h-0 peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-primary"></div>
              </label>
            </div>

            {hasExtraServices && (
              <div className="space-y-3 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                {formData.extraServices.map((service, index) => (
                  <input
                    key={index}
                    type="text"
                    value={service}
                    onChange={(e) => handleExtraServiceChange(index, e.target.value)}
                    className="w-full bg-background-light dark:bg-background-dark px-4 py-3 rounded-lg border-none focus:outline-none text-slate-800 dark:text-slate-200"
                    placeholder={`Servicio Extra ${index + 1}`}
                  />
                ))}

                <button
                  type="button"
                  onClick={addExtraService}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary font-medium transition-colors hover:bg-primary/20"
                >
                  <span className="material-icons-outlined text-lg">add</span>
                  Añadir Servicio Extra
                </button>
              </div>
            )}
          </div>

          {/* Electronic Bill */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2" htmlFor="electronicBill">
              Factura Electrónica
            </label>
            <div className="neumorphic-card-inset rounded-lg">
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
                className="w-full bg-transparent border-none focus:ring-0 px-4 py-3 text-slate-800 dark:text-slate-200"
                required
              >
                <option value="true">Sí</option>
                <option value="false">No</option>
              </select>
            </div>
          </div>

          {/* Observations */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2" htmlFor="extraInfo">
              Observaciones
            </label>
            <textarea
              id="extraInfo"
              name="extraInfo"
              rows="3"
              value={formData.extraInfo}
              onChange={handleChange}
              className="w-full neumorphic-card-inset px-4 py-3 rounded-lg border-none focus:outline-none bg-transparent text-slate-800 dark:text-slate-200"
              placeholder="Notas adicionales..."
            />
          </div>

          {/* Documentation */}
          {selectedDocumentation.length > 0 && (
            <div className="neumorphic-card-inset p-4 rounded-lg">
              <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
                <span className="material-icons-outlined text-primary">description</span>
                Documentación necesaria
              </h4>
              <div className="space-y-3">
                {selectedDocumentation.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-background-light dark:bg-background-dark">
                    <span className="text-sm text-slate-700 dark:text-slate-300">{item}</span>
                    <label
                      htmlFor={`file-upload-${index}`}
                      className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium cursor-pointer hover:bg-primary/90 transition-colors"
                    >
                      Seleccionar
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
                    </label>
                  </div>
                ))}
              </div>

              {/* Selected Files List */}
              {selectedFiles.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Archivos seleccionados:</p>
                  <div className="space-y-2">
                    {selectedFiles.map((file, fileIndex) => (
                      <div
                        key={fileIndex}
                        className="flex items-center justify-between p-2 rounded-lg bg-background-light dark:bg-background-dark"
                      >
                        <div className="flex items-center gap-2">
                          <span className="material-icons-outlined text-slate-500 text-sm">attach_file</span>
                          <span className="text-sm text-slate-700 dark:text-slate-300">{file.name}</span>
                          <span className="text-xs text-slate-500">
                            ({(file.size / 1024).toFixed(2)} KB)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteFile(file.name)}
                          className="w-8 h-8 rounded-full neumorphic-button flex items-center justify-center text-red-500 hover:text-red-600 transition-colors"
                          aria-label="Eliminar archivo"
                        >
                          <span className="material-icons-outlined text-sm">delete</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
