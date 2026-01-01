import BaseModal, { ModalActions, ModalButton } from "./base-modal.component";

export default function ConfirmDeleteTaskModal({ isOpen = true, onClose, onDelete }) {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Eliminar tarea"
      subtitle="Esta acción no se puede deshacer"
      maxWidth="max-w-md"
    >
      <div className="flex items-center gap-4 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 mb-4">
        <span className="material-icons-outlined text-danger text-3xl">warning</span>
        <p className="text-slate-700 dark:text-slate-300">
          ¿Estás seguro de que quieres eliminar esta tarea? Se eliminarán también todos los comentarios asociados.
        </p>
      </div>

      <ModalActions alignment="end">
        <ModalButton variant="ghost" onClick={onClose}>
          Cancelar
        </ModalButton>
        <ModalButton variant="danger" onClick={onDelete} icon="delete">
          Eliminar
        </ModalButton>
      </ModalActions>
    </BaseModal>
  );
}
