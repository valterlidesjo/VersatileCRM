import { describe, it, expect } from "vitest";
import { buildProductSuggestions } from "../utils/build-product-suggestions";
import type { Product } from "@crm/shared";

function makeProduct(overrides: Partial<Product> & { id: string; title: string }): Product {
  return {
    status: "active",
    variants: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeVariant(id: string, title: string, overrides: Partial<Product["variants"][0]> = {}): Product["variants"][0] {
  return { id, title, stock: 0, ...overrides };
}

describe("buildProductSuggestions", () => {
  it("returns empty array for empty products list", () => {
    expect(buildProductSuggestions([])).toEqual([]);
  });

  it("skips archived products", () => {
    const products: Product[] = [
      makeProduct({ id: "p1", title: "Active", status: "active", variants: [makeVariant("v1", "default title")] }),
      makeProduct({ id: "p2", title: "Archived", status: "archived", variants: [makeVariant("v2", "default title")] }),
    ];
    const result = buildProductSuggestions(products);
    expect(result).toHaveLength(1);
    expect(result[0].productId).toBe("p1");
  });

  it("uses product title alone for single-variant product", () => {
    const products: Product[] = [
      makeProduct({ id: "p1", title: "Laptop", variants: [makeVariant("v1", "default title", { price: 2000 })] }),
    ];
    const result = buildProductSuggestions(products);
    expect(result[0].description).toBe("Laptop");
  });

  it("uses product title alone when single variant is named 'default title'", () => {
    const products: Product[] = [
      makeProduct({ id: "p1", title: "Widget", variants: [makeVariant("v1", "default title")] }),
    ];
    const result = buildProductSuggestions(products);
    expect(result[0].description).toBe("Widget");
  });

  it("combines product + variant title for multi-variant products", () => {
    const products: Product[] = [
      makeProduct({
        id: "p1",
        title: "Shirt",
        variants: [
          makeVariant("v1", "Red", { price: 100 }),
          makeVariant("v2", "Blue", { price: 100 }),
        ],
      }),
    ];
    const result = buildProductSuggestions(products);
    expect(result).toHaveLength(2);
    expect(result[0].description).toBe("Shirt / Red");
    expect(result[1].description).toBe("Shirt / Blue");
  });

  it("preserves productId and variantId in each suggestion", () => {
    const products: Product[] = [
      makeProduct({ id: "prod-123", title: "Thing", variants: [makeVariant("var-456", "default title")] }),
    ];
    const result = buildProductSuggestions(products);
    expect(result[0].productId).toBe("prod-123");
    expect(result[0].variantId).toBe("var-456");
  });

  it("includes sku when present", () => {
    const products: Product[] = [
      makeProduct({ id: "p1", title: "Item", variants: [makeVariant("v1", "default title", { sku: "SKU-001" })] }),
    ];
    const result = buildProductSuggestions(products);
    expect(result[0].sku).toBe("SKU-001");
  });

  it("leaves sku undefined when not set on variant", () => {
    const products: Product[] = [
      makeProduct({ id: "p1", title: "Item", variants: [makeVariant("v1", "default title")] }),
    ];
    const result = buildProductSuggestions(products);
    expect(result[0].sku).toBeUndefined();
  });

  it("defaults unitPrice to 0 when variant has no price", () => {
    const products: Product[] = [
      makeProduct({ id: "p1", title: "Item", variants: [makeVariant("v1", "default title")] }),
    ];
    const result = buildProductSuggestions(products);
    expect(result[0].unitPrice).toBe(0);
  });

  it("uses variant price when set", () => {
    const products: Product[] = [
      makeProduct({ id: "p1", title: "Item", variants: [makeVariant("v1", "default title", { price: 499.99 })] }),
    ];
    const result = buildProductSuggestions(products);
    expect(result[0].unitPrice).toBe(499.99);
  });

  it("produces one suggestion per active variant across multiple products", () => {
    const products: Product[] = [
      makeProduct({ id: "p1", title: "A", variants: [makeVariant("v1", "default title")] }),
      makeProduct({ id: "p2", title: "B", variants: [makeVariant("v2", "S"), makeVariant("v3", "M")] }),
    ];
    const result = buildProductSuggestions(products);
    expect(result).toHaveLength(3);
  });
});
