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

  return (
    <div className="bg-background p-6 rounded-lg shadow-lg">
      <h3 className="text-xl font-bold text-black mb-4">
        Histórico de Contrato
      </h3>
      <ul className="space-y-4">
        {historyData.map((entry, index) => (
          <li
            key={index}
            className="flex justify-between items-center p-4 bg-backgroundHoverBold rounded-lg"
          >
            <div>
              <p className="text-black font-semibold">
                {entry.companyName}, {entry.rateName}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* Estado del contrato */}
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  entry.status === "Renovado"
                    ? "bg-green-200 text-green-800"
                    : "bg-red-200 text-red-800"
                }`}
              >
                {entry.status}
              </span>
              {/* Fecha */}
              <span className="text-gray-600 text-sm">
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
