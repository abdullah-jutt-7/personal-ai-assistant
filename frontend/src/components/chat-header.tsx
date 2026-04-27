import type { ChangeEvent } from "react";
import { useEffect, useRef, useState } from "react";

import {
  ChevronDown,
  FileText,
  LibraryBig,
  MoonStar,
  PanelLeftClose,
  PanelLeftOpen,
  RefreshCw,
  SunMedium,
  X,
} from "lucide-react";

import type { InstalledModel, Theme } from "@/lib/chat-types";

type ChatHeaderProps = {
  accentText: string;
  activeModel: string;
  installedModels: InstalledModel[];
  datasetFileName: string | null;
  memoryFileName: string | null;
  sidebarOpen: boolean;
  theme: Theme;
  onToggleSidebar: () => void;
  onRefreshModels: () => void;
  onSelectModel: (modelName: string) => void;
  onToggleTheme: () => void;
  onMemoryUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  onDatasetUpload: (event: ChangeEvent<HTMLInputElement>) => void;
};

export function ChatHeader({
  accentText,
  activeModel,
  installedModels,
  datasetFileName,
  memoryFileName,
  sidebarOpen,
  theme,
  onToggleSidebar,
  onRefreshModels,
  onSelectModel,
  onToggleTheme,
  onMemoryUpload,
  onDatasetUpload,
}: ChatHeaderProps) {
  const [modelMenuOpen, setModelMenuOpen] = useState(false);
  const modelMenuRef = useRef<HTMLDivElement | null>(null);
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const workspaceMenuRef = useRef<HTMLDivElement | null>(null);
  const memoryInputRef = useRef<HTMLInputElement | null>(null);
  const datasetInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (modelMenuRef.current && !modelMenuRef.current.contains(event.target as Node)) {
        setModelMenuOpen(false);
      }
    };

    window.addEventListener("mousedown", onPointerDown);
    return () => window.removeEventListener("mousedown", onPointerDown);
  }, []);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (workspaceMenuRef.current && !workspaceMenuRef.current.contains(event.target as Node)) {
        setWorkspaceMenuOpen(false);
      }
    };

    window.addEventListener("mousedown", onPointerDown);
    return () => window.removeEventListener("mousedown", onPointerDown);
  }, []);

  return (
    <header className="flex relative z-10 items-center justify-between border-b border-[rgb(var(--border)/0.045)] px-[clamp(16px,1.3vw,28px)] py-[clamp(12px,0.85vw,16px)] backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="rounded-full bg-[rgb(var(--panel-soft)/0.72)] p-2 text-[rgb(var(--text))]"
          aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
        </button>
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-[rgb(var(--muted))]">
            Local AI workspace
          </p>
          <h2 className="mt-1 text-[1.45rem] font-semibold leading-none tracking-[-0.02em]">IntelliText</h2>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="rounded-full bg-[rgb(var(--panel-soft)/0.62)] px-3 py-[5px] text-[10px] text-[rgb(var(--muted))]">
          {accentText}
        </div>
        <div ref={workspaceMenuRef} className="relative">
          <button
            type="button"
            onClick={() => setWorkspaceMenuOpen((current) => !current)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[rgb(var(--panel-soft)/0.72)] text-[rgb(var(--text))] transition hover:scale-[1.01]"
            aria-haspopup="menu"
            aria-expanded={workspaceMenuOpen}
            aria-label="Open memory and dataset menu"
          >
            <LibraryBig className="h-4 w-4" />
          </button>
          {workspaceMenuOpen && (
            <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-[min(360px,84vw)] rounded-[1.35rem] bg-[rgb(var(--panel)/0.98)] p-3 shadow-[0_16px_34px_rgba(0,0,0,0.16)] ring-1 ring-[rgb(var(--border)/0.06)] backdrop-blur-xl">
              <div className="flex items-start justify-between gap-3 border-b border-[rgb(var(--border)/0.08)] pb-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.24em] text-[rgb(var(--muted))]">
                    Library
                  </p>
                  <h3 className="mt-1 text-sm font-semibold">Memory and datasets</h3>
                  <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
                    Keep uploads close to the model controls so the sidebar stays focused on chat history.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setWorkspaceMenuOpen(false)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[rgb(var(--panel-soft)/0.8)] text-[rgb(var(--muted))] transition hover:text-[rgb(var(--text))]"
                  aria-label="Close memory and dataset menu"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="mt-3 space-y-3">
                <button
                  type="button"
                  onClick={() => memoryInputRef.current?.click()}
                  className="flex w-full items-center justify-between rounded-[1rem] border border-[rgb(var(--border)/0.08)] bg-[rgb(var(--panel-soft)/0.68)] px-3 py-3 text-left transition hover:bg-[rgb(var(--panel-soft)/0.92)]"
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-[rgb(var(--accent)/0.12)] text-[rgb(var(--accent))]">
                      <FileText className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-medium">Upload memory</p>
                      <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
                        Import a `.txt` file into persistent local memory.
                      </p>
                    </div>
                  </div>
                  <span className="ml-3 text-[10px] uppercase tracking-[0.18em] text-[rgb(var(--muted))]">
                    TXT
                  </span>
                </button>
                <input
                  ref={memoryInputRef}
                  type="file"
                  accept=".txt"
                  className="hidden"
                  onChange={(event) => {
                    onMemoryUpload(event);
                    setWorkspaceMenuOpen(false);
                  }}
                />

                <button
                  type="button"
                  onClick={() => datasetInputRef.current?.click()}
                  className="flex w-full items-center justify-between rounded-[1rem] border border-[rgb(var(--border)/0.08)] bg-[rgb(var(--panel-soft)/0.68)] px-3 py-3 text-left transition hover:bg-[rgb(var(--panel-soft)/0.92)]"
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-[rgb(var(--accent-2)/0.12)] text-[rgb(var(--accent-2))]">
                      <LibraryBig className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-medium">Import dataset</p>
                      <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
                        Store `.txt`, `.csv`, `.json`, or `.jsonl` files locally.
                      </p>
                    </div>
                  </div>
                  <span className="ml-3 text-[10px] uppercase tracking-[0.18em] text-[rgb(var(--muted))]">
                    Import
                  </span>
                </button>
                <input
                  ref={datasetInputRef}
                  type="file"
                  accept=".txt,.csv,.json,.jsonl"
                  className="hidden"
                  onChange={(event) => {
                    onDatasetUpload(event);
                    setWorkspaceMenuOpen(false);
                  }}
                />
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <div className="rounded-[0.95rem] bg-[rgb(var(--panel-soft)/0.65)] px-3 py-2">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[rgb(var(--muted))]">
                    Memory
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[rgb(var(--text))]">
                    {memoryFileName ?? "No recent upload"}
                  </p>
                </div>
                <div className="rounded-[0.95rem] bg-[rgb(var(--panel-soft)/0.65)] px-3 py-2">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[rgb(var(--muted))]">
                    Dataset
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[rgb(var(--text))]">
                    {datasetFileName ?? "No recent import"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onToggleTheme}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[rgb(var(--panel-soft)/0.72)] text-[rgb(var(--text))] transition hover:scale-[1.01]"
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          title={theme === "dark" ? "Light mode" : "Dark mode"}
        >
          {theme === "dark" ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
        </button>
        <div ref={modelMenuRef} className="relative">
          <button
            type="button"
            onClick={() => setModelMenuOpen((current) => !current)}
            className="inline-flex items-center gap-2 rounded-full bg-[rgb(var(--panel-soft)/0.62)] px-3 py-[5px] text-[10px] font-medium uppercase tracking-[0.14em] text-[rgb(var(--text))] transition hover:scale-[1.01]"
            aria-haspopup="menu"
            aria-expanded={modelMenuOpen}
          >
            {activeModel}
            <ChevronDown className="h-4 w-4" />
          </button>
          {modelMenuOpen && (
            <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-[min(320px,75vw)] rounded-[1.35rem] bg-[rgb(var(--panel)/0.95)] p-2 shadow-[0_16px_34px_rgba(0,0,0,0.16)] ring-1 ring-[rgb(var(--border)/0.06)] backdrop-blur-xl">
              <div className="px-3 py-2 text-[10px] uppercase tracking-[0.22em] text-[rgb(var(--muted))]">
                Models
              </div>
              <div className="max-h-72 overflow-auto">
                {installedModels.length === 0 ? (
                  <div className="px-3 py-3 text-sm text-[rgb(var(--muted))]">
                    No installed models found.
                  </div>
                ) : (
                  installedModels.map((model) => (
                    <button
                      key={model.name}
                      type="button"
                      onClick={() => {
                        onSelectModel(model.name);
                        setModelMenuOpen(false);
                      }}
                      className={[
                        "flex w-full items-center justify-between rounded-[0.95rem] px-3 py-2.5 text-left transition",
                        model.name === activeModel
                          ? "bg-[rgb(var(--panel-soft))] text-[rgb(var(--text))]"
                          : "hover:bg-[rgb(var(--panel-soft))] text-[rgb(var(--text))]",
                      ].join(" ")}
                    >
                      <span className="text-[13px] font-medium">{model.name}</span>
                      {model.name === activeModel && <span className="text-[10px] text-[rgb(var(--muted))]">Active</span>}
                    </button>
                  ))
                )}
              </div>
              <div className="mt-2 border-t border-[rgb(var(--border)/0.1)] pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onRefreshModels();
                  }}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-[0.95rem] bg-[rgb(var(--panel-soft))] px-3 py-2 text-[10px] font-medium text-[rgb(var(--text))]"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Refresh models
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
