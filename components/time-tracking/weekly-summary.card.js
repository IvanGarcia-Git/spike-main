"use client";

export default function WeeklySummaryCard({ summary, isLoading = false }) {
  const getDayName = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-ES", { weekday: "short" }).toUpperCase();
  };

  const getBarHeight = (hours) => {
    if (!hours) return "0%";
    // Max 10 hours = 100%
    const percentage = Math.min((hours / 10) * 100, 100);
    return `${percentage}%`;
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="neumorphic-card p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
          Resumen Semanal
        </h2>
        <span className="text-sm text-slate-500 dark:text-slate-400">
          {summary?.totalNetWorkedHours?.toFixed(1) || 0}h total
        </span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {/* Bar Chart */}
          <div className="flex items-end justify-between h-40 gap-2 mb-4">
            {summary?.days?.map((day, index) => (
              <div key={day.date} className="flex flex-col items-center flex-1">
                <div className="w-full h-32 flex items-end justify-center">
                  <div
                    className={`w-full max-w-8 rounded-t transition-all duration-300 ${
                      day.date === today
                        ? "bg-primary"
                        : day.netWorkedHours > 0
                        ? "bg-primary/60"
                        : "bg-slate-200 dark:bg-slate-700"
                    }`}
                    style={{ height: getBarHeight(day.netWorkedHours) }}
                    title={`${day.netWorkedHours}h`}
                  ></div>
                </div>
                <span
                  className={`text-xs mt-2 ${
                    day.date === today
                      ? "font-bold text-primary"
                      : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {getDayName(day.date)}
                </span>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 text-xs text-slate-500 dark:text-slate-400 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-primary"></div>
              <span>Hoy</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-primary/60"></div>
              <span>Otros dias</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
