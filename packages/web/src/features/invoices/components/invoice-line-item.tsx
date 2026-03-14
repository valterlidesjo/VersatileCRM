import { Trash2 } from "lucide-react";
import { calcLineTotal, calcLineVat } from "../utils/calculations";
import type { InvoiceLineData } from "../utils/calculations";
import type { VatRateType } from "@crm/shared";

const INPUT_CLASS =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors";

const VAT_OPTIONS: { value: VatRateType; label: string }[] = [
  { value: "25", label: "25%" },
  { value: "12", label: "12%" },
  { value: "6", label: "6%" },
  { value: "0", label: "0%" },
];

interface InvoiceLineItemProps {
  item: InvoiceLineData;
  index: number;
  onChange: (index: number, field: keyof InvoiceLineData, value: string | number) => void;
  onRemove: (index: number) => void;
  currency: string;
}

export function InvoiceLineItem({
  item,
  index,
  onChange,
  onRemove,
  currency,
}: InvoiceLineItemProps) {
  const lineTotal = calcLineTotal(item.quantity, item.unitPrice);
  const lineVat = calcLineVat(item.quantity, item.unitPrice, item.vatRate);

  return (
    <tr className="border-b border-border last:border-b-0">
      <td className="py-2 pr-2">
        <input
          className={INPUT_CLASS}
          value={item.description}
          onChange={(e) => onChange(index, "description", e.target.value)}
          placeholder="Article description"
        />
      </td>
      <td className="py-2 px-2">
        <input
          className={INPUT_CLASS + " w-20 text-right"}
          type="number"
          min="0"
          step="1"
          value={item.quantity || ""}
          onChange={(e) =>
            onChange(index, "quantity", parseFloat(e.target.value) || 0)
          }
        />
      </td>
      <td className="py-2 px-2">
        <input
          className={INPUT_CLASS + " w-28 text-right"}
          type="number"
          min="0"
          step="0.01"
          value={item.unitPrice || ""}
          onChange={(e) =>
            onChange(index, "unitPrice", parseFloat(e.target.value) || 0)
          }
        />
      </td>
      <td className="py-2 px-2">
        <select
          className={INPUT_CLASS + " w-24"}
          value={item.vatRate}
          onChange={(e) => onChange(index, "vatRate", e.target.value)}
        >
          {VAT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </td>
      <td className="py-2 px-2 text-right text-sm tabular-nums whitespace-nowrap">
        {lineTotal.toLocaleString("sv-SE", { minimumFractionDigits: 2 })} {currency}
      </td>
      <td className="py-2 px-2 text-right text-sm tabular-nums text-muted-foreground whitespace-nowrap">
        {lineVat.toLocaleString("sv-SE", { minimumFractionDigits: 2 })}
      </td>
      <td className="py-2 pl-2">
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );
}
