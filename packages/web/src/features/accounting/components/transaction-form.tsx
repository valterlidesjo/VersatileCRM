import { useState } from "react";
import type { AccountCategory, JournalEntry, VatRate } from "@crm/shared";
import { buildJournalEntry } from "../utils/journal-entry-builder";
import { useTransactionForm } from "../hooks/use-transaction-form";
import { AddCategoryDialog } from "./add-category-dialog";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

interface TransactionFormProps {
  categories: AccountCategory[];
  onSubmit: (entry: Omit<JournalEntry, "id" | "createdAt" | "updatedAt">) => void;
  onAddCategory: (cat: Omit<AccountCategory, "id">) => Promise<void>;
}

const VAT_OPTIONS: { value: VatRate; label: string }[] = [
  { value: "25", label: "25%" },
  { value: "12", label: "12%" },
  { value: "6", label: "6%" },
  { value: "0", label: "0%" },
];

export function TransactionForm({ categories, onSubmit, onAddCategory }: TransactionFormProps) {
  const form = useTransactionForm(categories);
  const [showAddCategory, setShowAddCategory] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form.selectedCategory || !form.amount || !form.date) return;

    const entry = buildJournalEntry({
      category: form.selectedCategory,
      totalAmount: parseFloat(form.amount),
      date: form.date,
      description: form.description,
      vatRate: form.vatRate,
    });

    onSubmit(entry);
    form.reset();
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-border bg-background p-4">
        <h3 className="text-lg font-medium">New Transaction</h3>

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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Category */}
          <div>
            <label className="mb-1 block text-sm font-medium">Category</label>
            <div className="flex gap-1">
              <select
                value={form.categoryId}
                onChange={(e) => form.handleCategoryChange(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                required
              >
                <option value="">Select category...</option>
                {form.filteredCategories.map((cat: AccountCategory) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} ({cat.defaultAccountNumber})
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowAddCategory(true)}
                title="Add category"
                className="flex-shrink-0 rounded-md border border-border bg-background px-2 py-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
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
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
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
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              required
            />
          </div>

          {/* VAT rate */}
          <div>
            <label className="mb-1 block text-sm font-medium">VAT Rate</label>
            <select
              value={form.vatRate}
              onChange={(e) => form.setVatRate(e.target.value as VatRate)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
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
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </div>

        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Add Entry
        </button>
      </form>

      <AddCategoryDialog
        open={showAddCategory}
        defaultType={form.transactionType}
        onAdd={onAddCategory}
        onClose={() => setShowAddCategory(false)}
      />
    </>
  );
}
