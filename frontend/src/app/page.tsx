"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Bot, FileText, Plus, Sparkles, LibraryBig } from "lucide-react";
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

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

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

    try {
      const res = await fetch(`${apiBaseUrl}/api/chat`, {
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

      const data = (await res.json()) as { conversation_id: number; response: string };
      setActiveConversationId(data.conversation_id);
      setMessages((current) => [
        ...current,
        { role: "assistant", content: data.response },
      ]);

      const convRes = await fetch(`${apiBaseUrl}/api/conversations`);
      if (convRes.ok) {
        setConversations((await convRes.json()) as ConversationSummary[]);
      }
    } catch (error) {
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
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(47,86,255,0.22),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(255,122,89,0.16),_transparent_26%),linear-gradient(180deg,#07111f_0%,#050b14_100%)] text-white">
      <div className="mx-auto flex min-h-screen max-w-[1600px] gap-6 p-4 lg:p-6">
        <aside className="w-[320px] shrink-0 rounded-3xl border border-white/8 bg-white/5 p-4 shadow-glow backdrop-blur-xl">
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#7c8cff,#9f7cff)]">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-white/60">PersonalAIAsisstant</p>
              <h1 className="text-lg font-semibold">IntelliText</h1>
            </div>
          </div>

          <button
            onClick={startNewConversation}
            className="mb-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.01]"
          >
            <Plus className="h-4 w-4" />
            New conversation
          </button>

          <div className="space-y-2">
            <div className="flex items-center gap-2 px-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/40">
              <LibraryBig className="h-4 w-4" />
              Chats
            </div>
            <div className="max-h-[340px] space-y-2 overflow-auto pr-1">
              {conversations.length === 0 && (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-4 text-sm text-white/55">
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
                      ? "border-white/20 bg-white/10"
                      : "border-white/8 bg-white/5 hover:bg-white/8",
                  )}
                >
                  <p className="truncate text-sm font-medium">{conversation.title}</p>
                  <p className="mt-1 text-xs text-white/45">
                    Updated {new Date(conversation.updated_at).toLocaleString()}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 space-y-3 rounded-3xl border border-white/8 bg-black/20 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-white/75">
              <FileText className="h-4 w-4" />
              Memory upload
            </div>
            <label className="flex cursor-pointer items-center justify-center rounded-2xl border border-dashed border-white/12 bg-white/5 px-4 py-4 text-sm text-white/60 transition hover:bg-white/8">
              <input
                type="file"
                accept=".txt"
                className="hidden"
                onChange={onMemoryUpload}
              />
              Upload .txt memory file
            </label>
            <p className="text-xs leading-5 text-white/45">
              Files will become local assistant memory in the next backend stage.
            </p>
            {memoryFileName && (
              <p className="rounded-xl bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
                Ready to store: {memoryFileName}
              </p>
            )}
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col rounded-[2rem] border border-white/8 bg-white/[0.045] shadow-glow backdrop-blur-xl">
          <header className="flex items-center justify-between border-b border-white/8 px-6 py-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/40">Local AI workspace</p>
              <h2 className="mt-1 text-2xl font-semibold text-white">IntelliText</h2>
            </div>
            <div className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-xs text-white/70">
              {accentText}
            </div>
          </header>

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
                        ? "border-[#5a6cff]/30 bg-[#5a6cff] text-white"
                        : "border-white/10 bg-white/8 text-white/90",
                    )}
                  >
                    {message.role === "assistant" ? (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
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

          <footer className="border-t border-white/8 p-4">
            <div className="rounded-[1.75rem] border border-white/10 bg-black/30 p-3">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask IntelliText anything..."
                className="min-h-[92px] w-full resize-none bg-transparent px-2 py-2 text-sm text-white outline-none placeholder:text-white/35"
              />
              <div className="mt-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-white/45">
                  <Bot className="h-4 w-4" />
                  Ollama-powered local chat
                </div>
                <button
                  onClick={sendMessage}
                  className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
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
