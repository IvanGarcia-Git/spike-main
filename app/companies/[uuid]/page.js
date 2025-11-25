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
    type: "",
    imageUri: "",
  });
  const [rates, setRates] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [rateToEdit, setRateToEdit] = useState(null);
  const [isEditingRate, setIsEditingRate] = useState(false);
  const [showNewRateForm, setShowNewRateForm] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isTelephony, setIsTelephony] = useState(false);

  const getCompanyDetails = async () => {
    const jwtToken = getCookie("factura-token");

    try {
      const response = await authGetFetch(`companies/${params.uuid}`, jwtToken);

      if (response.ok) {
        const companyResponse = await response.json();
        setCompany(companyResponse);
        if (companyResponse.type === "Telefonía") {
          setIsTelephony(true);
        }
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
      formData.append("type", company.type);

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

            {isEditing ? (
              <div className="neumorphic-card-inset rounded-lg">
                <select
                  name="type"
                  value={company.type}
                  onChange={handleCompanyChange}
                  className="text-xl p-4 rounded-lg border-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 bg-transparent text-slate-800 dark:text-slate-200"
                >
                  <option value="Luz">Luz</option>
                  <option value="Gas">Gas</option>
                  <option value="Telefonía">Telefonía</option>
                </select>
              </div>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary/20 text-primary">
                {company.type}
              </span>
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
                <th className="p-3">Retro</th>
                {isTelephony && <th className="p-3">Productos</th>}
                {isTelephony && <th className="p-3">Precio Final</th>}
                {!isTelephony && <th className="p-3">Potencia(kW)</th>}
                {!isTelephony && <th className="p-3">Energía(€/kWh)</th>}
                {!isTelephony && <th className="p-3">Excedente(€/kWh)</th>}
                <th className="p-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rates.map((rate, index) => (
                <tr key={index} className="table-row-divider">
                  <td className="p-3 font-medium text-slate-800 dark:text-slate-200">{rate.name}</td>
                  <td className="p-3 text-slate-600 dark:text-slate-400">{rate.renewDays} días</td>
                  {isTelephony && (
                    <>
                      <td className="p-3 text-slate-600 dark:text-slate-400">{rate.products}</td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">{rate.finalPrice} €</td>
                    </>
                  )}
                  {!isTelephony && (
                    <>
                      {/* Columna de Potencia */}
                      <td className="p-3">
                        <div className="flex flex-col">
                          <div className="flex">
                            {rate.powerSlot1 && (
                              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 mr-2 mb-1">
                                {rate.powerSlot1}
                              </span>
                            )}
                            {rate.powerSlot2 && (
                              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 mr-2 mb-1">
                                {rate.powerSlot2}
                              </span>
                            )}
                            {rate.powerSlot3 && (
                              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 mb-1">
                                {rate.powerSlot3}
                              </span>
                            )}
                          </div>
                          {/* Segunda fila de potencia */}
                          <div className="flex">
                            {rate.powerSlot4 && (
                              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 mr-2 mb-1">
                                {rate.powerSlot4}
                              </span>
                            )}
                            {rate.powerSlot5 && (
                              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 mr-2 mb-1">
                                {rate.powerSlot5}
                              </span>
                            )}
                            {rate.powerSlot6 && (
                              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 mb-1">
                                {rate.powerSlot6}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Columna de Energía */}
                      <td className="p-3">
                        <div className="flex flex-col">
                          <div className="flex">
                            {rate.energySlot1 && (
                              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-600 dark:text-blue-400 mr-2 mb-1">
                                {rate.energySlot1}
                              </span>
                            )}
                            {rate.energySlot2 && (
                              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-600 dark:text-blue-400 mr-2 mb-1">
                                {rate.energySlot2}
                              </span>
                            )}
                            {rate.energySlot3 && (
                              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-600 dark:text-blue-400 mb-1">
                                {rate.energySlot3}
                              </span>
                            )}
                          </div>
                          {/* Segunda fila de energía */}
                          <div className="flex">
                            {rate.energySlot4 && (
                              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-600 dark:text-blue-400 mr-2 mb-1">
                                {rate.energySlot4}
                              </span>
                            )}
                            {rate.energySlot5 && (
                              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-600 dark:text-blue-400 mr-2 mb-1">
                                {rate.energySlot5}
                              </span>
                            )}
                            {rate.energySlot6 && (
                              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-600 dark:text-blue-400 mb-1">
                                {rate.energySlot6}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Columna de Excedente */}
                      <td className="p-3">
                        {rate.surplusSlot1 && (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-600 dark:text-red-400">
                            {rate.surplusSlot1}
                          </span>
                        )}
                      </td>
                    </>
                  )}
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
          companyType={company.type}
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
