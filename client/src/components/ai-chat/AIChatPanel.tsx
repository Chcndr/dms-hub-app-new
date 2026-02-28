/**
 * AIChatPanel — Componente principale della chat AI AVA
 * Layout a 2 colonne: sidebar storico + area chat
 * Connesso al backend REST su api.mio-hub.me
 */
import { useState, useCallback, useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { AIChatSidebar } from "./AIChatSidebar";
import { AIChatHeader } from "./AIChatHeader";
import { AIChatMessageList } from "./AIChatMessageList";
import { AIChatInput } from "./AIChatInput";
import { AIChatEmptyState } from "./AIChatEmptyState";
import { AIChatQuotaBanner } from "./AIChatQuotaBanner";
import { useStreamingChat } from "./hooks/useStreamingChat";
import { useConversations } from "./hooks/useConversations";
import type { UserRoleType } from "./types";

interface AIChatPanelProps {
  userRole?: UserRoleType;
  comuneId?: number;
}

export function AIChatPanel({ userRole = "pa", comuneId }: AIChatPanelProps) {
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
    error,
    sendMessage,
    stopStreaming,
    setMessages,
    clearError,
  } = useStreamingChat({
    context: {
      comune_id: comuneId,
      user_role: userRole,
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

  const hasMessages = messages.filter(m => m.role !== "system").length > 0;

  return (
    <div className="flex h-[calc(100vh-220px)] min-h-[500px] bg-[#0d1520] rounded-xl border border-slate-700/50 overflow-hidden">
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
            userRole={userRole}
            onSuggestionClick={handleSend}
          />
        ) : (
          <AIChatMessageList
            messages={messages}
            streamingContent={streamingContent}
            isStreaming={isStreaming}
          />
        )}

        {/* Input */}
        <AIChatInput
          onSend={handleSend}
          onStop={stopStreaming}
          isStreaming={isStreaming}
          disabled={quotaExceeded}
        />
      </div>
    </div>
  );
}
