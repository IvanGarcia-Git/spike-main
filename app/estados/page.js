"use client";
import { useState, useEffect } from "react";
import { getCookie } from "cookies-next";
import { authFetch, authGetFetch } from "@/helpers/server-fetch.helper";
import { FiTrash, FiPlus, FiEdit, FiSave } from "react-icons/fi";
import { toast } from "react-toastify";

export default function States() {
  const [states, setStates] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDefaultStateId, setSelectedDefaultStateId] = useState("");
  const [editingState, setEditingState] = useState(null);
  const [editingData, setEditingData] = useState({
    name: "",
    extraInfo: "",
    colorHex: "#000000",
  });
  const [newState, setNewState] = useState({
    name: "",
    extraInfo: "",
    colorHex: "#000000",
  });

  const getStates = async () => {
    const jwtToken = getCookie("factura-token");

    try {
      const response = await authGetFetch("contract-states/all", jwtToken);

      if (response.ok) {
        const statesResponse = await response.json();

        setStates(statesResponse);
        const defaultState = statesResponse.find((state) => state.default);
        if (defaultState) {
          setSelectedDefaultStateId(defaultState.id);
        }
      } else {
        alert("Error cargando tu informacion");
      }
    } catch (error) {
      console.error("Error sending request:", error);
    }
  };

  useEffect(() => {
    getStates();
  }, []);

  const handleAddState = async (e) => {
    e.preventDefault();
    const jwtToken = getCookie("factura-token");

    try {
      const response = await authFetch("POST", "contract-states/", newState, jwtToken);

      if (response.ok) {
        const addedState = await response.json();
        setStates([...states, addedState]);
        setIsModalOpen(false);
        setNewState({
          name: "",
          extraInfo: "",
          colorHex: "#000000",
        });
      } else {
        alert("Error agregando el nuevo estado");
      }
    } catch (error) {
      console.error("Error enviando la solicitud:", error);
    }
  };

  const handleDeleteState = async (id) => {
    const confirmDelete = confirm("¿Estás seguro de que quieres eliminar este estado?");
    if (!confirmDelete) return;

    const jwtToken = getCookie("factura-token");

    try {
      const response = await authFetch("DELETE", `contract-states/${id}`, {}, jwtToken);

      if (response.ok) {
        const filteredStates = states.filter((state) => state.id !== id);
        setStates(filteredStates);
      } else {
        alert("Error eliminando el estado");
      }
    } catch (error) {
      console.error("Error enviando la solicitud:", error);
    }
  };

  const handleEditState = (state) => {
    setEditingState(state.id);
    setEditingData({
      name: state.name,
      extraInfo: state.extraInfo,
      colorHex: state.colorHex,
    });
  };

  const handleSaveEdit = async (id) => {
    const jwtToken = getCookie("factura-token");

    try {
      const response = await authFetch("PATCH", `contract-states/${id}`, editingData, jwtToken);

      if (!response.ok) {
        alert("Error actualizando el estado");
      }

      const updatedState = await response.json();
      setStates(states.map((state) => (state.id === id ? { ...state, ...editingData } : state)));
      setEditingState(null);
      setEditingData({ name: "", extraInfo: "", colorHex: "#000000" });
      toast.success("Estado actualizado exitosamente", {
        position: "top-right",
        draggable: true,
        icon: false,
        hideProgressBar: false,
        autoClose: 5000,
        className: `transition-all transform hover:-translate-y-1 hover:shadow-l border border-gray-400`,
      });
    } catch (error) {
      console.error("Error enviando la solicitud:", error);
    }
  };

  const handleCancelEdit = () => {
    setEditingState(null);
    setEditingData({ name: "", extraInfo: "", colorHex: "#000000" });
  };

  const handleKeyPress = (e, id) => {
    if (e.key === "Enter") {
      handleSaveEdit(id);
    } else if (e.key === "Escape") {
      handleCancelEdit();
    }
  };

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const saveDefaultState = async (newDefaultStateId) => {
    setSelectedDefaultStateId(newDefaultStateId);

    const jwtToken = getCookie("factura-token");

    const defaultState = states.find((state) => state.id == newDefaultStateId);
    if (!defaultState) {
      alert("Estado seleccionado no encontrado");
      return;
    }

    const updatedState = { ...defaultState, default: true };

    try {
      const response = await authFetch(
        "PATCH",
        `contract-states/${newDefaultStateId}`,
        updatedState,
        jwtToken
      );

      if (response.ok) {
        setStates(
          states.map((state) =>
            state.id == selectedDefaultStateId
              ? { ...state, default: true }
              : { ...state, default: false }
          )
        );
      } else {
        alert("Error guardando el estado por defecto");
      }
    } catch (error) {
      console.error("Error enviando la solicitud:", error);
    }
  };

  return (
    <div className="flex justify-center items-start bg-background min-h-screen p-5">
      <div className="w-full max-w-4xl mx-auto p-4 bg-foreground text-black rounded-lg mt-24">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-black">Estados de Contratos</h2>
          <button
            className="bg-secondary text-white px-4 py-2 rounded flex items-center hover:bg-secondaryHover"
            onClick={openModal}
          >
            <FiPlus className="mr-2" />
            Nuevo Estado
          </button>
        </div>
        <div className="flex justify-start items-center mb-6">
          <h2 className="text-xl text-black">Estado por defecto</h2>
          <select
            className="ml-4 px-2 py-1 rounded bg-background text-black focus:outline-none"
            value={selectedDefaultStateId}
            onChange={(e) => saveDefaultState(e.target.value)}
          >
            <option value="" disabled>
              Selecciona un estado
            </option>
            {states.map((state) => (
              <option key={state.id} value={state.id}>
                {state.name}
              </option>
            ))}
          </select>
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div
            className={`fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 ${
              isModalOpen ? "lg:ml-72" : ""
            }`}
          >
            <div className="bg-foreground text-white p-6 rounded-lg shadow-lg w-full max-w-lg">
              <h3 className="text-xl font-bold mb-4 text-black">Crear nuevo estado</h3>
              <form onSubmit={handleAddState}>
                <div className="mb-4">
                  <label className="block text-black mb-2" htmlFor="name">
                    Nombre del Estado
                  </label>
                  <input
                    type="text"
                    id="name"
                    className="w-full px-4 py-2 rounded bg-background text-black focus:outline-none"
                    value={newState.name}
                    onChange={(e) => setNewState({ ...newState, name: e.target.value })}
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-black mb-2" htmlFor="description">
                    Descripción
                  </label>
                  <input
                    type="text"
                    id="description"
                    className="w-full px-4 py-2 rounded bg-background text-black focus:outline-none"
                    value={newState.extraInfo}
                    onChange={(e) => setNewState({ ...newState, extraInfo: e.target.value })}
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block mb-2 text-black" htmlFor="color">
                    Color del Estado
                  </label>
                  <input
                    type="color"
                    id="color"
                    className="w-16 h-10 p-1 border-none rounded cursor-pointer"
                    value={newState.colorHex}
                    onChange={(e) => setNewState({ ...newState, colorHex: e.target.value })}
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
              <th className="px-4 py-2 text-left text-black">Nombre del Estado</th>
              <th className="px-4 py-2 text-left text-black">Descripción</th>
              <th className="px-4 py-2 text-center text-black">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {states.map((state) => (
              <tr key={state.id} className="bg-foreground hover:bg-background">
                <td className="px-4 py-2 flex items-center text-black">
                  {editingState === state.id ? (
                    <div className="flex items-center w-full">
                      <input
                        type="color"
                        className="w-6 h-6 rounded-full mr-2 border-none cursor-pointer"
                        value={editingData.colorHex}
                        onChange={(e) =>
                          setEditingData({ ...editingData, colorHex: e.target.value })
                        }
                        onKeyDown={(e) => handleKeyPress(e, state.id)}
                      />
                      <input
                        type="text"
                        className="flex-1 px-2 py-1 rounded bg-background text-black focus:outline-none"
                        value={editingData.name}
                        onChange={(e) => setEditingData({ ...editingData, name: e.target.value })}
                        onKeyDown={(e) => handleKeyPress(e, state.id)}
                        autoFocus
                      />
                    </div>
                  ) : (
                    <>
                      <span
                        className="inline-block w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: state.colorHex }}
                      ></span>
                      {state.name}
                    </>
                  )}
                </td>
                <td className="px-4 py-2 text-black">
                  {editingState === state.id ? (
                    <input
                      type="text"
                      className="w-full px-2 py-1 rounded bg-background text-black focus:outline-none"
                      value={editingData.extraInfo}
                      onChange={(e) =>
                        setEditingData({ ...editingData, extraInfo: e.target.value })
                      }
                      onKeyDown={(e) => handleKeyPress(e, state.id)}
                    />
                  ) : (
                    state.extraInfo
                  )}
                </td>
                <td className="px-4 py-2 text-center text-black">
                  <div className="flex justify-center items-center space-x-2">
                    {editingState === state.id ? (
                      <>
                        <button
                          className="text-green-500 hover:text-green-700"
                          onClick={() => handleSaveEdit(state.id)}
                          title="Guardar cambios"
                        >
                          <FiSave size={18} />
                        </button>
                        <button
                          className="text-gray-500 hover:text-gray-700 text-lg"
                          onClick={handleCancelEdit}
                          title="Cancelar edición"
                        >
                          ✕
                        </button>
                      </>
                    ) : (
                      <button
                        className="text-blue-500 hover:text-blue-700"
                        onClick={() => handleEditState(state)}
                        title="Editar estado"
                      >
                        <FiEdit size={18} />
                      </button>
                    )}
                    <button
                      className="text-red-500 hover:text-red-700"
                      onClick={() => handleDeleteState(state.id)}
                      title="Eliminar estado"
                    >
                      <FiTrash size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
