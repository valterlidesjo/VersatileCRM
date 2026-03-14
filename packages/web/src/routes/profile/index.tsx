import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageContainer } from "@/components/layout/page-container";
import {
  useCompanyProfile,
  type CompanyProfileFormData,
} from "@/features/profile/hooks/use-profile";
import type { CompanyProfile } from "@crm/shared";
import { useIsAdmin, signOut } from "@/lib/auth";

export const Route = createFileRoute("/profile/")({
  component: ProfilePage,
});

const INPUT_CLASS =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors";

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-foreground">
        {label}
        {required && " *"}
      </label>
      {children}
    </div>
  );
}

const INITIAL_FORM: CompanyProfileFormData = {
  orgNumber: "",
  legalName: "",
  bank: "",
  bankgiro: "",
  address: "",
  phone: "",
  email: "",
  website: "",
  incomeGoal: "",
  mrrGoal: "",
  goalDeadline: "",
  goalDescription: "",
  fSkatt: false,
};

function profileToForm(profile: CompanyProfile | null): CompanyProfileFormData {
  if (!profile) return INITIAL_FORM;
  return {
    orgNumber: profile.orgNumber,
    legalName: profile.legalName,
    bank: profile.bank,
    bankgiro: profile.bankgiro,
    address: profile.address ?? "",
    phone: profile.phone ?? "",
    email: profile.email ?? "",
    website: profile.website ?? "",
    incomeGoal: profile.incomeGoal ?? "",
    mrrGoal: profile.mrrGoal ?? "",
    goalDeadline: profile.goalDeadline ?? "",
    goalDescription: profile.goalDescription ?? "",
    fSkatt: profile.fSkatt,
  };
}

function ProfilePage() {
  const { profile, loading, saveProfile } = useCompanyProfile();
  const isAdmin = useIsAdmin();
  const [form, setForm] = useState<CompanyProfileFormData>(INITIAL_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) setForm(profileToForm(profile));
  }, [profile]);

  function update(field: keyof CompanyProfileFormData, value: string | boolean | number | "") {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await saveProfile(form);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <PageContainer title="Company Profile">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Company Profile"
      description="Company details for invoices and quotes"
    >
      {!isAdmin && (
        <div className="mb-4 rounded-md bg-muted/50 px-4 py-3 text-sm text-muted-foreground border border-border">
          You are viewing the company profile in read-only mode. Only administrators can edit this information.
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Legal Name" required>
            <input
              className={INPUT_CLASS}
              value={form.legalName}
              onChange={(e) => update("legalName", e.target.value)}
              disabled={!isAdmin}
              required
            />
          </Field>

          <Field label="Org Number" required>
            <input
              className={INPUT_CLASS}
              value={form.orgNumber}
              onChange={(e) => update("orgNumber", e.target.value)}
              placeholder="556677-8899"
              disabled={!isAdmin}
              required
            />
          </Field>

          <Field label="Bank" required>
            <input
              className={INPUT_CLASS}
              value={form.bank}
              onChange={(e) => update("bank", e.target.value)}
              disabled={!isAdmin}
              required
            />
          </Field>

          <Field label="Bankgiro" required>
            <input
              className={INPUT_CLASS}
              value={form.bankgiro}
              onChange={(e) => update("bankgiro", e.target.value)}
              placeholder="123-4567"
              disabled={!isAdmin}
              required
            />
          </Field>

          <Field label="Address">
            <input
              className={INPUT_CLASS}
              value={form.address}
              onChange={(e) => update("address", e.target.value)}
              placeholder="Storgatan 1, 111 22 Stockholm"
              disabled={!isAdmin}
            />
          </Field>

          <Field label="Phone">
            <input
              className={INPUT_CLASS}
              type="tel"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              placeholder="+46 70 123 45 67"
              disabled={!isAdmin}
            />
          </Field>

          <Field label="Email">
            <input
              className={INPUT_CLASS}
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="info@example.se"
              disabled={!isAdmin}
            />
          </Field>

          <Field label="Website">
            <input
              className={INPUT_CLASS}
              type="url"
              value={form.website}
              onChange={(e) => update("website", e.target.value)}
              placeholder="https://example.se"
              disabled={!isAdmin}
            />
          </Field>

          <Field label="F-skatt">
            <label className="flex items-center gap-2 pt-2 text-sm">
              <input
                type="checkbox"
                checked={form.fSkatt}
                onChange={(e) => update("fSkatt", e.target.checked)}
                className="h-4 w-4 rounded border-border"
                disabled={!isAdmin}
              />
              Registered for F-skatt
            </label>
          </Field>
        </div>

        <div className="border-t border-border pt-6 mt-2">
          <h3 className="text-lg font-medium mb-4">Goals</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Total Income Goal (SEK)">
              <input
                className={INPUT_CLASS}
                type="number"
                value={form.incomeGoal}
                onChange={(e) =>
                  update("incomeGoal", e.target.value ? Number(e.target.value) : "")
                }
                placeholder="600000"
                disabled={!isAdmin}
              />
            </Field>

            <Field label="MRR Goal (SEK)">
              <input
                className={INPUT_CLASS}
                type="number"
                value={form.mrrGoal}
                onChange={(e) =>
                  update("mrrGoal", e.target.value ? Number(e.target.value) : "")
                }
                placeholder="60000"
                disabled={!isAdmin}
              />
            </Field>

            <Field label="Goal Deadline">
              <input
                className={INPUT_CLASS}
                type="date"
                value={form.goalDeadline}
                onChange={(e) => update("goalDeadline", e.target.value)}
                disabled={!isAdmin}
              />
            </Field>
          </div>

          <div className="mt-4">
            <Field label="How to achieve current goal?">
              <textarea
                className={INPUT_CLASS + " min-h-[80px] resize-y"}
                value={form.goalDescription}
                onChange={(e) => update("goalDescription", e.target.value)}
                placeholder="Focus on converting warm leads and increasing recurring contracts..."
                disabled={!isAdmin}
              />
            </Field>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isAdmin && (
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : profile ? "Update Company Profile" : "Create Company Profile"}
            </button>
          )}

          <button
            type="button"
            onClick={() => signOut()}
            className="rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 transition-colors"
          >
            Logout
          </button>
        </div>
      </form>
    </PageContainer>
  );
}
