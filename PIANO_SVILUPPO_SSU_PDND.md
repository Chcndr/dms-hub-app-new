# Piano di Sviluppo a Fasi: Integrazione SSU e PDND in MIO HUB

Questo documento definisce le fasi di sviluppo per l'integrazione del Front Office SUAP (SSU) e della Piattaforma Digitale Nazionale Dati (PDND) nel sistema MIO HUB. Il piano è strutturato per garantire che il sistema esistente (funzionante e stabile) non venga mai compromesso.

## Principi Architetturali e Sicurezza

1. **Isolamento:** I nuovi moduli (`routes/pdnd.js`, `routes/ssu-connector.js`) saranno file separati. Non modificheremo la logica esistente di `routes/suap.js`.
2. **Feature Flag:** L'invio SSU si attiverà solo se le variabili d'ambiente PDND/SSU sono configurate. Altrimenti, il sistema continuerà a funzionare come oggi.
3. **Sicurezza e Ruoli:** Gli endpoint SSU/PDND saranno protetti dal middleware di autenticazione esistente. Solo gli utenti con ruolo `admin` o `comune` potranno accedervi.
4. **Impersonalizzazione:** Il sistema di impersonalizzazione esistente permetterà agli admin di testare il flusso "come se fossero" un Comune specifico, garantendo che i dati inviati al Back Office abbiano l'Ente corretto.
5. **Guardian:** Ogni nuovo endpoint sarà registrato in `realEndpoints.ts` per essere monitorato in tempo reale dalla Dashboard Integrazioni.

---

## FASE 1: Preparazione Database e Catalogo Guardian (Backend + Frontend)

**Obiettivo:** Creare le strutture dati necessarie e registrare gli endpoint nel sistema di monitoraggio, senza ancora implementarli.

**Azioni:**
1. Creare tabella `ssu_instances` in Neon DB (collegata a `suap_pratiche`).
2. Creare tabella `ssu_documents` in Neon DB (collegata a `suap_documenti`).
3. Aggiungere gli array `pdndEndpoints`, `ssuEndpoints` e `appIoEndpoints` in `client/src/config/realEndpoints.ts`.
4. Aggiornare `health-monitor.js` per includere i check specifici per SSU.

**Test di Funzionamento (Fase 1):**
- [ ] Verificare che le nuove tabelle esistano in Neon DB senza errori.
- [ ] Aprire la Dashboard MIO HUB -> Tab Integrazioni.
- [ ] Verificare che il numero totale di endpoint sia aumentato.
- [ ] Cercare "SSU" o "PDND" nella barra di ricerca e verificare che appaiano i nuovi endpoint (anche se restituiscono 404 per ora).
- [ ] Verificare che il flusso SUAP esistente continui a funzionare regolarmente.

---

## FASE 2: Implementazione Modulo PDND (Backend)

**Obiettivo:** Sviluppare il client per comunicare con la PDND e ottenere i voucher JWT.

**Azioni:**
1. Creare `routes/pdnd.js`.
2. Implementare la generazione della `client_assertion` (JWT firmato con chiave privata RSA).
3. Implementare l'endpoint `/api/pdnd/voucher` che chiama `https://api.pdnd.pagopa.it/as/token.oauth2`.
4. Implementare gli endpoint mock per gli e-service (ANPR, Registro Imprese) che restituiscono dati finti se l'accreditamento non è ancora attivo.
5. Montare le route in `index.js`.

**Test di Funzionamento (Fase 2):**
- [ ] Chiamare `/api/pdnd/voucher` tramite Guardian API Playground.
- [ ] Verificare che il sistema gestisca correttamente l'errore se le chiavi RSA non sono configurate (comportamento atteso pre-accreditamento).
- [ ] Testare gli endpoint mock (es. `/api/pdnd/anpr/residenza`) e verificare che restituiscano i dati finti previsti.

---

## FASE 3: Implementazione SSU Connector - Client (Backend)

**Obiettivo:** Sviluppare la capacità di MIO HUB di inviare pratiche al Catalogo SSU e al Back Office.

**Azioni:**
1. Creare `routes/ssu-connector.js`.
2. Implementare la generazione dell'XML della pratica secondo gli XSD AgID.
3. Implementare l'endpoint `/api/ssu/request_cui` (chiama il Catalogo SSU).
4. Implementare l'endpoint `/api/ssu/send_instance` (chiama il Back Office).
5. Implementare la firma `Agid-JWT-Signature` per le richieste.

**Test di Funzionamento (Fase 3):**
- [ ] Utilizzare l'impersonalizzazione per loggarsi come "Comune di Grosseto".
- [ ] Generare una pratica SUAP di test.
- [ ] Chiamare `/api/ssu/request_cui` e verificare la generazione dell'XML e la firma JWT.
- [ ] (Se in ambiente di collaudo SSU) Verificare la ricezione del CUI.

---

## FASE 4: Implementazione SSU Connector - Server Webhook (Backend)

**Obiettivo:** Sviluppare gli endpoint passivi che il Back Office chiamerà per aggiornare lo stato della pratica.

**Azioni:**
1. Aggiungere a `routes/ssu-connector.js` l'endpoint `POST /api/ssu/webhook/notify`.
2. Aggiungere l'endpoint `POST /api/ssu/webhook/request_correction`.
3. Implementare la validazione della firma `Agid-JWT-Signature` in ingresso (per verificare che la chiamata provenga davvero dal Back Office).
4. Aggiornare lo stato della pratica nel DB (`ssu_instances`) in base al payload ricevuto.

**Test di Funzionamento (Fase 4):**
- [ ] Simulare una chiamata POST a `/api/ssu/webhook/notify` usando Postman o Guardian.
- [ ] Verificare che la firma venga validata (o respinta se non valida).
- [ ] Verificare che lo stato della pratica nel database cambi (es. da `SENT` a `ACCEPTED`).

---

## FASE 5: Integrazione UI SSU (Frontend)

**Obiettivo:** Sostituire i mock nel tab "Piattaforme PA" con chiamate reali e aggiungere il tracker SSU nella pratica.

**Azioni:**
1. Modificare `PiattaformePA.tsx` per fare fetch reali verso `/api/pdnd/*` e `/api/ssu/*`.
2. Creare il componente `SSUInstanceTracker.tsx` da inserire nel dettaglio della pratica SUAP.
3. Aggiungere il pulsante "Invia a SSU" nella vista dettaglio pratica (visibile solo se la pratica è firmata e SSU è configurato).

**Test di Funzionamento (Fase 5):**
- [ ] Aprire il tab "Piattaforme PA" e verificare che i dati vengano caricati dal backend.
- [ ] Aprire una pratica SUAP completata e verificare la presenza del tracker SSU.
- [ ] Cliccare "Invia a SSU" e verificare il flusso visivo (spinner, messaggio di successo/errore).

---

## FASE 6: Accreditamento PDND e Go-Live (Azione Utente/Amministrativa)

**Obiettivo:** Attivare la connessione reale con la PDND.

**Passaggi per l'Accreditamento (da eseguire sul portale PDND Interop):**
1. Il Legale Rappresentante del Comune accede a `selfcare.pagopa.it` e delega un Amministratore Tecnico.
2. L'Amministratore Tecnico accede a `interop.pagopa.it` (PDND).
3. Creare un nuovo "Client" di tipo API.
4. Generare localmente una coppia di chiavi RSA (es. `openssl genrsa -out private.pem 2048`).
5. Caricare la chiave pubblica (`public.pem`) sul portale PDND.
6. Il portale fornirà un `client_id`.
7. Cercare nel catalogo PDND gli e-service necessari (es. "Catalogo SSU", "ANPR", "Registro Imprese") e inviare "Richiesta di fruizione".
8. Attendere l'approvazione dell'Ente Erogatore.

**Configurazione MIO HUB:**
Una volta ottenuto tutto, inserire nel pannello Admin Secrets di MIO HUB:
- `PDND_CLIENT_ID`: (fornito dal portale)
- `PDND_PRIVATE_KEY`: (il contenuto di `private.pem`)
- `PDND_KID`: (il Key ID fornito dal portale dopo l'upload della chiave pubblica)

**Test Finale:**
- [ ] Il sistema Guardian mostrerà la card PDND come "Attiva" e verde.
- [ ] Le chiamate reali a SSU e ANPR inizieranno a funzionare.
