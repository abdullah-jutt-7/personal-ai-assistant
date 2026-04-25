import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import clsx from "clsx";

import type { ChatMessage } from "@/lib/chat-types";

type MessageListProps = {
  messages: ChatMessage[];
};

export function MessageList({ messages }: MessageListProps) {
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
              <div className="app-markdown">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ className, children, ...props }) {
                      return (
                        <code
                          className={clsx(
                            "rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-1.5 py-0.5 text-[0.92em]",
                            className,
                          )}
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    },
                    pre({ children, ...props }) {
                      return (
                        <pre
                          className="overflow-x-auto rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--panel))] p-4 text-sm"
                          {...props}
                        >
                          {children}
                        </pre>
                      );
                    },
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            ) : (
              <p className="whitespace-pre-wrap">{message.content}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

