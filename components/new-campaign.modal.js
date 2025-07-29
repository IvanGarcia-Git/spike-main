"use client";
import { useState } from "react";
import { FiX } from "react-icons/fi";
import { getCookie } from "cookies-next";
import { authFetch } from "@/helpers/server-fetch.helper";

export default function NewCampaignModal({ closeModal }) {
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
    // Validar que se haya seleccionado un tipo y que el nombre no esté vacío
    if (!selectedSector) {
      setError("Debe seleccionar un tipo de campaña.");
      return;
    }
    if (!campaignName.trim()) {
      setError("Debe ingresar un nombre para la campaña.");
      return;
    }

    // Preparar los datos para la solicitud al servidor
    const campaignData = {
      name: campaignName,
      sector: selectedSector,
      type: "Manual",
    };

    try {
      const jwtToken = getCookie("factura-token"); // Obtener el token
      const response = await authFetch(
        "POST",
        "campaigns",
        campaignData,
        jwtToken
      );

      if (response.ok) {
        alert("Campaña creada exitosamente.");
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
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 lg:ml-72">
      <div className="bg-white p-6 rounded-lg shadow-lg w-[85%] max-w-lg">
        {/* Encabezado del modal */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Nueva Campaña</h3>
          <button onClick={closeModal} className="text-gray-500">
            <FiX size={20} />
          </button>
        </div>

        {/* Checkboxes para el tipo de campaña */}
        <div className="mb-4">
          <p className="text-sm font-medium mb-2">Tipo de Campaña:</p>
          <div className="flex flex-wrap gap-2">
            {["Luz", "Gas", "Placas", "Telefonia"].map((sector) => (
              <label key={sector} className="flex items-center">
                <input
                  type="checkbox"
                  name="campaignType"
                  value={sector}
                  checked={selectedSector === sector}
                  onChange={() => handleSectorChange(sector)}
                  className="mr-2 w-4 h-4 rounded-sm border-gray-300 focus:ring-0"
                />
                {sector}
              </label>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            Nombre de la Campaña
          </label>
          <input
            type="text"
            value={campaignName}
            onChange={handleNameChange}
            placeholder="Nombre de la campaña"
            className="w-full px-3 py-2 bg-gray-100 text-black rounded-md focus:outline-none"
          />
        </div>

        {/* Mostrar error si existe */}
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <div className="flex justify-end">
          <button
            onClick={handleCreateCampaign}
            className="bg-secondary text-white px-4 py-2 rounded-md hover:bg-secondaryHover"
          >
            Guardar Campaña
          </button>
        </div>
      </div>
    </div>
  );
}
