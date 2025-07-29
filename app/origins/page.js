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
    <div className="flex justify-center items-start bg-background min-h-screen p-5">
      <div className="w-full max-w-4xl mx-auto p-4 bg-foreground text-black rounded-lg mt-24">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-black">Orígenes</h2>
          <button
            className="bg-secondary text-white px-4 py-2 rounded flex items-center hover:bg-secondaryHover"
            onClick={openModal}
          >
            <FiPlus className="mr-2" />
            Nuevo Origen
          </button>
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div
            className={`fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 ${
              isModalOpen ? "lg:ml-72" : ""
            }`}
          >
            <div className="bg-foreground text-white p-6 rounded-lg shadow-lg w-full max-w-lg">
              <h3 className="text-xl font-bold mb-4 text-black">
                Crear nuevo origen
              </h3>
              <form onSubmit={handleAddOrigin}>
                <div className="mb-4">
                  <label className="block text-black mb-2" htmlFor="name">
                    Nombre del Origen
                  </label>
                  <input
                    type="text"
                    id="name"
                    className="w-full px-4 py-2 rounded bg-background text-black focus:outline-none"
                    value={newState.name}
                    onChange={(e) =>
                      setNewState({ ...newState, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="mb-4">
                  <label
                    className="block text-black mb-2"
                    htmlFor="description"
                  >
                    Descripción
                  </label>
                  <input
                    type="text"
                    id="description"
                    className="w-full px-4 py-2 rounded bg-background text-black focus:outline-none"
                    value={newState.extraInfo}
                    onChange={(e) =>
                      setNewState({ ...newState, extraInfo: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="bg-red-600 text-white px-4 py-2 rounded mr-2 hover:bg-red-700"
                    onClick={closeModal}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="bg-secondary text-white px-4 py-2 rounded hover:bg-secondaryHover"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <table className="min-w-full bg-foreground text-black">
          <thead className="bg-background">
            <tr>
              <th className="px-4 py-2 text-left text-black">
                Nombre del Origen
              </th>
              <th className="px-4 py-2 text-left text-black">Descripción</th>
              <th className="px-4 py-2 text-center text-black">Eliminar</th>
            </tr>
          </thead>
          <tbody>
            {origins.map((state) => (
              <tr key={state.id} className="bg-foreground hover:bg-background">
                <td className="px-4 py-2 flex items-center text-black">
                  {state.name}
                </td>
                <td className="px-4 py-2 text-black">{state.extraInfo}</td>
                <td className="px-4 py-2 text-center text-black">
                  <button
                    className="text-red-500 hover:text-red-700"
                    onClick={() => handleDeleteOrigin(state.id)}
                  >
                    <FiTrash size={22} />
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
