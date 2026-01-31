import { useState } from "react";
import { ACCOUNT_CATEGORIES } from "@crm/shared";
import type { AccountCategory, JournalEntry, VatRate } from "@crm/shared";
import { buildJournalEntry } from "../utils/journal-entry-builder";
import { cn } from "@/lib/utils";

interface TransactionFormProps {
  onSubmit: (entry: Omit<JournalEntry, "id" | "createdAt" | "updatedAt">) => void;
}

const VAT_OPTIONS: { value: VatRate; label: string }[] = [
  { value: "25", label: "25%" },
  { value: "12", label: "12%" },
  { value: "6", label: "6%" },
  { value: "0", label: "0%" },
];

export function TransactionForm({ onSubmit }: TransactionFormProps) {
  const [transactionType, setTransactionType] = useState<"cost" | "income">("cost");
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState("");
  const [vatRate, setVatRate] = useState<VatRate>("25");

  const filteredCategories = ACCOUNT_CATEGORIES.filter(
    (c) => c.transactionType === transactionType
  );

  const selectedCategory = ACCOUNT_CATEGORIES.find((c) => c.id === categoryId);

  function handleCategoryChange(id: string) {
    setCategoryId(id);
    const cat = ACCOUNT_CATEGORIES.find((c) => c.id === id);
    if (cat) {
      setVatRate(cat.defaultVatRate);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCategory || !amount || !date) return;

    const entry = buildJournalEntry({
      category: selectedCategory,
      totalAmount: parseFloat(amount),
      date,
      description,
      vatRate,
    });

    onSubmit(entry);
    setAmount("");
    setDescription("");
    setCategoryId("");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-border bg-background p-4">
      <h3 className="text-lg font-medium">Ny transaktion</h3>

      {/* Type toggle */}
      <div className="flex gap-2">
        {(["cost", "income"] as const).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => {
              setTransactionType(type);
              setCategoryId("");
            }}
            className={cn(
              "rounded-md px-4 py-2 text-sm font-medium transition-colors",
              transactionType === type
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {type === "cost" ? "Kostnad" : "Intäkt"}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Category */}
        <div>
          <label className="mb-1 block text-sm font-medium">Kategori</label>
          <select
            value={categoryId}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            required
          >
            <option value="">Välj kategori...</option>
            {filteredCategories.map((cat: AccountCategory) => (
              <option key={cat.id} value={cat.id}>
                {cat.name} ({cat.defaultAccountNumber})
              </option>
            ))}
          </select>
        </div>

        {/* Amount */}
        <div>
          <label className="mb-1 block text-sm font-medium">Belopp (inkl. moms)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            required
          />
        </div>

        {/* Date */}
        <div>
          <label className="mb-1 block text-sm font-medium">Datum</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            required
          />
        </div>

        {/* VAT rate */}
        <div>
          <label className="mb-1 block text-sm font-medium">Momssats</label>
          <select
            value={vatRate}
            onChange={(e) => setVatRate(e.target.value as VatRate)}
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
        <label className="mb-1 block text-sm font-medium">Beskrivning</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="T.ex. Inköp kontorsmaterial Kjell & Co"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
      </div>

      <button
        type="submit"
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Lägg till
      </button>
    </form>
  );
}
