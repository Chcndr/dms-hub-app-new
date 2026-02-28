/**
 * AIChatAvatar — Avatar per messaggi chat
 */
import { Bot, User, AlertCircle } from "lucide-react";

interface AIChatAvatarProps {
  role: "user" | "assistant" | "system";
}

export function AIChatAvatar({ role }: AIChatAvatarProps) {
  if (role === "user") {
    return (
      <div className="size-8 shrink-0 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
        <User className="size-4 text-purple-400" />
      </div>
    );
  }

  if (role === "assistant") {
    return (
      <div className="size-8 shrink-0 rounded-full bg-teal-500/20 border border-teal-500/30 flex items-center justify-center">
        <Bot className="size-4 text-teal-400" />
      </div>
    );
  }

  return (
    <div className="size-8 shrink-0 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center">
      <AlertCircle className="size-4 text-red-400" />
    </div>
  );
}
