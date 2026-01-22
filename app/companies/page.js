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
      image: null,
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="neumorphic-card p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Compañías</h2>
          <button
            className="px-5 py-3 rounded-lg neumorphic-button text-white bg-primary hover:bg-primary/90 font-medium"
            onClick={openModal}
          >
            Añadir Compañía
          </button>
        </div>

        <table className="w-full text-left">
          <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <tr>
              <th className="p-3">Imagen</th>
              <th className="p-3">Nombre</th>
              <th className="p-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {companies.map((company) => (
              <tr key={company.id} className="table-row-divider">
                <td className="p-3">
                  <img
                    src={company.imageUri}
                    alt={company.name}
                    className="w-16 h-16 object-cover rounded"
                  />
                </td>
                <td className="p-3 font-medium text-slate-800 dark:text-slate-200">{company.name}</td>

                <td className="p-3">
                  <div className="flex space-x-2">
                    <button
                      className="p-2 rounded-lg neumorphic-button text-slate-600 dark:text-slate-400 hover:text-primary"
                      onClick={() => handleEditCompany(company.uuid)}
                    >
                      <FiEdit size={18} />
                    </button>
                    <button
                      className="p-2 rounded-lg neumorphic-button text-slate-600 dark:text-slate-400 hover:text-primary"
                      onClick={() => handleDeleteCompany(company.id)}
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

      {/* Modal para crear nueva compañía */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center lg:ml-72">
          <div className="modal-card p-6 w-full max-w-lg">
            <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">Crear nueva compañía</h3>
            <form onSubmit={handleAddCompany}>
              <div className="mb-4">
                <label className="block text-slate-700 dark:text-slate-300 mb-2" htmlFor="name">
                  Nombre de la Compañía
                </label>
                <input
                  type="text"
                  id="name"
                  className="w-full neumorphic-card-inset px-4 py-3 rounded-lg border-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 bg-transparent text-slate-800 dark:text-slate-200"
                  value={newCompany.name}
                  onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-slate-700 dark:text-slate-300 mb-2" htmlFor="image">
                  Subir imagen de la Compañía
                </label>
                <input
                  type="file"
                  id="image"
                  accept="image/*"
                  className="w-full text-slate-700 dark:text-slate-300"
                  onChange={(e) => setNewCompany({ ...newCompany, image: e.target.files[0] })}
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
    </div>
  );
}
