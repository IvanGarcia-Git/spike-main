import { useState } from "react";
import { getCookie } from "cookies-next";
import { authFetch } from "@/helpers/server-fetch.helper";
import { toast } from "react-toastify";

const MAX_FOLDER_NAME_LENGTH = 255;

export default function CreateFolderModal({ section, setFolders, setIsModalOpen }) {
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
      setFolders( prevFolders => [...prevFolders, data]);
    } catch (error) {
      console.error("Error al crear la carpeta:", error);
      setError(
        "Hubo un error al crear la carpeta. Por favor, inténtalo de nuevo."
      );
    }
  };

  return (
    <div
      className="fixed lg:ml-72 inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20 px-4"
      onClick={() => setIsModalOpen(false)}
    >
      <div
        className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md md:max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold mb-4">Crear Nueva Carpeta</h2>

        <input
          type="text"
          placeholder="Nombre de la carpeta"
          value={folderName}
          onChange={(e) => {
            setFolderName(e.target.value);
            setError("");
          }}
          className="w-full p-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:border-blue-500"
        />

        {error && <p className="text-red-500 text-md mb-4">{error}</p>}

        <div className="flex justify-end gap-2">
          <button
            onClick={() => setIsModalOpen(false)}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            Cerrar
          </button>
          <button
            onClick={handleCreateFolder}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Crear
          </button>
        </div>
      </div>
    </div>
  );
}