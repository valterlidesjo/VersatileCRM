import { Package, CheckCircle, XCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PurchaseOrder } from "@crm/shared";

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    icon: Clock,
    className: "bg-yellow-50 text-yellow-700 border-yellow-200",
  },
  received: {
    label: "Received",
    icon: CheckCircle,
    className: "bg-green-50 text-green-700 border-green-200",
  },
  cancelled: {
    label: "Cancelled",
    icon: XCircle,
    className: "bg-red-50 text-red-600 border-red-200",
  },
} as const;

interface PurchaseOrderListProps {
  orders: PurchaseOrder[];
  onReceive: (order: PurchaseOrder) => void;
  onCancel: (id: string) => void;
}

export function PurchaseOrderList({
  orders,
  onReceive,
  onCancel,
}: PurchaseOrderListProps) {
  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
        <Package className="mb-3 h-8 w-8 text-muted-foreground/40" />
        <p className="text-sm font-medium text-muted-foreground">
          No purchase orders
        </p>
        <p className="mt-1 text-xs text-muted-foreground/70">
          Create a new order to track supplier purchases
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
              Supplier
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
              Date
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
              Items
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
              Total (SEK)
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
              Status
            </th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {orders.map((order) => {
            const status = STATUS_CONFIG[order.status];
            const StatusIcon = status.icon;
            return (
              <tr
                key={order.id}
                className="bg-background transition-colors hover:bg-muted/30"
              >
                <td className="px-4 py-3 font-medium">{order.supplierName}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {order.orderDate}
                  {order.expectedDeliveryDate && (
                    <div className="text-xs text-muted-foreground/70">
                      Delivery: {order.expectedDeliveryDate}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {order.items.length === 1
                    ? "1 item"
                    : `${order.items.length} items`}
                </td>
                <td className="px-4 py-3 text-right font-medium tabular-nums">
                  {order.totalCostSEK.toLocaleString("sv-SE", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  kr
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
                      status.className
                    )}
                  >
                    <StatusIcon className="h-3 w-3" />
                    {status.label}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {order.status === "pending" && (
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onReceive(order)}
                        className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                      >
                        Receive
                      </button>
                      <button
                        type="button"
                        onClick={() => onCancel(order.id)}
                        className="rounded-md border border-border px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
