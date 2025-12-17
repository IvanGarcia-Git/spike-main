"use client";
import { getCookie } from "cookies-next";
import { authFetch } from "@/helpers/server-fetch.helper";
import { useRouter } from "next/navigation";
import { FaPlus } from "react-icons/fa";
import { FiFileText, FiTrash } from "react-icons/fi";

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

  return (
    <div
      className={`fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center transition-opacity z-50 ${
        isModalOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
    >
      <div className="bg-white p-6 rounded-lg w-96 lg:ml-72 z-60">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Eventos del día</h2>
          <button
            onClick={(e) => handleAddTaskClickAndClose(e, currentDate.getDate())}
            className="text-blue-500 hover:text-blue-700 p-1"
          >
            <FaPlus size={16} />
          </button>
        </div>
        <div className="overflow-y-auto max-h-64">
          {events.length > 0 ? (
            events.map((event, index) => {
              let timeString = "";
              if (event.startDate && event.type !== "task") {
                const eventDate = new Date(event.startDate);
                timeString = `${String(eventDate.getUTCHours()).padStart(2, "0")}:${String(
                  eventDate.getUTCMinutes()
                ).padStart(2, "0")}`;
              }

              let bgColor;
              if (event.type === "task") {
                bgColor = "bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600";
              } else if (event.type === "reminder") {
                bgColor = "bg-green-200";
              } else if (event.type === "leadCall") {
                bgColor = "bg-cyan-200";
              }

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
                  className={`${bgColor} mb-2 p-2 border rounded flex justify-between items-center`}
                >
                  <div className={`flex flex-col`} onClick={handleClick}>
                    <p className={`font-medium ${isCompleted ? "line-through text-gray-500" : ""}`}>
                      {timeString ? `${timeString} - ` : ""}
                      {event.subject}
                    </p>
                    <p
                      className={`text-sm ${
                        isCompleted ? "line-through text-gray-400" : "text-gray-600"
                      }`}
                    >
                      {event.type === "task"
                        ? "Tarea"
                        : event.type === "reminder"
                        ? "Recordatorio"
                        : "Llamada"}
                      {getEventUserName(event) && (
                        <span className="text-xs ml-1">
                          - {getEventUserName(event)}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 shrink-0">
                    {event.contractUrl && (
                      <a
                        href={event.contractUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-500 hover:text-green-700"
                        title="Ver contrato"
                      >
                        <FiFileText size={18} />
                      </a>
                    )}

                    {(event.type === "task" ||
                      event.type === "reminder" ||
                      event.type === "leadCall") && (
                      <button
                        onClick={() => handleDeleteEvent(event)}
                        className="p-1 text-red-500 hover:text-red-700"
                        title="Eliminar"
                      >
                        <FiTrash size={18} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-gray-500">No hay eventos.</p>
          )}
        </div>
        <button
          onClick={handleClose}
          className="mt-4 hover:bg-secondaryHover text-white p-2 rounded-lg shadow-md bg-secondary w-full"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
