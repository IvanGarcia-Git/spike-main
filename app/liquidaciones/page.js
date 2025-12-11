"use client";
import { useRouter } from "next/navigation";
import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import {
  FaPlus,
  FaDownload,
  FaTrashAlt,
  FaSearch,
  FaTimes,
  FaSpinner,
  FaChevronDown,
} from "react-icons/fa";
import { getCookie } from "cookies-next";
import { authGetFetch, authFetch } from "@/helpers/server-fetch.helper";
import * as XLSX from "xlsx";

const LIQUIDATION_STATUSES = {
  PENDIENTE: "PENDIENTE",
  EN_REVISION: "EN REVISION",
  PAGADA: "PAGADA",
  RECHAZADA: "RECHAZADA",
};

const formatDateToYYYYMMDD = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || isNaN(parseFloat(String(amount)))) return "N/A";
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(
    parseFloat(String(amount))
  );
};

const formatDate = (dateString) => {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch (e) {
    return dateString;
  }
};

const formatCurrencyForExcel = (amount) => {
  if (amount === null || amount === undefined || isNaN(parseFloat(String(amount)))) return "";
  return parseFloat(String(amount));
};

const getFullName = (user) => {
  if (!user) return "";
  return `${user.name} ${user.firstSurname} ${user.secondSurname || ""}`
    .replace(/\s+/g, " ")
    .trim();
};

const StatusDropdownPortal = ({
  isOpen,
  position,
  onClose,
  currentStatus,
  liquidationUuid,
  onStatusUpdate,
  isLoading,
  dropdownRef,
  availableStatuses,
}) => {
  if (!isOpen) return null;

  return createPortal(
    <div
      ref={dropdownRef}
      className="origin-top-right absolute rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
      style={{ top: position.top, left: position.left, minWidth: "12rem" }}
      role="menu"
      aria-orientation="vertical"
    >
      <div className="py-1" role="none">
        {Object.values(availableStatuses).map((statusOption) => (
          <button
            key={statusOption}
            onClick={(e) => {
              e.stopPropagation();
              if (currentStatus !== statusOption) {
                onStatusUpdate(liquidationUuid, statusOption);
              } else {
                onClose();
              }
            }}
            disabled={isLoading}
            className={`${
              currentStatus === statusOption ? "bg-gray-100 text-gray-900" : "text-gray-700"
            } block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50`}
            role="menuitem"
          >
            {statusOption}
          </button>
        ))}
      </div>
    </div>,
    document.body
  );
};

// Tipos de liquidación
const LIQUIDATION_TYPES = {
  INGRESO: "INGRESO",
  GASTO: "GASTO",
};

const NuevaLiquidacionModal = ({ isOpen, onClose, onSubmit, users, isLoading }) => {
  const [nombre, setNombre] = useState("");
  const [date, setDate] = useState(formatDateToYYYYMMDD(new Date()));
  const [selectedUserIdForNewLiq, setSelectedUserIdForNewLiq] = useState("");
  const [liquidationType, setLiquidationType] = useState(LIQUIDATION_TYPES.INGRESO);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setNombre("");
      setDate(formatDateToYYYYMMDD(new Date()));
      setSelectedUserIdForNewLiq(""); // Sin usuario por defecto (opcional)
      setLiquidationType(LIQUIDATION_TYPES.INGRESO);
      setErrors({});
    }
  }, [isOpen, users]);

  if (!isOpen) return null;

  // Validar formato de fecha YYYY-MM-DD
  const isValidDateFormat = (dateStr) => {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateStr)) return false;
    const d = new Date(dateStr);
    return d instanceof Date && !isNaN(d);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    // Validación: nombre no vacío
    if (!nombre.trim()) {
      newErrors.nombre = "El nombre de la liquidación es obligatorio.";
    }

    // Validación: fecha válida YYYY-MM-DD
    if (!date.trim()) {
      newErrors.date = "La fecha es obligatoria.";
    } else if (!isValidDateFormat(date)) {
      newErrors.date = "La fecha debe tener formato válido (YYYY-MM-DD).";
    }

    // Validación: tipo obligatorio
    if (!liquidationType) {
      newErrors.type = "Selecciona un tipo de liquidación.";
    }

    // Si hay errores, mostrarlos y no enviar
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Limpiar errores y enviar
    setErrors({});

    const payload = {
      name: nombre.trim(),
      date: date,
      type: liquidationType,
    };

    // Solo agregar userId si se seleccionó uno
    if (selectedUserIdForNewLiq) {
      payload.userId = parseInt(selectedUserIdForNewLiq);
    }

    onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4 lg:ml-72">
      <div className="neumorphic-card rounded-xl p-6 md:p-8 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl sm:text-2xl font-semibold text-slate-800 dark:text-slate-100">Nueva Liquidación</h2>
          <button
            onClick={onClose}
            className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            disabled={isLoading}
          >
            <FaTimes size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          {/* Selector de Tipo: INGRESO / GASTO */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Tipo de liquidación
            </label>
            <div className="flex rounded-lg overflow-hidden neumorphic-card-inset">
              <button
                type="button"
                onClick={() => setLiquidationType(LIQUIDATION_TYPES.INGRESO)}
                disabled={isLoading}
                className={`flex-1 py-3 px-4 text-sm font-semibold transition-all ${
                  liquidationType === LIQUIDATION_TYPES.INGRESO
                    ? "bg-green-500 text-white shadow-md"
                    : "bg-transparent text-slate-600 dark:text-slate-400 hover:bg-green-100 dark:hover:bg-green-900/30"
                }`}
              >
                Ingreso
              </button>
              <button
                type="button"
                onClick={() => setLiquidationType(LIQUIDATION_TYPES.GASTO)}
                disabled={isLoading}
                className={`flex-1 py-3 px-4 text-sm font-semibold transition-all ${
                  liquidationType === LIQUIDATION_TYPES.GASTO
                    ? "bg-red-500 text-white shadow-md"
                    : "bg-transparent text-slate-600 dark:text-slate-400 hover:bg-red-100 dark:hover:bg-red-900/30"
                }`}
              >
                Gasto
              </button>
            </div>
            {errors.type && (
              <p className="mt-1 text-sm text-red-500">{errors.type}</p>
            )}
          </div>

          {/* Campo Nombre */}
          <div className="mb-4">
            <label htmlFor="liq-nombre" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Nombre de liquidación
            </label>
            <input
              type="text"
              id="liq-nombre"
              value={nombre}
              onChange={(e) => {
                setNombre(e.target.value);
                if (errors.nombre) setErrors({ ...errors, nombre: null });
              }}
              className={`neumorphic-card-inset px-4 py-3 rounded-lg border-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 bg-transparent w-full text-slate-800 dark:text-slate-100 ${
                errors.nombre ? "ring-2 ring-red-500" : ""
              }`}
              placeholder="Ej: Comisiones Diciembre 2025"
              disabled={isLoading}
            />
            {errors.nombre && (
              <p className="mt-1 text-sm text-red-500">{errors.nombre}</p>
            )}
          </div>

          {/* Campo Fecha */}
          <div className="mb-4">
            <label htmlFor="liq-date" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Fecha (YYYY-MM-DD)
            </label>
            <input
              type="date"
              id="liq-date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                if (errors.date) setErrors({ ...errors, date: null });
              }}
              className={`neumorphic-card-inset px-4 py-3 rounded-lg border-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 bg-transparent w-full text-slate-800 dark:text-slate-100 ${
                errors.date ? "ring-2 ring-red-500" : ""
              }`}
              disabled={isLoading}
            />
            {errors.date && (
              <p className="mt-1 text-sm text-red-500">{errors.date}</p>
            )}
          </div>

          {/* Campo Usuario (opcional) */}
          {users.length > 0 && (
            <div className="mb-6">
              <label htmlFor="liq-user" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Asignar a Usuario <span className="text-slate-400 font-normal">(opcional)</span>
              </label>
              <div className="neumorphic-card-inset rounded-lg">
                <select
                  id="liq-user"
                  value={selectedUserIdForNewLiq}
                  onChange={(e) => setSelectedUserIdForNewLiq(e.target.value)}
                  className="w-full p-2.5 border-none bg-transparent focus:ring-2 focus:ring-primary focus:ring-opacity-50 rounded-lg text-slate-800 dark:text-slate-100"
                  disabled={isLoading}
                >
                  <option value="">-- Sin asignar --</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id.toString()}>
                      {getFullName(user)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Botones */}
          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="shadow-neumorphic-light dark:shadow-neumorphic-dark hover:shadow-neumorphic-inset-light dark:hover:shadow-neumorphic-inset-dark px-4 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 w-full sm:w-auto"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-primary text-white px-5 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all font-medium w-full sm:w-auto flex items-center justify-center"
              disabled={isLoading}
            >
              {isLoading ? <FaSpinner className="animate-spin mr-2" /> : null}
              Crear Liquidación
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const LiquidacionesPage = () => {
  const router = useRouter();
  const [allLiquidations, setAllLiquidations] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [contractSearchTerm, setContractSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState(null);
  const [editingStatusUuid, setEditingStatusUuid] = useState(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef(null);
  const statusButtonRefs = useRef({});
  const jwtToken = getCookie("factura-token");
  const [isDownloadingExcel, setIsDownloadingExcel] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setEditingStatusUuid(null);
      }
    };

    if (editingStatusUuid) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [editingStatusUuid]);

  const fetchLiquidations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authGetFetch("liquidations", jwtToken);
      if (!response.ok) {
        const errData = await response
          .json()
          .catch(() => ({ message: "Error al cargar liquidaciones" }));
        throw new Error(errData.message || "Error al cargar liquidaciones");
      }

      let data = await response.json();
      data = data.map((liq) => ({
        ...liq,
        date: liq.date
          ? new Date(liq.date).toLocaleDateString("es-ES", {
              day: "2-digit",
              month: "2-digit",
              year: "2-digit",
            })
          : "N/A",
      }));
      setAllLiquidations(data);
    } catch (err) {
      console.error("Error fetching liquidations:", err);
      setError(err.message);
      setAllLiquidations([]);
    } finally {
      setIsLoading(false);
    }
  }, [jwtToken]);

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoadingUsers(true);
      try {
        const response = await authGetFetch("users/agents-and-supervisors", jwtToken);
        if (!response.ok) throw new Error("Error al cargar usuarios");
        const data = await response.json();
        setUsers(data || []);
        setIsLoadingUsers(false);
      } catch (err) {
        console.error("Error fetching users:", err);
        setUsers([]);
      } finally {
        setIsLoadingUsers(false);
      }
    };

    if (jwtToken) {
      fetchUsers();
      fetchLiquidations();
    } else {
      setError("Token no encontrado. Por favor, inicie sesión.");
      setIsLoading(false);
      setIsLoadingUsers(false);
    }
  }, [jwtToken, fetchLiquidations]);

  const usersWithLiquidations = useMemo(() => {
    if (isLoadingUsers || !users.length) return [];
    const userIdsInLiquidations = [...new Set(allLiquidations.map((liq) => liq.userId))];
    return users.filter((user) => userIdsInLiquidations.includes(user.id));
  }, [allLiquidations, users, isLoadingUsers]);

  useEffect(() => {
    setSelectedUserId("all");
  }, []);

  const displayedLiquidations = useMemo(() => {
    let filtered = [...allLiquidations];

    if (selectedUserId && selectedUserId !== "all") {
      filtered = filtered.filter((liq) => liq.userId === parseInt(selectedUserId));
    }

    if (searchTerm.trim()) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (liq) =>
          liq.name.toLowerCase().includes(lowerSearchTerm) ||
          (liq.date && liq.date.toLowerCase().includes(lowerSearchTerm)) ||
          (liq.status && liq.status.toLowerCase().includes(lowerSearchTerm))
      );
    }

    if (contractSearchTerm.trim()) {
      const lowerContractSearch = contractSearchTerm.toLowerCase();
      filtered = filtered.filter((liq) => {
        return liq.liquidationContracts?.some((lc) => {
          const contract = lc.contract;
          const customer = contract?.customer;
          return (
            (contract?.cups?.toLowerCase().includes(lowerContractSearch)) ||
            (customer?.nationalId?.toLowerCase().includes(lowerContractSearch)) ||
            (customer?.cif?.toLowerCase().includes(lowerContractSearch)) ||
            (customer?.name?.toLowerCase().includes(lowerContractSearch)) ||
            (customer?.surnames?.toLowerCase().includes(lowerContractSearch))
          );
        });
      });
    }

    return filtered;
  }, [allLiquidations, selectedUserId, searchTerm, contractSearchTerm]);

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  const handleCreateLiquidation = async (newLiquidationData) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const payload = {
        name: newLiquidationData.name,
        date: newLiquidationData.date, // Formato YYYY-MM-DD
        type: newLiquidationData.type, // INGRESO o GASTO
      };

      // Solo agregar userId si está definido
      if (newLiquidationData.userId) {
        payload.userId = newLiquidationData.userId;
      }

      const response = await authFetch("POST", "liquidations", payload, jwtToken);
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || "Error al crear la liquidación");
      }
      await fetchLiquidations();
      handleCloseModal();
    } catch (err) {
      console.error("Error creating liquidation:", err);
      setError(err.message);
      alert(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLiquidation = async (liquidationUuid) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar esta liquidación?")) {
      setIsSubmitting(true);
      setError(null);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/liquidations/${liquidationUuid}`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${jwtToken}`,
            },
          }
        );
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.message || "Error al eliminar la liquidación");
        }
        await fetchLiquidations();
      } catch (err) {
        console.error("Error deleting liquidation:", err);
        setError(err.message);
        alert(`Error: ${err.message}`);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const getEffectiveCommissionForDownload = (liquidationContract) => {
    if (
      liquidationContract.overrideCommission !== null &&
      liquidationContract.overrideCommission !== undefined
    ) {
      return parseFloat(String(liquidationContract.overrideCommission));
    }
    if (
      liquidationContract.assignedCommissionAmount !== null &&
      liquidationContract.assignedCommissionAmount !== undefined
    ) {
      return parseFloat(String(liquidationContract.assignedCommissionAmount));
    }
    return 0;
  };

  const handleDownloadLiquidation = async (liquidationUuid) => {
    setIsDownloadingExcel(true);
    try {
      const jwtToken = getCookie("factura-token");
      const response = await authGetFetch(`liquidations/${liquidationUuid}`, jwtToken);
      if (!response.ok) {
        throw new Error(
          "No se pudieron cargar los detalles completos de la liquidación para exportar."
        );
      }
      const liquidationDetail = await response.json();

      if (
        !liquidationDetail ||
        !liquidationDetail.liquidationContracts ||
        liquidationDetail.liquidationContracts.length === 0
      ) {
        alert("Esta liquidación no tiene contratos para exportar.");
        setIsDownloadingExcel(false);
        return;
      }

      const contractsDataForExcel = liquidationDetail.liquidationContracts.map((lc) => {
        const contract = lc.contract;
        const customer = contract?.customer;
        const agent = contract?.user;
        const rate = contract?.rate;
        const company = contract?.company;
        const effectiveCommission = getEffectiveCommissionForDownload(lc);

        return {
          "Fecha Contrato": formatDate(contract?.createdAt),
          Agente: agent ? `${agent.name} ${agent.firstSurname || ""}`.trim() : "N/A",
          Tarifa: rate?.name || company?.name || "N/A",
          Cliente: customer ? `${customer.name} ${customer.surnames || ""}`.trim() : "N/A",
          "DNI/CIF": customer?.nationalId || customer?.cif || "N/A",
          CUPS: contract?.cups || "N/A",
          "Importe (€)": formatCurrencyForExcel(effectiveCommission),
          "Comisión Sobrescrita (€)": formatCurrencyForExcel(lc.overrideCommission),
          "Comisión Asignada (€)": formatCurrencyForExcel(lc.assignedCommissionAmount),
        };
      });

      const totalEffectiveCommission = contractsDataForExcel.reduce(
        (sum, row) => sum + (row["Importe (€)"] || 0),
        0
      );
      contractsDataForExcel.push({});
      contractsDataForExcel.push({
        Cliente: "TOTAL LIQUIDACIÓN:",
        "Importe (€)": formatCurrencyForExcel(totalEffectiveCommission),
      });

      let sheetName = `Contratos Liq ${liquidationDetail.name}`;
      if (sheetName.length > 30) {
        sheetName = sheetName.substring(0, 27) + "...";
      }

      sheetName = sheetName.replace(/[\[\]\*\/\\?\:]/g, "");

      const worksheet = XLSX.utils.json_to_sheet(contractsDataForExcel);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

      const colWidths = Object.keys(contractsDataForExcel[0] || {}).map((key) => ({
        wch:
          Math.max(
            ...contractsDataForExcel.map((row) => (row[key] ? String(row[key]).length : 0)),
            key.length
          ) + 2,
      }));
      worksheet["!cols"] = colWidths;

      const safeFilenamePart = liquidationDetail.name.replace(/[^a-z0-9]/gi, "_").substring(0, 50);

      XLSX.writeFile(
        workbook,
        `Liquidacion_${safeFilenamePart}_${liquidationDetail.uuid.substring(0, 8)}.xlsx`
      );
    } catch (error) {
      console.error("Error al generar Excel de liquidación:", error);
      alert(`Error al generar Excel: ${error.message}`);
    } finally {
      setIsDownloadingExcel(false);
    }
  };

  const handleLiquidationNameClick = (liquidation) => {
    router.push(`/liquidaciones/${liquidation.uuid}`);
  };

  const handleStatusUpdate = async (liquidationUuid, newStatus) => {
    if (isUpdatingStatus) return;

    setIsUpdatingStatus(true);
    setError(null);
    const originalStatus = allLiquidations.find((l) => l.uuid === liquidationUuid)?.status;

    setAllLiquidations((prevLiquidations) =>
      prevLiquidations.map((liq) =>
        liq.uuid === liquidationUuid ? { ...liq, status: newStatus } : liq
      )
    );
    setEditingStatusUuid(null);

    try {
      const response = await authFetch(
        "PATCH",
        `liquidations/${liquidationUuid}`,
        { status: newStatus },
        jwtToken
      );

      if (!response.ok) {
        const errData = await response.json();

        setAllLiquidations((prevLiquidations) =>
          prevLiquidations.map((liq) =>
            liq.uuid === liquidationUuid ? { ...liq, status: originalStatus } : liq
          )
        );
        throw new Error(errData.message || "Error al actualizar el estado");
      }
    } catch (err) {
      console.error("Error updating status:", err);
      setError(err.message);
      alert(`Error: ${err.message}`);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getStatusClass = (status) => {
    switch (status?.toUpperCase()) {
      case "PAGADA":
        return "bg-green-500 text-white";
      case "EN REVISION":
        return "bg-yellow-400 text-yellow-900";
      case "PENDIENTE":
        return "bg-sky-500 text-white";
      case "RECHAZADA":
        return "bg-red-500 text-white";
      default:
        return "bg-gray-400 text-white";
    }
  };

  const currentUserForFilterMessage =
    selectedUserId !== "all" && users.length > 0
      ? users.find((u) => u.id === parseInt(selectedUserId))
      : null;

  if (isLoading && isLoadingUsers && !error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background text-slate-800 dark:text-slate-100">
        <FaSpinner className="animate-spin text-blue-600 text-4xl" />
        <p className="ml-3 text-xl">Cargando datos...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 bg-background min-h-screen font-sans text-slate-800 dark:text-slate-100">
      <header className="flex flex-col sm:flex-row justify-between items-center mb-6 md:mb-8 pb-4 border-b border-gray-300 dark:border-gray-600">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100 mb-4 sm:mb-0">
          Historial de liquidaciones
        </h1>
        <button
          onClick={handleOpenModal}
          className="bg-primary text-white px-5 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all font-medium flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50"
        >
          <FaPlus size={16} />
          <span className="text-sm sm:text-base font-bold">Nueva Liquidación</span>
        </button>
      </header>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded-md">
          {error}
        </div>
      )}

      {/* Filters Section */}
      <div className="mb-6 p-4 neumorphic-card rounded-lg">
        <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="w-full md:w-auto md:min-w-[240px]">
            <label htmlFor="user-select" className="sr-only">
              Seleccionar Colaborador
            </label>
            <div className="neumorphic-card-inset rounded-lg">
              <select
                id="user-select"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full p-2.5 border-none bg-transparent focus:ring-2 focus:ring-primary focus:ring-opacity-50 rounded-lg text-slate-800 dark:text-slate-100 appearance-none cursor-pointer"
                style={{
                  backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' class='feather feather-chevron-down'><polyline points='6 9 12 15 18 9'></polyline></svg>")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 0.75rem center",
                  backgroundSize: "1.5em 1.5em",
                }}
                disabled={isLoadingUsers || usersWithLiquidations.length === 0}
              >
                <option value="all">Todos los colaboradores</option>
                {usersWithLiquidations.map((user) => (
                  <option key={user.id} value={user.id.toString()}>
                    {getFullName(user)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="relative w-full flex-grow">
            <label htmlFor="search-bar" className="sr-only">
              Buscador
            </label>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="text-slate-400" />
            </div>
            <input
              type="text"
              id="search-bar"
              placeholder="Buscar por nombre, fecha, estado..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="neumorphic-card-inset px-4 py-3 pl-10 rounded-lg border-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 bg-transparent w-full text-slate-800 dark:text-slate-100"
            />
          </div>
        </div>
        <div className="mt-4 relative w-full">
          <label htmlFor="contract-search-bar" className="sr-only">
            Buscar contratos
          </label>
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaSearch className="text-slate-400" />
          </div>
          <input
            type="text"
            id="contract-search-bar"
            placeholder="Buscar contratos por CUPS, DNI/CIF, cliente..."
            value={contractSearchTerm}
            onChange={(e) => setContractSearchTerm(e.target.value)}
            className="neumorphic-card-inset px-4 py-3 pl-10 rounded-lg border-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 bg-transparent w-full text-slate-800 dark:text-slate-100"
          />
        </div>
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 italic">
          {currentUserForFilterMessage
            ? `Mostrando liquidaciones para ${getFullName(currentUserForFilterMessage)}.`
            : "Mostrando liquidaciones para todos los colaboradores."}
          {searchTerm && ` Filtrado por "${searchTerm}".`}
          {contractSearchTerm && ` Contratos filtrados por "${contractSearchTerm}".`}
        </p>
      </div>

      {/* Liquidations Table */}
      {isLoading && !allLiquidations.length ? (
        <div className="flex justify-center items-center py-10">
          <FaSpinner className="animate-spin text-blue-600 text-3xl" />
          <p className="ml-2 text-slate-500 dark:text-slate-400">Cargando liquidaciones...</p>
        </div>
      ) : (
        <div className="neumorphic-card rounded-lg overflow-x-auto">
          <table className="w-full min-w-[768px]">
            <thead className="border-b-2 border-gray-200 dark:border-gray-700 bg-background">
              <tr>
                <th className="p-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="p-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="p-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Nombre Liquidación
                </th>
                <th className="p-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Importe
                </th>
                <th className="p-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Estado
                </th>
                <th className="p-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {displayedLiquidations.length > 0 ? (
                displayedLiquidations.map((liq) => (
                  <tr key={liq.uuid} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors duration-150">
                    <td className="p-3 text-sm text-slate-700 dark:text-slate-300 whitespace-nowrap">{liq.date}</td>
                    <td className="p-3 text-center whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          liq.type === "GASTO"
                            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                            : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        }`}
                      >
                        {liq.type || "INGRESO"}
                      </span>
                    </td>
                    <td
                      className="p-3 text-sm text-slate-800 dark:text-slate-100 font-medium hover:text-blue-600 cursor-pointer whitespace-nowrap"
                      onClick={() => handleLiquidationNameClick(liq)}
                      title="Haz click para ver detalles"
                    >
                      {liq.name}
                    </td>
                    <td className="p-3 text-sm text-slate-700 dark:text-slate-300 whitespace-nowrap text-right">
                      {formatCurrency(liq.totalCommission)}
                    </td>

                    <td className="p-3 whitespace-nowrap text-center">
                      <div className="relative inline-block text-left">
                        {" "}
                        <button
                          type="button"
                          ref={(el) => (statusButtonRefs.current[liq.uuid] = el)}
                          onClick={(e) => {
                            e.stopPropagation();
                            const buttonRect =
                              statusButtonRefs.current[liq.uuid]?.getBoundingClientRect();
                            if (buttonRect) {
                              setDropdownPosition({
                                top: buttonRect.bottom + window.scrollY + 2,
                                left: buttonRect.left + window.scrollX,
                              });
                            }
                            setEditingStatusUuid(editingStatusUuid === liq.uuid ? null : liq.uuid);
                          }}
                          disabled={isUpdatingStatus && editingStatusUuid === liq.uuid}
                          className={`px-3 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full cursor-pointer transition-colors hover:opacity-80 ${getStatusClass(
                            liq.status
                          )}`}
                        >
                          {isUpdatingStatus && editingStatusUuid === liq.uuid ? (
                            <FaSpinner className="animate-spin mr-1 -ml-1" />
                          ) : null}
                          {liq.status}
                          <FaChevronDown className="ml-2 -mr-1 h-3 w-3" aria-hidden="true" />
                        </button>
                      </div>
                    </td>

                    <td className="p-3 text-sm text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      <div className="flex items-center justify-center space-x-3">
                        <button
                          onClick={() => handleDownloadLiquidation(liq.uuid)}
                          className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors disabled:opacity-50"
                          title="Descargar Excel"
                          disabled={isDownloadingExcel}
                        >
                          {isDownloadingExcel ? (
                            <FaSpinner className="animate-spin" size={18} />
                          ) : (
                            <FaDownload size={18} />
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteLiquidation(liq.uuid)}
                          className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                          title="Eliminar"
                          disabled={isSubmitting}
                        >
                          <FaTrashAlt size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="p-6 text-center text-slate-500 dark:text-slate-400 text-sm">
                    {isLoading
                      ? "Cargando..."
                      : searchTerm
                      ? "No se encontraron liquidaciones con los filtros actuales."
                      : "No hay liquidaciones para mostrar."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <StatusDropdownPortal
        isOpen={!!editingStatusUuid}
        position={dropdownPosition}
        onClose={() => setEditingStatusUuid(null)}
        currentStatus={allLiquidations.find((l) => l.uuid === editingStatusUuid)?.status}
        liquidationUuid={editingStatusUuid}
        onStatusUpdate={handleStatusUpdate}
        isLoading={isUpdatingStatus}
        dropdownRef={dropdownRef}
        availableStatuses={LIQUIDATION_STATUSES}
      />

      <NuevaLiquidacionModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleCreateLiquidation}
        users={users}
        isLoading={isSubmitting}
      />
    </div>
  );
};

export default LiquidacionesPage;
