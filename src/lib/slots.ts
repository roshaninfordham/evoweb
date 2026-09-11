export type SlotId = "price-filter" | "budget-match" | "compare-products";

export type SlotSpec = {
  id: SlotId;
  label: string;
  target: string;
  triggerDescription: string;
  propsContract: string;
  buildInstructions: string;
  needsResearch: boolean;
};

export const SLOTS: Record<SlotId, SlotSpec> = {
  "price-filter": {
    id: "price-filter",
    label: "Price filter",
    target: "the toolbar above the product grid",
    triggerDescription:
      "A visitor searched with a price budget in mind, or used the feedback box to say they couldn't find something in their budget.",
    propsContract: `type PriceFilterProps = {
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
};`,
    buildInstructions:
      "Build a single control that lets a shopper cap the price shown in the grid, framed as \"Under $value\". Use SlotRangeSlider bound to value/min/max/onChange, inside a SlotPanel with a SlotLabel. Keep it to one visible control — no extra filters.",
    needsResearch: false,
  },
  "budget-match": {
    id: "budget-match",
    label: "Budget match",
    target: "a callout below the product grid",
    triggerDescription:
      "A visitor's stated budget is below every product's price in the catalog, so a plain price filter would show them nothing.",
    propsContract: `type BudgetMatchProps = {
  budget: number;
  internalOffer: { name: string; originalPrice: number; offerPrice: number } | null;
  externalFind: { name: string; price: number; url: string } | null;
};`,
    buildInstructions:
      "Help the visitor get something in their budget. internalOffer and externalFind were computed by a fixed pricing rule, not by you — only decide how to present whichever one is non-null (never invent your own prices). If internalOffer is set, show its name with the original price and the offer price, framed as a match to their budget. Else if externalFind is set, show it as something found elsewhere with a SlotLink to its url. If both are null, render nothing (return null). Wrap any content in a SlotPanel with a SlotLabel.",
    needsResearch: false,
  },
  "compare-products": {
    id: "compare-products",
    label: "Compare products",
    target: "a panel below the product grid",
    triggerDescription:
      "A visitor opened detail views on two or more different products in one visit, suggesting they're deciding between them.",
    propsContract: `type CompareProductsProps = {
  products: {
    id: string;
    name: string;
    category: string;
    price: number;
    weightGrams: number;
    rating: number;
  }[];
};`,
    buildInstructions:
      "Build a side-by-side comparison of the given products using SlotTable, with rows for price, weight, and rating. Wrap it in a SlotPanel with a SlotLabel naming what's being compared.",
    needsResearch: true,
  },
};

export const SLOT_ORDER: SlotId[] = ["price-filter", "budget-match", "compare-products"];
