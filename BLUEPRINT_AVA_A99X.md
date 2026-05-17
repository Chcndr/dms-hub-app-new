# Blueprint AVA AI + A99X: Agente Intelligente per Riunioni e Conoscenza Normativa

**Data:** 17 maggio 2026  
**Versione:** 3.0  
**Autore:** Manus AI — Digital Market System  
**Stato:** Fase 1, Fase 2 (Parziale), Fase 3A COMPLETATE — In corso Fase 2 (RAG)

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
| **Database Neon (PostgreSQL)** | ✅ Operativo | Tutte le tabelle A99X, utenti, comuni, settori. Supporta `pgvector`. |
| **Ricerca Leggi Nazionali** | ✅ Operativo | **Normattiva MCP Server** (Printing Press) integrato in AVA. |
| **Trascrizione Audio (STT)** | 🔲 Da aggiungere | Faster-Whisper o WhisperX su Hetzner. |
| **Speaker Diarization** | 🔲 Da aggiungere | Pyannote-audio 4.0 su Hetzner. |
| **Sintesi Vocale (TTS)** | 🔲 Da aggiungere | Piper TTS su Hetzner. |
| **Knowledge Base Normativa** | ⏳ In corso | `pgvector` su Neon + `nomic-embed-text` su Ollama. |
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

## 4. La "Mente Normativa" (Sistema Ibrido)

Il sistema normativo di AVA è ibrido per massimizzare l'efficienza:

1. **Ricerca Normativa Nazionale (MCP) — ✅ COMPLETATA:**
   - Utilizza **Printing Press** per generare un MCP Server in Go (`normattiva-pp-mcp`).
   - Interroga in tempo reale le API ufficiali di Normattiva Open Data.
   - Endpoint supportati: ricerca semplice, ricerca avanzata, dettaglio atto (URN), tipologiche.

2. **Knowledge Base Locale (RAG) — ⏳ IN CORSO:**
   - Per regolamenti comunali, delibere e documenti interni PA.
   - Utilizza `pgvector` su Neon per l'archiviazione vettoriale.
   - Utilizza `nomic-embed-text` su Ollama per la generazione degli embeddings.

---

## 5. Vincoli Negativi (Cosa NON Fare)

- **MAI inviare dati PA a servizi cloud esterni.** Nessuna chiamata a OpenAI API, Google Cloud Speech, Amazon Transcribe.
- **MAI alterare l'architettura multi-ruolo esistente di AVA.** Le nuove capacità vengono aggiunte come tools aggiuntivi.
- **MAI salvare audio delle riunioni in chiaro su storage esterni.** Le registrazioni temporanee devono essere eliminate dopo la generazione del verbale PDF.
- **MAI confondere `associazione_id` con `comune_id`.** Bug già corretto: quando un'associazione crea una riunione, il `comune_id` deve essere 0.
- **NON compilare Printing Press da sorgente (Go 1.26+) sul server Hetzner;** usare sempre i binari pre-compilati o compilare con Go 1.24.

---

## 6. Fasi di Sviluppo (Roadmap Aggiornata)

| Fase | Obiettivo | Stato |
| :--- | :--- | :--- |
| **Fase 1** | Consolidamento, Legacy, Trascrizione offline riunioni (Faster-Whisper + Pyannote + PDF) | ✅ Completata (Trascrizione da implementare) |
| **Fase 2** | Integrazione Normattiva MCP e Knowledge Base locale (RAG) | ⏳ In corso (Normattiva MCP ✅, RAG 🔲) |
| **Fase 3A** | Schedulazione Pubblica Nativa | ✅ Completata |
| **Fase 3B** | Voce di AVA in riunione (Piper TTS + Jitsi Bot) | 🔲 Pianificata |
| **Fase 4** | Orchestratore autonomo riunioni (LLM avanzato + IPA + A99X) | 🔲 Pianificata |
