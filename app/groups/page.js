"use client";
import { useState, useEffect } from "react";
import { authGetFetch, authFetch } from "@/helpers/server-fetch.helper";
import { getCookie } from "cookies-next";
import EditAndCreateGroupModal from "@/components/edit-and-create-group.modal";

export default function Groups() {
  const [groups, setGroups] = useState([]);
  const [menuOpen, setMenuOpen] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editGroupData, setEditGroupData] = useState(null);
  const [mode, setMode] = useState("create");

  const getGroups = async () => {
    const jwtToken = getCookie("factura-token");

    try {
      const response = await authGetFetch("groups", jwtToken);

      if (response.ok) {
        const groupsResponse = await response.json();
        setGroups(groupsResponse);
      } else {
        console.error("Error cargando la información de los grupos");
      }
    } catch (error) {
      console.error("Error enviando la solicitud:", error);
    }
  };

  useEffect(() => {
    getGroups();
  }, []);

  const handleNewGroup = () => {
    setMode("create");
    setEditGroupData(null);
    setIsEditModalOpen(true);
  };

  // DELETE, EDIT AND CREATE SECTION
  const handleMenuToggle = (index) => {
    setMenuOpen(menuOpen === index ? null : index);
  };

  const handleDeleteGroup = async (groupUuid) => {
    const confirmDelete = confirm(
      "¿Estás seguro de que quieres eliminar este grupo?"
    );
    if (!confirmDelete) return;

    const jwtToken = getCookie("factura-token");

    try {
      const response = await authFetch(
        "DELETE",
        `groups/${groupUuid}`,
        {},
        jwtToken
      );

      if (response.ok) {
        setGroups((prevGroups) =>
          prevGroups.filter((group) => group.group.uuid !== groupUuid)
        );
      } else {
        alert("Error eliminando el grupo");
      }
    } catch (error) {
      console.error("Error enviando la solicitud:", error);
    }
  };

  const handleTaskCreated = () => {
    setIsEditModalOpen(false);
    getGroups();
  };

  const handleEdit = async (groupUuid) => {
    const jwtToken = getCookie("factura-token");

    try {
      const response = await authGetFetch(`groups/${groupUuid}`, jwtToken);

      if (response.ok) {
        const groupResponse = await response.json();
        setEditGroupData({
          ...groupResponse.group,
          stats: groupResponse.stats || {},
        });

        setIsEditModalOpen(true);
        setMode("edit");
      } else {
        alert("Error cargando los detalles del grupo");
      }
    } catch (error) {
      console.error("Error enviando la solicitud:", error);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
            Grupos
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Gestiona tus equipos de trabajo
          </p>
        </div>
        <button
          onClick={handleNewGroup}
          className="neumorphic-button flex items-center justify-center p-4 rounded-lg bg-primary text-white font-semibold hover:shadow-neumorphic-inset-light dark:hover:shadow-neumorphic-inset-dark transition-all"
        >
          <span className="material-icons-outlined mr-2">add</span>
          Nuevo Grupo
        </button>
      </div>

      {/* Grid de grupos */}
      {groups.length === 0 ? (
        <div className="neumorphic-card p-12 text-center">
          <span className="material-icons-outlined text-6xl text-slate-300 dark:text-slate-600 mb-4 block">
            groups
          </span>
          <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-2">
            No hay grupos disponibles
          </h3>
          <p className="text-slate-600 dark:text-slate-400">
            Crea un nuevo grupo para comenzar
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group, index) => (
            <div key={index} className="neumorphic-card p-6 relative">
              {/* Menú de opciones */}
              <div className="absolute top-4 right-4">
                <button
                  onClick={() => handleMenuToggle(index)}
                  className="neumorphic-button p-2 rounded-lg transition-all hover:shadow-neumorphic-inset-light dark:hover:shadow-neumorphic-inset-dark"
                >
                  <span className="material-icons-outlined text-slate-600 dark:text-slate-400">
                    more_vert
                  </span>
                </button>

                {/* Dropdown menu */}
                {menuOpen === index && (
                  <div className="absolute right-0 mt-2 w-40 neumorphic-card p-2 z-20">
                    <button
                      onClick={() => {
                        handleEdit(group.group.uuid);
                        setMenuOpen(null);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg flex items-center transition-colors"
                    >
                      <span className="material-icons-outlined text-sm mr-2">edit</span>
                      Editar
                    </button>
                    <button
                      onClick={() => {
                        handleDeleteGroup(group.group.uuid);
                        setMenuOpen(null);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex items-center transition-colors"
                    >
                      <span className="material-icons-outlined text-sm mr-2">delete</span>
                      Eliminar
                    </button>
                  </div>
                )}
              </div>

              {/* Contenido del grupo */}
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2 pr-10">
                {group.group.name}
              </h3>
              <p className="text-sm mb-4 text-slate-600 dark:text-slate-400">
                {group.group.description}
              </p>

              {/* Badge de turno */}
              <div className="flex items-center mb-6">
                <span className="neumorphic-card-inset px-3 py-1 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center">
                  <span className="material-icons-outlined text-sm mr-1">schedule</span>
                  {group.group.shift === "morning"
                    ? "Mañana"
                    : group.group.shift === "evening"
                    ? "Tarde"
                    : "Todo el día"}
                </span>
              </div>

              {/* Estadísticas */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {/* Por Contactar */}
                <div className="neumorphic-card-inset p-3 rounded-lg text-center">
                  <div className="flex items-center justify-center mb-2">
                    <span className="material-icons-outlined text-green-500 text-xl">
                      contact_phone
                    </span>
                  </div>
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <span className="text-lg font-bold text-slate-800 dark:text-slate-100">
                      {group.stats.porContactar}
                    </span>
                    <span className="w-1 h-1 bg-slate-400 rounded-full"></span>
                    <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                      {group.stats.porContactarPercent}%
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Por Contactar</span>
                </div>

                {/* Venta */}
                <div className="neumorphic-card-inset p-3 rounded-lg text-center">
                  <div className="flex items-center justify-center mb-2">
                    <span className="material-icons-outlined text-blue-500 text-xl">
                      local_offer
                    </span>
                  </div>
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <span className="text-lg font-bold text-slate-800 dark:text-slate-100">
                      {group.stats.venta}
                    </span>
                    <span className="w-1 h-1 bg-slate-400 rounded-full"></span>
                    <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                      {group.stats.ventaPercent}%
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Venta</span>
                </div>

                {/* Agendado */}
                <div className="neumorphic-card-inset p-3 rounded-lg text-center">
                  <div className="flex items-center justify-center mb-2">
                    <span className="material-icons-outlined text-purple-500 text-xl">
                      event
                    </span>
                  </div>
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <span className="text-lg font-bold text-slate-800 dark:text-slate-100">
                      {group.stats.agendado}
                    </span>
                    <span className="w-1 h-1 bg-slate-400 rounded-full"></span>
                    <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                      {group.stats.agendadoPercent}%
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Agendado</span>
                </div>

                {/* Ilocalizable */}
                <div className="neumorphic-card-inset p-3 rounded-lg text-center">
                  <div className="flex items-center justify-center mb-2">
                    <span className="material-icons-outlined text-orange-500 text-xl">
                      location_off
                    </span>
                  </div>
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <span className="text-lg font-bold text-slate-800 dark:text-slate-100">
                      {group.stats.ilocalizable}
                    </span>
                    <span className="w-1 h-1 bg-slate-400 rounded-full"></span>
                    <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                      {group.stats.ilocalizablePercent}%
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Ilocalizable</span>
                </div>

                {/* No Interesa - Full width */}
                <div className="col-span-2 neumorphic-card-inset p-3 rounded-lg text-center">
                  <div className="flex items-center justify-center mb-2">
                    <span className="material-icons-outlined text-red-500 text-xl">
                      block
                    </span>
                  </div>
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <span className="text-lg font-bold text-slate-800 dark:text-slate-100">
                      {group.stats.noInteresa}
                    </span>
                    <span className="w-1 h-1 bg-slate-400 rounded-full"></span>
                    <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                      {group.stats.noInteresaPercent}%
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">No interesa</span>
                </div>
              </div>

              {/* Barra de progreso */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    Progreso de contacto
                  </span>
                  <span className="text-xs font-bold text-primary">
                    {group.stats.contactedPercent}%
                  </span>
                </div>
                <div className="neumorphic-progress-track h-2">
                  <div
                    className="bg-gradient-to-r from-primary to-primary-light h-full rounded-full transition-all duration-500"
                    style={{ width: `${group.stats.contactedPercent}%` }}
                  ></div>
                </div>
              </div>

              {/* Footer con usuarios y fecha */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
                <div className="flex -space-x-2">
                  {group.group.groupUsers.slice(0, 3).map((user, idx) => (
                    <div
                      key={idx}
                      className="neumorphic-card w-8 h-8 rounded-full flex items-center justify-center border-2 border-background-light dark:border-background-dark overflow-hidden"
                    >
                      <img
                        className="w-full h-full object-cover"
                        src="/avatar.png"
                        alt={`User ${user.userId}`}
                      />
                    </div>
                  ))}
                  {group.group.groupUsers.length > 3 && (
                    <div className="neumorphic-card-inset w-8 h-8 rounded-full flex items-center justify-center border-2 border-background-light dark:border-background-dark">
                      <span className="text-xs font-bold text-primary">
                        +{group.group.groupUsers.length - 3}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
                  <span className="material-icons-outlined text-sm mr-1">calendar_today</span>
                  {new Date(group.group.createdAt).toLocaleDateString("es-ES")}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isEditModalOpen && (
        <div
          className={`fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 ${
            isEditModalOpen ? "lg:ml-72" : ""
          }`}
        >
          <EditAndCreateGroupModal
            isModalOpen={isEditModalOpen}
            setIsModalOpen={setIsEditModalOpen}
            onTaskCreated={handleTaskCreated}
            initialData={editGroupData}
            mode={mode}
          />
        </div>
      )}
    </div>
  );
}
