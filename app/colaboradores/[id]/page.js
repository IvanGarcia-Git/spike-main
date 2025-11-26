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
        const transformedData = transformBackendData(backendData)
        console.log('Transformed data:', transformedData)
        setColaboradorData(transformedData)
      } else {
        const errorData = await response.json()
        console.error('API error:', response.status, errorData)
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
    const crecimiento = data.cumplimientoObjetivo?.crecimiento || 0

    const historicoComisiones = data.historialComisiones?.map(h => {
      const fecha = new Date(h.fecha)
      const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
      return {
        mes: meses[fecha.getMonth()] || 'N/A',
        comision: Math.round(h.comision || 0),
        contratos: h.contratos || 0
      }
    }) || []

    const historicoMensual = data.historicoMensual || []

    return {
      id: data.id,
      name: data.name,
      role: data.role,
      avatar: data.avatar,
      email: data.email,
      phone: data.phone,
      shift: data.shift,

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

      historicoComisiones,

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

      estados: data.clientesPorTipo?.porTipo?.map((t, idx) => ({
        name: t.tipo,
        percentage: t.porcentaje,
        valor: t.cantidad || 0,
        cambio: idx % 2 === 0 ? Math.abs(crecimiento) : -Math.abs(crecimiento)
      })) || [],

      compañias: data.clientesPorTipo?.porCompania?.map(c => ({
        nombre: c.compania,
        valor: c.cantidad || 0
      })) || [],

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

      ventasPorAgente: historicoMensual.map(h => ({
        agente: h.mes,
        ventas: h.contratos || 0
      })),

      tiempoActivacion: data.clientesPorTipo?.porCompania?.slice(0, 5).map(c => ({
        tipo: c.compania,
        tiempo: 0,
        empresa: c.compania,
        contrato: c.cantidad || 0
      })) || [],

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
      <div className="flex items-center justify-center min-h-screen bg-background-light">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-slate-600">Cargando perfil del colaborador...</p>
        </div>
      </div>
    )
  }

  if (!colaboradorData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background-light">
        <p className="text-slate-600">No se encontró información del colaborador</p>
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
              <AvatarImage src={colaboradorData.avatar || '/avatar.png'} alt={colaboradorData.name} />
              <AvatarFallback className="bg-primary text-white text-xl">
                {colaboradorData.name?.charAt(0) || 'C'}
              </AvatarFallback>
            </Avatar>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{colaboradorData.name}</h1>
            <p className="text-slate-500">
              {colaboradorData.role === 'colaborador' ? 'Colaborador' : colaboradorData.role === 'agente' ? 'Agente' : colaboradorData.role}
            </p>
            {colaboradorData.email && (
              <p className="text-sm text-slate-400">{colaboradorData.email}</p>
            )}
          </div>
        </div>
      </div>

      {/* Primera fila - Gráfico grande y tarjetas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Gráfico de ventas diarias */}
        <div className="lg:col-span-2 neumorphic-card p-6">
          <h3 className="text-sm font-semibold text-slate-600 mb-4">Ventas por Período</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={colaboradorData.ventasDiarias}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E4E7" />
                <XAxis dataKey="dia" tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#F0F2F5',
                    border: 'none',
                    borderRadius: '0.75rem',
                    boxShadow: '3px 3px 6px #d9dbde, -3px -3px 6px #ffffff'
                  }}
                />
                <Area type="monotone" dataKey="contratos" stroke="#14b8a6" fill="rgba(20, 184, 166, 0.2)" />
                <Area type="monotone" dataKey="dinero" stroke="#10B981" fill="rgba(16, 185, 129, 0.2)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tarjetas de métricas principales */}
        <div className="space-y-6">
          {/* Contratos Activos */}
          <div className="neumorphic-card p-6">
            <h3 className="text-sm font-semibold text-slate-600 mb-2">Contratos Activos</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-slate-800">{colaboradorData.contratosActivos}</span>
              <span className={`text-sm font-medium ${
                colaboradorData.contratosActivosCrecimiento >= 0 ? 'text-green-500' : 'text-red-500'
              }`}>
                {colaboradorData.contratosActivosCrecimiento >= 0 ? '+' : ''}{colaboradorData.contratosActivosCrecimiento}%
              </span>
            </div>
          </div>

          {/* Predicción de Ventas */}
          <div className="neumorphic-card p-6">
            <h3 className="text-sm font-semibold text-slate-600 mb-3">Predicción de Ventas total</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-baseline">
                <span className="text-2xl font-bold text-slate-800">{colaboradorData.prediccionVentasTotal.ventas}</span>
                <span className="text-2xl font-bold text-primary">{colaboradorData.prediccionVentasTotal.dinero}€</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Segunda fila - Métricas con gráficos pequeños */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* Nº Clientes */}
        <div className="neumorphic-card p-6">
          <h3 className="text-sm font-semibold text-slate-800 mb-2">Nº Clientes</h3>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-bold text-slate-800">{colaboradorData.numeroClientes.valor}</span>
            <span className={`text-sm font-medium ${colaboradorData.numeroClientes.crecimiento >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {colaboradorData.numeroClientes.crecimiento >= 0 ? '+' : ''}{colaboradorData.numeroClientes.crecimiento}%
            </span>
          </div>
          <div className="h-20">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={colaboradorData.ventasDiarias.map(d => ({ v: d.contratos }))}>
                <Area type="monotone" dataKey="v" stroke="#14b8a6" fill="rgba(20, 184, 166, 0.2)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Retiros */}
        <div className="neumorphic-card p-6">
          <h3 className="text-sm font-semibold text-slate-800 mb-2">Retiros</h3>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-bold text-slate-800">{colaboradorData.retiros.valor}</span>
            <span className={`text-sm font-medium ${colaboradorData.retiros.cambio >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {colaboradorData.retiros.cambio}
            </span>
          </div>
          <div className="h-20">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={colaboradorData.ventasDiarias.map(d => ({ v: d.contratos }))}>
                <Area type="monotone" dataKey="v" stroke="#10B981" fill="rgba(16, 185, 129, 0.2)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Clientes medios */}
        <div className="neumorphic-card p-6">
          <h3 className="text-sm font-semibold text-slate-800 mb-2">Clientes medios</h3>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-bold text-slate-800">{colaboradorData.clientesMedios.valor}</span>
            <span className="text-sm text-slate-500">/{colaboradorData.clientesMedios.unidad}</span>
            <span className={`text-sm font-medium ${colaboradorData.clientesMedios.crecimiento >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {colaboradorData.clientesMedios.crecimiento >= 0 ? '+' : ''}{colaboradorData.clientesMedios.crecimiento}%
            </span>
          </div>
          <div className="h-20">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={colaboradorData.ventasDiarias.map(d => ({ v: d.contratos }))}>
                <Area type="monotone" dataKey="v" stroke="#F59E0B" fill="rgba(245, 158, 11, 0.2)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Comisión media */}
        <div className="neumorphic-card p-6">
          <h3 className="text-sm font-semibold text-slate-800 mb-2">Comisión media</h3>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-bold text-slate-800">{colaboradorData.comisionMedia.valor}</span>
            <span className="text-sm text-slate-500">{colaboradorData.comisionMedia.unidad}</span>
            <span className={`text-sm font-medium ${colaboradorData.comisionMedia.crecimiento >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {colaboradorData.comisionMedia.crecimiento >= 0 ? '+' : ''}{colaboradorData.comisionMedia.crecimiento}%
            </span>
          </div>
          <div className="h-20">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={colaboradorData.historicoComisiones.map(h => ({ v: h.comision }))}>
                <Area type="monotone" dataKey="v" stroke="#EC4899" fill="rgba(236, 72, 153, 0.2)" />
              </AreaChart>
            </ResponsiveContainer>
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
                <th className="p-3">Contratos</th>
              </tr>
            </thead>
            <tbody>
              {colaboradorData.historicoComisiones.map((item, idx) => (
                <tr key={idx} className="table-row-divider">
                  <td className="p-3 font-medium text-slate-800">{item.mes}</td>
                  <td className="p-3 text-green-600 font-bold">{item.comision}€</td>
                  <td className="p-3 text-slate-600">{item.contratos || '...'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Gráfico de barras - Ventas por mes */}
      <div className="neumorphic-card p-6 mb-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Ventas por Mes</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={colaboradorData.ventasPorAgente}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E4E7" />
              <XAxis dataKey="agente" tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#F0F2F5',
                  border: 'none',
                  borderRadius: '0.75rem',
                  boxShadow: '3px 3px 6px #d9dbde, -3px -3px 6px #ffffff'
                }}
              />
              <Bar dataKey="ventas" fill="#14b8a6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid inferior - Información detallada */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* Estados */}
        <div className="neumorphic-card p-6">
          <h3 className="text-sm font-semibold text-slate-800 mb-3">Estados</h3>
          <div className="space-y-3">
            {colaboradorData.estados.map((estado, idx) => (
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
                  <span className="text-lg">👤</span>
                </div>
                <span className="text-xs text-slate-600">Particulares</span>
              </div>
              <span className="text-lg font-bold text-slate-800">{colaboradorData.distribucionTipo.particulares.porcentaje}%</span>
            </div>
            <div className="neumorphic-progress-track h-2">
              <div
                className="bg-primary h-2 rounded-full"
                style={{ width: `${colaboradorData.distribucionTipo.particulares.porcentaje}%` }}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full neumorphic-card-inset flex items-center justify-center">
                  <span className="text-lg">🏢</span>
                </div>
                <span className="text-xs text-slate-600">Empresas</span>
              </div>
              <span className="text-lg font-bold text-slate-800">{colaboradorData.distribucionTipo.empresas.porcentaje}%</span>
            </div>
            <div className="neumorphic-progress-track h-2">
              <div
                className="bg-purple-500 h-2 rounded-full"
                style={{ width: `${colaboradorData.distribucionTipo.empresas.porcentaje}%` }}
              />
            </div>
            <div className="text-center pt-2">
              <p className="text-xs text-slate-500">Total: {colaboradorData.distribucionTipo.total} clientes</p>
            </div>
          </div>
        </div>

        {/* Tiempo medio Activ */}
        <div className="neumorphic-card p-6">
          <h3 className="text-sm font-semibold text-slate-800 mb-3">Tiempo medio Activ</h3>
          <div className="neumorphic-card-inset rounded-lg p-3">
            <div className="space-y-2">
              {colaboradorData.tiempoActivacion.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs">
                  <span className="text-slate-600">{item.tiempo > 0 ? `${item.tiempo} días` : '-'}</span>
                  <span className="font-medium text-slate-800">{item.tipo}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Posibles Renovaciones */}
        <div className="neumorphic-card p-6">
          <h3 className="text-sm font-semibold text-slate-800 mb-3">Posibles Renovaciones</h3>
          <div className="neumorphic-card-inset rounded-lg p-4 text-center">
            <p className="text-xs text-slate-600 mb-1">Total</p>
            <span className="text-4xl font-bold text-slate-800">{colaboradorData.posiblesRenovaciones.total}</span>
          </div>
          {colaboradorData.posiblesRenovaciones.clientes.length > 0 && (
            <div className="mt-4 space-y-2">
              {colaboradorData.posiblesRenovaciones.clientes.map((cliente, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs">
                  <div className="h-2 flex-1 neumorphic-progress-track">
                    <div className="bg-primary h-2 rounded-full" style={{ width: '60%' }} />
                  </div>
                  <span className="font-medium text-slate-600">{cliente.tipo}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Fila final - Distribuciones adicionales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Publicidad */}
        <div className="neumorphic-card p-6">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Publicidad</h3>
          <div className="neumorphic-card-inset rounded-lg p-6 text-center">
            <p className="text-3xl font-bold text-slate-800 mb-1">{colaboradorData.distribucionTipo.particulares.porcentaje}%</p>
            <p className="text-xs text-slate-500">margen</p>
          </div>
        </div>

        {/* Otros */}
        <div className="neumorphic-card p-6">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Otros</h3>
          <div className="w-24 h-24 rounded-full neumorphic-card-inset mx-auto flex items-center justify-center">
            <p className="text-2xl font-bold text-slate-800">{colaboradorData.distribucionTipo.empresas.porcentaje}%</p>
          </div>
        </div>

        {/* Total Contratos */}
        <div className="neumorphic-card p-6">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Total Contratos</h3>
          <div className="flex items-center justify-center gap-4 mt-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center shadow-neumorphic-light-lg">
              <span className="text-primary text-2xl">📄</span>
            </div>
            <p className="text-4xl font-bold text-slate-800">{colaboradorData.contratosActivos}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
