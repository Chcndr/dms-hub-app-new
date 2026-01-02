# 📋 LOG MODIFICHE SSO SUAP

**Data Inizio:** 2 Gennaio 2026  
**Autore:** Manus AI  
**Stato:** IN CORSO

---

## 🎯 OBIETTIVO

Implementare dropdown dinamici nella sezione SSO SUAP connessi al database esistente.

---

## 📝 REGOLE DI SVILUPPO

1. ✅ **NON modificare nulla fuori dalla sezione SSO SUAP**
2. ✅ **Adattare SSO SUAP al sistema esistente** (non il contrario)
3. ✅ **Attrezzature** → Campo libero, compilazione manuale
4. ✅ **Canone** → Già calcolato in Wallet/PagoPA, usare dato esistente

---

## 📂 FILE DA MODIFICARE

| File | Descrizione | Stato |
|------|-------------|-------|
| `client/src/components/suap/SciaForm.tsx` | Form SCIA Subingresso | 🔧 In corso |
| `client/src/pages/suap/SuapDashboard.tsx` | Dashboard SUAP | ⏳ Da verificare |

---

## 🔄 MODIFICHE EFFETTUATE

### 1. SciaForm.tsx - Dropdown Mercati Dinamico

**PRIMA:**
```tsx
const MOCK_MERCATI = {
  'modena': {
    nome: 'Mercato Novi Sad',
    comune: 'Modena',
    posteggi: ['A01', 'A02', 'B01', 'B05', '1/16']
  }
};

<Select onValueChange={(val) => setFormData({...formData, mercato: val})}>
  <SelectContent>
    <SelectItem value="modena">Modena - Novi Sad</SelectItem>
    <SelectItem value="altro">Altro</SelectItem>
  </SelectContent>
</Select>
```

**DOPO:**
```tsx
// Stato per mercati e posteggi dal database
const [markets, setMarkets] = useState<Market[]>([]);
const [stalls, setStalls] = useState<Stall[]>([]);
const [selectedMarketId, setSelectedMarketId] = useState<number | null>(null);

// Carica mercati all'avvio
useEffect(() => {
  fetch(`${API_URL}/api/markets`)
    .then(res => res.json())
    .then(data => {
      if (data.success) setMarkets(data.data);
    });
}, []);

// Carica posteggi quando cambia mercato
useEffect(() => {
  if (selectedMarketId) {
    fetch(`${API_URL}/api/markets/${selectedMarketId}/stalls`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setStalls(data.data);
      });
  }
}, [selectedMarketId]);

<Select onValueChange={(val) => {
  const market = markets.find(m => m.id === parseInt(val));
  setSelectedMarketId(parseInt(val));
  setFormData({...formData, mercato: market?.name || ''});
}}>
  <SelectContent>
    {markets.map(m => (
      <SelectItem key={m.id} value={m.id.toString()}>{m.name}</SelectItem>
    ))}
  </SelectContent>
</Select>
```

---

### 2. SciaForm.tsx - Dropdown Posteggi Filtrato

**PRIMA:**
```tsx
<Select onValueChange={(val) => setFormData({...formData, posteggio: val})}>
  <SelectContent>
    {MOCK_MERCATI.modena.posteggi.map(p => (
      <SelectItem key={p} value={p}>{p}</SelectItem>
    ))}
  </SelectContent>
</Select>
```

**DOPO:**
```tsx
<Select onValueChange={(val) => {
  const stall = stalls.find(s => s.id === parseInt(val));
  setFormData({
    ...formData, 
    posteggio: stall?.number || '',
    dimensioni_mq: stall?.area_mq || '',
    dimensioni_lineari: stall?.dimensions || ''
  });
}}>
  <SelectContent>
    {stalls.map(s => (
      <SelectItem key={s.id} value={s.id.toString()}>
        {s.number} - {s.area_mq} mq
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

---

### 3. Auto-popolamento Dimensioni

Quando l'utente seleziona un posteggio, i campi MQ e Dimensioni vengono popolati automaticamente dai dati del database.

---

## 📊 API UTILIZZATE

| Endpoint | Metodo | Descrizione |
|----------|--------|-------------|
| `/api/markets` | GET | Lista mercati |
| `/api/markets/:id/stalls` | GET | Posteggi di un mercato |
| `/api/imprese?codice_fiscale=XXX` | GET | Ricerca impresa |

---

## ✅ CHECKLIST

- [x] Dropdown mercati dinamico (SciaForm.tsx)
- [x] Dropdown posteggi filtrato per mercato (SciaForm.tsx)
- [x] Auto-popolamento MQ e dimensioni (SciaForm.tsx)
- [x] Dropdown mercati dinamico (ConcessioneForm.tsx)
- [x] Dropdown posteggi filtrato per mercato (ConcessioneForm.tsx)
- [x] Auto-popolamento MQ e dimensioni (ConcessioneForm.tsx)
- [ ] Test funzionamento
- [ ] Commit e deploy

---

## 📝 NOTE

- Il campo "Attrezzature" rimane come dropdown statico (banco/automezzo/banco_automezzo)
- Il canone NON viene calcolato qui - è già presente in Wallet/PagoPA
- I dati del rappresentante legale vengono popolati dalla tabella `imprese`
