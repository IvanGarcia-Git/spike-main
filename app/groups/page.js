"use client";
import { useState, useEffect } from "react";
import { authGetFetch, authFetch } from "@/helpers/server-fetch.helper";
import { getCookie } from "cookies-next";
import EditAndCreateGroupModal from "@/components/edit-and-create-group.modal";

import {
  MdContactPhone,
  MdLocalOffer,
  MdEvent,
  MdLocationOff,
  MdNotInterested,
  MdMoreVert,
} from "react-icons/md";

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
    <div className="relative bg-background p-4">
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={handleNewGroup}
          className="flex items-center space-x-2 hover:bg-secondaryHover text-white px-4 py-2 rounded-lg shadow-md bg-secondary"
        >
          <span>Nuevo Grupo</span>
        </button>
      </div>
      <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.map((group, index) => (
          <div key={index} className="relative p-4">
            <div className="bg-white text-black rounded-lg p-6 shadow-md relative">
              {/* Botón de menú desplegable */}
              <div className="absolute top-4 right-4">
                <button
                  onClick={() => handleMenuToggle(index)}
                  className="text-gray-700 hover:text-gray-900 rounded-full focus:outline-none p-2"
                >
                  <MdMoreVert size={20} />
                </button>

                {/* Menú desplegable */}
                {menuOpen === index && (
                  <div className="absolute right-0 mt-2 w-32 bg-white rounded-lg shadow-lg z-20 border border-gray-200">
                    <button
                      onClick={() => handleEdit(group.group.uuid)}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-t-lg"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteGroup(group.group.uuid)}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-b-lg"
                    >
                      Eliminar
                    </button>
                  </div>
                )}
              </div>

              {/* Contenido del grupo */}
              <h3 className="text-xl font-bold mb-2">{group.group.name}</h3>
              <p className="text-sm mb-2 text-gray-600">
                {group.group.description}
              </p>
              <div className="flex items-center mb-4">
                <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2 py-1 rounded">
                  {group.group.shift === "morning"
                    ? "Mañana"
                    : group.group.shift === "evening"
                    ? "Tarde"
                    : "Todo el día"}
                </span>
              </div>

              {/* Section de estadísticas */}
              <div className="flex flex-wrap items-center justify-around mb-4 text-center">
                <div className="flex flex-col items-center m-2 text-green-500">
                  <MdContactPhone size={20} className="mb-1" />
                  <span className="text-lg font-semibold">
                    {group.stats.porContactar}
                  </span>
                  <span className="inline-block w-1 h-1 bg-gray-400 rounded-full"></span>
                  <span className="text-lg font-semibold">
                    {group.stats.porContactarPercent}%
                  </span>
                  <span className="text-xs text-gray-500">Por Contactar</span>
                </div>
                <div className="flex flex-col items-center m-2 text-blue-500">
                  <MdLocalOffer size={20} className="mb-1" />
                  <span className="text-lg font-semibold">
                    {group.stats.venta}
                  </span>
                  <span className="inline-block w-1 h-1 bg-gray-400 rounded-full"></span>
                  <span className="text-lg font-semibold">
                    {group.stats.ventaPercent}%
                  </span>
                  <span className="text-xs text-gray-500">Venta</span>
                </div>
                <div className="flex flex-col items-center m-2 text-purple-500">
                  <MdEvent size={20} className="mb-1" />
                  <span className="text-lg font-semibold">
                    {group.stats.agendado}
                  </span>
                  <span className="inline-block w-1 h-1 bg-gray-400 rounded-full"></span>
                  <span className="text-lg font-semibold">
                    {group.stats.agendadoPercent}%
                  </span>
                  <span className="text-xs text-gray-500">Agendado</span>
                </div>
                <div className="flex flex-col items-center m-2 text-orange-500">
                  <MdLocationOff size={20} className="mb-1" />
                  <span className="text-lg font-semibold">
                    {group.stats.ilocalizable}
                  </span>
                  <span className="inline-block w-1 h-1 bg-gray-400 rounded-full"></span>
                  <span className="text-lg font-semibold">
                    {group.stats.ilocalizablePercent}%
                  </span>
                  <span className="text-xs text-gray-500">Ilocalizable</span>
                </div>
                <div className="flex flex-col items-center m-2 text-red-500">
                  <MdNotInterested size={20} className="mb-1" />
                  <span className="text-lg font-semibold">
                    {group.stats.noInteresa}
                  </span>
                  <span className="inline-block w-1 h-1 bg-gray-400 rounded-full"></span>
                  <span className="text-lg font-semibold">
                    {group.stats.noInteresaPercent}%
                  </span>
                  <span className="text-xs text-gray-500">No interesa</span>
                </div>
              </div>

              {/* Barra de progreso */}
              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4 relative">
                <div
                  className="bg-green-500 h-2.5 rounded-full"
                  style={{ width: `${group.stats.contactedPercent}%` }}
                ></div>
                <span className="absolute top-[-1rem] right-0 text-xs font-semibold text-gray-700">
                  {group.stats.contactedPercent}%
                </span>
              </div>

              {/* Sección de usuarios y fecha */}
              <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="flex -space-x-3 items-center ml-4">
                  {group.group.groupUsers.slice(0, 3).map((user, idx) => (
                    <img
                      key={idx}
                      className="inline-block bg-background rounded-full w-8 h-8 bg-surface-400 shadow-md border border-white"
                      src="avatar.png"
                      alt={`User ${user.userId}`}
                    />
                  ))}
                  {group.group.groupUsers.length > 3 && (
                    <div className="inline-block bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center text-gray-600 font-medium border border-white">
                      +{group.group.groupUsers.length - 3}
                    </div>
                  )}
                </div>
                <div className="text-xs">
                  {new Date(group.group.createdAt).toLocaleDateString("es-ES")}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
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
