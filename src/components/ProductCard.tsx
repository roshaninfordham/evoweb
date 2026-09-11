import Image from "next/image";
import type { Product } from "@/data/products";

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
      <div className="relative w-full h-28 border border-stone bg-paper-dim">
        <Image src={product.imageUrl} alt={product.name} fill className="object-cover" sizes="220px" />
      </div>
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
