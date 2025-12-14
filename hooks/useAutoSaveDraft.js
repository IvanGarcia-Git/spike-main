import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Hook para autoguardar borradores en localStorage
 * @param {string} draftKey - Clave única para identificar el borrador
 * @param {Object} data - Datos a guardar
 * @param {Object} options - Opciones de configuración
 * @param {number} options.debounceMs - Tiempo de debounce en milisegundos (default: 2000)
 * @param {boolean} options.enabled - Si el autoguardado está habilitado (default: true)
 * @param {Function} options.onSave - Callback cuando se guarda
 * @param {Function} options.onRestore - Callback cuando se restaura
 */
export default function useAutoSaveDraft(draftKey, data, options = {}) {
  const { debounceMs = 2000, enabled = true, onSave, onRestore } = options;

  const [lastSaved, setLastSaved] = useState(null);
  const [hasDraft, setHasDraft] = useState(false);
  const [draftData, setDraftData] = useState(null);
  const timeoutRef = useRef(null);
  const isInitialMount = useRef(true);

  // Generar clave completa para localStorage
  const storageKey = `draft_${draftKey}`;

  // Verificar si hay borrador guardado al montar
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        setDraftData(parsed.data);
        setHasDraft(true);
        setLastSaved(new Date(parsed.savedAt));
      }
    } catch (error) {
      console.error("Error al leer borrador:", error);
    }
  }, [storageKey]);

  // Guardar borrador con debounce
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    // No guardar en el montaje inicial
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // No guardar si los datos están vacíos
    const hasData = Object.values(data).some((value) => {
      if (typeof value === "string") return value.trim() !== "";
      if (typeof value === "boolean") return value;
      if (Array.isArray(value)) return value.some((v) => v !== "");
      return value !== null && value !== undefined && value !== "";
    });

    if (!hasData) return;

    // Limpiar timeout anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Configurar nuevo timeout
    timeoutRef.current = setTimeout(() => {
      saveDraft(data);
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, enabled, debounceMs]);

  // Función para guardar borrador
  const saveDraft = useCallback(
    (dataToSave) => {
      if (typeof window === "undefined") return;

      try {
        const draftObj = {
          data: dataToSave,
          savedAt: new Date().toISOString(),
        };
        localStorage.setItem(storageKey, JSON.stringify(draftObj));
        setLastSaved(new Date());
        setHasDraft(true);
        setDraftData(dataToSave);

        if (onSave) {
          onSave(dataToSave);
        }
      } catch (error) {
        console.error("Error al guardar borrador:", error);
      }
    },
    [storageKey, onSave]
  );

  // Función para restaurar borrador
  const restoreDraft = useCallback(() => {
    if (draftData && onRestore) {
      onRestore(draftData);
    }
    return draftData;
  }, [draftData, onRestore]);

  // Función para limpiar borrador
  const clearDraft = useCallback(() => {
    if (typeof window === "undefined") return;

    try {
      localStorage.removeItem(storageKey);
      setHasDraft(false);
      setDraftData(null);
      setLastSaved(null);
    } catch (error) {
      console.error("Error al limpiar borrador:", error);
    }
  }, [storageKey]);

  // Función para guardar inmediatamente (sin debounce)
  const saveNow = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    saveDraft(data);
  }, [data, saveDraft]);

  // Formatear última vez guardado
  const getLastSavedText = useCallback(() => {
    if (!lastSaved) return null;

    const now = new Date();
    const diff = Math.floor((now - lastSaved) / 1000);

    if (diff < 5) return "Guardado ahora";
    if (diff < 60) return `Guardado hace ${diff} segundos`;
    if (diff < 3600) return `Guardado hace ${Math.floor(diff / 60)} minutos`;
    return `Guardado a las ${lastSaved.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}`;
  }, [lastSaved]);

  return {
    hasDraft,
    draftData,
    lastSaved,
    restoreDraft,
    clearDraft,
    saveNow,
    getLastSavedText,
  };
}
