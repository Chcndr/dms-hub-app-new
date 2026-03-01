/**
 * AIChatDataTable — Tabella dati strutturati da function calling backend
 * Renderizza dati di presenze, scadenze, concessionari, etc.
 */
import type { SSEDataEvent } from "./types";

interface AIChatDataTableProps {
  event: SSEDataEvent;
}

export function AIChatDataTable({ event }: AIChatDataTableProps) {
  const { title, content } = event;
  const { columns, rows } = content;

  if (!columns || !rows || rows.length === 0) {
    return null;
  }

  return (
    <div className="my-3 rounded-xl border border-slate-600/50 bg-[#0d1520] overflow-hidden">
      {title && (
        <div className="px-4 py-2.5 border-b border-slate-700/50 bg-slate-800/30">
          <h4 className="text-sm font-medium text-teal-400">{title}</h4>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700/50 bg-slate-800/20">
              {columns.map(col => (
                <th
                  key={col}
                  className="px-4 py-2 text-left text-xs font-medium text-teal-300 uppercase tracking-wider"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr
                key={idx}
                className="border-b border-slate-700/30 last:border-0 hover:bg-slate-800/30 transition-colors"
              >
                {columns.map(col => (
                  <td
                    key={col}
                    className="px-4 py-2 text-slate-300 whitespace-nowrap"
                  >
                    {row[col] != null ? String(row[col]) : "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-1.5 border-t border-slate-700/30 bg-slate-800/10">
        <span className="text-xs text-slate-500">
          {rows.length} {rows.length === 1 ? "risultato" : "risultati"}
        </span>
      </div>
    </div>
  );
}
