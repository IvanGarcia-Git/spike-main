"use client";
import { useState, useEffect } from "react";

export default function TimeClockCard({
  status,
  currentDuration,
  onClockIn,
  onClockOut,
  onBreakStart,
  onBreakEnd,
  isLoading = false,
}) {
  const [displayTime, setDisplayTime] = useState("00:00:00");

  useEffect(() => {
    if (!status?.isClockedIn || !status?.activeSession) {
      setDisplayTime("00:00:00");
      return;
    }

    const calculateTime = () => {
      const clockInTime = new Date(status.activeSession.clockInTime);
      const now = new Date();
      let elapsedMs = now.getTime() - clockInTime.getTime();

      // Subtract completed breaks
      if (status.activeSession.totalBreakMinutes) {
        elapsedMs -= status.activeSession.totalBreakMinutes * 60 * 1000;
      }

      // If currently on break, subtract current break time
      if (status.hasActiveBreak && status.currentBreak) {
        const breakStart = new Date(status.currentBreak.startTime);
        const breakElapsed = now.getTime() - breakStart.getTime();
        elapsedMs -= breakElapsed;
      }

      const totalSeconds = Math.max(0, Math.floor(elapsedMs / 1000));
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      setDisplayTime(
        `${hours.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      );
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);

    return () => clearInterval(interval);
  }, [status]);

  const getStatusText = () => {
    if (!status?.isClockedIn) return "Sin fichar";
    if (status.hasActiveBreak) return "En pausa";
    return "Trabajando";
  };

  const getStatusColor = () => {
    if (!status?.isClockedIn) return "text-slate-500";
    if (status.hasActiveBreak) return "text-warning";
    return "text-success";
  };

  return (
    <div className="neumorphic-card p-6 h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
          Control de Fichaje
        </h2>
        <span
          className={`flex items-center gap-2 text-sm font-medium ${getStatusColor()}`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              !status?.isClockedIn
                ? "bg-slate-400"
                : status.hasActiveBreak
                ? "bg-warning animate-pulse"
                : "bg-success animate-pulse"
            }`}
          ></span>
          {getStatusText()}
        </span>
      </div>

      {/* Time Display */}
      <div className="text-center py-8">
        <div className="text-5xl font-mono font-bold text-slate-800 dark:text-slate-100 mb-2">
          {displayTime}
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {status?.isClockedIn ? "Tiempo trabajado hoy" : "Listo para fichar"}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        {!status?.isClockedIn ? (
          <button
            onClick={onClockIn}
            disabled={isLoading}
            className="w-full py-4 bg-success text-white rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-green-600 transition-colors disabled:opacity-50"
          >
            <span className="material-icons-outlined">login</span>
            Fichar Entrada
          </button>
        ) : (
          <>
            {!status.hasActiveBreak ? (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={onBreakStart}
                  disabled={isLoading}
                  className="py-3 bg-warning text-white rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-amber-600 transition-colors disabled:opacity-50"
                >
                  <span className="material-icons-outlined">coffee</span>
                  Pausa
                </button>
                <button
                  onClick={onClockOut}
                  disabled={isLoading}
                  className="py-3 bg-danger text-white rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  <span className="material-icons-outlined">logout</span>
                  Salir
                </button>
              </div>
            ) : (
              <button
                onClick={onBreakEnd}
                disabled={isLoading}
                className="w-full py-4 bg-primary text-white rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                <span className="material-icons-outlined">play_arrow</span>
                Volver al Trabajo
              </button>
            )}
          </>
        )}
      </div>

      {/* Clock In Time Info */}
      {status?.isClockedIn && status?.activeSession && (
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
            Entrada:{" "}
            {new Date(status.activeSession.clockInTime).toLocaleTimeString(
              "es-ES",
              { hour: "2-digit", minute: "2-digit" }
            )}
          </p>
        </div>
      )}
    </div>
  );
}
