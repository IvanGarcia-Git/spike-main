"use client";
import { useState, useEffect } from "react";
import { getCookie } from "cookies-next";
import { authGetFetch } from "@/helpers/server-fetch.helper";
import { formatDayDate } from "@/helpers/dates.helper";

export default function ContractLogs({ contractUuid }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const getContractLogs = async () => {
    const jwtToken = getCookie("factura-token");
    try {
      const response = await authGetFetch(
        `contract-logs/contract/${contractUuid}`,
        jwtToken
      );

      if (response.ok) {
        const logsData = await response.json();
        setLogs(logsData || []);
        setLoading(false);
      } else {
        alert("Error al cargar los logs del contrato");
        setLoading(false);
      }
    } catch (error) {
      console.error("Error al obtener los logs del contrato:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    getContractLogs();
  }, [contractUuid]);

  if (loading) {
    return (
      <div className="neumorphic-card p-8 rounded-xl text-center">
        <span className="material-icons-outlined text-4xl text-primary animate-spin">refresh</span>
        <p className="mt-4 text-slate-600 dark:text-slate-400">Cargando logs...</p>
      </div>
    );
  }

  if (!logs.length) {
    return (
      <div className="neumorphic-card-inset p-8 rounded-xl text-center">
        <span className="material-icons-outlined text-5xl text-slate-400 mb-3">history</span>
        <p className="text-slate-600 dark:text-slate-400 font-medium">No hay registros disponibles.</p>
      </div>
    );
  }
  return (
    <div className="neumorphic-card p-6 rounded-xl">
      <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
        <span className="material-icons-outlined text-primary">timeline</span>
        Actividad Reciente
      </h2>
      <div className="relative">
        <div className="absolute border-l-2 border-primary/30 h-full left-4 top-0"></div>
        <ul className="space-y-4 pl-10">
          {logs.map((log, index) => (
            <li key={index} className="relative">
              <div className="absolute -left-6 w-3 h-3 rounded-full bg-primary ring-4 ring-primary/20"></div>
              <div className="neumorphic-card-inset p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                    {formatDayDate(log.createdAt)}
                  </span>
                </div>
                <p className="text-slate-700 dark:text-slate-300">{log.log}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
