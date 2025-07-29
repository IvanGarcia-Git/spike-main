"use client";
import { format } from "date-fns";
import { useState, useEffect } from "react";
import { getCookie } from "cookies-next";
import { authGetFetch, authFetch } from "@/helpers/server-fetch.helper";
import { FiChevronDown, FiSearch } from "react-icons/fi";
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
    { id: leadStatesIds.Venta, label: "Venta" },
    { id: leadStatesIds.AgendaPersonal, label: "Agenda personal" },
    { id: leadStatesIds.EveningShift, label: "Por la tarde" },
    { id: leadStatesIds.MorningShift, label: "Por la mañana" },
    { id: leadStatesIds.AgendarUsuario, label: "Agendar a comp" },
  ];

  const notUsefulOptions = [
    { id: leadStatesIds.NoContesta, label: "No contesta" },
    { id: leadStatesIds.NoInteresa, label: "No interesa" },
    { id: leadStatesIds.NoMejorar, label: "No se puede mejorar" },
    { id: leadStatesIds.Erroneo, label: "No existe/Bono Social" },
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
          } bg-foreground rounded-lg shadow-lg p-4`}
      >
        <h2 className="text-xl font-bold text-black mb-4">
          Historial de Llamadas
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-backgroundHover text-black rounded-lg shadow">
            <thead>
              <tr className="bg-blue-200 text-gray-700">
                <th className="px-4 py-2 text-left text-sm font-semibold">
                  Fecha
                </th>
                <th className="px-4 py-2 text-center text-sm font-semibold">
                  Nombre
                </th>
                <th className="px-4 py-2 text-left text-sm font-semibold">
                  Teléfono
                </th>
                <th className="px-4 py-2 text-left text-sm font-semibold">
                  Observaciones
                </th>
                <th className="px-4 py-2 text-left text-sm font-semibold">
                  Fuente
                </th>
                <th className="px-4 py-2 text-left text-sm font-semibold">
                  Resultado
                </th>
              </tr>
            </thead>
            <tbody>
              {leadsHistory && leadsHistory.length > 0 ? (
                leadsHistory.map((leadHistory, index) => (
                  <tr key={index} className="bg-gray-100 even:bg-gray-200">
                    <td className="px-4 py-2 text-sm">
                      {
                        new Date(leadHistory.lead.createdAt)
                          .toISOString()
                          .split("T")[0]
                      }
                    </td>
                    <td className="text-center px-4 py-2 text-sm">
                      <button
                        onClick={() =>
                          handleAssignLeadToUser(leadHistory.lead.id)
                        }
                        className="text-blue-600 hover:underline focus:outline-none"
                      >
                        {leadHistory.lead.fullName}
                      </button>
                    </td>
                    <td className="px-4 py-2 text-sm">
                      {leadHistory.lead.phoneNumber}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      {leadHistory.observations}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      {leadHistory.lead?.campaign?.name || "Sin campaña"}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      <span
                        className="inline-block w-3 h-3 rounded-full mr-2"
                        style={{
                          backgroundColor: leadHistory.leadState.colorHex,
                        }}
                      ></span>
                      {leadHistory.leadState.name}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-4 text-gray-600">
                    No hay historial disponible
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
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-gray-500 text-lg">Cargando...</p>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen space-y-8 mt-8">
        {/* Mensaje y botón arriba */}
        <div className="w-full text-center">
          <p className="text-red-400 text-lg font-semibold">
            Actualmente no tienes ningún lead, prueba a buscar uno nuevo.
          </p>
          <button
            onClick={handleSearchNewLead}
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-full font-semibold hover:bg-blue-600"
          >
            Solicitar Nuevo Lead
          </button>
        </div>

        {/* Lead History abajo */}
        <div className="w-full md:w-3/4">
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
    <div className="flex flex-col md:flex-row justify-center items-start bg-background p-2 gap-6">
      {/* Lead History */}
      <LeadHistory />

      {/* Lead Details */}
      <div className="w-full md:w-3/6 space-y-4 ">
        <div className="bg-foreground shadow-lg p-4 space-y-4 rounded-lg">
          {/* Lead Basic Info */}
          <div className="space-y-2">
            <div className="text-2xl text-gray-800 font-semibold">
              {lead.fullName}
            </div>
            <div className="text-2xl font-bold text-gray-800">
              {lead.phoneNumber}
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            <span className="bg-green-200 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
              {lead?.campaign?.name || "Sin campaña"}
            </span>
            {lead.campaign?.sector && (
              <span className="bg-purple-200 text-purple-700 px-3 py-1 rounded-full text-sm font-semibold">
                {lead.campaign.sector}
              </span>
            )}
            {/* Source Tag */}
            {lead.campaign?.source && (
              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold ${lead.campaign.source === "Meta"
                    ? "bg-blue-200 text-blue-700"
                    : lead.campaign.source === "TikTok"
                      ? "bg-pink-200 text-pink-700"
                      : lead.campaign.source === "Landing"
                        ? "bg-yellow-200 text-yellow-700"
                        : "bg-gray-200 text-gray-700"
                  }`}
              >
                {lead.campaign.source}
              </span>
            )}
            <span className="bg-blue-200 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
              Factura: {lead.billUri ? "Sí" : "No"}
            </span>
            <span className="bg-yellow-200 text-yellow-700 px-3 py-1 rounded-full text-sm font-semibold">
              {format(
                new Date(lead.createdAt).toISOString().split("T")[0],
                "dd-MM-yyyy"
              )}{" "}
              {new Date(lead.createdAt).toISOString().split("T")[1].slice(0, 8)}{" "}
            </span>
          </div>

          {/* Observations Input */}
          <div className="flex flex-col">
            <label className="text-sm text-gray-600">
              Escribir observaciones...{" "}
              <span className="text-red-500">(obligatorio)</span>
            </label>
            <textarea
              placeholder="Escribir observaciones..."
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              className="mt-1 p-2 h-24 bg-gray-100 text-black rounded-md focus:outline-none resize-none"
            />
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </div>

          <div className="flex flex-wrap items-center justify-start gap-4 mb-4">
            <button
              className="flex items-center bg-green-200 text-green-700 px-4 py-2 rounded-full font-semibold hover:bg-green-300 transition-all duration-300"
              onClick={() => {
                setShowUsefulOptions((prev) => !prev);
                setShowNotUsefulOptions(false);
              }}
            >
              Útil{" "}
              <FiChevronDown
                className={`ml-2 transform ${showUsefulOptions ? "rotate-180" : "rotate-0"
                  }`}
              />
            </button>
            <button
              className="flex items-center bg-red-200 text-red-700 px-4 py-2 rounded-full font-semibold hover:bg-red-300 transition-all duration-300"
              onClick={() => {
                setShowNotUsefulOptions((prev) => !prev);
                setShowUsefulOptions(false);
              }}
            >
              No Útil{" "}
              <FiChevronDown
                className={`ml-2 transform ${showNotUsefulOptions ? "rotate-180" : "rotate-0"
                  }`}
              />
            </button>
            <button
              onClick={handleSubmit}
              className={`bg-blue-500 text-white px-4 py-2 rounded-full font-semibold hover:bg-blue-600 transition-all duration-300 ${!observation || !selectedOption
                  ? "opacity-50 cursor-not-allowed"
                  : ""
                }`}
              disabled={!observation || !selectedOption}
            >
              Codificar
            </button>
            <button
              onClick={handleEditOrCreateLeadSheet}
              className="bg-yellow-200 text-yellow-700 px-4 py-2 rounded-full font-semibold hover:bg-yellow-300 transition-all duration-300 w-full sm:w-auto"
            >
              Crear/Ver ficha de cliente
            </button>
          </div>

          {/* Options for Useful */}
          {showUsefulOptions && (
            <div className="flex flex-col gap-2 mb-4 text-black">
              {usefulOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => {
                    setSelectedOption(option.id);
                  }}
                  className={`px-4 py-2 rounded-md text-left ${selectedOption === option.id
                      ? "bg-green-300 text-green-800 hover:bg-green-400 "
                      : "bg-background hover:bg-gray-200"
                    }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}

          {/* Options for Not Useful */}
          {showNotUsefulOptions && (
            <div className="flex flex-col gap-2 mb-4 text-black">
              {notUsefulOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => {
                    setSelectedOption(option.id);
                  }}
                  className={`px-4 py-2 rounded-md text-left  ${selectedOption === option.id
                      ? "bg-red-300 text-red-800 hover:bg-red-400 "
                      : "bg-background hover:bg-gray-200"
                    }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}

          {selectedOption === leadStatesIds.AgendaPersonal && (
            <>
              <hr />
              <div className="flex flex-col space-y-4 mt-4">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Fecha y hora de inicio de la llamada
                  </label>
                  <input
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="text-black p-2 border rounded-md bg-white focus:outline-none"
                    placeholder="Selecciona fecha y hora de inicio"
                  />
                </div>
              </div>
            </>
          )}

          {selectedOption === leadStatesIds.AgendarUsuario && (
            <div className="flex flex-col">
              <label className="text-sm text-gray-600">
                Selecciona un usuario:
              </label>

              <select
                value={selectedUserId || ""}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="mt-1 p-2 bg-gray-100 text-black rounded-md focus:outline-none"
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
        <div className="bg-foreground shadow-lg p-4 space-y-4 rounded-lg">
          <h2 className="text-xl font-bold text-black mb-4">
            Historial del Lead
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-backgroundHover text-black rounded-lg shadow">
              <thead>
                <tr className="bg-blue-200 text-gray-700">
                  <th className="px-4 py-2 text-left text-sm font-semibold">
                    Fecha
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">
                    Agente
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">
                    Observación
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">
                    Resultado
                  </th>
                </tr>
              </thead>
              <tbody>
                {lead.leadLogs && lead.leadLogs.length > 0 ? (
                  lead.leadLogs.map((log) => (
                    <tr key={log.id} className="bg-gray-100 even:bg-gray-200">
                      <td className="px-4 py-2 text-sm">
                        {new Date(log.createdAt).toISOString().split("T")[0]}
                      </td>
                      <td className="px-4 py-2 text-sm">{log.user.username}</td>
                      <td className="px-4 py-2 text-sm">{log.observations}</td>
                      <td className="px-4 py-2 text-sm">
                        <span
                          className="inline-block w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: log.leadState.colorHex }}
                        ></span>
                        {log.leadState.name}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center py-4 text-gray-600">
                      No hay historial disponible
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="w-full mt-4 flex justify-center">
            {lead.billUri ? (
              <a
                href={lead.billUri}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-500 text-white px-4 py-2 rounded-full font-semibold hover:bg-blue-600 w-full md:w-auto flex items-center justify-center"
              >
                <FiSearch className="mr-2" /> Ver Adjuntos
              </a>
            ) : (
              <p className="text-gray-600 font-semibold">
                No hay adjuntos disponibles
              </p>
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
            onRefreshLead={refreshLead} // refrescar el objeto lead.leadSheet
          />
        </div>
      )}

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
    </div>
  );
}
