"use client";
import { useState } from "react";

export default function ImportLeadsPreview({
  data,
  selectedRows,
  onRowToggle,
  onSelectAll,
}) {
  const [activeTab, setActiveTab] = useState("valid");

  const { validRows, errorRows, duplicateRows, summary } = data;

  const tabs = [
    {
      id: "valid",
      label: "Válidos",
      count: summary.valid,
      icon: "check_circle",
      color: "text-green-600",
    },
    {
      id: "errors",
      label: "Errores",
      count: summary.errors,
      icon: "error",
      color: "text-red-600",
    },
    {
      id: "duplicates",
      label: "Duplicados",
      count: summary.duplicates,
      icon: "content_copy",
      color: "text-yellow-600",
    },
  ];

  const renderTable = (rows, type) => {
    if (rows.length === 0) {
      return (
        <div className="text-center py-8 text-slate-500">
          No hay filas en esta categoría
        </div>
      );
    }

    const isSelectable = type === "valid" || type === "duplicates";

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700">
              {isSelectable && (
                <th className="px-3 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={rows.every((r) =>
                      selectedRows.includes(type === "duplicates" ? r.rowNumber : r.rowNumber)
                    )}
                    onChange={() => onSelectAll(type === "duplicates" ? rows : rows)}
                    className="rounded border-slate-300"
                  />
                </th>
              )}
              <th className="px-3 py-3 text-left font-medium text-slate-600 dark:text-slate-400">
                Fila
              </th>
              <th className="px-3 py-3 text-left font-medium text-slate-600 dark:text-slate-400">
                Nombre
              </th>
              <th className="px-3 py-3 text-left font-medium text-slate-600 dark:text-slate-400">
                Email
              </th>
              <th className="px-3 py-3 text-left font-medium text-slate-600 dark:text-slate-400">
                Teléfono
              </th>
              <th className="px-3 py-3 text-left font-medium text-slate-600 dark:text-slate-400">
                Campaña
              </th>
              {type === "errors" && (
                <th className="px-3 py-3 text-left font-medium text-slate-600 dark:text-slate-400">
                  Errores
                </th>
              )}
              {type === "duplicates" && (
                <th className="px-3 py-3 text-left font-medium text-slate-600 dark:text-slate-400">
                  Motivo
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const rowData = type === "errors" ? row.data : type === "duplicates" ? row.data : row;
              const rowNumber = type === "errors" ? row.rowNumber : row.rowNumber;
              const isSelected = selectedRows.includes(rowNumber);

              return (
                <tr
                  key={rowNumber}
                  className={`border-b border-slate-100 dark:border-slate-800 ${
                    type === "valid"
                      ? "bg-green-50/50 dark:bg-green-900/10"
                      : type === "errors"
                      ? "bg-red-50/50 dark:bg-red-900/10"
                      : "bg-yellow-50/50 dark:bg-yellow-900/10"
                  }`}
                >
                  {isSelectable && (
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onRowToggle(rowNumber)}
                        className="rounded border-slate-300"
                      />
                    </td>
                  )}
                  <td className="px-3 py-3 font-mono text-slate-600 dark:text-slate-400">
                    {rowNumber}
                  </td>
                  <td className="px-3 py-3 text-slate-800 dark:text-slate-200">
                    {rowData.fullName || "-"}
                  </td>
                  <td className="px-3 py-3 text-slate-600 dark:text-slate-400">
                    {rowData.email || "-"}
                  </td>
                  <td className="px-3 py-3 text-slate-600 dark:text-slate-400">
                    {rowData.phoneNumber || "-"}
                  </td>
                  <td className="px-3 py-3 text-slate-600 dark:text-slate-400">
                    {rowData.campaignName || "-"}
                  </td>
                  {type === "errors" && (
                    <td className="px-3 py-3">
                      <ul className="text-red-600 dark:text-red-400 text-xs space-y-1">
                        {row.errors.map((err, i) => (
                          <li key={i} className="flex items-start gap-1">
                            <span className="material-icons-outlined text-xs mt-0.5">
                              close
                            </span>
                            {err}
                          </li>
                        ))}
                      </ul>
                    </td>
                  )}
                  {type === "duplicates" && (
                    <td className="px-3 py-3 text-yellow-700 dark:text-yellow-400 text-xs">
                      {row.reason}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-4 gap-4">
        <div className="neumorphic-card p-4 text-center">
          <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            {summary.total}
          </div>
          <div className="text-sm text-slate-500">Total filas</div>
        </div>
        <div className="neumorphic-card p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{summary.valid}</div>
          <div className="text-sm text-slate-500">Válidos</div>
        </div>
        <div className="neumorphic-card p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{summary.errors}</div>
          <div className="text-sm text-slate-500">Errores</div>
        </div>
        <div className="neumorphic-card p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">
            {summary.duplicates}
          </div>
          <div className="text-sm text-slate-500">Duplicados</div>
        </div>
      </div>

      {/* Info about duplicates */}
      {summary.duplicates > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 text-sm text-yellow-700 dark:text-yellow-400 flex items-start gap-2">
          <span className="material-icons-outlined text-lg">info</span>
          <span>
            Los leads duplicados se crearán con estado "Repetido". Puedes
            deseleccionarlos si no deseas importarlos.
          </span>
        </div>
      )}

      {/* Selection info */}
      <div className="text-sm text-slate-600 dark:text-slate-400">
        <span className="font-medium">{selectedRows.length}</span> filas
        seleccionadas para importar
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? `${tab.color} border-current`
                : "text-slate-500 border-transparent hover:text-slate-700"
            }`}
          >
            <span className={`material-icons-outlined text-lg ${tab.color}`}>
              {tab.icon}
            </span>
            {tab.label}
            <span
              className={`px-2 py-0.5 rounded-full text-xs ${
                activeTab === tab.id
                  ? "bg-slate-200 dark:bg-slate-700"
                  : "bg-slate-100 dark:bg-slate-800"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Table content */}
      <div className="max-h-60 overflow-auto">
        {activeTab === "valid" && renderTable(validRows, "valid")}
        {activeTab === "errors" && renderTable(errorRows, "errors")}
        {activeTab === "duplicates" && renderTable(duplicateRows, "duplicates")}
      </div>
    </div>
  );
}
