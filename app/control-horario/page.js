"use client";
import { useState, useEffect, useCallback } from "react";
import { getCookie } from "cookies-next";
import { authGetFetch, authFetch } from "@/helpers/server-fetch.helper";
import { toast } from "react-toastify";
import TimeClockCard from "@/components/time-tracking/time-clock.card";
import TodaySummaryCard from "@/components/time-tracking/today-summary.card";
import WeeklySummaryCard from "@/components/time-tracking/weekly-summary.card";
import ClockConfirmationModal from "@/components/time-tracking/clock-confirmation.modal";
import Link from "next/link";

export default function ControlHorario() {
  const [status, setStatus] = useState(null);
  const [todaySummary, setTodaySummary] = useState(null);
  const [weeklySummary, setWeeklySummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    action: null,
  });

  const fetchStatus = useCallback(async () => {
    const jwtToken = getCookie("factura-token");
    try {
      const response = await authGetFetch("time-entries/status", jwtToken);
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (error) {
      console.error("Error fetching status:", error);
    }
  }, []);

  const fetchTodaySummary = useCallback(async () => {
    const jwtToken = getCookie("factura-token");
    try {
      const response = await authGetFetch("time-entries/today", jwtToken);
      if (response.ok) {
        const data = await response.json();
        setTodaySummary(data);
      }
    } catch (error) {
      console.error("Error fetching today summary:", error);
    }
  }, []);

  const fetchWeeklySummary = useCallback(async () => {
    const jwtToken = getCookie("factura-token");
    try {
      const response = await authGetFetch("time-entries/weekly", jwtToken);
      if (response.ok) {
        const data = await response.json();
        setWeeklySummary(data);
      }
    } catch (error) {
      console.error("Error fetching weekly summary:", error);
    }
  }, []);

  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchStatus(), fetchTodaySummary(), fetchWeeklySummary()]);
    setIsLoading(false);
  }, [fetchStatus, fetchTodaySummary, fetchWeeklySummary]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleAction = async (action) => {
    setIsActionLoading(true);
    const jwtToken = getCookie("factura-token");

    let endpoint;
    switch (action) {
      case "clockIn":
        endpoint = "time-entries/clock-in";
        break;
      case "clockOut":
        endpoint = "time-entries/clock-out";
        break;
      case "breakStart":
        endpoint = "time-entries/break/start";
        break;
      case "breakEnd":
        endpoint = "time-entries/break/end";
        break;
      default:
        setIsActionLoading(false);
        return;
    }

    try {
      const response = await authFetch("POST", endpoint, {}, jwtToken);
      if (response.ok) {
        const messages = {
          clockIn: "Entrada registrada correctamente",
          clockOut: "Salida registrada correctamente",
          breakStart: "Pausa iniciada",
          breakEnd: "Has vuelto al trabajo",
        };
        toast.success(messages[action]);
        await fetchAllData();
      } else {
        const error = await response.json();
        toast.error(error.message || "Error al procesar la acción");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error de conexión");
    }

    setIsActionLoading(false);
    setConfirmModal({ open: false, action: null });
  };

  const openConfirmModal = (action) => {
    setConfirmModal({ open: true, action });
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            Control Horario
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Gestiona tu fichaje y consulta tu tiempo trabajado
          </p>
        </div>
        <Link
          href="/control-horario/historial"
          className="flex items-center gap-2 px-4 py-2 neumorphic-button rounded-lg bg-background-light dark:bg-background-dark text-slate-600 dark:text-slate-300 hover:text-primary transition-colors"
        >
          <span className="material-icons-outlined">history</span>
          Ver Historial
        </Link>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Clock Card */}
        <div className="col-span-12 lg:col-span-4">
          <TimeClockCard
            status={status}
            isLoading={isLoading || isActionLoading}
            onClockIn={() => openConfirmModal("clockIn")}
            onClockOut={() => openConfirmModal("clockOut")}
            onBreakStart={() => openConfirmModal("breakStart")}
            onBreakEnd={() => openConfirmModal("breakEnd")}
          />
        </div>

        {/* Today's Summary */}
        <div className="col-span-12 lg:col-span-4">
          <TodaySummaryCard summary={todaySummary} isLoading={isLoading} />
        </div>

        {/* Weekly Summary */}
        <div className="col-span-12 lg:col-span-4">
          <WeeklySummaryCard summary={weeklySummary} isLoading={isLoading} />
        </div>
      </div>

      {/* Recent Entries Preview */}
      {todaySummary?.entries?.length > 0 && (
        <div className="mt-6">
          <div className="neumorphic-card p-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">
              Sesiones de Hoy
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                    <th className="pb-3 font-medium">Entrada</th>
                    <th className="pb-3 font-medium">Salida</th>
                    <th className="pb-3 font-medium">Pausas</th>
                    <th className="pb-3 font-medium">Total</th>
                    <th className="pb-3 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {todaySummary.entries.map((entry) => (
                    <tr
                      key={entry.uuid}
                      className="border-b border-slate-100 dark:border-slate-800"
                    >
                      <td className="py-3 text-slate-700 dark:text-slate-300">
                        {new Date(entry.clockInTime).toLocaleTimeString(
                          "es-ES",
                          { hour: "2-digit", minute: "2-digit" }
                        )}
                      </td>
                      <td className="py-3 text-slate-700 dark:text-slate-300">
                        {entry.clockOutTime
                          ? new Date(entry.clockOutTime).toLocaleTimeString(
                              "es-ES",
                              { hour: "2-digit", minute: "2-digit" }
                            )
                          : "-"}
                      </td>
                      <td className="py-3 text-slate-700 dark:text-slate-300">
                        {entry.totalBreakMinutes || 0} min
                      </td>
                      <td className="py-3 text-slate-700 dark:text-slate-300">
                        {entry.clockOutTime
                          ? `${(
                              (new Date(entry.clockOutTime).getTime() -
                                new Date(entry.clockInTime).getTime() -
                                (entry.totalBreakMinutes || 0) * 60000) /
                              3600000
                            ).toFixed(2)}h`
                          : "En curso"}
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            entry.status === "active"
                              ? "bg-success/10 text-success"
                              : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                          }`}
                        >
                          {entry.status === "active" ? "Activo" : "Completado"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ClockConfirmationModal
        isOpen={confirmModal.open}
        action={confirmModal.action}
        onConfirm={() => handleAction(confirmModal.action)}
        onCancel={() => setConfirmModal({ open: false, action: null })}
        isLoading={isActionLoading}
      />
    </div>
  );
}
