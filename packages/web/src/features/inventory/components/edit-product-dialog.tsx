import { useState, useRef } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { usePartner } from "@/lib/partner";
import { useProducts } from "../hooks/use-products";
import type { Product } from "@crm/shared";
import { X, Plus, Trash2, ImageIcon, Upload } from "lucide-react";

interface VariantRow {
  id: string;
  title: string;
  price: string;
  stock: string;
  sku: string;
  shopifyVariantId?: string;
  shopifyInventoryItemId?: string;
  shopifyLocationId?: string;
  imageUrl?: string;
}

interface EditProductDialogProps {
  product: Product;
  onClose: () => void;
}

export function EditProductDialog({ product, onClose }: EditProductDialogProps) {
  const { partnerId } = usePartner();
  const { updateProduct } = useProducts();

  const [title, setTitle] = useState(product.title);
  const [description, setDescription] = useState(product.description ?? "");
  const [vendor, setVendor] = useState(product.vendor ?? "");
  const [status, setStatus] = useState<"active" | "archived">(product.status);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    product.imageUrl ?? null
  );
  const [variants, setVariants] = useState<VariantRow[]>(
    product.variants.map((v) => ({
      id: v.id,
      title: v.title,
      price: v.price?.toString() ?? "",
      stock: v.stock.toString(),
      sku: v.sku ?? "",
      shopifyVariantId: v.shopifyVariantId,
      shopifyInventoryItemId: v.shopifyInventoryItemId,
      shopifyLocationId: v.shopifyLocationId,
      imageUrl: v.imageUrl,
    }))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function addVariant() {
    setVariants((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        title: "",
        price: "",
        stock: "0",
        sku: "",
      },
    ]);
  }

  function removeVariant(id: string) {
    setVariants((prev) => prev.filter((v) => v.id !== id));
  }

  function updateVariant(id: string, field: keyof VariantRow, value: string) {
    setVariants((prev) =>
      prev.map((v) => (v.id === id ? { ...v, [field]: value } : v))
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    setError(null);

    try {
      let imageUrl: string | undefined = product.imageUrl;

      if (imageFile) {
        const storageRef = ref(
          storage,
          `partners/${partnerId}/products/${product.id}/cover`
        );
        await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(storageRef);
      }

      await updateProduct(product.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        vendor: vendor.trim() || undefined,
        imageUrl,
        status,
        variants: variants
          .filter((v) => v.title.trim())
          .map((v) => ({
            id: v.id,
            title: v.title.trim(),
            sku: v.sku.trim() || undefined,
            price: v.price ? parseFloat(v.price) : undefined,
            stock: parseInt(v.stock, 10) || 0,
            shopifyVariantId: v.shopifyVariantId,
            shopifyInventoryItemId: v.shopifyInventoryItemId,
            shopifyLocationId: v.shopifyLocationId,
            imageUrl: v.imageUrl,
          })),
      });

      onClose();
    } catch (err) {
      setError("Något gick fel. Försök igen.");
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-background shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold">Redigera produkt</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Shopify badge */}
          {product.shopifyProductId && (
            <div className="flex items-center gap-2 rounded-md bg-green-50 border border-green-200 px-3 py-2 text-xs text-green-700">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              Synkad med Shopify — lagerändringar skickas automatiskt
            </div>
          )}

          {/* Basic info */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium">
                Titel <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Leverantör / Varumärke
              </label>
              <input
                type="text"
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as "active" | "archived")}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="active">Aktiv</option>
                <option value="archived">Arkiverad</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium">
                Beskrivning
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              />
            </div>
          </div>

          {/* Image */}
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Produktbild
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border py-6 hover:border-primary/50 hover:bg-muted/30 transition-colors"
            >
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Förhandsvisning"
                  className="max-h-32 rounded-md object-contain"
                />
              ) : (
                <>
                  <ImageIcon className="mb-2 h-7 w-7 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">
                    Klicka för att byta bild
                  </p>
                </>
              )}
            </div>
            {imagePreview && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Upload className="h-3 w-3" /> Byt bild
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
          </div>

          {/* Variants */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium">Varianter</label>
              <button
                type="button"
                onClick={addVariant}
                className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" /> Lägg till variant
              </button>
            </div>

            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-1">
                <span className="col-span-4">Namn</span>
                <span className="col-span-2">SKU</span>
                <span className="col-span-2">Pris (kr)</span>
                <span className="col-span-2">Lager</span>
                <span className="col-span-2" />
              </div>

              {variants.map((variant) => (
                <div key={variant.id} className="grid grid-cols-12 gap-2 items-center">
                  <input
                    type="text"
                    value={variant.title}
                    onChange={(e) => updateVariant(variant.id, "title", e.target.value)}
                    className="col-span-4 rounded-md border border-border bg-background px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <input
                    type="text"
                    value={variant.sku}
                    onChange={(e) => updateVariant(variant.id, "sku", e.target.value)}
                    className="col-span-2 rounded-md border border-border bg-background px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <input
                    type="number"
                    value={variant.price}
                    onChange={(e) => updateVariant(variant.id, "price", e.target.value)}
                    min="0"
                    step="1"
                    className="col-span-2 rounded-md border border-border bg-background px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <input
                    type="number"
                    value={variant.stock}
                    onChange={(e) => updateVariant(variant.id, "stock", e.target.value)}
                    min="0"
                    className="col-span-2 rounded-md border border-border bg-background px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <div className="col-span-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => removeVariant(variant.id)}
                      disabled={variants.length === 1}
                      className="rounded p-1 text-muted-foreground hover:text-red-500 transition-colors disabled:opacity-30"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
            >
              Avbryt
            </button>
            <button
              type="submit"
              disabled={saving || !title.trim()}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {saving ? "Sparar..." : "Spara ändringar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
