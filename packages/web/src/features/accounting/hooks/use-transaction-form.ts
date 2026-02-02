import { useState } from "react";
import { ACCOUNT_CATEGORIES } from "@crm/shared";
import type { VatRate } from "@crm/shared";

export function useTransactionForm(initial?: {
  transactionType: "cost" | "income";
  categoryId: string;
  amount: string;
  date: string;
  description: string;
  vatRate: VatRate;
}) {
  const [transactionType, setTransactionType] = useState<"cost" | "income">(
    initial?.transactionType ?? "cost"
  );
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? "");
  const [amount, setAmount] = useState(initial?.amount ?? "");
  const [date, setDate] = useState(
    initial?.date ?? new Date().toISOString().slice(0, 10)
  );
  const [description, setDescription] = useState(initial?.description ?? "");
  const [vatRate, setVatRate] = useState<VatRate>(initial?.vatRate ?? "25");

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

  function switchType(type: "cost" | "income") {
    setTransactionType(type);
    setCategoryId("");
  }

  function reset() {
    setAmount("");
    setDescription("");
    setCategoryId("");
  }

  function populate(entry: {
    transactionType: "cost" | "income";
    category: string;
    totalAmount: number;
    date: string;
    description: string;
    vatRate: VatRate;
  }) {
    setTransactionType(entry.transactionType);
    setCategoryId(entry.category);
    setAmount(String(entry.totalAmount));
    setDate(entry.date);
    setDescription(entry.description);
    setVatRate(entry.vatRate);
  }

  return {
    transactionType,
    categoryId,
    amount,
    date,
    description,
    vatRate,
    setAmount,
    setDate,
    setDescription,
    setVatRate,
    filteredCategories,
    selectedCategory,
    handleCategoryChange,
    switchType,
    reset,
    populate,
  };
}
