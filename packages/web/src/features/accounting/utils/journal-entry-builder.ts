import type {
  AccountCategory,
  JournalEntry,
  JournalEntryLine,
  VatRate,
} from "@crm/shared";
import { BAS_ACCOUNTS } from "@crm/shared";

function getAccountName(accountNumber: string): string {
  const account = BAS_ACCOUNTS.find((a) => a.number === accountNumber);
  return account?.name ?? accountNumber;
}

function computeVat(amountInclVat: number, vatRatePercent: number) {
  const vatAmount = amountInclVat - amountInclVat / (1 + vatRatePercent / 100);
  const netAmount = amountInclVat - vatAmount;
  return {
    netAmount: Math.round(netAmount * 100) / 100,
    vatAmount: Math.round(vatAmount * 100) / 100,
  };
}

export function buildJournalEntry(params: {
  category: AccountCategory;
  totalAmount: number;
  date: string;
  description: string;
  vatRate: VatRate;
}): Omit<JournalEntry, "id" | "createdAt" | "updatedAt"> {
  const { category, totalAmount, date, description, vatRate } = params;
  const vatRatePercent = Number(vatRate);
  const { netAmount, vatAmount } = computeVat(totalAmount, vatRatePercent);

  const lines: JournalEntryLine[] = [];

  if (category.transactionType === "cost") {
    // Expense account: debit net amount
    lines.push({
      accountNumber: category.defaultAccountNumber,
      accountName: getAccountName(category.defaultAccountNumber),
      debit: netAmount,
      credit: 0,
    });

    // VAT account: debit VAT amount (ingående moms)
    if (vatAmount > 0) {
      lines.push({
        accountNumber: category.vatAccountNumber,
        accountName: getAccountName(category.vatAccountNumber),
        debit: vatAmount,
        credit: 0,
      });
    }

    // Payment account: credit total (bank decreases)
    lines.push({
      accountNumber: category.paymentAccountNumber,
      accountName: getAccountName(category.paymentAccountNumber),
      debit: 0,
      credit: totalAmount,
    });
  } else {
    // Income: payment account debited (bank increases)
    lines.push({
      accountNumber: category.paymentAccountNumber,
      accountName: getAccountName(category.paymentAccountNumber),
      debit: totalAmount,
      credit: 0,
    });

    // Revenue account: credit net amount
    lines.push({
      accountNumber: category.defaultAccountNumber,
      accountName: getAccountName(category.defaultAccountNumber),
      debit: 0,
      credit: netAmount,
    });

    // VAT account: credit VAT amount (utgående moms)
    if (vatAmount > 0) {
      lines.push({
        accountNumber: category.vatAccountNumber,
        accountName: getAccountName(category.vatAccountNumber),
        debit: 0,
        credit: vatAmount,
      });
    }
  }

  return {
    date,
    description,
    transactionType: category.transactionType,
    category: category.id,
    totalAmount,
    vatRate,
    vatAmount,
    lines,
  };
}
