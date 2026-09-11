import { useState } from "react";

export function SearchBar({ onSearch }: { onSearch: (query: string) => void }) {
  const [value, setValue] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSearch(value);
      }}
      className="py-4"
    >
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search products, e.g. “black sneakers under $100”"
        className="w-full bg-transparent border-b border-stone py-2 text-base placeholder:text-text-dim focus:outline-none focus:border-ink"
      />
    </form>
  );
}
