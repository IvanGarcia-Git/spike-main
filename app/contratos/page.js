"use client";

import { useState, useEffect } from "react";
import { getCookie } from "cookies-next";
import { authGetFetch } from "@/helpers/server-fetch.helper";
import PageHeader from "@/components/page-header.component";
import Link from "next/link";

export default function Contratos() {
  const [contracts, setContracts] = useState([
    {
      id: 1,
      nombre: "Contrato Alfa",
      cliente: "Tech Solutions",
      ubicacion: "Madrid, España",
      importe: "$5,200",
      fechaFirma: "15/07/2023",
      estado: "Activo",
      estadoColor: "primary",
    },
    {
      id: 2,
      nombre: "Acuerdo Beta",
      cliente: "Innova Corp",
      ubicacion: "Barcelona, España",
      importe: "$12,000",
      fechaFirma: "10/07/2023",
      estado: "Pendiente Firma",
      estadoColor: "yellow",
    },
    {
      id: 3,
      nombre: "Servicio Gamma",
      cliente: "Global Exports",
      ubicacion: "Valencia, España",
      importe: "$8,500",
      fechaFirma: "01/07/2023",
      estado: "Cancelado",
      estadoColor: "red",
    },
    {
      id: 4,
      nombre: "Proyecto Delta",
      cliente: "Future Dynamics",
      ubicacion: "Bilbao, España",
      importe: "$25,000",
      fechaFirma: "25/06/2023",
      estado: "Activo",
      estadoColor: "primary",
    },
    {
      id: 5,
      nombre: "Contrato Epsilon",
      cliente: "Market Leaders",
      ubicacion: "Sevilla, España",
      importe: "$3,100",
      fechaFirma: "18/06/2023",
      estado: "Activo",
      estadoColor: "primary",
    },
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const getEstadoClass = (estadoColor) => {
    const classes = {
      primary: "bg-primary/20 text-primary",
      yellow: "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400",
      red: "bg-red-500/20 text-red-600 dark:text-red-400",
    };
    return classes[estadoColor] || "bg-primary/20 text-primary";
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setStartDate("");
    setEndDate("");
    setStatusFilter("");
  };

  return (
    <div className="p-6">
      <PageHeader title="Gestión de Contratos" />

      {/* Filters Card */}
      <div className="neumorphic-card p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Search Input */}
          <div className="relative">
            <span className="material-icons-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              search
            </span>
            <input
              className="w-full neumorphic-card-inset pl-12 pr-4 py-3 rounded-lg border-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 text-sm bg-transparent"
              placeholder="Buscar por Nombre, Cliente..."
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Start Date */}
          <div className="relative">
            <span className="material-icons-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              calendar_today
            </span>
            <input
              className="w-full neumorphic-card-inset pl-12 pr-4 py-3 rounded-lg border-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 text-sm bg-transparent"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          {/* End Date */}
          <div className="relative">
            <span className="material-icons-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              calendar_today
            </span>
            <input
              className="w-full neumorphic-card-inset pl-12 pr-4 py-3 rounded-lg border-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 text-sm bg-transparent"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <div className="neumorphic-card-inset rounded-lg">
            <select
              className="w-full bg-transparent border-none focus:ring-0 text-sm font-medium py-3 px-4 text-slate-600 dark:text-slate-300"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Estado</option>
              <option value="activo">Activo</option>
              <option value="pendiente">Pendiente</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <button className="flex items-center px-5 py-2 rounded-lg neumorphic-button font-medium text-slate-600 dark:text-slate-400">
              <span className="material-icons-outlined mr-2 text-base">filter_alt</span>
              <span>Búsqueda avanzada</span>
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <button className="px-5 py-2 rounded-lg neumorphic-button font-medium text-slate-600 dark:text-slate-400">
              Fecha Creación
            </button>
            <button className="px-5 py-2 rounded-lg neumorphic-button active font-semibold text-primary">
              Exportar a Excel
            </button>
            <button
              onClick={handleClearFilters}
              className="px-5 py-2 rounded-lg neumorphic-button font-medium text-red-500/80 dark:text-red-500/70"
            >
              Borrar filtros
            </button>
          </div>
        </div>
      </div>

      {/* Contracts Table */}
      <div className="neumorphic-card p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="p-3">Nombre</th>
                <th className="p-3">Cliente</th>
                <th className="p-3">Importe</th>
                <th className="p-3">Fecha Firma</th>
                <th className="p-3">Estado</th>
                <th className="p-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((contract) => (
                <tr key={contract.id} className="table-row-divider">
                  <td className="p-3 font-medium text-slate-800 dark:text-slate-200">
                    {contract.nombre}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full neumorphic-card p-0.5 flex items-center justify-center mr-3">
                        <span className="material-icons-outlined text-xl text-slate-500">
                          business
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-slate-800 dark:text-slate-200">
                          {contract.cliente}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {contract.ubicacion}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                    {contract.importe}
                  </td>
                  <td className="p-3 text-slate-600 dark:text-slate-400">
                    {contract.fechaFirma}
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${getEstadoClass(
                        contract.estadoColor
                      )}`}
                    >
                      {contract.estado}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex space-x-2">
                      <button className="p-2 rounded-lg neumorphic-button text-slate-600 dark:text-slate-400">
                        <span className="material-icons-outlined text-lg">visibility</span>
                      </button>
                      <button className="p-2 rounded-lg neumorphic-button text-slate-600 dark:text-slate-400">
                        <span className="material-icons-outlined text-lg">edit</span>
                      </button>
                      <button className="p-2 rounded-lg neumorphic-button text-slate-600 dark:text-slate-400">
                        <span className="material-icons-outlined text-lg">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
