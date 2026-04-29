"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { getCookie } from "cookies-next";
import { authGetFetch } from "@/helpers/server-fetch.helper";

export default function CreateContractForm({
  contractType,
  companies,
  onContractUpdate,
}) {
  const [isSelected, setIsSelected] = useState(false);
  const [selectedDocumentation, setSelectedDocumentation] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState({
    Luz: [],
    Gas: [],
  });

  const [contractState, setContractState] = useState({
    rates: {},
    filteredRates: [],
    selectedTypeForContracts: {
      Luz: "2.0",
      Gas: "",
    },
  });

  const [formData, setFormData] = useState({
    type: contractType,
    isDraft: true,
    contractedPowers: Array(6).fill(0),
    companyId: "",
    rateId: "",
    cups: "",
    rateName: "",
    extraInfo: "",
    maintenance: false,
    electronicBill: true,
    virtualBat: false,
    solarPlates: false,
    product: "",
    selectedFiles: [],
    isSelected: false,
  });

  // Estado para mantener los valores de texto de las potencias mientras se escribe
  const [powerInputs, setPowerInputs] = useState(["", "", "", "", "", ""]);

  // Ref para rastrear el valor más reciente de isSelected sin causar re-renders
  const isSelectedRef = useRef(false);

  // Actualizar ref cuando cambia isSelected
  useEffect(() => {
    isSelectedRef.current = isSelected;
  }, [isSelected]);

  // Función para notificar al padre del formData actual
  const notifyParent = useCallback((data) => {
    onContractUpdate({ ...data, isSelected: isSelectedRef.current });
  }, [onContractUpdate]);

  const getRates = useCallback(async () => {
    const jwtToken = getCookie("factura-token");

    try {
      const response = await authGetFetch(`rates/group/company-name?serviceType=${contractType}`, jwtToken);
      if (response.ok) {
        const ratesData = await response.json();
        setContractState((prev) => ({ ...prev, rates: ratesData }));
      } else {
        alert("Error al cargar las tarifas disponibles");
      }
    } catch (error) {
      console.error("Error al obtener las tarifas:", error);
    }
  }, [contractType]);

  useEffect(() => {
    getRates();
  }, [getRates]);

  useEffect(() => {
    if (!formData.companyId || !contractState.rates) return;

    const selectedCompany = companies.find(
      (company) => company.id == formData.companyId
    );

    if (selectedCompany && contractState.rates[selectedCompany.name]) {
      const companyRates = contractState.rates[selectedCompany.name];
      const filtered = contractType === "Gas"
        ? companyRates
        : companyRates.filter(
            (rate) => rate.type === contractState.selectedTypeForContracts[contractType]
          );
      setContractState((prev) => ({ ...prev, filteredRates: filtered }));
    } else {
      setContractState((prev) => ({ ...prev, filteredRates: [] }));
    }

    setFormData((prevFormData) => ({
      ...prevFormData,
      rateId: "",
    }));
  }, [
    formData.companyId,
    contractState.rates,
    contractState.selectedTypeForContracts,
    contractType,
    companies,
  ]);

  // Sincronizar powerInputs cuando cambian contractedPowers
  // Preserva el texto que está escribiendo el usuario (p.ej. "3,") si ya
  // representa el mismo número, evitando que la coma final se borre.
  useEffect(() => {
    setPowerInputs((prev) =>
      formData.contractedPowers.map((p, i) => {
        const current = prev[i] ?? "";
        const parsed = parseFloat(current.replace(",", "."));
        if (!Number.isNaN(parsed) && parsed === p) return current;
        if (current === "" && p === 0) return "";
        return p === 0 ? "" : String(p).replace(".", ",");
      })
    );
  }, [formData.contractedPowers]);

  // Propagar formData al padre cuando isSelected cambia a true
  useEffect(() => {
    if (isSelected) {
      onContractUpdate({ ...formData, isSelected: true });
    }
    // Solo cuando isSelected cambia
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSelected]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prevFormData) => {
      const updatedFormData = {
        ...prevFormData,
        [name]: type === "checkbox" ? checked : value,
        selectedFiles: selectedFiles[contractType],
      };

      // Notificar al padre inmediatamente con el nuevo valor
      if (isSelectedRef.current) {
        notifyParent(updatedFormData);
      }

      if (name === "rateId") {
        const selectedRate = contractState.filteredRates.find(
          (rate) => rate.id === (isNaN(value) ? value : Number(value))
        );
        setSelectedDocumentation(selectedRate?.documentation || []);
      }

      return updatedFormData;
    });
  };

  const handleIsSelectedChange = (e) => {
    // Solo toggle si el click fue directamente en este div, no en un hijo
    // Esto previene que clicks en selects/inputs/botones dentro del formulario
    // activen/desactiven la selección del contrato
    if (e.target !== e.currentTarget) return;

    const newIsSelected = !isSelectedRef.current;
    setIsSelected(newIsSelected);

    setFormData((prevFormData) => {
      const updatedFormData = {
        ...prevFormData,
        isSelected: newIsSelected,
      };
      onContractUpdate(updatedFormData);
      return updatedFormData;
    });
  };

  const handleDeleteFile = (contractType, fileName) => {
    const updatedFiles = {
      ...selectedFiles,
      [contractType]: selectedFiles[contractType].filter(
        (file) => file.name !== fileName
      ),
    };

    setSelectedFiles(updatedFiles);
  };

  const contractIcon = contractType === "Luz" ? "bolt" : "local_fire_department";
  const contractColor = contractType === "Luz" ? "yellow" : "orange";

  return (
    <div
      className={`neumorphic-card p-6 transition-all cursor-pointer ${
        isSelected ? "ring-2 ring-primary" : ""
      }`}
      onClick={handleIsSelectedChange}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-neumorphic-light-lg dark:shadow-neumorphic-dark-lg bg-${contractColor}-500 bg-opacity-10`}>
            <span className={`material-icons-outlined text-2xl text-${contractColor}-500`}>{contractIcon}</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              {contractType === "Luz" ? "Contrato Luz" : "Contrato Gas"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {contractType === "Luz" ? "Electricidad" : "Gas natural"}
            </p>
          </div>
        </div>

      </div>

      {isSelected && (
        <div className="space-y-6">
          {/* Product (Gas only) */}
          {contractType === "Gas" && (
            <div>
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

          {/* Rate Type Selection (Solo para Luz) */}
          {contractType === "Luz" && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                Tipo de Tarifa
              </label>
              <div className="flex gap-3">
                {["2.0", "3.0", "6.1"].map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();

                      const newSelectedTypeForContracts = {
                        ...contractState.selectedTypeForContracts,
                        [contractType]: option,
                      };

                      setContractState((prev) => ({
                        ...prev,
                        selectedTypeForContracts: newSelectedTypeForContracts,
                      }));

                      setFormData((prevFormData) => {
                        const selectedCompany = companies.find(
                          (company) => company.id == prevFormData.companyId
                        );

                        let updatedFormData = { ...prevFormData };

                        if (
                          selectedCompany &&
                          contractState.rates[selectedCompany.name]
                        ) {
                          const filtered = contractState.rates[
                            selectedCompany.name
                          ].filter((rate) => rate.type === option);

                          setContractState((prev) => ({
                            ...prev,
                            filteredRates: filtered,
                          }));

                          updatedFormData = {
                            ...updatedFormData,
                            rateId: filtered[0]?.id || "",
                          };
                        }

                        const updatedPowers =
                          option === "2.0"
                            ? updatedFormData.contractedPowers.slice(0, 2)
                            : updatedFormData.contractedPowers;

                        updatedFormData = {
                          ...updatedFormData,
                          contractedPowers: updatedPowers,
                        };

                        // Notificar al padre
                        if (isSelectedRef.current) {
                          notifyParent(updatedFormData);
                        }

                        return updatedFormData;
                      });
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      contractState.selectedTypeForContracts[contractType] === option
                        ? "neumorphic-button active text-primary"
                        : "neumorphic-button text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )}

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
                onChange={handleChange}
                className="w-full bg-transparent border-none focus:ring-0 px-4 py-3 text-slate-800 dark:text-slate-200"
                required
              >
                <option value="" disabled>
                  Selecciona una compañía
                </option>
                {companies
                  .filter((company) => {
                    const companyRates = contractState.rates[company.name];
                    const hasRates = Array.isArray(companyRates) && companyRates.length > 0;
                    return hasRates;
                  })
                  .map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* CUPS */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2" htmlFor="cups">
              CUPS *
            </label>
            <input
              type="text"
              id="cups"
              name="cups"
              className="w-full neumorphic-card-inset px-4 py-3 rounded-lg border-none focus:outline-none bg-transparent text-slate-800 dark:text-slate-200"
              value={formData.cups}
              onChange={handleChange}
              required
              placeholder="ES0000000000000000XX"
            />
          </div>

          {/* Rate Select */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2" htmlFor="rateId">
              Tarifa *
            </label>
            <div className="neumorphic-card-inset rounded-lg">
              <select
                id="rateId"
                name="rateId"
                value={formData.rateId}
                onChange={handleChange}
                className="w-full bg-transparent border-none focus:ring-0 px-4 py-3 text-slate-800 dark:text-slate-200"
                required
              >
                <option value="" disabled>
                  Elige la tarifa
                </option>
                {contractState.filteredRates.map((rate) => (
                  <option key={rate.id} value={rate.id}>
                    {rate.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Contracted Powers (Luz only) */}
          {contractType === "Luz" && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Potencias Contratadas (kW)
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {Array.from({
                  length:
                    contractState.selectedTypeForContracts[contractType] === "2.0"
                      ? 2
                      : 6,
                }).map((_, index) => (
                  <div key={index}>
                    <input
                      type="text"
                      inputMode="decimal"
                      name={`powerSlot${index + 1}`}
                      value={powerInputs[index]}
                      onChange={(e) => {
                        e.stopPropagation();

                        // Reemplazar punto por coma automáticamente
                        let inputValue = e.target.value.replace(/\./g, ",");

                        // Solo permitir números y una coma
                        inputValue = inputValue.replace(/[^0-9,]/g, "");

                        // Evitar múltiples comas
                        const parts = inputValue.split(",");
                        if (parts.length > 2) {
                          inputValue = parts[0] + "," + parts.slice(1).join("");
                        }

                        // Actualizar el estado del input de texto
                        const updatedInputs = [...powerInputs];
                        updatedInputs[index] = inputValue;
                        setPowerInputs(updatedInputs);

                        // Convertir coma a punto para el parseFloat interno
                        const numericValue = parseFloat(inputValue.replace(",", ".")) || 0;

                        setFormData((prevFormData) => {
                          const updatedPowers = [...prevFormData.contractedPowers];
                          updatedPowers[index] = numericValue;

                          const updatedFormData = {
                            ...prevFormData,
                            contractedPowers: updatedPowers,
                          };

                          // Notificar al padre
                          if (isSelectedRef.current) {
                            notifyParent(updatedFormData);
                          }

                          return updatedFormData;
                        });
                      }}
                      className="w-full neumorphic-card-inset px-3 py-2 rounded-lg text-center border-none focus:outline-none bg-transparent text-slate-800 dark:text-slate-200"
                      placeholder={`P${index + 1}`}
                      disabled={
                        contractState.selectedTypeForContracts[contractType] ===
                          "2.0" && index > 1
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Solar Plates (Luz only) */}
          {contractType === "Luz" && (
            <div className="neumorphic-card-inset p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="material-icons-outlined text-yellow-500">solar_power</span>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Placas Solares</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    id="solarPlates"
                    name="solarPlates"
                    checked={formData.solarPlates}
                    onChange={(e) => {
                      setFormData((prevFormData) => {
                        const updatedFormData = {
                          ...prevFormData,
                          solarPlates: e.target.checked,
                          virtualBat: !e.target.checked ? false : prevFormData.virtualBat,
                        };

                        if (isSelectedRef.current) {
                          notifyParent(updatedFormData);
                        }

                        return updatedFormData;
                      });
                    }}
                    className="absolute opacity-0 w-0 h-0 peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-primary"></div>
                </label>
              </div>

              {formData.solarPlates && (
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    BAT Virtual
                  </label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFormData((prevFormData) => {
                          const updatedFormData = { ...prevFormData, virtualBat: true };
                          if (isSelectedRef.current) {
                            notifyParent(updatedFormData);
                          }
                          return updatedFormData;
                        });
                      }}
                      className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                        formData.virtualBat
                          ? "neumorphic-button active text-primary"
                          : "neumorphic-button text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      Sí
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFormData((prevFormData) => {
                          const updatedFormData = { ...prevFormData, virtualBat: false };
                          if (isSelectedRef.current) {
                            notifyParent(updatedFormData);
                          }
                          return updatedFormData;
                        });
                      }}
                      className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                        !formData.virtualBat
                          ? "neumorphic-button active text-primary"
                          : "neumorphic-button text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Maintenance & Electronic Bill */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2" htmlFor="maintenance">
                Mantenimiento
              </label>
              <div className="neumorphic-card-inset rounded-lg">
                <select
                  id="maintenance"
                  name="maintenance"
                  value={formData.maintenance}
                  onChange={(e) => {
                    setFormData((prevFormData) => {
                      const updatedFormData = {
                        ...prevFormData,
                        maintenance: e.target.value === "true",
                      };

                      if (isSelectedRef.current) {
                        notifyParent(updatedFormData);
                      }

                      return updatedFormData;
                    });
                  }}
                  className="w-full bg-transparent border-none focus:ring-0 px-4 py-3 text-slate-800 dark:text-slate-200"
                  required
                >
                  <option value="true">Sí</option>
                  <option value="false">No</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2" htmlFor="electronicBill">
                Factura Electrónica
              </label>
              <div className="neumorphic-card-inset rounded-lg">
                <select
                  id="electronicBill"
                  name="electronicBill"
                  value={formData.electronicBill}
                  onChange={(e) => {
                    setFormData((prevFormData) => {
                      const updatedFormData = {
                        ...prevFormData,
                        electronicBill: e.target.value === "true",
                      };

                      if (isSelectedRef.current) {
                        notifyParent(updatedFormData);
                      }

                      return updatedFormData;
                    });
                  }}
                  className="w-full bg-transparent border-none focus:ring-0 px-4 py-3 text-slate-800 dark:text-slate-200"
                  required
                >
                  <option value="true">Sí</option>
                  <option value="false">No</option>
                </select>
              </div>
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
              className="w-full neumorphic-card-inset px-4 py-3 rounded-lg border-none focus:outline-none bg-transparent text-slate-800 dark:text-slate-200"
              value={formData.extraInfo}
              onChange={handleChange}
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
                      htmlFor={`file-${contractType}-${index}`}
                      className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium cursor-pointer hover:bg-primary/90 transition-colors"
                    >
                      Seleccionar
                      <input
                        type="file"
                        id={`file-${contractType}-${index}`}
                        onChange={(e) => {
                          e.stopPropagation();
                          const file = e.target.files[0];
                          if (!file) return;

                          const updatedFiles = {
                            ...selectedFiles,
                            [contractType]: [
                              ...selectedFiles[contractType],
                              { name: file.name, file },
                            ],
                          };

                          setSelectedFiles(updatedFiles);

                          setFormData((prevFormData) => {
                            const updatedFormData = {
                              ...prevFormData,
                              selectedFiles: updatedFiles[contractType],
                            };

                            if (isSelectedRef.current) {
                              notifyParent(updatedFormData);
                            }

                            return updatedFormData;
                          });
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                ))}
              </div>

              {/* Selected Files List */}
              {selectedFiles[contractType]?.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Archivos seleccionados:</p>
                  <div className="space-y-2">
                    {selectedFiles[contractType].map((fileObj, fileIndex) => (
                      <div
                        key={fileIndex}
                        className="flex items-center justify-between p-2 rounded-lg bg-background-light dark:bg-background-dark"
                      >
                        <div className="flex items-center gap-2">
                          <span className="material-icons-outlined text-slate-500 text-sm">attach_file</span>
                          <span className="text-sm text-slate-700 dark:text-slate-300">{fileObj.name}</span>
                          <span className="text-xs text-slate-500">
                            ({(fileObj.file.size / 1024).toFixed(2)} KB)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteFile(contractType, fileObj.name);
                          }}
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