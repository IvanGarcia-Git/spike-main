import React from "react";

const InvoicePreview = ({
  issuer,
  client,
  invoiceNumber,
  ibanNumber,
  invoiceDate,
  invoiceDueDate,
  paymentMethod,
  items,
  ivaPercentage,
  irpfPercentage,
  subtotal,
  totalIVA,
  totalIRPF,
  grandTotal,
  notes,
  customLogo,
}) => {
  return (
    <div className="mt-8 p-6 border border-gray-300 rounded-lg bg-white shadow-md max-w-3xl mx-auto">
      <h2 className="text-xl font-bold mb-6 text-center text-gray-700">Vista Previa Factura</h2>

      {/* Header */}
      <div className="flex justify-between mb-6">
        {/* Invoice Meta */}
        <div className="flex flex-col gap-1 text-sm">
          <div>
            <span className="font-semibold">Nº Factura:</span> {invoiceNumber || "---"}
          </div>
          <div>
            <span className="font-semibold">Fecha Emisión:</span> {invoiceDate}
          </div>
          <div>
            <span className="font-semibold">Fecha Vencimiento:</span> {invoiceDueDate}
          </div>
        </div>

        <img src={customLogo || "/logo.jpeg"} alt="logo" className="w-40 object-contain" />
      </div>

      {/* Issuer Info */}
      <div className="flex justify-between mb-6 pb-4 border-b border-gray-200">
        <div className="text-sm">
          <p className="font-bold text-base">{issuer.name}</p>
          <p>{issuer.address}</p>
          <p>{`${issuer.city}, ${issuer.postalCode}, ${issuer.country}`}</p>
          <p>{issuer.nif}</p>
        </div>
        <div className="text-sm text-right">
          <p className="font-bold text-base">Cliente:</p>
          {client ? (
            <>
              <p className="font-bold">{`${client?.name || ""} ${client?.surnames || ""}`}</p>
              <p>{client?.address}</p>
              <p>{`${client?.province ? client?.province + ", " : ""}${
                client?.zipCode ? client?.zipCode + ", " : ""
              }${client?.populace || ""}`}</p>
              <p>{client?.nationalId}</p>
              <p>{client?.phoneNumber}</p>
              <p>{client?.email}</p>
            </>
          ) : (
            <p className="text-red-500 italic">Seleccionar contacto</p>
          )}
        </div>
      </div>

      {/* Items Table */}
      <div className="overflow-x-auto mb-6">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-gray-600">Concepto</th>
              <th className="px-4 py-2 text-right font-semibold text-gray-600 w-20">Cantidad</th>
              <th className="px-4 py-2 text-right font-semibold text-gray-600 w-24">Precio</th>
              <th className="px-4 py-2 text-right font-semibold text-gray-600 w-28">Total</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map((item) => (
              <tr key={`preview-${item.id}`}>
                <td className="px-4 py-2 whitespace-normal break-words">{item.concepto || "-"}</td>
                <td className="px-4 py-2 text-right">{item.cantidad}</td>
                <td className="px-4 py-2 text-right">{parseFloat(item.precio).toFixed(2)}€</td>
                <td className="px-4 py-2 text-right">{item.total.toFixed(2)}€</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="flex justify-end mb-6">
        <div className="w-full md:w-1/2 lg:w-1/3 text-sm">
          <div className="flex justify-between py-1 px-2">
            <span>Subtotal:</span>
            <span>{subtotal.toFixed(2)} €</span>
          </div>
          <div className="flex justify-between py-1 px-2">
            <span>IVA ({ivaPercentage}%):</span>
            <span>{totalIVA.toFixed(2)} €</span>
          </div>
          <div className="flex justify-between py-1 px-2 border-b border-black">
            <span>IRPF ({irpfPercentage}%):</span>
            <span>- {totalIRPF.toFixed(2)} €</span>
          </div>
          <div className="flex justify-between py-2 px-2 mt-2 bg-gray-100 rounded font-bold">
            <span>Total:</span>
            <span>{grandTotal.toFixed(2)} €</span>
          </div>
        </div>
      </div>

      {/* Payment Info */}
      <div>
        <span className="font-semibold">Método Pago:</span>{" "}
        <span className="capitalize">{paymentMethod || "---"}</span>
      </div>
      <div>
        <span className="font-semibold">Nº Cuenta:</span>{" "}
        <span className="capitalize">{ibanNumber || "---"}</span>
      </div>

      {/* Notes */}
      {notes && (
        <div className="mt-6 pt-4 border-t border-gray-200 text-sm">
          <h3 className="font-semibold mb-2 text-gray-700">Notas:</h3>
          <p className="whitespace-pre-wrap">{notes}</p>
        </div>
      )}
    </div>
  );
};

export default InvoicePreview;
