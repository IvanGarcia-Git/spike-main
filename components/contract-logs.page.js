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
    return <p className="text-gray-600">Cargando logs...</p>;
  }

  if (!logs.length) {
    return <p className="text-gray-600">No hay registros disponibles.</p>;
  }
  return (
    <div className="bg-foreground">
      <div className="max-w-7xl mx-auto bg-background p-6 shadow-lg">
        <h2 className="text-xl font-bold text-black mb-4">
          Actividad Reciente
        </h2>
        <div className="relative">
          <div className="absolute border-l-2 border-gray-500 h-full left-4 top-0"></div>
          <ul className="space-y-4 pl-8">
            {logs.map((log, index) => (
              <li key={index} className="relative">
                <div className="flex items-center mb-1">
                  <span className="inline-block w-3 h-3 rounded-full bg-gray-400 mr-2"></span>
                  <span className="text-sm text-gray-600">
                    {formatDayDate(log.createdAt)}
                  </span>
                </div>
                <p className="text-black">{log.log}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
