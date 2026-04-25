import { Bot, ArrowRight } from "lucide-react";
import type { KeyboardEvent } from "react";

type ComposerProps = {
  activeModel: string;
  input: string;
  isSending: boolean;
  onChange: (value: string) => void;
  onSend: () => void;
};

export function Composer({ activeModel, input, isSending, onChange, onSend }: ComposerProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (!isSending && input.trim().length > 0) {
        onSend();
      }
    }
  };

  return (
    <footer className="border-t border-[rgb(var(--border)/0.1)] p-[clamp(12px,1vw,20px)]">
      <div className="rounded-[1.75rem] border border-[rgb(var(--border)/0.09)] bg-[rgb(var(--panel-soft)/0.7)] p-3">
        <textarea
          value={input}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask IntelliText anything..."
            className="min-h-[92px] w-full resize-none bg-transparent px-2 py-2 text-sm text-[rgb(var(--text))] outline-none placeholder:text-[rgb(var(--muted))]"
        />
        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-[rgb(var(--muted))]">
            <Bot className="h-4 w-4" />
            Ollama-powered local chat
            <span className="rounded-full border border-[rgb(var(--border)/0.09)] px-2 py-0.5 text-[10px] uppercase tracking-[0.25em]">
              {activeModel}
            </span>
          </div>
          <button
            type="button"
            onClick={onSend}
            className="inline-flex items-center gap-2 rounded-2xl bg-[rgb(var(--text))] px-4 py-2.5 text-sm font-semibold text-[rgb(var(--bg))] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isSending || input.trim().length === 0}
          >
            Send
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </footer>
  );
}
