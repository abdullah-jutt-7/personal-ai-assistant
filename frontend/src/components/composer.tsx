import { Bot, ArrowRight } from "lucide-react";
import type { KeyboardEvent } from "react";
import { useEffect, useRef, useState } from "react";

type ComposerProps = {
  activeModel: string;
  isSending: boolean;
  onSend: (value: string) => void;
};

export function Composer({ activeModel, isSending, onSend }: ComposerProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const maxHeight = 260;

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
        onSend(input);
        setInput("");
      }
    }
  };

  return (
    <footer className="mx-auto w-full max-w-[920px] px-[clamp(16px,1.2vw,24px)] pb-[clamp(12px,1vw,18px)]">
      <div className="rounded-[1.45rem] border border-[rgb(var(--border)/0.05)] bg-[rgb(var(--panel)/0.92)] p-3 shadow-[0_12px_28px_rgba(0,0,0,0.05)] backdrop-blur-xl">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(event) => {
            setInput(event.target.value);
            resizeTextarea();
          }}
          onKeyDown={handleKeyDown}
          placeholder="Ask IntelliText anything..."
          className="max-h-[260px] w-full resize-none bg-transparent px-1 py-1.5 text-[15px] leading-7 text-[rgb(var(--text))] outline-none placeholder:text-[rgb(var(--muted))]"
        />
        <div className="mt-2 flex flex-col gap-3 border-t border-[rgb(var(--border)/0.06)] pt-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2 text-xs text-[rgb(var(--muted))]">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[rgb(var(--panel-soft)/0.7)] px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-[rgb(var(--text))]">
              <Bot className="h-3.5 w-3.5" />
              Local
            </span>
            <span className="text-[12px] leading-5">Enter to send, Shift+Enter for a new line</span>
            <span className="rounded-full bg-[rgb(var(--panel-soft)/0.84)] px-2.5 py-[3px] text-[10px] uppercase tracking-[0.22em] text-[rgb(var(--text))]">
              {activeModel}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              if (!isSending && input.trim().length > 0) {
                onSend(input);
                setInput("");
              }
            }}
            className="inline-flex items-center gap-2 self-end rounded-full bg-[rgb(var(--accent))] px-[18px] py-[10px] text-sm font-semibold text-white shadow-[0_10px_20px_rgba(97,109,255,0.12)] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
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
