"use client";
import React, { useState, forwardRef } from "react";
import CalendarDetailsDay from "./calendar-details-day.modal";
import CalendarByWeek from "./calendar-week.section";
import CalendarByDay from "./calendar-day.section";

const Calendar = forwardRef(
  ({ tasks, reminders, leadCalls, onDayClick, currentDate, onEventsChange, onDateChange }, ref) => {
    const [selectedDayEvents, setSelectedDayEvents] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [view, setView] = useState("month");

    const today = new Date();

    const monthNames = [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ];

    const currentMonth = monthNames[currentDate.getMonth()];
    const currentYear = currentDate.getFullYear();
    const daysInMonth = new Date(currentYear, currentDate.getMonth() + 1, 0).getDate();
    const firstDay = new Date(currentYear, currentDate.getMonth(), 1).getDay();
    const monthDays = [...Array(firstDay).fill(null), ...Array(daysInMonth).keys()].map((day) =>
      day !== null ? day + 1 : null
    );

    const handlePreviousMonth = () => {
      const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 10);
      onDateChange(newDate);
    };

    const handleNextMonth = () => {
      const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 10);
      onDateChange(newDate);
    };

    const getEventsForDay = (day) => {
      const year = currentDate.getUTCFullYear();
      const month = currentDate.getUTCMonth();

      const events = [
        ...tasks
          .filter((task) => {
            const taskDate = new Date(task.startDate);
            return (
              taskDate.getUTCFullYear() === year &&
              taskDate.getUTCMonth() === month &&
              taskDate.getUTCDate() === day
            );
          })
          .map((event) => ({ ...event, type: "task" })),
        ...reminders
          .filter((reminder) => {
            const reminderDate = new Date(reminder.startDate);
            return (
              reminderDate.getUTCFullYear() === year &&
              reminderDate.getUTCMonth() === month &&
              reminderDate.getUTCDate() === day
            );
          })
          .map((event) => ({ ...event, type: "reminder" })),
        ...leadCalls
          .filter((call) => {
            const callDate = new Date(call.startDate);
            return (
              callDate.getUTCFullYear() === year &&
              callDate.getUTCMonth() === month &&
              callDate.getUTCDate() === day
            );
          })
          .map((event) => ({ ...event, type: "leadCall" })),
      ];

      return events;
    };

    const handleDayClick = (day) => {
      const selectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      setSelectedDate(selectedDate);
      const eventsForDay = getEventsForDay(day);
      setSelectedDayEvents(eventsForDay);
      setIsModalOpen(true);
    };

    const changeView = (newView) => {
      setView(newView);
    };

    const handleAddTaskClick = (event, day) => {
      event.stopPropagation();
      const selectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      onDayClick(selectedDate);
    };

    return (
      <div className="w-full h-full p-4">
        {/* Cabecera con botones de navegación, información del mes/año y cambio de vista */}
        <div className="flex items-center justify-between">
          {view === "month" && (
            <>
              {/* Botones de navegación */}
              <div className="flex items-center">
                <button
                  onClick={handlePreviousMonth}
                  className="bg-blue-500 text-white py-2 px-3 rounded-l-md hover:bg-blue-600 focus:outline-none"
                >
                  &lt;
                </button>
                <button onClick={() => setCurrentDate(today)} className=""></button>
                <button
                  onClick={handleNextMonth}
                  className="bg-blue-500 text-white py-2 px-3 rounded-r-md hover:bg-blue-600 focus:outline-none"
                >
                  &gt;
                </button>
              </div>

              {/* Información de mes/año */}
              <h2 className="text-xl text-gray-800 text-center flex-grow">
                {currentMonth} {currentYear}
              </h2>

              {/* Botones de cambio de vista */}
              <div className="flex items-center">
                <button
                  onClick={() => setView("month")}
                  className={`py-2 px-4 ${
                    view === "month" ? "bg-blue-500 text-white" : "bg-gray-300 text-gray-700"
                  } rounded-l-md hover:bg-blue-600 focus:outline-none`}
                >
                  Mes
                </button>
                <button
                  onClick={() => changeView("week")}
                  className={`py-2 px-4 ${
                    view === "week" ? "bg-blue-500 text-white" : "bg-gray-300 text-gray-700"
                  } focus:outline-none`}
                >
                  Semana
                </button>
                <button
                  onClick={() => setView("day")}
                  className={`py-2 px-4 ${
                    view === "day" ? "bg-blue-500 text-white" : "bg-gray-300 text-gray-700"
                  } rounded-r-md hover:bg-blue-600 focus:outline-none`}
                >
                  Día
                </button>
              </div>
            </>
          )}
        </div>

        {/* Vista del calendario */}
        {view === "month" && (
          <div className="grid grid-cols-7 gap-0 text-center">
            {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((day) => (
              <div key={day} className="font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}

            {/* Días del mes */}
            {monthDays.map((day, index) => {
              const isToday =
                day &&
                day === today.getDate() &&
                currentDate.getMonth() === today.getMonth() &&
                currentDate.getFullYear() === today.getFullYear();

              const eventsForDay = day ? getEventsForDay(day) : [];

              const tooltipContent = eventsForDay
                .map((event) => {
                  const eventDate = new Date(event.startDate);
                  const formattedTime = `${String(eventDate.getUTCHours()).padStart(
                    2,
                    "0"
                  )}:${String(eventDate.getUTCMinutes()).padStart(2, "0")}`;

                  if (event.type === "reminder" || event.type === "leadCall") {
                    return `${formattedTime} - ${event.subject}`;
                  }
                  return event.subject;
                })
                .join("\n");

              return (
                <div
                  key={index}
                  onClick={() => handleDayClick(day)}
                  title={tooltipContent}
                  className={`flex flex-col items-start justify-start h-24 border border-gray-200 p-1 transition-all hover:bg-blue-50 cursor-pointer relative overflow-hidden ${
                    isToday ? "bg-yellow-50" : ""
                  }`}
                >
                  {day && <div className="font-light text-gray-500 text-sm">{day}</div>}

                  <div className="mt-1 w-full overflow-hidden">
                    {eventsForDay.map((event, idx) => {
                      let styleSettings;
                      let timeString = "";

                      if (event.type === "task") {
                        styleSettings = `bg-fuchsia-300 ${
                          event.taskStateId == 3 && "line-through"
                        }`;
                      } else if (event.type === "reminder") {
                        styleSettings = `bg-green-200 ${event.completed && "line-through"}`;
                        const eventDate = new Date(event.startDate);
                        timeString = `${String(eventDate.getUTCHours()).padStart(2, "0")}:${String(
                          eventDate.getUTCMinutes()
                        ).padStart(2, "0")}`;
                      } else if (event.type === "leadCall") {
                        styleSettings = `bg-cyan-200 ${event.completed && "line-through"}`;
                        const eventDate = new Date(event.startDate);
                        timeString = `${String(eventDate.getUTCHours()).padStart(2, "0")}:${String(
                          eventDate.getUTCMinutes()
                        ).padStart(2, "0")}`;
                      }

                      return (
                        <div
                          key={idx}
                          className={`${styleSettings} text-xs text-gray-800 p-1 rounded mb-1 overflow-hidden whitespace-nowrap`}
                        >
                          {timeString ? `${timeString} - ` : ""}
                          {event.subject}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {view === "week" && (
          <CalendarByWeek
            tasks={tasks}
            reminders={reminders}
            leadCalls={leadCalls}
            onChangeView={changeView}
          />
        )}
        {view === "day" && (
          <CalendarByDay
            tasks={tasks}
            reminders={reminders}
            leadCalls={leadCalls}
            onChangeView={changeView}
            currentDate={currentDate}
            onDateChange={onDateChange}
          />
        )}

        {isModalOpen && (
          <CalendarDetailsDay
            isModalOpen={isModalOpen}
            setIsModalOpen={setIsModalOpen}
            events={selectedDayEvents}
            currentDate={selectedDate}
            handleAddTaskClick={handleAddTaskClick}
            fetchEvents={onEventsChange}
          />
        )}
      </div>
    );
  }
);

export default Calendar;
