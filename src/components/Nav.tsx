import type { Product } from "@/data/products";

const CATEGORIES: Array<Product["category"] | "All"> = ["All", "Sneakers", "Outerwear", "Accessories"];

export function Nav({
  category,
  onCategoryChange,
}: {
  category: Product["category"] | "All";
  onCategoryChange: (category: Product["category"] | "All") => void;
}) {
  return (
    <nav className="flex items-center justify-between py-6">
      <span className="font-display text-2xl tracking-tight">Nova</span>
      <div className="flex gap-6 text-sm">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => onCategoryChange(cat)}
            className={
              cat === category
                ? "text-text border-b border-ink pb-0.5"
                : "text-text-dim hover:text-text transition-colors"
            }
          >
            {cat}
          </button>
        ))}
      </div>
    </nav>
  );
}
