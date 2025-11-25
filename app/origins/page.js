"use client";
import { useState, useEffect } from "react";
import { getCookie } from "cookies-next";
import { authFetch, authGetFetch } from "@/helpers/server-fetch.helper";
import { FiTrash, FiPlus } from "react-icons/fi";

export default function Origins() {
  const [origins, setOrigins] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newState, setNewState] = useState({
    name: "",
    extraInfo: "",
  });

  const getOrigins = async () => {
    const jwtToken = getCookie("factura-token");

    try {
      const response = await authGetFetch("origins/all", jwtToken);

      if (response.ok) {
        const originsResponse = await response.json();

        setOrigins(originsResponse);
      } else {
        alert("Error cargando tu informacion");
      }
    } catch (error) {
      console.error("Error sending request:", error);
    }
  };

  useEffect(() => {
    getOrigins();
  }, []);

  const handleAddOrigin = async (e) => {
    e.preventDefault();
    const jwtToken = getCookie("factura-token");

    try {
      const response = await authFetch("POST", "origins/", newState, jwtToken);

      if (response.ok) {
        const addedState = await response.json();
        setOrigins([...origins, addedState]);
        setIsModalOpen(false);
        setNewState({
          name: "",
          extraInfo: "",
        });
      } else {
        alert("Error agregando el nuevo origen");
      }
    } catch (error) {
      console.error("Error enviando la solicitud:", error);
    }
  };

  const handleDeleteOrigin = async (id) => {
    const confirmDelete = confirm(
      "¿Estás seguro de que quieres eliminar este origen?"
    );
    if (!confirmDelete) return;

    const jwtToken = getCookie("factura-token");

    try {
      const response = await authFetch("DELETE", `origins/${id}`, {}, jwtToken);

      if (response.ok) {
        const filteredOrigins = origins.filter((state) => state.id !== id);
        setOrigins(filteredOrigins);
      } else {
        alert("Error eliminando el origen");
      }
    } catch (error) {
      console.error("Error enviando la solicitud:", error);
    }
  };

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="neumorphic-card p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Orígenes</h2>
          <button
            className="px-5 py-3 rounded-lg neumorphic-button text-white bg-primary hover:bg-primary/90 font-medium flex items-center"
            onClick={openModal}
          >
            <FiPlus className="mr-2" />
            Nuevo Origen
          </button>
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center lg:ml-72">
            <div className="modal-card p-6 w-full max-w-lg">
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">
                Crear nuevo origen
              </h3>
              <form onSubmit={handleAddOrigin}>
                <div className="mb-4">
                  <label className="block text-slate-700 dark:text-slate-300 mb-2" htmlFor="name">
                    Nombre del Origen
                  </label>
                  <input
                    type="text"
                    id="name"
                    className="w-full neumorphic-card-inset px-4 py-3 rounded-lg border-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 bg-transparent text-slate-800 dark:text-slate-200"
                    value={newState.name}
                    onChange={(e) =>
                      setNewState({ ...newState, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="mb-4">
                  <label
                    className="block text-slate-700 dark:text-slate-300 mb-2"
                    htmlFor="description"
                  >
                    Descripción
                  </label>
                  <input
                    type="text"
                    id="description"
                    className="w-full neumorphic-card-inset px-4 py-3 rounded-lg border-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 bg-transparent text-slate-800 dark:text-slate-200"
                    value={newState.extraInfo}
                    onChange={(e) =>
                      setNewState({ ...newState, extraInfo: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    className="px-5 py-3 rounded-lg neumorphic-button text-slate-700 dark:text-slate-300 font-medium"
                    onClick={closeModal}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-3 rounded-lg neumorphic-button text-white bg-primary hover:bg-primary/90 font-medium"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <table className="w-full text-left">
          <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <tr>
              <th className="p-3">Nombre del Origen</th>
              <th className="p-3">Descripción</th>
              <th className="p-3">Eliminar</th>
            </tr>
          </thead>
          <tbody>
            {origins.map((state) => (
              <tr key={state.id} className="table-row-divider">
                <td className="p-3 font-medium text-slate-800 dark:text-slate-200">
                  {state.name}
                </td>
                <td className="p-3 text-slate-600 dark:text-slate-400">{state.extraInfo}</td>
                <td className="p-3">
                  <button
                    className="p-2 rounded-lg neumorphic-button text-slate-600 dark:text-slate-400 hover:text-primary"
                    onClick={() => handleDeleteOrigin(state.id)}
                  >
                    <FiTrash size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
