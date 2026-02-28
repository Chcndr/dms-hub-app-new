/**
 * AIChatTypingIndicator — Animazione "sta scrivendo..."
 */
import { AIChatAvatar } from "./AIChatAvatar";

export function AIChatTypingIndicator() {
  return (
    <div className="flex items-start gap-3">
      <AIChatAvatar role="assistant" />
      <div className="rounded-lg bg-[#1a2332] border border-teal-500/20 px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span
            className="size-2 rounded-full bg-teal-400 animate-[typing-dot_1.4s_ease-in-out_infinite]"
            style={{ animationDelay: "0ms" }}
          />
          <span
            className="size-2 rounded-full bg-teal-400 animate-[typing-dot_1.4s_ease-in-out_infinite]"
            style={{ animationDelay: "150ms" }}
          />
          <span
            className="size-2 rounded-full bg-teal-400 animate-[typing-dot_1.4s_ease-in-out_infinite]"
            style={{ animationDelay: "300ms" }}
          />
          <span className="text-xs text-slate-400 ml-2">
            AVA sta scrivendo...
          </span>
        </div>
      </div>
    </div>
  );
}
