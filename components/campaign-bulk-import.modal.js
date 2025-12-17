"use client";
import { useState, useRef } from "react";
import { getCookie } from "cookies-next";
import { authFetch, authFetchFormData } from "@/helpers/server-fetch.helper";

export default function CampaignBulkImportModal({ campaign, closeModal, onImportComplete }) {
  const [step, setStep] = useState("UPLOAD"); // UPLOAD | PREVIEW | RESULT
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("valid");
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    setError("");

    if (!selectedFile) return;

    // Validate file type
    const validExtensions = [".xlsx", ".xls", ".csv"];
    const fileExt = selectedFile.name.toLowerCase().slice(selectedFile.name.lastIndexOf("."));
    if (!validExtensions.includes(fileExt)) {
      setError("Solo se permiten archivos Excel (.xlsx, .xls) o CSV (.csv)");
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
      setError("Debe seleccionar un archivo");
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
        `leads/import/campaign/${campaign.uuid}/preview`,
        formData,
        jwtToken
      );

      if (response.ok) {
        const data = await response.json();
        setPreviewData(data);
        // Pre-select all valid rows and duplicates
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
        `leads/import/campaign/${campaign.uuid}/confirm`,
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
        `${process.env.NEXT_PUBLIC_API_URL}/leads/import/campaign/${campaign.uuid}/template`,
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
        a.download = `plantilla_leads_${campaign.name.replace(/[^a-zA-Z0-9]/g, "_")}.xlsx`;
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
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {step === "UPLOAD" && "Subida Masiva de Leads"}
              {step === "PREVIEW" && "Vista Previa de Importacion"}
              {step === "RESULT" && "Resultado de Importacion"}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Campana: <span className="font-medium text-primary">{campaign.name}</span>
            </p>
          </div>
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
                  accept=".xlsx,.xls,.csv"
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
                  Archivos Excel (.xlsx, .xls) o CSV - Maximo 50MB
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
                  <li><strong>telefono</strong> (obligatorio) - 9 digitos comenzando por 6, 7, 8 o 9</li>
                  <li><strong>email</strong> (opcional) - Correo electronico</li>
                  <li><strong>fuente</strong> (opcional) - Origen del lead</li>
                </ul>
                <p className="text-sm text-blue-600 dark:text-blue-400 mt-3 font-medium">
                  Todos los leads se asociaran automaticamente a la campana "{campaign.name}"
                </p>
              </div>
            </div>
          )}

          {/* STEP: PREVIEW */}
          {step === "PREVIEW" && previewData && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-4 gap-4">
                <div className="neumorphic-card-inset p-4 text-center rounded-lg">
                  <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                    {previewData.summary.total}
                  </p>
                  <p className="text-sm text-slate-500">Total filas</p>
                </div>
                <div className="neumorphic-card-inset p-4 text-center rounded-lg">
                  <p className="text-2xl font-bold text-green-600">
                    {previewData.summary.valid}
                  </p>
                  <p className="text-sm text-slate-500">Validos</p>
                </div>
                <div className="neumorphic-card-inset p-4 text-center rounded-lg">
                  <p className="text-2xl font-bold text-amber-600">
                    {previewData.summary.duplicates}
                  </p>
                  <p className="text-sm text-slate-500">Duplicados</p>
                </div>
                <div className="neumorphic-card-inset p-4 text-center rounded-lg">
                  <p className="text-2xl font-bold text-red-600">
                    {previewData.summary.errors}
                  </p>
                  <p className="text-sm text-slate-500">Errores</p>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setActiveTab("valid")}
                  className={`px-4 py-2 font-medium transition-colors ${
                    activeTab === "valid"
                      ? "text-primary border-b-2 border-primary"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Validos ({previewData.validRows.length})
                </button>
                <button
                  onClick={() => setActiveTab("duplicates")}
                  className={`px-4 py-2 font-medium transition-colors ${
                    activeTab === "duplicates"
                      ? "text-amber-600 border-b-2 border-amber-600"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Duplicados ({previewData.duplicateRows.length})
                </button>
                <button
                  onClick={() => setActiveTab("errors")}
                  className={`px-4 py-2 font-medium transition-colors ${
                    activeTab === "errors"
                      ? "text-red-600 border-b-2 border-red-600"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Errores ({previewData.errorRows.length})
                </button>
              </div>

              {/* Table */}
              <div className="max-h-[300px] overflow-auto neumorphic-card-inset rounded-lg">
                {activeTab === "valid" && previewData.validRows.length > 0 && (
                  <table className="w-full text-sm">
                    <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0">
                      <tr>
                        <th className="p-3 text-left">
                          <input
                            type="checkbox"
                            checked={previewData.validRows.every((r) =>
                              selectedRows.includes(r.rowNumber)
                            )}
                            onChange={() => handleSelectAll(previewData.validRows)}
                            className="rounded border-slate-300"
                          />
                        </th>
                        <th className="p-3 text-left">Fila</th>
                        <th className="p-3 text-left">Nombre</th>
                        <th className="p-3 text-left">Telefono</th>
                        <th className="p-3 text-left">Email</th>
                        <th className="p-3 text-left">Fuente</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.validRows.map((row) => (
                        <tr key={row.rowNumber} className="border-t border-slate-200 dark:border-slate-700">
                          <td className="p-3">
                            <input
                              type="checkbox"
                              checked={selectedRows.includes(row.rowNumber)}
                              onChange={() => handleRowToggle(row.rowNumber)}
                              className="rounded border-slate-300"
                            />
                          </td>
                          <td className="p-3 text-slate-500">{row.rowNumber}</td>
                          <td className="p-3 font-medium text-slate-800 dark:text-slate-200">{row.fullName}</td>
                          <td className="p-3 text-slate-600 dark:text-slate-400">{row.phoneNumber}</td>
                          <td className="p-3 text-slate-600 dark:text-slate-400">{row.email || "-"}</td>
                          <td className="p-3 text-slate-600 dark:text-slate-400">{row.campaignSource || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {activeTab === "duplicates" && previewData.duplicateRows.length > 0 && (
                  <table className="w-full text-sm">
                    <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0">
                      <tr>
                        <th className="p-3 text-left">
                          <input
                            type="checkbox"
                            checked={previewData.duplicateRows.every((r) =>
                              selectedRows.includes(r.rowNumber)
                            )}
                            onChange={() => handleSelectAll(previewData.duplicateRows)}
                            className="rounded border-slate-300"
                          />
                        </th>
                        <th className="p-3 text-left">Fila</th>
                        <th className="p-3 text-left">Nombre</th>
                        <th className="p-3 text-left">Telefono</th>
                        <th className="p-3 text-left">Razon</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.duplicateRows.map((row) => (
                        <tr key={row.rowNumber} className="border-t border-slate-200 dark:border-slate-700">
                          <td className="p-3">
                            <input
                              type="checkbox"
                              checked={selectedRows.includes(row.rowNumber)}
                              onChange={() => handleRowToggle(row.rowNumber)}
                              className="rounded border-slate-300"
                            />
                          </td>
                          <td className="p-3 text-slate-500">{row.rowNumber}</td>
                          <td className="p-3 font-medium text-slate-800 dark:text-slate-200">{row.data.fullName}</td>
                          <td className="p-3 text-slate-600 dark:text-slate-400">{row.data.phoneNumber}</td>
                          <td className="p-3 text-amber-600">{row.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {activeTab === "errors" && previewData.errorRows.length > 0 && (
                  <table className="w-full text-sm">
                    <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0">
                      <tr>
                        <th className="p-3 text-left">Fila</th>
                        <th className="p-3 text-left">Nombre</th>
                        <th className="p-3 text-left">Telefono</th>
                        <th className="p-3 text-left">Errores</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.errorRows.map((row) => (
                        <tr key={row.rowNumber} className="border-t border-slate-200 dark:border-slate-700">
                          <td className="p-3 text-slate-500">{row.rowNumber}</td>
                          <td className="p-3 font-medium text-slate-800 dark:text-slate-200">{row.data.fullName || "-"}</td>
                          <td className="p-3 text-slate-600 dark:text-slate-400">{row.data.phoneNumber || "-"}</td>
                          <td className="p-3 text-red-600">{row.errors.join(", ")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {/* Empty states */}
                {activeTab === "valid" && previewData.validRows.length === 0 && (
                  <div className="p-8 text-center text-slate-500">
                    No hay filas validas para importar
                  </div>
                )}
                {activeTab === "duplicates" && previewData.duplicateRows.length === 0 && (
                  <div className="p-8 text-center text-slate-500">
                    No se encontraron duplicados
                  </div>
                )}
                {activeTab === "errors" && previewData.errorRows.length === 0 && (
                  <div className="p-8 text-center text-slate-500">
                    No hay errores en el archivo
                  </div>
                )}
              </div>

              {/* Info about duplicates */}
              {previewData.duplicateRows.length > 0 && (
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4">
                  <p className="text-sm text-amber-700 dark:text-amber-400 flex items-center gap-2">
                    <span className="material-icons-outlined text-lg">warning</span>
                    Los leads duplicados seleccionados se crearan con estado "Repetido"
                  </p>
                </div>
              )}
            </div>
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
                <p className="text-green-600 dark:text-green-400">
                  Asociados a la campana: {campaign.name}
                </p>
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
