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

export default function ColaboradorProfile() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const nameFromUrl = searchParams.get('name')
  const [loading, setLoading] = useState(true)
  const [colaboradorData, setColaboradorData] = useState(null)

  useEffect(() => {
    fetchColaboradorData()
  }, [params.id])

  const fetchColaboradorData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/colaboradores/${params.id}`)

      console.log('Response status:', response.status)

      if (response.ok) {
        const backendData = await response.json()
        console.log('Backend data received:', backendData)
        // Transformar datos del backend al formato del frontend
        const transformedData = transformBackendData(backendData)
        console.log('Transformed data:', transformedData)
        setColaboradorData(transformedData)
      } else {
        const errorData = await response.json()
        console.error('API error:', response.status, errorData)
        // Usar datos de fallback para desarrollo
        setColaboradorData(generateFallbackData())
      }
    } catch (error) {
      console.error('Error fetching colaborador data:', error)
      setColaboradorData(generateFallbackData())
    } finally {
      setLoading(false)
    }
  }

  const transformBackendData = (data) => {
    // Calcular crecimiento basado en cumplimiento objetivo
    const crecimiento = data.cumplimientoObjetivo?.crecimiento || 0

    // Mapear historial de comisiones desde el backend
    const historicoComisiones = data.historialComisiones?.map(h => {
      const fecha = new Date(h.fecha)
      const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
      return {
        mes: meses[fecha.getMonth()] || 'N/A',
        comision: Math.round(h.comision || 0),
        contratos: h.contratos || 0
      }
    }) || []

    // Mapear histórico mensual para gráficos
    const historicoMensual = data.historicoMensual || []

    return {
      id: data.id,
      name: data.name,
      role: data.role,
      avatar: data.avatar,
      email: data.email,
      phone: data.phone,
      shift: data.shift,

      // Estadísticas principales
      contratosActivos: data.stats?.contratosActivos || 0,
      contratosActivosCrecimiento: crecimiento,

      prediccionVentasTotal: {
        ventas: data.stats?.ingresos?.puntos || 0,
        dinero: Math.round(data.stats?.prediccionVentas || 0)
      },

      numeroClientes: {
        valor: data.stats?.clientes?.total || 0,
        crecimiento: data.stats?.clientes?.total > 0
          ? Math.round(((data.stats?.clientes?.nuevosMes || 0) / data.stats?.clientes?.total) * 100)
          : 0
      },

      retiros: {
        valor: 0,
        cambio: 0
      },

      clientesMedios: {
        valor: data.stats?.comisionMedia?.diaria || 0,
        unidad: '€/día',
        crecimiento: crecimiento
      },

      comisionMedia: {
        valor: data.stats?.comisionMedia?.mensual || 0,
        unidad: '€',
        crecimiento: crecimiento
      },

      // Histórico de comisiones
      historicoComisiones,

      // Histórico mensual para ventas diarias - usar datos reales del backend
      ventasDiarias: historicoMensual.length > 0
        ? historicoMensual.map(h => ({
            dia: h.mes,
            contratos: h.contratos || 0,
            dinero: 0
          }))
        : Array.from({ length: 6 }, (_, i) => ({
            dia: `Mes ${i + 1}`,
            contratos: 0,
            dinero: 0
          })),

      // Distribución de clientes por tipo
      estados: data.clientesPorTipo?.porTipo?.map((t, idx) => ({
        name: t.tipo,
        percentage: t.porcentaje,
        valor: t.cantidad || 0,
        cambio: idx % 2 === 0 ? Math.abs(crecimiento) : -Math.abs(crecimiento)
      })) || [],

      // Compañías
      compañias: data.clientesPorTipo?.porCompania?.map(c => ({
        nombre: c.compania,
        valor: c.cantidad || 0
      })) || [],

      // Distribución de tipo de cliente (Particulares vs Empresas)
      distribucionTipo: {
        particulares: {
          cantidad: data.clientesPorTipo?.distribucionClientesTipo?.particulares?.cantidad || 0,
          porcentaje: data.clientesPorTipo?.distribucionClientesTipo?.particulares?.porcentaje || 0
        },
        empresas: {
          cantidad: data.clientesPorTipo?.distribucionClientesTipo?.empresas?.cantidad || 0,
          porcentaje: data.clientesPorTipo?.distribucionClientesTipo?.empresas?.porcentaje || 0
        },
        total: data.clientesPorTipo?.distribucionClientesTipo?.total || 0
      },

      // Ventas por mes (histórico mensual)
      ventasPorAgente: historicoMensual.map(h => ({
        agente: h.mes,
        ventas: h.contratos || 0
      })),

      // Tiempos de activación (desde compañías si disponible)
      tiempoActivacion: data.clientesPorTipo?.porCompania?.slice(0, 5).map(c => ({
        tipo: c.compania,
        tiempo: 0,
        empresa: c.compania,
        contrato: c.cantidad || 0
      })) || [],

      // Posibles renovaciones
      posiblesRenovaciones: {
        total: data.stats?.contratosActivos || 0,
        clientes: []
      }
    }
  }

  const generateFallbackData = () => {
    const monthNames = ['Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov']

    return {
      id: params.id,
      name: nameFromUrl || `Colaborador ${params.id}`,
      role: 'colaborador',
      avatar: null,
      email: null,
      contratosActivos: 0,
      contratosActivosCrecimiento: 0,
      prediccionVentasTotal: {
        ventas: 0,
        dinero: 0
      },
      ventasDiarias: Array.from({ length: 12 }, (_, i) => ({
        dia: `Día ${i + 1}`,
        contratos: 0,
        dinero: 0
      })),
      numeroClientes: {
        valor: 0,
        crecimiento: 0
      },
      retiros: {
        valor: 0,
        cambio: 0
      },
      clientesMedios: {
        valor: 0,
        unidad: '€/día',
        crecimiento: 0
      },
      comisionMedia: {
        valor: 0,
        unidad: '€',
        crecimiento: 0
      },
      historicoComisiones: [],
      ventasPorAgente: monthNames.map((mes, i) => ({
        agente: mes,
        ventas: 0
      })),
      estados: [],
      distribucionTipo: {
        particulares: { cantidad: 0, porcentaje: 0 },
        empresas: { cantidad: 0, porcentaje: 0 },
        total: 0
      },
      compañias: [],
      tiempoActivacion: [],
      posiblesRenovaciones: {
        total: 0,
        clientes: []
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando perfil del colaborador...</p>
        </div>
      </div>
    )
  }

  if (!colaboradorData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">No se encontró información del colaborador</p>
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
            <AvatarImage src={colaboradorData.avatar || '/avatar.png'} alt={colaboradorData.name} />
            <AvatarFallback className="bg-purple-500 text-white text-xl">
              {colaboradorData.name?.charAt(0) || 'C'}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{colaboradorData.name}</h1>
            <p className="text-gray-500">
              {colaboradorData.role === 'colaborador' ? 'Colaborador' : colaboradorData.role === 'agente' ? 'Agente' : colaboradorData.role}
            </p>
            {colaboradorData.email && (
              <p className="text-sm text-gray-400">{colaboradorData.email}</p>
            )}
          </div>
        </div>
      </div>

      {/* Primera fila - Gráfico grande y tarjetas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Gráfico de ventas diarias */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={colaboradorData.ventasDiarias}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="dia" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="contratos" stroke="#3B82F6" fill="#93C5FD" fillOpacity={0.6} />
                <Area type="monotone" dataKey="dinero" stroke="#10B981" fill="#86EFAC" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tarjetas de métricas principales */}
        <div className="space-y-4">
          {/* Contratos Activos */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">Contratos Activos</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold">{colaboradorData.contratosActivos}</span>
              <span className={`text-sm font-medium ${
                colaboradorData.contratosActivosCrecimiento >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {colaboradorData.contratosActivosCrecimiento >= 0 ? '+' : ''}{colaboradorData.contratosActivosCrecimiento}%
              </span>
            </div>
          </div>

          {/* Predicción de Ventas */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-semibold text-gray-600 mb-3">Predicción de Ventas total</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-baseline">
                <span className="text-2xl font-bold">{colaboradorData.prediccionVentasTotal.ventas}</span>
                <span className="text-2xl font-bold text-blue-600">{colaboradorData.prediccionVentasTotal.dinero}€</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Segunda fila - Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Nº Clientes */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Nº Clientes</h3>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-bold">{colaboradorData.numeroClientes.valor}</span>
            <span className={`text-sm ${colaboradorData.numeroClientes.crecimiento >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {colaboradorData.numeroClientes.crecimiento >= 0 ? '+' : ''}{colaboradorData.numeroClientes.crecimiento}%
            </span>
          </div>
          <div className="h-20">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={colaboradorData.ventasDiarias.map(d => ({ v: d.contratos }))}>
                <Line type="monotone" dataKey="v" stroke="#3B82F6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Retiros */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Retiros</h3>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-bold">{colaboradorData.retiros.valor}</span>
            <span className={`text-sm ${colaboradorData.retiros.cambio >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {colaboradorData.retiros.cambio}
            </span>
          </div>
          <div className="h-20">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={colaboradorData.ventasDiarias.map(d => ({ v: d.contratos }))}>
                <Area type="monotone" dataKey="v" stroke="#10B981" fill="#86EFAC" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Clientes medios */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Clientes medios</h3>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-bold">{colaboradorData.clientesMedios.valor}</span>
            <span className="text-sm text-gray-500">/{colaboradorData.clientesMedios.unidad}</span>
            <span className={`text-sm ${colaboradorData.clientesMedios.crecimiento >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {colaboradorData.clientesMedios.crecimiento >= 0 ? '+' : ''}{colaboradorData.clientesMedios.crecimiento}%
            </span>
          </div>
          <div className="h-20">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={colaboradorData.ventasDiarias.map(d => ({ v: d.contratos }))}>
                <Line type="monotone" dataKey="v" stroke="#FCD34D" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Comisión media */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Comisión media</h3>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-bold">{colaboradorData.comisionMedia.valor}</span>
            <span className="text-sm text-gray-500">{colaboradorData.comisionMedia.unidad}</span>
            <span className={`text-sm ${colaboradorData.comisionMedia.crecimiento >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {colaboradorData.comisionMedia.crecimiento >= 0 ? '+' : ''}{colaboradorData.comisionMedia.crecimiento}%
            </span>
          </div>
          <div className="h-20">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={colaboradorData.historicoComisiones.map(h => ({ v: h.comision }))}>
                <Area type="monotone" dataKey="v" stroke="#EC4899" fill="#FBCFE8" />
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
                <th className="px-4 py-2 text-left">Contratos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {colaboradorData.historicoComisiones.map((item, idx) => (
                <tr key={idx}>
                  <td className="px-4 py-2 text-sm">{item.mes}</td>
                  <td className="px-4 py-2 text-sm text-green-600 font-bold">{item.comision}$</td>
                  <td className="px-4 py-2 text-sm">{item.contratos || '...'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Gráfico de barras - Ventas por agente */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={colaboradorData.ventasPorAgente}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="agente" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="ventas" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid inferior - Información detallada */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Estados */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Estados</h3>
          <div className="space-y-3">
            {colaboradorData.estados.map((estado, idx) => (
              <div key={idx}>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-gray-900 font-medium">{estado.name}</span>
                  <div className="flex gap-2 items-center">
                    <span className={`font-medium ${
                      estado.cambio >= 0 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {estado.cambio >= 0 ? '+' : ''}{estado.cambio}€
                    </span>
                    <span className="font-bold">{estado.percentage}%</span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${estado.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Distribución de Clientes */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Distribución de Clientes</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">👤</span>
                <span className="text-sm text-gray-600">Particulares</span>
              </div>
              <span className="text-xl font-bold">{colaboradorData.distribucionTipo.particulares.porcentaje}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full"
                style={{ width: `${colaboradorData.distribucionTipo.particulares.porcentaje}%` }}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🏢</span>
                <span className="text-sm text-gray-600">Empresas</span>
              </div>
              <span className="text-xl font-bold">{colaboradorData.distribucionTipo.empresas.porcentaje}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-500 h-2 rounded-full"
                style={{ width: `${colaboradorData.distribucionTipo.empresas.porcentaje}%` }}
              />
            </div>
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-gray-500 text-center">
                Total: {colaboradorData.distribucionTipo.total} clientes
              </p>
            </div>
          </div>
        </div>

        {/* Tiempo medio Activ */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Tiempo medio Activ</h3>
          <div className="space-y-3">
            {colaboradorData.tiempoActivacion.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center gap-2">
                  {item.tipo && (
                    <>
                      <span className="text-xs text-gray-600">{item.tipo}</span>
                      <span className="text-xs font-medium">{item.empresa}</span>
                    </>
                  )}
                </div>
                <div className="flex justify-between text-xs">
                  <span className="font-bold">{item.tiempo > 0 ? `${item.tiempo} días` : ''}</span>
                  <span className="text-gray-600">{item.tipo}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="font-bold">{item.tiempo > 0 ? `${item.tiempo} días` : ''}</span>
                  <span className="text-gray-600">{item.tipo === 'Empresas' ? 'Naturgy' : item.tipo === 'Particulares' ? 'Endesa' : ''}</span>
                </div>
                {item.tipo === 'Particulares' && (
                  <div className="flex justify-between text-xs">
                    <span className="font-bold">2 días</span>
                    <span className="text-gray-600">Iberdrola</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Posibles Renovaciones */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Posibles Renovaciones</h3>
          <div className="text-center mb-4">
            <span className="text-4xl font-bold">Total {colaboradorData.posiblesRenovaciones.total}</span>
          </div>
          <div className="border-2 border-gray-900 rounded p-3 space-y-2">
            {colaboradorData.posiblesRenovaciones.clientes.map((cliente, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="h-4 w-full bg-gray-200 rounded"></div>
                <span className="text-xs font-medium">{cliente.tipo}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
