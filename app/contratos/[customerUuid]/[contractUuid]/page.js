"use client";
import ContractForm from "@/components/contract-information.form";
import CustomerForm from "@/components/customer-information.form";
import ContractDetailNav from "@/components/contract-detail.navbar";
import ContractDocuments from "@/components/contract-documents.page";
import ContractHistory from "@/components/contract-history.page";
import ContractLogs from "@/components/contract-logs.page";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { getCookie } from "cookies-next";
import * as jose from "jose";
import { authGetFetch, authFetch } from "@/helpers/server-fetch.helper";
import RenewContractModal from "@/components/renew-contract.modal";
import RatesPricing from "@/components/rates-pricings.component";
import TelephonyContractForm from "@/components/telephony-contract-information.form";
import ContractsTypeModal from "@/components/contracts-type.modal";
import ContractNewEventModal from "@/components/contract-new-event.modal";
import { FaDownload } from "react-icons/fa";
import {
  NeumorphicCard,
  NeumorphicButton,
} from "@/components/neumorphic";


export default function ContractDetail({ params }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const customerUuid = params.customerUuid;
  const contractUuid = params.contractUuid;

  const [isMounted, setIsMounted] = useState(false);

  const [isManager, setIsManager] = useState(false);
  const [userGroupId, setUserGroupId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [customer, setCustomer] = useState(null);
  const [contracts, setContracts] = useState([]);
  const [companies, setCompanies] = useState([]);

  const [activeCompany, setActiveCompany] = useState(null);
  const [activeContract, setActiveContract] = useState(null);

  const [selectedSection, setSelectedSection] = useState("Detail");

  const [documentation, setDocumentation] = useState([]);

  const customerInformationFormRef = useRef(null);
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [contract, setContract] = useState(null);
  const [newComment, setNewComment] = useState({
    text: "",
  });
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);

  const getContractDetails = async () => {
    const jwtToken = getCookie("factura-token");

    try {
      const response = await authGetFetch(`contracts/${contractUuid}`, jwtToken);

      if (response.ok) {
        const contractResponse = await response.json();
        setContract(contractResponse);
      } else {
        alert("Error cargando los detalles del contrato");
      }
    } catch (error) {
      console.error("Error enviando la solicitud:", error);
    }
  };

  useEffect(() => {
    getContractDetails();
  }, [contractUuid]);

  const [isContractEventModalOpen, setIsContractEventModalOpen] = useState(false);

  const handleSectionChange = (section) => {
    setSelectedSection(section);
  };

  const handleRenewContract = async (formData) => {
    const jwtToken = getCookie("factura-token");
    try {
      const response = await authFetch(
        "PATCH",
        `contracts/renew/${activeContract.uuid}`,
        { rateId: formData.rateId },
        jwtToken
      );

      if (response.ok) {
        alert("Contrato renovado con éxito");
        router.push("/contratos");
      } else {
        alert("Error al renovar el contrato");
      }
    } catch (error) {
      console.error("Error renovando tu contrato:", error);
    }
  };

  const toggleModal = () => {
    setIsModalOpen((prev) => !prev);
  };

  const getCustomerDetails = async (customerUuid) => {
    const jwtToken = getCookie("factura-token");
    try {
      const response = await authGetFetch(`customers/${customerUuid}`, jwtToken);
      if (response.ok) {
        const customer = await response.json();
        setCustomer(customer); // Información del cliente
        setContracts(customer.contracts); // Ambos contratos (luz y gas)

        const active = customer.contracts.find((contract) => contract.uuid === contractUuid);
        setActiveContract(active || customer.contracts[0]);
        setIsMounted(true);
      } else {
        alert("Error al cargar los detalles del cliente y contratos");
      }
    } catch (error) {
      console.error("Error obteniendo los detalles del cliente:", error);
    }
  };

  const getCompanyDetails = async (companyUuid) => {
    const jwtToken = getCookie("factura-token");

    try {
      const response = await authGetFetch(`companies/${companyUuid}`, jwtToken);

      if (response.ok) {
        const companyResponse = await response.json();
        setActiveCompany(companyResponse);
      } else {
        alert("Error cargando la información de la compañía");
      }
    } catch (error) {
      console.error("Error enviando la solicitud:", error);
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

  const handleDuplicateContract = (contractType) => {
    contractType === "telefonia"
      ? router.push(`/nuevo-contrato-telefonia?customerUuid=${customerUuid}`)
      : router.push(`/nuevo-contrato?customerUuid=${customerUuid}`);
  };

  const handleRenewDuplicate = async () => {
    if (!confirm("¿Estás seguro de que quieres renovar este contrato? Se creará una copia del contrato con fecha de hoy y el contrato actual quedará marcado como 'Ya renovado'.")) {
      return;
    }

    const jwtToken = getCookie("factura-token");
    try {
      const response = await authFetch(
        "POST",
        `contracts/renew-duplicate/${contractUuid}`,
        {},
        jwtToken
      );

      if (response.ok) {
        const newContract = await response.json();
        alert("Contrato renovado con éxito");
        router.push(`/contratos/${customerUuid}/${newContract.uuid}`);
      } else {
        const errorData = await response.json();
        alert(errorData.message || "Error al renovar el contrato");
      }
    } catch (error) {
      console.error("Error renovando el contrato:", error);
      alert("Error al renovar el contrato");
    }
  };

  const handleCustomerUpdate = async (updatedCustomerData) => {
    const jwtToken = getCookie("factura-token");
    try {
      const response = await authFetch(
        "PATCH",
        `customers/${customerUuid}`,
        updatedCustomerData,
        jwtToken
      );

      if (!response.ok) {
        alert("Error actualizando el Cliente");
      } else {
        setCustomer(updatedCustomerData);
      }
    } catch (error) {
      console.error("Error enviando la solicitud:", error);
    }
  };

  const handleContractUpdate = async (updatedContractData) => {
    const jwtToken = getCookie("factura-token");
    let requestBody;

    if (updatedContractData.type === "Telefonía") {
      const telephonyData = {
        landlinePhone: updatedContractData.landlinePhone || 0,
        telephoneLines: updatedContractData.telephoneLines || [],
        extraServices: updatedContractData.extraServices || [],
        rates: updatedContractData.rates || [],
      };
      requestBody = {
        companyId: updatedContractData.companyId || null,
        electronicBill: updatedContractData.electronicBill,
        isDraft: updatedContractData.isDraft || false,
        extraInfo: updatedContractData.extraInfo || "",
        type: "Telefonía",
        telephonyData,
      };
    }

    try {
      const response = await authFetch(
        "PATCH",
        `contracts/${contractUuid}`,
        updatedContractData.type !== "Telefonía" ? updatedContractData : requestBody,
        jwtToken
      );

      if (!response.ok) {
        alert("Error actualizando el Contrato");
      } else {
        alert("Cliente y contrato actualizados correctamente");
      }
    } catch (error) {
      console.error("Error enviando la solicitud:", error);
    }
  };

  useEffect(() => {
    const section = searchParams.get("section") || "Detail";
    setSelectedSection(section);

    getCustomerDetails(customerUuid);
    getCompanies();
  }, [contractUuid]);

  useEffect(() => {
    if (activeContract) {
      if (activeContract?.company) {
        getCompanyDetails(activeContract.company.uuid);
      }

      if (activeContract.type !== "Telefonía") {
        setDocumentation(activeContract?.rate?.documentation);
      } else {
        const allDocumentations = Array.from(
          new Set(
            (activeContract?.telephonyData?.rates || [])
              .flatMap((rate) => rate.documentation || [])
              .filter((doc) => doc !== null)
          )
        );
        setDocumentation(allDocumentations);
      }

      const jwtToken = getCookie("factura-token");

      if (jwtToken) {
        const payload = jose.decodeJwt(jwtToken);
        setIsManager(payload.isManager || false);
        setUserGroupId(payload.groupId || null);
      }
    }
  }, [activeContract]);

  const calculateDaysRemaining = (expiresAt) => {
    const today = new Date();
    const expiryDate = new Date(expiresAt);
    const timeDiff = expiryDate - today;
    const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

    return Math.max(daysRemaining, 0);
  };

  if (!isMounted) {
    return null;
  }

  const openModal = () => setIsContractModalOpen(true);
  const closeModal = () => setIsContractModalOpen(false);

  const openEventModal = () => setIsContractEventModalOpen(true);

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    const jwtToken = getCookie("factura-token");

    const formData = new FormData();
    formData.append("text", newComment.text);
    if (file) {
      formData.append("contractCommentFile", file);
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/contract-comments/${contractUuid}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${jwtToken}`,
          },
          body: formData,
        }
      );

      if (response.ok) {
        setNewComment({ text: "" });
        setFile(null);
        fileInputRef.current.value = null;

        await getContractDetails();
      } else {
        alert("Error al agregar el comentario");
      }
    } catch (error) {
      console.error("Error enviando el comentario:", error);
    }
  };

  if (!contract) {
    return (
      <div className="p-6 flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="neumorphic-card p-8 rounded-xl">
            <span className="material-icons-outlined text-6xl text-primary animate-spin">
              refresh
            </span>
            <p className="mt-4 text-slate-600 dark:text-slate-400">Cargando contrato...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="neumorphic-card p-6">
        {/* Información general del cliente y contratos */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-6 mb-6">
            {/* Imagen de la compañía activa */}
            {activeCompany && (
              <img
                src={`${activeCompany.imageUri}`}
                alt={activeCompany.name}
                className="h-32 w-32 object-contain"
              />
            )}

            {/* Información del contrato */}
            {customer && activeContract && (
              <div className="flex flex-col space-y-2">
                <div className="text-xl font-semibold text-slate-800 dark:text-slate-100">
                  {contracts[0]?.type === "Telefonía" ? (
                    <>
                      <span className="font-bold text-slate-800 dark:text-slate-100">Tarifas de telefonía:</span>{" "}
                      {contracts[0]?.telephonyData?.rates &&
                        contracts[0]?.telephonyData?.rates.length > 0 ? (
                        <ul>
                          {contracts[0].telephonyData.rates.map((rate, index) => (
                            <li className="px-4 text-slate-700 dark:text-slate-300" key={index}>
                              - {rate.name || "Sin Definir"}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        "Sin Definir"
                      )}
                    </>
                  ) : (
                    <>
                      <span className="font-bold text-slate-800 dark:text-slate-100">Tarifa:</span>{" "}
                      {activeContract?.rate?.name ? activeContract.rate.name : "Sin Definir"}
                    </>
                  )}
                </div>
                <p className="text-xl font-semibold text-slate-800 dark:text-slate-100">
                  <span className="font-bold text-slate-800 dark:text-slate-100">Asesor:</span> {activeContract?.user?.name || "Sin asignar"}{" "}
                  {activeContract?.user?.firstSurname || ""}
                </p>
              </div>
            )}
          </div>

          {/* Contenedor para el RatesPricing y el botón */}
          <div className="flex items-center space-x-20">
            {/* Información de la tarifa */}
            <RatesPricing contract={activeContract} />

            {/* Botones de acciones */}
            <div className="flex flex-col space-y-2">
              <button
                onClick={openEventModal}
                className="flex items-center px-5 py-2 rounded-lg neumorphic-button font-medium text-slate-600 dark:text-slate-400"
              >
                <span className="material-icons-outlined mr-2 text-base">event</span>
                Añadir evento
              </button>
              <button
                onClick={openModal}
                className="flex items-center px-5 py-2 rounded-lg neumorphic-button active bg-primary text-white font-semibold"
              >
                <span className="material-icons-outlined mr-2 text-base">content_copy</span>
                Duplicar Ficha
              </button>
              {!contract?.isRenewed && (
                <button
                  onClick={handleRenewDuplicate}
                  className="flex items-center px-5 py-2 rounded-lg neumorphic-button font-medium text-emerald-600 dark:text-emerald-400 border-2 border-emerald-500"
                >
                  <span className="material-icons-outlined mr-2 text-base">autorenew</span>
                  Renovar
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Barra de Navegación */}
        <ContractDetailNav activeSection={selectedSection} onSectionChange={handleSectionChange} />

        {/* Renderizamos la sección en función de lo seleccionado en la navegación */}
        {selectedSection === "Detail" && (
          <>
            {/* Información de los detalles del cliente */}
            {/* Solo Supervisores (isManager) o Admin (groupId === 1) pueden editar fichas no borrador */}
            <CustomerForm
              fieldsDisabled={!activeContract.isDraft && !isManager && userGroupId !== 1}
              customerData={customer}
              onCustomerUpdate={handleCustomerUpdate}
              contractIsDraft={activeContract.isDraft}
              electronicBill={activeContract.electronicBill}
              ref={customerInformationFormRef}
            />

            {/* Sección de contratos de luz y gas */}
            <div className="grid grid-cols-2 gap-6">
              {contracts
                .filter((contract) => contract.type !== "Telefonía")
                .map((contract) => (
                  <ContractForm
                    key={contract.uuid}
                    contract={contract}
                    isActive={contract.uuid === activeContract?.uuid}
                    companies={companies.filter((company) => company.type == contract.type)}
                    onSubmit={handleContractUpdate}
                    childCustomerFormRef={customerInformationFormRef}
                  />
                ))}
            </div>
            {/* Sección de contrato de telefonia */}
            <div className="grid grid-cols-2 gap-6">
              {contracts
                .filter((contract) => contract.type === "Telefonía")
                .map((contract) => (
                  <TelephonyContractForm
                    key={contract.uuid}
                    contract={contract}
                    isActive={contract.uuid === activeContract?.uuid}
                    companies={companies.filter((company) => company.type == contract.type)}
                    onSubmit={handleContractUpdate}
                    childCustomerFormRef={customerInformationFormRef}
                  />
                ))}
            </div>

            <div className="border-t border-slate-200 dark:border-slate-700 pt-6 mt-10">
              <h3 className="text-2xl font-bold mb-4 text-slate-800 dark:text-slate-100">Comentarios</h3>
              {
                contract.comments?.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table key={contract.uuid} className="w-full text-left">
                      <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        <tr>
                          <th className="p-3">Fecha</th>
                          <th className="p-3">Usuario</th>
                          <th className="p-3">Comentario</th>
                          <th className="p-3">Adjunto</th>
                        </tr>
                      </thead>
                      <tbody>
                        {contract.comments.map((comment, index) => (
                          <tr key={index} className="table-row-divider">
                            <td className="p-3 text-slate-600 dark:text-slate-400">
                              {new Date(comment.createdAt).toLocaleDateString()}
                            </td>
                            <td className="p-3 text-slate-600 dark:text-slate-400">
                              {(comment.user?.name || "Usuario desconocido") +
                                " " +
                                (comment.user?.firstSurname || "")}
                            </td>
                            <td className="p-3 text-slate-600 dark:text-slate-400">
                              {comment.text}
                            </td>
                            <td className="p-3 text-center">
                              {comment.documentUri ? (
                                <a
                                  href={comment.documentUri}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center text-primary hover:text-primary/80"
                                >
                                  <FaDownload />
                                </a>
                              ) : (
                                <span className="text-slate-400 dark:text-slate-500">No hay adjunto</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p key={contract.uuid} className="text-slate-600 dark:text-slate-400">No hay comentarios para este contrato.</p>
                )
              }


            </div>

            {/* Nuevo comentario */}
            <div className="border-t border-slate-200 dark:border-slate-700 pt-6 mt-6 mb-12">
              <h3 className="text-2xl font-bold mb-4 text-slate-800 dark:text-slate-100 flex items-center">
                <span className="material-icons-outlined mr-2">add_comment</span>
                Nuevo Comentario
              </h3>
              <textarea
                placeholder="Escribe aquí..."
                value={newComment.text}
                onChange={(e) =>
                  setNewComment({ ...newComment, text: e.target.value })
                }
                className="w-full neumorphic-card-inset p-4 rounded-lg border-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 text-sm bg-transparent mb-4 text-slate-700 dark:text-slate-300"
                rows="4"
              ></textarea>

              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => setFile(e.target.files[0])}
                className="mb-4 text-slate-600 dark:text-slate-400"
              />

              <div className="flex justify-end">
                <button
                  className="flex items-center px-5 py-2 rounded-lg neumorphic-button active bg-primary text-white font-semibold"
                  onClick={handleSubmitComment}
                >
                  <span className="material-icons-outlined mr-2 text-base">send</span>
                  Comentar
                </button>
              </div>
            </div>

            {activeContract && activeContract.expiresAt && (
              <>
                <div className="flex justify-start items-center space-x-4 mt-6 border-t border-slate-200 dark:border-slate-700 pt-6">
                  <button
                    onClick={toggleModal}
                    className={`flex items-center px-6 py-2 rounded-lg font-semibold ${calculateDaysRemaining(activeContract.expiresAt) > 0
                      ? "neumorphic-card bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                      : "neumorphic-button active bg-primary text-white hover:bg-primary/90"
                      }`}
                    disabled={calculateDaysRemaining(activeContract.expiresAt) > 0}
                  >
                    <span className="material-icons-outlined mr-2 text-base">autorenew</span>
                    RENOVAR
                  </button>

                  <div className="flex items-center space-x-3 neumorphic-card px-6 py-3 rounded-lg">
                    <span className="text-2xl font-bold text-primary">
                      {calculateDaysRemaining(activeContract.expiresAt)}
                    </span>
                    <span className="text-xs font-medium uppercase text-slate-600 dark:text-slate-400">Días restantes</span>
                  </div>
                </div>

                <RenewContractModal
                  isOpen={isModalOpen}
                  onClose={toggleModal}
                  onSave={handleRenewContract}
                  companies={companies}
                />
              </>
            )}
          </>
        )}

        {selectedSection === "Activity" && (
          <div>
            <ContractLogs contractUuid={contractUuid} />
          </div>
        )}

        {selectedSection === "Historic" && (
          <div>
            <ContractHistory contractUuid={contractUuid} />
          </div>
        )}

        {selectedSection === "Documents" && (
          <div>
            <ContractDocuments contractUuid={contractUuid} documentation={documentation} />
          </div>
        )}
      </div>
      {isContractModalOpen && (
        <ContractsTypeModal
          isContractModalOpen={isContractModalOpen}
          closeModal={closeModal}
          handleCreateContract={handleDuplicateContract}
        />
      )}

      {isContractEventModalOpen && (
        <div
          className={`fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 ${isModalOpen ? "lg:ml-72" : ""
            }`}
        >
          <ContractNewEventModal
            isModalOpen={isContractEventModalOpen}
            setIsModalOpen={setIsContractEventModalOpen}
            contract={activeContract}
            customer={customer}
          />
        </div>
      )}
    </div>
  );
}
