/* VISTA DE FACTURACIÓN ACTUALIZADA - Reemplazar en page.js línea ~1130 */

{/* Vista Facturación */}
{activeView === 'facturacion' && (
  <>
    {/* Métricas Financieras */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <p className="text-xs text-gray-500 mb-1">Ingresos</p>
            <p className="text-2xl font-bold">
              €{facturacionData.ingresosPorTarifa?.ingresos?.toLocaleString() || 0}
            </p>
            <p className="text-xs text-gray-500">
              {facturacionData.ingresosPorTarifa?.contratos || 0} contratos
            </p>
          </div>
          <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">Mes actual</span>
        </div>
        <p className="text-green-600 text-sm mt-2">↑ {dashboardData.financialMetrics.ingresosChange}%</p>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <p className="text-xs text-gray-500 mb-1">Gastos</p>
            <p className="text-2xl font-bold text-red-600">
              €{facturacionData.ingresosPorTarifa?.gastos?.toLocaleString() || 0}
            </p>
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
            <p className="text-2xl font-bold text-green-600">
              €{facturacionData.ingresosPorTarifa?.beneficio?.toLocaleString() || 0}
            </p>
            <p className="text-xs text-gray-500">Ingresos - Gastos</p>
          </div>
          <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">Mes actual</span>
        </div>
        <p className="text-green-600 text-sm mt-2">↑ {dashboardData.financialMetrics.beneficioChange}%</p>
      </div>
    </div>

    {/* Cobrado vs Por Cobrar y Fuentes de Ingreso */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-sm font-semibold mb-3">Cobrado vs Por Cobrar</h3>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Contratos cobrados</span>
              <span className="font-bold text-green-600">
                {facturacionData.cobradoVsPorCobrar?.cobrado?.cantidad || 0}
              </span>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mb-2">
              <span>Importe</span>
              <span className="text-green-600 font-medium">
                €{facturacionData.cobradoVsPorCobrar?.cobrado?.importe?.toLocaleString() || 0}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full"
                style={{
                  width: `${facturacionData.cobradoVsPorCobrar?.total > 0
                    ? (facturacionData.cobradoVsPorCobrar.cobrado.cantidad / facturacionData.cobradoVsPorCobrar.total * 100)
                    : 0}%`
                }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Pendientes de cobro</span>
              <span className="font-bold text-yellow-600">
                {facturacionData.cobradoVsPorCobrar?.porCobrar?.cantidad || 0}
              </span>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mb-2">
              <span>Importe</span>
              <span className="text-yellow-600 font-medium">
                €{facturacionData.cobradoVsPorCobrar?.porCobrar?.importe?.toLocaleString() || 0}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-yellow-500 h-2 rounded-full"
                style={{
                  width: `${facturacionData.cobradoVsPorCobrar?.total > 0
                    ? (facturacionData.cobradoVsPorCobrar.porCobrar.cantidad / facturacionData.cobradoVsPorCobrar.total * 100)
                    : 0}%`
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-sm font-semibold mb-3">Fuentes de Ingreso</h3>
        <div className="space-y-2">
          {facturacionData.fuentesIngreso?.slice(0, 5).map((fuente, idx) => (
            <div key={idx} className="flex justify-between items-center text-sm">
              <span className="text-gray-600">{fuente.name}</span>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">{fuente.cantidad} contratos</span>
                <span className="font-bold text-green-600">€{fuente.importe?.toLocaleString()}</span>
              </div>
            </div>
          ))}
          {(!facturacionData.fuentesIngreso || facturacionData.fuentesIngreso.length === 0) && (
            <p className="text-sm text-gray-400 text-center py-4">No hay datos disponibles</p>
          )}
        </div>
      </div>
    </div>

    {/* Sales vs Target Chart */}
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <h3 className="text-lg font-semibold mb-4">Ventas vs Objetivo Anual</h3>
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
                name="Objetivo"
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
                <th className="px-2 py-1 text-left">Usuario</th>
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
                <th className="px-2 py-1 text-left">Usuario</th>
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
