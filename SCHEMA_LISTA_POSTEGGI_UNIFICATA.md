# 📋 SCHEMA LISTA POSTEGGI UNIFICATA

> **Data:** 18 Gennaio 2026  
> **Obiettivo:** Integrare le colonne orari/presenze nella Lista Posteggi senza toccare il sistema di spunta esistente  
> **Stato:** ANALISI IN CORSO

---

## 🔴 COMPONENTI DA NON TOCCARE (ZONA ROSSA)

| File | Motivo |
|------|--------|
| `MarketMapComponent.tsx` | Sistema mappa stabile con marker rossi M |
| `useMapAnimation.ts` | Hook animazioni flyTo funzionante |
| Logica `handlePreparaSpunta` in GestioneMercati | Animazione batch spunta funzionante |
| Logica `viewMode` / `viewTrigger` | Vista Italia/Mercato funzionante |
| Pulsanti Occupa/Libera/Spunta | Sistema cambio stato funzionante |

---

## 📊 STRUTTURA ATTUALE

### Lista Posteggi (GestioneMercati.tsx - righe 2121-2253)

**Layout:** Grid 2 colonne (Lista sinistra + Scheda Impresa destra)

**Colonne attuali:**
| Colonna | Larghezza | Contenuto |
|---------|-----------|-----------|
| N° | auto | Numero posteggio |
| Tipo | 80px | Badge viola (fisso/spunta/libero) |
| Stato | 100px | Badge colorato (LIBERO/OCCUPATO/IN ASSEGNAZIONE) |
| Intestatario | 120px | Nome impresa troncato |
| Azioni | auto | Pulsante Edit |

**Componente:** Tabella HTML con `<Table>` di shadcn/ui

---

### Presenze e Graduatoria (PresenzeGraduatoriaPanel.tsx - righe 585-695)

**Layout:** Pannello separato sotto la mappa

**Tab:** Concessionari | Spuntisti | Fiere/Straordinari

**Colonne tab Concessionari:**
| Colonna | Contenuto |
|---------|-----------|
| N° | Numero posteggio (cyan) |
| Stato | Badge stato (OCCUP./ASSEGN./LIBERO) |
| Impresa | Nome (bianco o giallo se spuntista) |
| Giorno | Data presenza (weekday + dd/mm) |
| Accesso | Orario checkin (verde) |
| Rifiuti | Orario deposito (arancione) |
| Uscita | Orario checkout (blu) |
| Presenze | Contatore cliccabile → storico |
| Assenze | Contatore assenze |

**Dati:** Provengono da `graduatoria[]` e `presenze[]` fetchati via API

---

## 🎯 NUOVA STRUTTURA PROPOSTA

### Layout Finale

```
┌─────────────────────────────────────────────────────────────────┐
│ [Concessionari] [Spunta] [Fiere/Straordinari]  ← TAB FILTRO     │
├─────────────────────────────────────────────────────────────────┤
│ N° │ Stato │ Impresa │ Giorno │ Accesso │ Rifiuti │ Uscita │ Pres │ Ass │ ⚙️ │
├────┼───────┼─────────┼────────┼─────────┼─────────┼────────┼──────┼─────┼────┤
│ 1  │ OCCUP │ Frutta..│ Gio 17 │ 07:30   │ 12:00   │ 14:00  │ 127  │ 0   │ ✏️ │
│ 2  │ ASSEGN│ Impresa.│ Gio 17 │ 08:00   │ -       │ -      │ 1    │ 0   │ ✏️ │
│ ...│ ...   │ ...     │ ...    │ ...     │ ...     │ ...    │ ...  │ ... │ ...│
└────┴───────┴─────────┴────────┴─────────┴─────────┴────────┴──────┴─────┴────┘
│                                                                               │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ SCHEDA IMPRESA (appare sotto quando clicchi una riga)                   │ │
│ │ Posteggio #1 - Frutta e Verdura Rossi                                   │ │
│ │ Referente: Mario Rossi | Tel: 333... | Email: ...                       │ │
│ │ [Apri Dettaglio Completo]                                               │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Modifiche Specifiche

#### 1. Rimuovere colonna "Tipo" (badge viola)
- **Motivo:** Non serve, lo stato è già indicato dal colore del nome impresa
- **Riga codice:** ~2156-2175 in GestioneMercati.tsx
- **Azione:** Eliminare `<TableCell>` con badge viola

#### 2. Aggiungere colonne orari
- **Nuove colonne:** Giorno, Accesso, Rifiuti, Uscita, Presenze, Assenze
- **Dati:** Fetch da API `/api/graduatoria/mercato/{id}` e `/api/presenze/mercato/{id}`
- **Azione:** Aggiungere fetch e state in PosteggiTab

#### 3. Aggiungere tab filtro in cima
- **Tab:** Concessionari | Spunta | Fiere/Straordinari
- **Logica filtro:** 
  - Concessionari: `stall.type === 'fisso'`
  - Spunta: `stall.type === 'spunta'`
  - Fiere/Straordinari: `stall.type === 'straordinario'`

#### 4. Eliminare pannello destro (Scheda Impresa)
- **Riga codice:** ~2255-2400 in GestioneMercati.tsx
- **Azione:** Cambiare layout da `grid-cols-2` a `grid-cols-1`
- **Nuova posizione:** Scheda impresa appare SOTTO la lista quando clicchi

#### 5. Allargare lista a tutta larghezza
- **Riga codice:** ~2122 `grid grid-cols-1 lg:grid-cols-2`
- **Azione:** Cambiare in `grid-cols-1` (sempre una colonna)

---

## 🔗 COLLEGAMENTI ESISTENTI DA PRESERVARE

### Wallet Integration
```typescript
// In PresenzeGraduatoriaPanel.tsx
interface GraduatoriaRecord {
  wallet_id: number;
  wallet_balance: number;
  wallet_type: string;
  // ...
}
```

### API Endpoints Utilizzati
| Endpoint | Uso |
|----------|-----|
| `/api/graduatoria/mercato/{id}` | Dati graduatoria e presenze totali |
| `/api/presenze/mercato/{id}` | Presenze giornaliere con orari |
| `/api/presenze/registra` | Registrazione nuova presenza |
| `/api/test-mercato/stato/{id}` | Stato contatori mercato |

### Callback da Preservare
- `onRefreshStalls` → Aggiorna lista posteggi
- `refreshTrigger` → Trigger sincronizzazione real-time
- `handleRowClick(stall)` → Selezione posteggio
- `handleEdit(stall)` → Modifica inline

---

## 📝 PIANO DI IMPLEMENTAZIONE CHIRURGICO

### Fase 1: Preparazione (NON MODIFICA CODICE)
- [x] Analisi struttura attuale
- [x] Mappatura componenti
- [x] Identificazione zone rosse
- [ ] Approvazione utente

### Fase 2: Fetch Dati Presenze (AGGIUNTA)
- [ ] Aggiungere state `presenze` e `graduatoria` in PosteggiTab
- [ ] Aggiungere fetch API presenze
- [ ] Collegare a `refreshTrigger` esistente

### Fase 3: Modifica Layout Lista (MODIFICA MIRATA)
- [ ] Rimuovere colonna "Tipo" (badge viola)
- [ ] Aggiungere colonne orari
- [ ] Cambiare grid da 2 a 1 colonna
- [ ] Spostare scheda impresa sotto

### Fase 4: Aggiungere Tab Filtro (AGGIUNTA)
- [ ] Aggiungere state `listFilter`
- [ ] Aggiungere TabsList sopra la tabella
- [ ] Implementare logica filtro

### Fase 5: Test e Verifica
- [ ] Verificare Vista Italia funziona
- [ ] Verificare Prepara Spunta funziona
- [ ] Verificare popup azioni funzionano
- [ ] Verificare sincronizzazione real-time

---

## ⚠️ RISCHI E MITIGAZIONI

| Rischio | Mitigazione |
|---------|-------------|
| Rompere sistema spunta | Non toccare handlePreparaSpunta, viewMode, viewTrigger |
| Perdere collegamenti wallet | Copiare esattamente la logica da PresenzeGraduatoriaPanel |
| Performance con molti posteggi | Mantenere virtualizzazione/scroll esistente |
| Conflitti di stato | Usare state separati per nuove funzionalità |

---

## 📁 FILE DA MODIFICARE

| File | Tipo Modifica | Righe Interessate |
|------|---------------|-------------------|
| `GestioneMercati.tsx` | MODIFICA | 2121-2400 (Lista + Scheda) |
| `PresenzeGraduatoriaPanel.tsx` | NESSUNA | Solo riferimento per copiare logica |
| `MarketMapComponent.tsx` | NESSUNA | ZONA ROSSA |

---

**NOTA:** Questo schema deve essere approvato prima di procedere con le modifiche.
