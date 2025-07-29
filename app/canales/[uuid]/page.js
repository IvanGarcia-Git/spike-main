"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getCookie } from "cookies-next";
import { authGetFetch, authFetch } from "@/helpers/server-fetch.helper";

export default function EditChannel({ params }) {
  const router = useRouter();
  const uuid = params.uuid;

  const [rates, setRates] = useState([]);
  const [selectedRates, setSelectedRates] = useState([]);
  const [activeTab, setActiveTab] = useState("rates");
  const debounceRefPaymentDay = useRef(null);
  const debounceRefCommission = useRef(null);
  const [channel, setChannel] = useState({
    imageUri: "",
    name: "",
    representativeName: "",
    representativePhone: "",
    representativeEmail: "",
    address: "",
    cif: "",
    iban: "",
  });

  const [selectedImage, setSelectedImage] = useState(null);
  const [commissionUsers, setCommissionUsers] = useState([]);
  const [commissionAssignments, setCommissionAssignments] = useState({});
  const [selectedUsers, setSelectedUsers] = useState({});

  const getChannelDetails = async () => {
    const jwtToken = getCookie("factura-token");

    try {
      const response = await authGetFetch(`channels/${uuid}`, jwtToken);
      if (response.ok) {
        const channelData = await response.json();
        setChannel(channelData);

        getRates(jwtToken, channelData.id);
      } else {
        alert("Error al cargar los detalles del canal");
      }
    } catch (error) {
      console.error("Error al obtener los detalles del canal:", error);
    }
  };

  const getRates = async (jwtToken, channelId) => {
    try {
      const response = await authGetFetch(`rates/group/company-name`, jwtToken);
      if (response.ok) {
        const ratesData = await response.json();
        setRates(ratesData);
        const channelRates = Object.values(ratesData)
          .flat()
          .filter((rate) => rate.channelId === channelId)
          .map((rate) => rate.id);

        setSelectedRates(channelRates);
      } else {
        alert("Error al cargar las tarifas disponibles");
      }
    } catch (error) {
      console.error("Error al obtener las tarifas:", error);
    }
  };

  useEffect(() => {
    if (uuid) {
      getChannelDetails();
    }
  }, [uuid]);

  useEffect(() => {
    const jwt = getCookie("factura-token");
    authGetFetch("users/agents-and-supervisors", jwt)
      .then((res) => res.json())
      .then((data) => setCommissionUsers(data));
  }, []);

  useEffect(() => {
    if (!channel.id) return;
    const jwt = getCookie("factura-token");
    authGetFetch(`commission-assignments?channelId=${channel.id}`, jwt)
      .then((res) => res.json())
      .then((list) => {
        const map = {};
        list.forEach(({ rateId, userId, amount }) => {
          if (!map[rateId]) map[rateId] = {};
          map[rateId][userId] = amount;
        });
        setCommissionAssignments(map);
        setSelectedUsers({});
      });
  }, [channel.id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setChannel({ ...channel, [name]: value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      const imagePreviewUrl = URL.createObjectURL(file);
      setChannel({ ...channel, imageUri: imagePreviewUrl });
    }
  };

  const updateRateChannel = async (rateId, newChannelId) => {
    const jwtToken = getCookie("factura-token");
    try {
      const response = await authFetch(
        "PATCH",
        `rates/${rateId}`,
        { channelId: newChannelId },
        jwtToken
      );

      if (!response.ok) {
        alert("Error actualizando el Rate");
      }
    } catch (error) {
      console.error("Error enviando la solicitud:", error);
    }
  };

  const handleRateSelection = (rateId) => {
    if (selectedRates.includes(rateId)) {
      setSelectedRates(selectedRates.filter((id) => id !== rateId));
      updateRateChannel(rateId, null);
    } else {
      setSelectedRates([...selectedRates, rateId]);
      updateRateChannel(rateId, channel.id);
    }
  };

  const handlePaymentDayChange = (rateId, paymentDay) => {
    setRates((prevRates) => {
      const updatedRates = Object.fromEntries(
        Object.entries(prevRates).map(([companyName, companyRates]) => [
          companyName,
          companyRates.map((rate) => (rate.id === rateId ? { ...rate, paymentDay } : rate)),
        ])
      );
      return updatedRates;
    });

    clearTimeout(debounceRefPaymentDay.current);
    debounceRefPaymentDay.current = setTimeout(async () => {
      try {
        const jwtToken = getCookie("factura-token");
        const response = await authFetch(
          "PATCH",
          `rates/${rateId}`,
          { paymentDay: Number(paymentDay) },
          jwtToken
        );

        if (!response.ok) {
          throw new Error("Error al actualizar la tarifa en el servidor");
        }

        const updatedRate = await response.json();
      } catch (error) {
        console.error("Error al actualizar paymentDay:", error);
        alert("No se pudo actualizar el día de pago");
      }
    }, 2000);
  };

  const handleCommissionChange = (rateId, field, value) => {
    const floatValue = parseFloat(value) || 0;

    setRates((prevRates) => {
      const updatedRates = Object.fromEntries(
        Object.entries(prevRates).map(([companyName, companyRates]) => [
          companyName,
          companyRates.map((rate) =>
            rate.id === rateId ? { ...rate, [field]: floatValue } : rate
          ),
        ])
      );
      return updatedRates;
    });

    clearTimeout(debounceRefCommission.current);
    debounceRefCommission.current = setTimeout(async () => {
      try {
        const jwtToken = getCookie("factura-token");
        await authFetch("PATCH", `rates/${rateId}`, { [field]: floatValue }, jwtToken);
      } catch (error) {
        console.error("Error al actualizar la comisión:", error);
      }
    }, 500);
  };

  const handleRenewableChange = async (rateId, value) => {
    setRates((prevRates) => {
      const updatedRates = Object.fromEntries(
        Object.entries(prevRates).map(([companyName, companyRates]) => [
          companyName,
          companyRates.map((rate) => (rate.id === rateId ? { ...rate, renewable: value } : rate)),
        ])
      );
      return updatedRates;
    });

    try {
      const jwtToken = getCookie("factura-token");
      await authFetch("PATCH", `rates/${rateId}`, { renewable: value }, jwtToken);
    } catch (error) {
      console.error(`Error al actualizar el campo renewable para rateId: ${rateId}`, error);
    }
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const jwtToken = getCookie("factura-token");

    try {
      const formData = new FormData();
      formData.append("name", channel.name);
      formData.append("representativeName", channel.representativeName);
      formData.append("representativePhone", channel.representativePhone);
      formData.append("representativeEmail", channel.representativeEmail);
      formData.append("address", channel.address || "");
      formData.append("cif", channel.cif || "");
      formData.append("iban", channel.iban || "");

      if (selectedImage) {
        formData.append("imgFile", selectedImage);
      }
      const channelResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/channels/${uuid}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${jwtToken}` },
        body: formData,
      });
      if (!channelResponse.ok) {
        alert("Error al actualizar el canal");
        return;
      }

      if (selectedRates.length > 0) {
        const rateResponse = await authFetch(
          "PUT",
          "rates/channel-for-rates",
          { channelId: channel.id, ratesIdsArray: selectedRates },
          jwtToken
        );
        if (!rateResponse.ok) {
          alert("Error al actualizar las tarifas vinculadas");
          return;
        }
      }

      const assignments = [];
      for (const [rateId, userMap] of Object.entries(commissionAssignments)) {
        for (const [userId, amount] of Object.entries(userMap)) {
          assignments.push({
            channelId: channel.id,
            rateId: Number(rateId),
            userId: Number(userId),
            amount,
          });
        }
      }

      await Promise.all(
        assignments.map((asgmt) => authFetch("PATCH", "commission-assignments", asgmt, jwtToken))
      );

      alert("Canal, tarifas y comisiones guardadas con éxito");
      router.push("/canales");
    } catch (error) {
      console.error("Error en handleSubmit:", error);
      alert("Hubo un error guardando los cambios");
    }
  };

  return (
    <div className="flex flex-col justify-start items-center bg-background min-h-screen p-8">
      <div className="w-full max-w-4xl bg-foreground text-white p-6 rounded-lg">
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col sm:flex-row items-center sm:items-start mb-8">
            <div className="mr-0 sm:mr-8 mb-4 sm:mb-0">
              <label className="block text-black mb-2" htmlFor="image">
                Imagen del Canal
              </label>
              <input
                type="file"
                accept="image/*"
                id="image"
                onChange={handleImageChange}
                className="block w-full text-sm text-black bg-background border border-gray-600 rounded-lg cursor-pointer focus:outline-none"
              />
              {channel.imageUri && (
                <img
                  src={channel.imageUri}
                  alt={channel.name}
                  className="w-32 h-32 object-cover mt-4 rounded text-black"
                />
              )}
            </div>

            <div className="w-full">
              <div className="mb-4">
                <label className="block text-black mb-2" htmlFor="name">
                  Nombre del Canal
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={channel.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded bg-background text-black focus:outline-none"
                  required
                />
              </div>

              <hr className="border-gray-600 my-4" />

              <div className="mb-4">
                <label className="block text-black mb-2" htmlFor="representativeName">
                  Nombre del Representante
                </label>
                <input
                  type="text"
                  id="representativeName"
                  name="representativeName"
                  value={channel.representativeName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded bg-background text-black focus:outline-none"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-black mb-2" htmlFor="representativePhone">
                  Teléfono del Representante
                </label>
                <input
                  type="tel"
                  id="representativePhone"
                  name="representativePhone"
                  value={channel.representativePhone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded bg-background text-black focus:outline-none"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-black mb-2" htmlFor="representativeEmail">
                  Email del Representante
                </label>
                <input
                  type="email"
                  id="representativeEmail"
                  name="representativeEmail"
                  value={channel.representativeEmail}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded bg-background text-black focus:outline-none"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-black mb-2" htmlFor="address">
                  Dirección fiscal
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={channel.address || ""}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded bg-background text-black focus:outline-none"
                  placeholder="Dirección fiscal del canal"
                />
              </div>

              <div className="mb-4">
                <label className="block text-black mb-2" htmlFor="cif">
                  CIF
                </label>
                <input
                  type="text"
                  id="cif"
                  name="cif"
                  value={channel.cif || ""}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded bg-background text-black focus:outline-none"
                  placeholder="CIF del canal"
                />
              </div>

              <div className="mb-4">
                <label className="block text-black mb-2" htmlFor="cif">
                  IBAN
                </label>
                <input
                  type="text"
                  id="iban"
                  name="iban"
                  value={channel.iban || ""}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded bg-background text-black focus:outline-none"
                  placeholder="IBAN del canal"
                />
              </div>
            </div>
          </div>

          {/* Navegación de Pestañas */}
          <div className="flex mb-4 border-b">
            <button
              type="button"
              onClick={() => handleTabClick("rates")}
              className={`px-4 py-2 text-black ${
                activeTab === "rates" ? "border-b-2 border-blue-500" : "border-b-2 border-gray-300"
              }`}
            >
              Tarifas Vinculadas
            </button>
            <button
              type="button"
              onClick={() => handleTabClick("payment")}
              className={`px-4 py-2 text-black ${
                activeTab === "payment"
                  ? "border-b-2 border-blue-500"
                  : "border-b-2 border-gray-300"
              }`}
            >
              Fecha cobro
            </button>
            <button
              type="button"
              onClick={() => handleTabClick("commissions")}
              className={`px-4 py-2 text-black ${
                activeTab === "commissions"
                  ? "border-b-2 border-blue-500"
                  : "border-b-2 border-gray-300"
              }`}
            >
              Comisiones/Puntos
            </button>
          </div>

          {activeTab === "rates" && (
            <div className="mb-6">
              <h3 className="text-xl text-black font-bold mb-4">Vincular Tarifas al Canal</h3>
              {Object.keys(rates).length === 0 ? (
                <p>No hay tarifas disponibles</p>
              ) : (
                Object.entries(rates).map(([companyName, companyRates]) => (
                  <details key={companyName} className="mb-4">
                    <summary className="cursor-pointer bg-background text-black p-2 rounded">
                      {companyName}
                    </summary>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                      {companyRates.map((rate) => (
                        <div key={rate.id} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`rate-${rate.id}`}
                            checked={selectedRates.includes(rate.id)}
                            onChange={() => handleRateSelection(rate.id)}
                            disabled={rate.channelId !== null && rate.channelId !== channel.id}
                            className="mr-2"
                          />
                          <label htmlFor={`rate-${rate.id}`} className="text-black">
                            {rate.name} - {rate.renewDays} días
                          </label>
                        </div>
                      ))}
                    </div>
                  </details>
                ))
              )}
            </div>
          )}

          {activeTab === "payment" && (
            <div className="mb-6">
              {Object.keys(rates).length === 0 ? (
                <p>No hay tarifas disponibles</p>
              ) : (
                Object.entries(rates).map(([companyName, companyRates]) => {
                  const checkedRates = companyRates.filter((rate) =>
                    selectedRates.includes(rate.id)
                  );

                  return checkedRates.length > 0 ? (
                    <details key={companyName} className="mb-4">
                      <summary className="cursor-pointer bg-background text-black p-2 rounded">
                        {companyName}
                      </summary>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                        {checkedRates.map((rate) => (
                          <div key={rate.id} className="flex items-center">
                            <label htmlFor={`paymentDay-${rate.id}`} className="text-black mr-2">
                              {rate.name} :
                            </label>
                            <input
                              type="number"
                              id={`paymentDay-${rate.id}`}
                              value={rate.paymentDay || ""}
                              onChange={(e) => handlePaymentDayChange(rate.id, e.target.value)}
                              min="0"
                              max="31"
                              className="w-16 px-2 py-1 border border-gray-300 rounded text-black"
                            />
                          </div>
                        ))}
                      </div>
                    </details>
                  ) : null;
                })
              )}
            </div>
          )}

          {activeTab === "commissions" && (
            <div className="mb-6">
              {Object.keys(rates).length === 0 ? (
                <p>No hay tarifas disponibles</p>
              ) : (
                Object.entries(rates).map(([companyName, companyRates]) => {
                  const checkedRates = companyRates.filter((rate) =>
                    selectedRates.includes(rate.id)
                  );
                  if (!checkedRates.length) return null;

                  return checkedRates.length > 0 ? (
                    <details key={companyName} className="mb-4">
                      <summary className="cursor-pointer bg-background text-black p-2 rounded">
                        {companyName}
                      </summary>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                        {checkedRates.map((rate) => (
                          <div
                            key={rate.id}
                            className="grid grid-cols-3 gap-4 items-center bg-gray-50 p-2 rounded shadow"
                          >
                            {/* 1) SELECT Supervisor/Agente */}
                            <label
                              htmlFor={`commUser-${rate.id}`}
                              className="block text-sm text-black"
                            >
                              Supervisor/Agente
                            </label>
                            <select
                              id={`commUser-${rate.id}`}
                              value={selectedUsers[rate.id] ?? ""}
                              onChange={(e) => {
                                const userId = Number(e.target.value) || undefined;
                                setSelectedUsers((prev) => ({ ...prev, [rate.id]: userId }));
                              }}
                              className="w-full px-2 py-1 border rounded text-black"
                            >
                              <option value="">— Selecciona —</option>
                              {commissionUsers.map((u) => (
                                <option key={u.id} value={u.id}>
                                  {u.name} {u.firstSurname}
                                </option>
                              ))}
                            </select>

                            {/* 2) INPUT Comisión comercial */}
                            {selectedUsers[rate.id] && (
                              <div className="flex flex-col col-span-3">
                                <label
                                  htmlFor={`commAmt-${rate.id}`}
                                  className="block text-sm text-black"
                                >
                                  Comisión comercial (€)
                                </label>
                                <input
                                  type="number"
                                  id={`commAmt-${rate.id}`}
                                  value={
                                    commissionAssignments[rate.id]?.[selectedUsers[rate.id]] ?? 0
                                  }
                                  onChange={(e) => {
                                    const amount = parseInt(e.target.value) || 0;
                                    setCommissionAssignments((prev) => ({
                                      ...prev,
                                      [rate.id]: {
                                        ...prev[rate.id],
                                        [selectedUsers[rate.id]]: amount,
                                      },
                                    }));
                                  }}
                                  className="w-full px-2 py-1 border rounded text-black"
                                />
                              </div>
                            )}

                            {/* Nombre de la tarifa */}
                            <div className="col-span-3 text-black text-base font-medium mb-2 sm:mb-0">
                              {rate.name}
                            </div>

                            {/* Campo para paymentMoney */}
                            <div className="flex flex-col">
                              <label
                                htmlFor={`paymentMoney-${rate.id}`}
                                className="text-black text-sm font-medium"
                              >
                                Comisión:
                              </label>
                              <input
                                type="number"
                                id={`paymentMoney-${rate.id}`}
                                step="0.01"
                                value={rate.paymentMoney || ""}
                                onChange={(e) =>
                                  handleCommissionChange(rate.id, "paymentMoney", e.target.value)
                                }
                                min="0"
                                className="w-full px-2 py-1 border border-gray-300 rounded text-black text-sm"
                              />
                            </div>

                            {/* Campo para paymentPoints */}
                            <div className="flex flex-col">
                              <label
                                htmlFor={`paymentPoints-${rate.id}`}
                                className="text-black text-sm font-medium"
                              >
                                Puntos:
                              </label>
                              <input
                                type="number"
                                id={`paymentPoints-${rate.id}`}
                                step="0.01"
                                value={rate.paymentPoints || ""}
                                onChange={(e) =>
                                  handleCommissionChange(rate.id, "paymentPoints", e.target.value)
                                }
                                min="0"
                                className="w-full px-2 py-1 border border-gray-300 rounded text-black text-sm"
                              />
                            </div>

                            {/* Checkbox para Renovar */}
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id={`renewable-${rate.id}`}
                                checked={rate.renewable || false}
                                onChange={(e) => handleRenewableChange(rate.id, e.target.checked)}
                                className="w-4 h-4"
                              />
                              <label
                                htmlFor={`renewable-${rate.id}`}
                                className="text-black text-sm font-medium"
                              >
                                Renovar
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>
                    </details>
                  ) : null;
                })
              )}
            </div>
          )}

          {/* Botones */}
          <div className="flex justify-end">
            <button
              type="button"
              className="bg-red-600 text-white px-4 py-2 rounded mr-2 hover:bg-red-700"
              onClick={() => router.push("/canales")}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-secondary text-white px-4 py-2 rounded hover:bg-secondaryHover"
            >
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
