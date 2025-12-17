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
 * @param {string} invoiceType - Tipo de factura: "COBRO" o "PAGO"
 */
export default function TerceroModal({
  isOpen,
  onClose,
  existingContacts = [],
  onSelect,
  onCreate,
  onChannelCreated,
  invoiceType = "COBRO",
}) {
  const [mode, setMode] = useState("select"); // "select" | "create"
  const [searchTerm, setSearchTerm] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveToDatabase, setSaveToDatabase] = useState(false);

  // Campos del nuevo tercero
  const [formData, setFormData] = useState({
    name: "",
    cif: "",
    address: "",
    email: "",
    phone: "",
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
      cif: "",
      address: "",
      email: "",
      phone: "",
    });
    setSearchTerm("");
    setSaveToDatabase(false);
    setMode("select");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSelectExisting = (contact) => {
    onSelect({
      id: contact.id,
      name: contact.name,
      cif: contact.cif || "",
      address: contact.address || "",
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
        const channelData = {
          name: formData.name,
          cif: formData.cif || null,
          address: formData.address || null,
          representativeEmail: formData.email || null,
          representativePhone: formData.phone || null,
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
            cif: newChannel.cif || "",
            address: newChannel.address || "",
            email: newChannel.representativeEmail || "",
            phone: newChannel.representativePhone || "",
            iban: newChannel.iban || "",
            isNew: true,
            savedToDb: true,
          });
        } else {
          const error = await response.json();
          toast.error(error.message || `Error al guardar ${terceroLabel.toLowerCase()}`);
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
        cif: formData.cif || "",
        address: formData.address || "",
        email: formData.email || "",
        phone: formData.phone || "",
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
                  <li key={contact.id}>
                    <button
                      type="button"
                      onClick={() => handleSelectExisting(contact)}
                      className="w-full px-4 py-3 text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-3"
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
          <div className="space-y-1">
            <ModalInput
              label="Razón Social / Nombre"
              id="tercero-name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              required
              placeholder="Ej: Empresa S.L. o Juan García"
            />

            <ModalInput
              label="NIF / CIF"
              id="tercero-cif"
              value={formData.cif}
              onChange={(e) => handleInputChange("cif", e.target.value)}
              placeholder="Ej: B12345678 o 12345678A"
            />

            <ModalInput
              label="Dirección Fiscal"
              id="tercero-address"
              value={formData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              placeholder="Calle, número, código postal, ciudad"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
    </BaseModal>
  );
}
