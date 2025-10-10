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

export default function ColaboradorProfile() {
  const params = useParams()
  const router = useRouter()
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
    // Calcular crecimiento basado en histórico
    const crecimiento = data.historicoMensual && data.historicoMensual.length >= 2
      ? Math.round(((data.historicoMensual[data.historicoMensual.length - 1]?.contratos || 0) -
          (data.historicoMensual[data.historicoMensual.length - 2]?.contratos || 0)) /
          (data.historicoMensual[data.historicoMensual.length - 2]?.contratos || 1) * 100)
      : 0

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
        ventas: Math.round(data.stats?.prediccionVentas || 0),
        dinero: Math.round(data.stats?.ingresos?.mes || 0)
      },

      numeroClientes: {
        valor: data.stats?.clientes?.total || 0,
        crecimiento: Math.round(((data.stats?.clientes?.nuevosMes || 0) / (data.stats?.clientes?.total || 1)) * 100)
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
      historicoComisiones: data.historialComisiones?.map(h => ({
        mes: h.mes,
        comision: h.comision,
        contratos: h.contratos || 0
      })) || [],

      // Histórico mensual para ventas diarias
      ventasDiarias: Array.from({ length: 12 }, (_, i) => {
        const monthData = data.historicoMensual?.[i] || {}
        return {
          dia: `Día ${i + 1}`,
          contratos: monthData.contratos || 0,
          dinero: Math.round(monthData.comision || 0)
        }
      }),

      // Distribución de clientes
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

      // Distribución de género (simulado)
      distribucionGenero: {
        mujer: { emoji: '♀', porcentaje: 9 },
        hombre: { emoji: '♂', porcentaje: 6 },
        otro: { emoji: '⚧', porcentaje: 16 }
      },

      // Ventas por agente
      ventasPorAgente: data.historicoMensual?.map((h, i) => ({
        agente: `${h.mes?.substring(0, 1)}${i + 1}`,
        ventas: h.contratos || 0
      })) || []
    }
  }

  const generateFallbackData = () => {
    return {
      id: params.id,
      name: 'María López',
      role: 'Colaborador',
      avatar: null,
      contratosActivos: 336,
      contratosActivosCrecimiento: 12,
      prediccionVentasTotal: {
        ventas: 552,
        dinero: 5203
      },
      ventasDiarias: [
        { dia: 'Aug 1', contratos: 4, dinero: 6 },
        { dia: 'Aug 2', contratos: 10, dinero: 5 },
        { dia: 'Aug 3', contratos: 5, dinero: 4 },
        { dia: 'Aug 4', contratos: 3, dinero: 3 },
        { dia: 'Aug 5', contratos: 2, dinero: 5 },
        { dia: 'Aug 6', contratos: 4, dinero: 6 },
        { dia: 'Aug 7', contratos: 8, dinero: 7 },
        { dia: 'Aug 8', contratos: 7, dinero: 8 },
        { dia: 'Aug 9', contratos: 10, dinero: 6 },
        { dia: 'Aug 10', contratos: 14, dinero: 7 },
        { dia: 'Aug 11', contratos: 9, dinero: 8 },
        { dia: 'Aug 12', contratos: 7, dinero: 8 }
      ],
      numeroClientes: {
        valor: 196,
        crecimiento: 12
      },
      retiros: {
        valor: -92,
        cambio: -986
      },
      clientesMedios: {
        valor: 5.6,
        unidad: 'día',
        crecimiento: 12
      },
      comisionMedia: {
        valor: 349.3,
        unidad: '€/día',
        crecimiento: 4
      },
      historicoComisiones: [
        { mes: 'Enero', comision: 7929, contratos: 118 },
        { mes: 'Febrero', comision: 5629, contratos: 93 },
        { mes: 'Marzo', comision: 5329, contratos: 0 },
        { mes: 'Abril', comision: 4529, contratos: 0 },
        { mes: 'Mayo', comision: 3229, contratos: 0 },
        { mes: 'Junio', comision: 3229, contratos: 0 }
      ],
      ventasPorAgente: [
        { agente: 'L1', ventas: 3 },
        { agente: 'M1', ventas: 5 },
        { agente: 'X3', ventas: 8 },
        { agente: 'J4', ventas: 6 },
        { agente: 'V5', ventas: 6 },
        { agente: 'L7', ventas: 4 },
        { agente: 'M8', ventas: 4 },
        { agente: 'X10', ventas: 5 },
        { agente: '', ventas: 8 },
        { agente: '', ventas: 6 },
        { agente: '', ventas: 4 },
        { agente: 'L15', ventas: 9 },
        { agente: '', ventas: 5 },
        { agente: '', ventas: 5 },
        { agente: '', ventas: 8 },
        { agente: '', ventas: 6 },
        { agente: '', ventas: 4 },
        { agente: '', ventas: 4 },
        { agente: '', ventas: 8 },
        { agente: '', ventas: 6 },
        { agente: '', ventas: 5 },
        { agente: '', ventas: 8 },
        { agente: '', ventas: 4 },
        { agente: '', ventas: 10 },
        { agente: '', ventas: 4 },
        { agente: '', ventas: 5 },
        { agente: '', ventas: 7 },
        { agente: '', ventas: 6 },
        { agente: '', ventas: 6 }
      ],
      estados: [
        { name: 'Pagado', percentage: 97, valor: 97, cambio: 76 },
        { name: 'Activo', percentage: 83, valor: 783, cambio: 24 },
        { name: 'Pdte. Firma', percentage: 80, valor: 80, cambio: 76 },
        { name: 'En proceso', percentage: 44, valor: 44, cambio: 24 },
        { name: 'Otros', percentage: 73, valor: 73, cambio: 76 },
        { name: 'Retiro', percentage: 14, valor: 14, cambio: -24 }
      ],
      distribucionGenero: {
        mujer: { emoji: '♀', porcentaje: 9 },
        hombre: { emoji: '♂', porcentaje: 6 },
        otro: { emoji: '⚧', porcentaje: 16 }
      },
      compañias: [
        { nombre: 'Endesa', valor: 2500 },
        { nombre: 'Naturgy', valor: 2000 },
        { nombre: 'Iberdrola', valor: 1800 },
        { nombre: 'Repsol', valor: 1600 },
        { nombre: 'Eon', valor: 1200 },
        { nombre: 'Total', valor: 1000 },
        { nombre: 'Plenitude', valor: 500 }
      ],
      tiempoActivacion: [
        { tipo: 'Empresas', tiempo: 4, empresa: 'mmmm', contrato: 992 },
        { tipo: 'Particulares', tiempo: 4, empresa: 'PDC', contrato: 992 },
        { tipo: '', tiempo: 8, empresa: '', contrato: 0 },
        { tipo: '', tiempo: 2, empresa: '', contrato: 0 },
        { tipo: '', tiempo: 0, empresa: '', contrato: 0 }
      ],
      posiblesRenovaciones: {
        total: 93,
        clientes: [
          { nombre: 'Cliente P', tipo: 'P' },
          { nombre: 'Cliente P', tipo: 'P' },
          { nombre: 'Cliente P', tipo: 'P' },
          { nombre: 'Cliente P', tipo: 'P' },
          { nombre: 'Cliente P', tipo: 'P' },
          { nombre: 'Cliente P', tipo: 'P' }
        ]
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
            <span className="text-sm text-green-600">+{colaboradorData.numeroClientes.crecimiento}%</span>
          </div>
          <div className="h-20">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={[{v:4},{v:5},{v:3},{v:6},{v:5},{v:7}]}>
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
            <span className="text-sm text-red-600">{colaboradorData.retiros.cambio}</span>
          </div>
          <div className="h-20">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[{v:4},{v:3},{v:5},{v:4},{v:3},{v:2}]}>
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
            <span className="text-sm text-green-600">+{colaboradorData.clientesMedios.crecimiento}%</span>
          </div>
          <div className="h-20">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={[{v:4},{v:5},{v:4},{v:6},{v:5},{v:6}]}>
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
            <span className="text-sm text-green-600">+{colaboradorData.comisionMedia.crecimiento}%</span>
          </div>
          <div className="h-20">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[{v:4},{v:3},{v:5},{v:4},{v:5},{v:6}]}>
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

        {/* Distribución de Género */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{colaboradorData.distribucionGenero.mujer.emoji}</span>
                <span className="text-sm text-gray-600">♀</span>
              </div>
              <span className="text-xl font-bold">{colaboradorData.distribucionGenero.mujer.porcentaje}%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{colaboradorData.distribucionGenero.hombre.emoji}</span>
                <span className="text-sm text-gray-600">♂</span>
              </div>
              <span className="text-xl font-bold">{colaboradorData.distribucionGenero.hombre.porcentaje}%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{colaboradorData.distribucionGenero.otro.emoji}</span>
                <span className="text-sm text-gray-600">⚧</span>
              </div>
              <span className="text-xl font-bold">{colaboradorData.distribucionGenero.otro.porcentaje}%</span>
            </div>
            <div className="mt-4">
              <div className="flex gap-1 mb-2">
                {[...Array(7)].map((_, i) => (
                  <div key={i} className="flex-1 h-1 bg-gray-300 rounded"></div>
                ))}
              </div>
              <div className="space-y-2">
                {colaboradorData.compañias.map((comp, idx) => (
                  <div key={idx} className="flex justify-between text-xs">
                    <span className="text-gray-600">{comp.nombre}</span>
                    <div className="w-32 bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-blue-500 h-3 rounded-full"
                        style={{ width: `${(comp.valor / 2500) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
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
