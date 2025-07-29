"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { getCookie } from "cookies-next";
import * as jose from "jose";
import { authGetFetch, authFetch } from "@/helpers/server-fetch.helper";
import ContractStatesDropdown from "@/components/contract-states.dropdown";
import ChannelsDropdown from "@/components/channels.dropdown";
import { FiEdit, FiFileText, FiTrash } from "react-icons/fi";
import { FaEye, FaTimes, FaSpinner, FaPlus } from "react-icons/fa";
import SearchBox from "@/components/searchbox.form";
import ContractsDocumentsModal from "@/components/contracts-documents.modal";
import { formatDayDate } from "@/helpers/dates.helper";
import ContractsTypeModal from "@/components/contracts-type.modal";
import useIsMobile from "@/hooks/useIsMobile";
import CommunicationModal from "@/components/communication.modal";
import { useLayout } from "../layout";
import { toast } from "react-toastify";
import { getNotificationDisplayProps } from "../../helpers/notification.helper";
import GlobalLoadingOverlay from "@/components/global-loading.overlay";
import ChangeStateModal from "@/components/change-state.modal";
import ChangeChannelModal from "@/components/change-channel.modal";

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
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-[60] p-4 lg:ml-72">
      <div className="bg-white p-6 md:p-8 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">
            Crear Nueva Liquidación
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={isLoading}
          >
            <FaTimes size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="sub-liq-nombre"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Nombre de liquidación
            </label>
            <input
              type="text"
              id="sub-liq-nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              required
              disabled={isLoading}
            />
          </div>
          <div className="mb-4">
            <label htmlFor="sub-liq-date" className="block text-sm font-medium text-gray-700 mb-1">
              Fecha
            </label>
            <input
              type="date"
              id="sub-liq-date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              required
              disabled={isLoading}
            />
          </div>
          {users.length > 0 && (
            <div className="mb-6">
              <label
                htmlFor="sub-liq-user"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Asignar a Usuario
              </label>
              <select
                id="sub-liq-user"
                value={selectedUserIdForNewLiq}
                onChange={(e) => setSelectedUserIdForNewLiq(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded-md bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
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
          )}
          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 w-full sm:w-auto"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 w-full sm:w-auto flex items-center justify-center"
              disabled={isLoading}
            >
              {isLoading && <FaSpinner className="animate-spin mr-2" />}
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      toast.success(`Liquidación "${createdLiquidation.name}" creada correctamente.`, {
        position: "top-right",
        draggable: true,
        icon: false,
        hideProgressBar: false,
        autoClose: 5000,
        className: `transition-all transform hover:-translate-y-1 hover:shadow-l border border-gray-400`,
      });
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

      toast.success("Contratos añadidos a la liquidación correctamente.", {
        position: "top-right",
        draggable: true,
        icon: false,
        hideProgressBar: false,
        autoClose: 5000,
        className: `transition-all transform hover:-translate-y-1 hover:shadow-l border border-gray-400`,
      });
      setSelectedContracts([]);
      onClose();
    } catch (error) {
      console.error("Error al añadir los contratos a la liquidación (catch block):", error);
      toast.error(`Error de red o aplicación: ${error.message || "Ocurrió un error desconocido."}`);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4 lg:ml-72">
        <div className="bg-white p-6 md:p-8 rounded-lg shadow-xl w-full max-w-md">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">
              Agregar a liquidación
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <FaTimes size={20} />
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="max-h-60 overflow-y-auto mb-4 pr-2">
              {allLiquidations.length > 0 ? (
                allLiquidations.map((liquidation) => (
                  <div key={liquidation.uuid} className="mb-3 p-2 rounded hover:bg-gray-100">
                    <input
                      type="radio"
                      id={`liq-${liquidation.uuid}`}
                      name="liquidationSelection"
                      value={liquidation.uuid}
                      checked={selectedLiquidation === liquidation.uuid}
                      onChange={(e) => setSelectedLiquidation(e.target.value)}
                      className="mr-2 cursor-pointer"
                    />
                    <label
                      htmlFor={`liq-${liquidation.uuid}`}
                      className="text-gray-700 cursor-pointer"
                    >
                      {liquidation.name}
                    </label>
                  </div>
                ))
              ) : (
                <div className="py-3 text-center text-gray-500">
                  No hay liquidaciones disponibles.
                </div>
              )}
            </div>

            <div className="my-5">
              <button
                type="button"
                onClick={handleOpenCreateLiquidationModal}
                className="w-full px-4 py-2.5 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 flex items-center justify-center shadow-sm transition-colors duration-150"
                disabled={isLoadingUsers || isCreatingLiquidation}
              >
                {isLoadingUsers ? (
                  <FaSpinner className="animate-spin mr-2" />
                ) : (
                  <FaPlus className="mr-2" />
                )}
                Crear Nueva Liquidación
              </button>
            </div>

            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-3 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 w-full sm:w-auto"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 w-full sm:w-auto flex items-center justify-center"
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
      onSuccess();
    } catch (e) {
      alert("Error al reasignar contratos");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 text-black">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-bold mb-4">Reasignar contrato</h2>
        <select
          className="w-full p-2 border rounded mb-4"
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
        <div className="flex justify-end gap-2">
          <button className="px-4 py-2 rounded bg-gray-200" onClick={onClose} disabled={isSaving}>
            Cancelar
          </button>
          <button
            className="px-4 py-2 rounded bg-blue-600 text-white"
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

  const isMobile = useIsMobile();

  const [contractStates, setContractStates] = useState([]);
  const [channels, setChannels] = useState([]);

  const [contracts, setContracts] = useState([]);
  const [columnsOrder, setColumnsOrder] = useState([]);

  const [contractFilters, setContractFilters] = useState({});
  const [isFiltersApplied, setIsFiltersApplied] = useState(false);

  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [contractUuid, setContractUuid] = useState(null);

  const [isManager, setIsManager] = useState(false);
  const [userGroupId, setUserGroupId] = useState(false);
  const [isContractsStatesMounted, setIsContractsStatesMounted] = useState(false);
  const [isChannelsMounted, setIsChannelsMounted] = useState(false);
  const [isContractsMounted, setIsContractsMounted] = useState(false);

  const [documentation, setDocumentation] = useState([]);

  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [contractsOrder, setContractsOrder] = useState("createdAt");

  const [isStateChangeModalOpen, setIsStateChangeModalOpen] = useState(false);
  const [selectedStateForBatch, setSelectedStateForBatch] = useState(null);
  const [isChannelChangeModalOpen, setIsChannelChangeModalOpen] = useState(false);
  const [selectedChannelForBatch, setSelectedChannelForBatch] = useState(null);

  const { sideBarHidden, setSideBarHidden } = useLayout();

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

  const [isLoading, setIsLoading] = useState(true);
  const [isDesktopDropdownOpen, setIsDesktopDropdownOpen] = useState(false);
  const [isMobileDropdownOpen, setIsMobileDropdownOpen] = useState(false);
  const [isAddToLiquidationOpen, setIsAddToLiquidationOpen] = useState(false);
  const dropdownDesktopRef = useRef(null);
  const dropdownMobileRef = useRef(null);
  const [loggedInUserId, setLoggedInUserId] = useState(null);
  const [isQuickAddingLiquidation, setIsQuickAddingLiquidation] = useState(false);
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);

  useEffect(() => {
    function onClickOutside(e) {
      if (dropdownDesktopRef.current && !dropdownDesktopRef.current.contains(e.target)) {
        setIsDesktopDropdownOpen(false);
      }
      if (dropdownMobileRef.current && !dropdownMobileRef.current.contains(e.target)) {
        setIsMobileDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const toggleDesktop = () => setIsDesktopDropdownOpen((o) => !o);
  const toggleMobile = () => setIsMobileDropdownOpen((o) => !o);

  const getUserInfo = async () => {
    const jwtToken = getCookie("factura-token");

    if (!jwtToken) {
      setIsManager(false);
      setUserGroupId(null);
      setLoggedInUserId(null);
      return;
    }

    const payload = jose.decodeJwt(jwtToken);
    setIsManager(payload.isManager || false);
    setUserGroupId(payload.groupId);
    setLoggedInUserId(payload.userId);
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

        setIsContractsMounted(true);
      } else {
        alert("Error al cargar los contratos");
      }
      setIsLoading(false);
    } catch (error) {
      console.error("Error al obtener los contratos:", error);
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
        alert("Error al buscar los contratos filtrados");
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
      alert(error.message);
      return [];
    }
  };

  //TODO: Manage Excel export maybe
  const exportToExcel = async () => {
    let contractsToExport = contracts;

    if (!isFiltersApplied) {
      contractsToExport = await fetchContracts("contracts?page=1&limit=2000");
    } else {
      contractsToExport = await fetchContracts("search?page=1&limit=2000", "POST", contractFilters);
    }

    if (contractsToExport.length === 0) {
      alert("Debe haber al menos 1 resultado");
      return;
    }

    const contractData = contractsToExport.map((contract) => ({
      Identificador: contract.uuid,
      Cliente: `${contract.customer.name} ${contract.customer.surnames}`,
      Email_Cliente: contract.customer.email,
      Dirección_Cliente: `${contract.customer.address}, ${contract.customer.zipCode}, ${contract.customer.province}, ${contract.customer.populace}`,
      Teléfono: contract.customer.phoneNumber,
      IBAN: contract.customer.iban,
      Tipo_Cliente: contract.customer.type,
      DNI_CIF: contract?.cif ? contract.customer.cif : contract.customer.nationalId,
      CUPS: contract.cups,
      Mantenimiento: contract.maintenance ? "Sí" : "No",
      Factura_Electronica: contract.electronicBill ? "Sí" : "No",
      Pagado: contract.payed ? "Sí" : "No",
      Tipo: contract.type,
      Estado: contract.contractState.name,
      Canal: contract?.channel?.name || contract?.rate?.channel?.name || "No Asignado",
      Compañía: contract?.company?.name || "",
      Tarifa: contract?.rate?.name || "",
      Agente: `${contract.user.name} ${contract.user.firstSurname}`,
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
        setIsContractsStatesMounted(true);
      } else {
        alert("Error al obtener los estados de contrato");
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
        setIsChannelsMounted(true);
      } else {
        alert("Error al obtener los canales");
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
      setSideBarHidden(true);
    }
  }, [communications]);

  useEffect(() => {
    if (filteredNotifications.length > 0) {
      filteredNotifications.forEach((notification) => {
        const displayProps = getNotificationDisplayProps(notification);

        toast.success(
          <div>
            <h2 className="text-black mb-3 text-lg font-semibold leading-tight hover:text-yellow-500 transition-colors duration-300">
              {displayProps.icon} {displayProps.subject}
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed">{notification.content}</p>
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
            className: `transition-all transform hover:-translate-y-1 hover:shadow-l border border-gray-400`,
            style: { backgroundColor: displayProps.bgColor },
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
          alert("Error al actualizar los contratos.");
          return;
        }

        setContracts((prevContracts) =>
          prevContracts.map((contract) =>
            selectedContracts.includes(contract.uuid)
              ? { ...contract, [updateKey]: newValue }
              : contract
          )
        );
      } catch (error) {
        console.error("Error al actualizar los contratos:", error);
      }
      return true;
    }

    return false;
  };

  const handleStateChange = async (contractUuid, newState) => {
    const jwtToken = getCookie("factura-token");
    const dataToUpdate = { contractStateId: newState.id };

    const hasUpdated = await handleUpdate(dataToUpdate, "contractState", newState, jwtToken);

    if (hasUpdated) return;

    try {
      const response = await authFetch(
        "PATCH",
        `contracts/${contractUuid}`,
        { contractStateId: newState.id },
        jwtToken
      );

      if (!response.ok) {
        alert("Error al actualizar el estado del contrato.");
      }
    } catch (error) {
      console.error("Error al actualizar el estado del contrato:", error);
    }
  };

  const handleBatchStateChange = async () => {
    if (!selectedStateForBatch) {
      alert("Por favor selecciona un estado");
      return;
    }

    const jwtToken = getCookie("factura-token");
    const dataToUpdate = { contractStateId: selectedStateForBatch.id };

    const hasUpdated = await handleUpdate(
      dataToUpdate,
      "contractState",
      selectedStateForBatch,
      jwtToken
    );
    if (hasUpdated) {
      setIsStateChangeModalOpen(false);
      setSelectedStateForBatch(null);
    }
  };

  const handleChannelChange = async (contractUuid, newChannel) => {
    const jwtToken = getCookie("factura-token");
    const dataToUpdate = { channelId: newChannel.id };

    const hasUpdated = await handleUpdate(dataToUpdate, "channel", newChannel, jwtToken);
    if (hasUpdated) return;

    try {
      const response = await authFetch(
        "PATCH",
        `contracts/${contractUuid}`,
        { channelId: newChannel.id },
        jwtToken
      );

      if (!response.ok) {
        alert("Error al actualizar el canal del contrato.");
      }
    } catch (error) {
      console.error("Error al actualizar el canal del contrato:", error);
    }
  };

  const handleBatchChannelChange = async () => {
    if (!selectedChannelForBatch) {
      alert("Por favor selecciona un canal");
      return;
    }

    const jwtToken = getCookie("factura-token");
    const dataToUpdate = { channelId: selectedChannelForBatch.id };

    const hasUpdated = await handleUpdate(
      dataToUpdate,
      "channel",
      selectedChannelForBatch,
      jwtToken
    );

    if (hasUpdated) {
      setIsChannelChangeModalOpen(false);
      setSelectedChannelForBatch(null);
      if (isFiltersApplied) {
        getFilteredContracts(contractFilters, pagination.page, entriesPerPage);
      } else {
        getContracts(pagination.page, entriesPerPage);
      }
    }
  };

  const handlePayedChange = async (contractUuid, isPayed) => {
    const jwtToken = getCookie("factura-token");
    const dataToUpdate = { payed: isPayed };

    const hasUpdated = await handleUpdate(dataToUpdate, "payed", isPayed, jwtToken);
    if (hasUpdated) return;

    try {
      const response = await authFetch(
        "PATCH",
        `contracts/${contractUuid}`,
        { payed: isPayed },
        jwtToken
      );

      if (response.ok) {
        setContracts((prevContracts) =>
          prevContracts.map((contract) =>
            contract.uuid === contractUuid ? { ...contract, payed: isPayed } : contract
          )
        );
      } else {
        alert("Error al actualizar el estado de cobro del contrato.");
      }
    } catch (error) {
      console.error("Error al actualizar el estado de cobro:", error);
    }
  };

  const handleBatchPayedChange = async (isPayed) => {
    const jwtToken = getCookie("factura-token");
    const dataToUpdate = { payed: isPayed };

    await handleUpdate(dataToUpdate, "payed", isPayed, jwtToken);
  };

  const handleSelectContract = (contractUuid) => {
    const newSelectedContracts = selectedContracts.includes(contractUuid)
      ? selectedContracts.filter((uuid) => uuid !== contractUuid)
      : [...selectedContracts, contractUuid];

    setSelectedContracts((prev) => newSelectedContracts);
  };

  const handleSelectAllContracts = () => {
    if (selectedContracts.length === contracts.length) {
      setSelectedContracts([]);
      return;
    }

    const newSelectedContracts = contracts.map((contract) => contract.uuid);
    setSelectedContracts(newSelectedContracts);
  };

  const handleDeleteContract = async (contractUuid) => {
    const confirmDelete = confirm("¿Estás seguro de que quieres eliminar este contrato?");
    if (!confirmDelete) return;

    const jwtToken = getCookie("factura-token");

    if (selectedContracts.length > 0) {
      const contractsUuids = selectedContracts;

      try {
        const response = await authFetch(
          "DELETE",
          "contracts/batch/delete",
          { contractsUuids },
          jwtToken
        );

        if (!response.ok) {
          alert("Error al actualizar el estado del contrato.");
        }

        setContracts((prevContracts) => {
          return prevContracts.filter((contract) => !contractsUuids.includes(contract.uuid));
        });
      } catch (error) {
        console.error("Error al actualizar el estado del contrato:", error);
      }
    } else {
      try {
        const response = await authFetch("DELETE", `contracts/${contractUuid}`, {}, jwtToken);

        if (response.ok) {
          if (!isFiltersApplied) {
            getContracts(pagination.page, entriesPerPage);
          } else {
            getFilteredContracts(contractFilters, pagination.page, entriesPerPage);
          }
        } else {
          alert("Error eliminando el contrato");
        }
      } catch (error) {
        console.error("Error enviando la solicitud:", error);
      }
    }
  };

  //Pagination state
  const handleEntriesChange = (e) => {
    setEntriesPerPage(parseInt(e.target.value, 10));
  };

  const handleEditContract = (customerUuid, contractUuid) => {
    window.open(`/contratos/${customerUuid}/${contractUuid}`, "_blank");
  };

  const handleShowDocument = (uuid, documents) => {
    setDocumentation(documents);
    setIsDocumentModalOpen(true);
    setContractUuid(uuid);
  };

  const handleShowTelephonyDocument = (uuid, rates) => {
    const allDocumentations = Array.from(
      new Set(rates.flatMap((rate) => rate.documentation || []).filter((doc) => doc !== null))
    );

    setDocumentation(allDocumentations);
    setIsDocumentModalOpen(true);
    setContractUuid(uuid);
  };

  const closeDocumentModal = () => {
    setIsDocumentModalOpen(false);
    setContractUuid(null);
    setDocumentation([]);
  };

  const columnsConfig = {
    userName: {
      header: "Agente",
      render: (contract) => contract.user.name,
    },
    customerFullName: {
      header: "Cliente",
      render: (contract) => {
        if (contract.customer.type === "B2B") {
          return contract.customer?.tradeName || "—";
        }

        const name = contract.customer?.name || "";
        const surnames = contract.customer?.surnames || "";
        return surnames ? `${name} ${surnames}` : name || "—";
      },
    },
    cups: {
      header: "Cups",
      render: (contract) => contract.cups,
    },
    customerPhoneNumber: {
      header: "Teléfono",
      render: (contract) => contract?.customer?.phoneNumber,
    },
    customerEmail: {
      header: "Email",
      render: (contract) => contract.customer?.email,
    },
    customerAddress: {
      header: "Dirección",
      render: (contract) => contract.customer?.address,
    },
    customerIban: {
      header: "IBAN",
      render: (contract) => contract.customer?.iban,
    },
    customerNationalId: {
      header: "DNI/CIF",
      render: (contract) =>
        contract.customer?.cif ? contract.customer.cif : contract.customer?.nationalId || "",
    },
    electronicBill: {
      header: "E-FACT",
      render: (contract) => (contract.electronicBill ? "Sí" : "No"),
    },
    rateName: {
      header: "Tarifa",
      render: (contract) => {
        if (contract.type === "Telefonía") {
          return (
            <ul>
              {contract.telephonyData?.rates?.map((rate, index) => (
                <li key={index}>{rate.name || "Tarifa sin nombre"}</li>
              )) || <li>Sin tarifas disponibles</li>}
            </ul>
          );
        } else {
          return <span>{contract.rate?.name || "Sin tarifa"}</span>;
        }
      },
    },
    ratePowerSlot1: {
      header: "Potencias contratadas",
      render: (contract) => {
        if (Array.isArray(contract.contractedPowers) && contract.contractedPowers.length > 0) {
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
      render: (contract) => {
        if (!contract.expiresAt) {
          return "";
        }

        const today = new Date();
        const expiresDate = new Date(contract.expiresAt);
        const diffTime = expiresDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return diffDays >= 0 ? `En ${diffDays} días` : `Expirado (${Math.abs(diffDays)} días)`;
      },
    },
    extraInfo: {
      header: "Observaciones",
      render: (contract) => contract.extraInfo,
    },
    contractStateName: {
      header: "Estado",
      render: (contract) => (
        <>
          {contract.isDraft ? (
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
            <ContractStatesDropdown
              contractStates={contractStates}
              contractStateId={contract?.contractState?.id}
              onStateChange={(newState) => handleStateChange(contract.uuid, newState)}
              isEditable={userGroupId === 1}
            />
          )}
        </>
      ),
    },
    payed: {
      header: "Pagado",
      render: (contract) => (
        <input
          type="checkbox"
          checked={contract.payed}
          onChange={(e) => handlePayedChange(contract.uuid, e.target.checked)}
          className="cursor-pointer"
          disabled={userGroupId !== 1}
        />
      ),
    },
    channelName: {
      header: "Canal",
      render: (contract) => (
        <ChannelsDropdown
          channels={channels}
          channelId={contract?.channel ? contract.channel.id : contract.rate?.channel?.id}
          onChannelChange={(newChannel) => handleChannelChange(contract.uuid, newChannel)}
        />
      ),
    },
    companyName: {
      header: "Compañía",
      render: (contract) => contract?.company?.name,
    },
    updatedAt: {
      header: "Fecha",
      render: (contract) =>
        formatDayDate(contractsOrder === "createdAt" ? contract.createdAt : contract.updatedAt),
    },
  };

  if (!isContractsMounted && !isContractsStatesMounted && !isChannelsMounted) {
    return null;
  }

  const handleCreateContract = (contractType) => {
    contractType === "telefonia"
      ? router.push("/nuevo-contrato-telefonia")
      : router.push("/nuevo-contrato");
  };

  const openModal = () => setIsContractModalOpen(true);
  const closeModal = () => setIsContractModalOpen(false);

  const notifiedNotification = async (notification) => {
    const jwtToken = getCookie("factura-token");
    try {
      const response = await authFetch(
        "PATCH",
        `notifications/${notification.uuid}`,
        { notified: 1 },
        jwtToken
      );
      if (!response.ok) {
        alert("Error actualizando el estado de la notificacion en el servidor");
      }
    } catch (error) {
      console.error("Error enviando la solicitud:", error);
    }
  };

  const handleQuickCreateAndAddLiquidation = async () => {
    if (!selectedContracts || selectedContracts.length === 0) {
      toast.warn("Por favor, seleccione al menos un contrato.");
      return;
    }

    if (!loggedInUserId) {
      toast.error("No se pudo obtener la información del usuario. Intente recargar la página.");
      await getUserInfo();
      if (!loggedInUserId) return;
    }

    setIsQuickAddingLiquidation(true);
    setIsDesktopDropdownOpen(false);
    setIsMobileDropdownOpen(false);

    const now = new Date();
    const defaultName = `Liquidación ${formatDateToYYYYMMDD(now)} ${now
      .getHours()
      .toString()
      .padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    const defaultDate = formatDateToYYYYMMDD(now);

    const jwtToken = getCookie("factura-token");

    try {
      const createLiquidationPayload = {
        name: defaultName,
        date: defaultDate,
        userId: loggedInUserId,
      };

      const createResponse = await authFetch(
        "POST",
        "liquidations",
        createLiquidationPayload,
        jwtToken
      );

      if (!createResponse.ok) {
        throw new Error("Error al crear la liquidación.");
      }

      const newLiquidation = await createResponse.json();
      toast.success(`Liquidación "${newLiquidation.name}" creada.`, {
        position: "top-right",
        draggable: true,
        icon: false,
        autoClose: 5000,
        hideProgressBar: false,
        className: `transition-all transform hover:-translate-y-1 hover:shadow-l border border-gray-400`,
      });

      const addContractsPayload = {
        liquidationUuid: newLiquidation.uuid,
        contractUuids: selectedContracts,
      };

      const addResponse = await authFetch(
        "POST",
        `liquidation-contracts/`,
        addContractsPayload,
        jwtToken
      );

      if (!addResponse.ok) {
        try {
          await authFetch("DELETE", `liquidations/${newLiquidation.uuid}`, {}, jwtToken);
          toast.warn(
            `Se revirtió la creación de "${newLiquidation.name}" debido a un error al añadir contratos.`
          );
        } catch (deleteError) {
          console.error("Error al revertir la creación de liquidación:", deleteError);
          toast.error(
            "Error al añadir contratos y no se pudo revertir la creación de la liquidación."
          );
        }
      }

      toast.success(`Contratos añadidos a "${newLiquidation.name}" correctamente.`, {
        position: "top-right",
        draggable: true,
        icon: false,
        hideProgressBar: false,
        autoClose: 5000,
        className: `transition-all transform hover:-translate-y-1 hover:shadow-l border border-gray-400`,
      });
      setSelectedContracts([]);
    } catch (error) {
      console.error("Error en el proceso de creación rápida y adición:", error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsQuickAddingLiquidation(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-8xl mx-auto bg-foreground p-6 rounded-lg shadow-lg">
        <SearchBox
          contractStates={contractStates}
          channels={channels}
          isManager={isManager}
          userGroupId={userGroupId}
          onExportExcel={exportToExcel}
          onSearch={getFilteredContracts}
          onClearFilters={handleClearFilters}
          setContractsOrder={setContractsOrder}
        />

        <div className={`flex ${isMobile ? "flex-col" : "justify-between"} mb-4`}>
          <h2 className="text-2xl font-bold text-black">Contratos</h2>
          <div className={`items-center gap-2 ${isMobile ? "hidden" : "flex"}`}>
            <label className="cursor-pointer text-black flex items-center gap-2 mr-4">
              <input
                type="checkbox"
                className="cursor-pointer"
                onChange={() => handleSelectAllContracts()}
              />
              Seleccionar todos
            </label>

            {selectedContracts.length > 0 && (
              <div ref={dropdownDesktopRef} className="hidden sm:inline-block relative">
                <button
                  onClick={toggleDesktop}
                  disabled={isQuickAddingLiquidation}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                >
                  {isQuickAddingLiquidation ? <FaSpinner className="animate-spin" /> : "Acciones"}
                </button>

                {isDesktopDropdownOpen && (
                  <ul className="absolute right-0 mt-2 w-48 bg-white border rounded-md shadow-lg z-10 text-black">
                    <li
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
                      onClick={handleQuickCreateAndAddLiquidation}
                    >
                      <span className="font-bold">+</span> Nueva liquidación
                    </li>
                    <li
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        setIsAddToLiquidationOpen(true);
                        setIsDesktopDropdownOpen(false);
                      }}
                    >
                      <span className="font-bold">+</span> Añadir a liquidación existente
                    </li>
                    <li
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        handleBatchPayedChange(true);
                        setIsDesktopDropdownOpen(false);
                      }}
                    >
                      <span className="font-bold">✓</span> Marcar como pagado
                    </li>
                    <li
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        setIsDesktopDropdownOpen(false);
                        setIsStateChangeModalOpen(true);
                      }}
                    >
                      <span className="font-bold">⚡</span> Cambiar estados
                    </li>
                    <li
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        setIsDesktopDropdownOpen(false);
                        setIsChannelChangeModalOpen(true);
                      }}
                    >
                      <span className="font-bold">📡</span> Cambiar canal
                    </li>
                    <li
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        setIsReassignModalOpen(true);
                        setIsDesktopDropdownOpen(false);
                      }}
                    >
                      <span className="font-bold">⇄</span> Reasignar contrato
                    </li>
                    <li
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        handleDeleteContract();
                        setIsDesktopDropdownOpen(false);
                      }}
                    >
                      <span className="font-bold">-</span> Eliminar
                    </li>
                  </ul>
                )}
              </div>
            )}

            <button
              className="bg-secondary text-white px-4 py-2 rounded-md hover:bg-secondaryHover"
              onClick={openModal}
            >
              Nuevo Contrato
            </button>

            <select
              value={entriesPerPage}
              onChange={handleEntriesChange}
              className="bg-background text-black border border-gray-500 rounded-md px-2 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={20}>20</option>
              <option value={25}>25</option>
            </select>
            <span className="text-gray-400 font-semibold">contratos por página</span>
          </div>

          {/*Mismo div pero visto desde el movil*/}
          <div className={`gap-2 ${isMobile ? "flex" : "hidden"} justify-between`}>
            <label className="cursor-pointer text-black flex items-center gap-2 mr-4">
              <input
                type="checkbox"
                className="cursor-pointer"
                onChange={() => handleSelectAllContracts()}
              />
              Seleccionar todos
            </label>

            <div>
              <select
                value={entriesPerPage}
                onChange={handleEntriesChange}
                className="bg-background text-black border border-gray-500 rounded-md px-2 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={20}>20</option>
                <option value={25}>25</option>
              </select>
              <span className="text-gray-400 font-semibold ml-2">contratos por página</span>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto overflow-y-auto max-h-[70vh]">
          <table className="min-w-full text-black">
            <thead className="bg-background">
              <tr>
                <th className="px-4 py-2 text-center text-black">Seleccionar</th>
                {columnsOrder.map((columnKey) => (
                  <th key={columnKey} className="px-4 py-2 text-center text-black">
                    {columnsConfig[columnKey]?.header || "Columna"}
                  </th>
                ))}

                <th className="px-4 py-2 text-center text-black">Acciones</th>
              </tr>
            </thead>
            <tbody className="text-gray-300 divide-y divide-gray-600">
              {contracts.map((contract) => (
                <tr key={contract.id} className="hover:bg-background">
                  <td className="px-4 py-2 text-center text-black">
                    <input
                      type="checkbox"
                      className="cursor-pointer"
                      onChange={() => handleSelectContract(contract.uuid)}
                      checked={selectedContracts.includes(contract.uuid)}
                    />
                  </td>

                  {columnsOrder.map((columnKey) => (
                    <td key={columnKey} className="px-4 py-2 text-center text-black">
                      {columnsConfig[columnKey]?.render(contract) || ""}
                    </td>
                  ))}

                  {isManager ? (
                    <td className="px-4 py-2 text-center flex justify-center gap-2">
                      <button
                        className="text-blue-500 hover:text-blue-700"
                        onClick={() => handleEditContract(contract.customer.uuid, contract.uuid)}
                      >
                        <FiEdit size={18} />
                      </button>
                      {contract.type !== "Telefonía" ? (
                        <button
                          className="text-green-500 hover:text-green-700"
                          onClick={() =>
                            handleShowDocument(contract.uuid, contract.rate.documentation)
                          }
                        >
                          <FiFileText size={18} />
                        </button>
                      ) : (
                        <button
                          className="text-green-500 hover:text-green-700"
                          onClick={() =>
                            handleShowTelephonyDocument(contract.uuid, contract.telephonyData.rates)
                          }
                        >
                          <FiFileText size={18} />
                        </button>
                      )}

                      {userGroupId == 1 && (
                        <button
                          className="text-red-500 hover:text-red-700"
                          onClick={() => handleDeleteContract(contract.uuid)}
                        >
                          <FiTrash size={18} />
                        </button>
                      )}
                    </td>
                  ) : (
                    <td className="px-4 py-2 text-center flex justify-center gap-2">
                      <button
                        className="text-blue-500 hover:text-blue-700"
                        onClick={() => handleEditContract(contract.customer.uuid, contract.uuid)}
                      >
                        {contract.isDraft ? <FiEdit size={18} /> : <FaEye size={18} />}
                      </button>
                      <button
                        className="text-green-500 hover:text-green-700"
                        onClick={() =>
                          handleViewContractDocuments(contract.customer.uuid, contract.uuid)
                        }
                      >
                        <FiFileText size={18} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Paginación */}
        <div className="flex justify-between items-center mt-4">
          <span className="text-black">
            Página {pagination.page} de {pagination.lastPage} de un total de {pagination.total}{" "}
            contratos
          </span>
          <div className="flex items-center gap-2">
            <button
              className={`px-3 py-1 rounded ${
                pagination.page === 1
                  ? "bg-background text-black"
                  : "bg-backgroundHover hover:bg-gray-200 text-black"
              }`}
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
            >
              {"<"}
            </button>
            <span className="text-gray-300">{pagination.page}</span>
            <button
              className={`px-3 py-1 rounded ${
                pagination.page === pagination.lastPage
                  ? "bg-background text-black"
                  : "bg-backgroundHover hover:bg-gray-200 text-black"
              }`}
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page === pagination.lastPage}
            >
              {">"}
            </button>
          </div>
        </div>
        <div className={`w-full ${isMobile ? "block" : "hidden"}`}>
          {selectedContracts.length > 0 && (
            <div ref={dropdownMobileRef} className="sm:hidden relative w-full">
              <button
                onClick={toggleMobile}
                disabled={isQuickAddingLiquidation}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 w-full"
              >
                {isQuickAddingLiquidation ? <FaSpinner className="animate-spin" /> : "Acciones"}
              </button>

              {isMobileDropdownOpen && (
                <ul className="absolute right-0 mt-2 w-48 bg-white border rounded-md shadow-lg z-10 text-black">
                  <li
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
                    onClick={handleQuickCreateAndAddLiquidation}
                  >
                    <span className="font-bold">+</span> Nueva liquidación
                  </li>
                  <li
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => {
                      setIsAddToLiquidationOpen(true);
                      setIsMobileDropdownOpen(false);
                    }}
                  >
                    <span className="font-bold">+</span> Añadir a liquidación existente
                  </li>
                  <li
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => {
                      handleBatchPayedChange(true);
                      setIsDesktopDropdownOpen(false);
                    }}
                  >
                    <span className="font-bold">✓</span> Marcar como pagado
                  </li>
                  <li
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => {
                      setIsDesktopDropdownOpen(false);
                      setIsStateChangeModalOpen(true);
                    }}
                  >
                    <span className="font-bold">⚡</span> Cambiar estados
                  </li>
                  <li
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => {
                      setIsDesktopDropdownOpen(false);
                      setIsChannelChangeModalOpen(true);
                    }}
                  >
                    <span className="font-bold">📡</span> Cambiar canal
                  </li>
                  <li
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => {
                      setIsReassignModalOpen(true);
                      setIsMobileDropdownOpen(false);
                    }}
                  >
                    <span className="font-bold">⇄</span> Reasignar contrato
                  </li>
                  <li
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => {
                      handleDeleteContract();
                      setIsDesktopDropdownOpen(false);
                    }}
                  >
                    <span className="font-bold">-</span> Eliminar
                  </li>
                </ul>
              )}
            </div>
          )}
          <button
            className="bg-secondary text-white px-4 py-2 rounded-md hover:bg-secondaryHover w-full mt-5"
            onClick={openModal}
          >
            Nuevo Contrato
          </button>
        </div>
      </div>
      {isDocumentModalOpen && contractUuid && (
        <ContractsDocumentsModal
          isOpen={isDocumentModalOpen}
          onClose={closeDocumentModal}
          contractUuid={contractUuid}
          documentation={documentation}
        />
      )}
      {isContractModalOpen && (
        <ContractsTypeModal
          isContractModalOpen={isContractModalOpen}
          closeModal={closeModal}
          handleCreateContract={handleCreateContract}
        />
      )}
      {isCommunicationModalOpen && communications[communicationsCurrentIndex] && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 backdrop-blur-md">
          <CommunicationModal
            isModalOpen={isCommunicationModalOpen}
            setIsModalOpen={() => {
              const nextIndex = communicationsCurrentIndex + 1;
              if (nextIndex < communications.length) {
                setCommunicationsCurrentIndex(nextIndex);
              } else {
                setIsCommunicationModalOpen(false);
                setSideBarHidden(false);
              }
            }}
            communication={communications[communicationsCurrentIndex]}
          />
        </div>
      )}

      {isStateChangeModalOpen && (
        <ChangeStateModal
          setIsStateChangeModalOpen={setIsStateChangeModalOpen}
          selectedStateForBatch={selectedStateForBatch}
          setSelectedStateForBatch={setSelectedStateForBatch}
          contractStates={contractStates}
          handleBatchStateChange={handleBatchStateChange}
        />
      )}

      {isChannelChangeModalOpen && (
        <ChangeChannelModal
          setIsChannelChangeModalOpen={setIsChannelChangeModalOpen}
          selectedChannelForBatch={selectedChannelForBatch}
          setSelectedChannelForBatch={setSelectedChannelForBatch}
          channels={channels}
          handleBatchChannelChange={handleBatchChannelChange}
        />
      )}

      {isLoading && <GlobalLoadingOverlay isLoading={isLoading}></GlobalLoadingOverlay>}
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
          onSuccess={async () => {
            setIsReassignModalOpen(false);
            if (!isFiltersApplied) {
              await getContracts(pagination.page, entriesPerPage);
            } else {
              await getFilteredContracts(contractFilters, pagination.page, entriesPerPage);
            }
            toast.success("Contratos reasignados correctamente", {
              position: "top-right",
              draggable: true,
              icon: false,
              autoClose: 5000,
              hideProgressBar: false,
              className: `transition-all transform hover:-translate-y-1 hover:shadow-l border border-gray-400`,
            });
          }}
        />
      )}
    </div>
  );
}
