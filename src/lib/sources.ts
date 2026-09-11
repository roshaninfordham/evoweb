export type SourceKey = "crewai" | "you" | "daytona" | "github" | "one";

export type Source = { label: string; href: string; color: string };

export const SOURCES: Record<SourceKey, Source> = {
  crewai: { label: "CrewAI", href: "https://app.crewai.com/", color: "#a78bfa" },
  you: { label: "You.com via One", href: "https://app.withone.ai/", color: "#2dd4bf" },
  daytona: { label: "Daytona via One", href: "https://app.daytona.io/dashboard/sandboxes", color: "#fb923c" },
  one: { label: "One", href: "https://app.withone.ai/", color: "#4c5fef" },
  github: { label: "GitHub", href: "https://github.com/roshaninfordham/evoweb", color: "#e7ece9" },
};
