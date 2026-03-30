import { useState, useEffect, useMemo } from "react";
import { Plus, UserPlus, Type } from "lucide-react";
import { useCustomers } from "@/features/customers/hooks/use-customers";
import { AddCustomerDialog } from "@/features/customers/components/add-customer-dialog";
import { useCompanyProfile } from "@/features/profile/hooks/use-profile";
import {
  useInvoices,
  type InvoiceFormData,
  generateInvoiceRef,
} from "../hooks/use-invoices";
import { useProductSuggestions } from "../hooks/use-product-suggestions";
import { InvoiceLineItem } from "./invoice-line-item";
import {
  calcInvoiceTotals,
  type InvoiceLineData,
} from "../utils/calculations";
import { generateInvoicePdf } from "../utils/generate-invoice-pdf";
import { fetchLogoDataUrl } from "@/lib/logo-data-url";
import type { VatRateType, Invoice, Customer } from "@crm/shared";

const INPUT_CLASS =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors";

function emptyLine(): InvoiceLineData {
  return { type: "article", description: "", quantity: 1, unitPrice: 0, vatRate: "25" };
}

function emptyTextLine(): InvoiceLineData {
  return { type: "text", description: "", quantity: 0, unitPrice: 0, vatRate: "25" };
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function defaultDueDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().slice(0, 10);
}

interface InvoiceFormProps {
  existingInvoice?: Invoice;
  onSaved?: () => void;
}

export function InvoiceForm({ existingInvoice, onSaved }: InvoiceFormProps) {
  const { customers, addCustomer } = useCustomers();
  const { profile } = useCompanyProfile();
  const { addInvoice, updateInvoice, generateInvoiceNumber } = useInvoices();
  const { suggestions, decrementVariantStock } = useProductSuggestions();
  const [showAddCustomer, setShowAddCustomer] = useState(false);

  const [customerId, setCustomerId] = useState(
    existingInvoice?.customerId ?? ""
  );
  const [invoiceNumber, setInvoiceNumber] = useState(
    existingInvoice?.invoiceNumber ?? ""
  );
  const [invoiceRef, setInvoiceRef] = useState(
    existingInvoice?.invoiceRef ?? generateInvoiceRef()
  );
  const [invoiceDate, setInvoiceDate] = useState(
    existingInvoice?.invoiceDate ?? todayStr()
  );
  const [dueDate, setDueDate] = useState(
    existingInvoice?.dueDate ?? defaultDueDate()
  );
  const [overdueInterestRate, setOverdueInterestRate] = useState(
    existingInvoice?.overdueInterestRate ?? 8
  );
  const [isInternational, setIsInternational] = useState(
    existingInvoice?.isInternational ?? false
  );
  const [items, setItems] = useState<InvoiceLineData[]>(
    existingInvoice?.items?.map((i) => ({
      description: i.description,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      vatRate: (i.vatRate ?? "25") as VatRateType,
    })) ?? [emptyLine()]
  );
  const [notes, setNotes] = useState(existingInvoice?.notes ?? "");
  const [language, setLanguage] = useState<"sv" | "en">(
    existingInvoice?.language ?? "sv"
  );
  const [saving, setSaving] = useState(false);
  const [syncInventory, setSyncInventory] = useState(true);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const currency = "SEK";

  const totals = useMemo(() => calcInvoiceTotals(items), [items]);
  const hasInventoryItems = useMemo(
    () => !existingInvoice && items.some((i) => !!i.productId),
    [existingInvoice, items]
  );

  const selectedCustomer: Customer | undefined = customers.find(
    (c) => c.id === customerId
  );

  // Auto-generate invoice number for new invoices
  useEffect(() => {
    if (!existingInvoice && !invoiceNumber) {
      generateInvoiceNumber().then(setInvoiceNumber);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleLineChange(
    index: number,
    field: keyof InvoiceLineData,
    value: string | number
  ) {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }

  function handleSelectProduct(index: number, data: Pick<InvoiceLineData, "description" | "unitPrice" | "productId" | "variantId" | "sku">) {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], ...data };
      return updated;
    });
  }

  function addLine() {
    setItems((prev) => [...prev, emptyLine()]);
  }

  function addTextLine() {
    setItems((prev) => [...prev, emptyTextLine()]);
  }

  function handleDragStart(index: number) {
    setDragIndex(index);
  }

  function handleDrop(targetIndex: number) {
    if (dragIndex === null || dragIndex === targetIndex) return;
    setItems((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(dragIndex, 1);
      updated.splice(targetIndex, 0, moved);
      return updated;
    });
    setDragIndex(null);
  }

  function removeLine(index: number) {
    setItems((prev) =>
      prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)
    );
  }

  function buildFormData(
    status: "draft" | "created"
  ): InvoiceFormData {
    return {
      customerId,
      invoiceNumber,
      invoiceRef,
      invoiceDate,
      items: items.map((i) => ({
        description: i.description,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        vatRate: i.vatRate,
      })),
      subtotal: totals.subtotal,
      vatAmount: totals.vatAmount,
      totalAmount: totals.total,
      currency,
      dueDate,
      overdueInterestRate,
      status,
      isRecurring: false,
      isInternational,
      language,
      ...(notes && { notes }),
    };
  }

  async function handleSaveDraft() {
    if (!customerId) return;
    setSaving(true);
    try {
      const data = buildFormData("draft");
      if (existingInvoice) {
        await updateInvoice(existingInvoice.id, data);
      } else {
        const result = await addInvoice(data);
        setInvoiceNumber(result.invoiceNumber);
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
      let iNum = invoiceNumber;
      if (existingInvoice) {
        await updateInvoice(existingInvoice.id, data);
      } else {
        const result = await addInvoice(data);
        iNum = result.invoiceNumber;
        setInvoiceNumber(iNum);

        if (syncInventory) {
          for (const item of items) {
            if (item.productId && item.variantId) {
              decrementVariantStock(item.productId, item.variantId, item.quantity).catch(
                (err) => console.error("Failed to sync inventory for item:", item.description, err)
              );
            }
          }
        }
      }

      const logoDataUrl = profile.logoUrl
        ? await fetchLogoDataUrl(profile.logoUrl)
        : undefined;

      generateInvoicePdf({
        profile,
        customer: selectedCustomer!,
        invoiceNumber: iNum,
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
        logoDataUrl,
      });

      onSaved?.();
    } finally {
      setSaving(false);
    }
  }

  async function handleAddCustomerInline(data: Parameters<typeof addCustomer>[0]) {
    const newId = await addCustomer(data);
    setCustomerId(newId);
    setShowAddCustomer(false);
  }

  return (
    <div className="space-y-6">
      <AddCustomerDialog
        open={showAddCustomer}
        onOpenChange={setShowAddCustomer}
        onSubmit={handleAddCustomerInline}
      />

      {/* Customer & Invoice Details */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium">Customer</label>
          <div className="flex gap-2">
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
            <button
              type="button"
              onClick={() => setShowAddCustomer(true)}
              className="shrink-0 flex items-center gap-1 rounded-md border border-border bg-background px-2.5 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              title="Add new customer"
            >
              <UserPlus className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="hidden">
          <input
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
            readOnly
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">
            Invoice Reference
          </label>
          <input
            className={INPUT_CLASS + " font-mono"}
            value={invoiceRef}
            onChange={(e) => setInvoiceRef(e.target.value)}
          />
        </div>
      </div>

      {/* Dates & Interest */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium">
            Invoice Date
          </label>
          <input
            className={INPUT_CLASS}
            type="date"
            value={invoiceDate}
            onChange={(e) => setInvoiceDate(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Due Date</label>
          <input
            className={INPUT_CLASS}
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">
            Overdue Interest (%)
          </label>
          <input
            className={INPUT_CLASS}
            type="number"
            min="0"
            step="0.1"
            value={overdueInterestRate}
            onChange={(e) =>
              setOverdueInterestRate(parseFloat(e.target.value) || 0)
            }
          />
        </div>
      </div>

      {/* International checkbox */}
      <div className="flex items-center gap-2">
        <input
          id="international"
          type="checkbox"
          checked={isInternational}
          onChange={(e) => {
            const checked = e.target.checked;
            setIsInternational(checked);
            if (checked) setLanguage("en");
          }}
          className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20"
        />
        <label htmlFor="international" className="text-sm font-medium">
          International invoice (outside Sweden)
        </label>
        {isInternational && (
          <span className="text-xs text-muted-foreground">
            — Language set to English, VAT number converted to EU format
          </span>
        )}
      </div>

      {/* Article Lines */}
      <div className="rounded-lg border border-border bg-background overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="py-2 pl-2 w-6" />
              <th className="py-2 pr-2 text-left font-medium text-muted-foreground">
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
              <InvoiceLineItem
                key={i}
                item={item}
                index={i}
                onChange={handleLineChange}
                onSelectProduct={handleSelectProduct}
                onRemove={removeLine}
                currency={currency}
                suggestions={suggestions}
                isDragging={dragIndex === i}
                onDragStart={() => handleDragStart(i)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(i)}
                onDragEnd={() => setDragIndex(null)}
              />
            ))}
          </tbody>
        </table>
        <div className="p-2 border-t border-border flex gap-2">
          <button
            type="button"
            onClick={addLine}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add line
          </button>
          <button
            type="button"
            onClick={addTextLine}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted transition-colors"
          >
            <Type className="h-4 w-4" />
            Add text
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
            <div
              key={entry.rate}
              className="flex justify-between text-muted-foreground"
            >
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
          placeholder="Additional notes for the invoice..."
        />
      </div>

      {/* Inventory sync notice */}
      {hasInventoryItems && (
        <div className="flex items-center gap-2">
          <input
            id="sync-inventory"
            type="checkbox"
            checked={syncInventory}
            onChange={(e) => setSyncInventory(e.target.checked)}
            className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20"
          />
          <label htmlFor="sync-inventory" className="text-sm text-muted-foreground">
            Creating this invoice will sync inventory
          </label>
        </div>
      )}

      {/* Language toggle + Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">PDF Language:</label>
          <button
            type="button"
            onClick={() => !isInternational && setLanguage("sv")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              language === "sv"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            } ${isInternational ? "opacity-50 cursor-not-allowed" : ""}`}
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
