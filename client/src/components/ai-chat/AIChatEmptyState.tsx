/**
 * AIChatEmptyState — Welcome screen con suggerimenti iniziali
 * Fase 2.5: Suggerimenti contestuali per tab corrente della dashboard
 * Fase 3.8: Suggerimenti multi-ruolo migliorati (impresa: dati reali, cittadino: TCC e civico)
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
  BarChart3,
  Store,
  Wallet,
  Shield,
  Activity,
  Leaf,
  Flag,
  AlertTriangle,
} from "lucide-react";
import type { UserRoleType, SuggestionItem } from "./types";

interface AIChatEmptyStateProps {
  userRole: UserRoleType;
  currentTab?: string;
  onSuggestionClick: (prompt: string) => void;
}

type SuggestionWithIcon = SuggestionItem & { icon: typeof Bot };

const SUGGESTIONS_BY_ROLE: Record<UserRoleType, SuggestionWithIcon[]> = {
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
      label: "Le mie presenze",
      prompt: "Quante presenze ho registrato questo mese?",
    },
    {
      icon: AlertTriangle,
      label: "Rate e scadenze",
      prompt: "Ho rate scadute o canoni da pagare?",
    },
    {
      icon: FileText,
      label: "Le mie concessioni",
      prompt: "Qual e' lo stato delle mie concessioni?",
    },
    {
      icon: Shield,
      label: "Sanzioni e pratiche",
      prompt: "Ho sanzioni aperte o pratiche SUAP in corso?",
    },
  ],
  cittadino: [
    {
      icon: MapPin,
      label: "Mercati aperti",
      prompt: "Quali mercati sono aperti oggi?",
    },
    {
      icon: Leaf,
      label: "I miei crediti TCC",
      prompt: "Quanti crediti TCC ho nel mio wallet?",
    },
    {
      icon: Flag,
      label: "Le mie segnalazioni",
      prompt: "A che punto sono le mie segnalazioni civiche?",
    },
    {
      icon: Clock,
      label: "Orari mercati",
      prompt: "Quali sono gli orari dei mercati questa settimana?",
    },
  ],
};

/** Suggerimenti contestuali per tab della DashboardPA */
const SUGGESTIONS_BY_TAB: Record<string, SuggestionWithIcon[]> = {
  dashboard: [
    {
      icon: BarChart3,
      label: "Panoramica",
      prompt: "Dammi un riepilogo della situazione attuale dei mercati",
    },
    {
      icon: Activity,
      label: "Trend",
      prompt: "Quali sono i trend di occupazione dell'ultimo mese?",
    },
  ],
  mercati: [
    {
      icon: Store,
      label: "Stato mercati",
      prompt: "Quali mercati hanno il maggior numero di posteggi liberi?",
    },
    {
      icon: MapPin,
      label: "Dettagli mercato",
      prompt: "Mostrami i dettagli del mercato principale del comune",
    },
  ],
  imprese: [
    {
      icon: Users,
      label: "Concessionari",
      prompt: "Quali concessionari hanno la concessione in scadenza?",
    },
    {
      icon: FileText,
      label: "Situazione imprese",
      prompt: "Quante imprese sono attive e quante in mora?",
    },
  ],
  wallet: [
    {
      icon: Wallet,
      label: "Incassi",
      prompt: "Qual e' il totale degli incassi di questo mese?",
    },
    {
      icon: CreditCard,
      label: "Pagamenti in sospeso",
      prompt: "Ci sono pagamenti in sospeso o canoni non pagati?",
    },
  ],
  controlli: [
    {
      icon: Shield,
      label: "Controlli",
      prompt: "Quanti controlli sono stati effettuati questa settimana?",
    },
    {
      icon: FileCheck,
      label: "Irregolarita'",
      prompt: "Ci sono operatori con irregolarita' da segnalare?",
    },
  ],
};

export function AIChatEmptyState({
  userRole,
  currentTab,
  onSuggestionClick,
}: AIChatEmptyStateProps) {
  const roleSuggestions =
    SUGGESTIONS_BY_ROLE[userRole] || SUGGESTIONS_BY_ROLE.pa;

  // Se c'e' un tab specifico con suggerimenti contestuali, li prioritizza
  const tabSuggestions =
    currentTab && SUGGESTIONS_BY_TAB[currentTab]
      ? SUGGESTIONS_BY_TAB[currentTab]
      : [];

  // Combina: prima suggerimenti contestuali del tab, poi i generici del ruolo
  const suggestions =
    tabSuggestions.length > 0
      ? [...tabSuggestions, ...roleSuggestions.slice(0, 2)]
      : roleSuggestions;

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
