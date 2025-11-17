"use client";

import { useState, useEffect } from "react";
import { getCookie } from "cookies-next";
import PageHeader from "@/components/page-header.component";

export default function Notas() {
  const [activeSection, setActiveSection] = useState("todas");
  const [carpetas, setCarpetas] = useState([
    { id: 1, nombre: "EEEEo", icono: "folder" },
  ]);
  const [notasRecientes, setNotasRecientes] = useState([
    { id: 1, titulo: "afs", contenido: "fa", fecha: "10/11/2025" },
    { id: 2, titulo: "se", contenido: "se", fecha: "9/9/2025" },
    { id: 3, titulo: "Test", contenido: "test", fecha: "4/9/2025" },
  ]);
  const [todasNotas, setTodasNotas] = useState([
    { id: 1, titulo: "afs", contenido: "fa", fecha: "10/11/2025" },
    { id: 2, titulo: "se", contenido: "se", fecha: "9/9/2025" },
    { id: 3, titulo: "Test", contenido: "test", fecha: "4/9/2025" },
  ]);

  return (
    <div className="p-6">
      <PageHeader title="Todas las Notas" />

      <div className="flex space-x-6">
        {/* Main Content - 3/4 width */}
        <div className="w-3/4 space-y-8">
          {/* Carpetas Section */}
          <div>
            <div className="flex items-center mb-4">
              <span className="material-icons-outlined mr-2">home</span>
            </div>
            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4">
              Carpetas
            </h3>
            <div className="neumorphic-card p-4 flex items-center justify-between">
              <div className="flex items-center">
                <span className="material-icons-outlined mr-3 text-primary">
                  folder
                </span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  EEEEo
                </span>
              </div>
            </div>
          </div>

          {/* Recientes Section */}
          <div>
            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4">
              Recientes
            </h3>
            <div className="grid grid-cols-3 gap-6">
              {notasRecientes.map((nota) => (
                <div
                  key={nota.id}
                  className="neumorphic-card p-4 flex flex-col justify-between h-36"
                >
                  <div>
                    <h4 className="font-semibold text-slate-800 dark:text-slate-200">
                      {nota.titulo}
                    </h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {nota.contenido}
                    </p>
                  </div>
                  <p className="text-xs text-slate-400">{nota.fecha}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Notas Section */}
          <div>
            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4">
              Notas
            </h3>
            <div className="grid grid-cols-3 gap-6">
              {todasNotas.map((nota) => (
                <div
                  key={nota.id}
                  className="neumorphic-card p-4 flex flex-col justify-between h-36"
                >
                  <div>
                    <h4 className="font-semibold text-slate-800 dark:text-slate-200">
                      {nota.titulo}
                    </h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {nota.contenido}
                    </p>
                  </div>
                  <p className="text-xs text-slate-400">{nota.fecha}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar - 1/4 width */}
        <div className="w-1/4">
          <div className="neumorphic-card p-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">
              Nota Rápida
            </h3>

            {/* Search Box */}
            <div className="relative mb-4">
              <span className="material-icons-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                search
              </span>
              <input
                className="neumorphic-card-inset w-full pl-10 pr-4 py-2 rounded-lg border-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 text-sm bg-transparent"
                placeholder="Buscar notas..."
                type="text"
              />
            </div>

            {/* Buttons */}
            <button className="w-full flex items-center justify-center p-3 rounded-lg bg-primary text-white font-semibold neumorphic-button mb-2">
              <span className="material-icons-outlined mr-2">add</span>
              Nuevo
            </button>
            <button className="w-full flex items-center justify-center p-3 rounded-lg bg-primary/20 text-primary font-semibold neumorphic-button mb-4">
              <span className="material-icons-outlined mr-2">create_new_folder</span>
              Nueva Carpeta
            </button>

            {/* Navigation */}
            <nav className="space-y-1">
              <a
                className={`flex items-center p-3 rounded-lg ${
                  activeSection === "todas"
                    ? "bg-primary/10"
                    : ""
                }`}
                href="#"
                onClick={() => setActiveSection("todas")}
              >
                <span
                  className={`material-icons-outlined mr-3 ${
                    activeSection === "todas" ? "text-primary" : "text-slate-500"
                  }`}
                >
                  home
                </span>
                <span
                  className={`font-medium ${
                    activeSection === "todas"
                      ? "text-primary"
                      : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  Todas las Notas
                </span>
              </a>
              <a
                className={`flex items-center p-3 rounded-lg ${
                  activeSection === "favoritos"
                    ? "bg-primary/10"
                    : ""
                }`}
                href="#"
                onClick={() => setActiveSection("favoritos")}
              >
                <span
                  className={`material-icons-outlined mr-3 ${
                    activeSection === "favoritos" ? "text-primary" : "text-slate-500"
                  }`}
                >
                  star_outline
                </span>
                <span
                  className={`font-medium ${
                    activeSection === "favoritos"
                      ? "text-primary"
                      : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  Favoritos
                </span>
              </a>
              <a className="flex items-center p-3 rounded-lg" href="#">
                <span className="material-icons-outlined mr-3 text-slate-500">
                  folder
                </span>
                <span className="font-medium text-slate-600 dark:text-slate-400">
                  EEEEo
                </span>
              </a>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
}
