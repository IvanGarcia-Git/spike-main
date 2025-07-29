"use client";
import { useState, useEffect } from "react";
import { authGetFetch, authFetch } from "@/helpers/server-fetch.helper";
import { getCookie } from "cookies-next";
import { FaPhoneAlt, FaBell, FaTasks, FaEnvelope, FaEye, FaChevronDown } from "react-icons/fa";
import { MdMarkEmailUnread, MdMarkEmailRead } from "react-icons/md";
import NewCommunicationModal from "@/components/new-communication.modal";
import * as jose from "jose";

export default function Notificaciones({ updateNotifications }) {
  const [notifications, setNotifications] = useState([]);
  const [sentNotifications, setSentNotifications] = useState([]);
  const [selectedTab, setSelectedTab] = useState("llamadas");
  const [subTab, setSubTab] = useState("recibidos");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [userId, setUserId] = useState(null);
  const [readHistoryModal, setReadHistoryModal] = useState({
    open: false,
    notification: null,
    data: [],
  });

  const getNotifications = async () => {
    const jwtToken = getCookie("factura-token");
    try {
      const response = await authGetFetch("notifications", jwtToken);
      if (response.ok) {
        const allNotifications = await response.json();
        setNotifications(allNotifications);
        if (updateNotifications) {
          updateNotifications(allNotifications);
        }
      } else {
        console.error("Error cargando la información de las notificaciones");
      }
    } catch (error) {
      console.error("Error enviando la solicitud:", error);
    }
  };

  const bulkMarkReadUnread = async (readValue) => {
    const jwtToken = getCookie("factura-token");

    // Guardamos el estado original para poder revertir si falla
    const originalNotifications = [...notifications];

    // 1. Actualización optimista de la UI para una respuesta instantánea
    setNotifications((prev) =>
      prev.map((n) => (selectedNotifications.includes(n.uuid) ? { ...n, read: readValue } : n))
    );

    // 2. Preparamos el payload para el endpoint de bulk update
    const payload = selectedNotifications.map((uuid) => ({
      uuid,
      data: { read: readValue },
    }));

    try {
      // 3. Hacemos UNA SOLA llamada al backend
      const response = await authFetch(
        "PATCH",
        "notifications/bulk-update", // Usando el nuevo endpoint
        payload,
        jwtToken
      );

      if (!response.ok) {
        throw new Error("Error en la actualización múltiple");
      }

      // 4. Limpiamos la selección si todo fue bien
      setSelectedNotifications([]);
      setSelectAll(false);
    } catch (error) {
      // 5. Si algo falla, revertimos la UI al estado original
      alert("Error al actualizar las notificaciones. Inténtalo de nuevo.");
      setNotifications(originalNotifications);
    }
  };

  const getSentNotifications = async () => {
    const jwtToken = getCookie("factura-token");
    try {
      const response = await authGetFetch("notifications/sent", jwtToken);
      if (response.ok) {
        setSentNotifications(await response.json());
      } else {
        setSentNotifications([]);
      }
    } catch (error) {
      setSentNotifications([]);
    }
  };

  useEffect(() => {
    getNotifications();
    const jwtToken = getCookie("factura-token");
    if (jwtToken) {
      try {
        const payload = jose.decodeJwt(jwtToken);
        setUserId(payload.userId);
      } catch (err) {
        setUserId(null);
      }
    }
  }, []);

  useEffect(() => {
    if (selectedTab === "comunicaciones") {
      getSentNotifications();
    }
  }, [selectedTab]);

  useEffect(() => {
    const unreadCount = notifications.filter((notification) => !notification.read).length;
    localStorage.setItem("totalUnreadNotifications", unreadCount);
  }, [notifications]);

  useEffect(() => {
    // Función para obtener la lista de notificaciones actualmente visible
    const getCurrentList = () => {
      switch (selectedTab) {
        case "llamadas":
          return leadCalls;
        case "recordatorios":
          return reminders;
        case "tareas":
          return tasks;
        case "comunicaciones":
          return subTab === "recibidos" ? receivedCommunications : [];
        case "others":
          return others;
        default:
          return [];
      }
    };

    const currentList = getCurrentList();

    if (selectAll) {
      // Si 'Seleccionar Todo' está activado, llena el array con los UUIDs de la lista actual
      const allUuids = currentList.map((itemOrGroup) =>
        Array.isArray(itemOrGroup) ? itemOrGroup[0].uuid : itemOrGroup.uuid
      );
      setSelectedNotifications(allUuids);
    } else {
      // ✨ LA LÍNEA CLAVE ✨
      // Si 'Seleccionar Todo' se desactiva, vacía el array de selección.
      setSelectedNotifications([]);
    }
  }, [selectAll]);

  // Para limpiar la selección al cambiar de pestaña (recomendado)
  useEffect(() => {
    setSelectedNotifications([]);
    setSelectAll(false);
  }, [selectedTab, subTab]);

  const getRelativeTime = (startDate) => {
    const now = new Date();
    const eventDate = new Date(startDate);
    const diffMs = now - eventDate;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);

    if (diffSec < 60) return `hace 1 minuto`;
    if (diffMin < 60) return `hace ${diffMin} minutos`;
    if (diffHours < 24) return `hace ${diffHours} horas`;
    if (diffDays < 7) return `hace ${diffDays} días`;
    if (diffWeeks < 4) return `hace ${diffWeeks} semanas`;
    return `hace ${Math.floor(diffDays / 30)} meses`;
  };

  const markAsReadOrUnread = async (notification) => {
    const jwtToken = getCookie("factura-token");
    const originalStatus = notification.read;
    try {
      const updatedTask = { ...notification, read: !notification.read };
      setNotifications((prevNotifications) =>
        prevNotifications.map((n) => (n.uuid === notification.uuid ? updatedTask : n))
      );

      const response = await authFetch(
        "PATCH",
        `notifications/${notification.uuid}`,
        { read: !originalStatus },
        jwtToken
      );
      if (!response.ok) {
        throw new Error("Error al actualizar el estado de la notificación");
      }

      if (updateNotifications) {
        updateNotifications(updatedTask);
      }
    } catch (error) {
      console.error("Error enviando la solicitud:", error);
      setNotifications((prev) =>
        prev.map((n) => (n.uuid === notification.uuid ? { ...n, read: originalStatus } : n))
      );
      alert("Error actualizando el estado de la notificación");
    }
  };

  const handleSelectNotification = (uuid) => {
    setSelectedNotifications((prev) =>
      prev.includes(uuid) ? prev.filter((id) => id !== uuid) : [...prev, uuid]
    );
  };

  const bulkDelete = async () => {
    if (!window.confirm("¿Eliminar las notificaciones seleccionadas?")) return;
    const jwtToken = getCookie("factura-token");
    try {
      setNotifications((prev) => prev.filter((n) => !selectedNotifications.includes(n.uuid)));
      const response = await authFetch(
        "DELETE",
        `notifications/`,
        { uuids: selectedNotifications },
        jwtToken
      );
      if (!response.ok) throw new Error();
      setSelectedNotifications([]);
      setSelectAll(false);
    } catch (error) {
      alert("Error eliminando notificaciones");
      getNotifications();
    }
  };

  const handleCreateCommunication = () => setIsEditModalOpen(true);

  const groupCommunicationsByContent = (items) => {
    if (!items || items.length === 0) return {};
    return items.reduce((acc, notification) => {
      const key = `${notification.subject}::${notification.content}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(notification);
      return acc;
    }, {});
  };

  const leadCalls = notifications.filter((n) => n.eventType === "leadCall");
  const reminders = notifications.filter((n) => n.eventType === "reminder");
  const tasks = notifications.filter((n) => n.eventType === "task");
  const others = notifications.filter((n) => n.eventType === "other");
  const receivedRaw = notifications.filter((n) => n.eventType === "communication");
  const sentRaw = sentNotifications.filter((n) => n.eventType === "communication");

  const groupedReceived = groupCommunicationsByContent(receivedRaw);
  const receivedCommunications = Object.values(groupedReceived);

  const groupedSent = groupCommunicationsByContent(sentRaw);
  const sentCommunications = Object.values(groupedSent);

  const unreadLeadCalls = leadCalls.filter((n) => !n.read).length;
  const unreadReminders = reminders.filter((n) => !n.read).length;
  const unreadTasks = tasks.filter((n) => !n.read).length;
  const unreadCommunications = receivedRaw.filter((n) => !n.read).length;
  const unreadOthers = others.filter((n) => !n.read).length;

  const fetchReadHistory = async (notification) => {
    const jwtToken = getCookie("factura-token");
    try {
      const response = await authGetFetch(
        `notifications/${notification.batchId}/read-history`,
        jwtToken
      );
      if (response.ok) {
        const data = await response.json();
        setReadHistoryModal({ open: true, notification, data });
      } else {
        alert("Error obteniendo historial de lectura");
      }
    } catch (err) {
      alert("Error de red al obtener historial de lectura");
    }
  };

  const ReadHistoryModal = ({ open, onClose, data }) => {
    if (!open) return null;
    const leidos = data.filter((u) => u.read);
    const noLeidos = data.filter((u) => !u.read);
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full text-black">
          <h2 className="text-lg font-bold mb-4">Historial de lectura</h2>
          <div className="mb-4">
            <h3 className="font-semibold text-green-700 mb-2">Leído ({leidos.length})</h3>
            {leidos.length === 0 ? (
              <div className="text-gray-500">Nadie</div>
            ) : (
              <ul className="mb-2 max-h-40 overflow-y-auto">
                {leidos.map((u) => (
                  <li key={u.user.id}>
                    {u.user.name} {u.user.firstSurname} {u.user.secondSurname}
                  </li>
                ))}
              </ul>
            )}
            <h3 className="font-semibold text-red-700 mb-2 mt-4">No leído ({noLeidos.length})</h3>
            {noLeidos.length === 0 ? (
              <div className="text-gray-500">Nadie</div>
            ) : (
              <ul className="max-h-40 overflow-y-auto">
                {noLeidos.map((u) => (
                  <li key={u.user.id}>
                    {u.user.name} {u.user.firstSurname} {u.user.secondSurname}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <button onClick={onClose} className="bg-blue-600 text-white px-4 py-2 rounded">
            Cerrar
          </button>
        </div>
      </div>
    );
  };

  const renderTabContent = (items) => (
    <ul className="space-y-2 mt-4">
      {selectedTab === "comunicaciones" && (
        <>
          <div className="flex gap-2 mb-2">
            <button
              className={`px-3 py-1 rounded-t-md border-b-2 ${
                subTab === "recibidos"
                  ? "border-blue-600 text-blue-600 font-bold bg-white"
                  : "border-transparent text-gray-500 bg-gray-100"
              }`}
              onClick={() => setSubTab("recibidos")}
            >
              Recibidos
            </button>
            <button
              className={`px-3 py-1 rounded-t-md border-b-2 ${
                subTab === "enviados"
                  ? "border-blue-600 text-blue-600 font-bold bg-white"
                  : "border-transparent text-gray-500 bg-gray-100"
              }`}
              onClick={() => setSubTab("enviados")}
            >
              Enviados
            </button>
          </div>
          <div className="flex justify-between mb-4 items-center">
            {subTab === "recibidos" ? (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={() => setSelectAll((prev) => !prev)}
                  disabled={receivedCommunications.length === 0}
                />
                <span className="text-sm">Seleccionar todo</span>
                {selectedNotifications.length > 0 && (
                  <div className="relative ml-2">
                    <button
                      className="bg-blue-600 text-white px-3 py-1 rounded flex items-center gap-1"
                      onClick={() => setIsActionsOpen((o) => !o)}
                    >
                      Acciones <FaChevronDown />
                    </button>
                    {isActionsOpen && (
                      <ul className="absolute left-0 mt-1 w-44 bg-white border rounded shadow z-10 text-black">
                        <li
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                          onClick={() => {
                            const anyUnread = receivedRaw.some(
                              (n) => selectedNotifications.includes(n.uuid) && !n.read
                            );
                            bulkMarkReadUnread(anyUnread);
                            setIsActionsOpen(false);
                          }}
                        >
                          Marcar como{" "}
                          {receivedRaw.some(
                            (n) => selectedNotifications.includes(n.uuid) && !n.read
                          )
                            ? "leído"
                            : "no leído"}
                        </li>
                        <li
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-red-600"
                          onClick={() => {
                            bulkDelete();
                            setIsActionsOpen(false);
                          }}
                        >
                          Eliminar
                        </li>
                      </ul>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div />
            )}
            <button
              onClick={handleCreateCommunication}
              className="bg-secondary text-white px-4 py-2 rounded hover:bg-secondaryHover"
            >
              Crear Comunicado
            </button>
          </div>
        </>
      )}

      {(selectedTab === "comunicaciones"
        ? subTab === "enviados"
          ? sentCommunications
          : receivedCommunications
        : items
      ).map((itemOrGroup, index) => {
        const isGroup = Array.isArray(itemOrGroup);
        const isCommsTab = selectedTab === "comunicaciones";
        const isSentTab = isCommsTab && subTab === "enviados";

        const representativeNotification = isGroup ? itemOrGroup[0] : itemOrGroup;
        const targetNotification =
          isGroup && !isSentTab ? itemOrGroup[0] : representativeNotification;

        if (!representativeNotification) return null;

        const timeAgo = getRelativeTime(representativeNotification.startDate);
        const isRead = isSentTab ? true : targetNotification.read;

        return (
          <li
            key={`${representativeNotification.uuid}-${index}`}
            className={`flex items-center space-x-4 p-3 rounded-lg shadow-sm transition ${
              isRead ? "bg-white" : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            {isCommsTab && !isSentTab && (
              <input
                type="checkbox"
                checked={selectedNotifications.includes(targetNotification.uuid)}
                onChange={() => handleSelectNotification(targetNotification.uuid)}
                className="mr-2"
              />
            )}
            <div className="relative w-10 h-10 flex-none rounded-full bg-blue-900 flex items-center justify-center">
              <img src="/avatar.png" alt="avatar" className="w-8 h-8 rounded-full" />
            </div>
            <div className="flex-1">
              <p className="text-xs sm:text-sm text-gray-500">
                {representativeNotification?.subject}
              </p>
              <p className="font-semibold text-sm sm:text-base">
                {representativeNotification.content}
              </p>
              <p className="text-xs sm:text-sm text-gray-500">{timeAgo}</p>
            </div>
            {representativeNotification.documentUri && (
              <a
                href={representativeNotification.documentUri}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 text-blue-500 hover:text-blue-700"
                title="Ver archivo"
              >
                <FaEye className="w-4 h-4 sm:w-5 sm:h-5" />
              </a>
            )}

            {!isSentTab && (
              <>
                {!targetNotification.read ? (
                  <button
                    onClick={() => markAsReadOrUnread(targetNotification)}
                    className="hover:text-gray-700"
                    title="Marcar como leído"
                  >
                    <MdMarkEmailUnread className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                ) : (
                  <button
                    onClick={() => markAsReadOrUnread(targetNotification)}
                    className="hover:text-gray-700"
                    title="Marcar como no leído"
                  >
                    <MdMarkEmailRead className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                )}
              </>
            )}

            {isSentTab && userId && representativeNotification.creatorId === userId && (
              <button
                className="ml-2 px-2 py-1 bg-gray-200 rounded text-xs hover:bg-gray-300"
                onClick={() => fetchReadHistory(representativeNotification)}
              >
                Historial de lectura
              </button>
            )}
          </li>
        );
      })}
      <ReadHistoryModal
        open={readHistoryModal.open}
        onClose={() => setReadHistoryModal({ open: false, notification: null, data: [] })}
        data={readHistoryModal.data}
      />
    </ul>
  );

  return (
    <div className="flex flex-col items-center bg-gray-100 min-h-screen">
      <div className="w-full">
        <div className="bg-white text-black rounded-lg shadow-md p-6">
          <h2 className="text-xl sm:text-2xl font-bold mb-4">Notificaciones</h2>

          {/* 1. SECCIÓN DE PESTAÑAS (Sin cambios) */}
          <div className="flex justify-around border-b mb-4 text-xs sm:text-sm lg:text-base overflow-x-auto">
            <button
              onClick={() => setSelectedTab("llamadas")}
              className={`flex items-center space-x-1 mr-1 pb-2 ${
                selectedTab === "llamadas"
                  ? "text-blue-500 border-b-2 border-blue-500 font-bold"
                  : "text-gray-500"
              }`}
            >
              <FaPhoneAlt className="w-4 h-4" />
              <span>Llamadas</span>
              {unreadLeadCalls > 0 && (
                <span className="text-red-600 bg-red-100 rounded-full px-1.5 py-0.5 text-xs">
                  {unreadLeadCalls}
                </span>
              )}
            </button>
            <button
              onClick={() => setSelectedTab("recordatorios")}
              className={`flex items-center space-x-1 mr-1  pb-2 ${
                selectedTab === "recordatorios"
                  ? "text-blue-500 border-b-2 border-blue-500 font-bold"
                  : "text-gray-500"
              }`}
            >
              <FaBell className="w-4 h-4" />
              <span>Recordatorios</span>
              {unreadReminders > 0 && (
                <span className="text-red-600 bg-red-100 rounded-full px-1.5 py-0.5 text-xs">
                  {unreadReminders}
                </span>
              )}
            </button>
            <button
              onClick={() => setSelectedTab("comunicaciones")}
              className={`flex items-center space-x-1 mr-1  pb-2 ${
                selectedTab === "comunicaciones"
                  ? "text-blue-500 border-b-2 border-blue-500 font-bold"
                  : "text-gray-500"
              }`}
            >
              <FaEnvelope className="w-4 h-4" />
              <span>Comunicados</span>
              {unreadCommunications > 0 && (
                <span className="text-red-600 bg-red-100 rounded-full px-1.5 py-0.5 text-xs">
                  {unreadCommunications}
                </span>
              )}
            </button>
            <button
              onClick={() => setSelectedTab("tareas")}
              className={`flex items-center space-x-1 mr-1 pb-2 ${
                selectedTab === "tareas"
                  ? "text-blue-500 border-b-2 border-blue-500 font-bold"
                  : "text-gray-500"
              }`}
            >
              <FaTasks className="w-4 h-4" />
              <span>Tareas</span>
              {unreadTasks > 0 && (
                <span className="text-red-600 bg-red-100 rounded-full px-1.5 py-0.5 text-xs">
                  {unreadTasks}
                </span>
              )}
            </button>
            <button
              onClick={() => setSelectedTab("others")}
              className={`flex items-center space-x-1 mr-1  pb-2 ${
                selectedTab === "others"
                  ? "text-blue-500 border-b-2 border-blue-500 font-bold"
                  : "text-gray-500"
              }`}
            >
              <FaEnvelope className="w-4 h-4" />
              <span>Otras</span>
              {unreadOthers > 0 && (
                <span className="text-red-600 bg-red-100 rounded-full px-1.5 py-0.5 text-xs">
                  {unreadOthers}
                </span>
              )}
            </button>
          </div>

          {/* 2. ✨ NUEVA BARRA DE ACCIONES PARA SELECCIÓN MÚLTIPLE */}
          {selectedTab !== "comunicaciones" || subTab !== "enviados" ? (
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded-md mb-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="select-all"
                  checked={selectAll}
                  onChange={() => setSelectAll((prev) => !prev)}
                />
                <label htmlFor="select-all" className="text-sm font-medium text-gray-700">
                  Seleccionar Todo
                </label>
              </div>

              {/* Acciones que aparecen cuando hay algo seleccionado */}
              {selectedNotifications.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => bulkMarkReadUnread(true)}
                    className="flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-md text-sm hover:bg-blue-200"
                  >
                    <MdMarkEmailRead />
                    Marcar como leído
                  </button>
                  <button
                    onClick={() => bulkMarkReadUnread(false)}
                    className="flex items-center gap-1 bg-gray-200 text-gray-800 px-3 py-1 rounded-md text-sm hover:bg-gray-300"
                  >
                    <MdMarkEmailUnread />
                    Marcar como no leído
                  </button>
                </div>
              )}
            </div>
          ) : null}

          {/* 3. RENDERIZADO DEL CONTENIDO DE LAS PESTAÑAS (Sin cambios) */}
          {selectedTab === "llamadas" && renderTabContent(leadCalls)}
          {selectedTab === "recordatorios" && renderTabContent(reminders)}
          {selectedTab === "tareas" && renderTabContent(tasks)}
          {selectedTab === "comunicaciones" && renderTabContent()}
          {selectedTab === "others" && renderTabContent(others)}
        </div>
      </div>

      {/* 4. MODAL PARA NUEVA COMUNICACIÓN (Sin cambios) */}
      {isEditModalOpen && (
        <div
          className={`fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 ${
            isEditModalOpen ? "lg:ml-72" : ""
          }`}
        >
          <NewCommunicationModal
            isModalOpen={isEditModalOpen}
            setIsModalOpen={setIsEditModalOpen}
          />
        </div>
      )}
    </div>
  );
}
