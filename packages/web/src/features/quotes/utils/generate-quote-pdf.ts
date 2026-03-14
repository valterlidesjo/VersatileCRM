import jsPDF from "jspdf";
import type { CompanyProfile, Customer, BillingFrequency } from "@crm/shared";
import type { QuoteLineData, QuoteTotals } from "./calculations";

const LABELS = {
  sv: {
    title: "Offert",
    quoteNumber: "Offertnummer",
    date: "Datum",
    validUntil: "Giltig till",
    customer: "Kund",
    orgNumber: "Org.nr",
    description: "Beskrivning",
    quantity: "Antal",
    unitPrice: "Á-pris",
    vat: "Moms",
    billing: "Betalning",
    total: "Belopp",
    subtotal: "Nettosumma",
    vatAmount: "Moms",
    totalInclVat: "Totalt inkl. moms",
    notes: "Anteckningar",
    fSkatt: "Godkänd för F-skatt",
    currency: "SEK",
    page: "Sida",
  },
  en: {
    title: "Quote",
    quoteNumber: "Quote Number",
    date: "Date",
    validUntil: "Valid Until",
    customer: "Customer",
    orgNumber: "Org. No.",
    description: "Description",
    quantity: "Qty",
    unitPrice: "Unit Price",
    vat: "VAT",
    billing: "Billing",
    total: "Amount",
    subtotal: "Subtotal",
    vatAmount: "VAT",
    totalInclVat: "Total incl. VAT",
    notes: "Notes",
    fSkatt: "Approved for F-tax",
    currency: "SEK",
    page: "Page",
  },
};

const BILLING_LABELS: Record<BillingFrequency, Record<"sv" | "en", string>> = {
  "one-time": { sv: "Engång", en: "One-time" },
  weekly: { sv: "Veckovis", en: "Weekly" },
  monthly: { sv: "Månadsvis", en: "Monthly" },
  "half-year": { sv: "Halvår", en: "Half-year" },
};

interface GenerateQuotePdfParams {
  profile: CompanyProfile;
  customer: Customer;
  quoteNumber: string;
  validUntil: string;
  items: QuoteLineData[];
  totals: QuoteTotals;
  notes: string;
  language: "sv" | "en";
  currency: string;
}

export function generateQuotePdf(params: GenerateQuotePdfParams) {
  const {
    profile,
    customer,
    quoteNumber,
    validUntil,
    items,
    totals,
    notes,
    language,
    currency,
  } = params;
  const l = LABELS[language];
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Colors
  const primary = [30, 41, 59] as const; // slate-800
  const muted = [100, 116, 139] as const; // slate-500
  const accent = [59, 130, 246] as const; // blue-500

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
  if (profile.fSkatt) senderLines.push(l.fSkatt);

  let senderY = margin;
  for (const line of senderLines) {
    doc.text(line, pageWidth - margin, senderY, { align: "right" });
    senderY += 4;
  }

  y = Math.max(y + 14, senderY) + 4;
  drawLine(y);
  y += 8;

  // === QUOTE META ===
  doc.setFontSize(9);
  doc.setTextColor(...muted);
  doc.setFont("helvetica", "bold");
  doc.text(l.quoteNumber, margin, y);
  doc.text(l.date, margin + 55, y);
  doc.text(l.validUntil, margin + 105, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...primary);
  doc.text(quoteNumber, margin, y);
  doc.text(new Date().toISOString().slice(0, 10), margin + 55, y);
  doc.text(validUntil, margin + 105, y);
  y += 10;

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
    qty: margin + contentWidth * 0.4,
    price: margin + contentWidth * 0.52,
    vat: margin + contentWidth * 0.66,
    billing: margin + contentWidth * 0.76,
    total: pageWidth - margin,
  };

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...muted);
  doc.text(l.description, colX.desc, y);
  doc.text(l.quantity, colX.qty, y, { align: "right" });
  doc.text(l.unitPrice, colX.price, y, { align: "right" });
  doc.text(l.vat, colX.vat, y, { align: "right" });
  doc.text(l.billing, colX.billing, y);
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
    doc.setFontSize(8);
    doc.text(BILLING_LABELS[item.billingFrequency][language], colX.billing, y);
    doc.setFontSize(9);
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

  // Page number
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...muted);
  doc.text(
    `${l.page} 1`,
    pageWidth - margin,
    fy + 4,
    { align: "right" }
  );

  // Download
  doc.save(`${quoteNumber || "quote"}.pdf`);
}
