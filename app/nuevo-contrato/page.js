"use client";
import { useState, useEffect } from "react";
import CreateCustomerForm from "@/components/create-customer.form";
import CreateContractForm from "@/components/create-contract.form";
import { useRouter } from "next/navigation";
import { getCookie } from "cookies-next";
import { authGetFetch, authFetch } from "@/helpers/server-fetch.helper";
import { isCustomerDataValid } from "@/helpers/validation.helper";
import { validateIBANMath } from "@/helpers/validation.helper";
import ConfirmContractModal from "@/components/confirm-create-contract.modal";

export default function CreateContractPage() {
  const router = useRouter();
  const [documentType, setDocumentType] = useState("NIF / DNI");
  const [companies, setCompanies] = useState([]);
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

  const [contractLuzData, setContractLuzData] = useState({
    type: "Luz",
    companyId: "",
    rateId: "",
    cups: "",
    maintenance: false,
    electronicBill: false,
    extraInfo: "",
    virtualBat: false,
    solarPlates: false,
    contractedPowers: Array(6).fill(""),
    selectedFiles: [],
  });

  const [contractGasData, setContractGasData] = useState({
    type: "Gas",
    companyId: "",
    rateId: "",
    cups: "",
    maintenance: false,
    electronicBill: false,
    extraInfo: "",
    product: "", // RL1, RL2...RL6
    selectedFiles: [],
  });

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

  const isContractLuzValid = () => {
    if (!contractLuzData?.isSelected) return true;

    return (
      contractLuzData?.companyId &&
      contractLuzData?.rateId &&
      contractLuzData?.cups &&
      contractLuzData?.contractedPowers.length > 0
    );
  };

  const isContractGasValid = () => {
    if (!contractGasData?.isSelected) return true;

    return (
      contractGasData?.companyId &&
      contractGasData?.rateId &&
      contractGasData?.cups &&
      contractGasData?.product
    );
  };

  const handleCustomerUpdate = (updatedCustomerData) => {
    setCustomerData(updatedCustomerData);
  };

  const handleContractLuzUpdate = (updatedContractData) => {
    setContractLuzData(updatedContractData);
  };

  const handleContractGasUpdate = (updatedContractData) => {
    setContractGasData(updatedContractData);
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

      if (!isContractLuzValid() || !isContractGasValid()) {
        alert("Por favor, rellena todos los campos de los contratos seleccionados.");
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

          if (contractLuzData.isSelected && contractLuzData.cups) {
            params.cups = contractLuzData.cups;
          }

          else if (contractGasData.isSelected && contractGasData.cups) {
            params.cups = contractGasData.cups;
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

        //Luz
        if (contractLuzData.isSelected) {
          const contractLuzResponse = await authFetch(
            "POST",
            `contracts/`,
            {
              ...contractLuzData,
              customerId: createdCustomer.id,
              isDraft,
              rateId: contractLuzData.rateId === "" ? null : contractLuzData.rateId,
              companyId: contractLuzData.companyId === "" ? null : contractLuzData.companyId,
            },
            jwtToken
          );

          const createdContract = await contractLuzResponse.json();

          if (contractLuzResponse.ok && contractLuzData.selectedFiles.length > 0) {
            const formData = new FormData();

            formData.append("contractUuid", createdContract.uuid);

            const normalizedFiles = contractLuzData.selectedFiles.map((item) =>
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
        }

        //Gas
        if (contractGasData.isSelected) {
          const contractGasResponse = await authFetch(
            "POST",
            `contracts/`,
            {
              ...contractGasData,
              customerId: createdCustomer.id,
              isDraft,
              rateId: contractGasData.rateId === "" ? null : contractGasData.rateId,
              companyId: contractGasData.companyId === "" ? null : contractGasData.companyId,
            },
            jwtToken
          );

          if (contractGasResponse.ok) {
            const createdContract = await contractGasResponse.json();

            if (newContractComment.initialComment) {
              const formData = new FormData();
              if (selectedFile) {
                formData.append("contractCommentFile", selectedFile);
              }
              formData.append("text", newContractComment.initialComment);

              try {
                const response = await fetch(
                  `${process.env.NEXT_PUBLIC_API_URL}/contract-comments/${createdContract.uuid}`,
                  {
                    method: "POST",
                    headers: {
                      Authorization: `Bearer ${jwtToken}`,
                    },
                    body: formData,
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
          } else {
            alert("Error al crear el contrato.");
          }
        }

        alert("Contratos creados con éxito");

        router.push("/contratos");
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
      <div className="max-w-7xl mx-auto neumorphic-card p-6 rounded-lg">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">Crear Nuevo Contrato</h2>

        {/* Información de los detalles del cliente */}
        <CreateCustomerForm
          customerData={customerData}
          onCustomerUpdate={handleCustomerUpdate}
          documentType={documentType}
          onDocumentTypeChange={handleSelectChange}
        />

        {/* Sección de contratos de luz y gas */}
        <div className="grid grid-cols-2 gap-6">
          {/* Contrato Luz */}
          <CreateContractForm
            contractType="Luz"
            companies={companies.filter((company) => company.type == "Luz")}
            onContractUpdate={handleContractLuzUpdate}
          />

          {/* Contrato Gas */}
          <CreateContractForm
            contractType="Gas"
            companies={companies.filter((company) => company.type == "Gas")}
            onContractUpdate={handleContractGasUpdate}
          />
        </div>

        <div className="mb-4 mt-4">
          <label className="block text-slate-800 dark:text-slate-100 mb-2" htmlFor="comments">
            Comentario
          </label>
          <textarea
            id="comments"
            className="neumorphic-card-inset w-full h-32 px-4 py-3 rounded-lg border-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 bg-transparent text-slate-800 dark:text-slate-100"
            rows="4"
            value={newContractComment.initialComment}
            onChange={(e) =>
              setNewContractComment({ ...newContractComment, initialComment: e.target.value })
            }
          ></textarea>
        </div>

        <div className="mb-4 text-slate-800 dark:text-slate-100">
          <label className="block text-slate-800 dark:text-slate-100 mb-2" htmlFor="file">
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
            className="bg-yellow-600 text-white px-5 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all font-medium"
          >
            Guardar como Borrador
          </button>

          <button
            onClick={() => handleCreateContract(false)}
            className="bg-secondary text-white px-5 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all font-medium"
          >
            Guardar
          </button>
        </div>
      </div>
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
