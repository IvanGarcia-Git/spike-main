import React, { useState, useEffect } from "react";
import CalendarDetailsDay from "./calendar-details-day.modal";
import { authFetch } from "@/helpers/server-fetch.helper";
import { getCookie } from "cookies-next";

export default function CalendarByWeek({ onChangeView }) {
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
  const [view, setView] = useState("week");

  const fetchTasksByWeek = async () => {
    const startDate = new Date(
      currentWeekStart.getFullYear(),
      currentWeekStart.getMonth(),
      currentWeekStart.getDate(),
      0,
      0,
      0,
      0
    );

    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);

    const jwtToken = getCookie("factura-token");
    const data = {
      startDate: startDate.toISOString().split("T")[0] + "T00:00:00.000Z",
      endDate: endDate.toISOString().split("T")[0] + "T23:59:59.999Z",
    };

    try {
      const response = await authFetch(
        "POST",
        "search/calendar/",
        data,
        jwtToken
      );

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
  }, [currentWeekStart]);

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

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        {view === "week" && (
          <>
            <div className="flex items-center">
              <button
                onClick={handlePreviousWeek}
                className="bg-blue-500 text-white py-2 px-3 rounded-l-md hover:bg-blue-600 focus:outline-none"
              >
                &lt;
              </button>
              <button
                onClick={handleNextWeek}
                className="bg-blue-500 text-white py-2 px-3 rounded-r-md hover:bg-blue-600 focus:outline-none"
              >
                &gt;
              </button>
            </div>

            <h2 className="text-xl text-gray-800 text-center flex-grow">
              {currentWeekStart.toLocaleDateString(undefined, {
                day: "2-digit",
              })}{" "}
              {currentWeekStart
                .toLocaleDateString(undefined, {
                  month: "short",
                })
                .replace(/^\w/, (c) => c.toUpperCase())}{" "}
              -{" "}
              {new Date(
                currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000
              ).toLocaleDateString(undefined, {
                day: "2-digit",
              })}
              ,{" "}
              {new Date(
                currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000
              ).getFullYear()}
            </h2>

            <div className="flex items-center">
              <button
                onClick={() => onChangeView("month")}
                className={`py-2 px-4 ${
                  view === "month"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-300 text-gray-700"
                } rounded-l-md hover:bg-blue-600 focus:outline-none`}
              >
                Mes
              </button>
              <button
                onClick={() => onChangeView("week")}
                className={`py-2 px-4 ${
                  view === "week"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-300 text-gray-700"
                } focus:outline-none`}
              >
                Semana
              </button>
              <button
                onClick={() => onChangeView("day")}
                className={`py-2 px-4 ${
                  view === "day"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-300 text-gray-700"
                } rounded-r-md hover:bg-blue-600 focus:outline-none`}
              >
                Día
              </button>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-8 border">
        <div className="border-r p-2 text-center bg-gray-100 font-semibold">
          Horario
        </div>
        {daysOfWeek.map((day, index) => {
          const today = new Date();
          const dayDate = new Date(currentWeekStart);
          dayDate.setDate(currentWeekStart.getDate() + index);

          const isToday = today.toDateString() === dayDate.toDateString();

          return (
            <div
              key={index}
              className={`border-r p-2 text-center font-semibold ${
                isToday ? "bg-yellow-50" : "bg-gray-100"
              }`}
            >
              {day} {getDayDate(index)}
            </div>
          );
        })}

        <div className="border-r p-2 text-center font-semibold bg-gray-50">
          Todo el día
        </div>
        {daysOfWeek.map((_, dayIndex) => {
          const today = new Date();
          const dayDate = new Date(currentWeekStart);
          dayDate.setDate(currentWeekStart.getDate() + dayIndex);

          const isToday = today.toDateString() === dayDate.toDateString();

          const tasksForDay = allDayTasks.filter((task) => {
            const taskDate = adjustToLocalTime(task.startDate);
            return taskDate.getDay() === dayIndex;
          });

          return (
            <div
              key={dayIndex}
              className={`border-t border-r p-2 relative hover:bg-gray-50 cursor-pointer ${
                isToday ? "bg-yellow-50" : ""
              }`}
              onClick={() => {
                setSelectedEvents(tasksForDay);
                setIsModalOpen(true);
              }}
            >
              {tasksForDay.map((task, idx) => (
                <div
                  key={idx}
                  className="m-1 p-1 bg-fuchsia-300 text-xs rounded"
                >
                  {task.subject || "Tarea sin título"}
                </div>
              ))}
            </div>
          );
        })}

        {hours.map((hour) => (
          <React.Fragment key={hour}>
            <div className="border-t p-2 text-center bg-gray-50">
              {formatTime(hour)}
            </div>
            {daysOfWeek.map((_, dayIndex) => {
              const today = new Date();
              const dayDate = new Date(currentWeekStart);
              dayDate.setDate(currentWeekStart.getDate() + dayIndex);

              const isToday = today.toDateString() === dayDate.toDateString();

              const eventsForCell = hourlyEvents.filter((event) => {
                const eventDate = adjustToLocalTime(event.startDate);
                return (
                  eventDate.getDay() === dayIndex &&
                  eventDate.getHours() === hour
                );
              });

              return (
                <div
                  key={dayIndex}
                  className={`border-t border-r p-2 relative hover:bg-gray-50 cursor-pointer ${
                    isToday ? "bg-yellow-50" : ""
                  }`}
                  onClick={() => handleCellClick(hour, dayIndex)}
                >
                  {eventsForCell.map((event, idx) => (
                    <div
                      key={idx}
                      className={`mb-4 p-1 text-xs rounded ${
                        event.type === "reminder"
                          ? "bg-green-200"
                          : "bg-cyan-200"
                      }`}
                    >
                      {event.subject || "Evento sin título"}
                    </div>
                  ))}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>

      <CalendarDetailsDay
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        events={selectedEvents}
      />
    </>
  );
}
