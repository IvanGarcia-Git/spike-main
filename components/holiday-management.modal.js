"use client";
import React, { useState, useEffect } from "react";
import { authGetFetch, authFetch } from "@/helpers/server-fetch.helper";
import { getCookie } from "cookies-next";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "react-toastify";

const HolidayScope = {
  GLOBAL: "global",
  GROUP: "group",
  USER: "user",
};

const ScopeLabels = {
  [HolidayScope.GLOBAL]: "Global (todos)",
  [HolidayScope.GROUP]: "Oficina/Grupo",
  [HolidayScope.USER]: "Usuario",
};

export default function HolidayManagementModal({ isOpen, onClose, onHolidayChange }) {
  const [holidays, setHolidays] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState(null);
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    date: "",
    scope: HolidayScope.GLOBAL,
    userId: "",
    groupId: "",
  });

  const jwtToken = getCookie("factura-token");

  const fetchHolidays = async () => {
    setIsLoading(true);
    try {
      const response = await authGetFetch("holidays", jwtToken);
      if (response.ok) {
        const data = await response.json();
        // Filter only custom holidays (exclude external ones that don't have uuid)
        const customHolidays = data.filter((h) => h.uuid);
        setHolidays(customHolidays);
      }
    } catch (error) {
      console.error("Error fetching holidays:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
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

  const fetchGroups = async () => {
    try {
      const response = await authGetFetch("groups", jwtToken);
      if (response.ok) {
        const data = await response.json();
        setGroups(data);
      }
    } catch (error) {
      console.error("Error fetching groups:", error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchHolidays();
      fetchUsers();
      fetchGroups();
    }
  }, [isOpen]);

  const resetForm = () => {
    setFormData({
      name: "",
      date: "",
      scope: HolidayScope.GLOBAL,
      userId: "",
      groupId: "",
    });
    setEditingHoliday(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.date) {
      toast.error("Nombre y fecha son requeridos");
      return;
    }

    if (formData.scope === HolidayScope.USER && !formData.userId) {
      toast.error("Debes seleccionar un usuario");
      return;
    }

    if (formData.scope === HolidayScope.GROUP && !formData.groupId) {
      toast.error("Debes seleccionar un grupo");
      return;
    }

    const payload = {
      name: formData.name,
      date: formData.date,
      scope: formData.scope,
      userId: formData.scope === HolidayScope.USER ? Number(formData.userId) : null,
      groupId: formData.scope === HolidayScope.GROUP ? Number(formData.groupId) : null,
    };

    try {
      let response;
      if (editingHoliday) {
        response = await authFetch("PATCH", `holidays/${editingHoliday.uuid}`, payload, jwtToken);
      } else {
        response = await authFetch("POST", "holidays", payload, jwtToken);
      }

      if (response.ok) {
        toast.success(editingHoliday ? "Festivo actualizado" : "Festivo creado");
        resetForm();
        fetchHolidays();
        if (onHolidayChange) onHolidayChange();
      } else {
        const error = await response.json();
        toast.error(error.message || "Error al guardar el festivo");
      }
    } catch (error) {
      console.error("Error saving holiday:", error);
      toast.error("Error al guardar el festivo");
    }
  };

  const handleEdit = (holiday) => {
    setFormData({
      name: holiday.name,
      date: holiday.date,
      scope: holiday.scope || HolidayScope.GLOBAL,
      userId: holiday.userId || "",
      groupId: holiday.groupId || "",
    });
    setEditingHoliday(holiday);
    setShowForm(true);
  };

  const handleDelete = async (holiday) => {
    if (!confirm(`¿Eliminar el festivo "${holiday.name}"?`)) return;

    try {
      const response = await authFetch("DELETE", `holidays/${holiday.uuid}`, {}, jwtToken);
      if (response.ok || response.status === 204) {
        toast.success("Festivo eliminado");
        fetchHolidays();
        if (onHolidayChange) onHolidayChange();
      } else {
        toast.error("Error al eliminar el festivo");
      }
    } catch (error) {
      console.error("Error deleting holiday:", error);
      toast.error("Error al eliminar el festivo");
    }
  };

  const getScopeDisplay = (holiday) => {
    if (holiday.scope === HolidayScope.USER && holiday.user) {
      return `Usuario: ${holiday.user.name || holiday.user.email}`;
    }
    if (holiday.scope === HolidayScope.GROUP && holiday.group) {
      return `Grupo: ${holiday.group.name}`;
    }
    return ScopeLabels[holiday.scope] || "Global";
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 backdrop-blur-sm">
      <div className="neumorphic-card w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200">
            Gestionar Festivos
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-md neumorphic-button text-slate-600 dark:text-slate-300"
          >
            <span className="material-icons-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Add/Edit Form Toggle */}
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="w-full mb-4 p-3 neumorphic-button flex items-center justify-center space-x-2 text-primary"
            >
              <span className="material-icons-outlined">add</span>
              <span>Añadir Festivo</span>
            </button>
          ) : (
            <form onSubmit={handleSubmit} className="mb-4 p-4 neumorphic-card-inset rounded-lg space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-medium text-slate-700 dark:text-slate-200">
                  {editingHoliday ? "Editar Festivo" : "Nuevo Festivo"}
                </h3>
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  <span className="material-icons-outlined text-base">close</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 neumorphic-card-inset rounded-lg text-slate-700 dark:text-slate-200"
                    placeholder="Ej: Navidad"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Fecha *
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 neumorphic-card-inset rounded-lg text-slate-700 dark:text-slate-200"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Ámbito
                  </label>
                  <select
                    value={formData.scope}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        scope: e.target.value,
                        userId: "",
                        groupId: "",
                      })
                    }
                    className="w-full px-3 py-2 neumorphic-card-inset rounded-lg text-slate-700 dark:text-slate-200"
                  >
                    <option value={HolidayScope.GLOBAL}>Global (todos)</option>
                    <option value={HolidayScope.GROUP}>Por oficina/grupo</option>
                    <option value={HolidayScope.USER}>Por usuario</option>
                  </select>
                </div>

                {formData.scope === HolidayScope.GROUP && (
                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Grupo *
                    </label>
                    <select
                      value={formData.groupId}
                      onChange={(e) => setFormData({ ...formData, groupId: e.target.value })}
                      className="w-full px-3 py-2 neumorphic-card-inset rounded-lg text-slate-700 dark:text-slate-200"
                      required
                    >
                      <option value="">Selecciona un grupo</option>
                      {groups.map((group) => (
                        <option key={group.id} value={group.id}>
                          {group.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {formData.scope === HolidayScope.USER && (
                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Usuario *
                    </label>
                    <select
                      value={formData.userId}
                      onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                      className="w-full px-3 py-2 neumorphic-card-inset rounded-lg text-slate-700 dark:text-slate-200"
                      required
                    >
                      <option value="">Selecciona un usuario</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name} {user.firstSurname} ({user.email})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 neumorphic-button text-slate-600 dark:text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 neumorphic-button text-primary font-medium"
                >
                  {editingHoliday ? "Actualizar" : "Crear"}
                </button>
              </div>
            </form>
          )}

          {/* Holidays List */}
          <div className="space-y-2">
            <h3 className="font-medium text-slate-700 dark:text-slate-200 mb-3">
              Festivos Personalizados
            </h3>

            {isLoading ? (
              <div className="text-center py-8 text-slate-500">Cargando...</div>
            ) : holidays.length === 0 ? (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                No hay festivos personalizados
              </div>
            ) : (
              holidays.map((holiday) => (
                <div
                  key={holiday.uuid}
                  className="flex items-center justify-between p-3 neumorphic-card-inset rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <span className="text-red-500 dark:text-red-400">
                        <span className="material-icons-outlined text-base">event</span>
                      </span>
                      <div>
                        <h4 className="font-medium text-slate-700 dark:text-slate-200">
                          {holiday.name}
                        </h4>
                        <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
                          <span>
                            {format(parseISO(holiday.date), "dd MMM yyyy", { locale: es })}
                          </span>
                          <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 rounded">
                            {getScopeDisplay(holiday)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEdit(holiday)}
                      className="p-2 neumorphic-button text-slate-600 dark:text-slate-300 hover:text-primary"
                      title="Editar"
                    >
                      <span className="material-icons-outlined text-base">edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(holiday)}
                      className="p-2 neumorphic-button text-slate-600 dark:text-slate-300 hover:text-red-500"
                      title="Eliminar"
                    >
                      <span className="material-icons-outlined text-base">delete</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
