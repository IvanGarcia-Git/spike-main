"use client";

export default function ConfirmContractModal({
  duplicatedCustomers,
  openDuplicityModal,
  setOpenDuplicityModal,
  confirmCreation,
}) {
  if (!openDuplicityModal) return null;

  return (
    <div className="modal-card p-6 w-full max-w-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-yellow-500 bg-opacity-10 flex items-center justify-center">
            <span className="material-icons-outlined text-2xl text-yellow-500">warning</span>
          </div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            Duplicidad detectada
          </h2>
        </div>
        <button
          onClick={() => setOpenDuplicityModal(false)}
          className="w-10 h-10 rounded-full neumorphic-button flex items-center justify-center text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
        >
          <span className="material-icons-outlined">close</span>
        </button>
      </div>

      {/* Content */}
      <div className="neumorphic-card-inset p-4 rounded-lg mb-6">
        <p className="text-slate-600 dark:text-slate-400 mb-4">
          Se encontraron clientes con datos similares. <span className="font-semibold text-slate-800 dark:text-slate-200">¿Deseas crear este contrato?</span>
        </p>

        <div className="space-y-2">
          {duplicatedCustomers.map((customer) => (
            <div
              key={customer.uuid}
              className="flex items-center gap-3 p-3 rounded-lg bg-background-light dark:bg-background-dark"
            >
              <div className="w-10 h-10 rounded-full neumorphic-card flex items-center justify-center flex-shrink-0">
                <span className="material-icons-outlined text-primary">person</span>
              </div>
              <div>
                <p className="font-medium text-slate-800 dark:text-slate-200">
                  {customer.name} {customer.surnames}
                </p>
                {customer.email && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">{customer.email}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={() => setOpenDuplicityModal(false)}
          className="flex-1 px-6 py-3 rounded-lg neumorphic-button font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={confirmCreation}
          className="flex-1 px-6 py-3 rounded-lg bg-primary text-white font-semibold neumorphic-button hover:bg-primary/90 transition-colors"
        >
          Confirmar
        </button>
      </div>
    </div>
  );
}
