"use client";
import React, { useState, useEffect } from "react";
import { getCookie } from "cookies-next";
import { getMyLeadPriorities, updateMyLeadPriorities } from "@/helpers/server-fetch.helper";

// Etiquetas legibles de cada prioridad (PRES-018 B2b).
const BASE_LABELS = {
  recent_first: "Leads más recientes",
  oldest_first: "Leads más antiguos",
  with_attachments: "Leads con factura adjunta",
  from_queue: "Asignados por compañeros",
  morning_shift: "Agendados a turno de mañana",
  evening_shift: "Agendados a turno de tarde",
  not_responding: "No contesta",
  service_luz: "Servicio: Luz",
  service_gas: "Servicio: Gas",
  service_placas: "Servicio: Placas",
  service_telefonia: "Servicio: Telefonía",
};

const BASE_ORDER = [
  "recent_first",
  "oldest_first",
  "with_attachments",
  "from_queue",
  "morning_shift",
  "evening_shift",
  "not_responding",
  "service_luz",
  "service_gas",
  "service_placas",
  "service_telefonia",
];

const MyLeadPrioritiesPage = () => {
  const [items, setItems] = useState([]); // [{ value, label }]
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  const token = () => getCookie("factura-token");

  const buildItems = (savedOrder, groups) => {
    const labelFor = (value) => {
      if (BASE_LABELS[value]) return BASE_LABELS[value];
      const g = (groups || []).find((x) => `group${x.id}` === value);
      return g ? `Grupo: ${g.name}` : value;
    };
    const available = [
      ...BASE_ORDER,
      ...(groups || []).map((g) => `group${g.id}`),
    ];
    // Primero las guardadas (en su orden), luego el resto disponibles.
    const ordered = [
      ...savedOrder.filter((v) => available.includes(v)),
      ...available.filter((v) => !savedOrder.includes(v)),
    ];
    return ordered.map((value) => ({ value, label: labelFor(value) }));
  };

  const load = async () => {
    setIsLoading(true);
    try {
      const res = await getMyLeadPriorities(token());
      const data = res.ok ? await res.json() : { leadPriorities: [], groups: [] };
      setItems(buildItems(data.leadPriorities || [], data.groups || []));
    } catch {
      setItems(buildItems([], []));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const move = (index, delta) => {
    setItems((prev) => {
      const next = [...prev];
      const target = index + delta;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage("");
    try {
      const res = await updateMyLeadPriorities(items.map((i) => i.value), token());
      setMessage(res.ok ? "Prioridades guardadas." : "No se pudieron guardar las prioridades.");
    } catch {
      setMessage("Error al guardar.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-1">Mis prioridades de leads</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
        Ordena qué leads quieres recibir primero al pedir un nuevo lead. Se aplican de arriba abajo.
      </p>

      {isLoading ? (
        <p className="text-sm text-slate-500">Cargando…</p>
      ) : (
        <>
          <ul className="space-y-2">
            {items.map((item, index) => (
              <li
                key={item.value}
                className="flex items-center justify-between gap-3 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 bg-white dark:bg-slate-900"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold">
                    {index + 1}
                  </span>
                  <span className="text-sm text-slate-700 dark:text-slate-200">{item.label}</span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 disabled:opacity-30"
                    title="Subir"
                  >
                    <span className="material-icons-outlined text-lg">keyboard_arrow_up</span>
                  </button>
                  <button
                    onClick={() => move(index, 1)}
                    disabled={index === items.length - 1}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 disabled:opacity-30"
                    title="Bajar"
                  >
                    <span className="material-icons-outlined text-lg">keyboard_arrow_down</span>
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-3 mt-6">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-primary text-white rounded-lg px-5 py-2 text-sm font-semibold hover:opacity-90 disabled:opacity-50"
            >
              {isSaving ? "Guardando…" : "Guardar prioridades"}
            </button>
            {message && <span className="text-sm text-slate-600 dark:text-slate-300">{message}</span>}
          </div>
        </>
      )}
    </div>
  );
};

export default MyLeadPrioritiesPage;
