export const FEATURE_KEYS = [
  "dashboard",
  "customers",
  "pipeline",
  "meetings",
  "invoicing",
  "quotes",
  "accounting",
  "inventory",
  "settings",
  "profile",
] as const;

export type FeatureKey = (typeof FEATURE_KEYS)[number];

export const FEATURE_LABELS: Record<FeatureKey, string> = {
  dashboard: "Dashboard",
  customers: "Customers",
  pipeline: "Pipeline",
  meetings: "Meetings",
  invoicing: "Invoicing",
  quotes: "Quotes",
  accounting: "Accounting",
  inventory: "Lager",
  settings: "Settings",
  profile: "Profile",
};

export const DEFAULT_FEATURES: Record<FeatureKey, boolean> = {
  dashboard: true,
  customers: true,
  pipeline: true,
  meetings: true,
  invoicing: true,
  quotes: true,
  accounting: true,
  inventory: true,
  settings: true,
  profile: true,
};
