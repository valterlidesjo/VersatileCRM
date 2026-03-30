import type { Product } from "@crm/shared";

export interface ProductSuggestion {
  description: string;
  sku?: string;
  unitPrice: number;
  productId: string;
  variantId: string;
}

export function buildProductSuggestions(products: Product[]): ProductSuggestion[] {
  const suggestions: ProductSuggestion[] = [];
  for (const product of products) {
    if (product.status === "archived") continue;
    for (const variant of product.variants) {
      const isDefault =
        product.variants.length === 1 ||
        variant.title.toLowerCase() === "default title";
      const description = isDefault
        ? product.title
        : `${product.title} / ${variant.title}`;
      suggestions.push({
        description,
        sku: variant.sku,
        unitPrice: variant.price ?? 0,
        productId: product.id,
        variantId: variant.id,
      });
    }
  }
  return suggestions;
}
