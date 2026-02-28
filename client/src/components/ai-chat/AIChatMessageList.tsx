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
import type { ChatMessage } from "./types";

interface AIChatMessageListProps {
  messages: ChatMessage[];
  streamingContent: string;
  isStreaming: boolean;
}

export function AIChatMessageList({
  messages,
  streamingContent,
  isStreaming,
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
            {displayMessages.map(message => (
              <AIChatMessage key={message.id} message={message} />
            ))}

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
            {isStreaming && !streamingContent && <AIChatTypingIndicator />}

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
