"use client";
import { useState, useEffect, useRef } from "react";
import { authGetFetch, authFetch } from "@/helpers/server-fetch.helper";
import { getCookie } from "cookies-next";
import { FiTrash } from "react-icons/fi";
import { FaPlus } from "react-icons/fa6";
import { MdOutlineMessage } from "react-icons/md";
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, getDay } from "date-fns";
import { es } from "date-fns/locale";
import RemindersComponent from "@/components/reminders.section";
import LeadsCallsComponent from "@/components/lead-calls.section";
import NewTaskModal from "@/components/new-task.modal";
import TaskDetailModal from "@/components/task-detail.modal";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { TouchBackend } from "react-dnd-touch-backend";
import { MultiBackend, TouchTransition } from "react-dnd-multi-backend";
import useIsMobile from "@/hooks/useIsMobile";
import CommunicationModal from "@/components/communication.modal";
import { useLayout } from "../layout";
import { toast } from "react-toastify";
import { getNotificationDisplayProps } from "../../helpers/notification.helper";
import GlobalLoadingOverlay from "@/components/global-loading.overlay";
import ConfirmDeleteTaskModal from "@/components/confirm-delete-task-modal";
import SendTaskModal from "@/components/send-task.modal";
import PageHeader from "@/components/page-header.component";

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

  const fetchRemindersAndLeadsForMonth = async (date) => {
    const jwtToken = getCookie("factura-token");
    const startDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), 1));
    const endDate = new Date(Date.UTC(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999));
    const data = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
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

  const handleShowTask = (uuid) => {
    setIsTaskModalOpen(true);
    setSelectedTaskUuid(uuid);
  };

  const closeTaskModal = () => {
    setIsTaskModalOpen(false);
    setSelectedTaskUuid(null);
  };

  useEffect(() => {
    getTasksForUser();
    fetchRemindersAndLeadsForMonth(calendarDate);
    getContracts();
    getUnnotifiedNotifications();
  }, []);

  useEffect(() => {
    fetchRemindersAndLeadsForMonth(calendarDate);
  }, [calendarDate]);

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
      <div className="grid grid-cols-7 gap-px text-center text-xs text-slate-500 dark:text-slate-400 bg-slate-300 dark:bg-slate-700 border border-slate-300 dark:border-slate-700">
        {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((day) => (
          <div key={day} className="py-2 bg-background-light dark:bg-background-dark font-semibold">
            {day}
          </div>
        ))}
        {totalCells.map((day, index) => {
          if (!day) {
            return <div key={`empty-${index}`} className="h-20 bg-background-light dark:bg-background-dark"></div>;
          }

          const isToday = isSameDay(day, new Date());
          const isCurrentMonth = isSameMonth(day, calendarDate);

          return (
            <div
              key={day.toString()}
              className={`h-20 pt-1 cursor-pointer transition-colors ${
                isToday
                  ? "bg-primary/20 text-primary font-semibold"
                  : "bg-background-light dark:bg-background-dark"
              } ${
                !isCurrentMonth ? "text-slate-400 dark:text-slate-600" : "text-slate-700 dark:text-slate-300"
              } hover:bg-primary/10`}
              onClick={() => {
                setSelectedCalendarDate(day);
                setActiveTab("task");
                setIsModalOpen(true);
              }}
            >
              <span className="p-1">{format(day, "d")}</span>
            </div>
          );
        })}
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
        <PageHeader title="Agenda Personal" />

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
                      setActiveTab("task");
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
              <div className="flex justify-between items-center mb-4">
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
                <div className="flex items-center space-x-1 p-1 neumorphic-card-inset rounded-md">
                  <button
                    className={`px-3 py-1 text-xs rounded-md transition-colors ${
                      calendarView === "mes" ? "" : ""
                    }`}
                    onClick={() => setCalendarView("mes")}
                  >
                    Mes
                  </button>
                  <button
                    className={`px-3 py-1 text-xs rounded-md transition-colors ${
                      calendarView === "semana" ? "text-white bg-primary" : ""
                    }`}
                    onClick={() => setCalendarView("semana")}
                  >
                    Semana
                  </button>
                  <button
                    className={`px-3 py-1 text-xs rounded-md transition-colors ${
                      calendarView === "dia" ? "" : ""
                    }`}
                    onClick={() => setCalendarView("dia")}
                  >
                    Día
                  </button>
                </div>
              </div>
              {renderCalendar()}
            </div>
          </div>

          {/* Grid de Columnas Kanban */}
          <div className="col-span-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {columns.map((column) => (
              <div key={column.id} className="neumorphic-card p-4">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">{column.name}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-slate-500 dark:text-slate-400">{column.tasks.length}</span>
                    <button
                      className="p-1 rounded-md neumorphic-button text-slate-600 dark:text-slate-300"
                      onClick={() => {
                        setTaskStateName(column.name);
                        setActiveTab("task");
                        setIsModalOpen(true);
                      }}
                    >
                      <span className="material-icons-outlined text-base">add</span>
                    </button>
                  </div>
                </div>
              </div>
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
