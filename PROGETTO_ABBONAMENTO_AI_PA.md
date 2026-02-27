# PROGETTO DMS HUB - Modello di Abbonamento con AI Locale per PA

> Versione 1.0 | Febbraio 2026
> Documento strategico per il modello commerciale DMS Hub rivolto alle Pubbliche Amministrazioni

---

## 1. VISIONE

DMS Hub offre alle PA italiane una piattaforma completa per la gestione dei mercati ambulanti
con un assistente AI **intelligente, locale e privato** — non un chatbot da intrattenimento,
ma un vero consulente digitale che conosce la normativa, analizza i dati del comune
e supporta le decisioni operative.

**Principio fondamentale: ZERO dati condivisi con terze parti.**
L'AI gira su infrastruttura controllata, i dati della PA non escono mai dal perimetro.

---

## 2. MODELLO DI ABBONAMENTO — 3 PIANI

### Panoramica

| | ESSENZIALE | PROFESSIONALE | ENTERPRISE |
|---|---|---|---|
| **Target** | Comuni < 15.000 ab. | Comuni 15k–100k ab. | Comuni > 100k / Province / Unioni |
| **Prezzo/mese** | **€ 99** | **€ 349** | **€ 899** |
| **Prezzo/anno** | **€ 990** (2 mesi gratis) | **€ 3.490** (2 mesi gratis) | **€ 8.990** (2 mesi gratis) |
| **Setup una tantum** | € 0 | € 499 | € 0 (incluso) |
| **Trial gratuito** | 30 giorni | 30 giorni | 15 giorni su richiesta |

### 2.1 ESSENZIALE — € 99/mese

**Per chi e':** Piccoli comuni che gestiscono pochi mercati settimanali e vogliono
digitalizzare la gestione base con un assistente AI competente.

| Categoria | Cosa include |
|---|---|
| **Mercati** | Fino a 5 mercati |
| **Posteggi** | Fino a 200 posteggi |
| **Operatori** | Fino a 100 operatori |
| **Utenti PA** | 3 utenti amministrativi |
| **AI Assistente** | Modello **Qwen3-30B** locale — 200 messaggi/mese |
| **AI Capacita'** | FAQ mercati, normativa D.Lgs 114/98, procedure base SUAP |
| **Moduli** | Mercati, Posteggi, Presenze, GDPR base |
| **Wallet/PagoPA** | NO |
| **Integrazioni API** | NO |
| **Report** | Base (export CSV) |
| **Support** | Community + documentazione |

**Cosa fa l'AI Essenziale:**
- Risponde a domande sulla normativa del commercio ambulante
- Guida l'operatore PA nelle procedure standard (nuova concessione, subingresso, revoca)
- Genera bozze di comunicazioni per gli operatori
- Consulta i regolamenti comunali caricati nel sistema

---

### 2.2 PROFESSIONALE — € 349/mese

**Per chi e':** Comuni medi con mercati multipli che necessitano gestione completa,
pagamenti digitali e un AI che analizza dati e produce report.

| Categoria | Cosa include |
|---|---|
| **Mercati** | Fino a 30 mercati |
| **Posteggi** | Fino a 1.500 posteggi |
| **Operatori** | Fino a 500 operatori |
| **Utenti PA** | 15 utenti amministrativi |
| **AI Assistente** | Modello **Qwen3-235B** locale — 2.000 messaggi/mese |
| **AI Capacita'** | Tutto Essenziale + analisi dati, report automatici, assistenza SUAP, analisi documenti |
| **Moduli** | TUTTI: Mercati, Posteggi, Presenze, Wallet, PagoPA, TCC, Report avanzati, Mobilita', Segnalazioni, Gaming, Sostenibilita' |
| **Wallet/PagoPA** | SI — completo |
| **Integrazioni API** | SI — API read + write |
| **Report** | Avanzati (PDF, analytics, dashboard) |
| **Support** | Email con SLA 48h |

**Cosa fa l'AI Professionale (in piu'):**
- Interroga il database del comune: "Quanti operatori hanno il canone scaduto?"
- Genera report mensili automatici sull'andamento dei mercati
- Analizza trend di presenze e suggerisce ottimizzazioni
- Assiste nella compilazione pratiche SUAP con pre-compilazione intelligente
- Analizza delibere e documenti caricati
- Confronta dati tra mercati diversi dello stesso comune
- Calcola proiezioni entrate da canoni e tariffe

---

### 2.3 ENTERPRISE — € 899/mese

**Per chi e':** Grandi comuni, province e unioni di comuni che gestiscono reti
di mercati complesse e necessitano AI predittiva e integrazioni complete.

| Categoria | Cosa include |
|---|---|
| **Mercati** | **Illimitati** |
| **Posteggi** | **Illimitati** |
| **Operatori** | **Illimitati** |
| **Utenti PA** | **Illimitati** |
| **AI Assistente** | Modello **Llama 4 Maverick 400B** o **Mistral Large 3** locale — **illimitato** |
| **AI Capacita'** | TUTTO + analisi predittiva, multi-agente, council AI, automazioni |
| **Moduli** | TUTTI + Webhooks, Integrazioni bidirezionali |
| **Wallet/PagoPA** | SI — completo + riconciliazione automatica |
| **Integrazioni API** | SI — full API + webhooks + SSO |
| **Report** | Enterprise (BI, export, scheduling, comparativi multi-comune) |
| **Support** | Dedicato con SLA 4h + account manager |

**Cosa fa l'AI Enterprise (in piu'):**
- Analisi predittiva: prevede affluenza, entrate, criticita' prima che si verifichino
- Multi-agente: 4 agenti specializzati (Analisi, Operativo, Legale, Automazione) coordinati
- Council AI: discussione tra piu' modelli per decisioni complesse
- Automazioni: genera automaticamente avvisi, solleciti, report periodici
- Cross-comune: analizza e confronta dati tra comuni dell'unione/provincia
- Integrazione PDND/ANPR/AppIO per interoperabilita' nazionale

---

## 3. STRATEGIA AI LOCALE — NESSUN DATO CONDIVISO

### 3.1 Perche' locale e non cloud

| Aspetto | Cloud (OpenAI/Anthropic) | Locale (DMS Hub) |
|---|---|---|
| **Privacy dati** | I dati transitano su server USA | I dati restano nel datacenter EU |
| **GDPR** | Rischio transfer extra-UE | Piena conformita' GDPR |
| **Disponibilita'** | Dipende dal provider | Sotto il nostro controllo |
| **Costi ricorrenti** | Crescono con l'uso | Fissi dopo l'investimento HW |
| **Vendor lock-in** | Alto (proprietario) | Zero (modelli open-weight) |
| **Personalizzazione** | Limitata | Fine-tuning su dati comunali |
| **Latenza** | 1-3 secondi | < 1 secondo |
| **Conformita' PA** | Problematica (cloud non qualificato) | Conforme (infrastruttura qualificata AgID) |

**Le PA italiane hanno obblighi specifici:**
- I dati dei cittadini e delle imprese NON possono transitare su server non qualificati
- Il Cloud della PA (strategia AgID) richiede servizi qualificati nel Cloud Marketplace
- Il GDPR impone che i dati personali restino in UE
- Un modello locale elimina TUTTI questi problemi alla radice

### 3.2 Modelli AI selezionati per tier

| Tier | Modello | Parametri | Perche' questo |
|---|---|---|---|
| **Essenziale** | **Qwen3-30B-A3B** | 30B (MoE, 3B attivi) | Velocissimo (20+ tok/s), multilingue, ottimo per FAQ e normativa. Gira su 1 GPU da 24GB |
| **Professionale** | **Qwen3-235B-A22B** | 235B (MoE, 22B attivi) | Livello GPT-4o, eccellente per analisi dati e ragionamento. Necessita 2x GPU 80GB |
| **Enterprise** | **Llama 4 Maverick 400B** | 400B (MoE) | Top prestazioni, contesto 1M token, 200 lingue. Multi-GPU cluster |
| **Alternativa Enterprise** | **Mistral Large 3** | 675B (MoE) | 92% delle prestazioni di GPT-5, deployment su 4 GPU |

### 3.3 Paragone qualita' AI: Locale vs Cloud

| Benchmark | Qwen3-30B (Essenziale) | Qwen3-235B (Professionale) | Llama 4 / Mistral L3 (Enterprise) | Claude Sonnet 4.6 (cloud) | GPT-4o (cloud) |
|---|---|---|---|---|---|
| **MMLU (conoscenza)** | 82% | 90% | 92% | 91% | 88% |
| **HumanEval (codice)** | 75% | 85% | 88% | 90% | 87% |
| **Ragionamento** | Buono | Ottimo | Eccellente | Eccellente | Ottimo |
| **Italiano** | Ottimo | Eccellente | Eccellente | Eccellente | Buono |
| **Velocita'** | 20+ tok/s | 15 tok/s | 10-15 tok/s | ~50 tok/s | ~40 tok/s |
| **Privacy** | 100% locale | 100% locale | 100% locale | Dati su server Anthropic | Dati su server OpenAI |
| **Costo/messaggio** | ~€ 0.001 | ~€ 0.005 | ~€ 0.01 | ~€ 0.03 | ~€ 0.02 |

**Conclusione:** I modelli locali nel 2026 sono al 90-95% delle prestazioni dei modelli cloud,
con il vantaggio decisivo della privacy totale e costi marginali vicini a zero dopo l'investimento hardware.

---

## 4. INFRASTRUTTURA E COSTI HARDWARE

### 4.1 Server AI — Configurazioni per tier

**Opzione A: Server dedicato Hetzner (attuale provider DMS Hub)**

| Config | GPU | RAM | Storage | Costo/mese | Serve per |
|---|---|---|---|---|---|
| **Base** | 1x RTX 4090 (24GB) | 64GB | 1TB NVMe | ~€ 200/mese | Qwen3-30B (Essenziale) — fino a 50 comuni |
| **Pro** | 2x A100 (80GB) | 128GB | 2TB NVMe | ~€ 800/mese | Qwen3-235B (Professionale) — fino a 200 comuni |
| **Enterprise** | 4x A100 (80GB) o 2x H100 | 256GB | 4TB NVMe | ~€ 2.000/mese | Llama4/Mistral L3 (Enterprise) — illimitato |

**Opzione B: Acquisto hardware (ammortamento 3 anni)**

| Config | Hardware | Costo acquisto | Ammortamento/mese | Serve per |
|---|---|---|---|---|
| **Base** | Server + 1x RTX 4090 | ~ € 5.000 | € 140/mese | Essenziale |
| **Pro** | Server + 2x RTX 4090 | ~ € 10.000 | € 280/mese | Professionale |
| **Enterprise** | Server + 4x A100 80GB | ~ € 60.000 | € 1.670/mese | Enterprise |

### 4.2 Stack software AI (tutto open-source, costo zero licenze)

| Componente | Tool | Ruolo |
|---|---|---|
| **Runtime LLM** | **vLLM** | Serving modelli in produzione, 19x piu' veloce di Ollama per multi-utente |
| **API Gateway** | **vLLM OpenAI-compatible API** | Espone API identica a OpenAI — zero cambio codice frontend |
| **Chat UI** | **Open WebUI** | Interfaccia chat per test e admin (opzionale) |
| **Orchestrazione** | **Ollama** (dev) / **vLLM** (prod) | Dev locale con Ollama, produzione con vLLM |
| **Monitoraggio** | **Prometheus + Grafana** | Metriche GPU, latenza, token/s, uptime |
| **Quantizzazione** | **Q4_K_M** via llama.cpp | Riduce VRAM del 75% mantenendo 95%+ qualita' |

### 4.3 Costo per messaggio AI (dopo investimento hardware)

| Tier | Costo elettricita'/msg | Ammortamento HW/msg | **Totale/messaggio** | vs Claude API |
|---|---|---|---|---|
| Essenziale (30B) | € 0.0003 | € 0.0007 | **€ 0.001** | 30x piu' economico |
| Professionale (235B) | € 0.001 | € 0.004 | **€ 0.005** | 6x piu' economico |
| Enterprise (400B) | € 0.003 | € 0.007 | **€ 0.01** | 3x piu' economico |

---

## 5. ANALISI ECONOMICA

### 5.1 Revenue per scenario di adozione

**Scenario Conservativo (Anno 1): 30 comuni**

| Piano | Comuni | Prezzo/mese | Revenue/mese | Revenue/anno |
|---|---|---|---|---|
| Essenziale | 18 | € 99 | € 1.782 | € 21.384 |
| Professionale | 10 | € 349 | € 3.490 | € 41.880 |
| Enterprise | 2 | € 899 | € 1.798 | € 21.576 |
| **Setup fees** | | | | € 4.990 |
| **TOTALE** | **30** | | **€ 7.070** | **€ 89.830** |

**Scenario Medio (Anno 2): 100 comuni**

| Piano | Comuni | Revenue/mese | Revenue/anno |
|---|---|---|---|
| Essenziale | 50 | € 4.950 | € 59.400 |
| Professionale | 35 | € 12.215 | € 146.580 |
| Enterprise | 15 | € 13.485 | € 161.820 |
| **Setup fees** | | | € 17.465 |
| **TOTALE** | **100** | **€ 30.650** | **€ 385.265** |

**Scenario Ambizioso (Anno 3): 300 comuni**

| Piano | Comuni | Revenue/mese | Revenue/anno |
|---|---|---|---|
| Essenziale | 120 | € 11.880 | € 142.560 |
| Professionale | 130 | € 45.370 | € 544.440 |
| Enterprise | 50 | € 44.950 | € 539.400 |
| **Setup fees** | | | € 64.870 |
| **TOTALE** | **300** | **€ 102.200** | **€ 1.291.270** |

### 5.2 Costi operativi

| Voce | Anno 1 (30 comuni) | Anno 2 (100 comuni) | Anno 3 (300 comuni) |
|---|---|---|---|
| Server AI (Hetzner) | € 2.400/anno | € 9.600/anno | € 24.000/anno |
| Hetzner backend esistente | € 3.600/anno | € 3.600/anno | € 7.200/anno |
| Neon DB | € 1.200/anno | € 2.400/anno | € 6.000/anno |
| Vercel frontend | € 240/anno | € 240/anno | € 480/anno |
| Dominio + certificati | € 200/anno | € 200/anno | € 200/anno |
| **TOTALE INFRA** | **€ 7.640** | **€ 16.040** | **€ 37.880** |

### 5.3 Margini

| | Anno 1 | Anno 2 | Anno 3 |
|---|---|---|---|
| Revenue | € 89.830 | € 385.265 | € 1.291.270 |
| Costi infra | € 7.640 | € 16.040 | € 37.880 |
| **Margine lordo** | **€ 82.190** | **€ 369.225** | **€ 1.253.390** |
| **Margine %** | **91.5%** | **95.8%** | **97.1%** |

I margini sono elevati perche':
- L'AI locale ha costo marginale quasi zero (hardware ammortizzato)
- Il software e' proprietario e non ha costi di licenza
- L'infrastruttura scala sub-linearmente (1 server GPU serve 50+ comuni)

---

## 6. STRATEGIA DI CONVERSIONE: DA TRIAL A PAGANTE

### 6.1 Il funnel di conversione

```
TRIAL GRATUITO (30 giorni)
    |
    | Comune prova il piano Essenziale gratis
    | AI risponde a 200 domande su normativa e procedure
    | Il PA scopre quanto tempo risparmia
    |
    v
ESSENZIALE (€ 99/mese) -----> "Vorrei analizzare i dati dei mercati"
    |                          "Vorrei generare report automatici"
    |                          "Vorrei integrare PagoPA"
    v                          "L'AI potrebbe fare di piu'"
PROFESSIONALE (€ 349/mese) -> "Gestisco troppi mercati, mi servono piu' utenti"
    |                          "Vorrei analisi predittive"
    |                          "Devo gestire piu' comuni"
    v
ENTERPRISE (€ 899/mese) ----> Multi-comune, illimitato, AI top
```

### 6.2 Trigger di upgrade naturali

| Da | A | Trigger |
|---|---|---|
| Trial | Essenziale | Il PA ha usato l'AI per 30 giorni e non vuole tornare alla carta |
| Essenziale | Professionale | Raggiunge 200 msg AI/mese e vuole di piu', oppure ha bisogno di PagoPA/wallet |
| Professionale | Enterprise | Gestisce piu' di 30 mercati, oppure e' provincia/unione, oppure vuole AI predittiva |

### 6.3 Messaggi di upsell nell'app

Quando il PA raggiunge l'80% della quota AI mensile:
> "Hai usato 160 dei 200 messaggi AI di questo mese. Passa al piano Professionale
> per 2.000 messaggi/mese e analisi dati avanzate. [Scopri di piu']"

Quando il PA prova a usare una funzione del tier superiore:
> "L'analisi predittiva e' disponibile nel piano Enterprise. Vuoi provarlo per 15 giorni? [Attiva trial]"

---

## 7. CAPACITA' AI PER PIANO — DETTAGLIO

### 7.1 Essenziale — "Il Consulente Normativo"

L'AI del piano Essenziale e' specializzata in normativa e procedure:

| Capacita' | Esempio di domanda |
|---|---|
| Normativa commercio ambulante | "Quali sono i requisiti per il subingresso di una concessione decennale?" |
| Procedure SUAP | "Qual e' l'iter per una nuova autorizzazione tipo A?" |
| Regolamenti comunali | "Il nostro regolamento prevede la revoca dopo quante assenze?" |
| Bozze comunicazioni | "Scrivi una comunicazione di avvio procedimento per revoca concessione" |
| FAQ operatori | "Come deve fare un operatore per richiedere il cambio posteggio?" |
| Calcoli tariffe | "Quanto costa il canone annuale per un posteggio di 12mq alimentare?" |

**Modello:** Qwen3-30B-A3B (MoE, solo 3B parametri attivi per inferenza)
- Velocita': 20+ token/secondo
- Qualita': Paragonabile a GPT-3.5 Turbo / Claude Haiku
- Hardware: 1 GPU 24GB (RTX 4090)
- Contesto: fino a 32K token (circa 25 pagine di testo)

### 7.2 Professionale — "L'Analista Strategico"

L'AI del piano Professionale interroga i dati e produce insight:

| Capacita' | Esempio di domanda |
|---|---|
| Analisi dati mercati | "Qual e' il tasso di occupazione medio dei mercati negli ultimi 6 mesi?" |
| Report automatici | "Genera il report mensile presenze per il mercato di Piazza Roma" |
| Trend e confronti | "Confronta le entrate da canoni tra Q1 e Q2 di quest'anno" |
| Assistenza SUAP | "Pre-compila la pratica di subingresso per l'operatore Rossi Mario" |
| Analisi documenti | "Analizza questa delibera e evidenzia i punti rilevanti per i mercati" |
| Proiezioni | "Stima le entrate da canoni per il prossimo trimestre" |
| Anomalie | "Ci sono operatori con presenze anomale questo mese?" |
| Graduatorie | "Genera la graduatoria aggiornata per il mercato del giovedi'" |

**Modello:** Qwen3-235B-A22B (MoE, 22B parametri attivi)
- Velocita': 15 token/secondo
- Qualita': Paragonabile a GPT-4o / Claude Sonnet
- Hardware: 2 GPU 80GB (A100) oppure 4x RTX 4090 (quantizzato)
- Contesto: fino a 128K token (circa 100 pagine di testo)

### 7.3 Enterprise — "Il Partner Decisionale"

L'AI Enterprise e' un vero partner strategico per la PA:

| Capacita' | Esempio |
|---|---|
| Analisi predittiva | Prevede l'affluenza ai mercati basandosi su meteo, stagionalita', eventi |
| Multi-agente | 4 agenti specializzati che collaborano: Analisi, Operativo, Legale, Automazione |
| Council AI | Discussione tra modelli diversi per decisioni complesse ("Conviene istituire un nuovo mercato in zona X?") |
| Automazioni | Genera e invia automaticamente solleciti, avvisi PagoPA, comunicazioni periodiche |
| Cross-comune | Per unioni/province: confronta, aggrega e analizza dati di tutti i comuni |
| Integrazione nazionale | Interroga PDND, ANPR, AppIO per arricchire i dati |
| Simulazioni | "Se aumentiamo la tariffa del 10%, quale impatto sulle presenze?" |
| Formazione | Addestra il personale PA con sessioni interattive sulla normativa |

**Modello:** Llama 4 Maverick 400B (MoE) o Mistral Large 3
- Velocita': 10-15 token/secondo
- Qualita': Paragonabile a Claude Opus / GPT-5
- Hardware: 4x A100 80GB o 2x H100
- Contesto: fino a 1M token (centinaia di documenti)

---

## 8. PARAGONE CON ALTERNATIVE SUL MERCATO

### 8.1 DMS Hub vs. fare in proprio

| Aspetto | DMS Hub | Sviluppo interno PA | Consulente esterno |
|---|---|---|---|
| Tempo di attivazione | 1 giorno | 12-24 mesi | 6-12 mesi |
| Costo primo anno | € 1.188 - € 10.788 | € 80.000 - € 200.000 | € 40.000 - € 100.000 |
| AI integrata | SI, locale | Da costruire | Probabilmente cloud |
| Aggiornamenti | Continui, inclusi | A carico PA | A pagamento |
| Normativa aggiornata | Automatica | Manuale | Manuale |
| Scalabilita' | 8.000 mercati | Limitata | Limitata |
| Privacy dati | 100% locale EU | Variabile | Variabile |
| Support | Incluso nel piano | Interno | A ore (€ 100-200/h) |

### 8.2 DMS Hub vs. competitor

| Aspetto | DMS Hub | Soluzioni generiche PA | Fogli Excel |
|---|---|---|---|
| Specializzazione mercati | Nativa | Adattata | Zero |
| AI intelligente | Locale, specializzata | ChatGPT generico (se presente) | Zero |
| PagoPA nativo | SI | Spesso add-on | Zero |
| Mobile operatori | SI | Raramente | Zero |
| TCC/Sostenibilita' | SI | NO | NO |
| Costo/anno | Da € 990 | € 5.000 - € 30.000 | "Gratis" (ma costa in ore) |

### 8.3 Costo AI: Locale vs Cloud

Per un comune che fa 1.000 messaggi AI/mese:

| Provider | Costo/mese | Costo/anno | Privacy |
|---|---|---|---|
| **DMS Hub locale (Qwen3-235B)** | **~ € 5** (incluso nel piano) | **€ 60** | 100% locale |
| Claude Sonnet API | ~ € 30 | € 360 | Dati su server Anthropic (USA) |
| GPT-4o API | ~ € 20 | € 240 | Dati su server OpenAI (USA) |
| Gemini Pro API | ~ € 12 | € 144 | Dati su server Google (USA) |
| Claude Opus API | ~ € 90 | € 1.080 | Dati su server Anthropic (USA) |

**Il locale costa 6-18x meno e offre privacy totale.**

---

## 9. ARCHITETTURA TECNICA AI LOCALE

### 9.1 Stack di deployment

```
                        +---------------------------+
                        |     Frontend DMS Hub      |
                        |  (Vercel / React + Vite)  |
                        +------------+--------------+
                                     |
                                     | HTTPS
                                     v
                        +---------------------------+
                        |   Backend DMS Hub (API)   |
                        |   Hetzner 157.90.29.66    |
                        +------------+--------------+
                                     |
                           API OpenAI-compatible
                                     |
                                     v
                    +-------------------------------+
                    |     vLLM Inference Server     |
                    |   Hetzner GPU Server (EU)     |
                    |                               |
                    |  +-------------------------+  |
                    |  | Qwen3-30B   (Essenziale) |  |
                    |  | Qwen3-235B  (Profess.)   |  |
                    |  | Llama4 400B (Enterprise) |  |
                    |  +-------------------------+  |
                    |                               |
                    |  GPU: A100 80GB x2-4          |
                    |  RAM: 128-256GB               |
                    |  Storage: 2-4TB NVMe          |
                    +-------------------------------+
```

### 9.2 Come funziona

1. Il PA scrive un messaggio nella chat AI della dashboard
2. Il backend verifica il piano del comune e la quota residua
3. Il backend chiama vLLM con il modello assegnato al tier del comune
4. vLLM espone un'API OpenAI-compatible — **zero modifiche al frontend**
5. La risposta torna al PA in < 2 secondi
6. Il backend tracka l'utilizzo per billing e analytics

**Vantaggio chiave:** vLLM espone la stessa API di OpenAI/Anthropic.
Se un domani si volesse passare a un modello cloud per un tier specifico,
basta cambiare l'URL del server — il codice non cambia.

### 9.3 Fine-tuning specifico per PA (roadmap)

In futuro, per i clienti Enterprise, il modello puo' essere fine-tuned su:
- Regolamenti comunali specifici del comune
- Storico delibere e determine
- Modulistica locale
- Prassi operative consolidate

Questo rende l'AI ancora piu' specializzata e utile — impossibile con i modelli cloud.

---

## 10. ROADMAP DI IMPLEMENTAZIONE

### Fase 1 — MVP (2 mesi)

- [ ] Deployment vLLM su server Hetzner con Qwen3-30B
- [ ] Chat AI funzionante nella dashboard PA
- [ ] Sistema di quota messaggi per comune
- [ ] Integrazione con dati del comune (contesto automatico)
- [ ] Pagina pricing pubblica sul sito

### Fase 2 — Produzione (2 mesi)

- [ ] Aggiunta modello Qwen3-235B per tier Professionale
- [ ] Sistema di tracking utilizzo e billing
- [ ] Integrazione con fatturazione ComuniPanel esistente
- [ ] Conversazioni persistenti e storico
- [ ] Sistema di upsell automatico (notifiche quota)

### Fase 3 — Enterprise (3 mesi)

- [ ] Deployment modello Llama4/Mistral Large per tier Enterprise
- [ ] Sistema multi-agente con agenti specializzati
- [ ] Analisi predittiva con accesso al DB del comune
- [ ] Council AI (multi-modello per decisioni complesse)
- [ ] API per integrazioni esterne
- [ ] Fine-tuning personalizzato per comuni Enterprise

### Fase 4 — Scala (continua)

- [ ] Onboarding automatizzato (self-service per comuni Essenziale)
- [ ] Marketplace moduli aggiuntivi
- [ ] Partnership con associazioni di categoria (ANCI, UPI)
- [ ] Certificazione AgID Cloud Marketplace

---

## 11. ASPETTI LEGALI E COMPLIANCE

### 11.1 GDPR

- I modelli AI open-weight (Qwen3, Llama 4, Mistral) girano su server EU
- Nessun dato della PA esce dal perimetro infrastrutturale
- Le conversazioni AI sono soggette a retention policy configurabile per comune
- Diritto all'oblio: il modulo GDPR esistente copre anche i dati AI
- Data Processing Agreement (DPA) incluso nel contratto

### 11.2 AgID Cloud

- L'infrastruttura GPU su Hetzner (datacenter in Germania/Finlandia = EU) puo' essere
  qualificata come servizio Cloud per la PA
- In alternativa: deployment su cloud qualificato italiano (es. TIM, Leonardo, Aruba)
- I modelli open-weight non richiedono licenze commerciali aggiuntive

### 11.3 Procurement PA

- Importi sotto € 40.000: affidamento diretto (MePA o extra-MePA)
- Piano Essenziale annuale (€ 990): affidamento diretto senza gara
- Piano Professionale annuale (€ 3.490): affidamento diretto
- Piano Enterprise annuale (€ 10.788): sotto soglia, procedura semplificata
- Pubblicazione su MePA (Mercato Elettronico PA) per facilitare l'acquisto

---

## 12. KPI DI SUCCESSO

| KPI | Target Anno 1 | Target Anno 2 | Target Anno 3 |
|---|---|---|---|
| Comuni attivi | 30 | 100 | 300 |
| Tasso trial → pagante | 40% | 50% | 60% |
| Tasso upgrade (Ess → Pro) | 15% | 25% | 30% |
| Churn mensile | < 5% | < 3% | < 2% |
| NPS (soddisfazione) | > 40 | > 50 | > 60 |
| Messaggi AI / comune / mese | 80 | 150 | 250 |
| Revenue ricorrente annuale (ARR) | € 85K | € 367K | € 1.2M |
| Margine lordo | > 90% | > 95% | > 97% |

---

## 13. RIEPILOGO ESECUTIVO

| Punto chiave | Dettaglio |
|---|---|
| **Prodotto** | Piattaforma gestione mercati ambulanti + AI locale intelligente |
| **Target** | 7.903 comuni italiani con mercati ambulanti |
| **Modello** | SaaS con 3 tier (€ 99 / € 349 / € 899 al mese) |
| **Differenziatore** | AI locale, privata, specializzata — non un chatbot generico |
| **AI** | Modelli open-weight (Qwen3, Llama 4, Mistral) su server EU |
| **Privacy** | Zero dati condivisi — piena conformita' GDPR |
| **Margine** | > 90% (costo marginale AI locale quasi zero) |
| **Break-even** | ~ 15 comuni paganti |
| **TAM** | € 30M+/anno (se 3.000 comuni a media € 10K/anno) |

---

*Documento generato il 27/02/2026 — DMS Hub Team*
