import { onRequest } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";
import * as crypto from "crypto";

interface ShopifyOrderLineItem {
  product_id: number;
  variant_id: number;
  quantity: number;
}

interface ShopifyOrderPayload {
  line_items: ShopifyOrderLineItem[];
}

interface ShopifyProductPayload {
  id: number;
  title?: string;
  body_html?: string;
  vendor?: string;
}

async function verifyWebhookHmac(
  rawBody: Buffer,
  hmacHeader: string,
  secret: string
): Promise<boolean> {
  const digest = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("base64");
  return crypto.timingSafeEqual(
    Buffer.from(digest),
    Buffer.from(hmacHeader)
  );
}

// Find partner by Shopify store URL using the webhook's shop domain header
async function findPartnerByDomain(
  db: FirebaseFirestore.Firestore,
  shopDomain: string
) {
  const snap = await db
    .collectionGroup("integrations")
    .where("storeUrl", "==", shopDomain)
    .limit(1)
    .get();

  if (snap.empty) return null;

  // Extract partnerId from path: partners/{partnerId}/integrations/shopify
  const pathParts = snap.docs[0].ref.path.split("/");
  const partnerId = pathParts[1];
  const config = snap.docs[0].data() as {
    webhookSecret: string;
  };
  return { partnerId, webhookSecret: config.webhookSecret };
}

export const handleShopifyWebhook = onRequest(
  { region: "europe-west1" },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).send("Method not allowed");
      return;
    }

    const hmacHeader = req.headers["x-shopify-hmac-sha256"] as string;
    const topic = req.headers["x-shopify-topic"] as string;
    const shopDomain = req.headers["x-shopify-shop-domain"] as string;

    if (!hmacHeader || !topic || !shopDomain) {
      res.status(400).send("Missing required headers");
      return;
    }

    const db = getFirestore();
    const partnerInfo = await findPartnerByDomain(db, shopDomain);

    if (!partnerInfo) {
      // Unknown shop — still return 200 to avoid Shopify retries
      res.status(200).send("ok");
      return;
    }

    // Verify HMAC signature
    const rawBody: Buffer = req.rawBody as Buffer;
    const isValid = await verifyWebhookHmac(
      rawBody,
      hmacHeader,
      partnerInfo.webhookSecret
    );

    if (!isValid) {
      res.status(401).send("Invalid signature");
      return;
    }

    // Respond immediately — Shopify requires response within 5s
    res.status(200).send("ok");

    // Process async after response
    const { partnerId } = partnerInfo;
    const payload = req.body as ShopifyOrderPayload | ShopifyProductPayload;

    try {
      if (topic === "orders/paid") {
        await handleOrderPaid(db, partnerId, payload as ShopifyOrderPayload);
      } else if (topic === "products/update") {
        await handleProductUpdate(
          db,
          partnerId,
          payload as ShopifyProductPayload
        );
      }
    } catch (err) {
      console.error(`Error processing webhook topic=${topic}:`, err);
    }
  }
);

async function handleOrderPaid(
  db: FirebaseFirestore.Firestore,
  partnerId: string,
  payload: ShopifyOrderPayload
) {
  if (!payload.line_items?.length) return;

  const productsSnap = await db
    .collection(`partners/${partnerId}/products`)
    .get();

  const now = new Date().toISOString();

  for (const lineItem of payload.line_items) {
    const shopifyVariantId = `gid://shopify/ProductVariant/${lineItem.variant_id}`;

    // Find which product + variant matches this line item
    for (const productDoc of productsSnap.docs) {
      const product = productDoc.data() as {
        variants: Array<{
          id: string;
          stock: number;
          shopifyVariantId?: string;
        }>;
      };

      const variantIndex = product.variants.findIndex(
        (v) => v.shopifyVariantId === shopifyVariantId
      );

      if (variantIndex === -1) continue;

      const variant = product.variants[variantIndex];
      const newStock = Math.max(0, variant.stock - lineItem.quantity);
      const updatedVariants = product.variants.map((v, i) =>
        i === variantIndex ? { ...v, stock: newStock } : v
      );

      await productDoc.ref.update({
        variants: updatedVariants,
        updatedAt: now,
      });

      console.log(
        `Decremented stock for variant ${shopifyVariantId} by ${lineItem.quantity} → ${newStock}`
      );
      break; // Found the matching product, move to next line item
    }
  }
}

async function handleProductUpdate(
  db: FirebaseFirestore.Firestore,
  partnerId: string,
  payload: ShopifyProductPayload
) {
  const shopifyProductId = `gid://shopify/Product/${payload.id}`;

  const snap = await db
    .collection(`partners/${partnerId}/products`)
    .where("shopifyProductId", "==", shopifyProductId)
    .limit(1)
    .get();

  if (snap.empty) return;

  const updates: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
  };

  if (payload.title) updates.title = payload.title;
  if (payload.body_html !== undefined) {
    // Strip HTML tags from body_html
    updates.description = payload.body_html.replace(/<[^>]+>/g, "").trim();
  }
  if (payload.vendor) updates.vendor = payload.vendor;

  await snap.docs[0].ref.update(updates);
}
