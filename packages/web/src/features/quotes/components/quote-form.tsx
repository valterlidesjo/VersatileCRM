import { useState, useEffect, useMemo } from "react";
import { Plus } from "lucide-react";
import { useCustomers } from "@/features/customers/hooks/use-customers";
import { useProfile } from "@/features/profile/hooks/use-profile";
import { useQuotes, type QuoteFormData, generateQuoteNumber } from "../hooks/use-quotes";
import { QuoteLineItem } from "./quote-line-item";
import { ProfitabilityCard } from "./profitability-card";
import { calcQuoteTotals, type QuoteLineData, type CostEntry } from "../utils/calculations";
import { generateQuotePdf } from "../utils/generate-quote-pdf";
import type { VatRateType, BillingFrequency, Quote, Customer } from "@crm/shared";

const INPUT_CLASS =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors";

function emptyLine(): QuoteLineData {
  return { description: "", quantity: 1, unitPrice: 0, vatRate: "25", billingFrequency: "one-time" };
}

function defaultValidUntil(): string {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toISOString().slice(0, 10);
}

interface QuoteFormProps {
  existingQuote?: Quote;
  onSaved?: () => void;
}

export function QuoteForm({ existingQuote, onSaved }: QuoteFormProps) {
  const { customers } = useCustomers();
  const { profile } = useProfile();
  const { addQuote, updateQuote } = useQuotes();

  const [customerId, setCustomerId] = useState(
    existingQuote?.customerId ?? ""
  );
  const [quoteNumber, setQuoteNumber] = useState(
    existingQuote?.quoteNumber ?? ""
  );
  const [validUntil, setValidUntil] = useState(
    existingQuote?.validUntil ?? defaultValidUntil()
  );
  const [items, setItems] = useState<QuoteLineData[]>(
    existingQuote?.items?.map((i) => ({
      description: i.description,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      vatRate: (i.vatRate ?? "25") as VatRateType,
      billingFrequency: (i.billingFrequency ?? "one-time") as BillingFrequency,
    })) ?? [emptyLine()]
  );
  const [notes, setNotes] = useState(existingQuote?.notes ?? "");
  const [language, setLanguage] = useState<"sv" | "en">(
    existingQuote?.language ?? "sv"
  );
  const [estimatedHours, setEstimatedHours] = useState(
    existingQuote?.estimatedHours ?? 0
  );
  const [costs, setCosts] = useState<CostEntry[]>(
    existingQuote?.costs?.map((c) => ({ label: c.label, amount: c.amount })) ?? []
  );
  const [saving, setSaving] = useState(false);
  const currency = "SEK";

  const totals = useMemo(() => calcQuoteTotals(items), [items]);

  const selectedCustomer: Customer | undefined = customers.find(
    (c) => c.id === customerId
  );

  // Auto-generate quote number for new quotes
  useEffect(() => {
    if (!existingQuote && !quoteNumber) {
      generateQuoteNumber().then(setQuoteNumber);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleLineChange(
    index: number,
    field: keyof QuoteLineData,
    value: string | number
  ) {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }

  function addLine() {
    setItems((prev) => [...prev, emptyLine()]);
  }

  function removeLine(index: number) {
    setItems((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  }

  function buildFormData(
    status: "draft" | "created"
  ): QuoteFormData {
    return {
      customerId,
      quoteNumber,
      items: items.map((i) => ({
        description: i.description,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        vatRate: i.vatRate,
        billingFrequency: i.billingFrequency,
      })),
      subtotal: totals.subtotal,
      vatAmount: totals.vatAmount,
      totalAmount: totals.total,
      currency,
      validUntil,
      status,
      language,
      ...(notes && { notes }),
      ...(estimatedHours && { estimatedHours }),
      ...(costs.length > 0 && { costs }),
    };
  }

  async function handleSaveDraft() {
    if (!customerId) return;
    setSaving(true);
    try {
      const data = buildFormData("draft");
      if (existingQuote) {
        await updateQuote(existingQuote.id, data);
      } else {
        const result = await addQuote(data);
        setQuoteNumber(result.quoteNumber);
      }
      onSaved?.();
    } finally {
      setSaving(false);
    }
  }

  async function handleCreatePdf() {
    if (!customerId || !profile) return;
    setSaving(true);
    try {
      const data = buildFormData("created");
      let qNum = quoteNumber;
      if (existingQuote) {
        await updateQuote(existingQuote.id, data);
      } else {
        const result = await addQuote(data);
        qNum = result.quoteNumber;
        setQuoteNumber(qNum);
      }

      generateQuotePdf({
        profile,
        customer: selectedCustomer!,
        quoteNumber: qNum,
        validUntil,
        items,
        totals,
        notes,
        language,
        currency,
      });

      onSaved?.();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Customer & Quote Details */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium">Customer</label>
          <select
            className={INPUT_CLASS}
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            required
          >
            <option value="">Select customer...</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Quote Number</label>
          <input
            className={INPUT_CLASS}
            value={quoteNumber}
            onChange={(e) => setQuoteNumber(e.target.value)}
            placeholder="Auto-generated on save"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Valid Until</label>
          <input
            className={INPUT_CLASS}
            type="date"
            value={validUntil}
            onChange={(e) => setValidUntil(e.target.value)}
            required
          />
        </div>
      </div>

      {/* Article Lines */}
      <div className="rounded-lg border border-border bg-background overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="py-2 pr-2 pl-4 text-left font-medium text-muted-foreground">
                Description
              </th>
              <th className="py-2 px-2 text-right font-medium text-muted-foreground w-20">
                Qty
              </th>
              <th className="py-2 px-2 text-right font-medium text-muted-foreground w-28">
                Unit Price
              </th>
              <th className="py-2 px-2 text-left font-medium text-muted-foreground w-24">
                VAT
              </th>
              <th className="py-2 px-2 text-left font-medium text-muted-foreground w-28">
                Billing
              </th>
              <th className="py-2 px-2 text-right font-medium text-muted-foreground">
                Total
              </th>
              <th className="py-2 px-2 text-right font-medium text-muted-foreground">
                VAT Amt
              </th>
              <th className="py-2 pl-2 pr-4 w-10" />
            </tr>
          </thead>
          <tbody className="px-4">
            {items.map((item, i) => (
              <QuoteLineItem
                key={i}
                item={item}
                index={i}
                onChange={handleLineChange}
                onRemove={removeLine}
                currency={currency}
              />
            ))}
          </tbody>
        </table>
        <div className="p-2 border-t border-border">
          <button
            type="button"
            onClick={addLine}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add line
          </button>
        </div>
      </div>

      {/* Totals */}
      <div className="flex justify-end">
        <div className="w-full max-w-xs space-y-1 rounded-lg border border-border bg-background p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="tabular-nums">
              {totals.subtotal.toLocaleString("sv-SE", {
                minimumFractionDigits: 2,
              })}{" "}
              {currency}
            </span>
          </div>
          {totals.vatBreakdown.map((entry) => (
            <div key={entry.rate} className="flex justify-between text-muted-foreground">
              <span>VAT {entry.rate}%</span>
              <span className="tabular-nums">
                {entry.amount.toLocaleString("sv-SE", {
                  minimumFractionDigits: 2,
                })}{" "}
                {currency}
              </span>
            </div>
          ))}
          <div className="flex justify-between border-t border-border pt-1 font-semibold">
            <span>Total</span>
            <span className="tabular-nums">
              {totals.total.toLocaleString("sv-SE", {
                minimumFractionDigits: 2,
              })}{" "}
              {currency}
            </span>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="mb-1 block text-sm font-medium">Notes</label>
        <textarea
          className={INPUT_CLASS + " min-h-[60px] resize-y"}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Additional notes for the quote..."
        />
      </div>

      {/* Profitability */}
      <ProfitabilityCard
        subtotal={totals.subtotal}
        mrr={totals.mrr}
        estimatedHours={estimatedHours}
        costs={costs}
        currency={currency}
        onEstimatedHoursChange={setEstimatedHours}
        onCostsChange={setCosts}
      />

      {/* Language toggle + Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">PDF Language:</label>
          <button
            type="button"
            onClick={() => setLanguage("sv")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              language === "sv"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            Svenska
          </button>
          <button
            type="button"
            onClick={() => setLanguage("en")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              language === "en"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            English
          </button>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={!customerId || saving}
            className="rounded-md border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save as Draft"}
          </button>
          <button
            type="button"
            onClick={handleCreatePdf}
            disabled={!customerId || !profile || saving}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {saving ? "Creating..." : "Create & Download PDF"}
          </button>
        </div>
      </div>

      {!profile && (
        <p className="text-sm text-amber-600">
          Set up your profile first to include your business details on the PDF.
        </p>
      )}
    </div>
  );
}
