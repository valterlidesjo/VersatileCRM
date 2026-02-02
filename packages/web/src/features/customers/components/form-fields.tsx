import { CUSTOMER_STATUS_LABELS } from "@crm/shared";
import type { CustomerStatusType } from "@crm/shared";

export interface CustomerFormData {
  name: string;
  location: string;
  phone: string;
  email: string;
  status: CustomerStatusType;
  categoryOfWork: string;
  description: string;
  website: string;
  orgNumber: string;
  legalName: string;
}

export interface UserFormData {
  name: string;
  location: string;
  phone: string;
  email: string;
}

export const INITIAL_CUSTOMER: CustomerFormData = {
  name: "",
  location: "",
  phone: "",
  email: "",
  status: "not_contacted",
  categoryOfWork: "",
  description: "",
  website: "",
  orgNumber: "",
  legalName: "",
};

export const INITIAL_USER: UserFormData = {
  name: "",
  location: "",
  phone: "",
  email: "",
};

export const STATUS_OPTIONS = Object.entries(CUSTOMER_STATUS_LABELS) as [CustomerStatusType, string][];

export const INPUT_CLASS = "w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors";

export function Field({ label, required, children, className }: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-1 block text-sm font-medium text-foreground">
        {label}{required && " *"}
      </label>
      {children}
    </div>
  );
}
