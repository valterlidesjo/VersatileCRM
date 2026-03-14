import { collection, doc } from "firebase/firestore";
import { db } from "./firebase";

/**
 * Returns a reference to a partner-scoped subcollection.
 * e.g. partnerCol("abc123", "customers") → /partners/abc123/customers
 */
export function partnerCol(partnerId: string, name: string) {
  return collection(db, "partners", partnerId, name);
}

/**
 * Returns a reference to a document inside a partner-scoped subcollection.
 * e.g. partnerDocRef("abc123", "customers", "cust1") → /partners/abc123/customers/cust1
 */
export function partnerDocRef(partnerId: string, colName: string, docId: string) {
  return doc(db, "partners", partnerId, colName, docId);
}

/**
 * Returns a reference to a single document directly under a partner.
 * e.g. partnerSingleDoc("abc123", "companyProfile", "main")
 */
export function partnerSingleDoc(partnerId: string, colName: string, docId: string) {
  return doc(db, "partners", partnerId, colName, docId);
}
