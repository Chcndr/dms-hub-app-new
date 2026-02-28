/**
 * AIChatMarkdown — Renderer markdown per risposte AI
 * Usa react-markdown + remark-gfm + rehype-highlight
 * con styling personalizzato per tabelle, codice, ecc.
 */
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { Copy, Check } from "lucide-react";
import { useState, useCallback, type ReactNode } from "react";

interface AIChatMarkdownProps {
  content: string;
  isStreaming?: boolean;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-slate-700 hover:bg-slate-600 text-xs px-2 py-1 rounded transition-opacity flex items-center gap-1 text-slate-300"
      title="Copia codice"
    >
      {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
      {copied ? "Copiato" : "Copia"}
    </button>
  );
}

export function AIChatMarkdown({ content, isStreaming }: AIChatMarkdownProps) {
  return (
    <div
      className="prose prose-invert prose-sm max-w-none
                    prose-p:my-1.5 prose-p:leading-relaxed
                    prose-li:my-0.5
                    prose-headings:text-teal-400 prose-headings:mt-3 prose-headings:mb-1.5
                    prose-strong:text-white
                    prose-code:text-teal-300 prose-code:font-mono
                    prose-a:text-teal-400 prose-a:no-underline hover:prose-a:underline
                    prose-blockquote:border-teal-500/50 prose-blockquote:text-slate-300
                    prose-hr:border-slate-600"
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          table: ({ children }: { children?: ReactNode }) => (
            <div className="overflow-x-auto my-2 rounded-lg border border-slate-600">
              <table className="border-collapse text-sm w-full">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }: { children?: ReactNode }) => (
            <thead className="bg-slate-700/50">{children}</thead>
          ),
          th: ({ children }: { children?: ReactNode }) => (
            <th className="border border-slate-600 px-3 py-1.5 text-left text-teal-300 font-medium">
              {children}
            </th>
          ),
          td: ({ children }: { children?: ReactNode }) => (
            <td className="border border-slate-600 px-3 py-1.5">{children}</td>
          ),
          pre: ({ children }: { children?: ReactNode }) => (
            <div className="relative group my-2">
              <pre className="bg-[#0a0f1a] rounded-lg p-4 overflow-x-auto text-sm border border-slate-700">
                {children}
              </pre>
              <CopyButton
                text={
                  // Extract text from children
                  typeof children === "object" && children !== null
                    ? String(
                        (children as { props?: { children?: unknown } })?.props
                          ?.children ?? ""
                      )
                    : String(children ?? "")
                }
              />
            </div>
          ),
          code: ({
            className,
            children,
            ...props
          }: {
            className?: string;
            children?: ReactNode;
          }) => {
            const isBlock = className?.includes("language-");
            if (isBlock) {
              return (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            }
            return (
              <code
                className="bg-slate-700/50 px-1.5 py-0.5 rounded text-sm text-teal-300"
                {...props}
              >
                {children}
              </code>
            );
          },
          ul: ({ children }: { children?: ReactNode }) => (
            <ul className="list-disc list-inside space-y-0.5 my-1.5">
              {children}
            </ul>
          ),
          ol: ({ children }: { children?: ReactNode }) => (
            <ol className="list-decimal list-inside space-y-0.5 my-1.5">
              {children}
            </ol>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
      {isStreaming && (
        <span className="inline-block w-2 h-4 bg-teal-400 animate-pulse ml-0.5 align-middle" />
      )}
    </div>
  );
}
