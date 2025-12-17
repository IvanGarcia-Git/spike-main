"use client";
import React, { useState, useEffect, useRef } from "react";
import { authGetFetch, authFetch } from "@/helpers/server-fetch.helper";
import { getCookie } from "cookies-next";
import * as jose from "jose";
import { FiTrash } from "react-icons/fi";
import { FaPlus } from "react-icons/fa6";
import { MdOutlineMessage } from "react-icons/md";
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, getDay, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import RemindersComponent from "@/components/reminders.section";
import LeadsCallsComponent from "@/components/lead-calls.section";
import NewTaskModal from "@/components/new-task.modal";
import CalendarByWeek from "@/components/calendar-week.section";
import CalendarByDay from "@/components/calendar-day.section";
import TaskDetailModal from "@/components/task-detail.modal";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { TouchBackend } from "react-dnd-touch-backend";
import { MultiBackend, TouchTransition } from "react-dnd-multi-backend";
import { useIsMobile } from "@/hooks/use-mobile";
import CommunicationModal from "@/components/communication.modal";
import { useLayout } from "../layout";
import { toast } from "react-toastify";
import { getNotificationDisplayProps } from "../../helpers/notification.helper";
import GlobalLoadingOverlay from "@/components/global-loading.overlay";
import ConfirmDeleteTaskModal from "@/components/confirm-delete-task-modal";
import SendTaskModal from "@/components/send-task.modal";
import UserMultiSelect from "@/components/user-multi-select.section";

// Componente de tarjeta de tarea draggable
const TaskCard = ({ task, onShowTask, taskStates }) => {
  const ref = React.useRef(null);

  const [{ isDragging }, drag] = useDrag({
    type: "TASK",
    item: { task },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(ref);

  const stateColor = taskStates[task.taskStateId]?.colorHex || "#57a9de";

  return (
    <div
      ref={ref}
      className={`p-3 neumorphic-card-inset rounded-lg cursor-grab active:cursor-grabbing transition-all duration-200 ${
        isDragging ? "opacity-40 scale-95" : "hover:scale-[1.02]"
      }`}
      onClick={() => onShowTask(task.uuid)}
      style={{ borderLeft: `4px solid ${stateColor}` }}
    >
      <h4 className="font-medium text-sm text-slate-700 dark:text-slate-200 truncate">
        {task.subject || "Sin título"}
      </h4>
      {task.description && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
          {task.description}
        </p>
      )}
      {task.dueDate && (
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
          📅 {format(new Date(task.dueDate), "dd/MM/yyyy")}
        </p>
      )}
      {task.assignedUsers && task.assignedUsers.length > 0 && (
        <div className="flex items-center mt-2 -space-x-1">
          {task.assignedUsers.slice(0, 3).map((user, idx) => (
            <div
              key={idx}
              className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary border-2 border-background-light dark:border-background-dark"
              title={user.name || user.email}
            >
              {(user.name || user.email || "?")[0].toUpperCase()}
            </div>
          ))}
          {task.assignedUsers.length > 3 && (
            <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-medium text-slate-600 dark:text-slate-300 border-2 border-background-light dark:border-background-dark">
              +{task.assignedUsers.length - 3}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Componente de columna Kanban droppable
const KanbanColumn = ({ column, onDrop, onAddTask, onShowTask, taskStates }) => {
  const ref = React.useRef(null);

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: "TASK",
    drop: (item) => {
      if (item.task.taskStateId !== column.id) {
        onDrop(item.task, column.id);
      }
    },
    canDrop: (item) => item.task.taskStateId !== column.id,
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  drop(ref);

  const isActive = isOver && canDrop;

  return (
    <div
      ref={ref}
      className={`neumorphic-card p-4 min-h-[300px] transition-all duration-200 ${
        isActive
          ? "ring-2 ring-primary ring-offset-2 bg-primary/5"
          : canDrop && isOver
          ? ""
          : ""
      }`}
    >
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: column.colorHex }}
          />
          <span className="font-semibold text-slate-700 dark:text-slate-200">
            {column.name}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
            {column.tasks.length}
          </span>
          <button
            className="p-1 rounded-md neumorphic-button text-slate-600 dark:text-slate-300"
            onClick={onAddTask}
          >
            <span className="material-icons-outlined text-base">add</span>
          </button>
        </div>
      </div>
      <div className={`space-y-3 transition-all duration-200 ${isActive ? "opacity-60" : ""}`}>
        {column.tasks.length === 0 ? (
          <div className={`text-center py-8 text-slate-400 dark:text-slate-500 text-sm border-2 border-dashed rounded-lg ${
            isActive ? "border-primary bg-primary/10" : "border-slate-200 dark:border-slate-700"
          }`}>
            {isActive ? "Soltar aquí" : "Sin tareas"}
          </div>
        ) : (
          column.tasks.map((task) => (
            <TaskCard
              key={task.uuid}
              task={task}
              onShowTask={onShowTask}
              taskStates={taskStates}
            />
          ))
        )}
        {column.tasks.length > 0 && isActive && (
          <div className="text-center py-4 text-primary text-sm border-2 border-dashed border-primary rounded-lg bg-primary/10">
            Soltar aquí
          </div>
        )}
      </div>
    </div>
  );
};

export default function Agenda() {
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [tasks, setTasks] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [leads, setLeads] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [communications, setCommunications] = useState([]);
  const [communicationsCurrentIndex, setCommunicationsCurrentIndex] = useState(0);
  const { sideBarHidden, setSideBarHidden } = useLayout();
  const isMobile = useIsMobile();
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("task");
  const [taskStateName, setTaskStateName] = useState(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isConfirmDeleteTaskModalOpen, setIsConfirmDeleteTaskModalOpen] = useState(false);
  const [selectedTaskUuid, setSelectedTaskUuid] = useState(null);
  const [isCommunicationModalOpen, setIsCommunicationModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [contracts, setContracts] = useState([]);
  const calendarRef = useRef(null);
  const [isSendTaskModalOpen, setIsSendTaskModalOpen] = useState(false);
  const [calendarView, setCalendarView] = useState("semana"); // mes, semana, dia
  const [holidays, setHolidays] = useState([]);
  const [absences, setAbsences] = useState([]);
  const [userId, setUserId] = useState(null);
  const [selectedUserIds, setSelectedUserIds] = useState([]);

  const fetchRemindersAndLeadsForMonth = async (date, userIdsToFetch = null) => {
    const jwtToken = getCookie("factura-token");
    const startDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), 1));
    const endDate = new Date(Date.UTC(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999));
    const data = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      userIds: userIdsToFetch || selectedUserIds,
    };

    try {
      const response = await authFetch("POST", "search/calendar/", data, jwtToken);
      if (response.ok) {
        const allEvents = await response.json();
        setReminders(allEvents.reminders || []);
        setLeads(allEvents.leadCalls || []);
      } else {
        console.error("Error al cargar los eventos del calendario");
      }
    } catch (error) {
      console.error("Error en la solicitud:", error);
    }
  };

  const getTasksForUser = async () => {
    const jwtToken = getCookie("factura-token");
    try {
      const response = await authGetFetch("tasks/assigned/tasks", jwtToken);
      if (response.ok) {
        const tasksResponse = await response.json();
        setTasks(tasksResponse);
      } else {
        console.error("Error cargando la información de las tareas");
      }
    } catch (error) {
      console.error("Error enviando la solicitud:", error);
    }
  };

  const getContracts = async () => {
    const jwtToken = getCookie("factura-token");
    try {
      const response = await authGetFetch("contracts/visible/cups", jwtToken);
      if (response.ok) {
        const contractsResponse = await response.json();
        setContracts(contractsResponse.contracts);
      } else {
        console.error("Error cargando la información de los contratos");
      }
      setIsLoading(false);
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
        const nonCommunicationNotifications = notificationsResponse.filter(
          (notification) => notification.eventType !== "communication"
        );
        const onlyCommunications = notificationsResponse.filter(
          (notification) => notification.eventType === "communication"
        );
        setFilteredNotifications(nonCommunicationNotifications);
        setCommunications(onlyCommunications);
      } else {
        console.error("Error cargando las notificaciones");
      }
    } catch (error) {
      console.error("Error enviando la solicitud:", error);
    }
  };

  const getUserIdFromToken = () => {
    const jwtToken = getCookie("factura-token");
    if (!jwtToken) return null;
    try {
      const payload = jose.decodeJwt(jwtToken);
      return payload.userId;
    } catch (error) {
      console.error("Error decodificando token:", error);
      return null;
    }
  };

  const fetchPublicHolidays = async (year) => {
    try {
      const response = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/es`, {
        method: "GET",
        headers: { accept: "text/plain" },
      });
      if (!response.ok) return [];
      const data = await response.json();
      return data.filter((holiday) => holiday.global === true || holiday?.counties?.includes("ES-AN"));
    } catch (error) {
      console.error("Error cargando festivos públicos:", error);
      return [];
    }
  };

  const fetchHolidaysAndAbsences = async (userIdsToFetch = null) => {
    const jwtToken = getCookie("factura-token");
    if (!jwtToken) return;

    const targetUserIds = userIdsToFetch || selectedUserIds;
    if (targetUserIds.length === 0) return;

    try {
      const year = calendarDate.getFullYear();
      const [publicHolidays, holidaysRes, absencesRes] = await Promise.all([
        fetchPublicHolidays(year),
        authGetFetch("holidays", jwtToken),
        authFetch("POST", "absences/users", { userIds: targetUserIds }, jwtToken),
      ]);

      let allHolidays = publicHolidays || [];
      if (holidaysRes.ok) {
        const customHolidays = await holidaysRes.json();
        allHolidays = [...allHolidays, ...customHolidays];
      }
      setHolidays(allHolidays);

      if (absencesRes.ok) {
        const userAbsences = await absencesRes.json();
        setAbsences(userAbsences);
      }
    } catch (error) {
      console.error("Error cargando festivos y ausencias:", error);
    }
  };

  const isHoliday = (day) => {
    return holidays.some((h) => {
      const holidayDate = parseISO(h.date);
      return isSameDay(holidayDate, day);
    });
  };

  const isAbsenceDay = (day) => {
    return absences.some((absence) => {
      if (absence.status !== "aprobada") return false;
      const startDate = parseISO(absence.startDate);
      const endDate = parseISO(absence.endDate);
      return day >= startDate && day <= endDate;
    });
  };

  const getDayInfo = (day) => {
    const holiday = holidays.find((h) => isSameDay(parseISO(h.date), day));
    const absence = absences.find((absence) => {
      if (absence.status !== "aprobada") return false;
      const startDate = parseISO(absence.startDate);
      const endDate = parseISO(absence.endDate);
      return day >= startDate && day <= endDate;
    });
    return { holiday, absence };
  };

  const handleShowTask = (uuid) => {
    setIsTaskModalOpen(true);
    setSelectedTaskUuid(uuid);
  };

  const closeTaskModal = () => {
    setIsTaskModalOpen(false);
    setSelectedTaskUuid(null);
  };

  useEffect(() => {
    const currentUserId = getUserIdFromToken();
    setUserId(currentUserId);
    if (currentUserId) {
      setSelectedUserIds([currentUserId]);
    }
    getTasksForUser();
    getContracts();
    getUnnotifiedNotifications();
  }, []);

  // Fetch calendar data when selectedUserIds change
  useEffect(() => {
    if (selectedUserIds.length > 0) {
      fetchRemindersAndLeadsForMonth(calendarDate, selectedUserIds);
      fetchHolidaysAndAbsences(selectedUserIds);
    }
  }, [selectedUserIds]);

  useEffect(() => {
    if (selectedUserIds.length > 0) {
      fetchRemindersAndLeadsForMonth(calendarDate, selectedUserIds);
    }
  }, [calendarDate]);

  useEffect(() => {
    if (selectedUserIds.length > 0) {
      fetchHolidaysAndAbsences(selectedUserIds);
    }
  }, [calendarDate.getFullYear()]);

  useEffect(() => {
    if (!isModalOpen) {
      setSelectedCalendarDate(null);
    }
  }, [isModalOpen]);

  useEffect(() => {
    if (communications.length > 0) {
      setIsCommunicationModalOpen(true);
      setSideBarHidden(true);
    }
  }, [communications]);

  useEffect(() => {
    if (filteredNotifications.length > 0) {
      filteredNotifications.forEach((notification) => {
        const displayProps = getNotificationDisplayProps(notification);
        toast.success(
          <div>
            <h2 className="text-black mb-3 text-lg font-semibold leading-tight hover:text-yellow-500 transition-colors duration-300">
              {displayProps.icon} {displayProps.subject}
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed">{notification.content}</p>
          </div>,
          {
            position: "top-right",
            draggable: true,
            icon: false,
            hideProgressBar: false,
            onClick: () => {
              if (notification.sourceUrl) {
                window.open(notification.sourceUrl, '_blank');
              }
            },
            autoClose: 5000,
            className: `transition-all transform hover:-translate-y-1 hover:shadow-l border border-gray-400`,
            style: { backgroundColor: displayProps.bgColor },
          }
        );
        notifiedNotification(notification);
      });
    }
  }, [filteredNotifications]);

  const updateReminder = async (reminder) => {
    const jwtToken = getCookie("factura-token");
    try {
      const response = await authFetch(
        "PATCH",
        `reminders/${reminder.uuid}`,
        { completed: reminder.completed ? 1 : 0 },
        jwtToken
      );
      if (!response.ok) {
        alert("Error actualizando el estado del recordatorio");
      }
    } catch (error) {
      console.error("Error enviando la solicitud:", error);
    }
  };

  const updateLead = async (lead) => {
    const jwtToken = getCookie("factura-token");
    try {
      const response = await authFetch(
        "PATCH",
        `lead-calls/${lead.uuid}`,
        { completed: lead.completed ? 1 : 0 },
        jwtToken
      );
      if (!response.ok) {
        alert("Error actualizando el estado del lead");
      }
    } catch (error) {
      console.error("Error enviando la solicitud:", error);
    }
  };

  const handleLeadCheckboxChange = (lead) => {
    const updatedLeads = leads.map((item) =>
      item.uuid === lead.uuid ? { ...item, completed: !item.completed } : item
    );
    setLeads(updatedLeads);
    updateLead({ ...lead, completed: !lead.completed });
  };

  const handleReminderCheckboxChange = (reminder) => {
    const updatedReminders = reminders.map((item) =>
      item.uuid === reminder.uuid ? { ...item, completed: !item.completed } : item
    );
    setReminders(updatedReminders);
    updateReminder({ ...reminder, completed: !reminder.completed });
  };

  const taskStates = {
    1: { name: "Por Hacer", colorHex: "#57a9de" },
    2: { name: "Haciendo", colorHex: "#f9d02d" },
    3: { name: "Hecho", colorHex: "#7ede57" },
    4: { name: "Falta Info", colorHex: "#ee4d3a" },
  };

  const columns = Object.entries(taskStates).map(([id, state]) => ({
    id: Number(id),
    name: state.name,
    colorHex: state.colorHex,
    tasks: tasks.filter((task) => task.taskStateId === Number(id)),
  }));

  const handleTaskStateChange = async (task, newStateId) => {
    setTasks((prevTasks) =>
      prevTasks.map((t) =>
        t.uuid === task.uuid
          ? {
              ...t,
              taskStateId: newStateId,
              taskState: {
                ...t.taskState,
                id: newStateId,
                name: taskStates[newStateId].name,
                colorHex: taskStates[newStateId].colorHex,
              },
            }
          : t
      )
    );

    const jwtToken = getCookie("factura-token");
    try {
      const response = await authFetch(
        "PATCH",
        `tasks/${task.uuid}`,
        { taskStateId: newStateId },
        jwtToken
      );
      if (!response.ok) {
        alert("Error actualizando el estado de la tarea en el servidor");
      }
    } catch (error) {
      console.error("Error enviando la solicitud:", error);
    }
  };

  const handleTaskCreated = () => {
    setIsModalOpen(false);
    getTasksForUser();
  };

  const handleTaskDelete = async () => {
    if (!selectedTaskUuid) {
      return;
    }
    const jwtToken = getCookie("factura-token");
    try {
      const response = await authFetch("DELETE", `tasks/${selectedTaskUuid}`, {}, jwtToken);
      if (!response.ok) {
        alert("Error eliminando la tarea en el servidor");
        return;
      }
      getTasksForUser();
      toast.success("Tarea eliminada correctamente");
      setIsConfirmDeleteTaskModalOpen(false);
      setSelectedTaskUuid(null);
    } catch (error) {
      console.error("Error enviando la solicitud:", error);
    }
  };

  const notifiedNotification = async (notification) => {
    const jwtToken = getCookie("factura-token");
    try {
      const response = await authFetch(
        "PATCH",
        `notifications/${notification.uuid}`,
        { notified: 1 },
        jwtToken
      );
      if (!response.ok) {
        alert("Error actualizando el estado de la notificacion en el servidor");
      }
    } catch (error) {
      console.error("Error enviando la solicitud:", error);
    }
  };

  // Calendar rendering
  const renderCalendar = () => {
    const monthStart = startOfMonth(calendarDate);
    const monthEnd = endOfMonth(calendarDate);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Add empty cells at the beginning to align with the first day of the week
    const startDay = getDay(monthStart);
    const emptyCells = Array(startDay).fill(null);

    // Add empty cells at the end to complete the grid
    const totalCells = [...emptyCells, ...days];
    const remainingCells = 7 - (totalCells.length % 7);
    if (remainingCells < 7) {
      totalCells.push(...Array(remainingCells).fill(null));
    }

    return (
      <div className="neumorphic-card-inset p-2 rounded-xl">
        <div className="grid grid-cols-7 gap-1 text-center text-xs">
          {/* Header - Días de la semana */}
          {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((day) => (
            <div key={day} className="py-2 font-semibold text-slate-600 dark:text-slate-400">
              {day}
            </div>
          ))}
          {/* Celdas de días */}
          {totalCells.map((day, index) => {
            if (!day) {
              return (
                <div
                  key={`empty-${index}`}
                  className="h-16 sm:h-20 rounded-lg bg-background-light/50 dark:bg-background-dark/50"
                ></div>
              );
            }

            const isToday = isSameDay(day, new Date());
            const isCurrentMonth = isSameMonth(day, calendarDate);
            const dayHoliday = isHoliday(day);
            const dayAbsence = isAbsenceDay(day);
            const isRedDay = dayHoliday || dayAbsence;
            const { holiday, absence } = getDayInfo(day);

            return (
              <div
                key={day.toString()}
                className={`h-16 sm:h-20 p-1 rounded-lg cursor-pointer transition-all duration-200 flex flex-col ${
                  isRedDay
                    ? "bg-red-100 dark:bg-red-900/40 hover:bg-red-200 dark:hover:bg-red-900/60"
                    : isToday
                    ? "neumorphic-button active bg-primary/10 dark:bg-primary/20"
                    : "neumorphic-button bg-background-light dark:bg-background-dark hover:bg-primary/5"
                } ${!isCurrentMonth ? "opacity-40" : ""}`}
                onClick={() => {
                  setSelectedCalendarDate(day);
                  setActiveTab("task");
                  setIsModalOpen(true);
                }}
                title={holiday ? (holiday.localName || holiday.name) : absence ? "Ausencia" : ""}
              >
                <span className={`text-sm font-medium ${
                  isRedDay
                    ? "text-red-600 dark:text-red-400"
                    : isToday
                    ? "text-primary font-bold"
                    : "text-slate-700 dark:text-slate-300"
                }`}>
                  {format(day, "d")}
                </span>
                {isCurrentMonth && (holiday || absence) && (
                  <div className="mt-auto">
                    <span className={`text-[8px] sm:text-[9px] leading-tight block truncate px-0.5 py-0.5 rounded ${
                      holiday
                        ? "bg-pink-200/60 dark:bg-pink-800/40 text-pink-700 dark:text-pink-300"
                        : "bg-red-200/60 dark:bg-red-800/40 text-red-700 dark:text-red-300"
                    }`}>
                      {holiday ? (holiday.localName || holiday.name) : absence?.description || "Ausencia"}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const previousMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1));
  };

  const todayLeads = leads.filter(lead => isSameDay(new Date(lead.date), new Date()));
  const todayReminders = reminders.filter(reminder => isSameDay(new Date(reminder.date), new Date()));
  const leadsProgress = todayLeads.length > 0 ? (todayLeads.filter(l => l.completed).length / todayLeads.length) * 100 : 0;
  const remindersProgress = todayReminders.length > 0 ? (todayReminders.filter(r => r.completed).length / todayReminders.length) * 100 : 0;

  return (
    <DndProvider
      backend={MultiBackend}
      options={{
        backends: [
          { backend: HTML5Backend },
          {
            backend: TouchBackend,
            options: { enableMouseEvents: true },
            preview: true,
            transition: TouchTransition,
          },
        ],
      }}
    >
      <div className="p-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Columna Izquierda - Agenda Clientes y Recordatorios */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            {/* Agenda Clientes */}
            <div className="neumorphic-card p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-slate-700 dark:text-slate-200">Agenda clientes</h3>
                <div className="flex items-center">
                  <span className="text-xs mr-2 text-slate-500 dark:text-slate-400">
                    {format(new Date(), "dd-MM-yyyy")}
                  </span>
                  <button
                    className="p-1 rounded-md neumorphic-button text-slate-600 dark:text-slate-300"
                    onClick={() => {
                      setActiveTab("leadCall");
                      setIsModalOpen(true);
                    }}
                  >
                    <span className="material-icons-outlined text-base">add</span>
                  </button>
                </div>
              </div>
              <div className="space-y-3">
                {todayLeads.length === 0 ? (
                  <div className="text-center py-4 text-slate-500 dark:text-slate-400 text-sm">
                    No hay llamadas programadas para hoy
                  </div>
                ) : (
                  todayLeads.slice(0, 3).map((lead, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 neumorphic-card-inset">
                      <span className="material-icons-outlined text-primary mt-1">call</span>
                      <div>
                        <h4 className="font-medium text-sm text-slate-700 dark:text-slate-200">
                          {lead.subject || "Llamada de seguimiento"}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Cliente: {lead.clientName || "N/A"}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Hora: {lead.time || "Por definir"}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="w-full neumorphic-progress-track h-1 mt-4">
                <div className="bg-primary h-1 rounded-full transition-all" style={{ width: `${leadsProgress}%` }}></div>
              </div>
            </div>

            {/* Recordatorio Personal */}
            <div className="neumorphic-card p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-slate-700 dark:text-slate-200">Recordatorio Personal</h3>
                <div className="flex items-center">
                  <span className="text-xs mr-2 text-slate-500 dark:text-slate-400">
                    {format(new Date(), "dd-MM-yyyy")}
                  </span>
                  <button
                    className="p-1 rounded-md neumorphic-button text-slate-600 dark:text-slate-300"
                    onClick={() => {
                      setActiveTab("reminder");
                      setIsModalOpen(true);
                    }}
                  >
                    <span className="material-icons-outlined text-base">add</span>
                  </button>
                </div>
              </div>
              <div className="space-y-3">
                {todayReminders.length === 0 ? (
                  <div className="text-center py-4 text-slate-500 dark:text-slate-400 text-sm">
                    No hay recordatorios para hoy
                  </div>
                ) : (
                  todayReminders.slice(0, 2).map((reminder, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 neumorphic-card-inset">
                      <span className="material-icons-outlined text-primary">description</span>
                      <div>
                        <h4 className="font-medium text-sm text-slate-700 dark:text-slate-200">
                          {reminder.subject || "Recordatorio"}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Vence: {format(new Date(reminder.date), "dd-MM-yyyy")}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="w-full neumorphic-progress-track h-1 mt-4">
                <div className="bg-primary h-1 rounded-full transition-all" style={{ width: `${remindersProgress}%` }}></div>
              </div>
            </div>
          </div>

          {/* Columna Derecha - Calendario */}
          <div className="col-span-12 lg:col-span-8">
            <div className="neumorphic-card p-4">
              <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                <div className="flex items-center space-x-2">
                  <button
                    className="p-1 rounded-md neumorphic-button text-slate-600 dark:text-slate-300"
                    onClick={previousMonth}
                  >
                    <span className="material-icons-outlined text-base">chevron_left</span>
                  </button>
                  <h3 className="font-semibold text-slate-700 dark:text-slate-200">
                    {format(calendarDate, "MMMM yyyy", { locale: es })}
                  </h3>
                  <button
                    className="p-1 rounded-md neumorphic-button text-slate-600 dark:text-slate-300"
                    onClick={nextMonth}
                  >
                    <span className="material-icons-outlined text-base">chevron_right</span>
                  </button>
                </div>
                <div className="flex items-center space-x-2">
                  <UserMultiSelect
                    selectedUserIds={selectedUserIds}
                    onSelectionChange={setSelectedUserIds}
                    currentUserId={userId}
                  />
                  <div className="flex items-center space-x-1 p-1 neumorphic-card-inset rounded-lg">
                  <button
                    className={`px-3 py-1 text-xs rounded-md transition-colors ${
                      calendarView === "mes"
                        ? "text-white bg-primary"
                        : "text-slate-600 dark:text-slate-400 hover:text-primary"
                    }`}
                    onClick={() => setCalendarView("mes")}
                  >
                    Mes
                  </button>
                  <button
                    className={`px-3 py-1 text-xs rounded-md transition-colors ${
                      calendarView === "semana"
                        ? "text-white bg-primary"
                        : "text-slate-600 dark:text-slate-400 hover:text-primary"
                    }`}
                    onClick={() => setCalendarView("semana")}
                  >
                    Semana
                  </button>
                  <button
                    className={`px-3 py-1 text-xs rounded-md transition-colors ${
                      calendarView === "dia"
                        ? "text-white bg-primary"
                        : "text-slate-600 dark:text-slate-400 hover:text-primary"
                    }`}
                    onClick={() => setCalendarView("dia")}
                  >
                    Día
                  </button>
                  </div>
                </div>
              </div>
              {calendarView === "mes" && renderCalendar()}
              {calendarView === "semana" && (
                <CalendarByWeek
                  onChangeView={(view) => setCalendarView(view === "month" ? "mes" : view === "week" ? "semana" : "dia")}
                  holidays={holidays}
                  absences={absences}
                  selectedUserIds={selectedUserIds}
                  currentUserId={userId}
                />
              )}
              {calendarView === "dia" && (
                <CalendarByDay
                  tasks={tasks}
                  reminders={reminders}
                  leadCalls={leads}
                  currentDate={calendarDate}
                  onDateChange={setCalendarDate}
                  onChangeView={(view) => setCalendarView(view === "month" ? "mes" : view === "week" ? "semana" : "dia")}
                  holidays={holidays}
                  absences={absences}
                  selectedUserIds={selectedUserIds}
                  currentUserId={userId}
                />
              )}
            </div>
          </div>

          {/* Grid de Columnas Kanban con Drag & Drop */}
          <div className="col-span-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {columns.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                onDrop={handleTaskStateChange}
                onAddTask={() => {
                  setTaskStateName(column.name);
                  setActiveTab("task");
                  setIsModalOpen(true);
                }}
                onShowTask={handleShowTask}
                taskStates={taskStates}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Modals */}
      {isModalOpen && (
        <div className={`fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 ${isModalOpen ? "lg:ml-72" : ""}`}>
          <NewTaskModal
            isModalOpen={isModalOpen}
            setIsModalOpen={setIsModalOpen}
            onTaskCreated={handleTaskCreated}
            contracts={contracts}
            initialTab={activeTab}
            taskStateName={taskStateName}
            selectedDate={selectedCalendarDate}
          />
        </div>
      )}

      <TaskDetailModal
        uuid={selectedTaskUuid}
        isOpen={isTaskModalOpen}
        onClose={closeTaskModal}
      />

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

      {isLoading && <GlobalLoadingOverlay isLoading={isLoading}></GlobalLoadingOverlay>}

      {isConfirmDeleteTaskModalOpen && (
        <ConfirmDeleteTaskModal
          onClose={() => setIsConfirmDeleteTaskModalOpen(false)}
          onDelete={handleTaskDelete}
        />
      )}

      {isSendTaskModalOpen && (
        <SendTaskModal isOpen={isSendTaskModalOpen} onClose={() => setIsSendTaskModalOpen(false)} />
      )}
    </DndProvider>
  );
}
