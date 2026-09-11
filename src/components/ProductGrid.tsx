import type { ReactNode } from "react";
import type { Product } from "@/data/products";
import { ProductCard } from "./ProductCard";

export function ProductGrid({
  products,
  expandedId,
  onToggle,
  toolbar,
}: {
  products: Product[];
  expandedId: string | null;
  onToggle: (id: string) => void;
  toolbar?: ReactNode;
}) {
  return (
    <section className="py-6">
      {toolbar && <div className="pb-6">{toolbar}</div>}
      {products.length === 0 ? (
        <p className="text-text-dim py-12 text-center">
          Nothing matches. Try a different search, or tell us what you&apos;re looking for below.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              expanded={expandedId === product.id}
              onToggle={() => onToggle(product.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
