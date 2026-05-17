/**
 * AIChatHeader — Header con titolo conversazione + info modello + toggle voce + elimina
 * v3.0: Aggiunto pulsante elimina conversazione attiva
 */
import { memo, useState } from "react";
import { Bot, Sparkles, PanelLeft, Volume2, VolumeX, Trash2 } from "lucide-react";
import type { Conversation, QuotaInfo } from "./types";

interface AIChatHeaderProps {
  conversation: Conversation | null;
  quota: QuotaInfo | null;
  /** Callback per aprire/chiudere la sidebar conversazioni */
  onToggleSidebar?: () => void;
  /** Se true, mostra il pulsante toggle sidebar (es. su mobile o quando sidebar è chiusa) */
  showSidebarToggle?: boolean;
  /** Se true, la voce di AVA è attiva */
  voiceEnabled?: boolean;
  /** Callback per attivare/disattivare la voce */
  onToggleVoice?: () => void;
  /** Se true, AVA sta parlando in questo momento */
  isSpeaking?: boolean;
  /** Callback per eliminare la conversazione attiva */
  onDeleteConversation?: () => void;
}

export const AIChatHeader = memo(function AIChatHeader({
  conversation,
  quota,
  onToggleSidebar,
  showSidebarToggle,
  voiceEnabled,
  onToggleVoice,
  isSpeaking,
  onDeleteConversation,
}: AIChatHeaderProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

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
        {/* Toggle voce AVA */}
        {onToggleVoice && (
          <button
            onClick={onToggleVoice}
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full border transition-all ${
              voiceEnabled
                ? isSpeaking
                  ? "bg-teal-500/20 border-teal-400/50 text-teal-300 animate-pulse"
                  : "bg-teal-500/10 border-teal-500/30 text-teal-400 hover:bg-teal-500/20"
                : "bg-slate-800/50 border-slate-600/30 text-slate-500 hover:text-slate-400 hover:border-slate-500/30"
            }`}
            title={voiceEnabled ? "Disattiva voce AVA" : "Attiva voce AVA"}
          >
            {voiceEnabled ? (
              <Volume2 className={`size-3.5 ${isSpeaking ? "animate-pulse" : ""}`} />
            ) : (
              <VolumeX className="size-3.5" />
            )}
            <span className="hidden sm:inline">
              {isSpeaking ? "Sta parlando..." : voiceEnabled ? "Voce ON" : "Voce OFF"}
            </span>
          </button>
        )}
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
        {/* Pulsante elimina conversazione attiva */}
        {conversation && onDeleteConversation && (
          confirmDelete ? (
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-red-400">Elimina?</span>
              <button
                onClick={() => {
                  onDeleteConversation();
                  setConfirmDelete(false);
                }}
                className="p-1 text-red-400 hover:text-red-300 transition-colors"
                title="Conferma eliminazione"
              >
                <span className="text-xs font-bold">Si</span>
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="p-1 text-slate-400 hover:text-slate-300 transition-colors"
                title="Annulla"
              >
                <span className="text-xs font-bold">No</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="p-1.5 text-slate-500 hover:text-red-400 transition-colors rounded-lg hover:bg-slate-700/50"
              title="Elimina conversazione"
            >
              <Trash2 className="size-4" />
            </button>
          )
        )}
      </div>
    </div>
  );
});
