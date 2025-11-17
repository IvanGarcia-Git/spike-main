"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/page-header.component";

export default function Perfil() {
  const [activeTab, setActiveTab] = useState("info-personal");
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [ausencias, setAusencias] = useState([]);
  const [nominas, setNominas] = useState([]);

  // Modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    fetchPerfilData();
  }, []);

  const fetchPerfilData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/perfil");
      const data = await response.json();

      if (response.ok) {
        setUserData(data.usuario || {});
        setAusencias(data.ausencias || []);
        setNominas(data.nominas || []);
      }
    } catch (error) {
      console.error("Error fetching perfil data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfile = () => {
    setEditForm({
      nombre: userData.nombre,
      telefono: userData.telefono,
      correo: userData.correo,
      numeroCuenta: userData.numeroCuenta,
    });
    setShowEditModal(true);
  };

  const handleSaveProfile = async () => {
    try {
      const response = await fetch("/api/perfil", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      if (response.ok) {
        const updatedData = await response.json();
        setUserData({ ...userData, ...updatedData });
        setShowEditModal(false);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Error al actualizar el perfil");
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado.toLowerCase()) {
      case "aprobada":
      case "pagada":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "pendiente":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "rechazada":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200";
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatCurrency = (amount) => {
    return `€${parseFloat(amount).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (loading) {
    return (
      <div className="p-6">
        <PageHeader title="Perfil" />
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-500">Cargando perfil...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <PageHeader title="Perfil" />

      <div className="grid grid-cols-12 gap-6">
        {/* Left Column - Profile Picture and Navigation */}
        <div className="col-span-12 lg:col-span-4 flex flex-col items-center">
          {/* Profile Picture */}
          <div className="neumorphic-card rounded-full p-2 mb-4">
            <div className="w-32 h-32 rounded-full neumorphic-card-inset flex items-center justify-center overflow-hidden">
              {userData?.avatar ? (
                <img src={userData.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="material-icons-outlined text-7xl text-slate-400">
                  person
                </span>
              )}
            </div>
          </div>

          {/* User Name and Role */}
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            {userData?.nombre || "Usuario"}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
            {userData?.rol || "Agente"}
          </p>
          <p className="text-xs text-slate-400 mb-8">
            @{userData?.usuario || "usuario"}
          </p>

          {/* Edit Button */}
          <button
            onClick={handleEditProfile}
            className="mb-8 neumorphic-button px-6 py-2 rounded-lg text-primary font-semibold hover:bg-primary/10 transition-colors"
          >
            <span className="material-icons-outlined text-sm mr-2 align-middle">edit</span>
            Editar Perfil
          </button>

          {/* Navigation Tabs */}
          <div className="w-full space-y-3">
            <button
              onClick={() => setActiveTab("info-personal")}
              className={`w-full neumorphic-card p-4 text-center font-medium cursor-pointer transition-all ${
                activeTab === "info-personal"
                  ? "shadow-neumorphic-inset-light dark:shadow-neumorphic-inset-dark text-primary"
                  : "text-slate-600 dark:text-slate-400 hover:shadow-md"
              }`}
            >
              Inform. personal
            </button>
            <button
              onClick={() => setActiveTab("ausencias")}
              className={`w-full neumorphic-card p-4 text-center font-medium cursor-pointer transition-all ${
                activeTab === "ausencias"
                  ? "shadow-neumorphic-inset-light dark:shadow-neumorphic-inset-dark text-primary"
                  : "text-slate-600 dark:text-slate-400 hover:shadow-md"
              }`}
            >
              Ausencias
            </button>
            <button
              onClick={() => setActiveTab("nominas")}
              className={`w-full neumorphic-card p-4 text-center font-medium cursor-pointer transition-all ${
                activeTab === "nominas"
                  ? "shadow-neumorphic-inset-light dark:shadow-neumorphic-inset-dark text-primary"
                  : "text-slate-600 dark:text-slate-400 hover:shadow-md"
              }`}
            >
              Nóminas
            </button>
          </div>
        </div>

        {/* Right Column - Content */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          {/* Personal Information Tab */}
          {activeTab === "info-personal" && (
            <>
              {/* Personal Information Card */}
              <div className="neumorphic-card p-6">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">
                  Información Personal
                </h3>
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  <div>
                    <label className="text-xs text-slate-500 dark:text-slate-400">
                      Nombre
                    </label>
                    <p className="font-medium text-slate-800 dark:text-slate-200">
                      {userData?.nombre || "-"}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 dark:text-slate-400">
                      Usuario
                    </label>
                    <p className="font-medium text-slate-800 dark:text-slate-200">
                      {userData?.usuario || "-"}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 dark:text-slate-400">
                      Teléfono
                    </label>
                    <p className="font-medium text-slate-800 dark:text-slate-200">
                      {userData?.telefono || "-"}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 dark:text-slate-400">
                      Correo
                    </label>
                    <p className="font-medium text-slate-800 dark:text-slate-200">
                      {userData?.correo || "-"}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-slate-500 dark:text-slate-400">
                      Nº Cuenta
                    </label>
                    <p className="font-medium text-slate-800 dark:text-slate-200">
                      {userData?.numeroCuenta || "-"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Antigüedad Card */}
              <div className="neumorphic-card p-6">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">
                  Antigüedad en la empresa
                </h3>
                <p className="text-2xl font-bold text-primary">
                  {userData?.antiguedad || "0 días"}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Desde {userData?.fechaIngreso || "-"}
                </p>
              </div>

              {/* Turno and Horario Cards */}
              <div className="grid grid-cols-2 gap-6">
                <div className="neumorphic-card p-6">
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4">
                    Turno
                  </h3>
                  <div className="w-12 h-12 rounded-full neumorphic-card-inset flex items-center justify-center">
                    <span className="material-icons-outlined text-primary text-3xl">
                      {userData?.turno || "wb_sunny"}
                    </span>
                  </div>
                </div>
                <div className="neumorphic-card p-6">
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">
                    Horario
                  </h3>
                  <p className="text-lg font-medium text-slate-800 dark:text-slate-200">
                    {userData?.horario || "-"}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {userData?.horasSemana || "0h/sem"}
                  </p>
                </div>
              </div>
            </>
          )}

          {/* Ausencias Tab */}
          {activeTab === "ausencias" && (
            <div className="neumorphic-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                  Mis Ausencias
                </h3>
                <button className="neumorphic-button px-4 py-2 rounded-lg text-primary font-semibold hover:bg-primary/10">
                  <span className="material-icons-outlined text-sm mr-2 align-middle">add</span>
                  Solicitar Ausencia
                </button>
              </div>

              {ausencias.length === 0 ? (
                <div className="text-center py-8">
                  <span className="material-icons-outlined text-6xl text-slate-300 dark:text-slate-600 mb-4">
                    event_busy
                  </span>
                  <p className="text-slate-500 dark:text-slate-400">
                    No hay ausencias registradas
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {ausencias.map((ausencia) => (
                    <div
                      key={ausencia.id}
                      className="neumorphic-card-inset p-4 rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="font-semibold text-slate-800 dark:text-slate-200">
                              {ausencia.tipo}
                            </h4>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(
                                ausencia.estado
                              )}`}
                            >
                              {ausencia.estado}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                            {ausencia.motivo}
                          </p>
                          <div className="flex items-center space-x-4 text-xs text-slate-500 dark:text-slate-400">
                            <span>
                              <span className="material-icons-outlined text-sm align-middle mr-1">
                                calendar_today
                              </span>
                              {formatDate(ausencia.fechaInicio)} - {formatDate(ausencia.fechaFin)}
                            </span>
                            <span>
                              <span className="material-icons-outlined text-sm align-middle mr-1">
                                schedule
                              </span>
                              {ausencia.dias} {ausencia.dias === 1 ? "día" : "días"}
                            </span>
                          </div>
                        </div>
                        {ausencia.estado === "Pendiente" && (
                          <button className="text-slate-400 hover:text-red-500 transition-colors">
                            <span className="material-icons-outlined">close</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Resumen de Ausencias */}
              <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4">
                  Resumen Anual
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="neumorphic-card p-4 text-center">
                    <p className="text-2xl font-bold text-primary">
                      {ausencias.filter(a => a.estado === "Aprobada").reduce((sum, a) => sum + a.dias, 0)}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Días Usados</p>
                  </div>
                  <div className="neumorphic-card p-4 text-center">
                    <p className="text-2xl font-bold text-yellow-500">
                      {ausencias.filter(a => a.estado === "Pendiente").reduce((sum, a) => sum + a.dias, 0)}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Pendientes</p>
                  </div>
                  <div className="neumorphic-card p-4 text-center">
                    <p className="text-2xl font-bold text-green-500">
                      {22 - ausencias.filter(a => a.estado === "Aprobada").reduce((sum, a) => sum + a.dias, 0)}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Disponibles</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Nóminas Tab */}
          {activeTab === "nominas" && (
            <div className="neumorphic-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                  Mis Nóminas
                </h3>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    Año:
                  </span>
                  <select className="neumorphic-card-inset px-3 py-1 rounded-lg border-none text-sm bg-transparent text-slate-800 dark:text-slate-200">
                    <option>2025</option>
                    <option>2024</option>
                  </select>
                </div>
              </div>

              {nominas.length === 0 ? (
                <div className="text-center py-8">
                  <span className="material-icons-outlined text-6xl text-slate-300 dark:text-slate-600 mb-4">
                    receipt_long
                  </span>
                  <p className="text-slate-500 dark:text-slate-400">
                    No hay nóminas disponibles
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {nominas.map((nomina) => (
                    <div
                      key={nomina.id}
                      className="neumorphic-card-inset p-4 rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-lg neumorphic-card flex items-center justify-center">
                            <span className="material-icons-outlined text-primary">
                              description
                            </span>
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-800 dark:text-slate-200">
                              {nomina.mes}
                            </h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {nomina.periodo}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(
                            nomina.estado
                          )}`}
                        >
                          {nomina.estado}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                            Salario Bruto
                          </p>
                          <p className="font-semibold text-slate-800 dark:text-slate-200">
                            {formatCurrency(nomina.salarioBruto)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                            Deducciones
                          </p>
                          <p className="font-semibold text-red-600">
                            -{formatCurrency(nomina.deducciones)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                            Salario Neto
                          </p>
                          <p className="font-bold text-green-600">
                            {formatCurrency(nomina.salarioNeto)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Fecha de pago: {formatDate(nomina.fecha)}
                        </p>
                        <button className="neumorphic-button px-3 py-1 rounded-lg text-xs text-primary font-semibold hover:bg-primary/10">
                          <span className="material-icons-outlined text-sm mr-1 align-middle">
                            download
                          </span>
                          Descargar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Resumen Anual */}
              {nominas.length > 0 && (
                <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                  <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4">
                    Resumen Anual 2025
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="neumorphic-card p-4">
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                        Total Bruto
                      </p>
                      <p className="text-xl font-bold text-slate-800 dark:text-slate-200">
                        {formatCurrency(
                          nominas.reduce((sum, n) => sum + parseFloat(n.salarioBruto), 0)
                        )}
                      </p>
                    </div>
                    <div className="neumorphic-card p-4">
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                        Total Deducciones
                      </p>
                      <p className="text-xl font-bold text-red-600">
                        {formatCurrency(
                          nominas.reduce((sum, n) => sum + parseFloat(n.deducciones), 0)
                        )}
                      </p>
                    </div>
                    <div className="neumorphic-card p-4">
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                        Total Neto
                      </p>
                      <p className="text-xl font-bold text-green-600">
                        {formatCurrency(
                          nominas.reduce((sum, n) => sum + parseFloat(n.salarioNeto), 0)
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="neumorphic-card p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                Editar Perfil
              </h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              >
                <span className="material-icons-outlined">close</span>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Nombre
                </label>
                <input
                  type="text"
                  value={editForm.nombre || ""}
                  onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
                  className="neumorphic-card-inset w-full px-4 py-2 rounded-lg border-none focus:ring-2 focus:ring-primary bg-transparent text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Teléfono
                </label>
                <input
                  type="text"
                  value={editForm.telefono || ""}
                  onChange={(e) => setEditForm({ ...editForm, telefono: e.target.value })}
                  className="neumorphic-card-inset w-full px-4 py-2 rounded-lg border-none focus:ring-2 focus:ring-primary bg-transparent text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Correo
                </label>
                <input
                  type="email"
                  value={editForm.correo || ""}
                  onChange={(e) => setEditForm({ ...editForm, correo: e.target.value })}
                  className="neumorphic-card-inset w-full px-4 py-2 rounded-lg border-none focus:ring-2 focus:ring-primary bg-transparent text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Nº Cuenta
                </label>
                <input
                  type="text"
                  value={editForm.numeroCuenta || ""}
                  onChange={(e) => setEditForm({ ...editForm, numeroCuenta: e.target.value })}
                  className="neumorphic-card-inset w-full px-4 py-2 rounded-lg border-none focus:ring-2 focus:ring-primary bg-transparent text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleSaveProfile}
                className="flex-1 neumorphic-button px-6 py-3 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90"
              >
                Guardar Cambios
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 neumorphic-button px-6 py-3 rounded-lg text-slate-600 dark:text-slate-400 font-semibold"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
