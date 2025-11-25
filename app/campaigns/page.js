"use client";
import CampaignCard from "@/components/campaign.card";
import { useState, useEffect } from "react";
import { getCookie } from "cookies-next";
import { authGetFetch } from "@/helpers/server-fetch.helper";
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
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
            Campañas
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Gestiona tus campañas y leads
          </p>
        </div>
        <button
          onClick={openModal}
          className="px-5 py-3 rounded-lg neumorphic-button text-white bg-primary hover:bg-primary/90 font-medium flex items-center gap-2"
        >
          <span className="material-icons-outlined">add</span>
          Nueva Campaña
        </button>
      </div>

      {/* Buscador y Filtros */}
      <div className="neumorphic-card p-6 mb-6">
        {/* Buscador global */}
        <div className="relative mb-4">
          <span className="material-icons-outlined absolute top-3 left-3 text-slate-400">
            search
          </span>
          <input
            type="text"
            placeholder="Buscar en todos los leads"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-3 neumorphic-card-inset bg-transparent text-slate-800 dark:text-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50"
          />
        </div>

        {/* Toggle de filtros */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full px-5 py-3 rounded-lg neumorphic-button text-slate-700 dark:text-slate-300 font-medium flex justify-between items-center transition-all"
        >
          <span className="font-semibold">Filtros Avanzados</span>
          <span className={`material-icons-outlined text-primary transition-transform ${showFilters ? 'rotate-180' : ''}`}>
            expand_more
          </span>
        </button>

        {/* Filtros expandibles */}
        {showFilters && (
          <div className="space-y-4 mt-4">
            {/* Filtros de tipo de campaña */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                Tipo de Campaña
              </label>
              <div className="flex flex-wrap gap-3">
                {["Luz", "Gas", "Placas", "Telefonia"].map((type) => (
                  <button
                    key={type}
                    onClick={() => handleFilterChange(type)}
                    className={`neumorphic-button px-4 py-2 rounded-lg font-medium transition-all ${
                      filters[type]
                        ? "active text-primary shadow-neumorphic-inset-light dark:shadow-neumorphic-inset-dark"
                        : "text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    <span className="material-icons-outlined text-sm mr-2 inline-block align-middle">
                      {type === "Luz" ? "lightbulb" : type === "Gas" ? "local_fire_department" : type === "Placas" ? "solar_power" : "phone"}
                    </span>
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Filtros de estado */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Asignado
                </label>
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
                  className="w-full px-4 py-3 neumorphic-card-inset bg-transparent text-slate-800 dark:text-slate-200 rounded-lg border-none focus:ring-2 focus:ring-primary focus:ring-opacity-50"
                >
                  <option value="">Todos</option>
                  <option value="true">Sí</option>
                  <option value="false">No</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Con Adjuntos
                </label>
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
                  className="w-full px-4 py-3 neumorphic-card-inset bg-transparent text-slate-800 dark:text-slate-200 rounded-lg border-none focus:ring-2 focus:ring-primary focus:ring-opacity-50"
                >
                  <option value="">Todos</option>
                  <option value="true">Sí</option>
                  <option value="false">No</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Campaña
                </label>
                <select
                  value={selectedCampaign}
                  onChange={(e) => setSelectedCampaign(e.target.value)}
                  className="w-full px-4 py-3 neumorphic-card-inset bg-transparent text-slate-800 dark:text-slate-200 rounded-lg border-none focus:ring-2 focus:ring-primary focus:ring-opacity-50"
                >
                  <option value="">Todas</option>
                  {[...new Set(campaigns.map((campaign) => campaign.name))].map(
                    (campaignName) => (
                      <option key={campaignName} value={campaignName}>
                        {campaignName}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="md:col-span-2 lg:col-span-1">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Rango de Fechas
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="flex-1 px-4 py-3 neumorphic-card-inset bg-transparent text-slate-800 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="flex-1 px-4 py-3 neumorphic-card-inset bg-transparent text-slate-800 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Grid de campañas */}
      {filteredCampaigns.length === 0 ? (
        <div className="neumorphic-card p-12 text-center">
          <span className="material-icons-outlined text-6xl text-slate-300 dark:text-slate-600 mb-4 block">
            campaign
          </span>
          <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-2">
            No hay campañas disponibles
          </h3>
          <p className="text-slate-600 dark:text-slate-400">
            Crea una nueva campaña para comenzar
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredCampaigns.map((campaign) => (
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
          ))}
        </div>
      )}

      {/* Modales */}
      {isModalOpen && (
        <NewCampaignModal
          closeModal={closeModal}
          onCampaignCreated={fetchCampaigns}
        />
      )}

      <RepeatedLeads />

      {isCommunicationModalOpen && communications[communicationsCurrentIndex] && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
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

      {isLoading && <GlobalLoadingOverlay isLoading={isLoading}></GlobalLoadingOverlay>}
    </div>
  );
}
