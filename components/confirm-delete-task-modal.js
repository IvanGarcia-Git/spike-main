export default function ConfirmDeleteTaskModal({ onClose, onDelete }) {
  return (
    <div className="fixed inset-0 flex justify-center bg-black bg-opacity-50 z-50 overflow-y-auto lg:ml-72">
      <div className="bg-background text-black p-8 rounded-lg shadow-lg w-full max-w-lg relative my-auto overflow-y-auto max-h-[90vh]">
        <h2 className="text-2xl font-bold mb-4">
          ¿Estás seguro de querer eliminar esta tarea?
        </h2>
        <div className="flex gap-4">
          <button
            className="bg-slate-400 hover:bg-slate-500 text-white px-4 py-2 rounded-md"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md"
            onClick={onDelete}
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}
