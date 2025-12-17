"use client";
import { useEffect } from "react";
import Link from "next/link";

export default function HistorialError({ error, reset }) {
  useEffect(() => {
    // Log the error to console for debugging
    console.error("Error en historial de control horario:", error);
  }, [error]);

  return (
    <div className="p-6">
      <div className="max-w-lg mx-auto text-center">
        <div className="neumorphic-card p-8">
          <span className="material-icons-outlined text-6xl text-danger mb-4">
            error_outline
          </span>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
            Error al cargar el historial
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            Ha ocurrido un error inesperado. Por favor, intenta de nuevo.
          </p>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => reset()}
              className="px-4 py-2 neumorphic-button rounded-lg text-primary font-medium hover:bg-primary/10 transition-colors"
            >
              <span className="flex items-center gap-2">
                <span className="material-icons-outlined text-sm">refresh</span>
                Reintentar
              </span>
            </button>
            <Link
              href="/control-horario"
              className="px-4 py-2 neumorphic-button rounded-lg text-slate-600 dark:text-slate-300 font-medium hover:text-primary transition-colors"
            >
              <span className="flex items-center gap-2">
                <span className="material-icons-outlined text-sm">arrow_back</span>
                Volver
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
