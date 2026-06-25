"use client";
import { useState, useEffect } from "react";
import { getCookie } from "cookies-next";
import { authGetFetch, authFetch } from "@/helpers/server-fetch.helper";

// Categorías del nuevo sistema de tipificaciones (PRES-018 B2b).
const CATEGORY_META = {
  contacto: {
    label: "Contacto efectivo",
    hint: "Has hablado con la persona correcta",
    icon: "record_voice_over",
    accent: "text-green-600",
    badge: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  no_contacto: {
    label: "No contacto",
    hint: "No has hablado con nadie útil — reintento automático",
    icon: "phone_missed",
    accent: "text-amber-600",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  },
  descarte: {
    label: "Descarte / Invalidación",
    hint: "Este lead no debe volver nunca",
    icon: "block",
    accent: "text-red-600",
    badge: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
};

// Descripción de la acción que el sistema ejecutará por cada tipificación.
const ACTION_LABELS = {
  cerrar: "Cierra el lead definitivamente (fuera de cola)",
  reintento: "Programa un reintento automático y rota a otro agente",
  callback: "Programa un callback en la fecha que elijas",
  ventas: "Pasa a ventas (sale de la cola)",
  seguimiento: "Pasa a seguimiento (vuelve a la cola)",
  agenda: "Agenda en calendario (sale de la cola)",
};

// El backend obliga WhatsApp en el último intento (el 6º): attemptCount >= 5
// (MAX_ATTEMPTS_BEFORE_WHATSAPP - 1) o si la tipificación lo requiere.
const LAST_ATTEMPT_THRESHOLD = 5;

export default function LeadTipificationModal({ lead, onClose, onTipified }) {
  const [tipifications, setTipifications] = useState({
    contacto: [],
    no_contacto: [],
    descarte: [],
  });
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [observation, setObservation] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState(lead?.whatsappNumber || "");
  const [callbackDate, setCallbackDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const attemptCount = lead?.attemptCount || 0;
  const forcedWhatsapp = attemptCount >= LAST_ATTEMPT_THRESHOLD;
  const needsWhatsapp = forcedWhatsapp || !!selected?.requiresWhatsapp;
  const needsCallback = selected?.action === "callback";

  useEffect(() => {
    const load = async () => {
      const jwtToken = getCookie("factura-token");
      try {
        const res = await authGetFetch("leads/tipifications", jwtToken);
        if (res.ok) {
          const data = await res.json();
          setTipifications({
            contacto: data?.contacto || [],
            no_contacto: data?.no_contacto || [],
            descarte: data?.descarte || [],
          });
        } else {
          setError("No se pudieron cargar las tipificaciones.");
        }
      } catch (e) {
        console.error("Error cargando tipificaciones:", e);
        setError("Error cargando las tipificaciones.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSubmit = async () => {
    setError("");
    if (!selected) {
      setError("Selecciona una tipificación.");
      return;
    }
    if (needsWhatsapp && !whatsappNumber.trim()) {
      setError(
        forcedWhatsapp
          ? "Último intento (6): debes registrar un WhatsApp obligatorio. El lead quedará asignado a ti de forma definitiva."
          : "Esta tipificación requiere un número de WhatsApp."
      );
      return;
    }
    if (needsCallback && !callbackDate) {
      setError("Selecciona la fecha del callback.");
      return;
    }

    const jwtToken = getCookie("factura-token");
    const payload = {
      tipificationId: selected.id,
      observation: observation || undefined,
      whatsappNumber: needsWhatsapp ? whatsappNumber.trim() : undefined,
      ...(needsCallback && { nextCallDate: callbackDate }),
    };

    setSubmitting(true);
    try {
      const res = await authFetch("POST", `leads/${lead.uuid}/tipify`, payload, jwtToken);
      if (res.ok) {
        onTipified?.();
        return;
      }
      let msg = "No se pudo tipificar el lead.";
      try {
        const d = await res.json();
        msg = d?.error?.message || d?.message || msg;
      } catch {}
      setError(msg);
      setSubmitting(false);
    } catch (e) {
      console.error("Error tipificando:", e);
      setError("Error al enviar la tipificación.");
      setSubmitting(false);
    }
  };

  const renderGroup = (key) => {
    const meta = CATEGORY_META[key];
    const items = tipifications[key] || [];
    if (items.length === 0) return null;
    return (
      <div key={key} className="space-y-2">
        <div className="flex items-center gap-2">
          <span className={`material-icons-outlined text-base ${meta.accent}`}>{meta.icon}</span>
          <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{meta.label}</span>
          <span className="text-xs text-slate-400 hidden sm:inline">— {meta.hint}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {items.map((t) => {
            const isSel = selected?.id === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelected(t)}
                className={`p-2.5 rounded-lg text-left text-xs font-medium transition-all ${
                  isSel
                    ? "neumorphic-card-inset text-slate-900 dark:text-slate-100 ring-2 ring-primary"
                    : "neumorphic-button text-slate-600 dark:text-slate-400"
                }`}
              >
                <span className="block">{t.name}</span>
                {t.requiresWhatsapp && (
                  <span className="text-[10px] text-emerald-600 flex items-center gap-0.5 mt-0.5">
                    <span className="material-icons-outlined text-[12px]">chat</span>
                    WhatsApp
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="neumorphic-card w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <span className="material-icons-outlined text-primary">fact_check</span>
              Tipificar lead
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {lead?.fullName} · Intento {attemptCount + 1} de 6
            </p>
          </div>
          <button
            onClick={onClose}
            className="neumorphic-button w-9 h-9 rounded-lg flex items-center justify-center text-slate-500"
          >
            <span className="material-icons-outlined text-base">close</span>
          </button>
        </div>

        {/* Aviso último intento */}
        {forcedWhatsapp && (
          <div className="p-3 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-sm flex items-start gap-2">
            <span className="material-icons-outlined text-base">warning</span>
            <span>
              Último intento: es obligatorio registrar un número de WhatsApp. El lead quedará asignado a ti de
              forma permanente y saldrá de la cola de rotación.
            </span>
          </div>
        )}

        {loading ? (
          <div className="py-10 text-center text-slate-500">
            <span className="material-icons-outlined animate-spin">sync</span>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {renderGroup("contacto")}
              {renderGroup("no_contacto")}
              {renderGroup("descarte")}
            </div>

            {/* Acción que ejecutará la tipificación seleccionada */}
            {selected && (
              <div className="p-3 rounded-lg neumorphic-card-inset text-sm text-slate-600 dark:text-slate-300 flex items-center gap-2">
                <span className="material-icons-outlined text-base text-primary">bolt</span>
                {ACTION_LABELS[selected.action] || "Acción del sistema"}
              </div>
            )}

            {/* Observación */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Observación
              </label>
              <textarea
                value={observation}
                onChange={(e) => setObservation(e.target.value)}
                placeholder="Notas de la llamada..."
                className="w-full neumorphic-card-inset px-4 py-2.5 rounded-lg bg-transparent text-slate-800 dark:text-slate-200 border-none focus:outline-none resize-none h-16"
              />
            </div>

            {/* Fecha de callback */}
            {needsCallback && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Fecha del callback
                </label>
                <input
                  type="datetime-local"
                  value={callbackDate}
                  onChange={(e) => setCallbackDate(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-transparent text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-primary"
                />
              </div>
            )}

            {/* WhatsApp obligatorio */}
            {needsWhatsapp && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                  <span className="material-icons-outlined text-sm text-emerald-600">chat</span>
                  WhatsApp {forcedWhatsapp ? "(obligatorio)" : ""}
                </label>
                <input
                  type="tel"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="Ej: 600123456"
                  className="w-full px-4 py-2 rounded-lg bg-transparent text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-primary"
                />
              </div>
            )}

            {error && (
              <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
                <span className="material-icons-outlined text-sm">error</span>
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-1">
              <button
                onClick={onClose}
                className="neumorphic-button px-5 py-2.5 rounded-lg text-slate-600 dark:text-slate-400 font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || !selected}
                className="neumorphic-button bg-primary text-white px-6 py-2.5 rounded-lg font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className={`material-icons-outlined text-sm ${submitting ? "animate-spin" : ""}`}>
                  {submitting ? "sync" : "send"}
                </span>
                Tipificar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
