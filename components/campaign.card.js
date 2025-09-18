"use client";
import React, { useState, useEffect, useRef } from "react";
import { getCookie } from "cookies-next";
import { authFetch, authGetFetch } from "@/helpers/server-fetch.helper";
import { FiSearch, FiPlus, FiX, FiTrash, FiPaperclip, FiDownload } from "react-icons/fi";
import GroupLinkModal from "./group-link.modal";
import * as XLSX from "xlsx";

const LeadDocumentsModal = ({ lead, onClose }) => {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const token = getCookie("factura-token");
      const response = await authGetFetch(`leads/${lead.uuid}/documents`, token);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      } else {
        alert("Error: No se pudieron cargar los documentos del lead.");
      }
    } catch (error) {
      console.error("Error de red al cargar documentos:", error);
      alert("Error de red al cargar documentos.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (lead) {
      fetchDocuments();
    }
  }, [lead]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event) => {
    const files = event.target.files;

    if (!files || files.length === 0) return;

    setIsUploading(true);
    const formData = new FormData();

    for (let i = 0; i < files.length; i++) {
      formData.append("documents", files[i]);
    }

    const token = getCookie("factura-token");

    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/leads/${lead.uuid}/documents`;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        alert("Archivos subidos con éxito.");
        fetchDocuments();
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(`Error al subir los archivos: ${errorData.message || "Error desconocido"}`);
      }
    } catch (error) {
      console.error("Error de red al subir archivos:", error);
      alert("Error de red al subir archivos.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDownload = async (docUuid) => {
    const token = getCookie("factura-token");
    try {
      const response = await authGetFetch(`leads/documents/download/${docUuid}`, token);
      if (response.ok) {
        const { url } = await response.json();
        window.open(url, "_blank");
      } else {
        alert("No se pudo obtener la URL de descarga.");
      }
    } catch (error) {
      alert("Error de red al intentar descargar.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex items-center justify-center p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl text-black">
        <div className="flex justify-between items-center mb-4 pb-4 border-b">
          <h3 className="text-lg font-bold">Documentos de: {lead.fullName}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <FiX size={24} />
          </button>
        </div>
        <div className="mb-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            multiple
          />
          <button
            onClick={handleUploadClick}
            disabled={isUploading}
            className="w-full bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:bg-blue-300 transition-colors"
          >
            {isUploading ? "Subiendo..." : "Subir Nuevos Documentos"}
          </button>
        </div>
        <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
          {isLoading ? (
            <p>Cargando documentos...</p>
          ) : documents.length > 0 ? (
            documents.map((doc) => (
              <div
                key={doc.uuid}
                className="flex justify-between items-center p-3 bg-gray-100 rounded-md"
              >
                <span className="truncate pr-4">{doc.originalName}</span>
                <button
                  onClick={() => handleDownload(doc.uuid)}
                  className="p-1 text-blue-600 hover:text-blue-800"
                  title={`Descargar ${doc.originalName}`}
                >
                  <FiDownload size={18} />
                </button>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 py-4">No hay documentos para este lead.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default function CampaignCard({
  campaign,
  allUsers,
  globalSearchTerm,
  globalAssignedFilter,
  globalBillFilter,
  dateFrom,
  dateTo,
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGroupLinkModalOpen, setIsGroupLinkModalModalOpen] = useState(false);

  const [isEditing, setIsEditing] = useState(null);

  const [editableLead, setEditableLead] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [billFilter, setBillFilter] = useState(null);
  const [assignedFilter, setAssignedFilter] = useState(null);

  const [filteredLeads, setFilteredLeads] = useState(campaign.leads || []);
  const [allLeadsFetched, setAllLeadsFetched] = useState(false);

  const [isVisible, setIsVisible] = useState(true);

  const [viewingLeadDocs, setViewingLeadDocs] = useState(null);

  const handleFileUpload = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  //Filters
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleAssignedFilterChange = (e) => {
    const value = e.target.value;
    setAssignedFilter(value === "Si" ? true : value === "No" ? false : null);
  };

  const handleBillFilterChange = (event) => {
    const value = event.target.value;
    setBillFilter(value === "Si" ? true : value === "No" ? false : null);
  };

  //Modal control
  const openNewLeadModal = () => {
    setEditableLead({
      fullName: "",
      phoneNumber: "",
      billUri: null,
      user: null,
    });
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditableLead(null);
    setSelectedFile(null);
  };

  const handleOpenModal = () => {
    setIsGroupLinkModalModalOpen(true);
  };

  const handleDeleteCampaign = async () => {
    const isConfirmed = confirm(
      `¿Estás seguro de que quieres eliminar la campaña "${campaign.name}"? Esta acción no se puede deshacer.`
    );

    if (!isConfirmed) {
      return;
    }

    const jwtToken = getCookie("factura-token");

    try {
      const response = await authFetch("DELETE", `campaigns/${campaign.uuid}`, {}, jwtToken);

      if (response.ok) {
        alert("Campaña eliminada con éxito.");
        setIsVisible(false);
      } else {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Error desconocido al eliminar." }));
        throw new Error(errorData.message);
      }
    } catch (error) {
      console.error("Error al eliminar la campaña:", error);
      alert(`No se pudo eliminar la campaña: ${error.message}`);
    }
  };

  const handleCloseModal = () => {
    setIsGroupLinkModalModalOpen(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditableLead((prevLead) => ({
      ...prevLead,
      [name]: value,
    }));
  };

  const handleSaveChanges = async (e) => {
    e.preventDefault();

    const jwtToken = getCookie("factura-token");

    if (selectedFile && selectedFile.name.endsWith(".xlsx")) {
      await handleUploadExcel();
      return;
    }

    try {
      let response;
      const formData = new FormData();
      formData.append("fullName", editableLead.fullName);
      formData.append("phoneNumber", editableLead.phoneNumber);

      if (editableLead?.assignedUserName !== undefined) {
        formData.append(
          "assignedUserName",
          editableLead.assignedUserName === null ? "" : editableLead.assignedUserName
        );
      }

      if (selectedFile) {
        formData.append("billFile", selectedFile);
      }

      if (editableLead.createdAt) {
        const originalDate = new Date(editableLead.createdAt);
        const updatedDate = new Date(originalDate.getTime() + 8 * 60 * 60 * 1000);
        const formattedDate = updatedDate.toISOString().split(".")[0];
        formData.append("createdAt", formattedDate);
      }

      if (editableLead.id) {
        response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leads/${editableLead.uuid}`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${jwtToken}`,
          },
          body: formData,
        });
      } else {
        formData.append("campaignName", campaign.name);

        response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leads`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${jwtToken}`,
          },
          body: formData,
        });
      }

      if (response.ok) {
        setFilteredLeads((prevLeads) =>
          prevLeads.map((lead) =>
            lead.id === editableLead.id ? { ...lead, ...editableLead } : lead
          )
        );

        setIsEditing(null);
      } else {
        alert("Error actualizando el lead");
      }
    } catch (error) {
      console.error("Error enviando la solicitud:", error);
    }
  };

  const handleUploadExcel = async () => {
    const jwtToken = getCookie("factura-token");

    try {
      const fileReader = new FileReader();
      fileReader.onload = async (event) => {
        const arrayBuffer = event.target.result;
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const excelData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        const leadsData = excelData.slice(1).map((row) => {
          const rawDate = row[2] || ""; // Fecha en formato serial de Excel
          let formattedDate = null;

          //
          if (typeof rawDate === "number") {
            const dateObj = new Date((rawDate - 25569) * 86400 * 1000); //Fórmula para convertir de formato serial a fecha legible
            formattedDate = dateObj.toISOString();
          }

          return {
            fullName: row[0] || "",
            phoneNumber: row[1] || "",
            createdAt: formattedDate || "",
            campaignName: campaign.name,
          };
        });

        if (leadsData.length === 0) {
          alert("El archivo .xlsx no contiene datos válidos.");
          return;
        }

        const payload = { leadsData };

        const response = await authFetch("POST", `leads/batch`, payload, jwtToken);

        if (response.ok) {
          alert("Archivo .xlsx procesado y datos enviados exitosamente.");
          handleModalClose();
        } else {
          alert("Error al enviar los datos procesados al backend.");
        }
      };

      fileReader.readAsArrayBuffer(selectedFile);
    } catch (error) {
      console.error("Error al procesar el archivo Excel:", error);
      alert("Ocurrió un error al procesar el archivo .xlsx.");
    }
  };

  const fetchAllLeads = async () => {
    const jwtToken = getCookie("factura-token");

    try {
      const response = await authGetFetch(`campaigns/${campaign.uuid}`, jwtToken);
      if (response.ok) {
        const { leads } = await response.json();

        campaign.leads = leads;
        setFilteredLeads(leads);
        setAllLeadsFetched(true);
      } else {
        console.error("Error al cargar todos los leads.");
      }
    } catch (error) {
      console.error("Error en la solicitud:", error);
    }
  };

  useEffect(() => {
    const hasGlobalFilters =
      globalSearchTerm ||
      globalAssignedFilter !== null ||
      globalBillFilter !== null ||
      dateFrom ||
      dateTo;

    if (!allLeadsFetched && (campaign.leads || []).length > 9 && hasGlobalFilters) {
      fetchAllLeads();
    }
  }, [globalSearchTerm, globalAssignedFilter, globalBillFilter, dateFrom, dateTo]);

  useEffect(() => {
    const normalize = (str) => (str || "").toString().toLowerCase().replace(/\s+/g, "");

    const normalizedGlobalSearch = normalize(globalSearchTerm);
    const normalizedLocalSearch = normalize(searchTerm);

    let results = campaign.leads || [];

    if (normalizedGlobalSearch) {
      results = results.filter((lead) => {
        const fullName = normalize(lead.fullName);
        const phoneNumber = normalize(lead.phoneNumber);
        const nationalId = normalize(lead.nationalId);

        return (
          fullName.includes(normalizedGlobalSearch) ||
          phoneNumber.includes(normalizedGlobalSearch) ||
          nationalId.includes(normalizedGlobalSearch)
        );
      });
    }

    if (normalizedLocalSearch) {
      results = results.filter((lead) => {
      const fullName = normalize(lead.fullName);
      const phoneNumber = normalize(lead.phoneNumber);
      const nationalId = normalize(lead.nationalId);

      return (
        fullName.includes(normalizedLocalSearch) ||
        phoneNumber.includes(normalizedLocalSearch) ||
        nationalId.includes(normalizedLocalSearch)
      );
    });
    }

    const effectiveAssignedFilter = assignedFilter !== null ? assignedFilter : globalAssignedFilter;
    if (effectiveAssignedFilter === true) {
      results = results.filter((lead) => lead.user != null);
    } else if (effectiveAssignedFilter === false) {
      results = results.filter((lead) => lead.user == null);
    }

    const effectiveBillFilter = billFilter !== null ? billFilter : globalBillFilter;
    if (effectiveBillFilter === true) {
      results = results.filter((lead) => lead.billUri !== null);
    } else if (effectiveBillFilter === false) {
      results = results.filter((lead) => lead.billUri === null);
    }

    if (dateFrom) {
      results = results.filter((lead) => new Date(lead.createdAt) >= new Date(dateFrom));
    }
    if (dateTo) {
      results = results.filter((lead) => new Date(lead.createdAt) <= new Date(dateTo));
    }
    setFilteredLeads(results);
  }, [
    globalSearchTerm,
    globalAssignedFilter,
    globalBillFilter,
    dateFrom,
    dateTo,
    searchTerm,
    assignedFilter,
    billFilter,
    campaign.leads,
  ]);

  const handleCellClick = (e, leadId, column) => {
    const lead = filteredLeads.find((lead) => lead.id === leadId);
    setIsEditing(leadId);
    setEditableLead(lead);
  };

  const handleDeleteLead = async (uuid) => {
    const confirmDelete = confirm("¿Estás seguro de que quieres eliminar este lead?");
    if (!confirmDelete) return;

    const jwtToken = getCookie("factura-token");

    try {
      const response = await authFetch("DELETE", `leads/${uuid}`, {}, jwtToken);

      const responseData = await response.text();

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${responseData}`);
      }

      setFilteredLeads((prevLeads) => prevLeads.filter((lead) => lead.uuid !== uuid));
    } catch (error) {
      alert(`No se pudo eliminar el lead. ${error.message}`);
    }
  };

  if (!isVisible) {
    return null;
  }

  // Don't hide campaigns without leads - show them with empty state
  // if (filteredLeads.length === 0) {
  //   return null;
  // }

  return (
    <div className="p-4 bg-foreground text-black rounded-lg shadow-md mb-6">
      {/* Encabezado de la card */}
      <div className="flex flex-wrap items-center gap-2 w-full justify-between mb-2">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-black">{campaign.name}</h2>
          <div className="flex gap-2">
            <span
              className={`text-white px-2 py-1 rounded-md text-sm ${
                campaign.type === "Automatic" ? "bg-purple-500" : "bg-green-500"
              }`}
            >
              {campaign.type === "Automatic" ? "Automática" : campaign.type}
            </span>
            {campaign.source && (
              <span
                className={`px-2 py-1 rounded-md text-sm font-semibold ${
                  campaign.source === "Meta"
                    ? "bg-blue-500 text-white"
                    : campaign.source === "TikTok"
                    ? "bg-pink-500 text-white"
                    : campaign.source === "Landing"
                    ? "bg-secondary text-white"
                    : "bg-gray-500 text-white"
                }`}
              >
                {campaign.source}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={handleDeleteCampaign}
          disabled={campaign.uuid == "no-campaign-uuid"}
          className="p-2 text-red-500 rounded-full transition-colors 
                   hover:text-red-700 hover:bg-red-100 
                   disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          title={campaign.uuid == "no-campaign-uuid" ? "No se puede eliminar" : "Eliminar campaña"}
        >
          <FiTrash size={18} />
        </button>
      </div>

      {/* Barra de búsqueda */}
      <div className="w-full flex items-center mb-4">
        <div className="flex-grow relative">
          <FiSearch className="absolute top-3 left-3 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar en campaña"
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2 bg-gray-100 text-black rounded-full focus:outline-none focus:bg-white"
          />
        </div>
      </div>

      {/* Filtros */}
      <div className="w-full flex flex-wrap items-center mb-2 gap-4">
        <div className="flex items-center">
          <label className="mr-2 text-sm text-gray-600">Asignado:</label>
          <select
            value={assignedFilter === true ? "Si" : assignedFilter === false ? "No" : ""}
            onChange={handleAssignedFilterChange}
            className="px-2 py-1 bg-gray-100 text-black rounded-md focus:outline-none"
          >
            <option value="">Todos</option>
            <option value="Si">Sí</option>
            <option value="No">No</option>
          </select>
        </div>

        <div className="flex items-center">
          <label className="mr-2 text-sm text-gray-600">Con Factura:</label>
          <select
            value={billFilter === true ? "Si" : billFilter === false ? "No" : ""}
            onChange={handleBillFilterChange}
            className="px-2 py-1 bg-gray-100 text-black rounded-md focus:outline-none"
          >
            <option value="">Todos</option>
            <option value="Si">Sí</option>
            <option value="No">No</option>
          </select>
        </div>
      </div>

      {/* Tabla de leads con scroll interno */}
      <div className="overflow-x-auto max-h-[600px] overflow-y-auto mb-4">
        <table className="min-w-full bg-foreground text-black table-fixed">
          <thead className="bg-background">
            <tr>
              <th className="px-4 py-2 text-left min-w-36">Fecha</th>
              <th className="px-4 py-2 text-left min-w-44">Nombre</th>
              <th className="px-4 py-2 text-left min-w-36">Teléfono</th>
              <th className="px-4 py-2 text-left min-w-56">Agente</th>
              <th className="px-4 py-2 text-center">Docs</th>
              <th className="px-4 py-2 text-center"></th>
            </tr>
          </thead>
          <tbody>
            {filteredLeads.map((lead) => (
              <tr key={lead.id} className="bg-foreground hover:bg-background">
                <td
                  className="px-4 py-2 flex items-center cursor-pointer"
                  onClick={(e) => handleCellClick(e, lead.id, "createdAt")}
                >
                  {isEditing === lead.id ? (
                    <input
                      type="date"
                      name="createdAt"
                      value={
                        editableLead.createdAt
                          ? new Date(editableLead.createdAt).toISOString().split("T")[0]
                          : ""
                      }
                      onChange={handleInputChange}
                      onBlur={handleSaveChanges}
                      className="bg-gray-100 px-2 py-3 rounded-md text-center text-s w-full"
                    />
                  ) : (
                    new Date(lead.createdAt).toLocaleDateString()
                  )}
                </td>

                <td
                  className="px-4 py-2 items-center cursor-pointer"
                  onClick={(e) => handleCellClick(e, lead.id, "fullName")}
                >
                  {isEditing === lead.id ? (
                    <input
                      type="text"
                      name="fullName"
                      value={editableLead.fullName || ""}
                      onChange={handleInputChange}
                      onBlur={handleSaveChanges}
                      className="bg-gray-100 px-2 py-3 rounded-md text-s w-full"
                    />
                  ) : (
                    lead.fullName
                  )}
                </td>

                <td
                  className="px-4 py-2 cursor-pointer"
                  onClick={(e) => handleCellClick(e, lead.id, "phoneNumber")}
                >
                  {isEditing === lead.id ? (
                    <input
                      type="text"
                      name="phoneNumber"
                      value={editableLead.phoneNumber || ""}
                      onChange={handleInputChange}
                      onBlur={handleSaveChanges}
                      className="bg-gray-100 px-2 py-1 rounded-md text-s w-full"
                    />
                  ) : (
                    lead.phoneNumber
                  )}
                </td>

                <td
                  className="px-4 py-2 cursor-pointer"
                  onClick={(e) => handleCellClick(e, lead.id, "assignedUserName")}
                >
                  {isEditing === lead.id ? (
                    <>
                      <input
                        list="userOptions"
                        value={editableLead.assignedUserName || ""}
                        onChange={(e) => {
                          const selectedValue = e.target.value;
                          setEditableLead({
                            ...editableLead,
                            assignedUserName: selectedValue === "null" ? null : selectedValue,
                          });
                        }}
                        onFocus={(e) => (e.target.value = "")}
                        onBlur={(e) => {
                          const selectedValue = e.target.value;
                          const isValidOption = allUsers.some((user) => {
                            const userFullName = `${user.name} ${user.firstSurname} ${
                              user.secondSurname || ""
                            }`.trim();
                            return userFullName === selectedValue;
                          });

                          if (!isValidOption && selectedValue !== "No asignado") {
                            setEditableLead({
                              ...editableLead,
                              assignedUserName: "",
                            });
                          } else {
                            handleSaveChanges(e);
                          }
                        }}
                        className="bg-gray-100 px-2 py-1 rounded-md text-center text-s w-full"
                      />
                      <datalist id="userOptions">
                        <option value="null">No asignado</option>
                        {allUsers.map((user) => {
                          const userFullName = `${user.name} ${user.firstSurname} ${
                            user.secondSurname || ""
                          }`.trim();
                          return <option key={user.id} value={userFullName} />;
                        })}
                      </datalist>
                    </>
                  ) : (
                    lead.assignedUserName || "No asignado"
                  )}
                </td>

                <td className="px-4 py-2 text-center">
                  <button
                    onClick={() => setViewingLeadDocs(lead)}
                    className="p-1 text-blue-500 hover:text-blue-700"
                    title="Ver/Añadir documentos"
                  >
                    <FiPaperclip size={18} />
                  </button>
                </td>

                <td className="px-4 py-2 text-center cursor-pointer">
                  <button onClick={() => handleDeleteLead(lead.uuid)} className="text-red-500">
                    <FiTrash size={22} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Botones de acción */}
      <div className="flex justify-between items-center mt-4 flex-wrap gap-4">
        {/* Botón para abrir el modal de nuevo lead */}
        <button
          onClick={openNewLeadModal}
          className="text-red-500 flex items-center hover:text-red-700"
        >
          <FiPlus className="mr-2" />
          Lead
        </button>

        {!allLeadsFetched && filteredLeads.length > 9 && (
          <button
            onClick={fetchAllLeads}
            className="bg-blue-500 text-white px-4 py-2 rounded-full font-semibold hover:bg-blue-600"
          >
            Mostrar todos
          </button>
        )}

        {/* Botón de "Vincular a grupo" */}
        <div>
          <button
            className="text-white bg-yellow-300 px-4 py-2 rounded-full font-semibold hover:bg-yellow-400"
            onClick={handleOpenModal}
          >
            Vincular a grupo
          </button>

          <GroupLinkModal
            isOpen={isGroupLinkModalOpen}
            onClose={handleCloseModal}
            groupCampaigns={campaign.groupCampaigns || []}
            campaignId={campaign.id}
          />
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 lg:ml-72">
          <div className="bg-white p-4 rounded-lg shadow-lg w-[85%] max-w-5xl">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold">
                {editableLead.id ? "Editar Lead" : "Crear Nuevo Lead"}
              </h3>
              <button onClick={handleModalClose} className="text-gray-500">
                <FiX size={20} />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Fecha */}
              <div className="flex flex-col items-start">
                <label className="block text-xs font-medium">Fecha</label>
                <input
                  type="date"
                  name="createdAt"
                  value={
                    editableLead.createdAt
                      ? new Date(editableLead.createdAt).toISOString().split("T")[0]
                      : ""
                  }
                  onChange={handleInputChange}
                  className="bg-gray-100 px-2 py-1 rounded-md text-center text-xs w-full"
                />
              </div>

              {/* Nombre */}
              <div className="flex flex-col items-start">
                <label className="block text-xs font-medium">Nombre</label>
                <input
                  type="text"
                  name="fullName"
                  value={editableLead.fullName || ""}
                  onChange={handleInputChange}
                  className="bg-gray-100 px-2 py-1 rounded-md text-xs w-full"
                />
              </div>

              {/* Teléfono */}
              <div className="flex flex-col items-start">
                <label className="block text-xs font-medium">Teléfono</label>
                <input
                  type="text"
                  name="phoneNumber"
                  value={editableLead.phoneNumber || ""}
                  onChange={handleInputChange}
                  className="bg-gray-100 px-2 py-1 rounded-md text-xs w-full"
                />
              </div>

              {/* Factura */}
              <div className="flex flex-col items-start">
                <label className="block text-xs font-medium">Factura</label>
                {editableLead.billUri ? (
                  <a
                    href={`${editableLead.billUri}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-gray-100 px-2 py-1 rounded-md text-center text-xs text-blue-500 underline w-full"
                  >
                    Ver archivo
                  </a>
                ) : (
                  <div className="flex items-center">
                    <input
                      type="file"
                      name="billFile"
                      onChange={handleFileUpload}
                      className="bg-gray-100 rounded-md text-xs cursor-pointer"
                      style={{ width: "auto", maxWidth: "120px" }}
                    />
                  </div>
                )}
              </div>

              {/* Gestor */}
              <div className="flex flex-col items-start">
                <label className="block text-xs font-medium">Gestor</label>
                <select
                  value={editableLead.assignedUserName || ""}
                  onChange={(e) => {
                    const selectedValue = e.target.value;

                    setEditableLead({
                      ...editableLead,
                      assignedUserName: selectedValue === "null" ? null : selectedValue,
                    });
                  }}
                  className="bg-gray-100 px-2 py-1 rounded-md text-center text-xs w-full"
                >
                  <option value="null">No asignado</option>
                  {allUsers.map((user) => {
                    const userFullName = `${user.name} ${user.firstSurname} ${
                      user.secondSurname || ""
                    }`.trim();
                    return (
                      <option key={user.id} value={userFullName}>
                        {userFullName}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
            <div className={`flex mt-4 ${!editableLead.id ? "justify-center" : "justify-end"}`}>
              <button
                onClick={handleSaveChanges}
                className="bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600 text-sm"
              >
                Crear Lead
              </button>
            </div>
          </div>
        </div>
      )}

      {viewingLeadDocs && (
        <LeadDocumentsModal lead={viewingLeadDocs} onClose={() => setViewingLeadDocs(null)} />
      )}
    </div>
  );
}
