import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { usePartner } from "@/lib/partner";
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "@/lib/firebase";
import { X, RefreshCw, CheckCircle, AlertCircle, Settings } from "lucide-react";

interface SyncResult {
  totalProducts: number;
  created: number;
  synced: number;
}

interface ShopifySyncDialogProps {
  onClose: () => void;
  targetPartnerId?: string;
}

export function ShopifySyncDialog({ onClose, targetPartnerId }: ShopifySyncDialogProps) {
  const { partnerId: contextPartnerId } = usePartner();
  const partnerId = targetPartnerId ?? contextPartnerId;

  const [tab, setTab] = useState<"sync" | "settings">("sync");
  const [config, setConfig] = useState<{
    storeUrl: string;
    accessToken: string;
    webhookSecret: string;
    connectedAt?: string;
  } | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);

  // Settings form state
  const [storeUrl, setStoreUrl] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [savingConfig, setSavingConfig] = useState(false);
  const [configSaved, setConfigSaved] = useState(false);

  // Sync state
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    async function loadConfig() {
      try {
        const snap = await getDoc(
          doc(db, `partners/${partnerId}/integrations/shopify`)
        );
        if (snap.exists()) {
          const data = snap.data() as typeof config & object;
          setConfig(data);
          setStoreUrl(data?.storeUrl ?? "");
          setWebhookSecret(data?.webhookSecret ?? "");
          // Don't pre-fill access token for security
        }
      } finally {
        setLoadingConfig(false);
      }
    }
    loadConfig();
  }, [partnerId]);

  async function handleSaveConfig(e: React.FormEvent) {
    e.preventDefault();
    if (!storeUrl.trim() || !accessToken.trim() || !webhookSecret.trim()) return;
    setSavingConfig(true);

    try {
      const data = {
        storeUrl: storeUrl.trim().replace(/^https?:\/\//, ""),
        accessToken: accessToken.trim(),
        webhookSecret: webhookSecret.trim(),
        connectedAt: new Date().toISOString(),
      };

      await setDoc(
        doc(db, `partners/${partnerId}/integrations/shopify`),
        data
      );

      setConfig(data);
      setConfigSaved(true);
      setTimeout(() => {
        setConfigSaved(false);
        setTab("sync");
      }, 1500);
    } finally {
      setSavingConfig(false);
    }
  }

  async function handleSync() {
    setSyncing(true);
    setSyncResult(null);
    setSyncError(null);

    try {
      const functions = getFunctions(app, "europe-west1");
      const syncFn = httpsCallable<{ partnerId: string }, SyncResult>(
        functions,
        "syncShopifyProducts"
      );
      const result = await syncFn({ partnerId });
      setSyncResult(result.data);
    } catch (err) {
      setSyncError(
        err instanceof Error ? err.message : "Synchronization failed"
      );
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-lg rounded-xl border border-border bg-background shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold">Shopify Integration</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          <button
            type="button"
            onClick={() => setTab("sync")}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              tab === "sync"
                ? "border-b-2 border-primary text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Sync
          </button>
          <button
            type="button"
            onClick={() => setTab("settings")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-colors ${
              tab === "settings"
                ? "border-b-2 border-primary text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Settings className="h-3.5 w-3.5" />
            Settings
          </button>
        </div>

        <div className="p-6">
          {tab === "sync" ? (
            <div className="space-y-4">
              {loadingConfig ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : !config ? (
                <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 text-sm text-orange-700">
                  <p className="font-medium">Shopify not configured</p>
                  <p className="mt-1 text-orange-600">
                    Go to the Settings tab and enter your Shopify API credentials.
                  </p>
                  <button
                    type="button"
                    onClick={() => setTab("settings")}
                    className="mt-2 text-orange-700 underline hover:no-underline"
                  >
                    Open settings
                  </button>
                </div>
              ) : (
                <>
                  {/* Connection status */}
                  <div className="flex items-center gap-2 rounded-md bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700">
                    <CheckCircle className="h-4 w-4 shrink-0" />
                    <span>
                      Connected to{" "}
                      <span className="font-medium">{config.storeUrl}</span>
                    </span>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Imports all products and variants from Shopify.
                      Existing products are updated, their stock is preserved.
                      Images are copied to Firebase Storage.
                    </p>

                    {syncResult && (
                      <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                        <p className="font-medium">Sync complete!</p>
                        <ul className="mt-1 space-y-0.5 text-green-600">
                          <li>
                            Total products: {syncResult.totalProducts}
                          </li>
                          <li>New: {syncResult.created}</li>
                          <li>Updated: {syncResult.synced}</li>
                        </ul>
                      </div>
                    )}

                    {syncError && (
                      <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                        <p>{syncError}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      onClick={handleSync}
                      disabled={syncing}
                      className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      <RefreshCw
                        className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`}
                      />
                      {syncing ? "Syncing..." : "Start sync"}
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <form onSubmit={handleSaveConfig} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Store URL
                </label>
                <input
                  type="text"
                  value={storeUrl}
                  onChange={(e) => setStoreUrl(e.target.value)}
                  placeholder="your-store.myshopify.com"
                  required
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Without https:// — e.g. hemdeal.myshopify.com
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Admin API Access Token
                </label>
                <input
                  type="password"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  placeholder={config ? "Leave empty to keep existing" : "shpat_..."}
                  required={!config}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Get from Shopify Admin → Settings → Apps → Develop apps
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Webhook Signing Secret
                </label>
                <input
                  type="password"
                  value={webhookSecret}
                  onChange={(e) => setWebhookSecret(e.target.value)}
                  placeholder={config ? "Leave empty to keep existing" : "Webhook secret..."}
                  required={!config}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingConfig}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {savingConfig
                    ? "Saving..."
                    : configSaved
                      ? "Saved!"
                      : "Save & connect"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
