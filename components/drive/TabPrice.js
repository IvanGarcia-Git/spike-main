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

  const [openCompanyIds, setOpenCompanyIds] = useState(new Set());

  const isMobile = useIsMobile();

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

  const getRates = useCallback(async () => {
    const jwtToken = getCookie("factura-token");

    try {
      const response = await authGetFetch(`rates/`, jwtToken);
      if (response.ok) {
        const ratesData = await response.json();
        setRates(ratesData);
      } else {
        alert("Error al cargar las tarifas disponibles");
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
    getCompanies();
    getRates();
  }, []);

  useEffect(() => {
    const firstMatching = companies.find((c) => c.type === activeTab);
    if (firstMatching) {
      setOpenCompanyIds(new Set([firstMatching.id]));
    } else {
      setOpenCompanyIds(new Set());
    }
  }, [activeTab, companies]);

  return (
    <div className="flex flex-wrap gap-11 mt-16 pb-16">
      <div className={`flex flex-col  ${isMobile ? "w-full gap-7" : "gap-24"}`}>
        <div className="flex flex-wrap border rounded-full border-black overflow-hidden relative z-0 items-center justify-center">
          <button
            className={`relative z-10 flex-1 text-center py-3 px-6 focus:outline-none transition duration-300 ease-in-out border-r border-black
            ${
              activeTab === "Luz"
                ? "text-yellow-600 font-semibold bg-blue-100"
                : "text-gray-600 hover:text-yellow-600 font-semibold"
            }`}
            onClick={() => setActiveTab("Luz")}
          >
            LUZ
          </button>

          <button
            className={`relative z-10 flex-1 text-center py-3 px-6 focus:outline-none transition duration-300 ease-in-out  border-r border-black
            ${
              activeTab === "Gas"
                ? "text-red-600 font-semibold bg-blue-100"
                : "text-gray-600 hover:text-red-600 font-semibold"
            }`}
            onClick={() => setActiveTab("Gas")}
          >
            GAS
          </button>

          <button
            className={`relative z-10 flex-1 text-center py-3 px-6 focus:outline-none transition duration-300 ease-in-out
            ${
              activeTab === "Telefonía"
                ? "font-semibold bg-blue-100 text-blue-600"
                : "text-gray-600 hover:text-blue-600 font-semibold"
            }`}
            onClick={() => setActiveTab("Telefonía")}
          >
            TLF
          </button>
        </div>

        {activeTab !== "Telefonía" && (
          <div
            className={`flex ${
              !isMobile && "flex-col"
            } gap-5 overflow-hidden relative z-0 items-center justify-center`}
          >
            <button
              className={`relative z-10 w-auto text-center py-3 px-6 focus:outline-none transition duration-300 ease-in-out
            ${
              activeTabVertical === "2.0"
                ? "font-semibold border-b-2 border-blue-100"
                : "text-gray-600 hover:text-blue-600 font-semibold"
            }`}
              onClick={() => setActiveTabVertical("2.0")}
            >
              Tarifa 2.0
            </button>

            <button
              className={`relative z-10 w-auto text-center py-3 px-6 focus:outline-none transition duration-300 ease-in-out
            ${
              activeTabVertical === "3.0"
                ? "font-semibold border-b-2 border-blue-100"
                : "text-gray-600 hover:text-blue-600 font-semibold"
            }`}
              onClick={() => setActiveTabVertical("3.0")}
            >
              Tarifa 3.0
            </button>

            <button
              className={`relative z-10 w-auto text-center py-3 px-6 focus:outline-none transition duration-300 ease-in-out
            ${
              activeTabVertical === "6.1"
                ? "font-semibold border-b-2 border-blue-100"
                : "text-gray-600 hover:text-blue-600 font-semibold"
            }`}
              onClick={() => setActiveTabVertical("6.1")}
            >
              Tarifa 6.1
            </button>
          </div>
        )}
      </div>

      <div className={`w-[2px] bg-blue-100 self-stretch ${isMobile ? "hidden" : "block"}`}></div>

      <div className={`flex flex-col gap-7 ${isMobile ? "w-full" : "w-4/6"}`}>
        {companies
          .filter((company) => company.type === activeTab)
          .map((company) => {
            const isThisCompanyOpen = openCompanyIds.has(company.id);

            return (
              <div key={company.id} className="shadow-md">
                <div
                  className={`bg-blue-100 cursor-pointer flex justify-between items-center p-4 ${
                    isThisCompanyOpen ? "border-b border-blue-50" : ""
                  }`}
                  onClick={() => toggleCompany(company.id)}
                >
                  <img
                    src={company.imageUri}
                    alt={company.name}
                    className="h-24 w-auto object-contain"
                  />
                  <svg
                    className={`w-5 h-5 transform transition-transform duration-200 ${
                      isThisCompanyOpen ? "rotate-180" : "rotate-0"
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    ></path>{" "}
                  </svg>
                </div>

                {isThisCompanyOpen && (
                  <>
                    <div
                      className={`grid ${
                        activeTab === "Telefonía" ? "grid-cols-2" : "grid-cols-6"
                      } gap-4 font-semibold bg-blue-50 px-4 py-5 text-center items-center`}
                    >
                      {activeTab === "Telefonía" ? (
                        <>
                          <div>Tarifa</div>
                          <div>Precio Final</div>
                        </>
                      ) : (
                        <>
                          <div>Tarifa</div> <div>P.Punta</div>
                          <div>P.Valle</div>
                          <div>Energía</div>
                          <div>Excedentes</div>
                          <div>Retro</div>
                        </>
                      )}
                    </div>
                    <div className="px-4 bg-blue-50 text-center items-center pb-7">
                      {rates
                        .filter((rate) => {
                          if (activeTab === "Telefonía") {
                            return rate.companyId === company.id;
                          } else {
                            return rate.companyId === company.id && rate.type === activeTabVertical;
                          }
                        })
                        .map((rate) => (
                          <div
                            key={rate.id}
                            className={`grid hover:bg-blue-100 ${
                              activeTab === "Telefonía" ? "grid-cols-2" : "grid-cols-6"
                            } gap-4 py-3`}
                          >
                            {activeTab === "Telefonía" ? (
                              <>
                                <div className="flex items-center justify-center">{rate.name}</div>
                                <div className="flex items-center justify-center">
                                  {rate.finalPrice || "-"}
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="flex items-center justify-center">
                                  {rate.name || "-"}{" "}
                                </div>
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
                                      powerValues.length > 0 ? Math.max(...powerValues) : null;

                                    return (
                                      maxPower !== null && (
                                        <span className="bg-yellow-300 text-black px-4 py-2 rounded-full text-sm font-medium flex flex-wrap items-center justify-center">
                                          {maxPower}
                                        </span>
                                      )
                                    );
                                  })()}
                                </div>

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
                                      powerValues.length > 0 ? Math.min(...powerValues) : null;

                                    return (
                                      minPower !== null && (
                                        <span className="bg-yellow-300 text-black px-4 py-2 rounded-full text-sm font-medium flex flex-wrap items-center justify-center">
                                          {minPower}
                                        </span>
                                      )
                                    );
                                  })()}
                                </div>

                                <div className="flex flex-wrap items-center justify-center gap-2">
                                  {rate.energySlot1 && (
                                    <span className="bg-blue-400 text-black px-4 py-2 rounded-full text-sm font-medium">
                                      {rate.energySlot1}
                                    </span>
                                  )}
                                  {rate.energySlot2 && (
                                    <span className="bg-blue-400 text-black px-4 py-2 rounded-full text-sm font-medium">
                                      {rate.energySlot2}
                                    </span>
                                  )}
                                  {rate.energySlot3 && (
                                    <span className="bg-blue-400 text-black px-4 py-2 rounded-full text-sm font-medium">
                                      {rate.energySlot3}
                                    </span>
                                  )}
                                  {rate.energySlot4 && (
                                    <span className="bg-blue-400 text-black px-4 py-2 rounded-full text-sm font-medium">
                                      {rate.energySlot4}
                                    </span>
                                  )}
                                  {rate.energySlot5 && (
                                    <span className="bg-blue-400 text-black px-4 py-2 rounded-full text-sm font-medium">
                                      {rate.energySlot5}
                                    </span>
                                  )}
                                  {rate.energySlot6 && (
                                    <span className="bg-blue-400 text-black px-4 py-2 rounded-full text-sm font-medium">
                                      {rate.energySlot6}
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center justify-center">
                                  {rate.surplusSlot1 && (
                                    <span className="bg-pink-400 text-black px-4 py-2 rounded-full text-sm font-medium flex flex-wrap items-center justify-center">
                                      {rate.surplusSlot1}
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center justify-center">
                                  {rate.renewDays || "-"}
                                </div>
                              </>
                            )}
                          </div>
                        ))}

                      {rates.filter((rate) =>
                        activeTab === "Telefonía"
                          ? rate.companyId === company.id
                          : rate.companyId === company.id && rate.type === activeTabVertical
                      ).length === 0 && (
                        <div className="text-center text-gray-500 text-sm py-4">
                          {activeTab === "Telefonía"
                            ? `No hay tarifas de telefonía disponibles para "${company.name}".`
                            : `No hay tarifas disponibles para la tarifa "${activeTabVertical}" de "${company.name}".`}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}

        {companies.filter((company) => company.type === activeTab).length === 0 && (
          <div className="text-center text-gray-500 py-8">
            No hay datos disponibles para "{activeTab}".
          </div>
        )}
      </div>
    </div>
  );
}

export default TabPrice;
