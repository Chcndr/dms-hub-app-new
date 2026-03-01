/**
 * AIChatHeader — Header con titolo conversazione + info modello
 */
import { Bot, Sparkles, PanelLeft } from "lucide-react";
import type { Conversation, QuotaInfo } from "./types";

interface AIChatHeaderProps {
  conversation: Conversation | null;
  quota: QuotaInfo | null;
  /** Callback per aprire/chiudere la sidebar conversazioni */
  onToggleSidebar?: () => void;
  /** Se true, mostra il pulsante toggle sidebar (es. su mobile o quando sidebar è chiusa) */
  showSidebarToggle?: boolean;
}

export function AIChatHeader({
  conversation,
  quota,
  onToggleSidebar,
  showSidebarToggle,
}: AIChatHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50 bg-[#0b1220]/50">
      <div className="flex items-center gap-3 min-w-0">
        {showSidebarToggle && onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="p-1.5 -ml-1 shrink-0 text-slate-400 hover:text-teal-400 transition-colors rounded-lg hover:bg-slate-700/50"
            title="Storico conversazioni"
          >
            <PanelLeft className="size-5" />
          </button>
        )}
        <div className="size-8 shrink-0 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
          <Bot className="size-4 text-teal-400" />
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-[#e8fbff] flex items-center gap-1.5">
            AVA
            <Sparkles className="size-3 text-teal-400" />
          </h2>
          <p className="text-[10px] text-slate-500 truncate">
            {conversation ? conversation.title : "Assistente AI DMS Hub"}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {conversation?.model && (
          <span className="text-[10px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full hidden sm:inline">
            {conversation.model}
          </span>
        )}
        {quota && (
          <span className="text-[10px] text-slate-500">
            {quota.messages_used}/{quota.messages_limit} msg
          </span>
        )}
      </div>
    </div>
  );
}
