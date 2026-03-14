import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

initializeApp();
getFirestore().settings({ ignoreUndefinedProperties: true });

export { syncShopifyProducts } from "./shopify/sync-products.js";
export { handleShopifyWebhook } from "./shopify/webhook-handler.js";
export { updateShopifyInventory } from "./shopify/update-inventory.js";
