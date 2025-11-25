"use client";
import { format } from "date-fns";
import { useState, useEffect } from "react";
import { getCookie } from "cookies-next";
import { authGetFetch, authFetch } from "@/helpers/server-fetch.helper";
import EditAndCreateLeadSheet from "@/components/edit-and-create-leadSheet.modal";
import * as jose from "jose";
import CommunicationModal from "@/components/communication.modal";
import { useLayout } from '../layout';

export default function LeadDetailPage() {
  const [lead, setLead] = useState(null);
  const [leadCanBeLose, setLeadCanBeLose] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(false);

  const [error, setError] = useState("");
  const [showUsefulOptions, setShowUsefulOptions] = useState(false);
  const [showNotUsefulOptions, setShowNotUsefulOptions] = useState(false);

  const [observation, setObservation] = useState("");
  const [selectedOption, setSelectedOption] = useState(null);

  const [startDate, setStartDate] = useState("");
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);

  const [leadsHistory, setLeadsHistory] = useState([]);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [mode, setMode] = useState("create");
  const [editLeadSheet, setEditLeadSheet] = useState(null);

  const [communications, setCommunications] = useState([]);
  const [communicationsCurrentIndex, setCommunicationsCurrentIndex] = useState(0);
  const [isCommunicationModalOpen, setIsCommunicationModalOpen] = useState(false);

  const { sideBarHidden, setSideBarHidden } = useLayout();

  const leadStatesIds = {
    Venta: 1,
    AgendaPersonal: 2,
    MorningShift: 3,
    EveningShift: 4,
    AgendarUsuario: 5,
    NoContesta: 6,
    NoInteresa: 7,
    NoMejorar: 8,
    Erroneo: 9,
    Ilocalizable: 10,
    Repetido: 11,
  };

  const usefulOptions = [
    { id: leadStatesIds.Venta, label: "Venta", icon: "shopping_cart" },
    { id: leadStatesIds.AgendaPersonal, label: "Agenda personal", icon: "event" },
    { id: leadStatesIds.EveningShift, label: "Por la tarde", icon: "wb_twilight" },
    { id: leadStatesIds.MorningShift, label: "Por la mañana", icon: "wb_sunny" },
    { id: leadStatesIds.AgendarUsuario, label: "Agendar a comp", icon: "person_add" },
  ];

  const notUsefulOptions = [
    { id: leadStatesIds.NoContesta, label: "No contesta", icon: "phone_missed" },
    { id: leadStatesIds.NoInteresa, label: "No interesa", icon: "block" },
    { id: leadStatesIds.NoMejorar, label: "No se puede mejorar", icon: "close" },
    { id: leadStatesIds.Erroneo, label: "No existe/Bono Social", icon: "error_outline" },
  ];

  const fetchLeadData = async () => {
    setLoading(true);
    const jwtToken = getCookie("factura-token");
    const payload = jose.decodeJwt(jwtToken);

    setUserId(payload.userId);

    try {
      const response = await authGetFetch("users/lead", jwtToken);

      if (response.ok) {
        const leadData = await response.json();
        setLead(leadData);
        setLeadCanBeLose(
          leadData?.leadStateId != null &&
          leadData.leadStateId != leadStatesIds.NoContesta
        );
      } else {
        setLead(null);
      }
    } catch (error) {
      console.error("Error al enviar la solicitud:", error);
      setLead(null);
    } finally {
      setLoading(false);
    }
  };

  const getUsersToShareLead = async () => {
    const jwtToken = getCookie("factura-token");

    try {
      const response = await authFetch(
        "POST",
        `users-share-leads/user-list`,
        { userId },
        jwtToken
      );

      if (response.ok) {
        const { visibleUsersShareLeads: usersArray } = await response.json();
        setUsers(usersArray);
      } else {
        console.error("Error cargando la información de los usuarios");
      }
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

        const onlyCommunications = notificationsResponse.filter(
          (notification) => notification.eventType === 'communication'
        );

        setCommunications(onlyCommunications);

      } else {
        console.error("Error cargando las notificaciones");
      }
    } catch (error) {
      console.error("Error enviando la solicitud:", error);
    }
  }

  useEffect(() => {
    fetchLeadData();
    getLeadsHistory();
    getUnnotifiedNotifications();
  }, []);

  useEffect(() => {
    if (selectedOption === leadStatesIds.AgendarUsuario) {
      getUsersToShareLead();
    }
  }, [selectedOption]);

  const getLeadsHistory = async () => {
    const jwtToken = getCookie("factura-token");

    try {
      const response = await authGetFetch("leads/user/history", jwtToken);

      if (response.ok) {
        const leadsHistoryResponse = await response.json();
        setLeadsHistory(leadsHistoryResponse);
      } else {
        alert("Error cargando tu informacion");
      }
    } catch (error) {
      console.error("Error sending request:", error);
    }
  };

  useEffect(() => {
    if (communications.length > 0) {
      setIsCommunicationModalOpen(true);
      setSideBarHidden(true);
    }
  }, [communications]);

  const handleSubmit = async () => {
    if (!observation || !selectedOption) {
      setError(
        "Por favor, complete la observación y seleccione una opción antes de continuar."
      );
      return;
    }
    if (selectedOption === leadStatesIds.AgendaPersonal && !startDate) {
      setError("Por favor, seleccione las fecha de inicio para la agenda.");
      return;
    }

    if (leadCanBeLose) {
      const confirmDelete = confirm(
        "Volver a tipificar este lead podría hacer que se vuelva a mostrar en el grupo. ¿Estas de acuerdo?"
      );
      if (!confirmDelete) return;
    }

    const payload = {
      leadStateId: selectedOption,
      observations: observation,
      ...(selectedOption === leadStatesIds.AgendaPersonal && {
        personalAgendaData: {
          subject: observation,
          startDate,
        },
      }),
      ...(selectedOption === leadStatesIds.AgendarUsuario && {
        userToAssignId: selectedUserId,
      }),
    };

    const jwtToken = getCookie("factura-token");

    try {
      const response = await authFetch(
        "POST",
        "leads/type/",
        payload,
        jwtToken
      );

      if (response.ok) {
        alert("Informacion subida correctamente");
        window.location.reload();
      } else {
        const errorData = await response.json();
        console.error(errorData);

        if (
          response.status === 500 &&
          errorData.message === "No available lead to assign"
        ) {
          alert(
            "Información subida correctamente, por el momento no quedan mas leads sin asignar"
          );
          window.location.reload();
        } else {
          setError("Ocurrió un error al solicitar el nuevo lead.");
        }
      }
    } catch (error) {
      console.error("Error enviando la solicitud:", error);
    }
  };

  const handleAssignLeadToUser = async (leadId) => {
    const confirmAction = window.confirm(
      "Esta acción cambiará el lead que tienes asignado. ¿Deseas continuar?"
    );

    if (!confirmAction) {
      return;
    }

    const jwtToken = getCookie("factura-token");

    try {
      const response = await authFetch(
        "POST",
        "leads/assign-to-user",
        { leadId },
        jwtToken
      );

      if (response.ok) {
        const responseData = await response.json();

        if (responseData.assignedLead === null) {
          alert("Este lead ya está asignado a otro usuario.");
        } else {
          alert(`Lead asignado correctamente`);
          window.location.reload();
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

  const handleSearchNewLead = async () => {
    const payload = {};

    const jwtToken = getCookie("factura-token");

    try {
      const response = await authFetch(
        "POST",
        "leads/type/",
        payload,
        jwtToken
      );

      if (response.ok) {
        window.location.reload();
      } else {
        const errorData = await response.json();
        console.error(errorData);

        if (
          response.status === 500 &&
          errorData.message === "No available lead to assign"
        ) {
          alert("Por el momento no quedan mas leads sin asignar");
          window.location.reload();
        } else {
          setError("Ocurrió un error al solicitar el nuevo lead.");
        }
      }
    } catch (error) {
      console.error("Error enviando la solicitud:", error);
    }
  };

  function LeadHistory({ removeWidthClass = false }) {
    return (
      <div
        className={`w-full ${!removeWidthClass ? "md:w-3/6" : ""
          } neumorphic-card p-6 rounded-xl`}
      >
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center">
          <span className="material-icons-outlined text-primary mr-2">history</span>
          Historial de Llamadas
        </h2>
        <div className="overflow-x-auto neumorphic-card-inset rounded-lg">
          <table className="min-w-full">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Teléfono
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Observaciones
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Fuente
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Resultado
                </th>
              </tr>
            </thead>
            <tbody className="bg-background-light dark:bg-background-dark">
              {leadsHistory && leadsHistory.length > 0 ? (
                leadsHistory.map((leadHistory, index) => (
                  <tr key={index} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                      {
                        new Date(leadHistory.lead.createdAt)
                          .toISOString()
                          .split("T")[0]
                      }
                    </td>
                    <td className="text-center px-4 py-3 text-sm">
                      <button
                        onClick={() =>
                          handleAssignLeadToUser(leadHistory.lead.id)
                        }
                        className="text-primary hover:underline focus:outline-none font-medium transition-colors"
                      >
                        {leadHistory.lead.fullName}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                      {leadHistory.lead.phoneNumber}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                      {leadHistory.observations}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                      {leadHistory.lead?.campaign?.name || "Sin campaña"}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center">
                        <span
                          className="inline-block w-3 h-3 rounded-full mr-2"
                          style={{
                            backgroundColor: leadHistory.leadState.colorHex,
                          }}
                        ></span>
                        <span className="text-slate-700 dark:text-slate-300">{leadHistory.leadState.name}</span>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-8">
                    <span className="material-icons-outlined text-4xl text-slate-300 dark:text-slate-600 mb-2 block">inbox</span>
                    <span className="text-slate-500 dark:text-slate-400">No hay historial disponible</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <div className="neumorphic-card p-8 rounded-xl">
          <span className="material-icons-outlined text-primary text-5xl mb-4 block animate-spin">refresh</span>
          <p className="text-slate-600 dark:text-slate-400 text-lg font-medium">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen space-y-8 p-6">
        {/* Mensaje y botón arriba */}
        <div className="neumorphic-card p-12 rounded-xl text-center max-w-2xl">
          <span className="material-icons-outlined text-6xl text-slate-300 dark:text-slate-600 mb-4 block">search_off</span>
          <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-2">
            No tienes ningún lead asignado
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Solicita un nuevo lead para comenzar a trabajar
          </p>
          <button
            onClick={handleSearchNewLead}
            className="px-5 py-3 rounded-lg neumorphic-button text-white bg-primary hover:bg-primary/90 font-medium inline-flex items-center"
          >
            <span className="material-icons-outlined mr-2">add_circle</span>
            Solicitar Nuevo Lead
          </button>
        </div>

        {/* Lead History abajo */}
        <div className="w-full max-w-6xl">
          <LeadHistory removeWidthClass={true} />
        </div>
      </div>
    );
  }

  const handleEditOrCreateLeadSheet = () => {
    if (lead.leadSheet != null) {
      setEditLeadSheet(lead.leadSheet);
      setMode("edit");
    }
    setIsEditModalOpen(true);
  };

  const refreshLead = async () => {
    await fetchLeadData();
  };

  return (
    <div className="flex flex-col md:flex-row justify-center items-start p-6 gap-6">
      {/* Lead History */}
      <LeadHistory />

      {/* Lead Details */}
      <div className="w-full md:w-3/6 space-y-6">
        {/* Main Lead Card */}
        <div className="neumorphic-card p-6 rounded-xl space-y-6">
          {/* Lead Header */}
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                  {lead.fullName}
                </h1>
                <div className="flex items-center text-2xl font-semibold text-primary">
                  <span className="material-icons-outlined mr-2">phone</span>
                  {lead.phoneNumber}
                </div>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            <span className="neumorphic-card-inset px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center">
              <span className="material-icons-outlined text-sm mr-1 text-primary">campaign</span>
              {lead?.campaign?.name || "Sin campaña"}
            </span>
            {lead.campaign?.sector && (
              <span className="neumorphic-card-inset px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center">
                <span className="material-icons-outlined text-sm mr-1 text-purple-500">category</span>
                {lead.campaign.sector}
              </span>
            )}
            {lead.campaign?.source && (
              <span className="neumorphic-card-inset px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center">
                <span className="material-icons-outlined text-sm mr-1 text-blue-500">source</span>
                {lead.campaign.source}
              </span>
            )}
            <span className="neumorphic-card-inset px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center">
              <span className="material-icons-outlined text-sm mr-1 text-green-500">description</span>
              Factura: {lead.billUri ? "Sí" : "No"}
            </span>
            <span className="neumorphic-card-inset px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center">
              <span className="material-icons-outlined text-sm mr-1 text-orange-500">schedule</span>
              {format(
                new Date(lead.createdAt).toISOString().split("T")[0],
                "dd-MM-yyyy"
              )}{" "}
              {new Date(lead.createdAt).toISOString().split("T")[1].slice(0, 8)}
            </span>
          </div>

          {/* Observations Input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Observaciones <span className="text-red-500">*</span>
            </label>
            <textarea
              placeholder="Escribe tus observaciones sobre el contacto..."
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              className="w-full px-4 py-3 h-24 neumorphic-card-inset bg-transparent text-slate-800 dark:text-slate-200 rounded-lg border-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 placeholder:text-slate-400 resize-none"
            />
            {error && (
              <div className="flex items-center text-red-500 text-sm mt-2">
                <span className="material-icons-outlined text-sm mr-1">error</span>
                {error}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              className={`px-5 py-3 rounded-lg neumorphic-button font-medium transition-all flex items-center ${
                showUsefulOptions
                  ? "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 active"
                  : "text-green-600 dark:text-green-500"
              }`}
              onClick={() => {
                setShowUsefulOptions((prev) => !prev);
                setShowNotUsefulOptions(false);
              }}
            >
              <span className="material-icons-outlined mr-2">check_circle</span>
              Útil
              <span className={`material-icons-outlined ml-2 transition-transform ${showUsefulOptions ? "rotate-180" : ""}`}>
                expand_more
              </span>
            </button>

            <button
              className={`px-5 py-3 rounded-lg neumorphic-button font-medium transition-all flex items-center ${
                showNotUsefulOptions
                  ? "bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 active"
                  : "text-red-600 dark:text-red-500"
              }`}
              onClick={() => {
                setShowNotUsefulOptions((prev) => !prev);
                setShowUsefulOptions(false);
              }}
            >
              <span className="material-icons-outlined mr-2">cancel</span>
              No Útil
              <span className={`material-icons-outlined ml-2 transition-transform ${showNotUsefulOptions ? "rotate-180" : ""}`}>
                expand_more
              </span>
            </button>

            <button
              onClick={handleSubmit}
              className={`px-5 py-3 rounded-lg neumorphic-button text-white bg-primary hover:bg-primary/90 font-medium flex items-center ${
                !observation || !selectedOption
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
              disabled={!observation || !selectedOption}
            >
              <span className="material-icons-outlined mr-2">save</span>
              Codificar
            </button>

            <button
              onClick={handleEditOrCreateLeadSheet}
              className="px-5 py-3 rounded-lg neumorphic-button text-slate-700 dark:text-slate-300 font-medium flex items-center flex-1 sm:flex-initial"
            >
              <span className="material-icons-outlined mr-2">assignment</span>
              Ficha de cliente
            </button>
          </div>

          {/* Options for Useful */}
          {showUsefulOptions && (
            <div className="space-y-2 neumorphic-card-inset p-4 rounded-lg">
              {usefulOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => {
                    setSelectedOption(option.id);
                  }}
                  className={`w-full px-4 py-3 rounded-lg text-left font-medium transition-all flex items-center ${
                    selectedOption === option.id
                      ? "bg-primary text-white shadow-neumorphic-inset-light dark:shadow-neumorphic-inset-dark"
                      : "bg-background-light dark:bg-background-dark text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <span className="material-icons-outlined mr-3">{option.icon}</span>
                  {option.label}
                  {selectedOption === option.id && (
                    <span className="material-icons-outlined ml-auto">check</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Options for Not Useful */}
          {showNotUsefulOptions && (
            <div className="space-y-2 neumorphic-card-inset p-4 rounded-lg">
              {notUsefulOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => {
                    setSelectedOption(option.id);
                  }}
                  className={`w-full px-4 py-3 rounded-lg text-left font-medium transition-all flex items-center ${
                    selectedOption === option.id
                      ? "bg-red-500 text-white shadow-neumorphic-inset-light dark:shadow-neumorphic-inset-dark"
                      : "bg-background-light dark:bg-background-dark text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <span className="material-icons-outlined mr-3">{option.icon}</span>
                  {option.label}
                  {selectedOption === option.id && (
                    <span className="material-icons-outlined ml-auto">check</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Agenda Personal Section */}
          {selectedOption === leadStatesIds.AgendaPersonal && (
            <div className="neumorphic-card-inset p-4 rounded-lg space-y-3">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center">
                <span className="material-icons-outlined text-sm mr-2 text-primary">event</span>
                Fecha y hora de inicio de la llamada
              </label>
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-3 neumorphic-card-inset bg-transparent text-slate-800 dark:text-slate-200 rounded-lg border-none focus:ring-2 focus:ring-primary focus:ring-opacity-50"
              />
            </div>
          )}

          {/* Agendar Usuario Section */}
          {selectedOption === leadStatesIds.AgendarUsuario && (
            <div className="neumorphic-card-inset p-4 rounded-lg space-y-3">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center">
                <span className="material-icons-outlined text-sm mr-2 text-primary">person</span>
                Selecciona un usuario
              </label>
              <select
                value={selectedUserId || ""}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full px-4 py-3 neumorphic-card-inset bg-transparent text-slate-800 dark:text-slate-200 rounded-lg border-none focus:ring-2 focus:ring-primary focus:ring-opacity-50"
              >
                <option value="">Seleccionar usuario</option>
                {users.map((user) => (
                  <option
                    key={user.visibleShareLeadUser.id}
                    value={user.visibleShareLeadUser.id}
                  >
                    {user.visibleShareLeadUser.name}{" "}
                    {user.visibleShareLeadUser.firstSurname}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Lead History Card */}
        <div className="neumorphic-card p-6 rounded-xl space-y-6">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center">
            <span className="material-icons-outlined text-primary mr-2">timeline</span>
            Historial del Lead
          </h2>

          <div className="overflow-x-auto neumorphic-card-inset rounded-lg">
            <table className="min-w-full">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Agente
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Observación
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Resultado
                  </th>
                </tr>
              </thead>
              <tbody className="bg-background-light dark:bg-background-dark">
                {lead.leadLogs && lead.leadLogs.length > 0 ? (
                  lead.leadLogs.map((log) => (
                    <tr key={log.id} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                        {new Date(log.createdAt).toISOString().split("T")[0]}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300 font-medium">
                        {log.user.username}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                        {log.observations}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center">
                          <span
                            className="inline-block w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: log.leadState.colorHex }}
                          ></span>
                          <span className="text-slate-700 dark:text-slate-300">{log.leadState.name}</span>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center py-8">
                      <span className="material-icons-outlined text-4xl text-slate-300 dark:text-slate-600 mb-2 block">inbox</span>
                      <span className="text-slate-500 dark:text-slate-400">No hay historial disponible</span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Attachments Button */}
          <div className="flex justify-center pt-4">
            {lead.billUri ? (
              <a
                href={lead.billUri}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-3 rounded-lg neumorphic-button text-white bg-primary hover:bg-primary/90 font-medium inline-flex items-center"
              >
                <span className="material-icons-outlined mr-2">attach_file</span>
                Ver Adjuntos
              </a>
            ) : (
              <div className="neumorphic-card-inset px-6 py-3 rounded-lg">
                <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center">
                  <span className="material-icons-outlined mr-2">block</span>
                  No hay adjuntos disponibles
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {isEditModalOpen && (
        <div
          className={`fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 ${isEditModalOpen ? "lg:ml-72" : ""
            }`}
        >
          <EditAndCreateLeadSheet
            isModalOpen={isEditModalOpen}
            setIsModalOpen={setIsEditModalOpen}
            initialData={{
              ...editLeadSheet,
              leadId: lead.id,
            }}
            mode={mode}
            onRefreshLead={refreshLead}
          />
        </div>
      )}

      {isCommunicationModalOpen && communications[communicationsCurrentIndex] && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
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
    </div>
  );
}
