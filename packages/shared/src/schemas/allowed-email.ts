import { Schema } from "effect";
import { UserRole } from "../enums/user-role";
import { PlatformRole } from "../enums/platform-role";

export const AllowedEmail = Schema.Struct({
  id: Schema.String,
  email: Schema.String,
  role: UserRole,
  partnerId: Schema.optional(Schema.String),
  platformRole: Schema.optional(PlatformRole),
  addedBy: Schema.optional(Schema.String),
  createdAt: Schema.String,
  updatedAt: Schema.String,
});

export type AllowedEmail = typeof AllowedEmail.Type;
