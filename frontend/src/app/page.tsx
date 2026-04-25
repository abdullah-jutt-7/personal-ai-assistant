"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";

import { AppSidebar } from "@/components/app-sidebar";
import { ChatHeader } from "@/components/chat-header";
import { Composer } from "@/components/composer";
import { MessageList } from "@/components/message-list";
import { ThinkingPanel } from "@/components/thinking-panel";
import type { ChatMessage, ConversationSummary, DatasetSummary, Theme } from "@/lib/chat-types";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";
const themeStorageKey = "personalaiasisstant-theme";

const starterMessages: ChatMessage[] = [
  {
    role: "assistant",
    content:
      "Hi, I am IntelliText. I am here to help with chat, memory, datasets, and future local AI workflows.",
  },
];

type StreamPayload = {
  conversation_id?: number;
  delta?: string;
  response?: string;
  thinking?: string;
  detail?: string;
};

export default function Page() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>(starterMessages);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState("Checking local backend...");
  const [memoryFileName, setMemoryFileName] = useState<string | null>(null);
  const [datasetFileName, setDatasetFileName] = useState<string | null>(null);
  const [thinkingText, setThinkingText] = useState("");
  const [theme, setTheme] = useState<Theme>("dark");
  const [activeModel, setActiveModel] = useState("qwen3:4b");
  const [isCompactViewport, setIsCompactViewport] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const [datasets, setDatasets] = useState<DatasetSummary[]>([]);

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
    const media = window.matchMedia("(max-width: 980px)");

    const updateViewportState = () => {
      setIsCompactViewport(media.matches);
      setSidebarOpen(!media.matches);
    };

    updateViewportState();
    media.addEventListener("change", updateViewportState);

    return () => {
      media.removeEventListener("change", updateViewportState);
    };
  }, []);

  useEffect(() => {
    if (!isCompactViewport) return;
    document.body.style.overflow = sidebarOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isCompactViewport, sidebarOpen]);

  useEffect(() => {
    if (!isCompactViewport || !sidebarOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSidebarOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isCompactViewport, sidebarOpen]);

  useEffect(() => {
    void bootstrap();
  }, []);

  useEffect(() => {
    const container = chatScrollRef.current;
    if (!container) return;

    container.scrollTo({
      top: container.scrollHeight,
      behavior: isSending ? "smooth" : "auto",
    });
  }, [messages, thinkingText, isSending]);

  async function bootstrap() {
    try {
      const [healthRes, convRes, datasetRes] = await Promise.all([
        fetch(`${apiBaseUrl}/api/health`),
        fetch(`${apiBaseUrl}/api/conversations`),
        fetch(`${apiBaseUrl}/api/datasets`),
      ]);

      const health = await healthRes.json();
      const convData = (await convRes.json()) as ConversationSummary[];
      const datasetData = (await datasetRes.json()) as DatasetSummary[];

      setStatus(`${health.assistant} ready on local backend`);
      setActiveModel(health.model ?? "qwen3:4b");
      setConversations(convData);
      setDatasets(datasetData);

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
    if (isCompactViewport) setSidebarOpen(false);
  }

  async function startNewConversation() {
    const res = await fetch(`${apiBaseUrl}/api/conversations`, { method: "POST" });
    if (!res.ok) return;
    const data = (await res.json()) as ConversationSummary;
    setConversations((current) => [data, ...current]);
    setActiveConversationId(data.id);
    setMessages(starterMessages);
    if (isCompactViewport) setSidebarOpen(false);
  }

  async function sendMessage() {
    const trimmed = input.trim();
    if (!trimmed || isSending) return;

    setMessages((current) => [...current, { role: "user", content: trimmed }]);
    setInput("");
    setIsSending(true);
    setThinkingText("");

    let assistantIndex = -1;

    try {
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

          const payload = JSON.parse(dataText) as StreamPayload;

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

  async function onMemoryUpload(event: ChangeEvent<HTMLInputElement>) {
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
        if (isCompactViewport) setSidebarOpen(false);
      }
    } catch (error) {
      console.error(error);
      setMemoryFileName("Upload failed");
    }
  }

  async function onDatasetUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${apiBaseUrl}/api/datasets/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Upload failed with status ${res.status}`);
      }

      const data = (await res.json()) as {
        success: boolean;
        name: string;
        source_name: string;
        chunk_count: number;
      };

      if (data.success) {
        setDatasetFileName(`${data.name} (${data.source_name}, ${data.chunk_count} chunks)`);
        const refresh = await fetch(`${apiBaseUrl}/api/datasets`);
        if (refresh.ok) {
          setDatasets((await refresh.json()) as DatasetSummary[]);
        }
        if (isCompactViewport) setSidebarOpen(false);
      }
    } catch (error) {
      console.error(error);
      setDatasetFileName("Upload failed");
    }
  }

  async function deleteDataset(datasetId: number) {
    const confirmed = window.confirm("Delete this dataset from local storage?");
    if (!confirmed) return;

    try {
      const res = await fetch(`${apiBaseUrl}/api/datasets/${datasetId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error(`Delete failed with status ${res.status}`);
      }

      const refresh = await fetch(`${apiBaseUrl}/api/datasets`);
      if (refresh.ok) {
        setDatasets((await refresh.json()) as DatasetSummary[]);
      }
    } catch (error) {
      console.error(error);
    }
  }

  const accentText = useMemo(
    () => (isSending ? "IntelliText is thinking..." : status),
    [isSending, status],
  );

  return (
    <main
      className="app-shell h-dvh overflow-hidden text-[rgb(var(--text))]"
      style={{ fontSize: "clamp(14px, 0.28vw + 10.5px, 18px)" }}
    >
      {isCompactViewport && sidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          className="fixed inset-0 z-30 cursor-default bg-black/50 backdrop-blur-[1px]"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <div
        className="flex h-full min-h-0 w-full gap-[clamp(10px,1vw,22px)]"
        style={{ padding: "clamp(8px, 0.75vw, 20px)" }}
      >
        <AppSidebar
          conversations={conversations}
          datasets={datasets}
          activeConversationId={activeConversationId}
          memoryFileName={memoryFileName}
          datasetFileName={datasetFileName}
          isCompactViewport={isCompactViewport}
          sidebarOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onNewConversation={startNewConversation}
          onSelectConversation={loadConversation}
          onMemoryUpload={onMemoryUpload}
          onDatasetUpload={onDatasetUpload}
          onDeleteDataset={deleteDataset}
        />

        <section className="app-panel flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-[2rem]">
          <ChatHeader
            accentText={accentText}
            activeModel={activeModel}
            isCompactViewport={isCompactViewport}
            theme={theme}
            onOpenSidebar={() => setSidebarOpen(true)}
            onToggleTheme={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
          />

          <ThinkingPanel thinkingText={thinkingText} />

          <div
            ref={chatScrollRef}
            className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-[clamp(16px,1.3vw,28px)] py-[clamp(16px,1.3vw,28px)]"
          >
            <MessageList messages={messages} theme={theme} />
          </div>

          <Composer
            activeModel={activeModel}
            input={input}
            isSending={isSending}
            onChange={setInput}
            onSend={sendMessage}
          />
        </section>
      </div>
    </main>
  );
}
