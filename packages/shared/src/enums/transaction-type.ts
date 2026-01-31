import { Schema } from "effect";

export const TransactionType = Schema.Literal("cost", "income");

export type TransactionType = typeof TransactionType.Type;
