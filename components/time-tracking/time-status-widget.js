"use client";
import { useState, useEffect, useRef } from "react";
import { getCookie } from "cookies-next";
import { authGetFetch, authFetch } from "@/helpers/server-fetch.helper";
import Link from "next/link";
import { toast } from "react-toastify";

export default function TimeStatusWidget() {
  const [status, setStatus] = useState(null);
  const [displayTime, setDisplayTime] = useState("00:00");
  const [isLoading, setIsLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const menuRef = useRef(null);

  const fetchStatus = async () => {
    const jwtToken = getCookie("factura-token");
    if (!jwtToken) return;

    try {
      const response = await authGetFetch("time-entries/status", jwtToken);
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (error) {
      console.error("Error fetching time status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Refetch status every minute
    const interval = setInterval(fetchStatus, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Update display time every second when clocked in
  useEffect(() => {
    if (!status?.isClockedIn || !status?.activeSession) {
      setDisplayTime("00:00");
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

      setDisplayTime(
        `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
      );
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);

    return () => clearInterval(interval);
  }, [status]);

  // Action handlers
  const handleClockIn = async () => {
    setIsActionLoading(true);
    const token = getCookie("factura-token");
    try {
      const response = await authFetch("POST", "time-entries/clock-in", {}, token);
      if (response.ok) {
        toast.success("Entrada registrada correctamente");
        await fetchStatus();
        setIsMenuOpen(false);
      } else {
        const error = await response.json();
        toast.error(error.message || "Error al fichar entrada");
      }
    } catch (error) {
      console.error("Error clocking in:", error);
      toast.error("Error de conexión");
    }
    setIsActionLoading(false);
  };

  const handleClockOut = async () => {
    setIsActionLoading(true);
    const token = getCookie("factura-token");
    try {
      const response = await authFetch("POST", "time-entries/clock-out", {}, token);
      if (response.ok) {
        toast.success("Salida registrada correctamente");
        await fetchStatus();
        setIsMenuOpen(false);
      } else {
        const error = await response.json();
        toast.error(error.message || "Error al fichar salida");
      }
    } catch (error) {
      console.error("Error clocking out:", error);
      toast.error("Error de conexión");
    }
    setIsActionLoading(false);
  };

  const handleBreakStart = async () => {
    setIsActionLoading(true);
    const token = getCookie("factura-token");
    try {
      const response = await authFetch("POST", "time-entries/break-start", {}, token);
      if (response.ok) {
        toast.success("Descanso iniciado");
        await fetchStatus();
        setIsMenuOpen(false);
      } else {
        const error = await response.json();
        toast.error(error.message || "Error al iniciar descanso");
      }
    } catch (error) {
      console.error("Error starting break:", error);
      toast.error("Error de conexión");
    }
    setIsActionLoading(false);
  };

  const handleBreakEnd = async () => {
    setIsActionLoading(true);
    const token = getCookie("factura-token");
    try {
      const response = await authFetch("POST", "time-entries/break-end", {}, token);
      if (response.ok) {
        toast.success("Descanso finalizado");
        await fetchStatus();
        setIsMenuOpen(false);
      } else {
        const error = await response.json();
        toast.error(error.message || "Error al finalizar descanso");
      }
    } catch (error) {
      console.error("Error ending break:", error);
      toast.error("Error de conexión");
    }
    setIsActionLoading(false);
  };

  const getStatusConfig = () => {
    if (!status?.isClockedIn) {
      return {
        text: "Sin fichar",
        shortText: "⏱",
        bgColor: "bg-red-50 dark:bg-red-900/30",
        textColor: "text-red-600 dark:text-red-400",
        dotColor: "bg-red-500 animate-pulse",
        icon: "schedule",
        isReminder: true,
      };
    }
    if (status.hasActiveBreak) {
      return {
        text: "En pausa",
        shortText: "☕",
        bgColor: "bg-amber-50 dark:bg-amber-900/20",
        textColor: "text-amber-600 dark:text-amber-400",
        dotColor: "bg-warning animate-pulse",
        icon: "coffee",
        isReminder: false,
      };
    }
    return {
      text: "Trabajando",
      shortText: "✓",
      bgColor: "bg-green-50 dark:bg-green-900/20",
      textColor: "text-green-600 dark:text-green-400",
      dotColor: "bg-success animate-pulse",
      icon: "play_circle",
      isReminder: false,
    };
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse">
        <div className="w-4 h-4 rounded-full bg-slate-300 dark:bg-slate-600"></div>
        <div className="w-12 h-4 rounded bg-slate-300 dark:bg-slate-600 hidden sm:block"></div>
      </div>
    );
  }

  const config = getStatusConfig();

  return (
    <div ref={menuRef} className="relative">
      {/* Widget Button - Siempre visible */}
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 rounded-lg ${config.bgColor} hover:opacity-80 transition-all cursor-pointer ${config.isReminder ? 'animate-pulse' : ''}`}
        title={config.isReminder ? "¡Recuerda fichar entrada!" : "Control de fichaje"}
      >
        <span className={`w-2 h-2 rounded-full ${config.dotColor}`}></span>
        <span className={`material-icons-outlined text-sm ${config.textColor}`}>
          {config.icon}
        </span>
        <div className="flex flex-col leading-none">
          <span className={`text-xs font-medium ${config.textColor} hidden sm:block`}>
            {config.text}
          </span>
          {status?.isClockedIn && (
            <span className={`text-xs font-mono font-bold ${config.textColor}`}>
              {displayTime}
            </span>
          )}
        </div>
        <span className={`material-icons-outlined text-xs ${config.textColor} ml-1`}>
          {isMenuOpen ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {/* Dropdown Menu */}
      {isMenuOpen && (
        <div className="absolute right-0 mt-2 w-64 neumorphic-card bg-background-light dark:bg-background-dark rounded-xl shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className={`px-4 py-3 ${config.bgColor} border-b border-slate-200 dark:border-slate-700`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${config.dotColor}`}></span>
                <span className={`text-sm font-semibold ${config.textColor}`}>
                  {config.text}
                </span>
              </div>
              {status?.isClockedIn && (
                <span className={`text-lg font-mono font-bold ${config.textColor}`}>
                  {displayTime}
                </span>
              )}
            </div>
            {status?.isClockedIn && status?.activeSession && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Entrada: {new Date(status.activeSession.clockInTime).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="p-3 space-y-2">
            {!status?.isClockedIn ? (
              // No fichado - Mostrar botón de entrada
              <button
                onClick={handleClockIn}
                disabled={isActionLoading}
                className="w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <span className="material-icons-outlined">login</span>
                {isActionLoading ? "Fichando..." : "Fichar Entrada"}
              </button>
            ) : status.hasActiveBreak ? (
              // En pausa - Mostrar botón de volver
              <button
                onClick={handleBreakEnd}
                disabled={isActionLoading}
                className="w-full py-3 bg-primary hover:bg-primary/90 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <span className="material-icons-outlined">play_arrow</span>
                {isActionLoading ? "Procesando..." : "Volver al Trabajo"}
              </button>
            ) : (
              // Trabajando - Mostrar opciones de pausa y salida
              <>
                <button
                  onClick={handleBreakStart}
                  disabled={isActionLoading}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  <span className="material-icons-outlined">coffee</span>
                  {isActionLoading ? "Procesando..." : "Descanso"}
                </button>
                <button
                  onClick={handleClockOut}
                  disabled={isActionLoading}
                  className="w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  <span className="material-icons-outlined">logout</span>
                  {isActionLoading ? "Procesando..." : "Fichar Salida"}
                </button>
              </>
            )}
          </div>

          {/* Footer - Link to full page */}
          <div className="px-3 pb-3">
            <Link
              href="/control-horario"
              className="w-full py-2 text-center text-xs text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-primary block transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Ver historial completo →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
