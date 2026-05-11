# Guida Operativa: Accreditamento PDND e Go-Live SSU

Questo documento descrive la procedura completa per attivare le integrazioni con le Piattaforme Nazionali (PDND, SSU, App IO, ANPR) all'interno di MIO HUB.

La procedura è divisa in tre fasi principali:
1. **Adesione a PDND Interop** (burocratica)
2. **Accreditamento al Catalogo SSU** (tecnica/burocratica)
3. **Configurazione e Go-Live su MIO HUB** (tecnica)

---

## 1. Adesione a PDND Interop

La Piattaforma Digitale Nazionale Dati (PDND) è il prerequisito fondamentale per accedere a tutti i servizi nazionali (ANPR, Registro Imprese, INPS, SSU).

### 1.1. Prerequisiti
- L'Ente deve essere registrato sull'Indice delle Pubbliche Amministrazioni (IPA).
- Il Legale Rappresentante deve disporre di SPID/CIE e Firma Digitale (formato CAdES).
- La PEC dell'Ente registrata su IPA deve essere attiva e presidiata.

### 1.2. Procedura di Adesione
1. Accedere al portale **Self Care PagoPA** (https://selfcare.pagopa.it/) tramite SPID/CIE.
2. Selezionare l'Ente dal catalogo IPA.
3. Compilare i dati richiesti, indicando il Legale Rappresentante e i Referenti (Amministrativo e Tecnico).
4. Scaricare l'**Accordo di Adesione** generato dal sistema.
5. Far firmare digitalmente (CAdES) l'accordo al Legale Rappresentante (senza apportare modifiche al file).
6. Caricare l'accordo firmato tramite il link ricevuto sulla PEC istituzionale dell'Ente.

### 1.3. Configurazione Sicurezza (Keypair RSA)
Una volta completata l'adesione, il Referente Tecnico deve:
1. Accedere all'area riservata PDND.
2. Creare un nuovo **Client e-Service**.
3. Generare una coppia di chiavi RSA (pubblica/privata).
4. Caricare la **chiave pubblica** sulla piattaforma PDND per ottenere il `key_id`.
5. Conservare in modo sicuro la **chiave privata**, che andrà inserita nelle variabili d'ambiente di MIO HUB.

---

## 2. Accreditamento al Catalogo SSU

Per poter inviare pratiche SUAP al Back Office del Comune, MIO HUB deve essere accreditato come **Componente Informatica di Front Office SUAP** presso il Catalogo Nazionale SSU gestito da InfoCamere.

### 2.1. Accreditamento in Ambiente di Collaudo
1. Accedere al **Sistema di Accreditamento di Collaudo** (https://foac.cl.infocamere.it/home).
2. Selezionare "Accreditamento Componenti Informatiche" > "Nuovo accreditamento".
3. Compilare i dati indicando:
   - Tipo componente: `Componente Informatica Front Office SUAP`
   - Endpoint: `https://api.mio-hub.me/api/ssu`
   - E-service ID: gli ID degli e-service pubblicati sulla PDND di collaudo.
4. Scaricare la pratica PDF, farla firmare digitalmente (CAdES) dal Legale Rappresentante e ricaricarla a sistema.
5. Aprire un ticket sul portale di Supporto Informativo PA (https://supporto.infocamere.it/) richiedendo la gestione istruttoria della pratica.

### 2.2. Associazione del SUAP alla Componente
Una volta che la componente MIO HUB è accreditata:
1. Dal portale di collaudo, selezionare "Accreditamento SUAP" > "Modifica Dati SUAP".
2. Ricercare il proprio SUAP (tramite ID, Regione, Provincia o Comune).
3. Compilare i recapiti (PEC, Sito Web, Codice AOO).
4. Nella sezione "Componenti Informatiche", dichiarare MIO HUB come Front Office SUAP.
5. Indicare i dati del Responsabile SUAP.
6. Firmare digitalmente la pratica generata e inviarla.
7. Aprire un nuovo ticket di supporto per richiedere l'approvazione dell'associazione.

*Nota: La stessa procedura andrà ripetuta in ambiente di Produzione (impresainungiorno.gov.it) una volta superati i test in collaudo.*

---

## 3. Configurazione e Go-Live su MIO HUB

Una volta ottenuti gli accreditamenti e i parametri tecnici, è possibile attivare le integrazioni direttamente dalla Dashboard di MIO HUB.

### 3.1. Inserimento Variabili d'Ambiente
L'amministratore di sistema deve configurare le seguenti variabili d'ambiente sul server backend (Hetzner):

**Per PDND:**
```env
PDND_CLIENT_ID="<client_id_fornito_da_pdnd>"
PDND_KEY_ID="<key_id_della_chiave_pubblica>"
PDND_PRIVATE_KEY="<contenuto_chiave_privata_rsa_in_base64>"
PDND_ENVIRONMENT="produzione" # o "collaudo"
```

**Per SSU:**
```env
SSU_BACK_OFFICE_URL="<url_del_back_office_del_comune>"
SSU_CUI_CONTEXT="SUAP_MIOHUB"
```

### 3.2. Attivazione dalla Dashboard
1. Accedere a MIO HUB con ruolo `admin`.
2. Navigare nel tab **Piattaforme PA**.
3. Verificare nel pannello **PDND** che lo stato connessione sia "Live" e che il test di connessione restituisca esito positivo.
4. Verificare nel pannello **SSU** che lo stato sia "Connesso" e che il Back Office URL sia correttamente rilevato.
5. Da questo momento, ogni pratica SUAP completata e firmata sul Front Office verrà automaticamente inoltrata al Back Office del Comune tramite le API SSU.

### 3.3. Monitoraggio e Audit
Tutte le operazioni effettuate verso PDND e SSU sono tracciate e visibili:
- Nel tab **Piattaforme PA > Audit Trail**.
- Nel tab **Integrazioni > API Dashboard**, dove è possibile monitorare il traffico e il tasso di successo degli endpoint tramite il sistema Guardian.

---

## Vincoli e Attenzioni (Cosa NON fare)
- **NON** modificare manualmente il file PDF dell'Accordo di Adesione prima di firmarlo, altrimenti verrà scartato dal sistema.
- **NON** condividere la chiave privata RSA via email o chat. Deve essere inserita direttamente nelle variabili d'ambiente del server.
- **NON** attivare l'ambiente di produzione SSU prima di aver completato con successo almeno un ciclo di test (invio istanza, ricezione notifica, download documento) in ambiente di collaudo.
- **NON** disabilitare il sistema di ruoli e impersonalizzazione: gli endpoint SSU e PDND devono rimanere accessibili solo agli utenti con ruolo `admin` o `pa`.
