import clsx from "clsx";
import { Sparkles } from "lucide-react";

import { MarkdownContent } from "@/components/markdown-content";
import type { ChatMessage, Theme } from "@/lib/chat-types";

type MessageListProps = {
  messages: ChatMessage[];
  theme: Theme;
};

export function MessageList({ messages, theme }: MessageListProps) {
  return (
    <div className="space-y-5">
      {messages.map((message, index) => (
        <div
          key={`${message.role}-${index}`}
          className={clsx("flex", message.role === "user" ? "justify-end" : "justify-start")}
        >
          {message.role === "user" ? (
            <div
              className={clsx(
                "max-w-[82%] rounded-full px-5 py-3 text-sm leading-7 shadow-[0_12px_28px_rgba(99,79,247,0.16)]",
                theme === "light"
                  ? "bg-[rgb(255,255,255)] text-[rgb(var(--text))]"
                  : "bg-[linear-gradient(135deg,rgb(var(--accent)),rgb(var(--accent-2)))] text-white",
              )}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
          ) : (
            <div className="flex max-w-[92%] items-start gap-3">
              <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,rgb(var(--accent)),rgb(var(--accent-2)))] text-white shadow-[0_10px_20px_rgba(99,79,247,0.18)]">
                <Sparkles className="h-4 w-4" />
              </div>
              <div
                className={clsx(
                  "w-full text-sm leading-7",
                  theme === "light"
                    ? "text-[rgb(var(--text))]"
                    : "rounded-[1.5rem] border border-[rgb(var(--border)/0.08)] bg-[rgb(var(--panel-soft)/0.68)] px-5 py-4 text-[rgb(var(--text))]",
                )}
              >
                <MarkdownContent content={message.content} theme={theme} />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
