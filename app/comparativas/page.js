"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getCookie } from "cookies-next";
import NuevaComparativaModal from "@/components/comparativas/nueva-comparativa.modal";
import BaseModal, { ModalButton, ModalInput, ModalActions } from "@/components/base-modal.component";
import {
  getRecentComparativas,
  deleteComparativa,
  updateComparativa,
  getComparativaById,
} from "@/helpers/server-fetch.helper";

export default function ComparativasPage() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [comparativas, setComparativas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const dropdownRef = useRef(null);

  // Modal states
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedComparativa, setSelectedComparativa] = useState(null);
  const [newName, setNewName] = useState("");

  // Load comparativas from backend
  useEffect(() => {
    loadComparativas();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdownId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const loadComparativas = async () => {
    setIsLoading(true);
    try {
      const token = getCookie("factura-token");
      if (!token) {
        console.warn("No token found");
        setIsLoading(false);
        return;
      }

      const response = await getRecentComparativas(20, token);
      if (response.ok) {
        const data = await response.json();
        setComparativas(data);
      } else {
        console.error("Error loading comparativas:", response.status);
      }
    } catch (error) {
      console.error("Error loading comparativas:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    const diffMonths = Math.floor(diffDays / 30);

    if (diffMins < 1) return "hace unos segundos";
    if (diffMins < 60) return `hace ${diffMins} minutos`;
    if (diffHours < 24) return `hace ${diffHours} horas`;
    if (diffDays < 30) return `hace ${diffDays} días`;
    if (diffMonths < 12) return `hace ${diffMonths} ${diffMonths === 1 ? "mes" : "meses"}`;
    return `hace más de 1 año`;
  };

  const handleDropdownToggle = (id, event) => {
    event.stopPropagation();
    setOpenDropdownId(openDropdownId === id ? null : id);
  };

  // Action handlers
  const handleExport = async (comparativa) => {
    setOpenDropdownId(null);
    try {
      const token = getCookie("factura-token");
      const response = await getComparativaById(comparativa.id, token);
      if (response.ok) {
        const fullData = await response.json();
        // Store data for PDF generation and navigate to personalizada page
        sessionStorage.setItem("pdfDataForGeneration", JSON.stringify({
          clientName: fullData.clientName,
          comparisonType: fullData.comparisonType,
          customerType: fullData.customerType,
          tariffType: fullData.tariffType,
          calculatedNewPrice: fullData.calculatedNewPrice,
          calculatedOldPrice: fullData.calculatedOldPrice,
          savings: fullData.savings,
          potencias: fullData.potencias,
          energias: fullData.energias,
          numDias: fullData.numDias,
        }));
        sessionStorage.setItem("autoDownloadPDF", "true");
        router.push("/comparativas/personalizada");
      }
    } catch (error) {
      console.error("Error exporting comparativa:", error);
    }
  };

  const handleRename = (comparativa) => {
    setOpenDropdownId(null);
    setSelectedComparativa(comparativa);
    setNewName(comparativa.clientName);
    setIsRenameModalOpen(true);
  };

  const handleRenameSubmit = async () => {
    if (!selectedComparativa || !newName.trim()) return;

    try {
      const token = getCookie("factura-token");
      const response = await updateComparativa(
        selectedComparativa.id,
        { clientName: newName.trim() },
        token
      );

      if (response.ok) {
        // Update local state
        setComparativas((prev) =>
          prev.map((c) =>
            c.id === selectedComparativa.id
              ? { ...c, clientName: newName.trim() }
              : c
          )
        );
        setIsRenameModalOpen(false);
        setSelectedComparativa(null);
        setNewName("");
      } else {
        console.error("Error renaming comparativa:", response.status);
      }
    } catch (error) {
      console.error("Error renaming comparativa:", error);
    }
  };

  const handleEdit = async (comparativa) => {
    setOpenDropdownId(null);
    try {
      const token = getCookie("factura-token");
      const response = await getComparativaById(comparativa.id, token);
      if (response.ok) {
        const fullData = await response.json();
        // Store data for recalculation in results page
        sessionStorage.setItem("comparisonData", JSON.stringify({
          id: fullData.id,
          clientName: fullData.clientName,
          comparisonType: fullData.comparisonType,
          customerType: fullData.customerType,
          selectedLightTariff: fullData.tariffType,
          selectedGasTariff: fullData.tariffType,
          tariffType: fullData.tariffType,
          potencias: fullData.potencias || [],
          energias: fullData.energias || [],
          energia: fullData.energia || 0,
          numDias: fullData.numDias || 30,
          showCurrentBill: fullData.showCurrentBill !== false,
          currentBillAmount: fullData.calculatedOldPrice || fullData.currentBillAmount || 0,
          excedentes: fullData.excedentes || 0,
          solarPanelActive: fullData.solarPanelActive || false,
        }));
        // Navigate to results page to allow recalculation
        router.push("/comparativas/resultados");
      }
    } catch (error) {
      console.error("Error loading comparativa for edit:", error);
    }
  };

  const handleDelete = (comparativa) => {
    setOpenDropdownId(null);
    setSelectedComparativa(comparativa);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedComparativa) return;

    try {
      const token = getCookie("factura-token");
      const response = await deleteComparativa(selectedComparativa.id, token);

      if (response.ok) {
        // Remove from local state
        setComparativas((prev) =>
          prev.filter((c) => c.id !== selectedComparativa.id)
        );
        setIsDeleteModalOpen(false);
        setSelectedComparativa(null);
      } else {
        console.error("Error deleting comparativa:", response.status);
      }
    } catch (error) {
      console.error("Error deleting comparativa:", error);
    }
  };

  const handleVerMas = () => {
    // Load more comparativas
    console.log("Ver más comparativas");
  };

  const handleComparativaClick = async (comparativa) => {
    // Navigate to edit/view the comparativa
    handleEdit(comparativa);
  };

  const handleNuevaComparativaCreated = () => {
    // Reload comparativas after creating a new one
    loadComparativas();
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
            Comparativas
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Historial de comparativas realizadas
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="neumorphic-button flex items-center justify-center p-4 rounded-lg bg-primary text-white font-semibold hover:shadow-neumorphic-inset-light dark:hover:shadow-neumorphic-inset-dark transition-all"
        >
          <span className="material-icons-outlined mr-2">add</span>
          Nueva Comparativa
        </button>
      </div>

      {/* Sección de últimas comparativas */}
      <div className="flex justify-between items-center mb-6 mt-8">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
          Últimas Comparativas
        </h3>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="text-center py-8 text-slate-600 dark:text-slate-400">
          <span className="material-icons-outlined animate-spin text-4xl">
            sync
          </span>
          <p className="mt-2">Cargando comparativas...</p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && comparativas.length === 0 && (
        <div className="text-center py-8">
          <div className="neumorphic-card-inset inline-flex items-center justify-center w-20 h-20 rounded-full mb-4">
            <span className="material-icons-outlined text-4xl text-slate-400">
              compare_arrows
            </span>
          </div>
          <p className="text-slate-600 dark:text-slate-400">
            No tienes comparativas aún
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
            Crea tu primera comparativa para empezar
          </p>
        </div>
      )}

      {/* Lista de comparativas */}
      {!isLoading && comparativas.length > 0 && (
        <div className="space-y-4">
          {comparativas.map((comparativa) => (
            <div
              key={comparativa.id}
              className="neumorphic-card p-4 flex items-center justify-between hover:shadow-neumorphic-inset-light dark:hover:shadow-neumorphic-inset-dark transition-all cursor-pointer"
              onClick={() => handleComparativaClick(comparativa)}
            >
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-lg neumorphic-card-inset flex items-center justify-center mr-4">
                  <span
                    className={`material-icons-outlined ${
                      comparativa.comparisonType === "luz"
                        ? "text-primary"
                        : "text-orange-400"
                    }`}
                  >
                    {comparativa.comparisonType === "luz"
                      ? "lightbulb"
                      : "local_fire_department"}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-100">
                    {comparativa.clientName}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {comparativa.tariffType} - {formatTimeAgo(comparativa.createdAt)}
                  </p>
                </div>
              </div>
              {/* Contenedor de Acciones (precios + dropdown) */}
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-bold text-slate-800 dark:text-slate-100">
                    {parseFloat(comparativa.calculatedNewPrice).toFixed(2)}€
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-through">
                    {parseFloat(comparativa.calculatedOldPrice).toFixed(2)}€
                  </p>
                </div>

                {/* Dropdown menu */}
                <div className="relative" ref={openDropdownId === comparativa.id ? dropdownRef : null}>
                  <button
                    onClick={(e) => handleDropdownToggle(comparativa.id, e)}
                    className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700/50"
                  >
                    <span className="material-icons-outlined">more_vert</span>
                  </button>

                  {openDropdownId === comparativa.id && (
                    <div className="absolute right-0 top-full mt-1 w-48 neumorphic-card rounded-lg shadow-lg z-50 py-1 animate-fade-in">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExport(comparativa);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 flex items-center"
                      >
                        <span className="material-icons-outlined text-lg mr-3">download</span>
                        Exportar
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRename(comparativa);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 flex items-center"
                      >
                        <span className="material-icons-outlined text-lg mr-3">edit</span>
                        Renombrar
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(comparativa);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 flex items-center"
                      >
                        <span className="material-icons-outlined text-lg mr-3">tune</span>
                        Editar
                      </button>
                      <div className="border-t border-slate-200 dark:border-slate-700 my-1"></div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(comparativa);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center"
                      >
                        <span className="material-icons-outlined text-lg mr-3">delete</span>
                        Borrar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Ver más */}
      {!isLoading && comparativas.length > 0 && (
        <div className="mt-4 text-center">
          <button
            onClick={handleVerMas}
            className="text-sm font-semibold text-primary hover:underline"
          >
            Ver más
          </button>
        </div>
      )}

      {/* Modal Nueva Comparativa */}
      <NuevaComparativaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={handleNuevaComparativaCreated}
      />

      {/* Modal Renombrar */}
      <BaseModal
        isOpen={isRenameModalOpen}
        onClose={() => {
          setIsRenameModalOpen(false);
          setSelectedComparativa(null);
          setNewName("");
        }}
        title="Renombrar Comparativa"
        subtitle="Introduce el nuevo nombre para la comparativa"
        maxWidth="max-w-md"
      >
        <ModalInput
          label="Nombre"
          id="rename-name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nombre del cliente"
          required
        />
        <ModalActions alignment="end">
          <ModalButton
            variant="ghost"
            onClick={() => {
              setIsRenameModalOpen(false);
              setSelectedComparativa(null);
              setNewName("");
            }}
          >
            Cancelar
          </ModalButton>
          <ModalButton
            variant="primary"
            onClick={handleRenameSubmit}
            disabled={!newName.trim()}
          >
            Guardar
          </ModalButton>
        </ModalActions>
      </BaseModal>

      {/* Modal Confirmar Borrar */}
      <BaseModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedComparativa(null);
        }}
        title="Eliminar Comparativa"
        subtitle={`¿Estás seguro de que deseas eliminar la comparativa "${selectedComparativa?.clientName}"?`}
        maxWidth="max-w-md"
      >
        <p className="text-slate-600 dark:text-slate-400 mb-4">
          Esta acción no se puede deshacer.
        </p>
        <ModalActions alignment="end">
          <ModalButton
            variant="ghost"
            onClick={() => {
              setIsDeleteModalOpen(false);
              setSelectedComparativa(null);
            }}
          >
            Cancelar
          </ModalButton>
          <ModalButton variant="danger" onClick={handleDeleteConfirm}>
            Eliminar
          </ModalButton>
        </ModalActions>
      </BaseModal>
    </div>
  );
}
