/**
 * AIChatInput — Area input con invio + stop streaming + upload documento
 * v2.0: Aggiunto pulsante upload documento (graffetta) con preview
 */
import { useState, useRef, memo } from "react";
import { Send, Square, Paperclip, FileText, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MIHUB_API_BASE_URL } from "@/config/api";
import { getIdToken } from "@/lib/firebase";

interface UploadedDocument {
  filename: string;
  text: string;
  chars: number;
  truncated: boolean;
}

interface AIChatInputProps {
  onSend: (text: string) => void;
  onStop: () => void;
  isStreaming: boolean;
  disabled?: boolean;
}

export const AIChatInput = memo(function AIChatInput({
  onSend,
  onStop,
  isStreaming,
  disabled,
}: AIChatInputProps) {
  const [input, setInput] = useState("");
  const [uploadedDoc, setUploadedDoc] = useState<UploadedDocument | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if ((!trimmed && !uploadedDoc) || isStreaming || disabled) return;

    // Se c'è un documento caricato, inietta il testo nel messaggio
    let finalMessage = trimmed;
    if (uploadedDoc) {
      const docPrefix = `[DOCUMENTO ALLEGATO: ${uploadedDoc.filename}${uploadedDoc.truncated ? ' (troncato)' : ''}]\n\n${uploadedDoc.text}\n\n[FINE DOCUMENTO]\n\n`;
      finalMessage = docPrefix + (trimmed || `Analizza questo documento e fornisci un riepilogo.`);
    }

    onSend(finalMessage);
    setInput("");
    setUploadedDoc(null);
    setUploadError(null);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset file input per permettere di ricaricare lo stesso file
    e.target.value = "";

    // Validazione client-side
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setUploadError("File troppo grande (max 5MB)");
      return;
    }

    const allowedTypes = ["application/pdf", "text/plain", "text/csv", "text/markdown"];
    if (!allowedTypes.includes(file.type) && !file.name.endsWith('.txt') && !file.name.endsWith('.md')) {
      setUploadError("Tipo file non supportato. Usa PDF o TXT.");
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const token = await getIdToken();
      const formData = new FormData();
      formData.append("file", file);

      const uploadUrl = typeof window !== 'undefined' && window.location.origin.includes('miohub')
        ? '/api/ai/chat/upload-document'
        : `${MIHUB_API_BASE_URL}/api/ai/chat/upload-document`;

      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Errore upload" }));
        throw new Error(err.error || `Errore ${response.status}`);
      }

      const data = await response.json();
      setUploadedDoc({
        filename: data.filename,
        text: data.text,
        chars: data.chars,
        truncated: data.truncated,
      });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Errore upload documento");
    } finally {
      setIsUploading(false);
    }
  };

  const removeDocument = () => {
    setUploadedDoc(null);
    setUploadError(null);
  };

  return (
    <div className="border-t border-slate-700/50 bg-[#0b1220]/80">
      {/* Preview documento caricato */}
      {uploadedDoc && (
        <div className="flex items-center gap-2 px-4 pt-3 pb-1">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-teal-500/10 border border-teal-500/30 rounded-lg text-xs text-teal-300 max-w-full">
            <FileText className="size-3.5 shrink-0" />
            <span className="truncate">{uploadedDoc.filename}</span>
            <span className="text-teal-500 shrink-0">
              ({(uploadedDoc.chars / 1000).toFixed(1)}k chars{uploadedDoc.truncated ? ", troncato" : ""})
            </span>
            <button
              onClick={removeDocument}
              className="p-0.5 text-teal-400 hover:text-red-400 transition-colors shrink-0"
              title="Rimuovi documento"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

      {/* Errore upload */}
      {uploadError && (
        <div className="flex items-center gap-2 px-4 pt-2 pb-1">
          <span className="text-xs text-red-400">{uploadError}</span>
          <button onClick={() => setUploadError(null)} className="text-xs text-red-400 hover:text-red-300 underline">
            Chiudi
          </button>
        </div>
      )}

      {/* Input area */}
      <form
        onSubmit={handleSubmit}
        className="flex items-end gap-2 p-4"
      >
        {/* Pulsante upload documento (graffetta) */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt,.csv,.md,application/pdf,text/plain,text/csv,text/markdown"
          onChange={handleFileSelect}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isStreaming || disabled || isUploading}
          className={`shrink-0 p-2.5 rounded-lg transition-colors ${
            isUploading
              ? "text-teal-400 animate-pulse"
              : uploadedDoc
              ? "text-teal-400 bg-teal-500/10"
              : "text-slate-500 hover:text-teal-400 hover:bg-slate-700/50"
          } disabled:opacity-50`}
          title="Carica documento (PDF, TXT)"
        >
          {isUploading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Paperclip className="size-4" />
          )}
        </button>

        <Textarea
          ref={textareaRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            disabled
              ? "Quota messaggi esaurita..."
              : uploadedDoc
              ? "Chiedi qualcosa sul documento o invia per analizzarlo..."
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
            disabled={(!input.trim() && !uploadedDoc) || disabled}
            className="shrink-0 h-[42px] w-[42px] bg-teal-600 hover:bg-teal-500 disabled:opacity-50"
            title="Invia messaggio"
          >
            <Send className="size-4" />
          </Button>
        )}
      </form>
    </div>
  );
});
