import { Schema } from "effect";

export const MeetingAttendee = Schema.Struct({
  email: Schema.String,
  name: Schema.optional(Schema.String),
  responseStatus: Schema.optional(
    Schema.Union(
      Schema.Literal("needsAction"),
      Schema.Literal("declined"),
      Schema.Literal("tentative"),
      Schema.Literal("accepted")
    )
  ),
});

export const Meeting = Schema.Struct({
  id: Schema.String,

  // CRM linking
  customerId: Schema.optional(Schema.String),
  dealId: Schema.optional(Schema.String),
  contactId: Schema.optional(Schema.String),

  // Meeting details
  title: Schema.String,
  description: Schema.optional(Schema.String),
  location: Schema.optional(Schema.String),

  // Time (ISO 8601)
  startTime: Schema.String,
  endTime: Schema.String,
  allDay: Schema.optionalWith(Schema.Boolean, { default: () => false }),

  // Google Calendar integration
  googleCalendarEventId: Schema.optional(Schema.String),
  googleCalendarLink: Schema.optional(Schema.String),
  attendees: Schema.optionalWith(Schema.Array(MeetingAttendee), {
    default: () => [],
  }),
  sendNotifications: Schema.optionalWith(Schema.Boolean, {
    default: () => true,
  }),

  // CRM-specific
  notes: Schema.optional(Schema.String),
  outcome: Schema.optional(Schema.String),

  // Metadata
  createdAt: Schema.String,
  updatedAt: Schema.String,
  syncedAt: Schema.optional(Schema.String),
});

export type Meeting = typeof Meeting.Type;
export type MeetingAttendee = typeof MeetingAttendee.Type;
