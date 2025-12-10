"use client";
import BaseModal, { ModalActions, ModalButton } from "../base-modal.component";

export default function ClockConfirmationModal({
  isOpen,
  action,
  onConfirm,
  onCancel,
  isLoading = false,
}) {
  const getModalContent = () => {
    switch (action) {
      case "clockIn":
        return {
          title: "Fichar Entrada",
          message: "Vas a registrar tu entrada. ¿Confirmas?",
          icon: "login",
          iconColor: "text-success",
          confirmText: "Fichar Entrada",
          confirmVariant: "primary",
        };
      case "clockOut":
        return {
          title: "Fichar Salida",
          message:
            "Vas a registrar tu salida y finalizar la jornada. ¿Confirmas?",
          icon: "logout",
          iconColor: "text-danger",
          confirmText: "Fichar Salida",
          confirmVariant: "danger",
        };
      case "breakStart":
        return {
          title: "Iniciar Pausa",
          message: "Vas a iniciar tu tiempo de descanso. ¿Confirmas?",
          icon: "coffee",
          iconColor: "text-warning",
          confirmText: "Iniciar Pausa",
          confirmVariant: "primary",
        };
      case "breakEnd":
        return {
          title: "Finalizar Pausa",
          message: "Vas a volver al trabajo. ¿Confirmas?",
          icon: "play_arrow",
          iconColor: "text-primary",
          confirmText: "Volver al Trabajo",
          confirmVariant: "primary",
        };
      default:
        return {
          title: "",
          message: "",
          icon: "",
          iconColor: "",
          confirmText: "Confirmar",
          confirmVariant: "primary",
        };
    }
  };

  const content = getModalContent();

  return (
    <BaseModal isOpen={isOpen} onClose={onCancel} title={content.title}>
      <div className="text-center py-4">
        <div
          className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 mb-4 ${content.iconColor}`}
        >
          <span className="material-icons-outlined text-4xl">
            {content.icon}
          </span>
        </div>
        <p className="text-slate-600 dark:text-slate-300 text-lg">
          {content.message}
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
          Hora actual:{" "}
          {new Date().toLocaleTimeString("es-ES", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>

      <ModalActions alignment="center">
        <ModalButton variant="ghost" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </ModalButton>
        <ModalButton
          variant={content.confirmVariant}
          onClick={onConfirm}
          disabled={isLoading}
        >
          {isLoading ? "Procesando..." : content.confirmText}
        </ModalButton>
      </ModalActions>
    </BaseModal>
  );
}
