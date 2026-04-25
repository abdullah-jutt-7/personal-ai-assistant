import type { ChangeEvent } from "react";
import { FileText, LibraryBig, Plus, Sparkles, X } from "lucide-react";

import type { ConversationSummary, DatasetSummary } from "@/lib/chat-types";

type SidebarProps = {
  conversations: ConversationSummary[];
  datasets: DatasetSummary[];
  activeConversationId: number | null;
  memoryFileName: string | null;
  datasetFileName: string | null;
  isCompactViewport: boolean;
  sidebarOpen: boolean;
  onClose: () => void;
  onNewConversation: () => void;
  onSelectConversation: (conversationId: number) => void;
  onMemoryUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  onDatasetUpload: (event: ChangeEvent<HTMLInputElement>) => void;
};

export function AppSidebar({
  conversations,
  datasets,
  activeConversationId,
  memoryFileName,
  datasetFileName,
  isCompactViewport,
  sidebarOpen,
  onClose,
  onNewConversation,
  onSelectConversation,
  onMemoryUpload,
  onDatasetUpload,
}: SidebarProps) {
  return (
    <aside
      className={[
        "app-panel shrink-0 rounded-[2rem] p-[clamp(14px,1vw,20px)] transition-transform duration-200 ease-out",
        isCompactViewport ? "fixed inset-y-[clamp(8px,0.75vw,20px)] left-[clamp(8px,0.75vw,20px)] z-40" : "relative",
        isCompactViewport && !sidebarOpen ? "-translate-x-[110%]" : "translate-x-0",
      ].join(" ")}
      style={{ width: "clamp(300px, 21vw, 390px)" }}
    >
      <div className="mb-6 flex items-start justify-between gap-3">
        <div className="flex flex-1 items-center gap-3 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--panel-soft))] p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgb(var(--accent)),rgb(var(--accent-2)))] text-white">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-[rgb(var(--muted))]">PersonalAIAsisstant</p>
            <h1 className="text-lg font-semibold">IntelliText</h1>
          </div>
        </div>
        {isCompactViewport && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--panel-soft))] p-2 text-[rgb(var(--text))]"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <button
        onClick={onNewConversation}
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
              onClick={() => onSelectConversation(conversation.id)}
              className={[
                "w-full rounded-2xl border px-4 py-3 text-left transition",
                activeConversationId === conversation.id
                  ? "border-[rgb(var(--border))] bg-[rgb(var(--panel-soft))]"
                  : "border-[rgb(var(--border))] bg-[rgb(var(--panel))] hover:bg-[rgb(var(--panel-soft))]",
              ].join(" ")}
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
          <input type="file" accept=".txt" className="hidden" onChange={onMemoryUpload} />
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

      <div className="mt-4 space-y-3 rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--panel-soft))] p-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <LibraryBig className="h-4 w-4" />
          Dataset import
        </div>
        <label className="flex cursor-pointer items-center justify-center rounded-2xl border border-dashed border-[rgb(var(--border))] bg-transparent px-4 py-4 text-sm text-[rgb(var(--muted))] transition hover:bg-[rgb(var(--panel))]">
          <input type="file" accept=".txt,.csv,.json,.jsonl" className="hidden" onChange={onDatasetUpload} />
          Upload dataset file
        </label>
        <p className="text-xs leading-5 text-[rgb(var(--muted))]">
          Datasets are stored locally and tracked separately from chat memory.
        </p>
        {datasetFileName && (
          <p
            className="rounded-xl px-3 py-2 text-xs text-[rgb(var(--text))]"
            style={{ backgroundColor: "rgb(var(--accent) / 0.12)" }}
          >
            Last imported: {datasetFileName}
          </p>
        )}
        {datasets.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[rgb(var(--muted))]">
              Local datasets
            </p>
            <div className="max-h-[180px] space-y-2 overflow-auto pr-1">
              {datasets.map((dataset) => (
                <div
                  key={dataset.id}
                  className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-3 py-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{dataset.name}</p>
                      <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                        {dataset.source_count} source{dataset.source_count === 1 ? "" : "s"} ·{" "}
                        {dataset.version_count} version{dataset.version_count === 1 ? "" : "s"}
                      </p>
                    </div>
                    <span className="rounded-full border border-[rgb(var(--border))] px-2 py-1 text-[10px] uppercase tracking-[0.24em] text-[rgb(var(--muted))]">
                      Saved
                    </span>
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
