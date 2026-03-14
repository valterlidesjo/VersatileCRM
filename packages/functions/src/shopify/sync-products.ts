import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

interface SyncShopifyProductsInput {
  partnerId: string;
}

interface ShopifyVariantNode {
  id: string;
  title: string;
  sku: string | null;
  price: string;
  inventoryItem: {
    id: string;
    inventoryLevels: {
      edges: Array<{
        node: {
          location: { id: string };
          quantities: Array<{ name: string; quantity: number }>;
        };
      }>;
    };
  };
}

interface ShopifyProductNode {
  id: string;
  title: string;
  descriptionHtml: string;
  handle: string;
  vendor: string;
  images: { edges: Array<{ node: { url: string } }> };
  variants: { edges: Array<{ node: ShopifyVariantNode }> };
}

interface ShopifyProductsResponse {
  products: {
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
    edges: Array<{ node: ShopifyProductNode }>;
  };
}

const PRODUCTS_QUERY = `
  query GetProducts($cursor: String) {
    products(first: 50, after: $cursor) {
      pageInfo { hasNextPage endCursor }
      edges {
        node {
          id title descriptionHtml handle vendor
          images(first: 1) { edges { node { url } } }
          variants(first: 100) {
            edges {
              node {
                id title sku price
                inventoryItem {
                  id
                  inventoryLevels(first: 1) {
                    edges {
                      node {
                        location { id }
                        quantities(names: ["available"]) { name quantity }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

async function shopifyGraphQL(
  storeUrl: string,
  accessToken: string,
  query: string,
  variables: Record<string, unknown> = {}
): Promise<unknown> {
  const url = `https://${storeUrl}/admin/api/2025-01/graphql.json`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": accessToken,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new HttpsError(
      "internal",
      `Shopify API error: ${response.status} ${response.statusText}`
    );
  }

  const json = (await response.json()) as {
    data?: unknown;
    errors?: Array<{ message: string }>;
  };
  if (json.errors?.length) {
    throw new HttpsError("internal", json.errors[0].message);
  }
  return json.data;
}

async function copyImageToStorage(
  imageUrl: string,
  storagePath: string
): Promise<string | null> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) return null;

    const buffer = Buffer.from(await response.arrayBuffer());
    const contentType = response.headers.get("content-type") ?? "image/jpeg";

    const bucket = getStorage().bucket();
    const file = bucket.file(storagePath);

    await file.save(buffer, {
      metadata: { contentType },
    });

    await file.makePublic();
    return `https://storage.googleapis.com/${bucket.name}/${storagePath}`;
  } catch (err) {
    console.warn(`Failed to copy image from ${imageUrl}:`, err);
    return null;
  }
}

export const syncShopifyProducts = onCall<SyncShopifyProductsInput>(
  { region: "europe-west1", timeoutSeconds: 300, memory: "512MiB", invoker: "public" },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be authenticated");
    }

    const { partnerId } = request.data;
    if (!partnerId) {
      throw new HttpsError("invalid-argument", "partnerId is required");
    }

    const db = getFirestore();

    // Load Shopify config
    const configSnap = await db
      .doc(`partners/${partnerId}/integrations/shopify`)
      .get();

    if (!configSnap.exists) {
      throw new HttpsError(
        "not-found",
        "Shopify integration not configured for this partner"
      );
    }

    const config = configSnap.data() as {
      storeUrl: string;
      accessToken: string;
    };

    // Fetch all products with pagination
    const allProducts: ShopifyProductNode[] = [];
    let cursor: string | null = null;
    let hasNextPage = true;

    while (hasNextPage) {
      const data = (await shopifyGraphQL(
        config.storeUrl,
        config.accessToken,
        PRODUCTS_QUERY,
        cursor ? { cursor } : {}
      )) as ShopifyProductsResponse;

      const { products } = data;
      allProducts.push(...products.edges.map((e) => e.node));
      hasNextPage = products.pageInfo.hasNextPage;
      cursor = products.pageInfo.endCursor;
    }

    const now = new Date().toISOString();
    const productsCol = db.collection(`partners/${partnerId}/products`);

    // Fetch existing CRM products to map shopifyProductId → docId
    const existingSnap = await productsCol
      .where("shopifyProductId", "!=", null)
      .get();

    const existingByShopifyId = new Map<string, string>();
    for (const doc of existingSnap.docs) {
      const shopifyId = doc.data().shopifyProductId as string;
      if (shopifyId) existingByShopifyId.set(shopifyId, doc.id);
    }

    let synced = 0;
    let created = 0;

    for (const shopifyProduct of allProducts) {
      const existingDocId = existingByShopifyId.get(shopifyProduct.id);

      // Copy image to Firebase Storage
      const rawImageUrl =
        shopifyProduct.images.edges[0]?.node.url ?? null;
      const storageId = existingDocId ?? shopifyProduct.id.replace(/\//g, "_");
      let imageUrl: string | undefined;

      if (rawImageUrl) {
        const storagePath = `partners/${partnerId}/products/${storageId}/cover`;
        const copied = await copyImageToStorage(rawImageUrl, storagePath);
        if (copied) imageUrl = copied;
      }

      // Map variants
      const variants = shopifyProduct.variants.edges.map((e) => {
        const v = e.node;
        const inventoryLevel = v.inventoryItem.inventoryLevels.edges[0]?.node;
        const availableQty =
          inventoryLevel?.quantities.find((q) => q.name === "available")
            ?.quantity ?? 0;

        return {
          id: crypto.randomUUID(),
          title: v.title,
          sku: v.sku ?? undefined,
          price: parseFloat(v.price) || undefined,
          stock: availableQty,
          shopifyVariantId: v.id,
          shopifyInventoryItemId: v.inventoryItem.id,
          shopifyLocationId: inventoryLevel?.location.id ?? undefined,
        };
      });

      // Strip HTML from description
      const description = shopifyProduct.descriptionHtml
        .replace(/<[^>]+>/g, "")
        .trim();

      if (existingDocId) {
        // Update existing product — preserve CRM stock if already set
        const existingDoc = await productsCol.doc(existingDocId).get();
        const existingVariants = (
          existingDoc.data()?.variants ?? []
        ) as Array<{ shopifyVariantId?: string; stock: number }>;

        // Merge: keep existing CRM stock for variants that already exist
        const mergedVariants = variants.map((v) => {
          const existing = existingVariants.find(
            (ev) => ev.shopifyVariantId === v.shopifyVariantId
          );
          return existing ? { ...v, stock: existing.stock, id: (existing as { id?: string }).id ?? v.id } : v;
        });

        await productsCol.doc(existingDocId).update({
          shopifyProductId: shopifyProduct.id,
          shopifyHandle: shopifyProduct.handle,
          ...(description && { description }),
          ...(shopifyProduct.vendor && { vendor: shopifyProduct.vendor }),
          ...(imageUrl && { imageUrl }),
          variants: mergedVariants,
          lastShopifySyncAt: now,
          updatedAt: now,
        });
        synced++;
      } else {
        // Create new product
        await productsCol.add({
          title: shopifyProduct.title,
          ...(description && { description }),
          ...(shopifyProduct.vendor && { vendor: shopifyProduct.vendor }),
          ...(imageUrl && { imageUrl }),
          status: "active",
          shopifyProductId: shopifyProduct.id,
          shopifyHandle: shopifyProduct.handle,
          variants,
          lastShopifySyncAt: now,
          createdAt: now,
          updatedAt: now,
        });
        created++;
      }
    }

    return {
      success: true,
      totalProducts: allProducts.length,
      created,
      synced,
    };
  }
);
