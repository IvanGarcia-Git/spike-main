"use client";

export default function ContractsTypeModal({
  isContractModalOpen,
  closeModal,
  handleCreateContract,
}) {
  if (!isContractModalOpen) return null;

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4 ${
        isContractModalOpen ? "lg:ml-72" : ""
      }`}
    >
      <div className="modal-card p-8 w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            Tipo de Contrato
          </h2>
          <button
            onClick={closeModal}
            className="w-10 h-10 rounded-full neumorphic-button flex items-center justify-center text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
          >
            <span className="material-icons-outlined">close</span>
          </button>
        </div>

        {/* Question */}
        <p className="text-slate-600 dark:text-slate-400 text-center mb-8">
          ¿Qué tipo de contrato quieres crear?
        </p>

        {/* Options */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => handleCreateContract("telefonia")}
            className="neumorphic-card p-6 flex flex-col items-center justify-center gap-3 hover:shadow-lg transition-all group"
          >
            <div className="w-16 h-16 rounded-full flex items-center justify-center shadow-neumorphic-light-lg dark:shadow-neumorphic-dark-lg bg-blue-500 bg-opacity-10 group-hover:bg-opacity-20 transition-colors">
              <span className="material-icons-outlined text-4xl text-blue-500">phone_android</span>
            </div>
            <span className="font-semibold text-slate-800 dark:text-slate-200">Telefonía</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Móvil y fijo</span>
          </button>

          <button
            onClick={() => handleCreateContract("energia")}
            className="neumorphic-card p-6 flex flex-col items-center justify-center gap-3 hover:shadow-lg transition-all group"
          >
            <div className="w-16 h-16 rounded-full flex items-center justify-center shadow-neumorphic-light-lg dark:shadow-neumorphic-dark-lg bg-green-500 bg-opacity-10 group-hover:bg-opacity-20 transition-colors">
              <span className="material-icons-outlined text-4xl text-green-500">bolt</span>
            </div>
            <span className="font-semibold text-slate-800 dark:text-slate-200">Energía</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Luz y gas</span>
          </button>
        </div>

        {/* Cancel Button */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={closeModal}
            className="px-6 py-3 rounded-lg neumorphic-button font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
