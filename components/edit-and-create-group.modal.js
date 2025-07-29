import { useState, useEffect } from "react";
import GroupUsersModal from "./group-users.modal";
import { authFetch } from "@/helpers/server-fetch.helper";
import { getCookie } from "cookies-next";
import {
  MdContactPhone,
  MdLocalOffer,
  MdEvent,
  MdLocationOff,
  MdNotInterested,
} from "react-icons/md";
import { FaUser } from "react-icons/fa";
import { FiPlus } from "react-icons/fi";

export default function EditAndCreateGroupModal({
  isModalOpen,
  setIsModalOpen,
  onTaskCreated,
  initialData,
  mode,
}) {
  const shiftLabels = {
    morning: "Mañana",
    evening: "Tarde",
    all: "Todo el día",
  };

  const [newGroup, setNewGroup] = useState(
    () =>
      initialData || {
        name: "",
        description: "",
        shift: "morning",
      }
  );
  const [isGroupUsersModalOpen, setIsGroupUsersModalOpen] = useState(false);

  useEffect(() => {
    if (mode === "edit" && initialData) {
      setNewGroup(initialData);
    } else if (mode === "create") {
      setNewGroup({
        name: "",
        description: "",
        shift: "morning",
      });
    }
  }, [mode, initialData]);

  const handleSaveChanges = async () => {
    const jwtToken = getCookie("factura-token");

    const groupData = { ...newGroup };

    delete groupData.groupUsers;
    delete groupData.groupCampaigns;

    try {
      const response = await authFetch("POST", `groups/`, groupData, jwtToken);

      if (response.ok) {
        onTaskCreated();
      } else {
        alert("Error al actualizar el grupo");
      }
    } catch (error) {
      console.error("Error enviando la solicitud:", error);
    }
  };

  if (!isModalOpen || !newGroup) return null;

  return (
    <div
      className={`bg-foreground text-black p-6 rounded-lg shadow-lg w-full max-w-lg ${
        isModalOpen ? "" : "hidden"
      }`}
    >
      <h2 className="text-lg font-bold mb-4">
        {mode === "create" ? "Crear Nuevo Grupo" : "Editar Grupo"}
      </h2>
      <div
        style={{ maxHeight: "80vh", overflowY: "auto" }}
        className="scrollable-modal-content"
      >
        {mode === "edit" && (
          <>
            <div className="mb-4 flex items-center">
              <div className="relative w-full h-4 bg-gray-200 rounded-full">
                {/* Barra de progreso verde que muestra el porcentaje de contactos realizados */}
                <div
                  className="absolute top-0 left-0 h-4 bg-green-500 rounded-full"
                  style={{ width: `${newGroup.stats?.contactedPercent || 0}%` }}
                ></div>

                <div className="absolute w-full h-full flex items-center justify-center">
                  <span className="text-black text-sm">
                    {newGroup.stats.contactedLeadsCount}/
                    {newGroup.stats.leadsCount}
                  </span>
                </div>
              </div>
              <p className="ml-2 text-sm font-bold text-gray-700">
                {newGroup.stats.contactedPercent}%
              </p>
            </div>
          </>
        )}

        {/* Shift Selection with Radio Buttons */}
        <div className="mb-4 flex justify-around">
          {["morning", "evening", "all"].map((option) => (
            <label key={option} className="flex items-center space-x-2">
              <input
                type="radio"
                value={option}
                checked={newGroup.shift === option}
                onChange={(e) =>
                  setNewGroup({
                    ...newGroup,
                    shift: e.target.value,
                  })
                }
                className="text-blue-500 focus:ring-blue-500"
              />
              <span className="text-gray-700">{shiftLabels[option]}</span>
            </label>
          ))}
        </div>

        {/* Group Name */}
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Nombre del grupo
          </label>
          <input
            type="text"
            value={newGroup.name || ""}
            onChange={(e) =>
              setNewGroup({
                ...newGroup,
                name: e.target.value,
              })
            }
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-500"
          />
        </div>

        {/* Description */}
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Descripción del Grupo
          </label>
          <textarea
            value={newGroup.description || ""}
            onChange={(e) =>
              setNewGroup({
                ...newGroup,
                description: e.target.value,
              })
            }
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-500"
          />
        </div>

        {mode === "edit" && (
          <>
            {/* Integrantes List in Box */}
            <div className="relative mb-4 p-4 bg-gray-100 rounded-lg">
              <h5 className="text-gray-700 text-sm font-bold mb-2">
                Integrantes
              </h5>
              <ul className="text-gray-600">
                {newGroup.groupUsers.length > 0 ? (
                  newGroup.groupUsers.map((userWrapper, index) => (
                    <li key={index} className="flex items-center mb-2">
                      <FaUser className="text-gray-700 mr-2" />
                      <span>
                        {userWrapper.user.name} {userWrapper.user.firstSurname}
                      </span>
                    </li>
                  ))
                ) : (
                  <li>No hay integrantes en este grupo</li>
                )}
              </ul>

              {/* Botón para abrir el modal de edición de usuarios */}
              <button
                onClick={() => setIsGroupUsersModalOpen(true)}
                className="absolute top-2 right-2 bg-blue-400 text-white p-2 rounded-full hover:bg-blue-500/80 z-10"
                aria-label="Editar Integrantes"
              >
                <FiPlus size={12} />
              </button>
            </div>

            {/* Stats and Campaigns Columns */}
            <div className="mb-4 grid grid-cols-2 gap-4">
              <div className="mb-4">
                <h5 className="text-gray-700 text-sm font-bold mb-2">
                  Estadísticas
                </h5>
                <div className="flex flex-col items-start text-left">
                  <div className="flex items-center m-2 text-green-500">
                    <MdContactPhone size={20} className="mr-2" />
                    <span className="text-lg font-semibold mr-1">
                      {newGroup.stats.porContactar}
                    </span>
                    <div className="h-4 border-l border-gray-400"></div>
                    <span className="text-lg font-semibold ml-1">
                      {newGroup.stats.porContactarPercent}%
                    </span>
                    <span className="ml-2 text-xs text-gray-500">
                      Por Contactar
                    </span>
                  </div>
                  <div className="flex items-center m-2 text-blue-500">
                    <MdLocalOffer size={20} className="mr-2" />
                    <span className="text-lg font-semibold mr-1">
                      {newGroup.stats.venta}
                    </span>
                    <div className="h-4 border-l border-gray-400"></div>
                    <span className="text-lg font-semibold ml-1">
                      {newGroup.stats.ventaPercent}%
                    </span>
                    <span className="ml-2 text-xs text-gray-500">Venta</span>
                  </div>
                  <div className="flex items-center m-2 text-purple-500">
                    <MdEvent size={20} className="mr-2" />
                    <span className="text-lg font-semibold mr-1">
                      {newGroup.stats.agendado}
                    </span>
                    <div className="h-4 border-l border-gray-400"></div>
                    <span className="text-lg font-semibold ml-1">
                      {newGroup.stats.agendadoPercent}%
                    </span>
                    <span className="ml-2 text-xs text-gray-500">Agendado</span>
                  </div>
                  <div className="flex items-center m-2 text-orange-500">
                    <MdLocationOff size={20} className="mr-2" />
                    <span className="text-lg font-semibold mr-1">
                      {newGroup.stats.ilocalizable}
                    </span>
                    <div className="h-4 border-l border-gray-400"></div>
                    <span className="text-lg font-semibold ml-1">
                      {newGroup.stats.ilocalizablePercent}%
                    </span>
                    <span className="ml-2 text-xs text-gray-500">
                      Ilocalizable
                    </span>
                  </div>
                  <div className="flex items-center m-2 text-red-500">
                    <MdNotInterested size={20} className="mr-2" />
                    <span className="text-lg font-semibold mr-1">
                      {newGroup.stats.noInteresa}
                    </span>
                    <div className="h-4 border-l border-gray-400"></div>
                    <span className="text-lg font-semibold ml-1">
                      {newGroup.stats.noInteresaPercent}%
                    </span>
                    <span className="ml-2 text-xs text-gray-500">
                      No Interesa
                    </span>
                  </div>
                </div>
              </div>

              {/* Campaigns Column */}
              <div className="mb-4">
                <h5 className="text-gray-700 text-sm font-bold mb-2">
                  Campañas Vinculadas
                </h5>
                <ul className="text-gray-600">
                  {newGroup.groupCampaigns.length > 0 ? (
                    newGroup.groupCampaigns.map((campaignWrapper, index) => (
                      <li key={index} className="flex items-center mb-2">
                        <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                        <b>{campaignWrapper.campaign?.name || "Sin campaña"}</b>
                      </li>
                    ))
                  ) : (
                    <li>No hay campañas vinculadas</li>
                  )}
                </ul>
              </div>
            </div>
          </>
        )}

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="button"
            className="bg-red-600 text-white px-4 py-2 rounded mr-2 hover:bg-red-700"
            onClick={() => setIsModalOpen(false)}
          >
            Cancelar
          </button>
          <button
            onClick={handleSaveChanges}
            className="bg-secondary text-white px-4 py-2 rounded hover:bg-secondaryHover"
          >
            Guardar cambios
          </button>
        </div>
      </div>

      <GroupUsersModal
        groupId={initialData?.id}
        groupUsers={newGroup.groupUsers}
        isOpen={isGroupUsersModalOpen}
        onClose={() => setIsGroupUsersModalOpen(false)}
        onUpdateGroupUsers={(updatedUsers) => {
          setNewGroup((prevGroup) => ({
            ...prevGroup,
            groupUsers: updatedUsers,
          }));
        }}
      />
    </div>
  );
}
