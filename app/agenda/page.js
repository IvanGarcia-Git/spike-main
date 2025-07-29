"use client";
import { useState, useEffect, useRef } from "react";
import { authGetFetch, authFetch } from "@/helpers/server-fetch.helper";
import { getCookie } from "cookies-next";
import { FiTrash } from "react-icons/fi";
import { FaPlus } from "react-icons/fa6";
import { MdOutlineMessage } from "react-icons/md";
import { format, addDays } from "date-fns";
import RemindersComponent from "@/components/reminders.section";
import LeadsCallsComponent from "@/components/lead-calls.section";
import Calendar from "@/components/calendar.section";
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
        // IMPORTANTE: Ya no llamamos a setTasks aquí.
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
    // En la carga inicial, obtenemos TODAS las tareas para el Trello
    getTasksForUser();
    // Y obtenemos los reminders/leads para el mes actual
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

  const tasksForCalendar = tasks.filter((task) => {
    const taskDate = new Date(task.startDate);
    return (
      taskDate.getMonth() === calendarDate.getMonth() &&
      taskDate.getFullYear() === calendarDate.getFullYear()
    );
  });

  const columns = Object.entries(taskStates).map(([id, state]) => ({
    id: Number(id),
    name: state.name,
    colorHex: state.colorHex,
    tasks: tasks.filter((task) => task.taskStateId === Number(id)),
  }));

  const Task = ({ task }) => {
    const [{ isDragging }, drag] = useDrag(
      () => ({
        type: "TASK",
        item: { task },
        collect: (monitor) => ({
          isDragging: monitor.isDragging(),
        }),
      }),
      [task]
    );

    return (
      <div
        ref={drag}
        className={`bg-foreground border-l-4 p-3 shadow-md rounded-lg flex flex-col space-y-2 cursor-pointer ${
          isDragging ? "opacity-50" : ""
        }`}
        onClick={() => handleShowTask(task.uuid)}
      >
        <div className="flex justify-between items-center">
          <span
            className="px-3 py-1 text-sm rounded-md font-semibold"
            style={{
              backgroundColor: task.taskState.colorHex,
              color: "white",
            }}
          >
            {task.taskState.name}
          </span>
          <span className="text-gray-900 text-sm">
            <b>{new Date(task.startDate).toLocaleDateString()}</b>
          </span>
        </div>

        <h4 className="text-lg font-medium text-gray-700">{task.subject}</h4>
        <p className="text-gray-600 text-sm">
          Creado: {new Date(task.createdAt).toLocaleDateString()}
        </p>

        <div className="flex items-center justify-between">
          <p className="text-gray-600 text-sm">
            Actualizado: {new Date(task.updatedAt).toLocaleDateString()}
          </p>
        </div>

        {/* New section for comments, users, and eye icon */}
        <div className="flex items-center space-x-4 mt-4">
          {/* Comment icon with count */}
          <div className="flex items-center space-x-2">
            <div className="bg-green-200 p-2 rounded-full">
              <MdOutlineMessage className="text-green-600" size={20} />
            </div>
            <span className="text-gray-700 text-md font-semibold">{task.comments.length}</span>{" "}
          </div>

          {/* Overlapping user avatars */}
          <div className="flex -space-x-3 items-center ml-4">
            <img
              className="inline-block bg-background rounded-full w-10 h-10 bg-surface-400 transform hover:-translate-y-1 shadow-md border border-white"
              src="avatar.png" // Placeholder for user 1
              alt="User 1"
            />
            {task.creatorUserId !== task.assigneeUserId && (
              <img
                className="inline-block bg-background rounded-full w-10 h-10 bg-surface-400 transform hover:-translate-y-1 shadow-md border border-white"
                src="avatar.png"
                alt="User 2"
              />
            )}
          </div>

          <button
            className="ml-auto text-red-500 hover:text-red-700 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              setIsConfirmDeleteTaskModalOpen(true);
              setSelectedTaskUuid(task.uuid);
            }}
          >
            <FiTrash size={22} />
          </button>
        </div>
      </div>
    );
  };

  const Column = ({ column, children }) => {
    const [, drop] = useDrop(
      () => ({
        accept: "TASK",
        drop: (item) => handleTaskStateChange(item.task, column.id),
      }),
      [column]
    );

    return (
      <div ref={drop} className="bg-gray-100 rounded-lg shadow-lg p-3" data-column-id={column.id}>
        {/* Header with title and actions */}
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-xl font-semibold text-gray-800">{column.name}</h3>

          <div className="flex items-center space-x-2">
            <span className="bg-white text-gray-800 text-sm font-semibold rounded-full px-3 py-1 shadow">
              {children.length}
            </span>

            <button
              onClick={() => {
                setTaskStateName(column.name);
                setActiveTab("task");
                setIsModalOpen(true);
              }}
              className="p-2 bg-secondary text-white rounded-full hover:bg-secondaryHover flex-shrink-0"
            >
              <FaPlus size={14} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-3">{children}</div>
      </div>
    );
  };

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
    if (calendarRef.current) {
      calendarRef.current.refreshEvents();
    }
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
      <div className={`flex flex-col bg-background min-h-screen ${isMobile ? "pr-0" : "pr-4"}`}>
        {/* Sección Principal */}
        <div className="w-full flex justify-end pr-4 mt-4">
          <button
            className="bg-blue-500 text-white font-bold px-4 py-2 rounded-md ml-auto"
            onClick={() => setIsSendTaskModalOpen(true)}
          >
            Enviar Tareas
          </button>
        </div>

        <div className="flex flex-col md:flex-row justify-center items-start bg-background">
          {/* Columna Izquierda: Leads y Reminders */}
          <div
            className={`flex flex-col ${
              isMobile ? "p-4 w-full" : "p-0 min-w-[230px]"
            }  justify-center space-y-6`}
          >
            {/* Sección de Leads */}
            <LeadsCallsComponent
              leads={leads}
              selectedDate={calendarDate}
              onPreviousDay={() => setCalendarDate(addDays(calendarDate, -1))}
              onNextDay={() => setCalendarDate(addDays(calendarDate, 1))}
              onCheckboxChange={handleLeadCheckboxChange}
              onAddLeadCall={() => {
                setActiveTab("task");
                setIsModalOpen(true);
              }}
            />
            {/* Sección de Reminders */}
            <RemindersComponent
              reminders={reminders}
              selectedDate={calendarDate}
              onPreviousDay={() => setCalendarDate(addDays(calendarDate, -1))}
              onNextDay={() => setCalendarDate(addDays(calendarDate, 1))}
              onCheckboxChange={handleReminderCheckboxChange}
              onAddReminder={() => {
                setActiveTab("reminder");
                setIsModalOpen(true);
              }}
            />
          </div>

          {/* Columna Derecha: Calendario */}
          <div className="w-full p-4">
            <div className="bg-foreground text-black rounded-lg">
              <Calendar
                ref={calendarRef}
                tasks={tasksForCalendar}
                reminders={reminders}
                leadCalls={leads}
                currentDate={calendarDate}
                onDateChange={setCalendarDate}
                onDayClick={(selectedDate) => {
                  setSelectedCalendarDate(selectedDate);
                  setActiveTab("task");
                  setIsModalOpen(true);
                }}
                onEventsChange={getTasksForUser}
              />
            </div>
          </div>
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div
            className={`fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 ${
              isModalOpen ? "lg:ml-72" : ""
            }`}
          >
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

        {/* Grid de Columnas y Tareas */}
        <div
          className={`w-full grid grid-cols-1 md:grid-cols-4 gap-4 ${
            isMobile ? "p-4" : "pr-4"
          } mb-4`}
        >
          {columns.map((column) => (
            <Column key={column.id} column={column}>
              {column.tasks.map((task) => (
                <Task key={task.uuid} task={task} />
              ))}
            </Column>
          ))}
        </div>
      </div>
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
