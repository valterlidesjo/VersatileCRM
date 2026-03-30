/**
 * KPI catalog — single source of truth for all available dashboard KPIs.
 *
 * KPI data flow:
 *   Firestore partner doc (.dashboardKpis[]) ──▶ usePartner()
 *     undefined → DEFAULT_DASHBOARD_KPIS (all e-com KPIs)
 *     []        → also falls back to DEFAULT_DASHBOARD_KPIS
 *     [id, …]   → render only those IDs, in order
 *
 * Time-sensitive KPIs respect the dashboard period toggle.
 * Point-in-time KPIs (inventory, customers) are not affected by the period.
 */

export const KPI_IDS = [
  "shopify_revenue",
  "shopify_orders",
  "inventory_retail_value",
  "inventory_cost_value",
  "inventory_units",
  "total_income",
  "active_customers",
  "mrr",
  "meetings_this_week",
] as const;

export type KpiId = (typeof KPI_IDS)[number];

export interface KpiMeta {
  label: string;
  description: string;
  /** True = value changes when user switches time period. */
  timeSensitive: boolean;
}

export const KPI_CATALOG: Record<KpiId, KpiMeta> = {
  shopify_revenue: {
    label: "Shopify-intäkter",
    description: "Intäkter från Shopify-ordrar under vald period",
    timeSensitive: true,
  },
  shopify_orders: {
    label: "Shopify-ordrar",
    description: "Antal Shopify-ordrar under vald period",
    timeSensitive: true,
  },
  inventory_retail_value: {
    label: "Lagervärde (pris)",
    description: "Aktuellt lagervärde: lagerantal × försäljningspris",
    timeSensitive: false,
  },
  inventory_cost_value: {
    label: "Lagervärde (kostnad)",
    description: "Aktuellt lagervärde: lagerantal × inköpspris",
    timeSensitive: false,
  },
  inventory_units: {
    label: "Lagerenheter",
    description: "Totalt antal enheter i lager just nu",
    timeSensitive: false,
  },
  total_income: {
    label: "Total intäkt",
    description: "Totala intäkter under vald period",
    timeSensitive: true,
  },
  active_customers: {
    label: "Aktiva kunder",
    description: "Kunder med status aktiv eller pågående",
    timeSensitive: false,
  },
  mrr: {
    label: "MRR",
    description: "Monthly Recurring Revenue",
    timeSensitive: false,
  },
  meetings_this_week: {
    label: "Möten denna vecka",
    description: "Antal möten inbokade denna vecka",
    timeSensitive: false,
  },
};

/** Default KPIs shown when a partner has no dashboardKpis configured. */
export const DEFAULT_DASHBOARD_KPIS: KpiId[] = [
  "shopify_revenue",
  "shopify_orders",
  "inventory_retail_value",
  "total_income",
];
