import type { HistoryEntry, LogEntry, SourceRef } from "@/lib/types";
import { SOURCES, type SourceKey } from "@/lib/sources";

const STATE_MARK: Record<LogEntry["state"], string> = {
  running: "○",
  done: "●",
  failed: "×",
};

const LIVE_DASHBOARDS: SourceKey[] = ["github", "one", "daytona", "crewai"];

function SourceChip({ source }: { source: SourceRef }) {
  const key = typeof source === "string" ? source : source.key;
  const { label, color } = SOURCES[key];
  const href = typeof source === "string" ? SOURCES[key].href : source.href;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs transition-colors hover:brightness-125"
      style={{ borderColor: `${color}55`, color }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </a>
  );
}

function StateMark({ state }: { state: LogEntry["state"] }) {
  if (state === "running") {
    return (
      <span className="relative flex h-2.5 w-2.5 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-flare opacity-75" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-flare" />
      </span>
    );
  }
  return (
    <span className={state === "failed" ? "text-flare shrink-0" : "text-text-inverted shrink-0"}>
      {STATE_MARK[state]}
    </span>
  );
}

export function EnginePanel({
  version,
  flare,
  busy,
  log,
  history,
  onReset,
}: {
  version: string;
  flare: boolean;
  busy: boolean;
  log: LogEntry[];
  history: HistoryEntry[];
  onReset: () => void;
}) {
  return (
    <aside className="bg-ink text-text-inverted flex flex-col min-h-[420px] lg:min-h-screen">
      <div className="px-6 pt-8 pb-6 border-b border-ink-dimmer relative overflow-hidden">
        <div className="flex items-start justify-between">
          <p className="text-xs text-text-inverted-dim font-console">evo engine</p>
          <button
            type="button"
            onClick={onReset}
            disabled={busy}
            className="text-xs text-text-inverted-dim underline underline-offset-2 hover:text-flare disabled:opacity-40 disabled:no-underline"
          >
            Reset demo
          </button>
        </div>
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
          <ul className="flex flex-col gap-3 font-console text-sm">
            {log.map((entry) => (
              <li key={entry.id} className="flex gap-3 text-text-inverted">
                <span className="text-text-inverted-dim shrink-0">{entry.ts}</span>
                <span className="pt-0.5">
                  <StateMark state={entry.state} />
                </span>
                <span className="flex flex-col gap-1">
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
                  {entry.sources && entry.sources.length > 0 && (
                    <span className="flex flex-wrap gap-1.5 mt-0.5">
                      {entry.sources.map((s) => (
                        <SourceChip key={typeof s === "string" ? s : s.key} source={s} />
                      ))}
                    </span>
                  )}
                  {entry.code && (
                    <pre className="mt-1 max-h-48 overflow-auto whitespace-pre-wrap break-words border border-ink-dimmer bg-black/20 p-2 text-xs text-text-inverted-dim">
                      {entry.code}
                    </pre>
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

      <div className="px-6 py-4 border-t border-ink-dimmer flex flex-wrap gap-1.5">
        {LIVE_DASHBOARDS.map((s) => (
          <SourceChip key={s} source={s} />
        ))}
      </div>
    </aside>
  );
}
