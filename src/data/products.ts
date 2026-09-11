export type ProductArt = {
  shape: "swoop" | "block" | "ring" | "peak";
  colors: [string, string];
};

export type Product = {
  id: string;
  name: string;
  category: "Sneakers" | "Outerwear" | "Accessories";
  price: number;
  /** Internal cost floor — a markdown is only ever safe at or above this. Illustrative, not real COGS data. */
  cost: number;
  blurb: string;
  weightGrams: number;
  rating: number;
  art: ProductArt;
};

export const products: Product[] = [
  {
    id: "drift-runner",
    name: "Drift Runner",
    category: "Sneakers",
    price: 128,
    cost: 74,
    blurb: "Everyday trainer, breathable knit upper.",
    weightGrams: 260,
    rating: 4.6,
    art: { shape: "swoop", colors: ["#1c2b2a", "#4c5fef"] },
  },
  {
    id: "field-low",
    name: "Field Low",
    category: "Sneakers",
    price: 96,
    cost: 58,
    blurb: "Low-profile court shoe, reinforced toe.",
    weightGrams: 285,
    rating: 4.3,
    art: { shape: "block", colors: ["#6f827f", "#edeeea"] },
  },
  {
    id: "night-trail",
    name: "Night Trail",
    category: "Sneakers",
    price: 154,
    cost: 92,
    blurb: "Trail runner with lugged sole for wet ground.",
    weightGrams: 310,
    rating: 4.7,
    art: { shape: "peak", colors: ["#2e4443", "#9fb0ae"] },
  },
  {
    id: "paper-high",
    name: "Paper High",
    category: "Sneakers",
    price: 118,
    cost: 65,
    blurb: "Minimal high-top, canvas construction.",
    weightGrams: 340,
    rating: 4.1,
    art: { shape: "ring", colors: ["#c9c4b6", "#1c2b2a"] },
  },
  {
    id: "shelter-parka",
    name: "Shelter Parka",
    category: "Outerwear",
    price: 210,
    cost: 128,
    blurb: "Insulated shell, packable hood.",
    weightGrams: 920,
    rating: 4.8,
    art: { shape: "block", colors: ["#1c2b2a", "#c9c4b6"] },
  },
  {
    id: "quarter-vest",
    name: "Quarter Vest",
    category: "Outerwear",
    price: 88,
    cost: 49,
    blurb: "Lightweight layer for shoulder-season mornings.",
    weightGrams: 340,
    rating: 4.2,
    art: { shape: "swoop", colors: ["#6f827f", "#4c5fef"] },
  },
  {
    id: "field-cap",
    name: "Field Cap",
    category: "Accessories",
    price: 32,
    cost: 17,
    blurb: "Six-panel cap, brushed cotton.",
    weightGrams: 90,
    rating: 4.4,
    art: { shape: "ring", colors: ["#2e4443", "#edeeea"] },
  },
  {
    id: "day-crossbody",
    name: "Day Crossbody",
    category: "Accessories",
    price: 64,
    cost: 36,
    blurb: "Compact bag, one adjustable strap.",
    weightGrams: 180,
    rating: 4.5,
    art: { shape: "peak", colors: ["#c9c4b6", "#2e4443"] },
  },
];
