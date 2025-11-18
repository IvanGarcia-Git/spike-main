"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/page-header.component";
import NuevaComparativaModal from "@/components/comparativas/nueva-comparativa.modal";

export default function ComparativasPage() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState(null);

  // Mock data de comparativas (en el futuro esto vendrá del backend)
  const comparativas = [
    {
      id: 1,
      nombre: "TEST",
      tipo: "luz",
      tarifa: "2.0",
      fecha: "hace 1 mes",
      precioNuevo: "45.90",
      precioAnterior: "84.00",
      icono: "lightbulb",
      iconColor: "text-primary",
    },
    {
      id: 2,
      nombre: "Cliente Gas S.L.",
      tipo: "gas",
      tarifa: "RL.2",
      fecha: "hace 2 meses",
      precioNuevo: "112.50",
      precioAnterior: "150.20",
      icono: "local_fire_department",
      iconColor: "text-orange-400",
    },
    {
      id: 3,
      nombre: "Empresa Luz",
      tipo: "luz",
      tarifa: "3.0TD",
      fecha: "hace 4 meses",
      precioNuevo: "230.10",
      precioAnterior: "295.00",
      icono: "lightbulb",
      iconColor: "text-primary",
    },
    {
      id: 4,
      nombre: "Hogar Familiar",
      tipo: "luz",
      tarifa: "2.0TD",
      fecha: "hace 5 meses",
      precioNuevo: "65.75",
      precioAnterior: "92.30",
      icono: "lightbulb",
      iconColor: "text-primary",
    },
  ];

  const handleVerMas = () => {
    // En el futuro, cargar más comparativas
    console.log("Ver más comparativas");
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
            Comparativas
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Historial de comparativas realizadas
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="neumorphic-button flex items-center justify-center p-4 rounded-lg bg-primary text-white font-semibold hover:shadow-neumorphic-inset-light dark:hover:shadow-neumorphic-inset-dark transition-all"
        >
          <span className="material-icons-outlined mr-2">add</span>
          Nueva Comparativa
        </button>
      </div>

      {/* Sección de últimas comparativas */}
      <div className="flex justify-between items-center mb-6 mt-8">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
          Últimas Comparativas
        </h3>
        <button className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/50 transition-colors">
          <span className="material-icons-outlined text-xl">tune</span>
        </button>
      </div>

      {/* Lista de comparativas */}
      <div className="space-y-4">
        {comparativas.map((comparativa) => (
          <div
            key={comparativa.id}
            className="neumorphic-card p-4 flex items-center justify-between hover:shadow-neumorphic-inset-light dark:hover:shadow-neumorphic-inset-dark transition-all cursor-pointer"
          >
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-lg neumorphic-card-inset flex items-center justify-center mr-4">
                <span
                  className={`material-icons-outlined ${comparativa.iconColor}`}
                >
                  {comparativa.icono}
                </span>
              </div>
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-100">
                  {comparativa.nombre}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {comparativa.tarifa} - {comparativa.fecha}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-slate-800 dark:text-slate-100">
                {comparativa.precioNuevo}€
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-through">
                {comparativa.precioAnterior}€
              </p>
            </div>
            <button className="text-slate-500 dark:text-slate-400 ml-2 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
              <span className="material-icons-outlined">more_vert</span>
            </button>
          </div>
        ))}
      </div>

      {/* Ver más */}
      <div className="mt-4 text-center">
        <button
          onClick={handleVerMas}
          className="text-sm font-semibold text-primary hover:underline"
        >
          Ver más
        </button>
      </div>

      {/* Modal Nueva Comparativa */}
      <NuevaComparativaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
