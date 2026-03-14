import jsPDF from "jspdf";
import type { CompanyProfile, Customer } from "@crm/shared";
import type { InvoiceLineData, InvoiceTotals } from "./calculations";
import { formatVatNumber } from "./calculations";

const LABELS = {
  sv: {
    title: "Faktura",
    invoiceNumber: "Fakturanummer",
    invoiceRef: "Referens",
    date: "Fakturadatum",
    dueDate: "Förfallodag",
    overdueInterest: "Dröjsmålsränta",
    customer: "Kund",
    orgNumber: "Org.nr",
    momsNr: "Momsnr",
    description: "Beskrivning",
    quantity: "Antal",
    unitPrice: "Á-pris",
    vat: "Moms",
    total: "Belopp",
    subtotal: "Nettosumma",
    vatAmount: "Moms",
    totalInclVat: "Att betala",
    notes: "Anteckningar",
    fSkatt: "Godkänd för F-skatt",
    bankgiro: "Bankgiro",
    bank: "Bank",
    payment: "Betalningsuppgifter",
    page: "Sida",
  },
  en: {
    title: "Invoice",
    invoiceNumber: "Invoice Number",
    invoiceRef: "Reference",
    date: "Invoice Date",
    dueDate: "Due Date",
    overdueInterest: "Overdue Interest",
    customer: "Customer",
    orgNumber: "Org. No.",
    momsNr: "VAT No.",
    description: "Description",
    quantity: "Qty",
    unitPrice: "Unit Price",
    vat: "VAT",
    total: "Amount",
    subtotal: "Subtotal",
    vatAmount: "VAT",
    totalInclVat: "Total Due",
    notes: "Notes",
    fSkatt: "Approved for F-tax",
    bankgiro: "Bankgiro",
    bank: "Bank",
    payment: "Payment Details",
    page: "Page",
  },
};

interface GenerateInvoicePdfParams {
  profile: CompanyProfile;
  customer: Customer;
  invoiceNumber: string;
  invoiceRef: string;
  invoiceDate: string;
  dueDate: string;
  overdueInterestRate: number;
  items: InvoiceLineData[];
  totals: InvoiceTotals;
  notes: string;
  language: "sv" | "en";
  currency: string;
  isInternational: boolean;
}

export function generateInvoicePdf(params: GenerateInvoicePdfParams) {
  const {
    profile,
    customer,
    invoiceNumber,
    invoiceRef,
    invoiceDate,
    dueDate,
    overdueInterestRate,
    items,
    totals,
    notes,
    language,
    currency,
    isInternational,
  } = params;
  const l = LABELS[language];
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const primary = [30, 41, 59] as const;
  const muted = [100, 116, 139] as const;
  const accent = [59, 130, 246] as const;

  function drawLine(yPos: number) {
    doc.setDrawColor(...muted);
    doc.setLineWidth(0.3);
    doc.line(margin, yPos, pageWidth - margin, yPos);
  }

  // === HEADER ===
  doc.setFontSize(24);
  doc.setTextColor(...primary);
  doc.setFont("helvetica", "bold");
  doc.text(l.title, margin, y + 8);

  // Sender info (top right)
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...muted);
  const senderLines = [profile.legalName];
  if (profile.address) senderLines.push(profile.address);
  if (profile.phone) senderLines.push(profile.phone);
  if (profile.email) senderLines.push(profile.email);
  if (profile.website) senderLines.push(profile.website);
  senderLines.push(`${l.orgNumber}: ${profile.orgNumber}`);
  const vatNumber = formatVatNumber(profile.orgNumber, isInternational);
  senderLines.push(`${l.momsNr}: ${vatNumber}`);
  if (profile.fSkatt) senderLines.push(l.fSkatt);

  let senderY = margin;
  for (const line of senderLines) {
    doc.text(line, pageWidth - margin, senderY, { align: "right" });
    senderY += 4;
  }

  y = Math.max(y + 14, senderY) + 4;
  drawLine(y);
  y += 8;

  // === INVOICE META ===
  doc.setFontSize(9);
  doc.setTextColor(...muted);
  doc.setFont("helvetica", "bold");
  doc.text(l.invoiceNumber, margin, y);
  doc.text(l.invoiceRef, margin + 45, y);
  doc.text(l.date, margin + 80, y);
  doc.text(l.dueDate, margin + 115, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...primary);
  doc.text(invoiceNumber, margin, y);
  doc.text(invoiceRef, margin + 45, y);
  doc.text(invoiceDate, margin + 80, y);
  doc.text(dueDate, margin + 115, y);
  y += 6;

  // Overdue interest
  doc.setFontSize(8);
  doc.setTextColor(...muted);
  doc.text(`${l.overdueInterest}: ${overdueInterestRate}%`, margin, y);
  y += 8;

  // === CUSTOMER ===
  doc.setFontSize(9);
  doc.setTextColor(...muted);
  doc.setFont("helvetica", "bold");
  doc.text(l.customer, margin, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...primary);
  doc.text(customer.name, margin, y);
  y += 4;
  if (customer.location) {
    doc.setTextColor(...muted);
    doc.text(customer.location, margin, y);
    y += 4;
  }
  if (customer.orgNumber) {
    doc.setTextColor(...muted);
    doc.text(`${l.orgNumber}: ${customer.orgNumber}`, margin, y);
    y += 4;
  }
  if (customer.email) {
    doc.setTextColor(...muted);
    doc.text(customer.email, margin, y);
    y += 4;
  }
  y += 6;

  // === TABLE HEADER ===
  drawLine(y);
  y += 5;

  const colX = {
    desc: margin,
    qty: margin + contentWidth * 0.45,
    price: margin + contentWidth * 0.58,
    vat: margin + contentWidth * 0.73,
    total: pageWidth - margin,
  };

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...muted);
  doc.text(l.description, colX.desc, y);
  doc.text(l.quantity, colX.qty, y, { align: "right" });
  doc.text(l.unitPrice, colX.price, y, { align: "right" });
  doc.text(l.vat, colX.vat, y, { align: "right" });
  doc.text(l.total, colX.total, y, { align: "right" });
  y += 3;
  drawLine(y);
  y += 5;

  // === TABLE ROWS ===
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...primary);

  for (const item of items) {
    if (y > 260) {
      doc.addPage();
      y = margin;
    }

    const lineTotal = item.quantity * item.unitPrice;
    doc.text(item.description || "-", colX.desc, y);
    doc.text(item.quantity.toString(), colX.qty, y, { align: "right" });
    doc.text(
      item.unitPrice.toLocaleString("sv-SE", { minimumFractionDigits: 2 }),
      colX.price,
      y,
      { align: "right" }
    );
    doc.text(item.vatRate + "%", colX.vat, y, { align: "right" });
    doc.text(
      lineTotal.toLocaleString("sv-SE", { minimumFractionDigits: 2 }),
      colX.total,
      y,
      { align: "right" }
    );
    y += 6;
  }

  y += 2;
  drawLine(y);
  y += 8;

  // === TOTALS ===
  const totalsX = margin + contentWidth * 0.62;
  const totalsValX = pageWidth - margin;

  doc.setFontSize(9);
  doc.setTextColor(...muted);
  doc.text(l.subtotal, totalsX, y);
  doc.setTextColor(...primary);
  doc.text(
    `${totals.subtotal.toLocaleString("sv-SE", { minimumFractionDigits: 2 })} ${currency}`,
    totalsValX,
    y,
    { align: "right" }
  );
  y += 5;

  for (const entry of totals.vatBreakdown) {
    doc.setTextColor(...muted);
    doc.text(`${l.vatAmount} ${entry.rate}%`, totalsX, y);
    doc.setTextColor(...primary);
    doc.text(
      `${entry.amount.toLocaleString("sv-SE", { minimumFractionDigits: 2 })} ${currency}`,
      totalsValX,
      y,
      { align: "right" }
    );
    y += 5;
  }

  y += 1;
  doc.setDrawColor(...accent);
  doc.setLineWidth(0.5);
  doc.line(totalsX, y, pageWidth - margin, y);
  y += 5;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...primary);
  doc.text(l.totalInclVat, totalsX, y);
  doc.text(
    `${totals.total.toLocaleString("sv-SE", { minimumFractionDigits: 2 })} ${currency}`,
    totalsValX,
    y,
    { align: "right" }
  );
  y += 12;

  // === PAYMENT DETAILS ===
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...muted);
  doc.text(l.payment, margin, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...primary);
  doc.text(`${l.bankgiro}: ${profile.bankgiro}`, margin, y);
  y += 4;
  doc.text(`${l.bank}: ${profile.bank}`, margin, y);
  y += 8;

  // === NOTES ===
  if (notes) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...muted);
    doc.text(l.notes, margin, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...primary);
    const noteLines = doc.splitTextToSize(notes, contentWidth);
    doc.text(noteLines, margin, y);
    y += noteLines.length * 4 + 8;
  }

  // === FOOTER ===
  const footerY = Math.max(y + 10, 260);
  drawLine(footerY);
  const fy = footerY + 5;

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...muted);
  doc.text(
    `${l.page} 1`,
    pageWidth - margin,
    fy + 4,
    { align: "right" }
  );

  doc.save(`${invoiceNumber || "invoice"}.pdf`);
}
