/* VISTA DE CLIENTES/CONTRATOS ACTUALIZADA - Reemplazar en page.js línea ~824 */

{/* Vista Clientes y Contratos */}
{activeView === 'clientes' && (
  <>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* Distribución de Clientes */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-sm font-semibold mb-3">Distribución de Clientes</h3>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-600">Particulares</span>
            <span className="font-bold text-sm text-blue-600">
              {clientesData.distribucion?.particulares?.porcentaje || 0}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full"
              style={{
                width: `${clientesData.distribucion?.particulares?.porcentaje || 0}%`
              }}
            />
          </div>
          <div className="text-xs text-gray-500">
            {clientesData.distribucion?.particulares?.cantidad || 0} clientes
          </div>

          <div className="flex justify-between items-center mt-3">
            <span className="text-xs text-gray-600">Empresas</span>
            <span className="font-bold text-sm text-green-600">
              {clientesData.distribucion?.empresas?.porcentaje || 0}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full"
              style={{
                width: `${clientesData.distribucion?.empresas?.porcentaje || 0}%`
              }}
            />
          </div>
          <div className="text-xs text-gray-500">
            {clientesData.distribucion?.empresas?.cantidad || 0} empresas
          </div>
        </div>
      </div>

      {/* Por Servicio */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-sm font-semibold mb-3">Por Servicio</h3>
        <div className="space-y-2">
          {clientesData.porServicios?.distribucion?.map((servicio, idx) => (
            <div key={idx}>
              <div className="flex justify-between items-center text-sm mb-1">
                <span className="text-gray-600">{servicio.servicio}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">{servicio.cantidad}</span>
                  <span className="font-bold">{servicio.porcentaje}%</span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-blue-500 h-1.5 rounded-full"
                  style={{ width: `${servicio.porcentaje}%` }}
                />
              </div>
            </div>
          ))}
          {(!clientesData.porServicios?.distribucion || clientesData.porServicios.distribucion.length === 0) && (
            <p className="text-sm text-gray-400 text-center py-4">No hay datos disponibles</p>
          )}
        </div>
      </div>

      {/* Contratos Renovables */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-sm font-semibold mb-3">Contratos Renovables</h3>
        <div className="text-center">
          <p className="text-3xl font-bold text-gray-900">
            {clientesData.renovables?.total || 0}
          </p>
          <p className="text-xs text-gray-500 mt-1">Próximos 3 meses</p>
        </div>
        {clientesData.renovables?.distribucionMensual && clientesData.renovables.distribucionMensual.length > 0 && (
          <div className="mt-4 space-y-1">
            {clientesData.renovables.distribucionMensual.map((mes, idx) => (
              <div key={idx} className="flex justify-between text-xs">
                <span className="text-gray-600">{mes.mes}</span>
                <span className="font-medium">{mes.cantidad} contratos</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>

    {/* Distribución por Compañía */}
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <h3 className="text-lg font-semibold mb-4">Distribución por Compañía</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Gráfico de Pastel */}
        <div className="h-64">
          {clientesData.porCompania && clientesData.porCompania.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={clientesData.porCompania.map(c => ({
                    name: c.compania,
                    value: c.cantidad
                  }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {clientesData.porCompania.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'][index % 6]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              No hay datos disponibles
            </div>
          )}
        </div>

        {/* Lista de Compañías */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold mb-3">Detalle por Compañía</h4>
          {clientesData.porCompania?.slice(0, 8).map((compania, idx) => (
            <div key={idx} className="flex justify-between items-center text-sm">
              <span className="text-gray-600">{compania.compania}</span>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">{compania.cantidad} contratos</span>
                <span className="font-bold">{compania.porcentaje}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Clientes Referidos */}
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <h3 className="text-lg font-semibold mb-4">Canales de Origen</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clientesData.referidos?.map((canal, idx) => (
          <div key={idx} className="p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-start mb-2">
              <h4 className="text-sm font-medium text-gray-900">{canal.origen}</h4>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                {canal.porcentaje}%
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{canal.cantidad}</p>
            <p className="text-xs text-gray-500">contratos</p>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
              <div
                className="bg-blue-600 h-1.5 rounded-full"
                style={{ width: `${canal.porcentaje}%` }}
              />
            </div>
          </div>
        ))}
        {(!clientesData.referidos || clientesData.referidos.length === 0) && (
          <div className="col-span-3 text-center py-8 text-gray-400">
            No hay datos de canales disponibles
          </div>
        )}
      </div>
    </div>

    {/* Lista de Contratos Renovables */}
    {clientesData.renovables?.contratos && clientesData.renovables.contratos.length > 0 && (
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold mb-4">Próximos Contratos a Renovar</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">Cliente</th>
                <th className="px-4 py-3 text-left">Compañía</th>
                <th className="px-4 py-3 text-left">Tipo</th>
                <th className="px-4 py-3 text-left">Fecha Expiración</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {clientesData.renovables.contratos.slice(0, 10).map((contrato, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{contrato.cliente}</td>
                  <td className="px-4 py-3 text-sm">{contrato.compania}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                      {contrato.tipo}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {new Date(contrato.expira).toLocaleDateString('es-ES')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )}
  </>
)}
