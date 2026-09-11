import type { HistoryEntry, LogEntry } from "@/lib/types";

const STATE_MARK: Record<LogEntry["state"], string> = {
  running: "○",
  done: "●",
  failed: "×",
};

const LIVE_DASHBOARDS = [
  { label: "GitHub repo", href: "https://github.com/roshaninfordham/evoweb" },
  { label: "One", href: "https://app.withone.ai/" },
  { label: "Daytona", href: "https://app.daytona.io/dashboard/sandboxes" },
  { label: "CrewAI", href: "https://app.crewai.com/" },
];

export function EnginePanel({
  version,
  flare,
  busy,
  log,
  history,
}: {
  version: string;
  flare: boolean;
  busy: boolean;
  log: LogEntry[];
  history: HistoryEntry[];
}) {
  return (
    <aside className="bg-ink text-text-inverted flex flex-col min-h-[420px] lg:min-h-screen">
      <div className="px-6 pt-8 pb-6 border-b border-ink-dimmer relative overflow-hidden">
        <p className="text-xs text-text-inverted-dim font-console">evo engine</p>
        <div className="flex items-baseline gap-3 mt-1">
          <span className="font-display text-3xl">{version}</span>
          <span className="text-xs text-text-inverted-dim">
            {busy ? "evolving…" : "watching for signals"}
          </span>
        </div>
        {flare && (
          <span className="absolute left-0 bottom-0 h-px w-full bg-flare animate-flare" />
        )}
      </div>

      <div className="px-6 py-6 flex-1 overflow-y-auto">
        <p className="text-xs text-text-inverted-dim mb-3">activity</p>
        {log.length === 0 ? (
          <p className="text-sm text-text-inverted-dim font-console">
            no evolutions running
          </p>
        ) : (
          <ul className="flex flex-col gap-2 font-console text-sm">
            {log.map((entry) => (
              <li key={entry.id} className="flex gap-3 text-text-inverted">
                <span className="text-text-inverted-dim shrink-0">{entry.ts}</span>
                <span
                  className={
                    entry.state === "failed"
                      ? "text-flare shrink-0"
                      : entry.state === "running"
                        ? "text-text-inverted-dim shrink-0"
                        : "text-text-inverted shrink-0"
                  }
                >
                  {STATE_MARK[entry.state]}
                </span>
                <span className="flex flex-col">
                  {entry.href ? (
                    <a
                      href={entry.href}
                      target="_blank"
                      rel="noreferrer"
                      className="underline underline-offset-2 hover:text-flare"
                    >
                      {entry.label}
                    </a>
                  ) : (
                    <span>{entry.label}</span>
                  )}
                  {entry.agent && (
                    <span className="text-xs text-text-inverted-dim">{entry.agent}</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {history.length > 0 && (
        <div className="px-6 py-6 border-t border-ink-dimmer">
          <p className="text-xs text-text-inverted-dim mb-3">what changed</p>
          <ul className="flex flex-col gap-4">
            {history.map((h, i) => (
              <li key={`${h.slotId}-${h.version}`}>
                <p className="text-sm">
                  <span className="font-console text-text-inverted-dim">v1.{i + 1}</span>{" "}
                  {h.title}
                </p>
                <p className="text-xs text-text-inverted-dim mt-0.5">{h.reasoning}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="px-6 py-4 border-t border-ink-dimmer flex flex-wrap gap-x-4 gap-y-1">
        {LIVE_DASHBOARDS.map((d) => (
          <a
            key={d.label}
            href={d.href}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-text-inverted-dim underline underline-offset-2 hover:text-flare"
          >
            {d.label}
          </a>
        ))}
      </div>
    </aside>
  );
}
