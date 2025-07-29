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
    <div className="flex justify-center items-start bg-background min-h-screen p-8">
      <div className="w-full max-w-7xl bg-foreground text-black p-6 rounded-lg">
        {/* Sección de detalles de la compañía */}
        <div className="flex items-center mb-8">
          <div className="mr-8">
            {isEditing ? (
              <div>
                <label htmlFor="image" className="block text-black mb-2 text-sm font-medium">
                  Seleccionar Imagen
                </label>
                <input
                  type="file"
                  accept="image/*"
                  id="image"
                  onChange={handleImageChange}
                  className="block w-full text-sm text-background bg-gray-700 border border-gray-600 rounded-lg cursor-pointer focus:outline-none"
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
                className="text-3xl mb-4 font-bold bg-background p-2 rounded w-full text-black"
              />
            ) : (
              <h2 className="mb-4 text-3xl font-bold">{company.name}</h2>
            )}

            {isEditing ? (
              <select
                name="type"
                value={company.type}
                onChange={handleCompanyChange}
                className="text-xl bg-background p-2 rounded text-black"
              >
                <option value="Luz">Luz</option>
                <option value="Gas">Gas</option>
                <option value="Telefonía">Telefonía</option>
              </select>
            ) : (
              <span className="bg-backgroundHover text-yellow-500 px-4 py-2 rounded-full text-l font-semibold">
                {company.type}
              </span>
            )}
          </div>
        </div>

        {/* Listado de tarifas */}
        <div className="p-5 w-full overflow-x-auto">
          <h3 className="text-2xl font-bold mb-4">Tarifas Disponibles</h3>
          <table className="min-w-full bg-gray-700 text-black">
            <thead>
              <tr className="bg-background">
                <th className="px-4 py-2 text-left text-black">Nombre</th>
                <th className="px-4 py-2 text-left text-black">Retro</th>
                {isTelephony && <th className="px-4 py-2 text-left text-black">Productos</th>}
                {isTelephony && <th className="px-4 py-2 text-left text-black">Precio Final</th>}
                {!isTelephony && <th className="px-4 py-2 text-left text-black">Potencia(kW)</th>}
                {!isTelephony && <th className="px-4 py-2 text-left text-black">Energía(€/kWh)</th>}
                {!isTelephony && (
                  <th className="px-4 py-2 text-left text-black">Excedente(€/kWh)</th>
                )}
                <th className="px-4 py-2 text-center text-black">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rates.map((rate, index) => (
                <tr key={index} className="bg-foreground hover:bg-background">
                  <td className="px-4 py-2">{rate.name}</td>
                  <td className="px-4 py-2">{rate.renewDays} días</td>
                  {isTelephony && (
                    <>
                      <td className="px-4 py-2">{rate.products}</td>
                      <td className="px-4 py-2">{rate.finalPrice} €</td>
                    </>
                  )}
                  {!isTelephony && (
                    <>
                      {/* Columna de Potencia */}
                      <td className="px-4 py-2">
                        <div className="flex flex-col">
                          <div className="flex">
                            {rate.powerSlot1 && (
                              <span className="bg-backgroundHover text-yellow-500 px-3 py-1 rounded-full text-sm font-medium mr-2 mb-1">
                                {rate.powerSlot1}
                              </span>
                            )}
                            {rate.powerSlot2 && (
                              <span className="bg-backgroundHover text-yellow-500 px-3 py-1 rounded-full text-sm font-medium mr-2 mb-1">
                                {rate.powerSlot2}
                              </span>
                            )}
                            {rate.powerSlot3 && (
                              <span className="bg-backgroundHover text-yellow-500 px-3 py-1 rounded-full text-sm font-medium mb-1">
                                {rate.powerSlot3}
                              </span>
                            )}
                          </div>
                          {/* Segunda fila de potencia */}
                          <div className="flex">
                            {rate.powerSlot4 && (
                              <span className="bg-backgroundHover text-yellow-500 px-3 py-1 rounded-full text-sm font-medium mr-2 mb-1">
                                {rate.powerSlot4}
                              </span>
                            )}
                            {rate.powerSlot5 && (
                              <span className="bg-backgroundHover text-yellow-500 px-3 py-1 rounded-full text-sm font-medium mr-2 mb-1">
                                {rate.powerSlot5}
                              </span>
                            )}
                            {rate.powerSlot6 && (
                              <span className="bg-backgroundHover text-yellow-500 px-3 py-1 rounded-full text-sm font-medium mb-1">
                                {rate.powerSlot6}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Columna de Energía */}
                      <td className="px-4 py-2">
                        <div className="flex flex-col">
                          <div className="flex">
                            {rate.energySlot1 && (
                              <span className="bg-backgroundHover text-blue-400 px-3 py-1 rounded-full text-sm font-medium mr-2 mb-1">
                                {rate.energySlot1}
                              </span>
                            )}
                            {rate.energySlot2 && (
                              <span className="bg-backgroundHover text-blue-400 px-3 py-1 rounded-full text-sm font-medium mr-2 mb-1">
                                {rate.energySlot2}
                              </span>
                            )}
                            {rate.energySlot3 && (
                              <span className="bg-backgroundHover text-blue-400 px-3 py-1 rounded-full text-sm font-medium mb-1">
                                {rate.energySlot3}
                              </span>
                            )}
                          </div>
                          {/* Segunda fila de energía */}
                          <div className="flex">
                            {rate.energySlot4 && (
                              <span className="bg-backgroundHover text-blue-400 px-3 py-1 rounded-full text-sm font-medium mr-2 mb-1">
                                {rate.energySlot4}
                              </span>
                            )}
                            {rate.energySlot5 && (
                              <span className="bg-backgroundHover text-blue-400 px-3 py-1 rounded-full text-sm font-medium mr-2 mb-1">
                                {rate.energySlot5}
                              </span>
                            )}
                            {rate.energySlot6 && (
                              <span className="bg-backgroundHover text-blue-400 px-3 py-1 rounded-full text-sm font-medium mb-1">
                                {rate.energySlot6}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Columna de Excedente */}
                      <td className="px-4 py-2">
                        {rate.surplusSlot1 && (
                          <span className="bg-backgroundHover text-red-400 px-3 py-1 rounded-full text-sm font-medium">
                            {rate.surplusSlot1}
                          </span>
                        )}
                      </td>
                    </>
                  )}
                  <td className="px-4 py-2 text-center">
                    <button
                      className="text-blue-500 hover:text-blue-700 mr-2"
                      onClick={() => {
                        setRateToEdit(rate);
                        setIsEditingRate(true);
                        setShowNewRateForm(true);
                      }}
                    >
                      <FiEdit size={22} />
                    </button>
                    <button
                      className="text-red-500 hover:text-red-700"
                      onClick={() => handleDeleteRate(rate.id)}
                    >
                      <FiTrash size={22} />
                    </button>
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
          className="bg-secondary text-white px-4 py-2 mt-4 rounded hover:bg-secondaryHover"
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
        <div className="mt-6 flex justify-end">
          {isEditing ? (
            <button
              onClick={handleSaveChanges}
              className="bg-secondary text-white px-4 py-2 rounded hover:bg-secondaryHover mr-4"
            >
              Guardar Cambios
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mr-4"
            >
              Editar
            </button>
          )}
          {isEditing && (
            <button
              onClick={() => setIsEditing(false)}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
