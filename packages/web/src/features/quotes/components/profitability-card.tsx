import { Plus, Trash2 } from "lucide-react";
import { calcProfitability, type CostEntry } from "../utils/calculations";
import { cn } from "@/lib/utils";

const INPUT_CLASS =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors";

interface ProfitabilityCardProps {
  subtotal: number;
  mrr: number;
  estimatedHours: number;
  costs: CostEntry[];
  currency: string;
  onEstimatedHoursChange: (v: number) => void;
  onCostsChange: (costs: CostEntry[]) => void;
}

export function ProfitabilityCard({
  subtotal,
  mrr,
  estimatedHours,
  costs,
  currency,
  onEstimatedHoursChange,
  onCostsChange,
}: ProfitabilityCardProps) {
  const result = calcProfitability(subtotal, estimatedHours, costs);
  const isPositive = result.profit >= 0;

  function addCost() {
    onCostsChange([...costs, { label: "", amount: 0 }]);
  }

  function removeCost(index: number) {
    onCostsChange(costs.filter((_, i) => i !== index));
  }

  function updateCost(index: number, field: keyof CostEntry, value: string | number) {
    const updated = [...costs];
    updated[index] = { ...updated[index], [field]: value };
    onCostsChange(updated);
  }

  return (
    <div className="rounded-lg border border-border bg-background p-4 space-y-4">
      <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
        Profitability (internal)
      </h3>

      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          Estimated hours
        </label>
        <input
          className={INPUT_CLASS + " max-w-[200px]"}
          type="number"
          min="0"
          step="0.5"
          value={estimatedHours || ""}
          onChange={(e) =>
            onEstimatedHoursChange(parseFloat(e.target.value) || 0)
          }
          placeholder="0"
        />
      </div>

      {/* Costs list */}
      <div className="space-y-2">
        <label className="block text-xs font-medium text-muted-foreground">
          Costs
        </label>
        {costs.map((cost, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              className={INPUT_CLASS}
              value={cost.label}
              onChange={(e) => updateCost(i, "label", e.target.value)}
              placeholder="Cost label (e.g. Hosting)"
            />
            <input
              className={INPUT_CLASS + " w-32 shrink-0"}
              type="number"
              min="0"
              step="1"
              value={cost.amount || ""}
              onChange={(e) =>
                updateCost(i, "amount", parseFloat(e.target.value) || 0)
              }
              placeholder="0"
            />
            <button
              type="button"
              onClick={() => removeCost(i)}
              className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addCost}
          className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add cost
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 pt-2 border-t border-border">
        <div>
          <p className="text-xs text-muted-foreground">Total Costs</p>
          <p className="text-sm font-medium tabular-nums">
            {result.totalCost.toLocaleString("sv-SE", {
              minimumFractionDigits: 2,
            })}{" "}
            {currency}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Revenue</p>
          <p className="text-sm font-medium tabular-nums">
            {result.revenue.toLocaleString("sv-SE", {
              minimumFractionDigits: 2,
            })}{" "}
            {currency}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Profit</p>
          <p
            className={cn(
              "text-sm font-semibold tabular-nums",
              isPositive ? "text-green-600" : "text-red-600"
            )}
          >
            {result.profit.toLocaleString("sv-SE", {
              minimumFractionDigits: 2,
            })}{" "}
            {currency}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Per Hour</p>
          <p
            className={cn(
              "text-sm font-semibold tabular-nums",
              isPositive ? "text-green-600" : "text-red-600"
            )}
          >
            {estimatedHours > 0
              ? `${result.perHour.toLocaleString("sv-SE", { minimumFractionDigits: 2 })} ${currency}/h`
              : "-"}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">MRR</p>
          <p className="text-sm font-semibold tabular-nums text-blue-600">
            {mrr.toLocaleString("sv-SE", {
              minimumFractionDigits: 2,
            })}{" "}
            {currency}
          </p>
        </div>
      </div>
    </div>
  );
}
