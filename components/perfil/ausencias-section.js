"use client";

import { useState, useEffect } from "react";
import {
  FiPlus as Plus,
  FiChevronLeft as ChevronLeft,
  FiChevronRight as ChevronRight,
  FiCalendar as CalendarIcon,
  FiTrash2 as TrashIcon,
} from "react-icons/fi";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  parseISO,
  differenceInCalendarDays,
} from "date-fns";
import { es } from "date-fns/locale";
import { getCookie } from "cookies-next";
import { authGetFetch, authFetch } from "@/helpers/server-fetch.helper";
import { FaPlus } from "react-icons/fa";
import ModalAddHolidays from "./modals/modal-add-holidays";

const TOTAL_PERSONAL_DAYS = 4;

const getAbsenceTypeDisplayName = (type) => {
  const typeMap = {
    vacaciones: "Vacaciones",
    asuntos_propios: "Asuntos propios",
    baja_medica: "Baja médica",
    otro: "Otro",
  };
  return typeMap[type] || type.charAt(0).toUpperCase() + type.slice(1);
};

const getAbsenceTypeColor = (type, status) => {
  if (status === "aprobada") {
    return "bg-green-100 text-green-800";
  } else if (status === "pendiente") {
    return "bg-yellow-100 text-yellow-800";
  } else if (status === "rechazada") {
    return "bg-red-100 text-red-800";
  }
  return "bg-gray-100 text-gray-800";
};

export default function AusenciasSection({ userInfo, userGroupId }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showAllVacationRequests, setShowAllVacationRequests] = useState(false);
  const [showAllHolidays, setShowAllHolidays] = useState(false);
  const [isManagingVacations, setIsManagingVacations] = useState(false);
  const [verModal, setVerModal] = useState(false);
  const [vacationRequests, setVacationRequests] = useState([]);
  const [holidaysModal, setHolidaysModal] = useState(false);
  const [holidays, setHolidays] = useState([]);
  const todayForFilter = new Date();
  const futureHolidays = holidays
    .filter((holiday) => {
      const holidayDate = parseISO(holiday?.date);

      return differenceInCalendarDays(holidayDate, todayForFilter) >= 0;
    })
    .sort((a, b) => differenceInCalendarDays(parseISO(a.date), parseISO(b.date)));
  const sortedVacationRequests = vacationRequests
    .filter((req) => {
      const startDate = parseISO(req.startDate);
      return differenceInCalendarDays(startDate, todayForFilter) >= 0;
    })
    .sort((a, b) => {
      const createdA = new Date(a.createdAt).getTime();
      const createdB = new Date(b.createdAt).getTime();
      return createdB - createdA;
    });

  const sortedPastVacationRequests = vacationRequests
    .filter((req) => {
      const startDate = parseISO(req.startDate);
      return differenceInCalendarDays(startDate, todayForFilter) < 0;
    })
    .sort((a, b) => {
      const dateA = parseISO(a.startDate);
      const dateB = parseISO(b.startDate);
      return differenceInCalendarDays(dateA, dateB);
    });

  const [calculatedVacationStats, setCalculatedVacationStats] = useState({
    available: calculateAvailableVacationDays(),
    used: 0,
  });
  const [personalDaysStats, setPersonalDaysStats] = useState({
    used: 0,
    available: TOTAL_PERSONAL_DAYS,
  });
  const [requestStartDate, setRequestStartDate] = useState("");
  const [requestEndDate, setRequestEndDate] = useState("");
  const [requestReason, setRequestReason] = useState("");
  const [requestType, setRequestType] = useState("vacaciones");
  const [activeDropdownRequestUuid, setActiveDropdownRequestUuid] = useState(null);
  const statusOptions = [
    { value: "pendiente", label: "Pendiente" },
    { value: "aprobada", label: "Aprobada" },
    { value: "rechazada", label: "Rechazada" },
  ];

  const handleDirectStatusUpdate = async (requestToUpdate, newStatus) => {
    if (!requestToUpdate || !newStatus) {
      alert("Error interno: Falta información para actualizar.");
      setActiveDropdownRequestUuid(null);
      return;
    }

    if (requestToUpdate.status === newStatus) {
      setActiveDropdownRequestUuid(null);
      return;
    }

    const jwtToken = getCookie("factura-token");
    if (!jwtToken) {
      alert("Sesión no válida. Por favor, inicia sesión de nuevo.");
      setActiveDropdownRequestUuid(null);
      return;
    }

    const payload = { status: newStatus };

    try {
      const response = await authFetch(
        "PATCH",
        `absences/${requestToUpdate.uuid}`,
        payload,
        jwtToken
      );

      if (response.ok) {
        const updatedRequestFromServer = await response.json();
        setVacationRequests((prevRequests) =>
          prevRequests.map((req) =>
            req.uuid === updatedRequestFromServer.uuid ? updatedRequestFromServer : req
          )
        );
        alert("Estado de la solicitud actualizado con éxito.");
      } else {
        const errorData = await response.json().catch(() => ({
          message: "Error desconocido al actualizar el estado.",
        }));
        alert(`Error al actualizar estado: ${errorData.message || response.statusText}`);
      }
    } catch (error) {
      console.error("Error actualizando estado de solicitud:", error);
      alert("Error de red o conexión al intentar actualizar el estado.");
    } finally {
      setActiveDropdownRequestUuid(null);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        activeDropdownRequestUuid &&
        !event.target.closest(".status-dropdown-container") &&
        !event.target.closest(".status-chip-button")
      ) {
        setActiveDropdownRequestUuid(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [activeDropdownRequestUuid]);

  useEffect(() => {
    async function loadData() {
      const jwtToken = getCookie("factura-token");
      if (!jwtToken) {
        alert("Sesión no válida. Por favor, inicia sesión de nuevo.");
        setVacationRequests([]);
        setHolidays([]);
        return;
      }

      if (userInfo?.id && jwtToken) {
        try {
          const [reqsRes, holsRes] = await Promise.all([
            authGetFetch(`absences/user/${userInfo.id}`, jwtToken),
            authGetFetch("holidays", jwtToken),
          ]);

          if (reqsRes.ok) {
            const fetchedRequests = await reqsRes.json();
            setVacationRequests(fetchedRequests);
          } else {
            console.error("Error fetching vacation requests:", reqsRes.statusText);
            setVacationRequests([]);
          }

          if (holsRes.ok) {
            const fetchedHolidays = await holsRes.json();
            setHolidays((prevHolidays) => [...prevHolidays, ...fetchedHolidays]);
          } else {
            console.error("Error fetching holidays:", holsRes.statusText);
            setHolidays([]);
          }
        } catch (error) {
          console.error("Error loading absence data:", error);
          setVacationRequests([]);
          setHolidays([]);
        }
      } else {
        setVacationRequests([]);
        setHolidays([]);
      }
    }
    loadData();
  }, [userInfo]);

  useEffect(() => {
    const currentYear = new Date().getFullYear();
    let currentYearApprovedVacationDays = 0;
    let currentYearApprovedAsuntosPropiosDays = 0;

    vacationRequests.forEach((req) => {
      if (req.status === "aprobada") {
        const absenceStartDate = parseISO(req.startDate);
        const absenceEndDate = parseISO(req.endDate);

        if (
          absenceEndDate.getFullYear() >= currentYear &&
          absenceStartDate.getFullYear() <= currentYear
        ) {
          let daysCountInYear = 0;
          for (
            let d = new Date(absenceStartDate);
            d <= absenceEndDate;
            d.setDate(d.getDate() + 1)
          ) {
            if (d.getFullYear() === currentYear) {
              daysCountInYear++;
            }
          }

          if (req.type === "vacaciones") {
            currentYearApprovedVacationDays += daysCountInYear;
          } else if (req.type === "asuntos_propios") {
            currentYearApprovedAsuntosPropiosDays += daysCountInYear;
          }
        }
      }
    });

    setCalculatedVacationStats({
      used: currentYearApprovedVacationDays,
      available: calculateAvailableVacationDays() - currentYearApprovedVacationDays,
    });

    setPersonalDaysStats({
      used: currentYearApprovedAsuntosPropiosDays,
      available: TOTAL_PERSONAL_DAYS - currentYearApprovedAsuntosPropiosDays,
    });
  }, [vacationRequests, holidays, userInfo]);

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => {
    setIsModalOpen(false);
    setRequestStartDate("");
    setRequestEndDate("");
    setRequestReason("");
    setRequestType("vacaciones");
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();

    if (!requestStartDate || !requestEndDate) {
      alert("Por favor, selecciona las fechas de inicio y fin.");
      return;
    }

    if (parseISO(requestEndDate) < parseISO(requestStartDate)) {
      alert("La fecha de fin no puede ser anterior a la fecha de inicio.");
      return;
    }

    const jwtToken = getCookie("factura-token");
    if (!jwtToken) {
      alert("Sesión no válida. Por favor, inicia sesión de nuevo.");
      return;
    }

    const newRequestPayload = {
      userId: Number(userInfo.id),
      startDate: requestStartDate,
      endDate: requestEndDate,
      type: requestType,
      description: requestReason,
    };

    try {
      const response = await authFetch("POST", "absences", newRequestPayload, jwtToken);

      if (response.ok) {
        const createdAbsence = await response.json();
        setVacationRequests((prev) => {
          const updatedRequests = [createdAbsence, ...prev];
          return updatedRequests;
        });

        closeModal();
        alert("Solicitud enviada con éxito.");
      } else {
        const errorData = await response.json().catch(() => ({
          message: "Error desconocido al enviar la solicitud.",
        }));
        alert(`Error al enviar la solicitud: ${errorData.message || response.statusText}`);
        console.error("Server error response:", errorData);
      }
    } catch (error) {
      console.error("Error en la solicitud para crear ausencia:", error);
      alert("Error de red o conexión al intentar crear la solicitud.");
    }
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const daysToDisplay = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  const dayNames = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  const getDayEvents = (day) => {
    const events = [];
    if (isSameMonth(day, currentDate)) {
      holidays.forEach((h) => {
        if (isSameDay(parseISO(h.date), day)) {
          events.push({
            type: "festivo",
            name: h.localName || h.name,
            color: "bg-pink-100 text-pink-700",
          });
        }
      });

      vacationRequests.forEach((req) => {
        const startDate = parseISO(req.startDate);
        const endDate = parseISO(req.endDate);

        if (day >= startDate && day <= endDate) {
          const eventColor = getAbsenceTypeColor(req.type, req.status);
          const eventName = req.description || getAbsenceTypeDisplayName(req.type);

          if (eventColor) {
            events.push({
              type: req.type,
              name: eventName,
              color: eventColor,
              status: req.status,
            });
          }
        }
      });
    }

    const festivoEvent = events.find((event) => event.type === "festivo");
    if (festivoEvent) {
      return [festivoEvent];
    }

    const absenceEvent = events.find((event) => event.type !== "festivo");
    if (absenceEvent) {
      return [absenceEvent];
    }

    return events.slice(0, 1);
  };

  const toInputDate = (date) => {
    if (!date) return "";
    const d = date instanceof Date ? date : new Date(date);
    if (Number.isNaN(d.getTime())) return "";
    return d.toISOString().slice(0, 10);
  };

  const { available, used } = calculatedVacationStats;
  const totalAnnual = calculateAvailableVacationDays();
  const availablePercentage = totalAnnual > 0 ? (available / totalAnnual) * 100 : 0;
  const usedPercentage = totalAnnual > 0 ? (used / totalAnnual) * 100 : 0;

  const handleDeleteRequest = async (requestUuidToDelete) => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar esta solicitud?")) {
      return;
    }
    const jwtToken = getCookie("factura-token");
    if (!jwtToken) {
      alert("Sesión no válida.");
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/absences/${requestUuidToDelete}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwtToken}`,
          },
        }
      );

      if (response.ok || response.status === 204) {
        setVacationRequests((prevRequests) =>
          prevRequests.filter((req) => req.uuid !== requestUuidToDelete)
        );
        alert("Solicitud eliminada con éxito.");
      } else {
        const errorData = await response.json().catch(() => ({ message: "Error al eliminar." }));
        alert(`Error al eliminar solicitud: ${errorData.message || response.statusText}`);
      }
    } catch (error) {
      console.error("Error eliminando solicitud:", error);
      alert("Error de red al eliminar la solicitud.");
    }
  };

  function calculateAvailableVacationDays() {
    const today = new Date();
    const currentYear = today.getFullYear();
    const AVERAGE_DAYS_PER_MONTH = 30.44;
    const VACATION_DAYS_PER_MONTH = 2.67;
    const rawStartDate = userInfo?.startDate;
    const startDate = rawStartDate ? parseISO(rawStartDate) : new Date(currentYear, 0, 1);

    const effectiveStartDate =
      startDate.getFullYear() < currentYear ? new Date(currentYear, 0, 1) : startDate;

    const daysWorked = differenceInCalendarDays(today, effectiveStartDate) + 1;

    const monthsWorkedEquivalent = daysWorked / AVERAGE_DAYS_PER_MONTH;
    const vacationDays = Math.floor(monthsWorkedEquivalent * VACATION_DAYS_PER_MONTH);

    return vacationDays;
  }

  async function fetchPublicHolidaysAPI() {
    try {
      const year = currentDate.getFullYear();
      const response = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/es`, {
        method: "GET",
        headers: {
          accept: "text/plain",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const filteredData = data.filter((holiday) => {
        return holiday.global === true || holiday?.counties?.includes("ES-AN");
      });
      return filteredData;
    } catch (error) {
      console.error("Hubo un problema con la operación fetch:", error);
      return null;
    }
  }

  useEffect(() => {
    const loadPublicHolidays = async () => {
      const fetchedText = await fetchPublicHolidaysAPI();
      setHolidays((prev) => [...prev, ...fetchedText]);
    };

    loadPublicHolidays();
  }, []);

  async function handleAddHoliday(data) {
    const jwtToken = getCookie("factura-token");

    if (!jwtToken) {
      alert("Sesión no válida. Por favor, inicia sesión de nuevo.");
      return;
    }

    try {
      const response = await authFetch("POST", "holidays", data, jwtToken);
      if (response.ok) {
        const createdHoliday = await response.json();
        setHolidays((prev) => [...prev, createdHoliday]);
        alert("Festivo añadido con éxito.");
      }
    } catch (error) {
      console.error("Error al añadir festivo:", error);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-black">
      {/* Columna Izquierda: Calendario */}
      <div className="lg:col-span-2 bg-background p-4 sm:p-6 rounded-lg shadow-md">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
          <div className="flex items-center mb-3 sm:mb-0">
            <button
              onClick={handlePrevMonth}
              className="p-2 rounded-md hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            <h2 className="text-xl font-semibold mx-2 sm:mx-4 capitalize">
              {format(currentDate, "MMMM yyyy", { locale: es })}
            </h2>
            <button
              onClick={handleNextMonth}
              className="p-2 rounded-md hover:bg-gray-100 transition-colors"
            >
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
          </div>
          <div className="flex items-center gap-2 space transition-all duration-150 text-sm sm:text-base">
            {userGroupId === 1 && (
              <button
                onClick={() => setIsManagingVacations(!isManagingVacations)}
                className={`flex items-center font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 text-sm sm:text-base max-w-
          ${
            isManagingVacations
              ? "bg-red-500 hover:bg-red-600 text-white"
              : "bg-white hover:bg-gray-100 text-gray-700"
          }`}
              >
                {isManagingVacations ? "Terminar Gestión" : "Gestionar"}
              </button>
            )}

            <button
              onClick={openModal}
              className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 text-sm sm:text-base"
            >
              <Plus className="h-5 w-5 mr-1 sm:mr-2" />
              Solicitar Día Libre
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 border-t border-l border-gray-200">
          {dayNames.map((dayName) => (
            <div
              key={dayName}
              className="text-center font-medium text-xs sm:text-sm py-2 bg-gray-50 border-r border-b border-gray-200"
            >
              {dayName}
            </div>
          ))}
          {daysToDisplay.map((day, index) => {
            const isCurrentMonth = isSameMonth(day, currentDate);
            const dayEvents = getDayEvents(day);

            return (
              <div
                key={index}
                className={`p-1.5 sm:p-2 h-20 sm:h-24 flex flex-col items-start justify-start relative border-r border-b border-gray-200 ${
                  isCurrentMonth ? "bg-white" : "bg-gray-50"
                }`}
              >
                <span
                  className={`text-xs sm:text-sm font-medium ${
                    isCurrentMonth ? "text-gray-800" : "text-gray-400"
                  }`}
                >
                  {format(day, "d")}
                </span>
                {isCurrentMonth &&
                  dayEvents.length > 0 &&
                  dayEvents.map((event, idx) => (
                    <span
                      key={idx}
                      title={event.name}
                      className={`mt-1 text-[10px] sm:text-xs px-1 py-0.5 rounded-full w-full text-center truncate ${
                        event.color || "bg-gray-200 text-gray-800"
                      }`}
                    >
                      {event.name}
                    </span>
                  ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Columna Derecha: Info Adicional */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
          <h3 className="text-base sm:text-lg font-semibold mb-4">Solicitudes de vacaciones</h3>
          {sortedVacationRequests.length > 0 ? (
            <ul className="space-y-3">
              {(showAllVacationRequests
                ? sortedVacationRequests
                : sortedVacationRequests.slice(0, 2)
              ).map((req) => (
                <li key={req.uuid} className="text-xs sm:text-sm">
                  <div className="flex justify-between items-start">
                    {/* Columna Izquierda: Info de la solicitud */}
                    <div className="flex items-start">
                      <CalendarIcon className="h-4 w-4 mr-2 text-gray-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-medium leading-tight">
                          {format(parseISO(req.startDate), "d")} -{" "}
                          {format(parseISO(req.endDate), "d MMMM", {
                            locale: es,
                          })}
                        </p>
                        <p className="text-gray-600 text-[11px] sm:text-xs leading-tight">
                          {getAbsenceTypeDisplayName(req.type)} - {req.description}
                        </p>
                      </div>
                    </div>

                    {/* Columna Derecha: Estado y Acciones de Gestión */}
                    <div className="flex flex-col items-end space-y-1 relative">
                      <button
                        type="button"
                        onClick={() => {
                          if (userGroupId === 1) {
                            setActiveDropdownRequestUuid(
                              activeDropdownRequestUuid === req.uuid ? null : req.uuid
                            );
                          }
                        }}
                        disabled={!(userGroupId === 1)}
                        className={`status-chip-button px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold whitespace-nowrap
      ${req.status === "aprobada" ? "bg-green-100 text-green-700" : ""}
      ${req.status === "pendiente" ? "bg-yellow-100 text-yellow-700" : ""}
      ${req.status === "rechazada" ? "bg-red-100 text-red-700" : ""}
      ${!(userGroupId === 1) ? "cursor-default" : "hover:opacity-80 cursor-pointer"}
    `}
                      >
                        {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                      </button>
                      {userGroupId === 1 && activeDropdownRequestUuid === req.uuid && (
                        <div className="status-dropdown-container absolute top-full right-0 mt-1 w-36 bg-white border border-gray-300 rounded-md shadow-lg z-20 py-1">
                          {statusOptions.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => handleDirectStatusUpdate(req, option.value)}
                              className={`block w-full text-left px-3 py-1.5 text-xs 
            ${
              req.status === option.value
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "text-gray-700 hover:bg-gray-100"
            }
          `}
                              disabled={req.status === option.value}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      )}
                      {isManagingVacations && userGroupId === 1 && (
                        <div className="flex items-center space-x-1 pt-1">
                          <button
                            onClick={() => handleDeleteRequest(req.uuid)}
                            title="Eliminar Solicitud"
                            className="p-1.5 text-red-600 hover:text-red-800 rounded-full hover:bg-red-100 transition-colors"
                          >
                            <TrashIcon className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs sm:text-sm text-gray-500">No hay solicitudes recientes.</p>
          )}

          {sortedVacationRequests.length > 2 && (
            <button
              onClick={() => setShowAllVacationRequests(!showAllVacationRequests)}
              className="mt-4 text-xs sm:text-sm text-indigo-600 hover:text-indigo-800 font-medium w-full text-center py-1"
            >
              {showAllVacationRequests ? "Ver menos" : "Ver todas"}
            </button>
          )}

          {sortedVacationRequests.length <= 2 && <div className="h-6 mt-4 py-1"></div>}
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base sm:text-lg font-semibold">Próximos Festivos</h3>
            {userGroupId === 1 && (
              <button onClick={() => setHolidaysModal(true)}>
                <FaPlus className="h-4 w-4" />
              </button>
            )}
          </div>

          {futureHolidays.length > 0 ? (
            <ul className="space-y-3">
              {(showAllHolidays ? futureHolidays : futureHolidays.slice(0, 2)).map((holiday) => (
                <li key={holiday.date} className="text-xs sm:text-sm">
                  <div className="flex items-start">
                    <div className="p-1 bg-pink-100 rounded-lg mr-2 flex items-center justify-center">
                      <CalendarIcon className="h-4 w-4 text-pink-700 shrink-0" />
                    </div>
                    <div>
                      <p className="font-medium leading-tight">
                        {format(parseISO(holiday.date), "d MMMM", {
                          locale: es,
                        })}
                      </p>
                      <p className="text-gray-600 text-[11px] sm:text-xs leading-tight">
                        {holiday.localName || holiday.name}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs sm:text-sm text-gray-500">No hay festivos próximos.</p>
          )}

          {futureHolidays.length > 2 && (
            <button
              onClick={() => setShowAllHolidays(!showAllHolidays)}
              className="mt-4 text-xs sm:text-sm text-indigo-600 hover:text-indigo-800 font-medium w-full text-center py-1"
            >
              {showAllHolidays ? "Ver menos" : "Ver todos"}
            </button>
          )}

          {futureHolidays.length <= 2 && <div className="h-6 mt-4 py-1"></div>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {[
            {
              title: "Días Libres",
              value: available,
              percentage: availablePercentage,
              color: "text-blue-500",
            },
            {
              title: "Días Usados",
              value: used,
              percentage: usedPercentage,
              color: "text-green-500",
            },
          ].map((stat) => (
            <div
              key={stat.title}
              className="bg-white p-3 sm:p-4 rounded-lg shadow-md flex flex-col items-center"
            >
              <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">{stat.title}</h4>
              {stat.title === "Días Libres" ? (
                <span className="text-xs text-gray-400">
                  ({personalDaysStats.available} asuntos propios)
                </span>
              ) : (
                <span className="h-[12px]"></span>
              )}
              <div className="relative w-20 h-20 sm:w-24 sm:h-24">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  <circle
                    className="text-gray-200 stroke-current"
                    strokeWidth="10"
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                  ></circle>
                  <circle
                    className={`${stat.color} stroke-current`}
                    strokeWidth="10"
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    strokeDasharray={`${2 * Math.PI * 40}`}
                    strokeDashoffset={`${2 * Math.PI * 40 * (1 - stat.percentage / 100)}`}
                    transform="rotate(-90 50 50)"
                    style={{ transition: "stroke-dashoffset 0.5s ease-out" }}
                  ></circle>
                  <text
                    x="50"
                    y="50"
                    textAnchor="middle"
                    dy=".3em"
                    className="text-xl sm:text-2xl font-bold fill-current text-gray-700"
                  >
                    {stat.value}
                  </text>
                </svg>
              </div>
              {stat.title !== "Días Libres" && (
                <button
                  onClick={() => setVerModal(true)}
                  className="mt-2 sm:mt-3 text-[10px] sm:text-xs text-indigo-600 hover:text-indigo-800 py-0.5"
                >
                  Ver
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Modal para solicitar día libre */}
      {isModalOpen && (
        <div className="fixed inset-0 lg:ml-72 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col transform transition-transform duration-300 ease-in-out scale-100 opacity-100">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Solicitar Día Libre</h3>
              <button
                type="button"
                onClick={closeModal}
                className="text-gray-400 hover:bg-gray-200 hover:text-gray-900 rounded-lg p-1.5 transition duration-150"
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>
            <form
              onSubmit={handleSubmitRequest}
              id="request-day-form"
              className="p-5 space-y-4 overflow-y-auto flex-grow"
            >
              <div>
                <label
                  htmlFor="request-type"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Tipo de solicitud
                </label>
                <select
                  id="request-type"
                  value={requestType}
                  onChange={(e) => setRequestType(e.target.value)}
                  className="w-full h-10 border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-background text-sm"
                >
                  <option value="vacaciones">Vacaciones</option>
                  <option value="asuntos_propios">Asuntos propios</option>
                  <option value="baja_medica">Baja médica</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="start-date"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Fecha de inicio
                </label>
                <input
                  type="date"
                  id="start-date"
                  value={requestStartDate}
                  min={toInputDate(new Date())}
                  onChange={(e) => setRequestStartDate(e.target.value)}
                  className="w-full h-10 border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-background text-sm"
                  required
                />
              </div>
              <div>
                <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de fin
                </label>
                <input
                  type="date"
                  id="end-date"
                  value={requestEndDate}
                  min={requestStartDate || toInputDate(new Date())}
                  onChange={(e) => setRequestEndDate(e.target.value)}
                  className="w-full h-10 border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-background text-sm"
                  required
                />
              </div>
              <div>
                <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción / Motivo <span className="text-gray-500 text-xs">(breve)</span>
                </label>
                <textarea
                  id="reason"
                  value={requestReason}
                  onChange={(e) => setRequestReason(e.target.value)}
                  rows="2"
                  className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-background text-sm"
                  placeholder="Ej: Vacaciones de verano"
                ></textarea>
              </div>
            </form>
            <div className="flex justify-end items-center space-x-3 p-5 border-t border-gray-200">
              <button
                type="button"
                className="px-4 py-2 rounded-md text-sm font-medium border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                onClick={closeModal}
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="request-day-form"
                className="px-4 py-2 rounded-md text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
              >
                Enviar Solicitud
              </button>
            </div>
          </div>
        </div>
      )}

      {verModal && (
        <div className="fixed inset-0 lg:ml-72 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Resumen Días Usados</h3>
              <button
                type="button"
                onClick={() => setVerModal(false)}
                className="text-gray-400 hover:bg-gray-200 hover:text-gray-900 rounded-lg p-1.5"
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto flex-grow">
              {sortedPastVacationRequests.length > 0 ? (
                <ul className="space-y-3">
                  {sortedPastVacationRequests.map((req) => (
                    <li key={req.uuid} className="text-xs sm:text-sm">
                      <div className="flex justify-between items-start">
                        {/* Columna Izquierda: Info de la solicitud */}
                        <div className="flex items-start">
                          <CalendarIcon className="h-4 w-4 mr-2 text-gray-500 mt-0.5 shrink-0" />
                          <div>
                            <p className="font-medium leading-tight">
                              {format(parseISO(req.startDate), "d")} -{" "}
                              {format(parseISO(req.endDate), "d MMMM", {
                                locale: es,
                              })}
                            </p>
                            <p className="text-gray-600 text-[11px] sm:text-xs leading-tight">
                              {req.description}
                            </p>
                          </div>
                        </div>
                        {/* Columna Derecha: Estado */}
                        <div className="flex flex-col items-end space-y-1">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold whitespace-nowrap
          ${req.status === "aprobada" ? "bg-green-100 text-green-700" : ""}
          ${req.status === "pendiente" ? "bg-yellow-100 text-yellow-700" : ""}
          ${req.status === "rechazada" ? "bg-red-100 text-red-700" : ""}
        `}
                          >
                            {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs sm:text-sm text-gray-500">No hay solicitudes pasadas.</p>
              )}
            </div>
            <button
              type="button"
              className="px-4 py-2 rounded-md text-sm font-medium border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
              onClick={() => setVerModal(false)}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {holidaysModal && (
        <ModalAddHolidays
          closeModal={() => setHolidaysModal(false)}
          handleSubmit={handleAddHoliday}
        />
      )}
    </div>
  );
}
