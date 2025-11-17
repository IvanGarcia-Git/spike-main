"use client";

import { useState, useEffect } from "react";
import { getCookie } from "cookies-next";
import { authGetFetch } from "@/helpers/server-fetch.helper";
import PageHeader from "@/components/page-header.component";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("general");
  const [dashboardData, setDashboardData] = useState({
    topAgentes: [
      {
        name: "Carlos Garcia",
        role: "Salesman",
        ventas: 280,
        objetivo: 140,
        porcentaje: 92,
        comisiones: "$1570",
        crecimiento: 20,
        color: "green",
      },
      {
        name: "Daniel Ken",
        role: "Salesman",
        ventas: 160,
        objetivo: 140,
        porcentaje: 75,
        comisiones: "$800",
        crecimiento: 4,
        color: "yellow",
      },
      {
        name: "Jennifer Tan",
        role: "Salesman",
        ventas: 124,
        objetivo: 140,
        porcentaje: 45,
        comisiones: "$650",
        crecimiento: 31,
        color: "red",
      },
    ],
  });

  const tabs = [
    { id: "general", label: "General" },
    { id: "facturacion", label: "Facturación" },
    { id: "colaboradores", label: "Colaboradores" },
    { id: "agentes", label: "Agentes" },
    { id: "pizarra", label: "Pizarra Semanal" },
  ];

  const getColorClasses = (color) => {
    const colors = {
      green: "text-green-500",
      yellow: "text-yellow-500",
      red: "text-red-500",
    };
    return colors[color] || "text-primary";
  };

  const getProgressColorClasses = (color) => {
    const colors = {
      green: "bg-primary",
      yellow: "bg-yellow-500",
      red: "bg-red-500",
    };
    return colors[color] || "bg-primary";
  };

  return (
    <div className="p-6">
      <PageHeader title="Dashboard" />

      {/* Tabs */}
      <div className="mb-6 flex space-x-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2 rounded-lg neumorphic-button font-semibold ${
              activeTab === tab.id
                ? "active text-primary"
                : "font-medium text-slate-600 dark:text-slate-400"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Top 3 Agentes Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {dashboardData.topAgentes.map((agente, idx) => (
          <div key={idx} className="neumorphic-card p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full neumorphic-card-inset p-1 flex items-center justify-center mr-4">
                  <span className="material-icons-outlined text-3xl text-slate-500">
                    person
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-100">
                    {agente.name}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {agente.role}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-3xl font-bold ${getColorClasses(agente.color)}`}>
                  {agente.porcentaje}%
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">% Conv.</p>
              </div>
            </div>
            <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400 mb-2">
              <div className="flex justify-between">
                <span>Ventas</span>
                <span>{agente.ventas}</span>
              </div>
              <div className="flex justify-between">
                <span>Objetivo</span>
                <span>{agente.objetivo}</span>
              </div>
            </div>
            <div className="neumorphic-progress-track h-2.5">
              <div
                className={`h-full rounded-full ${getProgressColorClasses(agente.color)}`}
                style={{ width: `${agente.porcentaje}%` }}
              ></div>
            </div>
            <div className="flex justify-between items-center mt-2">
              <p className="font-bold text-lg text-slate-800 dark:text-slate-200">
                {agente.comisiones}
              </p>
              <p className="text-sm text-green-500 flex items-center">
                <span className="material-icons-outlined text-base">arrow_upward</span>
                {agente.crecimiento}%
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Estadísticas Table */}
      <div className="neumorphic-card p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            Estadísticas
          </h3>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <span className="material-icons-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                search
              </span>
              <input
                className="neumorphic-card-inset pl-10 pr-4 py-2 rounded-lg border-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 text-sm w-48 transition-all duration-300 bg-transparent"
                placeholder="Search..."
                type="text"
              />
            </div>
            <div className="neumorphic-card-inset rounded-lg">
              <select className="bg-transparent border-none focus:ring-0 text-sm font-medium">
                <option>10</option>
                <option>20</option>
                <option>50</option>
              </select>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="p-3">Rank</th>
                <th className="p-3">Nombre</th>
                <th className="p-3">Ventas/Objetivo</th>
                <th className="p-3">Comisiones</th>
                <th className="p-3">% Objetivo</th>
                <th className="p-3">% Crecimiento</th>
                <th className="p-3">% Conversión</th>
              </tr>
            </thead>
            <tbody>
              {dashboardData.topAgentes.map((agente, idx) => (
                <tr key={idx} className="table-row-divider">
                  <td className="p-3 font-semibold">{idx + 1}</td>
                  <td className="p-3">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full neumorphic-card p-0.5 flex items-center justify-center mr-3">
                        <span className="material-icons-outlined text-xl text-slate-500">
                          person
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-slate-800 dark:text-slate-200">
                          {agente.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {agente.role}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 font-medium">
                    {agente.ventas}/{agente.objetivo}
                  </td>
                  <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                    {agente.comisiones}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center">
                      <div className="w-24 neumorphic-progress-track h-2 mr-2">
                        <div
                          className={`h-full rounded-full ${getProgressColorClasses(agente.color)}`}
                          style={{ width: `${agente.porcentaje}%` }}
                        ></div>
                      </div>
                      <span>{agente.porcentaje}%</span>
                    </div>
                  </td>
                  <td className="p-3 text-green-500 flex items-center">
                    <span className="material-icons-outlined text-base">arrow_upward</span>
                    {agente.crecimiento}%
                  </td>
                  <td className="p-3 font-medium">{agente.porcentaje}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Days Left and Historial */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="neumorphic-card p-6 col-span-1 md:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <span className="text-4xl font-bold text-slate-800 dark:text-slate-100">
              119
            </span>
            <span className="font-semibold text-slate-600 dark:text-slate-400">
              Days Left
            </span>
            <button className="px-5 py-2 rounded-lg neumorphic-button font-medium text-slate-600 dark:text-slate-400">
              Contratos
            </button>
          </div>
          <div className="neumorphic-progress-track h-2.5">
            <div
              className="bg-primary h-full rounded-full"
              style={{ width: "32.6%" }}
            ></div>
          </div>
          <p className="text-right text-sm mt-2 text-slate-500 dark:text-slate-400">
            119/365
          </p>
        </div>
        <div className="neumorphic-card p-6">
          <h3 className="font-semibold mb-4 text-slate-800 dark:text-slate-100">
            Historial de Puntos
          </h3>
          <div className="flex items-center justify-center h-full text-sm text-slate-500 dark:text-slate-400">
            <p>No hay datos disponibles</p>
          </div>
        </div>
      </div>

      {/* Ventas por Mes Chart */}
      <div className="neumorphic-card p-6 mb-8">
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6">
          Ventas por Mes
        </h3>
        <div className="flex items-end h-64 space-x-2 sm:space-x-4">
          {[
            { mes: "Ene", altura: "50%" },
            { mes: "Feb", altura: "75%" },
            { mes: "Mar", altura: "10%" },
            { mes: "Abr", altura: "70%" },
            { mes: "May", altura: "40%" },
            { mes: "Jun", altura: "30%" },
            { mes: "Jul", altura: "65%" },
            { mes: "Ago", altura: "20%" },
            { mes: "Sep", altura: "5%" },
            { mes: "Oct", altura: "35%" },
            { mes: "Nov", altura: "85%" },
            { mes: "Dic", altura: "80%" },
          ].map((mes, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center justify-end">
              <div className="w-full bg-primary/20 dark:bg-primary/30 rounded-t-lg group">
                <div
                  className="bg-primary rounded-t-lg w-full transition-all duration-300 group-hover:bg-teal-400"
                  style={{ height: mes.altura }}
                ></div>
              </div>
              <p className="text-xs mt-2 text-slate-500 dark:text-slate-400">
                {mes.mes}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Calendario de Actividad */}
      <div className="neumorphic-card p-6 mb-8 min-h-[200px] flex flex-col">
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">
          Calendario de Actividad
        </h3>
        <div className="flex-grow flex items-center justify-center text-sm text-slate-500 dark:text-slate-400">
          <p>No hay datos de actividad disponibles</p>
        </div>
      </div>
    </div>
  );
}
