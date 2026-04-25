import { Bot, ArrowRight } from "lucide-react";
import type { KeyboardEvent } from "react";
import { useEffect, useRef } from "react";

type ComposerProps = {
  activeModel: string;
  input: string;
  isSending: boolean;
  onChange: (value: string) => void;
  onSend: () => void;
};

export function Composer({ activeModel, input, isSending, onChange, onSend }: ComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const maxHeight = 220;

  const resizeTextarea = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "0px";
    const nextHeight = Math.min(textarea.scrollHeight, maxHeight);
    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? "auto" : "hidden";
  };

  useEffect(() => {
    resizeTextarea();
  }, [input]);

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (!isSending && input.trim().length > 0) {
        onSend();
      }
    }
  };

  return (
    <footer className="mx-auto w-full max-w-[800px] px-[clamp(16px,1.3vw,28px)] pb-[clamp(14px,1.25vw,24px)]">
      <div className="rounded-[1.5rem] bg-[rgb(var(--panel))] p-3 shadow-[0_12px_34px_rgba(0,0,0,0.08)] ring-1 ring-[rgb(var(--border)/0.08)]">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(event) => {
            onChange(event.target.value);
            resizeTextarea();
          }}
          onKeyDown={handleKeyDown}
          placeholder="Ask IntelliText anything..."
          className="max-h-[220px] w-full resize-none bg-transparent px-1 py-2 text-sm leading-7 text-[rgb(var(--text))] outline-none placeholder:text-[rgb(var(--muted))]"
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
            className="inline-flex items-center gap-2 rounded-full bg-[rgb(var(--accent))] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_26px_rgba(97,109,255,0.18)] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
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
