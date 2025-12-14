"use client";
import { Suspense, useState, useEffect } from "react";
import EmitirFactura from "@/components/EmitirFactura";
import { authGetFetch } from "@/helpers/server-fetch.helper";
import { getCookie } from "cookies-next";

function InvoiceHistoryItem({ invoice, onClick }) {
  const isCobro = invoice.type === "COBRO";
  const formattedDate = new Date(invoice.invoiceDate).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <div
      onClick={() => onClick?.(invoice)}
      className="neumorphic-card p-4 flex items-center justify-between hover:shadow-neumorphic-inset-light dark:hover:shadow-neumorphic-inset-dark transition-all cursor-pointer"
    >
      <div className="flex items-center gap-4">
        <div
          className={`neumorphic-card-inset w-12 h-12 rounded-full flex items-center justify-center ${
            isCobro ? "text-green-500" : "text-red-500"
          }`}
        >
          <span className="material-icons-outlined">
            {isCobro ? "arrow_downward" : "arrow_upward"}
          </span>
        </div>
        <div>
          <p className="font-semibold text-slate-800 dark:text-slate-100">
            {invoice.clientName}
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {invoice.concept || "Sin concepto"}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            {formattedDate} · {invoice.invoiceNumber}
          </p>
        </div>
      </div>
      <div className="text-right">
        <span
          className={`text-xl font-bold ${
            isCobro
              ? "text-green-600 dark:text-green-400"
              : "text-red-600 dark:text-red-400"
          }`}
        >
          {isCobro ? "+" : "-"}
          {parseFloat(invoice.total).toFixed(2)} €
        </span>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
          {isCobro ? "Cobro" : "Pago"}
        </p>
      </div>
    </div>
  );
}

function RecentInvoices({ invoices, loading, onRefresh }) {
  if (loading) {
    return (
      <div className="text-center py-12 text-slate-600 dark:text-slate-400">
        <span className="material-icons-outlined animate-spin text-4xl">sync</span>
        <p className="mt-2">Cargando facturas...</p>
      </div>
    );
  }

  if (!invoices || invoices.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="neumorphic-card-inset inline-flex items-center justify-center w-20 h-20 rounded-full mb-4">
          <span className="material-icons-outlined text-4xl text-slate-400">
            receipt_long
          </span>
        </div>
        <p className="text-slate-600 dark:text-slate-400">
          No tienes facturas aún
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
          Crea tu primera factura para empezar
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {invoices.map((invoice) => (
        <InvoiceHistoryItem key={invoice.uuid} invoice={invoice} />
      ))}
    </div>
  );
}

export default function EmitirFacturaPage() {
  const [selectedType, setSelectedType] = useState(null);
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentInvoices();
  }, []);

  const fetchRecentInvoices = async () => {
    setLoading(true);
    try {
      const jwtToken = getCookie("factura-token");
      const response = await authGetFetch("invoices/recent?limit=10", jwtToken);
      if (response.ok) {
        const data = await response.json();
        setRecentInvoices(data);
      }
    } catch (error) {
      console.error("Error fetching recent invoices:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setSelectedType(null);
  };

  const handleInvoiceSaved = async () => {
    await fetchRecentInvoices();
  };

  // Si hay un tipo seleccionado, mostrar el formulario de emisión
  if (selectedType) {
    return (
      <Suspense fallback={<div>Loading...</div>}>
        <EmitirFactura
          invoiceType={selectedType}
          onBack={handleBack}
          onInvoiceSaved={handleInvoiceSaved}
        />
      </Suspense>
    );
  }

  // Vista principal con selector y historial
  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
            Facturación
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Gestiona tus facturas de cobros y pagos
          </p>
        </div>
      </div>

      {/* Selector de tipo de factura */}
      <div className="neumorphic-card p-8 mb-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-light text-slate-700 dark:text-slate-200 italic">
            ¿Nueva factura?
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
            Selecciona el tipo de factura que deseas crear
          </p>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-6">
          <button
            onClick={() => setSelectedType("COBRO")}
            className="neumorphic-button flex flex-col items-center justify-center p-8 rounded-xl hover:shadow-neumorphic-inset-light dark:hover:shadow-neumorphic-inset-dark transition-all group"
          >
            <div className="neumorphic-card-inset w-16 h-16 rounded-full flex items-center justify-center mb-4 group-hover:bg-green-50 dark:group-hover:bg-green-900/20 transition-colors">
              <span className="material-icons-outlined text-3xl text-green-500">
                arrow_downward
              </span>
            </div>
            <span className="text-xl font-semibold text-green-600 dark:text-green-400">
              Cobro
            </span>
            <span className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Ingreso de cliente
            </span>
          </button>

          <button
            onClick={() => setSelectedType("PAGO")}
            className="neumorphic-button flex flex-col items-center justify-center p-8 rounded-xl hover:shadow-neumorphic-inset-light dark:hover:shadow-neumorphic-inset-dark transition-all group"
          >
            <div className="neumorphic-card-inset w-16 h-16 rounded-full flex items-center justify-center mb-4 group-hover:bg-red-50 dark:group-hover:bg-red-900/20 transition-colors">
              <span className="material-icons-outlined text-3xl text-red-500">
                arrow_upward
              </span>
            </div>
            <span className="text-xl font-semibold text-red-600 dark:text-red-400">
              Pago
            </span>
            <span className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Gasto a proveedor
            </span>
          </button>
        </div>
      </div>

      {/* Sección de últimas facturas */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
          Últimas Facturas
        </h3>
        <button
          onClick={fetchRecentInvoices}
          className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/50 transition-colors"
          title="Actualizar"
        >
          <span className={`material-icons-outlined text-xl ${loading ? "animate-spin" : ""}`}>
            {loading ? "sync" : "refresh"}
          </span>
        </button>
      </div>

      <RecentInvoices
        invoices={recentInvoices}
        loading={loading}
        onRefresh={fetchRecentInvoices}
      />
    </div>
  );
}
