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
  const [selectedUserUuid, setSelectedUserUuid] = useState(null);

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
    const jwtToken = getCookie("factura-token");

    const data = {
      userUuid: selectedUserUuid,
      userData: { leadPriorities: columnsOrder.map((column) => column.value) },
    };

    try {
      const response = await authFetch("PATCH", "users", data, jwtToken);

      if (response.ok) {
        alert("Configuración guardada con éxito.");
      } else {
        const errorData = await response.json();
        console.error("Error al guardar configuración:", errorData);
      }
    } catch (error) {
      console.error("Error enviando la solicitud:", error);
    }
  };

  useEffect(() => {
    getUsersManager();
  }, []);

  useEffect(() => {
    if (selectedUserUuid) {
      getUserLeadPriorities(selectedUserUuid);
    }
  }, [selectedUserUuid]);

  return (
    <DndProvider backend={MultiBackend} options={BACKEND_OPTIONS}>
      <div className="flex flex-col items-center justify-center gap-6 p-4 min-h-screen bg-background">
        {/* Selector de usuario */}
        <div className="flex flex-col items-center gap-2 text-slate-800 dark:text-slate-100 mb-6">
          <label htmlFor="userSelector" className="text-lg font-bold">
            Usuario:
          </label>
          <select
            id="userSelector"
            className="p-2 border rounded-md shadow-md w-60 text-center"
            value={selectedUserUuid || ""}
            onChange={(e) => setSelectedUserUuid(e.target.value)}
          >
            <option value="" disabled>
              Selecciona
            </option>
            {users.map((user) => (
              <option key={user.id} value={user.uuid}>
                {user.name} {user.firstSurname}
              </option>
            ))}
          </select>
        </div>

        {/* Contenedor para ColumnsOrder */}
        <div className="w-full max-w-3xl">
          <ColumnsOrder
            columnsOrder={columnsOrder}
            setColumnsOrder={setColumnsOrder}
          />
        </div>

        {/* Botón alineado al ancho de ColumnsOrder */}
        <div className="w-full max-w-3xl">
          <button
            onClick={saveLeadPriorities}
            className="px-4 py-2 bg-secondary hover:bg-secondaryHover text-white rounded-md shadow-md w-full"
          >
            Guardar Configuración
          </button>
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
    <div className="w-full text-black neumorphic-card p-4 rounded-md">
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
      className={`flex text-black items-center p-2 neumorphic-card border mb-2 rounded-md cursor-pointer ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      <MdOutlineDragHandle className="mr-2 text-slate-500 dark:text-slate-400" />
      <span>{column.label}</span>
    </div>
  );
};
