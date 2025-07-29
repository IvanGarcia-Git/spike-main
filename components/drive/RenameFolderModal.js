import { useState } from "react";

export default function RenameFolderModal({ onConfirm, onCancel, folder }) {
  const [newName, setNewName] = useState(folder.name);

  const handleConfirm = (e) => {
    e.stopPropagation();
    if (newName.trim() === "") {
      alert("El nombre de la carpeta no puede estar vacío.");
      return;
    }
    onConfirm({ ...folder, name: newName });
  };

  const handleCancel = (e) => {
    e.stopPropagation();
    onCancel();
  };

  return (
    <div
      className="fixed lg:ml-72 inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-10"
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="bg-white p-6 rounded-lg shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4">Cambiar nombre de la carpeta</h2>
        <p className="mb-6">
          Al confirmar el cambio de nombre, no será posible deshacer esta acción.
        </p>
        <input
          type="text"
          value={newName}
          onChange={(e) => {
            e.stopPropagation();
            setNewName(e.target.value);
          }}
          className="w-full p-2 border border-gray-300 rounded-md mb-4"
          placeholder="Nuevo nombre de la carpeta"
          onClick={(e) => e.stopPropagation()}
        />
        <div className="flex justify-end space-x-4">
          <button
            className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
            onClick={handleCancel}
          >
            Cancelar
          </button>
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            onClick={handleConfirm}
          >
            Renombrar
          </button>
        </div>
      </div>
    </div>
  );
}