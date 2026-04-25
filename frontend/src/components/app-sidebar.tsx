import type { ChangeEvent } from "react";

import { FilePenLine, FileText, LibraryBig, Plus, Search, Sparkles, Trash2, X } from "lucide-react";

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

  return (
    <aside
      className={[
        "shrink-0 overflow-hidden border-r border-y border-[rgb(var(--border)/0.1)] bg-[rgb(var(--panel)/0.9)] p-[clamp(12px,0.85vw,16px)] backdrop-blur-xl transition-transform duration-200 ease-out",
        "rounded-r-[2rem] rounded-l-none",
        isCompactViewport ? "fixed inset-y-[clamp(8px,0.75vw,20px)] left-[clamp(8px,0.75vw,20px)] z-40" : "relative",
        isCompactViewport && !sidebarOpen ? "-translate-x-[110%]" : "translate-x-0",
      ].join(" ")}
      style={{ width: "clamp(300px, 21vw, 390px)" }}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex flex-1 items-center gap-3 rounded-[1.35rem] border border-[rgb(var(--border)/0.08)] bg-[rgb(var(--panel-soft)/0.9)] p-3">
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
        className="mb-3 flex w-full items-center justify-center gap-2 rounded-[1.35rem] border border-[rgb(var(--border)/0.08)] bg-[rgb(var(--text))] px-4 py-2.5 text-sm font-semibold text-[rgb(var(--bg))] transition hover:scale-[1.01]"
      >
        <Plus className="h-4 w-4" />
        New conversation
      </button>

      <div className="space-y-2">
        <div className="flex items-center gap-2 px-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[rgb(var(--muted))]">
          <LibraryBig className="h-4 w-4" />
          Chats
        </div>
        <label className="flex items-center gap-2 rounded-[1.15rem] border border-[rgb(var(--border)/0.08)] bg-[rgb(var(--panel-soft)/0.9)] px-3 py-2 text-sm text-[rgb(var(--muted))]">
          <Search className="h-4 w-4" />
          <input
            value={conversationSearch}
            onChange={(event) => onConversationSearchChange(event.target.value)}
            placeholder="Search chats"
            className="w-full bg-transparent text-sm text-[rgb(var(--text))] outline-none placeholder:text-[rgb(var(--muted))]"
          />
        </label>

        <div className="max-h-[340px] space-y-3 overflow-auto pr-1">
          {conversations.length === 0 && (
            <div className="rounded-[1.15rem] border border-dashed border-[rgb(var(--border)/0.12)] bg-[rgb(var(--panel-soft)/0.72)] p-3 text-sm text-[rgb(var(--muted))]">
              No conversations yet.
            </div>
          )}

          {groupedConversations.map((group) => (
            <div key={group.label} className="space-y-2">
              <div className="sticky top-0 z-[1] bg-[rgb(var(--panel)/0.92)] py-1 text-[11px] font-medium uppercase tracking-[0.24em] text-[rgb(var(--muted))] backdrop-blur-xl">
                {group.label}
              </div>
              <div className="space-y-2">
                {group.items.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={[
                      "group rounded-[1.1rem] border px-3 py-2.5 transition",
                      activeConversationId === conversation.id
                        ? "border-[rgb(var(--border)/0.11)] bg-[rgb(var(--panel-soft)/0.88)]"
                        : "border-[rgb(var(--border)/0.08)] bg-transparent hover:bg-[rgb(var(--panel-soft)/0.64)]",
                    ].join(" ")}
                  >
                    <button type="button" onClick={() => onSelectConversation(conversation.id)} className="w-full text-left">
                      <p className="truncate text-sm font-medium text-[rgb(var(--text))]">{conversation.title}</p>
                    </button>
                    <div className="mt-2 flex items-center justify-end gap-2 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => onRenameConversation(conversation.id, conversation.title)}
                        className="inline-flex items-center gap-1 rounded-full border border-[rgb(var(--border)/0.08)] bg-[rgb(var(--panel-soft)/0.9)] px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-[rgb(var(--muted))] transition hover:text-[rgb(var(--text))]"
                      >
                        <FilePenLine className="h-3.5 w-3.5" />
                        Rename
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteConversation(conversation.id)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[rgb(var(--border)/0.08)] bg-[rgb(var(--panel-soft)/0.9)] text-[rgb(var(--muted))] transition hover:text-[rgb(var(--text))]"
                        aria-label={`Delete conversation ${conversation.title}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 space-y-3 rounded-[1.25rem] border border-[rgb(var(--border)/0.08)] bg-[rgb(var(--panel-soft)/0.84)] p-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <FileText className="h-4 w-4" />
          Memory upload
        </div>
        <label className="flex cursor-pointer items-center justify-center rounded-[1.15rem] border border-dashed border-[rgb(var(--border)/0.12)] bg-transparent px-4 py-3 text-sm text-[rgb(var(--muted))] transition hover:bg-[rgb(var(--panel-soft))]">
          <input type="file" accept=".txt" className="hidden" onChange={onMemoryUpload} />
          Upload .txt memory file
        </label>
        <p className="text-xs leading-5 text-[rgb(var(--muted))]">
          Saved locally and injected into prompts when relevant.
        </p>
        {memoryFileName && (
          <p className="rounded-xl px-3 py-2 text-xs text-[rgb(var(--text))]" style={{ backgroundColor: "rgb(var(--accent) / 0.12)" }}>
            Ready to store: {memoryFileName}
          </p>
        )}
        {memories.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[rgb(var(--muted))]">
              Local memory
            </p>
            <div className="max-h-[180px] space-y-2 overflow-auto pr-1">
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
                  className="rounded-[1.1rem] border border-[rgb(var(--border)/0.08)] bg-[rgb(var(--panel))] px-3 py-2"
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
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[rgb(var(--border)/0.08)] bg-[rgb(var(--panel-soft)/0.9)] text-[rgb(var(--muted))] transition hover:text-[rgb(var(--text))]"
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
      </div>

      <div className="mt-3 space-y-3 rounded-[1.25rem] border border-[rgb(var(--border)/0.08)] bg-[rgb(var(--panel-soft)/0.84)] p-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <LibraryBig className="h-4 w-4" />
          Dataset import
        </div>
        <label className="flex cursor-pointer items-center justify-center rounded-[1.15rem] border border-dashed border-[rgb(var(--border)/0.12)] bg-transparent px-4 py-3 text-sm text-[rgb(var(--muted))] transition hover:bg-[rgb(var(--panel-soft))]">
          <input type="file" accept=".txt,.csv,.json,.jsonl" className="hidden" onChange={onDatasetUpload} />
          Upload dataset file
        </label>
        <p className="text-xs leading-5 text-[rgb(var(--muted))]">
          Stored locally and tracked separately from chat memory.
        </p>
        {datasetFileName && (
          <p className="rounded-xl px-3 py-2 text-xs text-[rgb(var(--text))]" style={{ backgroundColor: "rgb(var(--accent) / 0.12)" }}>
            Last imported: {datasetFileName}
          </p>
        )}
        {datasets.length > 0 && (
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[rgb(var(--muted))]">
              Local datasets
            </p>
            <div className="max-h-[180px] space-y-2 overflow-auto pr-1">
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
                  className="rounded-[1.1rem] border border-[rgb(var(--border)/0.08)] bg-[rgb(var(--panel))] px-3 py-2 text-left transition hover:bg-[rgb(var(--panel-soft)/0.68)]"
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
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[rgb(var(--border)/0.08)] bg-[rgb(var(--panel-soft)/0.9)] text-[rgb(var(--muted))] transition hover:text-[rgb(var(--text))]"
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
      </div>
    </aside>
  );
}
