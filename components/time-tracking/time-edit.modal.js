"use client";
import { useState, useEffect } from "react";
import BaseModal, {
  ModalActions,
  ModalButton,
  ModalInput,
  ModalTextarea,
} from "../base-modal.component";

export default function TimeEditModal({
  isOpen,
  onClose,
  record,
  onSave,
  isLoading = false,
}) {
  const [formData, setFormData] = useState({
    clockInTime: "",
    clockOutTime: "",
    notes: "",
    reason: "",
  });

  useEffect(() => {
    if (record) {
      let clockInStr = "";
      let clockOutStr = "";

      try {
        if (record.clockInTime) {
          const clockIn = new Date(record.clockInTime);
          if (!isNaN(clockIn.getTime())) {
            clockInStr = `${clockIn.toISOString().split("T")[0]}T${clockIn
              .toTimeString()
              .slice(0, 5)}`;
          }
        }

        if (record.clockOutTime) {
          const clockOut = new Date(record.clockOutTime);
          if (!isNaN(clockOut.getTime())) {
            clockOutStr = `${clockOut.toISOString().split("T")[0]}T${clockOut
              .toTimeString()
              .slice(0, 5)}`;
          }
        }
      } catch (error) {
        console.error("Error parsing dates:", error);
      }

      setFormData({
        clockInTime: clockInStr,
        clockOutTime: clockOutStr,
        notes: record.notes || "",
        reason: "",
      });
    }
  }, [record]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.reason.trim()) {
      return;
    }
    onSave(formData);
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Editar Registro"
      subtitle={`Registro del ${
        record?.clockInTime && !isNaN(new Date(record.clockInTime).getTime())
          ? new Date(record.clockInTime).toLocaleDateString("es-ES")
          : "-"
      }`}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          {/* Clock In Time */}
          <ModalInput
            label="Hora de Entrada"
            type="datetime-local"
            id="clockInTime"
            value={formData.clockInTime}
            onChange={(e) => handleChange("clockInTime", e.target.value)}
            required
          />

          {/* Clock Out Time */}
          <ModalInput
            label="Hora de Salida"
            type="datetime-local"
            id="clockOutTime"
            value={formData.clockOutTime}
            onChange={(e) => handleChange("clockOutTime", e.target.value)}
          />

          {/* Notes */}
          <ModalTextarea
            label="Notas"
            id="notes"
            value={formData.notes}
            onChange={(e) => handleChange("notes", e.target.value)}
            placeholder="Notas adicionales..."
            rows={2}
          />

          {/* Reason (Required) */}
          <ModalTextarea
            label="Motivo de la modificacion"
            id="reason"
            value={formData.reason}
            onChange={(e) => handleChange("reason", e.target.value)}
            placeholder="Indica el motivo de esta modificacion..."
            rows={3}
            required
          />

          <div className="bg-warning/10 text-warning p-3 rounded-lg text-sm flex items-start gap-2">
            <span className="material-icons-outlined text-lg">warning</span>
            <p>
              Todas las modificaciones quedan registradas en el historial de
              cambios con el motivo indicado.
            </p>
          </div>
        </div>

        <ModalActions alignment="end">
          <ModalButton
            variant="ghost"
            onClick={onClose}
            disabled={isLoading}
            type="button"
          >
            Cancelar
          </ModalButton>
          <ModalButton
            variant="primary"
            type="submit"
            disabled={isLoading || !formData.reason.trim()}
          >
            {isLoading ? "Guardando..." : "Guardar Cambios"}
          </ModalButton>
        </ModalActions>
      </form>
    </BaseModal>
  );
}
