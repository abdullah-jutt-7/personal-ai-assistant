import clsx from "clsx";
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
    <div className="space-y-[1.125rem]">
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
              <div className="max-w-[74%]">
                <div className="inline-flex w-fit max-w-full rounded-[0.95rem] bg-[rgb(var(--panel-soft)/0.62)] px-3 py-1.5 text-sm leading-6 text-[rgb(var(--text))] ring-1 ring-[rgb(var(--border)/0.05)] shadow-[0_4px_10px_rgba(0,0,0,0.02)]">
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
              <div className="max-w-[82%] text-[15px] leading-7 text-[rgb(var(--text))]">
                <MarkdownContent content={message.content} theme={theme} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
