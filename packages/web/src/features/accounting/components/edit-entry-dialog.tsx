import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { AccountCategory, JournalEntry, VatRate } from "@crm/shared";
import { buildJournalEntry } from "../utils/journal-entry-builder";
import { useTransactionForm } from "../hooks/use-transaction-form";
import { cn } from "@/lib/utils";

interface EditEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: JournalEntry | null;
  categories: AccountCategory[];
  onSave: (id: string, data: Omit<JournalEntry, "id" | "createdAt" | "updatedAt">) => void;
}

const VAT_OPTIONS: { value: VatRate; label: string }[] = [
  { value: "25", label: "25%" },
  { value: "12", label: "12%" },
  { value: "6", label: "6%" },
  { value: "0", label: "0%" },
];

const INPUT_CLASS = "w-full rounded-md border border-border bg-background px-3 py-2 text-sm";

export function EditEntryDialog({ open, onOpenChange, entry, categories, onSave }: EditEntryDialogProps) {
  const form = useTransactionForm(categories, entry ? {
    transactionType: entry.transactionType,
    categoryId: entry.category,
    amount: String(entry.totalAmount),
    date: entry.date,
    description: entry.description,
    vatRate: entry.vatRate,
  } : undefined);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!entry || !form.selectedCategory || !form.amount || !form.date) return;

    const updated = buildJournalEntry({
      category: form.selectedCategory,
      totalAmount: parseFloat(form.amount),
      date: form.date,
      description: form.description,
      vatRate: form.vatRate,
    });

    onSave(entry.id, updated);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Verification</DialogTitle>
          <DialogDescription>
            Update the transaction details. The journal entry lines will be recalculated.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type toggle */}
          <div className="flex gap-2">
            {(["cost", "income"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => form.switchType(type)}
                className={cn(
                  "rounded-md px-4 py-2 text-sm font-medium transition-colors",
                  form.transactionType === type
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {type === "cost" ? "Cost" : "Income"}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Category */}
            <div>
              <label className="mb-1 block text-sm font-medium">Category</label>
              <select
                value={form.categoryId}
                onChange={(e) => form.handleCategoryChange(e.target.value)}
                className={INPUT_CLASS}
                required
              >
                <option value="">Select category...</option>
                {form.filteredCategories.map((cat: AccountCategory) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} ({cat.defaultAccountNumber})
                  </option>
                ))}
              </select>
            </div>

            {/* Amount */}
            <div>
              <label className="mb-1 block text-sm font-medium">Amount (incl. VAT)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.amount}
                onChange={(e) => form.setAmount(e.target.value)}
                placeholder="0.00"
                className={INPUT_CLASS}
                required
              />
            </div>

            {/* Date */}
            <div>
              <label className="mb-1 block text-sm font-medium">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => form.setDate(e.target.value)}
                className={INPUT_CLASS}
                required
              />
            </div>

            {/* VAT rate */}
            <div>
              <label className="mb-1 block text-sm font-medium">VAT Rate</label>
              <select
                value={form.vatRate}
                onChange={(e) => form.setVatRate(e.target.value as VatRate)}
                className={INPUT_CLASS}
              >
                {VAT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="mb-1 block text-sm font-medium">Description</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => form.setDescription(e.target.value)}
              placeholder="e.g. Office supplies purchase"
              className={INPUT_CLASS}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Save Changes
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
