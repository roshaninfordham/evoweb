export type SourceKey = "crewai" | "you" | "daytona" | "github" | "one";

export type Source = { label: string; href: string; color: string };

// Labels are deliberately provider-neutral (the underlying engine is meant to
// be open-sourced independent of any one vendor) — hrefs still point at the
// real systems actually doing the work, so a click always shows genuine
// evidence, just under a generic name rather than a specific product's.
export const SOURCES: Record<SourceKey, Source> = {
  crewai: { label: "AI Agent", href: "https://app.crewai.com/", color: "#a78bfa" },
  you: { label: "Web Research", href: "https://app.withone.ai/", color: "#2dd4bf" },
  daytona: { label: "Sandbox Verify", href: "https://app.daytona.io/dashboard/sandboxes", color: "#fb923c" },
  one: { label: "Tool Runtime", href: "https://app.withone.ai/", color: "#4c5fef" },
  github: { label: "GitHub", href: "https://github.com/roshaninfordham/evoweb", color: "#e7ece9" },
};
