/**
 * AIChatEmptyState — Welcome screen con suggerimenti iniziali
 */
import {
  Bot,
  Scale,
  FileText,
  Calculator,
  Users,
  Calendar,
  CreditCard,
  FileCheck,
  HelpCircle,
  MapPin,
  Clock,
  ShoppingBag,
  Car,
} from "lucide-react";
import type { UserRoleType, SuggestionItem } from "./types";

interface AIChatEmptyStateProps {
  userRole: UserRoleType;
  onSuggestionClick: (prompt: string) => void;
}

const SUGGESTIONS_BY_ROLE: Record<
  UserRoleType,
  Array<SuggestionItem & { icon: typeof Bot }>
> = {
  pa: [
    {
      icon: Scale,
      label: "Normativa mercati",
      prompt:
        "Quali sono le principali norme che regolano i mercati ambulanti?",
    },
    {
      icon: FileText,
      label: "Report presenze",
      prompt: "Genera un report delle presenze del mese corrente",
    },
    {
      icon: Calculator,
      label: "Calcolo canoni",
      prompt: "Come si calcolano i canoni per i posteggi?",
    },
    {
      icon: Users,
      label: "Gestione concessioni",
      prompt: "Qual e' l'iter per un subingresso di concessione?",
    },
  ],
  impresa: [
    {
      icon: Calendar,
      label: "Presenze",
      prompt: "Come registro la mia presenza al mercato?",
    },
    {
      icon: CreditCard,
      label: "Pagamenti",
      prompt: "Come pago il canone del posteggio?",
    },
    {
      icon: FileCheck,
      label: "Documenti",
      prompt: "Quali documenti devo tenere aggiornati?",
    },
    {
      icon: HelpCircle,
      label: "Assistenza",
      prompt: "Ho un problema con la mia concessione, come faccio?",
    },
  ],
  cittadino: [
    {
      icon: MapPin,
      label: "Mercati vicini",
      prompt: "Quali mercati ci sono nella mia zona?",
    },
    {
      icon: Clock,
      label: "Orari",
      prompt: "Quali sono gli orari dei mercati questa settimana?",
    },
    {
      icon: ShoppingBag,
      label: "Cosa comprare",
      prompt: "Che tipo di prodotti trovo al mercato?",
    },
    {
      icon: Car,
      label: "Come arrivare",
      prompt: "Dove posso parcheggiare vicino al mercato?",
    },
  ],
};

export function AIChatEmptyState({
  userRole,
  onSuggestionClick,
}: AIChatEmptyStateProps) {
  const suggestions = SUGGESTIONS_BY_ROLE[userRole] || SUGGESTIONS_BY_ROLE.pa;

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-6 gap-8">
      {/* Logo / Welcome */}
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="size-16 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
          <Bot className="size-8 text-teal-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-[#e8fbff] mb-1">
            Come posso aiutarti oggi?
          </h3>
          <p className="text-sm text-slate-400 max-w-md">
            Sono <span className="text-teal-400 font-medium">AVA</span>,
            l'assistente AI di DMS Hub specializzata in gestione dei mercati
            ambulanti.
          </p>
        </div>
      </div>

      {/* Suggestion buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
        {suggestions.map(suggestion => {
          const Icon = suggestion.icon;
          return (
            <button
              key={suggestion.label}
              onClick={() => onSuggestionClick(suggestion.prompt)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-700/50 bg-[#1a2332]/50 hover:bg-[#1a2332] hover:border-teal-500/30 transition-all text-left group"
            >
              <div className="size-9 rounded-lg bg-teal-500/10 flex items-center justify-center shrink-0 group-hover:bg-teal-500/20 transition-colors">
                <Icon className="size-4 text-teal-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#e8fbff] group-hover:text-teal-300 transition-colors">
                  {suggestion.label}
                </p>
                <p className="text-xs text-slate-500 line-clamp-1">
                  {suggestion.prompt}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
