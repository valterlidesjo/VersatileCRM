import { useNavigate } from "@tanstack/react-router";
import type { Quote, Customer } from "@crm/shared";
import { QUOTE_STATUS_LABELS } from "@crm/shared";
import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  created: "bg-yellow-100 text-yellow-700",
  sent: "bg-blue-100 text-blue-700",
  accepted: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

interface QuoteListProps {
  quotes: Quote[];
  customers: Customer[];
}

export function QuoteList({ quotes, customers }: QuoteListProps) {
  const navigate = useNavigate();

  function customerName(id: string): string {
    return customers.find((c) => c.id === id)?.name ?? "Unknown";
  }

  if (quotes.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No quotes yet. Create your first quote above.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            <th className="py-2.5 px-4 text-left font-medium text-muted-foreground">
              Quote #
            </th>
            <th className="py-2.5 px-4 text-left font-medium text-muted-foreground">
              Customer
            </th>
            <th className="py-2.5 px-4 text-right font-medium text-muted-foreground">
              Total
            </th>
            <th className="py-2.5 px-4 text-left font-medium text-muted-foreground">
              Status
            </th>
            <th className="py-2.5 px-4 text-left font-medium text-muted-foreground">
              Valid Until
            </th>
            <th className="py-2.5 px-4 text-left font-medium text-muted-foreground">
              Created
            </th>
          </tr>
        </thead>
        <tbody>
          {quotes.map((q) => (
            <tr
              key={q.id}
              onClick={() =>
                navigate({ to: "/quotes/$quoteId", params: { quoteId: q.id } })
              }
              className="border-b border-border last:border-b-0 cursor-pointer hover:bg-muted/20 transition-colors"
            >
              <td className="py-2.5 px-4 font-medium">{q.quoteNumber}</td>
              <td className="py-2.5 px-4">{customerName(q.customerId)}</td>
              <td className="py-2.5 px-4 text-right tabular-nums">
                {q.totalAmount.toLocaleString("sv-SE", {
                  minimumFractionDigits: 2,
                })}{" "}
                {q.currency}
              </td>
              <td className="py-2.5 px-4">
                <span
                  className={cn(
                    "inline-block rounded-full px-2.5 py-0.5 text-xs font-medium",
                    STATUS_COLORS[q.status] ?? STATUS_COLORS.draft
                  )}
                >
                  {QUOTE_STATUS_LABELS[q.status]}
                </span>
              </td>
              <td className="py-2.5 px-4 text-muted-foreground">
                {q.validUntil}
              </td>
              <td className="py-2.5 px-4 text-muted-foreground">
                {q.createdAt.slice(0, 10)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
