"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getCookie } from "cookies-next";
import { authGetFetch, authFetch } from "@/helpers/server-fetch.helper";
import { NeumorphicCard, NeumorphicButton, NeumorphicInput } from "@/components/neumorphic";
import { toast } from "react-toastify";

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
  const [commissionTiers, setCommissionTiers] = useState({});

  const getChannelDetails = async () => {
    const jwtToken = getCookie("factura-token");

    try {
      const response = await authGetFetch(`channels/${uuid}`, jwtToken);
      if (response.ok) {
        const channelData = await response.json();
        setChannel(channelData);
        getRates(jwtToken, channelData.id);
      } else {
        toast.error("Error al cargar los detalles del canal");
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
        toast.error("Error al cargar las tarifas disponibles");
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

  useEffect(() => {
    if (selectedRates.length === 0) return;
    const jwt = getCookie("factura-token");
    selectedRates.forEach((rateId) => {
      if (!commissionTiers[rateId]) {
        authGetFetch(`commission-tiers?rateId=${rateId}`, jwt)
          .then((res) => res.json())
          .then((tiers) => {
            setCommissionTiers((prev) => ({ ...prev, [rateId]: tiers }));
          })
          .catch(() => {
            setCommissionTiers((prev) => ({ ...prev, [rateId]: [] }));
          });
      }
    });
  }, [selectedRates]);

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
        toast.error("Error actualizando el Rate");
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
        await authFetch("PATCH", `rates/${rateId}`, { paymentDay: Number(paymentDay) }, jwtToken);
      } catch (error) {
        console.error("Error al actualizar paymentDay:", error);
        toast.error("No se pudo actualizar el día de pago");
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

  const addCommissionTier = (rateId) => {
    setCommissionTiers((prev) => ({
      ...prev,
      [rateId]: [
        ...(prev[rateId] || []),
        { minConsumo: 0, maxConsumo: null, comision: 0, appliesToRenewal: false },
      ],
    }));
  };

  const removeCommissionTier = (rateId, index) => {
    setCommissionTiers((prev) => ({
      ...prev,
      [rateId]: prev[rateId].filter((_, i) => i !== index),
    }));
  };

  const updateCommissionTier = (rateId, index, field, value) => {
    setCommissionTiers((prev) => ({
      ...prev,
      [rateId]: prev[rateId].map((tier, i) =>
        i === index ? { ...tier, [field]: value } : tier
      ),
    }));
  };

  const saveCommissionTiers = async (rateId) => {
    try {
      const jwtToken = getCookie("factura-token");
      const tiers = commissionTiers[rateId] || [];
      const response = await authFetch("POST", "commission-tiers/bulk", { rateId, tiers }, jwtToken);
      if (response.ok) {
        const savedTiers = await response.json();
        setCommissionTiers((prev) => ({ ...prev, [rateId]: savedTiers }));
        toast.success("Tramos guardados correctamente");
      } else {
        const error = await response.json();
        toast.error(error.message || "Error al guardar los tramos");
      }
    } catch (error) {
      console.error("Error al guardar tramos:", error);
      toast.error("Error al guardar los tramos de comisión");
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
      formData.append("name", channel.name || "");
      formData.append("representativeName", channel.representativeName || "");
      formData.append("representativePhone", channel.representativePhone || "");
      formData.append("representativeEmail", channel.representativeEmail || "");
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
        // Parsear el error del backend para mostrar mensaje específico
        try {
          const errorData = await channelResponse.json();
          if (errorData?.error?.message) {
            toast.error(errorData.error.message);
          } else if (channelResponse.status === 403) {
            toast.error("No tienes permisos para actualizar este canal");
          } else {
            toast.error("Error al actualizar el canal");
          }
        } catch {
          toast.error("Error al actualizar el canal");
        }
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
          toast.error("Error al actualizar las tarifas vinculadas");
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

      toast.success("Canal, tarifas y comisiones guardadas con éxito");
      router.push("/canales");
    } catch (error) {
      console.error("Error en handleSubmit:", error);
      toast.error("Hubo un error guardando los cambios");
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/canales")}
            className="p-2 rounded-lg neumorphic-button text-slate-600 dark:text-slate-400 hover:text-primary transition-colors"
          >
            <span className="material-icons-outlined">arrow_back</span>
          </button>
          <h1 className="text-2xl font-semibold text-slate-700 dark:text-slate-200">
            Editar Canal
          </h1>
        </div>
      </div>

      <NeumorphicCard size="lg">
        <form onSubmit={handleSubmit}>
          {/* Sección de información básica */}
          <div className="flex flex-col lg:flex-row gap-8 mb-8">
            {/* Imagen del canal */}
            <div className="flex flex-col items-center lg:items-start">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Imagen del Canal
              </label>
              <div className="neumorphic-card-inset p-4 rounded-xl">
                {channel.imageUri ? (
                  <img
                    src={channel.imageUri}
                    alt={channel.name}
                    className="w-32 h-32 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-32 h-32 flex items-center justify-center text-slate-400">
                    <span className="material-icons-outlined text-5xl">image</span>
                  </div>
                )}
              </div>
              <label className="mt-3 cursor-pointer">
                <span className="px-4 py-2 text-sm font-medium rounded-lg neumorphic-button text-primary inline-flex items-center gap-2">
                  <span className="material-icons-outlined text-lg">upload</span>
                  Cambiar imagen
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            </div>

            {/* Campos de información */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <NeumorphicInput
                  label="Nombre del Canal"
                  name="name"
                  value={channel.name}
                  onChange={handleInputChange}
                  icon="storefront"
                  required
                />
              </div>

              <NeumorphicInput
                label="Nombre del Representante"
                name="representativeName"
                value={channel.representativeName}
                onChange={handleInputChange}
                icon="person"
                required
              />

              <NeumorphicInput
                label="Teléfono"
                name="representativePhone"
                type="tel"
                value={channel.representativePhone}
                onChange={handleInputChange}
                icon="phone"
                required
              />

              <NeumorphicInput
                label="Email"
                name="representativeEmail"
                type="email"
                value={channel.representativeEmail}
                onChange={handleInputChange}
                icon="email"
                required
              />

              <NeumorphicInput
                label="Dirección Fiscal"
                name="address"
                value={channel.address || ""}
                onChange={handleInputChange}
                icon="location_on"
              />

              <NeumorphicInput
                label="CIF"
                name="cif"
                value={channel.cif || ""}
                onChange={handleInputChange}
                icon="badge"
              />

              <NeumorphicInput
                label="IBAN"
                name="iban"
                value={channel.iban || ""}
                onChange={handleInputChange}
                icon="account_balance"
              />
            </div>
          </div>

          {/* Separador */}
          <div className="border-t border-slate-200 dark:border-slate-700 my-6" />

          {/* Navegación de Pestañas */}
          <div className="flex flex-wrap gap-2 p-1.5 neumorphic-card-inset rounded-xl w-fit mb-6">
            <button
              type="button"
              onClick={() => handleTabClick("rates")}
              className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
                activeTab === "rates"
                  ? "neumorphic-button active text-primary"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <span className="material-icons-outlined text-lg">link</span>
              Tarifas Vinculadas
            </button>
            <button
              type="button"
              onClick={() => handleTabClick("payment")}
              className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
                activeTab === "payment"
                  ? "neumorphic-button active text-primary"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <span className="material-icons-outlined text-lg">calendar_today</span>
              Fecha Cobro
            </button>
            <button
              type="button"
              onClick={() => handleTabClick("commissions")}
              className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
                activeTab === "commissions"
                  ? "neumorphic-button active text-primary"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <span className="material-icons-outlined text-lg">payments</span>
              Comisiones/Puntos
            </button>
          </div>

          {/* Tab: Tarifas Vinculadas */}
          {activeTab === "rates" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <span className="material-icons-outlined text-primary">link</span>
                Vincular Tarifas al Canal
              </h3>
              {Object.keys(rates).length === 0 ? (
                <div className="neumorphic-card-inset p-6 rounded-xl text-center">
                  <span className="material-icons-outlined text-4xl text-slate-400 mb-2">folder_off</span>
                  <p className="text-slate-500 dark:text-slate-400">No hay tarifas disponibles</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(rates).map(([companyName, companyRates]) => (
                    <details key={companyName} className="group">
                      <summary className="neumorphic-button px-4 py-3 rounded-xl cursor-pointer list-none flex items-center justify-between">
                        <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                          <span className="material-icons-outlined text-primary">business</span>
                          {companyName}
                        </span>
                        <span className="material-icons-outlined text-slate-400 group-open:rotate-180 transition-transform">
                          expand_more
                        </span>
                      </summary>
                      <div className="mt-3 ml-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {companyRates.map((rate) => (
                          <label
                            key={rate.id}
                            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                              selectedRates.includes(rate.id)
                                ? "neumorphic-card-inset"
                                : "neumorphic-button hover:shadow-neumorphic-light-hover"
                            } ${rate.channelId !== null && rate.channelId !== channel.id ? "opacity-50 cursor-not-allowed" : ""}`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedRates.includes(rate.id)}
                              onChange={() => handleRateSelection(rate.id)}
                              disabled={rate.channelId !== null && rate.channelId !== channel.id}
                              className="w-4 h-4 text-primary rounded focus:ring-primary"
                            />
                            <div>
                              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{rate.name}</p>
                              <p className="text-xs text-slate-500">{rate.renewDays} días</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </details>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab: Fecha Cobro */}
          {activeTab === "payment" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <span className="material-icons-outlined text-primary">calendar_today</span>
                Configurar Fecha de Cobro
              </h3>
              {Object.keys(rates).length === 0 ? (
                <div className="neumorphic-card-inset p-6 rounded-xl text-center">
                  <p className="text-slate-500 dark:text-slate-400">No hay tarifas disponibles</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(rates).map(([companyName, companyRates]) => {
                    const checkedRates = companyRates.filter((rate) => selectedRates.includes(rate.id));
                    if (!checkedRates.length) return null;

                    return (
                      <details key={companyName} className="group">
                        <summary className="neumorphic-button px-4 py-3 rounded-xl cursor-pointer list-none flex items-center justify-between">
                          <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                            <span className="material-icons-outlined text-primary">business</span>
                            {companyName}
                          </span>
                          <span className="material-icons-outlined text-slate-400 group-open:rotate-180 transition-transform">
                            expand_more
                          </span>
                        </summary>
                        <div className="mt-3 ml-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {checkedRates.map((rate) => (
                            <div key={rate.id} className="neumorphic-card-inset p-3 rounded-lg">
                              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-2">
                                {rate.name}
                              </label>
                              <div className="flex items-center gap-2">
                                <span className="material-icons-outlined text-slate-400 text-lg">event</span>
                                <input
                                  type="number"
                                  value={rate.paymentDay || ""}
                                  onChange={(e) => handlePaymentDayChange(rate.id, e.target.value)}
                                  min="1"
                                  max="31"
                                  placeholder="Día"
                                  className="flex-1 px-3 py-2 bg-transparent text-slate-700 dark:text-slate-300 outline-none text-sm"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </details>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Tab: Comisiones/Puntos */}
          {activeTab === "commissions" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <span className="material-icons-outlined text-primary">payments</span>
                Configurar Comisiones y Puntos
              </h3>
              {Object.keys(rates).length === 0 ? (
                <div className="neumorphic-card-inset p-6 rounded-xl text-center">
                  <p className="text-slate-500 dark:text-slate-400">No hay tarifas disponibles</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(rates).map(([companyName, companyRates]) => {
                    const checkedRates = companyRates.filter((rate) => selectedRates.includes(rate.id));
                    if (!checkedRates.length) return null;

                    return (
                      <details key={companyName} className="group" open>
                        <summary className="neumorphic-button px-4 py-3 rounded-xl cursor-pointer list-none flex items-center justify-between">
                          <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                            <span className="material-icons-outlined text-primary">business</span>
                            {companyName}
                          </span>
                          <span className="material-icons-outlined text-slate-400 group-open:rotate-180 transition-transform">
                            expand_more
                          </span>
                        </summary>
                        <div className="mt-4 space-y-4">
                          {checkedRates.map((rate) => (
                            <NeumorphicCard key={rate.id} variant="inset" size="md" className="ml-4">
                              {/* Nombre de la tarifa */}
                              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-200 dark:border-slate-700">
                                <span className="material-icons-outlined text-primary">sell</span>
                                <h4 className="font-semibold text-slate-700 dark:text-slate-200">{rate.name}</h4>
                              </div>

                              {/* Grid de configuración */}
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                                {/* Supervisor/Agente */}
                                <div>
                                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">
                                    Supervisor/Agente
                                  </label>
                                  <select
                                    value={selectedUsers[rate.id] ?? ""}
                                    onChange={(e) => {
                                      const userId = Number(e.target.value) || undefined;
                                      setSelectedUsers((prev) => ({ ...prev, [rate.id]: userId }));
                                    }}
                                    className="w-full px-3 py-2 rounded-lg bg-background-light dark:bg-background-dark shadow-neumorphic-inset-light dark:shadow-neumorphic-inset-dark text-slate-700 dark:text-slate-300 text-sm outline-none"
                                  >
                                    <option value="">— Selecciona —</option>
                                    {commissionUsers.map((u) => (
                                      <option key={u.id} value={u.id}>
                                        {u.name} {u.firstSurname}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                {/* Comisión comercial - solo si hay usuario seleccionado */}
                                {selectedUsers[rate.id] && (
                                  <div>
                                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">
                                      Comisión Comercial (€)
                                    </label>
                                    <input
                                      type="number"
                                      value={commissionAssignments[rate.id]?.[selectedUsers[rate.id]] ?? 0}
                                      onChange={(e) => {
                                        const amount = parseInt(e.target.value) || 0;
                                        setCommissionAssignments((prev) => ({
                                          ...prev,
                                          [rate.id]: { ...prev[rate.id], [selectedUsers[rate.id]]: amount },
                                        }));
                                      }}
                                      className="w-full px-3 py-2 rounded-lg bg-background-light dark:bg-background-dark shadow-neumorphic-inset-light dark:shadow-neumorphic-inset-dark text-slate-700 dark:text-slate-300 text-sm outline-none"
                                    />
                                  </div>
                                )}

                                {/* Comisión base */}
                                <div>
                                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">
                                    Comisión Base (€)
                                  </label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={rate.paymentMoney || ""}
                                    onChange={(e) => handleCommissionChange(rate.id, "paymentMoney", e.target.value)}
                                    min="0"
                                    className="w-full px-3 py-2 rounded-lg bg-background-light dark:bg-background-dark shadow-neumorphic-inset-light dark:shadow-neumorphic-inset-dark text-slate-700 dark:text-slate-300 text-sm outline-none"
                                  />
                                </div>

                                {/* Puntos */}
                                <div>
                                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">
                                    Puntos
                                  </label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={rate.paymentPoints || ""}
                                    onChange={(e) => handleCommissionChange(rate.id, "paymentPoints", e.target.value)}
                                    min="0"
                                    className="w-full px-3 py-2 rounded-lg bg-background-light dark:bg-background-dark shadow-neumorphic-inset-light dark:shadow-neumorphic-inset-dark text-slate-700 dark:text-slate-300 text-sm outline-none"
                                  />
                                </div>
                              </div>

                              {/* Checkbox Renovar */}
                              <label className="flex items-center gap-2 mb-4 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={rate.renewable || false}
                                  onChange={(e) => handleRenewableChange(rate.id, e.target.checked)}
                                  className="w-4 h-4 text-primary rounded focus:ring-primary"
                                />
                                <span className="text-sm text-slate-700 dark:text-slate-300">Renovar</span>
                              </label>

                              {/* Sección de tramos de comisión por consumo */}
                              <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mt-4">
                                <div className="flex items-center justify-between mb-3">
                                  <h5 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                    <span className="material-icons-outlined text-lg text-primary">trending_up</span>
                                    Comisiones por Consumo
                                  </h5>
                                  <button
                                    type="button"
                                    onClick={() => addCommissionTier(rate.id)}
                                    className="px-3 py-1.5 text-xs font-medium rounded-lg neumorphic-button text-primary flex items-center gap-1"
                                  >
                                    <span className="material-icons-outlined text-sm">add</span>
                                    Añadir tramo
                                  </button>
                                </div>

                                {(commissionTiers[rate.id] || []).length > 0 ? (
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                      <thead>
                                        <tr className="border-b border-slate-200 dark:border-slate-700">
                                          <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Min</th>
                                          <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Max</th>
                                          <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Comisión (€)</th>
                                          <th className="px-3 py-2 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Renovación</th>
                                          <th className="px-3 py-2 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Acción</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {(commissionTiers[rate.id] || []).map((tier, index) => (
                                          <tr key={tier.id || index}>
                                            <td className="px-3 py-2">
                                              <input
                                                type="number"
                                                value={tier.minConsumo}
                                                onChange={(e) => updateCommissionTier(rate.id, index, "minConsumo", parseFloat(e.target.value) || 0)}
                                                className="w-20 px-2 py-1.5 rounded-lg bg-background-light dark:bg-background-dark shadow-neumorphic-inset-light dark:shadow-neumorphic-inset-dark text-slate-700 dark:text-slate-300 text-sm outline-none"
                                                min="0"
                                                step="0.01"
                                              />
                                            </td>
                                            <td className="px-3 py-2">
                                              <input
                                                type="number"
                                                value={tier.maxConsumo ?? ""}
                                                onChange={(e) => updateCommissionTier(rate.id, index, "maxConsumo", e.target.value === "" ? null : parseFloat(e.target.value))}
                                                placeholder="∞"
                                                className="w-20 px-2 py-1.5 rounded-lg bg-background-light dark:bg-background-dark shadow-neumorphic-inset-light dark:shadow-neumorphic-inset-dark text-slate-700 dark:text-slate-300 text-sm outline-none placeholder:text-slate-400"
                                                min="0"
                                                step="0.01"
                                              />
                                            </td>
                                            <td className="px-3 py-2">
                                              <input
                                                type="number"
                                                value={tier.comision}
                                                onChange={(e) => updateCommissionTier(rate.id, index, "comision", parseFloat(e.target.value) || 0)}
                                                className="w-20 px-2 py-1.5 rounded-lg bg-background-light dark:bg-background-dark shadow-neumorphic-inset-light dark:shadow-neumorphic-inset-dark text-slate-700 dark:text-slate-300 text-sm outline-none"
                                                min="0"
                                                step="0.01"
                                              />
                                            </td>
                                            <td className="px-3 py-2 text-center">
                                              <input
                                                type="checkbox"
                                                checked={tier.appliesToRenewal || false}
                                                onChange={(e) => updateCommissionTier(rate.id, index, "appliesToRenewal", e.target.checked)}
                                                className="w-4 h-4 text-primary rounded focus:ring-primary"
                                              />
                                            </td>
                                            <td className="px-3 py-2 text-center">
                                              <button
                                                type="button"
                                                onClick={() => removeCommissionTier(rate.id, index)}
                                                className="p-1.5 rounded-lg text-danger hover:bg-danger/10 transition-colors"
                                              >
                                                <span className="material-icons-outlined text-lg">delete</span>
                                              </button>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                    <div className="mt-3 flex justify-end">
                                      <button
                                        type="button"
                                        onClick={() => saveCommissionTiers(rate.id)}
                                        className="px-4 py-2 text-sm font-medium rounded-lg neumorphic-button text-success flex items-center gap-2"
                                      >
                                        <span className="material-icons-outlined text-lg">save</span>
                                        Guardar tramos
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-center py-4">
                                    <span className="material-icons-outlined text-3xl text-slate-300 dark:text-slate-600 mb-2">
                                      layers_clear
                                    </span>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                      Sin tramos. La comisión base ({rate.paymentMoney || 0}€) se aplicará a todos los consumos.
                                    </p>
                                  </div>
                                )}
                              </div>
                            </NeumorphicCard>
                          ))}
                        </div>
                      </details>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Separador antes de botones */}
          <div className="border-t border-slate-200 dark:border-slate-700 my-6" />

          {/* Botones de acción */}
          <div className="flex justify-end gap-3">
            <NeumorphicButton
              type="button"
              variant="secondary"
              onClick={() => router.push("/canales")}
              icon="close"
            >
              Cancelar
            </NeumorphicButton>
            <NeumorphicButton
              type="submit"
              variant="primary"
              icon="save"
            >
              Guardar Cambios
            </NeumorphicButton>
          </div>
        </form>
      </NeumorphicCard>
    </div>
  );
}
