import { useState } from "react";

export default function ModalAddHolidays({ closeModal, handleSubmit }) {
  const [name, setName] = useState("");

  const toInputDate = (date) => {
    if (!date) return "";
    const d = date instanceof Date ? date : new Date(date);
    if (Number.isNaN(d.getTime())) return "";
    return d.toISOString().slice(0, 10);
  };

  const [date, setDate] = useState(toInputDate(new Date()));

  const handleSubmitForm = (e) => {
    e.preventDefault();
    handleSubmit({ name, date });
    closeModal();
  };

  return (
    <div className="fixed inset-0 lg:ml-72 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col transform transition-transform duration-300 ease-in-out scale-100 opacity-100">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Añadir Festivo</h3>
          <button
            type="button"
            onClick={closeModal}
            className="text-gray-400 hover:bg-gray-200 hover:text-gray-900 rounded-lg p-1.5 transition duration-150"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>
        <form
          onSubmit={handleSubmitForm}
          id="add-holiday-form"
          className="p-5 space-y-4 overflow-y-auto flex-grow"
        >
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-background text-sm"
              placeholder="Ej: Día del trabajador"
              required
            />
          </div>

          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
              Fecha
            </label>
            <input
              type="date"
              id="date"
              value={date}
              min={toInputDate(new Date())}
              onChange={(e) => setDate(e.target.value)}
              className="w-full h-10 border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-background text-sm"
              required
            />
          </div>
        </form>
        <div className="flex justify-end items-center space-x-3 p-5 border-t border-gray-200">
          <button
            type="button"
            className="px-4 py-2 rounded-md text-sm font-medium border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            onClick={closeModal}
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="add-holiday-form"
            className="px-4 py-2 rounded-md text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
