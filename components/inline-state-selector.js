"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

export default function InlineStateSelector({
  contractStates,
  currentState,
  onStateChange,
  isLoading = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, maxHeight: 240 });
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);

  // Posicionar el dropdown SIEMPRE visible entero: por defecto debajo del botón,
  // pero si no cabe abajo y hay más sitio arriba, se abre hacia arriba. En todo
  // caso se acota al viewport (con scroll interno) para que NUNCA se corte.
  // Como el portal usa position: fixed, las coords son de viewport (sin scrollX/Y).
  useEffect(() => {
    if (!isOpen) return;

    const positionDropdown = () => {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      const viewportH = window.innerHeight;
      const viewportW = window.innerWidth;
      const gap = 4; // separación con el botón
      const margin = 8; // separación mínima con el borde del viewport
      const MAX_H = 240; // == max-h-[240px] del diseño
      const DROPDOWN_W = 180; // == min-w-[180px]

      const spaceBelow = viewportH - rect.bottom - gap - margin;
      const spaceAbove = rect.top - gap - margin;

      // Abrir hacia arriba solo si no cabe abajo y arriba hay más espacio.
      const openUp = spaceBelow < MAX_H && spaceAbove > spaceBelow;
      const available = Math.max(0, openUp ? spaceAbove : spaceBelow);
      const maxHeight = Math.min(MAX_H, available);

      let top = openUp ? rect.top - gap - maxHeight : rect.bottom + gap;
      // Clamp final por seguridad: nunca fuera del viewport.
      top = Math.max(margin, Math.min(top, viewportH - maxHeight - margin));

      // Evitar desborde horizontal por la derecha.
      let left = rect.left;
      if (left + DROPDOWN_W + margin > viewportW) {
        left = Math.max(margin, viewportW - DROPDOWN_W - margin);
      }

      setDropdownPosition({ top, left, maxHeight });
    };

    positionDropdown();
    // Recolocar si cambia el viewport o se hace scroll (el scroll real vive en
    // <main>, por eso capturamos en fase de captura para enterarnos).
    window.addEventListener("resize", positionDropdown);
    window.addEventListener("scroll", positionDropdown, true);
    return () => {
      window.removeEventListener("resize", positionDropdown);
      window.removeEventListener("scroll", positionDropdown, true);
    };
  }, [isOpen]);

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isOpen &&
        dropdownRef.current &&
        buttonRef.current &&
        !dropdownRef.current.contains(event.target) &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Cerrar con Escape
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  const handleStateSelect = (state) => {
    if (state.id === currentState?.id) {
      setIsOpen(false);
      return;
    }
    onStateChange(state);
    setIsOpen(false);
  };

  const toggleDropdown = (e) => {
    e.stopPropagation();
    if (!isLoading) {
      setIsOpen(!isOpen);
    }
  };

  return (
    <>
      <button
        ref={buttonRef}
        onClick={toggleDropdown}
        disabled={isLoading}
        className={`
          inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold
          transition-all duration-200 cursor-pointer
          ${isLoading ? "opacity-50 cursor-wait" : "hover:ring-2 hover:ring-primary/30 hover:shadow-sm"}
        `}
        style={{
          backgroundColor: currentState?.colorHex
            ? `${currentState.colorHex}20`
            : "rgb(var(--primary) / 0.2)",
          color: currentState?.colorHex || "rgb(var(--primary))",
        }}
        title="Click para cambiar estado"
      >
        {currentState?.colorHex && (
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: currentState.colorHex }}
          />
        )}
        <span>{currentState?.name || "Sin estado"}</span>
        {isLoading ? (
          <span className="material-icons-outlined text-xs animate-spin">refresh</span>
        ) : (
          <span className="material-icons-outlined text-xs opacity-60">expand_more</span>
        )}
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            className="fixed z-[100] min-w-[180px] overflow-y-auto
                       bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700
                       animate-in fade-in slide-in-from-top-1 duration-150"
            style={{
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              maxHeight: dropdownPosition.maxHeight,
            }}
          >
            <div className="p-1">
              {contractStates.length > 0 ? (
                contractStates.map((state) => (
                  <button
                    key={state.id}
                    onClick={() => handleStateSelect(state)}
                    className={`
                      w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-left
                      transition-colors duration-150
                      ${
                        state.id === currentState?.id
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                      }
                    `}
                  >
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0 border border-white/20"
                      style={{ backgroundColor: state.colorHex || "#9ca3af" }}
                    />
                    <span className="truncate">{state.name}</span>
                    {state.id === currentState?.id && (
                      <span className="material-icons-outlined text-sm ml-auto">check</span>
                    )}
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-slate-500 dark:text-slate-400">
                  No hay estados disponibles
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
