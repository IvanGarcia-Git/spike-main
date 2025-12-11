"use client";
import { useState, useRef } from "react";
import { getCookie } from "cookies-next";
import { authFetch, authFetchFormData } from "@/helpers/server-fetch.helper";
import ImportLeadsPreview from "./import-leads-preview.component";

export default function ImportLeadsModal({ closeModal, onImportComplete }) {
  const [step, setStep] = useState("UPLOAD"); // UPLOAD | PREVIEW | RESULT
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    setError("");

    if (!selectedFile) return;

    // Validate file type
    if (!selectedFile.name.endsWith(".xlsx") && !selectedFile.name.endsWith(".xls")) {
      setError("Solo se permiten archivos Excel (.xlsx, .xls)");
      return;
    }

    // Validate file size (50MB)
    if (selectedFile.size > 50 * 1024 * 1024) {
      setError("El archivo no puede superar los 50MB");
      return;
    }

    setFile(selectedFile);
  };

  const handleUploadPreview = async () => {
    if (!file) {
      setError("Debe seleccionar un archivo Excel");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const jwtToken = getCookie("factura-token");
      const formData = new FormData();
      formData.append("file", file);

      const response = await authFetchFormData(
        "POST",
        "leads/import/preview",
        formData,
        jwtToken
      );

      if (response.ok) {
        const data = await response.json();
        setPreviewData(data);
        // Pre-select all valid rows and duplicates (duplicates will be created with "Repetido" status)
        const allImportableRows = [
          ...data.validRows.map((r) => r.rowNumber),
          ...data.duplicateRows.map((r) => r.rowNumber),
        ];
        setSelectedRows(allImportableRows);
        setStep("PREVIEW");
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Error al procesar el archivo");
      }
    } catch (err) {
      console.error("Error uploading file:", err);
      setError("Error al conectar con el servidor");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (selectedRows.length === 0) {
      setError("Debe seleccionar al menos una fila para importar");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const jwtToken = getCookie("factura-token");
      const response = await authFetch(
        "POST",
        "leads/import/confirm",
        {
          sessionId: previewData.sessionId,
          rowsToImport: selectedRows,
        },
        jwtToken
      );

      if (response.ok) {
        const data = await response.json();
        setResult(data);
        setStep("RESULT");
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Error al importar los leads");
      }
    } catch (err) {
      console.error("Error confirming import:", err);
      setError("Error al conectar con el servidor");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const jwtToken = getCookie("factura-token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/leads/import/template`,
        {
          headers: {
            Authorization: `Bearer ${jwtToken}`,
          },
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "plantilla_leads.xlsx";
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        setError("Error al descargar la plantilla");
      }
    } catch (err) {
      console.error("Error downloading template:", err);
      setError("Error al descargar la plantilla");
    }
  };

  const handleClose = () => {
    if (result && result.created > 0) {
      onImportComplete?.();
    }
    closeModal();
  };

  const handleRowToggle = (rowNumber) => {
    setSelectedRows((prev) =>
      prev.includes(rowNumber)
        ? prev.filter((r) => r !== rowNumber)
        : [...prev, rowNumber]
    );
  };

  const handleSelectAll = (rows) => {
    const rowNumbers = rows.map((r) => r.rowNumber);
    const allSelected = rowNumbers.every((r) => selectedRows.includes(r));

    if (allSelected) {
      setSelectedRows((prev) => prev.filter((r) => !rowNumbers.includes(r)));
    } else {
      setSelectedRows((prev) => [...new Set([...prev, ...rowNumbers])]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="modal-card p-6 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            {step === "UPLOAD" && "Importar Leads desde Excel"}
            {step === "PREVIEW" && "Vista Previa de Importación"}
            {step === "RESULT" && "Resultado de Importación"}
          </h2>
          <button
            onClick={handleClose}
            className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
          >
            <span className="material-icons-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {/* STEP: UPLOAD */}
          {step === "UPLOAD" && (
            <div className="space-y-6">
              {/* File input area */}
              <div
                className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <span className="material-icons-outlined text-5xl text-slate-400 mb-4">
                  upload_file
                </span>
                <p className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {file ? file.name : "Haz clic para seleccionar un archivo"}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Solo archivos Excel (.xlsx, .xls) - Máximo 50MB
                </p>
              </div>

              {/* Download template button */}
              <div className="flex items-center justify-center">
                <button
                  onClick={handleDownloadTemplate}
                  className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
                >
                  <span className="material-icons-outlined">download</span>
                  Descargar plantilla de ejemplo
                </button>
              </div>

              {/* Format info */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                  <span className="material-icons-outlined">info</span>
                  Formato esperado del archivo
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-400 mb-2">
                  El archivo debe contener las siguientes columnas:
                </p>
                <ul className="text-sm text-blue-700 dark:text-blue-400 list-disc list-inside space-y-1">
                  <li><strong>nombre</strong> (obligatorio) - Nombre completo del lead</li>
                  <li><strong>email</strong> (opcional) - Correo electrónico</li>
                  <li><strong>telefono</strong> (obligatorio) - 9 dígitos comenzando por 6, 7, 8 o 9</li>
                  <li><strong>campana</strong> (obligatorio) - Nombre de la campaña</li>
                  <li><strong>fuente</strong> (opcional) - Origen del lead</li>
                </ul>
              </div>
            </div>
          )}

          {/* STEP: PREVIEW */}
          {step === "PREVIEW" && previewData && (
            <ImportLeadsPreview
              data={previewData}
              selectedRows={selectedRows}
              onRowToggle={handleRowToggle}
              onSelectAll={handleSelectAll}
            />
          )}

          {/* STEP: RESULT */}
          {step === "RESULT" && result && (
            <div className="space-y-6">
              {/* Success summary */}
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6 text-center">
                <span className="material-icons-outlined text-5xl text-green-500 mb-4">
                  check_circle
                </span>
                <h3 className="text-2xl font-bold text-green-700 dark:text-green-300 mb-2">
                  {result.created} leads importados correctamente
                </h3>
                {result.campaignsCreated.length > 0 && (
                  <p className="text-green-600 dark:text-green-400">
                    Campañas creadas/utilizadas: {result.campaignsCreated.join(", ")}
                  </p>
                )}
              </div>

              {/* Failed rows */}
              {result.failed.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                  <h4 className="font-medium text-red-800 dark:text-red-300 mb-3 flex items-center gap-2">
                    <span className="material-icons-outlined">error</span>
                    {result.failed.length} filas no pudieron importarse
                  </h4>
                  <div className="space-y-2 max-h-40 overflow-auto">
                    {result.failed.map((fail) => (
                      <div
                        key={fail.rowNumber}
                        className="text-sm text-red-700 dark:text-red-400"
                      >
                        <strong>Fila {fail.rowNumber}:</strong> {fail.error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
            <span className="material-icons-outlined text-lg">error</span>
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          {step === "UPLOAD" && (
            <>
              <button
                onClick={handleUploadPreview}
                disabled={!file || isLoading}
                className="flex-1 neumorphic-button px-6 py-3 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <span className="material-icons-outlined animate-spin">refresh</span>
                    Procesando...
                  </>
                ) : (
                  <>
                    <span className="material-icons-outlined">preview</span>
                    Ver Vista Previa
                  </>
                )}
              </button>
              <button
                onClick={handleClose}
                className="flex-1 neumorphic-button px-6 py-3 rounded-lg text-slate-600 dark:text-slate-400 font-semibold"
              >
                Cancelar
              </button>
            </>
          )}

          {step === "PREVIEW" && (
            <>
              <button
                onClick={handleConfirmImport}
                disabled={selectedRows.length === 0 || isLoading}
                className="flex-1 neumorphic-button px-6 py-3 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <span className="material-icons-outlined animate-spin">refresh</span>
                    Importando...
                  </>
                ) : (
                  <>
                    <span className="material-icons-outlined">file_upload</span>
                    Importar {selectedRows.length} leads
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setStep("UPLOAD");
                  setFile(null);
                  setPreviewData(null);
                  setSelectedRows([]);
                }}
                disabled={isLoading}
                className="flex-1 neumorphic-button px-6 py-3 rounded-lg text-slate-600 dark:text-slate-400 font-semibold"
              >
                Volver
              </button>
            </>
          )}

          {step === "RESULT" && (
            <button
              onClick={handleClose}
              className="flex-1 neumorphic-button px-6 py-3 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90 transition-colors"
            >
              Cerrar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
