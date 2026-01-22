"use client";
import { authGetFetch, authFetch } from "@/helpers/server-fetch.helper";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { getCookie } from "cookies-next";
import {
  FaEdit,
  FaSave,
  FaTimes,
  FaSpinner,
  FaTrashAlt,
  FaChevronLeft,
  FaChevronRight,
  FaSearch,
  FaChevronDown,
  FaDownload,
  FaPlus,
  FaCheck,
} from "react-icons/fa";
import * as jose from "jose";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";

// Componente de búsqueda de CUPS para agregar contratos
const AddContractByCupsModal = ({ liquidationUuid, onClose, onContractsAdded }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedContracts, setSelectedContracts] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const debounceRef = useRef(null);

  const handleSearch = useCallback(async (term) => {
    if (!term || term.trim().length < 2) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setHasSearched(true);

    try {
      const jwtToken = getCookie("factura-token");
      const response = await authGetFetch(
        `contracts/search/cups?search=${encodeURIComponent(term)}&excludeLiquidation=${liquidationUuid}&limit=20`,
        jwtToken
      );

      if (!response.ok) {
        throw new Error("Error al buscar contratos");
      }

      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error("Error searching contracts:", error);
      setSearchError("Error al buscar contratos. Intenta de nuevo.");
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [liquidationUuid]);

  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    // Debounce de 400ms
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      handleSearch(value);
    }, 400);
  };

  const toggleContractSelection = (contractUuid) => {
    setSelectedContracts((prev) =>
      prev.includes(contractUuid)
        ? prev.filter((uuid) => uuid !== contractUuid)
        : [...prev, contractUuid]
    );
  };

  const handleAddContracts = async () => {
    if (selectedContracts.length === 0) {
      toast.warn("Selecciona al menos un contrato para agregar.");
      return;
    }

    setIsAdding(true);
    try {
      const jwtToken = getCookie("factura-token");
      const response = await authFetch(
        "POST",
        "liquidation-contracts/",
        {
          liquidationUuid,
          contractUuids: selectedContracts,
        },
        jwtToken
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || "Error al agregar contratos");
      }

      toast.success(`${selectedContracts.length} contrato(s) agregado(s) correctamente.`);
      onContractsAdded();
      onClose();
    } catch (error) {
      console.error("Error adding contracts:", error);
      toast.error(error.message || "Error al agregar los contratos.");
    } finally {
      setIsAdding(false);
    }
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="neumorphic-card p-6 rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            Agregar contratos por CUPS
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg neumorphic-button"
            disabled={isAdding}
          >
            <FaTimes />
          </button>
        </div>

        {/* Buscador */}
        <div className="mb-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {isSearching ? (
                <FaSpinner className="text-slate-400 animate-spin" />
              ) : (
                <FaSearch className="text-slate-400" />
              )}
            </div>
            <input
              type="text"
              placeholder="Buscar por CUPS, cliente o DNI... (mín. 2 caracteres)"
              value={searchTerm}
              onChange={handleSearchInputChange}
              className="neumorphic-card-inset px-4 py-3 pl-10 rounded-lg border-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 bg-transparent w-full text-slate-800 dark:text-slate-100"
              autoFocus
            />
          </div>
        </div>

        {/* Resultados */}
        <div className="flex-1 overflow-y-auto mb-4 min-h-[200px]">
          {searchError && (
            <div className="text-center py-8 text-red-500">
              <span className="material-icons-outlined text-4xl mb-2">error</span>
              <p>{searchError}</p>
            </div>
          )}

          {!searchError && isSearching && (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              <FaSpinner className="animate-spin text-3xl mx-auto mb-2" />
              <p>Buscando contratos...</p>
            </div>
          )}

          {!searchError && !isSearching && hasSearched && searchResults.length === 0 && (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              <span className="material-icons-outlined text-4xl mb-2">search_off</span>
              <p>No se encontraron contratos disponibles.</p>
              <p className="text-sm mt-1">Prueba con otro término de búsqueda.</p>
            </div>
          )}

          {!searchError && !isSearching && !hasSearched && (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              <span className="material-icons-outlined text-4xl mb-2">search</span>
              <p>Escribe para buscar contratos por CUPS, cliente o DNI.</p>
            </div>
          )}

          {!searchError && !isSearching && searchResults.length > 0 && (
            <div className="space-y-2">
              {searchResults.map((contract) => {
                const isSelected = selectedContracts.includes(contract.uuid);
                return (
                  <div
                    key={contract.uuid}
                    onClick={() => toggleContractSelection(contract.uuid)}
                    className={`p-3 rounded-lg cursor-pointer transition-all ${
                      isSelected
                        ? "bg-primary/20 border-2 border-primary"
                        : "neumorphic-card-inset hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-medium text-slate-700 dark:text-slate-300">
                            {contract.cups || "Sin CUPS"}
                          </span>
                          {contract.company?.name && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                              {contract.company.name}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                          {contract.customer
                            ? `${contract.customer.name} ${contract.customer.surnames || ""}`.trim()
                            : "Sin cliente"}
                          {contract.customer?.nationalId && ` • ${contract.customer.nationalId}`}
                        </div>
                        <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                          {contract.user && `Agente: ${contract.user.name} ${contract.user.firstSurname || ""}`}
                          {contract.rate?.name && ` • Tarifa: ${contract.rate.name}`}
                        </div>
                      </div>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        isSelected ? "bg-primary text-white" : "border-2 border-slate-300 dark:border-slate-600"
                      }`}>
                        {isSelected && <FaCheck size={12} />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-slate-700">
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {selectedContracts.length} contrato(s) seleccionado(s)
          </span>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg neumorphic-button font-medium text-slate-600 dark:text-slate-400"
              disabled={isAdding}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleAddContracts}
              className="px-4 py-2 rounded-lg neumorphic-button active bg-primary text-white font-semibold flex items-center gap-2"
              disabled={selectedContracts.length === 0 || isAdding}
            >
              {isAdding ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Agregando...
                </>
              ) : (
                <>
                  <FaPlus />
                  Agregar ({selectedContracts.length})
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const formatDate = (dateString) => {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch (e) {
    return dateString;
  }
};

const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return "-";
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(amount);
};

const formatCurrencyForExcel = (amount) => {
  if (amount === null || amount === undefined || isNaN(parseFloat(String(amount)))) return 0;
  return parseFloat(String(amount));
};

const liquidationColumnsConfig = {
  userName: {
    header: "Agente",
    render: (lc) =>
      lc.contract?.user
        ? `${lc.contract.user.name} ${lc.contract.user.firstSurname || ""}`.trim()
        : "—",
  },
  customerFullName: {
    header: "Cliente",
    render: (lc) =>
      lc.contract?.customer
        ? `${lc.contract.customer.name} ${lc.contract.customer.surnames || ""}`.trim()
        : "—",
  },
  cups: {
    header: "Cups",
    render: (lc) => lc.contract?.cups || "—",
  },
  customerPhoneNumber: {
    header: "Teléfono",
    render: (lc) => lc.contract?.customer?.phoneNumber || "—",
  },
  customerEmail: {
    header: "Email",
    render: (lc) => lc.contract?.customer?.email || "—",
  },
  customerAddress: {
    header: "Dirección",
    render: (lc) => lc.contract?.customer?.address || "—",
  },
  customerIban: {
    header: "IBAN",
    render: (lc) => lc.contract?.customer?.iban || "—",
  },
  customerNationalId: {
    header: "DNI/CIF",
    render: (lc) => lc.contract?.customer?.cif || lc.contract?.customer?.nationalId || "—",
  },
  electronicBill: {
    header: "E-FACT",
    render: (lc) => (lc.contract?.electronicBill ? "Sí" : "No"),
  },
  rateName: {
    header: "Tarifa",
    render: (lc) => lc.contract?.rate?.name || "—",
  },
  ratePowerSlot1: {
    header: "Potencias contratadas",
    render: (lc) => {
      if (Array.isArray(lc.contract.contractedPowers) && lc.contract.contractedPowers.length > 0) {
        return (
          <ul>
            {lc.contract.contractedPowers.map((power, index) => (
              <li key={index}>{power} kW</li>
            ))}
          </ul>
        );
      } else {
        return <span>-</span>;
      }
    },
  },
  expiresAt: {
    header: "Vencimiento",
    render: (lc) => {
      if (!lc.contract?.expiresAt) return "—";
      const today = new Date();
      const expiresDate = new Date(lc.contract.expiresAt);
      const diffTime = expiresDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 0 ? `En ${diffDays} días` : `Expirado`;
    },
  },
  extraInfo: {
    header: "Observaciones",
    render: (lc) => lc.contract?.extraInfo || "—",
  },
  contractStateName: {
    header: "Estado",
    render: (lc) => {
      if (lc.contract?.contractState) {
        return lc.contract?.contractState.name;
      } else {
        return "Borrador";
      }
    },
  },
  payed: {
    header: "Pagado",
    render: (lc) => (lc.contract?.payed ? "Sí" : "No" || "—"),
  },
  channelName: {
    header: "Canal",
    render: (lc) => {
      if (lc.contract?.channel) {
        return lc.contract?.channel.name;
      } else {
        return "—";
      }
    },
  },
  companyName: {
    header: "Compañía",
    render: (lc) => lc.contract?.company?.name || "—",
  },
  updatedAt: {
    header: "Fecha Cont.",
    render: (lc) => formatDate(lc.contract?.createdAt),
  },
  // Estas dos columnas están disponibles para ser seleccionadas, pero no son fijas
  totalAmount: {
    header: "Total Contrato",
    render: (lc) => formatCurrency(lc.contract?.totalAmount || 0),
  },
  commission: {
    header: "Comisión Base",
    render: (lc) => formatCurrency(lc.assignedCommissionAmount || 0),
  },
};

export default function LiquidacionDetailPage() {
  const { uuid } = useParams();
  const router = useRouter();
  const [liquidation, setLiquidation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [columnsOrder, setColumnsOrder] = useState([]);

  const [isEditingLiquidationName, setIsEditingLiquidationName] = useState(false);
  const [currentEditedLiquidationName, setCurrentEditedLiquidationName] = useState("");

  // Estado para edición masiva de comisiones
  const [pendingChanges, setPendingChanges] = useState({}); // { lcUuid: newValue }
  const [isSavingBatch, setIsSavingBatch] = useState(false);

  const [itemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [savingStates, setSavingStates] = useState({});
  const [selectedContracts, setSelectedContracts] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [isDownloadingExcel, setIsDownloadingExcel] = useState(false);
  const [isAddContractModalOpen, setIsAddContractModalOpen] = useState(false);

  const fetchLiquidacion = useCallback(async () => {
    if (!uuid) return;
    try {
      setLoading(true);
      setError(null);
      const jwtToken = getCookie("factura-token");
      const response = await authGetFetch(`liquidations/${uuid}`, jwtToken);

      if (!response.ok) {
        const errData = await response
          .json()
          .catch(() => ({ message: "Error fetching liquidacion" }));
        throw new Error(errData.message || "Error fetching liquidacion");
      }

      const data = await response.json();
      setLiquidation(data);
      setCurrentEditedLiquidationName(data.name || "");
    } catch (err) {
      console.error("Fetch liquidation error:", err);
      setError(err);
      toast.error(err.message || "No se pudo cargar la liquidación.");
    } finally {
      setLoading(false);
    }
  }, [uuid]);

  useEffect(() => {
    const fetchColumnPreferences = async () => {
      const token = getCookie("factura-token");
      if (!token) return;

      try {
        const payload = jose.decodeJwt(token);

        const userId = payload.userId;

        if (userId) {
          const response = await authGetFetch(`user-liquidation-preferences/${userId}`, token);
          if (response.ok) {
            const data = await response.json();
            setColumnsOrder(data.columns);
          } else {
            console.error("Error al cargar las preferencias de columnas.");
          }
        }
      } catch (error) {
        console.error("Error al decodificar token o cargar preferencias:", error);
      }
    };

    fetchColumnPreferences();
  }, []);

  useEffect(() => {
    fetchLiquidacion();
  }, [fetchLiquidacion]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Obtiene la comisión guardada (sin cambios pendientes)
  const getSavedCommission = useCallback((liquidationContract) => {
    if (
      liquidationContract.overrideCommission !== null &&
      liquidationContract.overrideCommission !== undefined
    ) {
      return parseFloat(liquidationContract.overrideCommission);
    }
    if (
      liquidationContract.assignedCommissionAmount !== null &&
      liquidationContract.assignedCommissionAmount !== undefined
    ) {
      return parseFloat(liquidationContract.assignedCommissionAmount);
    }
    return 0;
  }, []);

  // Obtiene la comisión efectiva (considerando cambios pendientes)
  const getEffectiveCommission = useCallback((liquidationContract) => {
    const lcUuid = liquidationContract.uuid;

    // Si hay un cambio pendiente, usar ese valor
    if (pendingChanges.hasOwnProperty(lcUuid)) {
      const pendingValue = pendingChanges[lcUuid];
      if (pendingValue === "" || pendingValue === null) {
        // Si está vacío, usar la comisión asignada original
        return parseFloat(liquidationContract.assignedCommissionAmount || 0);
      }
      return parseFloat(pendingValue) || 0;
    }

    return getSavedCommission(liquidationContract);
  }, [pendingChanges, getSavedCommission]);

  // Verificar si hay cambios pendientes
  const hasPendingChanges = useMemo(() => {
    return Object.keys(pendingChanges).length > 0;
  }, [pendingChanges]);

  // Número de cambios pendientes
  const pendingChangesCount = useMemo(() => {
    return Object.keys(pendingChanges).length;
  }, [pendingChanges]);

  const totalLiquidationCommission = useMemo(() => {
    if (!liquidation?.liquidationContracts) return 0;
    return liquidation.liquidationContracts.reduce((sum, lc) => {
      return sum + getEffectiveCommission(lc);
    }, 0);
  }, [liquidation?.liquidationContracts, getEffectiveCommission]);

  function handleNameEditToggle() {
    if (!liquidation) return;
    if (isEditingLiquidationName) {
      // If cancelling, revert to original name
      setCurrentEditedLiquidationName(liquidation.name);
    } else {
      // If starting edit, set current name
      setCurrentEditedLiquidationName(liquidation.name || "");
    }
    setIsEditingLiquidationName(!isEditingLiquidationName);
  }

  async function handleNameSave() {
    if (
      !liquidation ||
      !currentEditedLiquidationName.trim() ||
      currentEditedLiquidationName.trim() === liquidation.name
    ) {
      setIsEditingLiquidationName(false);
      if (liquidation) setCurrentEditedLiquidationName(liquidation.name);
      return;
    }

    setSavingStates((prev) => ({ ...prev, liquidationName: true }));
    try {
      const jwtToken = getCookie("factura-token");
      const response = await authFetch(
        "PATCH",
        `liquidations/${liquidation.uuid}`,
        { name: currentEditedLiquidationName.trim() },
        jwtToken
      );

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || "Error al actualizar nombre.");
      }

      const updatedLiq = await response.json();
      setLiquidation((prev) => ({
        ...prev,
        ...updatedLiq,
        liquidationContracts: prev.liquidationContracts,
      }));
      setCurrentEditedLiquidationName(updatedLiq.name);
      setIsEditingLiquidationName(false);
      toast.success("Nombre de liquidación actualizado.", {
        position: "top-right",
        draggable: true,
        icon: false,
        hideProgressBar: false,
        autoClose: 5000,
        className: `transition-all transform hover:-translate-y-1 hover:shadow-l border border-gray-400`,
      });
    } catch (err) {
      toast.error(err.message);
      if (liquidation) setCurrentEditedLiquidationName(liquidation.name);
    } finally {
      setSavingStates((prev) => ({ ...prev, liquidationName: false }));
    }
  }

  const filteredContracts = useMemo(() => {
    if (!liquidation?.liquidationContracts) return [];

    let filtered = liquidation.liquidationContracts;

    if (searchTerm.trim()) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter((lc) => {
        const contract = lc.contract;
        const customer = contract?.customer;
        const agent = contract?.user;
        const rate = contract?.rate;
        const company = contract?.company;

        return (
          contract?.cups?.toLowerCase().includes(lowerSearchTerm) ||
          customer?.name?.toLowerCase().includes(lowerSearchTerm) ||
          customer?.surnames?.toLowerCase().includes(lowerSearchTerm) ||
          customer?.nationalId?.toLowerCase().includes(lowerSearchTerm) ||
          customer?.cif?.toLowerCase().includes(lowerSearchTerm) ||
          agent?.name?.toLowerCase().includes(lowerSearchTerm) ||
          agent?.firstSurname?.toLowerCase().includes(lowerSearchTerm) ||
          rate?.name?.toLowerCase().includes(lowerSearchTerm) ||
          company?.name?.toLowerCase().includes(lowerSearchTerm) ||
          formatDate(contract?.createdAt).toLowerCase().includes(lowerSearchTerm) ||
          formatCurrency(getEffectiveCommission(lc)).toLowerCase().includes(lowerSearchTerm)
        );
      });
    }

    return filtered;
  }, [liquidation?.liquidationContracts, searchTerm, getEffectiveCommission]);

  const paginatedContracts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredContracts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredContracts, currentPage, itemsPerPage]);

  const totalPages = useMemo(() => {
    return Math.ceil((filteredContracts?.length || 0) / itemsPerPage);
  }, [filteredContracts, itemsPerPage]);

  // Maneja el cambio de valor en una celda de comisión
  const handleCommissionChange = (lcUuid, newValue) => {
    const lc = liquidation.liquidationContracts.find((l) => l.uuid === lcUuid);
    if (!lc) return;

    const originalValue = lc.overrideCommission !== null && lc.overrideCommission !== undefined
      ? String(lc.overrideCommission)
      : "";

    // Si el nuevo valor es igual al original, eliminar de pendingChanges
    if (newValue === originalValue) {
      setPendingChanges((prev) => {
        const updated = { ...prev };
        delete updated[lcUuid];
        return updated;
      });
    } else {
      // Agregar o actualizar en pendingChanges
      setPendingChanges((prev) => ({
        ...prev,
        [lcUuid]: newValue,
      }));
    }
  };

  // Obtiene el valor a mostrar en el input de una fila
  const getInputValue = (lc) => {
    if (pendingChanges.hasOwnProperty(lc.uuid)) {
      return pendingChanges[lc.uuid];
    }
    return lc.overrideCommission !== null && lc.overrideCommission !== undefined
      ? String(lc.overrideCommission)
      : "";
  };

  // Verifica si una fila tiene cambios pendientes
  const hasRowChanged = (lcUuid) => {
    return pendingChanges.hasOwnProperty(lcUuid);
  };

  // Cancelar todos los cambios pendientes
  const handleCancelAllChanges = () => {
    setPendingChanges({});
  };

  // Guardar todos los cambios en batch
  async function handleSaveAllChanges() {
    if (!hasPendingChanges) return;

    // Validar todos los valores
    for (const [lcUuid, value] of Object.entries(pendingChanges)) {
      if (value !== "" && isNaN(parseFloat(value))) {
        toast.error("Hay valores de comisión inválidos. Por favor, revisa los campos marcados.");
        return;
      }
    }

    setIsSavingBatch(true);
    const jwtToken = getCookie("factura-token");
    let successCount = 0;
    let errorCount = 0;

    try {
      // Ejecutar todas las actualizaciones en paralelo
      const updatePromises = Object.entries(pendingChanges).map(async ([lcUuid, value]) => {
        const newCommissionValue = value === "" ? null : parseFloat(value);

        try {
          const response = await authFetch(
            "PATCH",
            `liquidation-contracts/${lcUuid}`,
            { overrideCommission: newCommissionValue },
            jwtToken
          );

          if (!response.ok) {
            throw new Error("Error al actualizar");
          }

          const updatedLc = await response.json();
          return { success: true, lcUuid, updatedLc };
        } catch (err) {
          return { success: false, lcUuid, error: err };
        }
      });

      const results = await Promise.all(updatePromises);

      // Procesar resultados
      const successfulUpdates = results.filter((r) => r.success);
      const failedUpdates = results.filter((r) => !r.success);

      successCount = successfulUpdates.length;
      errorCount = failedUpdates.length;

      // Actualizar estado local con las actualizaciones exitosas
      if (successfulUpdates.length > 0) {
        setLiquidation((prev) => ({
          ...prev,
          liquidationContracts: prev.liquidationContracts.map((lc) => {
            const update = successfulUpdates.find((u) => u.lcUuid === lc.uuid);
            if (update) {
              return {
                ...lc,
                overrideCommission: update.updatedLc.overrideCommission,
                updatedAt: update.updatedLc.updatedAt,
              };
            }
            return lc;
          }),
        }));

        // Limpiar los cambios exitosos de pendingChanges
        setPendingChanges((prev) => {
          const updated = { ...prev };
          successfulUpdates.forEach((u) => delete updated[u.lcUuid]);
          return updated;
        });
      }

      // Mostrar resultado
      if (errorCount === 0) {
        toast.success(`${successCount} comisión(es) actualizada(s) correctamente.`, {
          position: "top-right",
          autoClose: 5000,
        });
      } else if (successCount === 0) {
        toast.error(`Error al actualizar las comisiones. Ningún cambio fue guardado.`);
      } else {
        toast.warning(
          `${successCount} comisión(es) actualizada(s), ${errorCount} error(es). Revisa los cambios pendientes.`
        );
      }
    } catch (err) {
      toast.error("Error al guardar los cambios: " + err.message);
    } finally {
      setIsSavingBatch(false);
    }
  }

  const handleDeleteLiquidationContract = async (lcUuid) => {
    if (
      !window.confirm("¿Estás seguro de que quieres desvincular este contrato de la liquidación?")
    )
      return;

    setSavingStates((prev) => ({ ...prev, [lcUuid + "_delete"]: true }));
    try {
      const jwtToken = getCookie("factura-token");
      const response = await authFetch("DELETE", `liquidation-contracts/${lcUuid}`, {}, jwtToken);
      if (!response.ok) {
        if (response.status !== 204) {
          const errData = await response
            .json()
            .catch(() => ({ message: "Error al eliminar contrato" }));
          throw new Error(errData.message);
        }
      }
      setLiquidation((prev) => ({
        ...prev,
        liquidationContracts: prev.liquidationContracts.filter((lc) => lc.uuid !== lcUuid),
      }));
      toast.success("Contrato desvinculado de la liquidación.", {
        position: "top-right",
        draggable: true,
        icon: false,
        hideProgressBar: false,
        autoClose: 5000,
        className: `transition-all transform hover:-translate-y-1 hover:shadow-l border border-gray-400`,
      });
      if (paginatedContracts.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingStates((prev) => ({ ...prev, [lcUuid + "_delete"]: false }));
    }
  };

  const handleSelectContract = (lcUuid) => {
    setSelectedContracts((prev) =>
      prev.includes(lcUuid) ? prev.filter((uuid) => uuid !== lcUuid) : [...prev, lcUuid]
    );
  };

  const handleSelectAllContracts = () => {
    if (selectedContracts.length === filteredContracts.length) {
      setSelectedContracts([]);
    } else {
      setSelectedContracts(filteredContracts.map((lc) => lc.uuid));
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedContracts.length) return;

    if (
      !window.confirm(
        `¿Estás seguro de que quieres desvincular ${selectedContracts.length} contratos de la liquidación?`
      )
    ) {
      return;
    }

    setSavingStates((prev) => ({ ...prev, bulkDelete: true }));
    try {
      const jwtToken = getCookie("factura-token");
      const promises = selectedContracts.map((lcUuid) =>
        authFetch("DELETE", `liquidation-contracts/${lcUuid}`, {}, jwtToken)
      );

      await Promise.all(promises);

      setLiquidation((prev) => ({
        ...prev,
        liquidationContracts: prev.liquidationContracts.filter(
          (lc) => !selectedContracts.includes(lc.uuid)
        ),
      }));

      toast.success(`${selectedContracts.length} contratos desvinculados correctamente.`);
      setSelectedContracts([]);
    } catch (err) {
      toast.error("Error al desvincular los contratos.");
    } finally {
      setSavingStates((prev) => ({ ...prev, bulkDelete: false }));
      setIsDropdownOpen(false);
    }
  };

  const handleBulkEditCommission = async () => {
    if (!selectedContracts.length) return;

    const newCommission = prompt(
      "Introduce el nuevo valor de comisión para todos los contratos seleccionados (deja vacío para cálculo automático):"
    );
    if (newCommission === null) return;

    const commissionValue = newCommission.trim() === "" ? null : parseFloat(newCommission);
    if (newCommission.trim() !== "" && isNaN(commissionValue)) {
      toast.error(
        "Por favor, introduce un número válido para la comisión o déjalo vacío para cálculo automático."
      );
      return;
    }

    setSavingStates((prev) => ({ ...prev, bulkCommission: true }));
    try {
      const jwtToken = getCookie("factura-token");
      const promises = selectedContracts.map((lcUuid) =>
        authFetch(
          "PATCH",
          `liquidation-contracts/${lcUuid}`,
          { overrideCommission: commissionValue },
          jwtToken
        )
      );

      const results = await Promise.all(promises);
      const updatedContracts = await Promise.all(results.map((r) => r.json()));

      setLiquidation((prev) => ({
        ...prev,
        liquidationContracts: prev.liquidationContracts.map((lc) => {
          const updated = updatedContracts.find((uc) => uc.uuid === lc.uuid);
          return updated ? { ...lc, ...updated } : lc;
        }),
      }));

      toast.success(`Comisiones actualizadas para ${selectedContracts.length} contratos.`);
      setSelectedContracts([]);
    } catch (err) {
      toast.error("Error al actualizar las comisiones.");
    } finally {
      setSavingStates((prev) => ({ ...prev, bulkCommission: false }));
      setIsDropdownOpen(false);
    }
  };

  const handleDownloadExcel = async () => {
    if (!liquidation?.liquidationContracts || liquidation.liquidationContracts.length === 0) {
      toast.warn("No hay contratos para exportar.");
      return;
    }

    setIsDownloadingExcel(true);
    try {
      const contractsDataForExcel = liquidation.liquidationContracts.map((lc) => {
        const contract = lc.contract;
        const customer = contract?.customer;
        const agent = contract?.user;
        const rate = contract?.rate;
        const company = contract?.company;
        const effectiveCommission = getEffectiveCommission(lc);

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
        "Importe (€)": totalEffectiveCommission,
      });

      let sheetName = `Contratos Liq ${liquidation.name}`;
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

      const safeFilenamePart = liquidation.name.replace(/[^a-z0-9]/gi, "_").substring(0, 50);

      XLSX.writeFile(
        workbook,
        `Liquidacion_${safeFilenamePart}_${liquidation.uuid.substring(0, 8)}.xlsx`
      );

      toast.success("Excel generado correctamente.", {
        position: "top-right",
        draggable: true,
        icon: false,
        hideProgressBar: false,
        autoClose: 5000,
        className: `transition-all transform hover:-translate-y-1 hover:shadow-l border border-gray-400`,
      });
    } catch (error) {
      console.error("Error al generar Excel de liquidación:", error);
      toast.error(`Error al generar Excel: ${error.message}`);
    } finally {
      setIsDownloadingExcel(false);
    }
  };

  const columnsConfig = {
    contractDate: {
      header: "Fecha Cont.",
      render: (lc) => formatDate(lc.contract?.createdAt),
    },
    userName: {
      header: "Agente",
      render: (lc) => {
        const user = lc.contract?.user;
        return user ? `${user.name} ${user.firstSurname || ""}`.trim() : "-";
      },
    },
    customerFullName: {
      header: "Cliente",
      render: (lc) => {
        const customer = lc.contract?.customer;
        return customer ? `${customer.name} ${customer.surnames || ""}`.trim() : "-";
      },
    },
    cups: {
      header: "CUPS",
      render: (lc) => lc.contract?.cups || "-",
    },
    customerPhoneNumber: {
      header: "Teléfono",
      render: (lc) => lc.contract?.customer?.phoneNumber || "-",
    },
    customerEmail: {
      header: "Email",
      render: (lc) => lc.contract?.customer?.email || "-",
    },
    customerAddress: {
      header: "Dirección",
      render: (lc) => lc.contract?.customer?.address || "-",
    },
    customerIban: {
      header: "IBAN",
      render: (lc) => lc.contract?.customer?.iban || "-",
    },
    customerNationalId: {
      header: "DNI/CIF",
      render: (lc) => lc.contract?.customer?.nationalId || lc.contract?.customer?.cif || "-",
    },
    electronicBill: {
      header: "E-Factura",
      render: (lc) => (lc.contract?.electronicBill ? "Sí" : "No"),
    },
    rateName: {
      header: "Tarifa",
      render: (lc) => {
        if (lc.contract?.type === "Telefonía") {
          return (
            <ul>
              {lc.contract?.telephonyData?.rates?.map((rate, index) => (
                <li key={index}>{rate.name || "Tarifa sin nombre"}</li>
              )) || <li>Sin tarifas disponibles</li>}
            </ul>
          );
        } else {
          return <span>{lc.contract?.rate?.name || "Sin tarifa"}</span>;
        }
      },
    },
    ratePowerSlot1: {
      header: "Potencias contratadas",
      render: (lc) => {
        if (
          Array.isArray(lc.contract?.contractedPowers) &&
          lc.contract?.contractedPowers?.length > 0
        ) {
          return (
            <ul>
              {contract.contractedPowers.map((power, index) => (
                <li key={index}>{power} kW</li>
              ))}
            </ul>
          );
        } else {
          return <span>-</span>;
        }
      },
    },
    expiresAt: {
      header: "Retro",
      render: (lc) => {
        if (!lc.contract?.expiresAt) {
          return "";
        }

        const today = new Date();
        const expiresDate = new Date(lc.contract?.expiresAt);
        const diffTime = expiresDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return diffDays >= 0 ? `En ${diffDays} días` : `Expirado (${Math.abs(diffDays)} días)`;
      },
    },
    extraInfo: {
      header: "Observaciones",
      render: (lc) => lc.contract?.extraInfo || "-",
    },
    contractStateName: {
      header: "Estado",
      render: (lc) => {
        return (
          <>
            {lc.contract?.isDraft ? (
              <div className="relative w-full">
                <button className="flex justify-center items-center px-4 py-2 bg-backgroundHoverBold rounded-md text-black w-full">
                  <span
                    className="inline-block w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: "#c3c1b9" }}
                  ></span>
                  Borrador
                </button>
              </div>
            ) : (
              <div className="relative w-full dropdown-container">
                <button
                  type="button"
                  className="flex justify-center items-center px-4 py-2 bg-backgroundHoverBold rounded-md text-black w-full"
                >
                  <span
                    className="inline-block w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: lc.contract?.contractState?.colorHex }}
                  ></span>
                  {lc.contract?.contractState?.name || "-"}
                </button>
              </div>
            )}
          </>
        );
      },
    },
    payed: {
      header: "Pagado",
      render: (lc) => (lc.contract?.payed ? "Sí" : "No"),
    },
    channelName: {
      header: "Canal",
      render: (lc) => lc.contract?.channel?.name || lc.contract?.rate?.channel?.name || "-",
    },
    company: {
      header: "Compañía",
      render: (lc) => lc.contract?.company?.name || "-",
    },
    updatedAt: {
      header: "Fecha",
      render: (lc) => formatDate(lc.contract?.createdAt),
    },
  };

  if (loading && !liquidation) {
    return (
      <div className="flex justify-center items-center min-h-screen text-slate-800 dark:text-slate-100">
        <FaSpinner className="animate-spin text-blue-600 text-4xl" />
        <p className="ml-3 text-xl">Cargando datos de la liquidación...</p>
      </div>
    );
  }

  if (error && !liquidation) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-4xl mx-auto neumorphic-card p-6 rounded-lg">
          <h2 className="text-2xl font-semibold text-red-600 mb-4">Error</h2>
          <p className="text-red-700">{error.message || "Ocurrió un error al cargar los datos."}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-primary text-white px-5 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all font-medium"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!liquidation) {
    return (
      <div className="min-h-screen p-6 text-center text-slate-800 dark:text-slate-100">No se encontró la liquidación.</div>
    );
  }

  return (
    <div className="min-h-screen text-slate-800 dark:text-slate-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto neumorphic-card p-6 rounded-lg">
        {/* Liquidation Header */}
        <div className="flex flex-col gap-2 pb-4 border-b border-gray-200 dark:border-gray-700 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2 flex-grow min-w-[200px]">
              {isEditingLiquidationName ? (
                <>
                  <input
                    type="text"
                    value={currentEditedLiquidationName}
                    onChange={(e) => setCurrentEditedLiquidationName(e.target.value)}
                    className="neumorphic-card-inset text-2xl md:text-3xl font-bold p-2 border-none rounded-lg focus:ring-2 focus:ring-primary focus:ring-opacity-50 bg-transparent flex-grow text-slate-800 dark:text-slate-100"
                    autoFocus
                    onKeyDown={(e) => e.key === "Enter" && handleNameSave()}
                  />
                  <button
                    onClick={handleNameSave}
                    disabled={savingStates.liquidationName}
                    className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 shadow-md"
                    title="Guardar nombre"
                  >
                    {savingStates.liquidationName ? (
                      <FaSpinner className="animate-spin" />
                    ) : (
                      <FaSave />
                    )}
                  </button>
                  <button
                    onClick={handleNameEditToggle}
                    disabled={savingStates.liquidationName}
                    className="p-2 shadow-neumorphic-light dark:shadow-neumorphic-dark hover:shadow-neumorphic-inset-light dark:hover:shadow-neumorphic-inset-dark text-slate-700 dark:text-slate-300 rounded-lg transition-colors disabled:opacity-50"
                    title="Cancelar edición"
                  >
                    <FaTimes />
                  </button>
                </>
              ) : (
                <>
                  <h1
                    className="text-2xl md:text-3xl font-bold cursor-pointer hover:text-blue-600 transition-colors break-all text-slate-800 dark:text-slate-100"
                    onClick={handleNameEditToggle}
                    title="Editar nombre de la liquidación"
                  >
                    {liquidation.name}
                  </h1>
                  <button
                    onClick={handleNameEditToggle}
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-1 transition-colors"
                    title="Editar nombre"
                  >
                    <FaEdit size={20} />
                  </button>
                </>
              )}
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              <p>
                <strong>Fecha:</strong> {formatDate(liquidation.date)}
              </p>
              <p>
                <strong>Estado:</strong>{" "}
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    liquidation.status === "PAGADA"
                      ? "bg-green-100 text-green-700"
                      : liquidation.status === "EN REVISION"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {liquidation.status}
                </span>
              </p>
              {liquidation.user && (
                <p>
                  <strong>Creado por:</strong> {liquidation.user.name}{" "}
                  {liquidation.user.firstSurname}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              className="bg-primary text-white px-5 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all font-medium max-w-64 self-start"
              onClick={() => router.push(`/emitir-factura?liquidationUuid=${liquidation.uuid}`)}
            >
              Exportar como factura
            </button>
            <button
              type="button"
              className="bg-green-600 text-white px-5 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all font-medium max-w-64 self-start flex items-center gap-2"
              onClick={handleDownloadExcel}
              disabled={isDownloadingExcel}
            >
              {isDownloadingExcel ? <FaSpinner className="animate-spin" /> : <FaDownload />}
              Exportar Excel
            </button>
            <button
              type="button"
              className="bg-blue-600 text-white px-5 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all font-medium max-w-64 self-start flex items-center gap-2"
              onClick={() => setIsAddContractModalOpen(true)}
            >
              <FaPlus />
              Agregar contrato
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-6 mb-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar por CUPS, cliente, agente, tarifa, fecha, importe..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="neumorphic-card-inset px-4 py-3 pl-10 rounded-lg border-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 bg-transparent w-full text-slate-800 dark:text-slate-100"
            />
          </div>
          {searchTerm && (
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {filteredContracts.length} resultados encontrados
            </p>
          )}
        </div>

        {/* Bulk Actions */}
        <div className="mb-4 flex items-center justify-between">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={selectedContracts.length === filteredContracts.length}
              onChange={handleSelectAllContracts}
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span className="text-sm text-slate-700 dark:text-slate-300">Seleccionar todos</span>
          </label>

          {selectedContracts.length > 0 && (
            <div ref={dropdownRef} className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="bg-primary text-white px-5 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all font-medium flex items-center space-x-2"
                disabled={savingStates.bulkDelete || savingStates.bulkCommission}
              >
                {savingStates.bulkDelete || savingStates.bulkCommission ? (
                  <FaSpinner className="animate-spin" />
                ) : (
                  <>
                    <span>Acciones</span>
                    <FaChevronDown />
                  </>
                )}
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 neumorphic-card rounded-lg z-10">
                  <button
                    onClick={handleBulkEditCommission}
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-t-lg"
                  >
                    Editar comisiones
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    Desvincular contratos
                  </button>
                  <hr className="border-gray-200 dark:border-gray-700" />
                  <button
                    onClick={() => {
                      router.push(`/contratos?liquidacion=${uuid}`);
                      setIsDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-b-lg flex items-center gap-2"
                  >
                    <span className="material-icons text-base">list_alt</span>
                    Ver en listado de contratos
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Liquidation Contracts Table */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-100">Contratos en esta Liquidación</h2>
          {filteredContracts && filteredContracts.length > 0 ? (
            <>
              <div className="overflow-x-auto neumorphic-card rounded-lg">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-background">
                    <tr>
                      {/* Cabeceras dinámicas basadas en las preferencias */}
                      {columnsOrder.map((columnKey) => (
                        <th
                          key={columnKey}
                          scope="col"
                          className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider"
                        >
                          {liquidationColumnsConfig[columnKey]?.header || columnKey}
                        </th>
                      ))}
                      {/* Cabeceras fijas para Importe y Acciones */}
                      <th
                        scope="col"
                        className="px-4 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider"
                      >
                        Importe
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {paginatedContracts.map((lc) => {
                      const effectiveComm = getEffectiveCommission(lc);
                      return (
                        <tr key={lc.uuid} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                          {/* Celdas dinámicas basadas en las preferencias */}
                          {columnsOrder.map((columnKey) => (
                            <td
                              key={columnKey}
                              className="px-4 py-3 whitespace-nowrap text-sm text-slate-700 dark:text-slate-300"
                            >
                              {liquidationColumnsConfig[columnKey]?.render(lc) ?? "—"}
                            </td>
                          ))}
                          {/* Celdas fijas para Importe y Acciones */}
                          <td className={`px-4 py-3 whitespace-nowrap text-sm text-right ${
                            hasRowChanged(lc.uuid) ? "bg-amber-50 dark:bg-amber-900/20" : ""
                          }`}>
                            <input
                              type="number"
                              step="0.01"
                              placeholder={formatCurrency(lc.assignedCommissionAmount || 0)}
                              value={getInputValue(lc)}
                              onChange={(e) => handleCommissionChange(lc.uuid, e.target.value)}
                              className={`w-28 p-1.5 border rounded-lg text-right text-sm bg-transparent transition-all ${
                                hasRowChanged(lc.uuid)
                                  ? "border-amber-400 dark:border-amber-500 ring-1 ring-amber-300 dark:ring-amber-600"
                                  : "border-slate-200 dark:border-slate-600 hover:border-primary focus:border-primary focus:ring-1 focus:ring-primary"
                              } text-slate-800 dark:text-slate-100`}
                              onClick={(e) => e.stopPropagation()}
                              disabled={isSavingBatch}
                            />
                            {hasRowChanged(lc.uuid) && (
                              <span className="ml-1 text-amber-500 text-xs">●</span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                            <div className="flex items-center justify-center space-x-2">
                              <button
                                onClick={() => handleDeleteLiquidationContract(lc.uuid)}
                                disabled={savingStates[lc.uuid + "_delete"] || isSavingBatch}
                                className="text-red-500 hover:text-red-700 disabled:opacity-50"
                                title="Desvincular Contrato"
                              >
                                {savingStates[lc.uuid + "_delete"] ? (
                                  <FaSpinner className="animate-spin" />
                                ) : (
                                  <FaTrashAlt size={16} />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="mt-4 flex justify-between items-center">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="shadow-neumorphic-light dark:shadow-neumorphic-dark hover:shadow-neumorphic-inset-light dark:hover:shadow-neumorphic-inset-dark px-3 py-1.5 text-sm rounded-lg disabled:opacity-50 flex items-center text-slate-700 dark:text-slate-300"
                  >
                    <FaChevronLeft size={12} className="mr-1" /> Anterior
                  </button>
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    Página {currentPage} de {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="shadow-neumorphic-light dark:shadow-neumorphic-dark hover:shadow-neumorphic-inset-light dark:hover:shadow-neumorphic-inset-dark px-3 py-1.5 text-sm rounded-lg disabled:opacity-50 flex items-center text-slate-700 dark:text-slate-300"
                  >
                    Siguiente <FaChevronRight size={12} className="ml-1" />
                  </button>
                </div>
              )}

              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                <div className="text-right">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Total Liquidación:</p>
                  <p className="text-xl font-bold text-slate-800 dark:text-slate-100">
                    {formatCurrency(totalLiquidationCommission)}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <p className="text-slate-500 dark:text-slate-400">
              {searchTerm
                ? "No se encontraron contratos con los criterios de búsqueda."
                : "No hay contratos vinculados a esta liquidación."}
            </p>
          )}
        </div>
      </div>

      {/* Modal para agregar contratos por CUPS */}
      {isAddContractModalOpen && (
        <AddContractByCupsModal
          liquidationUuid={uuid}
          onClose={() => setIsAddContractModalOpen(false)}
          onContractsAdded={fetchLiquidacion}
        />
      )}

      {/* Barra sticky para guardar cambios pendientes */}
      {hasPendingChanges && (
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 shadow-lg z-40">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 text-sm font-semibold">
                {pendingChangesCount}
              </span>
              <span className="text-sm text-slate-600 dark:text-slate-300">
                {pendingChangesCount === 1
                  ? "Hay 1 cambio pendiente"
                  : `Hay ${pendingChangesCount} cambios pendientes`}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleCancelAllChanges}
                disabled={isSavingBatch}
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors font-medium disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveAllChanges}
                disabled={isSavingBatch}
                className="px-5 py-2 rounded-lg bg-primary text-white font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {isSavingBatch ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <FaSave />
                    Guardar cambios
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
