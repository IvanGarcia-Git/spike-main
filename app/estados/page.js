"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { getCookie } from "cookies-next";
import { authFetch, authGetFetch } from "@/helpers/server-fetch.helper";
import { FiTrash, FiPlus, FiEdit, FiSave, FiMenu } from "react-icons/fi";
import { toast } from "react-toastify";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

const ItemType = "STATE_ROW";

function DraggableRow({
  state,
  index,
  moveRow,
  editingState,
  editingData,
  setEditingData,
  handleKeyPress,
  handleEditState,
  handleSaveEdit,
  handleCancelEdit,
  handleDeleteState,
}) {
  const ref = useRef(null);

  const [{ handlerId }, drop] = useDrop({
    accept: ItemType,
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover(item, monitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) {
        return;
      }
      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      const hoverMiddleY =
        (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }
      moveRow(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag, preview] = useDrag({
    type: ItemType,
    item: () => {
      return { id: state.id, index };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const opacity = isDragging ? 0.4 : 1;
  preview(drop(ref));

  return (
    <tr
      ref={ref}
      data-handler-id={handlerId}
      className="table-row-divider"
      style={{ opacity }}
    >
      <td className="p-3 w-10">
        <div
          ref={drag}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
        >
          <FiMenu className="text-slate-400" size={18} />
        </div>
      </td>
      <td className="p-3 flex items-center text-slate-800 dark:text-slate-200">
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
              className="flex-1 px-4 py-3 rounded-lg neumorphic-card-inset border-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 bg-transparent text-slate-800 dark:text-slate-200"
              value={editingData.name}
              onChange={(e) =>
                setEditingData({ ...editingData, name: e.target.value })
              }
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
      <td className="p-3 text-slate-600 dark:text-slate-400">
        {editingState === state.id ? (
          <input
            type="text"
            className="w-full px-4 py-3 rounded-lg neumorphic-card-inset border-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 bg-transparent text-slate-800 dark:text-slate-200"
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
      <td className="p-3">
        <div className="flex items-center space-x-2">
          {editingState === state.id ? (
            <>
              <button
                className="p-2 rounded-lg neumorphic-button text-slate-600 dark:text-slate-400 hover:text-primary"
                onClick={() => handleSaveEdit(state.id)}
                title="Guardar cambios"
              >
                <FiSave size={18} />
              </button>
              <button
                className="p-2 rounded-lg neumorphic-button text-slate-600 dark:text-slate-400 hover:text-primary"
                onClick={handleCancelEdit}
                title="Cancelar edición"
              >
                <span className="material-icons-outlined text-lg">close</span>
              </button>
            </>
          ) : (
            <button
              className="p-2 rounded-lg neumorphic-button text-slate-600 dark:text-slate-400 hover:text-primary"
              onClick={() => handleEditState(state)}
              title="Editar estado"
            >
              <FiEdit size={18} />
            </button>
          )}
          <button
            className="p-2 rounded-lg neumorphic-button text-slate-600 dark:text-slate-400 hover:text-primary"
            onClick={() => handleDeleteState(state.id)}
            title="Eliminar estado"
          >
            <FiTrash size={18} />
          </button>
        </div>
      </td>
    </tr>
  );
}

function StatesContent() {
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

  const moveRow = useCallback((dragIndex, hoverIndex) => {
    setStates((prevStates) => {
      const newStates = [...prevStates];
      const [removed] = newStates.splice(dragIndex, 1);
      newStates.splice(hoverIndex, 0, removed);
      return newStates;
    });
  }, []);

  const saveOrder = async () => {
    const jwtToken = getCookie("factura-token");
    const orderedIds = states.map((state) => state.id);

    try {
      const response = await authFetch(
        "PUT",
        "contract-states/display-order",
        { orderedIds },
        jwtToken
      );

      if (response.ok) {
        toast.success("Orden guardado correctamente", {
          position: "top-right",
          draggable: true,
          icon: false,
          hideProgressBar: false,
          autoClose: 3000,
          className: `transition-all transform hover:-translate-y-1 hover:shadow-l border border-gray-400`,
        });
      } else {
        toast.error("Error guardando el orden", {
          position: "top-right",
          autoClose: 5000,
        });
      }
    } catch (error) {
      console.error("Error enviando la solicitud:", error);
      toast.error("Error guardando el orden", {
        position: "top-right",
        autoClose: 5000,
      });
    }
  };

  const handleAddState = async (e) => {
    e.preventDefault();
    const jwtToken = getCookie("factura-token");

    try {
      const response = await authFetch(
        "POST",
        "contract-states/",
        newState,
        jwtToken
      );

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
    const confirmDelete = confirm(
      "¿Estás seguro de que quieres eliminar este estado?"
    );
    if (!confirmDelete) return;

    const jwtToken = getCookie("factura-token");

    try {
      const response = await authFetch(
        "DELETE",
        `contract-states/${id}`,
        {},
        jwtToken
      );

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
      const response = await authFetch(
        "PATCH",
        `contract-states/${id}`,
        editingData,
        jwtToken
      );

      if (!response.ok) {
        alert("Error actualizando el estado");
      }

      const updatedState = await response.json();
      setStates(
        states.map((state) =>
          state.id === id ? { ...state, ...editingData } : state
        )
      );
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
    <div className="p-6 space-y-6">
      <div className="neumorphic-card p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            Estados de Contratos
          </h2>
          <div className="flex gap-3">
            <button
              className="px-5 py-3 rounded-lg neumorphic-button text-slate-700 dark:text-slate-300 font-medium flex items-center"
              onClick={saveOrder}
            >
              <FiSave className="mr-2" />
              Guardar Orden
            </button>
            <button
              className="px-5 py-3 rounded-lg neumorphic-button text-white bg-primary hover:bg-primary/90 font-medium flex items-center"
              onClick={openModal}
            >
              <FiPlus className="mr-2" />
              Nuevo Estado
            </button>
          </div>
        </div>
        <div className="flex justify-start items-center mb-6">
          <h2 className="text-xl text-slate-800 dark:text-slate-100">
            Estado por defecto
          </h2>
          <div className="ml-4 neumorphic-card-inset rounded-lg">
            <select
              className="px-4 py-3 rounded-lg border-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 bg-transparent text-slate-800 dark:text-slate-200"
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
        </div>

        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          Arrastra las filas usando el icono ≡ para reordenar los estados, luego
          haz clic en &quot;Guardar Orden&quot;.
        </p>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center lg:ml-72">
            <div className="modal-card p-6 w-full max-w-lg">
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">
                Crear nuevo estado
              </h3>
              <form onSubmit={handleAddState}>
                <div className="mb-4">
                  <label
                    className="block text-slate-700 dark:text-slate-300 mb-2"
                    htmlFor="name"
                  >
                    Nombre del Estado
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
                <div className="mb-4">
                  <label
                    className="block mb-2 text-slate-700 dark:text-slate-300"
                    htmlFor="color"
                  >
                    Color del Estado
                  </label>
                  <input
                    type="color"
                    id="color"
                    className="w-16 h-10 p-1 border-none rounded cursor-pointer"
                    value={newState.colorHex}
                    onChange={(e) =>
                      setNewState({ ...newState, colorHex: e.target.value })
                    }
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
              <th className="p-3 w-10"></th>
              <th className="p-3">Nombre del Estado</th>
              <th className="p-3">Descripción</th>
              <th className="p-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {states.map((state, index) => (
              <DraggableRow
                key={state.id}
                state={state}
                index={index}
                moveRow={moveRow}
                editingState={editingState}
                editingData={editingData}
                setEditingData={setEditingData}
                handleKeyPress={handleKeyPress}
                handleEditState={handleEditState}
                handleSaveEdit={handleSaveEdit}
                handleCancelEdit={handleCancelEdit}
                handleDeleteState={handleDeleteState}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function States() {
  return (
    <DndProvider backend={HTML5Backend}>
      <StatesContent />
    </DndProvider>
  );
}
