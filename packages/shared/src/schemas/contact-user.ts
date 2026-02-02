import { Schema } from "effect";

export const ContactUser = Schema.Struct({
  id: Schema.String,
  customerId: Schema.String,
  name: Schema.String,
  location: Schema.String,
  phone: Schema.String,
  email: Schema.String,
  createdAt: Schema.String,
  updatedAt: Schema.String,
});

export type ContactUser = typeof ContactUser.Type;
