/**
 * AIChatSuggestions — Suggerimenti contestuali dopo una risposta
 */

interface AIChatSuggestionsProps {
  suggestions: string[];
  onSelect: (prompt: string) => void;
  disabled?: boolean;
}

export function AIChatSuggestions({
  suggestions,
  onSelect,
  disabled,
}: AIChatSuggestionsProps) {
  if (suggestions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 px-4 pb-3">
      {suggestions.map(suggestion => (
        <button
          key={suggestion}
          onClick={() => onSelect(suggestion)}
          disabled={disabled}
          className="text-xs px-3 py-1.5 rounded-full border border-teal-500/30 bg-teal-500/5 text-teal-400 hover:bg-teal-500/15 hover:border-teal-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
}
