/**
 * ChatWidget — Cerchietto flottante AVA
 * Apre la chat AI AVA a schermo intero (fullscreen overlay)
 */
import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { AIChatPanel } from "@/components/ai-chat/AIChatPanel";
import type { UserRoleType } from "@/components/ai-chat/types";
import { useImpersonation } from "@/hooks/useImpersonation";

interface ChatWidgetProps {
  userRole?: "cliente" | "operatore" | "pa" | "super_admin" | "owner";
}

/** Mappa il ruolo legacy del widget al tipo AVA */
function mapWidgetRole(
  role: ChatWidgetProps["userRole"]
): UserRoleType | undefined {
  switch (role) {
    case "pa":
    case "super_admin":
    case "owner":
      return "pa";
    case "operatore":
      return "impresa";
    case "cliente":
    default:
      return undefined; // auto-detect da FirebaseAuth
  }
}

export default function ChatWidget({ userRole }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const avaRole = mapWidgetRole(userRole);
  const { comuneId: impComuneId } = useImpersonation();
  const comuneId = impComuneId ? parseInt(impComuneId, 10) : undefined;

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed z-[9999] w-14 h-14 bg-[#14b8a6] hover:bg-[#0d9488] text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110"
        style={{ bottom: "1.5rem", right: "1.5rem", position: "fixed" }}
        aria-label="Apri AVA assistente AI"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-[#0b1220] flex flex-col">
      {/* Header barra con chiusura */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-800/80 border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-teal-500/20 flex items-center justify-center">
            <MessageCircle className="size-4 text-teal-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">AVA</h3>
            <p className="text-xs text-slate-400">Assistente AI DMS Hub</p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="size-10 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          aria-label="Chiudi chat"
        >
          <X className="size-5" />
        </button>
      </div>

      {/* Chat AVA a schermo intero */}
      <div className="flex-1 min-h-0">
        <AIChatPanel userRole={avaRole} comuneId={comuneId} fullHeight />
      </div>
    </div>
  );
}
