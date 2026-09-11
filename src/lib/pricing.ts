import { products, type Product } from "@/data/products";

export type BudgetOffer = {
  productId: string;
  name: string;
  category: Product["category"];
  originalPrice: number;
  offerPrice: number;
};

/**
 * Deterministic guardrail: a markdown is only ever proposed when it still
 * clears the product's internal cost floor. This is never an LLM decision —
 * the agents only decide whether to build the UI and, when no internal
 * discount is safe, whether to look for an external alternative.
 */
export function computeBudgetOffer(budget: number): BudgetOffer | null {
  const eligible = products.filter((p) => p.price > budget && p.cost <= budget);
  if (eligible.length === 0) return null;

  // Shallowest safe markdown: the eligible product closest to the budget already.
  const chosen = eligible.reduce((best, p) => (p.price < best.price ? p : best));

  return {
    productId: chosen.id,
    name: chosen.name,
    category: chosen.category,
    originalPrice: chosen.price,
    offerPrice: budget,
  };
}

export function cheapestPrice(): number {
  return Math.min(...products.map((p) => p.price));
}
