import { useState, useRef } from "react";
import { toast } from "react-toastify";
import { getCookie } from "cookies-next";
import { authFetchFormData } from "@/helpers/server-fetch.helper";
import CreateFolderModal from "./CreateFolderModal";

const MAX_FILE_SIZE = 1024 * 1024 * 1024;
const MAX_FILE_SIZE_MB = MAX_FILE_SIZE / 1024 / 1024;

export default function FileUpload({ section, setFiles, setFolders }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileUpload = async (e) => {
    const jwtToken = getCookie("factura-token");
    const file = e.target.files[0];

    if (!file) {
      toast.error("Por favor, selecciona un archivo.", {
        position: "top-right",
        autoClose: 2500,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error(
        `El archivo es demasiado grande. El tamaño máximo permitido es ${MAX_FILE_SIZE_MB} MB.`,
        {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: false,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        }
      );
      return;
    }

    const allowedExtensions = [".png", ".jpg", ".jpeg", ".mp3", ".xlsx", ".pdf"];
    const fileExtension = file.name.split(".").pop().toLowerCase();
    if (!allowedExtensions.includes(`.${fileExtension}`)) {
      toast.error("Tipo de archivo no permitido. Solo se permiten imágenes, MP3, Excel y PDF.", {
        position: "top-right",
        autoClose: 2500,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", section.fileType);
      if (section.folderParentId) {
        formData.append("folderId", section.folderParentId);
      }

      const response = await authFetchFormData("POST", "files", formData, jwtToken);

      if (!response.ok) {
        throw new Error(`Error al subir el archivo: ${response.statusText}`);
      }

      const data = await response.json();
      toast.success("Archivo subido con éxito!", {
        position: "top-right",
        autoClose: 2500,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
      setFiles((prev) => [...prev, data]);
      e.target.value = "";
    } catch (error) {
      console.error("Error al subir el archivo:", error);
      toast.error("Hubo un error al subir el archivo. Por favor, inténtalo de nuevo.", {
        position: "top-right",
        autoClose: 2500,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
    }
  };

  const handleCreateFolder = () => {
    setIsModalOpen(true);
    setIsMenuOpen(false);
  };

  return (
    <div className="relative mt-10">
      <div
        onMouseEnter={() => setIsMenuOpen(true)}
        onMouseLeave={() => setIsMenuOpen(false)}
        className="relative inline-block"
      >
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="px-4 py-2 bg-background text-black text-lg rounded-lg cursor-pointer hover:bg-backgroundHover transition-colors duration-200"
        >
          + Nuevo
        </button>

        {isMenuOpen && (
          <div
            className="absolute top-full left-0 bg-white border border-gray-300 rounded-lg shadow-md w-40 z-10"
            onMouseEnter={() => setIsMenuOpen(true)}
            onMouseLeave={() => setIsMenuOpen(false)}
          >
            <ul className="flex flex-col">
              <li className="p-2 hover:bg-gray-100 cursor-pointer" onClick={handleCreateFolder}>
                Crear Carpeta
              </li>
              <li
                className="p-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                Subir Archivo
              </li>
            </ul>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".png, .jpg, .jpeg, .mp3, .xlsx, .pdf"
          onChange={handleFileUpload}
        />
      </div>

      {isModalOpen && (
        <CreateFolderModal
          section={section}
          setFolders={setFolders}
          setIsModalOpen={setIsModalOpen}
        />
      )}
    </div>
  );
}
