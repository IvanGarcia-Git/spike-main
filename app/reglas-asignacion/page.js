"use client";
import React, { useState, useEffect } from "react";
import { getCookie } from "cookies-next";
import {
  authGetFetch,
  getAssignmentRules,
  createAssignmentRule,
  updateAssignmentRule,
  deleteAssignmentRule,
} from "@/helpers/server-fetch.helper";

const SECTORS = ["Luz", "Gas", "Placas", "Telefonia"];
const SHIFTS = [
  { value: "morning", label: "Mañana" },
  { value: "evening", label: "Tarde" },
];
const ASSIGN_MODES = [
  { value: "least_busy", label: "Menos saturado (carga de trabajo)" },
  { value: "round_robin", label: "Rotatorio (round-robin)" },
  { value: "direct", label: "Agente concreto" },
];

const EMPTY_FORM = {
  name: "",
  priority: 100,
  active: true,
  zona: "",
  sector: "",
  origin: "",
  campaignId: "",
  shift: "",
  assignMode: "least_busy",
  targetUserId: "",
  targetGroupId: "",
};

const AssignmentRulesPage = () => {
  const [rules, setRules] = useState([]);
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingUuid, setEditingUuid] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const token = () => getCookie("factura-token");

  const safeJson = async (res) => {
    if (!res?.ok) return null;
    try {
      return await res.json();
    } catch {
      return null;
    }
  };

  const loadAll = async () => {
    const jwt = token();
    const [rulesRes, usersRes, groupsRes, campaignsRes] = await Promise.all([
      getAssignmentRules(jwt),
      authGetFetch("users/all", jwt),
      authGetFetch("groups", jwt),
      authGetFetch("campaigns/basic", jwt),
    ]);
    setRules((await safeJson(rulesRes)) || []);
    setUsers((await safeJson(usersRes)) || []);
    setGroups((await safeJson(groupsRes)) || []);
    setCampaigns((await safeJson(campaignsRes)) || []);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingUuid(null);
    setError("");
  };

  const startEdit = (rule) => {
    setEditingUuid(rule.uuid);
    setError("");
    setForm({
      name: rule.name || "",
      priority: rule.priority ?? 100,
      active: !!rule.active,
      zona: rule.zona || "",
      sector: rule.sector || "",
      origin: rule.origin || "",
      campaignId: rule.campaignId || "",
      shift: rule.shift || "",
      assignMode: rule.assignMode || "least_busy",
      targetUserId: rule.targetUserId || "",
      targetGroupId: rule.targetGroupId || "",
    });
  };

  const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const buildPayload = () => {
    const isDirect = form.assignMode === "direct";
    return {
      name: form.name.trim(),
      priority: Number(form.priority) || 100,
      active: !!form.active,
      zona: form.zona.trim() || null,
      sector: form.sector || null,
      origin: form.origin.trim() || null,
      campaignId: form.campaignId ? Number(form.campaignId) : null,
      shift: form.shift || null,
      assignMode: form.assignMode,
      targetUserId: isDirect && form.targetUserId ? Number(form.targetUserId) : null,
      targetGroupId: !isDirect && form.targetGroupId ? Number(form.targetGroupId) : null,
    };
  };

  const validate = (payload) => {
    if (!payload.name) return "El nombre es obligatorio";
    if (payload.assignMode === "direct" && !payload.targetUserId)
      return "Selecciona el agente destino";
    if (payload.assignMode !== "direct" && !payload.targetGroupId)
      return "Selecciona el grupo destino";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = buildPayload();
    const validationError = validate(payload);
    if (validationError) {
      setError(validationError);
      return;
    }
    setIsSaving(true);
    setError("");
    try {
      const jwt = token();
      const res = editingUuid
        ? await updateAssignmentRule(editingUuid, payload, jwt)
        : await createAssignmentRule(payload, jwt);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "No se pudo guardar la regla");
      }
      resetForm();
      await loadAll();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (rule) => {
    if (!window.confirm(`¿Eliminar la regla "${rule.name}"?`)) return;
    const res = await deleteAssignmentRule(rule.uuid, token());
    if (res.ok) {
      if (editingUuid === rule.uuid) resetForm();
      await loadAll();
    }
  };

  const userName = (u) =>
    [u.name, u.firstSurname, u.secondSurname].filter(Boolean).join(" ") || u.username || u.email;
  const groupName = (id) => groups.find((g) => g.id === id)?.name || `Grupo ${id}`;
  const userLabel = (id) => {
    const u = users.find((x) => x.id === id);
    return u ? userName(u) : `Usuario ${id}`;
  };
  const modeLabel = (m) => ASSIGN_MODES.find((x) => x.value === m)?.label || m;

  const describeCriteria = (r) => {
    const parts = [];
    if (r.zona) parts.push(`zona=${r.zona}`);
    if (r.sector) parts.push(`sector=${r.sector}`);
    if (r.origin) parts.push(`origen=${r.origin}`);
    if (r.campaignId) parts.push(`campaña=${campaigns.find((c) => c.id === r.campaignId)?.name || r.campaignId}`);
    if (r.shift) parts.push(`turno=${r.shift === "morning" ? "mañana" : "tarde"}`);
    return parts.length ? parts.join(" · ") : "cualquier lead";
  };

  const isDirect = form.assignMode === "direct";

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-1">
        Reglas de asignación automática
      </h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
        Las reglas se evalúan por prioridad ascendente; la primera que encaja asigna el lead.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Formulario */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5 space-y-4 h-fit"
        >
          <h2 className="font-semibold text-slate-800 dark:text-slate-100">
            {editingUuid ? "Editar regla" : "Nueva regla"}
          </h2>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Nombre</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent px-3 py-2 text-sm"
              placeholder="p.ej. Luz Madrid → equipo norte"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Prioridad</label>
              <input
                type="number"
                value={form.priority}
                onChange={(e) => set("priority", e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent px-3 py-2 text-sm"
              />
            </div>
            <label className="flex items-end gap-2 pb-2">
              <input type="checkbox" checked={form.active} onChange={(e) => set("active", e.target.checked)} />
              <span className="text-sm text-slate-700 dark:text-slate-300">Activa</span>
            </label>
          </div>

          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 pt-1">Criterios (vacío = no filtra)</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-600 dark:text-slate-300 mb-1">Zona (provincia)</label>
              <input
                type="text"
                value={form.zona}
                onChange={(e) => set("zona", e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent px-3 py-2 text-sm"
                placeholder="p.ej. Madrid"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-600 dark:text-slate-300 mb-1">Sector</label>
              <select
                value={form.sector}
                onChange={(e) => set("sector", e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent px-3 py-2 text-sm"
              >
                <option value="">Cualquiera</option>
                {SECTORS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-600 dark:text-slate-300 mb-1">Origen</label>
              <input
                type="text"
                value={form.origin}
                onChange={(e) => set("origin", e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent px-3 py-2 text-sm"
                placeholder="p.ej. Meta"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-600 dark:text-slate-300 mb-1">Turno</label>
              <select
                value={form.shift}
                onChange={(e) => set("shift", e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent px-3 py-2 text-sm"
              >
                <option value="">Cualquiera</option>
                {SHIFTS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-slate-600 dark:text-slate-300 mb-1">Campaña</label>
              <select
                value={form.campaignId}
                onChange={(e) => set("campaignId", e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent px-3 py-2 text-sm"
              >
                <option value="">Cualquiera</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 pt-1">Destino</p>
          <div>
            <label className="block text-xs text-slate-600 dark:text-slate-300 mb-1">Modo de reparto</label>
            <select
              value={form.assignMode}
              onChange={(e) => set("assignMode", e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent px-3 py-2 text-sm"
            >
              {ASSIGN_MODES.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
          {isDirect ? (
            <div>
              <label className="block text-xs text-slate-600 dark:text-slate-300 mb-1">Agente</label>
              <select
                value={form.targetUserId}
                onChange={(e) => set("targetUserId", e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent px-3 py-2 text-sm"
              >
                <option value="">Selecciona agente…</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{userName(u)}</option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-xs text-slate-600 dark:text-slate-300 mb-1">Grupo</label>
              <select
                value={form.targetGroupId}
                onChange={(e) => set("targetGroupId", e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent px-3 py-2 text-sm"
              >
                <option value="">Selecciona grupo…</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
          )}

          {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 bg-primary text-white rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 disabled:opacity-50"
            >
              {isSaving ? "Guardando…" : editingUuid ? "Guardar cambios" : "Crear regla"}
            </button>
            {editingUuid && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg px-4 py-2 text-sm border border-slate-300 dark:border-slate-600"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>

        {/* Listado */}
        <div className="lg:col-span-3 space-y-3">
          {rules.length === 0 && (
            <div className="text-sm text-slate-500 dark:text-slate-400 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-6 text-center">
              No hay reglas todavía. Crea la primera con el formulario.
            </div>
          )}
          {rules.map((r) => (
            <div
              key={r.uuid}
              className={`border rounded-xl p-4 ${
                r.active
                  ? "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 opacity-70"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold">
                      {r.priority}
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-100">{r.name}</span>
                    {!r.active && (
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        inactiva
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Si: {describeCriteria(r)}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                    → {modeLabel(r.assignMode)}:{" "}
                    {r.assignMode === "direct"
                      ? userLabel(r.targetUserId)
                      : groupName(r.targetGroupId)}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => startEdit(r)}
                    className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                    title="Editar"
                  >
                    <span className="material-icons-outlined text-lg">edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(r)}
                    className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500"
                    title="Eliminar"
                  >
                    <span className="material-icons-outlined text-lg">delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AssignmentRulesPage;
