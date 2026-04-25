import clsx from "clsx";

import { MarkdownContent } from "@/components/markdown-content";
import type { ChatMessage, Theme } from "@/lib/chat-types";

type MessageListProps = {
  messages: ChatMessage[];
  theme: Theme;
};

export function MessageList({ messages, theme }: MessageListProps) {
  return (
    <div className="space-y-4">
      {messages.map((message, index) => (
        <div
          key={`${message.role}-${index}`}
          className={clsx("flex", message.role === "user" ? "justify-end" : "justify-start")}
        >
          <div
            className={clsx(
              "max-w-[80%] rounded-[1.75rem] border px-5 py-4 text-sm leading-7 shadow-lg",
              message.role === "user"
                ? "border-[rgb(var(--accent))] bg-[rgb(var(--accent))] text-white"
                : "border-[rgb(var(--border))] bg-[rgb(var(--panel-soft))] text-[rgb(var(--text))]",
            )}
          >
            {message.role === "assistant" ? (
              <MarkdownContent content={message.content} theme={theme} />
            ) : (
              <p className="whitespace-pre-wrap">{message.content}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
