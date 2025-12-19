"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { getCookie } from "cookies-next";
import * as jose from "jose";
import { authGetFetch, authFetch } from "@/helpers/server-fetch.helper";
import { FiArrowLeft, FiUpload, FiDownload, FiTrash2, FiEdit2, FiPlus, FiX, FiCheck, FiCalendar, FiFileText } from "react-icons/fi";

// Enums matching backend
const AbsenceType = {
  vacaciones: "Vacaciones",
  asuntos_propios: "Asuntos Propios",
  baja_medica: "Baja Médica",
  otro: "Otro"
};

const AbsenceStatus = {
  pendiente: "Pendiente",
  aprobada: "Aprobada",
  rechazada: "Rechazada"
};

const PayrollState = {
  pendiente: "Pendiente",
  pagada: "Pagada"
};

export default function AdminUserProfile() {
  const params = useParams();
  const router = useRouter();
  const { uuid } = params;

  // Auth & permissions
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // User data
  const [userData, setUserData] = useState(null);

  // Payrolls
  const [payrolls, setPayrolls] = useState([]);
  const [loadingPayrolls, setLoadingPayrolls] = useState(false);
  const [showPayrollModal, setShowPayrollModal] = useState(false);
  const [payrollForm, setPayrollForm] = useState({ qty: "", date: "", state: "pendiente" });
  const [editingPayroll, setEditingPayroll] = useState(null);

  // Absences
  const [absences, setAbsences] = useState([]);
  const [loadingAbsences, setLoadingAbsences] = useState(false);
  const [showAbsenceModal, setShowAbsenceModal] = useState(false);
  const [absenceForm, setAbsenceForm] = useState({
    startDate: "",
    endDate: "",
    type: "vacaciones",
    description: "",
    status: "pendiente"
  });
  const [editingAbsence, setEditingAbsence] = useState(null);

  // Tab state
  const [activeTab, setActiveTab] = useState("nominas");

  // Check admin permissions on mount
  useEffect(() => {
    const checkPermissions = () => {
      const token = getCookie("factura-token");
      if (!token) {
        router.push("/");
        return;
      }

      try {
        const payload = jose.decodeJwt(token);
        if (payload.groupId !== 1) {
          // Not admin, redirect
          setError("No tienes permisos para acceder a esta página");
          setTimeout(() => router.push("/usuarios"), 2000);
          return;
        }
        setIsAdmin(true);
      } catch (e) {
        console.error("Error decoding token:", e);
        router.push("/");
      }
    };

    checkPermissions();
  }, [router]);

  // Fetch user data
  useEffect(() => {
    if (!isAdmin || !uuid) return;

    const fetchUserData = async () => {
      setLoading(true);
      const token = getCookie("factura-token");

      try {
        const response = await authGetFetch(`users/by/${uuid}`, token);
        if (response.ok) {
          const data = await response.json();
          setUserData(data);
          // Now fetch payrolls and absences
          fetchPayrolls(data.id);
          fetchAbsences(data.id);
        } else {
          setError("No se encontró el usuario");
        }
      } catch (e) {
        console.error("Error fetching user:", e);
        setError("Error al cargar los datos del usuario");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [isAdmin, uuid]);

  // Fetch payrolls
  const fetchPayrolls = async (userId) => {
    if (!userId) return;
    setLoadingPayrolls(true);
    const token = getCookie("factura-token");

    try {
      const response = await authGetFetch(`payrolls/${userId}`, token);
      if (response.ok) {
        const data = await response.json();
        setPayrolls(data);
      }
    } catch (e) {
      console.error("Error fetching payrolls:", e);
    } finally {
      setLoadingPayrolls(false);
    }
  };

  // Fetch absences
  const fetchAbsences = async (userId) => {
    if (!userId) return;
    setLoadingAbsences(true);
    const token = getCookie("factura-token");

    try {
      const response = await authGetFetch(`absences/user/${userId}`, token);
      if (response.ok) {
        const data = await response.json();
        setAbsences(data);
      }
    } catch (e) {
      console.error("Error fetching absences:", e);
    } finally {
      setLoadingAbsences(false);
    }
  };

  // Payroll CRUD
  const handleCreatePayroll = async () => {
    if (!payrollForm.qty || !payrollForm.date) {
      alert("Por favor completa todos los campos obligatorios");
      return;
    }

    const token = getCookie("factura-token");
    try {
      const response = await authFetch("POST", "payrolls/", {
        userId: userData.id,
        qty: parseFloat(payrollForm.qty),
        date: payrollForm.date,
        state: payrollForm.state
      }, token);

      if (response.ok) {
        setShowPayrollModal(false);
        setPayrollForm({ qty: "", date: "", state: "pendiente" });
        fetchPayrolls(userData.id);
      } else {
        const err = await response.json();
        alert(err.message || "Error al crear la nómina");
      }
    } catch (e) {
      console.error("Error creating payroll:", e);
      alert("Error al crear la nómina");
    }
  };

  const handleUpdatePayroll = async () => {
    if (!editingPayroll) return;

    const token = getCookie("factura-token");
    try {
      const response = await authFetch("PATCH", `payrolls/${editingPayroll.uuid}`, {
        qty: parseFloat(payrollForm.qty),
        date: payrollForm.date,
        state: payrollForm.state
      }, token);

      if (response.ok) {
        setShowPayrollModal(false);
        setEditingPayroll(null);
        setPayrollForm({ qty: "", date: "", state: "pendiente" });
        fetchPayrolls(userData.id);
      } else {
        const err = await response.json();
        alert(err.message || "Error al actualizar la nómina");
      }
    } catch (e) {
      console.error("Error updating payroll:", e);
      alert("Error al actualizar la nómina");
    }
  };

  const handleDeletePayroll = async (payrollUuid) => {
    if (!confirm("¿Estás seguro de eliminar esta nómina?")) return;

    const token = getCookie("factura-token");
    try {
      const response = await authFetch("DELETE", `payrolls/${payrollUuid}`, {}, token);
      if (response.ok || response.status === 204) {
        fetchPayrolls(userData.id);
      } else {
        alert("Error al eliminar la nómina");
      }
    } catch (e) {
      console.error("Error deleting payroll:", e);
      alert("Error al eliminar la nómina");
    }
  };

  const openEditPayroll = (payroll) => {
    setEditingPayroll(payroll);
    setPayrollForm({
      qty: payroll.qty.toString(),
      date: payroll.date,
      state: payroll.state
    });
    setShowPayrollModal(true);
  };

  // Absence CRUD
  const handleCreateAbsence = async () => {
    if (!absenceForm.startDate || !absenceForm.endDate || !absenceForm.type) {
      alert("Por favor completa todos los campos obligatorios");
      return;
    }

    const token = getCookie("factura-token");
    try {
      const response = await authFetch("POST", "absences/", {
        userId: userData.id,
        startDate: absenceForm.startDate,
        endDate: absenceForm.endDate,
        type: absenceForm.type,
        description: absenceForm.description,
        status: absenceForm.status
      }, token);

      if (response.ok) {
        setShowAbsenceModal(false);
        setAbsenceForm({ startDate: "", endDate: "", type: "vacaciones", description: "", status: "pendiente" });
        fetchAbsences(userData.id);
      } else {
        const err = await response.json();
        alert(err.message || "Error al crear la ausencia");
      }
    } catch (e) {
      console.error("Error creating absence:", e);
      alert("Error al crear la ausencia");
    }
  };

  const handleUpdateAbsence = async () => {
    if (!editingAbsence) return;

    const token = getCookie("factura-token");
    try {
      const response = await authFetch("PATCH", `absences/${editingAbsence.uuid}`, {
        startDate: absenceForm.startDate,
        endDate: absenceForm.endDate,
        type: absenceForm.type,
        description: absenceForm.description,
        status: absenceForm.status
      }, token);

      if (response.ok) {
        setShowAbsenceModal(false);
        setEditingAbsence(null);
        setAbsenceForm({ startDate: "", endDate: "", type: "vacaciones", description: "", status: "pendiente" });
        fetchAbsences(userData.id);
      } else {
        const err = await response.json();
        alert(err.message || "Error al actualizar la ausencia");
      }
    } catch (e) {
      console.error("Error updating absence:", e);
      alert("Error al actualizar la ausencia");
    }
  };

  const handleDeleteAbsence = async (absenceUuid) => {
    if (!confirm("¿Estás seguro de eliminar esta ausencia?")) return;

    const token = getCookie("factura-token");
    try {
      const response = await authFetch("DELETE", `absences/${absenceUuid}`, {}, token);
      if (response.ok || response.status === 204) {
        fetchAbsences(userData.id);
      } else {
        alert("Error al eliminar la ausencia");
      }
    } catch (e) {
      console.error("Error deleting absence:", e);
      alert("Error al eliminar la ausencia");
    }
  };

  const openEditAbsence = (absence) => {
    setEditingAbsence(absence);
    setAbsenceForm({
      startDate: absence.startDate,
      endDate: absence.endDate,
      type: absence.type,
      description: absence.description || "",
      status: absence.status
    });
    setShowAbsenceModal(true);
  };

  // Calculate days between dates
  const calculateDays = (start, end) => {
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate - startDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR"
    }).format(amount);
  };

  // Status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case "aprobada":
      case "pagada":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "rechazada":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      case "pendiente":
      default:
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="neumorphic-card p-8 text-center">
          <span className="material-icons-outlined text-6xl text-red-500 mb-4">error</span>
          <p className="text-lg text-slate-700 dark:text-slate-300">{error}</p>
          <button
            onClick={() => router.push("/usuarios")}
            className="mt-4 px-6 py-2 rounded-lg neumorphic-button text-primary"
          >
            Volver a usuarios
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="neumorphic-card p-6">
        <button
          onClick={() => router.push("/usuarios")}
          className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-primary mb-4 transition-colors"
        >
          <FiArrowLeft />
          <span>Volver a usuarios</span>
        </button>

        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full neumorphic-card p-1">
            <img
              src={userData?.imageUri || "/avatar.png"}
              alt={userData?.name}
              className="w-full h-full rounded-full object-cover"
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {userData?.name} {userData?.firstSurname} {userData?.secondSurname}
            </h1>
            <p className="text-slate-500 dark:text-slate-400">{userData?.email}</p>
            <p className="text-sm text-slate-400 dark:text-slate-500">
              {userData?.role} • {userData?.phone || "Sin teléfono"}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="neumorphic-card p-2">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("nominas")}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
              activeTab === "nominas"
                ? "bg-primary text-white shadow-md"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <FiFileText />
            Nóminas
          </button>
          <button
            onClick={() => setActiveTab("vacaciones")}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
              activeTab === "vacaciones"
                ? "bg-primary text-white shadow-md"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <FiCalendar />
            Vacaciones / Ausencias
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === "nominas" && (
        <div className="neumorphic-card p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              Nóminas
            </h2>
            <button
              onClick={() => {
                setEditingPayroll(null);
                setPayrollForm({ qty: "", date: "", state: "pendiente" });
                setShowPayrollModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
            >
              <FiPlus />
              Nueva nómina
            </button>
          </div>

          {loadingPayrolls ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : payrolls.length === 0 ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              <FiFileText className="mx-auto text-4xl mb-2 opacity-50" />
              <p>No hay nóminas registradas</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-3">Fecha</th>
                    <th className="p-3">Importe</th>
                    <th className="p-3">Estado</th>
                    <th className="p-3">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {payrolls.map((payroll) => (
                    <tr key={payroll.uuid} className="border-b border-slate-100 dark:border-slate-800">
                      <td className="p-3 text-slate-700 dark:text-slate-300">
                        {formatDate(payroll.date)}
                      </td>
                      <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                        {formatCurrency(payroll.qty)}
                      </td>
                      <td className="p-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(payroll.state)}`}>
                          {PayrollState[payroll.state] || payroll.state}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditPayroll(payroll)}
                            className="p-2 rounded-lg neumorphic-button text-slate-600 dark:text-slate-400 hover:text-primary"
                            title="Editar"
                          >
                            <FiEdit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeletePayroll(payroll.uuid)}
                            className="p-2 rounded-lg neumorphic-button text-slate-600 dark:text-slate-400 hover:text-red-500"
                            title="Eliminar"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "vacaciones" && (
        <div className="neumorphic-card p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              Vacaciones y Ausencias
            </h2>
            <button
              onClick={() => {
                setEditingAbsence(null);
                setAbsenceForm({ startDate: "", endDate: "", type: "vacaciones", description: "", status: "pendiente" });
                setShowAbsenceModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
            >
              <FiPlus />
              Nueva ausencia
            </button>
          </div>

          {loadingAbsences ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : absences.length === 0 ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              <FiCalendar className="mx-auto text-4xl mb-2 opacity-50" />
              <p>No hay ausencias registradas</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-3">Tipo</th>
                    <th className="p-3">Fecha inicio</th>
                    <th className="p-3">Fecha fin</th>
                    <th className="p-3">Días</th>
                    <th className="p-3">Estado</th>
                    <th className="p-3">Descripción</th>
                    <th className="p-3">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {absences.map((absence) => (
                    <tr key={absence.uuid} className="border-b border-slate-100 dark:border-slate-800">
                      <td className="p-3 text-slate-700 dark:text-slate-300 font-medium">
                        {AbsenceType[absence.type] || absence.type}
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">
                        {formatDate(absence.startDate)}
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">
                        {formatDate(absence.endDate)}
                      </td>
                      <td className="p-3 text-slate-700 dark:text-slate-300 font-semibold">
                        {calculateDays(absence.startDate, absence.endDate)}
                      </td>
                      <td className="p-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(absence.status)}`}>
                          {AbsenceStatus[absence.status] || absence.status}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500 dark:text-slate-400 max-w-xs truncate">
                        {absence.description || "-"}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditAbsence(absence)}
                            className="p-2 rounded-lg neumorphic-button text-slate-600 dark:text-slate-400 hover:text-primary"
                            title="Editar"
                          >
                            <FiEdit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteAbsence(absence.uuid)}
                            className="p-2 rounded-lg neumorphic-button text-slate-600 dark:text-slate-400 hover:text-red-500"
                            title="Eliminar"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Payroll Modal */}
      {showPayrollModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="neumorphic-card bg-background-light dark:bg-background-dark p-6 rounded-xl w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                {editingPayroll ? "Editar nómina" : "Nueva nómina"}
              </h3>
              <button
                onClick={() => {
                  setShowPayrollModal(false);
                  setEditingPayroll(null);
                }}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <FiX />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Importe (€) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={payrollForm.qty}
                  onChange={(e) => setPayrollForm({ ...payrollForm, qty: e.target.value })}
                  className="w-full neumorphic-card-inset px-4 py-3 rounded-lg border-none focus:ring-2 focus:ring-primary bg-transparent text-slate-800 dark:text-slate-200"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Fecha *
                </label>
                <input
                  type="date"
                  value={payrollForm.date}
                  onChange={(e) => setPayrollForm({ ...payrollForm, date: e.target.value })}
                  className="w-full neumorphic-card-inset px-4 py-3 rounded-lg border-none focus:ring-2 focus:ring-primary bg-transparent text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Estado
                </label>
                <select
                  value={payrollForm.state}
                  onChange={(e) => setPayrollForm({ ...payrollForm, state: e.target.value })}
                  className="w-full neumorphic-card-inset px-4 py-3 rounded-lg border-none focus:ring-2 focus:ring-primary bg-transparent text-slate-800 dark:text-slate-200"
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="pagada">Pagada</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowPayrollModal(false);
                  setEditingPayroll(null);
                }}
                className="flex-1 py-3 rounded-lg neumorphic-button text-slate-600 dark:text-slate-400 font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={editingPayroll ? handleUpdatePayroll : handleCreatePayroll}
                className="flex-1 py-3 rounded-lg bg-primary text-white font-medium hover:bg-primary/90"
              >
                {editingPayroll ? "Guardar cambios" : "Crear nómina"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Absence Modal */}
      {showAbsenceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="neumorphic-card bg-background-light dark:bg-background-dark p-6 rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                {editingAbsence ? "Editar ausencia" : "Nueva ausencia"}
              </h3>
              <button
                onClick={() => {
                  setShowAbsenceModal(false);
                  setEditingAbsence(null);
                }}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <FiX />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Tipo *
                </label>
                <select
                  value={absenceForm.type}
                  onChange={(e) => setAbsenceForm({ ...absenceForm, type: e.target.value })}
                  className="w-full neumorphic-card-inset px-4 py-3 rounded-lg border-none focus:ring-2 focus:ring-primary bg-transparent text-slate-800 dark:text-slate-200"
                >
                  <option value="vacaciones">Vacaciones</option>
                  <option value="asuntos_propios">Asuntos Propios</option>
                  <option value="baja_medica">Baja Médica</option>
                  <option value="otro">Otro</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Fecha inicio *
                  </label>
                  <input
                    type="date"
                    value={absenceForm.startDate}
                    onChange={(e) => setAbsenceForm({ ...absenceForm, startDate: e.target.value })}
                    className="w-full neumorphic-card-inset px-4 py-3 rounded-lg border-none focus:ring-2 focus:ring-primary bg-transparent text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Fecha fin *
                  </label>
                  <input
                    type="date"
                    value={absenceForm.endDate}
                    onChange={(e) => setAbsenceForm({ ...absenceForm, endDate: e.target.value })}
                    className="w-full neumorphic-card-inset px-4 py-3 rounded-lg border-none focus:ring-2 focus:ring-primary bg-transparent text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              {absenceForm.startDate && absenceForm.endDate && (
                <div className="text-center py-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    Total: <strong className="text-primary">{calculateDays(absenceForm.startDate, absenceForm.endDate)}</strong> día(s)
                  </span>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Estado
                </label>
                <select
                  value={absenceForm.status}
                  onChange={(e) => setAbsenceForm({ ...absenceForm, status: e.target.value })}
                  className="w-full neumorphic-card-inset px-4 py-3 rounded-lg border-none focus:ring-2 focus:ring-primary bg-transparent text-slate-800 dark:text-slate-200"
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="aprobada">Aprobada</option>
                  <option value="rechazada">Rechazada</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Descripción / Motivo
                </label>
                <textarea
                  value={absenceForm.description}
                  onChange={(e) => setAbsenceForm({ ...absenceForm, description: e.target.value })}
                  className="w-full neumorphic-card-inset px-4 py-3 rounded-lg border-none focus:ring-2 focus:ring-primary bg-transparent text-slate-800 dark:text-slate-200 resize-none"
                  rows={3}
                  placeholder="Motivo de la ausencia..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAbsenceModal(false);
                  setEditingAbsence(null);
                }}
                className="flex-1 py-3 rounded-lg neumorphic-button text-slate-600 dark:text-slate-400 font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={editingAbsence ? handleUpdateAbsence : handleCreateAbsence}
                className="flex-1 py-3 rounded-lg bg-primary text-white font-medium hover:bg-primary/90"
              >
                {editingAbsence ? "Guardar cambios" : "Crear ausencia"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
