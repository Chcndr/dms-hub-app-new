# API Reference for AI Agents

> Auto-generated: 17/12/2025, 22:24:24  
> Total Endpoints: 94

## Quick Reference

### Guardian (Monitoring)

```
GET  /api/trpc/guardian.logs        - Recupera log sistema
GET  /api/trpc/guardian.stats       - Statistiche complete
GET  /api/trpc/guardian.health      - Health check
POST /api/trpc/guardian.logApiCall  - Logga chiamata API
```

### DMS Hub (Core)

```
GET  /api/trpc/dmsHub.markets.list    - Lista mercati
POST /api/trpc/dmsHub.markets.create  - Crea mercato
GET  /api/trpc/dmsHub.vendors.list    - Lista venditori
POST /api/trpc/dmsHub.bookings.create - Crea prenotazione
```

### MI-HUB (Orchestration)

```
POST /api/mihub/orchestrator - Esegui orchestrazione multi-agent
GET  /api/mihub/tasks        - Lista task attivi
POST /api/mihub/brain/save   - Salva memoria agente
```

### Integrations

```
GET  /api/trpc/integrations.listApiKeys - Lista API keys
POST /api/trpc/integrations.createWebhook - Crea webhook
GET  /api/trpc/integrations.stats - Statistiche integrazioni
```

## Response Format

Tutti gli endpoint TRPC rispondono con:

```json
{
  "result": {
    "data": { /* payload */ }
  }
}
```

Gli endpoint REST rispondono con:

```json
{
  "success": true,
  "data": { /* payload */ }
}
```

## Error Handling

Codici di errore comuni:

- **401** - Non autenticato
- **403** - Non autorizzato (serve ruolo admin)
- **404** - Risorsa non trovata
- **500** - Errore server
- **502** - Bad Gateway (servizio esterno non disponibile)

---

**Tip:** Per la lista completa e aggiornata degli endpoint, consulta `MIO-hub/api/index.json`.
