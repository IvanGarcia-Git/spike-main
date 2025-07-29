export default function DeleteFolderModal({ onConfirm, onCancel }) {
    return (
      <div
        className="fixed lg:ml-72 inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="bg-white p-6 rounded-lg shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-xl font-bold mb-4">¿Eliminar carpeta?</h2>
          <p className="mb-6">
            ¿Estás seguro de que quieres eliminar esta carpeta? Esta acción no se puede deshacer.
          </p>
          <div className="flex justify-end space-x-4">
            <button
              className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
              onClick={(e) => {
                e.stopPropagation();
                onCancel();
              }}
            >
              Cancelar
            </button>
            <button
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              onClick={(e) => {
                e.stopPropagation();
                onConfirm();
              }}
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>
    );
  }