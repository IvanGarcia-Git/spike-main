import { useState, useEffect } from "react";
import { getCookie } from "cookies-next";
import { authGetFetch } from "@/helpers/server-fetch.helper";
import provincesData from "../app/provinces.json";
import { FaSearch } from "react-icons/fa";

import { FaSortAmountDown, FaSortAmountUpAlt, FaFileExcel } from "react-icons/fa";
import { useIsMobile } from "@/hooks/use-mobile";

export default function ContractSearch({
  contractStates,
  channels,
  isManager,
  userGroupId,
  onExportExcel,
  onSearch,
  onClearFilters,
  setContractsOrder,
}) {
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [users, setUsers] = useState([]);
  const [isMounted, setIsMounted] = useState(false);

  //Provinces
  const [provinces, setProvinces] = useState(provincesData.provinces);
  const [searchProvince, setSearchProvince] = useState("");
  const [provincesFiltered, setProvincesFiltered] = useState([]);

  const isMobile = useIsMobile();

  const [rates, setRates] = useState({});

  const products = ["RL1", "RL2", "RL3", "RL4", "RL5", "RL6"];
    const allStateOptions = [{ id: 'DRAFT', name: 'Borrador' }, ...contractStates];

  const [multifilterSelected, setMultifilterSelected] = useState({
    companyIds: [],
    contractStateIds: [],
    contractUserIds: [],
  });

  const [searchText, setSearchText] = useState("");
  const [contractSearch, setContractSearch] = useState({
    searchText: "",
    channelId: "",
    companyIds: [],
    contractStateIds: [],
    contractUserIds: [],
    includeDrafts: false,
    order: "createdAt",
    payed: undefined,
    type: "", //Luz || Gas
    customerType: "", //B2C || B2B
    solarPlates: undefined,
    from: "",
    to: "",
    customerProvince: "",
    product: "",
    contractPowerFrom: "",
    contractPowerTo: "",
    rateId: "",
    rateType: "",
  });

  const rateTypesEnum = {
    TWO: "2.0",
    THREE: "3.0",
    SIX: "6.1",
  };

  const getUsers = async () => {
    const jwtToken = getCookie("factura-token");
    try {
      const response = await authGetFetch("users/visible-users", jwtToken);
      if (response.ok) {
        const jsonResponse = await response.json();
        setUsers(jsonResponse.users);
      } else if (response.status == 403) {
        setUsers([]);
      } else {
        alert("Error al obtener los usuarios");
      }
    } catch (error) {
      console.error("Error al obtener los usuarios:", error);
    }
  };

  const getCompanies = async () => {
    const jwtToken = getCookie("factura-token");

    try {
      const response = await authGetFetch("companies/", jwtToken);

      if (response.ok) {
        const companiesResponse = await response.json();
        setCompanies(companiesResponse);
      } else {
        alert("Error cargando la información de las compañías");
      }
    } catch (error) {
      console.error("Error enviando la solicitud:", error);
    }
  };

  useEffect(() => {
    getRates();
    getUsers();
    getCompanies();
  }, []);

  useEffect(() => {
    setProvincesFiltered(
      provinces.filter((province) =>
        province.toLowerCase().startsWith(searchProvince.toLowerCase())
      )
    );
  }, [searchProvince, provinces]);

  useEffect(() => {
    if (isMounted) {
      const delayDebounceFn = setTimeout(() => {
        setContractSearch((prevData) => ({
          ...prevData,
          searchText: searchText,
        }));
      }, 500);

      return () => clearTimeout(delayDebounceFn);
    } else {
      setIsMounted(true);
    }
  }, [searchText]);

  useEffect(() => {
    if (isMounted) {
      handleSearch();
    } else {
      setIsMounted(true);
    }
  }, [contractSearch]);

  useEffect(() => {
    if (isMounted) {
      const numericStateIds = multifilterSelected.contractStateIds.filter(
        (id) => typeof id === 'number'
      );
      const shouldIncludeDrafts = multifilterSelected.contractStateIds.includes('DRAFT');

      setContractSearch((prev) => ({
        ...prev,
        companyIds: multifilterSelected.companyIds,
        contractUserIds: multifilterSelected.contractUserIds,
        contractStateIds: numericStateIds,
        includeDrafts: shouldIncludeDrafts,
      }));
    }
  }, [multifilterSelected]);

  useEffect(() => {
    if (isMounted) {
      handleSearch(contractSearch);
    } else {
      setIsMounted(true);
    }
  }, [contractSearch, isMounted]);

  const toggleAdvancedSearch = () => {
    setShowAdvancedSearch((prev) => !prev);
  };

  const handleTextBoxChange = (e) => {
    const { value } = e.target;
    setSearchText(value);
  };

  const handleOrderChange = () => {
    const newOrder = contractSearch.order === "createdAt" ? "updatedAt" : "createdAt";

    setContractSearch((prevData) => ({
      ...prevData,
      order: newOrder,
    }));
    setContractsOrder(newOrder);
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;

    const formattedDate = value ? new Date(value).toISOString().split("T")[0] : "";

    setContractSearch((prevData) => ({
      ...prevData,
      [name]: formattedDate || undefined,
    }));
  };

  const handlePaymentStatusChange = (payedStatus) => {
    setContractSearch((prevData) => ({
      ...prevData,
      payed: prevData.payed === payedStatus ? undefined : payedStatus,
    }));
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    const newValue = value === "null" ? null : type === "checkbox" ? checked : value;

    setContractSearch((prevData) => ({
      ...prevData,
      [name]: newValue,
    }));
  };

  const handleSearch = () => {
    const payload = {
      searchText: searchText,
      contractSearchParams: contractSearch,
    };

    const cleanPayload = (obj) => {
      return Object.fromEntries(
        Object.entries(obj).filter(([_, value]) => value !== "" && value !== undefined)
      );
    };

    const cleanedPayload = {
      searchText: payload.searchText,
      contractSearchParams: cleanPayload(payload.contractSearchParams),
    };

    onSearch(cleanedPayload);
  };

  const handleExportExcel = () => {
    onExportExcel();
  };

  const handleClearFilters = () => {
    setContractSearch({
      searchText: "",
      channelId: "",
      companyIds: [],
      contractStateIds: [],
      contractUserIds: [],
      payed: undefined,
      type: "",
      customerType: "",
      solarPlates: false,
      from: "",
      to: "",
      order: "createdAt",
      customerProvince: "",
      product: "",
      contractPowerFrom: "",
      contractPowerTo: "",
      rateId: "",
      rateType: "",
    });

    setMultifilterSelected({
      companyIds: [],
      contractStateIds: [],
      contractUserIds: [],
    });

    setSearchText("");

    onClearFilters();
  };

  const getRates = async () => {
    const jwtToken = getCookie("factura-token");

    try {
      const response = await authGetFetch(`rates/group/company-name`, jwtToken);
      if (response.ok) {
        const ratesData = await response.json();

        const normalizedRates = Object.values(ratesData).flat();
        setRates(normalizedRates);
      } else {
        alert("Error al cargar las tarifas disponibles");
        setRates([]); // Establecer a un arreglo vacío en caso de error
      }
    } catch (error) {
      console.error("Error al obtener las tarifas:", error);
      setRates([]); // Manejo de errores
    }
  };

  const handleMultifilterChange = (filterName, value) => {
    setMultifilterSelected((prevState) => {
      const currentValues = prevState[filterName];
      const newValues = currentValues.includes(value)
        ? currentValues.filter((id) => id !== value)
        : [...currentValues, value];
      return { ...prevState, [filterName]: newValues };
    });
  };

  return (
    <div className="neumorphic-card p-6 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Buscador */}
        <div className="relative">
          <span className="material-icons-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
          <input
            type="text"
            placeholder="Buscar por Nombre, Cliente..."
            value={searchText}
            onChange={handleTextBoxChange}
            className="w-full neumorphic-card-inset pl-12 pr-4 py-3 rounded-lg border-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 text-sm bg-transparent"
          />
        </div>

        {/* Filtros: Desde */}
        <div className="relative">
          <span className="material-icons-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">calendar_today</span>
          <input
            type="date"
            name="from"
            value={contractSearch.from || ""}
            onChange={handleDateChange}
            className="w-full neumorphic-card-inset pl-12 pr-4 py-3 rounded-lg border-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 text-sm bg-transparent"
          />
        </div>

        {/* Filtros: Hasta */}
        <div className="relative">
          <span className="material-icons-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">calendar_today</span>
          <input
            type="date"
            name="to"
            value={contractSearch.to || ""}
            onChange={handleDateChange}
            className="w-full neumorphic-card-inset pl-12 pr-4 py-3 rounded-lg border-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 text-sm bg-transparent"
          />
        </div>

        {/* Estado dropdown */}
        <div className="neumorphic-card-inset rounded-lg">
          <select
            name="contractStateId"
            className="w-full bg-transparent border-none focus:ring-0 text-sm font-medium py-3 px-4 text-slate-600 dark:text-slate-300"
            onChange={(e) => {
              const value = e.target.value;
              if (value === "") {
                setMultifilterSelected((prev) => ({ ...prev, contractStateIds: [] }));
              } else {
                const stateId = value === "DRAFT" ? "DRAFT" : parseInt(value);
                handleMultifilterChange("contractStateIds", stateId);
              }
            }}
          >
            <option value="">Estado</option>
            {allStateOptions.map((state) => (
              <option key={state.id} value={state.id}>
                {state.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Búsqueda avanzada button */}
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleAdvancedSearch}
            className="flex items-center px-5 py-2 rounded-lg neumorphic-button font-medium text-slate-600 dark:text-slate-400"
          >
            <span className="material-icons-outlined mr-2 text-base">filter_alt</span>
            <span>Búsqueda avanzada</span>
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleOrderChange}
            className="px-5 py-2 rounded-lg neumorphic-button font-medium text-slate-600 dark:text-slate-400"
          >
            {contractSearch.order === "createdAt" ? "Fecha Creación" : "Fecha Actualización"}
          </button>

          {userGroupId == 1 && (
            <button
              onClick={handleExportExcel}
              className="px-5 py-2 rounded-lg neumorphic-button active font-semibold text-primary"
            >
              Exportar a Excel
            </button>
          )}

          <button
            onClick={handleClearFilters}
            className="px-5 py-2 rounded-lg neumorphic-button font-medium text-red-500/80 dark:text-red-500/70"
          >
            Borrar filtros
          </button>
        </div>
      </div>

      {/* Advanced Search Section */}
      {showAdvancedSearch && (
        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
          <div className="flex justify-between gap-6 mt-4 w-full">
          {/* Estado */}
          <div className="flex flex-col w-full">
            <label className="text-black mb-2">Estado</label>
            <div className="border rounded bg-blue-100 p-2 max-h-32 overflow-y-auto">
              {allStateOptions.map((state) => {
                const isSelected = multifilterSelected.contractStateIds.includes(state.id);
                return (
                  <div
                    key={state.id}
                    className={`flex items-center p-2 rounded ${isSelected ? "bg-blue-200" : "bg-transparent"
                      }`}
                  >
                    <input
                      type="checkbox"
                      id={`contractState-${state.id}`}
                      className="mr-2"
                      checked={isSelected}
                      onChange={() => handleMultifilterChange("contractStateIds", state.id)}
                    />
                    <label
                      htmlFor={`contractState-${state.id}`}
                      className={`text-black ${isSelected ? "font-bold" : ""}`}
                    >
                      {state.name}
                    </label>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Agente */}
          {isManager && (
            <div className="flex flex-col w-full">
              <label className="text-black mb-2">Agente</label>
              <div className="border rounded bg-blue-100 p-2 max-h-32 overflow-y-auto">
                {users.map((user) => {
                  const isSelected = multifilterSelected.contractUserIds.includes(user.id);
                  return (
                    <div
                      key={user.id}
                      className={`flex items-center p-2 rounded ${isSelected ? "bg-blue-200" : "bg-transparent"
                        }`}
                    >
                      <input
                        type="checkbox"
                        id={`contractUser-${user.id}`}
                        className="mr-2"
                        checked={isSelected}
                        onChange={() => handleMultifilterChange("contractUserIds", user.id)}
                      />
                      <label
                        htmlFor={`contractUser-${user.id}`}
                        className={`text-black ${isSelected ? "font-bold" : ""}`}
                      >
                        {user.name}
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Compañía */}
          <div className="flex flex-col w-full">
            <label className="text-black mb-2">Compañía</label>
            <div className="border rounded bg-blue-100 p-2 max-h-32 overflow-y-auto">
              {companies.map((company) => {
                const isSelected = multifilterSelected.companyIds.includes(company.id);
                return (
                  <div
                    key={company.id}
                    className={`flex items-center p-2 rounded ${isSelected ? "bg-blue-200" : "bg-transparent"
                      }`}
                  >
                    <input
                      type="checkbox"
                      id={`company-${company.id}`}
                      className="mr-2"
                      checked={isSelected}
                      onChange={() => handleMultifilterChange("companyIds", company.id)}
                    />
                    <label
                      htmlFor={`company-${company.id}`}
                      className={`text-black ${isSelected ? "font-bold" : ""}`}
                    >
                      {company.name}
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        </div>
      )}
    </div>
  );
}
