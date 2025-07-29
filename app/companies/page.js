"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FiEdit, FiTrash } from "react-icons/fi";
import { authFetch, authGetFetch } from "@/helpers/server-fetch.helper";
import { getCookie } from "cookies-next";

export default function Companies() {
  const [companies, setCompanies] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCompany, setNewCompany] = useState({
    name: "",
    type: "Luz",
    image: null,
  });
  const router = useRouter();

  const getCompanies = async () => {
    const jwtToken = getCookie("factura-token");

    try {
      const response = await authGetFetch("companies/", jwtToken);

      if (response.ok) {
        const companiesResponse = await response.json();
        setCompanies(companiesResponse);
      } else {
        alert("Error cargando la información de las compañías");
      }
    } catch (error) {
      console.error("Error enviando la solicitud:", error);
    }
  };

  useEffect(() => {
    getCompanies();
  }, []);

  const handleDeleteCompany = async (id) => {
    const confirmDelete = confirm("¿Estás seguro de que quieres eliminar esta compañia?");
    if (!confirmDelete) return;

    const jwtToken = getCookie("factura-token");

    try {
      const response = await authFetch("DELETE", `companies/${id}`, {}, jwtToken);

      if (response.ok) {
        const filteredCompanies = companies.filter((company) => company.id !== id);
        setCompanies(filteredCompanies);
      } else {
        alert("Error eliminando la compañía");
      }
    } catch (error) {
      console.error("Error enviando la solicitud:", error);
    }
  };

  const handleEditCompany = (uuid) => {
    router.push(`/companies/${uuid}`);
  };

  const handleAddCompany = async (e) => {
    e.preventDefault();
    const jwtToken = getCookie("factura-token");

    try {
      const formData = new FormData();
      formData.append("name", newCompany.name);
      formData.append("type", newCompany.type);

      if (newCompany.image) {
        formData.append("imgFile", newCompany.image);
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/companies/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
        body: formData,
      });

      if (response.ok) {
        await getCompanies();
        setIsModalOpen(false);
        setNewCompany({
          name: "",
          type: "Luz",
          image: null,
        });
      } else {
        alert("Error agregando la compañía");
      }
    } catch (error) {
      console.error("Error enviando la solicitud:", error);
    }
  };

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => {
    setIsModalOpen(false);
    setNewCompany({
      name: "",
      type: "Luz",
      image: null,
    });
  };

  return (
    <div className="flex justify-center items-start bg-background min-h-screen p-8">
      <div className="w-full max-w-5xl mx-auto p-4 bg-foreground text-black rounded-lg mt-24">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-black">Compañías</h2>
          <button
            className="bg-secondary text-white px-4 py-2 rounded hover:bg-secondaryHover"
            onClick={openModal}
          >
            Añadir Compañía
          </button>
        </div>

        <table className="min-w-full bg-gray-700 text-black">
          <thead className="bg-background">
            <tr>
              <th className="px-4 py-2 text-left text-black">Imagen</th>
              <th className="px-4 py-2 text-left text-black">Nombre</th>
              <th className="px-4 py-2 text-left text-black">Tipo</th>
              <th className="px-4 py-2 text-center text-black">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {companies.map((company) => (
              <tr key={company.id} className="bg-foreground hover:bg-background">
                <td className="px-4 py-2 text-black">
                  <img
                    src={company.imageUri}
                    alt={company.name}
                    className="w-16 h-16 object-cover rounded text-black"
                  />
                </td>
                <td className="px-4 py-2 text-black">{company.name}</td>

                <td className="px-4 py-2 text-black">
                  <span
                    className={`${
                      company.type === "Gas"
                        ? "bg-yellow-500"
                        : company.type === "Telefonía"
                        ? "bg-purple-500"
                        : "bg-blue-500"
                    } text-white px-4 py-1 rounded-full text-sm font-semibold`}
                  >
                    {company.type}
                  </span>
                </td>

                <td className="px-4 py-2 text-center">
                  <button
                    className="text-blue-500 hover:text-blue-700 mr-4"
                    onClick={() => handleEditCompany(company.uuid)}
                  >
                    <FiEdit size={22} />
                  </button>
                  <button
                    className="text-red-500 hover:text-red-700"
                    onClick={() => handleDeleteCompany(company.id)}
                  >
                    <FiTrash size={22} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal para crear nueva compañía */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 lg:ml-72 z-50">
          <div className="bg-foreground text-black p-6 rounded-lg shadow-lg w-full max-w-lg">
            <h3 className="text-xl font-bold mb-4">Crear nueva compañía</h3>
            <form onSubmit={handleAddCompany}>
              <div className="mb-4">
                <label className="block text-black mb-2" htmlFor="name">
                  Nombre de la Compañía
                </label>
                <input
                  type="text"
                  id="name"
                  className="w-full px-4 py-2 rounded bg-background text-black focus:outline-none"
                  value={newCompany.name}
                  onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-black mb-2" htmlFor="type">
                  Tipo
                </label>
                <select
                  id="type"
                  className="w-full px-4 py-2 rounded bg-background text-black focus:outline-none"
                  value={newCompany.type}
                  onChange={(e) => setNewCompany({ ...newCompany, type: e.target.value })}
                >
                  <option value="Luz">Luz</option>
                  <option value="Gas">Gas</option>
                  <option value="Telefonía">Telefonía</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-black mb-2" htmlFor="image">
                  Subir imagen de la Compañía
                </label>
                <input
                  type="file"
                  id="image"
                  accept="image/*"
                  className="w-full text-black"
                  onChange={(e) => setNewCompany({ ...newCompany, image: e.target.files[0] })}
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
    </div>
  );
}
