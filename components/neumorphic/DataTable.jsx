"use client";
import React from "react";
import NeumorphicCard from "./NeumorphicCard";

/**
 * DataTable Component
 *
 * A table component with neumorphic design.
 * Features sortable columns, custom cell rendering, and row actions.
 *
 * @param {Object} props
 * @param {Array} props.columns - Column definitions: [{ key, label, sortable, render }]
 * @param {Array} props.data - Data array
 * @param {string} [props.className] - Additional CSS classes for container
 * @param {function} [props.onRowClick] - Row click handler
 * @param {function} [props.onSort] - Sort handler (receives column key and direction)
 * @param {Object} [props.sortConfig] - Current sort state: { key, direction: 'asc' | 'desc' }
 * @param {boolean} [props.striped=false] - Alternate row background colors
 * @param {boolean} [props.hoverable=true] - Row hover effect
 * @param {string} [props.emptyMessage='No hay datos disponibles'] - Message when no data
 */
export default function DataTable({
  columns = [],
  data = [],
  className = "",
  onRowClick,
  onSort,
  sortConfig,
  striped = false,
  hoverable = true,
  emptyMessage = "No hay datos disponibles",
  ...props
}) {
  // Handle column header click for sorting
  const handleHeaderClick = (column) => {
    if (!column.sortable || !onSort) return;

    const direction =
      sortConfig?.key === column.key && sortConfig?.direction === "asc"
        ? "desc"
        : "asc";

    onSort(column.key, direction);
  };

  // Get sort icon for column
  const getSortIcon = (column) => {
    if (!column.sortable) return null;

    if (sortConfig?.key !== column.key) {
      return "unfold_more";
    }

    return sortConfig.direction === "asc" ? "arrow_upward" : "arrow_downward";
  };

  return (
    <NeumorphicCard className={className} size="md" {...props}>
      <div className="overflow-x-auto">
        <table className="w-full">
          {/* Table Head */}
          <thead>
            <tr className="table-row-divider">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`
                    px-4 py-3 text-left text-sm font-semibold
                    text-slate-700 dark:text-slate-300
                    ${column.sortable ? "cursor-pointer hover:text-primary transition-colors" : ""}
                    ${column.align === "center" ? "text-center" : ""}
                    ${column.align === "right" ? "text-right" : ""}
                  `}
                  onClick={() => handleHeaderClick(column)}
                >
                  <div className="flex items-center gap-2">
                    <span>{column.label}</span>
                    {column.sortable && (
                      <span className="material-icons-outlined text-base">
                        {getSortIcon(column)}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-slate-500 dark:text-slate-400"
                >
                  <div className="flex flex-col items-center gap-2">
                    <span className="material-icons-outlined text-4xl opacity-30">
                      inbox
                    </span>
                    <span>{emptyMessage}</span>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <tr
                  key={row.id || rowIndex}
                  className={`
                    table-row-divider
                    ${striped && rowIndex % 2 === 1 ? "bg-slate-50 dark:bg-slate-800 bg-opacity-30" : ""}
                    ${hoverable ? "hover:bg-slate-50 dark:hover:bg-slate-800 hover:bg-opacity-50 transition-colors" : ""}
                    ${onRowClick ? "cursor-pointer" : ""}
                  `}
                  onClick={() => onRowClick && onRowClick(row)}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`
                        px-4 py-4 text-sm text-slate-600 dark:text-slate-400
                        ${column.align === "center" ? "text-center" : ""}
                        ${column.align === "right" ? "text-right" : ""}
                      `}
                    >
                      {column.render
                        ? column.render(row[column.key], row, rowIndex)
                        : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </NeumorphicCard>
  );
}
