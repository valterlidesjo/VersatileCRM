import { Schema } from "effect";

export const ProductVariant = Schema.Struct({
  id: Schema.String,
  title: Schema.String,
  sku: Schema.optional(Schema.String),
  price: Schema.optional(Schema.Number),
  stock: Schema.Number,
  imageUrl: Schema.optional(Schema.String),
  shopifyVariantId: Schema.optional(Schema.String),
  shopifyInventoryItemId: Schema.optional(Schema.String),
  shopifyLocationId: Schema.optional(Schema.String),
});

export type ProductVariant = typeof ProductVariant.Type;

export const Product = Schema.Struct({
  id: Schema.String,
  title: Schema.String,
  description: Schema.optional(Schema.String),
  imageUrl: Schema.optional(Schema.String),
  vendor: Schema.optional(Schema.String),
  status: Schema.Literal("active", "archived"),
  shopifyProductId: Schema.optional(Schema.String),
  shopifyHandle: Schema.optional(Schema.String),
  lastShopifySyncAt: Schema.optional(Schema.String),
  variants: Schema.Array(ProductVariant),
  createdAt: Schema.String,
  updatedAt: Schema.String,
});

export type Product = typeof Product.Type;

export const ShopifyIntegrationConfig = Schema.Struct({
  storeUrl: Schema.String,
  accessToken: Schema.String,
  webhookSecret: Schema.String,
  defaultLocationId: Schema.optional(Schema.String),
  connectedAt: Schema.String,
});

export type ShopifyIntegrationConfig = typeof ShopifyIntegrationConfig.Type;
