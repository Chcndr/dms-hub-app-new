# 📋 LOG MODIFICHE SSO SUAP

**Data Inizio:** 2 Gennaio 2026  
**Autore:** Manus AI  
**Stato:** COMPLETATO v2

---

## 🎯 OBIETTIVO

Implementare dropdown dinamici nella sezione SSO SUAP connessi al database esistente, con auto-compilazione dati e campi motivazione SCIA.

---

## 📝 REGOLE DI SVILUPPO

1. ✅ **NON modificare nulla fuori dalla sezione SSO SUAP**
2. ✅ **Adattare SSO SUAP al sistema esistente** (non il contrario)
3. ✅ **Attrezzature** → Campo libero, compilazione manuale
4. ✅ **Canone** → Già calcolato in Wallet/PagoPA, usare dato esistente

---

## 📂 FILE MODIFICATI

| File                                             | Descrizione           | Stato         |
| ------------------------------------------------ | --------------------- | ------------- |
| `client/src/components/suap/SciaForm.tsx`        | Form SCIA Subingresso | ✅ Completato |
| `client/src/components/suap/ConcessioneForm.tsx` | Form Concessione      | ✅ Completato |

---

## 🔄 MODIFICHE EFFETTUATE v2

### 1. Campi Motivazione SCIA (Nuovi)

Aggiunta sezione "Tipo di Segnalazione" con RadioGroup:

- Subingresso
- Cessazione
- Sospensione
- Ripresa Attività
- Modifica Ragione Sociale
- Variazione

### 2. Tipologia Attività e Ruolo Dichiarante (Nuovi)

- **Settore Merceologico**: Alimentare / Non Alimentare / Misto
- **Ruolo Dichiarante**: Titolare / Legale Rappresentante / Curatore Fallimentare / Erede / Altro

### 3. Ricerca Subentrante Migliorata

La ricerca ora funziona per:

- **Codice Fiscale** (16 caratteri)
- **Partita IVA** (11 cifre)
- **Denominazione/Nome** (ricerca parziale)

### 4. Auto-compilazione Cedente da Posteggio

Quando si seleziona un posteggio occupato:

1. Carica automaticamente i dati dell'impresa associata (`impresa_id`)
2. Popola TUTTI i campi del Cedente:
   - CF/P.IVA
   - Ragione Sociale
   - Nome/Cognome
   - Data/Luogo Nascita
   - Residenza completa
   - PEC

### 5. Dati Cedente Completi (Nuovi campi)

Aggiunti campi mancanti per il Cedente:

- Nome, Cognome
- Data di Nascita, Luogo di Nascita
- Residenza Via, Comune, CAP
- PEC

### 6. Ubicazione e Giorno Mercato

Auto-popolati quando si seleziona il mercato:

- `ubicazione_mercato` → dal campo `municipality`
- `giorno_mercato` → dal campo `days`

---

## 📊 API UTILIZZATE

| Endpoint                  | Metodo | Descrizione                                       |
| ------------------------- | ------ | ------------------------------------------------- |
| `/api/markets`            | GET    | Lista mercati                                     |
| `/api/markets/:id/stalls` | GET    | Posteggi di un mercato (con impresa_id)           |
| `/api/imprese`            | GET    | Lista tutte le imprese (per ricerca locale)       |
| `/api/imprese/:id`        | GET    | Dettaglio impresa (per auto-compilazione cedente) |

---

## ✅ CHECKLIST

- [x] Dropdown mercati dinamico (SciaForm.tsx)
- [x] Dropdown posteggi filtrato per mercato (SciaForm.tsx)
- [x] Auto-popolamento MQ e dimensioni (SciaForm.tsx)
- [x] **Ricerca Subentrante per CF/P.IVA/Nome** (SciaForm.tsx)
- [x] **Auto-compilazione Cedente da posteggio** (SciaForm.tsx)
- [x] **Campi Motivazione SCIA** (SciaForm.tsx)
- [x] **Tipologia Attività e Ruolo Dichiarante** (SciaForm.tsx)
- [x] **Dati Cedente completi** (SciaForm.tsx)
- [x] Dropdown mercati dinamico (ConcessioneForm.tsx)
- [x] Dropdown posteggi filtrato per mercato (ConcessioneForm.tsx)
- [x] Auto-popolamento MQ e dimensioni (ConcessioneForm.tsx)
- [ ] Test funzionamento
- [ ] Commit e deploy

---

## 📝 NOTE

- Il campo "Attrezzature" è ora libero (input text) come richiesto
- Il canone NON viene calcolato qui - è già presente in Wallet/PagoPA
- I dati del rappresentante legale vengono popolati dalla tabella `imprese`
- La ricerca imprese avviene lato client per performance (tutte le imprese caricate all'avvio)
