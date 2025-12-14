import { useState, useEffect } from "react";

/**
 * Indicador de autoguardado con animación
 */
export function AutoSaveIndicator({ lastSavedText, className = "" }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (lastSavedText) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [lastSavedText]);

  if (!lastSavedText) return null;

  return (
    <div
      className={`flex items-center gap-2 text-sm transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-50"
      } ${className}`}
    >
      <span className="material-icons-outlined text-green-500 text-base">cloud_done</span>
      <span className="text-slate-500 dark:text-slate-400">{lastSavedText}</span>
    </div>
  );
}

/**
 * Modal para recuperar borrador guardado
 */
export function RestoreDraftModal({ isOpen, onRestore, onDiscard, lastSaved }) {
  if (!isOpen) return null;

  const formatDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-[80] p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full p-6 animate-fade-in">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
            <span className="material-icons-outlined text-yellow-600 dark:text-yellow-400 text-2xl">
              restore
            </span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              Borrador encontrado
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {lastSaved ? `Guardado el ${formatDate(lastSaved)}` : "Guardado anteriormente"}
            </p>
          </div>
        </div>

        <p className="text-slate-600 dark:text-slate-300 mb-6">
          Se encontr&oacute; un borrador guardado de este formulario.
          &iquest;Deseas recuperar los datos o empezar desde cero?
        </p>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onDiscard}
            className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors font-medium"
          >
            Empezar de cero
          </button>
          <button
            onClick={onRestore}
            className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors font-medium flex items-center gap-2"
          >
            <span className="material-icons-outlined text-sm">restore</span>
            Recuperar borrador
          </button>
        </div>
      </div>
    </div>
  );
}
