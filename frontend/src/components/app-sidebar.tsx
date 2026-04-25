import type { ChangeEvent } from "react";
import { useEffect, useRef, useState } from "react";

import { EllipsisVertical, FilePenLine, FileText, LibraryBig, Plus, Search, Sparkles, Trash2, X } from "lucide-react";

import type { ConversationSummary, DatasetSummary, MemorySummary } from "@/lib/chat-types";

type SidebarProps = {
  conversations: ConversationSummary[];
  datasets: DatasetSummary[];
  memories: MemorySummary[];
  activeConversationId: number | null;
  conversationSearch: string;
  memoryFileName: string | null;
  datasetFileName: string | null;
  isCompactViewport: boolean;
  sidebarOpen: boolean;
  onClose: () => void;
  onNewConversation: () => void;
  onSelectConversation: (conversationId: number) => void;
  onConversationSearchChange: (value: string) => void;
  onRenameConversation: (conversationId: number, currentTitle: string) => void;
  onDeleteConversation: (conversationId: number) => void;
  onMemoryUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  onDatasetUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  onDeleteDataset: (datasetId: number) => void;
  onSelectDataset: (datasetId: number) => void;
  onDeleteMemory: (memoryId: number) => void;
  onSelectMemory: (memoryId: number) => void;
};

function getConversationGroupLabel(value: string) {
  const date = new Date(value);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfConversationDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.floor((startOfToday.getTime() - startOfConversationDay.getTime()) / 86400000);

  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays <= 7) return "Previous 7 Days";
  return "Older";
}

function groupConversations(conversations: ConversationSummary[]) {
  const groups = new Map<string, ConversationSummary[]>();
  const sorted = [...conversations].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
  );

  for (const conversation of sorted) {
    const label = getConversationGroupLabel(conversation.updated_at);
    const current = groups.get(label) ?? [];
    current.push(conversation);
    groups.set(label, current);
  }

  return ["Today", "Yesterday", "Previous 7 Days", "Older"]
    .filter((label) => groups.has(label))
    .map((label) => ({ label, items: groups.get(label) ?? [] }));
}

function formatConversationUpdatedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString([], {
    month: "numeric",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function AppSidebar({
  conversations,
  datasets,
  memories,
  activeConversationId,
  conversationSearch,
  memoryFileName,
  datasetFileName,
  isCompactViewport,
  sidebarOpen,
  onClose,
  onNewConversation,
  onSelectConversation,
  onConversationSearchChange,
  onRenameConversation,
  onDeleteConversation,
  onMemoryUpload,
  onDatasetUpload,
  onDeleteDataset,
  onSelectDataset,
  onDeleteMemory,
  onSelectMemory,
}: SidebarProps) {
  const groupedConversations = groupConversations(conversations);
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);
  const menuRootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (menuRootRef.current && !menuRootRef.current.contains(event.target as Node)) {
        setMenuOpenId(null);
      }
    };

    window.addEventListener("mousedown", onPointerDown);
    return () => window.removeEventListener("mousedown", onPointerDown);
  }, []);

  return (
    <aside
      className={[
        "shrink-0 overflow-visible border-r border-[rgb(var(--border)/0.06)] bg-[rgb(var(--panel)/0.72)] p-[clamp(12px,0.85vw,16px)] backdrop-blur-2xl transition-transform duration-200 ease-out",
        "rounded-r-[2rem] rounded-l-none shadow-[0_18px_50px_rgba(0,0,0,0.08)]",
        isCompactViewport ? "fixed inset-y-[clamp(8px,0.75vw,20px)] left-[clamp(8px,0.75vw,20px)] z-40" : "relative",
        isCompactViewport && !sidebarOpen ? "-translate-x-[110%]" : "translate-x-0",
      ].join(" ")}
      style={{ width: "clamp(300px, 21vw, 390px)" }}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex flex-1 items-center gap-3 rounded-[1.45rem] bg-[rgb(var(--panel-soft)/0.7)] px-4 py-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgb(var(--accent)),rgb(var(--accent-2)))] text-white">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[rgb(var(--muted))]">
              PersonalAIAsisstant
            </p>
            <h1 className="text-lg font-semibold leading-tight">IntelliText</h1>
          </div>
        </div>
        {isCompactViewport && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[rgb(var(--border)/0.08)] bg-[rgb(var(--panel-soft)/0.9)] p-2 text-[rgb(var(--text))]"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <button
        onClick={onNewConversation}
        className="mb-3 flex w-full items-center justify-center gap-2 rounded-full bg-[rgb(var(--text))] px-4 py-2.5 text-sm font-semibold text-[rgb(var(--bg))] transition hover:scale-[1.01]"
      >
        <Plus className="h-4 w-4" />
        New conversation
      </button>

      <div className="space-y-2">
        <div className="flex items-center gap-2 px-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[rgb(var(--muted))]">
          <LibraryBig className="h-4 w-4" />
          Chats
        </div>
        <label className="flex items-center gap-2 rounded-full bg-[rgb(var(--panel-soft)/0.68)] px-3 py-2 text-sm text-[rgb(var(--muted))]">
          <Search className="h-4 w-4" />
          <input
            value={conversationSearch}
            onChange={(event) => onConversationSearchChange(event.target.value)}
            placeholder="Search chats"
            className="w-full bg-transparent text-sm text-[rgb(var(--text))] outline-none placeholder:text-[rgb(var(--muted))]"
          />
        </label>

        <div className="max-h-[340px] space-y-3 overflow-auto pr-1 scrollbar-hide">
          {conversations.length === 0 && (
            <div className="rounded-[1.15rem] border border-dashed border-[rgb(var(--border)/0.12)] bg-[rgb(var(--panel-soft)/0.72)] p-3 text-sm text-[rgb(var(--muted))]">
              No conversations yet.
            </div>
          )}

          {groupedConversations.map((group) => (
            <div key={group.label} className="space-y-2">
              <div className="sticky top-0 z-[1] bg-[rgb(var(--panel)/0.86)] py-1 text-[11px] font-medium uppercase tracking-[0.24em] text-[rgb(var(--muted))] backdrop-blur-xl">
                {group.label}
              </div>
              <div className="space-y-2">
                {group.items.map((conversation) => {
                  const isActive = activeConversationId === conversation.id;
                  const isMenuOpen = menuOpenId === conversation.id;

                  return (
                    <div
                      key={conversation.id}
                      ref={isMenuOpen ? menuRootRef : undefined}
                      className={[
                        "group relative rounded-[1.15rem] px-3 py-2.5 transition",
                        isActive
                          ? "bg-[rgb(var(--panel-soft)/0.82)]"
                          : "bg-transparent hover:bg-[rgb(var(--panel-soft)/0.56)]",
                      ].join(" ")}
                    >
                      <button type="button" onClick={() => onSelectConversation(conversation.id)} className="w-full text-left">
                        <p className="max-w-[calc(100%-42px)] truncate text-sm font-medium text-[rgb(var(--text))]">
                          {conversation.title}
                        </p>
                        <p className="mt-1 text-[11px] text-[rgb(var(--muted))]">
                          Updated {formatConversationUpdatedAt(conversation.updated_at)}
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setMenuOpenId((current) => (current === conversation.id ? null : conversation.id))}
                        className="absolute right-2 top-2 z-40 inline-flex h-8 w-8 items-center justify-center rounded-full bg-[rgb(var(--panel-soft)/0.86)] text-[rgb(var(--muted))] opacity-100 transition hover:text-[rgb(var(--text))] md:opacity-0 md:group-hover:opacity-100"
                        aria-label={`Open conversation actions for ${conversation.title}`}
                      >
                        <EllipsisVertical className="h-4 w-4" />
                      </button>

                      {isMenuOpen && (
                        <div className="absolute right-2 top-[2.3rem] z-50 w-40 rounded-[1rem] bg-[rgb(var(--panel))] p-1 shadow-[0_16px_34px_rgba(0,0,0,0.12)] ring-1 ring-[rgb(var(--border)/0.06)]">
                          <button
                            type="button"
                            onClick={() => {
                              setMenuOpenId(null);
                              onRenameConversation(conversation.id, conversation.title);
                            }}
                            className="flex w-full items-center gap-2 rounded-[0.85rem] px-3 py-2 text-left text-sm text-[rgb(var(--text))] transition hover:bg-[rgb(var(--panel-soft))]"
                          >
                            <FilePenLine className="h-4 w-4" />
                            Rename
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setMenuOpenId(null);
                              onDeleteConversation(conversation.id);
                            }}
                            className="flex w-full items-center gap-2 rounded-[0.85rem] px-3 py-2 text-left text-sm text-[rgb(var(--text))] transition hover:bg-[rgb(var(--panel-soft))]"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <section className="mt-4 space-y-3 border-t border-[rgb(var(--border)/0.05)] pt-4">
        <div className="flex items-center gap-2 px-1 text-sm font-semibold">
          <FileText className="h-4 w-4" />
          Memory upload
        </div>
        <label className="flex cursor-pointer items-center justify-center rounded-full border border-dashed border-[rgb(var(--border)/0.08)] bg-[rgb(var(--panel-soft)/0.38)] px-4 py-3 text-sm text-[rgb(var(--muted))] transition hover:bg-[rgb(var(--panel-soft)/0.68)]">
          <input type="file" accept=".txt" className="hidden" onChange={onMemoryUpload} />
          Upload .txt memory file
        </label>
        <p className="text-xs leading-5 text-[rgb(var(--muted))]">Saved locally and injected into prompts when relevant.</p>
        {memoryFileName && (
          <p className="rounded-full px-3 py-2 text-xs text-[rgb(var(--text))]" style={{ backgroundColor: "rgb(var(--accent) / 0.12)" }}>
            Ready to store: {memoryFileName}
          </p>
        )}
        {memories.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[rgb(var(--muted))]">
              Local memory
            </p>
            <div className="max-h-[180px] space-y-2 overflow-auto pr-1 scrollbar-hide">
              {memories.map((memory) => (
                <div
                  key={memory.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectMemory(memory.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onSelectMemory(memory.id);
                    }
                  }}
                  className="rounded-[1rem] bg-[rgb(var(--panel-soft)/0.46)] px-3 py-2 transition hover:bg-[rgb(var(--panel-soft)/0.72)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{memory.name}</p>
                      <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                        {memory.chunk_count} chunk{memory.chunk_count === 1 ? "" : "s"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeleteMemory(memory.id)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[rgb(var(--panel-soft)/0.86)] text-[rgb(var(--muted))] transition hover:text-[rgb(var(--text))]"
                      aria-label={`Delete memory ${memory.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="mt-4 space-y-3 border-t border-[rgb(var(--border)/0.05)] pt-4">
        <div className="flex items-center gap-2 px-1 text-sm font-semibold">
          <LibraryBig className="h-4 w-4" />
          Dataset import
        </div>
        <label className="flex cursor-pointer items-center justify-center rounded-full border border-dashed border-[rgb(var(--border)/0.08)] bg-[rgb(var(--panel-soft)/0.38)] px-4 py-3 text-sm text-[rgb(var(--muted))] transition hover:bg-[rgb(var(--panel-soft)/0.68)]">
          <input type="file" accept=".txt,.csv,.json,.jsonl" className="hidden" onChange={onDatasetUpload} />
          Upload dataset file
        </label>
        <p className="text-xs leading-5 text-[rgb(var(--muted))]">Stored locally and tracked separately from chat memory.</p>
        {datasetFileName && (
          <p className="rounded-full px-3 py-2 text-xs text-[rgb(var(--text))]" style={{ backgroundColor: "rgb(var(--accent) / 0.12)" }}>
            Last imported: {datasetFileName}
          </p>
        )}
        {datasets.length > 0 && (
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[rgb(var(--muted))]">
              Local datasets
            </p>
            <div className="max-h-[180px] space-y-2 overflow-auto pr-1 scrollbar-hide">
              {datasets.map((dataset) => (
                <div
                  key={dataset.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectDataset(dataset.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onSelectDataset(dataset.id);
                    }
                  }}
                  className="rounded-[1rem] bg-[rgb(var(--panel-soft)/0.46)] px-3 py-2 text-left transition hover:bg-[rgb(var(--panel-soft)/0.72)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{dataset.name}</p>
                      <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                        {dataset.source_count} source{dataset.source_count === 1 ? "" : "s"} ·{" "}
                        {dataset.version_count} version{dataset.version_count === 1 ? "" : "s"} ·{" "}
                        {dataset.chunk_count} chunk{dataset.chunk_count === 1 ? "" : "s"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onDeleteDataset(dataset.id);
                      }}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[rgb(var(--panel-soft)/0.86)] text-[rgb(var(--muted))] transition hover:text-[rgb(var(--text))]"
                      aria-label={`Delete dataset ${dataset.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </aside>
  );
}


