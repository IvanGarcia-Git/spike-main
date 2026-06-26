"use client";
import { format } from "date-fns";
import { useState, useEffect } from "react";
import { getCookie } from "cookies-next";
import { authGetFetch, authFetch } from "@/helpers/server-fetch.helper";
import EditAndCreateLeadSheet from "@/components/edit-and-create-leadSheet.modal";
import * as jose from "jose";
import CommunicationModal from "@/components/communication.modal";
import LeadTipificationModal from "@/components/lead-tipification.modal";
import { useLayout } from '../layout';

// Etiquetas y colores del ciclo de vida del lead (nuevo sistema PRES-018 B2b).
const LEAD_STATUS_META = {
  activo: { label: "Activo", badge: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  callback: { label: "Callback", badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  muerto: { label: "Muerto", badge: "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300" },
};

// Formatea una fecha de forma segura. date-fns `format(new Date(x))` LANZA
// "Invalid time value" si la fecha es null/indefinida o no parseable, lo que
// rompía la página entera (Application error: client-side exception) en cuanto
// un lead/log/historial traía una fecha vacía o un dato sin `lead`. Devuelve "—".
const safeDate = (value, fmt) => {
  if (!value) return "—";
  const d = new Date(value);
  return isNaN(d.getTime()) ? "—" : format(d, fmt);
};

// El backend migró su manejo de errores: ahora responde
// `{ success:false, error:{ message, code, statusCode, details } }` con mensajes en
// ESPAÑOL y statuses 404 (NotFoundError "no hay leads") / 422 (BusinessRuleError
// "sin grupo"/"sin campañas"). El frontend asumía el formato viejo (status 500 +
// `errorData.message` en inglés) y SIEMPRE caía al error genérico ⇒ el botón
// "Solicitar Lead" parecía no funcionar. Este helper lee ambos formatos.
const readLeadTypeError = async (response) => {
  let data = {};
  try {
    data = await response.json();
  } catch {
    data = {};
  }
  const err = data?.error || {};
  const message = err.message || data?.message || "";
  const noLeads =
    /no available lead to assign/i.test(message) || // formato legacy (inglés)
    /no hay leads disponibles/i.test(message) || // BusinessRuleError ES
    /disponible para asignar/i.test(message) || // NotFoundError ES ("Lead disponible para asignar no encontrado")
    err?.details?.rule === "NO_AVAILABLE_LEAD";
  return { message, noLeads };
};

export default function LeadDetailPage() {
  const [lead, setLead] = useState(null);
  const [leadCanBeLose, setLeadCanBeLose] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(false);
  const [requestingLead, setRequestingLead] = useState(false);
  const [queueStats, setQueueStats] = useState(null);
  const [showTipifyModal, setShowTipifyModal] = useState(false);

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

  const getQueueStats = async () => {
    const jwtToken = getCookie("factura-token");
    try {
      const response = await authGetFetch("leads/queue-stats", jwtToken);
      if (response.ok) {
        setQueueStats(await response.json());
      }
    } catch (error) {
      console.error("Error cargando estadísticas de cola:", error);
    }
  };

  useEffect(() => {
    fetchLeadData();
    getLeadsHistory();
    getUnnotifiedNotifications();
    getQueueStats();
  }, []);

  // Refresco periódico de la cola: si se crea un lead nuevo en una campaña, el
  // contador del gestor lo refleja sin necesidad de recargar la página a mano.
  useEffect(() => {
    const intervalId = setInterval(() => {
      getQueueStats();
    }, 30000);
    return () => clearInterval(intervalId);
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
        const { message, noLeads } = await readLeadTypeError(response);

        if (noLeads) {
          alert(
            "Información subida correctamente, por el momento no quedan mas leads sin asignar"
          );
          window.location.reload();
        } else if (message) {
          // El backend ya devuelve el motivo en español (sin grupo / sin campañas).
          setError(message);
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
    if (requestingLead) return; // evita dobles clics mientras se asigna

    const jwtToken = getCookie("factura-token");

    setRequestingLead(true);
    try {
      // Nuevo motor de ciclo de vida: prioridad cola > callbacks > nuevos > reintentos,
      // con rotación entre agentes. Sustituye al antiguo "leads/type" sin leadStateId.
      const response = await authFetch("POST", "leads/request-next", {}, jwtToken);

      if (response.ok) {
        // Éxito: se recarga para mostrar el lead. Mantenemos el spinner activo
        // (no reseteamos requestingLead) hasta que la navegación toma el control.
        window.location.reload();
        return;
      }

      let message = "";
      const noLeads = response.status === 404;
      try {
        const d = await response.json();
        message = d?.error?.message || d?.message || "";
      } catch {}

      if (noLeads) {
        alert("Por el momento no quedan más leads disponibles");
      } else if (message) {
        // Motivo real ya en español desde el backend (p.ej. "El usuario no
        // pertenece a ningún grupo." / "No hay campañas disponibles...").
        alert(message);
      } else {
        alert("Ocurrió un error al solicitar el nuevo lead.");
      }
      setRequestingLead(false);
    } catch (error) {
      console.error("Error enviando la solicitud:", error);
      alert("Ocurrió un error al solicitar el nuevo lead.");
      setRequestingLead(false);
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
        <QueueStatsBar stats={queueStats} />
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
            disabled={requestingLead}
            className="neumorphic-button bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors inline-flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <span className={`material-icons-outlined ${requestingLead ? "animate-spin" : ""}`}>
              {requestingLead ? "sync" : "add"}
            </span>
            {requestingLead ? "Solicitando lead..." : "Solicitar Lead"}
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

  // Historial DEL LEAD actual (no del agente): cada llamada/gestión con qué pasó, quién y cuándo.
  // Combina las tipificaciones del nuevo ciclo de vida con los logs antiguos de estado, orden desc.
  const userLabel = (u) =>
    u ? [u.name, u.firstSurname].filter(Boolean).join(" ").trim() || u.username || "—" : "—";
  const leadCallHistory = [
    ...(lead.tipificationHistory || []).map((h) => ({
      key: `t-${h.id}`,
      date: h.createdAt,
      who: userLabel(h.user),
      what: h.tipification?.name || "Tipificación",
      observation: h.observation,
      attempt: h.attemptCountAtTipification != null ? h.attemptCountAtTipification + 1 : null,
      color: "#10b981",
    })),
    ...(lead.leadLogs || []).map((l) => ({
      key: `l-${l.id}`,
      date: l.createdAt,
      who: userLabel(l.user),
      what: l.leadState?.name || "Cambio de estado",
      observation: l.observations,
      attempt: null,
      color: l.leadState?.colorHex || "#94a3b8",
    })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

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
          <button
            onClick={() => setShowTipifyModal(true)}
            className="neumorphic-button px-4 py-2 rounded-lg text-primary font-medium flex items-center gap-2"
          >
            <span className="material-icons-outlined text-sm">fact_check</span>
            Tipificar
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
                    {safeDate(lead.createdAt, "dd/MM")}
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
                {/* Ciclo de vida del lead (PRES-018 B2b) */}
                <div className="neumorphic-card-inset px-4 py-3 rounded-lg text-center min-w-[80px]">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Estado</p>
                  <span
                    className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-xs font-semibold ${
                      (LEAD_STATUS_META[lead.status] || {}).badge ||
                      "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {(LEAD_STATUS_META[lead.status] || {}).label || lead.status || "—"}
                  </span>
                </div>
                <div className="neumorphic-card-inset px-4 py-3 rounded-lg text-center min-w-[80px]">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Intentos</p>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    {lead.attemptCount ?? 0}/6
                  </p>
                </div>
                <div className="neumorphic-card-inset px-4 py-3 rounded-lg text-center min-w-[80px]">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Próx. llamada</p>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    {safeDate(lead.nextCallDate, "dd/MM HH:mm")}
                  </p>
                </div>
                <div className="neumorphic-card-inset px-4 py-3 rounded-lg text-center min-w-[80px]">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Últ. tipif.</p>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate max-w-[100px]">
                    {lead.lastTipification?.name || "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tipificación (sistema de ciclo de vida — sustituye al antiguo "Codificar") */}
          <div className="neumorphic-card p-6 space-y-4">
            <div className="flex items-start gap-3">
              <span className="material-icons-outlined text-primary">fact_check</span>
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Tipificar lead</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Registra el resultado de la llamada. El sistema programa el reintento, el callback o
                  cierra el lead automáticamente, y lo rota al siguiente agente cuando corresponde. En
                  el 6º intento pedirá un WhatsApp obligatorio y te asignará el lead de forma permanente.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowTipifyModal(true)}
              className="neumorphic-button bg-primary text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 hover:bg-primary/90"
            >
              <span className="material-icons-outlined text-sm">fact_check</span>
              Tipificar lead
            </button>
          </div>

        </div>

        {/* Right Column - Historial del lead actual */}
        <div className="xl:col-span-1">
          <div className="neumorphic-card p-6 sticky top-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1 flex items-center gap-2">
              <span className="material-icons-outlined text-primary">history</span>
              Historial del lead
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              {leadCallHistory.length} gestión{leadCallHistory.length === 1 ? "" : "es"} registrada{leadCallHistory.length === 1 ? "" : "s"}
            </p>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {leadCallHistory.length > 0 ? (
                leadCallHistory.map((item) => (
                  <div key={item.key} className="p-3 neumorphic-card-inset rounded-lg">
                    <div className="flex items-start gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {item.what}
                          </span>
                          {item.attempt != null && (
                            <span className="text-[10px] font-bold text-primary bg-primary/10 rounded-full px-2 py-0.5 flex-shrink-0">
                              Intento {item.attempt}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                          <span className="material-icons-outlined text-[13px]">person</span>
                          <span className="truncate">{item.who}</span>
                          <span className="text-slate-400">•</span>
                          <span className="flex-shrink-0">{safeDate(item.date, "dd/MM/yyyy HH:mm")}</span>
                        </div>
                        {item.observation && (
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 whitespace-pre-wrap break-words">
                            {item.observation}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <span className="material-icons-outlined text-3xl text-slate-300 dark:text-slate-600 mb-2 block">inbox</span>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Aún no hay gestiones de este lead</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showTipifyModal && (
        <LeadTipificationModal
          lead={lead}
          onClose={() => setShowTipifyModal(false)}
          onTipified={() => {
            setShowTipifyModal(false);
            window.location.reload();
          }}
        />
      )}

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

// Barra de contadores de cola (PRES-018 B2b): leads disponibles + callbacks de hoy.
function QueueStatsBar({ stats }) {
  if (!stats) return null;
  return (
    <div className="grid grid-cols-2 gap-4 max-w-xl mx-auto">
      <div className="neumorphic-card-inset px-4 py-3 rounded-lg flex items-center gap-3">
        <span className="material-icons-outlined text-primary">groups</span>
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Leads en cola</p>
          <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{stats.availableInQueue ?? 0}</p>
        </div>
      </div>
      <div className="neumorphic-card-inset px-4 py-3 rounded-lg flex items-center gap-3">
        <span className="material-icons-outlined text-amber-500">event_repeat</span>
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Callbacks hoy</p>
          <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{stats.callbacksToday ?? 0}</p>
        </div>
      </div>
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
                {safeDate(item.lead?.createdAt, "dd/MM/yyyy")}
              </td>
              <td className="p-3">
                <button
                  onClick={() => onAssign(item.lead?.id)}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  {item.lead?.fullName}
                </button>
              </td>
              <td className="p-3 text-sm text-slate-600 dark:text-slate-400">
                {item.lead?.phoneNumber}
              </td>
              <td className="p-3 text-sm text-slate-600 dark:text-slate-400 max-w-[200px] truncate">
                {item.observations}
              </td>
              <td className="p-3">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: item.leadState?.colorHex }}
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">{item.leadState?.name}</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
