"use client";
import { useState, useEffect } from "react";
import { FiTrash } from "react-icons/fi";
import { PDFDownloadLink } from "@react-pdf/renderer";
import InvoiceDocument from "@/components/invoice-document";
import InvoicePreview from "@/components/invoice-preview";
import { authGetFetch } from "@/helpers/server-fetch.helper";
import { getCookie } from "cookies-next";
import { useSearchParams } from "next/navigation";
import { toast } from "react-toastify";

const getEffectiveCommission = (liquidationContract) => {
  if (
    liquidationContract.overrideCommission !== null &&
    liquidationContract.overrideCommission !== undefined
  ) {
    return parseFloat(liquidationContract.overrideCommission);
  }
  if (
    liquidationContract.assignedCommissionAmount !== null &&
    liquidationContract.assignedCommissionAmount !== undefined
  ) {
    return parseFloat(liquidationContract.assignedCommissionAmount);
  }
  return 0;
};

const INVOICE_ISSUER = {
  name: "Arrakis Gestión Empresarial S.L",
  nif: "B75439786",
  address: "Cl Astronomía 1, 1, 1, 6",
  city: "Sevilla",
  postalCode: "41015",
  country: "España",
};

export default function EmitirFactura() {
  const searchParams = useSearchParams();
  const uuid = searchParams.get("liquidationUuid");
  const [channels, setChannels] = useState([]);
  const [prefilledClient, setPrefilledClient] = useState(null);
  const [items, setItems] = useState([]);
  const [ivaPercentage, setIvaPercentage] = useState(0);
  const [irpfPercentage, setIrpfPercentage] = useState(0);
  const [selectedChannel, setSelectedChannel] = useState("");
  const [customInputMode, setCustomInputMode] = useState(false);
  const [customChannelName, setCustomChannelName] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [ibanNumber, setIbanNumber] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("transferencia");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [invoiceDueDate, setInvoiceDueDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [pdfFilename, setPdfFilename] = useState("");
  const [isClient, setIsClient] = useState(false);
  const [contactOptions, setContactOptions] = useState([]);
  const [customLogo, setCustomLogo] = useState(null);
  const [overrideAddress, setOverrideAddress] = useState("");
  const [overrideId, setOverrideId] = useState("");
  const [overridePhone, setOverridePhone] = useState("");

  const handleLogoChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.match("image/(jpeg|jpg|png)")) {
        toast.error("Solo se permiten archivos PNG y JPG");
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        setCustomLogo(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    const fetchLiquidacion = async () => {
      if (!uuid) return;
      try {
        const jwtToken = getCookie("factura-token");
        const response = await authGetFetch(`liquidations/${uuid}`, jwtToken);

        if (!response.ok) {
          const errData = await response
            .json()
            .catch(() => ({ message: "Error fetching liquidacion" }));
          throw new Error(errData.message || "Error fetching liquidacion");
        }

        const data = await response.json();

        if (data.user?.iban) {
          setIbanNumber(data.user.iban);
        }

        if (data.user) {
          const newClient = {
            name: data.user.name || "",
            surnames: [data.user.firstSurname, data.user.secondSurname].filter(Boolean).join(" "),
            nationalId: data.user.nationalId || null,
            phoneNumber: data.user.phone || null,
            email: data.user.email || null,
            address: null,
            province: null,
            zipCode: null,
            populace: null,
          };
          setPrefilledClient(newClient);
          setSelectedChannel("");
        }

        if (data.liquidationContracts && data.liquidationContracts.length > 0) {
          const totalCommission = data.liquidationContracts
            .filter((lc) => getEffectiveCommission(lc) > 0)
            .reduce((sum, lc) => sum + getEffectiveCommission(lc), 0);
          setItems([
            {
              id: data.uuid,
              concepto: data.name,
              cantidad: 1,
              precio: totalCommission,
              total: totalCommission,
            },
          ]);
        }
      } catch (err) {
        console.error("Fetch liquidation error:", err);
        toast.error(err.message || "No se pudo cargar la liquidación.");
      }
    };

    fetchLiquidacion();
  }, [uuid]);

  useEffect(() => {
    const fetchContacts = async () => {
      const jwtToken = getCookie("factura-token");
      const response = await authGetFetch("channels/", jwtToken);
      const allChannels = await response.json();
      setChannels(allChannels);
    };

    fetchContacts();
    if (!uuid) {
      handleAddItem();
    }
    const defaultFilename = `Factura_${invoiceNumber || "FXXXX"}_${invoiceDate}.pdf`;
    setPdfFilename(defaultFilename);
    setIsClient(true);
  }, [uuid]);

  useEffect(() => {
    const filename = `Factura_${invoiceNumber || "FXXXX"}_${invoiceDate}.pdf`;
    setPdfFilename(filename);
  }, [invoiceNumber, invoiceDate]);

  useEffect(() => {
    let merged = Array.isArray(channels) ? [...channels] : [];

    if (prefilledClient) {
      const idPrefilled = "prefilled-" + (uuid ?? crypto.randomUUID());
      const fullName = `${prefilledClient.name} ${prefilledClient.surnames}`.trim();

      if (!merged.some((c) => c.id === idPrefilled)) {
        merged.unshift({ id: idPrefilled, name: fullName });
      }

      if (!selectedChannel) setSelectedChannel(idPrefilled);
    }

    setContactOptions(merged);
  }, [channels, prefilledClient, uuid]);

  useEffect(() => {
    if (!selectedChannel || customInputMode) {
      return;
    }

    if (String(selectedChannel).startsWith("prefilled-")) {
      setOverrideAddress("");
      setOverrideId("");
      return;
    }

    const chosenChannel = channels.find((c) => String(c.id) === String(selectedChannel));

    if (chosenChannel) {
      setOverrideAddress(chosenChannel.address || "");
      setOverrideId(chosenChannel.cif || "");

      if (chosenChannel.iban) {
        setIbanNumber(chosenChannel.iban);
      }
    }
  }, [selectedChannel, channels, customInputMode]);

  const calculateItemTotal = (precio, cantidad) => {
    return (parseFloat(precio) || 0) * (parseInt(cantidad) || 0);
  };

  function handleItemChange(id, field, value) {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          if (field === "precio" || field === "cantidad") {
            updatedItem.total = calculateItemTotal(updatedItem.precio, updatedItem.cantidad);
          }
          return updatedItem;
        }
        return item;
      })
    );
  }

  function handleDeleteItem(id) {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id));
    } else {
      setItems([
        {
          id: crypto.randomUUID(),
          concepto: "",
          precio: 0,
          cantidad: 1,
          total: 0,
        },
      ]);
    }
  }

  function handleAddItem() {
    setItems([
      ...items,
      {
        id: crypto.randomUUID(),
        concepto: "",
        precio: 0,
        cantidad: 1,
        total: 0,
      },
    ]);
  }

  function calculateSubtotal() {
    return items.reduce((sum, item) => sum + item.total, 0);
  }

  function calculateTotalIVA(subtotal) {
    const ivaRate = parseFloat(ivaPercentage) || 0;
    return subtotal * (ivaRate / 100);
  }

  function calculateTotalIRPF(subtotal) {
    const irpfRate = parseFloat(irpfPercentage) || 0;
    return subtotal * (irpfRate / 100);
  }

  function calculateGrandTotal() {
    const subtotal = calculateSubtotal();
    const totalIVA = calculateTotalIVA(subtotal);
    const totalIRPF = calculateTotalIRPF(subtotal);
    return subtotal + totalIVA - totalIRPF;
  }

  const getContactById = (id) => contactOptions.find((c) => String(c.id) === String(id)) ?? null;

  const subtotal = calculateSubtotal();
  const totalIVA = calculateTotalIVA(subtotal);
  const totalIRPF = calculateTotalIRPF(subtotal);
  const grandTotal = calculateGrandTotal();

  const clientDetails = (() => {
    if (customChannelName.trim()) {
      return {
        name: customChannelName.trim(),
        address: overrideAddress || null,
        nationalId: overrideId || null,
        phoneNumber: overridePhone || null,
      };
    }

    if (selectedChannel) {
      const chosen = getContactById(selectedChannel);

      if (chosen && String(chosen.id).startsWith("prefilled-")) {
        return {
          ...prefilledClient,
          address: overrideAddress || prefilledClient?.address,
          nationalId: overrideId || prefilledClient?.nationalId,
          phoneNumber: overridePhone || prefilledClient?.phoneNumber,
        };
      }
      return {
        name: chosen?.name,
        address: overrideAddress || chosen?.address,
        nationalId: overrideId || chosen?.cif || chosen?.nationalId,
        // phoneNumber: overridePhone || chosen?.representativePhone || chosen?.phoneNumber,
        // email: chosen?.representativeEmail || "",
      };
    }

    return prefilledClient
      ? {
          ...prefilledClient,
          address: overrideAddress || prefilledClient?.address,
          nationalId: overrideId || prefilledClient?.nationalId,
          phoneNumber: overridePhone || prefilledClient?.phoneNumber,
        }
      : null;
  })();

  const canDownload = clientDetails && pdfFilename.trim() !== "" && invoiceNumber.trim() !== "";
  return (
    <div
      className="flex justify-center items-start bg-background min-h-screen p-5 text-black"
      suppressHydrationWarning
    >
      <div className="w-full max-w-screen-xl bg-foreground rounded-lg p-5">
        <div className="flex gap-5 flex-wrap md:flex-nowrap">
          <div className="w-[calc(50%_-_10px)] md:flex-1">
            <div className="flex items-start justify-between mb-1">
              <p className="text-base font-bold">Contacto</p>
              {!customInputMode && (
                <button
                  type="button"
                  onClick={() => {
                    setCustomInputMode(true);
                    setSelectedChannel("");
                  }}
                  className="w-8 h-4 text-lg leading-none text-black rounded-md bg-primary hover:bg-primary/90 flex items-center justify-center"
                >
                  +
                </button>
              )}
            </div>

            {customInputMode ? (
              <input
                type="text"
                placeholder="Escribe un nombre de canal"
                value={customChannelName}
                onChange={(e) => {
                  setCustomChannelName(e.target.value);
                  setSelectedChannel(e.target.value);
                }}
                className="w-full p-2 rounded-md bg-backgroundHoverBold"
              />
            ) : (
              <select
                name="contact"
                id="contact"
                value={selectedChannel}
                onChange={(e) => setSelectedChannel(e.target.value)}
                className="w-full p-2 rounded-md bg-backgroundHoverBold"
              >
                <option disabled value="">
                  Seleccionar
                </option>
                {contactOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}

            {customInputMode && (
              <button
                type="button"
                onClick={() => {
                  setCustomInputMode(false);
                  setCustomChannelName("");
                  setSelectedChannel("");
                }}
                className="mt-2 text-sm text-blue-600 hover:underline"
              >
                Cancelar entrada personalizada
              </button>
            )}
          </div>

          <div className="w-[calc(50%_-_10px)] md:flex-1">
            <p className="text-base font-bold mb-1">Método de pago</p>
            <select
              name="paymentMethod"
              id="paymentMethod"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full p-2 rounded-md cursor-pointer bg-backgroundHoverBold"
            >
              <option disabled value="">
                Seleccionar
              </option>
              <option value="efectivo">Efectivo</option>
              <option value="transferencia">Transferencia</option>
              <option value="tarjeta">Tarjeta</option>
            </select>
          </div>

          <div className="w-[calc(50%_-_10px)] md:flex-1">
            <p className="text-base font-bold mb-1">Nº Factura</p>
            <input
              type="text"
              name="invoiceNumber"
              id="invoiceNumber"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              placeholder="F00025"
              className="w-full p-2 rounded-md cursor-text bg-backgroundHoverBold"
            />
          </div>

          <div className="w-[calc(50%_-_10px)] md:flex-1">
            <p className="text-base font-bold mb-1">Fecha emisión</p>
            <input
              type="date"
              name="invoiceDate"
              id="invoiceDate"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              className="w-full p-2 rounded-md cursor-pointer bg-backgroundHoverBold"
            />
          </div>

          <div className="w-[calc(50%_-_10px)] md:flex-1">
            <p className="text-base font-bold mb-1">Fecha vencimiento</p>
            <input
              type="date"
              name="invoiceDueDate"
              id="invoiceDueDate"
              value={invoiceDueDate}
              onChange={(e) => setInvoiceDueDate(e.target.value)}
              className="w-full p-2 rounded-md cursor-pointer bg-backgroundHoverBold"
            />
          </div>
        </div>

        <div className="overflow-x-auto mt-4">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-background">
              <tr>
                <th
                  scope="col"
                  className="px-3 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Concepto
                </th>
                <th
                  scope="col"
                  className="px-3 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24"
                >
                  Cantidad
                </th>
                <th
                  scope="col"
                  className="px-3 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28"
                >
                  Precio
                </th>
                <th
                  scope="col"
                  className="px-3 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28"
                >
                  Total
                </th>
                <th scope="col" className="relative px-3 py-4 w-10">
                  <span className="sr-only">Borrar</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {/* divide-y divide-gray-200 */}
              {items.map((item, index) => (
                <tr key={item.id}>
                  <td className="px-3 py-2 pl-0 whitespace-nowrap">
                    <input
                      type="text"
                      placeholder="Descripción del servicio o producto"
                      value={item.concepto}
                      onChange={(e) => handleItemChange(item.id, "concepto", e.target.value)}
                      className="w-full p-2 border rounded-md text-base"
                    />
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <input
                      type="number"
                      value={item.cantidad}
                      onChange={(e) => handleItemChange(item.id, "cantidad", e.target.value)}
                      className="w-full p-2 border rounded-md text-base"
                      min="1"
                    />
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <input
                      type="number"
                      value={item.precio}
                      onChange={(e) => handleItemChange(item.id, "precio", e.target.value)}
                      className="w-full p-2 border rounded-md text-base"
                      min="0"
                      step="0.01"
                    />
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-base text-gray-900">
                    {(
                      item.total +
                      (item.total * (parseFloat(ivaPercentage) || 0)) / 100 -
                      (item.total * (parseFloat(irpfPercentage) || 0)) / 100
                    ).toFixed(2)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-right text-base font-medium">
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="text-red-600 hover:text-red-800 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center"
                      disabled={items.length <= 1}
                      aria-label="Borrar fila"
                    >
                      <FiTrash size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 text-end">
          <button onClick={handleAddItem} className="bg-background py-2 px-4 rounded-md text-sm">
            + <span className="ml-1">Añadir fila</span>
          </button>
        </div>

        <div className="flex gap-5 flex-wrap md:flex-nowrap mt-2">
          <div className="w-[calc(50%_-_10px)] md:flex-1">
            <p className="text-base font-bold mb-1">IVA (%)</p>
            <input
              type="number"
              id="ivaPercentage"
              name="ivaPercentage"
              value={ivaPercentage}
              onChange={(e) => setIvaPercentage(parseFloat(e.target.value) || 0)}
              className="w-full p-2 rounded-md cursor-text bg-backgroundHoverBold"
              min="0"
              step="1"
              placeholder="21%"
            />
          </div>

          <div className="w-[calc(50%_-_10px)] md:flex-1">
            <p className="text-base font-bold mb-1">IRPF (%)</p>
            <input
              type="number"
              id="irpfPercentage"
              name="irpfPercentage"
              value={irpfPercentage}
              onChange={(e) => setIrpfPercentage(parseFloat(e.target.value) || 0)}
              className="w-full p-2 rounded-md cursor-text bg-backgroundHoverBold"
              min="0"
              step="1"
              placeholder="Ej: 15"
            />
          </div>
        </div>

        <div className="flex gap-5 flex-wrap md:flex-nowrap mt-4">
          <div className="w-[calc(33.33%_-_10px)] md:flex-1">
            <p className="text-base font-bold mb-1">Dirección (opcional)</p>
            <input
              type="text"
              value={overrideAddress}
              onChange={(e) => setOverrideAddress(e.target.value)}
              placeholder="Dirección completa"
              className="w-full p-2 rounded-md cursor-text bg-backgroundHoverBold"
            />
          </div>

          <div className="w-[calc(33.33%_-_10px)] md:flex-1">
            <p className="text-base font-bold mb-1">CIF/DNI (opcional)</p>
            <input
              type="text"
              value={overrideId}
              onChange={(e) => setOverrideId(e.target.value)}
              placeholder="CIF o DNI"
              className="w-full p-2 rounded-md cursor-text bg-backgroundHoverBold"
            />
          </div>
        </div>

        <div className="mt-8 flex md:flex-nowrap flex-wrap gap-4 items-center">
          <p className="self-end font-bold">Total importe factura</p>
          <div className="flex md:gap-8 gap-4 items-center md:flex-nowrap flex-wrap">
            <div className="text-center">
              <p>Base</p>
              <div className="py-1 px-4 rounded-3xl bg-background">{subtotal.toFixed(2)} €</div>
            </div>

            <div className="text-center">
              <p>IVA</p>
              <div className="py-1 px-4 rounded-3xl bg-background">{totalIVA.toFixed(2)} €</div>
            </div>

            <div className="text-center">
              <p>Retenciones</p>
              <div className="py-1 px-4 rounded-3xl bg-background">{totalIRPF.toFixed(2)} €</div>
            </div>

            <div className="text-center">
              <p>Total</p>
              <div className="py-1 px-4 rounded-3xl bg-background">{grandTotal.toFixed(2)} €</div>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <p className="text-base font-bold mb-1">Logo de factura (opcional)</p>
          <div className="flex items-center gap-4">
            <input
              type="file"
              accept=".png,.jpg,.jpeg"
              onChange={handleLogoChange}
              className="w-full p-2 rounded-md cursor-pointer bg-backgroundHoverBold"
            />
            {customLogo && (
              <button
                onClick={() => setCustomLogo(null)}
                className="text-red-600 hover:text-red-800"
                title="Eliminar logo"
              >
                <FiTrash size={20} />
              </button>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">Formatos aceptados: PNG, JPG</p>
        </div>

        <div className="mt-8">
          <p className="text-base font-bold mb-1">Notas (opcional)</p>
          <textarea
            rows={5}
            name="notes"
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full p-2 rounded-md cursor-text bg-backgroundHoverBold"
          />
        </div>

        <div className="w-[calc(50%_-_10px)] md:flex-1 mb-4">
          <p className="text-base font-bold mb-1">IBAN</p>
          <input
            type="text"
            name="ibanNumber"
            id="ibanNumber"
            value={ibanNumber}
            onChange={(e) => setIbanNumber(e.target.value)}
            placeholder="ESXX XXXX XXXX XXXX XXXX XXXX"
            className="w-full p-2 rounded-md cursor-text bg-backgroundHoverBold"
          />
        </div>

        <InvoicePreview
          issuer={INVOICE_ISSUER}
          client={clientDetails}
          invoiceNumber={invoiceNumber}
          ibanNumber={ibanNumber}
          invoiceDate={invoiceDate}
          invoiceDueDate={invoiceDueDate}
          paymentMethod={paymentMethod}
          items={items}
          ivaPercentage={ivaPercentage}
          irpfPercentage={irpfPercentage}
          subtotal={subtotal}
          totalIVA={totalIVA}
          totalIRPF={totalIRPF}
          grandTotal={grandTotal}
          notes={notes}
          customLogo={customLogo}
        />

        <div className="mt-8 p-4 border border-dashed border-gray-400 rounded-lg bg-gray-50 flex flex-col md:flex-row gap-4 max-w-3xl mx-auto">
          <div className="flex-grow">
            <label htmlFor="pdfFilename" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre archivo PDF
            </label>
            <input
              type="text"
              id="pdfFilename"
              name="pdfFilename"
              value={pdfFilename}
              onChange={(e) => setPdfFilename(e.target.value)}
              placeholder="Ej: Factura_F0025_ClienteX.pdf"
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
            />
          </div>

          {isClient && (
            <PDFDownloadLink
              document={
                <InvoiceDocument
                  issuer={INVOICE_ISSUER}
                  client={clientDetails}
                  invoiceNumber={invoiceNumber}
                  ibanNumber={ibanNumber}
                  invoiceDate={invoiceDate}
                  invoiceDueDate={invoiceDueDate}
                  paymentMethod={paymentMethod}
                  items={items}
                  ivaPercentage={ivaPercentage}
                  irpfPercentage={irpfPercentage}
                  subtotal={subtotal}
                  totalIVA={totalIVA}
                  totalIRPF={totalIRPF}
                  grandTotal={grandTotal}
                  notes={notes}
                  customLogo={customLogo}
                />
              }
              fileName={pdfFilename.endsWith(".pdf") ? pdfFilename : `${pdfFilename}.pdf`}
              className={`mt-2 md:mt-0 md:self-end px-5 py-2 rounded-md text-white font-semibold text-sm ${
                canDownload
                  ? "bg-blue-600 hover:bg-blue-700 cursor-pointer"
                  : "bg-gray-400 cursor-not-allowed"
              }`}
              style={!canDownload ? { pointerEvents: "none" } : {}}
              aria-disabled={!canDownload}
            >
              {({ loading }) => (loading ? "Generando PDF..." : "Descargar PDF")}
            </PDFDownloadLink>
          )}
          {!isClient && (
            <div className="mt-2 md:mt-0 md:self-end px-5 py-2 rounded-md text-white font-semibold text-sm bg-gray-400 cursor-not-allowed">
              Descargar PDF
            </div>
          )}
        </div>
        {!canDownload && isClient && (
          <p className="text-xs text-red-600 mt-1 w-full md:w-auto text-center md:text-left max-w-3xl mx-auto">
            (Requiere Contacto, Nº Factura y Nombre de archivo)
          </p>
        )}
      </div>
    </div>
  );
}
