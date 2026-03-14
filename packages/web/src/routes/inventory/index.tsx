import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageContainer } from "@/components/layout/page-container";
import { ProductList } from "@/features/inventory/components/product-list";
import { AddProductDialog } from "@/features/inventory/components/add-product-dialog";
import { StockAdjustmentDialog } from "@/features/inventory/components/stock-adjustment-dialog";
import { PrivateSaleDialog } from "@/features/inventory/components/private-sale-dialog";
import { ShopifySyncDialog } from "@/features/inventory/components/shopify-sync-dialog";
import { useProducts } from "@/features/inventory/hooks/use-products";
import { requireAdmin } from "@/lib/route-guards";
import { Plus, RefreshCw } from "lucide-react";
import type { Product } from "@crm/shared";

export const Route = createFileRoute("/inventory/")({
  beforeLoad: ({ context }) => requireAdmin(context.auth),
  component: InventoryPage,
});

function InventoryPage() {
  const { products, loading } = useProducts();
  const [showAdd, setShowAdd] = useState(false);
  const [showSync, setShowSync] = useState(false);
  const [adjustProduct, setAdjustProduct] = useState<Product | null>(null);
  const [saleProduct, setSaleProduct] = useState<Product | null>(null);

  return (
    <PageContainer title="Lager" description="Källsanning för lagerstatus">
      <div className="space-y-6">
        {/* Action bar */}
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setShowSync(true)}
            className="flex items-center gap-1.5 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Synka Shopify
          </button>
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Ny produkt
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Laddar produkter...</p>
        ) : (
          <ProductList
            products={products}
            onAdjustStock={setAdjustProduct}
            onRecordSale={setSaleProduct}
          />
        )}
      </div>

      {showAdd && <AddProductDialog onClose={() => setShowAdd(false)} />}

      {adjustProduct && (
        <StockAdjustmentDialog
          product={adjustProduct}
          onClose={() => setAdjustProduct(null)}
        />
      )}

      {saleProduct && (
        <PrivateSaleDialog
          product={saleProduct}
          onClose={() => setSaleProduct(null)}
        />
      )}

      {showSync && <ShopifySyncDialog onClose={() => setShowSync(false)} />}
    </PageContainer>
  );
}
