import type { HistoryEntry, LogEntry } from "@/lib/types";

const STATE_MARK: Record<LogEntry["state"], string> = {
  running: "○",
  done: "●",
  failed: "×",
};

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
          <ul className="flex flex-col gap-1.5 font-console text-sm">
            {log.map((entry) => (
              <li key={entry.id} className="flex gap-3 text-text-inverted">
                <span className="text-text-inverted-dim">{entry.ts}</span>
                <span
                  className={
                    entry.state === "failed"
                      ? "text-flare"
                      : entry.state === "running"
                        ? "text-text-inverted-dim"
                        : "text-text-inverted"
                  }
                >
                  {STATE_MARK[entry.state]}
                </span>
                <span>{entry.label}</span>
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
    </aside>
  );
}
