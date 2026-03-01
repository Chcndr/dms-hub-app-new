/**
 * AIChatMessageList — Lista messaggi con auto-scroll
 */
import { useEffect, useRef, useState } from "react";
import { ArrowDown } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AIChatMessage } from "./AIChatMessage";
import { AIChatTypingIndicator } from "./AIChatTypingIndicator";
import { AIChatAvatar } from "./AIChatAvatar";
import { AIChatMarkdown } from "./AIChatMarkdown";
import { AIChatDataTable } from "./AIChatDataTable";
import { AIChatStatCard } from "./AIChatStatCard";
import type { ChatMessage, SSEDataEvent } from "./types";

interface AIChatMessageListProps {
  messages: ChatMessage[];
  streamingContent: string;
  isStreaming: boolean;
  isLoadingData?: boolean;
  dataEvents?: SSEDataEvent[];
  onRetry?: () => void;
  onFeedback?: (messageId: string, rating: "up" | "down") => void;
}

export function AIChatMessageList({
  messages,
  streamingContent,
  isStreaming,
  isLoadingData,
  dataEvents,
  onRetry,
  onFeedback,
}: AIChatMessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const isUserScrolledUp = useRef(false);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    const viewport = scrollRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]"
    ) as HTMLDivElement;
    if (viewport) {
      viewport.scrollTo({ top: viewport.scrollHeight, behavior });
    }
  };

  // Auto-scroll when new messages or streaming content arrives
  useEffect(() => {
    if (!isUserScrolledUp.current) {
      scrollToBottom();
    }
  }, [messages, streamingContent]);

  // Initial scroll on mount
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => scrollToBottom("instant"), 100);
    }
  }, []);

  // Detect user scroll
  useEffect(() => {
    const viewport = scrollRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]"
    ) as HTMLDivElement;
    if (!viewport) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = viewport;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      isUserScrolledUp.current = !isNearBottom;
      setShowScrollButton(!isNearBottom);
    };

    viewport.addEventListener("scroll", handleScroll);
    return () => viewport.removeEventListener("scroll", handleScroll);
  }, []);

  const displayMessages = messages.filter(m => m.role !== "system");

  return (
    <div className="relative flex-1 overflow-hidden">
      <div ref={scrollRef} className="h-full">
        <ScrollArea className="h-full">
          <div className="flex flex-col space-y-4 p-4 pb-2">
            {displayMessages.map((message, idx) => {
              const isLastAssistant =
                message.role === "assistant" &&
                idx ===
                  displayMessages.length -
                    1 -
                    [...displayMessages]
                      .reverse()
                      .findIndex(m => m.role === "assistant") &&
                !isStreaming;
              return (
                <AIChatMessage
                  key={message.id}
                  message={message}
                  isLastAssistant={isLastAssistant}
                  onRetry={onRetry}
                  onFeedback={onFeedback}
                />
              );
            })}

            {/* Data events from function calling */}
            {dataEvents && dataEvents.length > 0 && (
              <div className="flex items-start gap-3">
                <AIChatAvatar role="assistant" />
                <div className="flex flex-col gap-1 max-w-[85%] w-full">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-medium text-teal-400">
                      AVA
                    </span>
                    <span className="text-xs text-slate-500">
                      dati consultati
                    </span>
                  </div>
                  {dataEvents.map((event, idx) =>
                    event.data_type === "table" ? (
                      <AIChatDataTable key={idx} event={event} />
                    ) : event.data_type === "stats" ? (
                      <AIChatStatCard key={idx} event={event} />
                    ) : null
                  )}
                </div>
              </div>
            )}

            {/* Loading data indicator */}
            {isLoadingData && (
              <div className="flex items-center gap-2 px-4 py-2">
                <div className="size-2 rounded-full bg-teal-400 animate-pulse" />
                <span className="text-xs text-teal-400/70">
                  AVA sta consultando i dati...
                </span>
              </div>
            )}

            {/* Streaming content (messaggio in arrivo) */}
            {isStreaming && streamingContent && (
              <div className="flex items-start gap-3">
                <AIChatAvatar role="assistant" />
                <div className="flex flex-col gap-1 max-w-[85%]">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-medium text-teal-400">
                      AVA
                    </span>
                  </div>
                  <div className="rounded-2xl rounded-tl-sm bg-[#1a2332] border border-teal-500/20 px-4 py-3">
                    <AIChatMarkdown content={streamingContent} isStreaming />
                  </div>
                </div>
              </div>
            )}

            {/* Typing indicator when waiting for first token */}
            {isStreaming && !streamingContent && !isLoadingData && (
              <AIChatTypingIndicator />
            )}

            <div ref={endRef} />
          </div>
        </ScrollArea>
      </div>

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <button
          onClick={() => {
            isUserScrolledUp.current = false;
            scrollToBottom();
          }}
          className="absolute bottom-4 right-4 z-10 size-10 rounded-full bg-teal-600 shadow-lg flex items-center justify-center hover:bg-teal-500 transition-all"
          aria-label="Torna all'ultimo messaggio"
        >
          <ArrowDown className="size-5 text-white" />
        </button>
      )}
    </div>
  );
}
