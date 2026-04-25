import { useEffect, useRef, useState } from "react";

import { ChevronDown, Menu, MoonStar, RefreshCw, SunMedium } from "lucide-react";

import type { InstalledModel, Theme } from "@/lib/chat-types";

type ChatHeaderProps = {
  accentText: string;
  activeModel: string;
  installedModels: InstalledModel[];
  isCompactViewport: boolean;
  theme: Theme;
  onOpenSidebar: () => void;
  onRefreshModels: () => void;
  onSelectModel: (modelName: string) => void;
  onToggleTheme: () => void;
};

export function ChatHeader({
  accentText,
  activeModel,
  installedModels,
  isCompactViewport,
  theme,
  onOpenSidebar,
  onRefreshModels,
  onSelectModel,
  onToggleTheme,
}: ChatHeaderProps) {
  const [modelMenuOpen, setModelMenuOpen] = useState(false);
  const modelMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (modelMenuRef.current && !modelMenuRef.current.contains(event.target as Node)) {
        setModelMenuOpen(false);
      }
    };

    window.addEventListener("mousedown", onPointerDown);
    return () => window.removeEventListener("mousedown", onPointerDown);
  }, []);

  return (
    <header className="flex items-center justify-between border-b border-[rgb(var(--border)/0.1)] px-[clamp(16px,1.3vw,28px)] py-[clamp(14px,1vw,20px)]">
      <div className="flex items-center gap-3">
        {isCompactViewport && (
          <button
            type="button"
            onClick={onOpenSidebar}
            className="rounded-full border border-[rgb(var(--border)/0.09)] bg-[rgb(var(--panel-soft))] p-2 text-[rgb(var(--text))]"
            aria-label="Open sidebar"
          >
            <Menu className="h-4 w-4" />
          </button>
        )}
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[rgb(var(--muted))]">
            Local AI workspace
          </p>
          <h2 className="mt-1 text-2xl font-semibold">IntelliText</h2>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="rounded-full border border-[rgb(var(--border)/0.09)] bg-[rgb(var(--panel-soft))] px-4 py-2 text-xs text-[rgb(var(--muted))]">
          {accentText}
        </div>
        <button
          type="button"
          onClick={onToggleTheme}
          className="inline-flex items-center gap-2 rounded-full border border-[rgb(var(--border)/0.09)] bg-[rgb(var(--panel-soft))] px-4 py-2 text-xs font-medium text-[rgb(var(--text))] transition hover:scale-[1.01]"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </button>
        <div ref={modelMenuRef} className="relative">
          <button
            type="button"
            onClick={() => setModelMenuOpen((current) => !current)}
            className="inline-flex items-center gap-2 rounded-full border border-[rgb(var(--border)/0.09)] bg-[rgb(var(--panel-soft))] px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-[rgb(var(--text))] transition hover:scale-[1.01]"
            aria-haspopup="menu"
            aria-expanded={modelMenuOpen}
          >
            {activeModel}
            <ChevronDown className="h-4 w-4" />
          </button>
          {modelMenuOpen && (
            <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-[min(320px,75vw)] rounded-[1.5rem] border border-[rgb(var(--border)/0.12)] bg-[rgb(var(--panel))] p-2 shadow-[0_16px_34px_rgba(0,0,0,0.18)] backdrop-blur-xl">
              <div className="px-3 py-2 text-[11px] uppercase tracking-[0.24em] text-[rgb(var(--muted))]">
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
                        "flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left transition",
                        model.name === activeModel
                          ? "bg-[rgb(var(--panel-soft))] text-[rgb(var(--text))]"
                          : "hover:bg-[rgb(var(--panel-soft))] text-[rgb(var(--text))]",
                      ].join(" ")}
                    >
                      <span className="text-sm font-medium">{model.name}</span>
                      {model.name === activeModel && <span className="text-xs text-[rgb(var(--muted))]">Active</span>}
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
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[rgb(var(--border)/0.09)] bg-[rgb(var(--panel-soft))] px-3 py-2 text-xs font-medium text-[rgb(var(--text))]"
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
