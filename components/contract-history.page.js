"use client";
import { useState, useEffect } from "react";
import { getCookie } from "cookies-next";
import { authGetFetch } from "@/helpers/server-fetch.helper";

export default function ContractHistory({ contractUuid }) {
  const [historyData, setHistoryData] = useState([]);

  const getHistoryData = async () => {
    const jwtToken = getCookie("factura-token");
    try {
      const response = await authGetFetch(
        `contracts/history/${contractUuid}`,
        jwtToken
      );
      if (response.ok) {
        const data = await response.json();
        setHistoryData(data);
      } else {
        alert("Error al cargar el histórico del contrato.");
      }
    } catch (error) {
      console.error("Error obteniendo el histórico:", error);
    }
  };

  useEffect(() => {
    getHistoryData();
  }, [contractUuid]);

  if (!historyData.length) {
    return (
      <div className="neumorphic-card-inset p-8 rounded-xl text-center">
        <span className="material-icons-outlined text-5xl text-slate-400 mb-3">history</span>
        <p className="text-slate-600 dark:text-slate-400 font-medium">No hay histórico disponible.</p>
      </div>
    );
  }

  return (
    <div className="neumorphic-card p-6 rounded-xl">
      <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
        <span className="material-icons-outlined text-primary">history</span>
        Histórico de Contrato
      </h3>
      <ul className="space-y-3">
        {historyData.map((entry, index) => (
          <li
            key={index}
            className="flex justify-between items-center p-4 neumorphic-card-inset rounded-lg"
          >
            <div>
              <p className="text-slate-800 dark:text-slate-100 font-semibold">
                {entry.companyName}, {entry.rateName}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Estado del contrato */}
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  entry.status === "Renovado"
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                }`}
              >
                {entry.status}
              </span>
              {/* Fecha */}
              <span className="text-slate-500 dark:text-slate-400 text-sm">
                {new Date(entry.createdAt).toLocaleDateString("es-ES", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}{" "}
                {new Date(entry.createdAt).toLocaleTimeString("es-ES", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
