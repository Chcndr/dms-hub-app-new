/**
 * AIChatInput — Area input con invio + stop streaming
 */
import { useState, useRef } from "react";
import { Send, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface AIChatInputProps {
  onSend: (text: string) => void;
  onStop: () => void;
  isStreaming: boolean;
  disabled?: boolean;
}

export function AIChatInput({
  onSend,
  onStop,
  isStreaming,
  disabled,
}: AIChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isStreaming || disabled) return;
    onSend(trimmed);
    setInput("");
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-end gap-2 p-4 border-t border-slate-700/50 bg-[#0b1220]/80"
    >
      <Textarea
        ref={textareaRef}
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={
          disabled
            ? "Quota messaggi esaurita..."
            : "Scrivi un messaggio ad AVA..."
        }
        disabled={isStreaming || disabled}
        className="flex-1 min-h-[42px] max-h-32 resize-none bg-[#1a2332] border-slate-600/50 focus:border-teal-500/50 text-[#e8fbff] placeholder-slate-500"
        rows={1}
      />
      {isStreaming ? (
        <Button
          type="button"
          onClick={onStop}
          variant="destructive"
          size="icon"
          className="shrink-0 h-[42px] w-[42px] bg-red-600 hover:bg-red-700"
          title="Interrompi risposta"
        >
          <Square className="size-4" />
        </Button>
      ) : (
        <Button
          type="submit"
          size="icon"
          disabled={!input.trim() || disabled}
          className="shrink-0 h-[42px] w-[42px] bg-teal-600 hover:bg-teal-500 disabled:opacity-50"
          title="Invia messaggio"
        >
          <Send className="size-4" />
        </Button>
      )}
    </form>
  );
}
