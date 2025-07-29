import { useState, useEffect } from "react";
import { getCookie } from "cookies-next";
import { authGetFetch } from "@/helpers/server-fetch.helper";

export default function RenewContractModal({
  isOpen,
  onClose,
  onSave,
  companies,
}) {
  const [rates, setRates] = useState({});
  const [filteredRates, setFilteredRates] = useState([]);
  const [formData, setFormData] = useState({
    companyId: "",
    rateId: "",
  });

  const getRates = async () => {
    const jwtToken = getCookie("factura-token");

    try {
      const response = await authGetFetch(`rates/group/company-name`, jwtToken);
      if (response.ok) {
        const ratesData = await response.json();
        setRates(ratesData); // Guardamos todas las tarifas en rates
      } else {
        alert("Error al cargar las tarifas disponibles");
      }
    } catch (error) {
      console.error("Error al obtener las tarifas:", error);
    }
  };

  useEffect(() => {
    if (formData.companyId && rates) {
      const selectedCompany = companies.find(
        (company) => company.id == formData.companyId
      );

      if (selectedCompany && rates[selectedCompany.name]) {
        const companyRates = rates[selectedCompany.name];
        setFilteredRates(companyRates || []);
      } else {
        setFilteredRates([]);
      }
    }
  }, [formData.companyId, rates]);

  useEffect(() => {
    getRates();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.companyId || !formData.rateId) {
      alert("Por favor, selecciona una compañía y una tarifa.");
      return;
    }

    onSave(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 lg:ml-72">
      <div className="bg-background text-white p-6 rounded-lg shadow-lg max-w-md w-full">
        <h3 className="text-xl font-bold text-black mb-4">Renovar Contrato</h3>
        <form onSubmit={handleSubmit}>
          {/* Selector de Compañía */}
          <div className="mb-4">
            <label className="block text-black mb-2" htmlFor="companyId">
              Compañía
            </label>
            <select
              id="companyId"
              name="companyId"
              value={formData.companyId}
              onChange={handleInputChange}
              className="w-full px-4 py-2 rounded bg-foreground text-black focus:outline-none"
              required
            >
              <option value="" disabled>
                Selecciona una compañía
              </option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>

          {/* Selector de Tarifa */}
          <div className="mb-4">
            <label className="block text-black mb-2" htmlFor="rateId">
              Tarifa
            </label>
            <select
              id="rateId"
              name="rateId"
              value={formData.rateId}
              onChange={handleInputChange}
              className="w-full px-4 py-2 rounded bg-foreground text-black focus:outline-none"
              required
              disabled={!formData.companyId} // Deshabilitar si no hay compañía seleccionada
            >
              <option value="" disabled>
                {formData.companyId
                  ? "Selecciona una tarifa"
                  : "Primero selecciona una compañía"}
              </option>
              {filteredRates.length > 0 ? (
                filteredRates.map((rate) => (
                  <option key={rate.id} value={rate.id}>
                    {rate.name}
                  </option>
                ))
              ) : (
                <option value="" disabled>
                  No hay tarifas disponibles
                </option>
              )}
            </select>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="bg-red-600 text-white px-4 py-2 mr-2 rounded hover:bg-red-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Renovar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
