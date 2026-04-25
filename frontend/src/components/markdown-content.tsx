"use client";

import { useMemo, useState, type ReactNode } from "react";

import clsx from "clsx";
import { Check, Copy, SquareCode } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";

import type { Theme } from "@/lib/chat-types";

type MarkdownContentProps = {
  content: string;
  theme: Theme;
};

const languageLabels: Record<string, string> = {
  bash: "Bash",
  c: "C",
  cpp: "C++",
  css: "CSS",
  html: "HTML",
  java: "Java",
  javascript: "JavaScript",
  js: "JavaScript",
  json: "JSON",
  jsx: "JavaScript",
  markdown: "Markdown",
  md: "Markdown",
  python: "Python",
  py: "Python",
  sh: "Shell",
  shell: "Shell",
  ts: "TypeScript",
  tsx: "TypeScript",
  typescript: "TypeScript",
  yaml: "YAML",
  yml: "YAML",
};

type CodeBlockProps = {
  className?: string;
  children?: ReactNode;
  theme: Theme;
};

function CodeBlock({ className, children, theme }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const match = /language-([a-z0-9#+-]+)/i.exec(className ?? "");
  const language = match?.[1]?.toLowerCase() ?? "";
  const label = languageLabels[language] ?? language.toUpperCase() ?? "Code";
  const codeString = useMemo(() => String(children).replace(/\n$/, ""), [children]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeString);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="my-5 overflow-hidden rounded-[1.5rem] border border-[rgb(var(--border))] bg-[rgb(var(--panel))]">
      <div className="flex items-center justify-between gap-3 border-b border-[rgb(var(--border))] px-4 py-3 text-xs text-[rgb(var(--muted))]">
        <div className="flex items-center gap-2 font-medium text-[rgb(var(--text))]">
          <SquareCode className="h-4 w-4" />
          <span>{label}</span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-2 rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--panel-soft))] px-3 py-1.5 text-xs font-medium text-[rgb(var(--text))] transition hover:scale-[1.01]"
          aria-label="Copy code block"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <SyntaxHighlighter
        language={language || undefined}
        style={theme === "dark" ? oneDark : oneLight}
        customStyle={{
          margin: 0,
          background: "transparent",
          padding: "1rem 1rem 1.1rem",
          fontSize: "0.94rem",
          lineHeight: 1.75,
          overflowX: "auto",
        }}
        codeTagProps={{
          style: {
            fontFamily:
              'JetBrains Mono, "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace',
          },
        }}
        PreTag="div"
        wrapLongLines
      >
        {codeString}
      </SyntaxHighlighter>
    </div>
  );
}

export function MarkdownContent({ content, theme }: MarkdownContentProps) {
  return (
    <div className="app-markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p({ children }) {
            return <p className="mb-4 leading-7 last:mb-0">{children}</p>;
          },
          h1({ children }) {
            return <h1 className="mb-4 text-2xl font-semibold leading-tight">{children}</h1>;
          },
          h2({ children }) {
            return <h2 className="mb-3 text-xl font-semibold leading-tight">{children}</h2>;
          },
          h3({ children }) {
            return <h3 className="mb-3 text-lg font-semibold leading-tight">{children}</h3>;
          },
          h4({ children }) {
            return <h4 className="mb-2 text-base font-semibold leading-tight">{children}</h4>;
          },
          ul({ children }) {
            return <ul className="mb-4 list-disc space-y-2 pl-6 leading-7">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="mb-4 list-decimal space-y-2 pl-6 leading-7">{children}</ol>;
          },
          li({ children }) {
            return <li className="pl-1">{children}</li>;
          },
          blockquote({ children }) {
            return (
              <blockquote className="mb-4 border-l-4 border-[rgb(var(--accent))] pl-4 italic text-[rgb(var(--muted))]">
                {children}
              </blockquote>
            );
          },
          a({ children, href }) {
            return (
              <a
                href={href}
                className="font-medium text-[rgb(var(--accent))] underline decoration-[rgb(var(--accent) / 0.45)] underline-offset-4"
              >
                {children}
              </a>
            );
          },
          hr() {
            return <hr className="my-6 border-[rgb(var(--border))]" />;
          },
          table({ children }) {
            return (
              <div className="my-5 overflow-x-auto rounded-[1.25rem] border border-[rgb(var(--border))]">
                <table className="min-w-full border-collapse text-left text-sm">{children}</table>
              </div>
            );
          },
          thead({ children }) {
            return <thead className="bg-[rgb(var(--panel-soft))]">{children}</thead>;
          },
          th({ children }) {
            return (
              <th className="border-b border-[rgb(var(--border))] px-4 py-3 font-semibold">
                {children}
              </th>
            );
          },
          td({ children }) {
            return <td className="border-b border-[rgb(var(--border))] px-4 py-3">{children}</td>;
          },
          code({
            inline,
            className,
            children,
          }: {
            inline?: boolean;
            className?: string;
            children?: ReactNode;
          }) {
            if (inline) {
              return (
                <code className="rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-1.5 py-0.5 font-mono text-[0.92em] text-[rgb(var(--text))]">
                  {children}
                </code>
              );
            }

            return (
              <CodeBlock className={className} theme={theme}>
                {children}
              </CodeBlock>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
