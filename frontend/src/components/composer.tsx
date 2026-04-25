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
    <footer className="mx-auto w-full max-w-[760px] px-[clamp(16px,1.2vw,24px)] pb-[clamp(10px,0.95vw,16px)]">
      <div className="rounded-[1.35rem] bg-[rgb(var(--panel)/0.92)] p-2 shadow-[0_6px_16px_rgba(0,0,0,0.03)] ring-1 ring-[rgb(var(--border)/0.05)] backdrop-blur-xl">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(event) => {
            onChange(event.target.value);
            resizeTextarea();
          }}
          onKeyDown={handleKeyDown}
          placeholder="Ask IntelliText anything..."
          className="max-h-[220px] w-full resize-none bg-transparent px-1 py-1.5 text-[15px] leading-7 text-[rgb(var(--text))] outline-none placeholder:text-[rgb(var(--muted))]"
        />
        <div className="mt-1.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-[rgb(var(--muted))]">
            <Bot className="h-4 w-4" />
            Ollama-powered local chat
            <span className="rounded-full bg-[rgb(var(--panel-soft)/0.84)] px-2 py-0.5 text-[10px] uppercase tracking-[0.25em]">
              {activeModel}
            </span>
          </div>
          <button
            type="button"
            onClick={onSend}
            className="inline-flex items-center gap-2 rounded-full bg-[rgb(var(--accent))] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(97,109,255,0.12)] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
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
