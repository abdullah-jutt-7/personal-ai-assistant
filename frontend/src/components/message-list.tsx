import clsx from "clsx";
import { useMemo, useState } from "react";

import { MarkdownContent } from "@/components/markdown-content";
import type { ChatMessage, Theme } from "@/lib/chat-types";

type MessageListProps = {
  messages: ChatMessage[];
  theme: Theme;
  onOpenReasoning: (reasoningText: string, reasoningSeconds: number) => void;
  streamingReasoningText: string;
  streamingReasoningSeconds: number | null;
  isStreamingAssistant: boolean;
};

const USER_MESSAGE_LIMIT = 1000;

export function MessageList({
  messages,
  theme,
  onOpenReasoning,
  streamingReasoningText,
  streamingReasoningSeconds,
  isStreamingAssistant,
}: MessageListProps) {
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
    <div className="space-y-[1.25rem] px-4">
      {visibleMessages.map((message) => {
        const isUser = message.role === "user";
        const isExpanded = expandedMessages[message.key] ?? false;
        const shouldTruncate = isUser && message.content.length > USER_MESSAGE_LIMIT;
        const visibleText =
          shouldTruncate && !isExpanded
            ? `${message.content.slice(0, USER_MESSAGE_LIMIT).trimEnd()}...`
            : message.content;
        const isStreamingAssistantMessage =
          !isUser && isStreamingAssistant && message.key === visibleMessages[visibleMessages.length - 1]?.key;
        const reasoningText = isStreamingAssistantMessage
          ? streamingReasoningText
          : message.reasoning_text ?? "";
        const reasoningSeconds = isStreamingAssistantMessage
          ? streamingReasoningSeconds
          : message.reasoning_seconds ?? null;
        const hasReasoning = !isUser && Boolean(reasoningText.trim()) && Boolean(reasoningSeconds);

        return (
          <div
            key={message.key}
            className={clsx("flex", isUser ? "justify-end" : "justify-start")}
          >
            {isUser ? (
              <div className="max-w-[70%] sm:max-w-[64%]">
                <div className="inline-flex w-fit max-w-full rounded-[0.95rem] bg-[rgb(var(--panel-soft)/0.58)] px-3.5 py-2 text-[0.96rem] leading-6 text-[rgb(var(--text))] ring-1 ring-[rgb(var(--border)/0.05)] shadow-[0_4px_10px_rgba(0,0,0,0.02)]">
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
                    {isExpanded ? "See less" : "See full"}
                  </button>
                )}
              </div>
            ) : (
              <div className="max-w-[84%] text-[15px] leading-7 text-[rgb(var(--text))] sm:max-w-[80%]">
                {hasReasoning && (
                  <div className="mb-3 flex justify-start">
                    <button
                      type="button"
                      onClick={() => onOpenReasoning(reasoningText, reasoningSeconds ?? 0)}
                      className="inline-flex items-center gap-2 rounded-full border border-[rgb(var(--border)/0.06)] bg-[rgb(var(--panel-soft)/0.58)] px-3 py-1.5 text-xs font-medium text-[rgb(var(--text))] transition hover:scale-[1.01]"
                      aria-label={`Open reasoning for this answer, thought for ${reasoningSeconds} seconds`}
                    >
                      <span className="h-2 w-2 rounded-full bg-[rgb(var(--accent))]" />
                      Thought {reasoningSeconds}s
                    </button>
                  </div>
                )}
                <MarkdownContent content={message.content} theme={theme} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
