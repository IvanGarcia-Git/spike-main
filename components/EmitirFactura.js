"use client";
import { useState, useEffect } from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import InvoiceDocument from "@/components/invoice-document";
import InvoicePreview from "@/components/invoice-preview";
import { authGetFetch, authFetch } from "@/helpers/server-fetch.helper";
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

export default function EmitirFactura({ invoiceType = "COBRO", onBack, onInvoiceSaved }) {
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
  const [isSaving, setIsSaving] = useState(false);
  const [invoiceSaved, setInvoiceSaved] = useState(false);

  const isCobro = invoiceType === "COBRO";

  // Obtener siguiente número de factura sugerido
  useEffect(() => {
    const fetchNextInvoiceNumber = async () => {
      try {
        const jwtToken = getCookie("factura-token");
        const response = await authGetFetch("invoices/next-number", jwtToken);
        if (response.ok) {
          const data = await response.json();
          setInvoiceNumber(data.nextInvoiceNumber);
        }
      } catch (error) {
        console.error("Error fetching next invoice number:", error);
      }
    };

    if (!uuid) {
      fetchNextInvoiceNumber();
    }
  }, [uuid]);

  // Función para guardar la factura en la base de datos
  const saveInvoice = async () => {
    if (invoiceSaved) return; // Evitar guardar múltiples veces

    setIsSaving(true);
    try {
      const jwtToken = getCookie("factura-token");

      // Preparar el concepto principal (primer item o combinación)
      const mainConcept = items.length > 0
        ? items.map(i => i.concepto).filter(Boolean).join(", ") || "Sin concepto"
        : "Sin concepto";

      const invoiceData = {
        invoiceNumber,
        type: invoiceType,
        clientName: clientDetails?.name
          ? `${clientDetails.name} ${clientDetails.surnames || ""}`.trim()
          : "Sin nombre",
        clientNationalId: clientDetails?.nationalId || overrideId || null,
        clientAddress: clientDetails?.address || overrideAddress || null,
        concept: mainConcept,
        invoiceDate,
        dueDate: invoiceDueDate || null,
        paymentMethod: paymentMethod || null,
        iban: ibanNumber || null,
        subtotal,
        ivaPercentage: parseFloat(ivaPercentage) || 0,
        ivaAmount: totalIVA,
        irpfPercentage: parseFloat(irpfPercentage) || 0,
        irpfAmount: totalIRPF,
        total: grandTotal,
        items: JSON.stringify(items),
        notes: notes || null,
        pdfFilename: pdfFilename || null,
        channelId: selectedChannel && !String(selectedChannel).startsWith("prefilled-")
          ? parseInt(selectedChannel)
          : null,
      };

      const response = await authFetch("POST", "invoices", invoiceData, jwtToken);

      if (response.ok) {
        setInvoiceSaved(true);
        toast.success("Factura guardada correctamente");
        if (onInvoiceSaved) {
          onInvoiceSaved();
        }
      } else {
        const error = await response.json();
        toast.error(error.message || "Error al guardar la factura");
      }
    } catch (error) {
      console.error("Error saving invoice:", error);
      toast.error("Error al guardar la factura");
    } finally {
      setIsSaving(false);
    }
  };

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
    <div className="p-6" suppressHydrationWarning>
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-start gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="neumorphic-button p-3 rounded-lg text-slate-600 dark:text-slate-300 hover:text-primary transition-colors"
              title="Volver"
            >
              <span className="material-icons-outlined">arrow_back</span>
            </button>
          )}
          <div>
            <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-100 flex items-center">
              <div className={`neumorphic-card-inset w-10 h-10 rounded-full flex items-center justify-center mr-3 ${isCobro ? "text-green-500" : "text-red-500"}`}>
                <span className="material-icons-outlined">
                  {isCobro ? "arrow_downward" : "arrow_upward"}
                </span>
              </div>
              Nueva Factura de {isCobro ? "Cobro" : "Pago"}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              {isCobro
                ? "Registra un ingreso o cobro a cliente"
                : "Registra un gasto o pago a proveedor"}
            </p>
          </div>
        </div>
      </div>

      <div className="neumorphic-card p-6 space-y-6">
          {/* Primera fila - Campos principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Contacto */}
            <div className="lg:col-span-1">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Contacto
                </label>
                {!customInputMode && (
                  <button
                    type="button"
                    onClick={() => {
                      setCustomInputMode(true);
                      setSelectedChannel("");
                    }}
                    className="p-2 rounded-lg neumorphic-button text-white bg-primary hover:bg-primary/90"
                  >
                    <span className="material-icons-outlined text-sm">add</span>
                  </button>
                )}
              </div>

              {customInputMode ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Nombre del cliente"
                    value={customChannelName}
                    onChange={(e) => {
                      setCustomChannelName(e.target.value);
                      setSelectedChannel(e.target.value);
                    }}
                    className="w-full px-4 py-3 neumorphic-card-inset bg-transparent text-slate-800 dark:text-slate-200 rounded-lg border-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setCustomInputMode(false);
                      setCustomChannelName("");
                      setSelectedChannel("");
                    }}
                    className="text-xs text-primary hover:underline"
                  >
                    Cancelar entrada personalizada
                  </button>
                </div>
              ) : (
                <select
                  name="contact"
                  id="contact"
                  value={selectedChannel}
                  onChange={(e) => setSelectedChannel(e.target.value)}
                  className="w-full px-4 py-3 neumorphic-card-inset bg-transparent text-slate-800 dark:text-slate-200 rounded-lg border-none focus:ring-2 focus:ring-primary focus:ring-opacity-50"
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
            </div>

            {/* Método de pago */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Método de pago
              </label>
              <select
                name="paymentMethod"
                id="paymentMethod"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-4 py-3 neumorphic-card-inset bg-transparent text-slate-800 dark:text-slate-200 rounded-lg border-none focus:ring-2 focus:ring-primary focus:ring-opacity-50"
              >
                <option disabled value="">
                  Seleccionar
                </option>
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia</option>
                <option value="tarjeta">Tarjeta</option>
              </select>
            </div>

            {/* Nº Factura */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Nº Factura
              </label>
              <input
                type="text"
                name="invoiceNumber"
                id="invoiceNumber"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="F00025"
                className="w-full px-4 py-3 neumorphic-card-inset bg-transparent text-slate-800 dark:text-slate-200 rounded-lg border-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 placeholder:text-slate-400"
              />
            </div>

            {/* Fecha emisión */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Fecha emisión
              </label>
              <input
                type="date"
                name="invoiceDate"
                id="invoiceDate"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full px-4 py-3 neumorphic-card-inset bg-transparent text-slate-800 dark:text-slate-200 rounded-lg border-none focus:ring-2 focus:ring-primary focus:ring-opacity-50"
              />
            </div>

            {/* Fecha vencimiento */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Fecha vencimiento
              </label>
              <input
                type="date"
                name="invoiceDueDate"
                id="invoiceDueDate"
                value={invoiceDueDate}
                onChange={(e) => setInvoiceDueDate(e.target.value)}
                className="w-full px-4 py-3 neumorphic-card-inset bg-transparent text-slate-800 dark:text-slate-200 rounded-lg border-none focus:ring-2 focus:ring-primary focus:ring-opacity-50"
              />
            </div>
          </div>

          {/* Tabla de items */}
          <div className="neumorphic-card-inset rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Concepto
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider w-24">
                      Cantidad
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider w-32">
                      Precio
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider w-32">
                      Total
                    </th>
                    <th className="px-4 py-3 w-12">
                      <span className="sr-only">Borrar</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-background-light dark:bg-background-dark divide-y divide-slate-200 dark:divide-slate-700">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          placeholder="Descripción del servicio o producto"
                          value={item.concepto}
                          onChange={(e) => handleItemChange(item.id, "concepto", e.target.value)}
                          className="w-full px-4 py-3 neumorphic-card-inset bg-transparent text-slate-800 dark:text-slate-200 rounded-lg border-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 placeholder:text-slate-400 text-sm"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={item.cantidad}
                          onChange={(e) => handleItemChange(item.id, "cantidad", e.target.value)}
                          className="w-full px-4 py-3 neumorphic-card-inset bg-transparent text-slate-800 dark:text-slate-200 rounded-lg border-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 text-sm"
                          min="1"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={item.precio}
                          onChange={(e) => handleItemChange(item.id, "precio", e.target.value)}
                          className="w-full px-4 py-3 neumorphic-card-inset bg-transparent text-slate-800 dark:text-slate-200 rounded-lg border-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 text-sm"
                          min="0"
                          step="0.01"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-slate-800 dark:text-slate-100">
                        {(
                          item.total +
                          (item.total * (parseFloat(ivaPercentage) || 0)) / 100 -
                          (item.total * (parseFloat(irpfPercentage) || 0)) / 100
                        ).toFixed(2)} €
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-2 rounded-lg neumorphic-button text-red-500 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={items.length <= 1}
                          aria-label="Borrar fila"
                        >
                          <span className="material-icons-outlined text-sm">delete</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Botón añadir fila */}
          <div className="flex justify-end">
            <button
              onClick={handleAddItem}
              className="px-5 py-3 rounded-lg neumorphic-button text-slate-700 dark:text-slate-300 font-medium flex items-center"
            >
              <span className="material-icons-outlined mr-2 text-sm">add</span>
              Añadir fila
            </button>
          </div>

          {/* IVA e IRPF */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                IVA (%)
              </label>
              <input
                type="number"
                id="ivaPercentage"
                name="ivaPercentage"
                value={ivaPercentage}
                onChange={(e) => setIvaPercentage(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-3 neumorphic-card-inset bg-transparent text-slate-800 dark:text-slate-200 rounded-lg border-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 placeholder:text-slate-400"
                min="0"
                step="1"
                placeholder="21"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                IRPF (%)
              </label>
              <input
                type="number"
                id="irpfPercentage"
                name="irpfPercentage"
                value={irpfPercentage}
                onChange={(e) => setIrpfPercentage(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-3 neumorphic-card-inset bg-transparent text-slate-800 dark:text-slate-200 rounded-lg border-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 placeholder:text-slate-400"
                min="0"
                step="1"
                placeholder="15"
              />
            </div>
          </div>

          {/* Dirección y CIF opcionales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Dirección (opcional)
              </label>
              <input
                type="text"
                value={overrideAddress}
                onChange={(e) => setOverrideAddress(e.target.value)}
                placeholder="Dirección completa"
                className="w-full px-4 py-3 neumorphic-card-inset bg-transparent text-slate-800 dark:text-slate-200 rounded-lg border-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                CIF/DNI (opcional)
              </label>
              <input
                type="text"
                value={overrideId}
                onChange={(e) => setOverrideId(e.target.value)}
                placeholder="CIF o DNI"
                className="w-full px-4 py-3 neumorphic-card-inset bg-transparent text-slate-800 dark:text-slate-200 rounded-lg border-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Totales */}
          <div className="neumorphic-card-inset p-6 rounded-lg">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <p className="text-lg font-bold text-slate-800 dark:text-slate-100">
                Total importe factura
              </p>
              <div className="flex flex-wrap gap-4 flex-1">
                <div className="flex-1 min-w-[120px]">
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Base</p>
                  <div className="neumorphic-card px-4 py-2 rounded-lg text-center">
                    <span className="text-lg font-bold text-slate-800 dark:text-slate-100">
                      {subtotal.toFixed(2)} €
                    </span>
                  </div>
                </div>

                <div className="flex-1 min-w-[120px]">
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">IVA</p>
                  <div className="neumorphic-card px-4 py-2 rounded-lg text-center">
                    <span className="text-lg font-bold text-green-600 dark:text-green-400">
                      +{totalIVA.toFixed(2)} €
                    </span>
                  </div>
                </div>

                <div className="flex-1 min-w-[120px]">
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Retenciones</p>
                  <div className="neumorphic-card px-4 py-2 rounded-lg text-center">
                    <span className="text-lg font-bold text-red-600 dark:text-red-400">
                      -{totalIRPF.toFixed(2)} €
                    </span>
                  </div>
                </div>

                <div className="flex-1 min-w-[120px]">
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Total</p>
                  <div className="neumorphic-card px-4 py-2 rounded-lg text-center bg-primary/10 dark:bg-primary/20">
                    <span className="text-lg font-bold text-primary">
                      {grandTotal.toFixed(2)} €
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Logo de factura */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Logo de factura (opcional)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="file"
                accept=".png,.jpg,.jpeg"
                onChange={handleLogoChange}
                className="flex-1 px-4 py-3 neumorphic-card-inset bg-transparent text-slate-800 dark:text-slate-200 rounded-lg border-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary file:text-white hover:file:bg-primary/90"
              />
              {customLogo && (
                <button
                  onClick={() => setCustomLogo(null)}
                  className="p-2 rounded-lg neumorphic-button text-red-500 hover:text-red-600"
                  title="Eliminar logo"
                >
                  <span className="material-icons-outlined text-sm">delete</span>
                </button>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Formatos aceptados: PNG, JPG
            </p>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Notas (opcional)
            </label>
            <textarea
              rows={4}
              name="notes"
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Añade notas adicionales para la factura..."
              className="w-full px-4 py-3 neumorphic-card-inset bg-transparent text-slate-800 dark:text-slate-200 rounded-lg border-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 placeholder:text-slate-400 resize-none"
            />
          </div>

          {/* IBAN */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              IBAN
            </label>
            <input
              type="text"
              name="ibanNumber"
              id="ibanNumber"
              value={ibanNumber}
              onChange={(e) => setIbanNumber(e.target.value)}
              placeholder="ESXX XXXX XXXX XXXX XXXX XXXX"
              className="w-full px-4 py-3 neumorphic-card-inset bg-transparent text-slate-800 dark:text-slate-200 rounded-lg border-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 placeholder:text-slate-400"
            />
          </div>

          {/* Vista previa de la factura */}
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

          {/* Guardar y Descargar PDF */}
          <div className="neumorphic-card-inset p-6 rounded-lg">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
              <div className="flex-1">
                <label htmlFor="pdfFilename" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Nombre archivo PDF
                </label>
                <input
                  type="text"
                  id="pdfFilename"
                  name="pdfFilename"
                  value={pdfFilename}
                  onChange={(e) => setPdfFilename(e.target.value)}
                  placeholder="Factura_F0025_ClienteX.pdf"
                  className="w-full px-4 py-3 neumorphic-card-inset bg-transparent text-slate-800 dark:text-slate-200 rounded-lg border-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 placeholder:text-slate-400"
                />
              </div>

              <div className="flex gap-3">
                {/* Botón Guardar Factura */}
                <button
                  onClick={saveInvoice}
                  disabled={!canDownload || isSaving || invoiceSaved}
                  className={`px-5 py-3 rounded-lg neumorphic-button font-medium inline-flex items-center ${
                    canDownload && !invoiceSaved
                      ? isCobro
                        ? "text-white bg-green-600 hover:bg-green-700"
                        : "text-white bg-red-600 hover:bg-red-700"
                      : "bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed"
                  }`}
                >
                  <span className="material-icons-outlined mr-2">
                    {isSaving ? "refresh" : invoiceSaved ? "check" : "save"}
                  </span>
                  {isSaving ? "Guardando..." : invoiceSaved ? "Guardada" : "Guardar"}
                </button>

                {/* Botón Descargar PDF */}
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
                    className={`px-5 py-3 rounded-lg neumorphic-button font-medium inline-flex items-center ${
                      canDownload
                        ? "text-white bg-primary hover:bg-primary/90"
                        : "bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed"
                    }`}
                    style={!canDownload ? { pointerEvents: "none" } : {}}
                    aria-disabled={!canDownload}
                    onClick={() => {
                      // Guardar automáticamente al descargar si no está guardada
                      if (!invoiceSaved && canDownload) {
                        saveInvoice();
                      }
                    }}
                  >
                    {({ loading }) => (
                      <>
                        <span className="material-icons-outlined mr-2">
                          {loading ? "refresh" : "download"}
                        </span>
                        {loading ? "Generando PDF..." : "Descargar PDF"}
                      </>
                    )}
                  </PDFDownloadLink>
                )}
                {!isClient && (
                  <div className="px-5 py-3 rounded-lg neumorphic-button bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed inline-flex items-center">
                    <span className="material-icons-outlined mr-2">download</span>
                    Descargar PDF
                  </div>
                )}
              </div>
            </div>
            {!canDownload && isClient && (
              <p className="text-xs text-red-500 mt-2 flex items-center">
                <span className="material-icons-outlined text-sm mr-1">error</span>
                Requiere Contacto, Nº Factura y Nombre de archivo
              </p>
            )}
            {invoiceSaved && (
              <p className="text-xs text-green-500 mt-2 flex items-center">
                <span className="material-icons-outlined text-sm mr-1">check_circle</span>
                Factura guardada en el historial
              </p>
            )}
          </div>
      </div>
    </div>
  );
}
