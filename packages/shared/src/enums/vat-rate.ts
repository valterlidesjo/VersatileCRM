import { Schema } from "effect";

export const VatRate = Schema.Literal("25", "12", "6", "0");

export type VatRate = typeof VatRate.Type;
