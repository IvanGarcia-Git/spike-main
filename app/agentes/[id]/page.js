'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
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
  ResponsiveContainer
} from 'recharts'

export default function AgentProfile() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const nameFromUrl = searchParams.get('name')
  const [loading, setLoading] = useState(true)
  const [agentData, setAgentData] = useState(null)

  useEffect(() => {
    fetchAgentData()
  }, [params.id])

  const fetchAgentData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/agentes/${params.id}`)

      console.log('Response status:', response.status)

      if (response.ok) {
        const backendData = await response.json()
        console.log('Backend data received:', backendData)
        // Transformar datos del backend al formato del frontend
        const transformedData = transformBackendData(backendData)
        console.log('Transformed data:', transformedData)
        setAgentData(transformedData)
      } else {
        const errorData = await response.json()
        console.error('API error:', response.status, errorData)
        // Usar datos de fallback para desarrollo
        setAgentData(generateFallbackData())
      }
    } catch (error) {
      console.error('Error fetching agent data:', error)
      setAgentData(generateFallbackData())
    } finally {
      setLoading(false)
    }
  }

  // Función auxiliar para calcular el porcentaje de cambio entre dos valores
  const calcularCambioPorcentual = (valorActual, valorAnterior) => {
    if (valorAnterior === 0) {
      return valorActual > 0 ? 100 : 0
    }
    return Math.round(((valorActual - valorAnterior) / valorAnterior) * 100)
  }

  // Función auxiliar para calcular el cambio basándose en los datos del array
  const calcularCambioDeArray = (dataArray) => {
    if (!dataArray || dataArray.length < 2) return 0
    const ultimoValor = dataArray[dataArray.length - 1]?.value || 0
    const penultimoValor = dataArray[dataArray.length - 2]?.value || 0
    return calcularCambioPorcentual(ultimoValor, penultimoValor)
  }

  const transformBackendData = (data) => {
    // Calcular días del mes
    const currentDate = new Date()
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
    const currentDay = currentDate.getDate()
    const daysLeft = daysInMonth - currentDay

    // Calcular faltante para objetivo
    const objetivo = data.cumplimientoObjetivo?.objetivo || 140
    const contratosMes = data.cumplimientoObjetivo?.contratosMes || 0
    const faltante = Math.max(0, objetivo - contratosMes)

    // Calcular cambio porcentual
    const mesAnterior = data.cumplimientoObjetivo?.mesAnterior || 0
    const crecimiento = data.cumplimientoObjetivo?.crecimiento || 0

    // Mapear histórico de comisiones del backend
    const historicoComisiones = data.historialComisiones?.map(h => {
      const fecha = new Date(h.fecha)
      const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
      return {
        mes: meses[fecha.getMonth()] || 'N/A',
        comision: Math.round(h.comision || 0),
        ventasObjetivo: `${h.contratos || 0}/${objetivo}`
      }
    }) || []

    // Mapear histórico mensual para gráficos
    const historicoMensual = data.historicoMensual || []
    const chartData = historicoMensual.length > 0
      ? historicoMensual.map(h => ({
          month: h.mes,
          value: h.contratos || 0
        }))
      : [
          { month: 'Jun', value: 0 },
          { month: 'Jul', value: 0 },
          { month: 'Ago', value: 0 },
          { month: 'Sep', value: 0 },
          { month: 'Oct', value: 0 },
          { month: 'Nov', value: 0 }
        ]

    // Datos de distribución de clientes
    const distribucionClientesTipo = data.clientesPorTipo?.distribucionClientesTipo || {
      particulares: { cantidad: 0, porcentaje: 0 },
      empresas: { cantidad: 0, porcentaje: 0 },
      total: 0
    }

    // Mapear tiempos de activación por compañía
    const tiemposActivacion = data.clientesPorTipo?.porCompania?.slice(0, 4).map(c => ({
      tiempo: `${Math.floor(Math.random() * 10) + 2} días`, // Simulado por ahora
      tipo: c.compania
    })) || [
      { tiempo: '4 días', tipo: 'Naturgy' },
      { tiempo: '8 días', tipo: 'Endesa' },
      { tiempo: '2 días', tipo: 'Iberdrola' },
      { tiempo: '5 días', tipo: 'Repsol' }
    ]

    // Mapear estados (tipos de contrato)
    const estados = data.clientesPorTipo?.porTipo?.slice(0, 6).map(t => ({
      name: t.tipo || 'Sin tipo',
      percentage: t.porcentaje || 0
    })) || [
      { name: 'Luz', percentage: 45 },
      { name: 'Gas', percentage: 30 },
      { name: 'Dual', percentage: 15 },
      { name: 'Telefonía', percentage: 10 }
    ]

    return {
      id: data.id,
      name: data.name,
      role: data.role,
      avatar: data.avatar,
      email: data.email,
      phone: data.phone,
      shift: data.shift,

      // Days Left
      daysLeft: {
        current: daysLeft,
        total: daysInMonth,
        percentage: Math.round((currentDay / daysInMonth) * 100)
      },

      // Estadísticas principales de contratos
      contratos: {
        confirmados: contratosMes,
        activos: data.stats?.contratosActivos || 0,
        porActivarse: Math.round(data.stats?.prediccionVentas / 100) || 0, // prediccionVentas está en €
        retiros: 0,
        cancelados: 0
      },

      puntosRestantes: faltante,

      // Histórico de comisiones
      historicoComisiones,

      // Historial de puntos (últimos clientes/contratos)
      historialPuntos: data.historialComisiones?.slice(0, 6).flatMap(h =>
        (h.detalles || []).slice(0, 1).map(d => ({
          cliente: d.cliente || 'Cliente',
          puntos: Math.round((d.comision || 0) / 100) / 10 || 0.9
        }))
      ) || [
        { cliente: 'Sin datos', puntos: 0 }
      ],

      // Media mensual (comisión diaria promedio)
      mediaMensual: {
        value: data.stats?.comisionMedia?.diaria || 0,
        unit: '€/día',
        change: calcularCambioDeArray(chartData),
        data: chartData
      },

      // % Conversión (objetivo cumplido)
      conversion: (() => {
        const conversionData = chartData.map(d => ({
          month: d.month,
          value: objetivo > 0 ? Math.round((d.value / objetivo) * 100) : 0
        }))
        return {
          percentage: data.cumplimientoObjetivo?.porcentaje || 0,
          change: calcularCambioDeArray(conversionData),
          data: conversionData
        }
      })(),

      // Puntos medio por venta
      puntosMedioVenta: {
        value: data.stats?.ingresos?.puntos || contratosMes,
        change: calcularCambioDeArray(chartData),
        data: chartData
      },

      // Comisión media mensual
      comisionMedia: (() => {
        const comisionData = historicoComisiones.length > 0
          ? historicoComisiones.map((h, i) => ({
              month: h.mes?.slice(0, 3) || chartData[i]?.month || `M${i+1}`,
              value: h.comision || 0
            }))
          : chartData.map(d => ({ month: d.month, value: 0 }))
        return {
          value: data.stats?.comisionMedia?.mensual || 0,
          currency: '€',
          change: calcularCambioDeArray(comisionData),
          data: comisionData
        }
      })(),

      // Estados (distribución por tipo de servicio)
      estados,

      // Distribución de tipo de cliente (Particulares vs Empresas)
      distribucionClientesTipo: {
        particulares: {
          cantidad: distribucionClientesTipo.particulares?.cantidad || 0,
          porcentaje: distribucionClientesTipo.particulares?.porcentaje || 0
        },
        empresas: {
          cantidad: distribucionClientesTipo.empresas?.cantidad || 0,
          porcentaje: distribucionClientesTipo.empresas?.porcentaje || 0
        },
        total: distribucionClientesTipo.total || 0
      },

      // Métricas de clientes
      totalClientes: data.stats?.clientes?.total || 0,
      referidos: data.stats?.clientes?.nuevosMes || 0,
      totalContratos: data.stats?.contratosActivos || 0,

      // Tiempos de activación
      tiempoActivacion: tiemposActivacion,

      // Distribución de tipo de cliente (Particulares vs Empresas)
      distribucionTipo: {
        particulares: {
          cantidad: distribucionClientesTipo.particulares?.cantidad || 0,
          percentage: distribucionClientesTipo.particulares?.porcentaje || 73
        },
        empresas: {
          cantidad: distribucionClientesTipo.empresas?.cantidad || 0,
          percentage: distribucionClientesTipo.empresas?.porcentaje || 20
        }
      },

      // Ventas carretera (retrocomisiones)
      ventasCarretera: Math.round((data.stats?.retrocomisiones || 0) / 100) || 0
    }
  }

  const generateFallbackData = () => {
    // Calcular días del mes
    const currentDate = new Date()
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
    const currentDay = currentDate.getDate()
    const daysLeft = daysInMonth - currentDay

    return {
      id: params.id,
      name: nameFromUrl || `Agente ${params.id}`,
      role: 'agente',
      avatar: null,
      email: null,
      daysLeft: {
        current: daysLeft,
        total: daysInMonth,
        percentage: Math.round((currentDay / daysInMonth) * 100)
      },
      contratos: {
        confirmados: 0,
        activos: 0,
        porActivarse: 0,
        retiros: 0,
        cancelados: 0
      },
      puntosRestantes: 140,
      historialPuntos: [
        { cliente: 'Sin datos', puntos: 0 }
      ],
      mediaMensual: {
        value: 0,
        unit: '€/día',
        change: 0,
        data: [
          { month: 'Jun', value: 0 },
          { month: 'Jul', value: 0 },
          { month: 'Ago', value: 0 },
          { month: 'Sep', value: 0 },
          { month: 'Oct', value: 0 },
          { month: 'Nov', value: 0 }
        ]
      },
      conversion: {
        percentage: 0,
        change: 0,
        data: [
          { month: 'Jun', value: 0 },
          { month: 'Jul', value: 0 },
          { month: 'Ago', value: 0 },
          { month: 'Sep', value: 0 },
          { month: 'Oct', value: 0 },
          { month: 'Nov', value: 0 }
        ]
      },
      puntosMedioVenta: {
        value: 0,
        change: 0,
        data: [
          { month: 'Jun', value: 0 },
          { month: 'Jul', value: 0 },
          { month: 'Ago', value: 0 },
          { month: 'Sep', value: 0 },
          { month: 'Oct', value: 0 },
          { month: 'Nov', value: 0 }
        ]
      },
      comisionMedia: {
        value: 0,
        currency: '€',
        change: 0,
        data: [
          { month: 'Jun', value: 0 },
          { month: 'Jul', value: 0 },
          { month: 'Ago', value: 0 },
          { month: 'Sep', value: 0 },
          { month: 'Oct', value: 0 },
          { month: 'Nov', value: 0 }
        ]
      },
      historicoComisiones: [],
      estados: [],
      distribucionClientesTipo: {
        particulares: { cantidad: 0, porcentaje: 0 },
        empresas: { cantidad: 0, porcentaje: 0 },
        total: 0
      },
      totalClientes: 0,
      referidos: 0,
      totalContratos: 0,
      tiempoActivacion: [],
      distribucionTipo: {
        particulares: { cantidad: 0, percentage: 0 },
        empresas: { cantidad: 0, percentage: 0 }
      },
      ventasCarretera: 0
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background-light">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-slate-600">Cargando perfil del agente...</p>
        </div>
      </div>
    )
  }

  if (!agentData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background-light">
        <p className="text-slate-600">No se encontró información del agente</p>
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 bg-background-light min-h-screen">
      {/* Header con botón de regreso */}
      <div className="neumorphic-card p-6 mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center text-slate-600 hover:text-primary mb-4 font-medium transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Volver al Dashboard
        </button>

        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full neumorphic-card-inset flex items-center justify-center">
            <Avatar className="h-14 w-14">
              <AvatarImage src={agentData.avatar || '/avatar.png'} alt={agentData.name} />
              <AvatarFallback className="bg-primary text-white text-xl">
                {agentData.name?.charAt(0) || 'A'}
              </AvatarFallback>
            </Avatar>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{agentData.name}</h1>
            <p className="text-slate-500">
              {agentData.role === 'agente' ? 'Agente' : agentData.role === 'colaborador' ? 'Colaborador' : agentData.role}
            </p>
            {agentData.email && (
              <p className="text-sm text-slate-400">{agentData.email}</p>
            )}
          </div>
        </div>
      </div>

      {/* Grid de gráficos - PRIMERO */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Media Mensual */}
        <div className="neumorphic-card p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Media Mensual</h3>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-slate-800">{agentData.mediaMensual.value}</span>
                <span className="text-sm text-slate-500">/{agentData.mediaMensual.unit}</span>
              </div>
            </div>
            <span className={`text-sm font-medium ${agentData.mediaMensual.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {agentData.mediaMensual.change >= 0 ? '+' : ''}{agentData.mediaMensual.change}%
            </span>
          </div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={agentData.mediaMensual.data}>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="value" stroke="#14b8a6" fill="rgba(20, 184, 166, 0.2)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* % Conversión */}
        <div className="neumorphic-card p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">% Conversión</h3>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-slate-800">{agentData.conversion.percentage}%</span>
              </div>
            </div>
            <span className={`text-sm font-medium ${agentData.conversion.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {agentData.conversion.change >= 0 ? '+' : ''}{agentData.conversion.change}%
            </span>
          </div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={agentData.conversion.data}>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="value" stroke="#10B981" fill="rgba(16, 185, 129, 0.2)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Puntos medio/venta */}
        <div className="neumorphic-card p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Puntos medio/venta</h3>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-slate-800">{agentData.puntosMedioVenta.value}</span>
              </div>
            </div>
            <span className={`text-sm font-medium ${agentData.puntosMedioVenta.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {agentData.puntosMedioVenta.change >= 0 ? '+' : ''}{agentData.puntosMedioVenta.change}%
            </span>
          </div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={agentData.puntosMedioVenta.data}>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="value" stroke="#F59E0B" fill="rgba(245, 158, 11, 0.2)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Comisión media */}
        <div className="neumorphic-card p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Comisión media</h3>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-slate-800">{agentData.comisionMedia.value} {agentData.comisionMedia.currency}</span>
              </div>
            </div>
            <span className={`text-sm font-medium ${agentData.comisionMedia.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {agentData.comisionMedia.change >= 0 ? '+' : ''}{agentData.comisionMedia.change}%
            </span>
          </div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={agentData.comisionMedia.data}>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="value" stroke="#EC4899" fill="rgba(236, 72, 153, 0.2)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Grid superior - Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Days Left */}
        <div className="neumorphic-card p-6">
          <h3 className="text-sm font-semibold text-slate-600 mb-2">Days Left</h3>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-3xl font-bold text-slate-800">{agentData.daysLeft.current}</span>
            <span className="text-sm text-slate-500">/ {agentData.daysLeft.total}</span>
          </div>
          <div className="neumorphic-progress-track h-3 mb-2">
            <div
              className="bg-primary h-3 rounded-full"
              style={{ width: `${agentData.daysLeft.percentage}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 text-right">{agentData.daysLeft.percentage}%</p>
        </div>

        {/* Contratos */}
        <div className="neumorphic-card p-6">
          <h3 className="text-sm font-semibold text-slate-600 mb-3">Contratos / Activos</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-red-500"></div>
              <span className="text-xs text-slate-600">Confirmados</span>
              <span className="ml-auto text-sm font-medium text-slate-800">{agentData.contratos.confirmados}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-green-500"></div>
              <span className="text-xs text-slate-600">Activos</span>
              <span className="ml-auto text-sm font-bold text-green-600">{agentData.contratos.activos}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600 ml-5">Por activarse</span>
              <span className="ml-auto text-sm text-slate-800">{agentData.contratos.porActivarse}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
              <span className="text-xs text-slate-600">Retiros</span>
              <span className="ml-auto text-sm text-slate-800">{agentData.contratos.retiros}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-red-500"></div>
              <span className="text-xs text-slate-600">Cancelados</span>
              <span className="ml-auto text-sm text-slate-800">{agentData.contratos.cancelados}</span>
            </div>
          </div>
        </div>

        {/* Historial de Puntos */}
        <div className="neumorphic-card p-6">
          <h3 className="text-sm font-semibold text-slate-800 mb-3">Historial de Puntos</h3>
          <div className="neumorphic-card-inset rounded-lg p-3">
            {agentData.historialPuntos.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center py-1">
                <span className="text-xs text-slate-700">{item.cliente}</span>
                <span className={`text-xs font-medium ${
                  item.puntos > 1 ? 'text-green-600' :
                  item.puntos > 0.8 ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {item.puntos > 1 ? '+' : item.puntos < 0 ? '' : '+'}{item.puntos}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 text-center">
            <p className="text-xs text-slate-600">Puntos Restantes</p>
            <p className="text-2xl font-bold text-slate-800">{agentData.puntosRestantes}</p>
          </div>
        </div>
      </div>

      {/* Histórico Comisiones */}
      <div className="neumorphic-card p-6 mb-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Histórico Comisiones</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-xs text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="p-3">Mes</th>
                <th className="p-3">Comisión</th>
                <th className="p-3">Ventas/Objetivo</th>
              </tr>
            </thead>
            <tbody>
              {agentData.historicoComisiones.map((item, idx) => (
                <tr key={idx} className="table-row-divider">
                  <td className="p-3 font-medium text-slate-800">{item.mes}</td>
                  <td className="p-3 text-green-600 font-bold">{item.comision}€</td>
                  <td className="p-3 text-slate-600">{item.ventasObjetivo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grid inferior - Métricas adicionales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        {/* Estados */}
        <div className="neumorphic-card p-6">
          <h3 className="text-sm font-semibold text-slate-800 mb-3">Estados</h3>
          <div className="space-y-3">
            {agentData.estados.map((estado, idx) => (
              <div key={idx}>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-slate-600">{estado.name}</span>
                  <span className="font-medium text-slate-800">{estado.percentage}%</span>
                </div>
                <div className="neumorphic-progress-track h-2">
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{ width: `${estado.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Distribución de Clientes */}
        <div className="neumorphic-card p-6">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Distribución Clientes</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full neumorphic-card-inset flex items-center justify-center">
                  <i className="fa fa-user text-primary"></i>
                </div>
                <span className="text-xs text-slate-600">Particulares</span>
              </div>
              <span className="text-lg font-bold text-slate-800">{agentData.distribucionClientesTipo.particulares.porcentaje}%</span>
            </div>
            <div className="neumorphic-progress-track h-2">
              <div
                className="bg-primary h-2 rounded-full"
                style={{ width: `${agentData.distribucionClientesTipo.particulares.porcentaje}%` }}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full neumorphic-card-inset flex items-center justify-center">
                  <i className="fa fa-building text-purple-500"></i>
                </div>
                <span className="text-xs text-slate-600">Empresas</span>
              </div>
              <span className="text-lg font-bold text-slate-800">{agentData.distribucionClientesTipo.empresas.porcentaje}%</span>
            </div>
            <div className="neumorphic-progress-track h-2">
              <div
                className="bg-purple-500 h-2 rounded-full"
                style={{ width: `${agentData.distribucionClientesTipo.empresas.porcentaje}%` }}
              />
            </div>
            <div className="text-center pt-2">
              <p className="text-xs text-slate-500">Total: {agentData.distribucionClientesTipo.total} clientes</p>
            </div>
          </div>
        </div>

        {/* Métricas */}
        <div className="neumorphic-card p-6">
          <div className="flex flex-col justify-between h-full gap-5">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <i className="fa fa-users text-red-500 text-lg"></i>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-slate-500 leading-tight">Total Clientes</span>
                <p className="text-2xl font-bold text-slate-800 leading-tight">{agentData.totalClientes}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                <i className="fa fa-user text-yellow-500 text-lg"></i>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-slate-500 leading-tight">Referidos</span>
                <p className="text-2xl font-bold text-slate-800 leading-tight">{agentData.referidos}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <i className="fa fa-file-text text-blue-500 text-lg"></i>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-slate-500 leading-tight">Contratos</span>
                <p className="text-2xl font-bold text-slate-800 leading-tight">{agentData.totalContratos}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tiempo medio activación */}
        <div className="neumorphic-card p-6">
          <h3 className="text-sm font-semibold text-slate-800 mb-3">Tiempo medio Activ</h3>
          <div className="neumorphic-card-inset rounded-lg p-3">
            <div className="space-y-2">
              {agentData.tiempoActivacion.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs">
                  <span className="text-slate-600">{item.tiempo}</span>
                  <span className="font-medium text-slate-800">{item.tipo}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Grid final - Distribuciones */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Publicidad */}
        <div className="neumorphic-card p-6">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Publicidad</h3>
          <div className="neumorphic-card-inset rounded-lg p-6 text-center">
            <p className="text-3xl font-bold text-slate-800 mb-1">{agentData.distribucionTipo.particulares.percentage}%</p>
            <p className="text-xs text-slate-500">margen</p>
          </div>
        </div>

        {/* Otros */}
        <div className="neumorphic-card p-6">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Otros</h3>
          <div className="w-24 h-24 rounded-full neumorphic-card-inset mx-auto flex items-center justify-center">
            <p className="text-2xl font-bold text-slate-800">{agentData.distribucionTipo.empresas.percentage}%</p>
          </div>
        </div>

        {/* Ventas Carretera */}
        <div className="neumorphic-card p-6">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Ventas Carretera</h3>
          <div className="flex items-center justify-center gap-4 mt-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center shadow-neumorphic-light-lg">
              <i className="fa fa-diamond text-primary text-2xl"></i>
            </div>
            <p className="text-4xl font-bold text-slate-800">{agentData.ventasCarretera}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
