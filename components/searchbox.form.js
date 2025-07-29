import { useState, useEffect } from "react";
import { getCookie } from "cookies-next";
import { authGetFetch } from "@/helpers/server-fetch.helper";
import provincesData from "../app/provinces.json";
import { FaSearch } from "react-icons/fa";

import { FaSortAmountDown, FaSortAmountUpAlt, FaFileExcel } from "react-icons/fa";
import useIsMobile from "@/hooks/useIsMobile";

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
    <div className="bg-background p-4 rounded-lg mb-4">
      <div className="flex flex-col items-center gap-4">
        {/* Buscador */}
        <div className="w-full max-w-lg flex items-center p-2 rounded-lg">
          <input
            type="text"
            placeholder="Buscar..."
            value={searchText}
            onChange={handleTextBoxChange}
            className="flex-grow px-4 py-2 bg-foreground text-black rounded-md focus:outline-none"
          />
          <button className="text-black ml-2">
            <i className="fas fa-search"></i>
          </button>
        </div>

        {/* Filtros: Desde y Hasta */}
        <div className="flex justify-center gap-6">
          <div className="flex flex-col items-center">
            <label className="text-black mb-2">Desde</label>
            <input
              type="date"
              name="from"
              value={contractSearch.from || ""} // Verificamos que el valor sea no nulo
              onChange={handleDateChange} // Llamamos a la función que maneja el cambio de fecha
              className="w-32 p-2 bg-foreground text-black rounded-md focus:outline-none"
            />
          </div>

          <div className="flex flex-col items-center">
            <label className="text-black mb-2">Hasta</label>
            <input
              type="date"
              name="to"
              value={contractSearch.to || ""}
              onChange={handleDateChange}
              className="w-32 p-2 bg-foreground text-black rounded-md focus:outline-none"
            />
          </div>
        </div>

        {/* Otros campos como Estado, Agente, Compañía */}
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

      <div className="bg-foreground p-4 mt-4 rounded-lg shadow-md">
        {/* Botón para alternar la búsqueda avanzada */}
        <div
          onClick={toggleAdvancedSearch}
          className="flex justify-between items-center cursor-pointer"
        >
          <h2 className="text-black font-semibold">Búsqueda avanzada</h2>
          <span className="text-blue-500 font-semibold">
            {showAdvancedSearch ? "▲ Ocultar" : "▼ Mostrar"}
          </span>
        </div>

        {/* Contenido de búsqueda avanzada */}
        {showAdvancedSearch && (
          <div className="mt-4 grid grid-cols-2 gap-4">
            {/* Columna 1 */}
            <div>
              <div className="flex flex-col mt-4">
                <label className="block text-black">Tipo de Cliente</label>
                <select
                  name="customerType"
                  value={contractSearch.customerType}
                  onChange={handleInputChange}
                  className="mt-2 p-2 bg-background text-black rounded-md focus:outline-none"
                >
                  <option value="">Seleccionar</option> <option value="B2C">Particular</option>
                  <option value="B2B">Empresa</option>
                </select>
              </div>

              <div className="flex flex-col mt-4">
                {/* Tipo de Contrato */}
                <label className="block text-black">Tipo de Contrato</label>
                <select
                  name="type"
                  value={contractSearch.type}
                  onChange={handleInputChange}
                  className="mt-2 p-2 bg-background text-black rounded-md focus:outline-none"
                >
                  <option value="">Seleccionar</option> <option value="Luz">Luz</option>
                  <option value="Gas">Gas</option>
                  <option value="Telefonía">Telefonía</option>
                </select>

                {/* Checkbox para Placas */}
                <label className="flex items-center text-black mt-4">
                  <input
                    type="checkbox"
                    name="solarPlates"
                    checked={contractSearch.solarPlates}
                    onChange={handleInputChange}
                    className="mr-2"
                    disabled={contractSearch.type === "Gas"}
                  />
                  Placas
                </label>
              </div>
              <div className="relative mt-4 w-full">
                {/* Etiqueta */}
                <label className="block text-black flex items-center mb-2">
                  <FaSearch className="mr-2 text-gray-600" /> Buscar Provincia
                </label>

                {/* Input de búsqueda */}
                <div className="flex items-center border rounded-md bg-background px-2 py-1">
                  <FaSearch className="text-gray-500 mr-2" />
                  <input
                    type="text"
                    value={searchProvince}
                    onChange={(e) => setSearchProvince(e.target.value)}
                    placeholder="Escribe para buscar..."
                    className="w-full bg-transparent focus:outline-none text-black"
                  />
                </div>

                {/* Lista desplegable */}
                {provincesFiltered.length > 0 && searchProvince.length > 0 && (
                  <ul className="absolute z-10 bg-background w-full border mt-1 rounded-md shadow-lg max-h-32 overflow-y-auto">
                    {provincesFiltered.map((province) => (
                      <li
                        key={province}
                        className={`px-4 py-2 cursor-pointer text-black hover:bg-gray-200 ${contractSearch.customerProvince === province
                          ? "bg-gray-300 font-semibold"
                          : ""
                          }`}
                        onClick={() => {
                          setContractSearch((prev) => ({
                            ...prev,
                            customerProvince: province,
                          }));
                          setSearchProvince(province);
                        }}
                      >
                        {province}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div>
              {/* Columna 2 */}

              {/*FILTRO PRODUCTO*/}
              <div className="flex flex-col mt-4">
                <label className="block text-black mb-2">Producto</label>
                <select
                  name="product"
                  value={contractSearch.product}
                  onChange={handleInputChange}
                  className="p-2 bg-background text-black rounded-md focus:outline-none"
                >
                  <option value="">Seleccione un producto</option>
                  {products.map((product) => (
                    <option key={product} value={product}>
                      {product}
                    </option>
                  ))}
                </select>
              </div>

              {/*FILTRO POTENCIA TARIFA*/}
              <div className="flex flex-col mt-4">
                <label className="block text-black mb-2">Potencia de la tarifa</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Desde</label>
                    <input
                      name="contractPowerFrom"
                      type="number"
                      value={contractSearch.contractPowerFrom}
                      onChange={handleInputChange}
                      className="p-2 bg-background text-black rounded-md focus:outline-none w-full"
                      placeholder="Mínima..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Hasta</label>
                    <input
                      name="contractPowerTo"
                      type="number"
                      value={contractSearch.contractPowerTo}
                      onChange={handleInputChange}
                      className="p-2 bg-background text-black rounded-md focus:outline-none w-full"
                      placeholder="Máxima..."
                    />
                  </div>
                </div>
              </div>

              {/*FILTRO TARIFA*/}
              <div className="flex flex-col mt-4">
                <label className="block text-black mb-2">Seleccione una tarifa</label>
                <select
                  name="rateId"
                  value={contractSearch.rateId}
                  onChange={handleInputChange}
                  className="p-2 bg-background text-black rounded-md focus:outline-none"
                >
                  <option value="">Seleccione una tarifa</option>
                  {rates.map((rate) => (
                    <option key={rate.id} value={rate.id}>
                      {rate.name}
                    </option>
                  ))}
                </select>
              </div>

              {/*FILTRO TIPO TARIFA*/}
              <div className="flex flex-col mt-4">
                <label className="block text-black mb-2">Tipo de Tarifa</label>
                <select
                  name="rateType"
                  value={contractSearch.rateType}
                  onChange={handleInputChange}
                  className="p-2 bg-background text-black rounded-md focus:outline-none"
                >
                  <option value="">Seleccione un tipo de tarifa</option>
                  {Object.values(rateTypesEnum).map((value, index) => (
                    <option key={index} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>
              {userGroupId == 1 && (
                <div>
                  {/* Estado del Pago */}
                  <label className="block text-black mt-4">Estado del Pago</label>
                  <div className="flex gap-2 mt-2">
                    <label className="flex items-center text-black">
                      <input
                        type="checkbox"
                        name="sinCobrar"
                        checked={contractSearch.payed === false}
                        onChange={() => handlePaymentStatusChange(false)}
                        className="mr-2"
                      />
                      Sin Cobrar
                    </label>
                    <label className="flex items-center text-black">
                      <input
                        type="checkbox"
                        name="cobrado"
                        checked={contractSearch.payed === true}
                        onChange={() => handlePaymentStatusChange(true)}
                        className="mr-2"
                      />
                      Cobrado
                    </label>
                  </div>

                  {/* Canal */}

                  <label className="block text-black mt-4">Canal</label>
                  <select
                    name="channelId"
                    value={contractSearch.channelId}
                    onChange={handleInputChange}
                    className="w-full px-2 py-1 mt-2 bg-background text-black border border-gray-200 rounded-md focus:outline-none"
                  >
                    <option value="">Seleccione un canal</option>
                    <option value="null">No asignado</option>
                    {channels.map((channel) => (
                      <option key={channel.id} value={channel.id}>
                        {channel.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <div className="mt-6 flex justify-between">
        <div className="flex space-x-4">
          <button
            onClick={handleOrderChange}
            className="bg-foreground text-black px-4 py-2 rounded-md hover:bg-backgroundHover flex items-center"
          >
            {contractSearch.order === "createdAt" ? (
              <FaSortAmountUpAlt className="mr-2" />
            ) : (
              <FaSortAmountDown className="mr-2" />
            )}
            {contractSearch.order === "createdAt" ? "Fecha Creación" : "Fecha Actualización"}
          </button>

          {userGroupId == 1 && (
            <button
              onClick={handleExportExcel}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center"
            >
              {isMobile ? (
                <FaFileExcel className="mr-2" />
              ) : (
                <>
                  <FaFileExcel className="mr-2" /> Exportar a Excel
                </>
              )}

            </button>
          )}
        </div>

        <div className="flex space-x-4">
          <button
            onClick={handleClearFilters}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
          >
            Borrar filtros
          </button>
        </div>
      </div>
    </div>
  );
}
