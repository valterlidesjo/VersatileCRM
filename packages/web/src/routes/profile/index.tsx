import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageContainer } from "@/components/layout/page-container";
import {
  useProfile,
  type ProfileFormData,
} from "@/features/profile/hooks/use-profile";

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

const INITIAL_FORM: ProfileFormData = {
  orgNumber: "",
  legalName: "",
  bank: "",
  bankgiro: "",
  address: "",
  phone: "",
  email: "",
  website: "",
  goal: "",
  fSkatt: false,
};

function ProfilePage() {
  const { profile, loading, saveProfile } = useProfile();
  const [form, setForm] = useState<ProfileFormData>(INITIAL_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        orgNumber: profile.orgNumber,
        legalName: profile.legalName,
        bank: profile.bank,
        bankgiro: profile.bankgiro,
        address: profile.address ?? "",
        phone: profile.phone ?? "",
        email: profile.email ?? "",
        website: profile.website ?? "",
        goal: profile.goal ?? "",
        fSkatt: profile.fSkatt,
      });
    }
  }, [profile]);

  function update(field: keyof ProfileFormData, value: string | boolean) {
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
      <PageContainer title="Profile">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Profile"
      description="Your business details for invoices and quotes"
    >
      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Legal Name" required>
            <input
              className={INPUT_CLASS}
              value={form.legalName}
              onChange={(e) => update("legalName", e.target.value)}
              required
            />
          </Field>

          <Field label="Org Number" required>
            <input
              className={INPUT_CLASS}
              value={form.orgNumber}
              onChange={(e) => update("orgNumber", e.target.value)}
              placeholder="556677-8899"
              required
            />
          </Field>

          <Field label="Bank" required>
            <input
              className={INPUT_CLASS}
              value={form.bank}
              onChange={(e) => update("bank", e.target.value)}
              required
            />
          </Field>

          <Field label="Bankgiro" required>
            <input
              className={INPUT_CLASS}
              value={form.bankgiro}
              onChange={(e) => update("bankgiro", e.target.value)}
              placeholder="123-4567"
              required
            />
          </Field>

          <Field label="Address">
            <input
              className={INPUT_CLASS}
              value={form.address}
              onChange={(e) => update("address", e.target.value)}
              placeholder="Storgatan 1, 111 22 Stockholm"
            />
          </Field>

          <Field label="Phone">
            <input
              className={INPUT_CLASS}
              type="tel"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              placeholder="+46 70 123 45 67"
            />
          </Field>

          <Field label="Email">
            <input
              className={INPUT_CLASS}
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="info@example.se"
            />
          </Field>

          <Field label="Website">
            <input
              className={INPUT_CLASS}
              type="url"
              value={form.website}
              onChange={(e) => update("website", e.target.value)}
              placeholder="https://example.se"
            />
          </Field>

          <Field label="F-skatt">
            <label className="flex items-center gap-2 pt-2 text-sm">
              <input
                type="checkbox"
                checked={form.fSkatt}
                onChange={(e) => update("fSkatt", e.target.checked)}
                className="h-4 w-4 rounded border-border"
              />
              Registered for F-skatt
            </label>
          </Field>
        </div>

        <Field label="Goal / Description">
          <textarea
            className={INPUT_CLASS + " min-h-[80px] resize-y"}
            value={form.goal}
            onChange={(e) => update("goal", e.target.value)}
            placeholder="Short description of your business goal"
          />
        </Field>

        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {saving ? "Saving..." : profile ? "Update Profile" : "Create Profile"}
        </button>
      </form>
    </PageContainer>
  );
}
