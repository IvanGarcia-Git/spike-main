import { useState } from 'react'
import { CalendarIcon, FunnelIcon } from '@heroicons/react/24/outline'

export default function FilterPanel({ onFilterChange, showDateRange = true, showService = true, showAgent = true }) {
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    service: 'all',
    agent: 'all'
  })

  const handleChange = (key, value) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    if (onFilterChange) {
      onFilterChange(newFilters)
    }
  }

  const handleReset = () => {
    const resetFilters = {
      startDate: '',
      endDate: '',
      service: 'all',
      agent: 'all'
    }
    setFilters(resetFilters)
    if (onFilterChange) {
      onFilterChange(resetFilters)
    }
  }

  const handleQuickRange = (range) => {
    const today = new Date()
    let startDate = new Date()

    switch (range) {
      case 'today':
        startDate = today
        break
      case 'week':
        startDate.setDate(today.getDate() - 7)
        break
      case 'month':
        startDate.setMonth(today.getMonth() - 1)
        break
      case 'year':
        startDate.setFullYear(today.getFullYear() - 1)
        break
      default:
        startDate = today
    }

    handleChange('startDate', startDate.toISOString().split('T')[0])
    handleChange('endDate', today.toISOString().split('T')[0])
  }

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <FunnelIcon className="h-5 w-5 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-900">Filtros</h3>
        </div>
        <button
          onClick={handleReset}
          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
        >
          Limpiar filtros
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {showDateRange && (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Fecha inicio
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleChange('startDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Fecha fin
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleChange('endDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </>
        )}

        {showService && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Servicio
            </label>
            <select
              value={filters.service}
              onChange={(e) => handleChange('service', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos</option>
              <option value="Luz">Luz</option>
              <option value="Gas">Gas</option>
              <option value="Telefonía">Telefonía</option>
            </select>
          </div>
        )}

        {showAgent && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Agente
            </label>
            <select
              value={filters.agent}
              onChange={(e) => handleChange('agent', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos</option>
            </select>
          </div>
        )}
      </div>

      {showDateRange && (
        <div className="mt-3 flex space-x-2">
          <button
            onClick={() => handleQuickRange('today')}
            className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md"
          >
            Hoy
          </button>
          <button
            onClick={() => handleQuickRange('week')}
            className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md"
          >
            Última semana
          </button>
          <button
            onClick={() => handleQuickRange('month')}
            className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md"
          >
            Último mes
          </button>
          <button
            onClick={() => handleQuickRange('year')}
            className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md"
          >
            Último año
          </button>
        </div>
      )}
    </div>
  )
}
