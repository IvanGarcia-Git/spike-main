"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import PageHeader from "@/components/page-header.component";

export default function Drive() {
  const [activeSection, setActiveSection] = useState("mi-unidad");
  const [carpetas, setCarpetas] = useState([]);
  const [archivos, setArchivos] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("grid"); // grid | list

  // Modals state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
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
      const [filesResponse, foldersResponse] = await Promise.all([
        fetch("/api/drive/files"),
        fetch("/api/drive/folders"),
      ]);

      const filesData = await filesResponse.json();
      const foldersData = await foldersResponse.json();

      if (filesResponse.ok) {
        setArchivos(filesData.files || []);
      }
      if (foldersResponse.ok) {
        setCarpetas(foldersData.folders || []);
      }
    } catch (error) {
      console.error("Error fetching drive data:", error);
    } finally {
      setLoading(false);
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
    setDeleteTarget({ type: 'file', id: file.id, nombre: file.nombre });
    setShowDeleteModal(true);
  };

  const handleDeleteFolder = (folder) => {
    setDeleteTarget({ type: 'folder', id: folder.id, nombre: folder.nombre });
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      if (deleteTarget.type === 'file') {
        const response = await fetch(`/api/drive/files?id=${deleteTarget.id}`, {
          method: "DELETE",
        });

        if (response.ok) {
          setArchivos(archivos.filter(a => a.id !== deleteTarget.id));
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
      <div className="p-6">
        <PageHeader title="Drive" />
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-500">Cargando archivos...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <PageHeader title="Drive" />

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
              </button>
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
              </button>
            </nav>

            {/* Storage Info */}
            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Almacenamiento
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  8.5 GB de 15 GB
                </span>
              </div>
              <div className="w-full h-2 neumorphic-card-inset rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: "57%" }}
                />
              </div>
            </div>
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
                  ? "Archivos Compartidos"
                  : "Archivos"}
              </h3>

              {filteredArchivos.length === 0 ? (
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
                      formatDate={formatDate}
                    />
                  ))}
                </div>
              )}
            </div>
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
function FileCard({ archivo, onDelete, onToggleDestacado, onRename, formatDate }) {
  return (
    <div className="neumorphic-card p-4 flex flex-col space-y-2 group hover:shadow-lg transition-shadow cursor-pointer">
      <div className="flex items-start justify-between">
        <span className="material-icons-outlined text-primary text-4xl">
          {archivo.icono}
        </span>
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
            onClick={(e) => {
              e.stopPropagation();
              onRename(archivo);
            }}
            className="p-1 text-slate-500 hover:text-primary transition-colors"
          >
            <span className="material-icons-outlined text-sm">edit</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(archivo);
            }}
            className="p-1 text-slate-500 hover:text-red-500 transition-colors"
          >
            <span className="material-icons-outlined text-sm">delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// File List Item Component (List View)
function FileListItem({ archivo, onDelete, onToggleDestacado, onRename, formatDate }) {
  return (
    <div className="neumorphic-card p-3 flex items-center space-x-4 group hover:shadow-lg transition-shadow cursor-pointer">
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
          onClick={(e) => {
            e.stopPropagation();
            onRename(archivo);
          }}
          className="p-1 text-slate-500 hover:text-primary transition-colors"
        >
          <span className="material-icons-outlined text-lg">edit</span>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(archivo);
          }}
          className="p-1 text-slate-500 hover:text-red-500 transition-colors"
        >
          <span className="material-icons-outlined text-lg">delete</span>
        </button>
      </div>
    </div>
  );
}
