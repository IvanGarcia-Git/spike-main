"use client";

export default function TimeRecordsTable({
  records,
  isManager = false,
  onViewAudit,
  onEdit,
  showUserColumn = false,
}) {
  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("es-ES", {
      weekday: "short",
      day: "2-digit",
      month: "short",
    });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const calculateHours = (entry) => {
    if (!entry.clockOutTime) return "En curso";
    const clockIn = new Date(entry.clockInTime).getTime();
    const clockOut = new Date(entry.clockOutTime).getTime();
    const breakMs = (entry.totalBreakMinutes || 0) * 60 * 1000;
    const netMs = clockOut - clockIn - breakMs;
    const hours = netMs / (1000 * 60 * 60);
    return `${hours.toFixed(2)}h`;
  };

  if (!records?.length) {
    return (
      <div className="neumorphic-card p-8 text-center">
        <span className="material-icons-outlined text-4xl text-slate-400 mb-2">
          schedule
        </span>
        <p className="text-slate-500 dark:text-slate-400">
          No hay registros para mostrar
        </p>
      </div>
    );
  }

  return (
    <div className="neumorphic-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                Fecha
              </th>
              {showUserColumn && (
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  Usuario
                </th>
              )}
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                Entrada
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                Salida
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                Pausas
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                Total
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {records.map((entry) => (
              <tr
                key={entry.uuid}
                className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
              >
                <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                  {formatDate(entry.clockInTime)}
                </td>
                {showUserColumn && (
                  <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                    {entry.user
                      ? `${entry.user.name} ${entry.user.firstSurname}`
                      : "-"}
                  </td>
                )}
                <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300 font-medium">
                  {formatTime(entry.clockInTime)}
                </td>
                <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300 font-medium">
                  {formatTime(entry.clockOutTime)}
                </td>
                <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                  {entry.totalBreakMinutes || 0} min
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {calculateHours(entry)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      entry.status === "active"
                        ? "bg-success/10 text-success"
                        : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    {entry.status === "active" ? "Activo" : "Completado"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => onViewAudit(entry)}
                      className="p-2 neumorphic-button rounded-lg text-slate-500 hover:text-primary transition-colors"
                      title="Ver historial de cambios"
                    >
                      <span className="material-icons-outlined text-sm">
                        history
                      </span>
                    </button>
                    {isManager && (
                      <button
                        onClick={() => onEdit(entry)}
                        className="p-2 neumorphic-button rounded-lg text-slate-500 hover:text-primary transition-colors"
                        title="Editar registro"
                      >
                        <span className="material-icons-outlined text-sm">
                          edit
                        </span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
