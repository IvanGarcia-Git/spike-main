"use client";
import { useState, useEffect, useCallback } from "react";
import { getCookie } from "cookies-next";
import * as jose from "jose";
import { authGetFetch, authFetch } from "@/helpers/server-fetch.helper";
import { toast } from "react-toastify";
import Link from "next/link";
import TimeRecordsTable from "@/components/time-tracking/time-records.table";
import TimeRecordFilters from "@/components/time-tracking/time-record-filters.section";
import TimeAuditModal from "@/components/time-tracking/time-audit.modal";
import TimeEditModal from "@/components/time-tracking/time-edit.modal";
import ExportTimeRecordsButton from "@/components/time-tracking/export-time-records.button";

export default function HistorialHorario() {
  const [records, setRecords] = useState([]);
  const [filters, setFilters] = useState({
    startDate: null,
    endDate: null,
    userId: null,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [isManager, setIsManager] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  // Modals
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Check manager status
  useEffect(() => {
    const token = getCookie("factura-token");
    if (token) {
      try {
        const payload = jose.decodeJwt(token);
        setIsManager(payload.isManager || false);
      } catch (error) {
        console.error("Error decoding token:", error);
      }
    }
  }, []);

  const fetchRecords = useCallback(async () => {
    if (!filters.startDate || !filters.endDate) return;

    setIsLoading(true);
    setFetchError(null);
    const jwtToken = getCookie("factura-token");

    try {
      const params = new URLSearchParams({
        startDate: filters.startDate,
        endDate: filters.endDate,
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (filters.userId) {
        params.append("userId", filters.userId);
      }

      const response = await authGetFetch(
        `time-entries/history?${params.toString()}`,
        jwtToken
      );

      if (response.ok) {
        const data = await response.json();
        // Ensure entries is always an array
        const entries = Array.isArray(data?.entries) ? data.entries : [];
        setRecords(entries);
        setPagination((prev) => ({
          ...prev,
          total: data?.total || 0,
          totalPages: data?.totalPages || 0,
        }));
      } else {
        setFetchError("Error al cargar los registros");
        toast.error("Error al cargar los registros");
        setRecords([]);
      }
    } catch (error) {
      console.error("Error fetching records:", error);
      setFetchError("Error de conexion al servidor");
      toast.error("Error de conexion");
      setRecords([]);
    }

    setIsLoading(false);
  }, [filters, pagination.page, pagination.limit]);

  useEffect(() => {
    if (filters.startDate && filters.endDate) {
      fetchRecords();
    }
  }, [fetchRecords]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleViewAudit = (record) => {
    setSelectedRecord(record);
    setAuditModalOpen(true);
  };

  const handleEdit = (record) => {
    setSelectedRecord(record);
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (formData) => {
    if (!selectedRecord) return;

    setIsSaving(true);
    const jwtToken = getCookie("factura-token");

    try {
      const payload = {
        reason: formData.reason,
      };

      if (formData.clockInTime) {
        payload.clockInTime = new Date(formData.clockInTime).toISOString();
      }
      if (formData.clockOutTime) {
        payload.clockOutTime = new Date(formData.clockOutTime).toISOString();
      }
      if (formData.notes !== undefined) {
        payload.notes = formData.notes;
      }

      const response = await authFetch(
        "PATCH",
        `time-entries/${selectedRecord.uuid}`,
        payload,
        jwtToken
      );

      if (response.ok) {
        toast.success("Registro actualizado correctamente");
        setEditModalOpen(false);
        setSelectedRecord(null);
        fetchRecords();
      } else {
        const error = await response.json();
        toast.error(error.message || "Error al actualizar");
      }
    } catch (error) {
      console.error("Error saving:", error);
      toast.error("Error de conexion");
    }

    setIsSaving(false);
  };

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/control-horario"
            className="p-2 neumorphic-button rounded-lg text-slate-600 dark:text-slate-300 hover:text-primary transition-colors"
          >
            <span className="material-icons-outlined">arrow_back</span>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              Historial de Fichajes
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Consulta y gestiona los registros de tiempo
            </p>
          </div>
        </div>
        <ExportTimeRecordsButton filters={filters} isManager={isManager} />
      </div>

      {/* Filters */}
      <TimeRecordFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        isManager={isManager}
      />

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        </div>
      ) : fetchError ? (
        /* Error State */
        <div className="neumorphic-card p-8 text-center">
          <span className="material-icons-outlined text-4xl text-danger mb-2">
            error_outline
          </span>
          <p className="text-slate-600 dark:text-slate-400 mb-4">{fetchError}</p>
          <button
            onClick={fetchRecords}
            className="px-4 py-2 neumorphic-button rounded-lg text-primary font-medium hover:bg-primary/10 transition-colors"
          >
            <span className="flex items-center gap-2">
              <span className="material-icons-outlined text-sm">refresh</span>
              Reintentar
            </span>
          </button>
        </div>
      ) : (
        <>
          {/* Records Table */}
          <TimeRecordsTable
            records={records}
            isManager={isManager}
            onViewAudit={handleViewAudit}
            onEdit={handleEdit}
            showUserColumn={filters.userId === "all" || (isManager && filters.userId)}
          />

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Mostrando {records.length} de {pagination.total} registros
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="p-2 neumorphic-button rounded-lg text-slate-600 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="material-icons-outlined">chevron_left</span>
                </button>
                <span className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300">
                  Pagina {pagination.page} de {pagination.totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="p-2 neumorphic-button rounded-lg text-slate-600 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="material-icons-outlined">chevron_right</span>
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Audit Modal */}
      <TimeAuditModal
        isOpen={auditModalOpen}
        onClose={() => {
          setAuditModalOpen(false);
          setSelectedRecord(null);
        }}
        recordUuid={selectedRecord?.uuid}
      />

      {/* Edit Modal (Manager only) */}
      {isManager && (
        <TimeEditModal
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setSelectedRecord(null);
          }}
          record={selectedRecord}
          onSave={handleSaveEdit}
          isLoading={isSaving}
        />
      )}
    </div>
  );
}
