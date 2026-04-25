import clsx from "clsx";
import { Sparkles } from "lucide-react";
import { useMemo, useState } from "react";

import { MarkdownContent } from "@/components/markdown-content";
import type { ChatMessage, Theme } from "@/lib/chat-types";

type MessageListProps = {
  messages: ChatMessage[];
  theme: Theme;
};

const USER_MESSAGE_LIMIT = 1000;

export function MessageList({ messages, theme }: MessageListProps) {
  const [expandedMessages, setExpandedMessages] = useState<Record<string, boolean>>({});

  const visibleMessages = useMemo(
    () =>
      messages.map((message, index) => ({
        ...message,
        key: `${message.role}-${message.id ?? index}`,
        index,
      })),
    [messages],
  );

  return (
    <div className="space-y-5">
      {visibleMessages.map((message) => {
        const isUser = message.role === "user";
        const isExpanded = expandedMessages[message.key] ?? false;
        const shouldTruncate = isUser && message.content.length > USER_MESSAGE_LIMIT;
        const visibleText =
          shouldTruncate && !isExpanded
            ? `${message.content.slice(0, USER_MESSAGE_LIMIT).trimEnd()}...`
            : message.content;

        return (
          <div
            key={message.key}
            className={clsx("flex", isUser ? "justify-end" : "justify-start")}
          >
            {isUser ? (
              <div className="max-w-[82%]">
                <div className="rounded-full bg-[linear-gradient(135deg,rgb(var(--accent)),rgb(var(--accent-2)))] px-5 py-3 text-sm leading-7 text-white shadow-[0_12px_28px_rgba(99,79,247,0.16)]">
                  <p className="whitespace-pre-wrap">{visibleText}</p>
                </div>
                {shouldTruncate && (
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedMessages((current) => ({
                        ...current,
                        [message.key]: !current[message.key],
                      }))
                    }
                    className="mt-2 inline-flex text-xs font-medium text-[rgb(var(--accent))] underline decoration-[rgb(var(--accent)/0.35)] underline-offset-4"
                  >
                    {isExpanded ? "See less" : "See full message"}
                  </button>
                )}
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
        );
      })}
    </div>
  );
}
