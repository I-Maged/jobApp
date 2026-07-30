type LogLine = {
  text: string;
  color: string;
  indent?: number;
};

const LOG_LINES: LogLine[] = [
  { text: "[SYSTEM] Initializing JobPilot Agent...", color: "text-info" },
  { text: "[SCAN] Found 14 matching roles", color: "text-accent" },
  {
    text: "↳ Filtered out 3 roles (below salary cap)",
    color: "text-text-muted",
    indent: 1,
  },
  {
    text: "[ACTION] Tailoring resume for Stripe (Frontend)",
    color: "text-success",
  },
  { text: "... Generating cover letter", color: "text-warning" },
];

export function AgentLog() {
  return (
    <div className="overflow-hidden rounded-2xl bg-overlay-dark shadow-[0_24px_48px_-12px_rgba(16,24,40,0.25)]">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
        <span className="h-3 w-3 rounded-full bg-error" />
        <span className="h-3 w-3 rounded-full bg-warning" />
        <span className="h-3 w-3 rounded-full bg-success" />
        <span className="ml-3 font-mono text-xs text-text-muted">agent_log.ts</span>
      </div>

      <div className="px-5 py-6 font-mono text-sm leading-7">
        {LOG_LINES.map((line, idx) => (
          <div
            key={idx}
            className={`${line.color} ${line.indent ? "pl-8" : ""}`}
          >
            {line.text}
          </div>
        ))}
        <div className="mt-2 inline-block h-4 w-2 animate-pulse bg-text-muted" />
      </div>
    </div>
  );
}
