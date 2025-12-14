import React from "react";
import { parseISO, isSameDay } from "date-fns";

export default function CalendarByDay({
  tasks,
  reminders,
  leadCalls,
  currentDate,
  onDateChange,
  onChangeView,
  holidays = [],
  absences = [],
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
    if (!task.startDate) return false;
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

  const isRedDay = isHolidayDay(currentDate) || isAbsenceDay(currentDate);
  const holidayInfo = holidays.find((h) => isSameDay(parseISO(h.date), currentDate));
  const isToday = currentDate.toDateString() === new Date().toDateString();

  return (
    <div>
      {/* Header con navegación */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-1">
          <button
            onClick={handlePreviousDay}
            className="p-2 rounded-lg neumorphic-button text-slate-600 dark:text-slate-300"
          >
            <span className="material-icons-outlined text-sm">chevron_left</span>
          </button>
          <button
            onClick={handleNextDay}
            className="p-2 rounded-lg neumorphic-button text-slate-600 dark:text-slate-300"
          >
            <span className="material-icons-outlined text-sm">chevron_right</span>
          </button>
        </div>

        <div className="text-center flex-grow">
          <h2 className={`text-base font-semibold ${
            isRedDay
              ? "text-red-600 dark:text-red-400"
              : "text-slate-700 dark:text-slate-200"
          }`}>
            {currentDate.toLocaleDateString("es-ES", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            }).replace(/^\w/, (c) => c.toUpperCase())}
          </h2>
          {isRedDay && (
            <p className="text-xs text-red-500 dark:text-red-400 mt-1">
              {holidayInfo ? (holidayInfo.localName || holidayInfo.name) : "Día de ausencia"}
            </p>
          )}
        </div>

        <div className="flex items-center space-x-1 p-1 neumorphic-card-inset rounded-lg">
          <button
            onClick={() => onChangeView("month")}
            className="px-3 py-1 text-xs rounded-md transition-colors text-slate-600 dark:text-slate-400 hover:text-primary"
          >
            Mes
          </button>
          <button
            onClick={() => onChangeView("week")}
            className="px-3 py-1 text-xs rounded-md transition-colors text-slate-600 dark:text-slate-400 hover:text-primary"
          >
            Semana
          </button>
          <button
            className="px-3 py-1 text-xs rounded-md transition-colors text-white bg-primary"
          >
            Día
          </button>
        </div>
      </div>

      {/* Calendario diario */}
      <div className="neumorphic-card-inset p-2 rounded-xl">
        <div className="grid grid-cols-[5rem,1fr] gap-1">
          {/* Sección Todo el día */}
          <div className="p-2 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-center">
            Todo el día
          </div>
          <div className={`min-h-[60px] p-2 rounded-lg flex flex-wrap items-start gap-1 ${
            isRedDay
              ? "bg-red-50 dark:bg-red-900/20"
              : isToday
              ? "bg-primary/10 dark:bg-primary/20"
              : "bg-background-light dark:bg-background-dark"
          }`}>
            {categorizedAllDayTasks.map((task, idx) => (
              <div
                key={idx}
                className={`px-2 py-1 rounded text-xs bg-fuchsia-200 dark:bg-fuchsia-800/60 text-fuchsia-800 dark:text-fuchsia-200 ${
                  task.taskStateId === 3 ? "line-through opacity-60" : ""
                }`}
              >
                {task.subject || "Tarea"}
              </div>
            ))}
            {categorizedAllDayTasks.length === 0 && (
              <div className="text-slate-400 dark:text-slate-500 text-xs italic">
                No hay tareas para todo el día
              </div>
            )}
          </div>

          {/* Filas de horas */}
          {hours.map((hour) => {
            const eventsForHour = getEventsForHour(hour);

            return (
              <React.Fragment key={hour}>
                <div className="p-2 text-center text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center">
                  {formatTime(hour)}
                </div>
                <div
                  className={`min-h-[48px] p-1.5 rounded transition-all flex flex-col gap-1 ${
                    isRedDay
                      ? "bg-red-50/50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20"
                      : isToday
                      ? "bg-primary/5 hover:bg-primary/10"
                      : "hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  {eventsForHour.map((event, idx) => (
                    <div
                      key={idx}
                      className={`w-full px-2 py-1 rounded text-xs ${
                        event.completed ? "line-through opacity-60" : ""
                      } ${
                        event.type === "reminder"
                          ? "bg-green-200 dark:bg-green-800/60 text-green-800 dark:text-green-200"
                          : "bg-cyan-200 dark:bg-cyan-800/60 text-cyan-800 dark:text-cyan-200"
                      }`}
                    >
                      {event.subject || "Evento"}
                    </div>
                  ))}
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
