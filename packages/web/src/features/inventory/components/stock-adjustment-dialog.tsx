import { useState } from "react";
import { useProducts } from "../hooks/use-products";
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "@/lib/firebase";
import { usePartner } from "@/lib/partner";
import type { Product } from "@crm/shared";
import { X } from "lucide-react";

interface StockAdjustmentDialogProps {
  product: Product;
  onClose: () => void;
}

export function StockAdjustmentDialog({
  product,
  onClose,
}: StockAdjustmentDialogProps) {
  const { updateVariantStock } = useProducts();
  const { partnerId } = usePartner();

  // Map variantId → new stock value (string for controlled input)
  const [stockValues, setStockValues] = useState<Record<string, string>>(
    Object.fromEntries(
      product.variants.map((v) => [v.id, v.stock.toString()])
    )
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      // Update each variant that changed
      const updates = product.variants.filter(
        (v) => parseInt(stockValues[v.id] ?? "0", 10) !== v.stock
      );

      const functions = getFunctions(app, "europe-west1");
      const updateShopifyInventory = httpsCallable(functions, "updateShopifyInventory");

      await Promise.all(
        updates.map(async (v) => {
          const newStock = parseInt(stockValues[v.id] ?? "0", 10);
          await updateVariantStock(product.id, v.id, newStock);

          if (v.shopifyInventoryItemId && v.shopifyLocationId) {
            try {
              await updateShopifyInventory({
                partnerId,
                inventoryItemId: v.shopifyInventoryItemId,
                locationId: v.shopifyLocationId,
                newQuantity: newStock,
              });
            } catch (shopifyErr) {
              console.error("[StockAdj] Shopify sync failed", shopifyErr);
            }
          }
        })
      );

      onClose();
    } catch (err) {
      setError("Something went wrong. Please try again.");
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-md rounded-xl border border-border bg-background shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold">Adjust stock</h2>
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {product.variants.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No variants to adjust.
            </p>
          ) : (
            <div className="space-y-3">
              {product.variants.map((variant) => (
                <div
                  key={variant.id}
                  className="flex items-center justify-between gap-4"
                >
                  <div>
                    <p className="text-sm font-medium">{variant.title}</p>
                    {variant.sku && (
                      <p className="text-xs text-muted-foreground">
                        SKU: {variant.sku}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      Cur: {variant.stock}
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={stockValues[variant.id] ?? "0"}
                      onChange={(e) =>
                        setStockValues((prev) => ({
                          ...prev,
                          [variant.id]: e.target.value,
                        }))
                      }
                      className="w-20 rounded-md border border-border bg-background px-2.5 py-1.5 text-sm text-right outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {product.shopifyProductId && (
            <p className="text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
              This product is linked to Shopify. Stock changes will be pushed to Shopify automatically.
            </p>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || product.variants.length === 0}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : "Update stock"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
