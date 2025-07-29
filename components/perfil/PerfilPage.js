"use client";
import { useState, useEffect, useRef, forwardRef } from "react";
import { GoTrophy } from "react-icons/go";
import { MdOutlineFileUpload } from "react-icons/md";
import { FaRegUser } from "react-icons/fa6";
import { FaRegFile } from "react-icons/fa";
import { FiDownload, FiTrash } from "react-icons/fi";
import { useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import { authGetFetch, authFetch } from "@/helpers/server-fetch.helper";
import { getCookie } from "cookies-next";
import * as jose from "jose";
import NominasSection from "@/components/perfil/nominas-section";
import AusenciasSection from "@/components/perfil/ausencias-section";

const WEEK_DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

const Input = forwardRef(({ className = "", type = "text", ...props }, ref) => (
  <input
    type={type}
    ref={ref}
    className={`flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    {...props}
  />
));

const DocumentsModal = ({ onClose, userId }) => {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const fetchDocuments = async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const token = getCookie("factura-token");
      const response = await authGetFetch(`users/documents/${userId}`, token);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      } else {
        toast.error("No se pudieron cargar los documentos.");
      }
    } catch (error) {
      toast.error("Error de red al cargar documentos.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [userId]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("document", file);

    try {
      const token = getCookie("factura-token");
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/users/documents/${userId}`;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        toast.success("Archivo subido correctamente.", {
          position: "top-right",
          draggable: true,
          icon: false,
          hideProgressBar: false,
          autoClose: 5000,
          className: `transition-all transform hover:-translate-y-1 hover:shadow-l border border-gray-400`,
        });

        await fetchDocuments();
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(`Error al subir el archivo: ${errorData.message || response.statusText}`);
      }
    } catch (error) {
      console.error("Error en la subida:", error);
      toast.error("Error de red al subir el archivo.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadClick = async (documentUuid) => {
    try {
      const token = getCookie("factura-token");
      const response = await authGetFetch(`users/documents/download/${documentUuid}`, token);
      if (response.ok) {
        const data = await response.json();
        window.open(data.url, "_blank");
      } else {
        toast.error("No se pudo obtener el enlace de descarga.");
      }
    } catch (error) {
      toast.error("Error de red al descargar.");
    }
  };

  const handleDeleteDocument = async (documentUuid) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este documento?")) {
      return;
    }

    try {
      const token = getCookie("factura-token");
      const response = await authFetch("DELETE", `users/documents/${documentUuid}`, {}, token);

      if (response.ok) {
        toast.success("Documento eliminado exitosamente.");
        await fetchDocuments();
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(`Error: ${errorData.message || "No se pudo eliminar el documento"}`);
      }
    } catch (error) {
      toast.error("Error de red al eliminar el documento.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl">
        <div className="flex justify-between items-center p-5 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Documentación del Usuario</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="p-6">
          <div className="flex justify-end mb-5">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
            <button
              onClick={handleUploadClick}
              disabled={isUploading}
              className="inline-flex items-center gap-2 rounded-md bg-green-600 text-white font-semibold px-4 py-2 text-sm hover:bg-green-700 disabled:bg-green-300"
            >
              <MdOutlineFileUpload className="h-4 w-4" />
              {isUploading ? "Subiendo..." : "Subir Archivo"}
            </button>
          </div>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
            {isLoading ? (
              <p>Cargando documentos...</p>
            ) : documents.length === 0 ? (
              <p>No hay documentos para este usuario.</p>
            ) : (
              documents.map((doc) => (
                <div
                  key={doc.uuid}
                  className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <FaRegFile className="h-6 w-6 text-blue-500" />
                    <div>
                      <p className="font-semibold text-gray-800">{doc.originalName}</p>
                      <p className="text-xs text-gray-500">
                        Subido el {new Date(doc.createdAt).toLocaleDateString("es-ES")}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDownloadClick(doc.uuid)}
                      className="inline-flex items-center gap-2 rounded-md bg-blue-600 text-white font-semibold px-3 py-1.5 text-xs hover:bg-blue-700"
                    >
                      <FiDownload className="h-4 w-4" />
                      Descargar
                    </button>
                    <button
                      onClick={() => handleDeleteDocument(doc.uuid)}
                      className="inline-flex items-center gap-2 rounded-md bg-red-600 text-white font-semibold px-3 py-1.5 text-xs hover:bg-red-700"
                    >
                      <FiTrash className="h-4 w-4" />
                      Eliminar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const PersonalInfoSection = ({ userInfo }) => {
  function hideIbanNumbers(iban) {
    if (!iban) return "";
    const lastFourDigits = iban.slice(-4);
    const hiddenIban = "*".repeat(iban.length - 4) + lastFourDigits;
    return hiddenIban;
  }

  function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: "numeric", month: "numeric", day: "numeric" };
    return date.toLocaleDateString("es-ES", options);
  }

  /**
   * days  → string, e.g. "Lunes a Viernes"  or  "Martes"
   * time  → string, e.g. "09:00 - 18:00"
   * returns total hours for the week (Number)
   */
  function calculateWeeklyHours(days, time) {
    if (!days || !time) {
      return 0;
    }
    let startDay, endDay;
    if (days.includes(" a ")) {
      [startDay, endDay] = days.split(" a ").map((d) => d.trim());
    } else {
      startDay = endDay = days.trim();
    }

    const startIdx = WEEK_DAYS.indexOf(startDay);
    const endIdx = WEEK_DAYS.indexOf(endDay);

    if (startIdx === -1 || endIdx === -1) {
      throw new Error("Día inválido en la cadena 'days'");
    }

    const numDays =
      startIdx <= endIdx ? endIdx - startIdx + 1 : WEEK_DAYS.length - startIdx + endIdx + 1;

    const [rawStart, rawEnd] = time.split(" - ").map((t) => t.trim());
    const [sh, sm] = rawStart.split(":").map(Number);
    const [eh, em] = rawEnd.split(":").map(Number);

    let hoursPerDay = eh - sh + (em - sm) / 60;

    if (hoursPerDay < 0) hoursPerDay += 24;

    return hoursPerDay * numDays;
  }

  /**
   * Devuelve cuánto ha pasado desde `startDate` hasta hoy
   * en formato “X años Y meses Z días”.
   * Si `startDate` es posterior a hoy, devuelve “0 días”.
   *
   * @param {string|number|Date} startDateInput
   * @returns {string}
   */
  function tiempoTranscurrido(startDateInput) {
    if (!startDateInput) return "0 días";

    const hoy = new Date();
    const startDate = new Date(startDateInput);

    if (startDate > hoy) return "0 días";

    let años = hoy.getFullYear() - startDate.getFullYear();
    let meses = hoy.getMonth() - startDate.getMonth();
    let días = hoy.getDate() - startDate.getDate();

    if (días < 0) {
      const diasMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth(), 0).getDate();
      días += diasMesAnterior;
      meses -= 1;
    }

    if (meses < 0) {
      meses += 12;
      años -= 1;
    }

    const partes = [];
    if (años) partes.push(`${años} año${años === 1 ? "" : "s"}`);
    if (meses) partes.push(`${meses} mes${meses === 1 ? "" : "es"}`);
    if (días || partes.length === 0) partes.push(`${días} día${días === 1 ? "" : "s"}`);

    return partes.join(" ");
  }

  return (
    <>
      {/* Personal information */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Nombre</h3>
            <p className="font-medium">{`${userInfo?.name} ${userInfo?.secondSurname}`}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Usuario</h3>
            <p className="font-medium">{userInfo?.username ?? "-"}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Teléfono</h3>
            <p className="font-medium">{userInfo?.phone ?? "-"}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Correo</h3>
            <p className="font-medium">{userInfo?.email ?? "-"}</p>
          </div>
          <div className="md:col-span-2">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Nº Cuenta</h3>
            <p className="font-medium">{hideIbanNumbers(userInfo?.iban) ?? "-"}</p>
          </div>
        </div>
      </div>

      {/* Company info */}
      <div className="bg-background border border-gray-200 rounded-lg p-6 mt-4">
        <h3 className="text-lg font-semibold mb-4">Antigüedad en la empresa</h3>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-xl font-bold">{tiempoTranscurrido(userInfo?.startDate)}</p>
            <p className="text-sm text-gray-500">{formatDate(userInfo?.startDate) ?? "-"}</p>
          </div>
          <div className="flex items-center bg-white p-3 rounded-lg border border-gray-200">
            <GoTrophy className="h-6 w-6 text-yellow-500 mr-2" />
            <span className="font-medium">2º empleado más antiguo</span>
          </div>
        </div>
      </div>

      {/* Shift and Schedule */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        <div className="bg-background border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Turno</h3>
          <div className="flex items-center">
            <div
              className={`${
                userInfo?.shift === "mañana" ? "bg-yellow-100" : "bg-indigo-900"
              } p-3 rounded-full mr-3`}
            >
              {userInfo?.shift === "mañana" ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-yellow-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <circle cx="12" cy="12" r="5" fill="currentColor" />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-indigo-300"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    d="M21 12.79A9 9 0 1111.21 3
a7 7 0 0010 9.79z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    fill="currentColor"
                  />
                </svg>
              )}
            </div>
            <span className="font-medium capitalize">{userInfo?.shift ?? "-"}</span>
          </div>
        </div>

        <div className="bg-background border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Horario</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="font-medium">{userInfo?.days ?? "-"}</span>
              <span className="text-gray-500">
                {calculateWeeklyHours(userInfo?.days, userInfo?.time)}h/sem
              </span>
            </div>
            <p className="font-medium">{userInfo?.time ?? "-"}</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default function PerfilPage() {
  const searchParams = useSearchParams();
  const search = searchParams.get("uuid");
  const [userInfo, setUserInfo] = useState({});
  const [tab, setTab] = useState("personal");
  const [userGroupId, setUserGroupId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getUserInfo = async () => {
    const jwtToken = getCookie("factura-token");

    try {
      const url = `users/by/${search}`;
      const response = await authGetFetch(url, jwtToken);

      if (response.ok) {
        const userData = await response.json();
        setUserInfo(userData.user || userData);
      } else {
        const errorData = await response.json().catch(() => ({
          message: "Error al cargar la información del usuario",
        }));
        console.error("Error fetching user info:", response.status, errorData);
        alert(
          `Error al cargar la información del usuario: ${errorData.message || response.statusText}`
        );
      }
    } catch (error) {
      console.error("Error al obtener la información del usuario:", error);
      alert("Ocurrió un error de red o del servidor.");
    }
  };

  function checkAuthentication() {
    const token = getCookie("factura-token");
    if (token) {
      try {
        const payload = jose.decodeJwt(token);
        setUserGroupId(payload.groupId);

        return true;
      } catch (error) {
        console.error("Error al decodificar el token:", error);
        return false;
      }
    }
    return false;
  }

  useEffect(() => {
    checkAuthentication();
  }, []);

  useEffect(() => {
    getUserInfo();
  }, []);

  return (
    <div className="container p-4">
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Gestionar Documentación
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-black">
        {/* Left column */}
        <div className="space-y-4">
          <div className="bg-background p-6 rounded-lg flex flex-col items-center">
            <div className="w-32 h-32 bg-gray-200 rounded-full mb-4 flex items-center justify-center">
              <FaRegUser className="h-16 w-16 text-gray-400" />
            </div>
            <h2 className="text-xl font-bold">{`${userInfo?.name} ${userInfo?.secondSurname}`}</h2>
            <p className="text-gray-500">Agente</p>
          </div>

          <div
            onClick={() => setTab("personal")}
            className={`${
              tab === "personal" ? "bg-background" : "bg-white"
            } border border-gray-200 rounded-lg p-4 cursor-pointer`}
          >
            <h3 className="text-lg font-semibold">Inform. personal</h3>
            <div className="space-y-2"></div>
          </div>

          <div
            onClick={() => setTab("ausencias")}
            className={`${
              tab === "ausencias" ? "bg-background" : "bg-white"
            } border border-gray-200 rounded-lg p-4 cursor-pointer`}
          >
            <h3 className="text-lg font-semibold">Ausencias</h3>
            <div className="space-y-2"></div>
          </div>

          <div
            onClick={() => setTab("nominas")}
            className={`${
              tab === "nominas" ? "bg-background" : "bg-white"
            } border border-gray-200 rounded-lg p-4 cursor-pointer`}
          >
            <h3 className="text-lg font-semibold">Nóminas</h3>
            <div className="space-y-2"></div>
          </div>
        </div>

        {/* Right column */}
        <div className="md:col-span-2">
          {tab === "personal" && <PersonalInfoSection userInfo={userInfo} />}
          {tab === "ausencias" && (
            <AusenciasSection userInfo={userInfo} userGroupId={userGroupId} />
          )}
          {tab === "nominas" && <NominasSection userInfo={userInfo} userGroupId={userGroupId} />}
        </div>
      </div>

      {isModalOpen && <DocumentsModal userId={userInfo.id} onClose={() => setIsModalOpen(false)} />}
    </div>
  );
}
