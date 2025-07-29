"use client";
import React, { useState, useEffect, useCallback } from "react";
import { getCookie } from "cookies-next";
import { authGetFetch } from "@/helpers/server-fetch.helper";
import { FaTrash } from "react-icons/fa";

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
      Luz: "",
      Gas: "",
    },
  });

  const [formData, setFormData] = useState({
    type: contractType,
    isDraft: true,
    contractedPowers: [],
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

  const getRates = useCallback(async () => {
    const jwtToken = getCookie("factura-token");

    try {
      const response = await authGetFetch(`rates/group/company-name`, jwtToken);
      if (response.ok) {
        const ratesData = await response.json();
        setContractState((prev) => ({ ...prev, rates: ratesData }));
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

  useEffect(() => {
    if (!formData.companyId || !contractState.rates) return;

    const selectedCompany = companies.find(
      (company) => company.id == formData.companyId
    );

    if (selectedCompany && contractState.rates[selectedCompany.name]) {
      const filtered = contractState.rates[selectedCompany.name].filter(
        (rate) =>
          rate.type === contractState.selectedTypeForContracts[contractType]
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
  ]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const updatedFormData = {
      ...formData,
      [name]: type === "checkbox" ? checked : value,
      selectedFiles: selectedFiles[contractType],
    };

    if (name === "rateId") {
      const selectedRate = contractState.filteredRates.find(
        (rate) => rate.id === (isNaN(value) ? value : Number(value))
      );
      setSelectedDocumentation(selectedRate?.documentation || []);
    }

    setFormData(updatedFormData);
    if (isSelected) {
      onContractUpdate(updatedFormData);
    }
  };

  const handleIsSelectedChange = () => {
    const newIsSelected = !isSelected;
    setIsSelected(newIsSelected);

    const updatedFormData = {
      ...formData,
      isSelected: newIsSelected,
    };

    setFormData(updatedFormData);

    onContractUpdate(updatedFormData);
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

  return (
    <div
      className={`p-4 border rounded-lg bg-background ${
        isSelected ? "border-blue-500 border-4" : "border-gray-500 border"
      }`}
    >
      <h3 className="text-xl font-bold text-black">
        {contractType === "Luz" ? "Contrato Luz" : "Contrato Gas"}
      </h3>

      <div className="mb-4 flex items-center">
        <input
          type="checkbox"
          id={`selectContract-${contractType}`}
          name={`selectContract-${contractType}`}
          checked={isSelected}
          onChange={handleIsSelectedChange}
          className="mr-2"
        />
        <label
          htmlFor={`selectContract-${contractType}`}
          className="text-black"
        >
          Crear {contractType === "Luz" ? "Contrato de Luz" : "Contrato de Gas"}
        </label>
      </div>

      {isSelected && (
        <>
          <div className="mb-4">
            <div className="flex gap-4">
              {["2.0", "3.0", "6.1"].map((option) => (
                <div key={option} className="flex items-center">
                  <input
                    type="radio"
                    id={`option-${contractType}-${option}`}
                    name={`contractMode-${contractType}`}
                    value={option}
                    checked={
                      contractState.selectedTypeForContracts[contractType] ===
                      option
                    }
                    onChange={(e) => {
                      const newSelectedTypeForContracts = {
                        ...contractState.selectedTypeForContracts,
                        [contractType]: e.target.value,
                      };

                      setContractState((prev) => ({
                        ...prev,
                        selectedTypeForContracts: newSelectedTypeForContracts,
                      }));

                      const selectedCompany = companies.find(
                        (company) => company.id == formData.companyId
                      );

                      if (
                        selectedCompany &&
                        contractState.rates[selectedCompany.name]
                      ) {
                        const filtered = contractState.rates[
                          selectedCompany.name
                        ].filter((rate) => rate.type === e.target.value);

                        setContractState((prev) => ({
                          ...prev,
                          filteredRates: filtered,
                        }));

                        setFormData((prevFormData) => {
                          const updatedPowers =
                            e.target.value === "2.0"
                              ? prevFormData.contractedPowers.slice(0, 2)
                              : prevFormData.contractedPowers;

                          return {
                            ...prevFormData,
                            rateId: filtered[0]?.id || "",
                            contractedPowers: updatedPowers,
                          };
                        });
                      }
                    }}
                    className="mr-2"
                  />

                  <label
                    htmlFor={`option-${contractType}-${option}`}
                    className="text-black"
                  >
                    {option}
                  </label>
                </div>
              ))}
            </div>
          </div>
          <form>
            <div className="mb-4">
              <label className="block text-black mb-2" htmlFor="companyId">
                Compañía
              </label>
              <select
                id="companyId"
                name="companyId"
                value={formData.companyId}
                onChange={handleChange}
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
              <label className="block text-black mb-2" htmlFor="cups">
                CUPS
              </label>
              <input
                type="text"
                id="cups"
                name="cups"
                className="w-full px-4 py-2 rounded bg-backgroundHoverBold text-black focus:outline-none"
                value={formData.cups}
                onChange={handleChange}
                required
              />
            </div>

            {contractType === "Gas" && (
              <div className="mb-4">
                <label className="block text-black mb-2" htmlFor="product">
                  Producto
                </label>
                <select
                  id="product"
                  name="product"
                  value={formData.product}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded bg-backgroundHoverBold text-black focus:outline-none"
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

            <div className="mb-4">
              <label className="block text-black mb-2" htmlFor="rateId">
                Tarifa
              </label>
              <select
                id="rateId"
                name="rateId"
                value={formData.rateId}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded bg-backgroundHoverBold text-black focus:outline-none"
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

            {contractType === "Luz" && (
              <div className="mb-4">
                <label className="block text-black mb-2">
                  Potencias Contratadas (kW)
                </label>
                <div className="flex flex-wrap gap-2">
                  {Array.from({
                    length:
                      contractState.selectedTypeForContracts[contractType] ===
                      "2.0"
                        ? 2
                        : 6,
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

                        const updatedFormData = {
                          ...formData,
                          contractedPowers: updatedPowers,
                        };

                        setFormData(updatedFormData);
                        onContractUpdate(updatedFormData);
                      }}
                      className="w-24 px-2 py-1 rounded bg-backgroundHoverBold text-black focus:outline-none"
                      placeholder={`P${index + 1}`}
                      disabled={
                        contractState.selectedTypeForContracts[contractType] ===
                          "2.0" && index > 1
                      }
                    />
                  ))}
                </div>
              </div>
            )}

            {contractType === "Luz" && (
              <>
                <div className="mb-4 flex items-center">
                  <input
                    type="checkbox"
                    id="solarPlates"
                    name="solarPlates"
                    checked={formData.solarPlates}
                    onChange={(e) => {
                      const updatedFormData = {
                        ...formData,
                        solarPlates: e.target.checked,
                        virtualBat: !e.target.checked
                          ? false
                          : formData.virtualBat,
                      };

                      setFormData(updatedFormData);
                      onContractUpdate(updatedFormData);
                    }}
                    className="mr-2"
                  />
                  <label htmlFor="solarPlates" className="text-black">
                    Placas
                  </label>
                </div>

                {formData.solarPlates && (
                  <div className="mb-4">
                    <label
                      className="block text-black mb-2"
                      htmlFor="virtualBat"
                    >
                      BAT Virtual
                    </label>
                    <select
                      id="virtualBat"
                      name="virtualBat"
                      value={formData.virtualBat ? "true" : "false"}
                      onChange={(e) => {
                        const newVirtualBatValue = e.target.value === "true";

                        const updatedFormData = {
                          ...formData,
                          virtualBat: newVirtualBatValue,
                        };

                        setFormData(updatedFormData);
                        onContractUpdate(updatedFormData);
                      }}
                      className="w-full px-4 py-2 rounded bg-backgroundHoverBold text-black focus:outline-none"
                      disabled={!formData.solarPlates}
                      required
                    >
                      <option value="true">Sí</option>
                      <option value="false">No</option>
                    </select>
                  </div>
                )}
              </>
            )}

            <div className="mb-4">
              <label className="block text-black mb-2" htmlFor="maintenance">
                Mantenimiento
              </label>
              <select
                id="maintenance"
                name="maintenance"
                value={formData.maintenance}
                onChange={(e) => {
                  const updatedFormData = {
                    ...formData,
                    maintenance: e.target.value === "true",
                  };
                  setFormData(updatedFormData);

                  onContractUpdate(updatedFormData);
                }}
                className="w-full px-4 py-2 rounded bg-backgroundHoverBold text-black focus:outline-none"
                required
              >
                <option value="true">Sí</option>
                <option value="false">No</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-black mb-2" htmlFor="electronicBill">
                Factura Electrónica
              </label>
              <select
                id="electronicBill"
                name="electronicBill"
                value={formData.electronicBill}
                onChange={(e) => {
                  const updatedFormData = {
                    ...formData,
                    electronicBill: e.target.value === "true",
                  };
                  setFormData(updatedFormData);

                  onContractUpdate(updatedFormData);
                }}
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
                className="w-full px-4 py-2 rounded bg-backgroundHoverBold text-black focus:outline-none"
                value={formData.extraInfo}
                onChange={handleChange}
              />
            </div>
            {selectedDocumentation.length > 0 && (
              <>
                <div className="mt-4">
                  <h4 className="text-black font-bold">
                    Documentación necesaria:
                  </h4>
                  <ul className="list-disc list-inside text-black">
                    {selectedDocumentation.map((item, index) => (
                      <li key={index}>
                        {item}
                        <div className="mb-4 mt-4">
                          <input
                            type="file"
                            id={`file-${contractType}-${index}`}
                            onChange={(e) => {
                              const file = e.target.files[0]; // Solo permitimos un archivo por input
                              if (!file) return; // Salimos si no se selecciona un archivo

                              const updatedFiles = {
                                ...selectedFiles,
                                [contractType]: [
                                  ...selectedFiles[contractType],
                                  { name: file.name, file }, // Guardamos un objeto con información del archivo
                                ],
                              };

                              setSelectedFiles(updatedFiles);

                              setFormData((prevFormData) => ({
                                ...prevFormData,
                                selectedFiles: updatedFiles[contractType],
                              }));

                              if (isSelected) {
                                onContractUpdate({
                                  ...formData,
                                  selectedFiles: updatedFiles[contractType],
                                });
                              }
                            }}
                            className="hidden"
                          />
                          <label
                            htmlFor={`file-${contractType}-${index}`}
                            className="px-4 py-2 bg-backgroundHoverBold text-black rounded-md cursor-pointer"
                          >
                            Seleccionar archivo para {item}
                          </label>
                        </div>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-4">
                    {selectedFiles[contractType]?.length > 0 ? (
                      <ul className="list-disc list-inside text-black">
                        {selectedFiles[contractType].map(
                          (fileObj, fileIndex) => (
                            <li
                              key={fileIndex}
                              className="flex items-center gap-2"
                            >
                              <span>
                                {fileObj.name} -{" "}
                                {(fileObj.file.size / 1024).toFixed(2)} KB
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  handleDeleteFile(contractType, fileObj.name)
                                }
                                className="text-red-600 hover:text-red-800 focus:outline-none"
                                aria-label="Eliminar archivo"
                              >
                                <FaTrash />
                              </button>
                            </li>
                          )
                        )}
                      </ul>
                    ) : (
                      <p className="text-gray-600">
                        No hay archivos seleccionados.
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}
          </form>
        </>
      )}
    </div>
  );
}
