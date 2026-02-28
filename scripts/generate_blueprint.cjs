#!/usr/bin/env node
/**
 * 📘 AUTO-BLUEPRINT GENERATOR
 *
 * Questo script genera automaticamente la documentazione completa del sistema:
 * - BLUEPRINT.md (root): Panoramica architettura, DB schema, endpoint, struttura
 * - .mio-agents/: Libreria di conoscenza per gli agenti AI
 *
 * Esegui: node scripts/generate_blueprint.cjs
 */

const fs = require("fs");
const path = require("path");

// Paths
const ROOT_DIR = path.resolve(__dirname, "..");
const SCHEMA_PATH = path.join(ROOT_DIR, "drizzle", "schema.ts");
const INDEX_JSON_PATH = path.join(
  ROOT_DIR,
  "..",
  "MIO-hub",
  "api",
  "index.json"
);
const BLUEPRINT_PATH = path.join(ROOT_DIR, "BLUEPRINT.md");
const AGENTS_DIR = path.join(ROOT_DIR, ".mio-agents");

console.log("🚀 Starting Auto-Blueprint Generation...\n");

// ============================================================================
// 1. SCAN DATABASE SCHEMA
// ============================================================================

function scanDatabaseSchema() {
  console.log("📊 Scanning database schema...");

  if (!fs.existsSync(SCHEMA_PATH)) {
    console.warn("⚠️  Schema file not found:", SCHEMA_PATH);
    return { tables: [], relationships: [] };
  }

  const schemaContent = fs.readFileSync(SCHEMA_PATH, "utf-8");
  const tables = [];

  // Extract table definitions (basic regex parsing)
  const tableMatches = schemaContent.matchAll(
    /export const (\w+) = (?:mysql|pg)Table\(['"](\w+)['"]/g
  );

  for (const match of tableMatches) {
    const [, varName, tableName] = match;
    tables.push({ varName, tableName });
  }

  console.log(`   Found ${tables.length} tables`);
  return { tables, relationships: [] };
}

// ============================================================================
// 2. LOAD ENDPOINTS FROM INDEX.JSON
// ============================================================================

function loadEndpoints() {
  console.log("🔌 Loading endpoints from index.json...");

  if (!fs.existsSync(INDEX_JSON_PATH)) {
    console.warn("⚠️  index.json not found:", INDEX_JSON_PATH);
    return { services: [], totalEndpoints: 0 };
  }

  const indexData = JSON.parse(fs.readFileSync(INDEX_JSON_PATH, "utf-8"));
  const totalEndpoints = indexData.services.reduce(
    (sum, service) => sum + service.endpoints.length,
    0
  );

  console.log(
    `   Found ${totalEndpoints} endpoints across ${indexData.services.length} services`
  );
  return { services: indexData.services, totalEndpoints };
}

// ============================================================================
// 3. SCAN PROJECT STRUCTURE
// ============================================================================

function scanProjectStructure() {
  console.log("📁 Scanning project structure...");

  const structure = {
    server: scanDirectory(path.join(ROOT_DIR, "server"), 2),
    client: scanDirectory(path.join(ROOT_DIR, "client/src"), 2),
    scripts: fs
      .readdirSync(path.join(ROOT_DIR, "scripts"))
      .filter(f => f.endsWith(".js") || f.endsWith(".cjs")),
  };

  console.log(`   Scanned server/ and client/ directories`);
  return structure;
}

function scanDirectory(dir, maxDepth, currentDepth = 0) {
  if (!fs.existsSync(dir) || currentDepth >= maxDepth) return [];

  const items = fs.readdirSync(dir, { withFileTypes: true });
  const result = [];

  for (const item of items) {
    if (item.name.startsWith(".") || item.name === "node_modules") continue;

    if (item.isDirectory()) {
      result.push({
        name: item.name,
        type: "dir",
        children: scanDirectory(
          path.join(dir, item.name),
          maxDepth,
          currentDepth + 1
        ),
      });
    } else if (item.name.endsWith(".ts") || item.name.endsWith(".tsx")) {
      result.push({ name: item.name, type: "file" });
    }
  }

  return result;
}

// ============================================================================
// 4. GENERATE BLUEPRINT.md
// ============================================================================

function generateBlueprint(dbSchema, endpoints, structure) {
  console.log("\n📘 Generating BLUEPRINT.md...");

  const now = new Date().toLocaleString("it-IT", {
    dateStyle: "long",
    timeStyle: "short",
  });

  let content = `# 📘 DMS Hub System Blueprint

> **Auto-generated:** ${now}  
> **Generator:** \`scripts/generate_blueprint.cjs\`

---

## 🎯 System Overview

**DMS Hub** è il sistema centrale per la gestione della Rete Mercati Made in Italy, con:

- **${endpoints.totalEndpoints} endpoint API** (TRPC + REST)
- **${dbSchema.tables.length} tabelle database**
- **Full Observability** con Guardian monitoring
- **Multi-agent orchestration** (MIO, Guardian, Zapier, ecc.)

---

## 🗄️ Database Schema

### Tables (${dbSchema.tables.length})

| Variable Name | Table Name |
|---------------|------------|
`;

  for (const table of dbSchema.tables) {
    content += `| \`${table.varName}\` | \`${table.tableName}\` |\n`;
  }

  content += `\n---

## 🔌 API Endpoints

### Services (${endpoints.services.length})

`;

  for (const service of endpoints.services) {
    content += `### ${service.name}\n\n`;
    content += `**Base URL:** \`${service.baseUrl}\`  \n`;
    content += `**Endpoints:** ${service.endpoints.length}\n\n`;

    // Group by method
    const byMethod = service.endpoints.reduce((acc, ep) => {
      acc[ep.method] = (acc[ep.method] || 0) + 1;
      return acc;
    }, {});

    content += `**Breakdown:** `;
    content += Object.entries(byMethod)
      .map(([method, count]) => `${method}: ${count}`)
      .join(", ");
    content += `\n\n`;
  }

  content += `---

## 📁 Project Structure

### Server

\`\`\`
server/
`;

  content += renderStructure(structure.server, 1);

  content += `\`\`\`

### Client

\`\`\`
client/src/
`;

  content += renderStructure(structure.client, 1);

  content += `\`\`\`

### Scripts

`;

  for (const script of structure.scripts) {
    content += `- \`${script}\`\n`;
  }

  content += `\n---

## 🤖 Agent Library

La cartella \`.mio-agents/\` contiene la conoscenza condivisa per gli agenti AI:

- **system_prompts.md** - Prompt e personalità degli agenti
- **tools_definition.json** - Tool disponibili per gli agenti
- **api_reference_for_agents.md** - Riferimento API semplificato

---

## 🔄 Aggiornamento

Per aggiornare questo blueprint e la documentazione:

\`\`\`bash
npm run docs:update
\`\`\`

Questo comando esegue:
1. \`sync_api_docs.cjs\` - Aggiorna \`index.json\` con endpoint reali
2. \`generate_blueprint.cjs\` - Rigenera questo file e \`.mio-agents/\`

---

**Generated by Manus AI** 🤖
`;

  fs.writeFileSync(BLUEPRINT_PATH, content, "utf-8");
  console.log(`   ✅ BLUEPRINT.md saved to ${BLUEPRINT_PATH}`);
}

function renderStructure(items, indent) {
  let result = "";
  for (const item of items) {
    result +=
      "  ".repeat(indent) +
      (item.type === "dir" ? "📁 " : "📄 ") +
      item.name +
      "\n";
    if (item.children && item.children.length > 0) {
      result += renderStructure(item.children, indent + 1);
    }
  }
  return result;
}

// ============================================================================
// 5. GENERATE .mio-agents/ LIBRARY
// ============================================================================

function generateAgentLibrary(endpoints) {
  console.log("\n🤖 Generating .mio-agents/ library...");

  if (!fs.existsSync(AGENTS_DIR)) {
    fs.mkdirSync(AGENTS_DIR, { recursive: true });
  }

  // 5.1 system_prompts.md
  const promptsContent = `# System Prompts - DMS Hub Agents

> Auto-generated: ${new Date().toLocaleString("it-IT")}

## MIO Agent

**Ruolo:** Orchestratore principale, gestisce task complessi e coordina altri agenti.

**Personalità:** Proattivo, preciso, orientato ai risultati.

**Capabilities:**
- Task management e orchestrazione
- Analisi dati e reporting
- Coordinamento multi-agent

---

## Guardian Agent

**Ruolo:** Monitoraggio sistema, logging, health check.

**Personalità:** Vigile, affidabile, sempre attivo.

**Capabilities:**
- Full observability (TRPC + REST)
- Error tracking e alerting
- System health monitoring

---

## Zapier Agent

**Ruolo:** Automazione workflow esterni, integrazioni.

**Personalità:** Efficiente, reattivo, orientato all'automazione.

**Capabilities:**
- Webhook handling
- External API integration
- Event-driven automation

---

## Abacus Agent

**Ruolo:** Analisi finanziaria, calcoli, reportistica.

**Personalità:** Preciso, analitico, orientato ai numeri.

**Capabilities:**
- Financial calculations
- Data analysis
- Report generation
`;

  fs.writeFileSync(
    path.join(AGENTS_DIR, "system_prompts.md"),
    promptsContent,
    "utf-8"
  );
  console.log("   ✅ system_prompts.md created");

  // 5.2 tools_definition.json
  const toolsContent = {
    version: "1.0.0",
    lastUpdated: new Date().toISOString(),
    tools: [
      {
        name: "guardian.logs",
        description: "Recupera log centralizzati del sistema",
        endpoint: "/api/trpc/guardian.logs",
        method: "GET",
        params: { limit: "number", level: "string (info|error|warn)" },
      },
      {
        name: "guardian.stats",
        description: "Statistiche complete del sistema",
        endpoint: "/api/trpc/guardian.stats",
        method: "GET",
      },
      {
        name: "dmsHub.markets.list",
        description: "Lista tutti i mercati",
        endpoint: "/api/trpc/dmsHub.markets.list",
        method: "GET",
      },
      {
        name: "dmsHub.markets.create",
        description: "Crea nuovo mercato",
        endpoint: "/api/trpc/dmsHub.markets.create",
        method: "POST",
        params: { name: "string", location: "string", category: "string" },
      },
      {
        name: "mihub.orchestrator.run",
        description: "Esegue orchestrazione multi-agent",
        endpoint: "/api/mihub/orchestrator",
        method: "POST",
        params: { agent: "string", mode: "auto|manual", task: "string" },
      },
    ],
  };

  fs.writeFileSync(
    path.join(AGENTS_DIR, "tools_definition.json"),
    JSON.stringify(toolsContent, null, 2),
    "utf-8"
  );
  console.log("   ✅ tools_definition.json created");

  // 5.3 api_reference_for_agents.md
  const apiRefContent = `# API Reference for AI Agents

> Auto-generated: ${new Date().toLocaleString("it-IT")}  
> Total Endpoints: ${endpoints.totalEndpoints}

## Quick Reference

### Guardian (Monitoring)

\`\`\`
GET  /api/trpc/guardian.logs        - Recupera log sistema
GET  /api/trpc/guardian.stats       - Statistiche complete
GET  /api/trpc/guardian.health      - Health check
POST /api/trpc/guardian.logApiCall  - Logga chiamata API
\`\`\`

### DMS Hub (Core)

\`\`\`
GET  /api/trpc/dmsHub.markets.list    - Lista mercati
POST /api/trpc/dmsHub.markets.create  - Crea mercato
GET  /api/trpc/dmsHub.vendors.list    - Lista venditori
POST /api/trpc/dmsHub.bookings.create - Crea prenotazione
\`\`\`

### MI-HUB (Orchestration)

\`\`\`
POST /api/mihub/orchestrator - Esegui orchestrazione multi-agent
GET  /api/mihub/tasks        - Lista task attivi
POST /api/mihub/brain/save   - Salva memoria agente
\`\`\`

### Integrations

\`\`\`
GET  /api/trpc/integrations.listApiKeys - Lista API keys
POST /api/trpc/integrations.createWebhook - Crea webhook
GET  /api/trpc/integrations.stats - Statistiche integrazioni
\`\`\`

## Response Format

Tutti gli endpoint TRPC rispondono con:

\`\`\`json
{
  "result": {
    "data": { /* payload */ }
  }
}
\`\`\`

Gli endpoint REST rispondono con:

\`\`\`json
{
  "success": true,
  "data": { /* payload */ }
}
\`\`\`

## Error Handling

Codici di errore comuni:

- **401** - Non autenticato
- **403** - Non autorizzato (serve ruolo admin)
- **404** - Risorsa non trovata
- **500** - Errore server
- **502** - Bad Gateway (servizio esterno non disponibile)

---

**Tip:** Per la lista completa e aggiornata degli endpoint, consulta \`MIO-hub/api/index.json\`.
`;

  fs.writeFileSync(
    path.join(AGENTS_DIR, "api_reference_for_agents.md"),
    apiRefContent,
    "utf-8"
  );
  console.log("   ✅ api_reference_for_agents.md created");
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  try {
    const dbSchema = scanDatabaseSchema();
    const endpoints = loadEndpoints();
    const structure = scanProjectStructure();

    generateBlueprint(dbSchema, endpoints, structure);
    generateAgentLibrary(endpoints);

    console.log("\n✅ Auto-Blueprint Generation Complete!\n");
    console.log("📘 BLUEPRINT.md updated");
    console.log("🤖 .mio-agents/ library updated");
    console.log(
      "\nNext: Run `npm run docs:update` to update everything at once.\n"
    );
  } catch (error) {
    console.error("\n❌ Error generating blueprint:", error.message);
    process.exit(1);
  }
}

main();

// Copy BLUEPRINT.md to public/ for serving
const PUBLIC_DIR = path.join(ROOT_DIR, "public");
if (!fs.existsSync(PUBLIC_DIR)) {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}
fs.copyFileSync(BLUEPRINT_PATH, path.join(PUBLIC_DIR, "BLUEPRINT.md"));
console.log("   ✅ BLUEPRINT.md copied to public/");
