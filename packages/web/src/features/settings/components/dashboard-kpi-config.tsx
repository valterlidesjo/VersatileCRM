import { useState, useEffect } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { usePartner } from "@/lib/partner";
import {
  KPI_IDS,
  KPI_CATALOG,
  DEFAULT_DASHBOARD_KPIS,
  type KpiId,
} from "@/features/dashboard/utils/kpi-catalog";

export function DashboardKpiConfig() {
  const { partnerId, dashboardKpis } = usePartner();

  // Initialise from current partner config once it loads
  const [enabled, setEnabled] = useState<Set<KpiId>>(
    () => new Set(DEFAULT_DASHBOARD_KPIS)
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Sync local state once dashboardKpis loads from Firestore
  useEffect(() => {
    if (dashboardKpis === null) return; // still loading — keep defaults
    const active =
      dashboardKpis.length > 0
        ? (dashboardKpis.filter((id) => id in KPI_CATALOG) as KpiId[])
        : DEFAULT_DASHBOARD_KPIS;
    setEnabled(new Set(active));
  }, [dashboardKpis]);

  const toggle = (id: KpiId) => {
    setEnabled((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    setSaved(false);
    setError(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      // Preserve the KPI_IDS order so the dashboard renders them consistently
      const ordered = KPI_IDS.filter((id) => enabled.has(id));
      await updateDoc(doc(db, "partners", partnerId), {
        dashboardKpis: ordered,
      });
      setSaved(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Kunde inte spara inställningar"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Dashboard KPIer</h2>
        <p className="text-sm text-muted-foreground">
          Välj vilka KPIer som visas på dashboard för den här partnern.
        </p>
      </div>

      <div className="rounded-lg border border-border divide-y divide-border">
        {KPI_IDS.map((id) => {
          const meta = KPI_CATALOG[id];
          const isEnabled = enabled.has(id);
          return (
            <label
              key={id}
              className="flex items-start gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <input
                type="checkbox"
                checked={isEnabled}
                onChange={() => toggle(id)}
                className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-none">{meta.label}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {meta.description}
                  {meta.timeSensitive && (
                    <span className="ml-1 text-xs text-primary/70">· påverkas av tidsfilter</span>
                  )}
                </p>
              </div>
            </label>
          );
        })}
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {saving ? "Sparar..." : "Spara"}
        </button>
        {saved && (
          <p className="text-sm text-muted-foreground">Sparat!</p>
        )}
      </div>
    </div>
  );
}
