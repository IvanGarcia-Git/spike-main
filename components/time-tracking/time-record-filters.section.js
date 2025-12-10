"use client";
import { useState, useEffect } from "react";
import { getCookie } from "cookies-next";
import { authGetFetch } from "@/helpers/server-fetch.helper";

export default function TimeRecordFilters({
  filters,
  onFilterChange,
  isManager = false,
}) {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (isManager) {
      fetchUsers();
    }
  }, [isManager]);

  const fetchUsers = async () => {
    const jwtToken = getCookie("factura-token");
    try {
      const response = await authGetFetch("users", jwtToken);
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleDateChange = (field, value) => {
    onFilterChange({
      ...filters,
      [field]: value,
    });
  };

  const handleUserChange = (value) => {
    onFilterChange({
      ...filters,
      userId: value,
    });
  };

  // Set default date range (last 30 days)
  useEffect(() => {
    if (!filters.startDate && !filters.endDate) {
      const today = new Date();
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(today.getDate() - 30);

      onFilterChange({
        ...filters,
        startDate: thirtyDaysAgo.toISOString().split("T")[0],
        endDate: today.toISOString().split("T")[0],
      });
    }
  }, []);

  return (
    <div className="neumorphic-card p-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* Start Date */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Fecha Inicio
          </label>
          <input
            type="date"
            value={filters.startDate || ""}
            onChange={(e) => handleDateChange("startDate", e.target.value)}
            className="w-full px-3 py-2 neumorphic-card-inset rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* End Date */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Fecha Fin
          </label>
          <input
            type="date"
            value={filters.endDate || ""}
            onChange={(e) => handleDateChange("endDate", e.target.value)}
            className="w-full px-3 py-2 neumorphic-card-inset rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* User Filter (Managers only) */}
        {isManager && (
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Usuario
            </label>
            <select
              value={filters.userId || ""}
              onChange={(e) => handleUserChange(e.target.value)}
              className="w-full px-3 py-2 neumorphic-card-inset rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Mis registros</option>
              <option value="all">Todos los usuarios</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} {user.firstSurname}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Quick Filters */}
        <div className="flex items-end gap-2">
          <button
            onClick={() => {
              const today = new Date();
              onFilterChange({
                ...filters,
                startDate: today.toISOString().split("T")[0],
                endDate: today.toISOString().split("T")[0],
              });
            }}
            className="px-3 py-2 neumorphic-button rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:text-primary"
          >
            Hoy
          </button>
          <button
            onClick={() => {
              const today = new Date();
              const weekAgo = new Date(today);
              weekAgo.setDate(today.getDate() - 7);
              onFilterChange({
                ...filters,
                startDate: weekAgo.toISOString().split("T")[0],
                endDate: today.toISOString().split("T")[0],
              });
            }}
            className="px-3 py-2 neumorphic-button rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:text-primary"
          >
            7 dias
          </button>
          <button
            onClick={() => {
              const today = new Date();
              const monthAgo = new Date(today);
              monthAgo.setDate(today.getDate() - 30);
              onFilterChange({
                ...filters,
                startDate: monthAgo.toISOString().split("T")[0],
                endDate: today.toISOString().split("T")[0],
              });
            }}
            className="px-3 py-2 neumorphic-button rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:text-primary"
          >
            30 dias
          </button>
        </div>
      </div>
    </div>
  );
}
