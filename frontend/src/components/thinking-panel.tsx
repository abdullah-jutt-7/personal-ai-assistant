type ThinkingPanelProps = {
  thinkingText: string;
};

export function ThinkingPanel({ thinkingText }: ThinkingPanelProps) {
  if (!thinkingText) return null;

  return (
    <div className="border-b border-[rgb(var(--border)/0.08)] bg-[rgb(var(--panel-soft)/0.45)] px-[clamp(16px,1.3vw,28px)] py-3 text-xs text-[rgb(var(--muted))]">
      <details className="group">
        <summary className="cursor-pointer list-none font-medium text-[rgb(var(--text))]">
          Model thinking
        </summary>
        <div className="mt-2 whitespace-pre-wrap rounded-2xl border border-[rgb(var(--border)/0.08)] bg-[rgb(var(--panel))] p-3 leading-6 text-[rgb(var(--muted))]">
          {thinkingText}
        </div>
      </details>
    </div>
  );
}
