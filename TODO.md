# TODO List - DMS HUB App

## 🔴 Priorità Alta

### Frontend - Gestione HUB
- [ ] **Riscrivere completamente `GestioneHubNegozi.tsx`**
  - Integrare perfettamente con le nuove API HUB (tRPC)
  - Rimuovere tutti i mock data
  - Implementare CRUD completo per HUB Locations, Shops, Services
  - Aggiungere form di creazione/modifica
  - Migliorare UX e gestione errori
  - File: `client/src/components/GestioneHubNegozi.tsx`
  - Riferimento: API già implementate in `server/dmsHubRouter.ts` (righe 1075-1240)

### Centro Mobilità
- [ ] **Implementare architettura scalabile Centro Mobilità**
  - Aggiungere campo `mobilityProvider` alla tabella `markets`
  - Creare tabella `mobility_providers` con configurazioni
  - Implementare API dinamica per provider
  - Sistema di fallback al Centro Mobilità Nazionale
  - Job di sincronizzazione dati mobility
  - Riferimento: `ARCHITETTURA_CENTRO_MOBILITA_SCALABILE.md`

## 🟠 Priorità Media

### Pagina Integrazioni
- [ ] **Completare Tab 3, 4, 5 con sezioni "Previsti"**
  - Tab 3 (API Keys): Aggiungere sezione chiavi previste
  - Tab 4 (Webhook): Aggiungere webhook configurabili
  - Tab 5 (Sync Status): Aggiungere job di sincronizzazione previsti
  - File: `client/src/components/Integrazioni.tsx`

### Log & Debug
- [ ] **Implementare backend per Log & Debug**
  - Creare endpoint per API Logs
  - Creare endpoint per Integration Logs
  - Creare endpoint per System Status
  - Popolare dati reali invece di mock
  - File: `client/src/components/LogDebug.tsx`

## 🟢 Priorità Bassa

### Documentazione
- [ ] **Aggiornare README principale**
  - Aggiungere sezione HUB
  - Aggiungere sezione Centro Mobilità
  - Aggiornare architettura con nuove tabelle

### Testing
- [ ] **Creare test per API HUB**
  - Test CRUD locations
  - Test CRUD shops
  - Test CRUD services

## ✅ Completato

- [x] Standardizzazione mappe (6 mappe sostituite con MarketMapComponent)
- [x] Fix problema Vercel (zoom e centro mappa)
- [x] Creazione tabelle HUB (hub_locations, hub_shops, hub_services)
- [x] Implementazione API HUB (list, getById, create)
- [x] Aggiornamento blueprint con sezione Implementazione Grosseto
- [x] Pagina Integrazioni - Tab 1 e 2 riscritti con dati reali
- [x] Pagina Log & Debug creata (frontend con mock data)
- [x] Documentazione MobilityMap
- [x] Disabilitazione scroll zoom su tutte le mappe

---

**Ultimo aggiornamento:** 22 Novembre 2024
