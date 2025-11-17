"use client";

import { useState, useEffect } from "react";
import { getCookie } from "cookies-next";
import PageHeader from "@/components/page-header.component";

export default function Comparativas() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState("luz");
  const [comparativas, setComparativas] = useState([
    {
      id: 1,
      nombre: "TEST",
      tarifa: "2.0 - hace 1 mes",
      precioActual: "45.90€",
      precioAnterior: "84.00€",
      tipo: "luz",
    },
    {
      id: 2,
      nombre: "Cliente Gas S.L.",
      tarifa: "RL.2 - hace 2 meses",
      precioActual: "112.50€",
      precioAnterior: "150.20€",
      tipo: "gas",
    },
    {
      id: 3,
      nombre: "Empresa Luz",
      tarifa: "3.0TD - hace 4 meses",
      precioActual: "230.10€",
      precioAnterior: "295.00€",
      tipo: "luz",
    },
    {
      id: 4,
      nombre: "Hogar Familiar",
      tarifa: "2.0TD - hace 5 meses",
      precioActual: "65.75€",
      precioAnterior: "92.30€",
      tipo: "luz",
    },
  ]);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const getIconForType = (tipo) => {
    return tipo === "luz" ? "lightbulb" : "local_fire_department";
  };

  const getIconColorForType = (tipo) => {
    return tipo === "luz" ? "text-primary" : "text-orange-400";
  };

  return (
    <div className="p-6">
      {/* Header with Nueva Comparativa button */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
            Comparativas
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Historial de comparativas realizadas
          </p>
        </div>
        <button
          onClick={openModal}
          className="neumorphic-button flex items-center justify-center p-4 rounded-lg bg-primary text-white font-semibold"
        >
          <span className="material-icons-outlined mr-2">add</span>
          Nueva Comparativa
        </button>
      </div>

      {/* Section Header */}
      <div className="flex justify-between items-center mb-6 mt-8">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
          Últimas Comparativas
        </h3>
        <button className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/50 transition-colors">
          <span className="material-icons-outlined text-xl">tune</span>
        </button>
      </div>

      {/* Comparativas List */}
      <div className="space-y-4">
        {comparativas.map((comparativa) => (
          <div
            key={comparativa.id}
            className="neumorphic-card p-4 flex items-center justify-between"
          >
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-lg neumorphic-card-inset flex items-center justify-center mr-4">
                <span
                  className={`material-icons-outlined ${getIconColorForType(
                    comparativa.tipo
                  )}`}
                >
                  {getIconForType(comparativa.tipo)}
                </span>
              </div>
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-100">
                  {comparativa.nombre}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {comparativa.tarifa}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-slate-800 dark:text-slate-100">
                {comparativa.precioActual}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-through">
                {comparativa.precioAnterior}
              </p>
            </div>
            <button className="text-slate-500 dark:text-slate-400 ml-2">
              <span className="material-icons-outlined">more_vert</span>
            </button>
          </div>
        ))}
      </div>

      {/* Ver más link */}
      <div className="mt-4 text-center">
        <a className="text-sm font-semibold text-primary hover:underline" href="#">
          Ver más
        </a>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 dark:bg-opacity-50 flex justify-center items-center p-4 z-50">
          <div className="neumorphic-card w-full max-w-lg p-8 relative">
            <button
              className="absolute top-4 right-4 p-2 rounded-full neumorphic-button"
              onClick={closeModal}
            >
              <span className="material-icons-outlined">close</span>
            </button>
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                Nueva Comparativa
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mt-2">
                ¿Qué comparativa quieres hacer hoy?
              </p>
            </div>
            <div className="flex items-center justify-center space-x-8">
              <button
                onClick={() => setSelectedType("luz")}
                className={`neumorphic-button flex flex-col items-center justify-center p-8 w-48 h-48 rounded-xl transition-colors duration-200 ${
                  selectedType === "luz"
                    ? "active text-primary"
                    : "text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary"
                }`}
              >
                <span className="material-icons-outlined text-6xl mb-2">
                  lightbulb
                </span>
                <span className="font-semibold text-xl">Luz</span>
              </button>
              <button
                onClick={() => setSelectedType("gas")}
                className={`neumorphic-button flex flex-col items-center justify-center p-8 w-48 h-48 rounded-xl transition-colors duration-200 ${
                  selectedType === "gas"
                    ? "active text-primary"
                    : "text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary"
                }`}
              >
                <span className="material-icons-outlined text-6xl mb-2">
                  local_fire_department
                </span>
                <span className="font-semibold text-xl">Gas</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
