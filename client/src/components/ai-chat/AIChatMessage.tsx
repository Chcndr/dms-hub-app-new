/**
 * AIChatMessage — Singola bolla messaggio (user/assistant/system)
 */
import { Copy, Check } from "lucide-react";
import { useState, useCallback } from "react";
import { AIChatAvatar } from "./AIChatAvatar";
import { AIChatMarkdown } from "./AIChatMarkdown";
import type { ChatMessage } from "./types";

interface AIChatMessageProps {
  message: ChatMessage;
  isStreaming?: boolean;
}

export function AIChatMessage({ message, isStreaming }: AIChatMessageProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [message.content]);

  const time = new Date(message.created_at).toLocaleTimeString("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (message.role === "system") {
    return (
      <div className="flex justify-center py-2">
        <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-1.5">
          <AIChatAvatar role="system" />
          <span>{message.content}</span>
        </div>
      </div>
    );
  }

  if (message.role === "user") {
    return (
      <div className="flex items-start gap-3 justify-end group">
        <div className="flex flex-col items-end gap-1 max-w-[80%]">
          <div className="rounded-2xl rounded-tr-sm bg-purple-600/20 border border-purple-500/30 px-4 py-2.5">
            <p className="whitespace-pre-wrap text-sm text-[#e8fbff] leading-relaxed">
              {message.content}
            </p>
          </div>
          <span className="text-xs text-slate-500 px-1">{time}</span>
        </div>
        <AIChatAvatar role="user" />
      </div>
    );
  }

  // Assistant
  return (
    <div className="flex items-start gap-3 group">
      <AIChatAvatar role="assistant" />
      <div className="flex flex-col gap-1 max-w-[85%]">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-medium text-teal-400">AVA</span>
          <span className="text-xs text-slate-500">{time}</span>
        </div>
        <div className="rounded-2xl rounded-tl-sm bg-[#1a2332] border border-teal-500/20 px-4 py-3">
          <AIChatMarkdown content={message.content} isStreaming={isStreaming} />
        </div>
        <div className="flex items-center gap-2 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-teal-400 transition-colors"
            title="Copia risposta"
          >
            {copied ? (
              <Check className="size-3" />
            ) : (
              <Copy className="size-3" />
            )}
            {copied ? "Copiato" : "Copia"}
          </button>
        </div>
      </div>
    </div>
  );
}
