import { Schema } from "effect";

export const Note = Schema.Struct({
  id: Schema.String,
  customerId: Schema.optional(Schema.String),
  dealId: Schema.optional(Schema.String),
  contactId: Schema.optional(Schema.String),
  content: Schema.String,
  authorId: Schema.String,
  createdAt: Schema.String,
  updatedAt: Schema.String,
});

export type Note = typeof Note.Type;
