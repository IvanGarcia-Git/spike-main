"use client";
import { Suspense, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import EmitirFactura from "@/components/EmitirFactura";
import InvoicePreview from "@/components/invoice-preview";
import { authGetFetch, authFetch } from "@/helpers/server-fetch.helper";
import { getCookie } from "cookies-next";

// Importar PDFDownloadLink dinámicamente para evitar errores de SSR
const PDFDownloadLink = dynamic(
  () => import("@react-pdf/renderer").then((mod) => mod.PDFDownloadLink),
  { ssr: false, loading: () => <span>Cargando...</span> }
);

// Importar InvoiceDocument dinámicamente con un loading state
const InvoiceDocument = dynamic(
  () => import("@/components/invoice-document"),
  { ssr: false }
);

// Componente wrapper para el PDF que maneja la carga dinámica
function SafePDFDownloadLink({ pdfData, fileName, className, children }) {
  const [isReady, setIsReady] = useState(false);
  const [DocumentComponent, setDocumentComponent] = useState(null);

  useEffect(() => {
    // Importar el componente directamente para evitar problemas con dynamic()
    import("@/components/invoice-document").then((mod) => {
      setDocumentComponent(() => mod.default);
      setIsReady(true);
    });
  }, []);

  if (!isReady || !DocumentComponent) {
    return (
      <span className={className}>
        <span className="material-icons-outlined mr-2 text-sm animate-spin">refresh</span>
        Cargando...
      </span>
    );
  }

  return (
    <PDFDownloadLink
      document={<DocumentComponent {...pdfData} />}
      fileName={fileName}
      className={className}
    >
      {children}
    </PDFDownloadLink>
  );
}

// Datos del emisor por defecto (se cargará dinámicamente del usuario)
const DEFAULT_ISSUER = {
  name: "",
  nif: "",
  address: "",
  city: "",
  postalCode: "",
  country: "España",
};

// Helper para preparar datos de factura para el PDF
function prepareInvoiceForPDF(invoice, issuerData = DEFAULT_ISSUER) {
  if (!invoice) return null;

  let items = [];
  try {
    const parsedItems = invoice.items ? JSON.parse(invoice.items) : [];
    items = parsedItems.map((item, index) => ({
      id: item.id || index,
      concepto: item.concepto || item.concept || "",
      cantidad: Number(item.cantidad || item.quantity || 1),
      precio: Number(item.precio || item.price || 0),
      total: Number(item.total || (item.cantidad || 1) * (item.precio || 0)),
    }));
  } catch (e) {
    items = [];
  }

  return {
    issuer: issuerData,
    client: {
      name: invoice.clientName || "",
      nationalId: invoice.clientNationalId || "",
      address: invoice.clientAddress || "",
    },
    invoiceNumber: invoice.invoiceNumber || "",
    ibanNumber: invoice.iban || "",
    invoiceDate: invoice.invoiceDate || "",
    invoiceDueDate: invoice.dueDate || "",
    paymentMethod: invoice.paymentMethod || "",
    items: items,
    ivaPercentage: Number(invoice.ivaPercentage) || 21,
    irpfPercentage: Number(invoice.irpfPercentage) || 0,
    subtotal: Number(invoice.subtotal) || 0,
    totalIVA: Number(invoice.ivaAmount) || 0,
    totalIRPF: Number(invoice.irpfAmount) || 0,
    grandTotal: Number(invoice.total) || 0,
    notes: invoice.notes || "",
  };
}

function InvoiceHistoryItem({ invoice, onView, onDownload, onDelete }) {
  const isCobro = invoice.type === "COBRO";
  const formattedDate = new Date(invoice.invoiceDate).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const handleViewClick = (e) => {
    e.stopPropagation();
    onView?.(invoice);
  };

  const handleDownloadClick = (e) => {
    e.stopPropagation();
    onDownload?.(invoice);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    onDelete?.(invoice);
  };

  return (
    <div className="neumorphic-card p-4 flex items-center justify-between hover:shadow-neumorphic-inset-light dark:hover:shadow-neumorphic-inset-dark transition-all">
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
      <div className="flex items-center gap-4">
        <div className="text-right mr-4">
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
        {/* Botones de acción */}
        <div className="flex gap-2">
          <button
            onClick={handleViewClick}
            className="neumorphic-button p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-primary transition-colors"
            title="Ver factura"
          >
            <span className="material-icons-outlined text-xl">visibility</span>
          </button>
          <button
            onClick={handleDownloadClick}
            className="neumorphic-button p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-primary transition-colors"
            title="Descargar PDF"
          >
            <span className="material-icons-outlined text-xl">download</span>
          </button>
          <button
            onClick={handleDeleteClick}
            className="neumorphic-button p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-red-500 transition-colors"
            title="Eliminar factura"
          >
            <span className="material-icons-outlined text-xl">delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// Modal de vista previa de factura
function InvoicePreviewModal({ invoice, isOpen, onClose, issuerData }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isOpen || !invoice) return null;

  // Preparar datos para el PDF usando el helper
  const pdfData = prepareInvoiceForPDF(invoice, issuerData);
  if (!pdfData) return null;

  const modalContent = (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="modal-card w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header del modal */}
        <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div
              className={`neumorphic-card-inset w-10 h-10 rounded-full flex items-center justify-center ${
                invoice.type === "COBRO" ? "text-green-500" : "text-red-500"
              }`}
            >
              <span className="material-icons-outlined">
                {invoice.type === "COBRO" ? "arrow_downward" : "arrow_upward"}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                Factura {invoice.invoiceNumber}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {invoice.type === "COBRO" ? "Cobro" : "Pago"} · {invoice.clientName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isClient && (
              <SafePDFDownloadLink
                pdfData={pdfData}
                fileName={`Factura_${invoice.invoiceNumber}_${(invoice.clientName || "cliente").replace(/\s+/g, "_")}.pdf`}
                className="neumorphic-button px-4 py-2 rounded-lg text-white bg-primary hover:bg-primary/90 font-medium inline-flex items-center"
              >
                {({ loading, error }) => {
                  if (error) {
                    console.error("PDF Error:", error);
                    return "Error";
                  }
                  return (
                    <>
                      <span className="material-icons-outlined mr-2 text-sm">
                        {loading ? "refresh" : "download"}
                      </span>
                      {loading ? "Generando..." : "Descargar PDF"}
                    </>
                  );
                }}
              </SafePDFDownloadLink>
            )}
            <button
              onClick={onClose}
              className="neumorphic-button p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-red-500 transition-colors"
            >
              <span className="material-icons-outlined">close</span>
            </button>
          </div>
        </div>

        {/* Contenido del modal - Vista previa */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100 dark:bg-slate-800">
          <InvoicePreview
            issuer={pdfData.issuer}
            client={pdfData.client}
            invoiceNumber={pdfData.invoiceNumber}
            ibanNumber={pdfData.ibanNumber}
            invoiceDate={pdfData.invoiceDate}
            invoiceDueDate={pdfData.invoiceDueDate}
            paymentMethod={pdfData.paymentMethod}
            items={pdfData.items}
            ivaPercentage={pdfData.ivaPercentage}
            irpfPercentage={pdfData.irpfPercentage}
            subtotal={pdfData.subtotal}
            totalIVA={pdfData.totalIVA}
            totalIRPF={pdfData.totalIRPF}
            grandTotal={pdfData.grandTotal}
            notes={pdfData.notes}
          />
        </div>
      </div>
    </div>
  );

  if (!isClient) return null;
  return createPortal(modalContent, document.body);
}

// Componente para descargar PDF directamente
function DirectPDFDownload({ invoice, onComplete, issuerData }) {
  const [isClient, setIsClient] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Función para manejar click en el link de descarga
  const handleDownloadClick = () => {
    setIsDownloading(true);
    // Pequeño delay para que el PDF se genere y descargue
    setTimeout(() => {
      setIsDownloading(false);
      onComplete?.();
    }, 1500);
  };

  if (!isClient || !invoice) return null;

  // Preparar datos para el PDF usando el helper
  const pdfData = prepareInvoiceForPDF(invoice, issuerData);
  if (!pdfData) {
    onComplete?.();
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="neumorphic-card p-6 text-center">
        <div className="mb-4">
          <span className={`material-icons-outlined text-4xl ${isDownloading ? 'animate-spin text-primary' : 'text-slate-600'}`}>
            {isDownloading ? 'sync' : 'download'}
          </span>
        </div>
        <p className="text-slate-700 dark:text-slate-300 mb-4">
          {isDownloading ? 'Generando PDF...' : 'Haz clic para descargar'}
        </p>
        <div className="flex gap-3 justify-center">
          <div onClick={handleDownloadClick}>
            <SafePDFDownloadLink
              pdfData={pdfData}
              fileName={`Factura_${invoice.invoiceNumber}_${(invoice.clientName || "cliente").replace(/\s+/g, "_")}.pdf`}
              className="neumorphic-button px-4 py-2 rounded-lg text-white bg-primary hover:bg-primary/90 font-medium inline-flex items-center"
            >
              {({ loading, error }) => {
                if (error) {
                  console.error("PDF Error:", error);
                  return "Error";
                }
                return (
                  <>
                    <span className="material-icons-outlined mr-2 text-sm">
                      {loading ? 'refresh' : 'download'}
                    </span>
                    {loading ? 'Generando...' : 'Descargar PDF'}
                  </>
                );
              }}
            </SafePDFDownloadLink>
          </div>
          <button
            onClick={onComplete}
            className="neumorphic-button px-4 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-red-500 font-medium"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

function RecentInvoices({ invoices, loading, onView, onDownload, onDelete }) {
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
        <InvoiceHistoryItem
          key={invoice.uuid}
          invoice={invoice}
          onView={onView}
          onDownload={onDownload}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

// Modal de confirmación de eliminación
function DeleteConfirmModal({ invoice, isOpen, onClose, onConfirm, isDeleting }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isOpen || !invoice || !isClient) return null;

  const modalContent = (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="neumorphic-card p-6 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="neumorphic-card-inset w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
            <span className="material-icons-outlined text-3xl">warning</span>
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
            ¿Eliminar factura?
          </h3>
          <p className="text-slate-600 dark:text-slate-400">
            Estás a punto de eliminar la factura <strong>{invoice.invoiceNumber}</strong> de <strong>{invoice.clientName}</strong>.
          </p>
          <p className="text-sm text-red-500 mt-2">
            Esta acción no se puede deshacer.
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="neumorphic-button px-6 py-2 rounded-lg text-slate-600 dark:text-slate-400 font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="neumorphic-button px-6 py-2 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 disabled:opacity-50 flex items-center"
          >
            {isDeleting ? (
              <>
                <span className="material-icons-outlined mr-2 text-sm animate-spin">sync</span>
                Eliminando...
              </>
            ) : (
              <>
                <span className="material-icons-outlined mr-2 text-sm">delete</span>
                Eliminar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

export default function EmitirFacturaPage() {
  const [selectedType, setSelectedType] = useState(null);
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewInvoice, setPreviewInvoice] = useState(null);
  const [downloadInvoice, setDownloadInvoice] = useState(null);
  const [deleteInvoice, setDeleteInvoice] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [issuerData, setIssuerData] = useState(DEFAULT_ISSUER);

  useEffect(() => {
    fetchRecentInvoices();
    fetchIssuerData();
  }, []);

  const fetchIssuerData = async () => {
    try {
      const jwtToken = getCookie("factura-token");
      const response = await authGetFetch("users/issuer-fiscal-data", jwtToken);
      if (response.ok) {
        const data = await response.json();
        setIssuerData({
          name: data.issuerBusinessName || "",
          nif: data.issuerNif || "",
          address: data.issuerAddress || "",
          city: data.issuerCity || "",
          postalCode: data.issuerPostalCode || "",
          country: data.issuerCountry || "España",
        });
      }
    } catch (error) {
      console.error("Error fetching issuer fiscal data:", error);
    }
  };

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

  const handleViewInvoice = (invoice) => {
    setPreviewInvoice(invoice);
  };

  const handleDownloadInvoice = (invoice) => {
    setDownloadInvoice(invoice);
  };

  const handleClosePreview = () => {
    setPreviewInvoice(null);
  };

  const handleDownloadComplete = () => {
    setDownloadInvoice(null);
  };

  const handleDeleteInvoice = (invoice) => {
    setDeleteInvoice(invoice);
  };

  const handleCloseDelete = () => {
    setDeleteInvoice(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteInvoice) return;

    setIsDeleting(true);
    try {
      const jwtToken = getCookie("factura-token");
      const response = await authFetch(`invoices/${deleteInvoice.uuid}`, "DELETE", null, jwtToken);

      if (response.ok) {
        // Eliminar de la lista local
        setRecentInvoices((prev) => prev.filter((inv) => inv.uuid !== deleteInvoice.uuid));
        setDeleteInvoice(null);
      } else {
        console.error("Error deleting invoice:", response.status);
        alert("Error al eliminar la factura");
      }
    } catch (error) {
      console.error("Error deleting invoice:", error);
      alert("Error al eliminar la factura");
    } finally {
      setIsDeleting(false);
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
        onView={handleViewInvoice}
        onDownload={handleDownloadInvoice}
        onDelete={handleDeleteInvoice}
      />

      {/* Modal de vista previa */}
      <InvoicePreviewModal
        invoice={previewInvoice}
        isOpen={!!previewInvoice}
        onClose={handleClosePreview}
        issuerData={issuerData}
      />

      {/* Modal de confirmación de eliminación */}
      <DeleteConfirmModal
        invoice={deleteInvoice}
        isOpen={!!deleteInvoice}
        onClose={handleCloseDelete}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />

      {/* Componente oculto para descarga directa */}
      {downloadInvoice && (
        <DirectPDFDownload
          invoice={downloadInvoice}
          onComplete={handleDownloadComplete}
          issuerData={issuerData}
        />
      )}
    </div>
  );
}
