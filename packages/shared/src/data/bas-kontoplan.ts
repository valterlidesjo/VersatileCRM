import type { BASAccount } from "../schemas/accounting";

/**
 * Starter subset of the Swedish BAS-kontoplan (chart of accounts).
 * Replace or extend this with your full JSON account plan.
 *
 * Account classes:
 * 1 - Tillgångar (Assets)
 * 2 - Eget kapital och skulder (Equity & Liabilities)
 * 3 - Intäkter (Revenue)
 * 4 - Material & varor (Cost of goods)
 * 5 - Övriga externa kostnader (Other external costs)
 * 6 - Övriga externa kostnader forts. (Other external costs cont.)
 * 7 - Personal (Personnel)
 * 8 - Finansiella poster & skatt (Financial items & tax)
 */
export const BAS_ACCOUNTS: BASAccount[] = [
  // 1 - Tillgångar
  { number: "1510", name: "Kundfordringar", accountClass: 1 },
  { number: "1910", name: "Kassa", accountClass: 1 },
  { number: "1920", name: "PlusGiro", accountClass: 1 },
  { number: "1930", name: "Företagskonto", accountClass: 1 },
  { number: "1940", name: "Sparkonto", accountClass: 1 },

  // 2 - Eget kapital & skulder
  { number: "2010", name: "Eget kapital", accountClass: 2 },
  { number: "2440", name: "Leverantörsskulder", accountClass: 2 },
  { number: "2610", name: "Utgående moms 25%", accountClass: 2 },
  { number: "2620", name: "Utgående moms 12%", accountClass: 2 },
  { number: "2630", name: "Utgående moms 6%", accountClass: 2 },
  { number: "2640", name: "Ingående moms", accountClass: 2 },
  { number: "2650", name: "Redovisningskonto moms", accountClass: 2 },
  { number: "2710", name: "Personalskatt", accountClass: 2 },
  { number: "2730", name: "Arbetsgivaravgifter", accountClass: 2 },
  { number: "2920", name: "Upplupna semesterlöner", accountClass: 2 },

  // 3 - Intäkter
  { number: "3000", name: "Försäljning", accountClass: 3 },
  { number: "3001", name: "Försäljning tjänster 25%", accountClass: 3 },
  { number: "3002", name: "Försäljning tjänster 12%", accountClass: 3 },
  { number: "3003", name: "Försäljning tjänster 6%", accountClass: 3 },
  { number: "3004", name: "Försäljning tjänster 0%", accountClass: 3 },
  { number: "3010", name: "Försäljning varor 25%", accountClass: 3 },
  { number: "3040", name: "Försäljning tjänster utland", accountClass: 3 },
  { number: "3740", name: "Öres- och kronutjämning", accountClass: 3 },

  // 4 - Material & varor
  { number: "4000", name: "Inköp material & varor", accountClass: 4 },
  { number: "4010", name: "Inköp varor Sverige", accountClass: 4 },

  // 5 - Lokalkostnader m.m.
  { number: "5010", name: "Lokalhyra", accountClass: 5 },
  { number: "5090", name: "Övriga lokalkostnader", accountClass: 5 },

  // 6 - Övriga externa kostnader
  { number: "6071", name: "Representation, avdragsgill", accountClass: 6 },
  { number: "6072", name: "Representation, ej avdragsgill", accountClass: 6 },
  { number: "6110", name: "Kontorsmaterial", accountClass: 6 },
  { number: "6200", name: "Telefon & internet", accountClass: 6 },
  { number: "6210", name: "Telekommunikation", accountClass: 6 },
  { number: "6230", name: "Datakommunikation", accountClass: 6 },
  { number: "6250", name: "Postbefordran", accountClass: 6 },
  { number: "6310", name: "Företagsförsäkringar", accountClass: 6 },
  { number: "6530", name: "Redovisningstjänster", accountClass: 6 },
  { number: "6540", name: "IT-tjänster", accountClass: 6 },
  { number: "6550", name: "Konsultarvoden", accountClass: 6 },
  { number: "6570", name: "Bankkostnader", accountClass: 6 },
  { number: "6900", name: "Övriga externa kostnader", accountClass: 6 },

  // 7 - Personal
  { number: "7010", name: "Löner", accountClass: 7 },
  { number: "7210", name: "Löner tjänstemän", accountClass: 7 },
  { number: "7510", name: "Arbetsgivaravgifter", accountClass: 7 },
  { number: "7690", name: "Övriga personalkostnader", accountClass: 7 },

  // 8 - Finansiella poster
  { number: "8310", name: "Ränteintäkter", accountClass: 8 },
  { number: "8410", name: "Räntekostnader", accountClass: 8 },
  { number: "8910", name: "Skatt på årets resultat", accountClass: 8 },
  { number: "8999", name: "Årets resultat", accountClass: 8 },
];
