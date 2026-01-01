import { useState } from "react";
import BaseModal, { ModalActions, ModalButton, ModalInput } from "../base-modal.component";

export default function RenameFolderModal({ isOpen = true, onConfirm, onCancel, folder }) {
  const [newName, setNewName] = useState(folder?.name || "");
  const [error, setError] = useState("");

  const handleConfirm = (e) => {
    e?.stopPropagation?.();
    if (newName.trim() === "") {
      setError("El nombre de la carpeta no puede estar vacío.");
      return;
    }
    onConfirm({ ...folder, name: newName });
  };

  const handleCancel = (e) => {
    e?.stopPropagation?.();
    onCancel();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleCancel}
      title="Renombrar carpeta"
      subtitle="Cambia el nombre de la carpeta"
      maxWidth="max-w-md"
    >
      <div className="mb-4">
        <ModalInput
          label="Nuevo nombre"
          type="text"
          id="newFolderName"
          value={newName}
          onChange={(e) => {
            e.stopPropagation();
            setNewName(e.target.value);
            setError("");
          }}
          onClick={(e) => e.stopPropagation()}
          placeholder="Nuevo nombre de la carpeta"
          required
        />
        {error && (
          <p className="text-danger text-sm mt-2 flex items-center gap-1">
            <span className="material-icons-outlined text-sm">error</span>
            {error}
          </p>
        )}
      </div>

      <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 mb-4">
        <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
          <span className="material-icons-outlined text-amber-500 text-lg">info</span>
          Al confirmar el cambio de nombre, no será posible deshacer esta acción.
        </p>
      </div>

      <ModalActions alignment="end">
        <ModalButton variant="ghost" onClick={handleCancel}>
          Cancelar
        </ModalButton>
        <ModalButton variant="primary" onClick={handleConfirm} icon="drive_file_rename_outline">
          Renombrar
        </ModalButton>
      </ModalActions>
    </BaseModal>
  );
}
