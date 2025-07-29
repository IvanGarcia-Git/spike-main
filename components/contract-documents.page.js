"use client";
import { useState, useEffect } from "react";
import { AiFillFile } from "react-icons/ai";
import { getCookie } from "cookies-next";
import { authGetFetch, authFetch } from "@/helpers/server-fetch.helper";

export default function ContractDocuments({ contractUuid, documentation }) {
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const getContractDocuments = async () => {
    const jwtToken = getCookie("factura-token");
    try {
      const response = await authGetFetch(
        `contract-documents/contract/${contractUuid}`,
        jwtToken
      );

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
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/contract-documents/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${jwtToken}`,
          },
          body: formData,
        }
      );

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

  return (
    <div className="bg-foreground">
      <div className="max-w-7xl mx-auto bg-background p-6 shadow-lg">
        {/* Mostrar los tipos de documentación requeridos */}
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-black">
            Documentación Requerida:
          </h2>
          {documentation && documentation.length > 0 ? (
            <ul className="list-disc pl-5 text-black">
              {documentation.map((doc, index) => (
                <li key={index}>{doc}</li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600">
              No se especificaron tipos de documentación requeridos.
            </p>
          )}
        </div>
        <form onSubmit={handleFileUpload}>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4">
              <input
                type="file"
                id="file"
                className="hidden"
                onChange={(e) => setSelectedFile(e.target.files[0])}
              />
              <label
                htmlFor="file"
                className="px-4 py-2 bg-backgroundHoverBold text-black rounded-md cursor-pointer"
              >
                Seleccionar archivo
              </label>
              <span className="text-gray-600">
                {selectedFile
                  ? selectedFile.name
                  : "Ningún archivo seleccionado"}
              </span>
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-secondary text-white rounded-md hover:bg-secondaryHover"
              disabled={uploading}
            >
              {uploading ? "Subiendo..." : "Subir Documentación"}
            </button>
          </div>
        </form>

        <div className="bg-backgroundHover">
          {files.length > 0 ? (
            <ul className="space-y-4">
              {files.map((file) => (
                <li
                  key={file.uuid}
                  className="flex justify-between items-center bg-backgroundHoverBold p-4 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <AiFillFile size={24} className="text-yellow-400" />
                    <span className="font-semibold text-black">
                      {file.fileName}
                    </span>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">
                      {new Date(file.createdAt).toLocaleDateString()} -{" "}
                      {new Date(file.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="flex space-x-4">
                    {/* Botón para ver el archivo */}
                    <button
                      onClick={() => handleFileView(file.documentUri)}
                      className="bg-blue-500 text-white px-4 py-2 rounded"
                    >
                      Ver
                    </button>

                    {/* Botón para eliminar el archivo */}
                    <button
                      onClick={() => handleFileDelete(file.uuid)}
                      className="bg-red-500 text-white px-4 py-2 rounded"
                    >
                      Eliminar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-black">No hay documentos disponibles.</p>
          )}
        </div>
      </div>
    </div>
  );
}
