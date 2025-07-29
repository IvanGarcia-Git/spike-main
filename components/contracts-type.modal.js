"use client";
import { MdClose } from "react-icons/md";

export default function ContractsTypeModal({
  isContractModalOpen,
  closeModal,
  handleCreateContract,
}) {
  if (!isContractModalOpen) return null;

  return (
    <div
      className={`fixed inset-0 flex justify-center bg-black bg-opacity-50 z-50 overflow-y-auto ${
        isContractModalOpen ? "lg:ml-72" : ""
      }`}
    >
      <div className="bg-background text-black p-8 rounded-lg shadow-lg w-full max-w-4xl relative my-auto overflow-y-auto max-h-[90vh]">
        <button
          onClick={closeModal}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
        >
          <MdClose size={30} />
        </button>
        <h1 className="text-2xl font-semibold text-center mb-6">
          ¿Qué tipo de contrato quieres crear?
        </h1>

        <div className="flex justify-center space-x-4">
          <button
            onClick={() => handleCreateContract("telefonia")}
            className="bg-blue-400 text-white px-6 py-3 rounded-full hover:bg-blue-500 transition-shadow shadow-md text-lg"
          >
            Telefonía
          </button>

          <button
            onClick={() => handleCreateContract("energia")}
            className="bg-green-400 text-white px-6 py-3 rounded-full hover:bg-green-500 transition-shadow shadow-md text-lg"
          >
            Energía
          </button>
        </div>
      </div>
    </div>
  );
}
