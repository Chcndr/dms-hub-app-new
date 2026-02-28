# Piano di Implementazione: Modulo Autorizzazioni

## 1. Analisi e Obiettivo

L'obiettivo è implementare la gestione delle **Autorizzazioni** per il commercio itinerante, replicando la logica e l'interfaccia delle **Concessioni**.
L'autorizzazione è il prerequisito per partecipare alla spunta e occupare posteggi liberi. Deve essere collegata a un'impresa.

## 2. Database Schema (Neon / PostgreSQL)

Creazione di una nuova tabella `autorizzazioni` simile a `concessioni`.

```sql
CREATE TABLE autorizzazioni (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES imprese(id),
    numero_autorizzazione VARCHAR(50) NOT NULL,
    ente_rilascio VARCHAR(100) NOT NULL, -- Es. Comune di X
    data_rilascio DATE NOT NULL,
    data_scadenza DATE, -- Può essere null se illimitata? Assumiamo di no per ora
    stato VARCHAR(20) DEFAULT 'ATTIVA', -- ATTIVA, SOSPESA, SCADUTA, REVOCATA
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indici per performance
CREATE INDEX idx_autorizzazioni_company_id ON autorizzazioni(company_id);
CREATE INDEX idx_autorizzazioni_numero ON autorizzazioni(numero_autorizzazione);
```

## 3. Backend (Node.js / Express / tRPC)

### 3.1 API Endpoints (o tRPC Router)

Necessario creare nuovi endpoint per CRUD Autorizzazioni.

- `GET /api/autorizzazioni`: Lista autorizzazioni (filtrabile per `company_id`)
- `POST /api/autorizzazioni`: Creazione nuova autorizzazione
- `PUT /api/autorizzazioni/:id`: Modifica autorizzazione esistente
- `DELETE /api/autorizzazioni/:id`: Eliminazione (o soft delete)

### 3.2 Aggiornamento Router Esistenti

Se si usa tRPC, aggiungere `autorizzazioniRouter` al root router.
Se si usa REST (come visto in `MarketCompaniesTab.tsx`), creare `server/routes/autorizzazioni.ts`.

## 4. Frontend (React)

### 4.1 Aggiornamento `MarketCompaniesTab.tsx`

Il componente attuale gestisce Imprese, Concessioni e Qualificazioni. Va esteso per includere Autorizzazioni.

**Modifiche UI:**

1.  **Pulsanti Filtro/Tab:** Aggiungere un pulsante "Autorizzazioni" accanto a "Imprese", "Concessioni", "Qualificazioni".
    - Attuale: `[Imprese] [Concessioni] [Qualificazioni]`
    - Nuovo: `[Imprese] [Concessioni] [Autorizzazioni] [Qualificazioni]`
2.  **Sezione Autorizzazioni:** Creare una sezione `<section>` dedicata, visibile quando `searchType === 'autorizzazione'`.
    - Tabella simile a Concessioni ma con colonne specifiche:
      - Numero Autorizzazione
      - Impresa
      - Ente Rilascio
      - Rilascio / Scadenza
      - Stato
      - Azioni (Edit/Delete)
3.  **Modale Autorizzazione:** Creare un form modale per Aggiungi/Modifica Autorizzazione.
    - Campi: Impresa (Select), Numero, Ente, Date, Stato, Note.

### 4.2 Types & State

Aggiornare le interfacce TypeScript in `MarketCompaniesTab.tsx`:

- Aggiungere `type AutorizzazioneRow`
- Aggiungere `type AutorizzazioneFormData`
- Aggiungere stato `const [autorizzazioni, setAutorizzazioni] = useState<AutorizzazioneRow[]>([])`
- Aggiungere stato modale `const [showAutorizzazioneModal, setShowAutorizzazioneModal] = useState(false)`

## 5. Integrazione Spunta (Future Step)

Come richiesto, questo è propedeutico al meccanismo di spunta. L'autorizzazione sarà il documento verificato per assegnare un posteggio libero.

## 6. Roadmap Esecutiva

1.  **Database:** Eseguire script SQL per creare tabella `autorizzazioni`.
2.  **Backend:** Implementare route API `/api/autorizzazioni`.
3.  **Frontend:**
    - Aggiornare `MarketCompaniesTab.tsx` con il nuovo tab e logica di fetch.
    - Implementare UI Tabella Autorizzazioni.
    - Implementare Modale Creazione/Modifica.
4.  **Test:** Verificare flusso completo (Creazione -> Visualizzazione -> Modifica).

---

**Attendo approvazione per procedere con lo Step 1 (Database).**
