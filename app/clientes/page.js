"use client";

import { useEffect, useMemo, useState } from "react";
import { FiEdit2, FiEye, FiPlus, FiSearch } from "react-icons/fi";
import { getCookie } from "cookies-next";
import { authFetch, authGetFetch } from "@/helpers/server-fetch.helper";

const EMPTY_FORM = {
  name: "",
  surnames: "",
  email: "",
  phoneNumber: "",
  nationalId: "",
  type: "B2C",
  tradeName: "",
  cif: "",
  address: "",
  zipCode: "",
  province: "",
  populace: "",
  iban: "",
  contactName: "",
  contactRole: "",
  contactEmail: "",
  contactPhone: "",
  commercialStatus: "lead",
};

const STATUS_META = {
  lead: "bg-slate-100 text-slate-700",
  contactado: "bg-blue-100 text-blue-700",
  negociacion: "bg-amber-100 text-amber-700",
  cliente: "bg-emerald-100 text-emerald-700",
  inactivo: "bg-rose-100 text-rose-700",
};

export default function ClientesPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [editingCustomer, setEditingCustomer] = useState(null);

  const loadCustomers = async () => {
    const jwtToken = getCookie("factura-token");
    setLoading(true);

    try {
      const response = await authGetFetch("customers", jwtToken);
      if (!response.ok) throw new Error("No se pudieron cargar los clientes");
      const data = await response.json();
      setCustomers(data);
    } catch (error) {
      console.error(error);
      alert("Error cargando los clientes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const filteredCustomers = useMemo(() => {
    const query = search.toLowerCase().trim();

    return customers.filter((customer) => {
      const haystack = [
        customer.name,
        customer.surnames,
        customer.tradeName,
        customer.email,
        customer.phoneNumber,
        customer.contactName,
        customer.contactEmail,
        customer.cif,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !query || haystack.includes(query);
      const matchesStatus = statusFilter === "all" || (customer.commercialStatus || "lead") === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [customers, search, statusFilter]);

  const openCreateModal = () => {
    setEditingCustomer(null);
    setFormData(EMPTY_FORM);
    setIsModalOpen(true);
  };

  const openEditModal = (customer) => {
    setEditingCustomer(customer);
    setFormData({ ...EMPTY_FORM, ...customer, commercialStatus: customer.commercialStatus || "lead" });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCustomer(null);
    setFormData(EMPTY_FORM);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const jwtToken = getCookie("factura-token");
    setIsSaving(true);

    try {
      const method = editingCustomer ? "PATCH" : "POST";
      const suffix = editingCustomer ? `customers/${editingCustomer.uuid}` : "customers";
      const response = await authFetch(method, suffix, formData, jwtToken);
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.error?.message || payload?.message || "No se pudo guardar el cliente");
      }

      await loadCustomers();
      closeModal();
    } catch (error) {
      console.error(error);
      alert(error.message || "No se pudo guardar el cliente");
    } finally {
      setIsSaving(false);
    }
  };

  const loadCustomerDetail = async (customer) => {
    const jwtToken = getCookie("factura-token");

    try {
      const response = await authGetFetch(`customers/${customer.uuid}`, jwtToken);
      if (!response.ok) throw new Error();
      const data = await response.json();
      setSelectedCustomer(data);
    } catch (error) {
      console.error(error);
      alert("No se pudo cargar la ficha del cliente");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="neumorphic-card p-6 space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Clientes</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Alta, edición, ficha y seguimiento comercial.</p>
          </div>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-3 font-medium text-white shadow hover:bg-primary/90"
          >
            <FiPlus /> Nuevo cliente
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-[1fr_220px]">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, empresa, email o contacto"
              className="w-full rounded-lg border-none bg-slate-100 py-3 pl-10 pr-4 text-slate-800 outline-none dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border-none bg-slate-100 px-4 py-3 text-slate-800 outline-none dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="all">Todos los estados</option>
            <option value="lead">Lead</option>
            <option value="contactado">Contactado</option>
            <option value="negociacion">Negociación</option>
            <option value="cliente">Cliente</option>
            <option value="inactivo">Inactivo</option>
          </select>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {[
            ["Total", customers.length],
            ["Leads", customers.filter((c) => (c.commercialStatus || "lead") === "lead").length],
            ["Clientes", customers.filter((c) => c.commercialStatus === "cliente").length],
            ["Con contacto", customers.filter((c) => c.contactName || c.contactEmail || c.contactPhone).length],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/70">
              <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
              <p className="mt-2 text-3xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
            </div>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left">
            <thead className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <tr>
                <th className="p-3">Cliente</th>
                <th className="p-3">Tipo</th>
                <th className="p-3">Contacto principal</th>
                <th className="p-3">Estado comercial</th>
                <th className="p-3">Email / Teléfono</th>
                <th className="p-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {!loading && filteredCustomers.map((customer) => {
                const status = customer.commercialStatus || "lead";
                return (
                  <tr key={customer.uuid} className="border-t border-slate-200 dark:border-slate-700">
                    <td className="p-3 align-top">
                      <p className="font-semibold text-slate-800 dark:text-slate-100">
                        {customer.tradeName || `${customer.name || ""} ${customer.surnames || ""}`.trim() || "Sin nombre"}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {customer.type === "B2B" ? customer.cif || "Sin CIF" : customer.nationalId || "Sin documento"}
                      </p>
                    </td>
                    <td className="p-3">{customer.type === "B2B" ? "Empresa" : "Particular"}</td>
                    <td className="p-3">
                      <p className="font-medium text-slate-700 dark:text-slate-200">{customer.contactName || "Sin definir"}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{customer.contactRole || "-"}</p>
                    </td>
                    <td className="p-3">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${STATUS_META[status] || STATUS_META.lead}`}>
                        {status}
                      </span>
                    </td>
                    <td className="p-3 text-sm text-slate-600 dark:text-slate-300">
                      <div>{customer.email || customer.contactEmail || "Sin email"}</div>
                      <div>{customer.phoneNumber || customer.contactPhone || "Sin teléfono"}</div>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button onClick={() => loadCustomerDetail(customer)} className="rounded-lg bg-slate-100 p-2 dark:bg-slate-800" title="Ver ficha">
                          <FiEye />
                        </button>
                        <button onClick={() => openEditModal(customer)} className="rounded-lg bg-slate-100 p-2 dark:bg-slate-800" title="Editar">
                          <FiEdit2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {!loading && filteredCustomers.length === 0 && (
            <div className="py-12 text-center text-slate-500 dark:text-slate-400">No hay clientes que coincidan con el filtro.</div>
          )}
        </div>
      </div>

      {selectedCustomer && (
        <div className="neumorphic-card p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                {selectedCustomer.tradeName || `${selectedCustomer.name || ""} ${selectedCustomer.surnames || ""}`.trim() || "Ficha de cliente"}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {selectedCustomer.type === "B2B" ? "Empresa" : "Particular"} · {selectedCustomer.commercialStatus || "lead"}
              </p>
            </div>
            <button onClick={() => setSelectedCustomer(null)} className="text-sm text-slate-500">Cerrar</button>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <InfoCard label="Contacto principal" value={selectedCustomer.contactName || "Sin definir"} extra={selectedCustomer.contactRole || "-"} />
            <InfoCard label="Email" value={selectedCustomer.email || selectedCustomer.contactEmail || "Sin email"} extra={selectedCustomer.phoneNumber || selectedCustomer.contactPhone || "Sin teléfono"} />
            <InfoCard label="Documento / CIF" value={selectedCustomer.cif || selectedCustomer.nationalId || "Sin dato"} extra={selectedCustomer.iban || "Sin IBAN"} />
            <InfoCard label="Dirección" value={selectedCustomer.address || "Sin dirección"} extra={[selectedCustomer.zipCode, selectedCustomer.populace, selectedCustomer.province].filter(Boolean).join(" · ") || "-"} />
          </div>

          <div className="mt-6">
            <h3 className="mb-3 text-lg font-semibold text-slate-800 dark:text-slate-100">Contratos vinculados</h3>
            {selectedCustomer.contracts?.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-left">
                  <thead className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <tr>
                      <th className="p-3">UUID</th>
                      <th className="p-3">Compañía</th>
                      <th className="p-3">Tarifa</th>
                      <th className="p-3">Usuario</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedCustomer.contracts.map((contract) => (
                      <tr key={contract.uuid} className="border-t border-slate-200 dark:border-slate-700">
                        <td className="p-3 text-sm">{contract.uuid}</td>
                        <td className="p-3 text-sm">{contract.company?.name || "-"}</td>
                        <td className="p-3 text-sm">{contract.rate?.name || contract.rate?.type || "-"}</td>
                        <td className="p-3 text-sm">{contract.user?.name || contract.user?.email || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">Este cliente todavía no tiene contratos vinculados.</p>
            )}
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="modal-card max-h-[90vh] w-full max-w-4xl overflow-y-auto p-6">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                  {editingCustomer ? "Editar cliente" : "Nuevo cliente"}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Ficha comercial y operativa del cliente.</p>
              </div>
              <button onClick={closeModal} className="text-sm text-slate-500">Cerrar</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Field label="Tipo">
                  <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="w-full rounded-lg border-none bg-slate-100 px-4 py-3 text-slate-800 outline-none dark:bg-slate-800 dark:text-slate-100">
                    <option value="B2C">Particular</option>
                    <option value="B2B">Empresa</option>
                  </select>
                </Field>
                <Field label="Estado comercial">
                  <select value={formData.commercialStatus} onChange={(e) => setFormData({ ...formData, commercialStatus: e.target.value })} className="w-full rounded-lg border-none bg-slate-100 px-4 py-3 text-slate-800 outline-none dark:bg-slate-800 dark:text-slate-100">
                    <option value="lead">Lead</option>
                    <option value="contactado">Contactado</option>
                    <option value="negociacion">Negociación</option>
                    <option value="cliente">Cliente</option>
                    <option value="inactivo">Inactivo</option>
                  </select>
                </Field>
                <Field label="Nombre" required><input className="w-full rounded-lg border-none bg-slate-100 px-4 py-3 text-slate-800 outline-none dark:bg-slate-800 dark:text-slate-100" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required /></Field>
                <Field label="Apellidos" required><input className="w-full rounded-lg border-none bg-slate-100 px-4 py-3 text-slate-800 outline-none dark:bg-slate-800 dark:text-slate-100" value={formData.surnames} onChange={(e) => setFormData({ ...formData, surnames: e.target.value })} required /></Field>
                <Field label="Razón social"><input className="w-full rounded-lg border-none bg-slate-100 px-4 py-3 text-slate-800 outline-none dark:bg-slate-800 dark:text-slate-100" value={formData.tradeName} onChange={(e) => setFormData({ ...formData, tradeName: e.target.value })} /></Field>
                <Field label="CIF"><input className="w-full rounded-lg border-none bg-slate-100 px-4 py-3 text-slate-800 outline-none dark:bg-slate-800 dark:text-slate-100" value={formData.cif} onChange={(e) => setFormData({ ...formData, cif: e.target.value })} /></Field>
                <Field label="DNI/NIE/NIF"><input className="w-full rounded-lg border-none bg-slate-100 px-4 py-3 text-slate-800 outline-none dark:bg-slate-800 dark:text-slate-100" value={formData.nationalId} onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })} /></Field>
                <Field label="Email"><input className="w-full rounded-lg border-none bg-slate-100 px-4 py-3 text-slate-800 outline-none dark:bg-slate-800 dark:text-slate-100" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} /></Field>
                <Field label="Teléfono" required><input className="w-full rounded-lg border-none bg-slate-100 px-4 py-3 text-slate-800 outline-none dark:bg-slate-800 dark:text-slate-100" value={formData.phoneNumber} onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })} required /></Field>
                <Field label="Dirección" required><input className="w-full rounded-lg border-none bg-slate-100 px-4 py-3 text-slate-800 outline-none dark:bg-slate-800 dark:text-slate-100" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} required /></Field>
                <Field label="Código postal" required><input className="w-full rounded-lg border-none bg-slate-100 px-4 py-3 text-slate-800 outline-none dark:bg-slate-800 dark:text-slate-100" value={formData.zipCode} onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })} required /></Field>
                <Field label="Población" required><input className="w-full rounded-lg border-none bg-slate-100 px-4 py-3 text-slate-800 outline-none dark:bg-slate-800 dark:text-slate-100" value={formData.populace} onChange={(e) => setFormData({ ...formData, populace: e.target.value })} required /></Field>
                <Field label="Provincia" required><input className="w-full rounded-lg border-none bg-slate-100 px-4 py-3 text-slate-800 outline-none dark:bg-slate-800 dark:text-slate-100" value={formData.province} onChange={(e) => setFormData({ ...formData, province: e.target.value })} required /></Field>
                <Field label="IBAN" required><input className="w-full rounded-lg border-none bg-slate-100 px-4 py-3 text-slate-800 outline-none dark:bg-slate-800 dark:text-slate-100" value={formData.iban} onChange={(e) => setFormData({ ...formData, iban: e.target.value })} required /></Field>
              </section>

              <section>
                <h3 className="mb-4 text-lg font-semibold text-slate-800 dark:text-slate-100">Contacto principal</h3>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <Field label="Nombre contacto"><input className="w-full rounded-lg border-none bg-slate-100 px-4 py-3 text-slate-800 outline-none dark:bg-slate-800 dark:text-slate-100" value={formData.contactName} onChange={(e) => setFormData({ ...formData, contactName: e.target.value })} /></Field>
                  <Field label="Cargo"><input className="w-full rounded-lg border-none bg-slate-100 px-4 py-3 text-slate-800 outline-none dark:bg-slate-800 dark:text-slate-100" value={formData.contactRole} onChange={(e) => setFormData({ ...formData, contactRole: e.target.value })} /></Field>
                  <Field label="Email contacto"><input className="w-full rounded-lg border-none bg-slate-100 px-4 py-3 text-slate-800 outline-none dark:bg-slate-800 dark:text-slate-100" type="email" value={formData.contactEmail} onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })} /></Field>
                  <Field label="Teléfono contacto"><input className="w-full rounded-lg border-none bg-slate-100 px-4 py-3 text-slate-800 outline-none dark:bg-slate-800 dark:text-slate-100" value={formData.contactPhone} onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })} /></Field>
                </div>
              </section>

              <div className="flex justify-end gap-3">
                <button type="button" onClick={closeModal} className="rounded-lg bg-slate-200 px-4 py-3 text-slate-700 dark:bg-slate-800 dark:text-slate-200">Cancelar</button>
                <button type="submit" disabled={isSaving} className="rounded-lg bg-primary px-4 py-3 font-medium text-white disabled:opacity-60">
                  {isSaving ? "Guardando..." : editingCustomer ? "Guardar cambios" : "Crear cliente"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children, required = false }) {
  return (
    <label className="block text-sm text-slate-600 dark:text-slate-300">
      <span className="mb-2 block font-medium">{label}{required ? " *" : ""}</span>
      {children}
    </label>
  );
}

function InfoCard({ label, value, extra }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/70">
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-2 font-semibold text-slate-800 dark:text-slate-100">{value}</p>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{extra}</p>
    </div>
  );
}
