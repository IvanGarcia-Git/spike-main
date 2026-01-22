"use client";

import { authFetch } from "@/helpers/server-fetch.helper";
import { useState, useEffect } from "react";
import { getCookie } from "cookies-next";

export default function NewRateModal({
  isOpen,
  onClose,
  onSave,
  companyId,
  rateToEdit,
}) {
  const [activeTab, setActiveTab] = useState("prices");
  const [documentationValues, setDocumentationValues] = useState([]);
  const [error, setError] = useState({ name: "", type: "", renewDays: "", serviceType: "" });

  const [newRate, setNewRate] = useState({
    name: "",
    type: "",
    serviceType: "Luz",
    renewDays: 0,
    powerSlot1: "",
    powerSlot2: "",
    powerSlot3: "",
    powerSlot4: "",
    powerSlot5: "",
    powerSlot6: "",
    energySlot1: "",
    energySlot2: "",
    energySlot3: "",
    energySlot4: "",
    energySlot5: "",
    energySlot6: "",
    surplusSlot1: "",
    products: "",
    finalPrice: 0,
  });

  useEffect(() => {
    setActiveTab("prices");
    setDocumentationValues([]);
    setError({ name: "", type: "", renewDays: "", serviceType: "" });
    if (rateToEdit) {
      const normalizedRate = Object.keys(newRate).reduce((acc, key) => {
        acc[key] = rateToEdit[key] !== undefined && rateToEdit[key] !== null ? rateToEdit[key] : "";
        return acc;
      }, {});
      // Asegurar que serviceType tenga un valor por defecto si no viene
      if (!normalizedRate.serviceType) {
        normalizedRate.serviceType = "Luz";
      }
      setNewRate(normalizedRate);
    }
    if (rateToEdit && rateToEdit.documentation) {
      setDocumentationValues(rateToEdit.documentation);
    }
  }, [rateToEdit]);

  const cleanData = (data) => {
    const cleanedData = { ...data };

    for (let key in cleanedData) {
      if (cleanedData[key] === "") {
        cleanedData[key] = null;
      } else if (!isNaN(cleanedData[key]) && key !== "type") {
        cleanedData[key] = parseFloat(cleanedData[key]);
      }
    }

    return cleanedData;
  };

  const handleAddRate = async (e) => {
    e.preventDefault();
    setError({ name: "", type: "", renewDays: "", serviceType: "" });

    if (!newRate.name) {
      setError((prev) => ({
        ...prev,
        name: "El nombre de la tarifa es obligatorio.",
      }));
      return;
    }

    if (!newRate.serviceType) {
      setError((prev) => ({
        ...prev,
        serviceType: "El tipo de servicio es obligatorio.",
      }));
      return;
    }

    if (!newRate.type && newRate.serviceType !== "Telefonía") {
      setError((prev) => ({
        ...prev,
        type: "El tipo de tarifa es obligatorio.",
      }));
      return;
    }

    if (!newRate.renewDays || isNaN(newRate.renewDays) || newRate.renewDays <= 0) {
      setError((prev) => ({
        ...prev,
        renewDays: "El número de días para renovación es obligatorio y debe ser mayor a 0.",
      }));
      return;
    }

    const jwtToken = getCookie("factura-token");

    const cleanedRate = cleanData({
      ...newRate,
      companyId,
      documentation: documentationValues,
    });

    if (cleanedRate.finalPrice === 0) {
      cleanedRate.finalPrice = null;
    }

    try {
      const response = await authFetch(
        rateToEdit ? "PATCH" : "POST",
        rateToEdit ? `rates/${rateToEdit.id}` : "rates/",
        cleanedRate,
        jwtToken
      );

      if (response.ok) {
        const addedRate = await response.json();
        onSave(addedRate);

        setNewRate({
          ...newRate,
          documentation: [],
        });
        setDocumentationValues([]);
        onClose();
      } else {
        alert("Error agregando el nuevo estado");
      }
    } catch (error) {
      console.error("Error enviando la solicitud:", error);
    }
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  const handleCheckboxChange = (e) => {
    const { value, checked } = e.target;

    setDocumentationValues((prevValues) =>
      checked ? [...prevValues, value] : prevValues.filter((v) => v !== value)
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 lg:ml-72">
      <div className="bg-foreground text-black p-6 rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex mb-4 border-b">
          <button
            type="button"
            onClick={() => handleTabClick("prices")}
            className={`px-4 py-2 text-black ${
              activeTab === "prices" ? "border-b-2 border-blue-500" : "border-b-2 border-gray-300"
            }`}
          >
            Precios
          </button>
          <button
            type="button"
            onClick={() => handleTabClick("documentation")}
            className={`px-4 py-2 text-black ${
              activeTab === "documentation"
                ? "border-b-2 border-blue-500"
                : "border-b-2 border-gray-300"
            }`}
          >
            Documentación
          </button>
        </div>

        <form onSubmit={handleAddRate}>
          {activeTab === "prices" && (
            <>
              {/* Título */}
              <h3 className="text-xl font-bold mb-4">
                {rateToEdit ? "Editar tarifa" : "Crear nueva tarifa"}
              </h3>

              {/* Selector de tipo de servicio */}
              <div className="mb-4">
                <label className="block text-black mb-2">Tipo de Servicio</label>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="serviceLuz"
                      name="serviceType"
                      value="Luz"
                      className="mr-2"
                      checked={newRate.serviceType === "Luz"}
                      onChange={(e) => setNewRate({ ...newRate, serviceType: e.target.value, type: "" })}
                    />
                    <label htmlFor="serviceLuz" className="text-black">Luz</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="serviceGas"
                      name="serviceType"
                      value="Gas"
                      className="mr-2"
                      checked={newRate.serviceType === "Gas"}
                      onChange={(e) => setNewRate({ ...newRate, serviceType: e.target.value, type: "" })}
                    />
                    <label htmlFor="serviceGas" className="text-black">Gas</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="serviceTelefonia"
                      name="serviceType"
                      value="Telefonía"
                      className="mr-2"
                      checked={newRate.serviceType === "Telefonía"}
                      onChange={(e) => setNewRate({ ...newRate, serviceType: e.target.value, type: "" })}
                    />
                    <label htmlFor="serviceTelefonia" className="text-black">Telefonía</label>
                  </div>
                </div>
              </div>
              {error.serviceType && <div className="text-red-600 text-sm mt-2">{error.serviceType}</div>}

              {/* Tipo de tarifa (solo para Luz) */}
              {newRate.serviceType === "Luz" && (
                <div className="mb-4">
                  <label className="block text-black mb-2">Tipo de Tarifa</label>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="rate2_0"
                        name="type"
                        value="2.0"
                        className="mr-2"
                        checked={newRate.type === "2.0"}
                        onChange={(e) => setNewRate({ ...newRate, type: e.target.value })}
                      />
                      <label htmlFor="rate2_0" className="text-black">2.0</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="rate3_0"
                        name="type"
                        value="3.0"
                        className="mr-2"
                        checked={newRate.type === "3.0"}
                        onChange={(e) => setNewRate({ ...newRate, type: e.target.value })}
                      />
                      <label htmlFor="rate3_0" className="text-black">3.0</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="rate6_1"
                        name="type"
                        value="6.1"
                        className="mr-2"
                        checked={newRate.type === "6.1"}
                        onChange={(e) => setNewRate({ ...newRate, type: e.target.value })}
                      />
                      <label htmlFor="rate6_1" className="text-black">6.1</label>
                    </div>
                  </div>
                </div>
              )}
              {error.type && <div className="text-red-600 text-sm mt-2">{error.type}</div>}

              {/* Nombre de la tarifa */}
              <div className="mb-4">
                <label className="block text-black mb-2" htmlFor="name">
                  Nombre de la Tarifa
                </label>
                <input
                  type="text"
                  id="name"
                  className="w-full px-4 py-2 rounded bg-background text-black focus:outline-none"
                  value={newRate.name}
                  onChange={(e) => setNewRate({ ...newRate, name: e.target.value })}
                  required
                />
              </div>
              {error.name && <div className="text-red-600 text-sm mt-2">{error.name}</div>}

              {/* Retro */}
              <div className="mb-4">
                <label className="block text-black mb-2" htmlFor="renewDays">
                  Retro
                </label>
                <input
                  type="number"
                  id="renewDays"
                  className="w-full px-4 py-2 rounded bg-background text-black focus:outline-none"
                  value={newRate.renewDays}
                  onChange={(e) =>
                    setNewRate({
                      ...newRate,
                      renewDays: parseFloat(e.target.value) || 0,
                    })
                  }
                  required
                />
              </div>
              {error.renewDays && (
                <div className="text-red-600 text-sm mt-2">{error.renewDays}</div>
              )}

              {/* Luz */}
              {newRate.serviceType === "Luz" && (
                <>
                  {/* Potencia - 2 tramos para 2.0, 6 tramos para 3.0/6.1 */}
                  {(newRate.type === "2.0" ? [1, 2] : [1, 2, 3, 4, 5, 6]).map((slot) => (
                    <div key={`power-${slot}`} className="mb-4">
                      <label className="block text-black mb-2" htmlFor={`powerSlot${slot}`}>
                        Potencia Slot {slot} (kW)
                      </label>
                      <input
                        type="number"
                        id={`powerSlot${slot}`}
                        className="w-full px-4 py-2 rounded bg-background text-black focus:outline-none"
                        value={newRate[`powerSlot${slot}`] || ""}
                        onChange={(e) =>
                          setNewRate({
                            ...newRate,
                            [`powerSlot${slot}`]: e.target.value,
                          })
                        }
                      />
                    </div>
                  ))}
                  {/* Energía - 3 tramos para 2.0, 6 tramos para 3.0/6.1 */}
                  {(newRate.type === "2.0" ? [1, 2, 3] : [1, 2, 3, 4, 5, 6]).map((slot) => (
                    <div key={`energy-${slot}`} className="mb-4">
                      <label className="block text-black mb-2" htmlFor={`energySlot${slot}`}>
                        Energía Slot {slot} (€/kWh)
                      </label>
                      <input
                        type="number"
                        id={`energySlot${slot}`}
                        className="w-full px-4 py-2 rounded bg-background text-black focus:outline-none"
                        value={newRate[`energySlot${slot}`] || ""}
                        onChange={(e) =>
                          setNewRate({
                            ...newRate,
                            [`energySlot${slot}`]: e.target.value,
                          })
                        }
                      />
                    </div>
                  ))}
                  {/* Excedente */}
                  <div className="mb-4">
                    <label className="block text-black mb-2" htmlFor="surplusSlot1">
                      Excedente (€/kWh)
                    </label>
                    <input
                      type="number"
                      id="surplusSlot1"
                      className="w-full px-4 py-2 rounded bg-background text-black focus:outline-none"
                      value={newRate.surplusSlot1}
                      onChange={(e) => setNewRate({ ...newRate, surplusSlot1: e.target.value })}
                    />
                  </div>
                </>
              )}

              {/* Telefonía */}
              {newRate.serviceType === "Telefonía" && (
                <>
                  <div className="mb-4">
                    <label className="block text-black mb-2" htmlFor="products">
                      Producto
                    </label>
                    <input
                      type="text"
                      id="products"
                      className="w-full px-4 py-2 rounded bg-background text-black focus:outline-none"
                      value={newRate.products}
                      onChange={(e) => setNewRate({ ...newRate, products: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-black mb-2" htmlFor="finalPrice">
                      Precio final (€/mes)
                    </label>
                    <input
                      type="number"
                      id="finalPrice"
                      className="w-full px-4 py-2 rounded bg-background text-black focus:outline-none"
                      value={newRate.finalPrice}
                      onChange={(e) =>
                        setNewRate({ ...newRate, finalPrice: parseFloat(e.target.value) || 0 })
                      }
                      required
                    />
                  </div>
                </>
              )}

              {/* Gas */}
              {newRate.serviceType === "Gas" && (
                <>
                  <div className="mb-4">
                    <label className="block text-black mb-2" htmlFor="energySlot1">
                      Energía Slot 1 (€/kWh)
                    </label>
                    <input
                      type="number"
                      id="energySlot1"
                      className="w-full px-4 py-2 rounded bg-background text-black focus:outline-none"
                      value={newRate.energySlot1}
                      onChange={(e) => setNewRate({ ...newRate, energySlot1: e.target.value })}
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-black mb-2" htmlFor="surplusSlot1">
                      Excedente (€/kWh)
                    </label>
                    <input
                      type="number"
                      id="surplusSlot1"
                      className="w-full px-4 py-2 rounded bg-background text-black focus:outline-none"
                      value={newRate.surplusSlot1}
                      onChange={(e) => setNewRate({ ...newRate, surplusSlot1: e.target.value })}
                    />
                  </div>
                </>
              )}
            </>
          )}

          {activeTab === "documentation" && (
            <>
              {/* Opciones con checkbox */}
              <div className="grid grid-cols-2 gap-4">
                <label>
                  <input
                    type="checkbox"
                    name="dni"
                    value="DNI"
                    checked={documentationValues.includes("DNI")}
                    onChange={handleCheckboxChange}
                  />{" "}
                  DNI
                </label>
                <label>
                  <input
                    type="checkbox"
                    name="cif"
                    value="CIF"
                    checked={documentationValues.includes("CIF")}
                    onChange={handleCheckboxChange}
                  />{" "}
                  CIF
                </label>
                <label>
                  <input
                    type="checkbox"
                    name="factura"
                    value="FACTURA"
                    checked={documentationValues.includes("FACTURA")}
                    onChange={handleCheckboxChange}
                  />{" "}
                  FACTURA
                </label>
                <label>
                  <input
                    type="checkbox"
                    name="escrituras"
                    value="ESCRITURAS"
                    checked={documentationValues.includes("ESCRITURAS")}
                    onChange={handleCheckboxChange}
                  />{" "}
                  ESCRITURAS
                </label>
                <label>
                  <input
                    type="checkbox"
                    name="grabacion"
                    value="GRABACION"
                    checked={documentationValues.includes("GRABACION")}
                    onChange={handleCheckboxChange}
                  />{" "}
                  GRABACION
                </label>
                <label>
                  <input
                    type="checkbox"
                    name="cie"
                    value="CIE"
                    checked={documentationValues.includes("CIE")}
                    onChange={handleCheckboxChange}
                  />{" "}
                  CIE
                </label>
                <label>
                  <input
                    type="checkbox"
                    name="otro"
                    value="OTRO"
                    checked={documentationValues.includes("OTRO")}
                    onChange={handleCheckboxChange}
                  />{" "}
                  OTRO
                </label>
              </div>
            </>
          )}

          {/* Botones */}
          <div className="flex justify-end">
            <button
              type="button"
              className="bg-red-600 text-white px-4 py-2 rounded mr-2 hover:bg-red-700"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-secondary text-black px-4 py-2 rounded hover:bg-yellow-500"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
