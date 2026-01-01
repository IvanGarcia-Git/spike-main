import { useState } from "react";
import { getCookie } from "cookies-next";
import { authFetch } from "@/helpers/server-fetch.helper";
import { toast } from "react-toastify";
import BaseModal, { ModalActions, ModalButton, ModalInput } from "../base-modal.component";

const MAX_FOLDER_NAME_LENGTH = 255;

export default function CreateFolderModal({ section, setFolders, setIsModalOpen, isOpen = true }) {
  const [folderName, setFolderName] = useState("");
  const [error, setError] = useState("");

  const handleCreateFolder = async () => {
    if (!folderName.trim()) {
      setError("El nombre de la carpeta no puede estar vacío.");
      return;
    }

    if (folderName.length > MAX_FOLDER_NAME_LENGTH) {
      setError(`El nombre de la carpeta no puede tener más de ${MAX_FOLDER_NAME_LENGTH} caracteres.`);
      return;
    }

    try {
      const jwtToken = getCookie("factura-token");
      const body = { name: folderName, type: section.fileType, parentFolderId: section.folderParentId };
      const response = await authFetch("POST", "folders", body, jwtToken);

      if (!response.ok) {
        throw new Error("Error al crear la carpeta.");
      }

      const data = await response.json();
      toast.success("Carpeta creada exitosamente!", {
        position: "top-right",
        autoClose: 2500,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
      setIsModalOpen(false);
      setFolders(prevFolders => [...prevFolders, data]);
    } catch (error) {
      console.error("Error al crear la carpeta:", error);
      setError("Hubo un error al crear la carpeta. Por favor, inténtalo de nuevo.");
    }
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setFolderName("");
    setError("");
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Crear nueva carpeta"
      subtitle="Ingresa un nombre para la carpeta"
      maxWidth="max-w-md"
    >
      <div className="mb-4">
        <ModalInput
          label="Nombre de la carpeta"
          type="text"
          id="folderName"
          value={folderName}
          onChange={(e) => {
            setFolderName(e.target.value);
            setError("");
          }}
          placeholder="Ej: Documentos 2024"
          required
        />
        {error && (
          <p className="text-danger text-sm mt-2 flex items-center gap-1">
            <span className="material-icons-outlined text-sm">error</span>
            {error}
          </p>
        )}
      </div>

      <ModalActions alignment="end">
        <ModalButton variant="ghost" onClick={handleClose}>
          Cancelar
        </ModalButton>
        <ModalButton variant="primary" onClick={handleCreateFolder} icon="create_new_folder">
          Crear carpeta
        </ModalButton>
      </ModalActions>
    </BaseModal>
  );
}
