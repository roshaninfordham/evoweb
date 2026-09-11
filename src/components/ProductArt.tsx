import type { ProductArt as ProductArtType } from "@/data/products";

const SHAPES: Record<ProductArtType["shape"], string> = {
  swoop: "M4 34 Q 24 8 44 20 Q 30 24 36 40 Q 18 42 4 34 Z",
  block: "M8 10 H40 V38 H8 Z",
  ring: "M24 6 A18 18 0 1 1 23.9 6",
  peak: "M24 6 L42 40 H6 Z",
};

export function ProductArt({ art, className }: { art: ProductArtType; className?: string }) {
  const [from, to] = art.colors;
  const gradientId = `${art.shape}-${from.replace("#", "")}-${to.replace("#", "")}`;

  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      role="presentation"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={from} />
          <stop offset="1" stopColor={to} />
        </linearGradient>
      </defs>
      <path
        d={SHAPES[art.shape]}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={2.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
