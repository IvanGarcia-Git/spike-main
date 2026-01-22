"use client";
import { useState, useEffect } from "react";
import { getCookie } from "cookies-next";
import { authGetFetch, authFetch } from "@/helpers/server-fetch.helper";
import { FiTrash, FiEdit } from "react-icons/fi";
import NewRateModal from "@/components/new-rate.modal";

export default function CompanyDetail({ params }) {
  const uuid = params.uuid;

  const [company, setCompany] = useState({
    name: "",
    imageUri: "",
  });
  const [rates, setRates] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [rateToEdit, setRateToEdit] = useState(null);
  const [isEditingRate, setIsEditingRate] = useState(false);
  const [showNewRateForm, setShowNewRateForm] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const getCompanyDetails = async () => {
    const jwtToken = getCookie("factura-token");

    try {
      const response = await authGetFetch(`companies/${params.uuid}`, jwtToken);

      if (response.ok) {
        const companyResponse = await response.json();
        setCompany(companyResponse);
        setRates(companyResponse.rates);
      } else {
        alert("Error cargando la información de la compañía");
      }
    } catch (error) {
      console.error("Error enviando la solicitud:", error);
    }
  };

  useEffect(() => {
    getCompanyDetails();
  }, []);

  const handleAddRate = (newRate) => {
    setRates([...rates, newRate]);
    setShowNewRateForm(false);
  };

  const handleDeleteRate = async (rateId) => {
    const confirmDelete = confirm("¿Estás seguro de que quieres eliminar esta tarifa?");
    if (!confirmDelete) return;

    const jwtToken = getCookie("factura-token");

    try {
      const response = await authFetch("DELETE", `rates/${rateId}`, {}, jwtToken);

      if (response.ok) {
        const filteredRates = rates.filter((rate) => rate.id !== rateId);
        setRates(filteredRates);
      } else {
        alert("Error eliminando la tarifa");
      }
    } catch (error) {
      console.error("Error enviando la solicitud:", error);
    }
  };

  const handleEditRate = (editedRate) => {
    setRates(rates.map((rate) => (rate.id === editedRate.id ? editedRate : rate)));
    setShowNewRateForm(false);
    setRateToEdit(null);
    setIsEditingRate(false);
  };

  const handleSaveChanges = async () => {
    const jwtToken = getCookie("factura-token");

    try {
      const formData = new FormData();
      formData.append("name", company.name);

      if (selectedImage) {
        formData.append("imgFile", selectedImage);
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/companies/${uuid}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
        body: formData,
      });

      if (response.ok) {
        alert("Compañía actualizada con éxito");
        setIsEditing(false);
      } else {
        alert("Error actualizando la compañía");
      }
    } catch (error) {
      console.error("Error enviando la solicitud:", error);
    }
  };

  const handleCompanyChange = (e) => {
    const { name, value } = e.target;
    setCompany({ ...company, [name]: value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      const imagePreviewUrl = URL.createObjectURL(file);
      setCompany({ ...company, imageUri: imagePreviewUrl });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="neumorphic-card p-6">
        {/* Sección de detalles de la compañía */}
        <div className="flex items-center mb-8">
          <div className="mr-8">
            {isEditing ? (
              <div>
                <label htmlFor="image" className="block text-slate-700 dark:text-slate-300 mb-2 text-sm font-medium">
                  Seleccionar Imagen
                </label>
                <input
                  type="file"
                  accept="image/*"
                  id="image"
                  onChange={handleImageChange}
                  className="block w-full text-sm text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer focus:outline-none"
                />
                {company.imageUri && (
                  <img
                    src={company.imageUri}
                    alt={company.name}
                    className="w-32 h-32 object-cover mt-4 rounded"
                  />
                )}
              </div>
            ) : (
              <img
                src={company.imageUri}
                alt={company.name}
                className="w-32 h-32 object-cover rounded"
              />
            )}
          </div>
          <div>
            {/* Campo editable para el nombre */}
            {isEditing ? (
              <input
                type="text"
                name="name"
                value={company.name}
                onChange={handleCompanyChange}
                className="text-3xl mb-4 font-bold neumorphic-card-inset p-4 rounded-lg w-full text-slate-800 dark:text-slate-200 border-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 bg-transparent"
              />
            ) : (
              <h2 className="mb-4 text-3xl font-bold text-slate-800 dark:text-slate-100">{company.name}</h2>
            )}

          </div>
        </div>

        {/* Listado de tarifas */}
        <div className="w-full overflow-x-auto">
          <h3 className="text-2xl font-bold mb-4 text-slate-800 dark:text-slate-100">Tarifas Disponibles</h3>
          <table className="w-full text-left">
            <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="p-3">Nombre</th>
                <th className="p-3">Tipo</th>
                <th className="p-3">Retro</th>
                <th className="p-3">Detalles</th>
                <th className="p-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rates.map((rate, index) => (
                <tr key={index} className="table-row-divider">
                  <td className="p-3 font-medium text-slate-800 dark:text-slate-200">{rate.name}</td>
                  <td className="p-3">
                    <span
                      className={`${
                        rate.serviceType === "Gas"
                          ? "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400"
                          : rate.serviceType === "Telefonía"
                          ? "bg-purple-500/20 text-purple-600 dark:text-purple-400"
                          : "bg-blue-500/20 text-blue-600 dark:text-blue-400"
                      } px-3 py-1 rounded-full text-xs font-semibold`}
                    >
                      {rate.serviceType || "Sin tipo"}
                    </span>
                  </td>
                  <td className="p-3 text-slate-600 dark:text-slate-400">{rate.renewDays} días</td>
                  <td className="p-3 text-slate-600 dark:text-slate-400">
                    {rate.serviceType === "Telefonía" ? (
                      <span>{rate.products} - {rate.finalPrice}€</span>
                    ) : (
                      <span>
                        {rate.type && <span className="mr-2">Tarifa {rate.type}</span>}
                        {rate.energySlot1 && <span className="text-xs">E: {rate.energySlot1}€/kWh</span>}
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex space-x-2">
                      <button
                        className="p-2 rounded-lg neumorphic-button text-slate-600 dark:text-slate-400 hover:text-primary"
                        onClick={() => {
                          setRateToEdit(rate);
                          setIsEditingRate(true);
                          setShowNewRateForm(true);
                        }}
                      >
                        <FiEdit size={18} />
                      </button>
                      <button
                        className="p-2 rounded-lg neumorphic-button text-slate-600 dark:text-slate-400 hover:text-primary"
                        onClick={() => handleDeleteRate(rate.id)}
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

        {/* Botón para añadir nueva tarifa */}
        <button
          onClick={() => {
            setRateToEdit(null);
            setShowNewRateForm(true);
          }}
          className="px-5 py-3 rounded-lg neumorphic-button text-white bg-primary hover:bg-primary/90 font-medium mt-4"
        >
          Añadir Nueva Tarifa
        </button>

        {/* Modal de nueva tarifa */}
        <NewRateModal
          isOpen={showNewRateForm}
          onClose={() => {
            setRateToEdit({});
            setShowNewRateForm(false);
          }}
          onSave={isEditingRate ? handleEditRate : handleAddRate}
          companyId={company.id}
          rateToEdit={rateToEdit}
        />

        {/* Botones para editar y guardar cambios */}
        <div className="mt-6 flex justify-end gap-3">
          {isEditing ? (
            <button
              onClick={handleSaveChanges}
              className="px-5 py-3 rounded-lg neumorphic-button text-white bg-primary hover:bg-primary/90 font-medium"
            >
              Guardar Cambios
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="px-5 py-3 rounded-lg neumorphic-button text-slate-700 dark:text-slate-300 font-medium"
            >
              Editar
            </button>
          )}
          {isEditing && (
            <button
              onClick={() => setIsEditing(false)}
              className="px-5 py-3 rounded-lg neumorphic-button text-slate-700 dark:text-slate-300 font-medium"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
