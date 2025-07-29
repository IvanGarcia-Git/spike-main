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


export default function ContractDetail({ params }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const customerUuid = params.customerUuid;
  const contractUuid = params.contractUuid;

  const [isMounted, setIsMounted] = useState(false);

  const [isManager, setIsManager] = useState(false);
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
      <div className="flex justify-center items-start bg-background min-h-screen">
        <div className="w-full max-w-7xl bg-foreground text-black p-6 rounded-lg">
          <h2 className="text-3xl font-bold mb-4">Cargando...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto bg-foreground p-6 rounded-lg shadow-lg">
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
                <div className="text-xl font-semibold text-black">
                  {contracts[0].type === "Telefonía" ? (
                    <>
                      <span className="font-bold text-black">Tarifas de telefonía:</span>{" "}
                      {contracts[0].telephonyData?.rates &&
                        contracts[0].telephonyData?.rates.length > 0 ? (
                        <ul>
                          {contracts[0].telephonyData.rates.map((rate, index) => (
                            <li className="px-4" key={index}>
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
                      <span className="font-bold text-black">Tarifa:</span>{" "}
                      {activeContract?.rate?.name ? activeContract.rate.name : "Sin Definir"}
                    </>
                  )}
                </div>
                <p className="text-xl font-semibold text-black">
                  <span className="font-bold text-black">Asesor:</span> {activeContract.user.name}{" "}
                  {activeContract.user.firstSurname}
                </p>
              </div>
            )}
          </div>

          {/* Contenedor para el RatesPricing y el botón */}
          <div className="flex items-center space-x-20">
            {/* Información de la tarifa */}
            <RatesPricing contract={activeContract} />

            {/* Botón Duplicar Ficha */}
            <div className="flex flex-col">
              <button
                onClick={openEventModal}
                className="bg-white text-blue-600 px-4 py-2 rounded-full mb-2  hover:bg-gray-100 border border-blue-600"
              >
                Añadir evento
              </button>
              <button
                onClick={openModal}
                className="bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700"
              >
                Duplicar Ficha
              </button>
            </div>
          </div>
        </div>

        {/* Barra de Navegación */}
        <ContractDetailNav activeSection={selectedSection} onSectionChange={handleSectionChange} />

        {/* Renderizamos la sección en función de lo seleccionado en la navegación */}
        {selectedSection === "Detail" && (
          <>
            {/* Información de los detalles del cliente */}
            <CustomerForm
              fieldsDisabled={!activeContract.isDraft && !isManager}
              customerData={customer}
              onCustomerUpdate={handleCustomerUpdate}
              contractIsDraft={activeContract.isDraft}
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

            <div className="border-t-2 pt-4 mt-10 text-black">
              <h3 className="text-2xl font-bold mb-4">Comentarios</h3>
              {
                contract.comments?.length > 0 ? (
                  <table key={contract.uuid} className="min-w-full bg-foreground">
                    <thead className="bg-background">
                      <tr>
                        <th className="py-2 px-4">Fecha</th>
                        <th className="py-2 px-4">Usuario</th>
                        <th className="py-2 px-4">Comentario</th>
                        <th className="py-2 px-4">Adjunto</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-300 divide-y divide-gray-600">
                      {contract.comments.map((comment, index) => (
                        <tr key={index} className="bg-foreground hover:bg-background">
                          <td className="py-2 px-4 text-center text-black">
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-2 px-4 text-center text-black">
                            {(comment.user?.name || "Usuario desconocido") +
                              " " +
                              (comment.user?.firstSurname || "")}
                          </td>
                          <td className="py-2 px-4 text-center text-black">
                            {comment.text}
                          </td>
                          <td className="py-2 px-4 text-center flex justify-center items-center text-black">
                            {comment.documentUri ? (
                              <a
                                href={comment.documentUri}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <FaDownload />
                              </a>
                            ) : (
                              <span>No hay adjunto</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p key={contract.uuid} className="text-black">No hay comentarios para este contrato.</p>
                )
              }


            </div>

            {/* Nuevo comentario */}
            <div className="border-t-2 pt-4 mt-6 mb-12 text-black">
              <h3 className="text-2xl font-bold mb-2">+ Nuevo Comentario</h3>
              <textarea
                placeholder="Escribe aquí..."
                value={newComment.text}
                onChange={(e) =>
                  setNewComment({ ...newComment, text: e.target.value })
                }
                className="w-full p-3 rounded-md border border-gray-300 mb-4 focus:outline-none focus:ring"
                rows="4"
              ></textarea>

              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => setFile(e.target.files[0])}
                className="mb-4"
              />

              <div className="flex justify-end">
                <button
                  className="bg-secondary text-white px-4 py-2 rounded-md hover:bg-secondaryHover"
                  onClick={handleSubmitComment}
                >
                  Comentar
                </button>
              </div>
            </div>

            {activeContract && activeContract.expiresAt && (
              <>
                <div className="flex justify-start items-center space-x-4 mt-4">
                  <button
                    onClick={toggleModal}
                    className={`px-6 py-2 rounded-full text-black ${calculateDaysRemaining(activeContract.expiresAt) > 0
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                      }`}
                    disabled={calculateDaysRemaining(activeContract.expiresAt) > 0}
                  >
                    RENOVAR
                  </button>

                  <div className="flex items-center space-x-2 bg-gray-300 px-4 py-2 text-black rounded-full">
                    <span className="text-lg font-semibold">
                      {calculateDaysRemaining(activeContract.expiresAt)}
                    </span>
                    <span className="text-xs font-medium uppercase">Días restantes</span>
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
