import { Menu, MoonStar, SunMedium } from "lucide-react";

import type { Theme } from "@/lib/chat-types";

type ChatHeaderProps = {
  accentText: string;
  activeModel: string;
  isCompactViewport: boolean;
  theme: Theme;
  onOpenSidebar: () => void;
  onToggleTheme: () => void;
};

export function ChatHeader({
  accentText,
  activeModel,
  isCompactViewport,
  theme,
  onOpenSidebar,
  onToggleTheme,
}: ChatHeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-[rgb(var(--border))] px-[clamp(16px,1.3vw,28px)] py-[clamp(14px,1vw,20px)]">
      <div className="flex items-center gap-3">
        {isCompactViewport && (
          <button
            type="button"
            onClick={onOpenSidebar}
            className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--panel-soft))] p-2 text-[rgb(var(--text))]"
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
        <div className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--panel-soft))] px-4 py-2 text-xs text-[rgb(var(--muted))]">
          {accentText}
        </div>
        <button
          type="button"
          onClick={onToggleTheme}
          className="inline-flex items-center gap-2 rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--panel-soft))] px-4 py-2 text-xs font-medium text-[rgb(var(--text))] transition hover:scale-[1.01]"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </button>
        <div className="hidden rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--panel-soft))] px-3 py-2 text-xs uppercase tracking-[0.25em] text-[rgb(var(--muted))] lg:block">
          {activeModel}
        </div>
      </div>
    </header>
  );
}

