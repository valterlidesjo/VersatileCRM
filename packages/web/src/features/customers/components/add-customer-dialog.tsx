import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  type CustomerFormData,
  type UserFormData,
  INITIAL_CUSTOMER,
  INITIAL_USER,
  STATUS_OPTIONS,
  INPUT_CLASS,
  Field,
} from "./form-fields";

export type { CustomerFormData, UserFormData };

interface AddCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { customer: CustomerFormData; user: UserFormData }) => void;
}

const SHARED_FIELDS = ["name", "location", "phone", "email"] as const;

export function AddCustomerDialog({ open, onOpenChange, onSubmit }: AddCustomerDialogProps) {
  const [customer, setCustomer] = useState<CustomerFormData>(INITIAL_CUSTOMER);
  const [user, setUser] = useState<UserFormData>(INITIAL_USER);
  const [useSameInfo, setUseSameInfo] = useState(true);

  const isPrivate = customer.customerType === "private";

  function handleCustomerChange(field: keyof CustomerFormData, value: string) {
    setCustomer((prev) => ({ ...prev, [field]: value }));
    if (useSameInfo && SHARED_FIELDS.includes(field as typeof SHARED_FIELDS[number])) {
      setUser((prev) => ({ ...prev, [field]: value }));
    }
  }

  function handleUseSameInfo(checked: boolean) {
    setUseSameInfo(checked);
    if (checked) {
      setUser({ name: customer.name, location: customer.location, phone: customer.phone, email: customer.email });
    }
  }

  function handleTypeChange(type: "business" | "private") {
    setCustomer({ ...INITIAL_CUSTOMER, customerType: type });
    setUser(INITIAL_USER);
    setUseSameInfo(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const finalCustomer: CustomerFormData = isPrivate
      ? {
          ...customer,
          name: `${customer.firstName} ${customer.lastName}`.trim(),
          categoryOfWork: "Private",
        }
      : customer;

    const finalUser: UserFormData = isPrivate
      ? { name: finalCustomer.name, location: customer.location, phone: customer.phone, email: customer.email }
      : user;

    onSubmit({ customer: finalCustomer, user: finalUser });
    setCustomer(INITIAL_CUSTOMER);
    setUser(INITIAL_USER);
    setUseSameInfo(true);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Customer</DialogTitle>
          <DialogDescription>Add a new customer and their contact person.</DialogDescription>
        </DialogHeader>

        {/* Type toggle */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleTypeChange("business")}
            className={cn(
              "flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors",
              !isPrivate
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:bg-muted"
            )}
          >
            Business
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange("private")}
            className={cn(
              "flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors",
              isPrivate
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:bg-muted"
            )}
          >
            Private Person
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {isPrivate ? (
            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Personal Details
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="First Name" required>
                  <input
                    type="text"
                    value={customer.firstName}
                    onChange={(e) => handleCustomerChange("firstName", e.target.value)}
                    className={INPUT_CLASS}
                    required
                    placeholder="First name"
                  />
                </Field>
                <Field label="Last Name" required>
                  <input
                    type="text"
                    value={customer.lastName}
                    onChange={(e) => handleCustomerChange("lastName", e.target.value)}
                    className={INPUT_CLASS}
                    required
                    placeholder="Last name"
                  />
                </Field>
                <Field label="Email" required>
                  <input
                    type="email"
                    value={customer.email}
                    onChange={(e) => handleCustomerChange("email", e.target.value)}
                    className={INPUT_CLASS}
                    required
                    placeholder="person@example.com"
                  />
                </Field>
                <Field label="Phone" required>
                  <input
                    type="tel"
                    value={customer.phone}
                    onChange={(e) => handleCustomerChange("phone", e.target.value)}
                    className={INPUT_CLASS}
                    required
                    placeholder="+46 70 123 4567"
                  />
                </Field>
                <Field label="Location" required>
                  <input
                    type="text"
                    value={customer.location}
                    onChange={(e) => handleCustomerChange("location", e.target.value)}
                    className={INPUT_CLASS}
                    required
                    placeholder="Stockholm"
                  />
                </Field>
                <Field label="Personal Number (optional)">
                  <input
                    type="text"
                    value={customer.personalNumber}
                    onChange={(e) => handleCustomerChange("personalNumber", e.target.value)}
                    className={INPUT_CLASS}
                    placeholder="YYYYMMDD-XXXX"
                  />
                </Field>
                <Field label="Status" required>
                  <select
                    value={customer.status}
                    onChange={(e) => handleCustomerChange("status", e.target.value)}
                    className={INPUT_CLASS}
                    required
                  >
                    {STATUS_OPTIONS.map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </Field>
              </div>
            </div>
          ) : (
            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Company Information
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Name" required>
                  <input type="text" value={customer.name} onChange={(e) => handleCustomerChange("name", e.target.value)} className={INPUT_CLASS} required placeholder="Company name" />
                </Field>
                <Field label="Location" required>
                  <input type="text" value={customer.location} onChange={(e) => handleCustomerChange("location", e.target.value)} className={INPUT_CLASS} required placeholder="City, Country" />
                </Field>
                <Field label="Phone" required>
                  <input type="tel" value={customer.phone} onChange={(e) => handleCustomerChange("phone", e.target.value)} className={INPUT_CLASS} required placeholder="+46 70 123 4567" />
                </Field>
                <Field label="Email" required>
                  <input type="email" value={customer.email} onChange={(e) => handleCustomerChange("email", e.target.value)} className={INPUT_CLASS} required placeholder="contact@company.com" />
                </Field>
                <Field label="Status" required>
                  <select value={customer.status} onChange={(e) => handleCustomerChange("status", e.target.value)} className={INPUT_CLASS} required>
                    {STATUS_OPTIONS.map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Category of Work" required>
                  <input type="text" value={customer.categoryOfWork} onChange={(e) => handleCustomerChange("categoryOfWork", e.target.value)} className={INPUT_CLASS} required placeholder="e.g. IT, Construction, Retail" />
                </Field>
                <Field label="Description" className="sm:col-span-2">
                  <textarea value={customer.description} onChange={(e) => handleCustomerChange("description", e.target.value)} className={cn(INPUT_CLASS, "min-h-[60px] resize-y")} placeholder="Brief description of the customer..." rows={2} />
                </Field>
                <Field label="Website">
                  <input type="url" value={customer.website} onChange={(e) => handleCustomerChange("website", e.target.value)} className={INPUT_CLASS} placeholder="https://example.com" />
                </Field>
                <Field label="Org Nr">
                  <input type="text" value={customer.orgNumber} onChange={(e) => handleCustomerChange("orgNumber", e.target.value)} className={INPUT_CLASS} placeholder="556677-8899" />
                </Field>
                <Field label="Legal Name">
                  <input type="text" value={customer.legalName} onChange={(e) => handleCustomerChange("legalName", e.target.value)} className={INPUT_CLASS} placeholder="Full legal entity name" />
                </Field>
              </div>
            </div>
          )}

          {!isPrivate && (
            <>
              <div className="border-t border-border" />

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Contact Person
                  </h3>
                  <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                    <Checkbox checked={useSameInfo} onCheckedChange={(checked) => handleUseSameInfo(checked === true)} />
                    Use same name & contact info
                  </label>
                </div>

                {useSameInfo ? (
                  <p className="text-sm text-muted-foreground">
                    Contact person will use the same name, location, phone, and email as the customer.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Name" required>
                      <input type="text" value={user.name} onChange={(e) => setUser((p) => ({ ...p, name: e.target.value }))} className={INPUT_CLASS} required placeholder="Contact name" />
                    </Field>
                    <Field label="Location" required>
                      <input type="text" value={user.location} onChange={(e) => setUser((p) => ({ ...p, location: e.target.value }))} className={INPUT_CLASS} required placeholder="City, Country" />
                    </Field>
                    <Field label="Phone" required>
                      <input type="tel" value={user.phone} onChange={(e) => setUser((p) => ({ ...p, phone: e.target.value }))} className={INPUT_CLASS} required placeholder="+46 70 123 4567" />
                    </Field>
                    <Field label="Email" required>
                      <input type="email" value={user.email} onChange={(e) => setUser((p) => ({ ...p, email: e.target.value }))} className={INPUT_CLASS} required placeholder="person@company.com" />
                    </Field>
                  </div>
                )}
              </div>
            </>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => onOpenChange(false)} className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors">
              Cancel
            </button>
            <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
              Add Customer
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
