"use client";
import { getCookie } from "cookies-next";
import { authFetch } from "@/helpers/server-fetch.helper";
import { useRouter } from "next/navigation";
import { FaPlus } from "react-icons/fa";
import { FiFileText, FiTrash } from "react-icons/fi";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function CalendarDetailsDay({
  isModalOpen,
  setIsModalOpen,
  events,
  currentDate,
  handleAddTaskClick,
  fetchEvents,
}) {
  const handleClose = () => {
    setIsModalOpen(false);
  };

  const router = useRouter();

  const formattedDate = currentDate
    ? format(currentDate, "EEEE, d 'de' MMMM", { locale: es })
    : "";

  const handleDeleteEvent = async (event) => {
    const eventTypeName =
      event.type === "task" ? "tarea" : event.type === "reminder" ? "recordatorio" : "llamada";
    if (!window.confirm(`¿Estás seguro de que quieres eliminar esta ${eventTypeName}?`)) {
      return;
    }

    let path = "";
    switch (event.type) {
      case "task":
        path = "tasks";
        break;
      case "reminder":
        path = "reminders";
        break;
      case "leadCall":
        path = "lead-calls";
        break;
      default:
        console.error("Tipo de evento desconocido:", event.type);
        return; // No hacer nada si el tipo es desconocido
    }

    const jwtToken = getCookie("factura-token");
    try {
      const response = await authFetch("DELETE", `${path}/${event.uuid}`, {}, jwtToken);

      if (!response.ok) {
        alert("Error al eliminar el evento.");
        return;
      }

      alert("Evento eliminado correctamente.");
      if (fetchEvents) {
        fetchEvents();
      }

      setIsModalOpen(false);
    } catch (error) {
      console.error("Error al enviar la solicitud de eliminación:", error);
      alert("Error de red al intentar eliminar el evento.");
    }
  };

  const handleAssignLeadToUser = async (leadId) => {
    const confirmAction = window.confirm("Esta acción te asignará este lead. ¿Deseas continuar?");

    if (!confirmAction) {
      return;
    }

    const jwtToken = getCookie("factura-token");

    try {
      const response = await authFetch("POST", "leads/assign-to-user", { leadId }, jwtToken);

      if (response.ok) {
        const responseData = await response.json();

        if (responseData.assignedLead === null) {
          alert("Este lead ya está asignado a otro usuario.");
        } else {
          alert(`Lead asignado correctamente`);
          router.push(`/gestor-lead`);
        }
      } else {
        console.error("Error al asignar el lead");
        alert("Error al asignar el lead");
      }
    } catch (error) {
      console.error("Error en la solicitud:", error);
      alert("Error al realizar la solicitud");
    }
  };

  const handleAddTaskClickAndClose = (e, day) => {
    handleAddTaskClick(e, day);
    setIsModalOpen(false);
  };

  const getEventUserName = (event) => {
    // For tasks, user is in assigneeUser; for reminders/leadCalls, it's in user
    const user = event.assigneeUser || event.user;
    if (!user) return null;
    return `${user.name} ${user.firstSurname || ""}`.trim();
  };

  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="neumorphic-card p-6 rounded-xl w-full max-w-md animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200">
              Actividades del día
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 capitalize">
              {formattedDate}
            </p>
          </div>
          <button
            onClick={(e) => handleAddTaskClickAndClose(e, currentDate?.getDate())}
            className="p-2 rounded-lg neumorphic-button text-primary hover:text-primary-dark transition-colors"
            title="Crear nueva actividad"
          >
            <FaPlus size={16} />
          </button>
        </div>

        {/* Events List */}
        <div className="overflow-y-auto max-h-80 space-y-2">
          {events.length > 0 ? (
            events.map((event, index) => {
              let timeString = "";
              if (event.startDate) {
                const eventDate = new Date(event.startDate);
                const hours = eventDate.getHours();
                const minutes = eventDate.getMinutes();
                if (hours !== 0 || minutes !== 0) {
                  timeString = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
                }
              }

              const typeConfig = {
                task: {
                  bg: "bg-slate-100 dark:bg-slate-800",
                  border: "border-l-4 border-blue-500",
                  label: "Tarea",
                  icon: "📋",
                },
                reminder: {
                  bg: "bg-green-50 dark:bg-green-900/30",
                  border: "border-l-4 border-green-500",
                  label: "Recordatorio",
                  icon: "🔔",
                },
                leadCall: {
                  bg: "bg-cyan-50 dark:bg-cyan-900/30",
                  border: "border-l-4 border-cyan-500",
                  label: "Llamada",
                  icon: "📞",
                },
              };

              const config = typeConfig[event.type] || typeConfig.task;

              const isCompleted =
                event.completed || (event.type === "task" && event.taskStateId === 3);

              const handleClick = () => {
                if (event.type === "leadCall" && event.leadId !== null) {
                  handleAssignLeadToUser(event.leadId);
                }
              };

              return (
                <div
                  key={index}
                  className={`${config.bg} ${config.border} p-3 rounded-lg flex justify-between items-start gap-2 transition-all hover:shadow-md`}
                >
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={handleClick}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm">{config.icon}</span>
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
                        {config.label}
                      </span>
                      {timeString && (
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          {timeString}
                        </span>
                      )}
                    </div>
                    <p className={`font-medium text-sm truncate ${
                      isCompleted
                        ? "line-through text-slate-400 dark:text-slate-500"
                        : "text-slate-700 dark:text-slate-200"
                    }`}>
                      {event.subject}
                    </p>
                    {getEventUserName(event) && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        👤 {getEventUserName(event)}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {event.contractUrl && (
                      <a
                        href={event.contractUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-md hover:bg-green-100 dark:hover:bg-green-900/50 text-green-600 dark:text-green-400 transition-colors"
                        title="Ver contrato"
                      >
                        <FiFileText size={16} />
                      </a>
                    )}
                    <button
                      onClick={() => handleDeleteEvent(event)}
                      className="p-1.5 rounded-md hover:bg-red-100 dark:hover:bg-red-900/50 text-red-500 dark:text-red-400 transition-colors"
                      title="Eliminar"
                    >
                      <FiTrash size={16} />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-slate-400 dark:text-slate-500">
              <span className="text-3xl mb-2 block">📭</span>
              <p className="text-sm">No hay actividades programadas</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 flex gap-2">
          <button
            onClick={(e) => handleAddTaskClickAndClose(e, currentDate?.getDate())}
            className="flex-1 py-2.5 px-4 rounded-lg neumorphic-button text-primary font-medium text-sm flex items-center justify-center gap-2 hover:bg-primary/5 transition-colors"
          >
            <FaPlus size={12} />
            Crear actividad
          </button>
          <button
            onClick={handleClose}
            className="py-2.5 px-6 rounded-lg neumorphic-button text-slate-600 dark:text-slate-300 font-medium text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
