import React from "react";
import ReactMarkdown from "react-markdown";
import {
  FileText,
  Search,
  Pill,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
} from "lucide-react";

interface ChatMessageContentProps {
  content: string;
}

// Comfortable, eye-friendly unified styling for message lists and sections
export const ChatMessageContent: React.FC<ChatMessageContentProps> = ({ content }) => {
  let olCounter = 0;

  return (
    <div className="chat-markdown-content space-y-2 text-sm leading-6">
      <ReactMarkdown
        components={{
          // Headings with clean, cohesive, comfortable styling
          h3: ({ children }) => {
            const text = String(children || "");

            // 1. Шұғыл қауіп / Жедел жәрдем / Госпитализация (Soft Red/Rose callout)
            if (/🚨|шұғыл|103|112|жедел жәрдем|қауіп белгі|госпитализация/i.test(text)) {
              return (
                <div className="my-2.5 flex items-center gap-2 rounded-xl border border-rose-300/70 bg-rose-50/80 px-3 py-2 text-rose-950 shadow-xs dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
                  <span className="font-semibold text-xs sm:text-sm">{children}</span>
                </div>
              );
            }

            // 2. Хаттама ақпараты
            if (/📋|1\.|хаттама|протокол/i.test(text)) {
              return (
                <div className="my-2.5 flex items-center gap-2 rounded-xl border border-border/80 bg-muted/40 px-3 py-2 text-foreground shadow-xs">
                  <FileText className="h-4 w-4 shrink-0 text-primary" />
                  <span className="font-semibold text-xs sm:text-sm">{children}</span>
                </div>
              );
            }

            // 3. Симптомдардың сәйкестігі
            if (/🔍|2\.|симптом|жалобы|шағым/i.test(text)) {
              return (
                <div className="my-2.5 flex items-center gap-2 rounded-xl border border-border/80 bg-muted/40 px-3 py-2 text-foreground shadow-xs">
                  <Search className="h-4 w-4 shrink-0 text-primary" />
                  <span className="font-semibold text-xs sm:text-sm">{children}</span>
                </div>
              );
            }

            // 4. Емделу жолдары және алғашқы көмек
            if (/💊|3\.|емдел|көмек|лечение/i.test(text)) {
              return (
                <div className="my-2.5 flex items-center gap-2 rounded-xl border border-border/80 bg-muted/40 px-3 py-2 text-foreground shadow-xs">
                  <Pill className="h-4 w-4 shrink-0 text-primary" />
                  <span className="font-semibold text-xs sm:text-sm">{children}</span>
                </div>
              );
            }

            // Default H3
            return (
              <div className="my-2.5 flex items-center gap-2 rounded-xl border border-border/80 bg-muted/40 px-3 py-2 text-foreground shadow-xs">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                <span className="font-semibold text-xs sm:text-sm">{children}</span>
              </div>
            );
          },

          // Numbered lists with cohesive, comfortable styling
          ol: ({ children }) => {
            olCounter = 0;
            return <ol className="my-2.5 space-y-2 pl-0">{children}</ol>;
          },

          li: ({ children }) => {
            const index = olCounter++;

            return (
              <li className="flex items-start gap-2.5 rounded-xl border border-border/60 bg-muted/30 p-2.5 text-foreground transition-all hover:bg-muted/50 sm:p-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-[11px] font-semibold text-primary shadow-xs sm:h-6 sm:w-6 sm:text-xs">
                  {index + 1}
                </span>
                <div className="flex-1 text-xs leading-5 sm:text-sm sm:leading-6">
                  {children}
                </div>
              </li>
            );
          },

          // Unordered lists (bullet points)
          ul: ({ children }) => (
            <ul className="my-2 space-y-1.5 pl-2">{children}</ul>
          ),

          // Blockquote (Warning / Emergency callout)
          blockquote: ({ children }) => (
            <div className="my-2.5 flex items-start gap-2.5 rounded-xl border border-amber-300/60 bg-amber-50/60 p-3 text-amber-950 shadow-xs dark:border-amber-700/40 dark:bg-amber-950/20 dark:text-amber-200">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <div className="text-xs leading-5 sm:text-sm sm:leading-6">{children}</div>
            </div>
          ),

          // Links
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary underline underline-offset-2 transition-colors hover:text-primary/80"
            >
              {children}
            </a>
          ),

          // Paragraphs
          p: ({ children }) => <p className="mb-2 last:mb-0 leading-6">{children}</p>,

          // Bold text highlights
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),

          // Horizontal rule
          hr: () => <hr className="my-3 border-t border-border/70" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default ChatMessageContent;
