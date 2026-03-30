import jsPDF from "jspdf";
import type { CompanyProfile, Customer, BillingFrequency } from "@crm/shared";
import type { QuoteLineData, QuoteTotals } from "./calculations";

const LABELS = {
  sv: {
    title: "Offert",
    quoteNumber: "Offertnummer",
    date: "Datum",
    validUntil: "Giltig till",
    customer: "Offertmottagare",
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
    customer: "Quote For",
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
  logoDataUrl?: string;
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
    logoDataUrl,
  } = params;
  const l = LABELS[language];
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;

  // Brand colors
  const brandR = 21, brandG = 95, brandB = 115;
  const white = [255, 255, 255] as const;
  const primary = [30, 41, 59] as const;
  const muted = [107, 120, 138] as const;
  const lightBg = [247, 250, 252] as const;
  const borderColor = [220, 229, 238] as const;

  function hline(yPos: number, x1 = margin, x2 = pageWidth - margin, color = borderColor, lw = 0.25) {
    doc.setDrawColor(...color);
    doc.setLineWidth(lw);
    doc.line(x1, yPos, x2, yPos);
  }

  function fmt(n: number) {
    return n.toLocaleString("sv-SE", { minimumFractionDigits: 2 });
  }

  // ── HEADER BAND ──────────────────────────────────────────────────
  const headerH = 32;
  doc.setFillColor(brandR, brandG, brandB);
  doc.rect(0, 0, pageWidth, headerH, "F");

  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, "PNG", margin, (headerH - 16) / 2, 46, 16);
    } catch (err) {
      console.error("[pdf] addImage failed:", err);
      doc.setFontSize(15);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...white);
      doc.text(profile.legalName, margin, headerH / 2 + 3);
    }
  } else {
    doc.setFontSize(15);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...white);
    doc.text(profile.legalName, margin, headerH / 2 + 3);
  }

  // Document title + number (right)
  doc.setTextColor(...white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(l.title, pageWidth - margin, headerH / 2 - 1, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(quoteNumber, pageWidth - margin, headerH / 2 + 6, { align: "right" });

  let y = headerH + 10;

  // ── SENDER INFO (left) + META INFO (right) — independent columns ─
  const metaLabelX = pageWidth / 2 + 2;
  const metaValueX = pageWidth - margin;

  // Left: sender contact details
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...muted);
  const senderLines: string[] = [];
  if (profile.address) senderLines.push(profile.address);
  if (profile.phone) senderLines.push(profile.phone);
  if (profile.email) senderLines.push(profile.email);
  senderLines.push(`${l.orgNumber}: ${profile.orgNumber}`);

  let leftY = y;
  for (const line of senderLines) {
    doc.text(line, margin, leftY);
    leftY += 4.5;
  }

  // Right: quote meta
  const today = new Date().toISOString().slice(0, 10);
  const metaItems = [
    { label: l.quoteNumber, value: quoteNumber },
    { label: l.date, value: today },
    { label: l.validUntil, value: validUntil },
  ];

  let rightY = y;
  for (const item of metaItems) {
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...muted);
    doc.text(item.label, metaLabelX, rightY);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...primary);
    doc.text(item.value, metaValueX, rightY, { align: "right" });
    rightY += 5.5;
  }

  y = Math.max(leftY, rightY) + 8;

  // ── CUSTOMER SECTION ─────────────────────────────────────────────
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(brandR, brandG, brandB);
  doc.text(l.customer.toUpperCase(), margin, y);
  y += 5;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...primary);
  doc.text(customer.name, margin, y);
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...muted);
  if (customer.location) { doc.text(customer.location, margin, y); y += 4.5; }
  if (customer.orgNumber) { doc.text(`${l.orgNumber}: ${customer.orgNumber}`, margin, y); y += 4.5; }
  if (customer.email) { doc.text(customer.email, margin, y); y += 4.5; }
  y += 8;

  // ── TABLE HEADER ─────────────────────────────────────────────────
  doc.setFillColor(...lightBg);
  doc.rect(margin - 2, y - 4, contentWidth + 4, 8, "F");
  hline(y - 4, margin - 2, pageWidth - margin + 2, [brandR, brandG, brandB] as const, 0.5);

  const colX = {
    desc: margin,
    qty: margin + contentWidth * 0.38,
    price: margin + contentWidth * 0.52,
    vat: margin + contentWidth * 0.66,
    billing: margin + contentWidth * 0.77,
    total: pageWidth - margin,
  };

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...muted);
  doc.text(l.description, colX.desc, y);
  doc.text(l.quantity, colX.qty, y, { align: "right" });
  doc.text(l.unitPrice, colX.price, y, { align: "right" });
  doc.text(l.vat, colX.vat, y, { align: "right" });
  doc.text(l.billing, colX.billing, y);
  doc.text(l.total, colX.total, y, { align: "right" });
  y += 4;
  hline(y, margin - 2, pageWidth - margin + 2, borderColor);
  y += 5;

  // ── TABLE ROWS ───────────────────────────────────────────────────
  let rowOdd = false;
  for (const item of items) {
    if (y > 252) {
      doc.addPage();
      y = margin;
    }

    if (item.type === "text") {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8.5);
      doc.setTextColor(...muted);
      doc.text(item.description || "", colX.desc, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...primary);
      y += 6;
      continue;
    }

    if (rowOdd) {
      doc.setFillColor(...lightBg);
      doc.rect(margin - 2, y - 4.5, contentWidth + 4, 7, "F");
    }
    rowOdd = !rowOdd;

    const lineTotal = item.quantity * item.unitPrice;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...primary);
    doc.text(item.description || "-", colX.desc, y);
    doc.text(item.quantity.toString(), colX.qty, y, { align: "right" });
    doc.text(fmt(item.unitPrice), colX.price, y, { align: "right" });
    doc.setTextColor(...muted);
    doc.text(item.vatRate + "%", colX.vat, y, { align: "right" });
    doc.setFontSize(8);
    doc.text(BILLING_LABELS[item.billingFrequency][language], colX.billing, y);
    doc.setFontSize(9);
    doc.setTextColor(...primary);
    doc.text(fmt(lineTotal), colX.total, y, { align: "right" });
    y += 6.5;
  }

  y += 2;
  hline(y, margin - 2, pageWidth - margin + 2, borderColor);
  y += 8;

  // ── TOTALS ───────────────────────────────────────────────────────
  const totalsLabelX = margin + contentWidth * 0.60;
  const totalsValX = pageWidth - margin;

  doc.setFontSize(9);
  doc.setTextColor(...muted);
  doc.text(l.subtotal, totalsLabelX, y);
  doc.setTextColor(...primary);
  doc.text(`${fmt(totals.subtotal)} ${currency}`, totalsValX, y, { align: "right" });
  y += 5.5;

  for (const entry of totals.vatBreakdown) {
    doc.setTextColor(...muted);
    doc.text(`${l.vatAmount} ${entry.rate}%`, totalsLabelX, y);
    doc.setTextColor(...primary);
    doc.text(`${fmt(entry.amount)} ${currency}`, totalsValX, y, { align: "right" });
    y += 5.5;
  }

  y += 1;
  hline(y, totalsLabelX - 2, pageWidth - margin + 2, [brandR, brandG, brandB] as const, 0.6);
  y += 2;

  doc.setFillColor(brandR, brandG, brandB);
  doc.rect(totalsLabelX - 2, y - 1, pageWidth - margin - totalsLabelX + 4, 9, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...white);
  doc.text(l.totalInclVat, totalsLabelX + 1, y + 5);
  doc.text(`${fmt(totals.total)} ${currency}`, totalsValX, y + 5, { align: "right" });
  y += 14;

  // ── NOTES ────────────────────────────────────────────────────────
  if (notes) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(brandR, brandG, brandB);
    doc.text(l.notes.toUpperCase(), margin, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...primary);
    const noteLines = doc.splitTextToSize(notes, contentWidth);
    doc.text(noteLines, margin, y);
  }

  // ── FOOTER ───────────────────────────────────────────────────────
  const footerY = pageHeight - 14;
  doc.setFillColor(brandR, brandG, brandB);
  doc.rect(0, footerY - 2, pageWidth, 16, "F");

  const footerParts: string[] = [profile.legalName];
  if (profile.orgNumber) footerParts.push(`${l.orgNumber}: ${profile.orgNumber}`);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...white);
  doc.text(footerParts.join("  ·  "), pageWidth / 2, footerY + 4, { align: "center" });
  doc.setFontSize(7);
  doc.text(`${l.page} 1`, pageWidth - margin, footerY + 4, { align: "right" });

  doc.save(`${quoteNumber || "quote"}.pdf`);
}
