/* VISTA DE PIZARRA SEMANAL ACTUALIZADA - Reemplazar en page.js línea ~919 */

{/* NOTA: Agregar este useEffect después de los otros useEffect para auto-refresh */}
useEffect(() => {
  let intervalId
  if (activeView === 'pizarra') {
    // Refresh cada 30 segundos
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

{/* Vista Pizarra Semanal */}
{activeView === 'pizarra' && (
  <div className="bg-white rounded-lg shadow">
    <div className="p-4 border-b">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Pizarra Semanal - Ranking en Vivo</h2>
        <div className="flex items-center space-x-4">
          {/* Indicador de última actualización */}
          {pizarraData.ultimaActualizacion && (
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <ClockIcon className="h-4 w-4" />
              <span>
                Última actualización:{' '}
                {new Date(pizarraData.ultimaActualizacion).toLocaleTimeString('es-ES')}
              </span>
            </div>
          )}
          {/* Progreso global */}
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

    {/* Tabs por turno */}
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
        <thead className="bg-gray-50 text-xs uppercase text-gray-700 sticky top-0">
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
                  'hover:bg-gray-50',
                  idx === 0 ? 'bg-yellow-50' : idx === 1 ? 'bg-gray-100' : idx === 2 ? 'bg-orange-50' : ''
                )}
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
                    <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                      {agente.name?.charAt(0) || 'A'}
                    </div>
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

    {/* Resumen por turnos */}
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

/* NOTA: Agregar este estado al inicio del componente */
const [activeTurno, setActiveTurno] = useState('todos') // todos, manana, tarde
