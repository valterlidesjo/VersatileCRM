import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import type { Invoice, Customer } from "@crm/shared";
import { INVOICE_STATUS_LABELS } from "@crm/shared";
import { cn } from "@/lib/utils";
import { ChevronRight, ChevronDown, Trash2 } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  created: "bg-yellow-100 text-yellow-700",
  sent: "bg-blue-100 text-blue-700",
  paid: "bg-green-100 text-green-700",
  overdue: "bg-red-100 text-red-700",
  cancelled: "bg-muted text-muted-foreground",
};

interface InvoiceListProps {
  invoices: Invoice[];
  customers: Customer[];
  onDelete: (id: string) => Promise<void>;
}

export function InvoiceList({ invoices, customers, onDelete }: InvoiceListProps) {
  const navigate = useNavigate();
  const [cancelledExpanded, setCancelledExpanded] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const active = invoices.filter((inv) => inv.status !== "cancelled");
  const cancelled = invoices.filter((inv) => inv.status === "cancelled");

  function customerName(id: string): string {
    return customers.find((c) => c.id === id)?.name ?? "Unknown";
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await onDelete(id);
      setConfirmDeleteId(null);
    } finally {
      setDeletingId(null);
    }
  }

  function navigateToInvoice(id: string) {
    navigate({ to: "/invoicing/$invoiceId", params: { invoiceId: id } });
  }

  const tableHeader = (
    <tr className="border-b border-border bg-muted/30">
      <th className="py-2.5 px-4 text-left font-medium text-muted-foreground">
        Invoice #
      </th>
      <th className="py-2.5 px-4 text-left font-medium text-muted-foreground">
        Reference
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
        Due Date
      </th>
      <th className="py-2.5 px-4 text-left font-medium text-muted-foreground">
        Created
      </th>
    </tr>
  );

  if (invoices.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No invoices yet. Create your first invoice above.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {active.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No active invoices.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>{tableHeader}</thead>
            <tbody>
              {active.map((inv) => (
                <tr
                  key={inv.id}
                  onClick={() => navigateToInvoice(inv.id)}
                  className="border-b border-border last:border-b-0 hover:bg-muted/20 transition-colors cursor-pointer"
                >
                  <td className="py-2.5 px-4 font-medium">{inv.invoiceNumber}</td>
                  <td className="py-2.5 px-4 font-mono text-xs">{inv.invoiceRef}</td>
                  <td className="py-2.5 px-4">{customerName(inv.customerId)}</td>
                  <td className="py-2.5 px-4 text-right tabular-nums">
                    {inv.totalAmount.toLocaleString("sv-SE", {
                      minimumFractionDigits: 2,
                    })}{" "}
                    {inv.currency}
                  </td>
                  <td className="py-2.5 px-4">
                    <span
                      className={cn(
                        "inline-block rounded-full px-2.5 py-0.5 text-xs font-medium",
                        STATUS_COLORS[inv.status] ?? STATUS_COLORS.draft
                      )}
                    >
                      {INVOICE_STATUS_LABELS[inv.status]}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-muted-foreground">
                    {inv.dueDate}
                  </td>
                  <td className="py-2.5 px-4 text-muted-foreground">
                    {inv.createdAt.slice(0, 10)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {cancelled.length > 0 && (
        <div className="rounded-lg border border-border">
          <button
            type="button"
            onClick={() => setCancelledExpanded((v) => !v)}
            className="flex w-full items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {cancelledExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            <span className="h-2.5 w-2.5 rounded-full bg-gray-400" />
            Cancelled ({cancelled.length})
          </button>

          {cancelledExpanded && (
            <div className="border-t border-border overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="py-2.5 px-4 text-left font-medium text-muted-foreground">
                      Invoice #
                    </th>
                    <th className="py-2.5 px-4 text-left font-medium text-muted-foreground">
                      Reference
                    </th>
                    <th className="py-2.5 px-4 text-left font-medium text-muted-foreground">
                      Customer
                    </th>
                    <th className="py-2.5 px-4 text-right font-medium text-muted-foreground">
                      Total
                    </th>
                    <th className="py-2.5 px-4 text-left font-medium text-muted-foreground">
                      Reason
                    </th>
                    <th className="py-2.5 px-4 text-left font-medium text-muted-foreground">
                      Cancelled
                    </th>
                    <th className="py-2.5 px-4" />
                  </tr>
                </thead>
                <tbody>
                  {cancelled.map((inv) => (
                    <tr
                      key={inv.id}
                      className="border-b border-border last:border-b-0"
                    >
                      <td
                        className="py-2.5 px-4 font-medium cursor-pointer hover:underline"
                        onClick={() => navigateToInvoice(inv.id)}
                      >
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-xs">
                        {inv.invoiceRef}
                      </td>
                      <td className="py-2.5 px-4">
                        {customerName(inv.customerId)}
                      </td>
                      <td className="py-2.5 px-4 text-right tabular-nums text-muted-foreground">
                        {inv.totalAmount.toLocaleString("sv-SE", {
                          minimumFractionDigits: 2,
                        })}{" "}
                        {inv.currency}
                      </td>
                      <td className="py-2.5 px-4 text-muted-foreground max-w-xs truncate">
                        {inv.cancellationReason ?? "—"}
                      </td>
                      <td className="py-2.5 px-4 text-muted-foreground">
                        {inv.updatedAt.slice(0, 10)}
                      </td>
                      <td className="py-2.5 px-4">
                        {confirmDeleteId === inv.id ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground whitespace-nowrap">
                              Delete invoice?
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDelete(inv.id)}
                              disabled={deletingId === inv.id}
                              className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50 whitespace-nowrap"
                            >
                              {deletingId === inv.id ? "Deleting..." : "Yes, delete"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(inv.id)}
                            className="flex items-center gap-1.5 rounded-md border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
