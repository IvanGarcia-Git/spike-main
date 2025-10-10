'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CalendarIcon,
  UserGroupIcon,
  DocumentTextIcon,
  CurrencyEuroIcon,
  ChartBarIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  ClockIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  UserIcon,
  PhoneIcon
} from '@heroicons/react/24/outline'
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/20/solid'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  FaUser,
  FaUsers,
  FaBriefcase,
  FaBuilding,
  FaFileContract
} from 'react-icons/fa'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

function getRoleLabel(role) {
  const roleLabels = {
    'admin': 'Administrador',
    'agente': 'Agente',
    'colaborador': 'Colaborador'
  }
  return roleLabels[role] || role || 'Usuario'
}

export default function Dashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [activeView, setActiveView] = useState('general') // general, facturacion, colaboradores, agentes, pizarra
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [activeTurno, setActiveTurno] = useState('todos') // todos, manana, tarde
  const [activeCompanyTab, setActiveCompanyTab] = useState('luz') // luz, gas, telefonia
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalClientes: 0,
      totalLeads: 0,
      totalContratos: 0,
      ingresosMes: 0
    },
    topAgentes: [],
    estadosLeads: [],
    ventasPorMes: [],
    proximasLiquidaciones: [],
    weeklyActivity: [],
    contractsByState: [],
    activityCalendar: [],
    financialMetrics: {
      ingresos: 0,
      retornos: 0,
      beneficio: 0,
      ingresosChange: 0,
      retornosChange: 0,
      beneficioChange: 0
    },
    salesVsTarget: [],
    historicalLiquidations: []
  })

  // Estados específicos por vista
  const [facturacionData, setFacturacionData] = useState({
    ingresosPorTarifa: null,
    cobradoVsPorCobrar: null,
    fuentesIngreso: [],
    objetivosVenta: null,
    ingresosRecurrentes: null
  })

  const [colaboradorData, setColaboradorData] = useState({
    stats: null,
    clientesPorTipo: null,
    historialComisiones: [],
    cumplimientoObjetivo: null,
    historicoMensual: [],
    tiemposActivacion: [],
    posiblesRenovaciones: null
  })

  const [colaboradoresData, setColaboradoresData] = useState({
    distribucionClientes: null,
    metricasAgregadas: null
  })

  const [clientesData, setClientesData] = useState({
    distribucion: null,
    porServicios: null,
    porCompania: [],
    referidos: [],
    renovables: null
  })

  const [agentesData, setAgentesData] = useState({
    distribucionClientes: null,
    posiblesRenovaciones: null,
    contratosPorCompania: null,
    metricasAgregadas: null
  })

  const [pizarraData, setPizarraData] = useState({
    enVivo: null,
    ventasPorTurno: null,
    ultimaActualizacion: null
  })

  useEffect(() => {
    fetchDashboardData()
  }, [])

  useEffect(() => {
    if (activeView === 'facturacion') {
      fetchFacturacionData()
    } else if (activeView === 'colaboradores') {
      if (selectedUser) {
        fetchColaboradorData(selectedUser)
      }
      fetchColaboradoresData()
    } else if (activeView === 'agentes') {
      fetchAgentesData()
    } else if (activeView === 'pizarra') {
      fetchPizarraData()
    }
  }, [activeView, selectedUser])

  // Auto-refresh para Pizarra cada 30 segundos
  useEffect(() => {
    let intervalId
    if (activeView === 'pizarra') {
      intervalId = setInterval(() => {
        fetchPizarraData()
      }, 30000)
    }
    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [activeView])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      // Fetch complete dashboard data from Next.js API route
      const response = await fetch('/api/dashboard', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const dashboardResponse = await response.json()

        setDashboardData({
          stats: dashboardResponse.stats || {
            totalClientes: 0,
            totalLeads: 0,
            totalContratos: 0,
            ingresosMes: 0
          },
          topAgentes: dashboardResponse.topAgentes || [],
          estadosLeads: dashboardResponse.estadosLeads || [],
          ventasPorMes: dashboardResponse.ventasPorMes || [],
          proximasLiquidaciones: dashboardResponse.proximasLiquidaciones || [],
          weeklyActivity: dashboardResponse.weeklyActivity || [],
          contractsByState: dashboardResponse.contractsByState || [],
          activityCalendar: dashboardResponse.activityCalendar || [],
          financialMetrics: dashboardResponse.financialMetrics || {
            ingresos: 0,
            retornos: 0,
            beneficio: 0,
            ingresosChange: 0,
            retornosChange: 0,
            beneficioChange: 0
          },
          salesVsTarget: dashboardResponse.salesVsTarget || [],
          historicalLiquidations: dashboardResponse.historicalLiquidations || []
        })

        // Establecer el primer usuario como seleccionado por defecto
        if (dashboardResponse.topAgentes && dashboardResponse.topAgentes.length > 0) {
          setSelectedUser(dashboardResponse.topAgentes[0].id)
        }
      } else {
        throw new Error('Failed to fetch dashboard data')
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      // Use fallback data if API fails
      setDashboardData(generateFallbackData())
    } finally {
      setLoading(false)
    }
  }

  const fetchFacturacionData = async () => {
    try {
      const [ingresos, cobrado, fuentes, objetivos, recurrentes] = await Promise.all([
        fetch('/api/dashboard/facturacion/ingresos-por-tarifa').then(r => r.json()),
        fetch('/api/dashboard/facturacion/cobrado-vs-por-cobrar').then(r => r.json()),
        fetch('/api/dashboard/facturacion/fuentes-ingreso').then(r => r.json()),
        fetch('/api/dashboard/facturacion/objetivos-venta').then(r => r.json()),
        fetch('/api/dashboard/facturacion/ingresos-recurrentes').then(r => r.json())
      ])

      setFacturacionData({
        ingresosPorTarifa: ingresos,
        cobradoVsPorCobrar: cobrado,
        fuentesIngreso: fuentes,
        objetivosVenta: objetivos,
        ingresosRecurrentes: recurrentes
      })
    } catch (error) {
      console.error('Error fetching facturacion data:', error)
    }
  }

  const fetchColaboradorData = async (userId) => {
    try {
      const [stats, clientesPorTipo, historial, cumplimiento, historico, tiempos, renovaciones] = await Promise.all([
        fetch(`/api/dashboard/colaborador/${userId}/stats`).then(r => r.json()),
        fetch(`/api/dashboard/colaborador/${userId}/clientes-por-tipo`).then(r => r.json()),
        fetch(`/api/dashboard/colaborador/${userId}/historial-comisiones?limit=10`).then(r => r.json()),
        fetch(`/api/dashboard/colaborador/${userId}/cumplimiento-objetivo`).then(r => r.json()),
        fetch(`/api/dashboard/colaborador/${userId}/historico-mensual?meses=6`).then(r => r.json()),
        fetch('/api/dashboard/tiempos-activacion').then(r => r.json()),
        fetch(`/api/dashboard/colaborador/${userId}/posibles-renovaciones`).then(r => r.json())
      ])

      setColaboradorData({
        stats,
        clientesPorTipo,
        historialComisiones: historial,
        cumplimientoObjetivo: cumplimiento,
        historicoMensual: historico,
        tiemposActivacion: tiempos,
        posiblesRenovaciones: renovaciones
      })
    } catch (error) {
      console.error('Error fetching colaborador data:', error)
    }
  }

  const fetchClientesData = async () => {
    try {
      const [distribucion, servicios, compania, referidos, renovables] = await Promise.all([
        fetch('/api/dashboard/clientes/distribucion').then(r => r.json()),
        fetch('/api/dashboard/clientes/por-servicios').then(r => r.json()),
        fetch('/api/dashboard/clientes/por-compania').then(r => r.json()),
        fetch('/api/dashboard/clientes/referidos').then(r => r.json()),
        fetch('/api/dashboard/contratos/renovables').then(r => r.json())
      ])

      setClientesData({
        distribucion,
        porServicios: servicios,
        porCompania: Array.isArray(compania) ? compania : [],
        referidos,
        renovables
      })
    } catch (error) {
      console.error('Error fetching clientes data:', error)
    }
  }

  const fetchColaboradoresData = async () => {
    try {
      const [distribucionClientes, metricasAgregadas] = await Promise.all([
        fetch('/api/dashboard/colaboradores/distribucion-clientes').then(r => r.json()),
        fetch('/api/dashboard/colaboradores/metricas-agregadas').then(r => r.json())
      ])

      setColaboradoresData({
        distribucionClientes,
        metricasAgregadas
      })
    } catch (error) {
      console.error('Error fetching colaboradores data:', error)
    }
  }

  const fetchAgentesData = async () => {
    try {
      const [distribucionClientes, posiblesRenovaciones, contratosPorCompania, metricasAgregadas] = await Promise.all([
        fetch('/api/dashboard/agentes/distribucion-clientes').then(r => r.json()),
        fetch('/api/dashboard/agentes/posibles-renovaciones').then(r => r.json()),
        fetch('/api/dashboard/agentes/contratos-por-compania').then(r => r.json()),
        fetch('/api/dashboard/agentes/metricas-agregadas').then(r => r.json())
      ])

      setAgentesData({
        distribucionClientes,
        posiblesRenovaciones,
        contratosPorCompania,
        metricasAgregadas
      })
    } catch (error) {
      console.error('Error fetching agentes data:', error)
    }
  }

  const fetchPizarraData = async () => {
    try {
      const [enVivo, ventasPorTurno] = await Promise.all([
        fetch('/api/dashboard/pizarra/en-vivo').then(r => r.json()),
        fetch('/api/dashboard/pizarra/ventas-por-turno').then(r => r.json())
      ])

      setPizarraData({
        enVivo,
        ventasPorTurno,
        ultimaActualizacion: new Date()
      })
    } catch (error) {
      console.error('Error fetching pizarra data:', error)
    }
  }

  const generateFallbackData = () => {
    // Fallback data in case API fails
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    return {
      stats: {
        totalClientes: 1340,
        totalLeads: 725,
        totalContratos: 540,
        ingresosMes: 12500
      },
      topAgentes: [
        {
          id: 1,
          name: 'Carlos Garcia',
          role: 'Salesman',
          ventas: 280,
          objetivo: 140,
          comisiones: 1570,
          porcentaje: 92,
          trend: 'up',
          trendValue: 20,
          avatar: null
        },
        {
          id: 2,
          name: 'Daniel Ken',
          role: 'Salesman',
          ventas: 160,
          objetivo: 140,
          comisiones: 800,
          porcentaje: 75,
          trend: 'up',
          trendValue: 4,
          avatar: null
        },
        {
          id: 3,
          name: 'Jennifer Tan',
          role: 'Salesman',
          ventas: 124,
          objetivo: 140,
          comisiones: 650,
          porcentaje: 45,
          trend: 'down',
          trendValue: 31,
          avatar: null
        }
      ],
      estadosLeads: [
        { name: 'Pagado', count: 100, percentage: 76 },
        { name: 'Activo', count: 50, percentage: 24 },
        { name: 'Pendiente', count: 30, percentage: 15 }
      ],
      ventasPorMes: months.map(month => ({
        month,
        value: Math.floor(Math.random() * 10) + 1
      })),
      proximasLiquidaciones: [],
      weeklyActivity: [],
      contractsByState: [],
      activityCalendar: [],
      financialMetrics: {
        ingresos: 12500,
        retornos: -11000,
        beneficio: 3500,
        ingresosChange: 15,
        retornosChange: -4,
        beneficioChange: 12
      },
      salesVsTarget: [],
      historicalLiquidations: []
    }
  }

  const filteredAgentes = dashboardData.topAgentes.filter(agent =>
    agent.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border rounded shadow">
          <p className="text-sm font-medium">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-xs" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  // Calculate days remaining percentage
  const diasRestantes = 119
  const diasTotal = 365
  const diasPorcentaje = (diasRestantes / diasTotal) * 100

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 bg-gray-50 min-h-screen">
      {/* Header con título y tabs */}
      <div className="mb-6">
        <div className="flex flex-col space-y-4">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveView('general')}
              className={classNames(
                'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                activeView === 'general'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              )}
            >
              General
            </button>
            <button
              onClick={() => setActiveView('facturacion')}
              className={classNames(
                'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                activeView === 'facturacion'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              )}
            >
              Facturación
            </button>
            <button
              onClick={() => setActiveView('colaboradores')}
              className={classNames(
                'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                activeView === 'colaboradores'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              )}
            >
              Colaboradores
            </button>
            <button
              onClick={() => setActiveView('agentes')}
              className={classNames(
                'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                activeView === 'agentes'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              )}
            >
              Agentes
            </button>
            <button
              onClick={() => setActiveView('pizarra')}
              className={classNames(
                'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                activeView === 'pizarra'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              )}
            >
              Pizarra Semanal
            </button>
          </div>
        </div>
      </div>

      {/* Top 3 Agentes Cards - Siempre visible */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {dashboardData.topAgentes.slice(0, 3).map((agente, idx) => (
          <div
            key={agente.id}
            className="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => {
              const path = agente.role === 'colaborador' ? '/colaboradores' : '/agentes';
              router.push(`${path}/${agente.id}`)
            }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="text-xs text-gray-500">#{idx + 1}</div>
                <Avatar className="h-10 w-10">
                  <AvatarImage src={agente.avatar || '/avatar.png'} alt={agente.name} />
                  <AvatarFallback className="bg-blue-500 text-white">
                    {agente.name?.charAt(0) || 'A'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-gray-900">{agente.name}</p>
                  <p className="text-xs text-gray-500">{getRoleLabel(agente.role)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">{agente.porcentaje}%</p>
                <p className="text-xs text-gray-500">% Conv</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500">Ventas</span>
                  <span className="font-medium">{agente.ventas}</span>
                </div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500">Objetivo</span>
                  <span className="font-medium">{agente.objetivo}</span>
                </div>
              </div>
              
              <div className="relative">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${Math.min(100, (agente.ventas / agente.objetivo * 100))}%` }}
                  />
                </div>
                <div className="text-center text-xs text-gray-600 mt-1">
                  {Math.round(agente.ventas / agente.objetivo * 100)}%
                </div>
              </div>
              
              <div className="flex justify-between items-center pt-2">
                <span className="text-green-600 font-bold text-sm">${agente.comisiones}</span>
                <span className={classNames(
                  'flex items-center text-xs font-medium',
                  agente.trend === 'up' ? 'text-green-600' : 'text-red-600'
                )}>
                  {agente.trend === 'up' ? '↑' : '↓'} {agente.trendValue}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Vista General */}
      {activeView === 'general' && (
        <>
          {/* Estadísticas de Agentes */}
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Estadísticas</h2>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search..."
                      className="pl-8 pr-4 py-1 border rounded-lg text-sm"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <MagnifyingGlassIcon className="absolute left-2 top-1.5 h-4 w-4 text-gray-400" />
                  </div>
                  <select className="border rounded-lg px-3 py-1 text-sm">
                    <option>10</option>
                    <option>25</option>
                    <option>50</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 text-xs uppercase text-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left">Rank</th>
                    <th className="px-4 py-3 text-left">Nombre</th>
                    <th className="px-4 py-3 text-left">Ventas/Objetivo</th>
                    <th className="px-4 py-3 text-left">Comisiones</th>
                    <th className="px-4 py-3 text-left">% Objetivo</th>
                    <th className="px-4 py-3 text-left">% Crecimiento</th>
                    <th className="px-4 py-3 text-left">% Conversión</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredAgentes.map((agente, idx) => (
                    <tr
                      key={agente.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        const path = agente.role === 'colaborador' ? '/colaboradores' : '/agentes';
                        router.push(`${path}/${agente.id}`)
                      }}
                    >
                      <td className="px-4 py-3 text-sm">
                        <span className="text-red-500">{idx + 1}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={agente.avatar || '/avatar.png'} alt={agente.name} />
                            <AvatarFallback className="bg-blue-500 text-white text-xs">
                              {agente.name?.charAt(0) || 'A'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="ml-3">
                            <p className="text-sm font-medium">{agente.name}</p>
                            <p className="text-xs text-gray-500">{getRoleLabel(agente.role)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {agente.ventas}/{agente.objetivo}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={agente.comisiones > 0 ? 'text-green-600 font-bold' : 'text-red-600'}>
                          ${agente.comisiones}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${Math.min(100, agente.porcentaje)}%` }}
                            />
                          </div>
                          <span className="text-xs">{agente.porcentaje}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={classNames(
                          'flex items-center',
                          agente.trend === 'up' ? 'text-green-600' : 'text-red-600'
                        )}>
                          {agente.trend === 'up' ? '↑' : '↓'} {agente.trendValue}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {agente.porcentaje}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Row de widgets */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Days Left */}
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl font-bold">{diasRestantes}</span>
                <span className="text-sm text-gray-500">Days Left</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-500 h-3 rounded-full"
                  style={{ width: `${diasPorcentaje}%` }}
                />
              </div>
              <div className="text-center text-xs text-gray-600 mt-2">
                {diasRestantes}/{diasTotal}
              </div>
            </div>

            {/* Estados de Contratos */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-sm font-semibold mb-3">Contratos</h3>
              <div className="space-y-2">
                {dashboardData.contractsByState.map((state, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">{state.name}</span>
                    <span className={classNames(
                      'font-bold text-xs',
                      state.name === 'Cancelados' ? 'text-red-600' : 
                      state.name === 'Activos' ? 'text-green-600' : 
                      state.name === 'En proceso' ? 'text-yellow-600' : 
                      'text-gray-600'
                    )}>
                      {state.percentage}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Historial de Puntos */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-sm font-semibold mb-3">Historial de Puntos</h3>
              <div className="h-24">
                {dashboardData.activityCalendar.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dashboardData.activityCalendar.slice(-10)}>
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#3B82F6" 
                        fill="#93C5FD" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400 text-xs">
                    No hay datos disponibles
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Gráfico de Ventas por Mes */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <h3 className="text-lg font-semibold mb-4">Ventas por Mes</h3>
            <div className="h-64">
              {dashboardData.ventasPorMes.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dashboardData.ventasPorMes}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  No hay datos de ventas disponibles
                </div>
              )}
            </div>
          </div>

          {/* Gráfico de barras de actividad */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <h3 className="text-sm font-semibold mb-3">Calendario de Actividad</h3>
            <div className="h-32">
              {dashboardData.activityCalendar.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dashboardData.activityCalendar}>
                    <Bar dataKey="value" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400 text-xs">
                  No hay datos de actividad disponibles
                </div>
              )}
            </div>
          </div>

          {/* Estados de Leads */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <h3 className="text-lg font-semibold mb-4">Estados de Leads</h3>
            <div className="space-y-3">
              {dashboardData.estadosLeads.map((estado) => (
                <div key={estado.name} className="flex items-center justify-between">
                  <span className="text-sm font-medium w-24">{estado.name}</span>
                  <div className="flex-1 mx-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={classNames(
                          'h-2 rounded-full',
                          estado.name === 'Rechazado' ? 'bg-red-500' : 'bg-blue-500'
                        )}
                        style={{ width: `${estado.percentage}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium w-10 text-right">{estado.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Vista Agentes */}
      {activeView === 'agentes' && (
        <>
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Estadísticas de Agentes</h2>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Buscar agente..."
                    className="px-3 py-1 border rounded-lg text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 text-xs uppercase text-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left">Rank</th>
                    <th className="px-4 py-3 text-left">Nombre</th>
                    <th className="px-4 py-3 text-left">Ventas/Objetivo</th>
                    <th className="px-4 py-3 text-left">Comisiones</th>
                    <th className="px-4 py-3 text-left">% Objetivo</th>
                    <th className="px-4 py-3 text-left">Crecimiento</th>
                    <th className="px-4 py-3 text-left">Turno</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredAgentes.map((agente, idx) => (
                    <tr
                      key={agente.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        const path = agente.role === 'colaborador' ? '/colaboradores' : '/agentes';
                        router.push(`${path}/${agente.id}`)
                      }}
                    >
                      <td className="px-4 py-3 text-sm">
                        <span className="text-red-500 font-bold">{idx + 1}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={agente.avatar || '/avatar.png'} alt={agente.name} />
                            <AvatarFallback className="bg-blue-500 text-white text-xs">
                              {agente.name?.charAt(0) || 'A'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="ml-3">
                            <p className="text-sm font-medium">{agente.name}</p>
                            <p className="text-xs text-gray-500">{getRoleLabel(agente.role)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {agente.ventas}/{agente.objetivo}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="text-green-600 font-bold">
                          €{agente.comisiones}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${Math.min(100, agente.porcentaje)}%` }}
                            />
                          </div>
                          <span className="text-xs">{agente.porcentaje}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={classNames(
                          'flex items-center',
                          agente.trend === 'up' ? 'text-green-600' : 'text-red-600'
                        )}>
                          {agente.trend === 'up' ? '↑' : '↓'} {agente.trendValue}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                          Mañana
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>


          {/* Secciones adicionales con datos agregados de todos los agentes */}
          {agentesData.metricasAgregadas && (
            <>
              {/* Days Left y Contratos/Activos */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                {/* Days Left */}
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow p-6 text-white">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold opacity-90">Days Left</span>
                  </div>
                  <div className="mb-2">
                    <p className="text-4xl font-bold">
                      {(() => {
                        const currentDate = new Date();
                        const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
                        const currentDay = currentDate.getDate();
                        return daysInMonth - currentDay;
                      })()}
                    </p>
                    <p className="text-sm opacity-75">
                      / {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()} días
                    </p>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <div
                      className="bg-white h-2 rounded-full"
                      style={{
                        width: `${Math.round((new Date().getDate() / new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()) * 100)}%`
                      }}
                    />
                  </div>
                  <p className="text-xs mt-2 opacity-75">53% del mes</p>
                </div>

                {/* Confirmados */}
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-600">Confirmados</span>
                    <span className="text-green-500">●</span>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">0</p>
                  <p className="text-xs text-gray-500 mt-1">Contratos confirmados</p>
                </div>

                {/* Activos */}
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-600">Activos</span>
                    <span className="text-green-500">●</span>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">
                    {agentesData.metricasAgregadas.contratosAgregados?.activos || 0}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Contratos activos</p>
                </div>

                {/* Por Activarse */}
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-600">Por Activarse</span>
                    <span className="text-yellow-500">●</span>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">
                    {agentesData.metricasAgregadas.contratosAgregados?.porActivarse || 0}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Pendientes de activación</p>
                </div>

                {/* Cancelados */}
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-600">Cancelados</span>
                    <span className="text-red-500">●</span>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">
                    {agentesData.metricasAgregadas.contratosAgregados?.cancelados || 0}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Contratos cancelados</p>
                </div>
              </div>

              {/* Gráficas: Media Mensual, % Conversión, Comisión Media */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {/* Media Mensual */}
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-gray-600">Media Mensual</h3>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-3xl font-bold text-gray-900">
                        {agentesData.metricasAgregadas.mediaMensual?.value || 12}
                      </span>
                      <span className="text-sm text-gray-500">€/día</span>
                      <span className="text-sm text-green-600 font-medium">+12%</span>
                    </div>
                  </div>
                  <div className="h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={agentesData.metricasAgregadas.mediaMensual?.data && agentesData.metricasAgregadas.mediaMensual.data.length > 0 ? agentesData.metricasAgregadas.mediaMensual.data : [
                        { month: 'Ene', value: 8 },
                        { month: 'Feb', value: 10 },
                        { month: 'Mar', value: 11 },
                        { month: 'Abr', value: 9 },
                        { month: 'May', value: 13 },
                        { month: 'Jun', value: 12 }
                      ]}>
                        <defs>
                          <linearGradient id="colorMedia" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke="#3B82F6"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorMedia)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* % Conversión */}
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-gray-600">% Conversión</h3>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-3xl font-bold text-gray-900">
                        {agentesData.metricasAgregadas.conversion?.percentage || 39.6}
                      </span>
                      <span className="text-sm text-gray-500">%</span>
                      <span className="text-sm text-red-600 font-medium">-4%</span>
                    </div>
                  </div>
                  <div className="h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={agentesData.metricasAgregadas.conversion?.data && agentesData.metricasAgregadas.conversion.data.length > 0 ? agentesData.metricasAgregadas.conversion.data : [
                        { month: 'Ene', value: 42 },
                        { month: 'Feb', value: 45 },
                        { month: 'Mar', value: 43 },
                        { month: 'Abr', value: 40 },
                        { month: 'May', value: 38 },
                        { month: 'Jun', value: 39.6 }
                      ]}>
                        <defs>
                          <linearGradient id="colorConversion" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke="#10B981"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorConversion)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Comisión Media */}
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-gray-600">Comisión Media</h3>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-3xl font-bold text-gray-900">
                        {agentesData.metricasAgregadas.comisionMedia?.value || 349.3}
                      </span>
                      <span className="text-sm text-gray-500">€</span>
                      <span className="text-sm text-red-600 font-medium">-4%</span>
                    </div>
                  </div>
                  <div className="h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={agentesData.metricasAgregadas.comisionMedia?.data && agentesData.metricasAgregadas.comisionMedia.data.length > 0 ? agentesData.metricasAgregadas.comisionMedia.data : [
                        { month: 'Ene', value: 380 },
                        { month: 'Feb', value: 390 },
                        { month: 'Mar', value: 370 },
                        { month: 'Abr', value: 360 },
                        { month: 'May', value: 340 },
                        { month: 'Jun', value: 349.3 }
                      ]}>
                        <defs>
                          <linearGradient id="colorComision" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#EC4899" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#EC4899" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke="#EC4899"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorComision)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Histórico de Comisiones (Tabla) */}
              {agentesData.metricasAgregadas.historicoComisiones &&
               agentesData.metricasAgregadas.historicoComisiones.length > 0 && (
                <div className="bg-white rounded-lg shadow mb-6">
                  <div className="p-4 border-b">
                    <h3 className="text-lg font-semibold">Histórico de Comisiones (Total)</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mes</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Comisión</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ventas/Objetivo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {agentesData.metricasAgregadas.historicoComisiones.map((item, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.mes}</td>
                            <td className="px-6 py-4 text-sm text-green-600 font-bold">€{item.comision?.toLocaleString() || 0}</td>
                            <td className="px-6 py-4 text-sm text-gray-500">{item.ventasObjetivo}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Grid de 3 columnas: Historial Puntos + Puntos medioventa + Estados */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* Historial de Puntos */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-sm font-semibold text-gray-600 mb-4">Historial de Puntos</h3>
                  <div className="space-y-2">
                    {['Cliente 1', 'Cliente 2', 'Cliente 3', 'Cliente 4', 'Cliente 5', 'Cliente 6'].map((cliente, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">{cliente}</span>
                        <span className="font-bold text-gray-900">+{(Math.random() * 10).toFixed(1)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-600">Puntos Restantes</span>
                      <span className="text-2xl font-bold text-blue-600">
                        {agentesData.metricasAgregadas.cumplimientoObjetivo?.objetivo -
                         agentesData.metricasAgregadas.cumplimientoObjetivo?.ventas || 22}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Puntos medioventa */}
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-gray-600">Puntos medioventa</h3>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-3xl font-bold text-gray-900">5.6</span>
                      <span className="text-sm text-green-600 font-medium">+12%</span>
                    </div>
                  </div>
                  <div className="h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={agentesData.metricasAgregadas.historicoMensual && agentesData.metricasAgregadas.historicoMensual.length > 0 ?
                        agentesData.metricasAgregadas.historicoMensual.slice(0, 6).map(item => ({
                          month: item.mes,
                          value: item.contratos || 0
                        })) : [
                        { month: 'Ene', value: 4.8 },
                        { month: 'Feb', value: 5.2 },
                        { month: 'Mar', value: 5.5 },
                        { month: 'Abr', value: 5.0 },
                        { month: 'May', value: 5.8 },
                        { month: 'Jun', value: 5.6 }
                      ]}>
                        <defs>
                          <linearGradient id="colorPuntos" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#FBBF24" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#FBBF24" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke="#FBBF24"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorPuntos)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Estados (Barras Horizontales) */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-sm font-semibold text-gray-600 mb-4">Estados</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-600">Pagado</span>
                        <span className="font-semibold">76%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: '76%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-600">Activo</span>
                        <span className="font-semibold">24%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: '24%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-600">Pdte. Firma</span>
                        <span className="font-semibold">76%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: '76%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-600">...</span>
                        <span className="font-semibold">24%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: '24%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-600">...</span>
                        <span className="font-semibold">76%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: '76%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-600">...</span>
                        <span className="font-semibold">24%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: '24%' }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Grid de 2 columnas: Distribución + Métricas adicionales */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Distribución (Gráfica de Pastel con iconos) */}
                {agentesData.distribucionClientes && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">Distribución</h3>
                    <div className="flex items-center justify-center mb-4">
                      <div className="relative">
                        <ResponsiveContainer width={200} height={200}>
                          <PieChart>
                            <Pie
                              data={[
                                {
                                  name: 'Particulares',
                                  value: agentesData.distribucionClientes.particulares?.cantidad || 62,
                                  color: '#EC4899'
                                },
                                {
                                  name: 'Empresas',
                                  value: agentesData.distribucionClientes.empresas?.cantidad || 6,
                                  color: '#6366F1'
                                },
                                {
                                  name: 'Otros',
                                  value: 16,
                                  color: '#8B5CF6'
                                }
                              ]}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {[
                                { color: '#EC4899' },
                                { color: '#6366F1' },
                                { color: '#8B5CF6' }
                              ].map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <div className="flex items-center justify-center space-x-2">
                              <FaUser className="text-2xl text-pink-500" />
                              <FaBriefcase className="text-2xl text-indigo-500" />
                              <FaBuilding className="text-2xl text-purple-500" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-center space-x-4 text-sm">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-pink-500 rounded-full mr-2"></div>
                        <span className="text-gray-600">62%</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-indigo-500 rounded-full mr-2"></div>
                        <span className="text-gray-600">6%</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                        <span className="text-gray-600">16%</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tiempo medio Activ */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">Tiempo medio Activ</h3>
                  <div className="space-y-3">
                    {(agentesData.metricasAgregadas?.tiemposActivacion && agentesData.metricasAgregadas.tiemposActivacion.length > 0
                      ? agentesData.metricasAgregadas.tiemposActivacion.slice(0, 4)
                      : [
                          { promedioDias: 4, compania: 'Natargy' },
                          { promedioDias: 8, compania: 'Endesa' },
                          { promedioDias: 2, compania: 'Iberdrola' },
                          { promedioDias: 5, compania: 'Repsol' }
                        ]
                    ).map((tiempo, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium text-gray-900">{tiempo.promedioDias} días</span>
                          <span className="text-sm text-gray-500">{tiempo.compania}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Grid de 3 columnas: Total Clientes, Referidos, Contratos */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {/* Total Clientes */}
                {agentesData.distribucionClientes && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-600">Total Clientes</span>
                      <FaUsers className="text-blue-500 text-2xl" />
                    </div>
                    <p className="text-4xl font-bold text-gray-900">
                      {agentesData.distribucionClientes.total || 1340}
                    </p>
                  </div>
                )}

                {/* Referidos */}
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-600">Referidos</span>
                    <FaUser className="text-blue-500 text-2xl" />
                  </div>
                  <p className="text-4xl font-bold text-gray-900">725</p>
                </div>

                {/* Contratos */}
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-600">Contratos</span>
                    <FaFileContract className="text-blue-500 text-2xl" />
                  </div>
                  <p className="text-4xl font-bold text-gray-900">540</p>
                </div>
              </div>

              {/* Grid de 3 columnas: Publicidad, Otros, Ventas Carretera */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {/* Publicidad */}
                <div className="bg-white rounded-lg shadow p-6 border-2 border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-600 mb-4">Publicidad</h3>
                  <div className="text-center">
                    <p className="text-5xl font-bold text-gray-900 mb-2">72.8%</p>
                    <p className="text-sm text-gray-500">margen</p>
                  </div>
                </div>

                {/* Otros */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-sm font-semibold text-gray-600 mb-4">Otros</h3>
                  <div className="flex items-center justify-center">
                    <div className="relative w-32 h-32">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="#E5E7EB"
                          strokeWidth="8"
                          fill="none"
                        />
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="#3B82F6"
                          strokeWidth="8"
                          fill="none"
                          strokeDasharray={`${2 * Math.PI * 56 * 0.199} ${2 * Math.PI * 56}`}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-bold">19.9%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ventas Carretera */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-sm font-semibold text-gray-600 mb-4">Ventas Carretera</h3>
                  <div className="flex items-center justify-center">
                    <span className="text-5xl font-bold text-gray-900">122</span>
                  </div>
                </div>
              </div>
            </>
          )}

        </>
      )}

      {/* Vista Pizarra Semanal */}
      {activeView === 'pizarra' && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Pizarra Semanal - Ranking en Vivo</h2>
              <div className="flex items-center space-x-4">
                {pizarraData.ultimaActualizacion && (
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <ClockIcon className="h-4 w-4" />
                    <span>
                      Última actualización:{' '}
                      {new Date(pizarraData.ultimaActualizacion).toLocaleTimeString('es-ES')}
                    </span>
                  </div>
                )}
                {pizarraData.enVivo && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">Objetivo Global:</span>
                    <span className="text-lg font-bold text-blue-600">
                      {pizarraData.enVivo.porcentajeObjetivo}%
                    </span>
                    <span className="text-xs text-gray-500">
                      ({pizarraData.enVivo.totalVentas}/{pizarraData.enVivo.objetivoGlobal})
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="border-b border-gray-200">
            <nav className="flex space-x-4 px-4" aria-label="Tabs">
              <button
                onClick={() => setActiveTurno('todos')}
                className={classNames(
                  activeTurno === 'todos'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                  'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm'
                )}
              >
                Todos ({pizarraData.enVivo?.ranking?.length || 0})
              </button>
              <button
                onClick={() => setActiveTurno('manana')}
                className={classNames(
                  activeTurno === 'manana'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                  'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm'
                )}
              >
                Turno Mañana ({pizarraData.enVivo?.manana?.length || 0})
              </button>
              <button
                onClick={() => setActiveTurno('tarde')}
                className={classNames(
                  activeTurno === 'tarde'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                  'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm'
                )}
              >
                Turno Tarde ({pizarraData.enVivo?.tarde?.length || 0})
              </button>
            </nav>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 text-xs uppercase text-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left">Rank</th>
                  <th className="px-4 py-3 text-left">Nombre</th>
                  <th className="px-4 py-3 text-center">L</th>
                  <th className="px-4 py-3 text-center">M</th>
                  <th className="px-4 py-3 text-center">X</th>
                  <th className="px-4 py-3 text-center">J</th>
                  <th className="px-4 py-3 text-center">V</th>
                  <th className="px-4 py-3 text-center">Total</th>
                  <th className="px-4 py-3 text-center">Turno</th>
                  <th className="px-4 py-3 text-center">% Objetivo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {(() => {
                  let data = []
                  if (activeTurno === 'todos') {
                    data = pizarraData.enVivo?.ranking || []
                  } else if (activeTurno === 'manana') {
                    data = pizarraData.enVivo?.manana || []
                  } else {
                    data = pizarraData.enVivo?.tarde || []
                  }

                  if (data.length === 0) {
                    return (
                      <tr>
                        <td colSpan="10" className="px-4 py-8 text-center text-gray-400">
                          No hay datos disponibles
                        </td>
                      </tr>
                    )
                  }

                  return data.map((agente, idx) => (
                    <tr
                      key={agente.id}
                      className={classNames(
                        'hover:bg-gray-50 cursor-pointer',
                        idx === 0 ? 'bg-yellow-50' : idx === 1 ? 'bg-gray-100' : idx === 2 ? 'bg-orange-50' : ''
                      )}
                      onClick={() => router.push(`/agentes/${agente.id}`)}
                    >
                      <td className="px-4 py-3 text-sm">
                        <span className={classNames(
                          'font-bold',
                          idx === 0 ? 'text-yellow-600' : idx === 1 ? 'text-gray-600' : idx === 2 ? 'text-orange-600' : 'text-gray-400'
                        )}>
                          {idx + 1}
                          {idx === 0 && ' 🥇'}
                          {idx === 1 && ' 🥈'}
                          {idx === 2 && ' 🥉'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={agente.avatar || '/avatar.png'} alt={agente.name} />
                            <AvatarFallback className="bg-blue-500 text-white text-xs font-bold">
                              {agente.name?.charAt(0) || 'A'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="ml-3">
                            <p className="text-sm font-medium">{agente.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-sm font-medium">
                        {agente.ventasDiarias?.L || 0}
                      </td>
                      <td className="px-4 py-3 text-center text-sm font-medium">
                        {agente.ventasDiarias?.M || 0}
                      </td>
                      <td className="px-4 py-3 text-center text-sm font-medium">
                        {agente.ventasDiarias?.X || 0}
                      </td>
                      <td className="px-4 py-3 text-center text-sm font-medium">
                        {agente.ventasDiarias?.J || 0}
                      </td>
                      <td className="px-4 py-3 text-center text-sm font-medium">
                        {agente.ventasDiarias?.V || 0}
                      </td>
                      <td className="px-4 py-3 text-center text-lg font-bold text-blue-600">
                        {agente.totalSemana || 0}
                      </td>
                      <td className="px-4 py-3 text-center text-sm">
                        <span className={classNames(
                          'px-2 py-1 text-xs rounded-full',
                          agente.turno === 'morning' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                        )}>
                          {agente.turno === 'morning' ? 'Mañana' : 'Tarde'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className={classNames(
                                'h-2 rounded-full',
                                agente.porcentaje >= 100 ? 'bg-green-500' :
                                agente.porcentaje >= 75 ? 'bg-blue-500' :
                                agente.porcentaje >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                              )}
                              style={{ width: `${Math.min(100, agente.porcentaje)}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium w-10 text-right">
                            {agente.porcentaje}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                })()}
              </tbody>
            </table>
          </div>

          {pizarraData.ventasPorTurno && (
            <div className="p-4 border-t bg-gray-50">
              <h3 className="text-sm font-semibold mb-3">Resumen Mensual por Turno</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-xs text-gray-500 mb-1">Turno Mañana</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {pizarraData.ventasPorTurno.manana?.total || 0}
                  </p>
                  <p className="text-xs text-gray-500">
                    {pizarraData.ventasPorTurno.manana?.agentes || 0} agentes - Promedio:{' '}
                    {pizarraData.ventasPorTurno.manana?.promedio || 0} contratos/agente
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-xs text-gray-500 mb-1">Turno Tarde</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {pizarraData.ventasPorTurno.tarde?.total || 0}
                  </p>
                  <p className="text-xs text-gray-500">
                    {pizarraData.ventasPorTurno.tarde?.agentes || 0} agentes - Promedio:{' '}
                    {pizarraData.ventasPorTurno.tarde?.promedio || 0} contratos/agente
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-xs text-gray-500 mb-1">Total Mensual</p>
                  <p className="text-2xl font-bold text-green-600">
                    {pizarraData.ventasPorTurno?.total || 0}
                  </p>
                  <p className="text-xs text-gray-500">Todos los turnos</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Vista Colaboradores */}
      {activeView === 'colaboradores' && (
        <>
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Colaboradores</h2>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Search..."
                    className="px-3 py-1 border rounded-lg text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <select className="border rounded-lg px-3 py-1 text-sm">
                    <option>10</option>
                    <option>25</option>
                    <option>50</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 text-xs uppercase text-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left">Rank</th>
                    <th className="px-4 py-3 text-left">Nombre</th>
                    <th className="px-4 py-3 text-left">Contratos</th>
                    <th className="px-4 py-3 text-left">Crecimiento</th>
                    <th className="px-4 py-3 text-left">Activos</th>
                    <th className="px-4 py-3 text-left">Retiros</th>
                    <th className="px-4 py-3 text-left">Comisiones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredAgentes.map((agente, idx) => (
                    <tr
                      key={agente.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        const path = agente.role === 'colaborador' ? '/colaboradores' : '/agentes';
                        router.push(`${path}/${agente.id}`)
                      }}
                    >
                      <td className="px-4 py-3 text-sm">
                        <span className="text-red-500">{idx + 1}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={agente.avatar || '/avatar.png'} alt={agente.name} />
                            <AvatarFallback className="bg-purple-500 text-white text-xs">
                              {agente.name?.charAt(0) || 'C'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="ml-3">
                            <p className="text-sm font-medium">{agente.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">{agente.totalContratos || agente.ventas}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={agente.trend === 'up' ? 'text-green-600' : 'text-red-600'}>
                          {agente.trend === 'up' ? '↑' : '↓'} {agente.trendValue}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="text-green-600 font-bold">${agente.comisiones}</span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="text-red-600">$0</span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="text-green-600 font-bold">${agente.comisiones}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Estadísticas agregadas de todos los colaboradores */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-semibold text-gray-600 mb-2">Total Contratos</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">
                  {dashboardData.topAgentes.reduce((sum, agente) => sum + (agente.totalContratos || agente.ventas || 0), 0)}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Todos los colaboradores</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-semibold text-gray-600 mb-2">Total Comisiones</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-green-600">
                  €{dashboardData.topAgentes.reduce((sum, agente) => sum + (agente.comisiones || 0), 0)}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Suma de todas las comisiones</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-semibold text-gray-600 mb-2">Crecimiento Promedio</h3>
              <div className="flex items-baseline gap-2">
                <span className={classNames(
                  "text-3xl font-bold",
                  dashboardData.topAgentes.length > 0 &&
                  dashboardData.topAgentes.reduce((sum, agente) => {
                    const value = agente.trend === 'up' ? (agente.trendValue || 0) : -(agente.trendValue || 0)
                    return sum + value
                  }, 0) / dashboardData.topAgentes.length >= 0
                    ? 'text-green-600'
                    : 'text-red-600'
                )}>
                  {dashboardData.topAgentes.length > 0
                    ? (dashboardData.topAgentes.reduce((sum, agente) => {
                        const value = agente.trend === 'up' ? (agente.trendValue || 0) : -(agente.trendValue || 0)
                        return sum + value
                      }, 0) / dashboardData.topAgentes.length).toFixed(1)
                    : 0}%
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {dashboardData.topAgentes.filter(a => a.trend === 'up').length} en crecimiento
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-semibold text-gray-600 mb-2">Número de Colaboradores</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">
                  {dashboardData.topAgentes.length}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Activos: {dashboardData.topAgentes.filter(a => (a.totalContratos || a.ventas || 0) > 0).length}
              </p>
            </div>
          </div>

          {/* Sección de Distribución de Clientes - Colaboradores */}
          {colaboradoresData.distribucionClientes &&
           colaboradoresData.distribucionClientes.particulares &&
           colaboradoresData.distribucionClientes.empresas && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Distribución de Clientes - Todos los Colaboradores</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Gráfico de distribución */}
                <div>
                  <div className="flex items-center justify-center h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            {
                              name: 'Particulares',
                              value: colaboradoresData.distribucionClientes.particulares.cantidad || 0,
                              color: '#3B82F6'
                            },
                            {
                              name: 'Empresas',
                              value: colaboradoresData.distribucionClientes.empresas.cantidad || 0,
                              color: '#8B5CF6'
                            }
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {[
                            { color: '#3B82F6' },
                            { color: '#8B5CF6' }
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Estadísticas detalladas */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center border-l-4 border-blue-500 pl-4">
                    <div>
                      <p className="text-xs text-gray-600">Particulares (B2C)</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {colaboradoresData.distribucionClientes.particulares.cantidad || 0}
                      </p>
                    </div>
                    <p className="text-sm text-gray-500">
                      {colaboradoresData.distribucionClientes.particulares.porcentaje || 0}%
                    </p>
                  </div>

                  <div className="flex justify-between items-center border-l-4 border-purple-500 pl-4">
                    <div>
                      <p className="text-xs text-gray-600">Empresas (B2B)</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {colaboradoresData.distribucionClientes.empresas.cantidad || 0}
                      </p>
                    </div>
                    <p className="text-sm text-gray-500">
                      {colaboradoresData.distribucionClientes.empresas.porcentaje || 0}%
                    </p>
                  </div>

                  <div className="pt-3 border-t">
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-gray-600">Total de Clientes</p>
                      <p className="text-xl font-bold text-gray-900">
                        {colaboradoresData.distribucionClientes.total || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Gráficos de Actividad de Contratos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-sm font-semibold mb-3">Actividad de Contratos</h3>
              <div className="h-48">
                {dashboardData.ventasPorMes.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dashboardData.ventasPorMes}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    No hay datos disponibles
                  </div>
                )}
              </div>
            </div>

            {/* Número de Clientes y Retiros */}
            <div className="bg-white rounded-lg shadow p-4">
              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-semibold mb-2">Nº Clientes</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">{dashboardData.stats.totalClientes}</span>
                    <span className="text-green-600">+10%</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold mb-2">Retiros</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">-12</span>
                    <span className="text-red-600">-19%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Histórico de Comisiones */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold mb-4">Histórico Liquidaciones</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">Cliente</th>
                    <th className="px-4 py-2 text-left">Monto</th>
                    <th className="px-4 py-2 text-left">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {dashboardData.historicalLiquidations.map((liq, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-2 text-sm">{liq.client}</td>
                      <td className="px-4 py-2 text-sm text-green-600 font-bold">${liq.deal}</td>
                      <td className="px-4 py-2 text-sm">{liq.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Gráficas de Métricas Agregadas - Promedio de todos los colaboradores */}
          {colaboradoresData.metricasAgregadas &&
           colaboradoresData.metricasAgregadas.cumplimientoObjetivo &&
           colaboradoresData.metricasAgregadas.historicoMensual && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Cumplimiento de Objetivo Promedio */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Cumplimiento de Objetivo (Promedio)</h3>
                <div className="text-center mb-4">
                  <p className="text-5xl font-bold text-purple-600">
                    {colaboradoresData.metricasAgregadas.cumplimientoObjetivo.porcentaje || 0}%
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    {colaboradoresData.metricasAgregadas.cumplimientoObjetivo.ventas || 0} / {colaboradoresData.metricasAgregadas.cumplimientoObjetivo.objetivo || 0} contratos
                  </p>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className="bg-purple-600 h-4 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, colaboradoresData.metricasAgregadas.cumplimientoObjetivo.porcentaje || 0)}%`
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Promedio de {colaboradoresData.metricasAgregadas.totalColaboradores || 0} colaboradores
                </p>
              </div>

              {/* Histórico Mensual Promedio */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Histórico Mensual (Promedio por Colaborador)</h3>
                <div className="h-64">
                  {colaboradoresData.metricasAgregadas.historicoMensual.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={colaboradoresData.metricasAgregadas.historicoMensual}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="contratos" fill="#8B5CF6" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      No hay datos históricos disponibles
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Vista Facturación */}
      {activeView === 'facturacion' && (
        <>
          {/* Métricas Financieras */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Ingresos</p>
                  <p className="text-2xl font-bold">€{facturacionData.ingresosPorTarifa?.ingresos?.toLocaleString() || 0}</p>
                  <p className="text-xs text-gray-500">{facturacionData.ingresosPorTarifa?.contratos || 0} contratos</p>
                </div>
                <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">Mes actual</span>
              </div>
              <p className="text-green-600 text-sm mt-2">↑ {dashboardData.financialMetrics.ingresosChange}%</p>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Gastos</p>
                  <p className="text-2xl font-bold text-red-600">€{facturacionData.ingresosPorTarifa?.gastos?.toLocaleString() || 0}</p>
                  <p className="text-xs text-gray-500">Comisiones pagadas</p>
                </div>
                <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">Mes actual</span>
              </div>
              <p className="text-red-600 text-sm mt-2">-{Math.abs(dashboardData.financialMetrics.retornosChange)}%</p>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Beneficio Neto</p>
                  <p className="text-2xl font-bold text-green-600">€{facturacionData.ingresosPorTarifa?.beneficio?.toLocaleString() || 0}</p>
                  <p className="text-xs text-gray-500">Ingresos - Gastos</p>
                </div>
                <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">Mes actual</span>
              </div>
              <p className="text-green-600 text-sm mt-2">↑ {dashboardData.financialMetrics.beneficioChange}%</p>
            </div>
          </div>

          {/* Sales vs Target Chart */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <h3 className="text-lg font-semibold mb-4">Sales vs Target</h3>
            <div className="h-64">
              {dashboardData.salesVsTarget.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dashboardData.salesVsTarget}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="target" 
                      stroke="#EF4444" 
                      strokeDasharray="5 5"
                      name="Target" 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="ingresos" 
                      stroke="#3B82F6" 
                      name="Ingresos" 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="beneficio" 
                      stroke="#10B981" 
                      name="Beneficio" 
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  No hay datos de ventas disponibles
                </div>
              )}
            </div>
          </div>

          {/* Liquidaciones Tables */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Recent Liquidations */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-sm font-semibold mb-3">Próximas Liquidaciones</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                      <th className="px-2 py-1 text-left">Cliente</th>
                      <th className="px-2 py-1 text-left">Monto</th>
                      <th className="px-2 py-1 text-left">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {dashboardData.proximasLiquidaciones.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-2 py-2 text-xs">{item.userName || 'N/A'}</td>
                        <td className="px-2 py-2 text-xs text-green-600 font-bold">€{item.amount}</td>
                        <td className="px-2 py-2 text-xs">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            item.status === 'PENDIENTE' ? 'bg-yellow-100 text-yellow-800' :
                            item.status === 'PAGADA' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {dashboardData.proximasLiquidaciones.length === 0 && (
                      <tr>
                        <td colSpan="3" className="px-2 py-4 text-center text-sm text-gray-400">
                          No hay liquidaciones pendientes
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Historical Liquidations */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-sm font-semibold mb-3">Historial Liquidaciones</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                      <th className="px-2 py-1 text-left">Cliente</th>
                      <th className="px-2 py-1 text-left">Monto</th>
                      <th className="px-2 py-1 text-left">Fecha</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {dashboardData.historicalLiquidations.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-2 py-2 text-xs">{item.client}</td>
                        <td className="px-2 py-2 text-xs text-green-600 font-bold">€{item.deal}</td>
                        <td className="px-2 py-2 text-xs">{item.date}</td>
                      </tr>
                    ))}
                    {dashboardData.historicalLiquidations.length === 0 && (
                      <tr>
                        <td colSpan="3" className="px-2 py-4 text-center text-sm text-gray-400">
                          No hay liquidaciones históricas
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}