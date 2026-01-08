"use client";
import { useState, useEffect } from "react";
import { getCookie } from "cookies-next";
import { authGetFetch } from "@/helpers/server-fetch.helper";
import Link from "next/link";

export default function TimeStatusWidget() {
  const [status, setStatus] = useState(null);
  const [displayTime, setDisplayTime] = useState("00:00");
  const [isLoading, setIsLoading] = useState(true);

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
    // Refetch status every 5 minutes
    const interval = setInterval(fetchStatus, 5 * 60 * 1000);
    return () => clearInterval(interval);
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

  const getStatusConfig = () => {
    if (!status?.isClockedIn) {
      return {
        text: "Sin fichar",
        bgColor: "bg-slate-100 dark:bg-slate-800",
        textColor: "text-slate-600 dark:text-slate-400",
        dotColor: "bg-slate-400",
        icon: "schedule",
      };
    }
    if (status.hasActiveBreak) {
      return {
        text: "En pausa",
        bgColor: "bg-amber-50 dark:bg-amber-900/20",
        textColor: "text-amber-600 dark:text-amber-400",
        dotColor: "bg-warning animate-pulse",
        icon: "coffee",
      };
    }
    return {
      text: "Trabajando",
      bgColor: "bg-green-50 dark:bg-green-900/20",
      textColor: "text-green-600 dark:text-green-400",
      dotColor: "bg-success animate-pulse",
      icon: "play_circle",
    };
  };

  if (isLoading) {
    return (
      <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse">
        <div className="w-4 h-4 rounded-full bg-slate-300 dark:bg-slate-600"></div>
        <div className="w-16 h-4 rounded bg-slate-300 dark:bg-slate-600"></div>
      </div>
    );
  }

  const config = getStatusConfig();

  return (
    <Link href="/control-horario" className="hidden md:block">
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-lg ${config.bgColor} hover:opacity-80 transition-all cursor-pointer`}
        title="Ir a Control Horario"
      >
        <span className={`w-2 h-2 rounded-full ${config.dotColor}`}></span>
        <span className={`material-icons-outlined text-sm ${config.textColor}`}>
          {config.icon}
        </span>
        <div className="flex flex-col leading-none">
          <span className={`text-xs font-medium ${config.textColor}`}>
            {config.text}
          </span>
          {status?.isClockedIn && (
            <span className={`text-xs font-mono font-bold ${config.textColor}`}>
              {displayTime}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
