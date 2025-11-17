"use client";

import { useState, useEffect } from "react";
import { getCookie } from "cookies-next";

export default function Drive() {
  const [activeSection, setActiveSection] = useState("mi-unidad");
  const [carpetas, setCarpetas] = useState([
    { id: 1, nombre: "Contratos Clientes" },
    { id: 2, nombre: "Informes 2024" },
    { id: 3, nombre: "Material de Marketing y Ventas" },
    { id: 4, nombre: "Propuestas Comerciales" },
  ]);
  const [archivos, setArchivos] = useState([
    {
      id: 1,
      nombre: "presentacion_Q4.pptx",
      icono: "slideshow",
      fecha: "12/08/2024",
      tamano: "2.1 MB",
    },
    {
      id: 2,
      nombre: "briefing_nuevo_proyecto_con_feedback_del_cliente.docx",
      icono: "description",
      fecha: "11/08/2024",
      tamano: "345 KB",
    },
    {
      id: 3,
      nombre: "forecast_ventas_H1_2024.xlsx",
      icono: "grid_on",
      fecha: "10/08/2024",
      tamano: "780 KB",
    },
    {
      id: 4,
      nombre: "acuerdo_confidencialidad_final.pdf",
      icono: "picture_as_pdf",
      fecha: "09/08/2024",
      tamano: "1.2 MB",
    },
    {
      id: 5,
      nombre: "banner_campana_verano.jpg",
      icono: "image",
      fecha: "08/08/2024",
      tamano: "850 KB",
    },
    {
      id: 6,
      nombre: "acta_reunion_seguimiento.docx",
      icono: "description",
      fecha: "07/08/2024",
      tamano: "150 KB",
    },
    {
      id: 7,
      nombre: "mockup_nueva_interfaz_v2.png",
      icono: "image",
      fecha: "06/08/2024",
      tamano: "3.5 MB",
    },
    {
      id: 8,
      nombre: "Reporte_de_actividades_mensual_Julio_2024_firmado.pdf",
      icono: "picture_as_pdf",
      fecha: "05/08/2024",
      tamano: "2.8 MB",
    },
  ]);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 p-4">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center mb-10 p-2 h-8">
            <span className="text-2xl font-bold tracking-wider text-slate-800 dark:text-slate-100">
              SPIKES
            </span>
          </div>

          {/* Navigation */}
          <nav className="flex-grow space-y-2">
            {/* Simplified nav - only showing Drive as active */}
            <a className="flex items-center p-3 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition">
              <span className="material-icons-outlined">dashboard</span>
              <span className="ml-4 font-medium">Dashboard</span>
            </a>
            <a className="flex items-center p-3 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition">
              <span className="material-icons-outlined">receipt_long</span>
              <span className="ml-4 font-medium">Contratos</span>
            </a>
            <a className="flex items-center p-3 rounded-lg neumorphic-button active">
              <span className="material-icons-outlined text-primary">folder</span>
              <span className="ml-4 font-semibold text-primary">Drive</span>
            </a>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-y-auto flex flex-col">
        {/* Header */}
        <header className="flex justify-between items-center mb-8 flex-shrink-0">
          <div className="flex items-center w-full max-w-md">
            <div className="relative w-full">
              <span className="material-icons-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                search
              </span>
              <input
                className="w-full bg-background-light shadow-neumorphic-inset-light border-none rounded-full pl-12 pr-4 py-3 focus:ring-2 focus:ring-primary focus:ring-opacity-50 transition placeholder-slate-400 text-sm"
                placeholder="Buscar en Drive"
                type="text"
              />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button className="p-3 rounded-full neumorphic-button">
              <span className="material-icons-outlined">apps</span>
            </button>
            <button className="p-3 rounded-full neumorphic-button">
              <span className="material-icons-outlined">person</span>
            </button>
            <div className="w-10 h-10 rounded-full neumorphic-card p-0.5">
              <img
                alt="User profile picture"
                className="w-full h-full rounded-full object-cover"
                src="/avatar.png"
              />
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-grow flex">
          {/* Left Sidebar Navigation */}
          <nav className="w-64 flex-shrink-0 pr-6 space-y-2">
            <button className="w-full flex items-center justify-center py-3 px-4 rounded-xl neumorphic-button bg-primary text-white shadow-none hover:shadow-none mb-6">
              <span className="material-icons-outlined mr-2">add</span>
              <span>Nuevo</span>
            </button>
            <a
              className={`flex items-center p-3 rounded-lg font-medium ${
                activeSection === "mi-unidad"
                  ? "text-primary bg-primary/10 shadow-neumorphic-inset-light"
                  : "text-slate-500 hover:shadow-neumorphic-inset-light"
              }`}
              href="#"
              onClick={() => setActiveSection("mi-unidad")}
            >
              <span className="material-icons-outlined mr-4">folder</span> Mi Unidad
            </a>
            <a
              className="flex items-center p-3 rounded-lg text-slate-500 hover:shadow-neumorphic-inset-light"
              href="#"
            >
              <span className="material-icons-outlined mr-4">group</span> Compartido conmigo
            </a>
            <a
              className="flex items-center p-3 rounded-lg text-slate-500 hover:shadow-neumorphic-inset-light"
              href="#"
            >
              <span className="material-icons-outlined mr-4">schedule</span> Recientes
            </a>
            <a
              className="flex items-center p-3 rounded-lg text-slate-500 hover:shadow-neumorphic-inset-light"
              href="#"
            >
              <span className="material-icons-outlined mr-4">star</span> Destacados
            </a>
            <a
              className="flex items-center p-3 rounded-lg text-slate-500 hover:shadow-neumorphic-inset-light"
              href="#"
            >
              <span className="material-icons-outlined mr-4">delete</span> Papelera
            </a>
          </nav>

          {/* Main Content Area */}
          <div className="flex-1 neumorphic-card p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-slate-800">Mi Unidad</h2>
              <div className="flex items-center space-x-2">
                <button className="p-2 rounded-lg neumorphic-button text-slate-500">
                  <span className="material-icons-outlined">grid_view</span>
                </button>
                <button className="p-2 rounded-lg neumorphic-button text-slate-500">
                  <span className="material-icons-outlined">info</span>
                </button>
              </div>
            </div>

            {/* Folders Section */}
            <div>
              <h3 className="text-sm font-medium text-slate-500 mb-3">Carpetas</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {carpetas.map((carpeta) => (
                  <div
                    key={carpeta.id}
                    className="neumorphic-card p-4 flex flex-col items-start space-y-2 cursor-pointer hover:shadow-neumorphic-inset-light"
                  >
                    <span className="material-icons-outlined text-primary text-3xl">
                      folder
                    </span>
                    <span className="text-sm font-medium text-slate-700 break-words line-clamp-2">
                      {carpeta.nombre}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Files Section */}
            <div className="mt-8">
              <h3 className="text-sm font-medium text-slate-500 mb-3">Archivos</h3>
              <div className="flex flex-col space-y-3">
                {archivos.map((archivo) => (
                  <div
                    key={archivo.id}
                    className="neumorphic-card p-3 flex items-center space-x-4 cursor-pointer hover:shadow-neumorphic-inset-light"
                  >
                    <span className="material-icons-outlined text-primary text-2xl">
                      {archivo.icono}
                    </span>
                    <span className="text-sm font-medium text-slate-700 flex-1 truncate">
                      {archivo.nombre}
                    </span>
                    <span className="text-xs text-slate-400">{archivo.fecha}</span>
                    <span className="text-xs text-slate-400">{archivo.tamano}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
