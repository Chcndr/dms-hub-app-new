# Riepilogo Integrazioni DMS

**Data:** 22 Dicembre 2025
**Autore:** Manus AI

## 1. Contesto Generale

Il sistema DMS (Digital Market System) si propone come un "gemello digitale" per la gestione dei mercati su area pubblica. L'obiettivo è automatizzare le operazioni, integrare dati da fonti nazionali e locali, e fornire un'interfaccia unificata per Comuni, operatori e imprese. I documenti analizzati [1][2][3] delineano una chiara strategia di integrazione basata su due pilastri: la **Piattaforma Digitale Nazionale Dati (PDND)** e il sistema **SUAP/SSET** di InfoCamere.

## 2. Fonti Dati e Integrazioni Chiave

La tabella seguente riassume le principali fonti dati, gli endpoint da interrogare e i dati da mappare nel sistema DMS.

| Fonte Dati | Piattaforma | Endpoint/Servizio | Dati Chiave | Stato Attuale |
| :--- | :--- | :--- | :--- | :--- |
| **Identità Digitale** | OIDC | `/auth/spid`, `/auth/cie` | Dati anagrafici utente (CF, nome, email) | ✅ **Integrato** |
| **Anagrafica Imprese** | PDND | `verificapartitaiva`, `consultazione-imprese` | P.IVA, CF, denominazione, stato, REA, ATECO, sede | 🟠 **Parzialmente Integrato** |
| **Domicilio Digitale** | PDND | `consultazione-inad`, `consultazione-inipec` | PEC ufficiale dell'impresa | 🔴 **Da Integrare** |
| **Regolarità Contributiva** | PDND | `consultazione-durc-online` | Stato regolarità (DURC), data scadenza | 🟠 **Parzialmente Integrato** |
| **Pratiche SUAP** | SSET | `/pratiche`, `/allegati` | SCIA, subingressi, volture, allegati (HACCP, etc.) | 🔴 **Da Integrare** |
| **Concessioni Mercato** | MercaWeb | `/concessions`, `/presences` | Concessioni, posteggi, presenze, delegati | 🟠 **Parzialmente Integrato** |
| **Pagamenti Canone** | Maggioli Tributi | `/positions`, `/notices`, `/payments` | Posizione contribuente, avvisi pagoPA, pagamenti | 🔴 **Da Integrare** |
| **Casellario Giudiziale** | PDND | (In fase di collaudo) | Requisiti morali degli operatori | ⚪ **Futuro** |

## 3. Flusso Operativo e Logica di Business

Il flusso operativo per la gestione di un'impresa o di una pratica di subingresso prevede una sequenza precisa di chiamate API per arricchire progressivamente il profilo dell'entità nel DMS.

1. **Login Utente**: L'utente accede tramite SPID/CIE. Il sistema recupera i dati anagrafici di base.
2. **Verifica Impresa**: L'utente inserisce una P.IVA. Il sistema la verifica tramite l'Agenzia delle Entrate (via PDND) e poi arricchisce i dati con una visura da InfoCamere (via PDND).
3. **Verifica Requisiti**: Il sistema controlla automaticamente il DURC (via PDND) e il domicilio digitale (INAD/INI-PEC).
4. **Gestione Pratiche**: Per un subingresso, il sistema si integra con SSET per ricevere la SCIA e gli allegati, pre-compilando l'istanza.
5. **Creazione/Aggiornamento Concessione**: La concessione viene creata o aggiornata nel DMS. La fonte primaria è il gestionale del Comune (es. MercaWeb), ma può essere derivata anche da un atto finale presente in una pratica SUAP.
6. **Pagamenti**: Il sistema si integra con il gestionale dei tributi (es. Maggioli) per verificare lo stato dei pagamenti del canone mercatale.

## 4. Azioni Mancanti e Priorità

Sulla base dell'analisi, le seguenti integrazioni sono prioritarie per completare il flusso:

| Priorità | Azione | Dettagli | Stato Attuale |
| :--- | :--- | :--- | :--- |
| **Alta** | **Integrazione SUAP/SSET** | Implementare le chiamate API verso SSET per ricevere le pratiche (SCIA, subingressi) e i relativi allegati. Questo è fondamentale per automatizzare il flusso di subingresso. | 🔴 **Da Integrare** |
| **Alta** | **Integrazione Domicilio Digitale (INAD/INI-PEC)** | Aggiungere la chiamata PDND per recuperare la PEC ufficiale dell'impresa, necessaria per le comunicazioni legali. | 🔴 **Da Integrare** |
| **Media** | **Integrazione Pagamenti (Maggioli)** | Sviluppare l'integrazione con il sistema dei tributi per visualizzare lo stato dei pagamenti del canone e gli avvisi pagoPA. | 🔴 **Da Integrare** |
| **Media** | **Completamento Anagrafica Imprese** | Arricchire i dati dell'impresa con le informazioni complete da InfoCamere (ATECO, cariche/soci, sede legale). | 🟠 **Parzialmente Integrato** |
| **Bassa** | **Gestione Allegati Qualificazioni** | Permettere di caricare e visualizzare i documenti relativi alle qualificazioni (es. attestato HACCP, certificato ISO). | 🟠 **Parzialmente Integrato** |

## 5. Riferimenti

[1] Ambienti-chiamate-empoint.pdf
[2] DMSSSET(3).pdf
[3] FontieDati.pdf
