'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
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

  const transformBackendData = (data) => {
    // Calcular días del mes
    const currentDate = new Date()
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
    const currentDay = currentDate.getDate()
    const daysLeft = daysInMonth - currentDay

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

      // Estadísticas principales
      contratos: {
        confirmados: 0,
        activos: data.stats?.contratosActivos || 0,
        porActivarse: Math.round(data.stats?.prediccionVentas || 0),
        retiros: 0,
        cancelados: 0
      },

      puntosRestantes: data.cumplimientoObjetivo?.faltante || 0,

      // Histórico de comisiones
      historicoComisiones: data.historialComisiones?.map(h => ({
        mes: h.mes,
        comision: h.comision,
        ventasObjetivo: `${h.contratos || 0}/140`
      })) || [],

      // Histórico de puntos (basado en contratos)
      historialPuntos: data.historicoMensual?.slice(0, 6).map(h => ({
        cliente: h.mes,
        puntos: (h.contratos || 0) / 10 // Simulación de puntos
      })) || [],

      // Histórico mensual para gráficos
      mediaMensual: {
        value: data.stats?.comisionMedia?.diaria || 0,
        unit: '€/día',
        change: 0,
        data: data.historicoMensual?.map((h, i) => ({
          month: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'][i] || h.mes,
          value: (h.comision || 0) / (new Date(currentDate.getFullYear(), i + 1, 0).getDate())
        })) || []
      },

      conversion: {
        percentage: data.cumplimientoObjetivo?.porcentaje || 0,
        change: 0,
        data: data.historicoMensual?.map((h, i) => ({
          month: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'][i] || h.mes,
          value: Math.round((h.contratos / 140) * 100) || 0
        })) || []
      },

      puntosMedioVenta: {
        value: data.stats?.ingresos?.puntos || 0,
        change: 0,
        data: data.historicoMensual?.map((h, i) => ({
          month: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'][i] || h.mes,
          value: (h.contratos || 0) / 10 // Simulación
        })) || []
      },

      comisionMedia: {
        value: data.stats?.comisionMedia?.mensual || 0,
        currency: '€',
        change: 0,
        data: data.historialComisiones?.map((h, i) => ({
          month: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'][i] || h.mes,
          value: h.comision || 0
        })) || []
      },

      // Distribución de clientes
      estados: data.clientesPorTipo?.porTipo?.slice(0, 6).map(t => ({
        name: t.tipo,
        percentage: t.porcentaje
      })) || [],

      distribucionGenero: {
        hombre: 62, // Simulado - requiere implementación en backend
        mujer: 6,
        otro: 16
      },

      totalClientes: data.stats?.clientes?.total || 0,
      referidos: Math.round((data.stats?.clientes?.total || 0) * 0.54), // Simulado
      contratos: data.stats?.contratosActivos || 0,

      tiemposActivacion: data.clientesPorTipo?.porCompania?.slice(0, 4).map(c => ({
        tiempo: '4 días', // Simulado - requiere implementación en backend
        tipo: c.compania
      })) || [],

      distribucionTipo: {
        particulares: {
          cantidad: Math.round((data.stats?.clientes?.total || 0) * 0.73),
          percentage: 73
        },
        empresas: {
          cantidad: Math.round((data.stats?.clientes?.total || 0) * 0.20),
          percentage: 20
        }
      },

      ventasCarretera: Math.round((data.stats?.contratosActivos || 0) * 0.22) // Simulado
    }
  }

  const generateFallbackData = () => {
    return {
      id: params.id,
      name: 'Carlos Garcia',
      role: 'Salesman',
      avatar: null,
      daysLeft: {
        current: 32.9,
        total: 62,
        percentage: 53
      },
      contratos: {
        confirmados: 0,
        activos: 42.6,
        porActivarse: 0,
        retiros: 12,
        cancelados: 4
      },
      puntosRestantes: 22,
      historialPuntos: [
        { cliente: 'Cliente 1', puntos: 0.9 },
        { cliente: 'Cliente 2', puntos: 1.2 },
        { cliente: 'Cliente 3', puntos: 0.9 },
        { cliente: 'Cliente 4', puntos: 0.65 },
        { cliente: 'Cliente 5', puntos: 1.1 },
        { cliente: 'Cliente 6', puntos: 2 }
      ],
      mediaMensual: {
        value: 12,
        unit: 'día',
        change: 12,
        data: [
          { month: 'Ene', value: 10 },
          { month: 'Feb', value: 15 },
          { month: 'Mar', value: 12 },
          { month: 'Abr', value: 18 },
          { month: 'May', value: 14 },
          { month: 'Jun', value: 11 }
        ]
      },
      conversion: {
        percentage: 39.6,
        change: -4,
        data: [
          { month: 'Ene', value: 42 },
          { month: 'Feb', value: 38 },
          { month: 'Mar', value: 45 },
          { month: 'Abr', value: 40 },
          { month: 'May', value: 37 },
          { month: 'Jun', value: 39.6 }
        ]
      },
      puntosMedioVenta: {
        value: 5.6,
        change: 12,
        data: [
          { month: 'Ene', value: 5 },
          { month: 'Feb', value: 6 },
          { month: 'Mar', value: 5.5 },
          { month: 'Abr', value: 6.2 },
          { month: 'May', value: 5.8 },
          { month: 'Jun', value: 5.6 }
        ]
      },
      comisionMedia: {
        value: 349.3,
        currency: '€',
        change: -4,
        data: [
          { month: 'Ene', value: 380 },
          { month: 'Feb', value: 420 },
          { month: 'Mar', value: 350 },
          { month: 'Abr', value: 390 },
          { month: 'May', value: 340 },
          { month: 'Jun', value: 349.3 }
        ]
      },
      historicoComisiones: [
        { mes: 'Enero', comision: 7929, ventasObjetivo: '118/75' },
        { mes: 'Febrero', comision: 5629, ventasObjetivo: '93/75' },
        { mes: 'Marzo', comision: 5329, ventasObjetivo: '...' },
        { mes: 'Abril', comision: 4529, ventasObjetivo: '...' },
        { mes: 'Mayo', comision: 3229, ventasObjetivo: '...' },
        { mes: 'Junio', comision: 3229, ventasObjetivo: '...' }
      ],
      estados: [
        { name: 'Pagado', percentage: 76 },
        { name: 'Activo', percentage: 24 },
        { name: 'Pdte. Firma', percentage: 76 },
        { name: '...', percentage: 24 },
        { name: '...', percentage: 76 },
        { name: '...', percentage: 24 }
      ],
      distribucionGenero: {
        hombre: 62,
        mujer: 6,
        otro: 16
      },
      totalClientes: 1340,
      referidos: 725,
      contratos: 540,
      tiempoActivacion: [
        { tiempo: '4 días', tipo: 'Naturgy' },
        { tiempo: '8 días', tipo: 'Endesa' },
        { tiempo: '2 días', tipo: 'Iberdrola' },
        { tiempo: '...', tipo: '...' }
      ],
      distribucionTipo: {
        particulares: { cantidad: 1150, percentage: 72.8 },
        empresas: { cantidad: 190, percentage: 19.9 }
      },
      ventasCarretera: 122
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando perfil del agente...</p>
        </div>
      </div>
    )
  }

  if (!agentData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">No se encontró información del agente</p>
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 bg-gray-50 min-h-screen">
      {/* Header con botón de regreso */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Volver al Dashboard
        </button>

        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={agentData.avatar || '/avatar.png'} alt={agentData.name} />
            <AvatarFallback className="bg-blue-500 text-white text-xl">
              {agentData.name?.charAt(0) || 'A'}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{agentData.name}</h1>
            <p className="text-gray-500">
              {agentData.role === 'agente' ? 'Agente' : agentData.role === 'colaborador' ? 'Colaborador' : agentData.role}
            </p>
            {agentData.email && (
              <p className="text-sm text-gray-400">{agentData.email}</p>
            )}
          </div>
        </div>
      </div>

      {/* Grid superior - Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Days Left */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">Days Left</h3>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-3xl font-bold">{agentData.daysLeft.current}</span>
            <span className="text-sm text-gray-500">/ {agentData.daysLeft.total}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
            <div
              className="bg-blue-500 h-3 rounded-full"
              style={{ width: `${agentData.daysLeft.percentage}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 text-right">{agentData.daysLeft.percentage}%</p>
        </div>

        {/* Contratos */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-semibold text-gray-600 mb-3">Contratos / Activos</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-red-500"></div>
              <span className="text-xs text-gray-600">Confirmados</span>
              <span className="ml-auto text-sm font-medium">{agentData.contratos.confirmados}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-green-500"></div>
              <span className="text-xs text-gray-600">Activos</span>
              <span className="ml-auto text-sm font-bold text-green-600">{agentData.contratos.activos}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600 ml-5">Por activarse</span>
              <span className="ml-auto text-sm">{agentData.contratos.porActivarse}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
              <span className="text-xs text-gray-600">Retiros</span>
              <span className="ml-auto text-sm">{agentData.contratos.retiros}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-red-500"></div>
              <span className="text-xs text-gray-600">Cancelados</span>
              <span className="ml-auto text-sm">{agentData.contratos.cancelados}</span>
            </div>
          </div>
        </div>

        {/* Historial de Puntos */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Historial de Puntos</h3>
          <div className="border-2 border-gray-900 rounded p-3">
            {agentData.historialPuntos.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center py-1">
                <span className="text-xs text-gray-900">{item.cliente}</span>
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
            <p className="text-xs text-gray-600">Puntos Restantes</p>
            <p className="text-2xl font-bold">{agentData.puntosRestantes}</p>
          </div>
        </div>
      </div>

      {/* Grid de gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Media Mensual */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Media Mensual</h3>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold">{agentData.mediaMensual.value}</span>
                <span className="text-sm text-gray-500">/{agentData.mediaMensual.unit}</span>
              </div>
            </div>
            <span className="text-sm text-green-600">+{agentData.mediaMensual.change}%</span>
          </div>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={agentData.mediaMensual.data}>
                <Area type="monotone" dataKey="value" stroke="#3B82F6" fill="#93C5FD" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* % Conversión */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">% Conversión</h3>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold">{agentData.conversion.percentage}%</span>
              </div>
            </div>
            <span className="text-sm text-red-600">{agentData.conversion.change}%</span>
          </div>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={agentData.conversion.data}>
                <Area type="monotone" dataKey="value" stroke="#10B981" fill="#86EFAC" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Puntos medio/venta */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Puntos medio/venta</h3>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold">{agentData.puntosMedioVenta.value}</span>
              </div>
            </div>
            <span className="text-sm text-green-600">+{agentData.puntosMedioVenta.change}%</span>
          </div>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={agentData.puntosMedioVenta.data}>
                <Area type="monotone" dataKey="value" stroke="#F59E0B" fill="#FCD34D" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Comisión media */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Comisión media</h3>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold">{agentData.comisionMedia.value} {agentData.comisionMedia.currency}</span>
              </div>
            </div>
            <span className="text-sm text-red-600">{agentData.comisionMedia.change}%</span>
          </div>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={agentData.comisionMedia.data}>
                <Area type="monotone" dataKey="value" stroke="#EC4899" fill="#FBCFE8" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Histórico Comisiones */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Histórico Comisiones</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Mes</th>
                <th className="px-4 py-2 text-left">Comisión</th>
                <th className="px-4 py-2 text-left">Ventas/Objetivo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {agentData.historicoComisiones.map((item, idx) => (
                <tr key={idx}>
                  <td className="px-4 py-2 text-sm">{item.mes}</td>
                  <td className="px-4 py-2 text-sm text-green-600 font-bold">{item.comision}$</td>
                  <td className="px-4 py-2 text-sm">{item.ventasObjetivo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grid inferior - Métricas adicionales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Estados */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Estados</h3>
          <div className="space-y-2">
            {agentData.estados.map((estado, idx) => (
              <div key={idx}>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-gray-600">{estado.name}</span>
                  <span className="font-medium">{estado.percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-blue-500 h-1.5 rounded-full"
                    style={{ width: `${estado.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Distribución de Género */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Distribución</h3>
          <div className="flex justify-center gap-6">
            <div className="text-center">
              <div className="text-3xl mb-1">♀</div>
              <p className="text-xl font-bold">{agentData.distribucionGenero.hombre}</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-1">♂</div>
              <p className="text-xl font-bold">{agentData.distribucionGenero.mujer}%</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-1">⚧</div>
              <p className="text-xl font-bold">{agentData.distribucionGenero.otro}%</p>
            </div>
          </div>
        </div>

        {/* Métricas */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-red-300 text-xl">👥</span>
                <span className="text-xs text-gray-600">Total Clientes</span>
              </div>
              <p className="text-2xl font-bold ml-7">{agentData.totalClientes}</p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-yellow-300 text-xl">👤</span>
                <span className="text-xs text-gray-600">Referidos</span>
              </div>
              <p className="text-2xl font-bold ml-7">{agentData.referidos}</p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-blue-300 text-xl">📄</span>
                <span className="text-xs text-gray-600">Contratos</span>
              </div>
              <p className="text-2xl font-bold ml-7">{agentData.contratos}</p>
            </div>
          </div>
        </div>

        {/* Tiempo medio activación */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Tiempo medio Activ</h3>
          <div className="space-y-2">
            {agentData.tiempoActivacion.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs">
                <span className="text-gray-600">{item.tiempo}</span>
                <span className="font-medium">{item.tipo}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Grid final - Distribuciones */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Publicidad */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Publicidad</h3>
          <div className="border-2 border-gray-900 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold mb-1">{agentData.distribucionTipo.particulares.percentage}%</p>
            <p className="text-xs text-gray-600">margen</p>
          </div>
        </div>

        {/* Otros */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Otros</h3>
          <div className="border-2 border-gray-900 rounded-full w-24 h-24 mx-auto flex items-center justify-center">
            <p className="text-2xl font-bold">{agentData.distribucionTipo.empresas.percentage}%</p>
          </div>
        </div>

        {/* Ventas Carretera */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Ventas Carretera</h3>
          <div className="flex items-center justify-center gap-3 mt-6">
            <span className="text-green-400 text-3xl">💎</span>
            <p className="text-4xl font-bold">{agentData.ventasCarretera}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
