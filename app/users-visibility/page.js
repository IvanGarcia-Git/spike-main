"use client";
import { useState, useEffect } from "react";
import { authGetFetch, authFetch } from "@/helpers/server-fetch.helper";
import { getCookie } from "cookies-next";

export default function UsersVisibility() {
  const [activeTab, setActiveTab] = useState("Tareas");
  const [agents, setAgents] = useState([]);
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [allUsers, setAllUsers] = useState([]);
  const [visibleUsersId, setVisibleUsersId] = useState([]);

  const [visibleUserShareLeadUsersIds, setVisibleUserShareLeadUsersIds] =
    useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");

  const getAgents = async () => {
    const jwtToken = getCookie("factura-token");

    try {
      const response = await authGetFetch("users/agents", jwtToken);

      if (response.ok) {
        const agentsResponse = await response.json();
        setAgents(agentsResponse);
      } else {
        console.error("Error cargando la información de los agentes");
      }
    } catch (error) {
      console.error("Error enviando la solicitud:", error);
    }
  };

  const getAllUsers = async () => {
    const jwtToken = getCookie("factura-token");

    try {
      const response = await authGetFetch("users/all", jwtToken);

      if (response.ok) {
        const responseJson = await response.json();
        setAllUsers(responseJson);
      } else {
        console.error("Error cargando la información de los usuarios");
      }
    } catch (error) {
      console.error("Error enviando la solicitud:", error);
    }
  };

  const fetchAgentData = async (agentId) => {
    const jwtToken = getCookie("factura-token");

    try {
      const response = await authFetch(
        "POST",
        `users/all`,
        { agentId },
        jwtToken
      );

      if (response.ok) {
        const { users: usersArray, visibleUsersIds: arrayVisibleUsers } =
          await response.json();
        setAllUsers([]);
        setVisibleUsersId([]);

        setAllUsers(usersArray);
        setVisibleUsersId([...new Set(arrayVisibleUsers)]);
      } else {
        console.error("Error obteniendo datos del agente");
      }
    } catch (error) {
      console.error("Error en la solicitud:", error);
    }
  };

  const fetchUserShareLeadsData = async (userId) => {
    const jwtToken = getCookie("factura-token");

    try {
      const response = await authFetch(
        "POST",
        `users-share-leads/user-list`,
        { userId },
        jwtToken
      );

      if (response.ok) {
        const { visibleUsersShareLeadsIds: arrayVisibleUsers } =
          await response.json();
        setVisibleUserShareLeadUsersIds([]);

        setVisibleUserShareLeadUsersIds([...new Set(arrayVisibleUsers)]);
      } else {
        console.error("Error obteniendo datos del agente");
      }
    } catch (error) {
      console.error("Error en la solicitud:", error);
    }
  };

  useEffect(() => {
    getAgents();
    getAllUsers();
  }, []);

  useEffect(() => {
    if (selectedAgentId) {
      fetchAgentData(selectedAgentId);
    }
  }, [selectedAgentId]);

  useEffect(() => {
    if (selectedUserId) {
      fetchUserShareLeadsData(selectedUserId);
    }
  }, [selectedUserId]);

  const handleSaveVisibility = async () => {
    const jwtToken = getCookie("factura-token");
    const data = {
      agentId: selectedAgentId,
      visibleUserIds: visibleUsersId,
    };

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users-accessibility`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwtToken}`,
          },
          body: JSON.stringify(data),
        }
      );

      if (response.ok) {
        alert("Visibilidad actualizada correctamente");
      } else {
        console.error("Error al actualizar la visibilidad");
      }
    } catch (error) {
      console.error("Error en la solicitud:", error);
    }
  };

  const handleSaveUserShareLead = async () => {
    const jwtToken = getCookie("factura-token");
    const data = {
      userId: selectedUserId,
      visibleUserIds: visibleUserShareLeadUsersIds,
    };

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users-share-leads`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwtToken}`,
          },
          body: JSON.stringify(data),
        }
      );

      if (response.ok) {
        alert("Visibilidad leads actualizada correctamente");
      } else {
        console.error("Error al actualizar la visibilidad");
      }
    } catch (error) {
      console.error("Error en la solicitud:", error);
    }
  };

  return (
    <div className="flex flex-col bg-background min-h-screen">
      {/* Navbar */}
      <div className="w-auto ml-4">
        <div className="flex">
          <button
            className={`px-6 py-2 text-sm font-medium ${
              activeTab === "Tareas"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-slate-600 dark:text-slate-400"
            }`}
            onClick={() => setActiveTab("Tareas")}
          >
            Tareas
          </button>
          <button
            className={`px-6 py-2 text-sm font-medium ${
              activeTab === "Leads"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-slate-600 dark:text-slate-400"
            }`}
            onClick={() => setActiveTab("Leads")}
          >
            Leads
          </button>
        </div>
      </div>

      {/* Contenido dinámico */}
      <div className="flex-1 ">
        {activeTab === "Tareas" ? (
          <div className="flex flex-col md:flex-row justify-center items-start">
            {/* Sección Tareas */}
            <div className="w-full md:w-1/2 p-4">
              <div className="neumorphic-card text-slate-800 dark:text-slate-100 rounded-lg p-6">
                <h2 className="text-2xl font-bold mb-4">
                  Visibilidad de Agentes
                </h2>
                <p className="mb-4 text-slate-700 dark:text-slate-300">
                  En esta sección se pueden configurar los usuarios que estarán
                  disponibles para que los agentes asignen tareas.
                </p>
                <div className="mb-4 flex justify-between">
                  <div className="mb-4">
                    <label
                      className="block text-slate-800 dark:text-slate-100 mb-2"
                      htmlFor="assigneeUserId"
                    >
                      Dirigido a:
                    </label>
                    <select
                      id="assigneeUserId"
                      name="assigneeUserId"
                      className="w-full px-4 py-2 rounded bg-background text-slate-800 dark:text-slate-100 focus:outline-none"
                      value={selectedAgentId}
                      onChange={(e) => {
                        const agentId = e.target.value;
                        setSelectedAgentId(agentId);
                      }}
                      required
                    >
                      <option value="" disabled>
                        Selecciona un agente:
                      </option>
                      {agents.map((agent) => (
                        <option key={agent.id} value={agent.id}>
                          {agent.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Usuarios */}
            {selectedAgentId && (
              <div className="w-full md:w-1/2 p-4">
                <div className="neumorphic-card text-slate-800 dark:text-slate-100 rounded-lg p-6">
                  <h2 className="text-2xl font-bold mb-4">Usuarios</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 overflow-auto">
                    {allUsers.map((user) => (
                      <div key={user.id} className="flex items-center mb-2">
                        <input
                          type="checkbox"
                          id={`user-${user.id}`}
                          className="mr-2"
                          checked={visibleUsersId.includes(user.id)}
                          onChange={() => {
                            if (visibleUsersId.includes(user.id)) {
                              setVisibleUsersId(
                                visibleUsersId.filter((id) => id !== user.id)
                              );
                            } else {
                              setVisibleUsersId([...visibleUsersId, user.id]);
                            }
                          }}
                        />
                        <label
                          htmlFor={`user-${user.id}`}
                          className="text-slate-800 dark:text-slate-100"
                        >
                          {user.name}
                        </label>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={handleSaveVisibility}
                    className="mt-4 px-4 py-2 bg-secondary text-white rounded hover:bg-secondaryHover"
                  >
                    Guardar visibilidad
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col md:flex-row justify-center items-start">
            {/* Sección Tareas */}
            <div className="w-full md:w-1/2 p-4">
              <div className="neumorphic-card text-slate-800 dark:text-slate-100 rounded-lg p-6">
                <h2 className="text-2xl font-bold mb-4">
                  Compartir Leads
                </h2>
                <p className="mb-4 text-slate-700 dark:text-slate-300">
                  En esta sección se pueden configurar los usuarios a los que
                  les podrán enviar Leads en el Gestor.
                </p>
                <div className="mb-4 flex justify-between">
                  <div className="mb-4">
                    <label
                      className="block text-slate-800 dark:text-slate-100 mb-2"
                      htmlFor="assigneeUserId"
                    >
                      Dirigido a:
                    </label>
                    <select
                      id="assignToUserId"
                      name="assignToUserId"
                      className="w-full px-4 py-2 rounded bg-background text-slate-800 dark:text-slate-100 focus:outline-none"
                      value={selectedUserId}
                      onChange={(e) => {
                        const userId = e.target.value;
                        setSelectedUserId(userId);
                      }}
                      required
                    >
                      <option value="" disabled>
                        Selecciona un usuario:
                      </option>
                      {allUsers.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Usuarios */}
            {selectedUserId && (
              <div className="w-full md:w-1/2 p-4">
                <div className="neumorphic-card text-slate-800 dark:text-slate-100 rounded-lg p-6">
                  <h2 className="text-2xl font-bold mb-4">Usuarios</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 overflow-auto">
                    {allUsers.map((user) => (
                      <div
                        key={`user-share-${user.id}`}
                        className="flex items-center mb-2"
                      >
                        <input
                          type="checkbox"
                          id={`user-share-${user.id}`}
                          className="mr-2"
                          checked={visibleUserShareLeadUsersIds.includes(
                            user.id
                          )}
                          onChange={() => {
                            if (
                              visibleUserShareLeadUsersIds.includes(user.id)
                            ) {
                              setVisibleUserShareLeadUsersIds(
                                visibleUserShareLeadUsersIds.filter(
                                  (id) => id !== user.id
                                )
                              );
                            } else {
                              setVisibleUserShareLeadUsersIds([
                                ...visibleUserShareLeadUsersIds,
                                user.id,
                              ]);
                            }
                          }}
                        />
                        <label
                          htmlFor={`user-${user.id}`}
                          className="text-slate-800 dark:text-slate-100"
                        >
                          {user.name}
                        </label>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={handleSaveUserShareLead}
                    className="mt-4 px-4 py-2 bg-secondary text-white rounded hover:bg-secondaryHover"
                  >
                    Guardar visibilidad
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
