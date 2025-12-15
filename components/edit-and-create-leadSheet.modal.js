import { useState, useEffect } from "react";
import { authFetch } from "@/helpers/server-fetch.helper";
import { getCookie } from "cookies-next";
import { useRouter } from "next/navigation";
import { validateIBANMath } from "@/helpers/validation.helper";
import ContractsTypeModal from "./contracts-type.modal";
import useAutoSaveDraft from "@/hooks/useAutoSaveDraft";
import { AutoSaveIndicator, RestoreDraftModal } from "./auto-save-indicator";

export default function EditAndCreateLeadSheet({
  isModalOpen,
  setIsModalOpen,
  initialData,
  mode,
  onRefreshLead,
}) {
  const [formData, setFormData] = useState({
    name: "",
    surnames: "",
    nationalId: "",
    email: "",
    address: "",
    zipCode: "",
    province: "",
    populace: "",
    phoneNumber: "",
    iban: "",
    holderChange: false,
    newCreation: false,
    powerChange: false,
    type: "B2C",
    cif: "",
    tradeName: "",
    leadId: "",
  });
  const router = useRouter();
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);

  // Clave única para el borrador (diferente si es crear vs editar)
  const draftKey = mode === "create" ? "leadSheet_new" : null;

  // Hook de autoguardado (solo para modo crear)
  const {
    hasDraft,
    draftData,
    lastSaved,
    restoreDraft,
    clearDraft,
    getLastSavedText,
  } = useAutoSaveDraft(draftKey, formData, {
    enabled: mode === "create" && isModalOpen,
    debounceMs: 1500,
  });

  // Mostrar modal de restauración si hay borrador al abrir en modo crear
  useEffect(() => {
    if (mode === "create" && isModalOpen && hasDraft && draftData) {
      // Solo mostrar si el formulario está vacío
      const isFormEmpty = !formData.name && !formData.surnames && !formData.nationalId;
      if (isFormEmpty) {
        setShowRestoreModal(true);
      }
    }
  }, [mode, isModalOpen, hasDraft]);

  // Restaurar borrador
  const handleRestore = () => {
    if (draftData) {
      setFormData((prev) => ({
        ...prev,
        ...draftData,
      }));
    }
    setShowRestoreModal(false);
  };

  // Descartar borrador
  const handleDiscard = () => {
    clearDraft();
    setShowRestoreModal(false);
  };

  useEffect(() => {
    if (initialData) {
      setFormData((prevFormData) => ({
        ...prevFormData,
        ...initialData,
        cif: initialData.cif || "",
        tradeName: initialData.tradeName || "",
        leadId: initialData.leadId,
      }));
    }
  }, [mode, initialData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prevFormData) => {
      let updatedFormData = {
        ...prevFormData,
        [name]: type === "checkbox" ? checked : value,
      };

      if (name === "type" && value === "B2C") {
        updatedFormData = {
          ...updatedFormData,
          cif: "",
          tradeName: "",
        };
      }

      return updatedFormData;
    });
  };

  const handleRedirectToCreateContract = (type) => {
    const queryParams = new URLSearchParams({
      leadSheetUuid: formData.uuid,
    }).toString();
    type === "telefonia"
      ? router.push(`/nuevo-contrato-telefonia?${queryParams}`)
      : router.push(`/nuevo-contrato?${queryParams}`);
  };

  const handleSaveChanges = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!validateIBANMath(formData.iban)) {
      alert("El IBAN no es válido. Por favor, introduce un IBAN correcto.");
      return;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const jwtToken = getCookie("factura-token");

    const cleanedFormData = {
      ...formData,
      cif: formData.cif.trim() === "" ? null : formData.cif,
      tradeName: formData.tradeName.trim() === "" ? null : formData.tradeName,
    };

    try {
      const url = mode === "edit" ? `lead-sheets/${formData.uuid}` : `lead-sheets`;
      const method = mode === "edit" ? "PATCH" : "POST";

      const response = await authFetch(method, url, cleanedFormData, jwtToken);

      if (response.ok) {
        // Limpiar borrador al guardar exitosamente
        if (mode === "create") {
          clearDraft();
        }
        alert(mode === "edit" ? "Lead actualizado correctamente." : "Lead creado correctamente.");
        setIsModalOpen(false);

        if (onRefreshLead) {
          onRefreshLead();
        }
      } else {
        alert("Error al procesar la información.");
      }
    } catch (error) {
      console.error("Error al enviar la información:", error);
    }
  };

  if (!isModalOpen) return null;

  const openModal = () => setIsContractModalOpen(true);
  const closeModal = () => setIsContractModalOpen(false);

  return (
    <div
      className={`bg-foreground text-black p-6 rounded-lg shadow-lg w-full max-w-4xl ${
        isModalOpen ? "" : "hidden"
      } overflow-y-auto max-h-[80vh]`}
    >
      {/* Contenedor del botón */}
      <div className="flex justify-between items-center mb-4">
        {/* Indicador de autoguardado */}
        {mode === "create" && (
          <AutoSaveIndicator lastSavedText={getLastSavedText()} />
        )}
        {mode !== "create" && <div />}
        <button
          type="button"
          className={`px-4 py-2 rounded text-white ${
            formData.uuid ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400 cursor-not-allowed"
          }`}
          onClick={openModal}
          disabled={!formData.uuid}
        >
          Crear Contrato
        </button>
      </div>
      <form
        onSubmit={handleSaveChanges}
        className="bg-background p-6 rounded-lg shadow-lg border border-white mb-7"
      >
        {/* Selector de Particular/Empresa */}
        <div className="mb-4">
          <div className="flex space-x-4">
            {/* Tipo de Cliente */}
            <div className="flex-1">
              <label className="block text-black mb-2" htmlFor="type">
                Tipo de Cliente
              </label>
              <select
                id="type"
                name="type"
                className="w-full px-4 py-2 rounded bg-backgroundHoverBold text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.type}
                onChange={handleChange}
              >
                <option value="B2C">Particular</option>
                <option value="B2B">Empresa</option>
              </select>
            </div>
          </div>
        </div>

        {formData.type == "B2B" && (
          <>
            <div className="mb-4">
              <label className="block text-black mb-2" htmlFor="cif">
                CIF
              </label>
              <input
                type="text"
                id="cif"
                name="cif"
                className="w-full px-4 py-2 rounded bg-backgroundHoverBold text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.cif}
                onChange={handleChange}
              />
            </div>
            <div className="mb-4">
              <label className="block text-black mb-2" htmlFor="tradeName">
                Razón social
              </label>
              <input
                type="text"
                id="tradeName"
                name="tradeName"
                className="w-full px-4 py-2 rounded bg-backgroundHoverBold text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.tradeName}
                onChange={handleChange}
              />
            </div>
          </>
        )}

        {/* Campo Nombre */}
        <div className="mb-4">
          <label className="block text-black mb-2" htmlFor="name">
            Nombre
          </label>
          <input
            type="text"
            id="name"
            name="name"
            className="w-full px-4 py-2 rounded bg-backgroundHoverBold text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        {/* Campo Apellidos */}
        <div className="mb-4">
          <label className="block text-black mb-2" htmlFor="surnames">
            Apellidos
          </label>
          <input
            type="text"
            id="surnames"
            name="surnames"
            className="w-full px-4 py-2 rounded bg-backgroundHoverBold text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.surnames}
            onChange={handleChange}
            required
          />
        </div>

        {/* Campo nationalId */}
        <div className="mb-4">
          <label className="block text-black mb-2" htmlFor="nationalId">
            DNI
          </label>
          <input
            type="text"
            pattern="^.{5,}$"
            id="nationalId"
            name="nationalId"
            className="w-full px-4 py-2 rounded bg-backgroundHoverBold text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.nationalId}
            onChange={handleChange}
            required
            title="Por favor, introduce un DNI válido"
          />
        </div>

        {/* Campo Correo */}
        <div className="mb-4">
          <label className="block text-black mb-2" htmlFor="email">
            Correo
          </label>
          <input
            type="email"
            id="email"
            name="email"
            className="w-full px-4 py-2 rounded bg-backgroundHoverBold text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        {/* Campo Dirección */}
        <div className="mb-4">
          <label className="block text-black mb-2" htmlFor="address">
            Dirección
          </label>
          <input
            type="text"
            id="address"
            name="address"
            className="w-full px-4 py-2 rounded bg-backgroundHoverBold text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.address}
            onChange={handleChange}
            required
          />
        </div>

        {/* Campo CP, Provincia y Población en filas separadas en móvil */}
        <div className="mb-4 space-y-4 sm:space-y-0 sm:flex sm:space-x-4">
          {/* Campo CP */}
          <div className="w-full sm:flex-1">
            <label className="block text-black mb-2" htmlFor="zipCode">
              Código Postal
            </label>
            <input
              type="text"
              id="zipCode"
              name="zipCode"
              pattern="^(0[1-9]|[1-4][0-9]|5[0-2])\d{3}$"
              className="w-full px-4 py-2 rounded bg-backgroundHoverBold text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.zipCode}
              onChange={handleChange}
              title="Por favor, introduce un código postal válido de España (5 dígitos, entre 01000 y 52999)."
            />
          </div>

          {/* Campo Provincia */}
          <div className="w-full sm:flex-1">
            <label className="block text-black mb-2" htmlFor="province">
              Provincia
            </label>
            <input
              type="text"
              id="province"
              name="province"
              className="w-full px-4 py-2 rounded bg-backgroundHoverBold text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.province}
              onChange={handleChange}
            />
          </div>

          {/* Campo Población */}
          <div className="w-full sm:flex-1">
            <label className="block text-black mb-2" htmlFor="populace">
              Población
            </label>
            <input
              type="text"
              id="populace"
              name="populace"
              className="w-full px-4 py-2 rounded bg-backgroundHoverBold text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.populace}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Campo Teléfono */}
        <div className="mb-4">
          <label className="block text-black mb-2" htmlFor="phoneNumber">
            Teléfono
          </label>
          <input
            type="text"
            pattern="^\d{9}$"
            id="phoneNumber"
            name="phoneNumber"
            className="w-full px-4 py-2 rounded bg-backgroundHoverBold text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.phoneNumber}
            onChange={handleChange}
            required
            title="Por favor, introduce un número de teléfono válido."
          />
        </div>

        {/* Campo IBAN */}
        <div className="mb-4">
          <label className="block text-black mb-2" htmlFor="iban">
            IBAN
          </label>
          <input
            type="text"
            id="iban"
            name="iban"
            className="w-full px-4 py-2 rounded bg-backgroundHoverBold text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.iban}
            onChange={handleChange}
            required
            title="Por favor, introduce un ISBN válido."
          />
        </div>

        {/* Checkboxes Cambio de Titular y Nuevo Alta en una fila */}
        <div className="mb-4 flex items-center space-x-4">
          <label className="text-black flex items-center">
            <input
              type="checkbox"
              name="holderChange"
              checked={formData.holderChange}
              onChange={handleChange}
              className="mr-2"
            />
            Cambio Titular
          </label>

          <label className="text-black flex items-center">
            <input
              type="checkbox"
              name="newCreation"
              checked={formData.newCreation}
              onChange={handleChange}
              className="mr-2"
            />
            Nuevo Alta
          </label>

          <label className="text-black flex items-center">
            <input
              type="checkbox"
              name="powerChange"
              checked={formData.powerChange}
              onChange={handleChange}
              className="mr-2"
            />
            Cambio Potencia
          </label>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            className="bg-red-600 text-white px-4 py-2 rounded mr-2 hover:bg-red-700"
            onClick={() => setIsModalOpen(false)}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className={`text-white px-4 py-2 rounded bg-secondary hover:bg-secondaryHover`}
          >
            {mode === "create" ? "Crear Lead" : "Actualizar Lead"}
          </button>
        </div>
      </form>
      {isContractModalOpen && (
        <ContractsTypeModal
          isContractModalOpen={isContractModalOpen}
          closeModal={closeModal}
          handleCreateContract={handleRedirectToCreateContract}
        />
      )}

      {/* Modal de restauración de borrador */}
      <RestoreDraftModal
        isOpen={showRestoreModal}
        onRestore={handleRestore}
        onDiscard={handleDiscard}
        lastSaved={lastSaved}
      />
    </div>
  );
}
