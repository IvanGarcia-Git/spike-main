"use client";
import React, { useState, useEffect, useCallback } from "react";
import { getCookie } from "cookies-next";
import { getLeadStats } from "@/helpers/server-fetch.helper";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const fmt = (d) => d.toISOString().slice(0, 10);
const DONUT_COLORS = [
  "#14b8a6", "#0ea5e9", "#f59e0b", "#ef4444", "#8b5cf6",
  "#22c55e", "#ec4899", "#64748b", "#eab308", "#06b6d4", "#f97316",
];

// Tarjeta de métrica
function StatCard({ icon, label, value, suffix, hint, accent = "text-primary" }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm">
      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
        <span className="material-icons-outlined text-lg">{icon}</span>
        <span className="text-xs font-medium">{label}</span>
      </div>
      <div className={`mt-2 text-2xl font-bold ${accent}`}>
        {value}
        {suffix && <span className="text-base font-semibold text-slate-400 ml-1">{suffix}</span>}
      </div>
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}

export default function EstadisticasLeadsPage() {
  const today = new Date();
  const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  const [startDate, setStartDate] = useState(fmt(monthAgo));
  const [endDate, setEndDate] = useState(fmt(today));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const startIso = `${startDate}T00:00:00.000Z`;
      const endIso = `${endDate}T23:59:59.999Z`;
      const res = await getLeadStats(startIso, endIso, getCookie("factura-token"));
      if (!res.ok) throw new Error("No se pudieron cargar las estadísticas");
      setData(await res.json());
    } catch (e) {
      setError(e.message || "Error");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const r = data?.resumen;

  const origenChart = data && {
    labels: data.porOrigen.map((o) => o.origen),
    datasets: [
      { label: "Leads", data: data.porOrigen.map((o) => o.leads), backgroundColor: "rgba(100,116,139,0.5)" },
      { label: "Ventas", data: data.porOrigen.map((o) => o.ventas), backgroundColor: "#14b8a6" },
    ],
  };

  const estadoChart = data && {
    labels: data.porEstado.map((e) => e.estado),
    datasets: [
      {
        data: data.porEstado.map((e) => e.count),
        backgroundColor: data.porEstado.map((_, i) => DONUT_COLORS[i % DONUT_COLORS.length]),
        borderWidth: 0,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: "bottom" } },
    scales: { y: { beginAtZero: true, grid: { color: "rgba(0,0,0,0.05)" } }, x: { grid: { display: false } } },
  };
  const donutOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "right" } } };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-1">Estadísticas del gestor de leads</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
        Métricas de contacto y conversión aproximadas a partir del histórico de gestión de leads.
      </p>

      {/* Filtro de fechas */}
      <div className="flex flex-wrap items-end gap-3 mb-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
        <div>
          <label className="block text-xs text-slate-500 mb-1">Desde</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
            className="rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Hasta</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
            className="rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent px-3 py-2 text-sm" />
        </div>
        <button onClick={load} disabled={loading}
          className="bg-primary text-white rounded-lg px-5 py-2 text-sm font-semibold hover:opacity-90 disabled:opacity-50">
          {loading ? "Cargando…" : "Aplicar"}
        </button>
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400 mb-4">{error}</p>}

      {loading && !data && <p className="text-sm text-slate-500">Cargando estadísticas…</p>}

      {r && (
        <>
          {/* Tarjetas de resumen */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
            <StatCard icon="groups" label="Leads gestionados" value={r.leadsGestionados} />
            <StatCard icon="call" label="% Contacto" value={r.pctContacto} suffix="%" hint={`${r.contactados} contactados`} />
            <StatCard icon="handshake" label="% Contratación" value={r.pctContratacion} suffix="%" hint="sobre contactados" accent="text-emerald-600" />
            <StatCard icon="check_circle" label="Ventas" value={r.ventas} accent="text-emerald-600" />
            <StatCard icon="repeat" label="Intentos medios" value={r.mediaIntentosHastaContacto} hint="hasta contactar" />
            <StatCard icon="schedule" label="Resp. media" value={r.tiempoMedioRespuestaDias} suffix="días" hint="desde alta del lead" />
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm">
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">Conversión por origen</h3>
              <div className="h-72">
                {data.porOrigen.length ? <Bar data={origenChart} options={barOptions} /> :
                  <p className="text-sm text-slate-400">Sin datos en el rango.</p>}
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm">
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">Distribución por estado</h3>
              <div className="h-72">
                {data.porEstado.length ? <Doughnut data={estadoChart} options={donutOptions} /> :
                  <p className="text-sm text-slate-400">Sin datos en el rango.</p>}
              </div>
            </div>
          </div>

          {/* Ranking de agentes */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">Ranking de agentes</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                    <th className="py-2 pr-4">#</th>
                    <th className="py-2 pr-4">Agente</th>
                    <th className="py-2 pr-4 text-right">Interacciones</th>
                    <th className="py-2 pr-4 text-right">Contactos</th>
                    <th className="py-2 pr-4 text-right">Ventas</th>
                    <th className="py-2 pr-4 text-right">% Conversión</th>
                  </tr>
                </thead>
                <tbody>
                  {data.ranking.length === 0 && (
                    <tr><td colSpan={6} className="py-4 text-center text-slate-400">Sin actividad en el rango.</td></tr>
                  )}
                  {data.ranking.map((a, i) => (
                    <tr key={a.userId} className="border-b border-slate-100 dark:border-slate-800">
                      <td className="py-2 pr-4 text-slate-400">{i + 1}</td>
                      <td className="py-2 pr-4 font-medium text-slate-700 dark:text-slate-200">{a.name}</td>
                      <td className="py-2 pr-4 text-right">{a.interacciones}</td>
                      <td className="py-2 pr-4 text-right">{a.contactos}</td>
                      <td className="py-2 pr-4 text-right font-semibold text-emerald-600">{a.ventas}</td>
                      <td className="py-2 pr-4 text-right">{a.pctConversion}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <p className="text-xs text-slate-400 mt-4">
            Nota: métricas aproximadas a partir del histórico de estados de leads. No incluye duración real de llamada
            (sin integración de telefonía). "Intentos" = registros de "No contesta"/"Ilocalizable" antes del contacto.
          </p>
        </>
      )}
    </div>
  );
}
