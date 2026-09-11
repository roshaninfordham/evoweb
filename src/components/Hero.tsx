import Image from "next/image";
import type { Product } from "@/data/products";

export function Hero({ product, onView }: { product: Product; onView: () => void }) {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-8 items-center py-10 border-b border-stone">
      <div className="flex flex-col gap-3 order-2 sm:order-1">
        <span className="text-sm text-text-dim">{product.category}</span>
        <h1 className="font-display text-4xl sm:text-5xl leading-tight max-w-sm">
          {product.name}
        </h1>
        <p className="text-text-dim max-w-xs">{product.blurb}</p>
        <div className="flex items-center gap-4 mt-2">
          <span className="font-display text-2xl">${product.price}</span>
          <button
            type="button"
            onClick={onView}
            className="text-sm px-4 py-2 border border-ink hover:bg-ink hover:text-text-inverted transition-colors"
          >
            View details
          </button>
        </div>
      </div>
      <div className="relative w-40 h-40 sm:w-56 sm:h-56 border border-stone order-1 sm:order-2 justify-self-center">
        <Image src={product.imageUrl} alt={product.name} fill className="object-cover" sizes="224px" priority />
      </div>
    </section>
  );
}
