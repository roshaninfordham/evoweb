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
  /** Real photo (via You.com search, Unsplash), verified to load. Illustrative of the category, not this exact fictional item. */
  imageUrl: string;
};

function unsplash(photoId: string): string {
  return `https://images.unsplash.com/${photoId}?w=480&q=80&auto=format&fit=crop`;
}

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
    imageUrl: unsplash("photo-1608231387042-66d1773070a5"),
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
    imageUrl: unsplash("photo-1573532006015-013d2bf17ebd"),
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
    imageUrl: unsplash("photo-1718248028293-934f04a578db"),
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
    imageUrl: unsplash("photo-1562105962-2fbaaf107fe3"),
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
    imageUrl: unsplash("photo-1706765779494-2705542ebe74"),
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
    imageUrl: unsplash("photo-1556691421-cf15fe27a0b6"),
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
    imageUrl: unsplash("photo-1521369909029-2afed882baee"),
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
    imageUrl: unsplash("photo-1605733513597-a8f8341084e6"),
  },
];
