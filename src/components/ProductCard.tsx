import type { Product } from "@/data/products";
import { ProductArt } from "./ProductArt";

export function ProductCard({
  product,
  expanded,
  onToggle,
}: {
  product: Product;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="text-left border-b border-stone py-6 flex flex-col gap-3 group"
    >
      <ProductArt art={product.art} className="w-full h-28" />
      <div className="flex items-baseline justify-between">
        <span className="font-display text-lg">{product.name}</span>
        <span className="text-sm text-text-dim">${product.price}</span>
      </div>
      {expanded && (
        <p className="text-sm text-text-dim -mt-1">{product.blurb}</p>
      )}
    </button>
  );
}
