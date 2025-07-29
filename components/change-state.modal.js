"use client";
import React from "react";
import { FaTimes } from "react-icons/fa";

export default function ChangeStateModal({
  setIsStateChangeModalOpen,
  selectedStateForBatch,
  setSelectedStateForBatch,
  contractStates,
  handleBatchStateChange,
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4 lg:ml-72 text-black">
      <div className="bg-white p-6 md:p-8 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">Cambiar estado</h2>
          <button
            onClick={() => {
              setIsStateChangeModalOpen(false);
              setSelectedStateForBatch(null);
            }}
            className="text-gray-500 hover:text-gray-700"
          >
            <FaTimes size={20} />
          </button>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Seleccionar nuevo estado:
          </label>
          <select
            value={selectedStateForBatch?.id || ""}
            onChange={(e) => {
              const selectedState = contractStates.find(
                (state) => state.id === parseInt(e.target.value)
              );
              setSelectedStateForBatch(selectedState);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Selecciona un estado</option>
            {contractStates.map((state) => (
              <option key={state.id} value={state.id}>
                {state.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
          <button
            type="button"
            onClick={() => {
              setIsStateChangeModalOpen(false);
              setSelectedStateForBatch(null);
            }}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 w-full sm:w-auto"
          >
            Cancelar
          </button>
          <button
            onClick={handleBatchStateChange}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 w-full sm:w-auto"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
