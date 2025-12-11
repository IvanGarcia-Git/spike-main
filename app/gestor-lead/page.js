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
    { id: leadStatesIds.Venta, label: "Venta", icon: "shopping_cart", color: "green" },
    { id: leadStatesIds.AgendaPersonal, label: "Agenda personal", icon: "event", color: "blue" },
    { id: leadStatesIds.EveningShift, label: "Por la tarde", icon: "wb_twilight", color: "orange" },
    { id: leadStatesIds.MorningShift, label: "Por la mañana", icon: "wb_sunny", color: "yellow" },
    { id: leadStatesIds.AgendarUsuario, label: "Agendar a comp", icon: "person_add", color: "purple" },
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

        if (response.status === 500) {
          if (errorData.message === "No available lead to assign") {
            alert("Por el momento no quedan más leads sin asignar");
          } else if (errorData.message === "No campaigns available for the user's groups") {
            alert("Tu grupo no tiene campañas asignadas. Contacta con un administrador para configurar las campañas.");
          } else if (errorData.message === "User does not belong to any group") {
            alert("No perteneces a ningún grupo. Contacta con un administrador.");
          } else {
            setError("Ocurrió un error al solicitar el nuevo lead.");
          }
        } else {
          setError("Ocurrió un error al solicitar el nuevo lead.");
        }
      }
    } catch (error) {
      console.error("Error enviando la solicitud:", error);
    }
  };

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

  // Loading State
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="neumorphic-card p-8 text-center">
          <div className="w-16 h-16 rounded-full neumorphic-card-inset flex items-center justify-center mx-auto mb-4">
            <span className="material-icons-outlined text-3xl text-primary animate-spin">sync</span>
          </div>
          <p className="text-slate-600 dark:text-slate-400 font-medium">Cargando lead...</p>
        </div>
      </div>
    );
  }

  // No Lead State
  if (!lead) {
    return (
      <div className="p-6 space-y-6">
        {/* Empty State Card */}
        <div className="neumorphic-card p-12 text-center max-w-xl mx-auto">
          <div className="w-20 h-20 rounded-full neumorphic-card-inset flex items-center justify-center mx-auto mb-6">
            <span className="material-icons-outlined text-4xl text-slate-400">person_search</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
            Sin lead asignado
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            Solicita un nuevo lead para comenzar a trabajar
          </p>
          <button
            onClick={handleSearchNewLead}
            className="neumorphic-button bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors inline-flex items-center gap-2"
          >
            <span className="material-icons-outlined">add</span>
            Solicitar Lead
          </button>
        </div>

        {/* History Table */}
        <div className="neumorphic-card p-6">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
            <span className="material-icons-outlined text-primary">history</span>
            Mi Historial
          </h3>
          <HistoryTable leadsHistory={leadsHistory} onAssign={handleAssignLeadToUser} />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Gestor de Leads</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Gestiona y codifica tus leads</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleEditOrCreateLeadSheet}
            className="neumorphic-button px-4 py-2 rounded-lg text-slate-600 dark:text-slate-400 font-medium flex items-center gap-2"
          >
            <span className="material-icons-outlined text-sm">assignment</span>
            Ficha
          </button>
          {lead.billUri && (
            <a
              href={lead.billUri}
              target="_blank"
              rel="noopener noreferrer"
              className="neumorphic-button px-4 py-2 rounded-lg text-primary font-medium flex items-center gap-2"
            >
              <span className="material-icons-outlined text-sm">attach_file</span>
              Adjunto
            </a>
          )}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column - Lead Info & Actions */}
        <div className="xl:col-span-2 space-y-6">
          {/* Lead Card */}
          <div className="neumorphic-card p-6">
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              {/* Lead Avatar & Basic Info */}
              <div className="flex items-start gap-4 flex-1">
                <div className="w-16 h-16 rounded-full neumorphic-card-inset flex items-center justify-center flex-shrink-0">
                  <span className="material-icons-outlined text-3xl text-primary">person</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 truncate">
                    {lead.fullName}
                  </h2>
                  <a href={`tel:${lead.phoneNumber}`} className="text-lg font-semibold text-primary flex items-center gap-1 hover:underline">
                    <span className="material-icons-outlined text-sm">phone</span>
                    {lead.phoneNumber}
                  </a>
                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      {lead?.campaign?.name || "Sin campaña"}
                    </span>
                    {lead.campaign?.sector && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                        {lead.campaign.sector}
                      </span>
                    )}
                    {lead.campaign?.source && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                        {lead.campaign.source}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="flex gap-4 flex-wrap">
                <div className="neumorphic-card-inset px-4 py-3 rounded-lg text-center min-w-[80px]">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Fecha</p>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    {format(new Date(lead.createdAt), "dd/MM")}
                  </p>
                </div>
                <div className="neumorphic-card-inset px-4 py-3 rounded-lg text-center min-w-[80px]">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Factura</p>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    {lead.billUri ? "Sí" : "No"}
                  </p>
                </div>
                <div className="neumorphic-card-inset px-4 py-3 rounded-lg text-center min-w-[80px]">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Logs</p>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    {lead.leadLogs?.length || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions Card */}
          <div className="neumorphic-card p-6 space-y-4">
            {/* Observation Input */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Observaciones
              </label>
              <textarea
                placeholder="Escribe tus observaciones..."
                value={observation}
                onChange={(e) => setObservation(e.target.value)}
                className="w-full neumorphic-card-inset px-4 py-3 rounded-lg bg-transparent text-slate-800 dark:text-slate-200 border-none focus:outline-none resize-none h-20"
              />
            </div>

            {/* Action Buttons Row */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => {
                  setShowUsefulOptions(!showUsefulOptions);
                  setShowNotUsefulOptions(false);
                }}
                className={`neumorphic-button px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-all ${
                  showUsefulOptions ? "active bg-green-50 dark:bg-green-900/20 text-green-600" : "text-green-600"
                }`}
              >
                <span className="material-icons-outlined text-sm">thumb_up</span>
                Útil
                <span className={`material-icons-outlined text-sm transition-transform ${showUsefulOptions ? "rotate-180" : ""}`}>expand_more</span>
              </button>

              <button
                onClick={() => {
                  setShowNotUsefulOptions(!showNotUsefulOptions);
                  setShowUsefulOptions(false);
                }}
                className={`neumorphic-button px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-all ${
                  showNotUsefulOptions ? "active bg-red-50 dark:bg-red-900/20 text-red-600" : "text-red-600"
                }`}
              >
                <span className="material-icons-outlined text-sm">thumb_down</span>
                No Útil
                <span className={`material-icons-outlined text-sm transition-transform ${showNotUsefulOptions ? "rotate-180" : ""}`}>expand_more</span>
              </button>

              <button
                onClick={handleSubmit}
                disabled={!observation || !selectedOption}
                className={`neumorphic-button bg-primary text-white px-6 py-2.5 rounded-lg font-semibold flex items-center gap-2 ml-auto ${
                  !observation || !selectedOption ? "opacity-50 cursor-not-allowed" : "hover:bg-primary/90"
                }`}
              >
                <span className="material-icons-outlined text-sm">send</span>
                Codificar
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
                <span className="material-icons-outlined text-sm">error</span>
                {error}
              </div>
            )}

            {/* Options Grid */}
            {showUsefulOptions && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                {usefulOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setSelectedOption(option.id)}
                    className={`p-3 rounded-lg text-center transition-all ${
                      selectedOption === option.id
                        ? "neumorphic-card-inset bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                        : "neumorphic-button text-slate-600 dark:text-slate-400 hover:text-green-600"
                    }`}
                  >
                    <span className="material-icons-outlined text-xl block mb-1">{option.icon}</span>
                    <span className="text-xs font-medium">{option.label}</span>
                  </button>
                ))}
              </div>
            )}

            {showNotUsefulOptions && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {notUsefulOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setSelectedOption(option.id)}
                    className={`p-3 rounded-lg text-center transition-all ${
                      selectedOption === option.id
                        ? "neumorphic-card-inset bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                        : "neumorphic-button text-slate-600 dark:text-slate-400 hover:text-red-600"
                    }`}
                  >
                    <span className="material-icons-outlined text-xl block mb-1">{option.icon}</span>
                    <span className="text-xs font-medium">{option.label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Conditional Fields */}
            {selectedOption === leadStatesIds.AgendaPersonal && (
              <div className="neumorphic-card-inset p-4 rounded-lg">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Fecha y hora de la llamada
                </label>
                <input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-transparent text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-primary"
                />
              </div>
            )}

            {selectedOption === leadStatesIds.AgendarUsuario && (
              <div className="neumorphic-card-inset p-4 rounded-lg">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Seleccionar compañero
                </label>
                <select
                  value={selectedUserId || ""}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-transparent text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-primary"
                >
                  <option value="">Seleccionar...</option>
                  {users.map((user) => (
                    <option key={user.visibleShareLeadUser.id} value={user.visibleShareLeadUser.id}>
                      {user.visibleShareLeadUser.name} {user.visibleShareLeadUser.firstSurname}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Lead Logs */}
          {lead.leadLogs && lead.leadLogs.length > 0 && (
            <div className="neumorphic-card p-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                <span className="material-icons-outlined text-primary">timeline</span>
                Historial del Lead
              </h3>
              <div className="space-y-3">
                {lead.leadLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 p-3 neumorphic-card-inset rounded-lg">
                    <div
                      className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0"
                      style={{ backgroundColor: log.leadState.colorHex }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                          {log.user.username}
                        </span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {format(new Date(log.createdAt), "dd/MM/yyyy")}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{log.observations}</p>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{log.leadState.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - History */}
        <div className="xl:col-span-1">
          <div className="neumorphic-card p-6 sticky top-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
              <span className="material-icons-outlined text-primary">history</span>
              Mi Historial
            </h3>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {leadsHistory && leadsHistory.length > 0 ? (
                leadsHistory.map((item, index) => (
                  <div
                    key={index}
                    className="p-3 neumorphic-card-inset rounded-lg hover:scale-[1.01] transition-transform cursor-pointer"
                    onClick={() => handleAssignLeadToUser(item.lead.id)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm text-slate-800 dark:text-slate-200 truncate">
                        {item.lead.fullName}
                      </span>
                      <span className="text-xs text-slate-400">
                        {format(new Date(item.lead.createdAt), "dd/MM")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {item.lead.phoneNumber}
                      </span>
                      <div className="flex items-center gap-1">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: item.leadState.colorHex }}
                        />
                        <span className="text-xs text-slate-500">{item.leadState.name}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <span className="material-icons-outlined text-3xl text-slate-300 dark:text-slate-600 mb-2 block">inbox</span>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Sin historial</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
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

// History Table Component
function HistoryTable({ leadsHistory, onAssign }) {
  if (!leadsHistory || leadsHistory.length === 0) {
    return (
      <div className="text-center py-12">
        <span className="material-icons-outlined text-4xl text-slate-300 dark:text-slate-600 mb-2 block">inbox</span>
        <p className="text-slate-500 dark:text-slate-400">No hay historial disponible</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto neumorphic-card-inset rounded-lg">
      <table className="min-w-full">
        <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          <tr>
            <th className="p-3 text-left">Fecha</th>
            <th className="p-3 text-left">Nombre</th>
            <th className="p-3 text-left">Teléfono</th>
            <th className="p-3 text-left">Observaciones</th>
            <th className="p-3 text-left">Resultado</th>
          </tr>
        </thead>
        <tbody>
          {leadsHistory.map((item, index) => (
            <tr key={index} className="table-row-divider hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <td className="p-3 text-sm text-slate-600 dark:text-slate-400">
                {format(new Date(item.lead.createdAt), "dd/MM/yyyy")}
              </td>
              <td className="p-3">
                <button
                  onClick={() => onAssign(item.lead.id)}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  {item.lead.fullName}
                </button>
              </td>
              <td className="p-3 text-sm text-slate-600 dark:text-slate-400">
                {item.lead.phoneNumber}
              </td>
              <td className="p-3 text-sm text-slate-600 dark:text-slate-400 max-w-[200px] truncate">
                {item.observations}
              </td>
              <td className="p-3">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: item.leadState.colorHex }}
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">{item.leadState.name}</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
