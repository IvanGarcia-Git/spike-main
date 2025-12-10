"use client";

export default function TodaySummaryCard({ summary, isLoading = false }) {
  const formatMinutes = (minutes) => {
    if (!minutes && minutes !== 0) return "--:--";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins.toString().padStart(2, "0")}m`;
  };

  const formatHours = (hours) => {
    if (!hours && hours !== 0) return "--:--";
    return `${hours.toFixed(2)}h`;
  };

  return (
    <div className="neumorphic-card p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
          Resumen de Hoy
        </h2>
        <span className="text-sm text-slate-500 dark:text-slate-400">
          {new Date().toLocaleDateString("es-ES", {
            weekday: "long",
            day: "numeric",
            month: "short",
          })}
        </span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Total Worked */}
          <div className="neumorphic-card-inset p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-icons-outlined text-primary text-2xl">
                  schedule
                </span>
                <span className="text-slate-600 dark:text-slate-300">
                  Tiempo Trabajado
                </span>
              </div>
              <span className="text-xl font-bold text-slate-800 dark:text-slate-100">
                {formatHours(summary?.totalWorkedHours)}
              </span>
            </div>
          </div>

          {/* Break Time */}
          <div className="neumorphic-card-inset p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-icons-outlined text-warning text-2xl">
                  coffee
                </span>
                <span className="text-slate-600 dark:text-slate-300">
                  Tiempo en Pausa
                </span>
              </div>
              <span className="text-xl font-bold text-slate-800 dark:text-slate-100">
                {formatMinutes(summary?.totalBreakMinutes)}
              </span>
            </div>
          </div>

          {/* Sessions Count */}
          <div className="neumorphic-card-inset p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-icons-outlined text-success text-2xl">
                  repeat
                </span>
                <span className="text-slate-600 dark:text-slate-300">
                  Sesiones
                </span>
              </div>
              <span className="text-xl font-bold text-slate-800 dark:text-slate-100">
                {summary?.entries?.length || 0}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
