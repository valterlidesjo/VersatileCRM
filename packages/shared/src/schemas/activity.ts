import { Schema } from "effect";

export const Activity = Schema.Struct({
  id: Schema.String,
  customerId: Schema.optional(Schema.String),
  dealId: Schema.optional(Schema.String),
  type: Schema.Literal("call", "email", "meeting", "note", "task"),
  description: Schema.String,
  authorId: Schema.String,
  createdAt: Schema.String,
});

export type Activity = typeof Activity.Type;
