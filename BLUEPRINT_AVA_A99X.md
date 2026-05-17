# Blueprint AVA AI + A99X: Agente Intelligente per Riunioni e Conoscenza Normativa

**Data:** 17 maggio 2026  
**Versione:** 4.0  
**Autore:** Manus AI — Digital Market System  
**Stato:** Fase 1, Fase 2, Fase 3A COMPLETATE — Prossima: Fase 3B (STT/TTS)

Questo documento rappresenta la fonte di verità per lo sviluppo del sistema AVA AI e l'implementazione del progetto A99X all'interno di MIO HUB. Sostituisce e integra le precedenti versioni del progetto operativo.

---

## 1. Visione e Principi Fondamentali

AVA AI è operativa all'interno di MIO HUB come assistente multi-ruolo (PA, Associazioni, Imprese, Cittadini). Il progetto mira a **potenziarla** con capacità avanzate legate al modulo A99X (Agenda Intelligente), trasformandola da assistente testuale a partecipante attivo nelle videoriunioni e consulente normativo in tempo reale.

**Principi inderogabili:**
1. **Privacy-First e Sovranità dei Dati (100% Locale):** Nessun dato lascerà l'infrastruttura europea. Tutte le tecnologie (LLM, STT, TTS, Vector DB) saranno eseguite localmente sui server Hetzner e Neon.
2. **Perfezionamento, non Ricostruzione:** Mantenere l'architettura multi-ruolo esistente, aggiungendo nuovi strumenti (tools) al Data Gateway.
3. **Scalabilità Orizzontale:** Architettura progettata per scalare da un singolo comune a migliaia di enti.

---

## 2. Stato Attuale dell'Infrastruttura (Aggiornato 17 Mag 2026)

| Componente | Stato | Dettagli |
| :--- | :--- | :--- |
| **AVA AI (Ollama)** | ✅ Operativo | Modello `qwen2.5:7b-instruct-q4_K_M` su Hetzner. System prompt multi-ruolo. |
| **A99X Agenda Intelligente** | ✅ Operativo | 49 endpoint. Riunioni, partecipanti, inviti, task, disponibilità, calendario. |
| **Jitsi Videoconferenze** | ✅ Operativo | Integrazione con `meet.jit.si` tramite `jitsi-service.js`. |
| **IndicePA (IPA)** | ✅ Operativo | API CKAN per ricerca enti, unità organizzative e responsabili PA. |
| **PDND** | ✅ Operativo | Connessione per visure camerali e regolarità fiscale. |
| **Database Neon (PostgreSQL)** | ✅ Operativo | Tutte le tabelle A99X, utenti, comuni, settori. `pgvector` **attivato**. |
| **Ricerca Leggi Nazionali** | ✅ Operativo | **Normattiva MCP Server** (Printing Press v4.8.0). Repo: `Chcndr/normattiva-pp-cli`. |
| **Knowledge Base Normativa (RAG)** | ✅ Operativo | `pgvector` + `nomic-embed-text`. 8 endpoint su `/api/ava/kb/*`. |
| **Trascrizione Audio (STT)** | 🔲 Da aggiungere | Faster-Whisper o WhisperX su Hetzner. |
| **Speaker Diarization** | 🔲 Da aggiungere | Pyannote-audio 4.0 su Hetzner. |
| **Sintesi Vocale (TTS)** | 🔲 Da aggiungere | Piper TTS su Hetzner. |
| **Jitsi Bot (partecipazione AVA)** | 🔲 Da aggiungere | Bot headless per entrare nelle riunioni. |

---

## 3. Stack Tecnologico 100% Locale

| Funzione | Tecnologia | Esecuzione |
| :--- | :--- | :--- |
| Modello Linguistico (LLM) | Ollama (`qwen2.5:7b` → scalabile) | Hetzner |
| Trascrizione Audio | **Faster-Whisper** (C++ ottimizzato) | Hetzner |
| Identificazione Parlanti | **Pyannote-audio 4.0** | Hetzner |
| Sintesi Vocale | **Piper TTS** | Hetzner |
| Embeddings Vettoriali | **nomic-embed-text** (via Ollama) | Hetzner |
| Database Vettoriale | **pgvector** (estensione PostgreSQL) | Neon |
| Ricerca Normativa | **MCP Server (Normattiva)** | Hetzner |
| Bot Riunioni | **Puppeteer-stream** o **Jitsi MCP Server** | Hetzner |

---

## 4. La "Mente Normativa" (Sistema Ibrido) — ✅ COMPLETATA

Il sistema normativo di AVA è ibrido per massimizzare l'efficienza:

### 4.1. Ricerca Normativa Nazionale (MCP) — ✅ COMPLETATA
- Utilizza **Printing Press v4.8.0** per generare un MCP Server in Go (`normattiva-pp-mcp`).
- Interroga in tempo reale le API ufficiali di Normattiva Open Data.
- Endpoint supportati: ricerca semplice, ricerca avanzata, dettaglio atto (URN), tipologiche.
- Repository GitHub: `Chcndr/normattiva-pp-cli` (76 file, CLI + MCP Server).
- OpenAPI spec creata manualmente dal PDF ufficiale di Normattiva.
- **Integrazione AVA:** Tool `cerca_normativa` aggiunto al flusso di chat (`ai-chat.js`). Il classificatore LLM riconosce la categoria `NORMATIVA` e instrada la richiesta all'API.

### 4.2. Knowledge Base Locale (RAG) — ✅ COMPLETATA
- Per regolamenti comunali, delibere e documenti interni PA.
- `pgvector` attivato su Neon con indice HNSW (cosine similarity).
- `nomic-embed-text` su Ollama per la generazione degli embeddings (768 dimensioni).
- **Prerequisito Hetzner:** eseguire `ollama pull nomic-embed-text` per scaricare il modello.
- **Integrazione AVA:** Tool `cerca_knowledge_base` aggiunto al flusso di chat (`ai-chat.js`). Il classificatore LLM riconosce la categoria `KNOWLEDGE_BASE` e instrada la richiesta all'endpoint interno `/api/ava/kb/search`.

**Tabelle create su Neon:**

| Tabella | Scopo |
| :--- | :--- |
| `ava_knowledge_base` | Documenti normativi con embeddings vettoriali (vector 768) |
| `ava_kb_indice` | Indice per settore della Knowledge Base |
| `ava_trascrizioni` | Verbali delle riunioni (per Fase 3B) |
| `ava_interazioni_riunione` | Log domande/risposte AVA durante riunioni (per Fase 3B) |

**Endpoint API Knowledge Base (`/api/ava/kb/`):**

| Endpoint | Metodo | Scopo |
| :--- | :--- | :--- |
| `/api/ava/kb/search` | POST | Ricerca semantica nella KB (query → embedding → pgvector) |
| `/api/ava/kb/ingest` | POST | Ingestione asincrona: salva subito, embedding in background |
| `/api/ava/kb/process-embeddings` | POST | Trigger manuale per processare embedding pendenti |
| `/api/ava/kb/indice` | GET | Elenco settori e sotto-settori dell'archivio |
| `/api/ava/kb/documents` | GET | Lista documenti con filtri (settore, tipo, comune_id) |
| `/api/ava/kb/documents/:id` | GET | Dettaglio singolo documento |
| `/api/ava/kb/documents/:id` | PUT | Aggiorna documento (rigenera embedding se testo cambiato) |
| `/api/ava/kb/documents/:id` | DELETE | Soft delete (attivo = false) |
| `/api/ava/kb/stats` | GET | Statistiche KB + stato Ollama embedding model |

**Funzionalità chiave del router (v2.0 — Architettura Asincrona):**
- **Ingestione asincrona:** il documento viene salvato immediatamente nel DB senza embedding. Un worker in background genera l'embedding entro 30 secondi. Questo evita timeout nginx/502.
- Ogni documento ha un campo `embedding_status`: `pending` (appena salvato) o `ready` (embedding generato).
- Worker background: `setInterval` ogni 30 secondi, processa max 5 documenti alla volta.
- Chunking automatico per documenti lunghi (2000 char/chunk, 200 overlap).
- Supporto dual API Ollama: `/api/embed` (>= 0.4) con fallback a `/api/embeddings` (legacy).
- Filtro per `comune_id` per isolare documenti per ente.
- Soft delete (mai eliminazione fisica).
- Auto-migration: crea tabelle e indici se non esistono.

**Test superati (17 Mag 2026):**

| Test | Risultato |
| :--- | :--- |
| `POST /ingest` — salvataggio documento | ✅ Risposta immediata (< 1s), ID restituito |
| Worker background — generazione embedding | ✅ Embedding generato entro 30s (768 dim) |
| `GET /documents/1` — verifica stato | ✅ `embedding_status: ready` |
| `POST /search` — ricerca semantica | ✅ Similarity 0.72 su query correlata |
| `GET /stats` — stato sistema | ✅ `ollama_status: ready`, worker attivo |

---

## 5. Nuove Capacità di AVA (Cosa Viene Aggiunto)

### 5.1. Partecipazione alle Videoriunioni e Trascrizione Automatica (Fase 3B)
AVA entrerà in ogni riunione Jitsi come partecipante silenzioso. Un servizio Python su Hetzner catturerà lo stream audio, lo segmenterà per parlante con Pyannote, e lo trascriverà con Faster-Whisper. A fine riunione, AVA genererà automaticamente un verbale PDF.

### 5.2. Consulenza Vocale in Tempo Reale (Fase 3B)
AVA potrà essere interpellata vocalmente durante le riunioni e risponderà tramite Piper TTS.

### 5.3. Orchestrazione Autonoma di Riunioni (Fase 4)
AVA organizzerà riunioni in autonomia: identificherà settori PA competenti, cercherà dirigenti via IPA, incrocerà disponibilità A99X, proporrà data/ora, creerà riunione con Jitsi, invierà inviti.

---

## 6. Perfezionamento dei Prompt Multi-Ruolo

| Ruolo | Prompt Attuale | Aggiunte Previste |
| :--- | :--- | :--- |
| **PA** | Gemello Digitale, query DB, analisi statistiche | Organizzazione riunioni, consulenza normativa RAG, ricerca IPA, verbalizzazione |
| **Associazioni** | Analisi dati aggregati, gestione associati | Proposte PA con citazioni normative, tavoli tecnici, analisi impatto |
| **Imprese** | Adempimenti, verifica regolarità PDND | Documentazione per riunioni PA, bandi/finanziamenti, verbali |
| **Cittadini** | Guida servizi comunali, prenotazioni | Spiegazione delibere e normative, accesso verbali pubblici |
| **Admin** | Gestione completa sistema, configurazione | Monitoraggio trascrizioni, gestione KB, configurazione Ollama |

---

## 7. Vincoli Negativi (Cosa NON Fare)

- **MAI inviare dati PA a servizi cloud esterni.** Nessuna chiamata a OpenAI API, Google Cloud Speech, Amazon Transcribe.
- **MAI alterare l'architettura multi-ruolo esistente di AVA.** Le nuove capacità vengono aggiunte come tools aggiuntivi.
- **MAI salvare audio delle riunioni in chiaro su storage esterni.** Le registrazioni temporanee devono essere eliminate dopo la generazione del verbale PDF.
- **MAI confondere `associazione_id` con `comune_id`.** Bug già corretto: quando un'associazione crea una riunione, il `comune_id` deve essere 0.
- **NON compilare Printing Press da sorgente (Go 1.26+) sul server Hetzner;** usare sempre i binari pre-compilati da GitHub Releases o compilare con Go 1.24.
- **NON eliminare fisicamente documenti dalla KB;** usare sempre soft delete (attivo = false).
- **NON usare API esterne per embeddings;** usare solo `nomic-embed-text` locale via Ollama.
- **NON fare ingestione sincrona (embedding durante la POST);** causa timeout nginx/502. Usare SEMPRE il pattern asincrono (salva subito, embedding in background).
- **NON usare solo `/api/embeddings` di Ollama;** le versioni recenti (>= 0.4) usano `/api/embed` con formato diverso (`embeddings: [[...]]` vs `embedding: [...]`). Supportare entrambi.

---

## 8. Requisiti Hardware e Piano di Scalabilità

| Fase | Requisiti | Note |
| :--- | :--- | :--- |
| **Attuale** | Server Hetzner standard + Neon PostgreSQL | Sufficiente per chat testuale e KB |
| **Fase 3B** | Upgrade Hetzner (32GB RAM, GPU consigliata) | Per Faster-Whisper + Pyannote real-time |
| **Fase 4** | Modello LLM più potente (32B+) | Per ragionamento complesso orchestrazione |

---

## 9. Fasi di Sviluppo (Roadmap Aggiornata)

| Fase | Obiettivo | Stato | Data |
| :--- | :--- | :--- | :--- |
| **Fase 1** | Consolidamento e Legacy | ✅ Completata | — |
| **Fase 2** | Normattiva MCP + Knowledge Base RAG | ✅ **Completata** | 17 Mag 2026 |
| **Fase 3A** | Schedulazione Pubblica Nativa | ✅ Completata | — |
| **Fase 3B** | STT/TTS + Jitsi Bot (Trascrizione + Voce AVA) | 🔲 Pianificata | — |
| **Fase 4** | Orchestratore autonomo riunioni | 🔲 Pianificata | — |
| **Continuo** | Perfezionamento prompt multi-ruolo | 🔄 In corso | — |

---

## 10. CHANGELOG

| Data | Versione | Modifiche |
| :--- | :--- | :--- |
| 17 Mag 2026 | v4.0 | AVA_TOOLS v4.0: integrati tool cerca_normativa e cerca_knowledge_base nel flusso di chat di AVA. Classificatore LLM aggiornato con categorie NORMATIVA e KNOWLEDGE_BASE. |
| 17 Mag 2026 | v3.2 | KB v2.0: ingestione asincrona, worker background, fix timeout nginx/502, test completi superati (ingest + search + stats) |
| 17 Mag 2026 | v3.1 | Fase 2 completata: pgvector attivato su Neon, 4 tabelle create, 8 endpoint RAG deployati, Normattiva MCP Server generato con Printing Press v4.8.0 |
| 17 Mag 2026 | v3.0 | Blueprint AVA AI + A99X creato come fonte di verità unificata |
