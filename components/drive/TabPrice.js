"use client";

import { authGetFetch } from "@/helpers/server-fetch.helper";
import { getCookie } from "cookies-next";
import { useState, useEffect, useCallback } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

function TabPrice() {
  const [activeTab, setActiveTab] = useState("Luz");
  const [activeTabVertical, setActiveTabVertical] = useState("2.0");

  const [companies, setCompanies] = useState([]);
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(true);

  const [openCompanyIds, setOpenCompanyIds] = useState(new Set());
  const [failedImages, setFailedImages] = useState(new Set());

  const isMobile = useIsMobile();

  const handleImageError = (companyId) => {
    setFailedImages((prev) => new Set([...prev, companyId]));
  };

  const getCompanies = async () => {
    const jwtToken = getCookie("factura-token");

    try {
      const response = await authGetFetch("companies/", jwtToken);

      if (response.ok) {
        const companiesResponse = await response.json();
        setCompanies(companiesResponse);
      } else {
        console.error("Error cargando la información de las compañías");
      }
    } catch (error) {
      console.error("Error enviando la solicitud:", error);
    }
  };

  const getRates = useCallback(async () => {
    const jwtToken = getCookie("factura-token");

    try {
      const response = await authGetFetch(`rates/`, jwtToken);
      if (response.ok) {
        const ratesData = await response.json();
        setRates(ratesData);
      } else {
        console.error("Error al cargar las tarifas disponibles");
      }
    } catch (error) {
      console.error("Error al obtener las tarifas:", error);
    }
  }, []);

  const toggleCompany = (companyId) => {
    setOpenCompanyIds((prevOpenIds) => {
      const newOpenIds = new Set(prevOpenIds);
      if (newOpenIds.has(companyId)) {
        newOpenIds.delete(companyId);
      } else {
        newOpenIds.add(companyId);
      }
      return newOpenIds;
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([getCompanies(), getRates()]);
      setLoading(false);
    };
    fetchData();
  }, []);

  // Filtrar compañías que tienen tarifas con el serviceType activo
  // Si rate.serviceType está definido, lo usa; si no, usa company.type como fallback
  const getCompaniesWithServiceType = (serviceType) => {
    return companies.filter((company) =>
      rates.some((rate) => {
        const rateServiceType = rate.serviceType || rate.company?.type;
        return rate.company?.id === company.id && rateServiceType === serviceType;
      })
    );
  };

  useEffect(() => {
    const companiesWithServiceType = getCompaniesWithServiceType(activeTab);
    const firstMatching = companiesWithServiceType[0];
    if (firstMatching) {
      setOpenCompanyIds(new Set([firstMatching.id]));
    } else {
      setOpenCompanyIds(new Set());
    }
  }, [activeTab, companies, rates]);

  const tabs = [
    { id: "Luz", label: "LUZ", icon: "bolt" },
    { id: "Gas", label: "GAS", icon: "local_fire_department" },
    { id: "Telefonía", label: "TLF", icon: "phone" },
  ];

  const tarifaTabs = [
    { id: "2.0", label: "Tarifa 2.0" },
    { id: "3.0", label: "Tarifa 3.0" },
    { id: "6.1", label: "Tarifa 6.1" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="neumorphic-card p-8 rounded-xl text-center">
          <span className="material-icons-outlined text-5xl text-primary animate-spin">
            refresh
          </span>
          <p className="mt-4 text-slate-600 dark:text-slate-400">
            Cargando precios...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isMobile ? "flex-col" : "flex-row"} gap-6`}>
      {/* Sidebar de filtros */}
      <div className={`${isMobile ? "w-full" : "w-64"} flex-shrink-0`}>
        <div className="neumorphic-card p-6 sticky top-6">
          {/* Tabs de tipo de energía */}
          <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
            Tipo de Servicio
          </h3>
          <div className="flex flex-col gap-2 mb-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center p-3 rounded-lg transition-all ${
                  activeTab === tab.id
                    ? "neumorphic-button active bg-primary/10 text-primary"
                    : "neumorphic-button text-slate-600 dark:text-slate-400 hover:text-primary"
                }`}
              >
                <span className="material-icons-outlined mr-3">{tab.icon}</span>
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tabs de tarifa (solo para Luz y Gas) */}
          {activeTab !== "Telefonía" && (
            <>
              <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
                Tipo de Tarifa
              </h3>
              <div className="flex flex-col gap-2">
                {tarifaTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTabVertical(tab.id)}
                    className={`flex items-center p-3 rounded-lg transition-all ${
                      activeTabVertical === tab.id
                        ? "neumorphic-button active bg-primary/10 text-primary"
                        : "neumorphic-button text-slate-600 dark:text-slate-400 hover:text-primary"
                    }`}
                  >
                    <span className="material-icons-outlined mr-3">
                      electric_meter
                    </span>
                    <span className="font-medium">{tab.label}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex-1">
        <div className="space-y-4">
          {getCompaniesWithServiceType(activeTab)
            .map((company) => {
              const isThisCompanyOpen = openCompanyIds.has(company.id);

              return (
                <div key={company.id} className="neumorphic-card overflow-hidden">
                  {/* Header de la compañía */}
                  <div
                    className={`cursor-pointer flex justify-between items-center p-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                      isThisCompanyOpen
                        ? "border-b border-slate-200 dark:border-slate-700"
                        : ""
                    }`}
                    onClick={() => toggleCompany(company.id)}
                  >
                    <div className="flex items-center gap-4">
                      {company.imageUri && !failedImages.has(company.id) ? (
                        <img
                          src={company.imageUri}
                          alt={company.name}
                          className="h-16 w-auto object-contain"
                          onError={() => handleImageError(company.id)}
                        />
                      ) : (
                        <div className="h-16 w-32 neumorphic-card-inset rounded-lg flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800">
                          <span className="material-icons-outlined text-3xl text-slate-400 dark:text-slate-500 mr-2">
                            business
                          </span>
                          <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 truncate max-w-20">
                            {company.name}
                          </span>
                        </div>
                      )}
                    </div>
                    <span
                      className={`material-icons-outlined text-slate-500 transition-transform duration-200 ${
                        isThisCompanyOpen ? "rotate-180" : "rotate-0"
                      }`}
                    >
                      expand_more
                    </span>
                  </div>

                  {/* Contenido expandible */}
                  {isThisCompanyOpen && (
                    <div className="p-4">
                      {/* Header de la tabla */}
                      <div
                        className={`grid ${
                          activeTab === "Telefonía" ? "grid-cols-2" : "grid-cols-6"
                        } gap-4 mb-4`}
                      >
                        {activeTab === "Telefonía" ? (
                          <>
                            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">
                              Tarifa
                            </div>
                            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">
                              Precio Final
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">
                              Tarifa
                            </div>
                            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">
                              P.Punta
                            </div>
                            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">
                              P.Valle
                            </div>
                            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">
                              Energía
                            </div>
                            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">
                              Excedentes
                            </div>
                            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">
                              Retro
                            </div>
                          </>
                        )}
                      </div>

                      {/* Filas de tarifas */}
                      <div className="space-y-2">
                        {rates
                          .filter((rate) => {
                            if (activeTab === "Telefonía") {
                              return rate.companyId === company.id;
                            } else {
                              return (
                                rate.companyId === company.id &&
                                rate.type === activeTabVertical
                              );
                            }
                          })
                          .map((rate) => (
                            <div
                              key={rate.id}
                              className={`grid ${
                                activeTab === "Telefonía"
                                  ? "grid-cols-2"
                                  : "grid-cols-6"
                              } gap-4 p-3 rounded-lg neumorphic-card-inset hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors`}
                            >
                              {activeTab === "Telefonía" ? (
                                <>
                                  <div className="flex items-center justify-center">
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                      {rate.name}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-center">
                                    <span className="px-3 py-1 rounded-full text-sm font-semibold bg-primary/20 text-primary">
                                      {rate.finalPrice || "-"}
                                    </span>
                                  </div>
                                </>
                              ) : (
                                <>
                                  {/* Nombre de tarifa */}
                                  <div className="flex items-center justify-center">
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                      {rate.name || "-"}
                                    </span>
                                  </div>

                                  {/* P.Punta (máximo de power slots) */}
                                  <div className="flex items-center justify-center">
                                    {(() => {
                                      const powerValues = [
                                        rate.powerSlot1,
                                        rate.powerSlot2,
                                        rate.powerSlot3,
                                        rate.powerSlot4,
                                        rate.powerSlot5,
                                        rate.powerSlot6,
                                      ]
                                        .map((value) => parseFloat(value))
                                        .filter((value) => !isNaN(value));
                                      const maxPower =
                                        powerValues.length > 0
                                          ? Math.max(...powerValues)
                                          : null;

                                      return maxPower !== null ? (
                                        <span className="px-3 py-1 rounded-full text-sm font-semibold bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400">
                                          {maxPower}
                                        </span>
                                      ) : (
                                        <span className="text-slate-400">-</span>
                                      );
                                    })()}
                                  </div>

                                  {/* P.Valle (mínimo de power slots) */}
                                  <div className="flex items-center justify-center">
                                    {(() => {
                                      const powerValues = [
                                        rate.powerSlot1,
                                        rate.powerSlot2,
                                        rate.powerSlot3,
                                        rate.powerSlot4,
                                        rate.powerSlot5,
                                        rate.powerSlot6,
                                      ]
                                        .map((value) => parseFloat(value))
                                        .filter((value) => !isNaN(value));
                                      const minPower =
                                        powerValues.length > 0
                                          ? Math.min(...powerValues)
                                          : null;

                                      return minPower !== null ? (
                                        <span className="px-3 py-1 rounded-full text-sm font-semibold bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400">
                                          {minPower}
                                        </span>
                                      ) : (
                                        <span className="text-slate-400">-</span>
                                      );
                                    })()}
                                  </div>

                                  {/* Energía (slots de energía) */}
                                  <div className="flex flex-wrap items-center justify-center gap-1">
                                    {[
                                      rate.energySlot1,
                                      rate.energySlot2,
                                      rate.energySlot3,
                                      rate.energySlot4,
                                      rate.energySlot5,
                                      rate.energySlot6,
                                    ]
                                      .filter(Boolean)
                                      .map((value, index) => (
                                        <span
                                          key={index}
                                          className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400"
                                        >
                                          {value}
                                        </span>
                                      ))}
                                    {![
                                      rate.energySlot1,
                                      rate.energySlot2,
                                      rate.energySlot3,
                                      rate.energySlot4,
                                      rate.energySlot5,
                                      rate.energySlot6,
                                    ].some(Boolean) && (
                                      <span className="text-slate-400">-</span>
                                    )}
                                  </div>

                                  {/* Excedentes */}
                                  <div className="flex items-center justify-center">
                                    {rate.surplusSlot1 ? (
                                      <span className="px-3 py-1 rounded-full text-sm font-semibold bg-pink-100 dark:bg-pink-900/50 text-pink-700 dark:text-pink-400">
                                        {rate.surplusSlot1}
                                      </span>
                                    ) : (
                                      <span className="text-slate-400">-</span>
                                    )}
                                  </div>

                                  {/* Retro */}
                                  <div className="flex items-center justify-center">
                                    {rate.renewDays ? (
                                      <span className="px-3 py-1 rounded-full text-sm font-semibold bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-400">
                                        {rate.renewDays} días
                                      </span>
                                    ) : (
                                      <span className="text-slate-400">-</span>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                          ))}

                        {/* Mensaje si no hay tarifas */}
                        {rates.filter((rate) =>
                          activeTab === "Telefonía"
                            ? rate.companyId === company.id
                            : rate.companyId === company.id &&
                              rate.type === activeTabVertical
                        ).length === 0 && (
                          <div className="text-center py-8">
                            <span className="material-icons-outlined text-4xl text-slate-300 dark:text-slate-600 mb-2">
                              info
                            </span>
                            <p className="text-slate-500 dark:text-slate-400 text-sm">
                              {activeTab === "Telefonía"
                                ? `No hay tarifas de telefonía disponibles para "${company.name}".`
                                : `No hay tarifas disponibles para la tarifa "${activeTabVertical}" de "${company.name}".`}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

          {/* Mensaje si no hay compañías */}
          {getCompaniesWithServiceType(activeTab).length === 0 && (
            <div className="neumorphic-card p-8 text-center">
              <span className="material-icons-outlined text-6xl text-slate-300 dark:text-slate-600 mb-4">
                business
              </span>
              <p className="text-slate-500 dark:text-slate-400">
                No hay compañías con tarifas de "{activeTab}" disponibles.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TabPrice;
