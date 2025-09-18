"use client";
import CampaignCard from "@/components/campaign.card";
import { useState, useEffect } from "react";
import { getCookie } from "cookies-next";
import { authGetFetch } from "@/helpers/server-fetch.helper";
import { FiSearch, FiPlus } from "react-icons/fi";
import { AiOutlineWarning } from "react-icons/ai";
import NewCampaignModal from "@/components/new-campaign.modal";
import RepeatedLeads from "@/components/repeated-leads.sections";
import CommunicationModal from "@/components/communication.modal";
import { useLayout } from "../layout";
import GlobalLoadingOverlay from "@/components/global-loading.overlay";

export default function CampaignsPage() {
  //Filters
  const [searchInput, setSearchInput] = useState("");
  const [globalSearchTerm, setGlobalSearchTerm] = useState("");

  const [globalAssignedFilter, setGlobalAssignedFilter] = useState(null);
  const [globalBillFilter, setGlobalBillFilter] = useState(null);
  const [selectedCampaign, setSelectedCampaign] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const [campaigns, setCampaigns] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState([]);
  const [filters, setFilters] = useState({
    Luz: false,
    Gas: false,
    Placas: false,
    Telefonia: false,
  });

  const [communications, setCommunications] = useState([]);
  const [communicationsCurrentIndex, setCommunicationsCurrentIndex] = useState(0);
  const [isCommunicationModalOpen, setIsCommunicationModalOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(true);

  const { sideBarHidden, setSideBarHidden } = useLayout();

  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);

  const closeModal = () => setIsModalOpen(false);

  const fetchCampaigns = async () => {
    const jwtToken = getCookie("factura-token");

    try {
      const response = await authGetFetch("campaigns/basic", jwtToken);
      if (response.ok) {
        const campaignsData = await response.json();
        setCampaigns(campaignsData);
        setFilteredCampaigns(campaignsData);
      } else {
        alert("Error al cargar las campañas");
      }
      setIsLoading(false);
    } catch (error) {
      console.error("Error al obtener las campañas:", error);
    }
  };

  const getAllUsers = async () => {
    const jwtToken = getCookie("factura-token");

    try {
      const response = await authGetFetch("users/all", jwtToken);

      if (response.ok) {
        const responseJson = await response.json();
        setAllUsers(responseJson);
      } else {
        console.error("Error cargando la información de los usuarios");
      }
    } catch (error) {
      console.error("Error enviando la solicitud:", error);
    }
  };

  const getUnnotifiedNotifications = async () => {
    const jwtToken = getCookie("factura-token");

    try {
      const response = await authGetFetch("notifications/unnotified", jwtToken);

      if (response.ok) {
        const notificationsResponse = await response.json();

        const onlyCommunications = notificationsResponse.filter(
          (notification) => notification.eventType === "communication"
        );

        setCommunications(onlyCommunications);
      } else {
        console.error("Error cargando las notificaciones");
      }
    } catch (error) {
      console.error("Error enviando la solicitud:", error);
    }
  };

  useEffect(() => {
    fetchCampaigns();
    getAllUsers();
    getUnnotifiedNotifications();
  }, []);

  useEffect(() => {
    if (communications.length > 0) {
      setIsCommunicationModalOpen(true);
      setSideBarHidden(true);
    }
  }, [communications]);

  const handleFilterChange = (type) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [type]: !prevFilters[type],
    }));
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      setGlobalSearchTerm(searchInput);
    }, 500);

    return () => clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    const activeFilters = Object.keys(filters).filter((type) => filters[type]);

    let updatedCampaigns = campaigns;

    // Filtro por tipo
    if (activeFilters.length > 0) {
      updatedCampaigns = updatedCampaigns.filter((campaign) =>
        activeFilters.includes(campaign.sector)
      );
    }

    // Filtro por campaña seleccionada
    if (selectedCampaign) {
      updatedCampaigns = updatedCampaigns.filter((campaign) => campaign.name === selectedCampaign);
    }

    setFilteredCampaigns(updatedCampaigns);
  }, [filters, campaigns, selectedCampaign]);

  return (
    <div className="flex justify-center items-start bg-foref min-h-screen">
      <div className="w-full mx-auto p-4 bg-background text-black rounded-lg ">
        {/* Contenedor para el buscador y filtros */}
        <div className="flex flex-col items-center gap-4 mb-6">
          {/* Contenedor del buscador y filtros en el centro */}
          <div className="w-full p-8 rounded-md md:w-3/5 flex flex-col items-center bg-foreground">
            <div className="w-full max-w-lg">
              {/* Buscador */}
              <div className="relative w-full mb-3">
                <FiSearch className="absolute top-3 left-2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar en todos los leads"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-backgroundHover text-black rounded-md focus:outline-none"
                />
              </div>

              {/* Botón para mostrar/ocultar filtros */}
              <div
                onClick={() => setShowFilters(!showFilters)}
                className="flex justify-between items-center cursor-pointer mb-3 px-2 py-2 bg-gray-100 rounded-md hover:bg-gray-200 transition"
              >
                <h2 className="text-black font-semibold">Filtros</h2>
                <span className="text-blue-600 font-semibold text-sm">
                  {showFilters ? "▲ Ocultar" : "▼ Mostrar"}
                </span>
              </div>

              {/* Filtros */}
              {showFilters && (
                <>
                  {/* Filtros de tipo de campaña */}
                  <div className="flex flex-wrap justify-center gap-3 mb-3">
                    {["Luz", "Gas", "Placas", "Telefonia"].map((type) => (
                      <label key={type} className="flex items-center">
                        <input
                          type="checkbox"
                          className="mr-2"
                          checked={filters[type]}
                          onChange={() => handleFilterChange(type)}
                        />
                        {type}
                      </label>
                    ))}
                  </div>

                  {/* Filtro de Asignado y Adjuntos */}
                  <div className="flex justify-center gap-4 mb-3">
                    <label className="flex items-center">
                      <span className="mr-2">Asignado:</span>
                      <select
                        value={
                          globalAssignedFilter === true
                            ? "true"
                            : globalAssignedFilter === false
                            ? "false"
                            : ""
                        }
                        onChange={(e) => {
                          const value = e.target.value;
                          setGlobalAssignedFilter(
                            value === "true" ? true : value === "false" ? false : null
                          );
                        }}
                        className="px-2 py-1 bg-gray-100 text-black rounded-md focus:outline-none"
                      >
                        <option value="">Todos</option>
                        <option value="true">Sí</option>
                        <option value="false">No</option>
                      </select>
                    </label>

                    <label className="flex items-center">
                      <span className="mr-2">Adjuntos:</span>
                      <select
                        value={
                          globalBillFilter === true
                            ? "true"
                            : globalBillFilter === false
                            ? "false"
                            : ""
                        }
                        onChange={(e) => {
                          const value = e.target.value;
                          setGlobalBillFilter(
                            value === "true" ? true : value === "false" ? false : null
                          );
                        }}
                        className="px-2 py-1 bg-gray-100 text-black rounded-md focus:outline-none"
                      >
                        <option value="">Todos</option>
                        <option value="true">Sí</option>
                        <option value="false">No</option>
                      </select>
                    </label>
                  </div>

                  {/* Filtro de Campaña */}
                  <div className="flex justify-center gap-4 mb-3">
                    <label className="flex items-center">
                      <span className="mr-2">Campaña:</span>
                      <select
                        value={selectedCampaign}
                        onChange={(e) => setSelectedCampaign(e.target.value)}
                        className="px-2 py-1 bg-gray-100 text-black rounded-md focus:outline-none w-20"
                      >
                        <option value="">Todos</option>
                        {[...new Set(campaigns.map((campaign) => campaign.name))].map(
                          (campaignName) => (
                            <option key={campaignName} value={campaignName}>
                              {campaignName}
                            </option>
                          )
                        )}
                      </select>
                    </label>
                  </div>

                  {/* Filtros de Fecha "Desde" y "Hasta" */}
                  <div className="flex justify-center gap-4 mb-3">
                    <label className="flex flex-col items-center">
                      <span className="text-sm mb-1">Desde:</span>
                      <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="px-2 py-1 bg-gray-100 text-black rounded-md focus:outline-none"
                      />
                    </label>
                    <label className="flex flex-col items-center">
                      <span className="text-sm mb-1">Hasta:</span>
                      <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="px-2 py-1 bg-gray-100 text-black rounded-md focus:outline-none"
                      />
                    </label>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Botón para crear una nueva campaña */}
          <div className="w-full flex justify-start">
            <button
              onClick={openModal}
              className="text-red-500 flex items-center hover:text-red-700 bg-gray-200 px-4 py-2 rounded-full font-semibold"
            >
              <FiPlus className="mr-2" />
              Campaña
            </button>
          </div>
        </div>

        {/* Contenedor adaptable para las campañas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredCampaigns.length === 0 ? (
            <div className="flex justify-center items-center h-full w-full mb-8">
              <div className="bg-yellow-100 border border-yellow-300 text-yellow-700 px-6 py-4 rounded-lg flex items-center space-x-3 shadow-md max-w-md mx-auto">
                <AiOutlineWarning className="h-6 w-6 text-yellow-500" />
                <p className="text-lg font-semibold">No hay campañas disponibles</p>
              </div>
            </div>
          ) : (
            filteredCampaigns.map((campaign) => (
              <CampaignCard
                key={campaign.id}
                allUsers={allUsers}
                campaign={campaign}
                globalSearchTerm={globalSearchTerm}
                globalAssignedFilter={globalAssignedFilter}
                globalBillFilter={globalBillFilter}
                dateFrom={dateFrom}
                dateTo={dateTo}
              />
            ))
          )}
        </div>

        {isModalOpen && (
          <NewCampaignModal
            closeModal={closeModal}
            onCampaignCreated={fetchCampaigns}
          />
        )}

        <RepeatedLeads />

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
      </div>
      {isLoading && <GlobalLoadingOverlay isLoading={isLoading}></GlobalLoadingOverlay>}
    </div>
  );
}
