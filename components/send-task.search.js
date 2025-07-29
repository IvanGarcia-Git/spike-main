"use client";
import { useState } from "react";
import { getCookie } from "cookies-next";
import { authFetch } from "@/helpers/server-fetch.helper";
import { FiFilter, FiChevronDown, FiChevronUp } from "react-icons/fi";

export default function TaskSearch({ onUpdateTasks, onClearFilters, users }) {
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [searchFilters, setSearchFilters] = useState({
    from: "",
    to: "",
    subject: "",
    assigneeUserId: "",
    taskStateId: "",
  });

  const states = [
    { id: 1, name: "Por Hacer" },
    { id: 2, name: "Haciendo" },
    { id: 3, name: "Hecho" },
    { id: 4, name: "Falta Info" },
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSearchFilters((prevFilters) => ({
      ...prevFilters,
      [name]: value,
    }));
  };

  const handleClearFilters = () => {
    setSearchFilters({
      from: "",
      to: "",
      subject: "",
      assigneeUserId: "",
      taskStateId: "",
    });
    onClearFilters();
  };

  const onSearch = async () => {
    const jwtToken = getCookie("factura-token");

    try {
      const response = await authFetch(
        "POST",
        `tasks/search`,
        searchFilters,
        jwtToken
      );

      if (response.ok) {
        const filteredTasks = await response.json();
        onUpdateTasks(filteredTasks);
      } else {
        alert("Error al buscar las tareas");
      }
    } catch (error) {
      console.error("Error buscando las tareas:", error);
    }
  };

  return (
    <div className="bg-foreground p-4 mt-4 rounded-lg shadow-md">
      {/* Botón para alternar el filtro avanzado */}
      <div
        onClick={() => setShowAdvancedSearch((prev) => !prev)}
        className="flex justify-between items-center cursor-pointer"
      >
        <h2 className="text-black font-semibold">Filtros</h2>
        <span className="text-blue-500 font-semibold flex items-center gap-1">
          <FiFilter size={20} />
          {showAdvancedSearch ? (
            <FiChevronUp size={20} />
          ) : (
            <FiChevronDown size={20} />
          )}
        </span>
      </div>

      {/* Filtros avanzados */}
      {showAdvancedSearch && (
        <div className="space-y-4 mt-4">
          <div className="flex justify-center space-x-4">
            <div className="flex flex-col">
              <label className="text-black mb-2">Desde</label>
              <input
                type="date"
                name="from"
                value={searchFilters.from}
                onChange={handleInputChange}
                className="w-full p-2 bg-background text-black rounded-md focus:outline-none"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-black mb-2">Hasta</label>
              <input
                type="date"
                name="to"
                value={searchFilters.to}
                onChange={handleInputChange}
                className="w-full p-2 bg-background text-black rounded-md focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col relative">
            <label className="text-black mb-2">Asunto</label>
            <input
              type="text"
              name="subject"
              value={searchFilters.subject}
              onChange={handleInputChange}
              placeholder="Buscar por asunto"
              className="px-4 py-2 bg-background text-black rounded-md focus:outline-none"
            />
          </div>

          <div className="flex space-x-4">
            {/* Filtro: Destinatario */}
            <div className="flex flex-col w-full">
              <label className="text-black mb-2">Destinatario</label>
              <select
                name="assigneeUserId"
                value={searchFilters.assigneeUserId}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-background text-black rounded-md focus:outline-none"
              >
                <option value="">Selecciona un destinatario</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col w-full">
              <label className="text-black mb-2">Estado</label>
              <select
                name="taskStateId"
                value={searchFilters.taskStateId}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-background text-black rounded-md focus:outline-none"
              >
                <option value="">Seleccionar</option>
                {states.map((state) => (
                  <option key={state.id} value={state.id}>
                    {state.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Botones: Buscar y Eliminar Filtros */}
          <div className="flex justify-between space-x-4">
            <button
              onClick={onSearch}
              className="bg-secondary text-white px-5 py-3 text-sm rounded hover:bg-secondaryHover"
            >
              Buscar
            </button>

            <button
              onClick={handleClearFilters}
              className="bg-red-600 text-white px-5 py-3 text-sm rounded-md hover:bg-red-700"
            >
              Borrar Filtros
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
