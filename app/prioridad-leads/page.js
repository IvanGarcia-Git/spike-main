"use client";
import React, { useState, useEffect } from "react";
import { getCookie } from "cookies-next";
import { authGetFetch, authFetch } from "@/helpers/server-fetch.helper";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { MultiBackend, TouchTransition } from "react-dnd-multi-backend";
import { HTML5Backend } from "react-dnd-html5-backend";
import { TouchBackend } from "react-dnd-touch-backend";
import { MdOutlineDragHandle } from "react-icons/md";

// Opciones de DnD backend
const BACKEND_OPTIONS = {
  backends: [
    { id: "html5", backend: HTML5Backend },
    {
      id: "touch",
      backend: TouchBackend,
      options: { enableMouseEvents: true },
      preview: true,
      transition: TouchTransition,
    },
  ],
};

const DEFAULT_LEAD_PRIORITIES = [
  { value: "recent_first", label: "Leads + Recientes" },
  { value: "oldest_first", label: "Leads + Antiguos" },
  { value: "with_attachments", label: "Leads con Adjuntos" },
  { value: "from_queue", label: "Asignados por compañeros" },
  { value: "morning_shift", label: "Agendados a grupo de mañana" },
  { value: "evening_shift", label: "Agendados a grupo tarde" },
  { value: "not_responding", label: "No contesta" },
];

const LeadsPriorityConfigurationPage = () => {
  const [leadPriorities, setLeadPriorities] = useState(DEFAULT_LEAD_PRIORITIES);
  const [columnsOrder, setColumnsOrder] = useState(leadPriorities);
  const [users, setUsers] = useState([]);
  const [selectedUserUuids, setSelectedUserUuids] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  const getUsersManager = async () => {
    const jwtToken = getCookie("factura-token");

    try {
      const response = await authGetFetch("users/all", jwtToken);

      if (response.ok) {
        const users = await response.json();
        setUsers(users);
      } else {
        console.error("Error cargando la información de los usuarios");
      }
    } catch (error) {
      console.error("Error enviando la solicitud:", error);
    }
  };

  const getUserLeadPriorities = async (userUuid) => {
    const jwtToken = getCookie("factura-token");

    try {
      const response = await authGetFetch(`users/by/${userUuid}`, jwtToken);

      if (response.ok) {
        const userFound = await response.json();

        const groupPriorities = userFound.groupUsers.map((groupUser) => ({
          value: `group${groupUser.group.id}`,
          label: groupUser.group.name,
        }));

        const allPriorities = [...DEFAULT_LEAD_PRIORITIES, ...groupPriorities];

        const priorityMap = Object.fromEntries(
          allPriorities.map((priority) => [priority.value, priority])
        );

        const userPriorities =
          userFound.leadPriorities && userFound.leadPriorities.length > 0
            ? [
                ...new Set([
                  ...userFound.leadPriorities,
                  ...groupPriorities.map((group) => group.value),
                ]),
              ]
                .map((priorityValue) => priorityMap[priorityValue] || null)
                .filter(Boolean)
            : allPriorities;

        setLeadPriorities(userPriorities);
        setColumnsOrder(userPriorities);
      } else {
        console.error("Error cargando las prioridades del usuario");
      }
    } catch (error) {
      console.error("Error enviando la solicitud:", error);
    }
  };

  const saveLeadPriorities = async () => {
    if (selectedUserUuids.length === 0) {
      alert("Por favor, selecciona al menos un usuario.");
      return;
    }

    const jwtToken = getCookie("factura-token");
    const leadPrioritiesData = columnsOrder.map((column) => column.value);

    setIsSaving(true);

    try {
      const results = await Promise.all(
        selectedUserUuids.map((userUuid) =>
          authFetch(
            "PATCH",
            "users",
            {
              userUuid,
              userData: { leadPriorities: leadPrioritiesData },
            },
            jwtToken
          )
        )
      );

      const allSuccessful = results.every((response) => response.ok);

      if (allSuccessful) {
        alert(
          `Configuración guardada con éxito para ${selectedUserUuids.length} usuario(s).`
        );
      } else {
        const failedCount = results.filter((r) => !r.ok).length;
        alert(
          `Error: ${failedCount} de ${selectedUserUuids.length} usuarios no se pudieron actualizar.`
        );
      }
    } catch (error) {
      console.error("Error enviando la solicitud:", error);
      alert("Error al guardar la configuración.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUserToggle = (userUuid) => {
    setSelectedUserUuids((prev) =>
      prev.includes(userUuid)
        ? prev.filter((uuid) => uuid !== userUuid)
        : [...prev, userUuid]
    );
  };

  const handleSelectAll = () => {
    if (selectedUserUuids.length === users.length) {
      setSelectedUserUuids([]);
    } else {
      setSelectedUserUuids(users.map((user) => user.uuid));
    }
  };

  useEffect(() => {
    getUsersManager();
  }, []);

  useEffect(() => {
    if (selectedUserUuids.length === 1) {
      getUserLeadPriorities(selectedUserUuids[0]);
    } else {
      setLeadPriorities(DEFAULT_LEAD_PRIORITIES);
      setColumnsOrder(DEFAULT_LEAD_PRIORITIES);
    }
  }, [selectedUserUuids]);

  return (
    <DndProvider backend={MultiBackend} options={BACKEND_OPTIONS}>
      <div className="flex flex-col items-center gap-6 p-4 min-h-screen">
        <div className="flex flex-col lg:flex-row gap-6 w-full max-w-5xl">
          {/* Panel de selección de usuarios */}
          <div className="w-full lg:w-1/2">
            <div className="neumorphic-card text-slate-800 dark:text-slate-100 rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Seleccionar Usuarios</h3>
                <button
                  onClick={handleSelectAll}
                  className="text-sm px-3 py-1 rounded-lg neumorphic-button text-primary hover:bg-primary/10"
                >
                  {selectedUserUuids.length === users.length
                    ? "Deseleccionar todos"
                    : "Seleccionar todos"}
                </button>
              </div>
              {selectedUserUuids.length > 0 && (
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  {selectedUserUuids.length} usuario(s) seleccionado(s)
                  {selectedUserUuids.length === 1 &&
                    " - Se cargarán sus prioridades actuales"}
                  {selectedUserUuids.length > 1 &&
                    " - Se aplicarán las prioridades por defecto"}
                </p>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-96 overflow-y-auto">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    onClick={() => handleUserToggle(user.uuid)}
                  >
                    <input
                      type="checkbox"
                      id={`user-${user.id}`}
                      className="mr-3 w-4 h-4 accent-primary cursor-pointer"
                      checked={selectedUserUuids.includes(user.uuid)}
                      onChange={() => handleUserToggle(user.uuid)}
                    />
                    <label
                      htmlFor={`user-${user.id}`}
                      className="text-slate-800 dark:text-slate-100 cursor-pointer select-none"
                    >
                      {user.name} {user.firstSurname}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Panel de prioridades */}
          <div className="w-full lg:w-1/2 flex flex-col gap-4">
            <ColumnsOrder
              columnsOrder={columnsOrder}
              setColumnsOrder={setColumnsOrder}
            />
            <button
              onClick={saveLeadPriorities}
              disabled={isSaving || selectedUserUuids.length === 0}
              className={`px-5 py-3 rounded-lg neumorphic-button text-white font-medium w-full ${
                isSaving || selectedUserUuids.length === 0
                  ? "bg-slate-400 cursor-not-allowed"
                  : "bg-primary hover:bg-primary/90"
              }`}
            >
              {isSaving
                ? "Guardando..."
                : `Guardar Configuración${
                    selectedUserUuids.length > 0
                      ? ` (${selectedUserUuids.length} usuario${
                          selectedUserUuids.length > 1 ? "s" : ""
                        })`
                      : ""
                  }`}
            </button>
          </div>
        </div>
      </div>
    </DndProvider>
  );
};

export default LeadsPriorityConfigurationPage;

const ColumnsOrder = ({ columnsOrder, setColumnsOrder }) => {
  const moveColumn = (dragIndex, hoverIndex) => {
    const newOrder = [...columnsOrder];
    const [draggedItem] = newOrder.splice(dragIndex, 1);
    newOrder.splice(hoverIndex, 0, draggedItem);
    setColumnsOrder(newOrder);
  };

  return (
    <div className="w-full text-slate-800 dark:text-slate-100 neumorphic-card p-4 rounded-md">
      <h3 className="text-lg font-bold mb-4">Prioridad de Leads</h3>
      <div className="columns-container">
        {columnsOrder.map((priority, index) => (
          <ColumnItem
            key={priority.value}
            column={priority}
            index={index}
            moveColumn={moveColumn}
          />
        ))}
      </div>
    </div>
  );
};

const ColumnItem = ({ column, index, moveColumn }) => {
  const ref = React.useRef(null);

  const [, drop] = useDrop({
    accept: "COLUMN",
    hover: (item) => {
      if (item.index !== index) {
        moveColumn(item.index, index);
        item.index = index;
      }
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: "COLUMN",
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(drop(ref));

  return (
    <div
      ref={ref}
      className={`flex text-slate-800 dark:text-slate-200 items-center p-2 neumorphic-card-inset border-none mb-2 rounded-lg cursor-grab ${
        isDragging ? "opacity-40" : ""
      }`}
    >
      <MdOutlineDragHandle className="mr-2 text-slate-500 dark:text-slate-400" />
      <span>{column.label}</span>
    </div>
  );
};
