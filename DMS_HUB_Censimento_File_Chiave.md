# 🧩 **Censimento File Chiave - DMS Hub Dashboard**

**Data**: 16 Novembre 2025

## 🎯 **Obiettivo**

Identificare i file chiave della dashboard `dms-hub-app-new` per l'integrazione del modulo MIO Agent.

## ✅ **Risultati Censimento**

### ⚙️ **Sezione 1: Layout e Struttura Visiva**

| File | Path Relativa | Funzione |
|---|---|---|
| `DashboardPA.tsx` | `client/src/pages/DashboardPA.tsx` | **Layout principale della Dashboard PA** e contenitore dei 23 tab principali. |
| `HomePage.tsx` | `client/src/pages/HomePage.tsx` | Pagina iniziale con 6 pulsanti principali, incluso il pulsante viola per accedere alla Dashboard PA. |

**Componente 21 Tasti:**
- I **23 tasti principali** sono implementati come `<button>` all'interno di `DashboardPA.tsx` (righe 604-860).
- I **12 pulsanti "Accesso Rapido"** sono anch'essi in `DashboardPA.tsx` (righe 526-569).

### ⚙️ **Sezione 2: Navigazione e Routing**

| File | Path Relativa | Funzione |
|---|---|---|
| `App.tsx` | `client/src/App.tsx` | **Router principale dell'applicazione**. Definisce le rotte con la libreria `wouter`. |

**Struttura Routing:**
- Il progetto **NON usa Next.js**, ma **Vite + React** con routing custom gestito da `wouter`.
- Le rotte sono definite nel componente `Router()` in `App.tsx` (righe 17-34).
- La rotta per la Dashboard PA è `/dashboard-pa`.

### 📦 **Sezione 3: Componente MIO**

| File | Path Relativa | Funzione |
|---|---|---|
| `MIOAgent.tsx` | `client/src/components/MIOAgent.tsx` | Componente React che mostra i log dell'agente MIO. |
| `mio.tsx` | `client/src/pages/mio.tsx` | Pagina di simulazione per la dashboard MIO (non usata nel flusso principale). |

## 🔧 **Come Integrare MIOAgent.tsx**

Per integrare il componente `MIOAgent.tsx`:

1. **Aggiungi una nuova rotta** in `App.tsx` per la pagina MIO:
   ```tsx
   // In App.tsx, dentro <Switch>
   <Route path="/mio" component={MioPage} />
   ```

2. **Crea la pagina `MioPage.tsx`** in `client/src/pages/` che importa e renderizza il componente `MIOAgent.tsx`:
   ```tsx
   // In client/src/pages/MioPage.tsx
   import MIOAgent from '@/components/MIOAgent';

   export default function MioPage() {
     return <MIOAgent />;
   }
   ```

3. **Collega un pulsante** nella `DashboardPA.tsx` alla nuova rotta `/mio`:
   - Puoi aggiungere un nuovo pulsante nei 12 "Accesso Rapido" o nei 23 tab.
   - Esempio: aggiungi un pulsante "MIO Agent" nei tab:
     ```tsx
     // In DashboardPA.tsx, dentro la griglia dei tab
     <button onClick={() => setActiveTab('mio')}>
       <Bot className="h-6 w-6" />
       <span>MIO Agent</span>
     </button>
     ```
   - E aggiungi il `TabsContent` corrispondente:
     ```tsx
     // In DashboardPA.tsx, dentro <Tabs>
     <TabsContent value="mio">
       <MIOAgent />
     </TabsContent>
     ```

Con questo censimento, avete tutte le informazioni per integrare il componente MIO Agent nella dashboard! 🚀
