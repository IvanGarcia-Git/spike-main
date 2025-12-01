import { useState, useEffect } from "react";
import { getCookie } from "cookies-next";
import { authGetFetch, authFetch } from "@/helpers/server-fetch.helper";

//TODO: REFACTOR THE CODE (UNIFY) CONTRACT.DOCUMENTS.MODAL AND CONTRACT.DOCUMENTS.PAGE

export default function ContractsDocumentsModal({ contractUuid, isOpen, onClose, documentation }) {
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const getContractDocuments = async () => {
    const jwtToken = getCookie("factura-token");
    try {
      const response = await authGetFetch(`contract-documents/contract/${contractUuid}`, jwtToken);

      if (response.ok) {
        const documents = await response.json();
        setFiles(documents);
      } else {
        alert("Error al obtener los documentos del contrato");
      }
    } catch (error) {
      console.error("Error al obtener los documentos:", error);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();

    if (!selectedFile) {
      alert("Por favor selecciona un archivo para subir.");
      return;
    }

    setUploading(true);

    const formData = new FormData();
    formData.append("contractDocument", selectedFile);
    formData.append("contractUuid", contractUuid);

    const jwtToken = getCookie("factura-token");

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/contract-documents/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
        body: formData,
      });

      if (response.ok) {
        alert("Archivo subido con éxito");
        setSelectedFile(null);
        await getContractDocuments();
      } else {
        alert("Error al subir el archivo.");
      }
    } catch (error) {
      console.error("Error al subir el archivo:", error);
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    getContractDocuments();
  }, [contractUuid]);

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEsc);

    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, onClose]);

  const handleFileView = (fileUrl) => {
    window.open(fileUrl, "_blank");
  };

  const handleFileDelete = async (documentUuid) => {
    const jwtToken = getCookie("factura-token");

    if (confirm("¿Estás seguro de que deseas eliminar este archivo?")) {
      try {
        const response = await authFetch(
          "DELETE",
          `contract-documents/`,
          { contractDocumentUuid: documentUuid },
          jwtToken
        );

        if (response.ok) {
          alert("Documento eliminado con éxito.");
          getContractDocuments();
        } else {
          alert("Error al eliminar el documento.");
        }
      } catch (error) {
        console.error("Error al eliminar el documento:", error);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4 ${
        isOpen ? "lg:ml-72" : ""
      }`}
    >
      <div className="bg-background-light dark:bg-background-dark rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full neumorphic-card-inset flex items-center justify-center">
              <span className="material-icons-outlined text-primary">folder</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                Documentos del Contrato
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Gestiona los documentos adjuntos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full neumorphic-button flex items-center justify-center text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
          >
            <span className="material-icons-outlined">close</span>
          </button>
        </div>

        {/* Documentación requerida */}
        {documentation && documentation.length > 0 && (
          <div className="neumorphic-card-inset p-4 rounded-lg mb-6">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
              <span className="material-icons-outlined text-primary text-lg">checklist</span>
              Documentación Requerida
            </h3>
            <ul className="space-y-1">
              {documentation.map((doc, index) => (
                <li key={index} className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                  <span className="material-icons-outlined text-xs text-slate-400">check_circle_outline</span>
                  {doc}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Upload form */}
        <form onSubmit={handleFileUpload} className="mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <input
                type="file"
                id="file"
                className="hidden"
                onChange={(e) => setSelectedFile(e.target.files[0])}
              />
              <label
                htmlFor="file"
                className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg neumorphic-button cursor-pointer text-slate-600 dark:text-slate-400 font-medium hover:text-primary transition-colors"
              >
                <span className="material-icons-outlined">upload_file</span>
                {selectedFile ? selectedFile.name : "Seleccionar archivo"}
              </label>
            </div>
            <button
              type="submit"
              className="px-6 py-3 rounded-lg bg-primary text-white font-semibold neumorphic-button hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              disabled={uploading || !selectedFile}
            >
              {uploading ? (
                <>
                  <span className="material-icons-outlined animate-spin">refresh</span>
                  Subiendo...
                </>
              ) : (
                <>
                  <span className="material-icons-outlined">cloud_upload</span>
                  Subir
                </>
              )}
            </button>
          </div>
        </form>

        {/* Files list */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <span className="material-icons-outlined text-primary text-lg">description</span>
            Documentos ({files.length})
          </h3>

          {files.length > 0 ? (
            <div className="space-y-2">
              {files.map((file) => (
                <div
                  key={file.uuid}
                  className="neumorphic-card p-4 rounded-lg flex items-center justify-between group hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-lg neumorphic-card-inset flex items-center justify-center flex-shrink-0">
                      <span className="material-icons-outlined text-yellow-500">insert_drive_file</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-800 dark:text-slate-200 truncate">
                        {file.fileName}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {new Date(file.createdAt).toLocaleDateString("es-ES", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    <button
                      onClick={() => handleFileView(file.documentUri)}
                      className="w-9 h-9 rounded-lg neumorphic-button flex items-center justify-center text-blue-500 hover:text-blue-600 transition-colors"
                      title="Ver documento"
                    >
                      <span className="material-icons-outlined text-lg">visibility</span>
                    </button>
                    <button
                      onClick={() => handleFileDelete(file.uuid)}
                      className="w-9 h-9 rounded-lg neumorphic-button flex items-center justify-center text-red-500 hover:text-red-600 transition-colors"
                      title="Eliminar documento"
                    >
                      <span className="material-icons-outlined text-lg">delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="neumorphic-card-inset p-8 rounded-lg text-center">
              <span className="material-icons-outlined text-5xl text-slate-400 mb-3">folder_off</span>
              <p className="text-slate-600 dark:text-slate-400 font-medium">
                No hay documentos disponibles
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
                Sube el primer documento usando el botón de arriba
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-lg neumorphic-button font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
