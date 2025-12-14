"use client";
import { Suspense, useState, useEffect } from "react";
import EmitirFactura from "@/components/EmitirFactura";
import { authGetFetch } from "@/helpers/server-fetch.helper";
import { getCookie } from "cookies-next";

function InvoiceHistoryItem({ invoice }) {
  const isCobro = invoice.type === "COBRO";
  const formattedDate = new Date(invoice.invoiceDate).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });

  return (
    <div className="neumorphic-card p-4 rounded-xl flex items-center justify-between hover:scale-[1.02] transition-transform cursor-pointer">
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-800 dark:text-slate-100 truncate">
          {invoice.clientName}
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
          {invoice.concept}
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
          {formattedDate}
        </p>
      </div>
      <div className="ml-4 text-right">
        <span
          className={`text-lg font-bold ${
            isCobro
              ? "text-green-600 dark:text-green-400"
              : "text-red-600 dark:text-red-400"
          }`}
        >
          {isCobro ? "+" : "-"}
          {parseFloat(invoice.total).toFixed(2)} €
        </span>
      </div>
    </div>
  );
}

function InvoiceSelector({ onSelectType }) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-12">
      <h2 className="text-3xl font-light text-slate-700 dark:text-slate-200 mb-8 italic">
        ¿Nueva factura?
      </h2>
      <div className="flex gap-6">
        <button
          onClick={() => onSelectType("COBRO")}
          className="neumorphic-button px-8 py-4 rounded-xl text-green-600 dark:text-green-400 font-semibold text-xl hover:scale-105 transition-transform flex items-center gap-2"
        >
          <span className="material-icons-outlined">arrow_downward</span>
          Cobro
        </button>
        <button
          onClick={() => onSelectType("PAGO")}
          className="neumorphic-button px-8 py-4 rounded-xl text-red-600 dark:text-red-400 font-semibold text-xl hover:scale-105 transition-transform flex items-center gap-2"
        >
          <span className="material-icons-outlined">arrow_upward</span>
          Pago
        </button>
      </div>
    </div>
  );
}

function RecentInvoices({ invoices, loading }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!invoices || invoices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-slate-400 dark:text-slate-500">
        <span className="material-icons-outlined text-4xl mb-2">receipt_long</span>
        <p>No hay facturas recientes</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
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
    const fetchRecentInvoices = async () => {
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

    fetchRecentInvoices();
  }, []);

  const handleBack = () => {
    setSelectedType(null);
  };

  const handleInvoiceSaved = async () => {
    // Recargar las facturas recientes después de guardar una nueva
    try {
      const jwtToken = getCookie("factura-token");
      const response = await authGetFetch("invoices/recent?limit=10", jwtToken);
      if (response.ok) {
        const data = await response.json();
        setRecentInvoices(data);
      }
    } catch (error) {
      console.error("Error refreshing invoices:", error);
    }
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
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 flex items-center">
            <span className="material-icons-outlined text-primary mr-3">receipt_long</span>
            Facturación
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Gestiona tus facturas de cobros y pagos
          </p>
        </div>

        {/* Main Content - Two Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - New Invoice Selector */}
          <div className="neumorphic-card p-6 rounded-xl min-h-[400px] flex flex-col">
            <InvoiceSelector onSelectType={setSelectedType} />
          </div>

          {/* Right Panel - Recent Invoices */}
          <div className="neumorphic-card p-6 rounded-xl min-h-[400px]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 flex items-center">
                <span className="material-icons-outlined mr-2 text-primary">history</span>
                Últimas Facturas
              </h3>
              <button
                onClick={() => {
                  setLoading(true);
                  const jwtToken = getCookie("factura-token");
                  authGetFetch("invoices/recent?limit=10", jwtToken)
                    .then((res) => res.json())
                    .then((data) => setRecentInvoices(data))
                    .finally(() => setLoading(false));
                }}
                className="p-2 rounded-lg neumorphic-button text-slate-500 hover:text-primary transition-colors"
                title="Actualizar"
              >
                <span className="material-icons-outlined text-sm">refresh</span>
              </button>
            </div>
            <RecentInvoices invoices={recentInvoices} loading={loading} />
          </div>
        </div>
      </div>
    </div>
  );
}
