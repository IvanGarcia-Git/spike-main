"use client";

import { useState, useMemo } from "react";
import BaseModal, {
  ModalActions,
  ModalButton,
  ModalInput,
} from "@/components/base-modal.component";
import { authFetch } from "@/helpers/server-fetch.helper";
import { getCookie } from "cookies-next";
import { toast } from "react-toastify";

/**
 * TerceroModal - Modal para seleccionar o crear un tercero (cliente/proveedor)
 *
 * @param {boolean} isOpen - Controla si el modal está abierto
 * @param {function} onClose - Función para cerrar el modal
 * @param {Array} existingContacts - Lista de contactos/canales existentes
 * @param {function} onSelect - Callback cuando se selecciona un tercero existente
 * @param {function} onCreate - Callback cuando se crea un nuevo tercero
 * @param {function} onChannelCreated - Callback cuando se crea un canal en la DB (para refrescar lista)
 * @param {function} onChannelDeleted - Callback cuando se elimina un canal de la DB
 * @param {string} invoiceType - Tipo de factura: "COBRO" o "PAGO"
 */
export default function TerceroModal({
  isOpen,
  onClose,
  existingContacts = [],
  onSelect,
  onCreate,
  onChannelCreated,
  onChannelDeleted,
  invoiceType = "COBRO",
}) {
  const [mode, setMode] = useState("select"); // "select" | "create"
  const [searchTerm, setSearchTerm] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveToDatabase, setSaveToDatabase] = useState(false);
  const [deleteContact, setDeleteContact] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Campos del nuevo tercero
  const [formData, setFormData] = useState({
    name: "",
    representativeName: "",
    cif: "",
    address: "",
    city: "",
    postalCode: "",
    country: "",
    email: "",
    phone: "",
    iban: "",
  });

  const isCobro = invoiceType === "COBRO";
  const terceroLabel = isCobro ? "Cliente" : "Proveedor";

  // Filtrar contactos por búsqueda
  const filteredContacts = useMemo(() => {
    if (!searchTerm.trim()) return existingContacts;
    const term = searchTerm.toLowerCase();
    return existingContacts.filter(
      (c) =>
        c.name?.toLowerCase().includes(term) ||
        c.cif?.toLowerCase().includes(term) ||
        c.representativeName?.toLowerCase().includes(term)
    );
  }, [existingContacts, searchTerm]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      representativeName: "",
      cif: "",
      address: "",
      city: "",
      postalCode: "",
      country: "",
      email: "",
      phone: "",
      iban: "",
    });
    setSearchTerm("");
    setSaveToDatabase(false);
    setDeleteContact(null);
    setMode("select");
  };

  // Handler para eliminar un contacto
  const handleDeleteContact = async () => {
    if (!deleteContact) return;

    setIsDeleting(true);
    try {
      const jwtToken = getCookie("factura-token");
      const response = await authFetch("DELETE", "channels/", { channelUuid: deleteContact.uuid }, jwtToken);

      if (response.ok) {
        toast.success(`${terceroLabel} eliminado correctamente`);

        // Notificar al padre que se eliminó el contacto
        if (onChannelDeleted) {
          onChannelDeleted(deleteContact);
        }

        setDeleteContact(null);
      } else {
        let errorMessage = `Error al eliminar ${terceroLabel.toLowerCase()}`;
        if (response.status === 403) {
          errorMessage = "No tienes permisos para eliminar contactos.";
        } else {
          try {
            const error = await response.json();
            if (error.message) {
              errorMessage = error.message;
            }
          } catch (e) {
            // Response might not be JSON
          }
        }
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error("Error deleting channel:", error);
      toast.error(`Error al eliminar ${terceroLabel.toLowerCase()}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSelectExisting = (contact) => {
    onSelect({
      id: contact.id,
      name: contact.name,
      representativeName: contact.representativeName || "",
      cif: contact.cif || "",
      address: contact.address || contact.fiscalAddress || "",
      city: contact.city || contact.fiscalCity || "",
      postalCode: contact.postalCode || contact.fiscalPostalCode || "",
      country: contact.country || "",
      email: contact.representativeEmail || contact.email || "",
      phone: contact.representativePhone || contact.phone || "",
      iban: contact.iban || "",
    });
    handleClose();
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }

    // Si el usuario quiere guardar en la base de datos
    if (saveToDatabase) {
      setIsSaving(true);
      try {
        const jwtToken = getCookie("factura-token");
        // Los campos representativeName, representativePhone y representativeEmail son obligatorios
        // Si no se proporcionan, usar valores por defecto
        const channelData = {
          name: formData.name,
          representativeName: formData.representativeName || formData.name, // Usar nombre si no hay representante
          cif: formData.cif || null,
          address: formData.address || null,
          representativeEmail: formData.email || "-", // Requerido, usar "-" si no hay
          representativePhone: formData.phone || "-", // Requerido, usar "-" si no hay
          iban: formData.iban || null,
        };

        const response = await authFetch("POST", "channels/", channelData, jwtToken);

        if (response.ok) {
          const newChannel = await response.json();
          toast.success(`${terceroLabel} guardado correctamente`);

          // Notificar que se creó un canal para refrescar la lista
          if (onChannelCreated) {
            onChannelCreated(newChannel);
          }

          // Llamar onCreate con el nuevo canal
          onCreate({
            id: newChannel.id,
            name: newChannel.name,
            representativeName: newChannel.representativeName || "",
            cif: newChannel.cif || "",
            address: newChannel.address || "",
            city: formData.city || "",
            postalCode: formData.postalCode || "",
            country: formData.country || "",
            email: newChannel.representativeEmail || "",
            phone: newChannel.representativePhone || "",
            iban: newChannel.iban || "",
            isNew: true,
            savedToDb: true,
          });
        } else {
          const error = await response.json();
          // Mejorar mensaje de error para el usuario
          let errorMessage = `Error al guardar ${terceroLabel.toLowerCase()}`;
          if (response.status === 403) {
            errorMessage = "No tienes permisos para guardar contactos. Solo puedes usar los datos para esta factura.";
          } else if (error.message) {
            errorMessage = error.message;
          }
          toast.error(errorMessage);
          return;
        }
      } catch (error) {
        console.error("Error creating channel:", error);
        toast.error(`Error al guardar ${terceroLabel.toLowerCase()}`);
        return;
      } finally {
        setIsSaving(false);
      }
    } else {
      // Solo usar los datos sin guardar en DB
      onCreate({
        id: `temp-${Date.now()}`,
        name: formData.name,
        representativeName: formData.representativeName || "",
        cif: formData.cif || "",
        address: formData.address || "",
        city: formData.city || "",
        postalCode: formData.postalCode || "",
        country: formData.country || "",
        email: formData.email || "",
        phone: formData.phone || "",
        iban: formData.iban || "",
        isNew: true,
        savedToDb: false,
      });
    }

    handleClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title={mode === "select" ? `Seleccionar ${terceroLabel}` : `Nuevo ${terceroLabel}`}
      subtitle={
        mode === "select"
          ? `Elige un ${terceroLabel.toLowerCase()} existente o crea uno nuevo`
          : `Introduce los datos del ${terceroLabel.toLowerCase()}`
      }
      maxWidth="max-w-xl"
    >
      {mode === "select" ? (
        <>
          {/* Barra de búsqueda */}
          <div className="mb-4">
            <div className="relative">
              <span className="material-icons-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                search
              </span>
              <input
                type="text"
                placeholder={`Buscar ${terceroLabel.toLowerCase()} por nombre o CIF...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg neumorphic-card-inset text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>
          </div>

          {/* Lista de contactos */}
          <div className="max-h-64 overflow-y-auto neumorphic-card-inset rounded-lg">
            {filteredContacts.length === 0 ? (
              <div className="p-4 text-center text-slate-500 dark:text-slate-400">
                <span className="material-icons-outlined text-3xl mb-2 block">
                  person_search
                </span>
                {searchTerm
                  ? "No se encontraron resultados"
                  : `No hay ${terceroLabel.toLowerCase()}s guardados`}
              </div>
            ) : (
              <ul className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredContacts.map((contact) => (
                  <li key={contact.id} className="flex items-center gap-2 pr-2">
                    <button
                      type="button"
                      onClick={() => handleSelectExisting(contact)}
                      className="flex-1 px-4 py-3 text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-3"
                    >
                      <div className="neumorphic-card w-10 h-10 rounded-full flex items-center justify-center text-primary flex-shrink-0">
                        <span className="material-icons-outlined">
                          {isCobro ? "person" : "business"}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-800 dark:text-slate-100 truncate">
                          {contact.name}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                          {contact.cif && `${contact.cif} • `}
                          {contact.address || "Sin dirección"}
                        </p>
                      </div>
                      <span className="material-icons-outlined text-slate-400">
                        chevron_right
                      </span>
                    </button>
                    {/* Botón eliminar */}
                    {contact.uuid && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteContact(contact);
                        }}
                        className="p-2 rounded-lg neumorphic-button text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex-shrink-0"
                        title={`Eliminar ${terceroLabel.toLowerCase()}`}
                      >
                        <span className="material-icons-outlined text-sm">delete</span>
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Botón crear nuevo */}
          <ModalActions alignment="between">
            <ModalButton variant="ghost" onClick={handleClose}>
              Cancelar
            </ModalButton>
            <ModalButton
              variant="primary"
              icon="add"
              onClick={() => setMode("create")}
            >
              Crear nuevo
            </ModalButton>
          </ModalActions>
        </>
      ) : (
        <>
          {/* Formulario de creación */}
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            <ModalInput
              label="Razón Social / Nombre *"
              id="tercero-name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              required
              placeholder="Ej: Empresa S.L. o Juan García"
            />

            <ModalInput
              label="Persona de Contacto"
              id="tercero-representative"
              value={formData.representativeName}
              onChange={(e) => handleInputChange("representativeName", e.target.value)}
              placeholder="Nombre del representante o contacto"
            />

            <ModalInput
              label="NIF / CIF"
              id="tercero-cif"
              value={formData.cif}
              onChange={(e) => handleInputChange("cif", e.target.value)}
              placeholder="Ej: B12345678 o 12345678A"
            />

            <ModalInput
              label="Dirección"
              id="tercero-address"
              value={formData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              placeholder="Calle, número, piso..."
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <ModalInput
                label="Ciudad"
                id="tercero-city"
                value={formData.city}
                onChange={(e) => handleInputChange("city", e.target.value)}
                placeholder="Ej: Madrid"
              />

              <ModalInput
                label="Código Postal"
                id="tercero-postalCode"
                value={formData.postalCode}
                onChange={(e) => handleInputChange("postalCode", e.target.value)}
                placeholder="Ej: 28001"
              />

              <ModalInput
                label="País"
                id="tercero-country"
                value={formData.country}
                onChange={(e) => handleInputChange("country", e.target.value)}
                placeholder="Ej: España"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <ModalInput
                label="Email"
                id="tercero-email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="email@ejemplo.com"
              />

              <ModalInput
                label="Teléfono"
                id="tercero-phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="+34 600 000 000"
              />
            </div>

            <ModalInput
              label="IBAN"
              id="tercero-iban"
              value={formData.iban}
              onChange={(e) => handleInputChange("iban", e.target.value)}
              placeholder="ESXX XXXX XXXX XXXX XXXX XXXX"
            />

            {/* Checkbox guardar en DB */}
            <div className="flex items-center gap-3 p-3 neumorphic-card-inset rounded-lg mt-4">
              <input
                type="checkbox"
                id="save-to-db"
                checked={saveToDatabase}
                onChange={(e) => setSaveToDatabase(e.target.checked)}
                className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
              />
              <label
                htmlFor="save-to-db"
                className="text-sm text-slate-700 dark:text-slate-300 cursor-pointer flex-1"
              >
                Guardar {terceroLabel.toLowerCase()} para futuras facturas
              </label>
            </div>
          </div>

          <ModalActions alignment="between">
            <ModalButton
              variant="ghost"
              icon="arrow_back"
              onClick={() => setMode("select")}
            >
              Volver
            </ModalButton>
            <ModalButton
              variant="primary"
              icon={isSaving ? "refresh" : "check"}
              onClick={handleCreate}
              disabled={!formData.name.trim() || isSaving}
            >
              {isSaving ? "Guardando..." : "Usar datos"}
            </ModalButton>
          </ModalActions>
        </>
      )}

      {/* Modal de confirmación para eliminar */}
      {deleteContact && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="neumorphic-card p-6 rounded-xl max-w-sm mx-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 mb-4">
              <div className="neumorphic-card-inset w-12 h-12 rounded-full flex items-center justify-center text-red-500">
                <span className="material-icons-outlined">warning</span>
              </div>
              <div>
                <h4 className="font-semibold text-slate-800 dark:text-slate-100">
                  Eliminar {terceroLabel}
                </h4>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Esta acción no se puede deshacer
                </p>
              </div>
            </div>
            <p className="text-slate-700 dark:text-slate-300 mb-6">
              ¿Estás seguro de que deseas eliminar a <strong>{deleteContact.name}</strong>?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setDeleteContact(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg neumorphic-button text-slate-600 dark:text-slate-300 font-medium"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteContact}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg neumorphic-button bg-red-500 text-white font-medium hover:bg-red-600 disabled:opacity-50"
              >
                {isDeleting ? (
                  <span className="flex items-center gap-2">
                    <span className="material-icons-outlined animate-spin text-sm">refresh</span>
                    Eliminando...
                  </span>
                ) : (
                  "Eliminar"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </BaseModal>
  );
}
