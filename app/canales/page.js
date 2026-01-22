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
    address: "",
    cif: "",
    iban: "",
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
      formData.append("address", newChannel.address || "");
      formData.append("cif", newChannel.cif || "");
      formData.append("iban", newChannel.iban || "");

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
    <div className="p-6 space-y-6">
      <div className="neumorphic-card p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Canales</h2>
          <button
            className="px-5 py-3 rounded-lg neumorphic-button text-white bg-primary hover:bg-primary/90 font-medium flex items-center"
            onClick={openModal}
          >
            <FiPlus className="mr-2" />
            Nuevo Canal
          </button>
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center lg:ml-72">
            <div className="modal-card p-6 w-full max-w-lg">
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">Crear nuevo canal</h3>
              <form onSubmit={handleAddChannel}>
                <div className="mb-4">
                  <label className="block text-slate-700 dark:text-slate-300 mb-2" htmlFor="name">
                    Nombre del Canal
                  </label>
                  <input
                    type="text"
                    id="name"
                    className="w-full neumorphic-card-inset px-4 py-3 rounded-lg border-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 bg-transparent text-slate-800 dark:text-slate-200"
                    value={newChannel.name}
                    onChange={(e) =>
                      setNewChannel({ ...newChannel, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="mb-4">
                  <label
                    className="block text-slate-700 dark:text-slate-300 mb-2"
                    htmlFor="representativeName"
                  >
                    Nombre de representante
                  </label>
                  <input
                    type="text"
                    id="representativeName"
                    className="w-full neumorphic-card-inset px-4 py-3 rounded-lg border-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 bg-transparent text-slate-800 dark:text-slate-200"
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
                    className="block text-slate-700 dark:text-slate-300 mb-2"
                    htmlFor="representativePhone"
                  >
                    Teléfono de representante
                  </label>
                  <input
                    type="text"
                    id="representativePhone"
                    className="w-full neumorphic-card-inset px-4 py-3 rounded-lg border-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 bg-transparent text-slate-800 dark:text-slate-200"
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
                    className="block text-slate-700 dark:text-slate-300 mb-2"
                    htmlFor="representativeEmail"
                  >
                    Email de representante
                  </label>
                  <input
                    type="email"
                    id="representativeEmail"
                    className="w-full neumorphic-card-inset px-4 py-3 rounded-lg border-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 bg-transparent text-slate-800 dark:text-slate-200"
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
                  <label className="block text-slate-700 dark:text-slate-300 mb-2" htmlFor="address">
                    Dirección Fiscal
                  </label>
                  <input
                    type="text"
                    id="address"
                    className="w-full neumorphic-card-inset px-4 py-3 rounded-lg border-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 bg-transparent text-slate-800 dark:text-slate-200"
                    value={newChannel.address}
                    onChange={(e) =>
                      setNewChannel({
                        ...newChannel,
                        address: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 mb-2" htmlFor="cif">
                      CIF
                    </label>
                    <input
                      type="text"
                      id="cif"
                      className="w-full neumorphic-card-inset px-4 py-3 rounded-lg border-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 bg-transparent text-slate-800 dark:text-slate-200"
                      value={newChannel.cif}
                      onChange={(e) =>
                        setNewChannel({
                          ...newChannel,
                          cif: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 mb-2" htmlFor="iban">
                      IBAN
                    </label>
                    <input
                      type="text"
                      id="iban"
                      className="w-full neumorphic-card-inset px-4 py-3 rounded-lg border-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 bg-transparent text-slate-800 dark:text-slate-200"
                      value={newChannel.iban}
                      onChange={(e) =>
                        setNewChannel({
                          ...newChannel,
                          iban: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-slate-700 dark:text-slate-300 mb-2" htmlFor="image">
                    Subir imagen del canal
                  </label>
                  <input
                    type="file"
                    id="image"
                    accept="image/*"
                    className="w-full text-slate-700 dark:text-slate-300"
                    onChange={(e) => setImageFile(e.target.files[0])}
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
              <th className="p-3">Imagen</th>
              <th className="p-3">Nombre</th>
              <th className="p-3">Representante</th>
              <th className="p-3">Email</th>
              <th className="p-3">Telefono</th>
              <th className="p-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {channels.map((channel) => (
              <tr key={channel.id} className="table-row-divider">
                <td className="p-3">
                  <img
                    src={channel.imageUri}
                    alt={channel.name}
                    className="w-16 h-16 object-cover rounded"
                  />
                </td>
                <td className="p-3 font-medium text-slate-800 dark:text-slate-200">{channel.name}</td>

                <td className="p-3 text-slate-600 dark:text-slate-400">
                  {channel.representativeName}
                </td>
                <td className="p-3 text-slate-600 dark:text-slate-400">
                  {channel.representativeEmail}
                </td>
                <td className="p-3 text-slate-600 dark:text-slate-400">
                  {channel.representativePhone}
                </td>
                <td className="p-3">
                  <div className="flex space-x-2">
                    <button
                      className="p-2 rounded-lg neumorphic-button text-slate-600 dark:text-slate-400 hover:text-primary"
                      onClick={() => handleEditChannel(channel.uuid)}
                    >
                      <FiEdit size={18} />
                    </button>
                    <button
                      className="p-2 rounded-lg neumorphic-button text-slate-600 dark:text-slate-400 hover:text-primary"
                      onClick={() => handleDeleteChannel(channel.uuid)}
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
