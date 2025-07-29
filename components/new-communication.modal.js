import { useState, useEffect } from "react";
import { authGetFetch } from "@/helpers/server-fetch.helper";
import { getCookie } from "cookies-next";
import * as jose from "jose";
import { toast } from "react-toastify";
import { v4 as uuidv4 } from "uuid";

export default function NewCommunicationModal({ isModalOpen, setIsModalOpen }) {
  const [newCommunication, setNewCommunication] = useState({
    startDate: "",
    subject: "",
    content: "",
    userId: [],
    eventType: "communication",
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [users, setUsers] = useState([]);
  const [isManager, setIsManager] = useState(false);

  useEffect(() => {
    const jwtToken = getCookie("factura-token");
    const payload = jose.decodeJwt(jwtToken);
    setIsManager(payload.isManager);

    const fetchUsers = async () => {
      try {
        const response = await authGetFetch(
          payload.isManager ? "users/visible-users/" : "users/agent-visible-users/",
          jwtToken
        );

        if (response.ok) {
          const { users: usersArray } = await response.json();
          setUsers(usersArray);
        } else {
          console.error("Error cargando la información de los usuarios");
        }
      } catch (error) {
        console.error("Error enviando la solicitud:", error);
      }
    };

    fetchUsers();
  }, []);

  const toggleUserSelection = (userId) => {
    setNewCommunication((prev) => {
      const isSelected = prev.userId.includes(userId);
      const updatedUserId = isSelected
        ? prev.userId.filter((id) => id !== userId)
        : [...prev.userId, userId];
      return { ...prev, userId: updatedUserId };
    });
  };

  const handleCreateCommunication = async (e) => {
    e.preventDefault();
    const jwtToken = getCookie("factura-token");
    let creatorId = null;
    try {
      const payload = jose.decodeJwt(jwtToken);
      creatorId = payload.userId;
    } catch (err) {
      console.error("No se pudo obtener el userId del token", err);
    }

    if (!newCommunication.content) {
      alert("El campo 'Comentario' es obligatorio.");
      return;
    }

    const batchId = uuidv4();

    try {
      for (const userId of newCommunication.userId) {
        const formData = new FormData();
        formData.append("startDate", newCommunication.startDate);
        formData.append("subject", newCommunication.subject);
        formData.append("userId", userId);
        formData.append("content", newCommunication.content);
        formData.append("batchId", batchId);
        formData.append("eventType", newCommunication.eventType);
        if (creatorId) {
          formData.append("creatorId", creatorId);
        }
        if (selectedFile) {
          formData.append("notificationFile", selectedFile);
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${jwtToken}`,
          },
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.text();
          console.error("Error del servidor:", errorData);
          alert(`Error creando el comunicado para el usuario ${userId}: ${errorData}`);
          continue;
        }
      }

      toast.success(`Comunicaciones creadas correctamente.`, {
        position: "top-right",
        draggable: true,
        icon: false,
        hideProgressBar: false,
        autoClose: 5000,
        className: `transition-all transform hover:-translate-y-1 hover:shadow-l border border-gray-400`,
      });

      setNewCommunication({
        startDate: "",
        subject: "",
        content: "",
        userId: [],
      });
      setSelectedFile(null);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error enviando la solicitud:", error);
    }
  };

  if (!isModalOpen) return null;

  return (
    <div
      className={`bg-foreground text-black p-6 rounded-lg shadow-lg w-full max-w-lg ${
        isModalOpen ? "" : "hidden"
      }`}
    >
      <h3 className="text-xl font-bold mb-4 text-black">Nueva Comunicación</h3>
      <form onSubmit={handleCreateCommunication}>
        <div className="mb-4">
          <label className="block text-black mb-2 font-semibold" htmlFor="startDate">
            Fecha inicio
          </label>
          <input
            type="date"
            id="startDate"
            className="w-full px-4 py-2 rounded bg-background text-black focus:outline-none"
            value={newCommunication.startDate}
            onChange={(e) =>
              setNewCommunication({
                ...newCommunication,
                startDate: e.target.value,
              })
            }
            required
          />
        </div>

        {/* Dirigido a */}
        <div className="mb-4">
          <label className="block text-black mb-2" htmlFor="userId">
            Dirigido a:
          </label>
          <div className="border rounded bg-background p-2 max-h-48 overflow-y-auto">
            {users.map((user) => {
              const isSelected = newCommunication.userId.includes(user.id);
              return (
                <div
                  key={user.id}
                  className={`flex items-center  p-2 rounded ${
                    isSelected ? "bg-blue-100" : "bg-transparent"
                  }`}
                >
                  <input
                    type="checkbox"
                    id={`user-${user.id}`}
                    className="mr-2"
                    checked={isSelected}
                    onChange={() => toggleUserSelection(user.id)}
                  />
                  <label
                    htmlFor={`user-${user.id}`}
                    className={`text-black ${isSelected ? "font-bold" : ""}`}
                  >
                    {user.name}
                  </label>
                </div>
              );
            })}
          </div>
        </div>

        {/* Asunto */}
        <div className="mb-4">
          <label className="block text-black mb-2 font-semibold" htmlFor="subject">
            Asunto
          </label>
          <input
            type="text"
            id="subject"
            className="w-full px-4 py-2 rounded bg-background text-black focus:outline-none"
            value={newCommunication.subject}
            onChange={(e) =>
              setNewCommunication({
                ...newCommunication,
                subject: e.target.value,
              })
            }
            required
          />
        </div>

        {/* Comentario */}
        <div className="mb-4">
          <label className="block text-black mb-2 font-semibold" htmlFor="content">
            Comentario
          </label>
          <textarea
            id="content"
            className="w-full h-32 px-4 py-2 rounded bg-background text-black focus:outline-none"
            rows="4"
            value={newCommunication.content}
            onChange={(e) =>
              setNewCommunication({
                ...newCommunication,
                content: e.target.value,
              })
            }
            required
          ></textarea>
        </div>

        {/* Archivo */}
        <div className="mb-4">
          <label className="block text-black mb-2 font-semibold" htmlFor="file">
            Archivo
          </label>
          <input
            type="file"
            id="file"
            onChange={(e) => setSelectedFile(e.target.files[0])}
            className="w-full cursor-pointer"
          />
        </div>

        {/* Botones */}
        <div className="flex justify-end">
          <button
            type="button"
            className="bg-red-600 text-white px-4 py-2 rounded mr-2 hover:bg-red-700"
            onClick={() => setIsModalOpen(false)}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="bg-secondary text-white px-4 py-2 rounded hover:bg-secondaryHover"
          >
            Crear Comunicado
          </button>
        </div>
      </form>
    </div>
  );
}
