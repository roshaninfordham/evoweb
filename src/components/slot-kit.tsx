import type { ReactNode } from "react";

export function SlotPanel({ children }: { children: ReactNode }) {
  return (
    <div className="border border-stone bg-paper-dim/60 p-4 flex flex-col gap-3">
      {children}
    </div>
  );
}

export function SlotLabel({ children }: { children: ReactNode }) {
  return <p className="text-sm text-text-dim">{children}</p>;
}

export function SlotRow({ children, gap = "md" }: { children: ReactNode; gap?: "sm" | "md" }) {
  return (
    <div className={`flex items-center flex-wrap ${gap === "sm" ? "gap-2" : "gap-4"}`}>
      {children}
    </div>
  );
}

export function SlotButton({
  children,
  onClick,
  active = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-sm px-3 py-1.5 border transition-colors ${
        active
          ? "border-ink bg-ink text-text-inverted"
          : "border-stone bg-transparent text-text hover:border-ink"
      }`}
    >
      {children}
    </button>
  );
}

export function SlotBadge({ children }: { children: ReactNode }) {
  return (
    <span className="text-xs px-2 py-0.5 border border-stone text-text-dim">
      {children}
    </span>
  );
}

export function SlotLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-sm underline underline-offset-4 text-flare hover:text-ink"
    >
      {children}
    </a>
  );
}

export function SlotRangeSlider({
  min,
  max,
  step = 1,
  value,
  onChange,
  formatValue,
}: {
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
}) {
  return (
    <div className="flex flex-col gap-2 w-full max-w-xs">
      <div className="flex items-baseline justify-between">
        <span className="font-display text-lg">{formatValue ? formatValue(value) : value}</span>
        <span className="text-xs text-text-dim">
          {formatValue ? formatValue(min) : min}–{formatValue ? formatValue(max) : max}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-flare"
      />
    </div>
  );
}

export function SlotTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: { label: string; values: (string | number)[] }[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            <th className="text-left text-text-dim font-normal py-2 pr-4" />
            {columns.map((col) => (
              <th key={col} className="text-left font-display text-base py-2 pr-6">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-t border-stone">
              <td className="py-2 pr-4 text-text-dim">{row.label}</td>
              {row.values.map((val, i) => (
                <td key={i} className="py-2 pr-6">
                  {val}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export const SLOT_KIT = {
  SlotPanel,
  SlotLabel,
  SlotRow,
  SlotButton,
  SlotBadge,
  SlotLink,
  SlotRangeSlider,
  SlotTable,
};
