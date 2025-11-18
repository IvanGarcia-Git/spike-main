import { useState, useEffect } from "react";
import GroupUsersModal from "./group-users.modal";
import { authFetch } from "@/helpers/server-fetch.helper";
import { getCookie } from "cookies-next";

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
      className={`neumorphic-card bg-background-light dark:bg-background-dark p-6 rounded-xl w-full max-w-2xl ${
        isModalOpen ? "" : "hidden"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
          {mode === "create" ? "Crear Nuevo Grupo" : "Editar Grupo"}
        </h2>
        <button
          onClick={() => setIsModalOpen(false)}
          className="neumorphic-button p-2 rounded-lg transition-all hover:shadow-neumorphic-inset-light dark:hover:shadow-neumorphic-inset-dark"
        >
          <span className="material-icons-outlined text-slate-600 dark:text-slate-400">close</span>
        </button>
      </div>

      <div
        style={{ maxHeight: "70vh", overflowY: "auto" }}
        className="scrollable-modal-content pr-2"
      >
        {/* Progress bar for edit mode */}
        {mode === "edit" && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Progreso de contacto
              </span>
              <span className="text-xs font-bold text-primary">
                {newGroup.stats.contactedPercent}%
              </span>
            </div>
            <div className="neumorphic-progress-track h-3 relative">
              <div
                className="bg-gradient-to-r from-primary to-primary-light h-full rounded-full transition-all duration-500"
                style={{ width: `${newGroup.stats?.contactedPercent || 0}%` }}
              ></div>
              <div className="absolute w-full h-full flex items-center justify-center">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {newGroup.stats.contactedLeadsCount}/{newGroup.stats.leadsCount}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Shift Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
            Turno de trabajo
          </label>
          <div className="flex gap-3">
            {["morning", "evening", "all"].map((option) => (
              <label
                key={option}
                className={`flex-1 neumorphic-button p-3 rounded-lg cursor-pointer transition-all ${
                  newGroup.shift === option
                    ? "active shadow-neumorphic-inset-light dark:shadow-neumorphic-inset-dark"
                    : ""
                }`}
              >
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
                  className="hidden"
                />
                <div className="flex items-center justify-center">
                  <span className="material-icons-outlined text-sm mr-2 text-slate-600 dark:text-slate-400">
                    schedule
                  </span>
                  <span className={`text-sm font-medium ${
                    newGroup.shift === option
                      ? "text-primary"
                      : "text-slate-600 dark:text-slate-400"
                  }`}>
                    {shiftLabels[option]}
                  </span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Group Name */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
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
            placeholder="Ingresa el nombre del grupo"
            className="w-full px-4 py-3 neumorphic-card-inset bg-transparent text-slate-800 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-slate-400"
          />
        </div>

        {/* Description */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
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
            placeholder="Describe el propósito o características del grupo"
            rows={3}
            className="w-full px-4 py-3 neumorphic-card-inset bg-transparent text-slate-800 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-slate-400 resize-none"
          />
        </div>

        {mode === "edit" && (
          <>
            {/* Integrantes Section */}
            <div className="relative mb-6 neumorphic-card-inset p-4 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h5 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center">
                  <span className="material-icons-outlined text-lg mr-2 text-primary">group</span>
                  Integrantes
                </h5>
                <button
                  onClick={() => setIsGroupUsersModalOpen(true)}
                  className="neumorphic-button p-2 rounded-lg bg-primary text-white hover:shadow-neumorphic-inset-light dark:hover:shadow-neumorphic-inset-dark transition-all"
                  aria-label="Editar Integrantes"
                >
                  <span className="material-icons-outlined text-sm">add</span>
                </button>
              </div>

              {newGroup.groupUsers.length > 0 ? (
                <div className="space-y-2">
                  {newGroup.groupUsers.map((userWrapper, index) => (
                    <div
                      key={index}
                      className="flex items-center p-2 rounded-lg bg-background-light dark:bg-background-dark"
                    >
                      <div className="w-8 h-8 rounded-full neumorphic-card flex items-center justify-center mr-3">
                        <span className="material-icons-outlined text-sm text-primary">person</span>
                      </div>
                      <span className="text-sm text-slate-700 dark:text-slate-300">
                        {userWrapper.user.name} {userWrapper.user.firstSurname}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                  No hay integrantes en este grupo
                </p>
              )}
            </div>

            {/* Stats and Campaigns Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Statistics Column */}
              <div className="neumorphic-card-inset p-4 rounded-lg">
                <h5 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center">
                  <span className="material-icons-outlined text-lg mr-2 text-primary">bar_chart</span>
                  Estadísticas
                </h5>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-background-light dark:bg-background-dark">
                    <div className="flex items-center">
                      <span className="material-icons-outlined text-green-500 text-lg mr-2">contact_phone</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">Por Contactar</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                        {newGroup.stats.porContactar}
                      </span>
                      <span className="w-1 h-1 bg-slate-400 rounded-full"></span>
                      <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                        {newGroup.stats.porContactarPercent}%
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-background-light dark:bg-background-dark">
                    <div className="flex items-center">
                      <span className="material-icons-outlined text-blue-500 text-lg mr-2">local_offer</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">Venta</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                        {newGroup.stats.venta}
                      </span>
                      <span className="w-1 h-1 bg-slate-400 rounded-full"></span>
                      <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                        {newGroup.stats.ventaPercent}%
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-background-light dark:bg-background-dark">
                    <div className="flex items-center">
                      <span className="material-icons-outlined text-purple-500 text-lg mr-2">event</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">Agendado</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                        {newGroup.stats.agendado}
                      </span>
                      <span className="w-1 h-1 bg-slate-400 rounded-full"></span>
                      <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                        {newGroup.stats.agendadoPercent}%
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-background-light dark:bg-background-dark">
                    <div className="flex items-center">
                      <span className="material-icons-outlined text-orange-500 text-lg mr-2">location_off</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">Ilocalizable</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                        {newGroup.stats.ilocalizable}
                      </span>
                      <span className="w-1 h-1 bg-slate-400 rounded-full"></span>
                      <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                        {newGroup.stats.ilocalizablePercent}%
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-background-light dark:bg-background-dark">
                    <div className="flex items-center">
                      <span className="material-icons-outlined text-red-500 text-lg mr-2">block</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">No Interesa</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                        {newGroup.stats.noInteresa}
                      </span>
                      <span className="w-1 h-1 bg-slate-400 rounded-full"></span>
                      <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                        {newGroup.stats.noInteresaPercent}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Campaigns Column */}
              <div className="neumorphic-card-inset p-4 rounded-lg">
                <h5 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center">
                  <span className="material-icons-outlined text-lg mr-2 text-primary">campaign</span>
                  Campañas Vinculadas
                </h5>
                {newGroup.groupCampaigns.length > 0 ? (
                  <div className="space-y-2">
                    {newGroup.groupCampaigns.map((campaignWrapper, index) => (
                      <div
                        key={index}
                        className="flex items-center p-2 rounded-lg bg-background-light dark:bg-background-dark"
                      >
                        <span className="w-2 h-2 bg-primary rounded-full mr-3"></span>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {campaignWrapper.campaign?.name || "Sin campaña"}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                    No hay campañas vinculadas
                  </p>
                )}
              </div>
            </div>
          </>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
          <button
            type="button"
            className="neumorphic-button px-6 py-3 rounded-lg font-medium text-slate-600 dark:text-slate-400 hover:shadow-neumorphic-inset-light dark:hover:shadow-neumorphic-inset-dark transition-all"
            onClick={() => setIsModalOpen(false)}
          >
            Cancelar
          </button>
          <button
            onClick={handleSaveChanges}
            className="neumorphic-button px-6 py-3 rounded-lg bg-primary text-white font-semibold hover:shadow-neumorphic-inset-light dark:hover:shadow-neumorphic-inset-dark transition-all"
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
