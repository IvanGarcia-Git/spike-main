"use client";
import { useState } from "react";
import { getCookie } from "cookies-next";
import { authGetFetch } from "@/helpers/server-fetch.helper";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";

export default function ExportTimeRecordsButton({ filters, isManager = false }) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!filters.startDate || !filters.endDate) {
      toast.error("Selecciona un rango de fechas para exportar");
      return;
    }

    setIsExporting(true);
    const jwtToken = getCookie("factura-token");

    try {
      const params = new URLSearchParams({
        startDate: filters.startDate,
        endDate: filters.endDate,
      });

      if (filters.userId) {
        params.append("userId", filters.userId);
      }

      const response = await authGetFetch(
        `time-entries/export?${params.toString()}`,
        jwtToken
      );

      if (response.ok) {
        const data = await response.json();
        const entries = Array.isArray(data) ? data : [];

        if (entries.length === 0) {
          toast.info("No hay datos para exportar en el rango seleccionado");
          setIsExporting(false);
          return;
        }

        // Create workbook
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(entries);

        // Set column widths
        ws["!cols"] = [
          { wch: 25 }, // usuario
          { wch: 12 }, // fecha
          { wch: 10 }, // entrada
          { wch: 10 }, // salida
          { wch: 15 }, // pausas_minutos
          { wch: 18 }, // horas_trabajadas
          { wch: 12 }, // estado
          { wch: 30 }, // notas
        ];

        XLSX.utils.book_append_sheet(wb, ws, "Fichajes");

        // Generate filename
        const filename = `fichajes_${filters.startDate}_${filters.endDate}.xlsx`;

        // Download
        XLSX.writeFile(wb, filename);
        toast.success("Archivo exportado correctamente");
      } else {
        const error = await response.json();
        toast.error(error.message || "Error al exportar");
      }
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Error al exportar los datos");
    }

    setIsExporting(false);
  };

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className="flex items-center gap-2 px-4 py-2 bg-success text-white rounded-lg font-medium hover:bg-green-600 transition-colors disabled:opacity-50"
    >
      <span className="material-icons-outlined text-sm">
        {isExporting ? "hourglass_empty" : "download"}
      </span>
      {isExporting ? "Exportando..." : "Exportar Excel"}
    </button>
  );
}
