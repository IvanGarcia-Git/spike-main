import BaseModal, { ModalActions, ModalButton } from "../base-modal.component";

export default function DeleteFileModal({ isOpen = true, onConfirm, onCancel }) {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onCancel}
      title="Eliminar archivo"
      subtitle="Esta acción no se puede deshacer"
      maxWidth="max-w-md"
    >
      <div className="flex items-center gap-4 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 mb-4">
        <span className="material-icons-outlined text-danger text-3xl">delete_forever</span>
        <p className="text-slate-700 dark:text-slate-300">
          ¿Estás seguro de que quieres eliminar este archivo? Se eliminará permanentemente del sistema.
        </p>
      </div>

      <ModalActions alignment="end">
        <ModalButton variant="ghost" onClick={onCancel}>
          Cancelar
        </ModalButton>
        <ModalButton variant="danger" onClick={onConfirm} icon="delete">
          Eliminar
        </ModalButton>
      </ModalActions>
    </BaseModal>
  );
}
