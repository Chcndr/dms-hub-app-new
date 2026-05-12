import { useState, memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Store,
  MapPin,
  Wallet,
  Bot,
  Network,
  FileText,
  Database,
  Code,
  ArrowRight,
  Download,
  ExternalLink,
  LayoutDashboard,
  Shield,
  Activity,
  Layers,
  Server,
  Cpu,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Lock,
  Globe,
  Zap,
  Users,
  Building2,
  Fingerprint,
  CreditCard,
  Bell,
  Leaf,
  BarChart3,
  Eye,
  GitBranch,
  HardDrive,
} from "lucide-react";

// ─── Immagini blueprint (webp generate) ─────────────────────────────
const BLUEPRINT_SLIDES = {
  overview: [
    {
      id: "ecosystem",
      title: "Ecosistema MIO HUB",
      image: "/ecosystem_overview_generated.webp",
      desc: "Panoramica architetturale completa del sistema",
    },
    {
      id: "core",
      title: "Core Business",
      image: "/core_business_generated.webp",
      desc: "Gestione mercati, SUAP e flussi operativi PA",
    },
    {
      id: "integrations",
      title: "Integrazioni PA",
      image: "/integrations_generated.webp",
      desc: "PDND, App IO, ANPR, PagoPA, SSO ARPA",
    },
    {
      id: "updates",
      title: "Stato Sistema",
      image: "/blueprint_updates_generated.webp",
      desc: "Architettura corrente e aggiornamenti v10.14",
    },
  ],
  modules: [
    {
      id: "markets",
      title: "Gestione Mercati & SUAP",
      icon: Store,
      image: "/tech_markets_generated.webp",
      color: "text-[#14b8a6]",
      borderColor: "border-[#14b8a6]",
      bgColor: "bg-[#14b8a6]",
      desc: "Core business: anagrafiche, concessioni, SUAP digitale",
    },
    {
      id: "gis",
      title: "GIS & Mappe Interattive",
      icon: MapPin,
      image: "/tech_gis_generated.webp",
      color: "text-[#10b981]",
      borderColor: "border-[#10b981]",
      bgColor: "bg-[#10b981]",
      desc: "Visualizzazione geospaziale nazionale con 7.904 comuni",
    },
    {
      id: "wallet",
      title: "Wallet, PagoPA & Finanza",
      icon: Wallet,
      image: "/tech_wallet_generated.webp",
      color: "text-[#f59e0b]",
      borderColor: "border-[#f59e0b]",
      bgColor: "bg-[#f59e0b]",
      desc: "Borsellino elettronico, PagoPA E-FIL, riconciliazione",
    },
    {
      id: "agents",
      title: "MIO Agent & AI",
      icon: Bot,
      image: "/tech_agents_generated.webp",
      color: "text-[#8b5cf6]",
      borderColor: "border-[#8b5cf6]",
      bgColor: "bg-[#8b5cf6]",
      desc: "Orchestrazione multi-agente con Gemini 2.5",
    },
    {
      id: "integrations",
      title: "Piattaforme PA & Connettivita'",
      icon: Network,
      image: "/tech_integrations_generated.webp",
      color: "text-[#06b6d4]",
      borderColor: "border-[#06b6d4]",
      bgColor: "bg-[#06b6d4]",
      desc: "PDND, ANPR, App IO, SSU, SSO ARPA, firma digitale",
    },
    {
      id: "security",
      title: "Sicurezza & Compliance",
      icon: Shield,
      image: "/blueprint_updates_generated.webp",
      color: "text-[#ef4444]",
      borderColor: "border-[#ef4444]",
      bgColor: "bg-[#ef4444]",
      desc: "RBAC, anti-scanner, firma CAdES/PAdES, GDPR",
    },
  ],
};

// ─── Dati reali per ogni modulo (aggiornati 12 maggio 2026) ─────────
const MODULE_DETAILS: Record<
  string,
  {
    stats: { label: string; value: string; color: string }[];
    highlights: string[];
    tech: string;
  }
> = {
  markets: {
    stats: [
      { label: "Endpoint REST", value: "86", color: "#14b8a6" },
      { label: "Tabelle DB", value: "21", color: "#06b6d4" },
      { label: "Componenti", value: "28+", color: "#a855f7" },
    ],
    highlights: [
      "CRUD completo mercati, posteggi e operatori con 14 endpoint markets.js",
      "Modulo SUAP digitale completo (36 endpoint) con firma CAdES/PAdES",
      "Gestione concessioni con scadenze, rinnovi e graduatorie",
      "Registro presenze giornaliere digitale con spuntisti e mobilita'",
      "SSU Front Office per invio pratiche al Back Office del Comune",
      "Canone Unico Patrimoniale con calcolo automatico e PagoPA",
    ],
    tech: "Express.js + MySQL/TiDB + REST API + node-forge",
  },
  gis: {
    stats: [
      { label: "Layer mappa", value: "8+", color: "#10b981" },
      { label: "Comuni Italia", value: "7.904", color: "#06b6d4" },
      { label: "Engine", value: "Leaflet", color: "#a855f7" },
    ],
    highlights: [
      "Mappa interattiva mercati su scala nazionale con 7.904 comuni",
      "Mappa GIS mercato singolo con posteggi geolocalizzati",
      "Mappa Italia pubblica con regioni, province e comuni",
      "Hub Market Map per gestione multi-mercato",
      "Heatmap segnalazioni civiche in tempo reale",
      "Route optimizer multi-destinazione con centro mobilita'",
    ],
    tech: "Leaflet + OpenStreetMap + GeoJSON + React",
  },
  wallet: {
    stats: [
      { label: "Endpoint PagoPA", value: "9", color: "#f59e0b" },
      { label: "Gateway", value: "E-FIL", color: "#ef4444" },
      { label: "Riconciliazione", value: "Attiva", color: "#10b981" },
    ],
    highlights: [
      "Borsellino elettronico per operatori con ricariche e transazioni",
      "Integrazione PagoPA via protocollo E-FIL SOAP",
      "Generazione avvisi di pagamento con IUV univoco",
      "Tab Riconciliazione Incassi con matching automatico",
      "Storico transazioni, export e reportistica",
      "Callback asincrono per conferma pagamenti",
    ],
    tech: "E-FIL SOAP + Express.js + MySQL + REST",
  },
  agents: {
    stats: [
      { label: "Agenti AI", value: "5+", color: "#8b5cf6" },
      { label: "LLM", value: "Gemini 2.5", color: "#14b8a6" },
      { label: "Knowledge", value: "42 PDF", color: "#f59e0b" },
    ],
    highlights: [
      "MIO: orchestratore e coordinamento multi-agente",
      "GPT-Dev: sviluppo e refactoring codice automatico",
      "Manus: sysadmin, deploy, infrastruttura e monitoring",
      "Abacus: analisi dati, report statistici e previsioni",
      "Concilio AI: assistente delibere e atti amministrativi",
      "Workspace collaborativo con brain e knowledge base",
    ],
    tech: "Gemini 2.5 Flash + WebSocket + REST + OpenAI API",
  },
  integrations: {
    stats: [
      { label: "Piattaforme PA", value: "6", color: "#06b6d4" },
      { label: "Endpoint totali", value: "1.051", color: "#14b8a6" },
      { label: "Connessioni", value: "11", color: "#f59e0b" },
    ],
    highlights: [
      "PDND — Piattaforma Digitale Nazionale Dati (catalogo e-Service)",
      "ANPR — Anagrafe Nazionale con verifica residenza e famiglia",
      "App IO — Notifiche cittadini con 5 template messaggi",
      "SSU — Sportello Unico Front Office per pratiche SUAP",
      "SSO ARPA Toscana — SPID Livello 2 + CIE Livello 3",
      "PagoPA E-FIL — Pagamenti con riconciliazione automatica",
    ],
    tech: "OAuth 2.0 + PKCE + REST + SOAP + OpenSSL",
  },
  security: {
    stats: [
      { label: "Endpoint RBAC", value: "64", color: "#ef4444" },
      { label: "Conformita'", value: "25/27", color: "#10b981" },
      { label: "Anti-Scanner", value: "Attivo", color: "#f59e0b" },
    ],
    highlights: [
      "RBAC granulare con 64 endpoint e permessi per singola azione",
      "Anti-Scanner con honeypot (.env), rate-limit 404 e ban automatico",
      "Firma digitale CAdES (.p7m) e PAdES (.pdf) con verifica crittografica",
      "Cifratura PII AES-256-GCM con IV random e auth tag",
      "GDPR completo: export dati Art.20, oblio Art.17, consenso",
      "Audit Trail completo con retention policy (90gg/365gg/5y)",
    ],
    tech: "Helmet + CORS + JWT + node-forge + OpenSSL + AES-256-GCM",
  },
};

// ─── Schema DB raggruppato (21 tabelle MySQL reali) ─────────────────
const DB_GROUPS = [
  {
    name: "Core Business & Mercati",
    color: "#14b8a6",
    icon: Store,
    count: 4,
    tables: [
      "documents",
      "contratti_associazione",
      "fatture_associazione",
      "workspace_snapshots",
    ],
  },
  {
    name: "SUAP & Pratiche",
    color: "#ec4899",
    icon: FileText,
    count: 3,
    tables: [
      "dms_suap_instances",
      "suap_pratica_messaggi",
      "dms_durc_snapshots",
    ],
  },
  {
    name: "Piattaforme PA",
    color: "#06b6d4",
    icon: Globe,
    count: 4,
    tables: [
      "ssu_instances",
      "ssu_documents",
      "ssu_audit_trail",
      "pdnd_vouchers",
    ],
  },
  {
    name: "PagoPA & Pagamenti",
    color: "#f59e0b",
    icon: CreditCard,
    count: 1,
    tables: ["pagopa_posizioni"],
  },
  {
    name: "AI & Agenti",
    color: "#8b5cf6",
    icon: Bot,
    count: 4,
    tables: [
      "chat_messages",
      "ai_feedback",
      "mio_agent_logs",
      "mihub_tasks",
    ],
  },
  {
    name: "Associazioni & Enti",
    color: "#f97316",
    icon: Users,
    count: 2,
    tables: ["associazioni", "utenti_associazione"],
  },
  {
    name: "Territorio & Comuni",
    color: "#22c55e",
    icon: Building2,
    count: 2,
    tables: ["province", "regioni"],
  },
];

// ─── Gruppi componenti (173 totali) ─────────────────────────────────
const COMPONENT_GROUPS = [
  {
    name: "Dashboard PA",
    count: 28,
    desc: "28 sezioni protette con sistema RBAC + ProtectedTab",
    color: "#14b8a6",
    icon: LayoutDashboard,
  },
  {
    name: "Gestione Mercati & SUAP",
    count: 18,
    desc: "Mercati, posteggi, concessioni, presenze, SUAP, canone unico",
    color: "#06b6d4",
    icon: Store,
  },
  {
    name: "Mappe & GIS",
    count: 12,
    desc: "Leaflet maps, mappa Italia, GIS mercato, hub map, route optimizer",
    color: "#10b981",
    icon: MapPin,
  },
  {
    name: "Wallet & PagoPA",
    count: 10,
    desc: "Borsellino, PagoPA E-FIL, riconciliazione incassi, transazioni",
    color: "#f59e0b",
    icon: Wallet,
  },
  {
    name: "AI & Chat",
    count: 8,
    desc: "MIO Agent, workspace collaborativo, brain, Concilio AI",
    color: "#8b5cf6",
    icon: Bot,
  },
  {
    name: "Auth & Security",
    count: 8,
    desc: "Login SSO, RBAC manager, impersonation, guard, anti-scanner",
    color: "#ef4444",
    icon: Lock,
  },
  {
    name: "Piattaforme PA",
    count: 10,
    desc: "PDND, SSU, App IO, ANPR, SSO ARPA, Audit Trail",
    color: "#06b6d4",
    icon: Globe,
  },
  {
    name: "Impresa & Operatori",
    count: 14,
    desc: "Dashboard impresa, anagrafica, notifiche, hub operatore, presenze",
    color: "#f97316",
    icon: Users,
  },
  {
    name: "Comuni & Territorio",
    count: 8,
    desc: "Pannello comuni, controlli/sanzioni, segnalazioni civiche",
    color: "#22c55e",
    icon: Building2,
  },
  {
    name: "Report & Documenti",
    count: 6,
    desc: "Report interattivo, dossier tecnico, blueprint navigator",
    color: "#a855f7",
    icon: FileText,
  },
  {
    name: "Gaming & Sostenibilita'",
    count: 8,
    desc: "Gaming rewards, carbon credits, TCC v2, sostenibilita'",
    color: "#ec4899",
    icon: Leaf,
  },
  {
    name: "UI Base (shadcn)",
    count: 53,
    desc: "Button, Card, Dialog, Table, Select, Tabs, etc.",
    color: "#64748b",
    icon: Layers,
  },
];

// ─── Metriche integrazioni PA ───────────────────────────────────────
const PA_INTEGRATIONS = [
  {
    name: "PagoPA E-FIL",
    status: "ok" as const,
    detail: "9 endpoint REST — gateway pagamenti con riconciliazione",
  },
  {
    name: "SPID (Livello 2)",
    status: "ok" as const,
    detail: "SSO via ARPA Toscana — OAuth 2.0 + PKCE attivo",
  },
  {
    name: "CIE (Livello 3)",
    status: "ok" as const,
    detail: "SSO via ARPA Toscana — endpoint configurato e attivo",
  },
  {
    name: "Firma Digitale",
    status: "ok" as const,
    detail: "CAdES (.p7m) e PAdES (.pdf) — verifica crittografica reale",
  },
  {
    name: "SUAP Digitale",
    status: "ok" as const,
    detail: "36 endpoint — pratiche, documenti, firma, workflow completo",
  },
  {
    name: "Anti-Scanner/Bot",
    status: "ok" as const,
    detail: "Honeypot + rate-limit 404 + ban automatico — 16K+ attacchi bloccati",
  },
  {
    name: "PDND",
    status: "partial" as const,
    detail: "Backend pronto — catalogo 3 e-Service — in attesa accreditamento",
  },
  {
    name: "ANPR",
    status: "partial" as const,
    detail: "5 endpoint backend — sandbox attivo — in attesa PDND",
  },
  {
    name: "App IO",
    status: "partial" as const,
    detail: "6 endpoint backend — 5 template — in attesa API key produzione",
  },
  {
    name: "SSU Front Office",
    status: "partial" as const,
    detail: "13 endpoint — connettore pronto — in attesa accreditamento",
  },
  {
    name: "Qualificazione ACN",
    status: "missing" as const,
    detail: "Da avviare per vendita SaaS a Pubbliche Amministrazioni",
  },
  {
    name: "DPIA",
    status: "missing" as const,
    detail: "Valutazione impatto privacy — da redigere formalmente",
  },
];

const STATUS_COLORS = {
  ok: { bg: "bg-[#10b981]/20", text: "text-[#10b981]", label: "Operativo" },
  partial: {
    bg: "bg-[#f59e0b]/20",
    text: "text-[#f59e0b]",
    label: "Sandbox",
  },
  missing: { bg: "bg-[#ef4444]/20", text: "text-[#ef4444]", label: "Da fare" },
};

// ─── Score bar component ─────────────────────────────────────────────
function ScoreBar({
  label,
  score,
  max,
  color,
}: {
  label: string;
  score: number;
  max: number;
  color: string;
}) {
  const pct = (score / max) * 100;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-[#e8fbff]/70">{label}</span>
        <span className="font-mono font-bold" style={{ color }}>
          {score}/{max}
        </span>
      </div>
      <div className="h-2 bg-[#0b1220] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
export const NativeReportComponent = memo(function NativeReportComponent() {
  const [activeTab, setActiveTab] = useState("architecture");
  const [activeModule, setActiveModule] = useState(BLUEPRINT_SLIDES.modules[0]);

  const renderContent = () => {
    switch (activeTab) {
      // ─── TAB: ARCHITETTURA ───────────────────────────────────────
      case "architecture": {
        const details = MODULE_DETAILS[activeModule.id];
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left: Module Navigation */}
              <div className="lg:col-span-4 space-y-4">
                <Card className="bg-[#1a2332] border-[#06b6d4]/30 h-full">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-[#e8fbff] text-lg">
                      Moduli di Sistema
                    </CardTitle>
                    <p className="text-xs text-[#e8fbff]/40">
                      6 moduli core — 270.391 righe di codice
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {BLUEPRINT_SLIDES.modules.map((module) => (
                      <div
                        key={module.id}
                        onClick={() => setActiveModule(module)}
                        className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 group ${
                          activeModule.id === module.id
                            ? `bg-[#0b1220] ${module.borderColor} shadow-[0_0_15px_rgba(6,182,212,0.15)]`
                            : "bg-[#0b1220]/50 border-transparent hover:bg-[#0b1220] hover:border-[#e8fbff]/10"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className={`p-2 rounded-md bg-[#1a2332] ${module.color}`}
                            >
                              <module.icon className="h-5 w-5" />
                            </div>
                            <div>
                              <h3
                                className={`font-semibold text-sm ${activeModule.id === module.id ? "text-[#e8fbff]" : "text-[#e8fbff]/70"}`}
                              >
                                {module.title}
                              </h3>
                              <p className="text-xs text-[#e8fbff]/40">
                                {module.desc}
                              </p>
                            </div>
                          </div>
                          <ArrowRight
                            className={`h-4 w-4 transition-transform ${
                              activeModule.id === module.id
                                ? "text-[#06b6d4] translate-x-1"
                                : "text-[#e8fbff]/20"
                            }`}
                          />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Right: Image + Data Panel */}
              <div className="lg:col-span-8 space-y-4">
                {/* Image Card */}
                <Card className="bg-[#0b1220] border-[#06b6d4]/30 overflow-hidden">
                  <div className="relative min-h-[380px] bg-black/40 group">
                    <img
                      src={activeModule.image}
                      alt={activeModule.title}
                      className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-[1.02]"
                      loading="lazy"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#0b1220] via-[#0b1220]/90 to-transparent p-6 pt-12">
                      <div className="flex items-center gap-2 mb-2">
                        <activeModule.icon
                          className={`h-5 w-5 ${activeModule.color}`}
                        />
                        <h2 className="text-xl font-bold text-[#e8fbff]">
                          {activeModule.title}
                        </h2>
                      </div>
                      {details && (
                        <p className="text-xs text-[#e8fbff]/40 font-mono">
                          Stack: {details.tech}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>

                {/* Stats + Highlights */}
                {details && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="bg-[#1a2332] border-[#1e293b]">
                      <CardContent className="p-4 space-y-3">
                        <h4 className="text-xs font-semibold text-[#e8fbff]/50 uppercase tracking-wider">
                          Metriche
                        </h4>
                        {details.stats.map((s, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between"
                          >
                            <span className="text-sm text-[#e8fbff]/60">
                              {s.label}
                            </span>
                            <span
                              className="text-lg font-bold font-mono"
                              style={{ color: s.color }}
                            >
                              {s.value}
                            </span>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                    <Card className="bg-[#1a2332] border-[#1e293b]">
                      <CardContent className="p-4 space-y-2">
                        <h4 className="text-xs font-semibold text-[#e8fbff]/50 uppercase tracking-wider mb-2">
                          Funzionalita' chiave
                        </h4>
                        {details.highlights.map((h, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <CheckCircle className="h-3.5 w-3.5 text-[#10b981] mt-0.5 shrink-0" />
                            <span className="text-xs text-[#e8fbff]/60">
                              {h}
                            </span>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      }

      // ─── TAB: FLUSSO DATI ───────────────────────────────────────
      case "dataflow":
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Hero metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                {
                  label: "Righe di Codice",
                  value: "270.391",
                  color: "#14b8a6",
                  icon: Code,
                },
                {
                  label: "Endpoint API",
                  value: "1.051",
                  color: "#06b6d4",
                  icon: Network,
                },
                {
                  label: "File Sorgente",
                  value: "551",
                  color: "#a855f7",
                  icon: FileText,
                },
                {
                  label: "Commit Totali",
                  value: "3.868",
                  color: "#f59e0b",
                  icon: GitBranch,
                },
              ].map((s, i) => (
                <Card key={i} className="bg-[#1a2332] border-[#1e293b]">
                  <CardContent className="p-4 text-center">
                    <s.icon
                      className="h-5 w-5 mx-auto mb-2"
                      style={{ color: s.color }}
                    />
                    <p
                      className="text-2xl font-bold font-mono"
                      style={{ color: s.color }}
                    >
                      {s.value}
                    </p>
                    <p className="text-xs text-[#e8fbff]/50 mt-1">{s.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-[#1a2332] border-[#1e293b]">
                <CardContent className="p-5 space-y-4">
                  <h4 className="text-sm font-semibold text-[#e8fbff] flex items-center gap-2">
                    <Server className="h-4 w-4 text-[#14b8a6]" />
                    Backend (mihub-backend-rest)
                  </h4>
                  <div className="space-y-3">
                    {[
                      { label: "File route", value: "100", color: "#14b8a6" },
                      {
                        label: "Righe codice route",
                        value: "70.103",
                        color: "#06b6d4",
                      },
                      {
                        label: "Righe totali JS",
                        value: "91.566",
                        color: "#a855f7",
                      },
                      {
                        label: "Endpoint definiti",
                        value: "864",
                        color: "#f59e0b",
                      },
                      {
                        label: "Middleware",
                        value: "3 (942 LOC)",
                        color: "#10b981",
                      },
                      { label: "Commit", value: "1.321", color: "#ef4444" },
                    ].map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between"
                      >
                        <span className="text-xs text-[#e8fbff]/60">
                          {item.label}
                        </span>
                        <span
                          className="text-sm font-bold font-mono"
                          style={{ color: item.color }}
                        >
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#1a2332] border-[#1e293b]">
                <CardContent className="p-5 space-y-4">
                  <h4 className="text-sm font-semibold text-[#e8fbff] flex items-center gap-2">
                    <Layers className="h-4 w-4 text-[#06b6d4]" />
                    Frontend (dms-hub-app-new)
                  </h4>
                  <div className="space-y-3">
                    {[
                      {
                        label: "Componenti React",
                        value: "173",
                        color: "#14b8a6",
                      },
                      { label: "Pagine", value: "37", color: "#06b6d4" },
                      {
                        label: "Righe TSX",
                        value: "148.698",
                        color: "#a855f7",
                      },
                      {
                        label: "Righe TS/CSS",
                        value: "9.141",
                        color: "#f59e0b",
                      },
                      {
                        label: "Sezioni Dashboard",
                        value: "28",
                        color: "#10b981",
                      },
                      { label: "Commit", value: "2.547", color: "#ef4444" },
                    ].map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between"
                      >
                        <span className="text-xs text-[#e8fbff]/60">
                          {item.label}
                        </span>
                        <span
                          className="text-sm font-bold font-mono"
                          style={{ color: item.color }}
                        >
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top route files */}
            <Card className="bg-[#1a2332] border-[#1e293b]">
              <CardContent className="p-5">
                <h4 className="text-sm font-semibold text-[#e8fbff] flex items-center gap-2 mb-4">
                  <BarChart3 className="h-4 w-4 text-[#a855f7]" />
                  Top 15 Moduli Backend per Complessita'
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {[
                    { name: "security.js", lines: "3.735", endpoints: "64" },
                    { name: "tcc-v2.js", lines: "3.126", endpoints: "33" },
                    { name: "suap.js", lines: "2.962", endpoints: "36" },
                    {
                      name: "gaming-rewards.js",
                      lines: "2.541",
                      endpoints: "32",
                    },
                    {
                      name: "presenze-live.js",
                      lines: "2.522",
                      endpoints: "22",
                    },
                    { name: "ai-chat.js", lines: "2.363", endpoints: "9" },
                    { name: "concessions.js", lines: "2.087", endpoints: "10" },
                    {
                      name: "integrations.js",
                      lines: "1.932",
                      endpoints: "8",
                    },
                    {
                      name: "canone-unico.js",
                      lines: "1.793",
                      endpoints: "20",
                    },
                    {
                      name: "orchestrator.js",
                      lines: "1.697",
                      endpoints: "9",
                    },
                    { name: "imprese.js", lines: "1.598", endpoints: "19" },
                    {
                      name: "associazioni.js",
                      lines: "1.594",
                      endpoints: "33",
                    },
                    { name: "presenze.js", lines: "1.581", endpoints: "17" },
                    { name: "formazione.js", lines: "1.195", endpoints: "21" },
                    {
                      name: "ssu-connector.js",
                      lines: "1.102",
                      endpoints: "13",
                    },
                  ].map((mod, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2 rounded bg-[#0b1220] border border-[#1e293b]"
                    >
                      <span className="text-[11px] font-mono text-[#e8fbff]/60">
                        {mod.name}
                      </span>
                      <div className="flex gap-3">
                        <span className="text-[10px] font-mono text-[#14b8a6]">
                          {mod.lines} LOC
                        </span>
                        <span className="text-[10px] font-mono text-[#f59e0b]">
                          {mod.endpoints} EP
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Overview slides */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {BLUEPRINT_SLIDES.overview.map((slide) => (
                <Card
                  key={slide.id}
                  className="bg-[#1a2332] border-[#06b6d4]/20 hover:border-[#06b6d4]/50 transition-colors cursor-pointer group overflow-hidden"
                  onClick={() => window.open(slide.image, "_blank")}
                >
                  <div className="h-48 overflow-hidden relative">
                    <img
                      src={slide.image}
                      alt={slide.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-80 group-hover:opacity-100"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1a2332] to-transparent" />
                  </div>
                  <CardContent className="pt-4 relative">
                    <h4 className="text-[#e8fbff] font-semibold mb-1 group-hover:text-[#06b6d4] transition-colors">
                      {slide.title}
                    </h4>
                    <p className="text-sm text-[#e8fbff]/50">{slide.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      // ─── TAB: DATABASE ───────────────────────────────────────────
      case "database":
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header stats */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Tabelle MySQL", value: "21", color: "#14b8a6" },
                { label: "ORM", value: "Raw SQL", color: "#06b6d4" },
                {
                  label: "Database",
                  value: "MySQL / TiDB",
                  color: "#a855f7",
                },
              ].map((s, i) => (
                <Card key={i} className="bg-[#1a2332] border-[#1e293b]">
                  <CardContent className="p-4 text-center">
                    <p
                      className="text-2xl font-bold font-mono"
                      style={{ color: s.color }}
                    >
                      {s.value}
                    </p>
                    <p className="text-xs text-[#e8fbff]/50 mt-1">{s.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Table groups grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {DB_GROUPS.map((group, i) => (
                <Card
                  key={i}
                  className="bg-[#1a2332] border-[#1e293b] hover:border-opacity-50 transition-colors"
                  style={{ borderColor: group.color + "30" }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="p-1.5 rounded-md bg-[#0b1220]"
                          style={{ color: group.color }}
                        >
                          <group.icon className="h-4 w-4" />
                        </div>
                        <h4 className="text-sm font-semibold text-[#e8fbff]">
                          {group.name}
                        </h4>
                      </div>
                      <span
                        className="text-xs font-mono px-2 py-0.5 rounded-full"
                        style={{
                          color: group.color,
                          backgroundColor: group.color + "15",
                        }}
                      >
                        {group.count} tabelle
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {group.tables.map((t, j) => (
                        <span
                          key={j}
                          className="text-[10px] font-mono px-2 py-1 rounded bg-[#0b1220] text-[#e8fbff]/50 border border-[#1e293b]"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Infrastruttura */}
            <Card className="bg-[#0b1220] border-[#1e293b]">
              <CardContent className="p-4">
                <h4 className="text-xs font-semibold text-[#e8fbff]/50 uppercase tracking-wider mb-3">
                  Infrastruttura di Hosting
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    {
                      name: "Hetzner VPS",
                      role: "Backend API + MySQL",
                      detail: "Ubuntu 22.04, Node.js 22, PM2, Nginx, Let's Encrypt",
                      color: "#14b8a6",
                    },
                    {
                      name: "Vercel",
                      role: "Frontend React",
                      detail: "Edge CDN globale, build automatico da GitHub",
                      color: "#06b6d4",
                    },
                    {
                      name: "GitHub",
                      role: "Repository & CI/CD",
                      detail: "2 repo privati, GitHub Actions, auto-deploy",
                      color: "#a855f7",
                    },
                  ].map((infra, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-lg bg-[#1a2332] border border-[#1e293b]"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <HardDrive
                          className="h-4 w-4"
                          style={{ color: infra.color }}
                        />
                        <span
                          className="text-sm font-semibold"
                          style={{ color: infra.color }}
                        >
                          {infra.name}
                        </span>
                      </div>
                      <p className="text-xs text-[#e8fbff]/70 font-medium">
                        {infra.role}
                      </p>
                      <p className="text-[10px] text-[#e8fbff]/40 mt-1">
                        {infra.detail}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      // ─── TAB: COMPONENTI ─────────────────────────────────────────
      case "components":
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Componenti React", value: "173", color: "#14b8a6" },
                { label: "Pagine / Route", value: "37", color: "#06b6d4" },
                { label: "Sezioni Dashboard", value: "28", color: "#a855f7" },
                { label: "Client API", value: "6", color: "#f59e0b" },
              ].map((s, i) => (
                <Card key={i} className="bg-[#1a2332] border-[#1e293b]">
                  <CardContent className="p-4 text-center">
                    <p
                      className="text-2xl font-bold font-mono"
                      style={{ color: s.color }}
                    >
                      {s.value}
                    </p>
                    <p className="text-xs text-[#e8fbff]/50 mt-1">{s.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Component groups */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {COMPONENT_GROUPS.map((group, i) => (
                <Card
                  key={i}
                  className="bg-[#1a2332] border-[#1e293b] hover:border-opacity-50 transition-colors"
                  style={{ borderColor: group.color + "30" }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div
                        className="p-2 rounded-md bg-[#0b1220] shrink-0"
                        style={{ color: group.color }}
                      >
                        <group.icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-[#e8fbff]">
                            {group.name}
                          </h4>
                          <span
                            className="text-xs font-mono px-1.5 py-0.5 rounded-full shrink-0"
                            style={{
                              color: group.color,
                              backgroundColor: group.color + "15",
                            }}
                          >
                            {group.count}
                          </span>
                        </div>
                        <p className="text-xs text-[#e8fbff]/50 mt-1">
                          {group.desc}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Top frontend files */}
            <Card className="bg-[#1a2332] border-[#1e293b]">
              <CardContent className="p-5">
                <h4 className="text-sm font-semibold text-[#e8fbff] flex items-center gap-2 mb-4">
                  <BarChart3 className="h-4 w-4 text-[#a855f7]" />
                  Top 10 Componenti per Complessita'
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {[
                    { name: "DashboardPA.tsx", lines: "10.621" },
                    { name: "GestioneMercati.tsx", lines: "6.776" },
                    { name: "AnagraficaPage.tsx", lines: "5.768" },
                    { name: "SuapPanel.tsx", lines: "4.926" },
                    { name: "ControlliSanzioniPanel.tsx", lines: "4.816" },
                    { name: "WalletPanel.tsx", lines: "4.521" },
                    { name: "ComuniPanel.tsx", lines: "4.138" },
                    { name: "MappaItaliaComponent.tsx", lines: "3.547" },
                    { name: "GamingRewardsPanel.tsx", lines: "3.447" },
                    { name: "Integrazioni.tsx", lines: "3.414" },
                  ].map((comp, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2 rounded bg-[#0b1220] border border-[#1e293b]"
                    >
                      <span className="text-[11px] font-mono text-[#e8fbff]/60">
                        {comp.name}
                      </span>
                      <span className="text-[10px] font-mono text-[#14b8a6]">
                        {comp.lines} righe
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Tech stack summary */}
            <Card className="bg-[#0b1220] border-[#1e293b]">
              <CardContent className="p-4">
                <h4 className="text-xs font-semibold text-[#e8fbff]/50 uppercase tracking-wider mb-3">
                  Stack Tecnologico Completo
                </h4>
                <div className="flex flex-wrap gap-2">
                  {[
                    "React 19",
                    "Vite 7",
                    "TypeScript",
                    "Tailwind CSS",
                    "shadcn/ui",
                    "Wouter",
                    "React Query",
                    "Leaflet",
                    "Lucide Icons",
                    "Recharts",
                    "Node.js 22",
                    "Express.js",
                    "MySQL / TiDB",
                    "PM2",
                    "Nginx",
                    "node-forge",
                    "OpenSSL",
                    "Helmet",
                    "JWT",
                    "OAuth 2.0 + PKCE",
                    "Gemini 2.5 Flash",
                    "GitHub Actions",
                    "Vercel CDN",
                    "Hetzner VPS",
                  ].map((tech, i) => (
                    <span
                      key={i}
                      className="text-xs px-3 py-1.5 rounded-full bg-[#1a2332] text-[#e8fbff]/60 border border-[#1e293b]"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      // ─── TAB: DOSSIER INVESTITORI ─────────────────────────────────
      case "dossier": {
        const [dossierSub, setDossierSub] = useState("ecosystem");
        const DOSSIER_SUBS = [
          { id: "ecosystem", label: "Ecosistema", icon: Globe },
          { id: "revenue", label: "Revenue Model", icon: TrendingUp },
          { id: "premium", label: "Servizi Premium", icon: Zap },
          { id: "compliance", label: "Conformita'", icon: Shield },
          { id: "integrations", label: "Integrazioni PA", icon: Network },
        ];

        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Sub-navigation */}
            <div className="flex flex-wrap gap-2 p-1 bg-[#1a2332] rounded-lg border border-[#1e293b]">
              {DOSSIER_SUBS.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => setDossierSub(sub.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-medium transition-all ${
                    dossierSub === sub.id
                      ? "bg-[#a855f7]/20 text-[#a855f7] ring-1 ring-[#a855f7]/30"
                      : "text-[#e8fbff]/60 hover:text-[#e8fbff] hover:bg-[#e8fbff]/5"
                  }`}
                >
                  <sub.icon className="h-3.5 w-3.5" />
                  {sub.label}
                </button>
              ))}
            </div>

            {/* ── ECOSISTEMA ── */}
            {dossierSub === "ecosystem" && (
              <div className="space-y-6">
                {/* Vision */}
                <Card className="bg-gradient-to-br from-[#1a2332] to-[#0b1220] border-[#a855f7]/30">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-[#e8fbff] mb-3 flex items-center gap-2">
                      <Globe className="h-6 w-6 text-[#a855f7]" />
                      Il Gemello Digitale del Commercio Italiano
                    </h3>
                    <p className="text-sm text-[#e8fbff]/70 leading-relaxed mb-4">
                      MIO HUB e' un ecosistema connesso in tempo reale che unisce Pubbliche Amministrazioni,
                      imprese del commercio ambulante e sede fissa, e cittadini in un'unica piattaforma.
                      Non e' un semplice gestionale: e' l'infrastruttura digitale che puo' sostituire
                      le associazioni di categoria con servizi online diretti, gestire 400.000+ posteggi
                      su 8.000 mercati, e creare un ecosistema premiante che contrasta l'e-commerce
                      valorizzando il commercio locale italiano.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        {
                          title: "Dashboard PA",
                          desc: "28 sezioni protette per la gestione completa di mercati, SUAP, concessioni, canone unico, controlli e sanzioni, report e GIS",
                          color: "#14b8a6",
                          icon: LayoutDashboard,
                          users: "8.000 Comuni",
                        },
                        {
                          title: "App Impresa",
                          desc: "Gestione posteggio, pagamenti diretti, SCIA automatizzate, corsi e qualificazioni, quota tessera, contabilita' e AVA assistente AI",
                          color: "#06b6d4",
                          icon: Store,
                          users: "160.000 Imprese",
                        },
                        {
                          title: "App Cittadino",
                          desc: "Route Etico con navigatore, Gaming premiante, segnalatore civico, visite culturali, mobilita' sostenibile e carbon credits",
                          color: "#a855f7",
                          icon: Users,
                          users: "60M Cittadini",
                        },
                      ].map((app, i) => (
                        <div key={i} className="p-4 rounded-xl bg-[#0b1220] border border-[#1e293b]">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="p-2 rounded-lg" style={{ backgroundColor: `${app.color}20` }}>
                              <app.icon className="h-5 w-5" style={{ color: app.color }} />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-[#e8fbff]">{app.title}</h4>
                              <span className="text-[10px] font-mono" style={{ color: app.color }}>{app.users}</span>
                            </div>
                          </div>
                          <p className="text-[11px] text-[#e8fbff]/50 leading-relaxed">{app.desc}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Key numbers */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "Mercati Italia", value: "8.000", sub: "+ fiere stagionali", color: "#14b8a6" },
                    { label: "Posteggi Totali", value: "400K+", sub: "+ altrettanti fiere", color: "#06b6d4" },
                    { label: "Imprese Connesse", value: "160.000", sub: "ambulanti + sede fissa", color: "#a855f7" },
                    { label: "Giornate/Anno", value: "52+", sub: "media settimanale", color: "#f59e0b" },
                  ].map((n, i) => (
                    <Card key={i} className="bg-[#1a2332] border-[#1e293b]">
                      <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold font-mono" style={{ color: n.color }}>{n.value}</p>
                        <p className="text-xs text-[#e8fbff]/70 mt-1">{n.label}</p>
                        <p className="text-[10px] text-[#e8fbff]/30">{n.sub}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Unique value propositions */}
                <Card className="bg-[#1a2332] border-[#1e293b]">
                  <CardContent className="p-5">
                    <h4 className="text-sm font-semibold text-[#e8fbff] flex items-center gap-2 mb-4">
                      <Zap className="h-4 w-4 text-[#f59e0b]" />
                      Proposte di Valore Uniche
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[
                        { title: "Hub Urbani & Vetrina Online", desc: "Gestione completa hub urbani con vetrina digitale per ogni negozio e posteggio mercato — il marketplace locale che compete con l'e-commerce", color: "#14b8a6" },
                        { title: "Route Etico con Navigatore", desc: "App cittadino con navigatore che guida verso ogni punto vendita locale, premiando gli acquisti sostenibili con carbon credits", color: "#10b981" },
                        { title: "Gaming Premiante Salva-Italia", desc: "Sistema di gamification che premia acquisti in mercati e negozi, visite culturali ai musei, mobilita' sostenibile e segnalazioni civiche", color: "#a855f7" },
                        { title: "Mappa di Calore Citta'", desc: "Le PA ottengono in tempo reale mappe di affluenza commerciale, mobilita', cultura e sicurezza per la pianificazione urbana", color: "#06b6d4" },
                        { title: "SCIA 100% Automatizzate", desc: "Subingressi e pratiche SUAP completamente digitali con firma CAdES/PAdES — da 100 EUR/pratica associazione a 10 EUR automatico", color: "#f59e0b" },
                        { title: "Segnalatore Civico Premiante", desc: "I cittadini segnalano degrado, criminalita', spazzatura e illuminazione guadagnando crediti nel sistema gaming", color: "#ef4444" },
                      ].map((v, i) => (
                        <div key={i} className="p-4 rounded-lg bg-[#0b1220] border border-[#1e293b]">
                          <h5 className="text-sm font-semibold mb-1" style={{ color: v.color }}>{v.title}</h5>
                          <p className="text-[11px] text-[#e8fbff]/50 leading-relaxed">{v.desc}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Asset valuation */}
                <Card className="bg-gradient-to-r from-[#1a2332] to-[#0b1220] border-[#10b981]/30">
                  <CardContent className="p-5">
                    <h4 className="text-sm font-semibold text-[#e8fbff] flex items-center gap-2 mb-4">
                      <TrendingUp className="h-4 w-4 text-[#10b981]" />
                      Valutazione Asset Tecnologico (COCOMO II)
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 rounded-xl bg-[#0b1220] text-center border border-[#14b8a6]/20">
                        <p className="text-2xl font-bold text-[#14b8a6] font-mono">270K</p>
                        <p className="text-[10px] text-[#e8fbff]/40 mt-1">Righe di Codice</p>
                      </div>
                      <div className="p-4 rounded-xl bg-[#0b1220] text-center border border-[#06b6d4]/20">
                        <p className="text-2xl font-bold text-[#06b6d4] font-mono">540-810K</p>
                        <p className="text-[10px] text-[#e8fbff]/40 mt-1">Valore Asset (EUR)</p>
                      </div>
                      <div className="p-4 rounded-xl bg-[#0b1220] text-center border border-[#a855f7]/20">
                        <p className="text-2xl font-bold text-[#a855f7] font-mono">4-6 dev</p>
                        <p className="text-[10px] text-[#e8fbff]/40 mt-1">x 18 mesi equivalenti</p>
                      </div>
                      <div className="p-4 rounded-xl bg-[#0b1220] text-center border border-[#f59e0b]/20">
                        <p className="text-2xl font-bold text-[#f59e0b] font-mono">1.051</p>
                        <p className="text-[10px] text-[#e8fbff]/40 mt-1">Endpoint API attivi</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ── REVENUE MODEL ── */}
            {dossierSub === "revenue" && (
              <div className="space-y-6">
                {/* Revenue streams */}
                <Card className="bg-[#1a2332] border-[#1e293b]">
                  <CardContent className="p-5">
                    <h4 className="text-sm font-semibold text-[#e8fbff] flex items-center gap-2 mb-4">
                      <TrendingUp className="h-4 w-4 text-[#10b981]" />
                      11 Flussi di Revenue — Modello Multi-Stream
                    </h4>
                    <div className="space-y-3">
                      {[
                        {
                          id: 1, name: "Canone Posteggio Giornaliero",
                          desc: "1 EUR/posteggio/giorno di mercato — 400.000 posteggi x 52+ giornate/anno",
                          calc: "400K x 52 x 1 EUR = 20.8M EUR/anno (100%)",
                          color: "#14b8a6", pct: 100,
                        },
                        {
                          id: 2, name: "10% Riscossione Canone Unico",
                          desc: "Trattenuta del 10% sui contagiorni/esattori che riscuotono il canone unico annuo di occupazione suolo pubblico",
                          calc: "Stima 2-5M EUR/anno su canoni riscossi",
                          color: "#06b6d4", pct: 70,
                        },
                        {
                          id: 3, name: "SCIA Subingresso Automatizzate",
                          desc: "Pratiche SUAP 100% digitali — le associazioni chiedono 100 EUR/pratica, MIO HUB chiede 10% (10 EUR) all'associazione",
                          calc: "10.000-30.000 pratiche/anno x 10 EUR = 100-300K EUR",
                          color: "#a855f7", pct: 25,
                        },
                        {
                          id: 4, name: "Pagamenti Diretti App Impresa",
                          desc: "Quota tessera associativa, pagamenti servizi, contabilita' — commissione su ogni transazione da 160.000 imprese",
                          calc: "160K imprese x 50-200 EUR/anno x 5% = 400K-1.6M EUR",
                          color: "#f59e0b", pct: 45,
                        },
                        {
                          id: 5, name: "AVA Assistente AI Premium",
                          desc: "Agente AI multi-ruolo in Dashboard PA, App Impresa e App Cittadino — servizio premium con knowledge base 42 PDF",
                          calc: "5.000-20.000 utenti x 100-200 EUR/anno = 500K-4M EUR",
                          color: "#8b5cf6", pct: 55,
                        },
                        {
                          id: 6, name: "Gaming & Carbon Credits",
                          desc: "Sistema premiante Salva-Italia: acquisti sostenibili, mobilita' green, cultura, segnalazioni civiche — sponsorship PA e brand",
                          calc: "Sponsorship + PA budget = 500K-2M EUR/anno",
                          color: "#10b981", pct: 35,
                        },
                        {
                          id: 7, name: "Hub Urbani & Vetrina Online",
                          desc: "Gestione hub urbani con vetrina digitale per negozi sede fissa — canone presenza online e servizi digitali",
                          calc: "100.000 negozi x 100 EUR/anno = 10M EUR",
                          color: "#ec4899", pct: 60,
                        },
                        {
                          id: 8, name: "Banca Dati Corsi & Qualificazioni",
                          desc: "Sistema corsi obbligatori, segnalazioni mancanti e in scadenza — servizio compliance per imprese",
                          calc: "160K imprese x 20 EUR/anno = 3.2M EUR",
                          color: "#f97316", pct: 30,
                        },
                        {
                          id: 9, name: "Servizi Paghe & Contabilita'",
                          desc: "Rete connessa con 160.000 imprese — sviluppo servizi completi paghe e contabilita' online, sostituzione associazioni",
                          calc: "50.000 imprese x 500 EUR/anno = 25M EUR",
                          color: "#ef4444", pct: 85,
                        },
                        {
                          id: 10, name: "Business Dati & Analytics PA",
                          desc: "Mappe di calore citta': affluenza commerciale, mobilita', cultura, sicurezza — dati in tempo reale per PA",
                          calc: "8.000 comuni x 500 EUR/anno = 4M EUR",
                          color: "#06b6d4", pct: 40,
                        },
                        {
                          id: 11, name: "Segnalatore Civico + Route Etico",
                          desc: "App cittadino con segnalazioni premiate e navigatore etico verso punti vendita locali — engagement e dati",
                          calc: "Incluso nel gaming + sponsorship locali",
                          color: "#22c55e", pct: 20,
                        },
                      ].map((stream) => (
                        <div key={stream.id} className="p-4 rounded-lg bg-[#0b1220] border border-[#1e293b]">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <span className="text-lg font-bold font-mono" style={{ color: stream.color }}>#{stream.id}</span>
                              <div>
                                <h5 className="text-sm font-semibold text-[#e8fbff]">{stream.name}</h5>
                                <p className="text-[11px] text-[#e8fbff]/40">{stream.desc}</p>
                              </div>
                            </div>
                          </div>
                          <div className="mt-2">
                            <div className="flex justify-between text-[10px] mb-1">
                              <span className="text-[#e8fbff]/50 font-mono">{stream.calc}</span>
                            </div>
                            <div className="h-1.5 bg-[#1a2332] rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${stream.pct}%`, backgroundColor: stream.color }} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Revenue scenarios */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="bg-gradient-to-br from-[#1a2332] to-[#0b1220] border-[#f59e0b]/30">
                    <CardContent className="p-5">
                      <h4 className="text-sm font-semibold text-[#f59e0b] mb-4">Scenario Conservativo (30% penetrazione)</h4>
                      <div className="space-y-2">
                        {[
                          { label: "Canone posteggi", value: "6.2M" },
                          { label: "10% riscossione canone unico", value: "2.0M" },
                          { label: "SCIA automatizzate", value: "0.1M" },
                          { label: "Pagamenti/transazioni", value: "0.4M" },
                          { label: "AVA Premium", value: "0.5M" },
                          { label: "Gaming/Carbon", value: "0.5M" },
                        ].map((r, i) => (
                          <div key={i} className="flex justify-between text-xs">
                            <span className="text-[#e8fbff]/50">{r.label}</span>
                            <span className="font-mono font-bold text-[#f59e0b]">{r.value} EUR</span>
                          </div>
                        ))}
                        <div className="border-t border-[#1e293b] pt-2 mt-3">
                          <div className="flex justify-between">
                            <span className="text-sm font-bold text-[#e8fbff]">ARR Totale</span>
                            <span className="text-xl font-bold font-mono text-[#f59e0b]">~9.7M EUR</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-[#1a2332] to-[#0b1220] border-[#10b981]/30">
                    <CardContent className="p-5">
                      <h4 className="text-sm font-semibold text-[#10b981] mb-4">Scenario Ottimistico (70% + servizi avanzati)</h4>
                      <div className="space-y-2">
                        {[
                          { label: "Canone posteggi + fiere", value: "29.1M" },
                          { label: "10% riscossione canone unico", value: "5.0M" },
                          { label: "SCIA + pagamenti + corsi", value: "5.1M" },
                          { label: "AVA Premium (3 app)", value: "4.0M" },
                          { label: "Hub urbani + vetrine", value: "10.0M" },
                          { label: "Paghe & contabilita'", value: "25.0M" },
                          { label: "Gaming + dati + analytics", value: "6.0M" },
                        ].map((r, i) => (
                          <div key={i} className="flex justify-between text-xs">
                            <span className="text-[#e8fbff]/50">{r.label}</span>
                            <span className="font-mono font-bold text-[#10b981]">{r.value} EUR</span>
                          </div>
                        ))}
                        <div className="border-t border-[#1e293b] pt-2 mt-3">
                          <div className="flex justify-between">
                            <span className="text-sm font-bold text-[#e8fbff]">ARR Totale</span>
                            <span className="text-xl font-bold font-mono text-[#10b981]">~84M EUR</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Billing system proof */}
                <Card className="bg-[#0b1220] border-[#1e293b]">
                  <CardContent className="p-4">
                    <h4 className="text-xs font-semibold text-[#e8fbff]/50 uppercase tracking-wider mb-3">
                      Sistema Fatturazione Automatica (billing.js) — Gia' Implementato
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {[
                        "mercati", "hub", "hub_negozio", "ava", "verbali", "suap",
                        "giornate", "wallet", "civic", "notifiche", "qualificazioni",
                        "mio_agent", "mobilita", "gaming", "carbon",
                      ].map((t, i) => (
                        <span key={i} className="text-xs px-3 py-1.5 rounded-full bg-[#1a2332] text-[#14b8a6] border border-[#14b8a6]/20 font-mono">
                          {t}
                        </span>
                      ))}
                    </div>
                    <p className="text-[10px] text-[#e8fbff]/30 mt-3">
                      15 linee di fatturazione attive — calcolo automatico basato su volumi operativi reali dal database
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ── SERVIZI PREMIUM ── */}
            {dossierSub === "premium" && (
              <div className="space-y-6">
                {[
                  {
                    title: "AVA — Assistente Virtuale Avanzato",
                    icon: Bot,
                    color: "#8b5cf6",
                    badge: "AI Premium",
                    desc: "Agente AI multi-ruolo presente in tutte e 3 le app (Dashboard PA, App Impresa, App Cittadino). Utilizza Gemini 2.5 Flash con knowledge base di 42 PDF, accesso dati in tempo reale filtrato per ruolo, e streaming SSE.",
                    features: [
                      "Chat streaming con contesto PA/impresa/cittadino",
                      "Knowledge base: normativa SUAP, Bolkestein, Direttiva Servizi",
                      "Accesso dati reali: mercati, concessioni, pagamenti, presenze",
                      "Assistente SCIA: guida compilazione pratiche passo-passo",
                      "Analytics predittive: scadenze, anomalie, trend",
                    ],
                    revenue: "5.000-20.000 utenti x 100-200 EUR/anno = 500K-4M EUR/anno",
                    backend: "ai-chat.js — 7 endpoint REST + SSE streaming",
                  },
                  {
                    title: "Gaming & Carbon Credits — Salva Italia",
                    icon: Leaf,
                    color: "#10b981",
                    badge: "Ecosistema Premiante",
                    desc: "Sistema di gamification completo che premia comportamenti sostenibili: acquisti in mercati e negozi locali, mobilita' sostenibile (bus, bici, a piedi), visite culturali (musei, monumenti), e segnalazioni civiche. Contrasta l'e-commerce valorizzando il commercio di prossimita'.",
                    features: [
                      "TCC (Token Carbon Credits) per acquisti sostenibili in mercati e hub",
                      "Mobilita' sostenibile: tracking bus, bici, a piedi con CO2 risparmiata",
                      "Cultura: check-in musei, monumenti, percorsi culturali premiati",
                      "Sfide settimanali e referral con classifica e premi",
                      "Heatmap citta' per PA: affluenza, mobilita', cultura, sicurezza",
                    ],
                    revenue: "Sponsorship PA + brand locali = 500K-2M EUR/anno",
                    backend: "gaming-rewards.js — 40+ endpoint (mobilita', cultura, shopping, sfide, heatmap)",
                  },
                  {
                    title: "Hub Urbani & Vetrina Online",
                    icon: Building2,
                    color: "#14b8a6",
                    badge: "Marketplace Locale",
                    desc: "Gestione completa degli hub urbani con vetrina digitale per ogni negozio e posteggio mercato. Il marketplace locale che compete con l'e-commerce offrendo visibilita' online ai commercianti di prossimita' con catalogo prodotti, certificazioni BIO/KM0, e navigazione diretta.",
                    features: [
                      "CRUD hub locations con geolocalizzazione e servizi",
                      "Vetrina online per ogni negozio: prodotti, foto, contatti",
                      "Certificazioni sostenibilita': BIO, KM0, artigianale",
                      "Deep-link a Route Etico per navigazione al punto vendita",
                      "Gestione multi-hub per catene e reti commerciali",
                    ],
                    revenue: "100.000 negozi x 100 EUR/anno = 10M EUR/anno",
                    backend: "hub.js — CRUD locations, shops, services con vetrina_url",
                  },
                  {
                    title: "Route Etico — Navigatore Sostenibile",
                    icon: MapPin,
                    color: "#06b6d4",
                    badge: "App Cittadino",
                    desc: "Navigatore integrato nell'app cittadino che guida verso ogni punto vendita locale. Calcola percorsi walking/bike/transit/car, mostra CO2 risparmiata e crediti guadagnati. Promuove il commercio locale premiando la mobilita' sostenibile.",
                    features: [
                      "Calcolo percorsi multi-modale (piedi, bici, bus, auto)",
                      "CO2 risparmiata e crediti gaming per ogni tragitto",
                      "Integrazione con hub urbani e vetrine online",
                      "Navigazione turn-by-turn verso mercati e negozi",
                      "Confronto impatto ambientale tra modalita' di trasporto",
                    ],
                    revenue: "Incluso nell'ecosistema gaming + sponsorship",
                    backend: "routing/calculate — multi-modal con CO2 tracking",
                  },
                  {
                    title: "Segnalatore Civico Premiante",
                    icon: Eye,
                    color: "#ef4444",
                    badge: "App Cittadino",
                    desc: "I cittadini segnalano degrado, criminalita', spazzatura e illuminazione guadagnando crediti nel sistema gaming. Le PA ricevono segnalazioni geolocalizzate in tempo reale con foto e priorita' automatica.",
                    features: [
                      "Segnalazioni con foto, GPS e categorizzazione automatica",
                      "Crediti TCC per ogni segnalazione verificata",
                      "Dashboard PA con heatmap segnalazioni in tempo reale",
                      "Tracking stato: pendente, in corso, risolto",
                      "Bonus urgenza e bonus foto per segnalazioni dettagliate",
                    ],
                    revenue: "Incluso nel canone PA + gaming ecosystem",
                    backend: "civic-reports — stats, config TCC, CRUD segnalazioni",
                  },
                  {
                    title: "Paghe & Contabilita' per Imprese",
                    icon: CreditCard,
                    color: "#f59e0b",
                    badge: "Sviluppo Futuro",
                    desc: "Con 160.000 imprese connesse, la rete puo' offrire servizi completi di paghe e contabilita' online, sostituendo progressivamente le associazioni di categoria con un canone servizi diretto o trattenendo una percentuale per ogni transazione.",
                    features: [
                      "Sostituzione associazioni con canone servizi online diretto",
                      "Oppure: percentuale su ogni transazione via associazione",
                      "Gestione quote tessera, pagamenti, fatturazione",
                      "Banca dati corsi obbligatori e qualificazioni",
                      "Segnalazioni scadenze e compliance automatiche",
                    ],
                    revenue: "50.000 imprese x 500 EUR/anno = 25M EUR/anno",
                    backend: "billing.js — 15 linee fatturazione + calcolo volumi reali",
                  },
                ].map((service, i) => (
                  <Card key={i} className="bg-[#1a2332] border-[#1e293b] overflow-hidden">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-3 rounded-xl" style={{ backgroundColor: `${service.color}15` }}>
                            <service.icon className="h-6 w-6" style={{ color: service.color }} />
                          </div>
                          <div>
                            <h4 className="text-base font-bold text-[#e8fbff]">{service.title}</h4>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full" style={{ backgroundColor: `${service.color}20`, color: service.color }}>{service.badge}</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-[#e8fbff]/60 leading-relaxed mb-4">{service.desc}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <h5 className="text-[10px] font-semibold text-[#e8fbff]/40 uppercase">Funzionalita'</h5>
                          {service.features.map((f, j) => (
                            <div key={j} className="flex items-start gap-2">
                              <CheckCircle className="h-3 w-3 mt-0.5 shrink-0" style={{ color: service.color }} />
                              <span className="text-[11px] text-[#e8fbff]/50">{f}</span>
                            </div>
                          ))}
                        </div>
                        <div className="space-y-3">
                          <div className="p-3 rounded-lg bg-[#0b1220] border border-[#1e293b]">
                            <h5 className="text-[10px] font-semibold text-[#e8fbff]/40 uppercase mb-1">Revenue Potenziale</h5>
                            <p className="text-xs font-mono" style={{ color: service.color }}>{service.revenue}</p>
                          </div>
                          <div className="p-3 rounded-lg bg-[#0b1220] border border-[#1e293b]">
                            <h5 className="text-[10px] font-semibold text-[#e8fbff]/40 uppercase mb-1">Backend Implementato</h5>
                            <p className="text-[11px] text-[#e8fbff]/50 font-mono">{service.backend}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* ── CONFORMITA' ── */}
            {dossierSub === "compliance" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="bg-[#1a2332] border-[#1e293b]">
                    <CardContent className="p-5 space-y-4">
                      <h4 className="text-sm font-semibold text-[#e8fbff] flex items-center gap-2">
                        <Shield className="h-4 w-4 text-[#a855f7]" />
                        Analisi Conformita' (25/27)
                      </h4>
                      <ScoreBar label="HTTPS & Certificati SSL" score={10} max={10} color="#10b981" />
                      <ScoreBar label="Autenticazione SSO (SPID/CIE)" score={10} max={10} color="#10b981" />
                      <ScoreBar label="Firma Digitale CAdES/PAdES" score={10} max={10} color="#10b981" />
                      <ScoreBar label="RBAC & Autorizzazione (64 EP)" score={10} max={10} color="#10b981" />
                      <ScoreBar label="Anti-Scanner & Honeypot" score={10} max={10} color="#10b981" />
                      <ScoreBar label="Cifratura PII (AES-256-GCM)" score={10} max={10} color="#10b981" />
                      <ScoreBar label="Audit Trail & Logging" score={10} max={10} color="#10b981" />
                      <ScoreBar label="GDPR Compliance (Art. 13-20)" score={10} max={10} color="#10b981" />
                      <ScoreBar label="WCAG 2.1 AA Accessibilita'" score={10} max={10} color="#10b981" />
                      <ScoreBar label="Accreditamento PA (PDND/ACN)" score={4} max={10} color="#f59e0b" />
                    </CardContent>
                  </Card>

                  <div className="space-y-4">
                    <Card className="bg-[#1a2332] border-[#1e293b]">
                      <CardContent className="p-5">
                        <h4 className="text-sm font-semibold text-[#e8fbff] flex items-center gap-2 mb-3">
                          <Zap className="h-4 w-4 text-[#f59e0b]" />
                          Metriche di Maturita'
                        </h4>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="text-center">
                            <span className="text-2xl font-bold text-[#14b8a6] font-mono">28</span>
                            <p className="text-[10px] text-[#e8fbff]/40">Sezioni Dashboard</p>
                          </div>
                          <div className="text-center">
                            <span className="text-2xl font-bold text-[#06b6d4] font-mono">36</span>
                            <p className="text-[10px] text-[#e8fbff]/40">Pagine Pubbliche</p>
                          </div>
                          <div className="text-center">
                            <span className="text-2xl font-bold text-[#f59e0b] font-mono">42</span>
                            <p className="text-[10px] text-[#e8fbff]/40">PDF Knowledge Base</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-[#1a2332] border-[#1e293b]">
                      <CardContent className="p-5">
                        <h4 className="text-sm font-semibold text-[#e8fbff] flex items-center gap-2 mb-3">
                          <Activity className="h-4 w-4 text-[#14b8a6]" />
                          Guardian Monitoring
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 rounded-lg bg-[#0b1220] text-center">
                            <p className="text-xl font-bold text-[#14b8a6] font-mono">285K+</p>
                            <p className="text-[10px] text-[#e8fbff]/40">Log totali</p>
                          </div>
                          <div className="p-3 rounded-lg bg-[#0b1220] text-center">
                            <p className="text-xl font-bold text-[#10b981] font-mono">94.3%</p>
                            <p className="text-[10px] text-[#e8fbff]/40">Success rate</p>
                          </div>
                          <div className="p-3 rounded-lg bg-[#0b1220] text-center">
                            <p className="text-xl font-bold text-[#ef4444] font-mono">16K+</p>
                            <p className="text-[10px] text-[#e8fbff]/40">Attacchi bloccati</p>
                          </div>
                          <div className="p-3 rounded-lg bg-[#0b1220] text-center">
                            <p className="text-xl font-bold text-[#06b6d4] font-mono">14</p>
                            <p className="text-[10px] text-[#e8fbff]/40">Service ID attivi</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Full compliance list */}
                <Card className="bg-[#1a2332] border-[#1e293b]">
                  <CardContent className="p-5">
                    <h4 className="text-sm font-semibold text-[#e8fbff] flex items-center gap-2 mb-4">
                      <Lock className="h-4 w-4 text-[#10b981]" />
                      Conformita' Normativa v10.15 (aggiornata 12 Maggio 2026)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[
                        { name: "GDPR — Privacy Policy", status: "ok" as const, detail: "Pagina /privacy conforme Art. 13/14" },
                        { name: "GDPR — Cookie Consent", status: "ok" as const, detail: "Banner consenso esplicito attivo" },
                        { name: "GDPR — Export Dati (Art. 20)", status: "ok" as const, detail: "Endpoint gdpr.exportMyData con 12 tabelle" },
                        { name: "GDPR — Diritto Oblio (Art. 17)", status: "ok" as const, detail: "Anonimizzazione account gdpr.deleteMyAccount" },
                        { name: "GDPR — Consenso Registrazione", status: "ok" as const, detail: "Checkbox obbligatorio in registrazione" },
                        { name: "WCAG 2.1 AA", status: "ok" as const, detail: "Skip-to-content, focus-visible, ARIA landmarks" },
                        { name: "Dichiarazione Accessibilita'", status: "ok" as const, detail: "Pagina /accessibilita conforme AgID" },
                        { name: "Security Headers (Helmet)", status: "ok" as const, detail: "CSP, HSTS, X-Frame-Options attivi" },
                        { name: "Rate Limiting", status: "ok" as const, detail: "Globale 100/15min + 4 finanziari dedicati" },
                        { name: "Anti-Scanner & Honeypot", status: "ok" as const, detail: "Ban automatico .env probe + rate-limit 404 (16K+ bloccati)" },
                        { name: "Firma Digitale CAdES/PAdES", status: "ok" as const, detail: "Verifica crittografica reale con node-forge + OpenSSL" },
                        { name: "Cifratura PII (AES-256-GCM)", status: "ok" as const, detail: "CF, PIVA, IBAN cifrati con IV random + auth tag" },
                        { name: "Anti-Frode TCC", status: "ok" as const, detail: "QR HMAC-SHA256, GPS validation, audit" },
                        { name: "RBAC Granulare (64 endpoint)", status: "ok" as const, detail: "requirePermission() middleware per permessi singoli" },
                        { name: "API Key Middleware", status: "ok" as const, detail: "Validazione X-API-Key + lastUsedAt tracking" },
                        { name: "Data Retention Policy", status: "ok" as const, detail: "90gg metrics, 365gg logs, 5y audit (obbligo legale)" },
                        { name: "CI/CD Pipeline", status: "ok" as const, detail: "GitHub Actions: check + test + build + auto-deploy" },
                        { name: "SBOM", status: "ok" as const, detail: "CycloneDX JSON generato automaticamente" },
                        { name: "PWA + Service Worker", status: "ok" as const, detail: "Installabile, offline page, manifest" },
                        { name: "Error Monitoring", status: "ok" as const, detail: "ErrorBoundary + window.error → backend" },
                        { name: "Code Splitting", status: "ok" as const, detail: "React.lazy() su 37 pagine, bundle ottimizzato" },
                        { name: "Guardian Monitoring", status: "ok" as const, detail: "285K+ log, 14 service ID, health check automatici" },
                        { name: "SSO ARPA (SPID/CIE)", status: "ok" as const, detail: "OAuth 2.0 + PKCE S256 — SPID L2 + CIE L3 attivi" },
                        { name: "PDND Interoperabilita'", status: "partial" as const, detail: "Backend pronto, 3 e-Service — in attesa accreditamento" },
                        { name: "DPIA", status: "partial" as const, detail: "Da redigere formalmente" },
                        { name: "Qualificazione ACN SaaS", status: "missing" as const, detail: "Da avviare per vendita a PA" },
                        { name: "Penetration Test", status: "missing" as const, detail: "Da commissionare a ente terzo certificato" },
                      ].map((c, i) => {
                        const st = STATUS_COLORS[c.status];
                        return (
                          <div key={i} className="p-3 rounded-lg bg-[#0b1220] border border-[#1e293b]">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-semibold text-[#e8fbff]">{c.name}</span>
                              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${st.bg} ${st.text}`}>{st.label}</span>
                            </div>
                            <p className="text-[11px] text-[#e8fbff]/40">{c.detail}</p>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ── INTEGRAZIONI PA ── */}
            {dossierSub === "integrations" && (
              <div className="space-y-6">
                <Card className="bg-[#1a2332] border-[#1e293b]">
                  <CardContent className="p-5">
                    <h4 className="text-sm font-semibold text-[#e8fbff] flex items-center gap-2 mb-4">
                      <Globe className="h-4 w-4 text-[#f59e0b]" />
                      Stato Integrazioni Piattaforme PA
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {PA_INTEGRATIONS.map((int, i) => {
                        const st = STATUS_COLORS[int.status];
                        return (
                          <div key={i} className="p-3 rounded-lg bg-[#0b1220] border border-[#1e293b]">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-semibold text-[#e8fbff]">{int.name}</span>
                              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${st.bg} ${st.text}`}>{st.label}</span>
                            </div>
                            <p className="text-[11px] text-[#e8fbff]/40">{int.detail}</p>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Open full dossier */}
                <div className="text-center pt-2">
                  <Button
                    className="bg-[#a855f7] hover:bg-[#a855f7]/80 text-white px-8 py-3 text-base"
                    onClick={() => window.open("/dossier/index.html", "_blank")}
                  >
                    <ExternalLink className="h-5 w-5 mr-2" />
                    Apri Dossier Tecnico Completo
                  </Button>
                  <p className="text-xs text-[#e8fbff]/30 mt-2">
                    12 sezioni — architettura, sicurezza, conformita' AGID/EU, valutazione economica, integrazioni PA
                  </p>
                </div>
              </div>
            )}
          </div>
        );
      }

      default:
        return null;
    }
  };

  const SIDEBAR_TABS = [
    { id: "architecture", label: "Architettura", icon: Server },
    { id: "dataflow", label: "Metriche & Codice", icon: Activity },
    { id: "database", label: "Database & Infra", icon: Database },
    { id: "components", label: "Componenti", icon: Layers },
    { id: "dossier", label: "Dossier Investitori", icon: Shield },
  ];

  const TAB_HEADERS: Record<string, { title: string; subtitle: string }> = {
    architecture: {
      title: "Panoramica Architetturale",
      subtitle:
        "Struttura ad alto livello del sistema MIO HUB — 6 moduli core, 270K+ righe di codice.",
    },
    dataflow: {
      title: "Metriche di Sistema — 270.391 LOC",
      subtitle:
        "Analisi quantitativa completa: backend, frontend, endpoint, commit e complessita'.",
    },
    database: {
      title: "Database & Infrastruttura",
      subtitle:
        "MySQL/TiDB su Hetzner — 21 tabelle — hosting Vercel + Hetzner VPS.",
    },
    components: {
      title: "Componenti Frontend — 173 React",
      subtitle:
        "React 19 + Vite 7 + TypeScript + Tailwind CSS + shadcn/ui — 157.839 righe.",
    },
    dossier: {
      title: "Dossier Tecnico per Investitori",
      subtitle:
        "Conformita' normativa, valutazione economica, integrazioni PA e roadmap.",
    },
  };

  const currentHeader = TAB_HEADERS[activeTab] || TAB_HEADERS.architecture;

  return (
    <div className="flex h-[850px] bg-[#0b1220] rounded-xl border border-[#1e293b] overflow-hidden">
      {/* ─── Sidebar ─────────────────────────────────────────── */}
      <div className="w-64 bg-[#1a2332] border-r border-[#1e293b] flex flex-col shrink-0">
        <div className="p-6 border-b border-[#1e293b]">
          <h2 className="text-xl font-bold text-[#e8fbff] flex items-center gap-2">
            <Activity className="h-6 w-6 text-[#a855f7]" />
            Analisi Sistema
          </h2>
          <p className="text-xs text-[#e8fbff]/50 mt-1">
            MIO HUB — Report Tecnico v10.14
          </p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {SIDEBAR_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? tab.id === "dossier"
                    ? "bg-[#a855f7]/10 text-[#a855f7] ring-1 ring-[#a855f7]/30"
                    : "bg-[#a855f7]/10 text-[#a855f7]"
                  : "text-[#e8fbff]/70 hover:bg-[#e8fbff]/5 hover:text-[#e8fbff]"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              {tab.id === "dossier" && activeTab !== "dossier" && (
                <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-[#a855f7]/20 text-[#a855f7]">
                  NEW
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-[#1e293b] space-y-2">
          <Button
            variant="outline"
            className="w-full border-[#a855f7]/30 text-[#a855f7] hover:bg-[#a855f7]/10"
            onClick={() => window.open("/dossier/index.html", "_blank")}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Dossier Completo
          </Button>
          <Button
            variant="outline"
            className="w-full border-[#06b6d4]/30 text-[#06b6d4] hover:bg-[#06b6d4]/10"
            onClick={() =>
              window.open(
                "https://github.com/Chcndr/mihub-backend-rest/blob/master/MASTER_BLUEPRINT_MIOHUB.md",
                "_blank"
              )
            }
          >
            <Download className="h-4 w-4 mr-2" />
            Master Blueprint
          </Button>
        </div>
      </div>

      {/* ─── Main Content ────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto bg-[#0b1220] p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#e8fbff] mb-2">
              {currentHeader.title}
            </h1>
            <p className="text-[#e8fbff]/60">{currentHeader.subtitle}</p>
          </div>
          {renderContent()}
        </div>
      </div>
    </div>
  );
});
