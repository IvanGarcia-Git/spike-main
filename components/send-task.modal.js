"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FiEye } from "react-icons/fi";
import { authGetFetch } from "@/helpers/server-fetch.helper";
import { getCookie } from "cookies-next";
import TaskSearch from "@/components/send-task.search";
import * as jose from "jose";

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

    const formData = new FormData();
    formData.append("subject", newTask.subject);
    formData.append("startDate", newTask.startDate);
    formData.append("assigneeUserId", newTask.assigneeUserId);
    formData.append("initialComment", newTask.initialComment);

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 lg:ml-72">
      <div className="bg-background w-11/12 max-w-6xl max-h-[90vh] overflow-y-auto rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-black">Enviar Tareas</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Formulario */}
          <div className="w-full md:w-1/2">
            <div className="bg-foreground text-black rounded-lg p-6">
              <h3 className="text-xl font-bold mb-4">Nueva Tarea</h3>
              <form onSubmit={handleAddTask}>
                <div className="mb-4 flex justify-between">
                  <div className="w-1/2 pr-2">
                    <label
                      className="block text-black mb-2"
                      htmlFor="startDate"
                    >
                      Fecha inicio
                    </label>
                    <input
                      type="date"
                      id="startDate"
                      className="w-full px-4 py-2 rounded bg-background text-black focus:outline-none"
                      value={newTask.startDate}
                      onChange={(e) =>
                        setNewTask({ ...newTask, startDate: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label
                      className="block text-black mb-2"
                      htmlFor="assigneeUserId"
                    >
                      Dirigido a:
                    </label>
                    <select
                      id="assigneeUserId"
                      name="assigneeUserId"
                      value={newTask.assigneeUserId}
                      className="w-full px-4 py-2 rounded bg-background text-black focus:outline-none"
                      onChange={(e) =>
                        setNewTask({
                          ...newTask,
                          assigneeUserId: e.target.value,
                        })
                      }
                      required
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

                <div className="mb-4">
                  <label className="block text-black mb-2" htmlFor="name">
                    Asunto
                  </label>
                  <input
                    type="text"
                    id="name"
                    className="w-full px-4 py-2 rounded bg-background text-black focus:outline-none"
                    value={newTask.subject}
                    onChange={(e) =>
                      setNewTask({ ...newTask, subject: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-black mb-2" htmlFor="comments">
                    Comentario
                  </label>
                  <textarea
                    id="comments"
                    className="w-full h-32 px-4 py-2 rounded bg-background text-black focus:outline-none"
                    rows="4"
                    value={newTask.initialComment}
                    onChange={(e) =>
                      setNewTask({ ...newTask, initialComment: e.target.value })
                    }
                  ></textarea>
                </div>

                <div className="mb-4">
                  <label className="block text-black mb-2" htmlFor="file">
                    Archivo
                  </label>
                  <input
                    type="file"
                    id="file"
                    onChange={(e) => setSelectedFile(e.target.files[0])}
                    className="w-full cursor-pointer"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="bg-secondary text-white px-4 py-2 rounded hover:bg-secondaryHover"
                  >
                    Enviar
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Historial */}
          <div className="w-full md:w-1/2">
            <div className="bg-foreground text-black rounded-lg p-6">
              <h3 className="text-xl font-bold mb-4">Historial de Tareas</h3>
              <TaskSearch
                onUpdateTasks={handleUpdateTasks}
                onClearFilters={handleClearFilters}
                users={users}
              />
              <div className="overflow-auto">
                <table className="min-w-full bg-foreground text-black">
                  <thead className="bg-background">
                    <tr>
                      <th className="py-2 px-4">Fecha</th>
                      <th className="py-2 px-4">Asunto</th>
                      <th className="py-2 px-4">Destinatario</th>
                      <th className="py-2 px-4">Estado</th>
                      <th className="py-2 px-4">Detalles</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-300 divide-y divide-gray-600">
                    {Array.isArray(tasks) && tasks.length > 0 ? (
                      tasks.map((task) => (
                        <tr
                          key={task.uuid}
                          className="bg-foreground hover:bg-background"
                        >
                          <td className="py-2 px-4 text-black">
                            {new Date(task.startDate).toLocaleDateString()}
                          </td>
                          <td className="py-2 px-4 text-black">
                            {task.subject}
                          </td>
                          <td className="py-2 px-4 text-black">
                            {task.assigneeUser.name}
                          </td>
                          <td className="py-2 px-4 text-black">
                            <span
                              className="px-2 py-1 rounded"
                              style={{
                                backgroundColor: task.taskState.colorHex,
                                color: "#fff",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {task.taskState.name}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-center text-black">
                            <button
                              className="text-yellow-500 hover:text-yellow-700"
                              onClick={() => handleShowTask(task.uuid)}
                            >
                              <FiEye size={22} />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="text-center py-4 text-black">
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
      </div>
    </div>
  );
}
