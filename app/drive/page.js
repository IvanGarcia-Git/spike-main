"use client";

import { useState, useEffect, useMemo, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import TabPrice from "@/components/drive/TabPrice";

// Componente interno que usa useSearchParams
function DriveContent() {
  const searchParams = useSearchParams();
  const initialSection = searchParams.get("section");

  // Estado para controlar qué tab está activa - respeta el parámetro URL inicial
  const [activeTab, setActiveTab] = useState(initialSection === "precios" ? "precios" : "drive");

  return (
    <div className="p-6">
      {/* Header con Tabs */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4">
          Drive
        </h1>

        {/* Tabs de navegación */}
        <div className="flex space-x-2 border-b border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab("drive")}
            className={`px-4 py-3 font-medium transition-all border-b-2 -mb-px ${
              activeTab === "drive"
                ? "text-primary border-primary"
                : "text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            <span className="material-icons-outlined text-lg mr-2 align-middle">folder</span>
            Archivos
          </button>
          <button
            onClick={() => setActiveTab("precios")}
            className={`px-4 py-3 font-medium transition-all border-b-2 -mb-px ${
              activeTab === "precios"
                ? "text-primary border-primary"
                : "text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            <span className="material-icons-outlined text-lg mr-2 align-middle">attach_money</span>
            Precios por Compañía
          </button>
        </div>
      </div>

      {/* Contenido según tab activa */}
      {activeTab === "precios" ? (
        <TabPrice />
      ) : (
        <DriveFilesContent />
      )}
    </div>
  );
}

// Componente principal con Suspense
export default function Drive() {
  return (
    <Suspense fallback={
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="neumorphic-card p-8 rounded-xl text-center">
            <span className="material-icons-outlined text-5xl text-primary animate-spin">
              refresh
            </span>
            <p className="mt-4 text-slate-600 dark:text-slate-400">Cargando...</p>
          </div>
        </div>
      </div>
    }>
      <DriveContent />
    </Suspense>
  );
}

// Componente de archivos de Drive (contenido sin header principal)
function DriveFilesContent() {
  const [activeSection, setActiveSection] = useState("mi-unidad");
  const [carpetas, setCarpetas] = useState([]);
  const [archivos, setArchivos] = useState([]);
  const [archivosPapelera, setArchivosPapelera] = useState([]);
  const [archivosCompartidosConmigo, setArchivosCompartidosConmigo] = useState([]);
  const [archivosCompartidosPorMi, setArchivosCompartidosPorMi] = useState([]);
  const [usuariosDisponibles, setUsuariosDisponibles] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("grid"); // grid | list
  const [compartidoSubsection, setCompartidoSubsection] = useState("conmigo"); // conmigo | pormi

  // Modals state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showEmptyTrashModal, setShowEmptyTrashModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareTarget, setShareTarget] = useState(null); // archivo a compartir
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [sharePermission, setSharePermission] = useState("read");
  const [deleteTarget, setDeleteTarget] = useState(null); // { type: 'file' | 'folder', id, nombre }
  const [renameTarget, setRenameTarget] = useState(null);

  // Form state
  const [folderForm, setFolderForm] = useState({
    nombre: "",
    icono: "folder",
  });
  const [renameForm, setRenameForm] = useState("");

  // File upload
  const fileInputRef = useRef(null);
  const [uploadingFiles, setUploadingFiles] = useState([]);

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [filesResponse, foldersResponse, trashResponse, sharedWithMeResponse, sharedByMeResponse, usersResponse] = await Promise.all([
        fetch("/api/drive/files"),
        fetch("/api/drive/folders"),
        fetch("/api/drive/trash"),
        fetch("/api/drive/shares/with-me"),
        fetch("/api/drive/shares/by-me"),
        fetch("/api/drive/shares/users"),
      ]);

      const filesData = await filesResponse.json();
      const foldersData = await foldersResponse.json();
      const trashData = await trashResponse.json();
      const sharedWithMeData = await sharedWithMeResponse.json();
      const sharedByMeData = await sharedByMeResponse.json();
      const usersData = await usersResponse.json();

      if (filesResponse.ok) {
        setArchivos(filesData.files || []);
      }
      if (foldersResponse.ok) {
        setCarpetas(foldersData.folders || []);
      }
      if (trashResponse.ok) {
        setArchivosPapelera(trashData.files || []);
      }
      if (sharedWithMeResponse.ok) {
        setArchivosCompartidosConmigo(sharedWithMeData.files || []);
      }
      if (sharedByMeResponse.ok) {
        setArchivosCompartidosPorMi(sharedByMeData.files || []);
      }
      if (usersResponse.ok) {
        setUsuariosDisponibles(usersData.users || []);
      }
    } catch (error) {
      console.error("Error fetching drive data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrash = async () => {
    try {
      const response = await fetch("/api/drive/trash");
      const data = await response.json();
      if (response.ok) {
        setArchivosPapelera(data.files || []);
      }
    } catch (error) {
      console.error("Error fetching trash:", error);
    }
  };

  // Filter data based on active section and search
  const filteredCarpetas = useMemo(() => {
    let result = [...carpetas];

    if (searchTerm.trim()) {
      result = result.filter(c =>
        c.nombre.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return result;
  }, [carpetas, searchTerm]);

  const filteredArchivos = useMemo(() => {
    let result = [...archivos];

    // Filter by section
    if (activeSection === "destacados") {
      result = result.filter(a => a.destacado);
    } else if (activeSection === "recientes") {
      result = [...result].sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).slice(0, 10);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      result = result.filter(a =>
        a.nombre.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return result;
  }, [archivos, activeSection, searchTerm]);

  // Handlers
  const handleCreateFolder = () => {
    setFolderForm({
      nombre: "",
      icono: "folder",
    });
    setShowFolderModal(true);
  };

  const handleSaveFolder = async () => {
    try {
      if (!folderForm.nombre.trim()) {
        alert("El nombre es requerido");
        return;
      }

      const response = await fetch("/api/drive/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(folderForm),
      });

      if (response.ok) {
        const newFolder = await response.json();
        setCarpetas([...carpetas, newFolder]);
        setShowFolderModal(false);
      }
    } catch (error) {
      console.error("Error creating folder:", error);
      alert("Error al crear la carpeta");
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event) => {
    const files = Array.from(event.target.files || []);

    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);

      try {
        setUploadingFiles(prev => [...prev, file.name]);

        const response = await fetch("/api/drive/files", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const newFile = await response.json();
          setArchivos(prev => [...prev, newFile]);
        }
      } catch (error) {
        console.error("Error uploading file:", error);
        alert(`Error al subir ${file.name}`);
      } finally {
        setUploadingFiles(prev => prev.filter(name => name !== file.name));
      }
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDeleteFile = (file) => {
    setDeleteTarget({ type: 'file', id: file.id, uuid: file.uuid, nombre: file.nombre });
    setShowDeleteModal(true);
  };

  const handleDeleteFolder = (folder) => {
    setDeleteTarget({ type: 'folder', id: folder.id, nombre: folder.nombre });
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      if (deleteTarget.type === 'file') {
        const response = await fetch(`/api/drive/files?uuid=${deleteTarget.uuid}`, {
          method: "DELETE",
        });

        if (response.ok) {
          // Mover archivo a papelera (soft delete)
          const deletedFile = archivos.find(a => a.id === deleteTarget.id);
          setArchivos(archivos.filter(a => a.id !== deleteTarget.id));
          if (deletedFile) {
            setArchivosPapelera([...archivosPapelera, { ...deletedFile, deletedAt: new Date().toISOString() }]);
          }
        }
      } else if (deleteTarget.type === 'folder') {
        const response = await fetch(`/api/drive/folders?id=${deleteTarget.id}`, {
          method: "DELETE",
        });

        if (response.ok) {
          setCarpetas(carpetas.filter(c => c.id !== deleteTarget.id));
        }
      }

      setShowDeleteModal(false);
      setDeleteTarget(null);
    } catch (error) {
      console.error("Error deleting:", error);
      alert("Error al eliminar");
    }
  };

  const handleToggleDestacado = async (archivo) => {
    try {
      const response = await fetch("/api/drive/files", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: archivo.id,
          ...archivo,
          destacado: !archivo.destacado
        }),
      });

      if (response.ok) {
        const updatedFile = await response.json();
        setArchivos(archivos.map(a => a.id === archivo.id ? updatedFile : a));
      }
    } catch (error) {
      console.error("Error toggling destacado:", error);
    }
  };

  // Restaurar archivo de la papelera
  const handleRestoreFile = async (archivo) => {
    try {
      const response = await fetch(`/api/drive/restore?uuid=${archivo.uuid}`, {
        method: "POST",
      });

      if (response.ok) {
        // Mover de papelera a archivos
        setArchivosPapelera(archivosPapelera.filter(a => a.uuid !== archivo.uuid));
        // Recargar archivos para incluir el restaurado
        const filesResponse = await fetch("/api/drive/files");
        const filesData = await filesResponse.json();
        if (filesResponse.ok) {
          setArchivos(filesData.files || []);
        }
      }
    } catch (error) {
      console.error("Error restoring file:", error);
      alert("Error al restaurar el archivo");
    }
  };

  // Vaciar papelera
  const handleEmptyTrash = async () => {
    try {
      const response = await fetch("/api/drive/trash", {
        method: "DELETE",
      });

      if (response.ok) {
        setArchivosPapelera([]);
        setShowEmptyTrashModal(false);
      }
    } catch (error) {
      console.error("Error emptying trash:", error);
      alert("Error al vaciar la papelera");
    }
  };

  // Abrir modal de compartir
  const handleShareFile = (archivo) => {
    setShareTarget(archivo);
    setSelectedUsers([]);
    setSharePermission("read");
    setShowShareModal(true);
  };

  // Confirmar compartir archivo
  const handleConfirmShare = async () => {
    if (!shareTarget || selectedUsers.length === 0) {
      alert("Selecciona al menos un usuario");
      return;
    }

    try {
      const response = await fetch("/api/drive/shares", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileId: shareTarget.id,
          userIds: selectedUsers,
          permission: sharePermission,
        }),
      });

      if (response.ok) {
        setShowShareModal(false);
        setShareTarget(null);
        setSelectedUsers([]);
        // Refrescar datos de compartidos
        const sharedByMeResponse = await fetch("/api/drive/shares/by-me");
        const sharedByMeData = await sharedByMeResponse.json();
        if (sharedByMeResponse.ok) {
          setArchivosCompartidosPorMi(sharedByMeData.files || []);
        }
        alert("Archivo compartido correctamente");
      } else {
        const error = await response.json();
        alert(error.error || "Error al compartir el archivo");
      }
    } catch (error) {
      console.error("Error sharing file:", error);
      alert("Error al compartir el archivo");
    }
  };

  // Quitar compartición
  const handleUnshare = async (fileId, userId) => {
    try {
      const response = await fetch("/api/drive/shares", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileId,
          sharedWithUserId: userId,
        }),
      });

      if (response.ok) {
        // Refrescar datos de compartidos
        const sharedByMeResponse = await fetch("/api/drive/shares/by-me");
        const sharedByMeData = await sharedByMeResponse.json();
        if (sharedByMeResponse.ok) {
          setArchivosCompartidosPorMi(sharedByMeData.files || []);
        }
      }
    } catch (error) {
      console.error("Error unsharing file:", error);
    }
  };

  // Toggle selección de usuario para compartir
  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleRenameFile = (archivo) => {
    setRenameTarget({ type: 'file', id: archivo.id });
    setRenameForm(archivo.nombre);
    setShowRenameModal(true);
  };

  const handleRenameFolder = (carpeta) => {
    setRenameTarget({ type: 'folder', id: carpeta.id });
    setRenameForm(carpeta.nombre);
    setShowRenameModal(true);
  };

  const handleSaveRename = async () => {
    try {
      if (!renameForm.trim()) {
        alert("El nombre es requerido");
        return;
      }

      if (renameTarget.type === 'file') {
        const file = archivos.find(a => a.id === renameTarget.id);
        const response = await fetch("/api/drive/files", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: renameTarget.id,
            ...file,
            nombre: renameForm
          }),
        });

        if (response.ok) {
          const updatedFile = await response.json();
          setArchivos(archivos.map(a => a.id === renameTarget.id ? updatedFile : a));
        }
      } else if (renameTarget.type === 'folder') {
        const folder = carpetas.find(c => c.id === renameTarget.id);
        const response = await fetch("/api/drive/folders", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: renameTarget.id,
            ...folder,
            nombre: renameForm
          }),
        });

        if (response.ok) {
          const updatedFolder = await response.json();
          setCarpetas(carpetas.map(c => c.id === renameTarget.id ? updatedFolder : c));
        }
      }

      setShowRenameModal(false);
      setRenameTarget(null);
    } catch (error) {
      console.error("Error renaming:", error);
      alert("Error al renombrar");
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Cargando archivos...</div>
      </div>
    );
  }

  return (
    <div className="flex space-x-6">
        {/* Sidebar */}
        <div className="w-64 flex-shrink-0">
          <div className="neumorphic-card p-6 sticky top-6">
            {/* Upload Button */}
            <button
              onClick={handleUploadClick}
              className="w-full flex items-center justify-center p-3 rounded-lg bg-primary text-white font-semibold neumorphic-button mb-4 hover:bg-primary/90 transition-colors"
            >
              <span className="material-icons-outlined mr-2">upload_file</span>
              Subir Archivo
            </button>

            {/* New Folder Button */}
            <button
              onClick={handleCreateFolder}
              className="w-full flex items-center justify-center p-3 rounded-lg bg-primary/20 text-primary font-semibold neumorphic-button mb-6 hover:bg-primary/30 transition-colors"
            >
              <span className="material-icons-outlined mr-2">create_new_folder</span>
              Nueva Carpeta
            </button>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Navigation */}
            <nav className="space-y-1">
              <button
                className={`w-full flex items-center p-3 rounded-lg transition-colors ${
                  activeSection === "mi-unidad"
                    ? "bg-primary/10"
                    : "hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
                onClick={() => setActiveSection("mi-unidad")}
              >
                <span
                  className={`material-icons-outlined mr-3 ${
                    activeSection === "mi-unidad" ? "text-primary" : "text-slate-500"
                  }`}
                >
                  folder
                </span>
                <span
                  className={`font-medium ${
                    activeSection === "mi-unidad"
                      ? "text-primary"
                      : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  Mi Unidad
                </span>
              </button>
              <div>
                <button
                  className={`w-full flex items-center p-3 rounded-lg transition-colors ${
                    activeSection === "compartido"
                      ? "bg-primary/10"
                      : "hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                  onClick={() => setActiveSection("compartido")}
                >
                  <span
                    className={`material-icons-outlined mr-3 ${
                      activeSection === "compartido" ? "text-primary" : "text-slate-500"
                    }`}
                  >
                    group
                  </span>
                  <span
                    className={`font-medium ${
                      activeSection === "compartido"
                        ? "text-primary"
                        : "text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    Compartido
                  </span>
                  {(archivosCompartidosConmigo.length > 0 || archivosCompartidosPorMi.length > 0) && (
                    <span className="ml-auto bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-full">
                      {archivosCompartidosConmigo.length + archivosCompartidosPorMi.length}
                    </span>
                  )}
                </button>
                {activeSection === "compartido" && (
                  <div className="ml-6 mt-1 space-y-1">
                    <button
                      className={`w-full flex items-center p-2 rounded-lg text-sm transition-colors ${
                        compartidoSubsection === "conmigo"
                          ? "bg-primary/5 text-primary"
                          : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                      onClick={() => setCompartidoSubsection("conmigo")}
                    >
                      <span className="material-icons-outlined text-sm mr-2">person_add</span>
                      Conmigo
                      {archivosCompartidosConmigo.length > 0 && (
                        <span className="ml-auto text-xs bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                          {archivosCompartidosConmigo.length}
                        </span>
                      )}
                    </button>
                    <button
                      className={`w-full flex items-center p-2 rounded-lg text-sm transition-colors ${
                        compartidoSubsection === "pormi"
                          ? "bg-primary/5 text-primary"
                          : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                      onClick={() => setCompartidoSubsection("pormi")}
                    >
                      <span className="material-icons-outlined text-sm mr-2">share</span>
                      Por mí
                      {archivosCompartidosPorMi.length > 0 && (
                        <span className="ml-auto text-xs bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                          {archivosCompartidosPorMi.length}
                        </span>
                      )}
                    </button>
                  </div>
                )}
              </div>
              <button
                className={`w-full flex items-center p-3 rounded-lg transition-colors ${
                  activeSection === "recientes"
                    ? "bg-primary/10"
                    : "hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
                onClick={() => setActiveSection("recientes")}
              >
                <span
                  className={`material-icons-outlined mr-3 ${
                    activeSection === "recientes" ? "text-primary" : "text-slate-500"
                  }`}
                >
                  schedule
                </span>
                <span
                  className={`font-medium ${
                    activeSection === "recientes"
                      ? "text-primary"
                      : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  Recientes
                </span>
              </button>
              <button
                className={`w-full flex items-center p-3 rounded-lg transition-colors ${
                  activeSection === "destacados"
                    ? "bg-primary/10"
                    : "hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
                onClick={() => setActiveSection("destacados")}
              >
                <span
                  className={`material-icons-outlined mr-3 ${
                    activeSection === "destacados" ? "text-primary" : "text-slate-500"
                  }`}
                >
                  star
                </span>
                <span
                  className={`font-medium ${
                    activeSection === "destacados"
                      ? "text-primary"
                      : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  Destacados
                </span>
              </button>
              <button
                className={`w-full flex items-center p-3 rounded-lg transition-colors ${
                  activeSection === "papelera"
                    ? "bg-primary/10"
                    : "hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
                onClick={() => setActiveSection("papelera")}
              >
                <span
                  className={`material-icons-outlined mr-3 ${
                    activeSection === "papelera" ? "text-primary" : "text-slate-500"
                  }`}
                >
                  delete
                </span>
                <span
                  className={`font-medium ${
                    activeSection === "papelera"
                      ? "text-primary"
                      : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  Papelera
                </span>
                {archivosPapelera.length > 0 && (
                  <span className="ml-auto bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-xs px-2 py-0.5 rounded-full">
                    {archivosPapelera.length}
                  </span>
                )}
              </button>
            </nav>

            {/* Botón Vaciar Papelera - solo visible cuando papelera está activa */}
            {activeSection === "papelera" && archivosPapelera.length > 0 && (
              <button
                onClick={() => setShowEmptyTrashModal(true)}
                className="w-full mt-4 flex items-center justify-center p-3 rounded-lg bg-red-500/10 text-red-500 font-semibold hover:bg-red-500/20 transition-colors"
              >
                <span className="material-icons-outlined mr-2 text-lg">delete_forever</span>
                Vaciar Papelera
              </button>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Top Bar */}
          <div className="neumorphic-card p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center flex-1 max-w-md">
                <div className="relative w-full">
                  <span className="material-icons-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                    search
                  </span>
                  <input
                    className="neumorphic-card-inset w-full pl-10 pr-4 py-2 rounded-lg border-none focus:ring-2 focus:ring-primary bg-transparent text-slate-800 dark:text-slate-200"
                    placeholder="Buscar en Drive..."
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-lg neumorphic-button ${
                    viewMode === "grid" ? "active text-primary" : "text-slate-500"
                  }`}
                >
                  <span className="material-icons-outlined">grid_view</span>
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-lg neumorphic-button ${
                    viewMode === "list" ? "active text-primary" : "text-slate-500"
                  }`}
                >
                  <span className="material-icons-outlined">list</span>
                </button>
              </div>
            </div>
          </div>

          {/* Uploading Files Indicator */}
          {uploadingFiles.length > 0 && (
            <div className="neumorphic-card p-4 mb-6">
              <div className="flex items-center space-x-3">
                <div className="animate-spin">
                  <span className="material-icons-outlined text-primary">refresh</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    Subiendo archivos...
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {uploadingFiles.join(", ")}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="space-y-8">
            {/* Folders Section */}
            {activeSection === "mi-unidad" && filteredCarpetas.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
                  Carpetas
                </h3>
                {viewMode === "grid" ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {filteredCarpetas.map((carpeta) => (
                      <FolderCard
                        key={carpeta.id}
                        carpeta={carpeta}
                        onDelete={handleDeleteFolder}
                        onRename={handleRenameFolder}
                        formatDate={formatDate}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredCarpetas.map((carpeta) => (
                      <FolderListItem
                        key={carpeta.id}
                        carpeta={carpeta}
                        onDelete={handleDeleteFolder}
                        onRename={handleRenameFolder}
                        formatDate={formatDate}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Files Section */}
            <div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
                {activeSection === "mi-unidad"
                  ? "Archivos"
                  : activeSection === "recientes"
                  ? "Archivos Recientes"
                  : activeSection === "destacados"
                  ? "Archivos Destacados"
                  : activeSection === "compartido"
                  ? (compartidoSubsection === "conmigo" ? "Compartidos Conmigo" : "Compartidos Por Mí")
                  : activeSection === "papelera"
                  ? "Papelera"
                  : "Archivos"}
              </h3>

              {/* Contenido de Compartido */}
              {activeSection === "compartido" ? (
                compartidoSubsection === "conmigo" ? (
                  // Archivos compartidos conmigo
                  archivosCompartidosConmigo.length === 0 ? (
                    <div className="neumorphic-card p-8 text-center">
                      <span className="material-icons-outlined text-6xl text-slate-300 dark:text-slate-600 mb-4">
                        person_add
                      </span>
                      <p className="text-slate-500 dark:text-slate-400">
                        No hay archivos compartidos contigo
                      </p>
                    </div>
                  ) : viewMode === "grid" ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                      {archivosCompartidosConmigo.map((archivo) => (
                        <SharedWithMeFileCard
                          key={archivo.id}
                          archivo={archivo}
                          formatDate={formatDate}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {archivosCompartidosConmigo.map((archivo) => (
                        <SharedWithMeFileListItem
                          key={archivo.id}
                          archivo={archivo}
                          formatDate={formatDate}
                        />
                      ))}
                    </div>
                  )
                ) : (
                  // Archivos compartidos por mí
                  archivosCompartidosPorMi.length === 0 ? (
                    <div className="neumorphic-card p-8 text-center">
                      <span className="material-icons-outlined text-6xl text-slate-300 dark:text-slate-600 mb-4">
                        share
                      </span>
                      <p className="text-slate-500 dark:text-slate-400">
                        No has compartido ningún archivo
                      </p>
                      <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">
                        Usa el botón de compartir en tus archivos para comenzar
                      </p>
                    </div>
                  ) : viewMode === "grid" ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                      {archivosCompartidosPorMi.map((archivo) => (
                        <SharedByMeFileCard
                          key={archivo.id}
                          archivo={archivo}
                          onUnshare={handleUnshare}
                          formatDate={formatDate}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {archivosCompartidosPorMi.map((archivo) => (
                        <SharedByMeFileListItem
                          key={archivo.id}
                          archivo={archivo}
                          onUnshare={handleUnshare}
                          formatDate={formatDate}
                        />
                      ))}
                    </div>
                  )
                )
              ) : /* Contenido de Papelera */
              activeSection === "papelera" ? (
                archivosPapelera.length === 0 ? (
                  <div className="neumorphic-card p-8 text-center">
                    <span className="material-icons-outlined text-6xl text-slate-300 dark:text-slate-600 mb-4">
                      delete_outline
                    </span>
                    <p className="text-slate-500 dark:text-slate-400">
                      La papelera está vacía
                    </p>
                  </div>
                ) : viewMode === "grid" ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {archivosPapelera.map((archivo) => (
                      <TrashFileCard
                        key={archivo.id}
                        archivo={archivo}
                        onRestore={handleRestoreFile}
                        formatDate={formatDate}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {archivosPapelera.map((archivo) => (
                      <TrashFileListItem
                        key={archivo.id}
                        archivo={archivo}
                        onRestore={handleRestoreFile}
                        formatDate={formatDate}
                      />
                    ))}
                  </div>
                )
              ) : filteredArchivos.length === 0 ? (
                <div className="neumorphic-card p-8 text-center">
                  <span className="material-icons-outlined text-6xl text-slate-300 dark:text-slate-600 mb-4">
                    {activeSection === "destacados" ? "star_outline" : "folder_open"}
                  </span>
                  <p className="text-slate-500 dark:text-slate-400">
                    {searchTerm ? "No se encontraron archivos" : "No hay archivos aún"}
                  </p>
                  {!searchTerm && (
                    <button
                      onClick={handleUploadClick}
                      className="mt-4 neumorphic-button px-6 py-2 rounded-lg text-primary font-semibold"
                    >
                      Subir Primer Archivo
                    </button>
                  )}
                </div>
              ) : viewMode === "grid" ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {filteredArchivos.map((archivo) => (
                    <FileCard
                      key={archivo.id}
                      archivo={archivo}
                      onDelete={handleDeleteFile}
                      onToggleDestacado={handleToggleDestacado}
                      onRename={handleRenameFile}
                      onShare={handleShareFile}
                      formatDate={formatDate}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredArchivos.map((archivo) => (
                    <FileListItem
                      key={archivo.id}
                      archivo={archivo}
                      onDelete={handleDeleteFile}
                      onToggleDestacado={handleToggleDestacado}
                      onRename={handleRenameFile}
                      onShare={handleShareFile}
                      formatDate={formatDate}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

      {/* Folder Modal */}
      {showFolderModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="neumorphic-card p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                Nueva Carpeta
              </h2>
              <button
                onClick={() => setShowFolderModal(false)}
                className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              >
                <span className="material-icons-outlined">close</span>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={folderForm.nombre}
                  onChange={(e) => setFolderForm({ ...folderForm, nombre: e.target.value })}
                  className="neumorphic-card-inset w-full px-4 py-2 rounded-lg border-none focus:ring-2 focus:ring-primary bg-transparent text-slate-800 dark:text-slate-200"
                  placeholder="Nombre de la carpeta..."
                  autoFocus
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleSaveFolder}
                className="flex-1 neumorphic-button px-6 py-3 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90"
              >
                Crear Carpeta
              </button>
              <button
                onClick={() => setShowFolderModal(false)}
                className="flex-1 neumorphic-button px-6 py-3 rounded-lg text-slate-600 dark:text-slate-400 font-semibold"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="neumorphic-card p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                Confirmar Eliminación
              </h2>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              >
                <span className="material-icons-outlined">close</span>
              </button>
            </div>

            <p className="text-slate-600 dark:text-slate-400 mb-6">
              ¿Estás seguro de que deseas eliminar{" "}
              <strong>{deleteTarget?.nombre}</strong>?
              {deleteTarget?.type === 'folder' &&
                " Los archivos dentro de la carpeta no se eliminarán."}
            </p>

            <div className="flex space-x-3">
              <button
                onClick={confirmDelete}
                className="flex-1 neumorphic-button px-6 py-3 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600"
              >
                Eliminar
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 neumorphic-button px-6 py-3 rounded-lg text-slate-600 dark:text-slate-400 font-semibold"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Modal */}
      {showRenameModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="neumorphic-card p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                Renombrar
              </h2>
              <button
                onClick={() => setShowRenameModal(false)}
                className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              >
                <span className="material-icons-outlined">close</span>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Nuevo nombre *
                </label>
                <input
                  type="text"
                  value={renameForm}
                  onChange={(e) => setRenameForm(e.target.value)}
                  className="neumorphic-card-inset w-full px-4 py-2 rounded-lg border-none focus:ring-2 focus:ring-primary bg-transparent text-slate-800 dark:text-slate-200"
                  placeholder="Nuevo nombre..."
                  autoFocus
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleSaveRename}
                className="flex-1 neumorphic-button px-6 py-3 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90"
              >
                Renombrar
              </button>
              <button
                onClick={() => setShowRenameModal(false)}
                className="flex-1 neumorphic-button px-6 py-3 rounded-lg text-slate-600 dark:text-slate-400 font-semibold"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty Trash Confirmation Modal */}
      {showEmptyTrashModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="neumorphic-card p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                Vaciar Papelera
              </h2>
              <button
                onClick={() => setShowEmptyTrashModal(false)}
                className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              >
                <span className="material-icons-outlined">close</span>
              </button>
            </div>

            <div className="flex items-center space-x-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg mb-6">
              <span className="material-icons-outlined text-red-500 text-3xl">warning</span>
              <div>
                <p className="text-slate-700 dark:text-slate-300 font-medium">
                  Esta acción no se puede deshacer
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Se eliminarán permanentemente {archivosPapelera.length} archivo{archivosPapelera.length !== 1 ? 's' : ''}.
                </p>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleEmptyTrash}
                className="flex-1 neumorphic-button px-6 py-3 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600"
              >
                <span className="material-icons-outlined mr-2 text-lg align-middle">delete_forever</span>
                Vaciar Papelera
              </button>
              <button
                onClick={() => setShowEmptyTrashModal(false)}
                className="flex-1 neumorphic-button px-6 py-3 rounded-lg text-slate-600 dark:text-slate-400 font-semibold"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && shareTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="neumorphic-card p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                Compartir Archivo
              </h2>
              <button
                onClick={() => {
                  setShowShareModal(false);
                  setShareTarget(null);
                  setSelectedUsers([]);
                }}
                className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              >
                <span className="material-icons-outlined">close</span>
              </button>
            </div>

            {/* Archivo a compartir */}
            <div className="flex items-center space-x-3 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg mb-4">
              <span className="material-icons-outlined text-primary text-2xl">
                {shareTarget.icono || "insert_drive_file"}
              </span>
              <div>
                <p className="font-medium text-slate-800 dark:text-slate-200">
                  {shareTarget.nombre}
                </p>
                <p className="text-xs text-slate-500">{shareTarget.tamano}</p>
              </div>
            </div>

            {/* Seleccionar permisos */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Permisos
              </label>
              <div className="flex space-x-2">
                <button
                  onClick={() => setSharePermission("read")}
                  className={`flex-1 p-2 rounded-lg border-2 transition-colors ${
                    sharePermission === "read"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  <span className="material-icons-outlined text-sm mr-1">visibility</span>
                  Solo lectura
                </button>
                <button
                  onClick={() => setSharePermission("write")}
                  className={`flex-1 p-2 rounded-lg border-2 transition-colors ${
                    sharePermission === "write"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  <span className="material-icons-outlined text-sm mr-1">edit</span>
                  Lectura y escritura
                </button>
              </div>
            </div>

            {/* Lista de usuarios */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Seleccionar usuarios ({selectedUsers.length} seleccionados)
              </label>
              <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg">
                {usuariosDisponibles.length === 0 ? (
                  <p className="p-4 text-center text-slate-500">No hay usuarios disponibles</p>
                ) : (
                  usuariosDisponibles.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => toggleUserSelection(user.id)}
                      className={`flex items-center p-3 cursor-pointer transition-colors border-b border-slate-100 dark:border-slate-800 last:border-0 ${
                        selectedUsers.includes(user.id)
                          ? "bg-primary/10"
                          : "hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      <div className={`w-5 h-5 rounded border-2 mr-3 flex items-center justify-center ${
                        selectedUsers.includes(user.id)
                          ? "border-primary bg-primary"
                          : "border-slate-300 dark:border-slate-600"
                      }`}>
                        {selectedUsers.includes(user.id) && (
                          <span className="material-icons-outlined text-white text-sm">check</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-800 dark:text-slate-200 text-sm">
                          {user.name}
                        </p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleConfirmShare}
                disabled={selectedUsers.length === 0}
                className={`flex-1 neumorphic-button px-6 py-3 rounded-lg font-semibold ${
                  selectedUsers.length === 0
                    ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                    : "bg-primary text-white hover:bg-primary/90"
                }`}
              >
                <span className="material-icons-outlined mr-2 text-lg align-middle">share</span>
                Compartir
              </button>
              <button
                onClick={() => {
                  setShowShareModal(false);
                  setShareTarget(null);
                  setSelectedUsers([]);
                }}
                className="flex-1 neumorphic-button px-6 py-3 rounded-lg text-slate-600 dark:text-slate-400 font-semibold"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Folder Card Component (Grid View)
function FolderCard({ carpeta, onDelete, onRename, formatDate }) {
  return (
    <div className="neumorphic-card p-4 flex flex-col space-y-2 group hover:shadow-lg transition-shadow cursor-pointer">
      <div className="flex items-start justify-between">
        <span className="material-icons-outlined text-primary text-4xl">
          {carpeta.icono}
        </span>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRename(carpeta);
            }}
            className="p-1 text-slate-500 hover:text-primary transition-colors"
          >
            <span className="material-icons-outlined text-lg">edit</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(carpeta);
            }}
            className="p-1 text-slate-500 hover:text-red-500 transition-colors"
          >
            <span className="material-icons-outlined text-lg">delete</span>
          </button>
        </div>
      </div>
      <span className="text-sm font-medium text-slate-700 dark:text-slate-200 break-words line-clamp-2">
        {carpeta.nombre}
      </span>
      <span className="text-xs text-slate-400">
        {carpeta.archivosCount || 0} archivos
      </span>
    </div>
  );
}

// Folder List Item Component (List View)
function FolderListItem({ carpeta, onDelete, onRename, formatDate }) {
  return (
    <div className="neumorphic-card p-3 flex items-center space-x-4 group hover:shadow-lg transition-shadow cursor-pointer">
      <span className="material-icons-outlined text-primary text-2xl">
        {carpeta.icono}
      </span>
      <span className="text-sm font-medium text-slate-700 dark:text-slate-200 flex-1">
        {carpeta.nombre}
      </span>
      <span className="text-xs text-slate-400">{carpeta.archivosCount || 0} archivos</span>
      <span className="text-xs text-slate-400">{formatDate(carpeta.fecha)}</span>
      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRename(carpeta);
          }}
          className="p-1 text-slate-500 hover:text-primary transition-colors"
        >
          <span className="material-icons-outlined text-lg">edit</span>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(carpeta);
          }}
          className="p-1 text-slate-500 hover:text-red-500 transition-colors"
        >
          <span className="material-icons-outlined text-lg">delete</span>
        </button>
      </div>
    </div>
  );
}

// File Card Component (Grid View)
function FileCard({ archivo, onDelete, onToggleDestacado, onRename, onShare, formatDate }) {
  const isImage = archivo.tipo?.startsWith('image/');

  const handleDownload = (e) => {
    e.stopPropagation();
    if (archivo.uri) {
      const link = document.createElement('a');
      link.href = archivo.uri;
      link.download = archivo.nombre;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handlePreview = () => {
    if (archivo.uri) {
      window.open(archivo.uri, '_blank');
    }
  };

  return (
    <div
      className="neumorphic-card p-4 flex flex-col space-y-2 group hover:shadow-lg transition-shadow cursor-pointer"
      onClick={handlePreview}
    >
      <div className="flex items-start justify-between">
        {isImage && archivo.uri ? (
          <div className="w-full h-24 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 mb-2">
            <img
              src={archivo.uri}
              alt={archivo.nombre}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div className="hidden w-full h-full items-center justify-center">
              <span className="material-icons-outlined text-primary text-4xl">image</span>
            </div>
          </div>
        ) : (
          <span className="material-icons-outlined text-primary text-4xl">
            {archivo.icono}
          </span>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleDestacado(archivo);
          }}
          className="text-slate-400 hover:text-yellow-500 transition-colors"
        >
          <span className="material-icons-outlined text-lg">
            {archivo.destacado ? "star" : "star_outline"}
          </span>
        </button>
      </div>
      <span className="text-sm font-medium text-slate-700 dark:text-slate-200 break-words line-clamp-2">
        {archivo.nombre}
      </span>
      <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
        <span className="text-xs text-slate-400">{archivo.tamano}</span>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
          <button
            onClick={handleDownload}
            className="p-1 text-slate-500 hover:text-green-500 transition-colors"
            title="Descargar"
          >
            <span className="material-icons-outlined text-sm">download</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShare(archivo);
            }}
            className="p-1 text-slate-500 hover:text-primary transition-colors"
            title="Compartir"
          >
            <span className="material-icons-outlined text-sm">share</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRename(archivo);
            }}
            className="p-1 text-slate-500 hover:text-primary transition-colors"
            title="Renombrar"
          >
            <span className="material-icons-outlined text-sm">edit</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(archivo);
            }}
            className="p-1 text-slate-500 hover:text-red-500 transition-colors"
            title="Eliminar"
          >
            <span className="material-icons-outlined text-sm">delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// File List Item Component (List View)
function FileListItem({ archivo, onDelete, onToggleDestacado, onRename, onShare, formatDate }) {
  const handleDownload = (e) => {
    e.stopPropagation();
    if (archivo.uri) {
      const link = document.createElement('a');
      link.href = archivo.uri;
      link.download = archivo.nombre;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handlePreview = () => {
    if (archivo.uri) {
      window.open(archivo.uri, '_blank');
    }
  };

  return (
    <div
      className="neumorphic-card p-3 flex items-center space-x-4 group hover:shadow-lg transition-shadow cursor-pointer"
      onClick={handlePreview}
    >
      <span className="material-icons-outlined text-primary text-2xl">
        {archivo.icono}
      </span>
      <span className="text-sm font-medium text-slate-700 dark:text-slate-200 flex-1 truncate">
        {archivo.nombre}
      </span>
      <span className="text-xs text-slate-400">{formatDate(archivo.fecha)}</span>
      <span className="text-xs text-slate-400 w-20 text-right">{archivo.tamano}</span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleDestacado(archivo);
        }}
        className="text-slate-400 hover:text-yellow-500 transition-colors"
      >
        <span className="material-icons-outlined text-lg">
          {archivo.destacado ? "star" : "star_outline"}
        </span>
      </button>
      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
        <button
          onClick={handleDownload}
          className="p-1 text-slate-500 hover:text-green-500 transition-colors"
          title="Descargar"
        >
          <span className="material-icons-outlined text-lg">download</span>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onShare(archivo);
          }}
          className="p-1 text-slate-500 hover:text-primary transition-colors"
          title="Compartir"
        >
          <span className="material-icons-outlined text-lg">share</span>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRename(archivo);
          }}
          className="p-1 text-slate-500 hover:text-primary transition-colors"
          title="Renombrar"
        >
          <span className="material-icons-outlined text-lg">edit</span>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(archivo);
          }}
          className="p-1 text-slate-500 hover:text-red-500 transition-colors"
          title="Eliminar"
        >
          <span className="material-icons-outlined text-lg">delete</span>
        </button>
      </div>
    </div>
  );
}

// Trash File Card Component (Grid View)
function TrashFileCard({ archivo, onRestore, formatDate }) {
  // Determinar icono basado en mimetype
  const getFileIcon = (mimetype) => {
    if (!mimetype) return "insert_drive_file";
    if (mimetype.startsWith("image/")) return "image";
    if (mimetype.includes("pdf")) return "picture_as_pdf";
    if (mimetype.includes("spreadsheet") || mimetype.includes("excel")) return "table_chart";
    if (mimetype.includes("audio")) return "audio_file";
    return "insert_drive_file";
  };

  return (
    <div className="neumorphic-card p-4 flex flex-col space-y-2 group hover:shadow-lg transition-shadow opacity-75">
      <div className="flex items-start justify-between">
        <span className="material-icons-outlined text-slate-400 text-4xl">
          {archivo.icono || getFileIcon(archivo.mimetype)}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRestore(archivo);
          }}
          className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-green-500 transition-all"
          title="Restaurar"
        >
          <span className="material-icons-outlined text-lg">restore</span>
        </button>
      </div>
      <span className="text-sm font-medium text-slate-500 dark:text-slate-400 break-words line-clamp-2">
        {archivo.nombre || archivo.name}
      </span>
      <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
        <span className="text-xs text-slate-400">{archivo.tamano || formatFileSize(archivo.size)}</span>
        <span className="text-xs text-red-400">
          {archivo.deletedAt ? formatDate(archivo.deletedAt) : "Eliminado"}
        </span>
      </div>
    </div>
  );
}

// Trash File List Item Component (List View)
function TrashFileListItem({ archivo, onRestore, formatDate }) {
  // Determinar icono basado en mimetype
  const getFileIcon = (mimetype) => {
    if (!mimetype) return "insert_drive_file";
    if (mimetype.startsWith("image/")) return "image";
    if (mimetype.includes("pdf")) return "picture_as_pdf";
    if (mimetype.includes("spreadsheet") || mimetype.includes("excel")) return "table_chart";
    if (mimetype.includes("audio")) return "audio_file";
    return "insert_drive_file";
  };

  return (
    <div className="neumorphic-card p-3 flex items-center space-x-4 group hover:shadow-lg transition-shadow opacity-75">
      <span className="material-icons-outlined text-slate-400 text-2xl">
        {archivo.icono || getFileIcon(archivo.mimetype)}
      </span>
      <span className="text-sm font-medium text-slate-500 dark:text-slate-400 flex-1 truncate">
        {archivo.nombre || archivo.name}
      </span>
      <span className="text-xs text-red-400">
        Eliminado: {archivo.deletedAt ? formatDate(archivo.deletedAt) : "-"}
      </span>
      <span className="text-xs text-slate-400 w-20 text-right">
        {archivo.tamano || formatFileSize(archivo.size)}
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRestore(archivo);
        }}
        className="opacity-0 group-hover:opacity-100 p-2 text-slate-500 hover:text-green-500 transition-all flex items-center space-x-1"
        title="Restaurar"
      >
        <span className="material-icons-outlined text-lg">restore</span>
        <span className="text-sm">Restaurar</span>
      </button>
    </div>
  );
}

// Helper function for file size
function formatFileSize(bytes) {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

// Shared With Me File Card Component (Grid View)
function SharedWithMeFileCard({ archivo, formatDate }) {
  const handleDownload = (e) => {
    e.stopPropagation();
    if (archivo.uri) {
      const link = document.createElement('a');
      link.href = archivo.uri;
      link.download = archivo.nombre;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handlePreview = () => {
    if (archivo.uri) {
      window.open(archivo.uri, '_blank');
    }
  };

  return (
    <div
      className="neumorphic-card p-4 flex flex-col space-y-2 group hover:shadow-lg transition-shadow cursor-pointer"
      onClick={handlePreview}
    >
      <div className="flex items-start justify-between">
        <span className="material-icons-outlined text-primary text-4xl">
          {archivo.icono || "insert_drive_file"}
        </span>
        <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded">
          {archivo.permiso === "write" ? "Editar" : "Solo ver"}
        </span>
      </div>
      <span className="text-sm font-medium text-slate-700 dark:text-slate-200 break-words line-clamp-2">
        {archivo.nombre}
      </span>
      <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
        <p className="text-xs text-slate-400">
          Compartido por: <span className="text-slate-600 dark:text-slate-300">{archivo.compartidoPor || archivo.propietario}</span>
        </p>
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-slate-400">{archivo.tamano}</p>
          <button
            onClick={handleDownload}
            className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-green-500 transition-all"
            title="Descargar"
          >
            <span className="material-icons-outlined text-sm">download</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// Shared With Me File List Item Component (List View)
function SharedWithMeFileListItem({ archivo, formatDate }) {
  const handleDownload = (e) => {
    e.stopPropagation();
    if (archivo.uri) {
      const link = document.createElement('a');
      link.href = archivo.uri;
      link.download = archivo.nombre;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handlePreview = () => {
    if (archivo.uri) {
      window.open(archivo.uri, '_blank');
    }
  };

  return (
    <div
      className="neumorphic-card p-3 flex items-center space-x-4 group hover:shadow-lg transition-shadow cursor-pointer"
      onClick={handlePreview}
    >
      <span className="material-icons-outlined text-primary text-2xl">
        {archivo.icono || "insert_drive_file"}
      </span>
      <span className="text-sm font-medium text-slate-700 dark:text-slate-200 flex-1 truncate">
        {archivo.nombre}
      </span>
      <span className="text-xs text-slate-500">
        de {archivo.compartidoPor || archivo.propietario}
      </span>
      <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded">
        {archivo.permiso === "write" ? "Editar" : "Solo ver"}
      </span>
      <span className="text-xs text-slate-400 w-20 text-right">{archivo.tamano}</span>
      <button
        onClick={handleDownload}
        className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-green-500 transition-all"
        title="Descargar"
      >
        <span className="material-icons-outlined text-lg">download</span>
      </button>
    </div>
  );
}

// Shared By Me File Card Component (Grid View)
function SharedByMeFileCard({ archivo, onUnshare, formatDate }) {
  const handleDownload = (e) => {
    e.stopPropagation();
    if (archivo.uri) {
      const link = document.createElement('a');
      link.href = archivo.uri;
      link.download = archivo.nombre;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handlePreview = () => {
    if (archivo.uri) {
      window.open(archivo.uri, '_blank');
    }
  };

  return (
    <div
      className="neumorphic-card p-4 flex flex-col space-y-2 group hover:shadow-lg transition-shadow cursor-pointer"
      onClick={handlePreview}
    >
      <div className="flex items-start justify-between">
        <span className="material-icons-outlined text-primary text-4xl">
          {archivo.icono || "insert_drive_file"}
        </span>
        <div className="flex items-center space-x-1">
          <button
            onClick={handleDownload}
            className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-green-500 transition-all"
            title="Descargar"
          >
            <span className="material-icons-outlined text-sm">download</span>
          </button>
          <span className="material-icons-outlined text-green-500 text-lg" title="Compartido">
            share
          </span>
        </div>
      </div>
      <span className="text-sm font-medium text-slate-700 dark:text-slate-200 break-words line-clamp-2">
        {archivo.nombre}
      </span>
      <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
        <p className="text-xs text-slate-400 mb-1">Compartido con:</p>
        <div className="flex flex-wrap gap-1">
          {archivo.compartidoCon?.slice(0, 3).map((user, idx) => (
            <span
              key={idx}
              className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full flex items-center"
            >
              {user.name || user.email}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onUnshare(archivo.id, user.userId);
                }}
                className="ml-1 text-slate-400 hover:text-red-500"
                title="Quitar acceso"
              >
                <span className="material-icons-outlined text-xs">close</span>
              </button>
            </span>
          ))}
          {archivo.compartidoCon?.length > 3 && (
            <span className="text-xs text-slate-500">+{archivo.compartidoCon.length - 3} más</span>
          )}
        </div>
      </div>
    </div>
  );
}

// Shared By Me File List Item Component (List View)
function SharedByMeFileListItem({ archivo, onUnshare, formatDate }) {
  const handleDownload = (e) => {
    e.stopPropagation();
    if (archivo.uri) {
      const link = document.createElement('a');
      link.href = archivo.uri;
      link.download = archivo.nombre;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handlePreview = () => {
    if (archivo.uri) {
      window.open(archivo.uri, '_blank');
    }
  };

  return (
    <div
      className="neumorphic-card p-3 flex items-center space-x-4 group hover:shadow-lg transition-shadow cursor-pointer"
      onClick={handlePreview}
    >
      <span className="material-icons-outlined text-primary text-2xl">
        {archivo.icono || "insert_drive_file"}
      </span>
      <span className="text-sm font-medium text-slate-700 dark:text-slate-200 flex-1 truncate">
        {archivo.nombre}
      </span>
      <div className="flex items-center space-x-2">
        <span className="text-xs text-slate-500">Compartido con:</span>
        <div className="flex items-center space-x-1">
          {archivo.compartidoCon?.slice(0, 2).map((user, idx) => (
            <span
              key={idx}
              className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full flex items-center"
            >
              {user.name || user.email}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onUnshare(archivo.id, user.userId);
                }}
                className="ml-1 text-slate-400 hover:text-red-500"
                title="Quitar acceso"
              >
                <span className="material-icons-outlined text-xs">close</span>
              </button>
            </span>
          ))}
          {archivo.compartidoCon?.length > 2 && (
            <span className="text-xs text-slate-500">+{archivo.compartidoCon.length - 2}</span>
          )}
        </div>
      </div>
      <span className="text-xs text-slate-400 w-20 text-right">{archivo.tamano}</span>
      <button
        onClick={handleDownload}
        className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-green-500 transition-all"
        title="Descargar"
      >
        <span className="material-icons-outlined text-lg">download</span>
      </button>
    </div>
  );
}
