"use client";
import { useState, useEffect, useMemo } from "react";
import CreateCustomerForm from "@/components/create-customer.form";
import CreateTelephonyContractForm from "@/components/create-telephony-contract.form";
import { useRouter } from "next/navigation";
import { getCookie } from "cookies-next";
import { authGetFetch, authFetch } from "@/helpers/server-fetch.helper";
import { isCustomerDataValid } from "@/helpers/validation.helper";
import { validateIBANMath } from "@/helpers/validation.helper";
import ConfirmContractModal from "@/components/confirm-create-contract.modal";
import useAutoSaveDraft from "@/hooks/useAutoSaveDraft";
import { AutoSaveIndicator, RestoreDraftModal } from "@/components/auto-save-indicator";

export default function CreateTelephonyContractPage() {
  const router = useRouter();
  const [documentType, setDocumentType] = useState("NIF / DNI");
  const [companies, setCompanies] = useState([]);
  const [contractTelephonyData, setContractTelephonyData] = useState({
    type: "Telefonía",
    isDraft: true,
    companyId: "",
    extraInfo: "",
    electronicBill: true,
    isSelected: false,
    telephoneLines: [0, 0],
    landlinePhone: 0,
    rates: [],
    extraServices: [],
    selectedFiles: [],
  });
  const [customerData, setCustomerData] = useState({
    name: "",
    surnames: "",
    nationalId: "",
    nationality: "",
    email: "",
    address: "",
    zipCode: "",
    province: "",
    populace: "",
    phoneNumber: "",
    iban: "",
    holderChange: false,
    newCreation: false,
    type: "B2C",
  });
  const [newContractComment, setNewContractComment] = useState({
    initialComment: "",
  });
  const [selectedFile, setSelectedFile] = useState(null);

  const cpRegex = /^(0[1-9]|[1-4][0-9]|5[0-2])\d{3}$/;
  const phoneNumberRegex = /^\d{9,}$/;
  const dniRegex = /^[0-9]{8}[A-Z]$/;
  const nieRegex = /^[X|Y|Z]\d{7}[A-Z]$/;

  const getCustomerDetails = async (customerUuid) => {
    const jwtToken = getCookie("factura-token");

    try {
      const response = await authGetFetch(`customers/simple/${customerUuid}`, jwtToken);
      if (response.ok) {
        const customer = await response.json();

        updateCustomerData(customer);
      } else {
        alert("Error al cargar los detalles del cliente.");
      }
    } catch (error) {
      console.error("Error obteniendo los detalles del cliente:", error);
    }
  };

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const customerUuid = queryParams.get("customerUuid");
    const leadSheetUuid = queryParams.get("leadSheetUuid");

    if (customerUuid) {
      setIsLoadingFromLeadSheet(true);
      getCustomerDetails(customerUuid);
    } else if (leadSheetUuid) {
      setIsLoadingFromLeadSheet(true);
      getLeadSheet(leadSheetUuid);
    }
  }, [router]);

  const getLeadSheet = async (leadSheetUuid) => {
    const jwtToken = getCookie("factura-token");

    try {
      const response = await authGetFetch(`lead-sheets/${leadSheetUuid}`, jwtToken);
      if (response.ok) {
        const customer = await response.json();

        updateCustomerData(customer);
      } else {
        alert("Error al cargar los detalles del cliente.");
      }
    } catch (error) {
      console.error("Error obteniendo los detalles del cliente:", error);
    }
  };

  const getCompanies = async () => {
    const jwtToken = getCookie("factura-token");
    try {
      const response = await authGetFetch("companies/", jwtToken);
      if (response.ok) {
        const companiesResponse = await response.json();
        setCompanies(companiesResponse);
      } else {
        alert("Error cargando la información de las compañías");
      }
    } catch (error) {
      console.error("Error enviando la solicitud:", error);
    }
  };

  useEffect(() => {
    getCompanies();
  }, []);

  const updateCustomerData = (customer) => {
    setCustomerData((prev) => ({
      ...prev,
      name: customer.name || "",
      surnames: customer.surnames || "",
      nationalId: customer.nationalId || "",
      nationality: customer.nationality || "",
      email: customer.email || "",
      address: customer.address || "",
      zipCode: customer.zipCode || "",
      cif: customer.cif || "",
      tradeName: customer.tradeName || "",
      province: customer.province || "",
      populace: customer.populace || "",
      phoneNumber: customer.phoneNumber || "",
      iban: customer.iban || "",
      holderChange: customer.holderChange || false,
      newCreation: customer.newCreation || false,
      type: customer.type || "B2C",
    }));
  };

  const isContractTelephonyValid = () => {
    if (!contractTelephonyData?.isSelected) return true;

    return contractTelephonyData?.companyId && contractTelephonyData?.rates.length > 0;
  };

  const handleCustomerUpdate = (updatedCustomerData) => {
    setCustomerData(updatedCustomerData);
  };

  const handleContractTelephonyUpdate = (updatedContractData) => {
    setContractTelephonyData((prev) => ({
      ...prev,
      ...updatedContractData,
    }));
  };

  const handleSelectChange = (e) => {
    const selectedType = e.target.value;
    setDocumentType(selectedType);

    setCustomerData((prev) => ({
      ...prev,
      nationalId: "",
      nationality: selectedType === "NIF / DNI" ? "España" : "",
    }));
  };

  const [duplicatedCustomers, setDuplicatedCustomers] = useState([]);
  const [openDuplicityModal, setOpenDuplicityModal] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [isLoadingFromLeadSheet, setIsLoadingFromLeadSheet] = useState(false);

  // Combinar todos los datos para el autoguardado
  const draftData = useMemo(
    () => ({
      customerData,
      contractTelephonyData,
      newContractComment,
      documentType,
    }),
    [customerData, contractTelephonyData, newContractComment, documentType]
  );

  // Hook de autoguardado
  const {
    hasDraft,
    draftData: savedDraftData,
    lastSaved,
    clearDraft,
    getLastSavedText,
  } = useAutoSaveDraft("contract_telephony_new", draftData, {
    enabled: !isLoadingFromLeadSheet,
    debounceMs: 2000,
  });

  // Mostrar modal de restauración si hay borrador al montar
  useEffect(() => {
    // Solo mostrar si no viene de leadSheet/customer
    const queryParams = new URLSearchParams(window.location.search);
    const hasExternalData = queryParams.get("customerUuid") || queryParams.get("leadSheetUuid");

    if (!hasExternalData && hasDraft && savedDraftData) {
      // Verificar si el formulario está vacío
      const isFormEmpty = !customerData.name && !customerData.surnames;
      if (isFormEmpty) {
        setShowRestoreModal(true);
      }
    }
  }, [hasDraft]);

  // Restaurar borrador
  const handleRestoreDraft = () => {
    if (savedDraftData) {
      if (savedDraftData.customerData) {
        setCustomerData(savedDraftData.customerData);
      }
      if (savedDraftData.contractTelephonyData) {
        setContractTelephonyData(savedDraftData.contractTelephonyData);
      }
      if (savedDraftData.newContractComment) {
        setNewContractComment(savedDraftData.newContractComment);
      }
      if (savedDraftData.documentType) {
        setDocumentType(savedDraftData.documentType);
      }
    }
    setShowRestoreModal(false);
  };

  // Descartar borrador
  const handleDiscardDraft = () => {
    clearDraft();
    setShowRestoreModal(false);
  };

  const handleCreateContract = async (isDraft = true) => {
    //Validaciones
    if (!isDraft) {
      // Email solo obligatorio si el contrato tiene factura electrónica
      const requireEmailValidation = contractTelephonyData?.electronicBill;

      if (!isCustomerDataValid(customerData, requireEmailValidation)) {
        alert("Por favor, rellena todos los campos del cliente.");
        return;
      }

      if (!isContractTelephonyValid()) {
        alert("Por favor, rellena todos los campos del contrato.");
        return;
      }
      if (!validateIBANMath(customerData.iban)) {
        alert("El IBAN no es válido. Por favor, corrígelo.");
        return;
      } else if (!cpRegex.test(customerData.zipCode)) {
        alert(
          "Por favor, introduce un código postal válido de España (5 dígitos, entre 01000 y 52999)."
        );
        return;
      } else if (!phoneNumberRegex.test(customerData.phoneNumber)) {
        alert("Por favor, introduce un número de teléfono válido.");
        return;
      } else if (documentType === "NIE" && !nieRegex.test(customerData.nationalId)) {
        alert("Por favor, introduce un NIE válido.");
        return;
      } else if (documentType === "NIF / DNI" && !dniRegex.test(customerData.nationalId)) {
        alert("Por favor, introduce un DNI válido.");
        return;
      }
    }

    const customerDataToSend = {
      ...customerData,
      cif: customerData.cif?.trim() === "" ? null : customerData.cif?.trim(),
      tradeName: customerData.tradeName?.trim() === "" ? null : customerData.tradeName?.trim(),
      nationality:
        customerData.nationality?.trim() === "" ? null : customerData.nationality?.trim(),
    };

    delete customerDataToSend.id;
    delete customerDataToSend.uuid;

    try {
      const jwtToken = getCookie("factura-token");

      if (!isDraft) {
        if (!isConfirmed) {
          const params = {
            phoneNumber: customerDataToSend.phoneNumber,
            email: customerDataToSend.email,
            iban: customerDataToSend.iban,
          };

          if (contractTelephonyData.isSelected && contractTelephonyData.cups) {
            params.cups = contractTelephonyData.cups;
          }

          const queryParams = new URLSearchParams(params).toString();

          const duplicatedCustomersResponse = await authGetFetch(
            `customers/check/duplicity?${queryParams}`,
            jwtToken
          );

          if (duplicatedCustomersResponse.ok) {
            const duplicatedCustomersData = await duplicatedCustomersResponse.json();

            if (duplicatedCustomersData.length > 0) {
              setDuplicatedCustomers(duplicatedCustomersData);
              setOpenDuplicityModal(true);
              return;
            }
          }
        }
      }

      // Email solo obligatorio si el contrato tiene factura electrónica
      const requireEmail = contractTelephonyData?.electronicBill;

      const customerResponse = await authFetch("POST", `customers/`, { ...customerDataToSend, requireEmail }, jwtToken);

      if (customerResponse.ok) {
        const createdCustomer = await customerResponse.json();

        const telephonyData = {
          landlinePhone: contractTelephonyData.landlinePhone || 0,
          telephoneLines: contractTelephonyData.telephoneLines || [],
          extraServices: contractTelephonyData.extraServices || [],
          rates: (contractTelephonyData.rates || []).map((rateId) => ({ id: rateId })),
        };

        const requestBody = {
          companyId: contractTelephonyData.companyId || null,
          customerId: createdCustomer.id,
          electronicBill: contractTelephonyData.electronicBill,
          extraInfo: contractTelephonyData.extraInfo || "",
          isDraft,
          type: "Telefonía",
          telephonyData,
        };

        //Telefonía
        if (contractTelephonyData.isSelected) {
          const contractTelephonyResponse = await authFetch(
            "POST",
            `contracts/`,
            requestBody,
            jwtToken
          );

          if (contractTelephonyResponse.ok) {
            const createdContract = await contractTelephonyResponse.json();
            if (contractTelephonyData.selectedFiles.length > 0) {
              const formData = new FormData();

              formData.append("contractUuid", createdContract.uuid);

              const normalizedFiles = contractTelephonyData.selectedFiles.map((item) =>
                item.file ? item.file : item
              );

              for (const file of normalizedFiles) {
                formData.append("contractDocuments", file);
              }

              const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/contract-documents/batch`,
                {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${jwtToken}`,
                  },
                  body: formData,
                }
              );

              if (!response.ok) {
                throw new Error(`Error: ${response.statusText}`);
              }
            }

            if (newContractComment.initialComment) {
              const commentFormData = new FormData();
              if (selectedFile) {
                commentFormData.append("contractCommentFile", selectedFile);
              }
              commentFormData.append("text", newContractComment.initialComment);

              try {
                const response = await fetch(
                  `${process.env.NEXT_PUBLIC_API_URL}/contract-comments/${createdContract.uuid}`,
                  {
                    method: "POST",
                    headers: {
                      Authorization: `Bearer ${jwtToken}`,
                    },
                    body: commentFormData,
                  }
                );

                if (response.ok) {
                  setSelectedFile(null);
                } else {
                  alert("Error al agregar el comentario");
                }
              } catch (error) {
                console.error("Error enviando el comentario:", error);
              }
            }
            // Limpiar borrador al crear exitosamente
            clearDraft();
            alert("Contrato creado con éxito.");
            router.push("/contratos");
          } else {
            alert("Error creando el contrato.");
          }
        }
      } else {
        alert("Error creando el cliente");
      }
    } catch (error) {
      console.error("Error creando el contrato:", error);
    }
  };

  const confirmCreation = async () => {
    setIsConfirmed(true);
    setOpenDuplicityModal(false);
  };

  useEffect(() => {
    if (isConfirmed) {
      handleCreateContract(false);
    }
  }, [isConfirmed]);

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 rounded-full neumorphic-button flex items-center justify-center text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
            >
              <span className="material-icons-outlined">arrow_back</span>
            </button>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100">
                Nuevo Contrato de Telefonía
              </h1>
              <div className="flex items-center gap-4">
                <p className="text-slate-500 dark:text-slate-400">
                  Completa los datos del cliente y configura el contrato de telefonía
                </p>
                <AutoSaveIndicator lastSavedText={getLastSavedText()} />
              </div>
            </div>
          </div>
        </div>

        {/* Customer Form */}
        <CreateCustomerForm
          customerData={customerData}
          onCustomerUpdate={handleCustomerUpdate}
          documentType={documentType}
          onDocumentTypeChange={handleSelectChange}
          electronicBill={contractTelephonyData?.electronicBill}
        />

        {/* Telephony Contract Form */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <CreateTelephonyContractForm
            companies={companies.filter((company) => company.type === "Telefonía")}
            onContractUpdate={handleContractTelephonyUpdate}
          />
        </div>

        {/* Comment Section */}
        <div className="neumorphic-card p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-neumorphic-light-lg dark:shadow-neumorphic-dark-lg bg-purple-500 bg-opacity-10">
              <span className="material-icons-outlined text-purple-500">comment</span>
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Comentario Inicial</h3>
          </div>

          <textarea
            id="comments"
            rows="4"
            className="w-full neumorphic-card-inset px-4 py-3 rounded-lg border-none focus:outline-none bg-transparent text-slate-800 dark:text-slate-200 mb-4"
            placeholder="Escribe un comentario inicial para el contrato..."
            value={newContractComment.initialComment}
            onChange={(e) =>
              setNewContractComment({ ...newContractComment, initialComment: e.target.value })
            }
          ></textarea>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Adjuntar Archivo
            </label>
            <div className="flex items-center gap-3">
              <label
                htmlFor="file"
                className="px-4 py-2 rounded-lg neumorphic-button text-slate-600 dark:text-slate-400 font-medium cursor-pointer flex items-center gap-2"
              >
                <span className="material-icons-outlined text-sm">attach_file</span>
                Seleccionar archivo
              </label>
              <input
                type="file"
                id="file"
                onChange={(e) => setSelectedFile(e.target.files[0])}
                className="hidden"
              />
              {selectedFile && (
                <span className="text-sm text-slate-600 dark:text-slate-400">{selectedFile.name}</span>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-end">
          <button
            onClick={() => router.back()}
            className="px-6 py-3 rounded-lg neumorphic-button font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => handleCreateContract(true)}
            className="px-6 py-3 rounded-lg neumorphic-button font-semibold text-yellow-600 hover:text-yellow-700 transition-colors flex items-center justify-center gap-2"
          >
            <span className="material-icons-outlined">save</span>
            Guardar como Borrador
          </button>
          <button
            onClick={() => handleCreateContract(false)}
            className="px-6 py-3 rounded-lg bg-primary text-white font-semibold neumorphic-button hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
          >
            <span className="material-icons-outlined">check</span>
            Crear Contrato
          </button>
        </div>
      </div>

      {/* Modal de duplicados */}
      {openDuplicityModal && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/50 z-[70] p-4"
        >
          <ConfirmContractModal
            duplicatedCustomers={duplicatedCustomers}
            openDuplicityModal={openDuplicityModal}
            setOpenDuplicityModal={setOpenDuplicityModal}
            confirmCreation={confirmCreation}
          />
        </div>
      )}

      {/* Modal de restauración de borrador */}
      <RestoreDraftModal
        isOpen={showRestoreModal}
        onRestore={handleRestoreDraft}
        onDiscard={handleDiscardDraft}
        lastSaved={lastSaved}
      />
    </div>
  );
}
