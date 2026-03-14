import { useState, useRef } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { usePartner } from "@/lib/partner";
import { useProducts } from "../hooks/use-products";
import { X, Plus, Trash2, Upload, ImageIcon } from "lucide-react";

interface VariantRow {
  title: string;
  price: string;
  stock: string;
  sku: string;
}

interface AddProductDialogProps {
  onClose: () => void;
}

export function AddProductDialog({ onClose }: AddProductDialogProps) {
  const { partnerId } = usePartner();
  const { addProduct } = useProducts();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [vendor, setVendor] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [variants, setVariants] = useState<VariantRow[]>([
    { title: "", price: "", stock: "0", sku: "" },
  ]);
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
      { title: "", price: "", stock: "0", sku: "" },
    ]);
  }

  function removeVariant(index: number) {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  }

  function updateVariant(index: number, field: keyof VariantRow, value: string) {
    setVariants((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [field]: value } : v))
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    setError(null);

    try {
      let imageUrl: string | undefined;

      if (imageFile) {
        const productId = crypto.randomUUID();
        const storageRef = ref(
          storage,
          `partners/${partnerId}/products/${productId}/cover`
        );
        await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(storageRef);
      }

      await addProduct({
        title: title.trim(),
        description: description.trim() || undefined,
        vendor: vendor.trim() || undefined,
        imageUrl,
        status: "active",
        variants: variants
          .filter((v) => v.title.trim())
          .map((v) => ({
            title: v.title.trim(),
            sku: v.sku.trim() || undefined,
            price: v.price ? parseFloat(v.price) : undefined,
            stock: parseInt(v.stock, 10) || 0,
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
          <h2 className="text-lg font-semibold">Ny produkt</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
                placeholder="T.ex. Rund spegel"
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
                placeholder="Valfritt"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Beskrivning
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Valfritt"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              />
            </div>
          </div>

          {/* Image upload */}
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Produktbild
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border py-8 hover:border-primary/50 hover:bg-muted/30 transition-colors"
            >
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Förhandsvisning"
                  className="max-h-40 rounded-md object-contain"
                />
              ) : (
                <>
                  <ImageIcon className="mb-2 h-8 w-8 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">
                    Klicka för att ladda upp bild
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground/70">
                    PNG, JPG, WEBP
                  </p>
                </>
              )}
            </div>
            {imagePreview && (
              <button
                type="button"
                onClick={() => {
                  setImageFile(null);
                  setImagePreview(null);
                }}
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
                <span className="col-span-4">Namn (t.ex. 50cm)</span>
                <span className="col-span-2">SKU</span>
                <span className="col-span-2">Pris (kr)</span>
                <span className="col-span-2">Lager</span>
                <span className="col-span-2" />
              </div>

              {variants.map((variant, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <input
                    type="text"
                    value={variant.title}
                    onChange={(e) => updateVariant(i, "title", e.target.value)}
                    placeholder="50cm"
                    className="col-span-4 rounded-md border border-border bg-background px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <input
                    type="text"
                    value={variant.sku}
                    onChange={(e) => updateVariant(i, "sku", e.target.value)}
                    placeholder="SPG-50"
                    className="col-span-2 rounded-md border border-border bg-background px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <input
                    type="number"
                    value={variant.price}
                    onChange={(e) => updateVariant(i, "price", e.target.value)}
                    placeholder="0"
                    min="0"
                    step="1"
                    className="col-span-2 rounded-md border border-border bg-background px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <input
                    type="number"
                    value={variant.stock}
                    onChange={(e) => updateVariant(i, "stock", e.target.value)}
                    placeholder="0"
                    min="0"
                    className="col-span-2 rounded-md border border-border bg-background px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <div className="col-span-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => removeVariant(i)}
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
              {saving ? "Sparar..." : "Spara produkt"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
