import type { Product } from "@crm/shared";
import { cn } from "@/lib/utils";
import { Package, ShoppingCart } from "lucide-react";

interface ProductListProps {
  products: Product[];
  onAdjustStock: (product: Product) => void;
  onRecordSale: (product: Product) => void;
}

function StockBadge({ stock }: { stock: number }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        stock === 0
          ? "bg-red-100 text-red-700"
          : stock < 5
            ? "bg-orange-100 text-orange-700"
            : stock < 20
              ? "bg-yellow-100 text-yellow-700"
              : "bg-green-100 text-green-700"
      )}
    >
      {stock}
    </span>
  );
}

export function ProductList({
  products,
  onAdjustStock,
  onRecordSale,
}: ProductListProps) {
  const active = products.filter((p) => p.status === "active");
  const archived = products.filter((p) => p.status === "archived");

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Package className="mb-3 h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">
          Inga produkter ännu. Lägg till din första produkt eller synka från
          Shopify.
        </p>
      </div>
    );
  }

  function renderGroup(items: Product[], label?: string) {
    if (items.length === 0) return null;
    return (
      <>
        {label && (
          <p className="mb-2 mt-6 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
        )}
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="py-2.5 px-4 text-left font-medium text-muted-foreground w-12" />
                <th className="py-2.5 px-4 text-left font-medium text-muted-foreground">
                  Produkt
                </th>
                <th className="py-2.5 px-4 text-left font-medium text-muted-foreground">
                  Varianter
                </th>
                <th className="py-2.5 px-4 text-left font-medium text-muted-foreground">
                  Totalt lager
                </th>
                <th className="py-2.5 px-4 text-left font-medium text-muted-foreground">
                  Shopify
                </th>
                <th className="py-2.5 px-4 text-right font-medium text-muted-foreground">
                  Åtgärder
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((product) => {
                const totalStock = product.variants.reduce(
                  (sum, v) => sum + v.stock,
                  0
                );
                return (
                  <tr
                    key={product.id}
                    className="border-b border-border last:border-b-0 hover:bg-muted/20 transition-colors"
                  >
                    {/* Thumbnail */}
                    <td className="py-2.5 px-4">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.title}
                          className="h-9 w-9 rounded-md object-cover"
                        />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted">
                          <Package className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </td>

                    {/* Title + vendor */}
                    <td className="py-2.5 px-4">
                      <p className="font-medium">{product.title}</p>
                      {product.vendor && (
                        <p className="text-xs text-muted-foreground">
                          {product.vendor}
                        </p>
                      )}
                    </td>

                    {/* Variants with per-variant stock */}
                    <td className="py-2.5 px-4">
                      {product.variants.length === 0 ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {product.variants.map((v) => (
                            <span
                              key={v.id}
                              className="inline-flex items-center gap-1 rounded border border-border bg-background px-1.5 py-0.5 text-xs"
                            >
                              {v.title}
                              <StockBadge stock={v.stock} />
                            </span>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* Total stock */}
                    <td className="py-2.5 px-4">
                      <StockBadge stock={totalStock} />
                    </td>

                    {/* Shopify sync indicator */}
                    <td className="py-2.5 px-4">
                      {product.shopifyProductId ? (
                        <span className="inline-flex items-center gap-1 text-xs text-green-600">
                          <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                          Kopplad
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Ej kopplad
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onRecordSale(product)}
                          className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs font-medium hover:bg-muted transition-colors"
                        >
                          <ShoppingCart className="h-3 w-3" />
                          Sälj
                        </button>
                        <button
                          type="button"
                          onClick={() => onAdjustStock(product)}
                          className="rounded-md border border-border px-2.5 py-1 text-xs font-medium hover:bg-muted transition-colors"
                        >
                          Justera lager
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </>
    );
  }

  if (archived.length === 0) {
    return <>{renderGroup(active)}</>;
  }

  return (
    <>
      {renderGroup(active, "Aktiva")}
      {renderGroup(archived, "Arkiverade")}
    </>
  );
}
