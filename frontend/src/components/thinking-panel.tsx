import { X } from "lucide-react";

type ThinkingPanelProps = {
  reasoningText: string;
  reasoningSeconds: number | null;
  isOpen: boolean;
  onClose: () => void;
};

export function ThinkingPanel({ reasoningText, reasoningSeconds, isOpen, onClose }: ThinkingPanelProps) {
  if (!reasoningText) return null;

  return (
    <div
      className={[
        "fixed inset-0 z-[80] transition",
        isOpen ? "pointer-events-auto" : "pointer-events-none",
      ].join(" ")}
      aria-hidden={!isOpen}
    >
      <button
        type="button"
        onClick={onClose}
        className={[
          "absolute inset-0 bg-black/45 backdrop-blur-[2px] transition-opacity duration-200",
          isOpen ? "opacity-100" : "opacity-0",
        ].join(" ")}
        aria-label="Close reasoning drawer"
        tabIndex={isOpen ? 0 : -1}
      />

      <aside
        className={[
          "absolute right-0 top-0 h-full w-full border-l border-[rgb(var(--border)/0.08)] bg-[rgb(var(--panel)/0.98)] shadow-[0_28px_60px_rgba(0,0,0,0.24)] backdrop-blur-2xl transition-transform duration-200 ease-out",
          "sm:w-[420px]",
          isOpen ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
      >
        <div className="flex h-full min-h-0 flex-col">
          <div className="flex items-start justify-between gap-3 border-b border-[rgb(var(--border)/0.06)] px-4 py-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.24em] text-[rgb(var(--muted))]">Activity</p>
              <h3 className="mt-1 text-[1rem] font-semibold text-[rgb(var(--text))]">
                Thought {reasoningSeconds !== null ? `${reasoningSeconds}s` : ""}
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[rgb(var(--panel-soft)/0.72)] text-[rgb(var(--text))]"
              aria-label="Close reasoning drawer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-auto px-4 py-4 scrollbar-hide">
            <div className="rounded-[1rem] border border-[rgb(var(--border)/0.06)] bg-[rgb(var(--panel-soft)/0.5)] p-4 text-sm leading-7 text-[rgb(var(--text))]">
              <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-[rgb(var(--muted))]">
                <span className="h-2 w-2 rounded-full bg-[rgb(var(--accent))]" />
                Reasoning
              </div>
              <div className="whitespace-pre-wrap text-[rgb(var(--muted))]">{reasoningText}</div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
