"use client";
import React, { useState, useEffect,useRef } from "react";
import { getCookie } from "cookies-next";
import { authGetFetch, authFetch } from "@/helpers/server-fetch.helper";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { MultiBackend, TouchTransition } from "react-dnd-multi-backend";
import { HTML5Backend } from "react-dnd-html5-backend";
import { TouchBackend } from "react-dnd-touch-backend";
import { MdOutlineDragHandle } from "react-icons/md";

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

const contractColumnsList = [
  { value: "userName", label: "Agente" },
  { value: "customerFullName", label: "Cliente" },
  { value: "cups", label: "Cups" },
  { value: "customerPhoneNumber", label: "Teléfono" },
  { value: "customerEmail", label: "Email" },
  { value: "customerAddress", label: "Dirección" },
  { value: "customerIban", label: "IBAN" },
  { value: "customerNationalId", label: "DNI/CIF" },
  { value: "electronicBill", label: "E-FACT" },
  { value: "rateName", label: "Tarifa" },
  { value: "ratePowerSlot1", label: "Potencia" },
  { value: "expiresAt", label: "Retro" },
  { value: "extraInfo", label: "Observaciones" },
  { value: "contractStateName", label: "Estado" },
  { value: "payed", label: "Pagado" },
  { value: "channelName", label: "Canal" },
  { value: "companyName", label: "Compañía" },
  { value: "updatedAt", label: "Fecha" },
];

const liquidationColumnsList = [
  { value: "userName", label: "Agente" },
  { value: "customerFullName", label: "Cliente" },
  { value: "cups", label: "Cups" },
  { value: "customerPhoneNumber", label: "Teléfono" },
  { value: "customerEmail", label: "Email" },
  { value: "customerAddress", label: "Dirección" },
  { value: "customerIban", label: "IBAN" },
  { value: "customerNationalId", label: "DNI/CIF" },
  { value: "electronicBill", label: "E-FACT" },
  { value: "rateName", label: "Tarifa" },
  { value: "ratePowerSlot1", label: "Potencia" },
  { value: "expiresAt", label: "Retro" },
  { value: "extraInfo", label: "Observaciones" },
  { value: "contractStateName", label: "Estado" },
  { value: "payed", label: "Pagado" },
  { value: "channelName", label: "Canal" },
  { value: "companyName", label: "Compañía" },
  { value: "updatedAt", label: "Fecha" },
];

const pageConfigs = {
  contracts: {
    title: "Configuración de Columnas de Contratos",
    getEndpoint: (userId) => `user-contract-preferences/${userId}`,
    saveEndpoint: "user-contract-preferences",
    columnsList: contractColumnsList,
  },
  liquidations: {
    title: "Configuración de Columnas de Liquidaciones",
    getEndpoint: (userId) => `user-liquidation-preferences/${userId}`,
    saveEndpoint: "user-liquidation-preferences",
    columnsList: liquidationColumnsList,
  },
};

const ConfigureColumnsPage = () => {
  const [activeTab, setActiveTab] = useState("contracts"); // 'contracts' o 'liquidations'
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [columnsOrder, setColumnsOrder] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const config = pageConfigs[activeTab]; // Configuración activa basada en la pestaña

  useEffect(() => {
    const getUsersManager = async () => {
      const jwtToken = getCookie("factura-token");
      try {
        const response = await authGetFetch("users/all", jwtToken);
        if (response.ok) setUsers(await response.json());
        else console.error("Error cargando la información de los usuarios");
      } catch (error) {
        console.error("Error enviando la solicitud:", error);
      }
    };
    getUsersManager();
  }, []);

  useEffect(() => {
    // Resetea las columnas al cambiar de usuario o de pestaña
    setSelectedColumns([]);
    setColumnsOrder([]);

    const getUserColumns = async () => {
      if (!selectedUserId) return;

      setIsLoading(true);
      const jwtToken = getCookie("factura-token");
      try {
        const response = await authGetFetch(config.getEndpoint(selectedUserId), jwtToken);
        if (response.ok) {
          const { columns } = await response.json();
          const validColumns = columns && Array.isArray(columns) ? columns : [];
          setSelectedColumns(validColumns);
          setColumnsOrder(validColumns);
        } else {
          console.error("Error cargando las columnas del usuario");
          setSelectedColumns([]); // Asegurar reseteo en caso de error
          setColumnsOrder([]);
        }
      } catch (error) {
        console.error("Error enviando la solicitud:", error);
      } finally {
        setIsLoading(false);
      }
    };

    getUserColumns();
  }, [selectedUserId, activeTab]); // Dependencias simplificadas para evitar re-renderizados innecesarios

  const handleCheckboxChange = (columnValue) => {
    const isSelected = selectedColumns.includes(columnValue);
    let newSelectedColumns;
    let newColumnsOrder;

    if (isSelected) {
      newSelectedColumns = selectedColumns.filter((col) => col !== columnValue);
      newColumnsOrder = columnsOrder.filter((col) => col !== columnValue);
    } else {
      newSelectedColumns = [...selectedColumns, columnValue];
      newColumnsOrder = [...columnsOrder, columnValue];
    }

    setSelectedColumns(newSelectedColumns);
    setColumnsOrder(newColumnsOrder);
  };

  const saveConfiguration = async () => {
    if (!selectedUserId) {
      alert("Selecciona un usuario antes de guardar la configuración.");
      return;
    }

    const jwtToken = getCookie("factura-token");
    const data = { userId: selectedUserId, columns: columnsOrder };

    try {
      const response = await authFetch("POST", config.saveEndpoint, data, jwtToken);
      if (response.ok) {
        alert("Configuración guardada con éxito.");
      } else {
        const errorData = await response.json();
        alert(`Error al guardar configuración: ${errorData.message}`);
      }
    } catch (error) {
      console.error("Error enviando la solicitud:", error);
    }
  };

  const TabButton = ({ tabName, label }) => (
    <button
      onClick={() => setActiveTab(tabName)}
      className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
        activeTab === tabName
          ? "neumorphic-button active text-primary bg-primary/10 dark:bg-primary/20"
          : "neumorphic-button text-slate-700 dark:text-slate-300"
      }`}
    >
      {label}
    </button>
  );

  return (
    <DndProvider backend={MultiBackend} options={BACKEND_OPTIONS}>
      <div className="flex flex-col gap-4 p-4 min-h-screen justify-start">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{config.title}</h2>

        <div className="flex text-slate-800 dark:text-slate-100 items-center gap-4 mb-4">
          <label htmlFor="userSelector" className="text-lg font-bold">
            Usuario:
          </label>
          <div className="neumorphic-card-inset rounded-lg w-full md:w-1/4">
            <select
              id="userSelector"
              className="p-2 bg-transparent border-none w-full focus:ring-2 focus:ring-primary focus:ring-opacity-50 rounded-lg text-slate-800 dark:text-slate-100"
              value={selectedUserId || ""}
              onChange={(e) => setSelectedUserId(e.target.value)}
            >
              <option value="" disabled>
                Selecciona un usuario
              </option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>{`${user.name} ${user.firstSurname}`}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-2 p-1 neumorphic-card rounded-lg w-min">
          <TabButton tabName="contracts" label="Contratos" />
          <TabButton tabName="liquidations" label="Liquidaciones" />
        </div>

        {selectedUserId ? (
          isLoading ? (
            <p className="text-slate-800 dark:text-slate-100">Cargando configuración...</p>
          ) : (
            <>
              <div className="flex flex-col md:flex-row gap-4">
                <ColumnsOrder
                  columnsOrder={columnsOrder}
                  setColumnsOrder={setColumnsOrder}
                  allColumns={config.columnsList}
                />
                <ColumnSelector
                  allColumns={config.columnsList}
                  selectedColumns={selectedColumns}
                  handleCheckboxChange={handleCheckboxChange}
                />
              </div>
              <button
                onClick={saveConfiguration}
                className="mt-4 px-5 py-3 rounded-lg neumorphic-button text-white bg-primary hover:bg-primary/90 font-medium self-start"
              >
                Guardar Configuración
              </button>
            </>
          )
        ) : (
          <p className="text-slate-500 dark:text-slate-400 mt-4">Por favor, selecciona un usuario para empezar.</p>
        )}
      </div>
    </DndProvider>
  );
};

export default ConfigureColumnsPage;

const ColumnsOrder = ({ columnsOrder, setColumnsOrder, allColumns }) => {
  const moveColumn = (dragIndex, hoverIndex) => {
    const newOrder = [...columnsOrder];
    const [draggedItem] = newOrder.splice(dragIndex, 1);
    newOrder.splice(hoverIndex, 0, draggedItem);
    setColumnsOrder(newOrder);
  };

  return (
    <div className="w-full text-slate-800 dark:text-slate-100 md:w-1/2 neumorphic-card p-4 rounded-md">
      <h3 className="text-lg font-bold mb-4">Orden de las Columnas</h3>
      <div>
        {columnsOrder.map((column, index) => (
          <ColumnItem
            key={column}
            column={column}
            index={index}
            moveColumn={moveColumn}
            allColumns={allColumns}
          />
        ))}
      </div>
    </div>
  );
};

const ColumnItem = ({ column, index, moveColumn, allColumns }) => {
  const ref = useRef(null);

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
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });

  drag(drop(ref));

  const columnLabel = allColumns.find((col) => col.value === column)?.label || column;

  return (
    <div
      ref={ref}
      className={`flex text-slate-800 dark:text-slate-100 items-center p-2 neumorphic-card-inset border-none mb-2 rounded-md cursor-grab ${
        isDragging ? "opacity-40" : ""
      }`}
    >
      <MdOutlineDragHandle className="mr-2 text-slate-500 dark:text-slate-400" />
      <span>{columnLabel}</span>
    </div>
  );
};

const ColumnSelector = ({ allColumns, selectedColumns, handleCheckboxChange }) => (
  <div className="w-full text-slate-800 dark:text-slate-100 md:w-1/2 neumorphic-card p-4 rounded-md">
    <h3 className="text-lg font-bold mb-4">Seleccionar Columnas</h3>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {allColumns.map((column) => (
        <div key={column.value} className="flex items-center gap-2">
          <input
            type="checkbox"
            id={`checkbox-${column.value}`}
            checked={selectedColumns.includes(column.value)}
            onChange={() => handleCheckboxChange(column.value)}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <label htmlFor={`checkbox-${column.value}`}>{column.label}</label>
        </div>
      ))}
    </div>
  </div>
);
