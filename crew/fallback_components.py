"""
Hand-written, known-correct components for each slot — used only when the
Builder's LLM call times out or errors. This is the one place a human (not
an LLM) authored the code, and it's used explicitly as a last resort, never
silently: every use is logged as a fallback in the reasoning trail.

These are not a way to skip real work. Everything downstream of this file
still happens for real: the code is genuinely re-verified with `tsc --noEmit`
in the live Daytona sandbox, genuinely reviewed by the Reviewer agent, and
genuinely opened/merged as a GitHub PR. Only the *generation* step — the one
with no honest fallback for a hung/broken third-party LLM — has a safety net.

PRICE_FILTER's code below is exactly what the Builder itself produced and
successfully shipped in an earlier real run (PR #1, evo/price-filter-v6).
"""

PRICE_FILTER = """function Component(props: PriceFilterProps) {
  return (
    <SlotPanel>
      <SlotLabel>{"Under $" + props.value}</SlotLabel>
      <SlotRangeSlider
        min={props.min}
        max={props.max}
        value={props.value}
        onChange={props.onChange}
      />
    </SlotPanel>
  );
}"""

COMPARE_PRODUCTS = """function Component(props: CompareProductsProps) {
  const columns = props.products.map((p) => p.name);
  const rows = [
    { label: "Price", values: props.products.map((p) => "$" + p.price) },
    { label: "Weight", values: props.products.map((p) => p.weightGrams + "g") },
    { label: "Rating", values: props.products.map((p) => String(p.rating)) },
  ];
  return (
    <SlotPanel>
      <SlotLabel>{"Comparing " + props.products.length + " products"}</SlotLabel>
      <SlotTable columns={columns} rows={rows} />
    </SlotPanel>
  );
}"""

BUDGET_MATCH = """function Component(props: BudgetMatchProps) {
  if (props.internalOffer) {
    return (
      <SlotPanel>
        <SlotLabel>{"A match for your budget: " + props.internalOffer.name}</SlotLabel>
        <SlotRow>
          <SlotBadge>{"was $" + props.internalOffer.originalPrice}</SlotBadge>
          <SlotBadge>{"now $" + props.internalOffer.offerPrice}</SlotBadge>
        </SlotRow>
      </SlotPanel>
    );
  }
  if (props.externalFind) {
    return (
      <SlotPanel>
        <SlotLabel>{"Found elsewhere: " + props.externalFind.name}</SlotLabel>
        <SlotRow>
          <SlotBadge>{"$" + props.externalFind.price}</SlotBadge>
          <SlotLink href={props.externalFind.url}>View</SlotLink>
        </SlotRow>
      </SlotPanel>
    );
  }
  return null;
}"""

BY_LABEL = {
    "Price filter": PRICE_FILTER,
    "Compare products": COMPARE_PRODUCTS,
    "Budget match": BUDGET_MATCH,
}
