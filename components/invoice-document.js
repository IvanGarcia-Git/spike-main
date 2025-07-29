import React from "react";
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    paddingTop: 35,
    paddingLeft: 40,
    paddingRight: 40,
    paddingBottom: 35,
    lineHeight: 1.4,
    color: "#333",
  },
  headerSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  logo: {
    width: 120,
  },
  invoiceMeta: {
    flexDirection: "column",
    alignItems: "flex-end",
    fontSize: 10,
  },
  metaItem: {
    marginBottom: 2,
  },
  metaLabel: {
    fontWeight: "bold",
  },
  issuerClientSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  infoBlock: {
    fontSize: 10,
    maxWidth: "48%",
  },
  infoTitle: {
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 3,
  },
  clientInfoBlock: {
    fontSize: 10,
    maxWidth: "48%",
    textAlign: "right",
  },
  clientName: {
    fontWeight: "bold",
  },
  italicText: {
    fontStyle: "italic",
    color: "#ef4444",
  },
  table: {
    display: "table",
    width: "auto",
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    marginBottom: 20,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    borderBottomWidth: 1,
    borderBottomColor: "#d1d5db",
  },
  tableColHeader: {
    padding: 6,
    fontSize: 10,
    fontWeight: "bold",
    color: "#4b5563",
    borderRightWidth: 0,
  },
  tableCol: {
    padding: 6,
    fontSize: 10,
    borderRightWidth: 0,
  },
  colConcepto: { width: "50%" },
  colCantidad: { width: "15%", textAlign: "right" },
  colPrecio: { width: "15%", textAlign: "right" },
  colTotalItem: { width: "20%", textAlign: "right" },
  totalsSection: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 20,
  },
  totalsBox: {
    width: "40%",
    fontSize: 10,
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 3,
    paddingBottom: 3,
    paddingLeft: 5,
    paddingRight: 5,
  },
  irpfRow: {
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
    marginBottom: 5,
  },
  grandTotalRow: {
    backgroundColor: "#f3f4f6",
    paddingTop: 5,
    paddingBottom: 5,
    fontWeight: "bold",
  },
  paymentInfoSection: {
    fontSize: 10,
    marginBottom: 5,
  },
  paymentLabel: {
    fontWeight: "bold",
  },
  notesSection: {
    marginTop: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    fontSize: 10,
  },
  notesTitle: {
    fontWeight: "bold",
    marginBottom: 4,
    color: "#4b5563",
  },
  boldText: {
    fontWeight: "bold",
  },
});

const InvoiceDocument = ({
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
}) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header: Logo and Invoice Meta */}
      <View style={styles.headerSection}>
        <Image
          style={styles.logo}
          src={customLogo || "/logo.jpeg"}
        />
        <View style={styles.invoiceMeta}>
          <View style={styles.metaItem}>
            <Text>
              <Text style={styles.metaLabel}>Nº Factura:</Text>{" "}
              {invoiceNumber || "---"}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Text>
              <Text style={styles.metaLabel}>Fecha Emisión:</Text> {invoiceDate}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Text>
              <Text style={styles.metaLabel}>Fecha Vencimiento:</Text>{" "}
              {invoiceDueDate}
            </Text>
          </View>
        </View>
      </View>

      {/* Issuer and Client Info */}
      <View style={styles.issuerClientSection}>
        <View style={styles.infoBlock}>
          <Text style={styles.infoTitle}>{issuer.name}</Text>
          <Text>{issuer.address}</Text>
          <Text>{`${issuer.city}, ${issuer.postalCode}, ${issuer.country}`}</Text>
          <Text>{issuer.nif}</Text>
        </View>
        <View style={styles.clientInfoBlock}>
          <Text style={styles.infoTitle}>Cliente:</Text>
          {client ? (
            <>
              <Text style={styles.clientName}>
                {client?.name + " "}
              </Text>
              <Text>{client?.address}</Text>
              <Text>{`${client?.province ? client?.province + ", " : ""}${
                client?.zipCode ? client?.zipCode + ", " : ""
              }${client?.populace || ""}`}</Text>
              <Text>{client?.nationalId}</Text>
              <Text>{client?.phoneNumber}</Text>
              <Text>{client?.email}</Text>
            </>
          ) : (
            <Text style={styles.italicText}>Seleccionar contacto</Text>
          )}
        </View>
      </View>

      {/* Items Table */}
      <View style={styles.table}>
        {/* Table Header */}
        <View style={styles.tableHeader} fixed>
          <View style={[styles.tableColHeader, styles.colConcepto]}>
            <Text>Concepto</Text>
          </View>
          <View style={[styles.tableColHeader, styles.colCantidad]}>
            <Text>Cantidad</Text>
          </View>
          <View style={[styles.tableColHeader, styles.colPrecio]}>
            <Text>Precio</Text>
          </View>
          <View style={[styles.tableColHeader, styles.colTotalItem]}>
            <Text>Total</Text>
          </View>
        </View>
        {/* Table Body */}
        {items.map((item) => (
          <View style={styles.tableRow} key={`pdf-${item.id}`} wrap={false}>
            <View style={[styles.tableCol, styles.colConcepto]}>
              <Text>{item.concepto || "-"}</Text>
            </View>
            <View style={[styles.tableCol, styles.colCantidad]}>
              <Text>{item.cantidad}</Text>
            </View>
            <View style={[styles.tableCol, styles.colPrecio]}>
              <Text>{parseFloat(item.precio).toFixed(2)}€</Text>
            </View>
            <View style={[styles.tableCol, styles.colTotalItem]}>
              <Text>{item.total.toFixed(2)}€</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Totals */}
      <View style={styles.totalsSection}>
        <View style={styles.totalsBox}>
          <View style={[styles.totalsRow]}>
            <Text>Subtotal:</Text>
            <Text>{subtotal.toFixed(2)} €</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text>IVA ({ivaPercentage}%):</Text>
            <Text>{totalIVA.toFixed(2)} €</Text>
          </View>
          <View style={[styles.totalsRow, styles.irpfRow]}>
            <Text>IRPF ({irpfPercentage}%):</Text>
            <Text>- {totalIRPF.toFixed(2)} €</Text>
          </View>
          <View style={[styles.totalsRow, styles.grandTotalRow]}>
            <Text>Total:</Text>
            <Text>{grandTotal.toFixed(2)} €</Text>
          </View>
        </View>
      </View>

      {/* Payment Info */}
      <View>
        <View style={styles.paymentInfoSection}>
          <Text>
            <Text style={styles.paymentLabel}>Método Pago:</Text>{" "}
            {paymentMethod
              ? paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1)
              : "---"}
          </Text>
        </View>
        <View style={styles.paymentInfoSection}>
          <Text>
            <Text style={styles.paymentLabel}>Nº Cuenta:</Text>{" "}
            {ibanNumber || "---"}
          </Text>
        </View>
      </View>

      {/* Notes */}
      {notes && (
        <View style={styles.notesSection}>
          <Text style={styles.notesTitle}>Notas:</Text>
          <Text>{notes}</Text>
        </View>
      )}
    </Page>
  </Document>
);

export default InvoiceDocument;
