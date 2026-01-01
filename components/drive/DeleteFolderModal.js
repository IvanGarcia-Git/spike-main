import BaseModal, { ModalActions, ModalButton } from "../base-modal.component";

export default function DeleteFolderModal({ isOpen = true, onConfirm, onCancel }) {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onCancel}
      title="Eliminar carpeta"
      subtitle="Esta acción no se puede deshacer"
      maxWidth="max-w-md"
    >
      <div className="flex items-center gap-4 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 mb-4">
        <span className="material-icons-outlined text-danger text-3xl">folder_delete</span>
        <p className="text-slate-700 dark:text-slate-300">
          ¿Estás seguro de que quieres eliminar esta carpeta? Se eliminarán todos los archivos y subcarpetas que contiene.
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
