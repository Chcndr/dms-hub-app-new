# PROGETTO: Chat AI con Streaming — Frontend DMS Hub

> Versione 1.1 | Febbraio 2026
> Progetto dettagliato per il componente frontend della chat AI con streaming SSE
> **UPDATE v1.1**: Tutti gli endpoint migrati da tRPC a REST API su mihub-backend-rest (Express.js su Hetzner).
> Backend tRPC dismesso — ZERO tRPC per la chat AI. Solo REST.
> Questa chat e' il fondamento dell'AVA (Agente Virtuale Attivo) del progetto A99X.
> Vedi PROGETTO_A99X_INTEGRAZIONE_MIOHUB.md per il quadro strategico completo.

---

## 1. OBIETTIVO

Trasformare l'attuale chat AI del tab "Agente AI" (DashboardPA) in un'esperienza
moderna e fluida, **identica a ChatGPT/Claude**, con:

- **Streaming token-by-token** (il testo appare parola per parola)
- **Markdown rendering in tempo reale** (grassetto, tabelle, codice, elenchi)
- **Indicatore "sta scrivendo..."** con animazione
- **Bolle di chat moderne** con avatar, timestamp, animazioni
- **Suggerimenti contestuali** (bottoni cliccabili con domande suggerite)
- **Storico conversazioni** (sidebar navigabile, rinominabile)

---

## 2. STATO ATTUALE — COSA C'E' OGGI

### 2.1 Architettura attuale

L'attuale implementazione della chat AI si trova in:

| File                                                 | Ruolo                                      |
| ---------------------------------------------------- | ------------------------------------------ |
| `client/src/pages/DashboardPA.tsx` (righe 6081-6656) | UI principale chat MIO + 4 agenti          |
| `client/src/contexts/MioContext.tsx`                 | State management conversazione MIO         |
| `client/src/lib/mioOrchestratorClient.ts`            | Client HTTP per orchestratore              |
| `client/src/lib/agentHelper.ts`                      | Helper per invio messaggi agenti           |
| `client/src/lib/orchestratorClient.ts`               | Client API raw                             |
| `client/src/components/AIChatBox.tsx`                | Componente chat riusabile (con Streamdown) |
| `api/mihub/orchestrator-proxy.ts`                    | Proxy Vercel → Hetzner + salvataggio DB    |
| `api/mihub/get-messages.ts`                          | Recupero messaggi da DB                    |

### 2.2 Problemi attuali

| Problema                                                                       | Impatto UX                                              |
| ------------------------------------------------------------------------------ | ------------------------------------------------------- |
| **Nessuno streaming** — la risposta arriva tutta insieme dopo 5-60 secondi     | L'utente non sa se l'AI sta elaborando o se e' bloccata |
| **Timeout 60 secondi** — lunga attesa senza feedback                           | Sensazione di lentezza, abbandono                       |
| **Polling a 5 secondi post-risposta** per messaggi aggiuntivi                  | Ritardo nella visualizzazione                           |
| **Nessun markdown rendering live** — il testo arriva come blocco               | Non si vedono tabelle, grassetto, codice formattato     |
| **Chat inlined nella DashboardPA** — 600+ righe di JSX nel file da 6000+ righe | Difficile da manutenere e migliorare                    |
| **Nessuno storico conversazioni** — solo la conversazione corrente             | L'utente perde il contesto delle sessioni precedenti    |
| **Nessun suggerimento contestuale** — solo input libero                        | L'utente non sa cosa chiedere all'AI                    |
| **Design basico** — bolle semplici senza avatar/animazioni                     | Non ispira fiducia professionale nella PA               |

### 2.3 Flusso dati attuale

```
Utente → handleSendMio() → sendMioMessage()
  → POST /api/mihub/orchestrator (Vercel proxy)
  → Forward a Hetzner backend
  → Orchestratore → Agente AI
  → Risposta COMPLETA (no streaming)
  → Salvataggio DB
  → Ritorno al frontend
  → setMessages() + polling 5s
```

---

## 3. ARCHITETTURA PROPOSTA — STREAMING SSE

### 3.1 Flusso dati con streaming

```
Utente digita messaggio
         |
         v
   AIChatPanel (React)
         |
    POST /api/ai/chat/stream
         |
         v
   Backend DMS Hub (Express)
         |
    Verifica: piano comune, quota residua, conversazione
         |
    POST → vLLM/Ollama (stream: true)
         |
         v
   SSE Stream (Server-Sent Events)
         |
    Backend riceve token per token
         |
    Invia al frontend via SSE
         |
         v
   Frontend riceve token per token
         |
    Aggiorna UI in tempo reale
         |
    Renderizza markdown progressivo
         |
    Salva messaggio completo a fine stream
```

### 3.2 Protocollo SSE

Il backend espone un endpoint SSE che il frontend consuma:

**Endpoint:** `GET /api/ai/chat/stream` (o `POST` con body)

**Eventi SSE inviati dal backend:**

```
event: token
data: {"content": "Buon"}

event: token
data: {"content": "giorno"}

event: token
data: {"content": "! Come"}

event: token
data: {"content": " posso"}

event: token
data: {"content": " aiutarla?"}

event: done
data: {"message_id": "msg_abc123", "tokens_used": 42, "quota_remaining": 158}

event: error
data: {"code": "QUOTA_EXCEEDED", "message": "Hai esaurito i messaggi AI per questo mese."}
```

**Perche' SSE e non WebSocket:**

- SSE e' piu' semplice (unidirezionale server → client)
- Funziona nativamente con HTTP/2 e proxy/CDN
- vLLM e Ollama supportano nativamente lo streaming SSE
- Riconnessione automatica del browser
- Sufficiente per il nostro caso d'uso (lo streaming va solo dal server al client)

### 3.3 Divisione responsabilita'

| Componente                               | Chi lo fa  | Dettagli                                                                |
| ---------------------------------------- | ---------- | ----------------------------------------------------------------------- |
| **Frontend React** (chat, streaming, UI) | **Claude** | Questo progetto                                                         |
| **Backend REST endpoints**               | **Manus**  | Express.js su mihub-backend-rest (Hetzner) — ZERO tRPC                  |
| **Endpoint SSE streaming**               | **Manus**  | `POST /api/ai/chat/stream` che proxa lo stream da vLLM/Ollama           |
| **CRUD conversazioni REST**              | **Manus**  | 6 endpoint REST: GET/POST/PATCH/DELETE conversations + messages + quota |
| **Connessione vLLM/Ollama**              | **Manus**  | OpenAI-compatible API con `stream: true`                                |
| **Gestione quota**                       | **Manus**  | Verifica piano/quota prima di ogni richiesta                            |
| **Database conversazioni**               | **Manus**  | Tabelle `ai_conversations` + `ai_messages`                              |
| **Persistenza messaggi**                 | **Manus**  | Salvataggio a fine stream, recupero storico                             |

---

## 4. COMPONENTE FRONTEND — ARCHITETTURA REACT

### 4.1 Struttura componenti

```
client/src/components/ai-chat/
|
├── AIChatPanel.tsx              # Componente principale (container)
├── AIChatSidebar.tsx            # Sidebar con storico conversazioni
├── AIChatMessageList.tsx        # Lista messaggi con scroll virtuale
├── AIChatMessage.tsx            # Singola bolla messaggio (user/assistant)
├── AIChatInput.tsx              # Area input con suggerimenti
├── AIChatSuggestions.tsx        # Bottoni suggerimenti contestuali
├── AIChatTypingIndicator.tsx    # Animazione "sta scrivendo..."
├── AIChatMarkdown.tsx           # Renderer markdown in tempo reale
├── AIChatAvatar.tsx             # Avatar utente/AI con colori per ruolo
├── AIChatHeader.tsx             # Header con titolo conversazione + azioni
├── AIChatQuotaBanner.tsx        # Banner quota residua messaggi
├── AIChatEmptyState.tsx         # Stato iniziale (nessun messaggio)
|
├── hooks/
│   ├── useStreamingChat.ts      # Hook principale: gestione streaming SSE
│   ├── useConversations.ts      # Hook: CRUD conversazioni
│   └── useChatSuggestions.ts    # Hook: suggerimenti contestuali
|
├── lib/
│   ├── sse-client.ts            # Client SSE con reconnect e parsing
│   └── markdown-stream.ts      # Utility per streaming markdown rendering
|
└── types.ts                     # Tipi TypeScript per la chat
```

### 4.2 Componente principale: AIChatPanel

```tsx
// client/src/components/ai-chat/AIChatPanel.tsx

export function AIChatPanel({ userRole, comuneId }: AIChatPanelProps) {
  // Layout a 2 colonne: sidebar + chat
  return (
    <div className="flex h-full">
      {/* Sidebar sinistra: storico conversazioni */}
      <AIChatSidebar
        conversations={conversations}
        activeId={activeConversationId}
        onSelect={setActiveConversationId}
        onNew={createNewConversation}
        onRename={renameConversation}
        onDelete={deleteConversation}
      />

      {/* Area chat principale */}
      <div className="flex-1 flex flex-col">
        <AIChatHeader
          conversation={activeConversation}
          quotaUsed={quotaUsed}
          quotaTotal={quotaTotal}
        />

        {messages.length === 0 ? (
          <AIChatEmptyState
            suggestions={initialSuggestions}
            onSuggestionClick={handleSend}
          />
        ) : (
          <AIChatMessageList
            messages={messages}
            streamingContent={streamingContent}
            isStreaming={isStreaming}
          />
        )}

        {isStreaming && <AIChatTypingIndicator />}

        <AIChatInput
          onSend={handleSend}
          onStop={stopStreaming}
          isStreaming={isStreaming}
          disabled={quotaExceeded}
        />

        {showSuggestions && (
          <AIChatSuggestions
            suggestions={contextualSuggestions}
            onSelect={handleSend}
          />
        )}
      </div>
    </div>
  );
}
```

### 4.3 Hook principale: useStreamingChat

```tsx
// client/src/components/ai-chat/hooks/useStreamingChat.ts

interface UseStreamingChatReturn {
  messages: ChatMessage[];
  streamingContent: string; // Contenuto in arrivo (token per token)
  isStreaming: boolean;
  error: string | null;
  sendMessage: (text: string) => Promise<void>;
  stopStreaming: () => void;
  clearMessages: () => void;
}

export function useStreamingChat(
  conversationId: string
): UseStreamingChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamingContent, setStreamingContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (text: string) => {
      // 1. Aggiungi messaggio utente alla lista
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: text,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, userMessage]);

      // 2. Inizia streaming
      setIsStreaming(true);
      setStreamingContent("");
      abortRef.current = new AbortController();

      try {
        // 3. Apri connessione SSE
        const response = await fetch("/api/ai/chat/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversation_id: conversationId,
            message: text,
          }),
          signal: abortRef.current.signal,
        });

        // 4. Leggi lo stream token per token
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = JSON.parse(line.slice(6));

              if (data.type === "token") {
                accumulated += data.content;
                setStreamingContent(accumulated);
              } else if (data.type === "done") {
                // Stream completato
                const assistantMessage: ChatMessage = {
                  id: data.message_id,
                  role: "assistant",
                  content: accumulated,
                  timestamp: new Date(),
                };
                setMessages(prev => [...prev, assistantMessage]);
                setStreamingContent("");
              } else if (data.type === "error") {
                throw new Error(data.message);
              }
            }
          }
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          // Gestisci errore
          setMessages(prev => [
            ...prev,
            {
              id: crypto.randomUUID(),
              role: "system",
              content: `Errore: ${err.message}`,
              timestamp: new Date(),
            },
          ]);
        }
      } finally {
        setIsStreaming(false);
        setStreamingContent("");
      }
    },
    [conversationId]
  );

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
    // Salva il contenuto parziale come messaggio
    if (streamingContent) {
      setMessages(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: streamingContent + "\n\n*[Risposta interrotta]*",
          timestamp: new Date(),
        },
      ]);
      setStreamingContent("");
    }
  }, [streamingContent]);

  return {
    messages,
    streamingContent,
    isStreaming,
    error,
    sendMessage,
    stopStreaming,
    clearMessages,
  };
}
```

### 4.4 Client SSE robusto

```tsx
// client/src/components/ai-chat/lib/sse-client.ts

interface SSEClientOptions {
  url: string;
  body: object;
  onToken: (token: string) => void;
  onDone: (metadata: { message_id: string; tokens_used: number }) => void;
  onError: (error: { code: string; message: string }) => void;
  signal?: AbortSignal;
}

export async function streamChat(options: SSEClientOptions) {
  const response = await fetch(options.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify(options.body),
    signal: options.signal,
  });

  if (!response.ok) {
    const error = await response.json();
    options.onError({
      code: "HTTP_ERROR",
      message: error.message || response.statusText,
    });
    return;
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || ""; // L'ultima riga potrebbe essere incompleta

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;

      try {
        const data = JSON.parse(line.slice(6));

        switch (data.type) {
          case "token":
            options.onToken(data.content);
            break;
          case "done":
            options.onDone(data);
            break;
          case "error":
            options.onError(data);
            break;
        }
      } catch {
        // Linea SSE non valida, ignora
      }
    }
  }
}
```

---

## 5. LIBRERIE DA USARE

### 5.1 Librerie selezionate

| Libreria                     | Versione | Ruolo                                            | Perche' questa                                                                                       |
| ---------------------------- | -------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| **react-markdown**           | ^9.x     | Rendering markdown                               | Standard de facto per markdown in React. Supporta plugin remark/rehype                               |
| **remark-gfm**               | ^4.x     | Plugin per tabelle/checkbox GitHub-flavored      | Tabelle, task list, strikethrough                                                                    |
| **rehype-highlight**         | ^7.x     | Syntax highlighting nei blocchi codice           | Evidenzia codice Python, SQL, JSON, etc.                                                             |
| **highlight.js**             | ^11.x    | Motore syntax highlighting                       | Leggero, 190+ linguaggi                                                                              |
| Nessuna libreria SSE esterna | —        | Client SSE nativo con `fetch` + `ReadableStream` | L'API `fetch` con streaming e' supportata da tutti i browser moderni. Non serve una libreria esterna |

### 5.2 Librerie GIA' presenti nel progetto (da riutilizzare)

| Libreria           | Uso attuale         | Uso nella chat                            |
| ------------------ | ------------------- | ----------------------------------------- |
| **Tailwind CSS 4** | Styling globale     | Styling bolle, layout, animazioni         |
| **Lucide React**   | Icone UI            | Icone chat (send, stop, copy, user, bot)  |
| **shadcn/ui**      | Componenti UI       | Button, Input, ScrollArea, Tooltip, Sheet |
| **sonner**         | Toast notifications | Notifiche errori, quota, copia            |
| **date-fns**       | Formattazione date  | Timestamp messaggi                        |

### 5.3 Cosa NON aggiungere

| Libreria                        | Perche' NO                                                                    |
| ------------------------------- | ----------------------------------------------------------------------------- |
| `eventsource-parser`            | Il parsing SSE con `fetch` + `ReadableStream` e' sufficiente e nativo         |
| `socket.io`                     | Overkill — SSE e' unidirezionale, non servono WebSocket bidirezionali         |
| `@microsoft/fetch-event-source` | Deprecata e non necessaria con l'API fetch moderna                            |
| `react-virtualized`             | Le conversazioni PA non avranno migliaia di messaggi — lo scroll nativo basta |
| `framer-motion`                 | Troppe dipendenze — le animazioni CSS/Tailwind sono sufficienti               |

---

## 6. DESIGN UI — ISPIRATO A CHATGPT / CLAUDE

### 6.1 Layout generale

```
+------------------------------------------------------------------+
| [<] Storico conversazioni    |  Assistente AI DMS Hub    [?] [...] |
|------------------------------|--------------------------------------|
| [+ Nuova chat]               |                                      |
|                              |   (Stato vuoto / Welcome)            |
| Oggi                         |                                      |
|  > Come gestire subingresso  |   Logo DMS Hub AI                    |
|  > Report presenze marzo     |   "Come posso aiutarti oggi?"        |
|                              |                                      |
| Ieri                         |   [Normativa mercati]                |
|  > Calcolo canoni 2026       |   [Report presenze]                  |
|  > Operatori scaduti         |   [Calcolo canoni]                   |
|                              |   [Gestione concessioni]             |
| Settimana scorsa             |                                      |
|  > ...                       |                                      |
|                              |                                      |
|------------------------------|--------------------------------------|
|                              |  [ Scrivi un messaggio...    ] [->]  |
+------------------------------------------------------------------+
```

### 6.2 Bolla messaggio utente

```
                                    +-----------------------------+
                                    | Come gestire un subingresso |
                                    | di concessione decennale?   |
                                    +-----------------------------+
                                                        [Avatar] Tu
                                                        14:32
```

### 6.3 Bolla messaggio AI (con streaming)

```
[Avatar AI] Assistente DMS Hub
14:32

+--------------------------------------------------+
| Il **subingresso** di una concessione decennale   |
| e' regolato dall'art. 28 del D.Lgs 114/98.       |
|                                                    |
| I requisiti principali sono:                       |
|                                                    |
| 1. Cessione d'azienda registrata                  |
| 2. Requisiti morali e professionali del cessionario|
| 3. Comunicazione al comune entro 60 giorni        |
|                                                    |
| | Documento | Necessario |                         |
| |-----------|------------|                         |
| | Atto di cessione | Si |                          |
| | DURC | Si |                                      |
| | Antimafia | > €150k |                            |
|                                                    |
| Vuoi che prepari una bozza di comunicazione       |
| per l'avvio del procedimento?|                     |
+--------------------------------------------------+
                                        [Copia] [Rigenera]
```

### 6.4 Indicatore "sta scrivendo..."

```
[Avatar AI] Assistente DMS Hub
+-----------------------------+
| ●  ●  ●  Sta scrivendo...  |
+-----------------------------+
```

L'animazione e' un fade in/out sequenziale dei 3 puntini, implementata con CSS keyframes:

```css
@keyframes typing-dot {
  0%,
  60%,
  100% {
    opacity: 0.3;
  }
  30% {
    opacity: 1;
  }
}
.typing-dot:nth-child(1) {
  animation-delay: 0ms;
}
.typing-dot:nth-child(2) {
  animation-delay: 150ms;
}
.typing-dot:nth-child(3) {
  animation-delay: 300ms;
}
```

### 6.5 Suggerimenti contestuali

Dopo ogni risposta AI, appaiono 2-4 bottoni cliccabili:

```
+--------------------------------------------------+
| [Prepara bozza comunicazione]                     |
| [Quali documenti servono?]                        |
| [Calcola tempistiche procedimento]                |
+--------------------------------------------------+
```

I suggerimenti sono generati dal backend (opzionali nella risposta SSE)
oppure pre-configurati per argomento nel frontend.

### 6.6 Stato vuoto (prima conversazione)

```
        +-------------------------------+
        |         [Logo DMS AI]         |
        |                               |
        |  Come posso aiutarti oggi?    |
        |                               |
        |  Sono l'assistente AI di      |
        |  DMS Hub, specializzato in    |
        |  gestione mercati ambulanti.  |
        |                               |
        +-------------------------------+

  [Normativa mercati]  [Report presenze]
  [Calcolo canoni]     [Gestione concessioni]
```

### 6.7 Banner quota

Quando la quota si avvicina al limite:

```
+--------------------------------------------------+
| ⚠ Hai usato 45 dei 50 messaggi AI questo mese.   |
| Passa al piano Essenziale per 200 msg/mese.       |
| [Scopri di piu']                                   |
+--------------------------------------------------+
```

---

## 7. STREAMING MARKDOWN — COME FUNZIONA

### 7.1 Il problema

Quando il markdown arriva token per token, il rendering deve essere "progressivo":

```
Token 1: "Il **sub"
Token 2: "ingresso"
Token 3: "** e' "
Token 4: "regolato"
```

Se renderizzi "Il \*\*sub" come markdown, il grassetto non si chiude e si rompe.

### 7.2 La soluzione: buffer + rendering intelligente

```
Approccio: "Render what's complete, buffer what's not"

1. Accumula i token in un buffer stringa
2. Identifica i blocchi markdown "completi" (paragrafi chiusi, liste complete)
3. Renderizza i blocchi completi con react-markdown
4. L'ultimo blocco incompleto viene mostrato come testo semplice
5. Quando arriva il token di chiusura, il blocco diventa completo e viene re-renderizzato
```

### 7.3 Implementazione pratica

```tsx
// client/src/components/ai-chat/AIChatMarkdown.tsx

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

interface AIChatMarkdownProps {
  content: string;
  isStreaming?: boolean;
}

export function AIChatMarkdown({ content, isStreaming }: AIChatMarkdownProps) {
  return (
    <div
      className="prose prose-invert prose-sm max-w-none
                    prose-p:my-1 prose-li:my-0.5
                    prose-headings:text-teal-400
                    prose-strong:text-white
                    prose-code:text-teal-300
                    prose-a:text-teal-400"
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          // Tabelle stilizzate
          table: ({ children }) => (
            <div className="overflow-x-auto my-2">
              <table className="border-collapse border border-slate-600 text-sm">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-slate-600 bg-slate-700 px-3 py-1.5 text-left text-teal-300">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-slate-600 px-3 py-1.5">{children}</td>
          ),
          // Blocchi codice con copy button
          code: ({ className, children, ...props }) => {
            const isBlock = className?.includes("language-");
            if (isBlock) {
              return (
                <div className="relative group">
                  <code className={className} {...props}>
                    {children}
                  </code>
                  <button
                    onClick={() =>
                      navigator.clipboard.writeText(String(children))
                    }
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100
                               bg-slate-700 text-xs px-2 py-1 rounded transition-opacity"
                  >
                    Copia
                  </button>
                </div>
              );
            }
            return (
              <code
                className="bg-slate-700 px-1 py-0.5 rounded text-sm"
                {...props}
              >
                {children}
              </code>
            );
          },
        }}
      />
      {/* Cursore lampeggiante durante lo streaming */}
      {isStreaming && (
        <span className="inline-block w-2 h-4 bg-teal-400 animate-pulse ml-0.5" />
      )}
    </div>
  );
}
```

---

## 8. PERSONALIZZAZIONE PER RUOLO UTENTE

### 8.1 Personalizzazione per tipo di utente

L'aspetto e i suggerimenti della chat cambiano in base al ruolo dell'utente:

| Ruolo                | Colore primario  | Avatar AI              | Nome AI                | Suggerimenti iniziali                           |
| -------------------- | ---------------- | ---------------------- | ---------------------- | ----------------------------------------------- |
| **PA (super_admin)** | Teal (#14b8a6)   | Icona building + crown | "Assistente DMS Hub"   | Normativa, report, gestione, RBAC               |
| **PA (dirigente)**   | Teal (#14b8a6)   | Icona building         | "Assistente PA"        | Normativa, report, concessioni                  |
| **PA (operatore)**   | Teal (#14b8a6)   | Icona building         | "Assistente PA"        | Procedure, modulistica, FAQ                     |
| **Impresa**          | Purple (#8b5cf6) | Icona store            | "Assistente Operatore" | Presenze, canoni, documenti, wallet             |
| **Cittadino**        | Blue (#3b82f6)   | Icona info             | "Info Mercati"         | Orari mercati, dove parcheggiare, cosa comprare |

### 8.2 System prompt per ruolo (backend)

Il backend prepende un system prompt diverso per ruolo:

```
PA: "Sei l'assistente AI di DMS Hub per la gestione dei mercati ambulanti.
     Rispondi in italiano. Il tuo utente e' un funzionario PA del Comune di {comuneNome}.
     Conosci la normativa D.Lgs 114/98, il DPR 160/2010 (SUAP) e i regolamenti locali."

Impresa: "Sei l'assistente AI per gli operatori commerciali dei mercati ambulanti.
          Rispondi in modo semplice e pratico. Aiuta con presenze, canoni, documenti."

Cittadino: "Sei l'assistente informativo sui mercati ambulanti della citta'.
            Fornisci informazioni su orari, ubicazioni, prodotti disponibili."
```

### 8.3 Suggerimenti per ruolo

```tsx
const SUGGESTIONS_BY_ROLE = {
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
```

---

## 9. STORICO CONVERSAZIONI — SIDEBAR

### 9.1 Struttura dati (backend — responsabilita' Manus)

```sql
-- Tabella conversazioni (Manus crea in drizzle/schema.ts)
CREATE TABLE ai_conversations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       TEXT NOT NULL,
  comune_id     INTEGER,
  title         TEXT DEFAULT 'Nuova conversazione',
  model         TEXT NOT NULL,                    -- qwen3-8b, qwen3-30b, etc.
  messages_count INTEGER DEFAULT 0,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW(),
  archived      BOOLEAN DEFAULT FALSE
);

-- Tabella messaggi (Manus crea in drizzle/schema.ts)
CREATE TABLE ai_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES ai_conversations(id),
  role            TEXT NOT NULL,                  -- user, assistant, system
  content         TEXT NOT NULL,
  tokens_used     INTEGER,
  created_at      TIMESTAMP DEFAULT NOW()
);
```

### 9.2 Hook frontend

```tsx
// client/src/components/ai-chat/hooks/useConversations.ts

// NOTA: Tutti gli endpoint sono REST su mihub-backend-rest (Express.js su Hetzner)
// ZERO tRPC — il backend tRPC e' dismesso per la chat AI

const AI_API_BASE = import.meta.env.VITE_AI_API_URL || "/api/ai";

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // GET /api/ai/conversations
  const fetchConversations = useCallback(async () => {
    setIsLoading(true);
    const res = await fetch(`${AI_API_BASE}/conversations`, {
      credentials: "include",
    });
    const data = await res.json();
    setConversations(data.conversations ?? []);
    setIsLoading(false);
  }, []);

  // POST /api/ai/conversations
  const createNew = useCallback(async () => {
    const res = await fetch(`${AI_API_BASE}/conversations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({}),
    });
    const data = await res.json();
    await fetchConversations();
    return data;
  }, [fetchConversations]);

  // PATCH /api/ai/conversations/:id
  const rename = useCallback(
    async (id: string, title: string) => {
      await fetch(`${AI_API_BASE}/conversations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title }),
      });
      await fetchConversations();
    },
    [fetchConversations]
  );

  // DELETE /api/ai/conversations/:id
  const remove = useCallback(
    async (id: string) => {
      await fetch(`${AI_API_BASE}/conversations/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      await fetchConversations();
    },
    [fetchConversations]
  );

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return { conversations, isLoading, createNew, rename, delete: remove };
}
```

### 9.3 UI Sidebar

```tsx
// client/src/components/ai-chat/AIChatSidebar.tsx

export function AIChatSidebar({ conversations, activeId, onSelect, onNew }) {
  // Raggruppa per data: Oggi, Ieri, Questa settimana, Questo mese, Precedenti
  const grouped = groupByDate(conversations);

  return (
    <div className="w-64 border-r border-slate-700 flex flex-col bg-slate-900/50">
      {/* Header sidebar */}
      <div className="p-3 border-b border-slate-700">
        <button
          onClick={onNew}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg
                     bg-teal-600/20 text-teal-400 hover:bg-teal-600/30 transition"
        >
          <Plus className="w-4 h-4" />
          Nuova conversazione
        </button>
      </div>

      {/* Lista conversazioni raggruppate */}
      <ScrollArea className="flex-1">
        {Object.entries(grouped).map(([period, convs]) => (
          <div key={period}>
            <div className="px-3 py-1.5 text-xs text-slate-500 font-medium">
              {period}
            </div>
            {convs.map(conv => (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                isActive={conv.id === activeId}
                onClick={() => onSelect(conv.id)}
              />
            ))}
          </div>
        ))}
      </ScrollArea>
    </div>
  );
}
```

---

## 10. GESTIONE STREAMING TOKEN-BY-TOKEN — DETTAGLIO TECNICO

### 10.1 Come il frontend riceve lo stream

Il browser moderno supporta `fetch()` con `ReadableStream` per leggere
la risposta man mano che arriva, senza aspettare che sia completa:

```tsx
const response = await fetch("/api/ai/chat/stream", {
  method: "POST",
  body: JSON.stringify({ conversation_id, message }),
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const text = decoder.decode(value, { stream: true });
  // text contiene uno o piu' token, es: "data: {\"type\":\"token\",\"content\":\"Buon\"}\n\n"
  parseSSEAndUpdateUI(text);
}
```

### 10.2 Rate di aggiornamento UI

Per evitare troppi re-render React (che rallenterebbero il browser):

```tsx
// Batch degli aggiornamenti: accumula token per 16ms (~60fps) prima di aggiornare lo stato
const tokenBuffer = useRef("");
const rafId = useRef<number>();

const onToken = useCallback((token: string) => {
  tokenBuffer.current += token;

  if (!rafId.current) {
    rafId.current = requestAnimationFrame(() => {
      setStreamingContent(prev => prev + tokenBuffer.current);
      tokenBuffer.current = "";
      rafId.current = undefined;
    });
  }
}, []);
```

Questo approccio:

- Accumula i token in un buffer
- Aggiorna lo stato React al massimo 60 volte al secondo (1 per frame)
- Evita "jank" e stuttering nell'animazione dello streaming
- Il markdown rendering viene fatto solo sui frame visibili

### 10.3 Scroll automatico durante lo streaming

```tsx
const messageEndRef = useRef<HTMLDivElement>(null);
const isUserScrolledUp = useRef(false);

// Scroll auto solo se l'utente non ha scrollato manualmente verso l'alto
useEffect(() => {
  if (!isUserScrolledUp.current) {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }
}, [streamingContent, messages]);

// Rileva se l'utente scrolla manualmente
const handleScroll = (e: React.UIEvent) => {
  const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
  isUserScrolledUp.current = scrollHeight - scrollTop - clientHeight > 100;
};
```

---

## 11. CONTRATTO API CON IL BACKEND (MANUS)

### 11.1 Endpoint che il backend deve esporre

Questi sono gli endpoint che il frontend si aspetta. Manus li implementa.

#### Endpoint 1: Chat streaming SSE

```
POST /api/ai/chat/stream
Content-Type: application/json
Accept: text/event-stream

Body:
{
  "conversation_id": "uuid-or-null",   // null = nuova conversazione
  "message": "Come gestire un subingresso?",
  "context": {                          // opzionale, aggiunto dal frontend
    "comune_id": 96,
    "user_role": "pa_dirigente",
    "current_tab": "mercati"
  }
}

Response: SSE stream

event: start
data: {"conversation_id": "abc-123", "model": "qwen3-8b"}

event: token
data: {"type": "token", "content": "Il "}

event: token
data: {"type": "token", "content": "subingresso "}

... (continua token per token) ...

event: done
data: {"type": "done", "message_id": "msg-456", "tokens_used": 234, "quota_remaining": 45}

--- Oppure in caso di errore ---

event: error
data: {"type": "error", "code": "QUOTA_EXCEEDED", "message": "Quota messaggi esaurita per questo mese"}
```

#### Endpoint 2: Lista conversazioni (REST)

```
GET /api/ai/conversations
Authorization: Cookie session (JWT)

Query params: ?limit=20&offset=0

Response 200:
{
  "conversations": [
    {
      "id": "uuid",
      "title": "Come gestire subingresso",
      "messages_count": 4,
      "model": "qwen3-8b",
      "created_at": "2026-02-27T10:00:00Z",
      "updated_at": "2026-02-27T10:05:00Z"
    }
  ],
  "total": 15
}
```

#### Endpoint 3: Crea conversazione (REST)

```
POST /api/ai/conversations
Authorization: Cookie session (JWT)
Content-Type: application/json

Body: {} (vuoto — il titolo viene auto-generato dopo il primo scambio)

Response 201:
{
  "id": "uuid-new",
  "title": "Nuova conversazione",
  "created_at": "2026-02-27T10:00:00Z"
}
```

#### Endpoint 4: Messaggi di una conversazione (REST)

```
GET /api/ai/conversations/:id/messages
Authorization: Cookie session (JWT)

Query params: ?limit=50&offset=0

Response 200:
{
  "messages": [
    {
      "id": "uuid",
      "role": "user",
      "content": "Come gestire un subingresso?",
      "tokens_used": null,
      "created_at": "2026-02-27T10:00:00Z"
    },
    {
      "id": "uuid",
      "role": "assistant",
      "content": "Il subingresso e' regolato...",
      "tokens_used": 234,
      "created_at": "2026-02-27T10:00:05Z"
    }
  ]
}
```

#### Endpoint 5: Rinomina conversazione (REST)

```
PATCH /api/ai/conversations/:id
Authorization: Cookie session (JWT)
Content-Type: application/json

Body: { "title": "Nuovo titolo conversazione" }

Response 200:
{ "success": true }
```

#### Endpoint 6: Elimina conversazione (REST)

```
DELETE /api/ai/conversations/:id
Authorization: Cookie session (JWT)

Response 200:
{ "success": true }
```

#### Endpoint 7: Quota utilizzo (REST)

```
GET /api/ai/quota
Authorization: Cookie session (JWT)

Response 200:
{
  "plan": "starter",
  "messages_used": 23,
  "messages_limit": 50,
  "period_start": "2026-02-01T00:00:00Z",
  "period_end": "2026-02-28T23:59:59Z"
}
```

### 11.2 Auto-titolazione conversazioni

Il backend genera automaticamente un titolo per ogni nuova conversazione
dopo il primo scambio di messaggi. Il titolo viene generato dall'AI stessa:

```
System prompt: "Genera un titolo di massimo 6 parole per questa conversazione
basandoti sul primo messaggio dell'utente e sulla tua risposta.
Rispondi SOLO con il titolo, senza virgolette."
```

---

## 12. PIANO DI IMPLEMENTAZIONE FRONTEND

### Fase 1 — Componente base (3-4 giorni)

1. Creare la struttura cartelle `client/src/components/ai-chat/`
2. Implementare `AIChatPanel.tsx` con layout a 2 colonne
3. Implementare `AIChatMessageList.tsx` + `AIChatMessage.tsx`
4. Implementare `AIChatInput.tsx` con invio su Enter
5. Implementare il client SSE (`sse-client.ts`)
6. Implementare `useStreamingChat.ts` con streaming reale
7. Collegare al mock endpoint locale per test (o direttamente a Ollama se disponibile)

### Fase 2 — Markdown e UI polish (2-3 giorni)

8. Installare e configurare `react-markdown` + `remark-gfm` + `rehype-highlight`
9. Implementare `AIChatMarkdown.tsx` con rendering progressivo
10. Aggiungere `AIChatTypingIndicator.tsx` con animazione CSS
11. Aggiungere cursore lampeggiante durante streaming
12. Animazioni di entrata per le bolle messaggi
13. Pulsante "Copia" per risposte e blocchi codice
14. Pulsante "Stop" durante lo streaming

### Fase 3 — Storico e sidebar (2-3 giorni)

15. Implementare `AIChatSidebar.tsx` con lista conversazioni
16. Implementare `useConversations.ts` con fetch REST (ZERO tRPC)
17. Raggruppamento per data (Oggi, Ieri, Settimana, etc.)
18. Rinomina conversazione (inline edit)
19. Eliminazione conversazione (con conferma)
20. Nuova conversazione

### Fase 4 — Suggerimenti e personalizzazione (1-2 giorni)

21. Implementare `AIChatSuggestions.tsx` con bottoni cliccabili
22. Implementare `AIChatEmptyState.tsx` con welcome screen
23. Suggerimenti diversi per ruolo (PA, impresa, cittadino)
24. Banner quota (`AIChatQuotaBanner.tsx`)
25. Personalizzazione colori/avatar per ruolo

### Fase 5 — Integrazione in DashboardPA (1 giorno)

26. Sostituire il codice chat inline (righe 6081-6656 di DashboardPA.tsx)
    con il nuovo componente `<AIChatPanel />`
27. Collegare ai context esistenti (auth, permissions, impersonation)
28. Verificare che RBAC funzioni (tab `ai` rimane protetto)
29. Test end-to-end con backend streaming

**Totale stimato: 9-13 giorni lavorativi**

---

## 13. NOTE PER MANUS (BACKEND)

### 13.1 Cosa il frontend si aspetta

1. **Un endpoint SSE** (`POST /api/ai/chat/stream`) che:
   - Accetta `conversation_id` (null per nuova) + `message` + `context`
   - Verifica autenticazione (JWT cookie `session`)
   - Verifica quota comune (piano Starter: 50 msg, Essenziale: 200, etc.)
   - Chiama vLLM/Ollama con `stream: true`
   - Proxa lo stream token per token al frontend via SSE
   - Salva il messaggio completo nel DB a fine stream
   - Restituisce `message_id`, `tokens_used`, `quota_remaining` nel evento `done`

2. **Endpoint REST** per gestione conversazioni (ZERO tRPC):
   - `GET    /api/ai/conversations` — lista con paginazione
   - `POST   /api/ai/conversations` — crea nuova conversazione
   - `PATCH  /api/ai/conversations/:id` — rinomina
   - `DELETE /api/ai/conversations/:id` — elimina
   - `GET    /api/ai/conversations/:id/messages` — messaggi di una conversazione
   - `GET    /api/ai/quota` — quota utilizzo corrente

3. **Auto-titolazione** delle conversazioni dopo il primo scambio

4. **Rate limiting** per prevenire abusi (max 5 messaggi/minuto)

### 13.2 Formato SSE che il frontend parsa

```
event: start\n
data: {"conversation_id":"uuid","model":"qwen3-8b"}\n\n

event: token\n
data: {"type":"token","content":"parola "}\n\n

event: done\n
data: {"type":"done","message_id":"uuid","tokens_used":123,"quota_remaining":47}\n\n

event: error\n
data: {"type":"error","code":"QUOTA_EXCEEDED","message":"..."}\n\n
```

### 13.3 Connessione Ollama (per tier Starter su VPS CPU)

```bash
# Ollama espone API OpenAI-compatible
curl http://localhost:11434/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen3:8b",
    "messages": [
      {"role": "system", "content": "Sei l assistente AI DMS Hub..."},
      {"role": "user", "content": "Come gestire un subingresso?"}
    ],
    "stream": true
  }'

# Risposta: stream di chunk SSE con formato OpenAI
```

### 13.4 Connessione vLLM (per tier Essenziale+ su GPU)

```bash
# vLLM espone la stessa API OpenAI-compatible
curl http://gpu-server:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "Qwen/Qwen3-30B-A3B",
    "messages": [...],
    "stream": true
  }'
```

---

## 14. RIEPILOGO

| Aspetto                    | Dettaglio                                                                                |
| -------------------------- | ---------------------------------------------------------------------------------------- |
| **Obiettivo**              | Chat AI con UX identica a ChatGPT/Claude                                                 |
| **Tecnologia streaming**   | SSE (Server-Sent Events) via `fetch` + `ReadableStream`                                  |
| **Framework**              | React 19 + Tailwind 4 + shadcn/ui (stack esistente)                                      |
| **Nuove dipendenze**       | `react-markdown`, `remark-gfm`, `rehype-highlight`                                       |
| **Componenti**             | 12 componenti React + 3 hooks + 2 utility                                                |
| **Personalizzazione**      | Colori/avatar/suggerimenti per PA, Impresa, Cittadino                                    |
| **Storico**                | Sidebar con conversazioni raggruppate per data                                           |
| **Responsabilita' Claude** | Frontend completo (componenti, hooks, UI, streaming client)                              |
| **Responsabilita' Manus**  | Backend REST (endpoint SSE, CRUD conversazioni REST, DB, quota, Ollama/vLLM) — ZERO tRPC |
| **Tempo stimato frontend** | 9-13 giorni lavorativi                                                                   |

---

---

## 15. CONTESTO A99X — EVOLUZIONE FUTURA

> **NON IMPLEMENTARE ORA** — Solo per conoscenza architetturale.

Questa chat AI streaming e' il **fondamento dell'AVA** (Agente Virtuale Attivo) del progetto
A99X — Digital Market System (Assistant 99X). Il Tab "Concilio" attuale verra' sostituito
dall'interfaccia A99X completa in una fase successiva (post test pilota 6 mesi).

**Come il codice chat evolve verso A99X:**

| Componente Chat AI                       | Evoluzione A99X                                    |
| ---------------------------------------- | -------------------------------------------------- |
| RAG su dati PA/mercati                   | AVA accede ai dati specifici della PA/associazione |
| Streaming SSE                            | Risposte real-time dell'agente durante riunioni    |
| Profili per ruolo (PA/Impresa/Cittadino) | Profili AVA personalizzati                         |
| Gestione conversazioni                   | Storico riunioni e report                          |
| Suggerimenti contestuali                 | Follow-up automatizzato post-riunione              |

**Endpoint REST futuri A99X (NON implementare):**

```
POST   /api/a99x/agenda/optimize
POST   /api/a99x/priorities/analyze
POST   /api/a99x/meetings
POST   /api/a99x/meetings/:id/transcribe
POST   /api/a99x/meetings/:id/followup
POST   /api/a99x/translate/text
POST   /api/a99x/translate/speech
```

Vedi `PROGETTO_A99X_INTEGRAZIONE_MIOHUB.md` per dettagli completi.

---

_Documento progetto creato il 27/02/2026, aggiornato v1.1 il 27/02/2026 — DMS Hub Team_
