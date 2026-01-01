"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FiEye } from "react-icons/fi";
import { authGetFetch } from "@/helpers/server-fetch.helper";
import { getCookie } from "cookies-next";
import TaskSearch from "@/components/send-task.search";
import * as jose from "jose";
import BaseModal, {
  ModalInput,
  ModalTextarea,
  ModalButton,
  ModalActions,
} from "@/components/base-modal.component";

export default function SendTaskModal({ isOpen, onClose }) {
  const router = useRouter();
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [isManager, setIsManager] = useState();
  const [selectedFile, setSelectedFile] = useState(null);
  const [tasksFilters, setTasksFilters] = useState({});
  const [isFiltersApplied, setIsFiltersApplied] = useState(false);
  const [newTask, setNewTask] = useState({
    startDate: "",
    subject: "",
    initialComment: "",
    assigneeUserId: "",
  });

  const getTasks = async () => {
    const jwtToken = getCookie("factura-token");

    try {
      const response = await authGetFetch("tasks/", jwtToken);

      if (response.ok) {
        const tasksResponse = await response.json();
        setTasks(tasksResponse);
        const payload = jose.decodeJwt(jwtToken);
        setIsManager(payload.isManager);
      } else {
        console.error("Error cargando la información de las tareas");
      }
    } catch (error) {
      console.error("Error enviando la solicitud:", error);
    }
  };

  useEffect(() => {
    if (isManager !== undefined) {
      if (isManager) {
        getUsersManager();
      } else {
        getUsersNotManager();
      }
    }
  }, [isManager]);

  const getUsersManager = async () => {
    const jwtToken = getCookie("factura-token");

    try {
      const response = await authGetFetch("users/visible-users/", jwtToken);

      if (response.ok) {
        const { users: usersArray } = await response.json();
        setUsers(usersArray);
      } else {
        console.error("Error cargando la información de los usuarios");
      }
    } catch (error) {
      console.error("Error enviando la solicitud:", error);
    }
  };

  const getUsersNotManager = async () => {
    const jwtToken = getCookie("factura-token");

    try {
      const response = await authGetFetch(
        "users/agent-visible-users/",
        jwtToken
      );

      if (response.ok) {
        const { users: usersArray } = await response.json();
        setUsers(usersArray);
      } else {
        console.error("Error cargando la información de los usuarios");
      }
    } catch (error) {
      console.error("Error enviando la solicitud:", error);
    }
  };

  useEffect(() => {
    if (!isFiltersApplied) {
      getTasks();
    } else {
      getFilteredTasks(tasksFilters);
    }
  }, []);

  const handleUpdateTasks = (filteredTasks) => {
    setTasks(filteredTasks);
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    const jwtToken = getCookie("factura-token");

    // Validate assigneeUserId
    if (!newTask.assigneeUserId) {
      alert("Por favor selecciona un destinatario");
      return;
    }

    const formData = new FormData();
    formData.append("subject", newTask.subject);
    formData.append("startDate", newTask.startDate);
    formData.append("assigneeUserId", String(newTask.assigneeUserId)); // Ensure it's a string
    formData.append("initialComment", newTask.initialComment);
    formData.append("taskStateId", "1"); // 1 = "Por Hacer" (default state)

    if (selectedFile) {
      formData.append("taskCommentFile", selectedFile);
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/tasks/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${jwtToken}`,
          },
          body: formData,
        }
      );

      if (response.ok) {
        alert("Tarea enviada con éxito");
        await getTasks();
        setNewTask({
          startDate: "",
          subject: "",
          initialComment: "",
          assigneeUserId: "",
        });
        setSelectedFile(null);
      } else {
        const errorData = await response.json();
        console.error("Detalles del error:", errorData);
        alert(
          `Error agregando la tarea: ${
            errorData.message || "Error desconocido"
          }`
        );
      }
    } catch (error) {
      console.error("Error enviando la solicitud:", error);
    }
  };

  const handleShowTask = (uuid) => {
    router.push(`/task/${uuid}`);
  };

  const handleClearFilters = () => {
    setTasksFilters({});
    setIsFiltersApplied(false);
    getTasks();
  };

  if (!isOpen) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Enviar Tareas"
      maxWidth="max-w-6xl"
    >
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Formulario */}
        <div className="w-full lg:w-1/2">
          <div className="neumorphic-card-inset p-5 rounded-xl">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Nueva Tarea</h3>
            <form onSubmit={handleAddTask} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha inicio (opcional)
                  </label>
                  <ModalInput
                    type="date"
                    value={newTask.startDate}
                    onChange={(e) =>
                      setNewTask({ ...newTask, startDate: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dirigido a:
                  </label>
                  <select
                    value={newTask.assigneeUserId}
                    onChange={(e) =>
                      setNewTask({
                        ...newTask,
                        assigneeUserId: e.target.value,
                      })
                    }
                    required
                    className="w-full px-4 py-3 rounded-lg neumorphic-card-inset text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary transition-all appearance-none cursor-pointer"
                  >
                    <option value="" disabled>
                      Selecciona un destinatario
                    </option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Asunto
                </label>
                <ModalInput
                  type="text"
                  value={newTask.subject}
                  onChange={(e) =>
                    setNewTask({ ...newTask, subject: e.target.value })
                  }
                  required
                  placeholder="Escribe el asunto de la tarea"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Comentario
                </label>
                <ModalTextarea
                  rows="4"
                  value={newTask.initialComment}
                  onChange={(e) =>
                    setNewTask({ ...newTask, initialComment: e.target.value })
                  }
                  placeholder="Escribe un comentario para la tarea"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Archivo
                </label>
                <div className="neumorphic-card-inset rounded-lg p-3">
                  <input
                    type="file"
                    onChange={(e) => setSelectedFile(e.target.files[0])}
                    className="w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary file:text-white hover:file:bg-primary/90 cursor-pointer"
                  />
                </div>
              </div>

              <ModalActions align="right">
                <ModalButton type="submit" variant="primary">
                  Enviar
                </ModalButton>
              </ModalActions>
            </form>
          </div>
        </div>

        {/* Historial */}
        <div className="w-full lg:w-1/2">
          <div className="neumorphic-card-inset p-5 rounded-xl">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Historial de Tareas</h3>
            <TaskSearch
              onUpdateTasks={handleUpdateTasks}
              onClearFilters={handleClearFilters}
              users={users}
            />
            <div className="overflow-auto max-h-[400px] mt-4 rounded-lg">
              <table className="min-w-full">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="py-2 px-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Fecha</th>
                    <th className="py-2 px-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Asunto</th>
                    <th className="py-2 px-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Destinatario</th>
                    <th className="py-2 px-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Estado</th>
                    <th className="py-2 px-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">Detalles</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {Array.isArray(tasks) && tasks.length > 0 ? (
                    tasks.map((task) => (
                      <tr
                        key={task.uuid}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-2 px-3 text-sm text-gray-700 whitespace-nowrap">
                          {task.startDate ? new Date(task.startDate).toLocaleDateString() : "Sin fecha"}
                        </td>
                        <td className="py-2 px-3 text-sm text-gray-700">
                          {task.subject}
                        </td>
                        <td className="py-2 px-3 text-sm text-gray-700">
                          {task.assigneeUser.name}
                        </td>
                        <td className="py-2 px-3">
                          <span
                            className="px-2 py-1 rounded text-xs font-medium"
                            style={{
                              backgroundColor: task.taskState.colorHex,
                              color: "#fff",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {task.taskState.name}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <button
                            className="text-primary hover:text-primary/80 transition-colors"
                            onClick={() => handleShowTask(task.uuid)}
                            title="Ver detalles"
                          >
                            <FiEye size={18} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center py-8 text-gray-500">
                        No hay tareas disponibles
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </BaseModal>
  );
}
