import { useEffect } from "react";
import TaskDetailComponent from "./task-detail.section";
import { MdClose } from "react-icons/md";

export default function TaskDetailModal({ uuid, isOpen, onClose }) {
  // Cerrar el modal al presionar la tecla Escape y controlar el scroll
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEsc);

    // Deshabilitar scroll en el body cuando el modal está abierto
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    // Limpiar efectos al desmontar
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "auto"; // Restaurar scroll al cerrar el modal
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 flex justify-center bg-black bg-opacity-50 z-50 overflow-y-auto ${
        isOpen ? "lg:ml-72" : ""
      }`}
    >
      <div className="bg-background text-black p-8 rounded-lg shadow-lg w-full max-w-4xl relative my-auto overflow-y-auto max-h-[90vh]">

        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
        >
          <MdClose size={30}/>
        </button>

        {/* Componente de detalles de la tarea */}
        <div className="text-black">
          <TaskDetailComponent uuid={uuid} />
        </div>
      </div>
    </div>
  );
}
