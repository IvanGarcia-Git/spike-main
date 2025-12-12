"use client";
import React, { useState, useEffect, useRef } from "react";
import { getCookie } from "cookies-next";
import { authFetch, authGetFetch } from "@/helpers/server-fetch.helper";
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
      <div className="neumorphic-card p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            Documentos de: {lead.fullName}
          </h3>
          <button
            onClick={onClose}
            className="neumorphic-button p-2 rounded-lg transition-all hover:shadow-neumorphic-inset-light dark:hover:shadow-neumorphic-inset-dark"
          >
            <span className="material-icons-outlined">close</span>
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
            className="w-full neumorphic-button bg-primary text-white px-4 py-3 rounded-lg font-semibold hover:bg-primary-dark disabled:opacity-50 transition-all"
          >
            {isUploading ? "Subiendo..." : "Subir Nuevos Documentos"}
          </button>
        </div>
        <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
          {isLoading ? (
            <p className="text-center text-slate-600 dark:text-slate-400 py-4">Cargando documentos...</p>
          ) : documents.length > 0 ? (
            documents.map((doc) => (
              <div
                key={doc.uuid}
                className="neumorphic-card-inset flex justify-between items-center p-3 rounded-lg"
              >
                <span className="truncate pr-4 text-slate-800 dark:text-slate-100">{doc.originalName}</span>
                <button
                  onClick={() => handleDownload(doc.uuid)}
                  className="neumorphic-button p-2 rounded-lg text-primary transition-all"
                  title={`Descargar ${doc.originalName}`}
                >
                  <span className="material-icons-outlined">download</span>
                </button>
              </div>
            ))
          ) : (
            <p className="text-center text-slate-500 dark:text-slate-400 py-4">No hay documentos para este lead.</p>
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
        const responseData = await response.json();

        if (editableLead.id) {
          // Actualizar lead existente
          setFilteredLeads((prevLeads) =>
            prevLeads.map((lead) =>
              lead.id === editableLead.id ? { ...lead, ...editableLead } : lead
            )
          );
        } else {
          // Añadir nuevo lead a la lista
          setFilteredLeads((prevLeads) => [responseData, ...prevLeads]);
        }

        setIsEditing(null);
        handleModalClose();
        alert(editableLead.id ? "Lead actualizado correctamente" : "Lead creado correctamente");
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.message || "Error al guardar el lead");
      }
    } catch (error) {
      console.error("Error enviando la solicitud:", error);
      alert("Error de conexión al guardar el lead");
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

  return (
    <div className="neumorphic-card p-6 mb-6">
      {/* Encabezado de la card */}
      <div className="flex flex-wrap items-center gap-3 justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{campaign.name}</h2>
          <div className="flex gap-2 flex-wrap">
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                campaign.type === "Automatic"
                  ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                  : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400"
              }`}
            >
              {campaign.type === "Automatic" ? "Auto" : "Manual"}
            </span>
            {campaign.source && (
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  campaign.source === "Meta"
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    : campaign.source === "TikTok"
                    ? "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400"
                    : campaign.source === "Landing"
                    ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                    : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400"
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
          className="neumorphic-button p-2 rounded-lg text-red-500 transition-all hover:shadow-neumorphic-inset-light dark:hover:shadow-neumorphic-inset-dark disabled:opacity-40 disabled:cursor-not-allowed"
          title={campaign.uuid == "no-campaign-uuid" ? "No se puede eliminar" : "Eliminar campaña"}
        >
          <span className="material-icons-outlined">delete</span>
        </button>
      </div>

      {/* Barra de búsqueda local */}
      <div className="relative mb-4">
        <span className="material-icons-outlined absolute top-3 left-3 text-slate-400">search</span>
        <input
          type="text"
          placeholder="Buscar en campaña"
          value={searchTerm}
          onChange={handleSearchChange}
          className="w-full pl-10 pr-4 py-3 neumorphic-card-inset bg-transparent text-slate-800 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Filtros locales */}
      <div className="flex flex-wrap items-center mb-4 gap-4">
        <div className="flex items-center">
          <label className="mr-2 text-sm text-slate-600 dark:text-slate-400">Asignado:</label>
          <select
            value={assignedFilter === true ? "Si" : assignedFilter === false ? "No" : ""}
            onChange={handleAssignedFilterChange}
            className="px-3 py-2 neumorphic-card-inset bg-transparent text-slate-800 dark:text-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Todos</option>
            <option value="Si">Sí</option>
            <option value="No">No</option>
          </select>
        </div>

        <div className="flex items-center">
          <label className="mr-2 text-sm text-slate-600 dark:text-slate-400">Con Factura:</label>
          <select
            value={billFilter === true ? "Si" : billFilter === false ? "No" : ""}
            onChange={handleBillFilterChange}
            className="px-3 py-2 neumorphic-card-inset bg-transparent text-slate-800 dark:text-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Todos</option>
            <option value="Si">Sí</option>
            <option value="No">No</option>
          </select>
        </div>
      </div>

      {/* Tabla de leads con scroll interno */}
      <div className="overflow-x-auto max-h-[600px] overflow-y-auto mb-4 neumorphic-card-inset rounded-lg">
        <table className="min-w-full text-slate-800 dark:text-slate-100 table-fixed">
          <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-background-light dark:bg-background-dark sticky top-0">
            <tr>
              <th className="p-3 text-left min-w-36">Fecha</th>
              <th className="p-3 text-left min-w-44">Nombre</th>
              <th className="p-3 text-left min-w-36">Teléfono</th>
              <th className="p-3 text-left min-w-56">Agente</th>
              <th className="p-3 text-center">Docs</th>
              <th className="p-3 text-center"></th>
            </tr>
          </thead>
          <tbody>
            {filteredLeads.map((lead) => (
              <tr key={lead.id} className="table-row-divider hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td
                  className="p-3 cursor-pointer text-slate-600 dark:text-slate-400"
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
                      className="neumorphic-card-inset px-3 py-2 rounded-lg text-center text-sm w-full bg-transparent"
                    />
                  ) : (
                    new Date(lead.createdAt).toLocaleDateString()
                  )}
                </td>

                <td
                  className="p-3 cursor-pointer font-medium text-slate-800 dark:text-slate-200"
                  onClick={(e) => handleCellClick(e, lead.id, "fullName")}
                >
                  {isEditing === lead.id ? (
                    <input
                      type="text"
                      name="fullName"
                      value={editableLead.fullName || ""}
                      onChange={handleInputChange}
                      onBlur={handleSaveChanges}
                      className="neumorphic-card-inset px-3 py-2 rounded-lg text-sm w-full bg-transparent"
                    />
                  ) : (
                    lead.fullName
                  )}
                </td>

                <td
                  className="p-3 cursor-pointer text-slate-600 dark:text-slate-400"
                  onClick={(e) => handleCellClick(e, lead.id, "phoneNumber")}
                >
                  {isEditing === lead.id ? (
                    <input
                      type="text"
                      name="phoneNumber"
                      value={editableLead.phoneNumber || ""}
                      onChange={handleInputChange}
                      onBlur={handleSaveChanges}
                      className="neumorphic-card-inset px-3 py-2 rounded-lg text-sm w-full bg-transparent"
                    />
                  ) : (
                    lead.phoneNumber
                  )}
                </td>

                <td
                  className="p-3 cursor-pointer text-slate-600 dark:text-slate-400"
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
                        className="neumorphic-card-inset px-3 py-2 rounded-lg text-center text-sm w-full bg-transparent"
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

                <td className="p-3 text-center">
                  <button
                    onClick={() => setViewingLeadDocs(lead)}
                    className="w-8 h-8 rounded-lg neumorphic-button flex items-center justify-center"
                    title="Ver/Añadir documentos"
                  >
                    <span className="material-icons-outlined text-primary text-sm">attach_file</span>
                  </button>
                </td>

                <td className="p-3 text-center">
                  <button
                    onClick={() => handleDeleteLead(lead.uuid)}
                    className="w-8 h-8 rounded-lg neumorphic-button flex items-center justify-center"
                  >
                    <span className="material-icons-outlined text-red-500 text-sm">delete</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Botones de acción */}
      <div className="flex justify-between items-center mt-6 flex-wrap gap-4">
        <button
          onClick={openNewLeadModal}
          className="neumorphic-button flex items-center text-primary font-semibold px-4 py-2 rounded-lg transition-all"
        >
          <span className="material-icons-outlined mr-2">add</span>
          Nuevo Lead
        </button>

        {!allLeadsFetched && filteredLeads.length > 9 && (
          <button
            onClick={fetchAllLeads}
            className="neumorphic-button bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-dark transition-all"
          >
            Mostrar todos
          </button>
        )}

        <button
          className="neumorphic-button bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary/90 transition-all flex items-center gap-2"
          onClick={handleOpenModal}
        >
          <span className="material-icons-outlined text-sm">group_add</span>
          Vincular a grupo
        </button>

        <GroupLinkModal
          isOpen={isGroupLinkModalOpen}
          onClose={handleCloseModal}
          groupCampaigns={campaign.groupCampaigns || []}
          campaignId={campaign.id}
        />
      </div>

      {/* Modal de crear/editar lead */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="modal-card p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                {editableLead.id ? "Editar Lead" : "Nuevo Lead"}
              </h2>
              <button
                onClick={handleModalClose}
                className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
              >
                <span className="material-icons-outlined">close</span>
              </button>
            </div>

            {/* Formulario */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nombre */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Nombre</label>
                  <input
                    type="text"
                    name="fullName"
                    placeholder="Nombre completo"
                    value={editableLead.fullName || ""}
                    onChange={handleInputChange}
                    className="w-full neumorphic-card-inset px-4 py-3 rounded-lg border-none focus:outline-none bg-transparent text-slate-800 dark:text-slate-200"
                  />
                </div>

                {/* Teléfono */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Teléfono</label>
                  <input
                    type="text"
                    name="phoneNumber"
                    placeholder="Número de teléfono"
                    value={editableLead.phoneNumber || ""}
                    onChange={handleInputChange}
                    className="w-full neumorphic-card-inset px-4 py-3 rounded-lg border-none focus:outline-none bg-transparent text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Fecha */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Fecha</label>
                  <input
                    type="date"
                    name="createdAt"
                    value={
                      editableLead.createdAt
                        ? new Date(editableLead.createdAt).toISOString().split("T")[0]
                        : ""
                    }
                    onChange={handleInputChange}
                    className="w-full neumorphic-card-inset px-4 py-3 rounded-lg border-none focus:outline-none bg-transparent text-slate-800 dark:text-slate-200"
                  />
                </div>

                {/* Gestor */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Gestor</label>
                  <select
                    value={editableLead.assignedUserName || ""}
                    onChange={(e) => {
                      const selectedValue = e.target.value;
                      setEditableLead({
                        ...editableLead,
                        assignedUserName: selectedValue === "null" ? null : selectedValue,
                      });
                    }}
                    className="w-full neumorphic-card-inset px-4 py-3 rounded-lg border-none focus:outline-none bg-transparent text-slate-800 dark:text-slate-200"
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

                {/* Factura */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Documento</label>
                  {editableLead.billUri ? (
                    <a
                      href={`${editableLead.billUri}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 neumorphic-card-inset px-4 py-3 rounded-lg text-primary font-medium"
                    >
                      <span className="material-icons-outlined text-sm">description</span>
                      Ver archivo
                    </a>
                  ) : (
                    <div className="neumorphic-card-inset px-4 py-3 rounded-lg">
                      <input
                        type="file"
                        name="billFile"
                        onChange={handleFileUpload}
                        className="text-sm text-slate-600 dark:text-slate-400 cursor-pointer w-full file:mr-3 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Botones */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSaveChanges}
                className="flex-1 neumorphic-button bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
              >
                {editableLead.id ? "Guardar Cambios" : "Crear Lead"}
              </button>
              <button
                onClick={handleModalClose}
                className="flex-1 neumorphic-button px-6 py-3 rounded-lg text-slate-600 dark:text-slate-400 font-semibold"
              >
                Cancelar
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
