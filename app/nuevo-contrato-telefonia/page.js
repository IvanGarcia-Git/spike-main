"use client";
import { useState, useEffect } from "react";
import CreateCustomerForm from "@/components/create-customer.form";
import CreateTelephonyContractForm from "@/components/create-telephony-contract.form";
import { useRouter } from "next/navigation";
import { getCookie } from "cookies-next";
import { authGetFetch, authFetch } from "@/helpers/server-fetch.helper";
import { isCustomerDataValid } from "@/helpers/validation.helper";
import { validateIBANMath } from "@/helpers/validation.helper";
import ConfirmContractModal from "@/components/confirm-create-contract.modal";

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
      getCustomerDetails(customerUuid);
    } else if (leadSheetUuid) {
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

  const handleCreateContract = async (isDraft = true) => {
    //Validaciones
    if (!isDraft) {
      if (!isCustomerDataValid(customerData)) {
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

      const customerResponse = await authFetch("POST", `customers/`, customerDataToSend, jwtToken);

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
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto bg-foreground p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-black mb-6">Crear Nuevo Contrato</h2>

        <CreateCustomerForm
          customerData={customerData}
          onCustomerUpdate={handleCustomerUpdate}
          documentType={documentType}
          onDocumentTypeChange={handleSelectChange}
        />

        <div className="grid grid-cols-2 gap-6">
          <CreateTelephonyContractForm
            companies={companies.filter((company) => company.type === "Telefonía")}
            onContractUpdate={handleContractTelephonyUpdate}
          />
        </div>

        <div className="mb-4 mt-4">
          <label className="block text-black mb-2" htmlFor="comments">
            Comentario
          </label>
          <textarea
            id="comments"
            className="w-full h-32 px-4 py-2 rounded bg-background text-black focus:outline-none"
            rows="4"
            value={newContractComment.initialComment}
            onChange={(e) =>
              setNewContractComment({ ...newContractComment, initialComment: e.target.value })
            }
          ></textarea>
        </div>

        <div className="mb-4 text-black">
          <label className="block text-black mb-2" htmlFor="file">
            Archivo
          </label>
          <input
            type="file"
            id="file"
            onChange={(e) => setSelectedFile(e.target.files[0])}
            className="w-full cursor-pointer"
          />
        </div>

        <div className="mt-6 flex space-x-4">
          <button
            onClick={() => handleCreateContract(true)}
            className="bg-yellow-600 text-white px-4 py-2 rounded-full hover:bg-yellow-700"
          >
            Guardar como Borrador
          </button>

          <button
            onClick={() => handleCreateContract(false)}
            className="bg-secondary text-white px-4 py-2 rounded-full hover:bg-secondaryHover"
          >
            Guardar
          </button>
        </div>
      </div>
      {/* Modal */}
      {openDuplicityModal && (
        <div
          className={`fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 ${
            openDuplicityModal ? "lg:ml-72" : ""
          }`}
        >
          <ConfirmContractModal
            duplicatedCustomers={duplicatedCustomers}
            openDuplicityModal={openDuplicityModal}
            setOpenDuplicityModal={setOpenDuplicityModal}
            confirmCreation={confirmCreation}
          />
        </div>
      )}
    </div>
  );
}
