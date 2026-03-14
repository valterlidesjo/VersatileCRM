import { ACCOUNT_CATEGORIES } from "@crm/shared";
import { buildJournalEntry } from "./journal-entry-builder";
import type { JournalEntry, VatRate } from "@crm/shared";

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

export interface ParsedImportEntry
  extends Omit<JournalEntry, "id" | "createdAt" | "updatedAt"> {
  // same fields, just used for preview
}

export interface ImportEntriesResult {
  entries: ParsedImportEntry[];
  errors: string[];
  warnings: string[];
}

const VALID_VAT_RATES = new Set<string>(["0", "6", "12", "25"]);

export function parseEntriesCsv(csvText: string): ImportEntriesResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const entries: ParsedImportEntry[] = [];

  const lines = csvText
    .replace(/^\uFEFF/, "") // strip BOM
    .split("\n")
    .map((l) => l.trimEnd())
    .filter((l) => l.length > 0);

  if (lines.length < 2) {
    errors.push("CSV-filen verkar vara tom eller saknar datarader.");
    return { entries, errors, warnings };
  }

  const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase().trim());

  function col(name: string): number {
    return headers.indexOf(name);
  }

  const dateIdx = col("date");
  const descIdx = col("description");
  const typeIdx = col("transactiontype");
  const catIdx = col("category");
  const amtIdx = col("totalamount");
  const vatRateIdx = col("vatrate");

  const missing: string[] = [];
  if (dateIdx === -1) missing.push("date");
  if (typeIdx === -1) missing.push("transactionType");
  if (catIdx === -1) missing.push("category");
  if (amtIdx === -1) missing.push("totalAmount");

  if (missing.length > 0) {
    errors.push(`Obligatoriska kolumner saknas: ${missing.join(", ")}`);
    return { entries, errors, warnings };
  }

  for (let i = 1; i < lines.length; i++) {
    const row = parseCsvLine(lines[i]);
    const rowNum = i + 1;

    const date = row[dateIdx] ?? "";
    const description = descIdx !== -1 ? (row[descIdx] ?? "") : "";
    const transactionType = (row[typeIdx] ?? "").toLowerCase();
    const categoryId = row[catIdx] ?? "";
    const totalAmountStr = row[amtIdx] ?? "";
    const vatRateStr = vatRateIdx !== -1 ? (row[vatRateIdx] ?? "").trim() : "";

    // Validate date
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      errors.push(
        `Rad ${rowNum}: Ogiltigt datum "${date}". Förväntar YYYY-MM-DD.`
      );
      continue;
    }

    // Validate transactionType
    if (transactionType !== "cost" && transactionType !== "income") {
      errors.push(
        `Rad ${rowNum}: Ogiltigt transaktionstyp "${transactionType}". Måste vara "cost" eller "income".`
      );
      continue;
    }

    // Validate category
    const category = ACCOUNT_CATEGORIES.find((c) => c.id === categoryId);
    if (!category) {
      errors.push(
        `Rad ${rowNum}: Okänd kategori "${categoryId}". Se listan med tillgängliga kategorier i dialogen.`
      );
      continue;
    }

    if (category.transactionType !== transactionType) {
      errors.push(
        `Rad ${rowNum}: Kategori "${categoryId}" är en ${category.transactionType === "cost" ? "kostnad" : "inkomst"}-kategori men transactionType är "${transactionType}".`
      );
      continue;
    }

    // Validate amount
    const totalAmount = parseFloat(totalAmountStr.replace(",", "."));
    if (isNaN(totalAmount) || totalAmount <= 0) {
      errors.push(
        `Rad ${rowNum}: Ogiltigt belopp "${totalAmountStr}". Måste vara ett positivt tal.`
      );
      continue;
    }

    // VAT rate (optional — defaults to category default)
    let vatRate: VatRate = category.defaultVatRate;
    if (vatRateStr !== "") {
      if (VALID_VAT_RATES.has(vatRateStr)) {
        vatRate = vatRateStr as VatRate;
      } else {
        warnings.push(
          `Rad ${rowNum}: Ogiltigt momssats "${vatRateStr}", använder kategorins standard (${category.defaultVatRate}%).`
        );
      }
    }

    const entry = buildJournalEntry({
      category,
      totalAmount,
      date,
      description: description || category.name,
      vatRate,
    });

    entries.push(entry);
  }

  return { entries, errors, warnings };
}

// CSV template that users can download
export const CSV_TEMPLATE = `date,description,transactionType,category,totalAmount,vatRate
2024-01-15,Kontorsmaterial från Staples,cost,office_supplies,1250.00,25
2024-01-20,Månadsfaktura telefonabonnemang,cost,telecom,499.00,25
2024-01-31,Konsultarvode kund AB,income,service_sales_25,15000.00,25
2024-02-05,Redovisningsbyrå februari,cost,accounting_services,2500.00,25
2024-02-10,Försäljning varor,income,goods_sales_25,8500.00,25
`;

// Reference list of all valid category IDs
export const CATEGORY_REFERENCE = ACCOUNT_CATEGORIES.map((c) => ({
  id: c.id,
  name: c.name,
  type: c.transactionType,
  defaultVatRate: c.defaultVatRate,
}));
