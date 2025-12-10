"use client";
import { useState, useEffect, useCallback } from "react";
import { getCookie } from "cookies-next";
import { authGetFetch, authFetch } from "@/helpers/server-fetch.helper";
import { toast } from "react-toastify";

export default function ClockInReminder() {
  const [showReminder, setShowReminder] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const checkClockStatus = useCallback(async () => {
    const token = getCookie("factura-token");
    if (!token) return;

    try {
      const response = await authGetFetch("time-entries/status", token);
      if (response.ok) {
        const data = await response.json();
        // Show reminder if not clocked in
        setShowReminder(!data.isClockedIn);
      }
    } catch (error) {
      console.error("Error checking clock status:", error);
    }
  }, []);

  useEffect(() => {
    // Initial check
    checkClockStatus();

    // Check every 5 minutes
    const interval = setInterval(checkClockStatus, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [checkClockStatus]);

  const handleQuickClockIn = async () => {
    setIsLoading(true);
    const token = getCookie("factura-token");

    try {
      const response = await authFetch("POST", "time-entries/clock-in", {}, token);
      if (response.ok) {
        setShowReminder(false);
        toast.success("Entrada registrada correctamente");
      } else {
        const error = await response.json();
        toast.error(error.message || "Error al fichar");
      }
    } catch (error) {
      console.error("Error clocking in:", error);
      toast.error("Error de conexion");
    }

    setIsLoading(false);
  };

  if (!showReminder) return null;

  return (
    <button
      onClick={handleQuickClockIn}
      disabled={isLoading}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-6 py-4
                 bg-primary text-white rounded-full shadow-lg
                 animate-pulse hover:animate-none hover:scale-105 hover:bg-primary-dark
                 transition-all duration-200 disabled:opacity-50"
      style={{
        boxShadow: "0 4px 20px rgba(20, 184, 166, 0.4)",
      }}
    >
      <span className="material-icons-outlined text-2xl">schedule</span>
      <span className="font-semibold text-lg">
        {isLoading ? "Fichando..." : "Fichar Entrada"}
      </span>
    </button>
  );
}
