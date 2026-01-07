"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { getCookie } from "cookies-next";
import * as jose from "jose";
import { authGetFetch, authFetch } from "@/helpers/server-fetch.helper";
import ContractStatesDropdown from "@/components/contract-states.dropdown";
import ChannelsDropdown from "@/components/channels.dropdown";
import InlineStateSelector from "@/components/inline-state-selector";
import SearchBox from "@/components/searchbox.form";
import ContractsDocumentsModal from "@/components/contracts-documents.modal";
import { formatDayDate } from "@/helpers/dates.helper";
import ContractsTypeModal from "@/components/contracts-type.modal";
import CommunicationModal from "@/components/communication.modal";
import { toast } from "react-toastify";
import { getNotificationDisplayProps } from "../../helpers/notification.helper";
import ChangeStateModal from "@/components/change-state.modal";
import ChangeChannelModal from "@/components/change-channel.modal";
import {
  NeumorphicCard,
  NeumorphicButton,
  NeumorphicInput,
} from "@/components/neumorphic";

const formatDateToYYYYMMDD = (date) => {
  if (!date) return "";
  const d = new Date(date);
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getFullName = (user) => {
  if (!user) return "";
  return `${user.name} ${user.firstSurname || ""} ${user.secondSurname || ""}`
    .replace(/\s+/g, " ")
    .trim();
};

// Column configuration for dynamic table rendering
const COLUMN_CONFIG = {
  userName: {
    label: "Agente",
    render: (contract) => `${contract.user?.name || ""} ${contract.user?.firstSurname || ""}`,
  },
  customerFullName: {
    label: "Cliente",
    render: (contract) => (
      <div className="flex items-center">
        <div className="w-8 h-8 rounded-full neumorphic-card p-0.5 flex items-center justify-center mr-3">
          <span className="material-icons-outlined text-xl text-slate-500">person</span>
        </div>
        <div>
          <p className="font-medium text-slate-800 dark:text-slate-200">
            {contract.customer?.name || ""} {contract.customer?.surnames || ""}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {contract.customer?.email || ""}
          </p>
        </div>
      </div>
    ),
  },
  cups: {
    label: "CUPS",
    render: (contract) => (
      <span className="font-mono text-sm">{contract.cups || "-"}</span>
    ),
  },
  customerPhoneNumber: {
    label: "Teléfono",
    render: (contract) => contract.customer?.phoneNumber || "-",
  },
  customerEmail: {
    label: "Email",
    render: (contract) => contract.customer?.email || "-",
  },
  customerAddress: {
    label: "Dirección",
    render: (contract) => contract.customer?.address || "-",
  },
  customerIban: {
    label: "IBAN",
    render: (contract) => contract.customer?.iban || "-",
  },
  customerNationalId: {
    label: "DNI/CIF",
    render: (contract) => contract.customer?.nationalId || contract.customer?.cif || "-",
  },
  electronicBill: {
    label: "E-FACT",
    render: (contract) => (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${contract.electronicBill ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
        {contract.electronicBill ? "Sí" : "No"}
      </span>
    ),
  },
  rateName: {
    label: "Tarifa",
    render: (contract) => contract.rate?.name || "-",
  },
  ratePowerSlot1: {
    label: "Potencia",
    render: (contract) => contract.rate?.powerSlot1 || "-",
  },
  expiresAt: {
    label: "Retro",
    render: (contract, formatDayDate) => contract.expiresAt ? formatDayDate(contract.expiresAt) : "-",
  },
  extraInfo: {
    label: "Observaciones",
    render: (contract) => (
      <span className="max-w-[150px] truncate inline-block" title={contract.extraInfo || ""}>
        {contract.extraInfo || "-"}
      </span>
    ),
  },
  contractStateName: {
    label: "Estado",
    render: (contract, formatDayDate, context) => {
      // Solo Supervisores (isManager) o Admin (groupId === 1) pueden cambiar estados
      const canChangeState = context?.isManager || context?.userGroupId === 1;

      if (canChangeState && context?.contractStates && context?.onSingleStateChange) {
        return (
          <InlineStateSelector
            contractStates={context.contractStates}
            currentState={contract.contractState}
            onStateChange={(newState) => context.onSingleStateChange(contract.uuid, newState)}
            isLoading={context.updatingContractUuid === contract.uuid}
          />
        );
      }
      // Para agentes normales, mostrar solo el estado sin opción de cambio
      return (
        <span
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
          style={{
            backgroundColor: contract.contractState?.colorHex
              ? `${contract.contractState.colorHex}20`
              : "rgb(var(--primary) / 0.2)",
            color: contract.contractState?.colorHex || "rgb(var(--primary))",
          }}
        >
          {contract.contractState?.colorHex && (
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: contract.contractState.colorHex }}
            />
          )}
          {contract.contractState?.name || "Sin estado"}
        </span>
      );
    },
  },
  payed: {
    label: "Pagado",
    render: (contract) => (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${contract.payed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-500"}`}>
        {contract.payed ? "Sí" : "No"}
      </span>
    ),
  },
  channelName: {
    label: "Canal",
    render: (contract) => contract?.channel?.name || contract?.rate?.channel?.name || "No asignado",
  },
  companyName: {
    label: "Compañía",
    render: (contract) => contract?.company?.name || "-",
  },
  updatedAt: {
    label: "Fecha",
    render: (contract, formatDayDate) => formatDayDate(contract.updatedAt),
  },
  type: {
    label: "Tipo",
    render: (contract) => contract.type || "-",
  },
  createdAt: {
    label: "Creado",
    render: (contract, formatDayDate) => formatDayDate(contract.createdAt),
  },
};

// Default columns if user has no preferences
const DEFAULT_COLUMNS = [
  "customerFullName",
  "cups",
  "type",
  "contractStateName",
  "channelName",
  "userName",
  "updatedAt",
];

const CreateLiquidationSubModal = ({ isOpen, onClose, onSubmit, users, isLoading }) => {
  const [nombre, setNombre] = useState("");
  const [date, setDate] = useState(formatDateToYYYYMMDD(new Date()));
  const [selectedUserIdForNewLiq, setSelectedUserIdForNewLiq] = useState("");

  useEffect(() => {
    if (isOpen) {
      setNombre("");
      setDate(formatDateToYYYYMMDD(new Date()));
      if (users.length > 0 && users[0]?.id) {
        setSelectedUserIdForNewLiq(users[0].id.toString());
      } else {
        setSelectedUserIdForNewLiq("");
      }
    }
  }, [isOpen, users]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nombre.trim() || !date.trim()) {
      toast.error("Nombre y Fecha son requeridos.");
      return;
    }

    if (users.length > 0 && !selectedUserIdForNewLiq) {
      toast.error("Por favor, seleccione un usuario para la liquidación.");
      return;
    }

    onSubmit({
      name: nombre,
      date: date,
      userId: users.length > 0 ? parseInt(selectedUserIdForNewLiq) : null,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[60] p-4">
      <div className="neumorphic-card p-8 rounded-xl w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            Crear Nueva Liquidación
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg neumorphic-button"
            disabled={isLoading}
          >
            <span className="material-icons-outlined">close</span>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Nombre de liquidación
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full neumorphic-card-inset p-3 rounded-lg border-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 bg-transparent"
              required
              disabled={isLoading}
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Fecha
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full neumorphic-card-inset p-3 rounded-lg border-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 bg-transparent"
              required
              disabled={isLoading}
            />
          </div>
          {users.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Asignar a Usuario
              </label>
              <div className="neumorphic-card-inset rounded-lg">
                <select
                  value={selectedUserIdForNewLiq}
                  onChange={(e) => setSelectedUserIdForNewLiq(e.target.value)}
                  className="w-full bg-transparent border-none focus:ring-0 p-3 text-slate-800 dark:text-slate-200"
                  required
                  disabled={isLoading}
                >
                  {users.map((user) => (
                    <option key={user.id} value={user.id.toString()}>
                      {getFullName(user)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-lg neumorphic-button font-medium text-slate-600 dark:text-slate-400"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg neumorphic-button active bg-primary text-white font-semibold"
              disabled={isLoading}
            >
              {isLoading && <span className="material-icons-outlined animate-spin mr-2 text-sm">refresh</span>}
              Crear
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AddToLiquidationModal = ({ onClose, selectedContracts, setSelectedContracts }) => {
  const [allLiquidations, setAllLiquidations] = useState([]);
  const [selectedLiquidation, setSelectedLiquidation] = useState(null);
  const [isCreateLiquidationModalOpen, setIsCreateLiquidationModalOpen] = useState(false);
  const [usersForNewLiquidation, setUsersForNewLiquidation] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingLiquidations, setIsLoadingLiquidations] = useState(false);
  const [isCreatingLiquidation, setIsCreatingLiquidation] = useState(false);

  const fetchAllLiquidations = async () => {
    setIsLoadingLiquidations(true);
    const jwtToken = getCookie("factura-token");
    try {
      const response = await authGetFetch("liquidations", jwtToken);
      if (!response.ok) {
        toast.error("Error al cargar las liquidaciones existentes.");
        setAllLiquidations([]);
        return [];
      }
      const liquidationsData = await response.json();
      setAllLiquidations(liquidationsData);

      if (
        liquidationsData &&
        liquidationsData.length > 0 &&
        (!selectedLiquidation || !liquidationsData.find((l) => l.uuid === selectedLiquidation))
      ) {
        setSelectedLiquidation(liquidationsData[0].uuid);
      } else if (liquidationsData.length === 0) {
        setSelectedLiquidation(null);
      }
      return liquidationsData;
    } catch (error) {
      console.error("Error al obtener las liquidaciones:", error);
      toast.error("Error crítico al obtener las liquidaciones.");
      setAllLiquidations([]);
      return [];
    } finally {
      setIsLoadingLiquidations(false);
    }
  };

  useEffect(() => {
    fetchAllLiquidations();
  }, []);

  const fetchUsersForSubModal = async () => {
    if (usersForNewLiquidation.length > 0 && !isLoadingUsers) return;
    setIsLoadingUsers(true);
    const jwtToken = getCookie("factura-token");
    try {
      const response = await authGetFetch("users/agents-and-supervisors", jwtToken);
      if (!response.ok) {
        toast.error("Error al cargar usuarios para la nueva liquidación.");
        setUsersForNewLiquidation([]);
        return;
      }
      const usersData = await response.json();
      setUsersForNewLiquidation(usersData || []);
    } catch (error) {
      console.error("Error al obtener usuarios:", error);
      toast.error("Error crítico al obtener usuarios.");
      setUsersForNewLiquidation([]);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleOpenCreateLiquidationModal = () => {
    fetchUsersForSubModal();
    setIsCreateLiquidationModalOpen(true);
  };

  const handleCloseCreateLiquidationModal = () => {
    setIsCreateLiquidationModalOpen(false);
  };

  const handleCreateNewLiquidation = async (newLiquidationData) => {
    setIsCreatingLiquidation(true);
    const jwtToken = getCookie("factura-token");
    try {
      const payload = {
        name: newLiquidationData.name,
        date: newLiquidationData.date,
        userId: newLiquidationData.userId,
      };
      const response = await authFetch("POST", "liquidations", payload, jwtToken);

      if (!response.ok) {
        const errData = await response
          .json()
          .catch(() => ({ message: "Error desconocido al crear la liquidación." }));
        throw new Error(errData.message || "Error al crear la liquidación.");
      }

      const createdLiquidation = await response.json();
      toast.success(`Liquidación "${createdLiquidation.name}" creada correctamente.`);
      handleCloseCreateLiquidationModal();

      await fetchAllLiquidations();
      if (createdLiquidation && createdLiquidation.uuid) {
        setSelectedLiquidation(createdLiquidation.uuid);
      }
    } catch (err) {
      console.error("Error creando liquidación desde sub-modal:", err);
      toast.error(`Error al crear: ${err.message}`);
    } finally {
      setIsCreatingLiquidation(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedLiquidation) {
      toast.warn("Por favor, seleccione o cree una liquidación para continuar.");
      return;
    }
    const body = {
      liquidationUuid: selectedLiquidation,
      contractUuids: selectedContracts,
    };

    try {
      const jwtToken = getCookie("factura-token");
      const response = await authFetch("POST", `liquidation-contracts/`, body, jwtToken);

      if (!response.ok) {
        toast.error("Error al añadir los contratos a la liquidación.");
        return;
      }

      toast.success("Contratos añadidos a la liquidación correctamente.");
      setSelectedContracts([]);
      onClose();
    } catch (error) {
      console.error("Error al añadir los contratos a la liquidación (catch block):", error);
      toast.error(`Error de red o aplicación: ${error.message || "Ocurrió un error desconocido."}`);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
        <div className="neumorphic-card p-8 rounded-xl w-full max-w-md">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              Agregar a liquidación
            </h2>
            <button onClick={onClose} className="p-2 rounded-lg neumorphic-button">
              <span className="material-icons-outlined">close</span>
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="max-h-60 overflow-y-auto mb-4 pr-2">
              {allLiquidations.length > 0 ? (
                allLiquidations.map((liquidation) => (
                  <div key={liquidation.uuid} className="mb-3 p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/50">
                    <input
                      type="radio"
                      id={`liq-${liquidation.uuid}`}
                      name="liquidationSelection"
                      value={liquidation.uuid}
                      checked={selectedLiquidation === liquidation.uuid}
                      onChange={(e) => setSelectedLiquidation(e.target.value)}
                      className="mr-2 cursor-pointer accent-primary"
                    />
                    <label
                      htmlFor={`liq-${liquidation.uuid}`}
                      className="text-slate-700 dark:text-slate-300 cursor-pointer"
                    >
                      {liquidation.name}
                    </label>
                  </div>
                ))
              ) : (
                <div className="py-3 text-center text-slate-500 dark:text-slate-400">
                  No hay liquidaciones disponibles.
                </div>
              )}
            </div>

            <div className="my-5">
              <button
                type="button"
                onClick={handleOpenCreateLiquidationModal}
                className="w-full px-4 py-3 rounded-lg neumorphic-button bg-primary text-white font-semibold flex items-center justify-center"
                disabled={isLoadingUsers || isCreatingLiquidation}
              >
                {isLoadingUsers ? (
                  <span className="material-icons-outlined animate-spin mr-2">refresh</span>
                ) : (
                  <span className="material-icons-outlined mr-2">add</span>
                )}
                Crear Nueva Liquidación
              </button>
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-lg neumorphic-button font-medium text-slate-600 dark:text-slate-400"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg neumorphic-button active bg-primary text-white font-semibold"
                disabled={!selectedLiquidation || isCreatingLiquidation}
              >
                Añadir
              </button>
            </div>
          </form>
        </div>
      </div>

      {isCreateLiquidationModalOpen && (
        <CreateLiquidationSubModal
          isOpen={isCreateLiquidationModalOpen}
          onClose={handleCloseCreateLiquidationModal}
          onSubmit={handleCreateNewLiquidation}
          users={usersForNewLiquidation}
          isLoading={isCreatingLiquidation || isLoadingUsers}
        />
      )}
    </>
  );
};

function ReassignContractModal({ onClose, selectedContracts, onSuccess }) {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      const jwt = getCookie("factura-token");
      const res = await authGetFetch("users/visible-users", jwt);

      if (res.ok) {
        const response = await res.json();
        setUsers(response.users);
      }
    };
    fetchUsers();
  }, []);

  const handleSave = async () => {
    if (!selectedUserId) return;
    setIsSaving(true);
    const jwt = getCookie("factura-token");
    try {
      for (const contractUuid of selectedContracts) {
        await authFetch("POST", "contracts/clone", { contractUuid, userId: selectedUserId }, jwt);
      }
      toast.success("Contratos reasignados correctamente");
      onSuccess();
    } catch (e) {
      toast.error("Error al reasignar contratos");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="neumorphic-card p-8 rounded-xl w-full max-w-md">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4">
          Reasignar contrato
        </h2>
        <div className="neumorphic-card-inset rounded-lg mb-4">
          <select
            className="w-full bg-transparent border-none focus:ring-0 p-3 text-slate-800 dark:text-slate-200"
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
          >
            <option value="">Selecciona un usuario</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} {u.firstSurname} {u.secondSurname}
              </option>
            ))}
          </select>
        </div>
        <div className="flex justify-end space-x-3">
          <button
            className="px-5 py-2 rounded-lg neumorphic-button font-medium text-slate-600 dark:text-slate-400"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancelar
          </button>
          <button
            className="px-5 py-2 rounded-lg neumorphic-button active bg-primary text-white font-semibold"
            onClick={handleSave}
            disabled={!selectedUserId || isSaving}
          >
            {isSaving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Contracts() {
  const router = useRouter();

  const [contractStates, setContractStates] = useState([]);
  const [channels, setChannels] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [columnsOrder, setColumnsOrder] = useState([]);

  const [contractFilters, setContractFilters] = useState({});
  const [isFiltersApplied, setIsFiltersApplied] = useState(false);

  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [contractUuid, setContractUuid] = useState(null);

  const [isManager, setIsManager] = useState(false);
  const [userGroupId, setUserGroupId] = useState(null);
  const [loading, setLoading] = useState(true);

  const [isContractModalOpen, setIsContractModalOpen] = useState(false);

  const openModal = () => setIsContractModalOpen(true);
  const closeModal = () => setIsContractModalOpen(false);

  const handleCreateContract = (type) => {
    closeModal();
    if (type === "telefonia") {
      router.push("/nuevo-contrato-telefonia");
    } else if (type === "energia") {
      router.push("/nuevo-contrato");
    }
  };

  const [isStateChangeModalOpen, setIsStateChangeModalOpen] = useState(false);
  const [selectedStateForBatch, setSelectedStateForBatch] = useState(null);
  const [isChannelChangeModalOpen, setIsChannelChangeModalOpen] = useState(false);
  const [selectedChannelForBatch, setSelectedChannelForBatch] = useState(false);

  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    lastPage: 1,
  });
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [selectedContracts, setSelectedContracts] = useState([]);

  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [communications, setCommunications] = useState([]);
  const [communicationsCurrentIndex, setCommunicationsCurrentIndex] = useState(0);
  const [isCommunicationModalOpen, setIsCommunicationModalOpen] = useState(false);

  const [isDesktopDropdownOpen, setIsDesktopDropdownOpen] = useState(false);
  const [isAddToLiquidationOpen, setIsAddToLiquidationOpen] = useState(false);
  const dropdownDesktopRef = useRef(null);
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [updatingContractUuid, setUpdatingContractUuid] = useState(null);

  useEffect(() => {
    function onClickOutside(e) {
      if (dropdownDesktopRef.current && !dropdownDesktopRef.current.contains(e.target)) {
        setIsDesktopDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const toggleDesktop = () => setIsDesktopDropdownOpen((o) => !o);

  const getUserInfo = async () => {
    const jwtToken = getCookie("factura-token");

    if (!jwtToken) {
      setIsManager(false);
      setUserGroupId(null);
      return;
    }

    const payload = jose.decodeJwt(jwtToken);
    setIsManager(payload.isManager || false);
    setUserGroupId(payload.groupId || null);
  };

  const getContracts = async (page, entriesPerPage) => {
    const jwtToken = getCookie("factura-token");

    try {
      const response = await authGetFetch(
        `contracts?page=${page}&limit=${entriesPerPage}`,
        jwtToken
      );

      if (response.ok) {
        const contractsData = await response.json();
        setContracts(contractsData.contracts);
        setColumnsOrder(contractsData.columnsOrder);
        setPagination({
          total: contractsData.total,
          page: contractsData.page,
          lastPage: contractsData.lastPage,
        });
      } else {
        toast.error("Error al cargar los contratos");
      }
      setLoading(false);
    } catch (error) {
      console.error("Error al obtener los contratos:", error);
      setLoading(false);
    }
  };

  const getFilteredContracts = async (searchFilters, page = 1, entriesPerPage = 10) => {
    const jwtToken = getCookie("factura-token");

    try {
      const response = await authFetch(
        "POST",
        `search?page=${page}&limit=${entriesPerPage}`,
        searchFilters,
        jwtToken
      );

      if (response.ok) {
        const contractsData = await response.json();
        setContracts(contractsData.contracts);
        setPagination({
          total: contractsData.total,
          page: contractsData.page,
          lastPage: contractsData.lastPage,
        });
        setContractFilters(searchFilters);
        setIsFiltersApplied(true);
      } else {
        toast.error("Error al buscar los contratos filtrados");
      }
    } catch (error) {
      console.error("Error al buscar los contratos:", error);
    }
  };

  const fetchContracts = async (endpoint, method = "GET", body = null) => {
    try {
      const jwtToken = getCookie("factura-token");
      const response =
        method === "GET"
          ? await authGetFetch(endpoint, jwtToken)
          : await authFetch("POST", endpoint, body, jwtToken);

      if (!response.ok) {
        throw new Error("Error al obtener los contratos");
      }

      const contractsData = await response.json();
      return contractsData.contracts;
    } catch (error) {
      console.error(error.message);
      toast.error(error.message);
      return [];
    }
  };

  const exportToExcel = async () => {
    let contractsToExport = contracts;

    if (!isFiltersApplied) {
      contractsToExport = await fetchContracts("contracts?page=1&limit=2000");
    } else {
      contractsToExport = await fetchContracts("search?page=1&limit=2000", "POST", contractFilters);
    }

    if (contractsToExport.length === 0) {
      toast.warn("Debe haber al menos 1 resultado");
      return;
    }

    const contractData = contractsToExport.map((contract) => ({
      Identificador: contract.uuid,
      Cliente: `${contract.customer?.name || ""} ${contract.customer?.surnames || ""}`,
      Email_Cliente: contract.customer?.email || "",
      Dirección_Cliente: `${contract.customer?.address || ""}, ${contract.customer?.zipCode || ""}, ${contract.customer?.province || ""}, ${contract.customer?.populace || ""}`,
      Teléfono: contract.customer?.phoneNumber || "",
      IBAN: contract.customer?.iban || "",
      Tipo_Cliente: contract.customer?.type || "",
      DNI_CIF: contract?.cif ? contract.customer?.cif : contract.customer?.nationalId || "",
      CUPS: contract.cups,
      Mantenimiento: contract.maintenance ? "Sí" : "No",
      Factura_Electronica: contract.electronicBill ? "Sí" : "No",
      Pagado: contract.payed ? "Sí" : "No",
      Tipo: contract.type,
      Estado: contract.contractState?.name || "Sin estado",
      Canal: contract?.channel?.name || contract?.rate?.channel?.name || "No Asignado",
      Compañía: contract?.company?.name || "",
      Tarifa: contract?.rate?.name || "",
      Agente: `${contract.user?.name || ""} ${contract.user?.firstSurname || ""}`,
      Información_Adicional: contract.extraInfo,
      BAT_Virtual: contract?.virtualBat ? "Sí" : "No",
      Placas: contract?.solarPlates ? "Sí" : "No",
      Producto: contract?.product,
      Fecha_Retro: contract?.expiresAt,
      Creado: contract.createdAt,
      UltimaActualización: contract.updatedAt,
    }));

    const worksheet = XLSX.utils.json_to_sheet(contractData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Contratos");

    XLSX.writeFile(workbook, "contratos.xlsx");
    toast.success("Archivo Excel exportado correctamente");
  };

  const handleClearFilters = () => {
    setContractFilters({});
    setIsFiltersApplied(false);

    setPagination((prevPagination) => ({
      ...prevPagination,
      page: 1,
    }));

    getContracts(1, entriesPerPage);
  };

  const getContractStates = async () => {
    const jwtToken = getCookie("factura-token");
    try {
      const response = await authGetFetch("contract-states/all", jwtToken);
      if (response.ok) {
        const states = await response.json();
        setContractStates(states);
      } else {
        toast.error("Error al obtener los estados de contrato");
      }
    } catch (error) {
      console.error("Error al obtener los estados de contrato:", error);
    }
  };

  const getChannels = async () => {
    const jwtToken = getCookie("factura-token");
    try {
      const response = await authGetFetch("channels", jwtToken);
      if (response.ok) {
        setChannels(await response.json());
      } else {
        toast.error("Error al obtener los canales");
      }
    } catch (error) {
      console.error("Error al obtener los canales:", error);
    }
  };

  const getUnnotifiedNotifications = async () => {
    const jwtToken = getCookie("factura-token");

    try {
      const response = await authGetFetch("notifications/unnotified", jwtToken);

      if (response.ok) {
        const notificationsResponse = await response.json();

        const nonCommunicationNotifications = notificationsResponse.filter(
          (notification) => notification.eventType !== "communication"
        );

        const onlyCommunications = notificationsResponse.filter(
          (notification) => notification.eventType === "communication"
        );

        setFilteredNotifications(nonCommunicationNotifications);
        setCommunications(onlyCommunications);
      } else {
        console.error("Error cargando las notificaciones");
      }
    } catch (error) {
      console.error("Error enviando la solicitud:", error);
    }
  };

  const notifiedNotification = async (notification) => {
    const jwtToken = getCookie("factura-token");
    try {
      await authFetch("PATCH", `notifications/${notification.uuid}`, { notified: true }, jwtToken);
    } catch (error) {
      console.error("Error marcando la notificación como notificada:", error);
    }
  };

  useEffect(() => {
    getUserInfo();
    getContractStates();
    getChannels();
    getUnnotifiedNotifications();
  }, []);

  useEffect(() => {
    if (!isFiltersApplied) {
      getContracts(pagination.page, entriesPerPage);
    } else {
      getFilteredContracts(contractFilters, pagination.page, entriesPerPage);
    }
  }, [pagination.page, entriesPerPage]);

  useEffect(() => {
    if (communications.length > 0) {
      setIsCommunicationModalOpen(true);
    }
  }, [communications]);

  useEffect(() => {
    if (filteredNotifications.length > 0) {
      filteredNotifications.forEach((notification) => {
        const displayProps = getNotificationDisplayProps(notification);

        toast.success(
          <div>
            <h2 className="text-slate-800 dark:text-slate-100 mb-2 text-lg font-semibold">
              {displayProps.icon} {displayProps.subject}
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm">{notification.content}</p>
          </div>,
          {
            position: "top-right",
            draggable: true,
            icon: false,
            autoClose: 5000,
            hideProgressBar: false,
            onClick: () => {
              if (notification.sourceUrl) {
                window.open(notification.sourceUrl, "_blank");
              }
            },
          }
        );
        notifiedNotification(notification);
      });
    }
  }, [filteredNotifications]);

  const handleUpdate = async (dataToUpdate, updateKey, newValue, jwtToken) => {
    if (selectedContracts.length > 0) {
      try {
        const response = await authFetch(
          "PATCH",
          "contracts/batch/update",
          { contractsUuids: selectedContracts, dataToUpdate },
          jwtToken
        );

        if (!response.ok) {
          toast.error("Error al actualizar los contratos.");
          return;
        }

        setContracts((prevContracts) =>
          prevContracts.map((contract) =>
            selectedContracts.includes(contract.uuid)
              ? { ...contract, [updateKey]: newValue }
              : contract
          )
        );

        toast.success("Contratos actualizados correctamente");
        setSelectedContracts([]);
      } catch (error) {
        console.error("Error al actualizar los contratos:", error);
        toast.error("Error al actualizar los contratos");
      }
    } else {
      toast.warn("No hay contratos seleccionados");
    }
  };

  const handleStateChange = async (newStateId) => {
    const jwtToken = getCookie("factura-token");
    const newState = contractStates.find((state) => state.id === newStateId);

    if (!newState) return;

    await handleUpdate(
      { contractStateId: newStateId },
      "contractState",
      newState,
      jwtToken
    );

    setIsStateChangeModalOpen(false);
    setSelectedStateForBatch(null);
  };

  const handleSingleStateChange = async (contractUuid, newState) => {
    const jwtToken = getCookie("factura-token");
    setUpdatingContractUuid(contractUuid);

    try {
      const response = await authFetch(
        "PATCH",
        "contracts/batch/update",
        { contractsUuids: [contractUuid], dataToUpdate: { contractStateId: newState.id } },
        jwtToken
      );

      if (!response.ok) {
        toast.error("Error al actualizar el estado del contrato");
        return;
      }

      setContracts((prevContracts) =>
        prevContracts.map((contract) =>
          contract.uuid === contractUuid
            ? { ...contract, contractState: newState }
            : contract
        )
      );

      toast.success(`Estado actualizado a "${newState.name}"`);
    } catch (error) {
      console.error("Error al actualizar el estado:", error);
      toast.error("Error al actualizar el estado del contrato");
    } finally {
      setUpdatingContractUuid(null);
    }
  };

  const handleChannelChange = async (newChannelId) => {
    const jwtToken = getCookie("factura-token");
    const newChannel = channels.find((channel) => channel.id === newChannelId);

    if (!newChannel) return;

    await handleUpdate(
      { channelId: newChannelId },
      "channel",
      newChannel,
      jwtToken
    );

    setIsChannelChangeModalOpen(false);
    setSelectedChannelForBatch(null);
  };

  const handleDeleteContracts = async () => {
    if (selectedContracts.length === 0) {
      toast.warn("No hay contratos seleccionados");
      return;
    }

    if (!confirm(`¿Estás seguro de que quieres eliminar ${selectedContracts.length} contrato(s)?`)) {
      return;
    }

    const jwtToken = getCookie("factura-token");

    try {
      for (const contractUuid of selectedContracts) {
        await authFetch("DELETE", `contracts/${contractUuid}`, {}, jwtToken);
      }

      setContracts((prevContracts) =>
        prevContracts.filter((contract) => !selectedContracts.includes(contract.uuid))
      );

      toast.success("Contratos eliminados correctamente");
      setSelectedContracts([]);
    } catch (error) {
      console.error("Error al eliminar contratos:", error);
      toast.error("Error al eliminar contratos");
    }
  };

  const handleDeleteSingleContract = async (contractUuid) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este contrato?")) {
      return;
    }

    const jwtToken = getCookie("factura-token");

    try {
      await authFetch("DELETE", `contracts/${contractUuid}`, {}, jwtToken);

      setContracts((prevContracts) =>
        prevContracts.filter((contract) => contract.uuid !== contractUuid)
      );

      toast.success("Contrato eliminado correctamente");
    } catch (error) {
      console.error("Error al eliminar contrato:", error);
      toast.error("Error al eliminar el contrato");
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedContracts(contracts.map((c) => c.uuid));
    } else {
      setSelectedContracts([]);
    }
  };

  const handleSelectContract = (uuid) => {
    setSelectedContracts((prev) =>
      prev.includes(uuid) ? prev.filter((id) => id !== uuid) : [...prev, uuid]
    );
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.lastPage) return;
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="neumorphic-card p-8 rounded-xl">
            <span className="material-icons-outlined text-6xl text-primary animate-spin">
              refresh
            </span>
            <p className="mt-4 text-slate-600 dark:text-slate-400">Cargando contratos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 contracts-pastel-bg min-h-screen">
      {/* Search and Filters */}
      <SearchBox
        onSearch={getFilteredContracts}
        onClearFilters={handleClearFilters}
        setContractsOrder={setColumnsOrder}
        onExportExcel={exportToExcel}
        contractStates={contractStates}
        channels={channels}
        isManager={isManager}
        userGroupId={userGroupId}
      />

      {/* New Contract Button */}
      <div className="mb-6 flex justify-end">
        <button
          onClick={openModal}
          className="px-5 py-2 rounded-lg neumorphic-button active bg-primary text-white font-semibold flex items-center hover:bg-primary/90 transition-colors"
        >
          <span className="material-icons-outlined mr-2">add</span>
          Nuevo Contrato
        </button>
      </div>

      {/* Batch Actions - Solo visible para Supervisores y Admin */}
      {selectedContracts.length > 0 && (isManager || userGroupId === 1) && (
        <div className="mb-8">
          <div className="relative inline-block" ref={dropdownDesktopRef}>
            <button
              onClick={toggleDesktop}
              className="px-5 py-2 rounded-lg neumorphic-button active bg-primary text-white font-semibold flex items-center"
            >
              <span className="material-icons-outlined mr-2">more_horiz</span>
              Acciones ({selectedContracts.length})
            </button>

            {isDesktopDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 neumorphic-card rounded-lg shadow-lg z-10">
                <button
                  onClick={() => {
                    setIsStateChangeModalOpen(true);
                    setIsDesktopDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded-t-lg flex items-center"
                >
                  <span className="material-icons-outlined mr-2 text-primary">edit</span>
                  Cambiar Estado
                </button>
                <button
                  onClick={() => {
                    setIsChannelChangeModalOpen(true);
                    setIsDesktopDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-800/50 flex items-center"
                >
                  <span className="material-icons-outlined mr-2 text-primary">alt_route</span>
                  Cambiar Canal
                </button>
                <button
                  onClick={() => {
                    setIsAddToLiquidationOpen(true);
                    setIsDesktopDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-800/50 flex items-center"
                >
                  <span className="material-icons-outlined mr-2 text-primary">attach_money</span>
                  Añadir a Liquidación
                </button>
                <button
                  onClick={() => {
                    setIsReassignModalOpen(true);
                    setIsDesktopDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-800/50 flex items-center"
                >
                  <span className="material-icons-outlined mr-2 text-primary">person_add</span>
                  Reasignar
                </button>
                <button
                  onClick={() => {
                    handleDeleteContracts();
                    setIsDesktopDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded-b-lg flex items-center text-red-500"
                >
                  <span className="material-icons-outlined mr-2">delete</span>
                  Eliminar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Contracts Table */}
      <div className="neumorphic-card p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="p-3">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={selectedContracts.length === contracts.length && contracts.length > 0}
                    className="accent-primary"
                  />
                </th>
                {/* Dynamic column headers based on user preferences */}
                {(columnsOrder.length > 0 ? columnsOrder : DEFAULT_COLUMNS).map((columnKey) => {
                  const columnConfig = COLUMN_CONFIG[columnKey];
                  if (!columnConfig) return null;
                  return (
                    <th key={columnKey} className="p-3">
                      {columnConfig.label}
                    </th>
                  );
                })}
                <th className="p-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((contract) => (
                <tr
                  key={contract.uuid}
                  className="table-row-divider"
                >
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={selectedContracts.includes(contract.uuid)}
                      onChange={() => handleSelectContract(contract.uuid)}
                      className="accent-primary"
                    />
                  </td>
                  {/* Dynamic column cells based on user preferences */}
                  {(columnsOrder.length > 0 ? columnsOrder : DEFAULT_COLUMNS).map((columnKey) => {
                    const columnConfig = COLUMN_CONFIG[columnKey];
                    if (!columnConfig) return null;
                    const context = columnKey === "contractStateName"
                      ? { contractStates, onSingleStateChange: handleSingleStateChange, updatingContractUuid, isManager, userGroupId }
                      : null;
                    return (
                      <td key={columnKey} className="p-3 text-slate-600 dark:text-slate-400">
                        {columnConfig.render(contract, formatDayDate, context)}
                      </td>
                    );
                  })}
                  <td className="p-3">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => router.push(`/contratos/${contract.customer?.uuid}/${contract.uuid}`)}
                        className="p-2 rounded-lg neumorphic-button text-slate-600 dark:text-slate-400"
                      >
                        <span className="material-icons-outlined text-lg">visibility</span>
                      </button>
                      <button
                        onClick={() => {
                          setContractUuid(contract.uuid);
                          setIsDocumentModalOpen(true);
                        }}
                        className="p-2 rounded-lg neumorphic-button text-slate-600 dark:text-slate-400"
                      >
                        <span className="material-icons-outlined text-lg">folder</span>
                      </button>
                      {/* Botón eliminar - Solo visible para Supervisores y Admin */}
                      {(isManager || userGroupId === 1) && (
                        <button
                          onClick={() => handleDeleteSingleContract(contract.uuid)}
                          className="p-2 rounded-lg neumorphic-button text-red-500 hover:text-red-600"
                          title="Eliminar contrato"
                        >
                          <span className="material-icons-outlined text-lg">delete</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center mt-6 flex-wrap gap-4">
          <div className="text-sm text-slate-600 dark:text-slate-400">
            Mostrando {contracts.length} de {pagination.total} contratos
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="px-4 py-2 rounded-lg neumorphic-button font-medium text-slate-600 dark:text-slate-400 disabled:opacity-50"
            >
              <span className="material-icons-outlined">chevron_left</span>
            </button>
            <span className="px-4 py-2 text-slate-700 dark:text-slate-300 font-medium">
              {pagination.page} / {pagination.lastPage}
            </span>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.lastPage}
              className="px-4 py-2 rounded-lg neumorphic-button font-medium text-slate-600 dark:text-slate-400 disabled:opacity-50"
            >
              <span className="material-icons-outlined">chevron_right</span>
            </button>
          </div>
          <div className="neumorphic-card-inset rounded-lg">
            <select
              value={entriesPerPage}
              onChange={(e) => {
                setEntriesPerPage(Number(e.target.value));
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="bg-transparent border-none focus:ring-0 text-sm font-medium py-2 px-3 text-slate-600 dark:text-slate-300"
            >
              <option value={10}>10 por página</option>
              <option value={25}>25 por página</option>
              <option value={50}>50 por página</option>
              <option value={100}>100 por página</option>
            </select>
          </div>
        </div>
      </div>

      {/* Modals */}
      {isDocumentModalOpen && (
        <ContractsDocumentsModal
          contractUuid={contractUuid}
          isOpen={isDocumentModalOpen}
          onClose={() => {
            setIsDocumentModalOpen(false);
            setContractUuid(null);
          }}
          isManager={isManager}
        />
      )}

      {isContractModalOpen && (
        <ContractsTypeModal
          isContractModalOpen={isContractModalOpen}
          closeModal={closeModal}
          handleCreateContract={handleCreateContract}
        />
      )}

      {isStateChangeModalOpen && (
        <ChangeStateModal
          contractStates={contractStates}
          onClose={() => setIsStateChangeModalOpen(false)}
          onSubmit={handleStateChange}
        />
      )}

      {isChannelChangeModalOpen && (
        <ChangeChannelModal
          channels={channels}
          onClose={() => setIsChannelChangeModalOpen(false)}
          onSubmit={handleChannelChange}
        />
      )}

      {isAddToLiquidationOpen && (
        <AddToLiquidationModal
          onClose={() => setIsAddToLiquidationOpen(false)}
          selectedContracts={selectedContracts}
          setSelectedContracts={setSelectedContracts}
        />
      )}

      {isReassignModalOpen && (
        <ReassignContractModal
          onClose={() => setIsReassignModalOpen(false)}
          selectedContracts={selectedContracts}
          onSuccess={() => {
            setIsReassignModalOpen(false);
            setSelectedContracts([]);
            getContracts(pagination.page, entriesPerPage);
          }}
        />
      )}

      {isCommunicationModalOpen && communications.length > 0 && (
        <CommunicationModal
          communication={communications[communicationsCurrentIndex]}
          onClose={() => {
            if (communicationsCurrentIndex < communications.length - 1) {
              setCommunicationsCurrentIndex((prev) => prev + 1);
            } else {
              setIsCommunicationModalOpen(false);
              setCommunications([]);
              setCommunicationsCurrentIndex(0);
            }
          }}
        />
      )}
    </div>
  );
}
