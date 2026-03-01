/**
 * AIChatPanel — Componente principale della chat AI AVA
 * Layout a 2 colonne: sidebar storico + area chat
 * Connesso al backend REST su api.mio-hub.me
 *
 * Fase 2.1: Auto-detect ruolo utente da FirebaseAuth + comuneId da impersonazione
 */
import { useState, useCallback, useEffect, useMemo } from "react";
import { AlertCircle, Download } from "lucide-react";
import { AIChatSidebar } from "./AIChatSidebar";
import { AIChatHeader } from "./AIChatHeader";
import { AIChatMessageList } from "./AIChatMessageList";
import { AIChatInput } from "./AIChatInput";
import { AIChatEmptyState } from "./AIChatEmptyState";
import { AIChatQuotaBanner } from "./AIChatQuotaBanner";
import { useStreamingChat } from "./hooks/useStreamingChat";
import { useConversations } from "./hooks/useConversations";
import { useFirebaseAuth } from "@/contexts/FirebaseAuthContext";
import { MIHUB_API_BASE_URL } from "@/config/api";
import { getIdToken } from "@/lib/firebase";
import type { UserRoleType } from "./types";

/** Mappa ruolo Firebase → ruolo AVA */
function mapFirebaseRoleToAva(
  firebaseRole: string | undefined
): UserRoleType {
  switch (firebaseRole) {
    case "pa":
      return "pa";
    case "business":
      return "impresa";
    case "citizen":
    default:
      return "cittadino";
  }
}

interface AIChatPanelProps {
  /** Ruolo utente esplicito. Se omesso, viene auto-rilevato da FirebaseAuth */
  userRole?: UserRoleType;
  /** ID comune (da impersonazione o contesto) */
  comuneId?: number;
  /** Tab corrente della dashboard (per contesto AVA) */
  currentTab?: string;
  /** Se true, occupa tutta l'altezza disponibile (per uso fullscreen/widget) */
  fullHeight?: boolean;
}

export function AIChatPanel({
  userRole,
  comuneId,
  currentTab,
  fullHeight,
}: AIChatPanelProps) {
  const { user } = useFirebaseAuth();

  // Auto-detect ruolo se non passato esplicitamente
  const effectiveRole = useMemo<UserRoleType>(
    () => userRole ?? mapFirebaseRoleToAva(user?.role),
    [userRole, user?.role]
  );
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const {
    conversations,
    isLoading: conversationsLoading,
    quota,
    createConversation,
    renameConversation,
    deleteConversation,
    fetchMessages,
    fetchConversations,
    fetchQuota,
  } = useConversations();

  const {
    messages,
    streamingContent,
    isStreaming,
    isLoadingData,
    error,
    dataEvents,
    sendMessage,
    stopStreaming,
    setMessages,
    clearError,
  } = useStreamingChat({
    context: {
      comune_id: comuneId,
      user_role: effectiveRole,
      current_tab: currentTab,
    },
    onConversationCreated: newId => {
      setActiveConversationId(newId);
      fetchConversations();
    },
  });

  const activeConversation =
    conversations.find(c => c.id === activeConversationId) ?? null;
  const quotaExceeded = quota
    ? quota.messages_used >= quota.messages_limit
    : false;

  // Load messages when selecting a conversation
  useEffect(() => {
    if (activeConversationId) {
      fetchMessages(activeConversationId).then(msgs => {
        setMessages(msgs);
      });
    } else {
      setMessages([]);
    }
  }, [activeConversationId, fetchMessages, setMessages]);

  const handleSend = useCallback(
    async (text: string) => {
      clearError();
      await sendMessage(text, activeConversationId);
      // Refresh quota after sending
      fetchQuota();
      // Refresh conversations list (title may have been auto-generated)
      setTimeout(() => fetchConversations(), 2000);
    },
    [
      activeConversationId,
      sendMessage,
      clearError,
      fetchQuota,
      fetchConversations,
    ]
  );

  const handleNewConversation = useCallback(async () => {
    const conv = await createConversation();
    if (conv) {
      setActiveConversationId(conv.id);
    }
  }, [createConversation]);

  const handleSelectConversation = useCallback(
    (id: string) => {
      if (isStreaming) return; // Don't switch during streaming
      setActiveConversationId(id);
    },
    [isStreaming]
  );

  const handleDeleteConversation = useCallback(
    async (id: string) => {
      await deleteConversation(id);
      if (activeConversationId === id) {
        setActiveConversationId(null);
        setMessages([]);
      }
    },
    [deleteConversation, activeConversationId, setMessages]
  );

  // Retry: rigenera l'ultima risposta
  const handleRetry = useCallback(async () => {
    if (isStreaming) return;
    // Trova l'ultimo messaggio utente
    const lastUserMsg = [...messages].reverse().find(m => m.role === "user");
    if (!lastUserMsg) return;
    // Rimuovi l'ultimo messaggio assistente
    setMessages(prev => {
      const lastAssistantIdx = prev.findLastIndex(m => m.role === "assistant");
      if (lastAssistantIdx >= 0) {
        return prev.filter((_, i) => i !== lastAssistantIdx);
      }
      return prev;
    });
    // Reinvia il messaggio
    clearError();
    await sendMessage(lastUserMsg.content, activeConversationId);
    fetchQuota();
  }, [
    messages,
    isStreaming,
    activeConversationId,
    sendMessage,
    setMessages,
    clearError,
    fetchQuota,
  ]);

  // Feedback: invia rating al backend
  const handleFeedback = useCallback(
    async (messageId: string, rating: "up" | "down") => {
      try {
        const token = await getIdToken();
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (token) headers["Authorization"] = `Bearer ${token}`;
        await fetch(`${MIHUB_API_BASE_URL}/api/ai/chat/feedback`, {
          method: "POST",
          headers,
          body: JSON.stringify({ message_id: messageId, rating }),
        });
      } catch {
        // Feedback silenzioso — non mostrare errori per il rating
      }
    },
    []
  );

  // Export conversazione in testo
  const handleExport = useCallback(() => {
    const displayMsgs = messages.filter(m => m.role !== "system");
    if (displayMsgs.length === 0) return;
    const title =
      activeConversation?.title || "Conversazione AVA";
    const lines = [
      `# ${title}`,
      `Esportata il ${new Date().toLocaleString("it-IT")}`,
      "",
      ...displayMsgs.map(m => {
        const role = m.role === "user" ? "Tu" : "AVA";
        const time = new Date(m.created_at).toLocaleTimeString("it-IT", {
          hour: "2-digit",
          minute: "2-digit",
        });
        return `**${role}** [${time}]\n${m.content}\n`;
      }),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ava-chat-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [messages, activeConversation]);

  const hasMessages = messages.filter(m => m.role !== "system").length > 0;

  return (
    <div className={`flex ${fullHeight ? "h-full" : "h-[calc(100vh-220px)] min-h-[500px]"} bg-[#0d1520] rounded-xl border border-slate-700/50 overflow-hidden`}>
      {/* Sidebar */}
      <AIChatSidebar
        conversations={conversations}
        activeId={activeConversationId}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onSelect={handleSelectConversation}
        onNew={handleNewConversation}
        onRename={renameConversation}
        onDelete={handleDeleteConversation}
      />

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <AIChatHeader conversation={activeConversation} quota={quota} />

        {/* Quota banner */}
        {quota && <AIChatQuotaBanner quota={quota} />}

        {/* Error banner */}
        {error && (
          <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border-b border-red-500/30 text-red-400 text-xs">
            <AlertCircle className="size-3.5 shrink-0" />
            <span className="flex-1">{error}</span>
            <button
              onClick={clearError}
              className="text-red-400 hover:text-red-300 underline"
            >
              Chiudi
            </button>
          </div>
        )}

        {/* Messages or Empty State */}
        {!hasMessages && !isStreaming ? (
          <AIChatEmptyState
            userRole={effectiveRole}
            currentTab={currentTab}
            onSuggestionClick={handleSend}
          />
        ) : (
          <AIChatMessageList
            messages={messages}
            streamingContent={streamingContent}
            isStreaming={isStreaming}
            isLoadingData={isLoadingData}
            dataEvents={dataEvents}
            onRetry={handleRetry}
            onFeedback={handleFeedback}
          />
        )}

        {/* Input + Export */}
        <div className="flex items-end gap-0">
          <div className="flex-1 min-w-0">
            <AIChatInput
              onSend={handleSend}
              onStop={stopStreaming}
              isStreaming={isStreaming}
              disabled={quotaExceeded}
            />
          </div>
          {hasMessages && (
            <button
              onClick={handleExport}
              className="shrink-0 p-3 mb-1 mr-1 text-slate-500 hover:text-teal-400 transition-colors"
              title="Esporta conversazione"
            >
              <Download className="size-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
