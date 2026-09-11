"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { products, type Product } from "@/data/products";
import type { SlotId } from "@/lib/slots";
import type { HistoryEntry, LogEntry, SlotState } from "@/lib/types";
import { trackEvent } from "@/lib/track";
import { Nav } from "./Nav";
import { Hero } from "./Hero";
import { SearchBar } from "./SearchBar";
import { ProductGrid } from "./ProductGrid";
import { FeedbackPrompt } from "./FeedbackPrompt";
import { EnginePanel } from "./EnginePanel";
import { DynamicSlot } from "./DynamicSlot";

const MAX_CATALOG_PRICE = Math.max(...products.map((p) => p.price));

function stamp(): string {
  return new Date().toTimeString().slice(0, 8);
}

function extractMaxPrice(text: string): number | null {
  const match = text.match(/\$?\s?(\d{2,4})/);
  return match ? Number(match[1]) : null;
}

export function Storefront() {
  const [category, setCategory] = useState<Product["category"] | "All">("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [viewedNames, setViewedNames] = useState<Set<string>>(new Set());
  const [priceFilterValue, setPriceFilterValue] = useState(MAX_CATALOG_PRICE);

  const [slots, setSlots] = useState<Record<SlotId, SlotState>>({
    "price-filter": null,
    "compare-products": null,
  });
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [activeSlot, setActiveSlot] = useState<SlotId | null>(null);
  const [flare, setFlare] = useState(false);

  useEffect(() => {
    fetch("/api/state")
      .then((res) => res.json())
      .then((data) => {
        setSlots(data.slots);
        setHistory(data.history);
      })
      .catch(() => {});
  }, []);

  const appendLog = useCallback((label: string, state: LogEntry["state"]) => {
    setLog((prev) => [...prev, { id: crypto.randomUUID(), ts: stamp(), label, state }]);
  }, []);

  const startEvolution = useCallback(
    (slotId: SlotId) => {
      setActiveSlot((current) => current ?? slotId);
      const source = new EventSource(`/api/evolve?slotId=${slotId}`);

      const finish = () => {
        source.close();
        setActiveSlot(null);
      };

      source.addEventListener("observe", () => appendLog("Observed a real visitor signal", "done"));
      source.addEventListener("plan_start", () => appendLog("Planning the change", "running"));
      source.addEventListener("plan_done", (e) => {
        const data = JSON.parse((e as MessageEvent).data);
        appendLog(`Plan: ${data.title}`, "done");
      });
      source.addEventListener("build_start", (e) => {
        const data = JSON.parse((e as MessageEvent).data);
        appendLog(data.attempt > 1 ? "Rewriting after a failed check" : "Writing component", "running");
      });
      source.addEventListener("build_done", () => appendLog("Component written", "done"));
      source.addEventListener("verify_start", () =>
        appendLog("Verifying in an isolated sandbox", "running")
      );
      source.addEventListener("verify_done", () => appendLog("Verified", "done"));
      source.addEventListener("verify_failed", () => appendLog("Verification failed", "failed"));
      source.addEventListener("deployed", (e) => {
        const data = JSON.parse((e as MessageEvent).data);
        appendLog(`Shipped: ${data.title}`, "done");
        setSlots((prev) => ({ ...prev, [data.slotId]: { version: data.version, code: data.code } }));
        setHistory((prev) => [
          ...prev,
          {
            slotId: data.slotId,
            version: data.version,
            title: data.title,
            reasoning: data.reasoning,
            createdAt: new Date().toISOString(),
          },
        ]);
        setFlare(true);
        setTimeout(() => setFlare(false), 1400);
        finish();
      });
      source.addEventListener("skip", () => {
        appendLog("No evolution needed yet", "done");
        finish();
      });
      source.addEventListener("failed", () => {
        appendLog("Build failed verification twice — aborted", "failed");
        finish();
      });
      source.addEventListener("error", () => {
        appendLog("Engine connection error", "failed");
        finish();
      });
    },
    [appendLog]
  );

  const handleSearch = useCallback(
    async (query: string) => {
      setSearchQuery(query);
      const maxPrice = extractMaxPrice(query);
      const triggered = maxPrice
        ? await trackEvent("search_price_intent", { query, maxPrice })
        : await trackEvent("search", { query });
      if (triggered) startEvolution(triggered);
    },
    [startEvolution]
  );

  const handleFeedback = useCallback(
    async (text: string) => {
      const maxPrice = extractMaxPrice(text);
      const triggered = maxPrice
        ? await trackEvent("feedback_price", { text, maxPrice })
        : await trackEvent("feedback_generic", { text });
      if (triggered) startEvolution(triggered);
    },
    [startEvolution]
  );

  const handleView = useCallback(
    async (product: Product) => {
      setExpandedId((cur) => (cur === product.id ? null : product.id));
      if (viewedNames.has(product.name)) return;
      setViewedNames((prev) => new Set(prev).add(product.name));
      const triggered = await trackEvent("view_product", {
        productId: product.id,
        productName: product.name,
      });
      if (triggered) startEvolution(triggered);
    },
    [viewedNames, startEvolution]
  );

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (category !== "All" && p.category !== category) return false;
      if (
        searchQuery &&
        !`${p.name} ${p.category} ${p.blurb}`.toLowerCase().includes(searchQuery.toLowerCase())
      )
        return false;
      if (slots["price-filter"] && p.price > priceFilterValue) return false;
      return true;
    });
  }, [category, searchQuery, priceFilterValue, slots]);

  const comparedProducts = useMemo(
    () =>
      products
        .filter((p) => viewedNames.has(p.name))
        .slice(-3)
        .map((p) => ({
          id: p.id,
          name: p.name,
          category: p.category,
          price: p.price,
          weightGrams: p.weightGrams,
          rating: p.rating,
        })),
    [viewedNames]
  );

  const featured = products[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px]">
      <main className="px-6 sm:px-10 max-w-3xl mx-auto lg:mx-0 w-full">
        <Nav category={category} onCategoryChange={setCategory} />
        <Hero product={featured} onView={() => handleView(featured)} />
        <SearchBar onSearch={handleSearch} />
        <ProductGrid
          products={filtered}
          expandedId={expandedId}
          onToggle={(id) => {
            const product = products.find((p) => p.id === id);
            if (product) handleView(product);
          }}
          toolbar={
            slots["price-filter"] && (
              <DynamicSlot
                code={slots["price-filter"].code}
                slotProps={{
                  min: 0,
                  max: MAX_CATALOG_PRICE,
                  value: priceFilterValue,
                  onChange: setPriceFilterValue,
                }}
              />
            )
          }
        />
        {slots["compare-products"] && comparedProducts.length >= 2 && (
          <div className="pb-10">
            <DynamicSlot
              code={slots["compare-products"].code}
              slotProps={{ products: comparedProducts }}
            />
          </div>
        )}
        <FeedbackPrompt onSubmit={handleFeedback} />
      </main>
      <EnginePanel
        version={`v1.${history.length}`}
        flare={flare}
        busy={activeSlot !== null}
        log={log}
        history={history}
      />
    </div>
  );
}
