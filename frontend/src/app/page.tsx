"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Bot, FileText, LibraryBig, MoonStar, Plus, Sparkles, SunMedium } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import clsx from "clsx";

type ConversationSummary = {
  id: number;
  title: string;
  updated_at: string;
};

type ChatMessage = {
  id?: number;
  role: "user" | "assistant";
  content: string;
};

type Theme = "dark" | "light";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";
const themeStorageKey = "personalaiasisstant-theme";

const starterMessages: ChatMessage[] = [
  {
    role: "assistant",
    content:
      "Hi, I am IntelliText. I am here to help with chat, memory, datasets, and future local AI workflows.",
  },
];

export default function Page() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>(starterMessages);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState("Checking local backend...");
  const [memoryFileName, setMemoryFileName] = useState<string | null>(null);
  const [thinkingText, setThinkingText] = useState("");
  const [theme, setTheme] = useState<Theme>("dark");
  const [activeModel, setActiveModel] = useState("qwen3:4b");

  useEffect(() => {
    const storedTheme = window.localStorage.getItem(themeStorageKey) as Theme | null;
    const systemTheme = window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    setTheme(storedTheme ?? systemTheme);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(themeStorageKey, theme);
  }, [theme]);

  useEffect(() => {
    void bootstrap();
  }, []);

  async function bootstrap() {
    try {
      const [healthRes, convRes] = await Promise.all([
        fetch(`${apiBaseUrl}/api/health`),
        fetch(`${apiBaseUrl}/api/conversations`),
      ]);

      const health = await healthRes.json();
      const convData = (await convRes.json()) as ConversationSummary[];

      setStatus(`${health.assistant} ready on local backend`);
      setActiveModel(health.model ?? "qwen3:4b");
      setConversations(convData);

      if (convData.length > 0) {
        const first = convData[0];
        setActiveConversationId(first.id);
        await loadConversation(first.id);
      }
    } catch {
      setStatus("Backend not connected yet");
      setConversations([]);
    }
  }

  async function loadConversation(conversationId: number) {
    const res = await fetch(`${apiBaseUrl}/api/conversations/${conversationId}`);
    if (!res.ok) return;
    const data = (await res.json()) as ChatMessage[];
    setMessages(data.length ? data : starterMessages);
    setActiveConversationId(conversationId);
  }

  async function startNewConversation() {
    const res = await fetch(`${apiBaseUrl}/api/conversations`, { method: "POST" });
    if (!res.ok) return;
    const data = (await res.json()) as ConversationSummary;
    setConversations((current) => [data, ...current]);
    setActiveConversationId(data.id);
    setMessages(starterMessages);
  }

  async function sendMessage() {
    const trimmed = input.trim();
    if (!trimmed || isSending) return;

    const optimisticUserMessage: ChatMessage = { role: "user", content: trimmed };
    setMessages((current) => [...current, optimisticUserMessage]);
    setInput("");
    setIsSending(true);
    setThinkingText("");

    try {
      let assistantIndex = -1;
      setMessages((current) => {
        const next = [...current, { role: "assistant" as const, content: "" }];
        assistantIndex = next.length - 1;
        return next;
      });

      const res = await fetch(`${apiBaseUrl}/api/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          conversation_id: activeConversationId,
        }),
      });

      if (!res.ok) {
        throw new Error(`Request failed with status ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) {
        throw new Error("Streaming response body is not available");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      const applyDelta = (delta: string) => {
        if (assistantIndex < 0) return;
        setMessages((current) => {
          if (!current[assistantIndex]) return current;
          const next = [...current];
          next[assistantIndex] = {
            ...next[assistantIndex],
            content: `${next[assistantIndex].content}${delta}`,
          };
          return next;
        });
      };

      const parseEventBlock = (block: string) => {
        const lines = block.split("\n");
        let eventName = "message";
        let dataText = "";

        for (const line of lines) {
          if (line.startsWith("event:")) {
            eventName = line.slice("event:".length).trim();
          } else if (line.startsWith("data:")) {
            dataText += line.slice("data:".length).trim();
          }
        }

        return { eventName, dataText };
      };

      const flushBuffer = () => {
        let separatorIndex = buffer.indexOf("\n\n");

        while (separatorIndex !== -1) {
          const block = buffer.slice(0, separatorIndex).trim();
          buffer = buffer.slice(separatorIndex + 2);
          separatorIndex = buffer.indexOf("\n\n");

          if (!block) continue;

          const { eventName, dataText } = parseEventBlock(block);
          if (!dataText) continue;

          const payload = JSON.parse(dataText) as {
            conversation_id?: number;
            delta?: string;
            response?: string;
            thinking?: string;
            detail?: string;
          };

          if (eventName === "meta" && payload.conversation_id) {
            setActiveConversationId(payload.conversation_id);
          } else if (eventName === "thinking" && payload.delta) {
            setThinkingText((current) => `${current}${payload.delta}`);
          } else if (eventName === "content" && payload.delta) {
            applyDelta(payload.delta);
          } else if (eventName === "done") {
            if (payload.conversation_id) {
              setActiveConversationId(payload.conversation_id);
            }
            if (typeof payload.response === "string") {
              setMessages((current) => {
                if (assistantIndex < 0 || !current[assistantIndex]) return current;
                const next = [...current];
                next[assistantIndex] = {
                  ...next[assistantIndex],
                  content: payload.response ?? "",
                };
                return next;
              });
            }
          } else if (eventName === "error") {
            throw new Error(payload.detail || "Streaming failed");
          }
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        flushBuffer();
      }

      buffer += decoder.decode();
      flushBuffer();

      const convRes = await fetch(`${apiBaseUrl}/api/conversations`);
      if (convRes.ok) {
        setConversations((await convRes.json()) as ConversationSummary[]);
      }
    } catch (error) {
      setMessages((current) => {
        const next = [...current];
        const last = next[next.length - 1];
        if (last?.role === "assistant" && last.content === "") {
          next.pop();
        }
        return next;
      });
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            "I could not reach the local backend. Start FastAPI and Ollama, then try again.",
        },
      ]);
      console.error(error);
    } finally {
      setIsSending(false);
      setThinkingText("");
    }
  }

  async function onMemoryUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${apiBaseUrl}/api/memory/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Upload failed with status ${res.status}`);
      }

      const data = (await res.json()) as {
        success: boolean;
        name: string;
        chunk_count: number;
      };

      if (data.success) {
        setMemoryFileName(`${data.name} (${data.chunk_count} chunks saved)`);
      }
    } catch (error) {
      console.error(error);
      setMemoryFileName("Upload failed");
    }
  }

  const accentText = useMemo(
    () => (isSending ? "IntelliText is thinking..." : status),
    [isSending, status],
  );

  return (
    <main className="app-shell min-h-screen text-[rgb(var(--text))]">
      <div className="mx-auto flex min-h-screen max-w-[1600px] gap-6 p-4 lg:p-6">
        <aside className="app-panel w-[320px] shrink-0 rounded-3xl p-4">
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--panel-soft))] p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgb(var(--accent)),rgb(var(--accent-2)))] text-white">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-[rgb(var(--muted))]">PersonalAIAsisstant</p>
              <h1 className="text-lg font-semibold">IntelliText</h1>
            </div>
          </div>

          <button
            onClick={startNewConversation}
            className="mb-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--text))] px-4 py-3 text-sm font-semibold text-[rgb(var(--bg))] transition hover:scale-[1.01]"
          >
            <Plus className="h-4 w-4" />
            New conversation
          </button>

          <div className="space-y-2">
            <div className="flex items-center gap-2 px-2 text-xs font-semibold uppercase tracking-[0.24em] text-[rgb(var(--muted))]">
              <LibraryBig className="h-4 w-4" />
              Chats
            </div>
            <div className="max-h-[340px] space-y-2 overflow-auto pr-1">
              {conversations.length === 0 && (
                <div className="rounded-2xl border border-dashed border-[rgb(var(--border))] bg-[rgb(var(--panel-soft))] p-4 text-sm text-[rgb(var(--muted))]">
                  No conversations yet.
                </div>
              )}
              {conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => loadConversation(conversation.id)}
                  className={clsx(
                    "w-full rounded-2xl border px-4 py-3 text-left transition",
                    activeConversationId === conversation.id
                      ? "border-[rgb(var(--border))] bg-[rgb(var(--panel-soft))]"
                      : "border-[rgb(var(--border))] bg-[rgb(var(--panel))] hover:bg-[rgb(var(--panel-soft))]",
                  )}
                >
                  <p className="truncate text-sm font-medium">{conversation.title}</p>
                  <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                    Updated {new Date(conversation.updated_at).toLocaleString()}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 space-y-3 rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--panel-soft))] p-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <FileText className="h-4 w-4" />
              Memory upload
            </div>
            <label className="flex cursor-pointer items-center justify-center rounded-2xl border border-dashed border-[rgb(var(--border))] bg-transparent px-4 py-4 text-sm text-[rgb(var(--muted))] transition hover:bg-[rgb(var(--panel))]">
              <input
                type="file"
                accept=".txt"
                className="hidden"
                onChange={onMemoryUpload}
              />
              Upload .txt memory file
            </label>
            <p className="text-xs leading-5 text-[rgb(var(--muted))]">
              Files will become local assistant memory in the next backend stage.
            </p>
            {memoryFileName && (
              <p
                className="rounded-xl px-3 py-2 text-xs text-[rgb(var(--text))]"
                style={{ backgroundColor: "rgb(var(--accent) / 0.12)" }}
              >
                Ready to store: {memoryFileName}
              </p>
            )}
          </div>
        </aside>

        <section className="app-panel flex min-w-0 flex-1 flex-col rounded-[2rem]">
          <header className="flex items-center justify-between border-b border-[rgb(var(--border))] px-6 py-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[rgb(var(--muted))]">
                Local AI workspace
              </p>
              <h2 className="mt-1 text-2xl font-semibold">IntelliText</h2>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--panel-soft))] px-4 py-2 text-xs text-[rgb(var(--muted))]">
                {accentText}
              </div>
              <button
                type="button"
                onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
                className="inline-flex items-center gap-2 rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--panel-soft))] px-4 py-2 text-xs font-medium text-[rgb(var(--text))] transition hover:scale-[1.01]"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
                {theme === "dark" ? "Light mode" : "Dark mode"}
              </button>
            </div>
          </header>

          {thinkingText && (
            <div className="border-b border-[rgb(var(--border))] bg-[rgb(var(--panel-soft))]/50 px-6 py-3 text-xs text-[rgb(var(--muted))]">
              <details className="group">
                <summary className="cursor-pointer list-none font-medium text-[rgb(var(--text))]">
                  Model thinking
                </summary>
                <div className="mt-2 whitespace-pre-wrap rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--panel))] p-3 leading-6 text-[rgb(var(--muted))]">
                  {thinkingText}
                </div>
              </details>
            </div>
          )}

          <div className="flex-1 overflow-auto px-6 py-6">
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
                    ) : (
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <footer className="border-t border-[rgb(var(--border))] p-4">
            <div className="rounded-[1.75rem] border border-[rgb(var(--border))] bg-[rgb(var(--panel-soft))] p-3">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask IntelliText anything..."
                className="min-h-[92px] w-full resize-none bg-transparent px-2 py-2 text-sm text-[rgb(var(--text))] outline-none placeholder:text-[rgb(var(--muted))]"
              />
              <div className="mt-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-[rgb(var(--muted))]">
                  <Bot className="h-4 w-4" />
                  Ollama-powered local chat
                  <span className="rounded-full border border-[rgb(var(--border))] px-2 py-0.5 text-[10px] uppercase tracking-[0.25em]">
                    {activeModel}
                  </span>
                </div>
                <button
                  onClick={sendMessage}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[rgb(var(--text))] px-4 py-2.5 text-sm font-semibold text-[rgb(var(--bg))] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isSending || input.trim().length === 0}
                >
                  Send
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </footer>
        </section>
      </div>
    </main>
  );
}
