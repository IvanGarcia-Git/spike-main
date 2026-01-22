import React, { useState, useEffect } from "react";
import CalendarDetailsDay from "./calendar-details-day.modal";
import { authFetch } from "@/helpers/server-fetch.helper";
import { getCookie } from "cookies-next";
import { parseISO, isSameDay } from "date-fns";

export default function CalendarByWeek({ onChangeView, holidays = [], absences = [], selectedUserIds = [], currentUserId = null, refreshKey = 0 }) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const daysOfWeek = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const firstDayOfWeek = today.getDate() - today.getDay();
    return new Date(today.setDate(firstDayOfWeek));
  });

  const [tasks, setTasks] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [leadCalls, setLeadCalls] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvents, setSelectedEvents] = useState([]);

  const fetchTasksByWeek = async () => {
    const startDate = new Date(
      currentWeekStart.getFullYear(),
      currentWeekStart.getMonth(),
      currentWeekStart.getDate(),
      0, 0, 0, 0
    );

    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);

    const jwtToken = getCookie("factura-token");
    const data = {
      startDate: startDate.toISOString().split("T")[0] + "T00:00:00.000Z",
      endDate: endDate.toISOString().split("T")[0] + "T23:59:59.999Z",
      userIds: selectedUserIds.length > 0 ? selectedUserIds : undefined,
    };

    try {
      const response = await authFetch("POST", "search/calendar/", data, jwtToken);
      if (response.ok) {
        const allTasks = await response.json();
        setTasks(allTasks.tasks);
        setReminders(allTasks.reminders);
        setLeadCalls(allTasks.leadCalls);
      } else {
        console.error("Error al cargar tareas por semana");
      }
    } catch (error) {
      console.error("Error en la solicitud:", error);
    }
  };

  useEffect(() => {
    fetchTasksByWeek();
  }, [currentWeekStart, selectedUserIds, refreshKey]);

  const getDayDate = (offset) => {
    const date = new Date(currentWeekStart);
    date.setDate(date.getDate() + offset);
    return date.toLocaleDateString(undefined, {
      day: "2-digit",
      month: "2-digit",
    });
  };

  const handlePreviousWeek = () => {
    setCurrentWeekStart((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() - 7);
      return newDate;
    });
  };

  const handleNextWeek = () => {
    setCurrentWeekStart((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() + 7);
      return newDate;
    });
  };

  const formatTime = (hour) => {
    const ampm = hour >= 12 ? "pm" : "am";
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    return `${displayHour}${ampm}`;
  };

  const adjustToLocalTime = (dateString) => {
    const date = new Date(dateString);
    return new Date(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds()
    );
  };

  const filterEventsForWeek = (events) => {
    const weekStart = new Date(
      currentWeekStart.getFullYear(),
      currentWeekStart.getMonth(),
      currentWeekStart.getDate()
    );
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    return events.filter((event) => {
      if (!event.startDate) return false;
      const eventDate = adjustToLocalTime(event.startDate);
      return eventDate >= weekStart && eventDate <= weekEnd;
    });
  };

  const allDayTasks = filterEventsForWeek(tasks).map((task) => ({
    ...task,
    type: "task",
  }));

  const hourlyEvents = [
    ...filterEventsForWeek(reminders).map((reminder) => ({
      ...reminder,
      type: "reminder",
    })),
    ...filterEventsForWeek(leadCalls).map((leadCall) => ({
      ...leadCall,
      type: "leadCall",
    })),
  ];

  const handleCellClick = (hour, dayIndex) => {
    const eventsForCell = hourlyEvents.filter((event) => {
      const eventDate = adjustToLocalTime(event.startDate);
      return eventDate.getDay() === dayIndex && eventDate.getHours() === hour;
    });
    setSelectedEvents(eventsForCell);
    setIsModalOpen(true);
  };

  const isHolidayDay = (date) => {
    return holidays.some((h) => {
      const holidayDate = parseISO(h.date);
      return isSameDay(holidayDate, date);
    });
  };

  const isAbsenceDay = (date) => {
    return absences.some((absence) => {
      if (absence.status !== "aprobada") return false;
      const startDate = parseISO(absence.startDate);
      const endDate = parseISO(absence.endDate);
      return date >= startDate && date <= endDate;
    });
  };

  const isRedDay = (date) => {
    return isHolidayDay(date) || isAbsenceDay(date);
  };

  const getEventUserName = (event) => {
    // For tasks, user is in assigneeUser; for reminders/leadCalls, it's in user
    const user = event.assigneeUser || event.user;
    if (!user) return null;
    return `${user.name} ${user.firstSurname || ""}`.trim();
  };

  const shouldShowUserBadge = selectedUserIds.length > 1;

  const weekEndDate = new Date(currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000);

  return (
    <>
      {/* Header con navegación */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-1">
          <button
            onClick={handlePreviousWeek}
            className="p-2 rounded-lg neumorphic-button text-slate-600 dark:text-slate-300"
          >
            <span className="material-icons-outlined text-sm">chevron_left</span>
          </button>
          <button
            onClick={handleNextWeek}
            className="p-2 rounded-lg neumorphic-button text-slate-600 dark:text-slate-300"
          >
            <span className="material-icons-outlined text-sm">chevron_right</span>
          </button>
        </div>

        <h2 className="text-base font-semibold text-slate-700 dark:text-slate-200 text-center flex-grow">
          {currentWeekStart.toLocaleDateString(undefined, { day: "2-digit" })}{" "}
          {currentWeekStart.toLocaleDateString(undefined, { month: "short" }).replace(/^\w/, (c) => c.toUpperCase())} -{" "}
          {weekEndDate.toLocaleDateString(undefined, { day: "2-digit" })},{" "}
          {weekEndDate.getFullYear()}
        </h2>

        {/* Selector de vista eliminado - se usa el del componente padre */}
        <div className="w-[180px]"></div>
      </div>

      {/* Calendario semanal */}
      <div className="neumorphic-card-inset p-2 rounded-xl overflow-x-auto">
        <div className="grid grid-cols-8 gap-1 min-w-[700px]">
          {/* Header - Horario */}
          <div className="p-2 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">
            Hora
          </div>
          {/* Header - Días de la semana */}
          {daysOfWeek.map((day, index) => {
            const today = new Date();
            const dayDate = new Date(currentWeekStart);
            dayDate.setDate(currentWeekStart.getDate() + index);

            const isToday = today.toDateString() === dayDate.toDateString();
            const dayIsRed = isRedDay(dayDate);

            return (
              <div
                key={index}
                className={`p-2 text-center rounded-lg text-xs font-semibold transition-all ${
                  dayIsRed
                    ? "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400"
                    : isToday
                    ? "bg-primary/20 text-primary"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                <div>{day}</div>
                <div className="text-[10px] opacity-80">{getDayDate(index)}</div>
              </div>
            );
          })}

          {/* Fila Todo el día */}
          <div className="p-2 text-center text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center justify-center">
            Todo el día
          </div>
          {daysOfWeek.map((_, dayIndex) => {
            const today = new Date();
            const dayDate = new Date(currentWeekStart);
            dayDate.setDate(currentWeekStart.getDate() + dayIndex);

            const isToday = today.toDateString() === dayDate.toDateString();
            const dayIsRed = isRedDay(dayDate);

            const tasksForDay = allDayTasks.filter((task) => {
              const taskDate = adjustToLocalTime(task.startDate);
              return taskDate.getDay() === dayIndex;
            });

            return (
              <div
                key={dayIndex}
                className={`min-h-[40px] p-1 rounded-lg cursor-pointer transition-all ${
                  dayIsRed
                    ? "bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30"
                    : isToday
                    ? "bg-primary/10 hover:bg-primary/20"
                    : "bg-background-light dark:bg-background-dark hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
                onClick={() => {
                  setSelectedEvents(tasksForDay);
                  setIsModalOpen(true);
                }}
              >
                {tasksForDay.map((task, idx) => (
                  <div
                    key={idx}
                    className="m-0.5 p-1 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[10px] rounded border border-slate-300 dark:border-slate-600"
                  >
                    <div className="truncate">{task.subject || "Tarea"}</div>
                    {shouldShowUserBadge && getEventUserName(task) && (
                      <div className="text-[8px] opacity-75 truncate mt-0.5">
                        {getEventUserName(task)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          })}

          {/* Filas de horas */}
          {hours.map((hour) => (
            <React.Fragment key={hour}>
              <div className="p-2 text-center text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center">
                {formatTime(hour)}
              </div>
              {daysOfWeek.map((_, dayIndex) => {
                const today = new Date();
                const dayDate = new Date(currentWeekStart);
                dayDate.setDate(currentWeekStart.getDate() + dayIndex);

                const isToday = today.toDateString() === dayDate.toDateString();
                const dayIsRed = isRedDay(dayDate);

                const eventsForCell = hourlyEvents.filter((event) => {
                  const eventDate = adjustToLocalTime(event.startDate);
                  return eventDate.getDay() === dayIndex && eventDate.getHours() === hour;
                });

                return (
                  <div
                    key={dayIndex}
                    className={`min-h-[32px] p-0.5 rounded cursor-pointer transition-all border border-transparent ${
                      dayIsRed
                        ? "bg-red-50/50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20"
                        : isToday
                        ? "bg-primary/5 hover:bg-primary/10"
                        : "hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-200 dark:hover:border-slate-700"
                    }`}
                    onClick={() => handleCellClick(hour, dayIndex)}
                  >
                    {eventsForCell.map((event, idx) => (
                      <div
                        key={idx}
                        className={`mb-0.5 p-1 text-[10px] rounded ${
                          event.type === "reminder"
                            ? "bg-green-200 dark:bg-green-800/60 text-green-800 dark:text-green-200"
                            : "bg-cyan-200 dark:bg-cyan-800/60 text-cyan-800 dark:text-cyan-200"
                        }`}
                      >
                        <div className="truncate">{event.subject || "Evento"}</div>
                        {shouldShowUserBadge && getEventUserName(event) && (
                          <div className="text-[8px] opacity-75 truncate mt-0.5">
                            {getEventUserName(event)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      <CalendarDetailsDay
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        events={selectedEvents}
      />
    </>
  );
}
