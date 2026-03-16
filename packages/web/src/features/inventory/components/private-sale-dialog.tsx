import { useState } from "react";
import { useProducts } from "../hooks/use-products";
import { useCustomers } from "@/features/customers/hooks/use-customers";
import { useInvoices, generateInvoiceRef } from "@/features/invoices/hooks/use-invoices";
import type { Product, ProductVariant } from "@crm/shared";
import { X, ChevronDown } from "lucide-react";
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "@/lib/firebase";
import { usePartner } from "@/lib/partner";

interface PrivateSaleDialogProps {
  product: Product;
  onClose: () => void;
}

export function PrivateSaleDialog({ product, onClose }: PrivateSaleDialogProps) {
  const { partnerId } = usePartner();
  const { decrementVariantStock } = useProducts();
  const { customers } = useCustomers();
  const { addInvoice, generateInvoiceNumber } = useInvoices();

  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    product.variants[0]?.id ?? ""
  );
  const [quantity, setQuantity] = useState("1");
  const [linkCustomer, setLinkCustomer] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [createInvoice, setCreateInvoice] = useState(false);
  const [vatRate, setVatRate] = useState<"0" | "6" | "12" | "25">("25");
  const [dueDate, setDueDateState] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const selectedVariant: ProductVariant | undefined = product.variants.find(
    (v) => v.id === selectedVariantId
  );
  const qty = parseInt(quantity, 10) || 1;
  const unitPrice = selectedVariant?.price ?? 0;
  const subtotal = unitPrice * qty;
  const vatAmount = subtotal * (parseInt(vatRate, 10) / 100);
  const total = subtotal + vatAmount;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedVariantId || qty < 1) return;
    setSaving(true);
    setError(null);

    try {
      // 1. Decrement stock in CRM (Firestore)
      const newStock = await decrementVariantStock(
        product.id,
        selectedVariantId,
        qty
      );

      // 2. If product is linked to Shopify, push inventory update
      if (
        selectedVariant?.shopifyInventoryItemId &&
        selectedVariant?.shopifyLocationId
      ) {
        try {
          const functions = getFunctions(app, "europe-west1");
          const updateInventory = httpsCallable(
            functions,
            "updateShopifyInventory"
          );
          await updateInventory({
            partnerId,
            inventoryItemId: selectedVariant.shopifyInventoryItemId,
            locationId: selectedVariant.shopifyLocationId,
            newQuantity: newStock ?? 0,
          });
        } catch (shopifyErr) {
          // Non-blocking — log but don't fail the sale
          console.warn("Shopify-uppdatering misslyckades:", shopifyErr);
        }
      }

      // 3. Create invoice if requested
      if (createInvoice && linkCustomer && selectedCustomerId) {
        const invoiceNumber = await generateInvoiceNumber();
        const ref = generateInvoiceRef();
        await addInvoice({
          customerId: selectedCustomerId,
          invoiceNumber,
          invoiceRef: ref,
          invoiceDate: new Date().toISOString().split("T")[0],
          dueDate,
          status: "created",
          items: [
            {
              description: `${product.title}${selectedVariant ? ` — ${selectedVariant.title}` : ""}`,
              quantity: qty,
              unitPrice,
              vatRate,
            },
          ],
          subtotal,
          vatAmount,
          totalAmount: total,
          currency: "SEK",
          overdueInterestRate: 8,
          isRecurring: false,
          isInternational: false,
          language: "sv",
        });
      }

      setDone(true);
    } catch (err) {
      setError("Something went wrong. Please try again.");
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  if (done) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="relative w-full max-w-sm rounded-xl border border-border bg-background shadow-xl p-6 text-center">
          <div className="mb-3 flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>
          <h3 className="text-lg font-semibold">Sale registered</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Inventory and Shopify have been updated.
            {createInvoice && linkCustomer && selectedCustomerId
              ? " Invoice created."
              : ""}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="mt-4 w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-background shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold">Record sale</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {product.title}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Variant selector */}
          <div>
            <label className="mb-1.5 block text-sm font-medium">Variant</label>
            <div className="relative">
              <select
                value={selectedVariantId}
                onChange={(e) => setSelectedVariantId(e.target.value)}
                className="w-full appearance-none rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 pr-8"
              >
                {product.variants.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.title} — {v.stock} in stock
                    {v.price ? ` — ${v.price} kr` : ""}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label className="mb-1.5 block text-sm font-medium">Quantity</label>
            <input
              type="number"
              min="1"
              max={selectedVariant?.stock ?? 999}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
            {selectedVariant && qty > selectedVariant.stock && (
              <p className="mt-1 text-xs text-orange-500">
                Quantity exceeds available stock ({selectedVariant.stock})
              </p>
            )}
          </div>

          {/* Link to customer */}
          <div className="rounded-lg border border-border p-4 space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={linkCustomer}
                onChange={(e) => setLinkCustomer(e.target.checked)}
                className="h-4 w-4 rounded border-border accent-primary"
              />
              <span className="text-sm font-medium">Link to customer</span>
            </label>

            {linkCustomer && (
              <div className="relative">
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full appearance-none rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 pr-8"
                >
                  <option value="">Select customer...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Create invoice */}
          <div className="rounded-lg border border-border p-4 space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={createInvoice}
                onChange={(e) => setCreateInvoice(e.target.checked)}
                disabled={!linkCustomer || !selectedCustomerId}
                className="h-4 w-4 rounded border-border accent-primary disabled:opacity-40"
              />
              <span
                className={`text-sm font-medium ${!linkCustomer || !selectedCustomerId ? "text-muted-foreground" : ""}`}
              >
                Create invoice
              </span>
              {(!linkCustomer || !selectedCustomerId) && (
                <span className="text-xs text-muted-foreground">
                  (requires customer)
                </span>
              )}
            </label>

            {createInvoice && linkCustomer && selectedCustomerId && (
              <div className="space-y-3">
                {unitPrice > 0 && (
                  <div className="rounded-md bg-muted/30 p-3 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Net</span>
                      <span>{subtotal.toFixed(2)} kr</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        VAT ({vatRate}%)
                      </span>
                      <span>{vatAmount.toFixed(2)} kr</span>
                    </div>
                    <div className="flex justify-between font-medium border-t border-border pt-1 mt-1">
                      <span>Totalt</span>
                      <span>{total.toFixed(2)} kr</span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      VAT
                    </label>
                    <select
                      value={vatRate}
                      onChange={(e) =>
                        setVatRate(e.target.value as typeof vatRate)
                      }
                      className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value="0">0%</option>
                      <option value="6">6%</option>
                      <option value="12">12%</option>
                      <option value="25">25%</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      Due date
                    </label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDateState(e.target.value)}
                      className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !selectedVariantId || qty < 1}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {saving ? "Registering..." : "Record sale"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
