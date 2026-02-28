/**
 * AIChatQuotaBanner — Banner quota messaggi residui
 */
import { AlertTriangle, Zap } from "lucide-react";
import type { QuotaInfo } from "./types";

interface AIChatQuotaBannerProps {
  quota: QuotaInfo;
}

export function AIChatQuotaBanner({ quota }: AIChatQuotaBannerProps) {
  const { messages_used, messages_limit, plan } = quota;
  const remaining = messages_limit - messages_used;
  const percentage = (messages_used / messages_limit) * 100;

  // Don't show if plenty of quota remaining (more than 80%)
  if (percentage < 80) return null;

  const isExhausted = remaining <= 0;
  const isWarning = remaining <= 10;

  return (
    <div
      className={`flex items-center gap-2 px-4 py-2 text-xs border-b ${
        isExhausted
          ? "bg-red-500/10 border-red-500/30 text-red-400"
          : isWarning
            ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
            : "bg-teal-500/10 border-teal-500/30 text-teal-400"
      }`}
    >
      {isExhausted ? (
        <AlertTriangle className="size-3.5 shrink-0" />
      ) : (
        <Zap className="size-3.5 shrink-0" />
      )}
      <span className="flex-1">
        {isExhausted
          ? "Hai esaurito i messaggi AI per questo mese."
          : `Hai usato ${messages_used} dei ${messages_limit} messaggi AI di questo mese.`}
      </span>
      <span className="text-slate-500 capitalize">Piano: {plan}</span>
    </div>
  );
}
