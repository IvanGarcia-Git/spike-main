"use client";
import { useState } from "react";
import { getCookie } from "cookies-next";
import { authFetch } from "@/helpers/server-fetch.helper";

export default function NewCampaignModal({ closeModal, onCampaignCreated }) {
  const [selectedSector, setSelectedSelector] = useState("");
  const [campaignName, setCampaignName] = useState("");
  const [error, setError] = useState("");

  const handleSectorChange = (sector) => {
    setSelectedSelector(sector);
    setError("");
  };

  const handleNameChange = (e) => {
    setCampaignName(e.target.value);
    setError("");
  };

  const handleCreateCampaign = async () => {
    if (!selectedSector) {
      setError("Debe seleccionar un tipo de campaña.");
      return;
    }
    if (!campaignName.trim()) {
      setError("Debe ingresar un nombre para la campaña.");
      return;
    }

    const campaignData = {
      name: campaignName,
      sector: selectedSector,
      type: "Manual",
    };

    try {
      const jwtToken = getCookie("factura-token");
      const response = await authFetch(
        "POST",
        "campaigns",
        campaignData,
        jwtToken
      );

      if (response.ok) {
        alert("Campaña creada exitosamente.");
        if (onCampaignCreated) {
          onCampaignCreated();
        }
        closeModal();
      } else {
        alert("Error al crear la campaña.");
      }
    } catch (error) {
      console.error("Error al enviar la solicitud:", error);
      alert("Hubo un problema al conectar con el servidor.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="modal-card p-6 w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            Nueva Campaña
          </h2>
          <button
            onClick={closeModal}
            className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
          >
            <span className="material-icons-outlined">close</span>
          </button>
        </div>

        {/* Tipo de Campaña */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
            Tipo de Campaña
          </label>
          <div className="flex flex-wrap gap-3">
            {["Luz", "Gas", "Placas", "Telefonia"].map((sector) => (
              <button
                key={sector}
                type="button"
                onClick={() => handleSectorChange(sector)}
                className={`neumorphic-button px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                  selectedSector === sector
                    ? "active text-primary"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                <span className="material-icons-outlined text-sm">
                  {sector === "Luz" ? "lightbulb" : sector === "Gas" ? "local_fire_department" : sector === "Placas" ? "solar_power" : "phone"}
                </span>
                {sector}
              </button>
            ))}
          </div>
        </div>

        {/* Nombre de la Campaña */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Nombre de la Campaña
          </label>
          <input
            type="text"
            value={campaignName}
            onChange={handleNameChange}
            placeholder="Ingresa el nombre..."
            className="w-full neumorphic-card-inset px-4 py-3 rounded-lg border-none focus:outline-none bg-transparent text-slate-800 dark:text-slate-200"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
            <span className="material-icons-outlined text-lg">error</span>
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleCreateCampaign}
            className="flex-1 neumorphic-button px-6 py-3 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90 transition-colors"
          >
            Crear Campaña
          </button>
          <button
            onClick={closeModal}
            className="flex-1 neumorphic-button px-6 py-3 rounded-lg text-slate-600 dark:text-slate-400 font-semibold"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
