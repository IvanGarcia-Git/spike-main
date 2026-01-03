"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  NeumorphicCard,
  StatsCard,
} from "@/components/neumorphic";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Ventas por Mes Chart Component
function VentasPorMesChart({ data }) {
  const chartData = {
    labels: data.map(item => item.mes),
    datasets: [
      {
        label: 'Ventas',
        data: data.map(item => item.ventas),
        borderColor: '#14b8a6',
        backgroundColor: 'rgba(20, 184, 166, 0.1)',
        borderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBackgroundColor: '#14b8a6',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointHoverBackgroundColor: '#0d9488',
        pointHoverBorderColor: '#fff',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        borderColor: '#14b8a6',
        borderWidth: 1,
        titleColor: '#fff',
        bodyColor: '#fff',
        displayColors: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false,
        },
        ticks: {
          color: '#64748b',
        },
      },
      x: {
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          color: '#64748b',
        },
      },
    },
  };

  return (
    <div className="neumorphic-card p-6 mb-8">
      <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6">
        Ventas por Mes
      </h3>
      <div className="h-64">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("general");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalClientes: 0,
      totalLeads: 0,
      totalContratos: 0,
      ingresosMes: 0
    },
    topAgentes: [],
    topColaboradores: [],
    ventasPorMes: [],
    activityCalendar: [],
    weeklyActivity: [],
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dashboard', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        setDashboardData({
          stats: data.stats || { totalClientes: 0, totalLeads: 0, totalContratos: 0, ingresosMes: 0 },
          topAgentes: data.topAgentes || [],
          topColaboradores: data.topColaboradores || [],
          ventasPorMes: data.ventasPorMes || [],
          activityCalendar: data.activityCalendar || [],
          weeklyActivity: data.weeklyActivity || [],
        });
      } else {
        setDashboardData(generateFallbackData());
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setDashboardData(generateFallbackData());
    } finally {
      setLoading(false);
    }
  };

  const generateFallbackData = () => ({
    stats: { totalClientes: 0, totalLeads: 0, totalContratos: 0, ingresosMes: 0 },
    topAgentes: [],
    topColaboradores: [],
    ventasPorMes: [],
    activityCalendar: [],
    weeklyActivity: [],
  });

  const tabs = [
    { id: "general", label: "General" },
    { id: "facturacion", label: "Facturación" },
    { id: "colaboradores", label: "Colaboradores" },
    { id: "agentes", label: "Agentes" },
    { id: "pizarra", label: "Pizarra Semanal" },
  ];

  const getColorClasses = (color) => {
    const colors = {
      green: "text-green-500",
      yellow: "text-yellow-500",
      red: "text-primary",
    };
    return colors[color] || "text-primary";
  };

  const getProgressColorClasses = (color) => {
    const colors = {
      green: "bg-primary",
      yellow: "bg-yellow-500",
      red: "bg-primary",
    };
    return colors[color] || "bg-primary";
  };

  // Format comisiones for display (handles both number and string formats)
  const formatComisiones = (comisiones) => {
    if (typeof comisiones === 'number') {
      return `${comisiones.toLocaleString('es-ES')}€`;
    }
    // If already formatted as string, return as is
    return comisiones;
  };

  // Format role for display
  const formatRole = (role) => {
    if (role === 'agente') return 'Agente';
    if (role === 'colaborador') return 'Colaborador';
    return role;
  };

  const filteredAgentes = useMemo(() => {
    return dashboardData.topAgentes.filter((agente) =>
      agente.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [dashboardData.topAgentes, searchTerm]);

  const paginatedAgentes = useMemo(() => {
    return filteredAgentes.slice(0, entriesPerPage);
  }, [filteredAgentes, entriesPerPage]);

  // Get the top 3 users to display in the cards based on active tab
  const topCardsData = useMemo(() => {
    if (activeTab === "colaboradores") {
      return dashboardData.topColaboradores.slice(0, 3);
    }
    return dashboardData.topAgentes.slice(0, 3);
  }, [activeTab, dashboardData.topAgentes, dashboardData.topColaboradores]);

  const handleNavigateToContratos = () => {
    router.push('/contratos');
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="neumorphic-card p-8 rounded-xl">
            <span className="material-icons-outlined text-6xl text-primary animate-spin">
              refresh
            </span>
            <p className="mt-4 text-slate-600 dark:text-slate-400">Cargando dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Tabs */}
      <div className="mb-6 flex space-x-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2 rounded-lg bg-background-light dark:bg-background-dark shadow-neumorphic-light dark:shadow-neumorphic-dark hover:shadow-neumorphic-inset-light dark:hover:shadow-neumorphic-inset-dark transition-all duration-200 whitespace-nowrap ${
              activeTab === tab.id
                ? "shadow-neumorphic-inset-light dark:shadow-neumorphic-inset-dark font-semibold text-primary"
                : "font-medium text-slate-600 dark:text-slate-400"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Top 3 Cards - Muestra Agentes o Colaboradores según el tab activo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {topCardsData.map((agente, idx) => (
          <div
            key={agente.id || idx}
            className="neumorphic-card p-6 cursor-pointer hover:scale-[1.02] transition-transform"
            onClick={() => {
              const path = agente.role === 'colaborador' ? '/colaboradores' : '/agentes';
              router.push(`${path}/${agente.id}?name=${encodeURIComponent(agente.name)}`);
            }}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full neumorphic-card-inset p-1 flex items-center justify-center mr-4">
                  <span className="material-icons-outlined text-3xl text-slate-500">
                    person
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-100">
                    {agente.name}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {formatRole(agente.role)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-3xl font-bold ${getColorClasses(agente.color)}`}>
                  {agente.porcentaje}%
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">% Conv.</p>
              </div>
            </div>
            <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400 mb-2">
              <div className="flex justify-between">
                <span>Ventas</span>
                <span>{agente.ventas}</span>
              </div>
              <div className="flex justify-between">
                <span>Objetivo</span>
                <span>{agente.objetivo}</span>
              </div>
            </div>
            <div className="neumorphic-progress-track h-2.5">
              <div
                className={`h-full rounded-full ${getProgressColorClasses(agente.color)}`}
                style={{ width: `${agente.porcentaje}%` }}
              ></div>
            </div>
            <div className="flex justify-between items-center mt-2">
              <p className="font-bold text-lg text-slate-800 dark:text-slate-200">
                {formatComisiones(agente.comisiones)}
              </p>
              <p className={`text-sm flex items-center ${(agente.crecimiento ?? 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                <span className="material-icons-outlined text-base">
                  {(agente.crecimiento ?? 0) >= 0 ? 'arrow_upward' : 'arrow_downward'}
                </span>
                {Math.abs(agente.crecimiento ?? 0)}%
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Contenido según el tab activo */}
      {activeTab === "general" && (
        <>
          {/* Estadísticas Table */}
          <div className="neumorphic-card p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                Estadísticas de Agentes
              </h3>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <span className="material-icons-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    search
                  </span>
                  <input
                    className="neumorphic-card-inset pl-10 pr-4 py-2 rounded-lg border-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 text-sm w-48 transition-all duration-300 bg-transparent"
                    placeholder="Buscar agente..."
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="neumorphic-card-inset rounded-lg">
                  <select
                    className="bg-transparent border-none focus:ring-0 text-sm font-medium py-2 px-3"
                    value={entriesPerPage}
                    onChange={(e) => setEntriesPerPage(Number(e.target.value))}
                  >
                    <option>10</option>
                    <option>20</option>
                    <option>50</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Rank</th>
                    <th className="p-3">Nombre</th>
                    <th className="p-3">Ventas/Objetivo</th>
                    <th className="p-3">Comisiones</th>
                    <th className="p-3">% Objetivo</th>
                    <th className="p-3">% Crecimiento</th>
                    <th className="p-3">% Conversión</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedAgentes.map((agente, idx) => (
                    <tr
                      key={agente.id || idx}
                      className="table-row-divider cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      onClick={() => {
                        const path = agente.role === 'colaborador' ? '/colaboradores' : '/agentes';
                        router.push(`${path}/${agente.id}`);
                      }}
                    >
                      <td className="p-3 font-semibold">{idx + 1}</td>
                      <td className="p-3">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full neumorphic-card p-0.5 flex items-center justify-center mr-3">
                            <span className="material-icons-outlined text-xl text-slate-500">
                              person
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-slate-800 dark:text-slate-200">
                              {agente.name}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {formatRole(agente.role)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 font-medium">
                        {agente.ventas}/{agente.objetivo}
                      </td>
                      <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                        {formatComisiones(agente.comisiones)}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center">
                          <div className="w-24 neumorphic-progress-track h-2 mr-2">
                            <div
                              className={`h-full rounded-full ${getProgressColorClasses(agente.color)}`}
                              style={{ width: `${agente.porcentaje}%` }}
                            ></div>
                          </div>
                          <span>{agente.porcentaje}%</span>
                        </div>
                      </td>
                      <td className={`p-3 flex items-center ${(agente.crecimiento ?? 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        <span className="material-icons-outlined text-base">
                          {(agente.crecimiento ?? 0) >= 0 ? 'arrow_upward' : 'arrow_downward'}
                        </span>
                        {Math.abs(agente.crecimiento ?? 0)}%
                      </td>
                      <td className="p-3 font-medium">{agente.porcentaje}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredAgentes.length === 0 && (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                No se encontraron agentes
              </div>
            )}
            <div className="mt-4 text-sm text-slate-500 dark:text-slate-400 text-right">
              Mostrando {paginatedAgentes.length} de {filteredAgentes.length} agentes
            </div>
          </div>

          {/* Days Left and Historial */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="neumorphic-card p-6 col-span-1 md:col-span-2">
              <div className="flex justify-between items-center mb-4">
                <span className="text-4xl font-bold text-slate-800 dark:text-slate-100">
                  {Math.floor((new Date(new Date().getFullYear(), 11, 31) - new Date()) / (1000 * 60 * 60 * 24))}
                </span>
                <span className="font-semibold text-slate-600 dark:text-slate-400">
                  Days Left
                </span>
                <button
                  onClick={handleNavigateToContratos}
                  className="px-5 py-2 rounded-lg neumorphic-button font-medium text-slate-600 dark:text-slate-400 hover:text-primary transition-colors"
                >
                  Contratos
                </button>
              </div>
              <div className="neumorphic-progress-track h-2.5">
                <div
                  className="bg-primary h-full rounded-full"
                  style={{ width: `${((new Date().getMonth() + 1) / 12) * 100}%` }}
                ></div>
              </div>
              <p className="text-right text-sm mt-2 text-slate-500 dark:text-slate-400">
                {new Date().getMonth() + 1}/12 meses
              </p>
            </div>
            <div className="neumorphic-card p-6">
              <h3 className="font-semibold mb-4 text-slate-800 dark:text-slate-100">
                Historial de Puntos
              </h3>
              {dashboardData.weeklyActivity && dashboardData.weeklyActivity.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {dashboardData.weeklyActivity.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-300 truncate flex-1">{activity.name}</span>
                      <div className="flex items-center gap-2 ml-2">
                        <span className="font-semibold text-primary">{activity.total}</span>
                        <span className="text-slate-400 text-xs">pts</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-sm text-slate-500 dark:text-slate-400">
                  <p>No hay datos disponibles</p>
                </div>
              )}
            </div>
          </div>

          {/* Ventas por Mes Chart */}
          <VentasPorMesChart data={dashboardData.ventasPorMes} />

          {/* Calendario de Actividad */}
          <div className="neumorphic-card p-6 mb-8">
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">
              Calendario de Actividad
            </h3>
            {dashboardData.activityCalendar && dashboardData.activityCalendar.length > 0 ? (
              <div className="overflow-x-auto">
                <div className="flex gap-[3px] min-w-fit">
                  {/* Organizar en columnas de 7 (días de la semana) */}
                  {Array.from({ length: Math.ceil(dashboardData.activityCalendar.length / 7) }, (_, colIndex) => (
                    <div key={colIndex} className="flex flex-col gap-[3px]">
                      {dashboardData.activityCalendar.slice(colIndex * 7, (colIndex + 1) * 7).map((day, dayIndex) => (
                        <div
                          key={dayIndex}
                          className="w-[14px] h-[14px] rounded-sm transition-colors cursor-pointer hover:ring-2 hover:ring-teal-400 hover:ring-offset-1"
                          style={{
                            backgroundColor: day.value > 0
                              ? `rgba(20, 184, 166, ${Math.min(0.2 + (day.value / 15) * 0.8, 1)})`
                              : 'rgba(100, 116, 139, 0.1)'
                          }}
                          title={`Semana ${day.week}: ${day.value} contratos`}
                        />
                      ))}
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between mt-4 text-xs text-slate-500 dark:text-slate-400">
                  <span className="text-slate-400">Últimas 52 semanas</span>
                  <div className="flex items-center gap-2">
                    <span>Menos</span>
                    <div className="flex gap-[2px]">
                      <div className="w-[14px] h-[14px] rounded-sm" style={{ backgroundColor: 'rgba(100, 116, 139, 0.1)' }} />
                      {[0.3, 0.5, 0.7, 1].map((opacity, i) => (
                        <div
                          key={i}
                          className="w-[14px] h-[14px] rounded-sm"
                          style={{ backgroundColor: `rgba(20, 184, 166, ${opacity})` }}
                        />
                      ))}
                    </div>
                    <span>Más</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-24 text-sm text-slate-500 dark:text-slate-400">
                <p>No hay datos de actividad disponibles</p>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === "facturacion" && (
        <div className="space-y-6">
          {/* Métricas financieras */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Ingresos Totales */}
            <div className="neumorphic-card p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full neumorphic-card-inset p-1 flex items-center justify-center mr-4">
                    <span className="material-icons-outlined text-3xl text-slate-500">trending_up</span>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-100">Ingresos Totales</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Este mes</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-green-500">0%</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Meta</p>
                </div>
              </div>
              <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400 mb-2">
                <div className="flex justify-between"><span>Facturado</span><span>€0</span></div>
                <div className="flex justify-between"><span>Objetivo</span><span>€0</span></div>
              </div>
              <div className="neumorphic-progress-track h-2.5">
                <div className="bg-primary h-full rounded-full" style={{width: '0%'}}></div>
              </div>
              <div className="flex justify-between items-center mt-2">
                <p className="font-bold text-lg text-slate-800 dark:text-slate-200">€0</p>
                <p className="text-sm text-slate-500 flex items-center">
                  <span className="material-icons-outlined text-base">remove</span>0%
                </p>
              </div>
            </div>

            {/* Cobrado */}
            <div className="neumorphic-card p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full neumorphic-card-inset p-1 flex items-center justify-center mr-4">
                    <span className="material-icons-outlined text-3xl text-slate-500">account_balance_wallet</span>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-100">Cobrado</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Efectivo</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-blue-500">0%</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Del total</p>
                </div>
              </div>
              <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400 mb-2">
                <div className="flex justify-between"><span>Cobrado</span><span>€0</span></div>
                <div className="flex justify-between"><span>Total</span><span>€0</span></div>
              </div>
              <div className="neumorphic-progress-track h-2.5">
                <div className="bg-blue-500 h-full rounded-full" style={{width: '0%'}}></div>
              </div>
              <div className="flex justify-between items-center mt-2">
                <p className="font-bold text-lg text-slate-800 dark:text-slate-200">€0</p>
                <p className="text-sm text-slate-500 flex items-center">
                  <span className="material-icons-outlined text-base">remove</span>0%
                </p>
              </div>
            </div>

            {/* Pendiente */}
            <div className="neumorphic-card p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full neumorphic-card-inset p-1 flex items-center justify-center mr-4">
                    <span className="material-icons-outlined text-3xl text-slate-500">hourglass_empty</span>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-100">Pendiente</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Por cobrar</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-yellow-500">0%</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Del total</p>
                </div>
              </div>
              <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400 mb-2">
                <div className="flex justify-between"><span>Pendiente</span><span>€0</span></div>
                <div className="flex justify-between"><span>Vencido</span><span>€0</span></div>
              </div>
              <div className="neumorphic-progress-track h-2.5">
                <div className="bg-yellow-500 h-full rounded-full" style={{width: '0%'}}></div>
              </div>
              <div className="flex justify-between items-center mt-2">
                <p className="font-bold text-lg text-slate-800 dark:text-slate-200">€0</p>
                <p className="text-sm text-slate-500 flex items-center">
                  <span className="material-icons-outlined text-base">remove</span>0%
                </p>
              </div>
            </div>
          </div>

          {/* Gráfico de ingresos por tarifa */}
          <div className="neumorphic-card p-6">
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6">
              Ingresos por Tarifa
            </h3>
            <div className="flex items-center justify-center py-8 text-slate-500 dark:text-slate-400">
              <span className="material-icons-outlined text-4xl mr-3">bar_chart</span>
              <p>No hay datos de ingresos por tarifa disponibles</p>
            </div>
          </div>

          {/* Fuentes de ingreso */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="neumorphic-card p-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">
                Fuentes de Ingreso
              </h3>
              <div className="flex items-center justify-center py-8 text-slate-500 dark:text-slate-400">
                <span className="material-icons-outlined text-4xl mr-3">pie_chart</span>
                <p>No hay datos disponibles</p>
              </div>
            </div>

            <div className="neumorphic-card p-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">
                Objetivos de Venta
              </h3>
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                    Objetivo Mensual
                  </p>
                  <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">
                    €0
                  </p>
                </div>
                <div className="neumorphic-progress-track h-4">
                  <div
                    className="bg-primary h-full rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ width: '0%' }}
                  >
                    0%
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Alcanzado:</span>
                  <span className="font-medium text-primary">€0</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Restante:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">€0</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "colaboradores" && (
        <div className="space-y-6">
          {/* Distribución de clientes */}
          <div className="neumorphic-card p-6">
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6">
              Distribución de Clientes por Colaborador
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dashboardData.topColaboradores.map((colaborador, idx) => (
                <div
                  key={idx}
                  className="neumorphic-card-inset p-4 cursor-pointer hover:scale-[1.02] transition-transform"
                  onClick={() => router.push(`/colaboradores/${colaborador.id}?name=${encodeURIComponent(colaborador.name)}`)}
                >
                  <div className="flex items-center mb-3">
                    <div className="w-10 h-10 rounded-full neumorphic-card p-1 flex items-center justify-center mr-3">
                      <span className="material-icons-outlined text-2xl text-slate-500">
                        person
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-slate-800 dark:text-slate-200">
                        {colaborador.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {colaborador.ventas} clientes
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600 dark:text-slate-400">Activos</span>
                      <span className="font-medium">{Math.floor(colaborador.ventas * 0.8)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600 dark:text-slate-400">Pendientes</span>
                      <span className="font-medium">{Math.floor(colaborador.ventas * 0.15)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600 dark:text-slate-400">Cancelados</span>
                      <span className="font-medium">{Math.floor(colaborador.ventas * 0.05)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Métricas agregadas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="neumorphic-card p-6">
              <span className="material-icons-outlined text-3xl text-blue-500 mb-2">
                groups
              </span>
              <p className="text-sm text-slate-500 dark:text-slate-400">Total Colaboradores</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                {dashboardData.topColaboradores.length}
              </p>
            </div>
            <div className="neumorphic-card p-6">
              <span className="material-icons-outlined text-3xl text-green-500 mb-2">
                business_center
              </span>
              <p className="text-sm text-slate-500 dark:text-slate-400">Clientes Totales</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                {dashboardData.topColaboradores.reduce((sum, a) => sum + a.ventas, 0)}
              </p>
            </div>
            <div className="neumorphic-card p-6">
              <span className="material-icons-outlined text-3xl text-yellow-500 mb-2">
                star
              </span>
              <p className="text-sm text-slate-500 dark:text-slate-400">Promedio/Persona</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                {dashboardData.topColaboradores.length > 0 ? Math.floor(dashboardData.topColaboradores.reduce((sum, a) => sum + a.ventas, 0) / dashboardData.topColaboradores.length) : 0}
              </p>
            </div>
            <div className="neumorphic-card p-6">
              <span className="material-icons-outlined text-3xl text-purple-500 mb-2">
                trending_up
              </span>
              <p className="text-sm text-slate-500 dark:text-slate-400">Tasa de Conversión</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                {dashboardData.topColaboradores.length > 0
                  ? `${Math.round(dashboardData.topColaboradores.reduce((sum, a) => sum + (a.porcentaje || 0), 0) / dashboardData.topColaboradores.length)}%`
                  : '0%'}
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === "agentes" && (
        <div className="space-y-6">
          {/* Ranking de agentes */}
          <div className="neumorphic-card p-6">
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6">
              Ranking de Rendimiento
            </h3>
            <div className="space-y-4">
              {dashboardData.topAgentes.map((agente, idx) => (
                <div
                  key={idx}
                  className="neumorphic-card-inset p-4 cursor-pointer hover:scale-[1.01] transition-transform"
                  onClick={() => {
                    const path = agente.role === 'colaborador' ? '/colaboradores' : '/agentes';
                    router.push(`${path}/${agente.id}`);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center flex-1">
                      <div className="w-10 h-10 rounded-full neumorphic-card flex items-center justify-center mr-4">
                        <span className="font-bold text-primary">#{idx + 1}</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-800 dark:text-slate-200">
                          {agente.name}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-slate-500 dark:text-slate-400 mt-1">
                          <span>Ventas: {agente.ventas}</span>
                          <span>Objetivo: {agente.objetivo}</span>
                          <span className={getColorClasses(agente.color)}>
                            {agente.porcentaje}% Conv.
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">{formatComisiones(agente.comisiones)}</p>
                      <p className={`text-xs flex items-center justify-end ${(agente.crecimiento ?? 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        <span className="material-icons-outlined text-sm">
                          {(agente.crecimiento ?? 0) >= 0 ? 'arrow_upward' : 'arrow_downward'}
                        </span>
                        {Math.abs(agente.crecimiento ?? 0)}%
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 neumorphic-progress-track h-2">
                    <div
                      className={`h-full rounded-full ${getProgressColorClasses(agente.color)}`}
                      style={{ width: `${Math.min((agente.ventas / agente.objetivo) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contratos por compañía */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="neumorphic-card p-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">
                Contratos por Compañía
              </h3>
              <div className="flex items-center justify-center py-8 text-slate-500 dark:text-slate-400">
                <span className="material-icons-outlined text-4xl mr-3">business</span>
                <p>No hay datos de contratos disponibles</p>
              </div>
            </div>

            <div className="neumorphic-card p-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">
                Posibles Renovaciones
              </h3>
              <div className="text-center mb-4">
                <p className="text-5xl font-bold text-primary">0</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                  Contratos próximos a vencer
                </p>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Este mes</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Próximo mes</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">2 meses</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">0</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "pizarra" && (
        <div className="space-y-6">
          {/* Ventas en vivo */}
          <div className="neumorphic-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                Ventas en Vivo
              </h3>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  Actualizado: {new Date().toLocaleTimeString()}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="neumorphic-card-inset p-6 text-center">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Ventas Hoy</p>
                <p className="text-4xl font-bold text-primary">0</p>
                <p className="text-xs text-slate-500 mt-2">
                  Sin datos de ayer
                </p>
              </div>
              <div className="neumorphic-card-inset p-6 text-center">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Esta Semana</p>
                <p className="text-4xl font-bold text-slate-800 dark:text-slate-100">0</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  Sin objetivo configurado
                </p>
              </div>
              <div className="neumorphic-card-inset p-6 text-center">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Promedio/Día</p>
                <p className="text-4xl font-bold text-slate-800 dark:text-slate-100">0</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  Últimos 7 días
                </p>
              </div>
            </div>
          </div>

          {/* Ventas por turno */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="neumorphic-card p-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">
                Ventas por Turno - Hoy
              </h3>
              <div className="space-y-4">
                {[
                  { turno: "Mañana", horario: "09:00 - 14:00", ventas: 0, color: "bg-yellow-500" },
                  { turno: "Tarde", horario: "14:00 - 20:00", ventas: 0, color: "bg-blue-500" },
                ].map((item, idx) => (
                  <div key={idx} className="neumorphic-card-inset p-4">
                    <div className="flex justify-between mb-2">
                      <div>
                        <p className="font-medium text-slate-800 dark:text-slate-200">
                          {item.turno}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {item.horario}
                        </p>
                      </div>
                      <p className="text-2xl font-bold text-primary">{item.ventas}</p>
                    </div>
                    <div className="neumorphic-progress-track h-3">
                      <div
                        className={`h-full rounded-full ${item.color}`}
                        style={{ width: '0%' }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="neumorphic-card p-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">
                Top Vendedores Hoy
              </h3>
              {dashboardData.topAgentes.length > 0 ? (
                <div className="space-y-3">
                  {dashboardData.topAgentes.slice(0, 5).map((agente, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between neumorphic-card-inset p-3 cursor-pointer hover:scale-[1.01] transition-transform"
                      onClick={() => {
                        const path = agente.role === 'colaborador' ? '/colaboradores' : '/agentes';
                        router.push(`${path}/${agente.id}`);
                      }}
                    >
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full neumorphic-card flex items-center justify-center mr-3">
                          <span className="text-sm font-bold text-primary">#{idx + 1}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                            {agente.name}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {agente.ventasHoy || 0} ventas hoy
                          </p>
                        </div>
                      </div>
                      <span className="material-icons-outlined text-yellow-500">
                        emoji_events
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center py-8 text-slate-500 dark:text-slate-400">
                  <span className="material-icons-outlined text-4xl mr-3">people</span>
                  <p>No hay datos de vendedores disponibles</p>
                </div>
              )}
            </div>
          </div>

          {/* Botón actualizar */}
          <div className="flex justify-center">
            <button
              onClick={fetchDashboardData}
              className="px-8 py-3 rounded-lg neumorphic-button font-medium text-slate-600 dark:text-slate-400 hover:text-primary transition-colors"
            >
              <span className="material-icons-outlined align-middle mr-2">refresh</span>
              Actualizar datos
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
