"use client";
import { useState, useEffect } from "react";
import { getCookie } from "cookies-next";
import { authGetFetch } from "@/helpers/server-fetch.helper";
import BaseModal from "../base-modal.component";

const actionLabels = {
  clock_in: "Fichaje entrada",
  clock_out: "Fichaje salida",
  break_start: "Inicio pausa",
  break_end: "Fin pausa",
  edit_clock_in: "Edicion entrada",
  edit_clock_out: "Edicion salida",
  edit_break: "Edicion pausa",
  delete: "Eliminacion",
};

export default function TimeAuditModal({ isOpen, onClose, recordUuid }) {
  const [audits, setAudits] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && recordUuid) {
      fetchAudits();
    }
  }, [isOpen, recordUuid]);

  const fetchAudits = async () => {
    setIsLoading(true);
    const jwtToken = getCookie("factura-token");
    try {
      const response = await authGetFetch(
        `time-entries/${recordUuid}/audit`,
        jwtToken
      );
      if (response.ok) {
        const data = await response.json();
        setAudits(data);
      }
    } catch (error) {
      console.error("Error fetching audits:", error);
    }
    setIsLoading(false);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatValue = (value) => {
    if (!value) return "-";
    // Try to parse as date
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date.toLocaleString("es-ES", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return value;
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Historial de Cambios"
      subtitle="Registro de todas las modificaciones"
      maxWidth="max-w-2xl"
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : audits.length === 0 ? (
        <div className="text-center py-8">
          <span className="material-icons-outlined text-4xl text-slate-400 mb-2">
            history
          </span>
          <p className="text-slate-500 dark:text-slate-400">
            No hay cambios registrados
          </p>
        </div>
      ) : (
        <div className="max-h-96 overflow-y-auto">
          <div className="space-y-4">
            {audits.map((audit, index) => (
              <div
                key={audit.uuid || index}
                className="neumorphic-card-inset p-4 rounded-lg"
              >
                <div className="flex items-start justify-between mb-2">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      audit.action.includes("edit") || audit.action === "delete"
                        ? "bg-warning/10 text-warning"
                        : "bg-primary/10 text-primary"
                    }`}
                  >
                    {actionLabels[audit.action] || audit.action}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {formatDate(audit.createdAt)}
                  </span>
                </div>

                <div className="text-sm text-slate-600 dark:text-slate-300">
                  <p className="mb-1">
                    <span className="font-medium">Por:</span>{" "}
                    {audit.modifiedByUser
                      ? `${audit.modifiedByUser.name} ${audit.modifiedByUser.firstSurname}`
                      : "Sistema"}
                  </p>

                  {audit.fieldName && (
                    <p className="mb-1">
                      <span className="font-medium">Campo:</span>{" "}
                      {audit.fieldName === "clockInTime"
                        ? "Hora entrada"
                        : audit.fieldName === "clockOutTime"
                        ? "Hora salida"
                        : audit.fieldName}
                    </p>
                  )}

                  {audit.oldValue && (
                    <p className="mb-1">
                      <span className="font-medium">Valor anterior:</span>{" "}
                      <span className="text-danger line-through">
                        {formatValue(audit.oldValue)}
                      </span>
                    </p>
                  )}

                  {audit.newValue && (
                    <p className="mb-1">
                      <span className="font-medium">Nuevo valor:</span>{" "}
                      <span className="text-success">
                        {formatValue(audit.newValue)}
                      </span>
                    </p>
                  )}

                  {audit.reason && (
                    <p className="mt-2 p-2 bg-slate-100 dark:bg-slate-800 rounded text-xs">
                      <span className="font-medium">Motivo:</span>{" "}
                      {audit.reason}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </BaseModal>
  );
}
