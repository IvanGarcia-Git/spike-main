"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
//TODO: Change to Next
import Image from "next/image";
import { FiEdit, FiTrash, FiPlus } from "react-icons/fi";
import { authFetch, authGetFetch } from "@/helpers/server-fetch.helper";
import { getCookie } from "cookies-next";

export default function Canales() {
  const [channels, setChannels] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [newChannel, setNewChannel] = useState({
    name: "",
    representativeName: "",
    representativePhone: "",
    representativeEmail: "",
  });
  const router = useRouter();

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const getChannels = async () => {
    const jwtToken = getCookie("factura-token");

    try {
      const response = await authGetFetch("channels/", jwtToken);

      if (response.ok) {
        const channelsResponse = await response.json();

        setChannels(channelsResponse);
      } else {
        alert("Error cargando la información de los canales");
      }
    } catch (error) {
      console.error("Error enviando la solicitud:", error);
    }
  };

  const handleAddChannel = async (e) => {
    e.preventDefault();
    const jwtToken = getCookie("factura-token");

    try {
      const formData = new FormData();
      formData.append("name", newChannel.name);
      formData.append("representativeName", newChannel.representativeName);
      formData.append("representativePhone", newChannel.representativePhone);
      formData.append("representativeEmail", newChannel.representativeEmail);

      if (imageFile) {
        formData.append("imgFile", imageFile);
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/channels/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${jwtToken}`,
          },
          body: formData,
        }
      );

      if (response.ok) {
        window.location.reload();
      } else {
        alert("Error agregando el nuevo canal");
      }
    } catch (error) {
      console.error("Error enviando la solicitud:", error);
    }
  };

  useEffect(() => {
    getChannels();
  }, []);

  const handleDeleteChannel = async (channelUuid) => {
    const confirmDelete = confirm(
      "¿Estás seguro de que quieres eliminar este canal?"
    );
    if (!confirmDelete) return;

    const jwtToken = getCookie("factura-token");

    try {
      const response = await authFetch(
        "DELETE",
        `channels/`,
        { channelUuid },
        jwtToken
      );

      if (response.ok) {
        const filteredChannels = channels.filter(
          (channel) => channel.uuid !== channelUuid
        );
        setChannels(filteredChannels);
      } else {
        alert("Error eliminando el canal");
      }
    } catch (error) {
      console.error("Error enviando la solicitud:", error);
    }
  };

  const handleEditChannel = (uuid) => {
    router.push(`/canales/${uuid}`);
  };

  return (
    <div className="flex justify-center items-start bg-background min-h-screen p-5">
      <div className="w-full max-w-5xl mx-auto p-4 bg-foreground text-white rounded-lg mt-24">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-black">Canales</h2>
          <button
            className="bg-secondary text-white px-4 py-2 rounded flex items-center hover:bg-secondaryHover"
            onClick={openModal}
          >
            <FiPlus className="mr-2" />
            Nuevo Canal
          </button>
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div
            className={`fixed inset-0 flex items-center justify-center bg-foreground bg-opacity-50 z-50 ${isModalOpen ? "lg:ml-72" : ""
              }`}
          >
            <div className="bg-foreground text-black p-6 rounded-lg shadow-lg w-full max-w-lg">
              <h3 className="text-xl font-bold mb-4">Crear nuevo canal</h3>
              <form onSubmit={handleAddChannel}>
                <div className="mb-4">
                  <label className="block text-black mb-2" htmlFor="name">
                    Nombre del Canal
                  </label>
                  <input
                    type="text"
                    id="name"
                    className="w-full px-4 py-2 rounded bg-background text-black focus:outline-none"
                    value={newChannel.name}
                    onChange={(e) =>
                      setNewChannel({ ...newChannel, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="mb-4">
                  <label
                    className="block text-black mb-2"
                    htmlFor="representativeName"
                  >
                    Nombre de representante
                  </label>
                  <input
                    type="text"
                    id="representativeName"
                    className="w-full px-4 py-2 rounded bg-background text-black focus:outline-none"
                    value={newChannel.representativeName}
                    onChange={(e) =>
                      setNewChannel({
                        ...newChannel,
                        representativeName: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="mb-4">
                  <label
                    className="block text-black mb-2"
                    htmlFor="representativePhone"
                  >
                    Teléfono de representante
                  </label>
                  <input
                    type="text"
                    id="representativePhone"
                    className="w-full px-4 py-2 rounded bg-background text-black focus:outline-none"
                    value={newChannel.representativePhone}
                    onChange={(e) =>
                      setNewChannel({
                        ...newChannel,
                        representativePhone: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="mb-4">
                  <label
                    className="block text-black mb-2"
                    htmlFor="representativeEmail"
                  >
                    Email de representante
                  </label>
                  <input
                    type="email"
                    id="representativeEmail"
                    className="w-full px-4 py-2 rounded bg-background text-black focus:outline-none"
                    value={newChannel.representativeEmail}
                    onChange={(e) =>
                      setNewChannel({
                        ...newChannel,
                        representativeEmail: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-black mb-2" htmlFor="image">
                    Subir imagen del canal
                  </label>
                  <input
                    type="file"
                    id="image"
                    accept="image/*"
                    className="w-full text-black"
                    onChange={(e) => setImageFile(e.target.files[0])}
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
        <div className="w-full overflow-x-auto">
          <table className="min-w-full bg-foreground text-black">
            <thead className="bg-background">
              <tr>
                <th className="px-4 py-2 text-left text-black">Imagen</th>
                <th className="px-4 py-2 text-left text-black">Nombre</th>
                <th className="px-4 py-2 text-left text-black">Representante</th>
                <th className="px-4 py-2 text-left text-black">Email</th>
                <th className="px-4 py-2 text-left text-black">Telefono</th>
                <th className="px-4 py-2 text-center text-black">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {channels.map((channel) => (
                <tr
                  key={channel.id}
                  className="bg-foreground hover:bg-background"
                >
                  <td className="px-4 py-2 text-black">
                    <img
                      src={channel.imageUri}
                      alt={channel.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                  </td>
                  <td className="px-4 py-2 text-black">{channel.name}</td>

                  <td className="px-4 py-2text-black">
                    <span
                      className={`text-black rounded-full text-sm font-semibold`}
                    >
                      {channel.representativeName}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`text-black rounded-full text-sm font-semibold`}
                    >
                      {channel.representativeEmail}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-black">
                    <span
                      className={`text-black rounded-full text-sm font-semibold`}
                    >
                      {channel.representativePhone}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-center">
                    <button
                      className="text-blue-500 hover:text-blue-700 mr-4"
                      onClick={() => handleEditChannel(channel.uuid)}
                    >
                      <FiEdit size={22} />
                    </button>
                    <button
                      className="text-red-500 hover:text-red-700"
                      onClick={() => handleDeleteChannel(channel.uuid)}
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
    </div>
  );
}
