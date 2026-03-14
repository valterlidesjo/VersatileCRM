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
  Field,
  AttendeeInput,
  INPUT_CLASS,
  INITIAL_MEETING_FORM,
  getDefaultMeetingTimes,
} from "./meeting-form-fields";
import { useCustomers } from "@/features/customers/hooks/use-customers";
import type { MeetingFormData } from "../hooks/use-meetings";
import { CalendarCheck } from "lucide-react";

interface AddMeetingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: MeetingFormData) => Promise<void>;
  isCalendarConnected: boolean;
}

export function AddMeetingDialog({
  open,
  onOpenChange,
  onSubmit,
  isCalendarConnected,
}: AddMeetingDialogProps) {
  const defaultTimes = getDefaultMeetingTimes();
  const [form, setForm] = useState<MeetingFormData>({
    ...INITIAL_MEETING_FORM,
    ...defaultTimes,
  });
  const [submitting, setSubmitting] = useState(false);
  const { customers } = useCustomers();

  function handleChange<K extends keyof MeetingFormData>(
    field: K,
    value: MeetingFormData[K]
  ) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      // Reset form when closing
      const times = getDefaultMeetingTimes();
      setForm({ ...INITIAL_MEETING_FORM, ...times });
    }
    onOpenChange(open);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(form);
      const times = getDefaultMeetingTimes();
      setForm({ ...INITIAL_MEETING_FORM, ...times });
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Schedule Meeting
            {isCalendarConnected && (
              <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-normal text-green-700">
                <CalendarCheck className="h-3 w-3" />
                Google Calendar
              </span>
            )}
          </DialogTitle>
          <DialogDescription>
            Create a new meeting
            {isCalendarConnected
              ? " - it will also be added to your Google Calendar"
              : ""}
            .
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Meeting Details */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Meeting Details
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Title" required className="sm:col-span-2">
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  className={INPUT_CLASS}
                  required
                  placeholder="Meeting title"
                />
              </Field>

              <Field label="Start Time" required>
                <input
                  type="datetime-local"
                  value={form.startTime}
                  onChange={(e) => handleChange("startTime", e.target.value)}
                  className={INPUT_CLASS}
                  required
                />
              </Field>

              <Field label="End Time" required>
                <input
                  type="datetime-local"
                  value={form.endTime}
                  onChange={(e) => handleChange("endTime", e.target.value)}
                  className={INPUT_CLASS}
                  required
                />
              </Field>

              <Field label="Location">
                <input
                  type="text"
                  value={form.location || ""}
                  onChange={(e) => handleChange("location", e.target.value)}
                  className={INPUT_CLASS}
                  placeholder="Office, Zoom link, etc."
                />
              </Field>

              <div className="flex items-center gap-2 self-end pb-2">
                <Checkbox
                  id="allDay"
                  checked={form.allDay}
                  onCheckedChange={(checked) =>
                    handleChange("allDay", checked === true)
                  }
                />
                <label
                  htmlFor="allDay"
                  className="text-sm text-muted-foreground cursor-pointer"
                >
                  All day event
                </label>
              </div>

              <Field label="Description" className="sm:col-span-2">
                <textarea
                  value={form.description || ""}
                  onChange={(e) => handleChange("description", e.target.value)}
                  className={cn(INPUT_CLASS, "min-h-[80px] resize-y")}
                  placeholder="Meeting agenda, notes..."
                  rows={3}
                />
              </Field>
            </div>
          </div>

          {/* Attendees - only show if calendar is connected */}
          {isCalendarConnected && (
            <>
              <div className="border-t border-border" />
              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Attendees
                </h3>
                <AttendeeInput
                  attendees={form.attendees}
                  onChange={(attendees) => handleChange("attendees", attendees)}
                />
                <div className="mt-3 flex items-center gap-2">
                  <Checkbox
                    id="sendNotifications"
                    checked={form.sendNotifications}
                    onCheckedChange={(checked) =>
                      handleChange("sendNotifications", checked === true)
                    }
                  />
                  <label
                    htmlFor="sendNotifications"
                    className="text-sm text-muted-foreground cursor-pointer"
                  >
                    Send email invitations to attendees
                  </label>
                </div>
              </div>
            </>
          )}

          {/* CRM Linking */}
          <div className="border-t border-border" />
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Link to CRM
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Customer">
                <select
                  value={form.customerId || ""}
                  onChange={(e) => handleChange("customerId", e.target.value)}
                  className={INPUT_CLASS}
                >
                  <option value="">Select customer...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Internal Notes" className="sm:col-span-2">
                <textarea
                  value={form.notes || ""}
                  onChange={(e) => handleChange("notes", e.target.value)}
                  className={cn(INPUT_CLASS, "min-h-[60px] resize-y")}
                  placeholder="Internal notes (not shared with attendees)"
                  rows={2}
                />
              </Field>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => handleOpenChange(false)}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Schedule Meeting"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
