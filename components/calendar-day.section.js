import React, { useState, useEffect } from "react";
import { authFetch } from "@/helpers/server-fetch.helper";
import { getCookie } from "cookies-next";

export default function CalendarByDay({
  tasks,
  reminders,
  leadCalls,
  currentDate,
  onDateChange,
  onChangeView,
}) {
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const formatTime = (hour) => {
    const ampm = hour >= 12 ? "pm" : "am";
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    return `${displayHour}${ampm}`;
  };

  const handlePreviousDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 1);
    onDateChange(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 1);
    onDateChange(newDate);
  };

  const getEventsForHour = (hour) => {
    return [...reminders, ...leadCalls]
      .map((event) => ({
        ...event,
        type: event.type || (reminders.includes(event) ? "reminder" : "leadCall"),
      }))
      .filter((event) => {
        const eventDate = new Date(event.startDate);
        return (
          eventDate.getHours() === hour && eventDate.toDateString() === currentDate.toDateString()
        );
      });
  };

  const allDayTasks = tasks.filter((task) => {
    const taskDate = new Date(task.startDate);
    return (
      taskDate.getDate() === currentDate.getDate() &&
      taskDate.getMonth() === currentDate.getMonth() &&
      taskDate.getFullYear() === currentDate.getFullYear()
    );
  });

  const categorizedAllDayTasks = allDayTasks.map((task) => ({
    ...task,
    type: "task",
  }));

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <button
            onClick={handlePreviousDay}
            className="bg-blue-500 text-white py-2 px-3 rounded-l-md hover:bg-blue-600 focus:outline-none"
          >
            &lt;
          </button>
          <button
            onClick={handleNextDay}
            className="bg-blue-500 text-white py-2 px-3 rounded-r-md hover:bg-blue-600 focus:outline-none"
          >
            &gt;
          </button>
        </div>
        <h2 className="text-xl text-gray-800 text-center flex-grow">
          {currentDate.toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </h2>

        {/* Botones de cambio de vista */}
        <div className="flex items-center">
          <button
            onClick={() => onChangeView("month")}
            className={`py-2 px-4 ${ "month" === "month" ? "bg-gray-300 text-gray-700" : ""
            } rounded-l-md hover:bg-blue-600 focus:outline-none`}
          >
            Mes
          </button>
          <button
            onClick={() => onChangeView("week")}
            className={`py-2 px-4 ${ "week" === "week" ? "bg-gray-300 text-gray-700" : ""
            } focus:outline-none`}
          >
            Semana
          </button>
          <button
            onClick={() => onChangeView("day")}
            className={`py-2 px-4 ${ "day" === "day" ? "bg-blue-500 text-white" : ""
            } rounded-r-md hover:bg-blue-600 focus:outline-none`}
          >
            Día
          </button>
        </div>
      </div>
      {/* ... (El resto del JSX para el grid de horas y eventos) ... */}
       <div className="grid grid-cols-[6rem,1fr] border border-gray-300">
        {/* Sección Todo el día */}
        <div className="border-r p-2 text-center font-semibold bg-gray-50">
          Todo el día
        </div>
        <div className="relative bg-yellow-50 flex flex-wrap items-start p-2 min-h-[4rem]">
          {categorizedAllDayTasks.map((task, idx) => (
            <div
              key={idx}
              className={`bg-fuchsia-300 text-xs p-1 rounded shadow m-1 ${task.taskStateId === 3 ? "line-through" : ""}`}
            >
              {task.subject || "Tarea sin título"}
            </div>
          ))}
          {categorizedAllDayTasks.length === 0 && (
            <div className="text-gray-500 text-sm italic">
              No hay tareas para todo el día.
            </div>
          )}
        </div>

        {/* Columna de Horas */}
        {hours.map((hour) => {
          const eventsForHour = getEventsForHour(hour);

          return (
            <React.Fragment key={hour}>
              <div className="border-t border-r p-2 text-center bg-gray-50">
                {formatTime(hour)}
              </div>
              <div
                className={`border-t relative h-auto min-h-[4rem] flex flex-col items-start p-2 ${
                  currentDate.toDateString() === new Date().toDateString()
                    ? "bg-yellow-50 hover:bg-yellow-100"
                    : "bg-white hover:bg-gray-50"
                }`}
              >
                {eventsForHour.map((event, idx) => (
                  <div
                    key={idx}
                    className={`w-full mb-1 ${ event.completed ? "line-through" : "" } ${
                      event.type === "reminder" ? "bg-green-200" : "bg-cyan-200"
                    } text-xs p-1 rounded shadow`}
                  >
                    {event.subject || "Evento sin título"}
                  </div>
                ))}
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
