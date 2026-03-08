# Punto di Ripristino Stabile: v9.8.0-stable (2026-03-08)

Questo documento descrive lo stato del sistema al momento della creazione del punto di ripristino `v9.8.0-stable`. Questo restore point rappresenta uno stato **stabile, funzionante e ottimizzato** dell'intero sistema MIO HUB.

**Autore:** Manus AI
**Data:** 2026-03-08

## 1. Stato Generale

Il sistema è stato completamente revisionato, i bug critici sono stati risolti e le performance sono state ottimizzate. Tutti i componenti principali (frontend, backend, database) sono allineati e funzionanti.

| Componente | Stato | Dettagli |
|---|---|---|
| **Frontend (Vercel)** | ✅ **Stabile** | `dms-hub-app-new.vercel.app` attivo e allineato con il repo GitHub. |
| **Backend (Hetzner)** | ✅ **Stabile** | `api.mio-hub.me` attivo e allineato con il repo GitHub. Autodeploy funzionante. |
| **Database (Neon)** | ✅ **Stabile** | 4 mercati, 820 stalls totali. Dati consistenti. |
| **Codice (GitHub)** | ✅ **Stabile** | Tag `v9.8.0-stable` creato su entrambi i repo. Branch obsoleti puliti. |

## 2. Snapshot dei Repository Git

Sono stati creati tag annotati su entrambi i repository per marcare questo punto di ripristino.

### 2.1. Backend (`mihub-backend-rest`)

- **Tag:** `v9.8.0-stable`
- **Commit:** `8220688`
- **Descrizione:**
  > PUNTO DI RIPRISTINO STABILE - 2026-03-08
  > - import-market ottimizzato (60x speedup, batch INSERT + CTE cascade)
  > - UPSERT market con market_id dal BUS
  > - FK cascade completa per DELETE stalls
  > - Indice unico su market_geometry.market_id
  > - Hub 109 orfano cancellato
  > - Branch obsoleti puliti
  > - 237 posteggi Mercato La Piazzola salvati (Market ID 14)
  > - Blueprint aggiornato a v9.8.0

### 2.2. Frontend (`dms-hub-app-new`)

- **Tag:** `v9.8.0-stable`
- **Commit:** `ad0859d`
- **Descrizione:**
  > PUNTO DI RIPRISTINO STABILE - 2026-03-08
  > - Blueprint MASTER aggiornato a v9.8.0
  > - BusHubEditor iframe cross-origin funzionante
  > - Dashboard con 4 mercati attivi
  > - Branch obsoleti puliti (16 branch rimossi)
  > - Vercel autodeploy attivo su master

## 3. Backup del Database (Neon)

È stato eseguito un backup completo del database `neondb`.

- **Directory:** `/home/ubuntu/backup-v9.8.0-stable/`
- **Contenuto:**

| File | Dimensione | Righe | Descrizione |
|---|---|---|---|
| `schema.sql` | 347 KB | 13,144 | Solo schema del database (tabelle, viste, indici, ecc.) |
| `data.sql` | 101 MB | 142,970 | Solo dati, senza schema. |
| `full_backup.sql` | 101 MB | 156,168 | Backup completo (schema + dati). |

**Nota:** Il ripristino da `data.sql` potrebbe richiedere la disattivazione temporanea dei trigger a causa di foreign key circolari tra `markets` e `hub_locations`. Si consiglia di usare `full_backup.sql` per un ripristino completo.

## 4. Stato dei Mercati Principali

| Market ID | Nome | Stalls | Stato |
|---|---|---|---|
| 14 | Mercato La Piazzola | 237 | ✅ **OK** (posteggi salvati e visibili) |
| 1 | Mercato Grosseto | 160 | ⚠️ **Attenzione** (manca geometria) |
| 5 | Mercato Novi Sad Modena | 382 | ✅ **OK** |
| 12 | Cervia Demo | 41 | ✅ **OK** |

## 5. Procedura di Ripristino

Per ripristinare il sistema a questo stato:

1. **Repository Git:**
   - `git checkout v9.8.0-stable` su entrambi i repository (`mihub-backend-rest` e `dms-hub-app-new`).
   - Forzare il push sul branch `master` per allineare i deploy automatici.

2. **Database Neon:**
   - Usare il file `full_backup.sql` per ripristinare il database:
     ```bash
     psql -h <NEON_HOST> -p 5432 -U <USER> -d <DB_NAME> -f full_backup.sql
     ```

Questo garantirà un ritorno completo allo stato stabile e funzionante del 2026-03-08.
