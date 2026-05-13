import React, {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useMemo,
} from "react";
import { PanicButton } from "@/components/PanicButton";
import { useLocation } from "wouter";
import { useAnimation } from "@/contexts/AnimationContext";
import {
  Users,
  TrendingUp,
  Store,
  ShoppingCart,
  Leaf,
  MapPin,
  Activity,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  ArrowDown,
  ArrowUpCircle,
  ArrowDownCircle,
  Bike,
  Car,
  Bus,
  Footprints,
  Zap,
  Package,
  Globe,
  Award,
  Calendar,
  Clock,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Download,
  FileText,
  Bot,
  Send,
  Shield,
  Lock,
  UserCheck,
  Terminal,
  Bug,
  Code,
  Wrench,
  RefreshCw,
  Coins,
  DollarSign,
  Wallet,
  Settings,
  Sliders,
  TrendingDown,
  Building2,
  GraduationCap,
  Target,
  TrendingUpDown,
  Briefcase,
  Radio,
  CloudRain,
  Wind,
  UserCog,
  ClipboardCheck,
  Scale,
  Bell,
  BellRing,
  Navigation,
  Train,
  ParkingCircle,
  TrafficCone,
  FileBarChart,
  Plug,
  SettingsIcon,
  Euro,
  Newspaper,
  Rocket,
  XCircle,
  Lightbulb,
  MessageSquare,
  Brain,
  Calculator,
  ExternalLink,
  StopCircle,
  Search,
  Filter,
  Plus,
  Landmark,
  BookOpen,
  Star,
  FileCheck,
  HandCoins,
  Mail,
  MailOpen,
  Home,
  Gamepad2,
  Heart,
  CreditCard,
  ClipboardList,
  Edit2,
  Trash2,
  Eye,
  ChevronDown,
  ChevronUp,
  CalendarDays,
  ListTodo,
  Video,
  Users2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import MobilityMap from "@/components/MobilityMap";
import GestioneMercati from "@/components/GestioneMercati";
import Integrazioni from "@/components/Integrazioni";
import { GISMap } from "@/components/GISMap";
import { MarketMapComponent } from "@/components/MarketMapComponent";
import CivicReportsHeatmap from "@/components/CivicReportsHeatmap";
import { CivicReportsProvider } from "@/contexts/CivicReportsContext";
import SuapPanel from "@/components/SuapPanel";
import SciaForm from "@/components/suap/SciaForm";
import DomandaSpuntaForm from "@/components/suap/DomandaSpuntaForm";
import PiattaformePA from "@/components/PiattaformePA";

import MIOAgent from "@/components/MIOAgent";
import { LogsSectionReal, DebugSectionReal } from "@/components/LogsDebugReal";
import GuardianLogsSection from "@/components/GuardianLogsSection";
import ImpreseQualificazioniPanel from "@/components/ImpreseQualificazioniPanel";
import { MarketCompaniesTab } from "@/components/markets/MarketCompaniesTab";
import { NativeReportComponent } from "@/components/NativeReportComponent";
import { LegacyReportCards } from "@/components/LegacyReportCards";
import {
  MultiAgentChatView,
  type AgentMessage,
} from "@/components/multi-agent/MultiAgentChatView";
import { SharedWorkspace } from "@/components/SharedWorkspace";
import { AIChatPanel } from "@/components/ai-chat/AIChatPanel";
import NotificationsPanel from "@/components/NotificationsPanel";
import ComuniPanel from "@/components/ComuniPanel";
import AssociazioniPanel from "@/components/AssociazioniPanel";
import PresenzeAssociatiPanel from "@/components/PresenzeAssociatiPanel";
import AnagraficaAssociazionePanel from "@/components/AnagraficaAssociazionePanel";
import SchedaPubblicaPanel from "@/components/SchedaPubblicaPanel";
import WalletAssociazionePanel from "@/components/WalletAssociazionePanel";
import GestioneServiziAssociazionePanel from "@/components/GestioneServiziAssociazionePanel";
import GestioneCorsiAssociazionePanel from "@/components/GestioneCorsiAssociazionePanel";
import WalletPanel from "@/components/WalletPanel";
import SecurityTab from "@/components/SecurityTab";
import FraudMonitorPanel from "@/components/FraudMonitorPanel";
import ClientiTab from "@/components/ClientiTab";
import GestioneHubPanel from "@/components/GestioneHubPanel";
import GestioneHubMapWrapper from "@/components/GestioneHubMapWrapper";
import { useTransport } from "@/contexts/TransportContext";
import ControlliSanzioniPanel from "@/components/ControlliSanzioniPanel";
import CivicReportsPanel from "@/components/CivicReportsPanel";
import GamingRewardsPanel from "@/components/GamingRewardsPanel";
import { BusHubEditor } from "@/components/bus-hub";
import { ProtectedTab, ProtectedQuickAccess } from "@/components/ProtectedTab";
import { usePermissions } from "@/contexts/PermissionsContext";
import { MessageContent } from "@/components/MessageContent";
import { callOrchestrator } from "@/api/orchestratorClient";
import {
  sendAgentMessage,
  AgentChatMessage,
} from "@/lib/mioOrchestratorClient";
import {
  sendDirectMessageToHetzner,
  DirectMioMessage,
} from "@/lib/DirectMioClient";
import { sendToAgent } from "@/lib/agentHelper";
import { toast } from "sonner";
import {
  isAssociazioneImpersonation,
  addComuneIdToUrl,
  authenticatedFetch,
  getImpersonationParams,
} from "@/hooks/useImpersonation";

// 👻 GHOSTBUSTER: MioChatMessage sostituito con DirectMioMessage
// 🔥 FORCE REBUILD: 2024-12-20 12:46 - Fix agentName filter removed from single chats
type MioChatMessage = DirectMioMessage;
import { getLogs, getLogsStats, getGuardianHealth } from "@/api/logsClient";
// import { useInternalTraces } from '@/hooks/useInternalTraces'; // TODO: implementare hook
import { useConversationPersistence } from "@/hooks/useConversationPersistence";
import { useAgentLogs } from "@/hooks/useAgentLogs";
import { useMio } from "@/contexts/MioContext";
import { useSystemStatus } from "@/hooks/useSystemStatus";
import { MIHUB_API_BASE_URL } from "@/config/api";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// API TCC Carbon Credit — in produzione usa proxy Vercel (/api/tcc/* → api.mio-hub.me)
const TCC_API = import.meta.env.DEV ? "https://api.mio-hub.me" : "";

// Hook per dati reali da backend (REST — tRPC rimosso in FASE 1 stacco backend)
function useDashboardData() {
  // Fetch stats overview dal backend REST MIHUB
  const [statsOverview, setStatsOverview] = useState<any>(null);
  const [statsRealtime, setStatsRealtime] = useState<any>(null);
  const [statsGrowth, setStatsGrowth] = useState<any>(null);
  const [statsQualificazione, setStatsQualificazione] = useState<any>(null);
  const [formazioneStats, setFormazioneStats] = useState<any>(null);
  const [bandiStats, setBandiStats] = useState<any>(null);

  useEffect(() => {
    const MIHUB_API =
      import.meta.env.VITE_MIHUB_API_BASE_URL || "https://api.mio-hub.me/api";

    // Se impersonificazione associazione, carica stats globali (senza filtro comune)
    // ma non caricare stats specifiche (qualificazione, formazione, bandi)
    const isAssocImpersonation = isAssociazioneImpersonation();

    // Leggi comune_id dall'URL se in modalità impersonificazione comune
    const urlParams = new URLSearchParams(window.location.search);
    const comuneId = urlParams.get("comune_id");
    const isImpersonating = urlParams.get("impersonate") === "true";

    // Costruisci query string per filtro comune (solo per comuni, non per associazioni)
    const comuneFilter =
      comuneId && isImpersonating && !isAssocImpersonation
        ? `?comune_id=${comuneId}`
        : "";

    // Fetch overview globali (sempre, anche per associazioni)
    fetch(`${MIHUB_API}/stats/overview${comuneFilter}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStatsOverview(data.data);
        }
      })
      .catch(err => console.error("Stats overview fetch error:", err));

    // Fetch realtime
    fetch(`${MIHUB_API}/stats/realtime`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStatsRealtime(data.data);
        }
      })
      .catch(err => console.error("Stats realtime fetch error:", err));

    // Fetch growth
    fetch(`${MIHUB_API}/stats/growth`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStatsGrowth(data.data);
        }
      })
      .catch(err => console.error("Stats growth fetch error:", err));

    // Per associazioni: qualificazione non pertinente, formazione e bandi sì
    // Costruisci filtro associazione_id per le fetch dei tab Enti
    const assocIdParam = isAssocImpersonation
      ? urlParams.get("associazione_id")
      : null;
    const assocFilter = assocIdParam ? `?associazione_id=${assocIdParam}` : "";
    const assocFilterAnd = assocIdParam
      ? `&associazione_id=${assocIdParam}`
      : "";

    // Fetch qualificazione (Tab Imprese) - solo se NON impersonificazione associazione
    if (!isAssocImpersonation)
      fetch(`${MIHUB_API}/stats/qualificazione/overview`)
        .then(res => res.json())
        .then(async data => {
          if (data.success) {
            // Fetch anche scadenze, demografia, top-imprese, indici
            const [scadenzeRes, demografiaRes, topImpreseRes, indiciRes] =
              await Promise.all([
                fetch(`${MIHUB_API}/stats/qualificazione/scadenze`).then(r =>
                  r.json()
                ),
                fetch(`${MIHUB_API}/stats/qualificazione/demografia`).then(r =>
                  r.json()
                ),
                fetch(`${MIHUB_API}/stats/qualificazione/top-imprese`).then(r =>
                  r.json()
                ),
                fetch(`${MIHUB_API}/stats/qualificazione/indici`).then(r =>
                  r.json()
                ),
              ]);

            setStatsQualificazione({
              overview: data.data,
              scadenze: scadenzeRes.success ? scadenzeRes.data : [],
              demografia: demografiaRes.success ? demografiaRes.data : null,
              topImprese: topImpreseRes.success ? topImpreseRes.data : [],
              indici: indiciRes.success ? indiciRes.data : null,
            });
          }
        })
        .catch(err => console.error("Stats qualificazione fetch error:", err));

    // Fetch formazione stats (enti formatori e corsi)
    fetch(`${MIHUB_API}/formazione/stats${assocFilter}`)
      .then(res => res.json())
      .then(async data => {
        if (data.success) {
          // Fetch anche lista enti, corsi e iscrizioni
          const [entiRes, corsiRes, iscrizioniRes] = await Promise.all([
            fetch(`${MIHUB_API}/formazione/enti`).then(r => r.json()),
            fetch(`${MIHUB_API}/formazione/corsi${assocFilter}`).then(r => r.json()),
            fetch(`${MIHUB_API}/formazione/iscrizioni/stats${assocFilter}`).then(r =>
              r.json()
            ),
          ]);

          setFormazioneStats({
            stats: data.data,
            enti: entiRes.success ? entiRes.data : [],
            corsi: corsiRes.success ? corsiRes.data : [],
            iscrizioni: iscrizioniRes.success ? iscrizioniRes.data : null,
          });
        }
      })
      .catch(err => console.error("Formazione stats fetch error:", err));

    // Fetch bandi stats (associazioni e catalogo bandi)
    fetch(`${MIHUB_API}/bandi/stats`)
      .then(res => res.json())
      .then(async data => {
        if (data.success) {
          // Fetch anche lista associazioni, bandi, servizi, richieste e regolarità
          const [
            assocRes,
            catalogoRes,
            serviziRes,
            richiesteRes,
            regolaritaRes,
          ] = await Promise.all([
            fetch(`${MIHUB_API}/bandi/associazioni`).then(r => r.json()),
            fetch(`${MIHUB_API}/bandi/catalogo`).then(r => r.json()),
            fetch(`${MIHUB_API}/bandi/servizi${assocFilter}`).then(r =>
              r.json()
            ),
            fetch(`${MIHUB_API}/bandi/richieste/stats`).then(r => r.json()),
            fetch(`${MIHUB_API}/bandi/regolarita/stats`).then(r => r.json()),
          ]);

          setBandiStats({
            stats: data.data,
            associazioni: assocRes.success ? assocRes.data : [],
            catalogo: catalogoRes.success ? catalogoRes.data : [],
            servizi: serviziRes.success ? serviziRes.data : [],
            richieste: richiesteRes.success ? richiesteRes.data : null,
            regolarita: regolaritaRes.success ? regolaritaRes.data : null,
          });
        }
      })
      .catch(err => console.error("Bandi stats fetch error:", err));
  }, []);

  // Overview dai dati REST
  const combinedOverview = useMemo(() => {
    if (statsOverview) {
      return {
        totalUsers: statsOverview.utenti_totali || 0,
        userGrowth: 0,
        activeMarkets: statsOverview.mercati_attivi || 0,
        totalShops: statsOverview.hub || 0,
        totalTransactions: statsOverview.transazioni || 0,
        transactionGrowth: 0,
        sustainabilityRating: statsOverview.rating_sostenibilita || 0,
        co2Saved: statsOverview.tcc?.total_redeemed || 0,
        vendors: statsOverview.vendors || 0,
        stalls: statsOverview.stalls || 0,
        comuni: statsOverview.comuni || 0,
        imprese: statsOverview.imprese || 0,
        totale_associati: statsOverview.totale_associati || 0,
        autorizzazioni: statsOverview.autorizzazioni || 0,
        domande_spunta: statsOverview.domande_spunta || 0,
        tcc: statsOverview.tcc || {},
        today: statsOverview.today || {},
      };
    }
    return null;
  }, [statsOverview]);

  return {
    overview: combinedOverview,
    markets: [] as any[],
    shops: [] as any[],
    isLoading: !statsOverview,
    statsOverview: statsOverview,
    statsRealtime: statsRealtime,
    statsGrowth: statsGrowth,
    statsQualificazione: statsQualificazione,
    formazioneStats: formazioneStats,
    bandiStats: bandiStats,
  };
}

// Mock data fallback per UI development
const mockData = {
  overview: {
    totalUsers: 15847,
    userGrowth: 8.5,
    activeMarkets: 12,
    totalShops: 156,
    totalTransactions: 24150,
    transactionGrowth: 12.3,
    sustainabilityRating: 7.8,
    co2Saved: 4654,
  },
  usersGrowth: [
    { date: "01 Gen", users: 14500, new: 120 },
    { date: "08 Gen", users: 14850, new: 135 },
    { date: "15 Gen", users: 15200, new: 148 },
    { date: "22 Gen", users: 15550, new: 152 },
    { date: "29 Gen", users: 15847, new: 165 },
  ],
  transport: [
    {
      mode: "A piedi",
      count: 6500,
      percentage: 41.0,
      co2: 0,
      color: "#10b981",
    },
    {
      mode: "Bicicletta",
      count: 3200,
      percentage: 20.2,
      co2: 1280,
      color: "#14b8a6",
    },
    { mode: "Bus", count: 2800, percentage: 17.7, co2: 1680, color: "#06b6d4" },
    { mode: "Auto", count: 2500, percentage: 15.8, co2: 0, color: "#ef4444" },
    {
      mode: "Elettrico",
      count: 847,
      percentage: 5.3,
      co2: 1694,
      color: "#8b5cf6",
    },
  ],
  topMarkets: [
    {
      name: "Mercato Centrale Grosseto",
      visits: 12500,
      users: 4200,
      duration: 35,
      rank: 1,
    },
    {
      name: "Mercato Follonica Mare",
      visits: 8900,
      users: 3100,
      duration: 28,
      rank: 2,
    },
    {
      name: "Mercato Orbetello Centro",
      visits: 5200,
      users: 2100,
      duration: 32,
      rank: 3,
    },
    {
      name: "Mercato Castiglione",
      visits: 3800,
      users: 1500,
      duration: 25,
      rank: 4,
    },
    {
      name: "Mercato Marina di Grosseto",
      visits: 2900,
      users: 1200,
      duration: 22,
      rank: 5,
    },
  ],
  categories: [
    {
      name: "Frutta e Verdura",
      purchases: 8500,
      percentage: 35.2,
      bio: 68.5,
      color: "#10b981",
    },
    {
      name: "Formaggi e Latticini",
      purchases: 4200,
      percentage: 17.4,
      bio: 52.1,
      color: "#f59e0b",
    },
    {
      name: "Pane e Dolci",
      purchases: 3800,
      percentage: 15.7,
      bio: 41.2,
      color: "#ef4444",
    },
    {
      name: "Carne e Pesce",
      purchases: 2980,
      percentage: 12.3,
      bio: 38.5,
      color: "#ec4899",
    },
    {
      name: "Altro",
      purchases: 4670,
      percentage: 19.4,
      bio: 25.8,
      color: "#8b5cf6",
    },
  ],
  certifications: [
    { type: "BIO", count: 12500, percentage: 51.8, color: "#10b981" },
    { type: "KM0", count: 9800, percentage: 40.6, color: "#14b8a6" },
    { type: "DOP/IGP", count: 4500, percentage: 18.6, color: "#f59e0b" },
    { type: "Fair Trade", count: 2100, percentage: 8.7, color: "#8b5cf6" },
  ],
  ecommerceVsPhysical: {
    ecommerce: { purchases: 18000, percentage: 40.0, co2: 54000, avgCo2: 3.0 },
    physical: { purchases: 27000, percentage: 60.0, co2: 8100, avgCo2: 0.3 },
    co2Savings: 45900,
  },
  productOrigin: {
    local: { count: 75000, percentage: 60.0, avgDistance: 15, avgCo2: 0.2 },
    national: { count: 35000, percentage: 28.0, avgDistance: 450, avgCo2: 1.5 },
    eu: { count: 10000, percentage: 8.0, avgDistance: 1200, avgCo2: 3.5 },
    extraEu: { count: 5000, percentage: 4.0, avgDistance: 8500, avgCo2: 12.0 },
  },
  realtime: {
    activeUsers: 342,
    activeVendors: 87,
    todayCheckins: 124,
    todayTransactions: 456,
    systemStatus: {
      api: "operational",
      database: "operational",
      redis: "operational",
      tpas: "standby",
    },
  },
  logs: [
    {
      id: 1,
      timestamp: "2025-11-07 11:25:43",
      app: "APP Clienti",
      type: "check-in",
      level: "info",
      user: "mario.rossi@email.com",
      message: "Check-in Mercato Centrale Grosseto",
      ip: "192.168.1.45",
    },
    {
      id: 2,
      timestamp: "2025-11-07 11:24:12",
      app: "APP Operatori",
      type: "vendita",
      level: "info",
      user: "operatore.bio@dms.it",
      message: "Vendita prodotto BIO - 50 carbon credits assegnati",
      ip: "192.168.1.102",
    },
    {
      id: 3,
      timestamp: "2025-11-07 11:23:05",
      app: "DMS Backend",
      type: "error",
      level: "error",
      user: "system",
      message: "Database connection timeout - retry 3/3",
      ip: "10.0.0.5",
    },
    {
      id: 4,
      timestamp: "2025-11-07 11:22:18",
      app: "WebApp PM",
      type: "route",
      level: "info",
      user: "giulia.bianchi@email.com",
      message: "Percorso ottimizzato calcolato: 3 stop, 2.5km",
      ip: "192.168.1.78",
    },
    {
      id: 5,
      timestamp: "2025-11-07 11:21:30",
      app: "APP Clienti",
      type: "segnalazione",
      level: "warning",
      user: "luca.verdi@email.com",
      message: "Segnalazione civica: Rifiuti non raccolti",
      ip: "192.168.1.92",
    },
  ],
  security: {
    totalAccesses: 15847,
    failedLogins: 23,
    activeUsers: 342,
    suspiciousActivity: 2,
    lastAudit: "2025-11-06 23:00:00",
    vulnerabilities: { critical: 0, high: 1, medium: 3, low: 5 },
  },
  debug: {
    errors: { total: 12, resolved: 8, pending: 4 },
    performance: { avgResponseTime: 145, p95: 320, p99: 580 },
    healthChecks: {
      api: "healthy",
      database: "healthy",
      redis: "healthy",
      storage: "healthy",
    },
    deployments: {
      lastDeploy: "2025-11-06 18:30:00",
      version: "v2.1.3",
      status: "stable",
    },
  },
  carbonCredits: {
    fund: {
      balance: 125000,
      currency: "EUR",
      sources: [
        { name: "Regione Toscana", amount: 80000, date: "2025-10-01" },
        { name: "Comune Grosseto", amount: 30000, date: "2025-10-15" },
        { name: "Sponsor Privati", amount: 15000, date: "2025-11-01" },
      ],
      expenses: { reimbursements: 45000, incentives: 12000, operations: 3000 },
      burnRate: 8500,
      monthsRemaining: 7.8,
    },
    value: {
      current: 1.5,
      history: [
        { date: "2025-09-01", value: 1.2 },
        { date: "2025-10-01", value: 1.35 },
        { date: "2025-11-01", value: 1.5 },
      ],
      byArea: [
        { area: "Grosseto", value: 1.5, boost: 0 },
        { area: "Follonica", value: 1.35, boost: -10 },
        { area: "Orbetello", value: 1.65, boost: +10 },
      ],
      byCategory: [
        { category: "BIO", boost: 20, finalValue: 1.8 },
        { category: "KM0", boost: 15, finalValue: 1.73 },
        { category: "DOP/IGP", boost: 10, finalValue: 1.65 },
        { category: "Standard", boost: 0, finalValue: 1.5 },
      ],
    },
    reimbursements: {
      pending: { count: 23, amount: 8450 },
      processed: { count: 156, amount: 45000 },
      topShops: [
        { name: "Bio Market Centrale", credits: 12500, euros: 18750 },
        { name: "Ortofrutta KM0", credits: 8900, euros: 13350 },
        { name: "Formaggi Toscani", credits: 6200, euros: 9300 },
      ],
    },
    analytics: {
      issued: 125000,
      spent: 78000,
      velocity: 62.4,
      roi: { invested: 125000, co2Saved: 4654, costPerKg: 26.85 },
    },
  },
  businesses: {
    total: 450,
    fullyCompliant: 320,
    partiallyCompliant: 95,
    nonCompliant: 35,
    avgScore: 78.5,
    atRiskSuspension: 12,
    demographics: {
      openings: 45,
      closures: 12,
      netGrowth: 33,
      growthRate: 7.9,
      byGender: { male: 280, female: 150, company: 20 },
      byAge: { "18-30": 45, "31-45": 180, "46-60": 180, "60+": 45 },
      byOrigin: { native: 380, italian: 50, foreign: 20 },
    },
    indices: {
      requalification: 72.5,
      digitalization: 68.3,
      sustainability: 75.8,
    },
    expiringDocs: [
      { business: "Bio Market Centrale", doc: "DURC", days: 5, critical: true },
      { business: "Ortofrutta KM0", doc: "HACCP", days: 12, critical: false },
      {
        business: "Formaggi Toscani",
        doc: "Antincendio",
        days: 18,
        critical: false,
      },
      {
        business: "Macelleria Grosseto",
        doc: "Primo Soccorso",
        days: 25,
        critical: false,
      },
    ],
    training: {
      completed: 285,
      scheduled: 45,
      avgCost: 350,
      topTrainers: [
        { name: "Safety Training Toscana", courses: 85, rating: 4.8 },
        { name: "Formazione Sicurezza SRL", courses: 62, rating: 4.6 },
        { name: "Academy HACCP", courses: 48, rating: 4.7 },
      ],
    },
    grants: {
      active: 8,
      applications: 45,
      approved: 28,
      successRate: 62.2,
      avgAmount: 12500,
      topGrants: [
        {
          title: "Digitalizzazione PMI 2025",
          applicants: 15,
          approved: 10,
          amount: 150000,
        },
        {
          title: "Formazione Sicurezza",
          applicants: 12,
          approved: 9,
          amount: 45000,
        },
        {
          title: "Sostenibilità Imprese",
          applicants: 10,
          approved: 6,
          amount: 85000,
        },
      ],
    },
    topScoring: [
      {
        name: "Bio Market Centrale",
        score: 98,
        sector: "Alimentare",
        digitalization: 95,
      },
      {
        name: "Ortofrutta KM0",
        score: 96,
        sector: "Alimentare",
        digitalization: 92,
      },
      {
        name: "Formaggi Toscani",
        score: 94,
        sector: "Alimentare",
        digitalization: 88,
      },
      {
        name: "Artigianato Locale",
        score: 91,
        sector: "Artigianato",
        digitalization: 85,
      },
      {
        name: "Macelleria Grosseto",
        score: 89,
        sector: "Alimentare",
        digitalization: 82,
      },
    ],
  },
  // Nuove sezioni
  civicReports: {
    total: 127,
    pending: 45,
    inProgress: 38,
    resolved: 44,
    byType: [
      { type: "Rifiuti", count: 35, percentage: 27.6 },
      { type: "Illuminazione", count: 28, percentage: 22.0 },
      { type: "Strade", count: 24, percentage: 18.9 },
      { type: "Verde pubblico", count: 22, percentage: 17.3 },
      { type: "Altro", count: 18, percentage: 14.2 },
    ],
    recent: [
      {
        id: 1,
        type: "Rifiuti",
        description: "Cassonetti pieni",
        status: "pending",
        date: "2025-11-07",
        user: "Cliente",
        location: "Via Roma",
      },
      {
        id: 2,
        type: "Illuminazione",
        description: "Lampione rotto",
        status: "in_progress",
        date: "2025-11-06",
        user: "Commerciante",
        location: "Piazza Dante",
      },
      {
        id: 3,
        type: "Strade",
        description: "Buca pericolosa",
        status: "pending",
        date: "2025-11-06",
        user: "Cliente",
        location: "Corso Italia",
      },
    ],
  },
  iotSensors: {
    airQuality: {
      pm10: 28.5,
      pm25: 15.2,
      no2: 35.8,
      status: "good",
      lastUpdate: "2025-11-07 13:00",
    },
    weather: {
      temp: 18.5,
      humidity: 65,
      pressure: 1015,
      wind: 12.5,
    },
    sensors: [
      {
        id: 1,
        name: "Centro Storico",
        type: "Aria",
        status: "online",
        pm10: 28.5,
      },
      {
        id: 2,
        name: "Mercato Centrale",
        type: "Aria",
        status: "online",
        pm10: 32.1,
      },
      { id: 3, name: "Marina", type: "Aria", status: "offline", pm10: null },
    ],
  },
  businessUsers: {
    total: 156,
    active: 142,
    inactive: 14,
    byCategory: [
      { category: "Alimentari", count: 65, revenue: 125000 },
      { category: "Artigianato", count: 38, revenue: 85000 },
      { category: "Servizi", count: 28, revenue: 62000 },
      { category: "Altro", count: 25, revenue: 45000 },
    ],
    topUsers: [
      { name: "Bio Market Centrale", sales: 2850, credits: 1250, rating: 4.9 },
      { name: "Ortofrutta KM0", sales: 2340, credits: 980, rating: 4.8 },
      { name: "Formaggi Toscani", sales: 1920, credits: 850, rating: 4.7 },
    ],
  },
  inspections: {
    scheduled: 28,
    completed: 156,
    violations: 12,
    fines: 8,
    totalFines: 15000,
    upcoming: [
      {
        id: 1,
        business: "Macelleria Rossi",
        type: "HACCP",
        date: "2025-11-10",
        inspector: "M. Bianchi",
      },
      {
        id: 2,
        business: "Panificio Centro",
        type: "Sicurezza",
        date: "2025-11-12",
        inspector: "L. Verdi",
      },
      {
        id: 3,
        business: "Bar Piazza",
        type: "DURC",
        date: "2025-11-15",
        inspector: "A. Rossi",
      },
    ],
    violationsList: [
      {
        id: 1,
        business: "Ristorante Mare",
        type: "HACCP",
        fine: 2000,
        status: "paid",
        date: "2025-10-28",
      },
      {
        id: 2,
        business: "Negozio Abbigliamento",
        type: "Sicurezza",
        fine: 1500,
        status: "pending",
        date: "2025-11-02",
      },
    ],
  },
  notifications: {
    sent: 2450,
    delivered: 2380,
    opened: 1850,
    clicked: 920,
    openRate: 77.7,
    clickRate: 38.7,
    recent: [
      {
        id: 1,
        title: "Nuovo mercato aperto",
        type: "push",
        sent: 1250,
        opened: 980,
        date: "2025-11-06",
      },
      {
        id: 2,
        title: "Scadenza DURC",
        type: "email",
        sent: 45,
        opened: 38,
        date: "2025-11-05",
      },
      {
        id: 3,
        title: "Promozione carbon credits",
        type: "sms",
        sent: 850,
        opened: 720,
        date: "2025-11-04",
      },
    ],
  },
  mobility: {
    busLines: 12,
    totalBusStops: 85,
    activeBuses: 28,
    passengers: 3450,
    parkingSpots: 1200,
    parkingOccupied: 850,
    parkingAvailable: 350,
    stops: [
      {
        id: 1,
        name: "Stazione FS",
        line: "1, 3, 5",
        nextBus: "3 min",
        passengers: 15,
      },
      {
        id: 2,
        name: "Piazza Dante",
        line: "2, 4",
        nextBus: "8 min",
        passengers: 8,
      },
      {
        id: 3,
        name: "Mercato Centrale",
        line: "1, 2, 6",
        nextBus: "12 min",
        passengers: 22,
      },
    ],
    traffic: [
      { road: "Via Aurelia", status: "heavy", incidents: 1 },
      { road: "Corso Carducci", status: "moderate", incidents: 0 },
      { road: "Via Senese", status: "light", incidents: 0 },
    ],
  },
};

export default function DashboardPA() {
  const [location, setLocation] = useLocation();
  const { loading: permissionsLoading, canViewTab } = usePermissions();

  // Guard: se i permessi sono caricati e l'utente non puo' vedere nemmeno il tab 'dashboard',
  // redirect alla home (e' un cittadino o utente senza permessi PA)
  useEffect(() => {
    if (!permissionsLoading && !canViewTab("dashboard")) {
      console.warn("[DashboardPA] Utente senza permessi PA — redirect a /");
      setLocation("/");
    }
  }, [permissionsLoading, canViewTab, setLocation]);

  // MIO TEST: chcndr@gmail.com su smartphone → redirect a dashboard impresa
  useEffect(() => {
    const MOBILE_BREAKPOINT = 768;
    if (window.innerWidth >= MOBILE_BREAKPOINT) return;
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) return;
      const user = JSON.parse(userStr);
      if (user.email === "chcndr@gmail.com") {
        console.warn(
          "[DashboardPA] MIO TEST: redirect mobile a /dashboard-impresa"
        );
        window.location.href = "/dashboard-impresa";
        return;
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Ripristino conversation_id storico (senza reload pagina)
  useEffect(() => {
    const TARGET_ID = "dfab3001-0969-4d6d-93b5-e6f69eecb794";
    if (localStorage.getItem("mihub_global_conversation_id") !== TARGET_ID) {
      localStorage.setItem("mihub_global_conversation_id", TARGET_ID);
    }
  }, []);

  // Dati reali dal backend MIHUB
  const realData = useDashboardData();

  // Dati GTFS reali dal TransportContext (MIHUB_API_BASE_URL/api/gtfs)
  const {
    stops: gtfsStops,
    stats: gtfsStats,
    loadStats: loadGtfsStats,
    isLoading: gtfsLoading,
  } = useTransport();

  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [realtimeData, setRealtimeData] = useState(mockData.realtime);
  // Leggi tab da URL params (es. ?tab=mappa)
  const urlParams = new URLSearchParams(window.location.search);
  const tabFromUrl = urlParams.get("tab");
  const [activeTab, setActiveTab] = useState(tabFromUrl || "dashboard");

  // Modalità impersonificazione: nascondi tab admin
  const isImpersonating = urlParams.get("impersonate") === "true";
  const comuneIdFromUrl = urlParams.get("comune_id");
  const comuneNomeFromUrl = urlParams.get("comune_nome");

  const [dashboardSubTab, setDashboardSubTab] = useState<
    "overview" | "mercati"
  >("overview");
  const [sistemaSubTab, setSistemaSubTab] = useState<"logs" | "debug">("logs");
  const [walletSubTab, setWalletSubTab] = useState<"wallet" | "pagopa">(
    "wallet"
  );
  const [docsSubTab, setDocsSubTab] = useState<string>("formazione");

  // Listener per navigazione dalla scheda associato alla pratica SCIA
  useEffect(() => {
    const handleNavigateToPratica = () => {
      // Switcha al tab Enti & Associazioni e al sotto-tab SCIA & Pratiche
      setActiveTab("docs");
      setDocsSubTab("scia-pratiche");
    };
    const handleNavigateToConcessione = () => {
      setActiveTab("docs");
      setDocsSubTab("scia-pratiche");
    };
    const handleNavigateToDomandaSpuntaForm = () => {
      // Switcha al tab Enti & Associazioni e al sotto-tab SCIA & Pratiche
      setActiveTab("docs");
      setDocsSubTab("scia-pratiche");
    };
    const handleNavigateToSciaForm = () => {
      // Switcha al tab SCIA & Pratiche per gestire la richiesta SCIA
      setActiveTab("docs");
      setDocsSubTab("scia-pratiche");
    };
    window.addEventListener("navigate-to-pratica", handleNavigateToPratica);
    window.addEventListener(
      "navigate-to-concessione",
      handleNavigateToConcessione
    );
    window.addEventListener(
      "navigate-to-domanda-spunta-form",
      handleNavigateToDomandaSpuntaForm
    );
    window.addEventListener(
      "navigate-to-scia-form",
      handleNavigateToSciaForm
    );
    return () => {
      window.removeEventListener(
        "navigate-to-pratica",
        handleNavigateToPratica
      );
      window.removeEventListener(
        "navigate-to-concessione",
        handleNavigateToConcessione
      );
      window.removeEventListener(
        "navigate-to-domanda-spunta-form",
        handleNavigateToDomandaSpuntaForm
      );
      window.removeEventListener(
        "navigate-to-scia-form",
        handleNavigateToSciaForm
      );
    };
  }, []);

  const [walletSearch, setWalletSearch] = useState("");
  const [selectedWallet, setSelectedWallet] = useState<number | null>(null);

  // Leva Politica: TCC assegnati per €10 spesi (range 0-30, default 10)
  const [tccValue, setTccValue] = useState(10); // Valore diretto: 10 = 10 TCC per €10

  // Carbon Credits - Simulatore completo
  const [editableParams, setEditableParams] = useState({
    fundBalance: 0,
    burnRate: 0,
    tccIssued: 0,
    tccSpent: 0,
    areaBoosts: [
      { area: "Grosseto", boost: 0 },
      { area: "Follonica", boost: -10 },
      { area: "Orbetello", boost: +10 },
    ],
    categoryBoosts: [
      { category: "BIO", boost: 20 },
      { category: "KM0", boost: 15 },
      { category: "DOP/IGP", boost: 10 },
      { category: "Standard", boost: 0 },
    ],
  });

  // Calcola valori dinamici basati su slider e boost
  const calculateAreaValues = () => {
    return editableParams.areaBoosts.map(item => ({
      ...item,
      value: tccValue * (1 + item.boost / 100),
    }));
  };

  const calculateCategoryValues = () => {
    return editableParams.categoryBoosts.map(item => ({
      ...item,
      finalValue: tccValue * (1 + item.boost / 100),
    }));
  };

  // Funzione per formattazione italiana numeri (punto migliaia, virgola decimali)
  const formatNumberIT = (
    num: number | string | undefined | null,
    decimals: number = 0
  ): string => {
    if (num === undefined || num === null || isNaN(Number(num))) return "0";
    const n = typeof num === "string" ? parseFloat(num) : num;
    return n.toLocaleString("it-IT", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  // Funzione per formattazione euro
  const formatEuroIT = (
    num: number | string | undefined | null,
    decimals: number = 2
  ): string => {
    if (num === undefined || num === null || isNaN(Number(num))) return "€0,00";
    const n = typeof num === "string" ? parseFloat(num) : num;
    return (
      "€" +
      n.toLocaleString("it-IT", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })
    );
  };

  const calculateMonthsRemaining = () => {
    if (editableParams.burnRate === 0) return "999";
    return formatNumberIT(
      editableParams.fundBalance / editableParams.burnRate,
      1
    );
  };

  const calculateVelocity = () => {
    if (editableParams.tccIssued === 0) return 0;
    return ((editableParams.tccSpent / editableParams.tccIssued) * 100).toFixed(
      1
    );
  };

  const calculateReimbursementNeeded = () => {
    // Rimborsi = TCC spesi × valore TCC in euro (€0,089)
    return (editableParams.tccSpent * appliedTccValue).toFixed(2);
  };

  // NUOVA FORMULA: 1 TCC = 1 kg CO2 (basato su EU ETS: 1 TCC rappresenta 1 kg di CO2)
  const CO2_PER_TCC = 1; // 1 TCC = 1 kg CO2
  // 1 albero assorbe circa 22 kg CO₂ all'anno (fonte: USDA)
  const CO2_PER_TREE = 22;

  const calculateCO2Saved = () => {
    // TCC riscattati = kg CO2 evitata
    return (editableParams.tccSpent * CO2_PER_TCC).toFixed(0);
  };

  const calculateTreesEquivalent = () => {
    const co2Saved = parseFloat(calculateCO2Saved());
    return (co2Saved / CO2_PER_TREE).toFixed(1);
  };

  // Chat AI
  const [chatMessages, setChatMessages] = useState<
    Array<{ role: "user" | "ai"; content: string }>
  >([]);
  const [chatInput, setChatInput] = useState("");
  const [appliedTccValue, setAppliedTccValue] = useState(0.089); // Valore TCC in euro (€0,089 basato su EU ETS)

  // Guardian Logs for MIO Agent tab
  const [guardianLogs, setGuardianLogs] = useState<any[]>([]);

  // Fund TCC Stats - Dati reali dal backend
  const [fundStats, setFundStats] = useState<any>(null);
  const [fundLoading, setFundLoading] = useState(true);
  const [fundMovementFilter, setFundMovementFilter] = useState<
    "all" | "deposit" | "reimbursement"
  >("all");

  // TCC v2.1 - Comuni e Regole
  const [tccComuni, setTccComuni] = useState<any[]>([]);
  const [selectedComuneId, setSelectedComuneId] = useState<number | null>(null);
  const [tccRules, setTccRules] = useState<any[]>([]);
  const [tccRulesLoading, setTccRulesLoading] = useState(false);

  // TCC v2.1 - Environment Data (Meteo, Qualità Aria, ETS)
  const [envData, setEnvData] = useState<any>(null);
  const [envLoading, setEnvLoading] = useState(false);
  const [editableEtsPrice, setEditableEtsPrice] = useState<number>(89.56);

  // Documentation Modal state
  const [docModalContent, setDocModalContent] = useState<{
    title: string;
    content: string;
  } | null>(null);

  // Statistiche Imprese
  const [impreseStats, setImpreseStats] = useState({
    total: 0,
    concessioni: 0,
    comuni: 0,
    media: "0",
  });

  // Carica lista comuni con hub attivo (TCC v2.1)
  useEffect(() => {
    const loadComuni = async () => {
      try {
        const response = await fetch(`${TCC_API}/api/tcc/v2/comuni`);
        const data = await response.json();
        if (data.success && data.comuni) {
          setTccComuni(data.comuni);
          // Imposta il comune di default (primo con area definita, es. Grosseto)
          if (data.default_hub_id && !selectedComuneId) {
            setSelectedComuneId(data.default_hub_id);
          } else if (data.comuni.length > 0 && !selectedComuneId) {
            setSelectedComuneId(data.comuni[0].hub_id);
          }
        }
      } catch (error) {
        console.error("Error loading comuni:", error);
      }
    };
    loadComuni();
  }, []);

  // Carica regole boost per il comune selezionato (TCC v2.1)
  useEffect(() => {
    const loadRules = async () => {
      if (!selectedComuneId) return;
      try {
        setTccRulesLoading(true);
        const response = await fetch(
          `${TCC_API}/api/tcc/v2/rules?comune_id=${selectedComuneId}`
        );
        const data = await response.json();
        if (data.success && data.rules) {
          setTccRules(data.rules);
          // Aggiorna i boost editabili con i dati reali
          const areaRules = data.rules.filter((r: any) => r.type === "area");
          const categoryRules = data.rules.filter(
            (r: any) => r.type === "category"
          );
          setEditableParams(prev => ({
            ...prev,
            areaBoosts:
              areaRules.length > 0
                ? areaRules.map((r: any) => ({
                    area: r.name,
                    boost: (parseFloat(r.multiplier_boost) - 1) * 100,
                    ruleId: r.id,
                  }))
                : prev.areaBoosts,
            categoryBoosts:
              categoryRules.length > 0
                ? categoryRules.map((r: any) => ({
                    category: r.value,
                    boost: (parseFloat(r.multiplier_boost) - 1) * 100,
                    ruleId: r.id,
                  }))
                : prev.categoryBoosts,
          }));
        }
      } catch (error) {
        console.error("Error loading TCC rules:", error);
      } finally {
        setTccRulesLoading(false);
      }
    };
    loadRules();
  }, [selectedComuneId]);

  // Carica dati ambientali per l'hub selezionato (TCC v2.1 - Environment)
  useEffect(() => {
    const fetchEnvironmentData = async () => {
      if (!selectedComuneId) return;
      setEnvLoading(true);
      try {
        const response = await fetch(
          `${TCC_API}/api/tcc/v2/environment/${selectedComuneId}`
        );
        const data = await response.json();
        if (data.success) {
          setEnvData(data);
          setEditableEtsPrice(data.ets?.price_per_tonne || 89.56);
        }
      } catch (error) {
        console.error("Error fetching environment data:", error);
      } finally {
        setEnvLoading(false);
      }
    };
    fetchEnvironmentData();
  }, [selectedComuneId]);

  // Funzione per aggiornare il prezzo ETS
  const handleEtsPriceUpdate = async () => {
    if (!editableEtsPrice || editableEtsPrice <= 0) return;
    try {
      const response = await authenticatedFetch(
        `${TCC_API}/api/tcc/v2/ets-price`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ets_price: editableEtsPrice,
            notes: "Aggiornamento manuale da dashboard",
          }),
        }
      );
      const data = await response.json();
      if (data.success && selectedComuneId) {
        // Ricarica i dati ambientali per aggiornare il valore TCC
        const envResponse = await fetch(
          `${TCC_API}/api/tcc/v2/environment/${selectedComuneId}`
        );
        const envData = await envResponse.json();
        if (envData.success) {
          setEnvData(envData);
        }
      }
    } catch (error) {
      console.error("Error updating ETS price:", error);
    }
  };

  // Carica statistiche fondo TCC NAZIONALI (endpoint originale senza comune)
  useEffect(() => {
    const loadFundStats = async () => {
      try {
        setFundLoading(true);
        // Usa l'endpoint originale per le statistiche nazionali
        const [statsResponse, transactionsResponse] = await Promise.all([
          fetch(`${TCC_API}/api/tcc/v2/fund/stats`),
          fetch(`${TCC_API}/api/tcc/v2/fund/transactions?limit=500`),
        ]);
        const statsData = await statsResponse.json();
        const transactionsData = await transactionsResponse.json();

        if (statsData.success) {
          // Combina stats con transactions
          const fundWithTransactions = {
            ...statsData.fund,
            transactions: transactionsData.success
              ? transactionsData.transactions
              : [],
          };
          setFundStats(fundWithTransactions);
          // Aggiorna anche i parametri editabili con i dati reali
          setEditableParams(prev => ({
            ...prev,
            tccIssued: statsData.fund.total_issued || 0,
            tccSpent: statsData.fund.total_redeemed || 0,
            fundBalance: parseFloat(statsData.fund.fund_requirement_eur || "0"), // Fabbisogno fondo in euro
          }));
          // Aggiorna il valore TCC applicato dalla config nazionale
          if (statsData.fund.config?.tcc_value) {
            setAppliedTccValue(parseFloat(statsData.fund.config.tcc_value));
          }
          // Aggiorna la leva politica (policy_multiplier)
          if (statsData.fund.config?.policy_multiplier) {
            // policy_multiplier = TCC per €10 spesi (valore diretto)
            setTccValue(parseFloat(statsData.fund.config.policy_multiplier));
          }
        }
      } catch (error) {
        console.error("Error loading fund stats:", error);
      } finally {
        setFundLoading(false);
      }
    };
    loadFundStats();
    // Refresh ogni 30 secondi
    const interval = setInterval(loadFundStats, 30000);
    return () => clearInterval(interval);
  }, []); // Carica una volta all'avvio, non dipende dal comune selezionato

  // Carica statistiche imprese (REST leggero + fallback tRPC)
  useEffect(() => {
    fetch(addComuneIdToUrl("/api/imprese?stats_only=true"))
      .then(r => r.json())
      .then(data => {
        if (data.success && data.stats) {
          // Endpoint ottimizzato: restituisce solo stats senza payload 2.2MB
          setImpreseStats(data.stats);
        } else if (data.success && data.data) {
          // Fallback: se il backend non supporta stats_only, calcola client-side
          const imprese = data.data;
          const totalConcessioni = imprese.reduce(
            (acc: number, i: any) => acc + (i.concessioni_attive?.length || 0),
            0
          );
          const comuniUnici = Array.from(
            new Set(imprese.map((i: any) => i.comune).filter(Boolean))
          ).length;
          const media =
            imprese.length > 0
              ? (totalConcessioni / imprese.length).toFixed(1)
              : "0";
          setImpreseStats({
            total: imprese.length,
            concessioni: totalConcessioni,
            comuni: comuniUnici,
            media,
          });
        }
      })
      .catch(err =>
        console.error("Error loading imprese stats from REST:", err)
      );
  }, []);

  // Fallback: usa dati overview REST se la chiamata /api/imprese fallisce
  useEffect(() => {
    if (impreseStats.total === 0 && realData.overview) {
      setImpreseStats({
        total: realData.overview.imprese || realData.overview.totalShops || 0,
        concessioni: realData.overview.autorizzazioni || 0,
        comuni: realData.overview.comuni || 0,
        media: "0",
      });
    }
  }, [realData.overview, impreseStats.total]);

  // Multi-Agent Chat state
  const [showMultiAgentChat, setShowMultiAgentChat] = useState(true); // 🎯 FIX: Mostra Vista 4 Agenti di default
  const [selectedAgent, setSelectedAgent] = useState<
    "mio" | "gptdev" | "manus" | "abacus" | "zapier"
  >("gptdev");
  const [viewMode, setViewMode] = useState<"single" | "quad">("quad"); // 🎯 FIX: Vista 4 Agenti come default

  // 🔥 MIO Agent Chat state - USA CONTEXT CONDIVISO!
  const [mioInputValue, setMioInputValue] = useState("");
  const [showMioScrollButton, setShowMioScrollButton] = useState(false);
  const mioMessagesRef = useRef<HTMLDivElement>(null);
  const [showSingleChatScrollButton, setShowSingleChatScrollButton] =
    useState(false);
  const singleChatMessagesRef = useRef<HTMLDivElement>(null);

  // 🔥 CONTEXT CONDIVISO: Stato MIO dal Context
  const {
    messages: mioMessages,
    conversationId: mioMainConversationId,
    isLoading: mioSending,
    error: mioSendError,
    sendMessage: sendMioMessage,
    setConversationId: setMioMainConversationId,
    stopGeneration,
  } = useMio();

  // 👥 DOPPIO CANALE - Vista Singola usa user-{agent}-direct
  const {
    conversationId: manusConversationId,
    setConversationId: setManusConversationId,
  } = useConversationPersistence("user-manus-direct");
  const {
    conversationId: abacusConversationId,
    setConversationId: setAbacusConversationId,
  } = useConversationPersistence("user-abacus-direct");
  const {
    conversationId: zapierConversationId,
    setConversationId: setZapierConversationId,
  } = useConversationPersistence("user-zapier-direct");
  const {
    conversationId: gptdevConversationId,
    setConversationId: setGptdevConversationId,
  } = useConversationPersistence("user-gptdev-direct");

  // 🔥 4 Conversazioni separate per MIO (una per ogni agente)
  const {
    conversationId: mioManusConversationId,
    setConversationId: setMioManusConversationId,
  } = useConversationPersistence("mio-manus-coordination");
  const {
    conversationId: mioAbacusConversationId,
    setConversationId: setMioAbacusConversationId,
  } = useConversationPersistence("mio-abacus-coordination");
  const {
    conversationId: mioZapierConversationId,
    setConversationId: setMioZapierConversationId,
  } = useConversationPersistence("mio-zapier-coordination");
  const {
    conversationId: mioGptdevConversationId,
    setConversationId: setMioGptdevConversationId,
  } = useConversationPersistence("mio-gptdev-coordination");

  // Variabili di compatibilità per non rompere il resto del codice
  const mioLoading = false;
  const mioError = null; // Converti formato per compatibilità
  // Rimosso: vecchia conversione mioMessages da useAgentLogs

  // ========== VISTA 4 AGENTI (READ-ONLY) - LAZY LOAD ==========
  // 🔥 CARICAMENTO CONDIZIONALE: Questi hook si attivano SOLO quando viewMode === 'quad'
  // Questo previene duplicati al refresh quando si è in vista singola
  const { messages: gptdevQuadMessages, loading: gptdevQuadLoading } =
    useAgentLogs({
      conversationId: viewMode === "quad" ? mioGptdevConversationId : null, // 🔥 Chat MIO ↔ GPT Dev (isolata)
      agentName: "gptdev",
      enablePolling: viewMode === "quad",
      excludeUserMessages: true, // 🔥 Solo coordinamento MIO ↔ GPT Dev
    });

  const { messages: manusQuadMessages, loading: manusQuadLoading } =
    useAgentLogs({
      conversationId: viewMode === "quad" ? mioManusConversationId : null, // 🔥 Chat MIO ↔ Manus (isolata)
      agentName: "manus",
      enablePolling: viewMode === "quad",
      excludeUserMessages: true, // 🔥 Solo coordinamento MIO ↔ Manus
    });

  const { messages: abacusQuadMessages, loading: abacusQuadLoading } =
    useAgentLogs({
      conversationId: viewMode === "quad" ? mioAbacusConversationId : null, // 🔥 Chat MIO ↔ Abacus (isolata)
      agentName: "abacus",
      enablePolling: viewMode === "quad",
      excludeUserMessages: true, // 🔥 Solo coordinamento MIO ↔ Abacus
    });

  const { messages: zapierQuadMessages, loading: zapierQuadLoading } =
    useAgentLogs({
      conversationId: viewMode === "quad" ? mioZapierConversationId : null, // 🔥 Chat MIO ↔ Zapier (isolata)
      agentName: "zapier",
      enablePolling: viewMode === "quad",
      excludeUserMessages: true, // 🔥 Solo coordinamento MIO ↔ Zapier
    });

  // ========== VISTA SINGOLA AGENTI - Usa conversationId separati ==========
  // Questi hook gestiscono le 4 chat isolate (GPT Dev, Manus, Abacus, Zapier)
  const {
    messages: manusMessagesRaw,
    setMessages: setManusMessages,
    loading: manusLoading,
    error: manusError,
    refetch: refetchManus,
  } = useAgentLogs({
    conversationId: manusConversationId,
    // 🔥 FIX: Rimosso agentName per caricare TUTTI i messaggi (user + assistant)
    // Il conversation_id 'user-manus-direct' è già sufficiente
  });

  const manusMessages = manusMessagesRaw.map(msg => ({
    role: msg.role as "user" | "assistant" | "system",
    content: msg.content, // Backend ora restituisce già 'content'
    agent: msg.agent_name,
    sender: msg.sender, // 🔥 FIX: Aggiungo sender per distinguere MIO da Utente (rebuild 20/12/2024)
    created_at: msg.created_at, // 🕒 FIX: Aggiungo timestamp per mostrare orario
    pending: msg.pending, // Preserva flag pending per Optimistic UI
  }));

  // Hook separato per Abacus (vista singola isolata)
  const {
    messages: abacusMessagesRaw,
    setMessages: setAbacusMessages,
    loading: abacusLoading,
    error: abacusError,
    refetch: refetchAbacus,
  } = useAgentLogs({
    conversationId: abacusConversationId,
    // 🔥 FIX: Rimosso agentName per caricare TUTTI i messaggi (user + assistant)
    // Il conversation_id 'user-abacus-direct' è già sufficiente
  });

  const abacusMessages = abacusMessagesRaw.map(msg => ({
    role: msg.role as "user" | "assistant" | "system",
    content: msg.content, // Backend ora restituisce già 'content'
    agent: msg.agent_name,
    sender: msg.sender, // 🔥 FIX: Aggiungo sender per distinguere MIO da Utente (rebuild 20/12/2024)
    created_at: msg.created_at, // 🕒 FIX: Aggiungo timestamp per mostrare orario
    pending: msg.pending, // Preserva flag pending per Optimistic UI
  }));

  // Hook separato per Zapier (vista singola isolata)
  const {
    messages: zapierMessagesRaw,
    setMessages: setZapierMessages,
    loading: zapierLoading,
    error: zapierError,
    refetch: refetchZapier,
  } = useAgentLogs({
    conversationId: zapierConversationId,
    // 🔥 FIX: Rimosso agentName per caricare TUTTI i messaggi (user + assistant)
    // Il conversation_id 'user-zapier-direct' è già sufficiente
  });

  // Hook separato per GPT Developer (vista singola isolata)
  const {
    messages: gptdevMessagesRaw,
    setMessages: setGptdevMessages,
    loading: gptdevLoading,
    error: gptdevError,
    refetch: refetchGptdev,
  } = useAgentLogs({
    conversationId: gptdevConversationId,
    // 🔥 FIX: Rimosso agentName per caricare TUTTI i messaggi (user + assistant)
    // Il conversation_id 'user-gptdev-direct' è già sufficiente
  });

  const gptdevMessages = gptdevMessagesRaw.map(msg => ({
    role: msg.role as "user" | "assistant" | "system",
    content: msg.content, // Backend ora restituisce già 'content'
    agent: msg.agent_name,
    sender: msg.sender, // 🔥 FIX: Aggiungo sender per distinguere MIO da Utente (rebuild 20/12/2024)
    created_at: msg.created_at, // 🕒 FIX: Aggiungo timestamp per mostrare orario
    pending: msg.pending, // Preserva flag pending per Optimistic UI
  }));

  const zapierMessages = zapierMessagesRaw.map(msg => ({
    role: msg.role as "user" | "assistant" | "system",
    content: msg.content, // Backend ora restituisce già 'content'
    agent: msg.agent_name,
    sender: msg.sender, // 🔥 FIX: Aggiungo sender per distinguere MIO da Utente (rebuild 20/12/2024)
    created_at: msg.created_at, // 🕒 FIX: Aggiungo timestamp per mostrare orario
    pending: msg.pending, // Preserva flag pending per Optimistic UI
  }));

  const [gptdevInputValue, setGptdevInputValue] = useState("");
  const [manusInputValue, setManusInputValue] = useState("");
  const [abacusInputValue, setAbacusInputValue] = useState("");
  const [zapierInputValue, setZapierInputValue] = useState("");

  // Stati di loading per invio messaggi agenti singoli
  const [gptdevSending, setGptdevSending] = useState(false);
  const [manusSending, setManusSending] = useState(false);
  const [abacusSending, setAbacusSending] = useState(false);
  const [zapierSending, setZapierSending] = useState(false);

  // Rimosso: mioSendingLoading e mioSendingError (ora usati mioSending e mioSendError)

  // Internal traces per Vista 4 agenti (dialoghi MIO ↔ Agenti)
  const [internalTracesMessages, setInternalTracesMessages] = useState<
    Array<{
      from: string;
      to: string;
      message: string;
      timestamp: string;
      meta?: any;
    }>
  >([]);

  // ♾️ CHAT ETERNA: Un UUID generato UNA VOLTA e salvato PER SEMPRE
  const [currentConversationId, setCurrentConversationId] = useState<
    string | null
  >(null);

  // Carica o genera l'ID FISSO al mount
  useEffect(() => {
    // Helper: Valida UUID v4
    const isValidUUID = (uuid: string): boolean => {
      return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        uuid
      );
    };

    // 1. Cerca un ID esistente nel localStorage ("cassetto" del browser)
    let storedId = localStorage.getItem("mihub_global_conversation_id");

    // 2. Se non c'è (o è vecchio/invalido), ne crea uno NUOVO e lo salva PER SEMPRE
    if (!storedId || !isValidUUID(storedId)) {
      storedId = crypto.randomUUID(); // Genera UUID valido
      localStorage.setItem("mihub_global_conversation_id", storedId);
      console.warn("[DashboardPA] Nuovo conversation_id generato:", storedId);
    } else {
      // Conversation_id esistente caricato
    }

    // 3. Usa quell'ID. Punto.
    setCurrentConversationId(storedId);
  }, []);

  // Hook per fetching automatico internalTraces
  // const { traces: fetchedTraces } = useInternalTraces(currentConversationId, 3000); // TODO: implementare hook
  const fetchedTraces: any[] = []; // Placeholder

  // ELIMINATO: loadChatHistory() - causava 404 su endpoint inesistenti
  // useAgentLogs gestisce automaticamente il caricamento della cronologia

  // Salva internalTraces in localStorage ogni volta che cambiano
  useEffect(() => {
    if (internalTracesMessages.length > 0) {
      localStorage.setItem(
        "mihub_internal_traces",
        JSON.stringify(internalTracesMessages)
      );
    }
  }, [internalTracesMessages]);

  // Merge fetchedTraces con internalTracesMessages
  useEffect(() => {
    if (fetchedTraces.length > 0) {
      setInternalTracesMessages(prev => {
        const existingKeys = new Set(
          prev.map(t => `${t.timestamp}-${t.from}-${t.to}`)
        );
        const newTraces = fetchedTraces.filter(
          t => !existingKeys.has(`${t.timestamp}-${t.from}-${t.to}`)
        );
        return [...prev, ...newTraces];
      });
    }
  }, [fetchedTraces]);

  // 🔔 NOTIFICHE STATE - Sistema bidirezionale PA/Associazioni ↔ Imprese
  const [notificheStats, setNotificheStats] = useState<any>(null);
  const [notificheRisposte, setNotificheRisposte] = useState<any[]>([]);
  const [notificheRisposteEnti, setNotificheRisposteEnti] = useState<any[]>([]);
  const [notificheRisposteAssoc, setNotificheRisposteAssoc] = useState<any[]>(
    []
  );
  const [mercatiList, setMercatiList] = useState<any[]>([]);
  const [hubList, setHubList] = useState<any[]>([]);
  const [impreseList, setImpreseList] = useState<any[]>([]);
  const [invioNotificaLoading, setInvioNotificaLoading] = useState(false);
  const [entiTargetTipo, setEntiTargetTipo] = useState("TUTTI");
  const [entiCorsoDettagliAperti, setEntiCorsoDettagliAperti] = useState(false);
  const [entiCorsoModalita, setEntiCorsoModalita] = useState<"ONLINE" | "SEDE">("ONLINE");
  const [entiCorsoPiattaforma, setEntiCorsoPiattaforma] = useState<"A99X" | "ESTERNO">("A99X");
  const [entiCorsoLink, setEntiCorsoLink] = useState("");
  const [entiCorsoSede, setEntiCorsoSede] = useState("");
  const [assocTargetTipo, setAssocTargetTipo] = useState("TUTTI");
  const [assocCorsoDettagliAperti, setAssocCorsoDettagliAperti] = useState(false);
  const [assocCorsoModalita, setAssocCorsoModalita] = useState<"ONLINE" | "SEDE">("ONLINE");
  const [assocCorsoPiattaforma, setAssocCorsoPiattaforma] = useState<"A99X" | "ESTERNO">("A99X");
  const [assocCorsoLink, setAssocCorsoLink] = useState("");
  const [assocCorsoSede, setAssocCorsoSede] = useState("");
  const [selectedNotifica, setSelectedNotifica] = useState<any>(null);
  const [expandedMessaggioId, setExpandedMessaggioId] = useState<string | null>(null);
  const [notificheNonLette, setNotificheNonLette] = useState(0);
  const [filtroMessaggiEnti, setFiltroMessaggiEnti] = useState<
    "tutti" | "inviati" | "ricevuti"
  >("tutti");
  const [filtroMessaggiAssoc, setFiltroMessaggiAssoc] = useState<
    "tutti" | "inviati" | "ricevuti"
  >("tutti");
  const [messaggiInviatiEnti, setMessaggiInviatiEnti] = useState<any[]>([]);
  const [messaggiInviatiAssoc, setMessaggiInviatiAssoc] = useState<any[]>([]);

  // A99X Agenda Intelligente - State
  const [a99xRiunioni, setA99xRiunioni] = useState<any[]>([]);
  const [a99xTask, setA99xTask] = useState<any[]>([]);
  const [a99xNuovaRiunione, setA99xNuovaRiunione] = useState(false);
  const [a99xFormTitolo, setA99xFormTitolo] = useState('');
  const [a99xFormDescrizione, setA99xFormDescrizione] = useState('');
  const [a99xFormData, setA99xFormData] = useState('');
  const [a99xFormDurata, setA99xFormDurata] = useState('30');
  const [a99xFormTipo, setA99xFormTipo] = useState('INTERNA');
  const [a99xFormModalita, setA99xFormModalita] = useState('ONLINE');
  const [a99xFormU, setA99xFormU] = useState('3');
  const [a99xFormI, setA99xFormI] = useState('3');
  const [a99xFormD, setA99xFormD] = useState('1');
  const [a99xFormS, setA99xFormS] = useState('1');

  // A99X Sotto-tab e nuovi moduli
  const [a99xSubTab, setA99xSubTab] = useState<'dashboard' | 'calendario' | 'disponibilita' | 'prenotazioni' | 'assessori' | 'invita'>('dashboard');
  // Invita Riunione state
  const [a99xInvitaSearch, setA99xInvitaSearch] = useState('');
  const [a99xInvitaResults, setA99xInvitaResults] = useState<any[]>([]);
  const [a99xInvitaSelezionati, setA99xInvitaSelezionati] = useState<any[]>([]);
  const [a99xInvitaForm, setA99xInvitaForm] = useState({ titolo: '', descrizione: '', data_inizio: '', durata_minuti: '30', modalita: 'ONLINE', sede_indirizzo: '', urgenza: '3', importanza: '3', dipendenze: '1', stakeholder: '1', temi: '' });
  const [a99xInvitaLoading, setA99xInvitaLoading] = useState(false);
  const [a99xInvitaSuccesso, setA99xInvitaSuccesso] = useState<any>(null);
  // Inviti ricevuti + popup notifica
  const [a99xInvitiRicevuti, setA99xInvitiRicevuti] = useState<any[]>([]);
  const [a99xInvitoPopup, setA99xInvitoPopup] = useState<any>(null);
  const [a99xPrenotazioni, setA99xPrenotazioni] = useState<any[]>([]);
  const [a99xDisponibilita, setA99xDisponibilita] = useState<any[]>([]);
  const [a99xAssessori, setA99xAssessori] = useState<any[]>([]);
  const [a99xCalendarioVista, setA99xCalendarioVista] = useState<'settimana' | 'mese'>('settimana');
  const [a99xCalendarioData, setA99xCalendarioData] = useState(new Date());
  const [a99xNuovaDisp, setA99xNuovaDisp] = useState(false);
  const [a99xNuovoAssessore, setA99xNuovoAssessore] = useState(false);
  const [a99xDispForm, setA99xDispForm] = useState({ proprietario_nome: '', giorno_settimana: '1', ora_inizio: '09:00', ora_fine: '13:00', durata_slot_minuti: '30', max_prenotazioni_slot: '1', modalita: 'PRESENZA', sede_indirizzo: '' });
  const [a99xAssForm, setA99xAssForm] = useState({ nome: '', cognome: '', ruolo: '', email: '', telefono: '', settore: '' });

  // Fetch inviti ricevuti
  const fetchA99xInviti = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://api.miohub.it';
      const cId = comuneIdFromUrl || '1';
      const resp = await fetch(`${apiUrl}/api/a99x/inviti-ricevuti?comune_id=${cId}`);
      if (resp.ok) {
        const data = await resp.json();
        if (data.success && data.data) {
          setA99xInvitiRicevuti(data.data);
          // Mostra popup per inviti pendenti
          const pendenti = data.data.filter((i: any) => i.partecipante_stato === 'INVITATO');
          if (pendenti.length > 0) {
            setA99xInvitoPopup(pendenti[0]);
            setTimeout(() => setA99xInvitoPopup(null), 10000);
          }
        }
      }
    } catch (err) { console.warn('Errore fetch inviti:', err); }
  };

  // Ricerca contatti per invito
  const searchA99xContatti = async (query: string) => {
    if (query.length < 2) { setA99xInvitaResults([]); return; }
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://api.miohub.it';
      const cId = comuneIdFromUrl || '1';
      const resp = await fetch(`${apiUrl}/api/a99x/ricerca-contatti?q=${encodeURIComponent(query)}&comune_id=${cId}`);
      if (resp.ok) {
        const data = await resp.json();
        if (data.success) setA99xInvitaResults(data.data || []);
      }
    } catch (err) { console.warn('Errore ricerca contatti:', err); }
  };

  // Invia invito riunione
  const inviaA99xRiunione = async () => {
    if (!a99xInvitaForm.titolo || !a99xInvitaForm.data_inizio || a99xInvitaSelezionati.length === 0) return;
    setA99xInvitaLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://api.miohub.it';
      const cId = comuneIdFromUrl || '1';
      const body = {
        comune_id: parseInt(cId),
        titolo: a99xInvitaForm.titolo,
        descrizione: a99xInvitaForm.descrizione,
        temi: a99xInvitaForm.temi ? a99xInvitaForm.temi.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
        data_inizio: a99xInvitaForm.data_inizio,
        durata_minuti: parseInt(a99xInvitaForm.durata_minuti) || 30,
        modalita: a99xInvitaForm.modalita,
        sede_indirizzo: a99xInvitaForm.sede_indirizzo,
        urgenza: parseInt(a99xInvitaForm.urgenza) || 3,
        importanza: parseInt(a99xInvitaForm.importanza) || 3,
        dipendenze: parseInt(a99xInvitaForm.dipendenze) || 1,
        stakeholder: parseInt(a99xInvitaForm.stakeholder) || 1,
        creato_da_nome: 'PA',
        creato_da_tipo: 'PA',
        invitati: a99xInvitaSelezionati.map((s: any) => ({ tipo: s.tipo, id: s.id, nome: s.nome, email: s.email, telefono: s.telefono }))
      };
      const resp = await fetch(`${apiUrl}/api/a99x/invita-riunione`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (resp.ok) {
        const data = await resp.json();
        if (data.success) {
          setA99xInvitaSuccesso(data.data);
          setA99xInvitaSelezionati([]);
          setA99xInvitaForm({ titolo: '', descrizione: '', data_inizio: '', durata_minuti: '30', modalita: 'ONLINE', sede_indirizzo: '', urgenza: '3', importanza: '3', dipendenze: '1', stakeholder: '1', temi: '' });
          setA99xInvitaSearch('');
          setA99xInvitaResults([]);
        }
      }
    } catch (err) { console.error('Errore invio invito:', err); }
    setA99xInvitaLoading(false);
  };

  // Accetta/Rifiuta invito dal calendario
  const rispondiA99xInvito = async (token: string, azione: 'accetta' | 'rifiuta') => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://api.miohub.it';
      await fetch(`${apiUrl}/api/a99x/invito/${token}/${azione}`);
      fetchA99xInviti();
      fetchA99xData();
    } catch (err) { console.warn('Errore risposta invito:', err); }
  };

  const fetchA99xData = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://api.miohub.it';
      const cId = comuneIdFromUrl || '1';
      const [riunioniRes, taskRes, prenRes, dispRes, assRes] = await Promise.all([
        fetch(`${apiUrl}/api/a99x/riunioni?comune_id=${cId}`),
        fetch(`${apiUrl}/api/a99x/task?comune_id=${cId}`),
        fetch(`${apiUrl}/api/a99x/prenotazioni?comune_id=${cId}`).catch(() => null),
        fetch(`${apiUrl}/api/a99x/disponibilita?comune_id=${cId}`).catch(() => null),
        fetch(`${apiUrl}/api/a99x/assessori?comune_id=${cId}`).catch(() => null)
      ]);
      const riunioniData = await riunioniRes.json();
      const taskData = await taskRes.json();
      if (riunioniData.success) setA99xRiunioni(riunioniData.data || []);
      if (taskData.success) setA99xTask(taskData.data || []);
      if (prenRes) { const d = await prenRes.json(); if (d.success) setA99xPrenotazioni(d.data || []); }
      if (dispRes) { const d = await dispRes.json(); if (d.success) setA99xDisponibilita(d.data || []); }
      if (assRes) { const d = await assRes.json(); if (d.success) setA99xAssessori(d.data || []); }
    } catch (err) {
      console.error('Errore fetch A99X:', err);
    }
  };

  // Fetch A99X data on mount
  React.useEffect(() => {
    fetchA99xData();
    fetchA99xInviti();
  }, [comuneIdFromUrl]);

  const espandiMessaggiInviatiPerImpresa = (messaggi: any[] = []) =>
    messaggi.flatMap((m: any) => {
      const dettagli = Array.isArray(m.destinatari_dettaglio)
        ? m.destinatari_dettaglio
        : [];
      if (dettagli.length === 0) {
        return [
          {
            ...m,
            destinatari: m.totale_destinatari || 0,
            lette: m.letti || 0,
          },
        ];
      }
      return dettagli.map((d: any, idx: number) => ({
        ...m,
        destinatario_impresa_id: d.impresa_id,
        destinatario_impresa_nome: d.impresa_nome || `Impresa #${d.impresa_id}`,
        destinatario_stato: d.stato,
        destinatario_data_lettura: d.data_lettura,
        destinatari_totali: m.totale_destinatari || dettagli.length,
        destinatari: 1,
        lette: d.stato === "LETTO" ? 1 : 0,
        _rigaDestinatario: true,
        _rowKey: `${m.id}-${d.impresa_id || "dest"}-${idx}`,
      }));
    });

  // --- SCIA & Pratiche (Associazioni) --- gestito interamente da SuapPanel mode="associazione"

  // Funzione per segnare una risposta come letta
  const segnaRispostaComeLetta = async (risposta: any) => {
    if (risposta.letta) return; // Già letta
    const MIHUB_API =
      import.meta.env.VITE_MIHUB_API_BASE_URL || "https://api.mio-hub.me/api";
    try {
      await authenticatedFetch(
        `${MIHUB_API}/notifiche/risposte/${risposta.id}/letta`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
        }
      );
      // Aggiorna stato locale
      if (risposta.target_tipo === "ENTE_FORMATORE") {
        setNotificheRisposteEnti(prev =>
          prev.map(r => (r.id === risposta.id ? { ...r, letta: true } : r))
        );
      } else {
        setNotificheRisposteAssoc(prev =>
          prev.map(r => (r.id === risposta.id ? { ...r, letta: true } : r))
        );
      }
      // Aggiorna contatore non lette
      setNotificheNonLette(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Errore segna come letta:", error);
    }
  };

  // Fetch notifiche stats e risposte
  useEffect(() => {
    const MIHUB_API =
      import.meta.env.VITE_MIHUB_API_BASE_URL || "https://api.mio-hub.me/api";

    // Fetch stats notifiche (solo per statistiche generali, NON per badge)
    fetch(`${MIHUB_API}/notifiche/stats`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setNotificheStats(data.data);
          // NON settare notificheNonLette qui - viene calcolato dalle risposte
        }
      })
      .catch(err => console.error("Notifiche stats fetch error:", err));

    // Fetch risposte (messaggi dalle imprese) - separate per Enti e Associazioni
    fetch(`${MIHUB_API}/notifiche/risposte`)
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.data)) {
          setNotificheRisposte(data.data);
          // Filtra per target_tipo (chi era il destinatario originale della notifica)
          const risposteEnti = data.data.filter(
            (r: any) => r.target_tipo === "ENTE_FORMATORE"
          );
          const risposteAssoc = data.data.filter(
            (r: any) => r.target_tipo === "ASSOCIAZIONE"
          );
          setNotificheRisposteEnti(risposteEnti);
          setNotificheRisposteAssoc(risposteAssoc);
          // Calcola totale risposte non lette per badge barra rapida
          const totaleNonLette = data.data.filter((r: any) => !r.letta).length;
          setNotificheNonLette(totaleNonLette);
        }
      })
      .catch(err => console.error("Notifiche risposte fetch error:", err));

    // Fetch messaggi inviati - Enti Formatori (ID=1)
    fetch(`${MIHUB_API}/notifiche/messaggi/ENTE_FORMATORE/1?filtro=inviati`)
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.data)) {
          setMessaggiInviatiEnti(espandiMessaggiInviatiPerImpresa(data.data));
        }
      })
      .catch(err => console.error("Messaggi inviati Enti fetch error:", err));

    // Fetch messaggi inviati - Associazioni: usa la stessa associazione attiva dell'invio, non un ID fisso
    const impersonationForMessages = getImpersonationParams();
    const associazioneMessaggiId =
      impersonationForMessages.associazioneId ||
      new URLSearchParams(window.location.search).get("associazione_id") ||
      "1";
    fetch(`${MIHUB_API}/notifiche/messaggi/ASSOCIAZIONE/${associazioneMessaggiId}?filtro=inviati`)
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.data)) {
          setMessaggiInviatiAssoc(espandiMessaggiInviatiPerImpresa(data.data));
        }
      })
      .catch(err => console.error("Messaggi inviati Assoc fetch error:", err));

    // Fetch lista mercati
    fetch(`${MIHUB_API}/stats/overview`)
      .then(res => res.json())
      .then(async data => {
        // Fetch mercati separatamente
        const mercatiRes = await fetch(`${MIHUB_API}/markets`)
          .then(r => r.json())
          .catch(() => ({ data: [] }));
        if (mercatiRes.data) {
          setMercatiList(mercatiRes.data);
        }
      })
      .catch(err => console.error("Mercati fetch error:", err));

    // Fetch lista hub
    fetch(`${MIHUB_API}/tcc/v2/comuni`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.comuni) {
          setHubList(data.comuni);
        }
      })
      .catch(err => console.error("Hub fetch error:", err));

    // Fetch lista imprese (con limit per ridurre payload)
    fetch(
      addComuneIdToUrl(
        "/api/imprese?limit=200&fields=id,denominazione,partita_iva,codice_fiscale,comune"
      )
    )
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setImpreseList(data.data);
        }
      })
      .catch(err => console.error("Imprese fetch error:", err));

    // Polling ogni 30 secondi per aggiornare notifiche
    const interval = setInterval(() => {
      fetch(`${MIHUB_API}/notifiche/stats`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setNotificheStats(data.data);
          }
        })
        .catch(err => console.error("Notifiche stats poll error:", err));
      // Aggiorna anche risposte non lette
      fetch(`${MIHUB_API}/notifiche/risposte`)
        .then(res => res.json())
        .then(data => {
          if (data.success && Array.isArray(data.data)) {
            setNotificheRisposte(data.data);
            setNotificheRisposteEnti(
              data.data.filter((r: any) => r.target_tipo === "ENTE_FORMATORE")
            );
            setNotificheRisposteAssoc(
              data.data.filter((r: any) => r.target_tipo === "ASSOCIAZIONE")
            );
            setNotificheNonLette(data.data.filter((r: any) => !r.letta).length);
          }
        })
        .catch(err => console.error("Notifiche risposte poll error:", err));
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // GIS Map state (blocco ufficiale da GestioneMercati)
  const [gisStalls, setGisStalls] = useState<any[]>([]);
  const [gisMapData, setGisMapData] = useState<any | null>(null);
  const [gisMapCenter, setGisMapCenter] = useState<[number, number] | null>(
    null
  );
  const [gisMapRefreshKey, setGisMapRefreshKey] = useState(0);

  // GIS Map filters
  const [gisSearchQuery, setGisSearchQuery] = useState("");
  const [showBusHubEditor, setShowBusHubEditor] = useState(false);
  const [gisStatusFilter, setGisStatusFilter] = useState<string>("all");
  const gisMarketId = 1; // Mercato Grosseto ID=1 (default)

  // Filtered stalls based on search and status
  const filteredGisStalls = gisStalls.filter(stall => {
    // Filter by status
    if (gisStatusFilter !== "all" && stall.status !== gisStatusFilter) {
      return false;
    }

    // Filter by search query
    if (gisSearchQuery) {
      const query = gisSearchQuery.toLowerCase();
      return (
        // Posteggio
        stall.number?.toLowerCase().includes(query) ||
        stall.gis_slot_id?.toLowerCase().includes(query) ||
        // Impresa
        stall.vendor_business_name?.toLowerCase().includes(query) ||
        // Mercato (hardcoded per ora - Grosseto)
        "grosseto".includes(query) ||
        "mercato grosseto".includes(query) ||
        "toscana".includes(query) ||
        // Giorno mercato
        "giovedì".includes(query) ||
        "giovedi".includes(query) ||
        "thursday".includes(query)
      );
    }

    return true;
  });

  // Format timestamp for Guardian logs
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return (
      date.toLocaleString("it-IT", {
        timeZone: "Europe/Rome",
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }) + " (ora locale)"
    );
  };

  // 🔥 Handler per invio messaggio MIO - USA CONTEXT!
  // ---------------------------------------------------------
  const handleSendMio = async () => {
    const text = mioInputValue.trim();
    if (!text || mioSending) return;

    setMioInputValue("");

    // Non cambiamo la vista quando si invia un messaggio
    // setViewMode('single');  // RIMOSSO: lasciamo la vista corrente
    setSelectedAgent("mio");

    // 🔥 USA LA FUNZIONE DEL CONTEXT!
    await sendMioMessage(text, { source: "dashboard_pa" });

    // Forza scroll dopo invio messaggio
    setTimeout(() => scrollMioToBottom(), 100);
  };
  // ---------------------------------------------------------
  // FINE BLOCCO TABULA RASA
  // ---------------------------------------------------------

  // ========== HANDLER VISTA SINGOLA AGENTI ==========
  // Ogni agente ha il suo handler che usa sendAgentMessage

  const handleSendGptdev = async () => {
    const text = gptdevInputValue.trim();
    if (!text || gptdevSending) return;
    setGptdevInputValue("");
    setGptdevSending(true);

    try {
      await sendToAgent({
        targetAgent: "gptdev",
        message: text,
        conversationId: gptdevConversationId,
        mode: "direct",
        onUpdateMessages: () => {}, // 🔥 FIX: Non usare setMessages, usa refetch
        onUpdateConversationId: setGptdevConversationId,
      });
      // 🔥 FIX: Ricarica messaggi dal database dopo la risposta
      await refetchGptdev();
    } finally {
      setGptdevSending(false);
    }
  };

  const handleSendManus = async () => {
    const text = manusInputValue.trim();
    if (!text || manusSending) return;
    setManusInputValue("");
    setManusSending(true);

    try {
      await sendToAgent({
        targetAgent: "manus",
        message: text,
        conversationId: manusConversationId,
        mode: "direct",
        onUpdateMessages: () => {}, // 🔥 FIX: Non usare setMessages, usa refetch
        onUpdateConversationId: setManusConversationId,
      });
      // 🔥 FIX: Ricarica messaggi dal database dopo la risposta
      await refetchManus();
    } finally {
      setManusSending(false);
    }
  };

  const handleSendAbacus = async () => {
    const text = abacusInputValue.trim();
    if (!text || abacusSending) return;
    setAbacusInputValue("");
    setAbacusSending(true);

    try {
      await sendToAgent({
        targetAgent: "abacus",
        message: text,
        conversationId: abacusConversationId,
        mode: "direct",
        onUpdateMessages: () => {}, // 🔥 FIX: Non usare setMessages, usa refetch
        onUpdateConversationId: setAbacusConversationId,
      });
      // 🔥 FIX: Ricarica messaggi dal database dopo la risposta
      await refetchAbacus();
    } finally {
      setAbacusSending(false);
    }
  };

  const handleSendZapier = async () => {
    const text = zapierInputValue.trim();
    if (!text || zapierSending) return;
    setZapierInputValue("");
    setZapierSending(true);

    try {
      await sendToAgent({
        targetAgent: "zapier",
        message: text,
        conversationId: zapierConversationId,
        mode: "direct",
        onUpdateMessages: () => {}, // 🔥 FIX: Non usare setMessages, usa refetch
        onUpdateConversationId: setZapierConversationId,
      });
      // 🔥 FIX: Ricarica messaggi dal database dopo la risposta
      await refetchZapier();
    } finally {
      setZapierSending(false);
    }
  };

  // ELIMINATO: loadConversationHistory() - causava 404 su endpoint inesistente
  // useAgentLogs per ogni agente gestisce automaticamente il caricamento

  // Fetch GIS Map Data (blocco ufficiale da GestioneMercati)
  useEffect(() => {
    const API_BASE_URL =
      import.meta.env.VITE_MIHUB_API_URL || "https://api.mio-hub.me";

    const fetchGisData = async () => {
      try {
        const [stallsRes, mapRes] = await Promise.all([
          fetch(
            addComuneIdToUrl(
              `${API_BASE_URL}/api/markets/${gisMarketId}/stalls`
            )
          ),
          fetch(`${API_BASE_URL}/api/gis/market-map`),
        ]);

        const stallsData = await stallsRes.json();
        const mapDataRes = await mapRes.json();

        if (stallsData.success) {
          setGisStalls(stallsData.data);
        }
        if (mapDataRes.success) {
          setGisMapData(mapDataRes.data);
          if (mapDataRes.data?.center) {
            setGisMapCenter([
              mapDataRes.data.center.lat,
              mapDataRes.data.center.lng,
            ]);
          }
        }
      } catch (error) {
        console.error("[GIS Map] Error fetching data:", error);
      }
    };

    fetchGisData();
  }, [gisMarketId]);

  // Fetch Guardian logs from Neon database via Abacus SQL
  // 🔥 FIX: Carica attività agenti da agent_messages invece di guardian_logs
  // 🔥 FIX 27/01/2026: Ridotto polling e aggiunto controllo visibilità tab per risparmiare CPU Vercel
  useEffect(() => {
    const fetchAgentActivity = async () => {
      // Non fare polling se la tab non è visibile (risparmia CPU Vercel)
      if (document.hidden) {
        return;
      }
      try {
        // Carica gli ultimi messaggi degli agenti da tutte le conversazioni di coordinamento
        const conversationIds = [
          "mio-manus-coordination",
          "mio-abacus-coordination",
          "mio-zapier-coordination",
          "mio-gptdev-coordination",
          "mio-main",
        ];

        const allLogs: any[] = [];

        for (const convId of conversationIds) {
          const response = await fetch(
            `/api/mihub/get-messages?conversation_id=${convId}&limit=20&order=desc`
          );
          const data = await response.json();
          if (data.success && Array.isArray(data.messages)) {
            // Trasforma i messaggi nel formato log
            const logs = data.messages.map((msg: any) => ({
              timestamp: msg.created_at,
              agent: msg.agent || msg.sender || "unknown",
              status: "allowed",
              method: msg.meta?.tool || "message",
              path:
                msg.message?.substring(0, 100) +
                (msg.message?.length > 100 ? "..." : ""),
              reason: null,
              response_time_ms: null,
              conversation_id: msg.conversation_id,
            }));
            allLogs.push(...logs);
          }
        }

        // Ordina per timestamp decrescente e prendi gli ultimi 50
        allLogs.sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        setGuardianLogs(allLogs.slice(0, 50));
      } catch (error) {
        console.error("Failed to fetch agent activity:", error);
        setGuardianLogs([]);
      }
    };
    fetchAgentActivity();
    // Refresh every 30 seconds for real-time updates (era 10s, aumentato per risparmiare CPU Vercel)
    const interval = setInterval(fetchAgentActivity, 30000);
    return () => clearInterval(interval);
  }, []);

  // Simula aggiornamento real-time
  const { isAnimating } = useAnimation();

  // Aggiorna realtimeData con dati reali dal backend
  useEffect(() => {
    if (realData.statsRealtime) {
      setRealtimeData(prev => ({
        ...prev,
        activeUsers: realData.statsRealtime.activeUsers || 0,
        activeVendors: realData.statsRealtime.activeVendors || 0,
        todayCheckins: realData.statsRealtime.todayCheckins || 0,
        todayTransactions: realData.statsRealtime.todayTransactions || 0,
      }));
    }
  }, [realData.statsRealtime]);

  // Refresh realtime ogni 30 secondi
  useEffect(() => {
    const interval = setInterval(() => {
      if (isAnimating) return;
      const MIHUB_API =
        import.meta.env.VITE_MIHUB_API_BASE_URL || "https://api.mio-hub.me/api";
      fetch(`${MIHUB_API}/stats/realtime`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setRealtimeData(prev => ({
              ...prev,
              activeUsers: data.data.activeUsers || 0,
              activeVendors: data.data.activeVendors || 0,
              todayCheckins: data.data.todayCheckins || 0,
              todayTransactions: data.data.todayTransactions || 0,
            }));
          }
        })
        .catch(err => console.error("Realtime refresh error:", err));
    }, 30000);

    return () => clearInterval(interval);
  }, [isAnimating]);

  // Read URL param ?tab=mio and set activeTab
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab) {
      setActiveTab(tab);
    }
  }, [location]);

  // Scroll MIO chat to bottom
  const scrollMioToBottom = () => {
    if (mioMessagesRef.current) {
      mioMessagesRef.current.scrollTo({
        top: mioMessagesRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  // Scroll MIO quando cambiano messaggi
  useEffect(() => {
    if (!mioMessagesRef.current || mioMessages.length === 0) return;

    // Timeout per assicurarsi che il DOM sia aggiornato
    const timeoutId = setTimeout(() => {
      if (mioMessagesRef.current) {
        mioMessagesRef.current.scrollTo({
          top: mioMessagesRef.current.scrollHeight,
          behavior: "smooth", // Animazione fluida
        });
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [mioMessages]);

  // Listener scroll MIO per bottone
  useEffect(() => {
    const messagesDiv = mioMessagesRef.current;
    if (!messagesDiv) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = messagesDiv;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowMioScrollButton(!isNearBottom);
    };

    messagesDiv.addEventListener("scroll", handleScroll);
    return () => messagesDiv.removeEventListener("scroll", handleScroll);
  }, []);

  // Scroll chat singole to bottom
  const scrollSingleChatToBottom = () => {
    if (singleChatMessagesRef.current) {
      singleChatMessagesRef.current.scrollTo({
        top: singleChatMessagesRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  // Auto-scroll chat singole quando cambiano messaggi (SOLO se utente è già in fondo)
  useEffect(() => {
    const messagesDiv = singleChatMessagesRef.current;
    if (!messagesDiv) return;

    const { scrollTop, scrollHeight, clientHeight } = messagesDiv;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;

    // Scrolla SOLO se l'utente è già vicino al fondo (previene effetto molla)
    if (isNearBottom) {
      scrollSingleChatToBottom();
    }
  }, [
    gptdevMessages,
    manusMessages,
    abacusMessages,
    zapierMessages,
    selectedAgent,
  ]);

  // Scroll iniziale chat singole al mount
  useEffect(() => {
    const currentMessages =
      selectedAgent === "gptdev"
        ? gptdevMessages
        : selectedAgent === "manus"
          ? manusMessages
          : selectedAgent === "abacus"
            ? abacusMessages
            : zapierMessages;

    if (currentMessages.length > 0 && singleChatMessagesRef.current) {
      setTimeout(() => {
        if (singleChatMessagesRef.current) {
          singleChatMessagesRef.current.scrollTo({
            top: singleChatMessagesRef.current.scrollHeight,
            behavior: "instant" as ScrollBehavior,
          });
        }
      }, 300);
    }
  }, [selectedAgent]);

  // Listener scroll chat singole per bottone
  useEffect(() => {
    const messagesDiv = singleChatMessagesRef.current;
    if (!messagesDiv) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = messagesDiv;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowSingleChatScrollButton(!isNearBottom);
    };

    messagesDiv.addEventListener("scroll", handleScroll);
    return () => messagesDiv.removeEventListener("scroll", handleScroll);
  }, []);

  // Documentation Modal handler
  const openDocModal = (docKey: string) => {
    const content: Record<string, { title: string; content: string }> = {
      executive_summary: {
        title: "🎯 Executive Summary",
        content: `
          <p><b>Versione:</b> 3.1 (Fix Bug Critici) | <b>Ultimo Aggiornamento:</b> 7 Dicembre 2025</p>
          <p class="mt-3">Il DMS Hub è un ecosistema integrato <b>operativo</b> per la gestione dei mercati, della mobilità sostenibile e dei servizi civici. La piattaforma si compone di:</p>
          <ul class="mt-2">
            <li>✅ <b>Frontend Dashboard PA</b> (React + Vite + TypeScript su Vercel)</li>
            <li>✅ <b>Backend MIO Hub</b> (Node.js + Express su Hetzner)</li>
            <li>✅ <b>5 Agenti AI Operativi</b> (MIO, GPT Dev, Manus, Abacus, Zapier)</li>
            <li>✅ <b>Database PostgreSQL</b> (39 tabelle su Neon)</li>
            <li>✅ <b>LLM Council</b> (Confronto multi-modello AI)</li>
            <li>⏳ <b>8 Applicazioni Web</b> (2 operative, 6 in sviluppo)</li>
          </ul>
          <p class="mt-4"><a href="https://github.com/Chcndr/dms-system-blueprint/blob/master/01_architettura/MASTER_SYSTEM_PLAN.md" target="_blank" class="text-cyan-400 hover:text-cyan-300 font-semibold">📖 Apri Documentazione Completa su GitHub →</a></p>
        `,
      },
      architettura_tecnica: {
        title: "🏭 Architettura Tecnica",
        content: `
          <p><b>Stack Tecnologico Operativo:</b></p>
          <ul class="mt-2">
            <li><b>Frontend:</b> React 18 + Vite + TypeScript + TailwindCSS (Vercel)</li>
            <li><b>Backend:</b> Node.js + Express + PM2 (Hetzner VPS)</li>
            <li><b>Database:</b> PostgreSQL 15 (Neon) - 39 tabelle</li>
            <li><b>LLM Council:</b> Python/FastAPI + React (Hetzner)</li>
            <li><b>Storage:</b> File system locale + GitHub logs</li>
          </ul>
          <p class="mt-3"><b>Domini Attivi:</b></p>
          <ul>
            <li>✅ <code>app.mio-hub.me</code> - Dashboard PA</li>
            <li>✅ <code>api.mio-hub.me</code> - Backend API (porta 3000)</li>
            <li>✅ <code>council.mio-hub.me</code> - LLM Council Frontend (porta 8002)</li>
            <li>✅ <code>council-api.mio-hub.me</code> - LLM Council API (porta 8001)</li>
          </ul>
          <p class="mt-4"><a href="https://github.com/Chcndr/dms-system-blueprint/blob/master/01_architettura/orchestratore-multi-agente.md" target="_blank" class="text-cyan-400 hover:text-cyan-300 font-semibold">📖 Apri Architettura Completa su GitHub →</a></p>
        `,
      },
      applicazioni_web: {
        title: "📱 8 Applicazioni Web",
        content: `
          <p><b>Stato delle Applicazioni Web:</b></p>
          <p class="mt-2"><b class="text-green-400">✅ OPERATIVE (2/8):</b></p>
          <ul>
            <li><b>Dashboard PA:</b> Centro di controllo per la Pubblica Amministrazione</li>
            <li><b>LLM Council:</b> Confronto e valutazione modelli AI (Gemini, GPT, Claude)</li>
          </ul>
          <p class="mt-3"><b class="text-yellow-400">⏳ IN SVILUPPO (6/8):</b></p>
          <ul>
            <li><b>BUS Hub:</b> Gestione trasporto pubblico e Centro Mobilità</li>
            <li><b>Core Map:</b> Mappa GIS interattiva con layer Pepe GIS</li>
            <li><b>Sito Pubblico:</b> Portale per cittadini e operatori</li>
            <li><b>Hub Operatore:</b> Gestione mercati e posteggi</li>
            <li><b>Vetrine Digitali:</b> Showcase prodotti Made in Italy</li>
            <li><b>Gestionale DMS:</b> Backoffice completo</li>
          </ul>
          <p class="mt-4"><a href="https://github.com/Chcndr/dms-system-blueprint/blob/master/01_architettura/MASTER_SYSTEM_PLAN.md" target="_blank" class="text-cyan-400 hover:text-cyan-300 font-semibold">📖 Apri Documentazione Completa su GitHub →</a></p>
        `,
      },
      integrazioni: {
        title: "⭐ Sistema Integrazioni",
        content: `
          <p><b>Integrazioni Operative:</b></p>
          <ul class="mt-2">
            <li>✅ <b>LLM Council:</b> Confronto multi-modello AI (Gemini, GPT, Claude)</li>
            <li>✅ <b>GitHub:</b> Gestione codice, CI/CD, deploy automatico</li>
            <li>✅ <b>Zapier:</b> Automazione workflow e integrazioni business</li>
            <li>✅ <b>Neon:</b> Database PostgreSQL serverless (39 tabelle)</li>
            <li>✅ <b>Pepe GIS:</b> Mappe interattive e layer geografici</li>
          </ul>
          <p class="mt-3"><b>In Sviluppo:</b></p>
          <ul>
            <li>⏳ <b>TPER:</b> Integrazione trasporto pubblico Bologna (Centro Mobilità)</li>
          </ul>
          <p class="mt-4"><a href="https://github.com/Chcndr/dms-system-blueprint/tree/master/07_guide_operative" target="_blank" class="text-cyan-400 hover:text-cyan-300 font-semibold">📖 Apri Guide Operative su GitHub →</a></p>
        `,
      },
      funzionalita_operative: {
        title: "✅ Funzionalità Operative",
        content: `
          <p><b>Funzionalità Operative (Aggiornato 07/12/2025):</b></p>
          <ul class="mt-2">
            <li>✅ <b>Orchestratore Multi-Agente:</b> MIO agent operativo (fix 07/12/2025)</li>
            <li>✅ <b>5 Agenti AI:</b> MIO, GPT Dev, Manus, Abacus, Zapier (tutti operativi)</li>
            <li>✅ <b>Guardian Logs:</b> Sistema di monitoring agenti (visibile in tab Logs)</li>
            <li>✅ <b>Chat Multi-Agente:</b> Vista singola + 4 quadranti con auto-scroll</li>
            <li>✅ <b>Dashboard PA:</b> Metriche real-time, grafici, analytics</li>
            <li>✅ <b>Backend API:</b> REST + tRPC su Hetzner (PM2)</li>
            <li>✅ <b>Database:</b> PostgreSQL Neon (39 tabelle)</li>
            <li>✅ <b>Deploy Automatico:</b> GitHub → Vercel + Hetzner</li>
            <li>✅ <b>LLM Council:</b> Confronto Gemini, GPT, Claude</li>
          </ul>
          <p class="mt-3"><b>Fix Recenti (07/12/2025):</b></p>
          <ul>
            <li>✅ Bug duplicazione messaggi - RISOLTO</li>
            <li>✅ Bug saveAgentLog - RISOLTO</li>
            <li>✅ Bug tool_calls Gemini - RISOLTO</li>
            <li>✅ Auto-scroll chat - RISOLTO</li>
          </ul>
          <p class="mt-4"><a href="https://github.com/Chcndr/dms-system-blueprint/blob/master/01_architettura/MASTER_SYSTEM_PLAN.md" target="_blank" class="text-cyan-400 hover:text-cyan-300 font-semibold">📖 Apri Stato Completo su GitHub →</a></p>
        `,
      },
      todo_prioritizzati: {
        title: "📅 TODO Prioritizzati",
        content: `
          <p><b>Roadmap Sviluppo (Aggiornato 07/12/2025):</b></p>
          <h4 class="text-red-400 font-semibold mt-3 mb-2">🔴 Alta Priorità</h4>
          <ul>
            <li>Completare integrazione Centro Mobilità TPER</li>
            <li>Verificare e completare le 6 applicazioni web in sviluppo</li>
            <li>Espandere Guardian logs con analytics avanzati</li>
            <li>Implementare sistema notifiche real-time</li>
          </ul>
          <h4 class="text-yellow-400 font-semibold mt-3 mb-2">🟡 Media Priorità</h4>
          <ul>
            <li>Aggiungere dashboard metriche sostenibilità</li>
            <li>Migliorare UI/UX vetrine digitali</li>
            <li>Documentazione API completa</li>
            <li>Configurare redirect domini www.mio-hub.me e mio-hub.me</li>
          </ul>
          <h4 class="text-green-400 font-semibold mt-3 mb-2">🟢 Bassa Priorità</h4>
          <ul>
            <li>Ottimizzazione performance query database</li>
            <li>Test automatici E2E</li>
            <li>Refactoring codice legacy</li>
          </ul>
          <p class="mt-4"><a href="https://github.com/Chcndr/dms-system-blueprint/blob/master/01_architettura/MASTER_SYSTEM_PLAN.md" target="_blank" class="text-cyan-400 hover:text-cyan-300 font-semibold">📖 Apri Roadmap Completa su GitHub →</a></p>
        `,
      },
      stato_progetto: {
        title: "📋 Stato Progetto Aggiornato",
        content: `<p>Documento completo con stato attuale, architettura, funzionalità operative, TODO prioritizzati e guide.</p>`,
      },
      resoconto_ecosistema: {
        title: "📊 Resoconto Completo Ecosistema",
        content: `<p>Resoconto originale completo dell'ecosistema DMS Hub con tutte le 8 applicazioni web integrate.</p>`,
      },
    };
    setDocModalContent(content[docKey]);
  };

  const QuickAccessButton = ({
    href,
    icon,
    label,
    color = "teal",
    badge = 0,
  }: any) => (
    <button
      onClick={() => setLocation(href)}
      className={`relative flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
        color === "orange"
          ? "bg-[#f59e0b]/10 border-[#f59e0b]/30 hover:bg-[#f59e0b]/20 text-[#f59e0b]"
          : color === "yellow"
            ? "bg-[#eab308]/10 border-[#eab308]/30 hover:bg-[#eab308]/20 text-[#eab308]"
            : "bg-[#14b8a6]/10 border-[#14b8a6]/30 hover:bg-[#14b8a6]/20 text-[#14b8a6]"
      }`}
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
      {badge > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-5 h-5 px-1 flex items-center justify-center animate-pulse">
          {badge}
        </span>
      )}
    </button>
  );

  const KPICard = ({ title, value, growth, icon: Icon, suffix = "" }: any) => (
    <Card className="bg-gradient-to-br from-[#1a2332] to-[#0b1220] border-[#14b8a6]/30">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-[#e8fbff]/70">
          {title}
        </CardTitle>
        <Icon className="h-5 w-5 text-[#14b8a6]" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-[#e8fbff]">
          {value.toLocaleString()}
          {suffix}
        </div>
        {growth !== undefined && (
          <div className="flex items-center mt-2 text-sm">
            {growth >= 0 ? (
              <>
                <ArrowUpRight className="h-4 w-4 text-[#10b981] mr-1" />
                <span className="text-[#10b981]">+{growth}%</span>
              </>
            ) : (
              <>
                <ArrowDownRight className="h-4 w-4 text-[#ef4444] mr-1" />
                <span className="text-[#ef4444]">{growth}%</span>
              </>
            )}
            <span className="text-[#e8fbff]/50 ml-2">vs mese scorso</span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  // 🟢 System Status Indicators Component
  const SystemStatusIndicators = () => {
    const { apiStatus, pm2Status } = useSystemStatus(30000); // Check ogni 30s

    const getStatusColor = (status: string) => {
      switch (status) {
        case "online":
          return "bg-green-400";
        case "offline":
          return "bg-red-500";
        case "checking":
          return "bg-yellow-400";
        default:
          return "bg-gray-400";
      }
    };

    const getStatusText = (status: string) => {
      switch (status) {
        case "online":
          return "Online";
        case "offline":
          return "Offline";
        case "checking":
          return "Check...";
        default:
          return "Unknown";
      }
    };

    return (
      <div
        className="flex items-center gap-3"
        role="status"
        aria-live="polite"
        aria-label="Stato dei servizi"
      >
        {/* Backend API Indicator */}
        <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg border border-white/20">
          <div
            className={`w-2 h-2 rounded-full ${getStatusColor(apiStatus)} ${apiStatus === "online" ? "animate-pulse" : ""}`}
            aria-hidden="true"
          />
          <span className="text-xs font-medium">API</span>
          <span className="text-xs opacity-75">{getStatusText(apiStatus)}</span>
        </div>

        {/* PM2 Status Indicator */}
        <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg border border-white/20">
          <div
            className={`w-2 h-2 rounded-full ${getStatusColor(pm2Status)} ${pm2Status === "online" ? "animate-pulse" : ""}`}
            aria-hidden="true"
          />
          <span className="text-xs font-medium">PM2</span>
          <span className="text-xs opacity-75">{getStatusText(pm2Status)}</span>
        </div>
      </div>
    );
  };

  // Mostra loading spinner mentre i permessi si caricano
  // NOTA: questo check DEVE stare dopo tutti gli hooks per evitare React error #300
  if (permissionsLoading) {
    return (
      <div className="min-h-screen bg-[#0b1220] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#14b8a6]/30 border-t-[#14b8a6] rounded-full animate-spin" />
          <span className="text-[#e8fbff]/60 text-sm">
            Caricamento permessi...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[#0b1220] overflow-x-hidden"
      role="main"
      aria-label="Dashboard Pubblica Amministrazione"
    >
      {/* Header */}
      <header className="bg-gradient-to-r from-[#8b5cf6] to-[#6d28d9] text-white py-3 px-6 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Pulsante Home per tornare alla pagina principale */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/")}
              className="bg-white/20 hover:bg-white/30 text-white border-none"
              title="Torna alla Home"
              aria-label="Torna alla Home"
            >
              <Home className="h-5 w-5" aria-hidden="true" />
            </Button>
            <BarChart3 className="h-6 w-6" />
            <div>
              <h1 className="text-xl font-bold">Dashboard PA - DMS HUB</h1>
              <p className="text-xs opacity-90">
                Analytics e Monitoraggio Ecosistema
              </p>
            </div>
          </div>

          {/* 🟢 Status Indicators */}
          <SystemStatusIndicators />

          <div className="flex items-center gap-4">
            <select
              value={selectedPeriod}
              onChange={e => setSelectedPeriod(e.target.value)}
              className="bg-white/20 text-white px-4 py-2 rounded-lg border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
              aria-label="Seleziona periodo di analisi"
            >
              <option value="day">Oggi</option>
              <option value="week">Settimana</option>
              <option value="month">Mese</option>
              <option value="year">Anno</option>
            </select>
            <Button
              variant="outline"
              className="bg-white/20 border-white/30 text-white hover:bg-white/30"
            >
              <Download className="h-4 w-4 mr-2" />
              Esporta Report
            </Button>
          </div>
        </div>
      </header>

      {/* Quick Access Navigation */}
      <nav
        className="bg-[#1a2332] border-b border-[#14b8a6]/30 py-4 px-6"
        aria-label="Accesso rapido applicativi"
      >
        <div className="max-w-7xl mx-auto">
          <h3 className="text-sm font-semibold text-[#e8fbff]/70 mb-3">
            Accesso Rapido Applicativi
          </h3>
          <div className="grid grid-cols-11 gap-2">
            <ProtectedQuickAccess quickId="home">
              <QuickAccessButton
                href="/"
                icon={<Store className="h-5 w-5" />}
                label="Home"
              />
            </ProtectedQuickAccess>
            <ProtectedQuickAccess quickId="wallet">
              <QuickAccessButton
                href="/wallet"
                icon={<Leaf className="h-5 w-5" />}
                label="Wallet"
              />
            </ProtectedQuickAccess>
            <ProtectedQuickAccess quickId="route">
              <QuickAccessButton
                href="/route"
                icon={<TrendingUp className="h-5 w-5" />}
                label="Route"
              />
            </ProtectedQuickAccess>
            <ProtectedQuickAccess quickId="civic">
              <QuickAccessButton
                href="/civic"
                icon={<AlertCircle className="h-5 w-5" />}
                label="Segnala"
              />
            </ProtectedQuickAccess>
            <ProtectedQuickAccess quickId="vetrine">
              <QuickAccessButton
                href="/vetrine"
                icon={<Store className="h-5 w-5" />}
                label="Vetrine"
              />
            </ProtectedQuickAccess>
            <ProtectedQuickAccess quickId="hub_operatore">
              <QuickAccessButton
                href="/hub-operatore"
                icon={<Activity className="h-5 w-5" />}
                label="Hub Operatore"
                color="orange"
              />
            </ProtectedQuickAccess>

            <ProtectedQuickAccess quickId="bus_hub">
              <button
                onClick={() =>
                  window.open(
                    `${MIHUB_API_BASE_URL}/tools/bus_hub.html`,
                    "_blank"
                  )
                }
                className="flex items-center gap-2 px-4 py-2 rounded-lg border transition-all bg-[#8b5cf6]/10 border-[#8b5cf6]/30 hover:bg-[#8b5cf6]/20 text-[#8b5cf6]"
              >
                <Wrench className="h-5 w-5" />
                <span className="text-sm font-medium">BUS HUB</span>
              </button>
            </ProtectedQuickAccess>
            <ProtectedQuickAccess quickId="core_map">
              <button
                onClick={() =>
                  window.open(
                    "https://chcndr.github.io/dms-gemello-core/index-grosseto.html",
                    "_blank"
                  )
                }
                className="flex items-center gap-2 px-4 py-2 rounded-lg border transition-all bg-[#f59e0b]/10 border-[#f59e0b]/30 hover:bg-[#f59e0b]/20 text-[#f59e0b]"
              >
                <MapPin className="h-5 w-5" />
                <span className="text-sm font-medium">Core Map</span>
              </button>
            </ProtectedQuickAccess>
            <ProtectedQuickAccess quickId="sito_pubblico">
              <button
                onClick={() =>
                  window.open(
                    "https://chcndr.github.io/dms-gemello-core/",
                    "_blank"
                  )
                }
                className="flex items-center gap-2 px-4 py-2 rounded-lg border transition-all bg-[#10b981]/10 border-[#10b981]/30 hover:bg-[#10b981]/20 text-[#10b981]"
              >
                <Globe className="h-5 w-5" />
                <span className="text-sm font-medium">Sito Pubblico</span>
              </button>
            </ProtectedQuickAccess>
            <ProtectedQuickAccess quickId="dms_news">
              <button
                onClick={() =>
                  window.open(
                    "https://chcndr.github.io/dms-gemello-news/landing/home.html",
                    "_blank"
                  )
                }
                className="flex items-center gap-2 px-4 py-2 rounded-lg border transition-all bg-[#3b82f6]/10 border-[#3b82f6]/30 hover:bg-[#3b82f6]/20 text-[#3b82f6]"
              >
                <Newspaper className="h-5 w-5" />
                <span className="text-sm font-medium">DMS News</span>
              </button>
            </ProtectedQuickAccess>
            <ProtectedQuickAccess quickId="gestionale">
              <button
                onClick={() =>
                  window.open(
                    "https://lapsy-dms.herokuapp.com/index.html",
                    "_blank"
                  )
                }
                className="flex items-center gap-2 px-4 py-2 rounded-lg border transition-all bg-[#ef4444]/10 border-[#ef4444]/30 hover:bg-[#ef4444]/20 text-[#ef4444]"
              >
                <Rocket className="h-5 w-5" />
                <span className="text-sm font-medium">Gestionale DMS</span>
              </button>
            </ProtectedQuickAccess>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* KPI Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <KPICard
            title="Utenti Totali"
            value={realData.overview?.totalUsers || 0}
            growth={realData.overview?.userGrowth || 0}
            icon={Users}
          />
          <KPICard
            title="Totale Associati"
            value={realData.overview?.totale_associati || 0}
            icon={UserCheck}
          />
          <KPICard
            title="Mercati Attivi"
            value={realData.overview?.activeMarkets || 0}
            icon={Store}
          />
          <KPICard
            title="Transazioni"
            value={realData.overview?.totalTransactions || 0}
            growth={realData.overview?.transactionGrowth || 0}
            icon={ShoppingCart}
          />
          <KPICard
            title="Rating Sostenibilità"
            value={realData.overview?.sustainabilityRating || 0}
            icon={Leaf}
            suffix="/10"
          />
        </div>

        {/* Loading State */}
        {realData.isLoading && (
          <div
            className="flex items-center justify-center p-8"
            role="status"
            aria-live="polite"
            aria-busy="true"
          >
            <div className="text-[#14b8a6] animate-pulse">
              Caricamento dati dal backend MIHUB...
            </div>
          </div>
        )}

        {/* Tabs Navigation - Stile Card */}
        <div className="bg-[#1a2332] border border-[#14b8a6]/30 p-4 rounded-lg">
          <h3 className="text-sm font-semibold text-[#e8fbff]/70 mb-3">
            Sezioni Dashboard
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            <ProtectedTab tabId="dashboard">
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`flex flex-col items-center gap-2 px-4 py-3 rounded-lg border transition-all ${
                  activeTab === "dashboard"
                    ? "bg-[#14b8a6] border-[#14b8a6] text-white shadow-lg"
                    : "bg-[#14b8a6]/10 border-[#14b8a6]/30 hover:bg-[#14b8a6]/20 text-[#14b8a6]"
                }`}
              >
                <BarChart3 className="h-6 w-6" />
                <span className="text-xs font-medium">Dashboard</span>
              </button>
            </ProtectedTab>
            <ProtectedTab tabId="users">
              <button
                onClick={() => setActiveTab("users")}
                className={`flex flex-col items-center gap-2 px-4 py-3 rounded-lg border transition-all ${
                  activeTab === "users"
                    ? "bg-[#14b8a6] border-[#14b8a6] text-white shadow-lg"
                    : "bg-[#14b8a6]/10 border-[#14b8a6]/30 hover:bg-[#14b8a6]/20 text-[#14b8a6]"
                }`}
              >
                <Users className="h-6 w-6" />
                <span className="text-xs font-medium">Clienti</span>
              </button>
            </ProtectedTab>
            <ProtectedTab tabId="wallet">
              <button
                onClick={() => setActiveTab("wallet")}
                className={`flex flex-col items-center gap-2 px-4 py-3 rounded-lg border transition-all ${
                  activeTab === "wallet"
                    ? "bg-[#3b82f6] border-[#3b82f6] text-white shadow-lg"
                    : "bg-[#3b82f6]/10 border-[#3b82f6]/30 hover:bg-[#3b82f6]/20 text-[#3b82f6]"
                }`}
              >
                <Euro className="h-6 w-6" />
                <span className="text-xs font-medium">Wallet/PagoPA</span>
              </button>
            </ProtectedTab>
            <ProtectedTab tabId="gaming">
              <button
                onClick={() => setActiveTab("gaming")}
                className={`flex flex-col items-center gap-2 px-4 py-3 rounded-lg border transition-all ${
                  activeTab === "gaming"
                    ? "bg-[#8b5cf6] border-[#8b5cf6] text-white shadow-lg"
                    : "bg-[#8b5cf6]/10 border-[#8b5cf6]/30 hover:bg-[#8b5cf6]/20 text-[#8b5cf6]"
                }`}
              >
                <Gamepad2 className="h-6 w-6" />
                <span className="text-xs font-medium">Gaming & Rewards</span>
              </button>
            </ProtectedTab>
            <ProtectedTab tabId="sustainability">
              <button
                onClick={() => setActiveTab("sustainability")}
                className={`flex flex-col items-center gap-2 px-4 py-3 rounded-lg border transition-all ${
                  activeTab === "sustainability"
                    ? "bg-[#10b981] border-[#10b981] text-white shadow-lg"
                    : "bg-[#10b981]/10 border-[#10b981]/30 hover:bg-[#10b981]/20 text-[#10b981]"
                }`}
              >
                <Leaf className="h-6 w-6" />
                <span className="text-xs font-medium">Sostenibilità</span>
              </button>
            </ProtectedTab>
            <ProtectedTab tabId="tpas">
              <button
                onClick={() => setActiveTab("tpas")}
                className={`flex flex-col items-center gap-2 px-4 py-3 rounded-lg border transition-all ${
                  activeTab === "tpas"
                    ? "bg-[#8b5cf6] border-[#8b5cf6] text-white shadow-lg"
                    : "bg-[#8b5cf6]/10 border-[#8b5cf6]/30 hover:bg-[#8b5cf6]/20 text-[#8b5cf6]"
                }`}
              >
                <Briefcase className="h-6 w-6" />
                <span className="text-xs font-medium">Associazioni</span>
              </button>
            </ProtectedTab>
            <ProtectedTab tabId="carboncredits">
              <button
                onClick={() => setActiveTab("carboncredits")}
                className={`flex flex-col items-center gap-2 px-4 py-3 rounded-lg border transition-all ${
                  activeTab === "carboncredits"
                    ? "bg-[#f59e0b] border-[#f59e0b] text-white shadow-lg"
                    : "bg-[#f59e0b]/10 border-[#f59e0b]/30 hover:bg-[#f59e0b]/20 text-[#f59e0b]"
                }`}
              >
                <Coins className="h-6 w-6" />
                <span className="text-xs font-medium">Carbon Credits</span>
              </button>
            </ProtectedTab>
            <ProtectedTab tabId="realtime">
              <button
                onClick={() => setActiveTab("realtime")}
                className={`flex flex-col items-center gap-2 px-4 py-3 rounded-lg border transition-all ${
                  activeTab === "realtime"
                    ? "bg-[#ef4444] border-[#ef4444] text-white shadow-lg"
                    : "bg-[#ef4444]/10 border-[#ef4444]/30 hover:bg-[#ef4444]/20 text-[#ef4444]"
                }`}
              >
                <Activity className="h-6 w-6" />
                <span className="text-xs font-medium">Real-time</span>
              </button>
            </ProtectedTab>
            <ProtectedTab tabId="sistema">
              <button
                onClick={() => setActiveTab("sistema")}
                className={`flex flex-col items-center gap-2 px-4 py-3 rounded-lg border transition-all ${
                  activeTab === "sistema"
                    ? "bg-[#06b6d4] border-[#06b6d4] text-white shadow-lg"
                    : "bg-[#06b6d4]/10 border-[#06b6d4]/30 hover:bg-[#06b6d4]/20 text-[#06b6d4]"
                }`}
              >
                <Terminal className="h-6 w-6" />
                <span className="text-xs font-medium">Sistema</span>
              </button>
            </ProtectedTab>
            <ProtectedTab tabId="ai">
              <button
                onClick={() => setActiveTab("ai")}
                className={`flex flex-col items-center gap-2 px-4 py-3 rounded-lg border transition-all ${
                  activeTab === "ai"
                    ? "bg-[#8b5cf6] border-[#8b5cf6] text-white shadow-lg"
                    : "bg-[#8b5cf6]/10 border-[#8b5cf6]/30 hover:bg-[#8b5cf6]/20 text-[#8b5cf6]"
                }`}
              >
                <Bot className="h-6 w-6" />
                <span className="text-xs font-medium">Agente AI</span>
              </button>
            </ProtectedTab>
            <ProtectedTab tabId="security">
              <button
                onClick={() => setActiveTab("security")}
                className={`flex flex-col items-center gap-2 px-4 py-3 rounded-lg border transition-all ${
                  activeTab === "security"
                    ? "bg-[#ef4444] border-[#ef4444] text-white shadow-lg"
                    : "bg-[#ef4444]/10 border-[#ef4444]/30 hover:bg-[#ef4444]/20 text-[#ef4444]"
                }`}
              >
                <Shield className="h-6 w-6" />
                <span className="text-xs font-medium">Sicurezza</span>
              </button>
            </ProtectedTab>
            <ProtectedTab tabId="ssosuap">
              <button
                onClick={() => setActiveTab("ssosuap")}
                className={`flex flex-col items-center gap-2 px-4 py-3 rounded-lg border transition-all ${
                  activeTab === "ssosuap"
                    ? "bg-[#f59e0b] border-[#f59e0b] text-white shadow-lg"
                    : "bg-[#f59e0b]/10 border-[#f59e0b]/30 hover:bg-[#f59e0b]/20 text-[#f59e0b]"
                }`}
              >
                <FileText className="h-6 w-6" />
                <span className="text-xs font-medium">SSO SUAP</span>
              </button>
            </ProtectedTab>
            <ProtectedTab tabId="businesses">
              <button
                onClick={() => setActiveTab("businesses")}
                className={`flex flex-col items-center gap-2 px-4 py-3 rounded-lg border transition-all ${
                  activeTab === "businesses"
                    ? "bg-[#10b981] border-[#10b981] text-white shadow-lg"
                    : "bg-[#10b981]/10 border-[#10b981]/30 hover:bg-[#10b981]/20 text-[#10b981]"
                }`}
              >
                <Building2 className="h-6 w-6" />
                <span className="text-xs font-medium">Qualificazione</span>
              </button>
            </ProtectedTab>
            <ProtectedTab tabId="civic">
              <button
                onClick={() => setActiveTab("civic")}
                className={`flex flex-col items-center gap-2 px-4 py-3 rounded-lg border transition-all ${
                  activeTab === "civic"
                    ? "bg-[#06b6d4] border-[#06b6d4] text-white shadow-lg"
                    : "bg-[#06b6d4]/10 border-[#06b6d4]/30 hover:bg-[#06b6d4]/20 text-[#06b6d4]"
                }`}
              >
                <Radio className="h-6 w-6" />
                <span className="text-xs font-medium">Segnalazioni & IoT</span>
              </button>
            </ProtectedTab>
            <ProtectedTab tabId="comuni">
              <button
                onClick={() => setActiveTab("comuni")}
                className={`flex flex-col items-center gap-2 px-4 py-3 rounded-lg border transition-all ${
                  activeTab === "comuni"
                    ? "bg-[#8b5cf6] border-[#8b5cf6] text-white shadow-lg"
                    : "bg-[#8b5cf6]/10 border-[#8b5cf6]/30 hover:bg-[#8b5cf6]/20 text-[#8b5cf6]"
                }`}
              >
                <Building2 className="h-6 w-6" />
                <span className="text-xs font-medium">Comuni</span>
              </button>
            </ProtectedTab>
            <ProtectedTab tabId="inspections">
              <button
                onClick={() => setActiveTab("inspections")}
                className={`flex flex-col items-center gap-2 px-4 py-3 rounded-lg border transition-all ${
                  activeTab === "inspections"
                    ? "bg-[#f59e0b] border-[#f59e0b] text-white shadow-lg"
                    : "bg-[#f59e0b]/10 border-[#f59e0b]/30 hover:bg-[#f59e0b]/20 text-[#f59e0b]"
                }`}
              >
                <Scale className="h-6 w-6" />
                <span className="text-xs font-medium">Controlli/Sanzioni</span>
              </button>
            </ProtectedTab>
            <ProtectedTab tabId="notifications">
              <button
                onClick={() => setActiveTab("notifications")}
                className={`flex flex-col items-center gap-2 px-4 py-3 rounded-lg border transition-all ${
                  activeTab === "notifications"
                    ? "bg-[#ec4899] border-[#ec4899] text-white shadow-lg"
                    : "bg-[#ec4899]/10 border-[#ec4899]/30 hover:bg-[#ec4899]/20 text-[#ec4899]"
                }`}
              >
                <Bell className="h-6 w-6" />
                <span className="text-xs font-medium">Notifiche</span>
              </button>
            </ProtectedTab>
            <ProtectedTab tabId="mobility">
              <button
                onClick={() => setActiveTab("mobility")}
                className={`flex flex-col items-center gap-2 px-4 py-3 rounded-lg border transition-all ${
                  activeTab === "mobility"
                    ? "bg-[#3b82f6] border-[#3b82f6] text-white shadow-lg"
                    : "bg-[#3b82f6]/10 border-[#3b82f6]/30 hover:bg-[#3b82f6]/20 text-[#3b82f6]"
                }`}
              >
                <Train className="h-6 w-6" />
                <span className="text-xs font-medium">Centro Mobilità</span>
              </button>
            </ProtectedTab>
            <ProtectedTab tabId="reports">
              <button
                onClick={() => setActiveTab("reports")}
                className={`flex flex-col items-center gap-2 px-4 py-3 rounded-lg border transition-all ${
                  activeTab === "reports"
                    ? "bg-[#a855f7] border-[#a855f7] text-white shadow-lg"
                    : "bg-[#a855f7]/10 border-[#a855f7]/30 hover:bg-[#a855f7]/20 text-[#a855f7]"
                }`}
              >
                <FileBarChart className="h-6 w-6" />
                <span className="text-xs font-medium">Report</span>
              </button>
            </ProtectedTab>
            <ProtectedTab tabId="integrations">
              <button
                onClick={() => setActiveTab("integrations")}
                className={`flex flex-col items-center gap-2 px-4 py-3 rounded-lg border transition-all ${
                  activeTab === "integrations"
                    ? "bg-[#14b8a6] border-[#14b8a6] text-white shadow-lg"
                    : "bg-[#14b8a6]/10 border-[#14b8a6]/30 hover:bg-[#14b8a6]/20 text-[#14b8a6]"
                }`}
              >
                <Plug className="h-6 w-6" />
                <span className="text-xs font-medium">Integrazioni</span>
              </button>
            </ProtectedTab>
            <ProtectedTab tabId="settings">
              <button
                onClick={() => setActiveTab("settings")}
                className={`flex flex-col items-center gap-2 px-4 py-3 rounded-lg border transition-all ${
                  activeTab === "settings"
                    ? "bg-[#0ea5e9] border-[#0ea5e9] text-white shadow-lg"
                    : "bg-[#0ea5e9]/10 border-[#0ea5e9]/30 hover:bg-[#0ea5e9]/20 text-[#0ea5e9]"
                }`}
              >
                <Globe className="h-6 w-6" />
                <span className="text-xs font-medium">Piattaforme PA</span>
              </button>
            </ProtectedTab>
            <ProtectedTab tabId="mercati">
              <button
                onClick={() => setActiveTab("mercati")}
                className={`flex flex-col items-center gap-2 px-4 py-3 rounded-lg border transition-all ${
                  activeTab === "mercati"
                    ? "bg-[#f59e0b] border-[#f59e0b] text-white shadow-lg"
                    : "bg-[#f59e0b]/10 border-[#f59e0b]/30 hover:bg-[#f59e0b]/20 text-[#f59e0b]"
                }`}
              >
                <Building2 className="h-6 w-6" />
                <span className="text-xs font-medium">Gestione Mercati</span>
              </button>
            </ProtectedTab>
            <ProtectedTab tabId="imprese">
              <button
                onClick={() => setActiveTab("imprese")}
                className={`flex flex-col items-center gap-2 px-4 py-3 rounded-lg border transition-all ${
                  activeTab === "imprese"
                    ? "bg-[#10b981] border-[#10b981] text-white shadow-lg"
                    : "bg-[#10b981]/10 border-[#10b981]/30 hover:bg-[#10b981]/20 text-[#10b981]"
                }`}
              >
                <Building2 className="h-6 w-6" />
                <span className="text-xs font-medium">Imprese</span>
              </button>
            </ProtectedTab>
            <ProtectedTab tabId="docs">
              <button
                onClick={() => setActiveTab("docs")}
                className={`flex flex-col items-center gap-2 px-4 py-3 rounded-lg border transition-all ${
                  activeTab === "docs"
                    ? "bg-[#06b6d4] border-[#06b6d4] text-white shadow-lg"
                    : "bg-[#06b6d4]/10 border-[#06b6d4]/30 hover:bg-[#06b6d4]/20 text-[#06b6d4]"
                }`}
              >
                <FileText className="h-6 w-6" />
                <span className="text-xs font-medium">Enti & Associazioni</span>
              </button>
            </ProtectedTab>
            <ProtectedTab tabId="mio">
              <button
                onClick={() => setActiveTab("mio")}
                className={`flex flex-col items-center gap-2 px-4 py-3 rounded-lg border transition-all ${
                  activeTab === "mio"
                    ? "bg-[#8b5cf6] border-[#8b5cf6] text-white shadow-lg"
                    : "bg-[#8b5cf6]/10 border-[#8b5cf6]/30 hover:bg-[#8b5cf6]/20 text-[#8b5cf6]"
                }`}
              >
                <Zap className="h-6 w-6" />
                <span className="text-xs font-medium">A99X</span>
              </button>
            </ProtectedTab>
            <ProtectedTab tabId="mappa">
              <button
                onClick={() => setActiveTab("mappa")}
                className={`flex flex-col items-center gap-2 px-4 py-3 rounded-lg border transition-all ${
                  activeTab === "mappa"
                    ? "bg-[#14b8a6] border-[#14b8a6] text-white shadow-lg"
                    : "bg-[#14b8a6]/10 border-[#14b8a6]/30 hover:bg-[#14b8a6]/20 text-[#14b8a6]"
                }`}
              >
                <MapPin className="h-6 w-6" />
                <span className="text-xs font-medium">Mappa GIS</span>
              </button>
            </ProtectedTab>
            <ProtectedTab tabId="workspace">
              <button
                onClick={() => setActiveTab("workspace")}
                className={`flex flex-col items-center gap-2 px-4 py-3 rounded-lg border transition-all ${
                  activeTab === "workspace"
                    ? "bg-[#06b6d4] border-[#06b6d4] text-white shadow-lg"
                    : "bg-[#06b6d4]/10 border-[#06b6d4]/30 hover:bg-[#06b6d4]/20 text-[#06b6d4]"
                }`}
              >
                <Globe className="h-6 w-6" />
                <span className="text-xs font-medium">Gestione HUB</span>
              </button>
            </ProtectedTab>
            <ProtectedTab tabId="council">
              <button
                onClick={() => (window.location.href = "/council")}
                className="flex flex-col items-center gap-2 px-4 py-3 rounded-lg border transition-all bg-gradient-to-br from-[#a855f7]/10 to-[#ec4899]/10 border-[#a855f7]/30 hover:from-[#a855f7]/20 hover:to-[#ec4899]/20 text-[#a855f7] hover:scale-105"
              >
                <Scale className="h-6 w-6" />
                <span className="text-xs font-medium">Concilio AI</span>
              </button>
            </ProtectedTab>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* TAB: DASHBOARD (Overview + Mercati unificati) */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Sotto-tab interni */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setDashboardSubTab("overview")}
                className={`px-4 py-2 rounded-lg border transition-all ${
                  dashboardSubTab === "overview"
                    ? "bg-[#14b8a6] border-[#14b8a6] text-white"
                    : "bg-[#14b8a6]/10 border-[#14b8a6]/30 hover:bg-[#14b8a6]/20 text-[#14b8a6]"
                }`}
              >
                <span className="text-sm font-medium">Overview</span>
              </button>
              <button
                onClick={() => setDashboardSubTab("mercati")}
                className={`px-4 py-2 rounded-lg border transition-all ${
                  dashboardSubTab === "mercati"
                    ? "bg-[#14b8a6] border-[#14b8a6] text-white"
                    : "bg-[#14b8a6]/10 border-[#14b8a6]/30 hover:bg-[#14b8a6]/20 text-[#14b8a6]"
                }`}
              >
                <span className="text-sm font-medium">Mercati</span>
              </button>
            </div>

            {/* Contenuto Overview */}
            {dashboardSubTab === "overview" && (
              <div className="space-y-6">
                {/* Crescita Utenti - Dati Reali dal Backend */}
                <Card className="bg-[#1a2332] border-[#14b8a6]/30">
                  <CardHeader>
                    <CardTitle className="text-[#e8fbff] flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-[#14b8a6]" />
                      Crescita Utenti
                      {realData.statsGrowth?.growth && (
                        <span className="text-xs text-[#10b981] ml-2">
                          ● Live
                        </span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {realData.statsGrowth?.growth &&
                    realData.statsGrowth.growth.length > 0 ? (
                      <div className="h-64 flex items-end justify-between gap-2">
                        {(realData.statsGrowth?.growth || []).map(
                          (item: any, i: number) => {
                            const growthData =
                              realData.statsGrowth?.growth || [];
                            const maxUsers = Math.max(
                              ...growthData.map(
                                (d: any) => parseInt(d.new_users) || 0
                              )
                            );
                            const currentValue = parseInt(item.new_users) || 0;
                            // Formatta la data della settimana
                            const weekDate = new Date(item.week);
                            const formattedDate = weekDate.toLocaleDateString(
                              "it-IT",
                              { day: "2-digit", month: "short" }
                            );
                            return (
                              <div
                                key={i}
                                className="flex-1 flex flex-col items-center gap-2"
                              >
                                <div
                                  className="w-full bg-[#14b8a6]/20 rounded-t-lg relative"
                                  style={{
                                    height: `${maxUsers > 0 ? (currentValue / maxUsers) * 100 : 0}%`,
                                    minHeight: "20px",
                                  }}
                                >
                                  <div className="absolute inset-0 bg-gradient-to-t from-[#14b8a6] to-[#14b8a6]/50 rounded-t-lg"></div>
                                </div>
                                <span className="text-xs text-[#e8fbff]/70">
                                  {formattedDate}
                                </span>
                                <span className="text-sm font-semibold text-[#14b8a6]">
                                  {currentValue.toLocaleString()}
                                </span>
                              </div>
                            );
                          }
                        )}
                      </div>
                    ) : (
                      <div className="h-64 flex items-center justify-center">
                        <div className="text-center">
                          <TrendingUp className="h-12 w-12 text-[#14b8a6]/30 mx-auto mb-2" />
                          <p className="text-[#e8fbff]/50">
                            Caricamento dati crescita...
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Mappa Rete HUB Italia - Overview */}
                <GestioneHubMapWrapper />
              </div>
            )}

            {/* Contenuto Mercati */}
            {dashboardSubTab === "mercati" && (
              <div className="space-y-6">
                {/* Mappa Rete HUB Italia - Mercati */}
                <GestioneHubMapWrapper />

                <Card className="bg-[#1a2332] border-[#14b8a6]/30">
                  <CardHeader>
                    <CardTitle className="text-[#e8fbff] flex items-center gap-2">
                      <Store className="h-5 w-5 text-[#14b8a6]" />
                      Ranking Mercati Più Frequentati
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {mockData.topMarkets.map((market, i) => (
                      <div
                        key={i}
                        className="p-4 bg-[#0b1220] rounded-lg border border-[#14b8a6]/20 hover:border-[#14b8a6]/50 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl font-bold text-[#14b8a6]">
                              #{market.rank}
                            </span>
                            <span className="text-[#e8fbff] font-semibold">
                              {market.name}
                            </span>
                          </div>
                          <div className="flex gap-1">
                            {[...Array(5)].map((_, j) => (
                              <span
                                key={j}
                                className={
                                  j < market.rank
                                    ? "text-[#f59e0b]"
                                    : "text-[#e8fbff]/20"
                                }
                              >
                                ⭐
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-[#e8fbff]/70">Visite</span>
                            <p className="text-[#14b8a6] font-semibold">
                              {market.visits.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <span className="text-[#e8fbff]/70">
                              Utenti Unici
                            </span>
                            <p className="text-[#14b8a6] font-semibold">
                              {market.users.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <span className="text-[#e8fbff]/70">
                              Durata Media
                            </span>
                            <p className="text-[#14b8a6] font-semibold">
                              {market.duration} min
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* TAB: CLIENTI - Anagrafica Cittadini */}
          <TabsContent value="users" className="space-y-6">
            <ClientiTab />
          </TabsContent>

          {/* TAB: WALLET / PAGOPA - Borsellino Elettronico Prepagato */}
          <TabsContent value="wallet" className="space-y-6">
            <WalletPanel />
          </TabsContent>

          {/* TAB 4: GAMING & REWARDS */}
          <TabsContent value="gaming" className="space-y-6">
            {/* Gaming & Rewards Panel */}
            <GamingRewardsPanel />
          </TabsContent>

          {/* TAB 5: SOSTENIBILITÀ */}
          <TabsContent value="sustainability" className="space-y-6">
            <Card className="bg-[#1a2332] border-[#14b8a6]/30">
              <CardHeader>
                <CardTitle className="text-[#e8fbff] flex items-center gap-2">
                  <Leaf className="h-5 w-5 text-[#14b8a6]" />
                  Rating Sostenibilità Popolazione
                  {realData.statsOverview && (
                    <span className="text-xs text-[#10b981] ml-2">
                      ● Dati Reali
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-6">
                  <div className="text-6xl font-bold text-[#14b8a6] mb-2">
                    {realData.overview?.sustainabilityRating || 0}/10
                  </div>
                  <p className="text-[#e8fbff]/70">
                    Media popolazione basata su TCC
                  </p>
                </div>

                {/* Dati TCC Reali */}
                {realData.statsOverview?.tcc && (
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-4 bg-[#0b1220] rounded-lg border border-[#10b981]/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Leaf className="h-5 w-5 text-[#10b981]" />
                        <span className="text-[#e8fbff]/70 text-sm">
                          TCC in Circolazione
                        </span>
                      </div>
                      <div className="text-3xl font-bold text-[#10b981]">
                        {(
                          realData.statsOverview.tcc.total_in_circulation || 0
                        ).toLocaleString("it-IT")}
                      </div>
                    </div>
                    <div className="p-4 bg-[#0b1220] rounded-lg border border-[#14b8a6]/30">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-5 w-5 text-[#14b8a6]" />
                        <span className="text-[#e8fbff]/70 text-sm">
                          TCC Emessi Totali
                        </span>
                      </div>
                      <div className="text-3xl font-bold text-[#14b8a6]">
                        {(
                          realData.statsOverview.tcc.total_issued || 0
                        ).toLocaleString("it-IT")}
                      </div>
                    </div>
                    <div className="p-4 bg-[#0b1220] rounded-lg border border-[#f59e0b]/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Award className="h-5 w-5 text-[#f59e0b]" />
                        <span className="text-[#e8fbff]/70 text-sm">
                          TCC Riscattati
                        </span>
                      </div>
                      <div className="text-3xl font-bold text-[#f59e0b]">
                        {(
                          realData.statsOverview.tcc.total_redeemed || 0
                        ).toLocaleString("it-IT")}
                      </div>
                    </div>
                    <div className="p-4 bg-[#0b1220] rounded-lg border border-[#8b5cf6]/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="h-5 w-5 text-[#8b5cf6]" />
                        <span className="text-[#e8fbff]/70 text-sm">
                          Utenti TCC
                        </span>
                      </div>
                      <div className="text-3xl font-bold text-[#8b5cf6]">
                        {(
                          realData.statsOverview.tcc.active_users || 0
                        ).toLocaleString("it-IT")}
                      </div>
                    </div>
                  </div>
                )}

                {/* Indicatori Sostenibilità */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-[#0b1220] rounded-lg">
                    <span className="text-[#e8fbff]">Carbon Credits (TCC)</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-[#14b8a6]/20 rounded-full h-2">
                        <div
                          className="bg-[#14b8a6] h-2 rounded-full"
                          style={{
                            width: `${Math.min(((realData.statsOverview?.tcc?.total_in_circulation || 0) / 20000) * 100, 100)}%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-[#14b8a6] font-semibold">
                        {(
                          (realData.statsOverview?.tcc?.total_in_circulation ||
                            0) / 2000
                        ).toFixed(1)}
                        /10
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-[#0b1220] rounded-lg">
                    <span className="text-[#e8fbff]">Tasso Riscatto TCC</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-[#14b8a6]/20 rounded-full h-2">
                        <div
                          className="bg-[#10b981] h-2 rounded-full"
                          style={{
                            width: `${
                              realData.statsOverview?.tcc?.total_issued > 0
                                ? ((realData.statsOverview?.tcc
                                    ?.total_redeemed || 0) /
                                    (realData.statsOverview?.tcc
                                      ?.total_issued || 1)) *
                                  100
                                : 0
                            }%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-[#10b981] font-semibold">
                        {realData.statsOverview?.tcc?.total_issued > 0
                          ? (
                              ((realData.statsOverview?.tcc?.total_redeemed ||
                                0) /
                                (realData.statsOverview?.tcc?.total_issued ||
                                  1)) *
                              10
                            ).toFixed(1)
                          : "0.0"}
                        /10
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-[#0b1220] rounded-lg">
                    <span className="text-[#e8fbff]">CO₂ Risparmiata</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[#10b981] font-semibold">
                        {(
                          realData.statsOverview?.tcc?.total_redeemed || 0
                        ).toLocaleString("it-IT")}{" "}
                        kg
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-[#0b1220] rounded-lg">
                    <span className="text-[#e8fbff]">Alberi Equivalenti</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[#14b8a6] font-semibold">
                        {Math.round(
                          (realData.statsOverview?.tcc?.total_redeemed || 0) /
                            22
                        )}{" "}
                        alberi
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 6: TPAS / Associazioni */}
          <TabsContent value="tpas" className="space-y-6">
            {isAssociazioneImpersonation() ? (
              <>
                <AnagraficaAssociazionePanel />
                <Card className="bg-[#0f172a] border-[#3b82f6]/20">
                  <CardContent className="p-4 text-sm text-[#e8fbff]/70">
                    <p>
                      Area amministrativa dell'associazione: qui si gestiscono i dati
                      anagrafici, la configurazione istituzionale, i contratti e la
                      fatturazione. Le funzioni operative, inclusi servizi, corsi,
                      wallet e associati, sono centralizzate nel tab "Enti e
                      Associazioni" per mantenere una sola fonte di verità sui
                      prezzi da esporre all'app impresa.
                    </p>
                  </CardContent>
                </Card>
              </>
            ) : (
              <AssociazioniPanel />
            )}
          </TabsContent>

          {/* TAB 7: CARBON CREDITS */}
          <TabsContent value="carboncredits" className="space-y-6">
            {/* SELETTORE COMUNE - TCC v2.1 */}
            <Card className="bg-[#1a2332] border-[#14b8a6]/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-[#e8fbff] flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-[#14b8a6]" />
                  Seleziona Comune
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <select
                    value={selectedComuneId || ""}
                    onChange={e =>
                      setSelectedComuneId(parseInt(e.target.value))
                    }
                    className="flex-1 p-3 bg-[#0b1220] border border-[#14b8a6]/30 rounded-lg text-[#e8fbff] focus:ring-2 focus:ring-[#14b8a6] focus:border-transparent"
                  >
                    {tccComuni.length === 0 && (
                      <option value="">Caricamento comuni...</option>
                    )}
                    {tccComuni.map(comune => (
                      <option key={comune.hub_id} value={comune.hub_id}>
                        {comune.nome} ({comune.provincia}) - {comune.hub_name}
                      </option>
                    ))}
                  </select>
                  {tccComuni.length > 0 && (
                    <div className="text-sm text-[#e8fbff]/70">
                      <span className="text-[#14b8a6] font-semibold">
                        {tccComuni.length}
                      </span>{" "}
                      hub attivi
                    </div>
                  )}
                </div>
                {tccComuni.length === 0 && (
                  <div className="mt-2 text-sm text-[#f59e0b]">
                    Nessun comune con area geografica definita. Crea prima
                    un'area hub.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* DATI AMBIENTALI IN TEMPO REALE */}
            <Card className="bg-[#1a2332] border-[#14b8a6]/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-[#e8fbff] flex items-center gap-2">
                  <Globe className="h-5 w-5 text-[#14b8a6]" />
                  Dati Ambientali in Tempo Reale
                  {envLoading && (
                    <RefreshCw className="h-4 w-4 animate-spin text-[#14b8a6]" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* METEO */}
                  <div className="p-4 bg-gradient-to-br from-[#3b82f6]/20 to-[#3b82f6]/5 border border-[#3b82f6]/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <CloudRain className="h-5 w-5 text-[#3b82f6]" />
                      <span className="text-sm font-semibold text-[#e8fbff]">
                        Meteo
                      </span>
                    </div>
                    {envData?.weather ? (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[#e8fbff]/70 text-sm">
                            Temperatura
                          </span>
                          <span className="text-2xl font-bold text-[#3b82f6]">
                            {envData.weather.temperature}°C
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[#e8fbff]/70 text-sm">
                            Condizioni
                          </span>
                          <span className="text-sm text-[#e8fbff]">
                            {envData.weather.weather_description}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[#e8fbff]/70 text-sm">
                            Umidità
                          </span>
                          <span className="text-sm text-[#e8fbff]">
                            {envData.weather.humidity}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[#e8fbff]/70 text-sm">
                            Vento
                          </span>
                          <span className="text-sm text-[#e8fbff]">
                            {envData.weather.wind_speed} km/h
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-[#e8fbff]/50 text-sm">
                        Caricamento...
                      </div>
                    )}
                  </div>

                  {/* QUALITÀ ARIA */}
                  <div className="p-4 bg-gradient-to-br from-[#10b981]/20 to-[#10b981]/5 border border-[#10b981]/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <Wind className="h-5 w-5 text-[#10b981]" />
                      <span className="text-sm font-semibold text-[#e8fbff]">
                        Qualità Aria
                      </span>
                    </div>
                    {envData?.air_quality ? (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[#e8fbff]/70 text-sm">
                            AQI Europeo
                          </span>
                          <div className="flex items-center gap-2">
                            <span
                              className="text-2xl font-bold"
                              style={{ color: envData.air_quality.aqi_color }}
                            >
                              {envData.air_quality.european_aqi}
                            </span>
                            <span
                              className="text-xs px-2 py-1 rounded"
                              style={{
                                backgroundColor:
                                  envData.air_quality.aqi_color + "30",
                                color: envData.air_quality.aqi_color,
                              }}
                            >
                              {envData.air_quality.aqi_label}
                            </span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <div className="text-center p-2 bg-[#0b1220] rounded">
                            <div className="text-xs text-[#e8fbff]/50">
                              PM10
                            </div>
                            <div className="text-sm font-semibold text-[#e8fbff]">
                              {envData.air_quality.pm10?.toFixed(1)}
                            </div>
                          </div>
                          <div className="text-center p-2 bg-[#0b1220] rounded">
                            <div className="text-xs text-[#e8fbff]/50">
                              PM2.5
                            </div>
                            <div className="text-sm font-semibold text-[#e8fbff]">
                              {envData.air_quality.pm2_5?.toFixed(1)}
                            </div>
                          </div>
                          <div className="text-center p-2 bg-[#0b1220] rounded">
                            <div className="text-xs text-[#e8fbff]/50">NO₂</div>
                            <div className="text-sm font-semibold text-[#e8fbff]">
                              {envData.air_quality.no2?.toFixed(1)}
                            </div>
                          </div>
                          <div className="text-center p-2 bg-[#0b1220] rounded">
                            <div className="text-xs text-[#e8fbff]/50">O₃</div>
                            <div className="text-sm font-semibold text-[#e8fbff]">
                              {envData.air_quality.o3?.toFixed(1)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-[#e8fbff]/50 text-sm">
                        Caricamento...
                      </div>
                    )}
                  </div>

                  {/* PREZZO ETS */}
                  <div className="p-4 bg-gradient-to-br from-[#f59e0b]/20 to-[#f59e0b]/5 border border-[#f59e0b]/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <Euro className="h-5 w-5 text-[#f59e0b]" />
                      <span className="text-sm font-semibold text-[#e8fbff]">
                        Prezzo EU ETS
                      </span>
                    </div>
                    {envData?.ets ? (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[#e8fbff]/70 text-sm">
                            €/tonnellata CO₂
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-[#f59e0b]">
                              €
                            </span>
                            <input
                              type="number"
                              value={editableEtsPrice}
                              onChange={e =>
                                setEditableEtsPrice(
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              onBlur={handleEtsPriceUpdate}
                              className="w-20 text-2xl font-bold text-[#f59e0b] bg-transparent border-b border-[#f59e0b]/50 focus:border-[#f59e0b] outline-none text-right"
                              step="0.01"
                            />
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[#e8fbff]/70 text-sm">
                            Valore 1 TCC
                          </span>
                          <span className="text-lg font-semibold text-[#14b8a6]">
                            €
                            {(envData.tcc?.effective_value || 0).toLocaleString(
                              "it-IT",
                              {
                                minimumFractionDigits: 4,
                                maximumFractionDigits: 4,
                              }
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[#e8fbff]/70 text-sm">
                            Policy Multiplier
                          </span>
                          <span className="text-sm text-[#e8fbff]">
                            {envData.tcc?.policy_multiplier}x
                          </span>
                        </div>
                        <div className="text-xs text-[#e8fbff]/50 mt-2 pt-2 border-t border-[#f59e0b]/20">
                          Formula: 1 TCC = 1 kg CO₂ = ETS/1000
                        </div>
                      </div>
                    ) : (
                      <div className="text-[#e8fbff]/50 text-sm">
                        Caricamento...
                      </div>
                    )}
                  </div>
                </div>

                {/* Info Hub e Timestamp */}
                {envData?.hub && (
                  <div className="mt-4 flex items-center justify-between text-xs text-[#e8fbff]/50">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3 w-3" />
                      <span>
                        {envData.hub.city} (
                        {envData.hub.coordinates.lat.toFixed(4)},{" "}
                        {envData.hub.coordinates.lon.toFixed(4)})
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      <span>
                        Aggiornato:{" "}
                        {new Date(envData.timestamp).toLocaleTimeString(
                          "it-IT"
                        )}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* DATI REALI DAL DATABASE */}
            {fundStats && (
              <Card className="bg-[#1a2332] border-[#14b8a6]/30">
                <CardHeader>
                  <CardTitle className="text-[#e8fbff] flex items-center gap-2">
                    <Activity className="h-5 w-5 text-[#14b8a6]" />
                    Statistiche TCC in Tempo Reale
                    {fundLoading && (
                      <RefreshCw className="h-4 w-4 animate-spin text-[#14b8a6]" />
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="p-4 bg-gradient-to-br from-[#14b8a6]/20 to-[#14b8a6]/5 border border-[#14b8a6]/30 rounded-lg">
                      <div className="text-sm text-[#e8fbff]/70 mb-1">
                        TCC in Circolazione
                      </div>
                      <div className="text-3xl font-bold text-[#14b8a6]">
                        {formatNumberIT(fundStats.total_circulation)}
                      </div>
                      <div className="text-xs text-[#e8fbff]/50">
                        Nei wallet utenti
                      </div>
                    </div>
                    <div className="p-4 bg-[#0b1220] border border-[#10b981]/20 rounded-lg">
                      <div className="text-sm text-[#e8fbff]/70 mb-1">
                        TCC Totali Rilasciati
                      </div>
                      <div className="text-2xl font-bold text-[#10b981]">
                        {formatNumberIT(fundStats.total_issued)}
                      </div>
                      <div className="text-xs text-[#e8fbff]/50">
                        Dagli operatori
                      </div>
                    </div>
                    <div className="p-4 bg-[#0b1220] border border-[#f59e0b]/20 rounded-lg">
                      <div className="text-sm text-[#e8fbff]/70 mb-1">
                        TCC Totali Riscattati
                      </div>
                      <div className="text-2xl font-bold text-[#f59e0b]">
                        {formatNumberIT(fundStats.total_redeemed)}
                      </div>
                      <div className="text-xs text-[#e8fbff]/50">
                        Dai clienti
                      </div>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-[#8b5cf6]/20 to-[#8b5cf6]/5 border border-[#8b5cf6]/30 rounded-lg">
                      <div className="text-sm text-[#e8fbff]/70 mb-1">
                        Fabbisogno Fondo
                      </div>
                      <div className="text-2xl font-bold text-[#8b5cf6]">
                        {formatEuroIT(fundStats.fund_requirement_eur)}
                      </div>
                      <div className="text-xs text-[#e8fbff]/50">
                        Per coprire circolazione
                      </div>
                    </div>
                  </div>

                  {/* Statistiche Oggi */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="p-3 bg-[#10b981]/10 border border-[#10b981]/30 rounded-lg">
                      <div className="text-xs text-[#e8fbff]/70">
                        Rilasciati Oggi
                      </div>
                      <div className="text-xl font-bold text-[#10b981]">
                        {formatNumberIT(fundStats.today?.issued || 0)} TCC
                      </div>
                    </div>
                    <div className="p-3 bg-[#f59e0b]/10 border border-[#f59e0b]/30 rounded-lg">
                      <div className="text-xs text-[#e8fbff]/70">
                        Riscattati Oggi
                      </div>
                      <div className="text-xl font-bold text-[#f59e0b]">
                        {formatNumberIT(fundStats.today?.redeemed || 0)} TCC
                      </div>
                    </div>
                    <div className="p-3 bg-[#14b8a6]/10 border border-[#14b8a6]/30 rounded-lg">
                      <div className="text-xs text-[#e8fbff]/70">
                        Vendite Oggi
                      </div>
                      <div className="text-xl font-bold text-[#14b8a6]">
                        {formatEuroIT(fundStats.today?.sales_eur || 0)}
                      </div>
                    </div>
                  </div>

                  {/* Utenti */}
                  <div className="flex items-center justify-between p-3 bg-[#0b1220] rounded-lg">
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-[#14b8a6]" />
                      <span className="text-[#e8fbff]">Utenti Registrati</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-lg font-bold text-[#e8fbff]">
                          {formatNumberIT(fundStats.users?.total || 0)}
                        </div>
                        <div className="text-xs text-[#e8fbff]/50">Totali</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-[#10b981]">
                          {formatNumberIT(fundStats.users?.active || 0)}
                        </div>
                        <div className="text-xs text-[#e8fbff]/50">Con TCC</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Fondo Liquidità - SIMULATORE */}
            <Card className="bg-[#1a2332] border-[#14b8a6]/30">
              <CardHeader>
                <CardTitle className="text-[#e8fbff] flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-[#14b8a6]" />
                  Fondo Liquidità
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="p-4 bg-gradient-to-br from-[#10b981]/20 to-[#10b981]/5 border border-[#10b981]/30 rounded-lg">
                    <div className="text-sm text-[#e8fbff]/70 mb-1">
                      Saldo Attuale (click to edit)
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-[#10b981]">
                        €
                      </span>
                      <input
                        type="number"
                        value={editableParams.fundBalance}
                        onChange={e =>
                          setEditableParams({
                            ...editableParams,
                            fundBalance: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="text-3xl font-bold text-[#10b981] bg-transparent border-b-2 border-[#10b981]/50 focus:border-[#10b981] outline-none w-full"
                      />
                    </div>
                  </div>
                  <div className="p-4 bg-[#0b1220] border border-[#14b8a6]/20 rounded-lg">
                    <div className="text-sm text-[#e8fbff]/70 mb-1">
                      Burn Rate (click to edit)
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-[#f59e0b]">
                        €
                      </span>
                      <input
                        type="number"
                        value={editableParams.burnRate}
                        onChange={e =>
                          setEditableParams({
                            ...editableParams,
                            burnRate: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="text-2xl font-bold text-[#f59e0b] bg-transparent border-b-2 border-[#f59e0b]/50 focus:border-[#f59e0b] outline-none w-full"
                      />
                      <span className="text-sm text-[#e8fbff]/70">/mese</span>
                    </div>
                  </div>
                  <div className="p-4 bg-[#0b1220] border border-[#14b8a6]/20 rounded-lg">
                    <div className="text-sm text-[#e8fbff]/70 mb-1">
                      Mesi Rimanenti
                    </div>
                    <div className="text-2xl font-bold text-[#14b8a6]">
                      {calculateMonthsRemaining()}
                    </div>
                  </div>
                  <div className="p-4 bg-[#0b1220] border border-[#14b8a6]/20 rounded-lg">
                    <div className="text-sm text-[#e8fbff]/70 mb-1">Valuta</div>
                    <div className="text-2xl font-bold text-[#e8fbff]">EUR</div>
                  </div>
                </div>

                {/* Entrate */}
                <div className="mb-4">
                  <h4 className="text-[#e8fbff] font-semibold mb-3 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-[#10b981]" />
                    Entrate Fondo
                  </h4>
                  <div className="space-y-2">
                    {(
                      fundStats?.sources || [
                        {
                          name: "Fondo Comunale",
                          amount: editableParams.fundBalance,
                          date: new Date().toISOString().split("T")[0],
                        },
                      ]
                    ).map((source: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-[#0b1220] rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Coins className="h-5 w-5 text-[#10b981]" />
                          <div>
                            <div className="text-[#e8fbff] font-medium">
                              {source.name}
                            </div>
                            <div className="text-xs text-[#e8fbff]/50">
                              {source.date}
                            </div>
                          </div>
                        </div>
                        <div className="text-[#10b981] font-semibold">
                          +€{(source.amount || 0).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Uscite */}
                <div>
                  <h4 className="text-[#e8fbff] font-semibold mb-3 flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-[#ef4444]" />
                    Uscite Fondo
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-lg">
                      <div className="text-xs text-[#e8fbff]/70 mb-1">
                        Rimborsi
                      </div>
                      <div className="text-xl font-bold text-[#ef4444]">
                        €
                        {(
                          fundStats?.expenses?.reimbursements ||
                          parseFloat(calculateReimbursementNeeded())
                        ).toLocaleString()}
                      </div>
                    </div>
                    <div className="p-3 bg-[#f59e0b]/10 border border-[#f59e0b]/30 rounded-lg">
                      <div className="text-xs text-[#e8fbff]/70 mb-1">
                        Incentivi
                      </div>
                      <div className="text-xl font-bold text-[#f59e0b]">
                        €
                        {(
                          fundStats?.expenses?.incentives || 0
                        ).toLocaleString()}
                      </div>
                    </div>
                    <div className="p-3 bg-[#8b5cf6]/10 border border-[#8b5cf6]/30 rounded-lg">
                      <div className="text-xs text-[#e8fbff]/70 mb-1">
                        Operativi
                      </div>
                      <div className="text-xl font-bold text-[#8b5cf6]">
                        €
                        {(
                          fundStats?.expenses?.operations || 0
                        ).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Valore TCC e Manopola Politica */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Valore TCC */}
              <Card className="bg-[#1a2332] border-[#14b8a6]/30">
                <CardHeader>
                  <CardTitle className="text-[#e8fbff] flex items-center gap-2">
                    <Coins className="h-5 w-5 text-[#14b8a6]" />
                    Valore Token Carbon Credit (TCC)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <div className="text-sm text-[#e8fbff]/70 mb-2">
                      Valore Corrente
                    </div>
                    <div className="text-5xl font-bold text-[#14b8a6] mb-1">
                      €
                      {appliedTccValue.toLocaleString("it-IT", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 4,
                      })}
                    </div>
                    <div className="text-sm text-[#e8fbff]/50">per 1 TCC</div>
                  </div>

                  <div className="mb-4">
                    <div className="text-sm text-[#e8fbff]/70 mb-3">
                      Storico Variazioni
                    </div>
                    <div className="space-y-2">
                      {(
                        fundStats?.value_history || [
                          {
                            date: new Date().toISOString().split("T")[0],
                            value: appliedTccValue,
                          },
                        ]
                      ).map((item: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 bg-[#0b1220] rounded"
                        >
                          <span className="text-xs text-[#e8fbff]/70">
                            {item.date}
                          </span>
                          <span className="text-sm font-semibold text-[#14b8a6]">
                            €
                            {parseFloat(item.value || 0).toLocaleString(
                              "it-IT",
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 4,
                              }
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Leva Politica TCC */}
              <Card className="bg-[#1a2332] border-[#8b5cf6]/30">
                <CardHeader>
                  <CardTitle className="text-[#e8fbff] flex items-center gap-2">
                    <Sliders className="h-5 w-5 text-[#8b5cf6]" />
                    Leva Politica TCC
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <label className="text-sm text-[#e8fbff]/70 mb-2 block">
                      TCC assegnati per €10 spesi
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="30"
                      step="1"
                      value={tccValue}
                      onChange={e => setTccValue(parseFloat(e.target.value))}
                      className="w-full h-2 bg-[#0b1220] rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-[#e8fbff]/50 mt-1">
                      <span>0</span>
                      <span>10</span>
                      <span>20</span>
                      <span>30</span>
                    </div>
                  </div>

                  <div className="p-4 bg-[#8b5cf6]/10 border border-[#8b5cf6]/30 rounded-lg mb-4">
                    <div className="text-sm text-[#e8fbff] font-semibold mb-2">
                      Anteprima Assegnazione
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-[#e8fbff]/70">€10 spesi =</span>
                        <span className="text-[#10b981] font-bold text-lg">
                          {Math.round(tccValue)} TCC
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#e8fbff]/70">€50 spesi =</span>
                        <span className="text-[#10b981] font-semibold">
                          {Math.round(tccValue * 5)} TCC
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#e8fbff]/70">€100 spesi =</span>
                        <span className="text-[#10b981] font-semibold">
                          {Math.round(tccValue * 10)} TCC
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="text-sm text-[#e8fbff]/70 mb-2 block">
                      Oppure inserisci manualmente:
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="30"
                        value={Math.round(tccValue)}
                        onChange={e =>
                          setTccValue(
                            Math.min(
                              30,
                              Math.max(0, parseFloat(e.target.value) || 0)
                            )
                          )
                        }
                        className="flex-1 px-3 py-2 bg-[#0b1220] border border-[#8b5cf6]/30 rounded-lg text-[#e8fbff] text-center text-lg font-bold focus:ring-2 focus:ring-[#8b5cf6]"
                      />
                      <span className="text-[#e8fbff]/70">TCC per €10</span>
                    </div>
                  </div>

                  <Button
                    onClick={async () => {
                      if (!selectedComuneId) {
                        alert("Seleziona prima un comune!");
                        return;
                      }
                      try {
                        // tccValue = valore dello slider (TCC per €10 spesi)
                        // policy_multiplier = tccValue direttamente
                        // Es: slider su 10 → policy_multiplier = 10 → €100 spesi = (100/10)*10 = 100 TCC
                        const policyMultiplier = tccValue;

                        const response = await authenticatedFetch(
                          `${TCC_API}/api/tcc/v2/config/update/${selectedComuneId}`,
                          {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              policy_multiplier: policyMultiplier,
                              // NON sovrascrivere tcc_value - deve rimanere €0,089!
                              policy_notes: `Leva: ${policyMultiplier} TCC per €10 - ${new Date().toLocaleDateString("it-IT")}`,
                            }),
                          }
                        );
                        const data = await response.json();
                        if (data.success) {
                          setAppliedTccValue(0.089); // Valore fisso EU ETS
                          alert(
                            `Leva politica salvata!\n\n€10 spesi = ${policyMultiplier} TCC assegnati`
                          );
                        } else {
                          alert(
                            `Errore: ${data.error || "Impossibile salvare"}`
                          );
                        }
                      } catch (error) {
                        console.error("Error updating TCC config:", error);
                        alert("Errore di connessione");
                      }
                    }}
                    className="w-full bg-[#8b5cf6] hover:bg-[#8b5cf6]/80"
                    disabled={!selectedComuneId}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Salva Leva Politica
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Regolazione per Area e Categoria */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Per Area */}
              <Card className="bg-[#1a2332] border-[#14b8a6]/30">
                <CardHeader>
                  <CardTitle className="text-[#e8fbff] flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-[#14b8a6]" />
                    Bonus TCC per Area
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {calculateAreaValues().map((area, idx) => (
                      <div key={idx} className="p-3 bg-[#0b1220] rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[#e8fbff] font-medium">
                            {area.area}
                          </span>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={area.boost}
                              onChange={e => {
                                const newBoosts = [
                                  ...editableParams.areaBoosts,
                                ];
                                newBoosts[idx].boost =
                                  parseFloat(e.target.value) || 0;
                                setEditableParams({
                                  ...editableParams,
                                  areaBoosts: newBoosts,
                                });
                              }}
                              className={`text-sm font-semibold px-2 py-1 rounded w-16 text-center ${
                                area.boost > 0
                                  ? "bg-[#10b981]/20 text-[#10b981]"
                                  : area.boost < 0
                                    ? "bg-[#ef4444]/20 text-[#ef4444]"
                                    : "bg-[#14b8a6]/20 text-[#14b8a6]"
                              } border-none focus:ring-2 focus:ring-[#14b8a6]`}
                            />
                            <span className="text-xs text-[#e8fbff]/50">%</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-[#e8fbff]/50">
                            €10 spesi =
                          </span>
                          <span className="text-lg font-bold text-[#10b981]">
                            {Math.round(10 * tccValue * (1 + area.boost / 100))}{" "}
                            TCC
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Per Categoria */}
              <Card className="bg-[#1a2332] border-[#14b8a6]/30">
                <CardHeader>
                  <CardTitle className="text-[#e8fbff] flex items-center gap-2">
                    <Award className="h-5 w-5 text-[#14b8a6]" />
                    Bonus TCC per Categoria
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {calculateCategoryValues().map((cat, idx) => (
                      <div key={idx} className="p-3 bg-[#0b1220] rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[#e8fbff] font-medium">
                            {cat.category}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-[#e8fbff]/50">+</span>
                            <input
                              type="number"
                              value={cat.boost}
                              onChange={e => {
                                const newBoosts = [
                                  ...editableParams.categoryBoosts,
                                ];
                                newBoosts[idx].boost =
                                  parseFloat(e.target.value) || 0;
                                setEditableParams({
                                  ...editableParams,
                                  categoryBoosts: newBoosts,
                                });
                              }}
                              className={`text-sm font-semibold px-2 py-1 rounded w-16 text-center ${
                                cat.boost > 0
                                  ? "bg-[#10b981]/20 text-[#10b981]"
                                  : "bg-[#14b8a6]/20 text-[#14b8a6]"
                              } border-none focus:ring-2 focus:ring-[#14b8a6]`}
                            />
                            <span className="text-xs text-[#e8fbff]/50">%</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-[#e8fbff]/50">
                            €10 spesi =
                          </span>
                          <span className="text-lg font-bold text-[#10b981]">
                            {Math.round(10 * tccValue * (1 + cat.boost / 100))}{" "}
                            TCC
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sistema Rimborsi */}
            <Card className="bg-[#1a2332] border-[#14b8a6]/30">
              <CardHeader>
                <CardTitle className="text-[#e8fbff] flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-[#14b8a6]" />
                  Sistema Rimborsi Negozi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="p-4 bg-[#f59e0b]/10 border border-[#f59e0b]/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-5 w-5 text-[#f59e0b]" />
                      <span className="text-[#e8fbff] font-semibold">
                        Pending
                      </span>
                    </div>
                    <div className="text-3xl font-bold text-[#f59e0b] mb-1">
                      {fundStats?.reimbursements?.pending?.count || 0}
                    </div>
                    <div className="text-sm text-[#e8fbff]/70">
                      €
                      {(
                        fundStats?.reimbursements?.pending?.amount || 0
                      ).toLocaleString()}{" "}
                      da processare
                    </div>
                  </div>
                  <div className="p-4 bg-[#10b981]/10 border border-[#10b981]/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-5 w-5 text-[#10b981]" />
                      <span className="text-[#e8fbff] font-semibold">
                        Processati
                      </span>
                    </div>
                    <div className="text-3xl font-bold text-[#10b981] mb-1">
                      {fundStats?.reimbursements?.processed?.count || 0}
                    </div>
                    <div className="text-sm text-[#e8fbff]/70">
                      €
                      {(
                        fundStats?.reimbursements?.processed?.amount || 0
                      ).toLocaleString()}{" "}
                      totali
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="text-[#e8fbff] font-semibold mb-3">
                    Top Negozi per Crediti Incassati
                  </h4>
                  <div className="space-y-2">
                    {(fundStats?.top_operators || []).map(
                      (shop: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 bg-[#0b1220] rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#14b8a6]/20 flex items-center justify-center">
                              <span className="text-[#14b8a6] font-bold">
                                #{idx + 1}
                              </span>
                            </div>
                            <span className="text-[#e8fbff]">
                              {shop.name || shop.operator_name || "Operatore"}
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="text-[#14b8a6] font-semibold">
                              {(
                                shop.credits ||
                                shop.total_issued ||
                                0
                              ).toLocaleString()}{" "}
                              TCC
                            </div>
                            <div className="text-xs text-[#e8fbff]/50">
                              €
                              {(
                                shop.euros ||
                                shop.total_issued * appliedTccValue ||
                                0
                              ).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    className="flex-1 bg-[#14b8a6] hover:bg-[#14b8a6]/80"
                    onClick={() => {
                      // Export CSV dei rimborsi
                      const data = fundStats?.top_operators || [];
                      if (data.length === 0) {
                        toast.info("Nessun dato da esportare");
                        return;
                      }
                      const csv =
                        "Operatore,TCC Rilasciati,TCC Riscattati,Vendite EUR\n" +
                        data
                          .map(
                            (op: any) =>
                              `${op.operator_name || op.operator_id},${op.total_issued || 0},${op.total_redeemed || 0},${op.total_sales || 0}`
                          )
                          .join("\n");
                      const blob = new Blob([csv], { type: "text/csv" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `rimborsi_tcc_${new Date().toISOString().split("T")[0]}.csv`;
                      a.click();
                      toast.success("CSV esportato!");
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                  <Button
                    className="flex-1 bg-[#8b5cf6] hover:bg-[#7c3aed] active:bg-[#6d28d9] active:scale-95 transition-all duration-150 disabled:opacity-50"
                    id="processBatchBtn"
                    onClick={async e => {
                      const btn = e.currentTarget;
                      const originalContent = btn.innerHTML;
                      btn.disabled = true;
                      btn.innerHTML =
                        '<svg class="animate-spin h-4 w-4 mr-2 inline" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Elaborazione...';
                      try {
                        const response = await authenticatedFetch(
                          `${TCC_API}/api/tcc/v2/process-batch-reimbursements`,
                          {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                          }
                        );
                        const data = await response.json();
                        if (data.success) {
                          if (data.processed === 0) {
                            toast.info("Nessun rimborso pending da processare");
                          } else {
                            toast.success(
                              `Processati ${data.processed} rimborsi per \u20ac${data.total_euro}`
                            );
                            window.location.reload();
                          }
                        } else {
                          toast.error(
                            data.error || "Errore nel processare i rimborsi"
                          );
                        }
                      } catch (error) {
                        console.error("Errore:", error);
                        toast.error("Errore di connessione");
                      } finally {
                        btn.disabled = false;
                        btn.innerHTML = originalContent;
                      }
                    }}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Processa Batch
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Storico Movimenti Fondo */}
            {fundStats && (
              <Card className="bg-[#1a2332] border-[#14b8a6]/30">
                <CardHeader>
                  <CardTitle className="text-[#e8fbff] flex items-center gap-2">
                    <FileText className="h-5 w-5 text-[#14b8a6]" />
                    Storico Movimenti Fondo
                  </CardTitle>
                  <CardDescription className="text-[#94a3b8]">
                    Registro completo di tutte le operazioni del fondo TCC
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Filtri Movimenti */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Button
                      size="sm"
                      variant={
                        fundMovementFilter === "all" ? "default" : "outline"
                      }
                      onClick={() => setFundMovementFilter("all")}
                      className={
                        fundMovementFilter === "all"
                          ? "bg-[#f97316]"
                          : "border-[#334155] text-[#94a3b8]"
                      }
                    >
                      Tutti
                    </Button>
                    <Button
                      size="sm"
                      variant={
                        fundMovementFilter === "deposit" ? "default" : "outline"
                      }
                      onClick={() => setFundMovementFilter("deposit")}
                      className={
                        fundMovementFilter === "deposit"
                          ? "bg-[#10b981]"
                          : "border-[#334155] text-[#94a3b8]"
                      }
                    >
                      Entrate
                    </Button>
                    <Button
                      size="sm"
                      variant={
                        fundMovementFilter === "reimbursement"
                          ? "default"
                          : "outline"
                      }
                      onClick={() => setFundMovementFilter("reimbursement")}
                      className={
                        fundMovementFilter === "reimbursement"
                          ? "bg-[#ef4444]"
                          : "border-[#334155] text-[#94a3b8]"
                      }
                    >
                      Rimborsi
                    </Button>
                  </div>

                  {/* Lista Movimenti */}
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {!fundStats?.transactions ||
                    !Array.isArray(fundStats.transactions) ||
                    fundStats.transactions.length === 0 ? (
                      <p className="text-center text-[#94a3b8] py-8">
                        Nessun movimento registrato
                      </p>
                    ) : (
                      fundStats.transactions
                        .filter((tx: any) => {
                          if (fundMovementFilter === "all") return true;
                          if (fundMovementFilter === "deposit")
                            return tx.type === "deposit";
                          if (fundMovementFilter === "reimbursement")
                            return (
                              tx.type === "reimbursement" ||
                              tx.type === "reimbursement_batch"
                            );
                          return true;
                        })
                        .map((tx: any, i: number) => {
                          const isDeposit = tx.type === "deposit";
                          const euroValue = tx.euro_value
                            ? tx.euro_value / 100
                            : tx.amount || 0;
                          return (
                            <div
                              key={tx.id || i}
                              className="flex items-center justify-between p-3 bg-[#0b1220] rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                {isDeposit ? (
                                  <div className="w-8 h-8 rounded-full bg-[#10b981]/20 flex items-center justify-center">
                                    <ArrowUpCircle className="w-4 h-4 text-[#10b981]" />
                                  </div>
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-[#ef4444]/20 flex items-center justify-center">
                                    <ArrowDownCircle className="w-4 h-4 text-[#ef4444]" />
                                  </div>
                                )}
                                <div>
                                  <p className="font-semibold text-[#e8fbff]">
                                    {isDeposit
                                      ? "Deposito Fondo"
                                      : tx.type === "reimbursement_batch"
                                        ? tx.description?.includes("[")
                                          ? `Batch Rimborsi ${tx.description.match(/\[(.*?)\]/)?.[0] || ""}`
                                          : "Batch Rimborsi"
                                        : tx.description || "Rimborso"}
                                  </p>
                                  <p className="text-sm text-[#94a3b8]">
                                    {new Date(tx.created_at).toLocaleDateString(
                                      "it-IT"
                                    )}{" "}
                                    -{" "}
                                    {new Date(tx.created_at).toLocaleTimeString(
                                      "it-IT",
                                      { hour: "2-digit", minute: "2-digit" }
                                    )}
                                  </p>
                                  <Badge
                                    className={`text-xs mt-1 ${isDeposit ? "bg-[#10b981]/20 text-[#10b981]" : tx.status === "completed" ? "bg-[#14b8a6]/20 text-[#14b8a6]" : "bg-[#f59e0b]/20 text-[#f59e0b]"}`}
                                  >
                                    {isDeposit
                                      ? "Entrata"
                                      : tx.status === "completed"
                                        ? "Completato"
                                        : "In Attesa"}
                                  </Badge>
                                </div>
                              </div>
                              <div className="text-right">
                                <p
                                  className={`font-semibold ${isDeposit ? "text-[#10b981]" : "text-[#ef4444]"}`}
                                >
                                  {isDeposit ? "+" : "-"}€
                                  {euroValue.toLocaleString("it-IT", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </p>
                                {tx.amount > 0 && (
                                  <p className="text-sm text-[#94a3b8]">
                                    {tx.amount} TCC
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Analytics Economici */}
            <Card className="bg-[#1a2332] border-[#14b8a6]/30">
              <CardHeader>
                <CardTitle className="text-[#e8fbff] flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-[#14b8a6]" />
                  Analytics Economici
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 bg-[#0b1220] rounded-lg">
                    <div className="text-sm text-[#e8fbff]/70 mb-1">
                      TCC Emessi (click to edit)
                    </div>
                    <input
                      type="number"
                      value={editableParams.tccIssued}
                      onChange={e =>
                        setEditableParams({
                          ...editableParams,
                          tccIssued: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="text-3xl font-bold text-[#14b8a6] bg-transparent border-b-2 border-[#14b8a6]/50 focus:border-[#14b8a6] outline-none w-full"
                    />
                  </div>
                  <div className="p-4 bg-[#0b1220] rounded-lg">
                    <div className="text-sm text-[#e8fbff]/70 mb-1">
                      TCC Spesi (click to edit)
                    </div>
                    <input
                      type="number"
                      value={editableParams.tccSpent}
                      onChange={e =>
                        setEditableParams({
                          ...editableParams,
                          tccSpent: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="text-3xl font-bold text-[#10b981] bg-transparent border-b-2 border-[#10b981]/50 focus:border-[#10b981] outline-none w-full"
                    />
                  </div>
                  <div className="p-4 bg-[#0b1220] rounded-lg">
                    <div className="text-sm text-[#e8fbff]/70 mb-1">
                      Velocity (Utilizzo)
                    </div>
                    <div className="text-3xl font-bold text-[#f59e0b]">
                      {calculateVelocity()}%
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-[#10b981]/10 border border-[#10b981]/30 rounded-lg mb-4">
                  <h4 className="text-[#e8fbff] font-semibold mb-3 flex items-center gap-2">
                    <Leaf className="h-5 w-5 text-[#10b981]" />
                    ROI Sostenibilità
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="text-xs text-[#e8fbff]/70 mb-1">
                        Investito (Fondo)
                      </div>
                      <div className="text-xl font-bold text-[#e8fbff]">
                        €{editableParams.fundBalance.toLocaleString("it-IT")}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-[#e8fbff]/70 mb-1">
                        CO₂ Risparmiata
                      </div>
                      <div className="text-xl font-bold text-[#10b981]">
                        {parseFloat(calculateCO2Saved()).toLocaleString(
                          "it-IT"
                        )}{" "}
                        kg
                      </div>
                      <div className="text-xs text-[#e8fbff]/50 mt-1">
                        (1 TCC = 1 kg CO₂)
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-[#e8fbff]/70 mb-1">
                        Alberi Equivalenti
                      </div>
                      <div className="text-xl font-bold text-[#14b8a6]">
                        {calculateTreesEquivalent()} alberi
                      </div>
                      <div className="text-xs text-[#e8fbff]/50 mt-1">
                        (CO₂ / 22 kg/albero)
                      </div>
                    </div>
                  </div>
                </div>

                {/* Impatto Fondo */}
                <div className="p-4 bg-[#f59e0b]/10 border border-[#f59e0b]/30 rounded-lg">
                  <h4 className="text-[#e8fbff] font-semibold mb-3 flex items-center gap-2">
                    <Euro className="h-5 w-5 text-[#f59e0b]" />
                    Impatto Fondo Liquidità
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-[#e8fbff]/70 mb-1">
                        Rimborsi Necessari (TCC Spesi × Valore)
                      </div>
                      <div className="text-xl font-bold text-[#f59e0b]">
                        €
                        {parseFloat(
                          calculateReimbursementNeeded()
                        ).toLocaleString("it-IT", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-[#e8fbff]/70 mb-1">
                        Fondo Disponibile
                      </div>
                      <div className="text-xl font-bold text-[#14b8a6]">
                        €
                        {editableParams.fundBalance.toLocaleString("it-IT", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 p-3 bg-[#0b1220] rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#e8fbff]/70">
                        Copertura Fondo
                      </span>
                      <span className="text-lg font-bold text-[#10b981]">
                        {(() => {
                          const reimbursement =
                            parseFloat(calculateReimbursementNeeded()) || 0;
                          if (reimbursement === 0) return "100.0";
                          const coverage =
                            (editableParams.fundBalance / reimbursement) * 100;
                          return coverage > 1000
                            ? ">1000"
                            : coverage.toFixed(1);
                        })()}
                        %
                      </span>
                    </div>
                    <div className="mt-2 h-2 bg-[#0b1220] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#10b981] to-[#14b8a6] transition-all duration-300"
                        style={{
                          width: `${Math.min(
                            100,
                            (() => {
                              const reimbursement =
                                parseFloat(calculateReimbursementNeeded()) || 1;
                              return (
                                (editableParams.fundBalance / reimbursement) *
                                100
                              );
                            })()
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Integrazione TPAS */}
            <Card className="bg-gradient-to-br from-[#8b5cf6]/10 to-[#8b5cf6]/5 border-[#8b5cf6]/30">
              <CardHeader>
                <CardTitle className="text-[#e8fbff] flex items-center gap-2">
                  <Zap className="h-5 w-5 text-[#8b5cf6]" />
                  Integrazione TPAS (Ready 2027)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-[#0b1220] rounded-lg">
                    <span className="text-[#e8fbff]">Stub API TPAS</span>
                    <span className="px-3 py-1 bg-[#f59e0b]/20 text-[#f59e0b] rounded-full text-sm font-semibold">
                      Standby
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-[#0b1220] rounded-lg">
                    <span className="text-[#e8fbff]">Mapping Ecocrediti</span>
                    <span className="px-3 py-1 bg-[#10b981]/20 text-[#10b981] rounded-full text-sm font-semibold">
                      Ready
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-[#0b1220] rounded-lg">
                    <span className="text-[#e8fbff]">
                      Conversione Automatica
                    </span>
                    <span className="px-3 py-1 bg-[#10b981]/20 text-[#10b981] rounded-full text-sm font-semibold">
                      Ready
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-[#0b1220] rounded-lg">
                    <span className="text-[#e8fbff]">
                      Fondo TPAS → Fondo DMS
                    </span>
                    <span className="px-3 py-1 bg-[#8b5cf6]/20 text-[#8b5cf6] rounded-full text-sm font-semibold">
                      2027+
                    </span>
                  </div>
                  <div className="p-4 bg-[#8b5cf6]/10 border border-[#8b5cf6]/30 rounded-lg">
                    <p className="text-sm text-[#e8fbff]/70">
                      Il sistema è predisposto per l'integrazione con TPAS.
                      Quando attivo (2027+), i TCC saranno automaticamente
                      convertiti in Ecocrediti ufficiali e il fondo sarà
                      alimentato dal Fondo TPAS nazionale.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 8: REAL-TIME */}
          <TabsContent value="realtime" className="space-y-6">
            {/* Attività Real-time */}
            <Card className="bg-[#1a2332] border-[#14b8a6]/30">
              <CardHeader>
                <CardTitle className="text-[#e8fbff] flex items-center gap-2">
                  <Activity className="h-5 w-5 text-[#14b8a6] animate-pulse" />
                  Attività Real-time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-[#0b1220] rounded-lg border border-[#14b8a6]/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-5 w-5 text-[#14b8a6]" />
                      <span className="text-[#e8fbff]/70 text-sm">
                        Utenti Online
                      </span>
                    </div>
                    <div className="text-3xl font-bold text-[#14b8a6]">
                      {realtimeData.activeUsers}
                    </div>
                  </div>
                  <div className="p-4 bg-[#0b1220] rounded-lg border border-[#14b8a6]/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Store className="h-5 w-5 text-[#14b8a6]" />
                      <span className="text-[#e8fbff]/70 text-sm">
                        Operatori Attivi
                      </span>
                    </div>
                    <div className="text-3xl font-bold text-[#14b8a6]">
                      {realtimeData.activeVendors}
                    </div>
                  </div>
                  <div className="p-4 bg-[#0b1220] rounded-lg border border-[#14b8a6]/20">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-5 w-5 text-[#10b981]" />
                      <span className="text-[#e8fbff]/70 text-sm">
                        Check-in Oggi
                      </span>
                    </div>
                    <div className="text-3xl font-bold text-[#10b981]">
                      {realtimeData.todayCheckins}
                    </div>
                  </div>
                  <div className="p-4 bg-[#0b1220] rounded-lg border border-[#14b8a6]/20">
                    <div className="flex items-center gap-2 mb-2">
                      <ShoppingCart className="h-5 w-5 text-[#14b8a6]" />
                      <span className="text-[#e8fbff]/70 text-sm">
                        Transazioni Oggi
                      </span>
                    </div>
                    <div className="text-3xl font-bold text-[#14b8a6]">
                      {realtimeData.todayTransactions}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Status Sistemi */}
            <Card className="bg-[#1a2332] border-[#14b8a6]/30">
              <CardHeader>
                <CardTitle className="text-[#e8fbff] flex items-center gap-2">
                  <Activity className="h-5 w-5 text-[#14b8a6]" />
                  Status Sistemi
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-[#0b1220] rounded-lg">
                  <span className="text-[#e8fbff]">API Backend</span>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-[#10b981]" />
                    <span className="text-[#10b981] font-semibold">
                      Operational
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#0b1220] rounded-lg">
                  <span className="text-[#e8fbff]">Database PostgreSQL</span>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-[#10b981]" />
                    <span className="text-[#10b981] font-semibold">
                      Operational
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#0b1220] rounded-lg">
                  <span className="text-[#e8fbff]">Redis Event Bus</span>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-[#10b981]" />
                    <span className="text-[#10b981] font-semibold">
                      Operational
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#0b1220] rounded-lg">
                  <span className="text-[#e8fbff]">TPAS Integration</span>
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-[#f59e0b]" />
                    <span className="text-[#f59e0b] font-semibold">
                      Standby (2027)
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB: SISTEMA (Logs + Debug unificati) */}
          <TabsContent value="sistema" className="space-y-6">
            {/* Sotto-tab interni */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setSistemaSubTab("logs")}
                className={`px-4 py-2 rounded-lg border transition-all ${
                  sistemaSubTab === "logs"
                    ? "bg-[#06b6d4] border-[#06b6d4] text-white"
                    : "bg-[#06b6d4]/10 border-[#06b6d4]/30 hover:bg-[#06b6d4]/20 text-[#06b6d4]"
                }`}
              >
                <span className="text-sm font-medium">Logs</span>
              </button>
              <button
                onClick={() => setSistemaSubTab("debug")}
                className={`px-4 py-2 rounded-lg border transition-all ${
                  sistemaSubTab === "debug"
                    ? "bg-[#06b6d4] border-[#06b6d4] text-white"
                    : "bg-[#06b6d4]/10 border-[#06b6d4]/30 hover:bg-[#06b6d4]/20 text-[#06b6d4]"
                }`}
              >
                <span className="text-sm font-medium">Debug</span>
              </button>
            </div>

            {/* Contenuto Logs */}
            {sistemaSubTab === "logs" && <GuardianLogsSection />}

            {/* Contenuto Debug */}
            {sistemaSubTab === "debug" && <DebugSectionReal />}
          </TabsContent>

          {/* TAB 9: AGENTE AI — AVA Chat AI con Streaming SSE */}
          <TabsContent value="ai" className="space-y-6">
            <AIChatPanel
              userRole="pa"
              comuneId={comuneIdFromUrl ? parseInt(comuneIdFromUrl, 10) : undefined}
              currentTab={activeTab}
            />
          </TabsContent>

          {/* TAB 10: SICUREZZA */}
          <TabsContent value="security" className="space-y-6">
            <SecurityTab />
            {/* Anti-Frode TCC */}
            <div className="mt-8 pt-6 border-t border-border">
              <FraudMonitorPanel />
            </div>
          </TabsContent>

          {/* TAB: SSO SUAP - Pratiche Ente Sussidiario */}
          <TabsContent value="ssosuap" className="space-y-6">
            <SuapPanel />
          </TabsContent>

          {/* TAB 13: QUALIFICAZIONE IMPRESE */}
          <TabsContent value="businesses" className="space-y-6">
            {/* KPI Conformità - Dati Reali */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-[#10b981]/20 to-[#10b981]/5 border-[#10b981]/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-[#e8fbff]/70 flex items-center gap-2">
                    Pienamente Conformi
                    {realData.statsQualificazione && (
                      <span className="text-xs text-[#10b981]">● Live</span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-[#10b981] mb-1">
                    {realData.statsQualificazione?.overview?.conformi ??
                      mockData.businesses.fullyCompliant}
                  </div>
                  <div className="text-sm text-[#e8fbff]/50">
                    {realData.statsQualificazione?.overview
                      ?.conformi_percentuale ??
                      (
                        (mockData.businesses.fullyCompliant /
                          mockData.businesses.total) *
                        100
                      ).toFixed(1)}
                    % del totale
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-[#f59e0b]/20 to-[#f59e0b]/5 border-[#f59e0b]/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-[#e8fbff]/70">
                    Con Riserva
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-[#f59e0b] mb-1">
                    {realData.statsQualificazione?.overview?.con_riserva ??
                      mockData.businesses.partiallyCompliant}
                  </div>
                  <div className="text-sm text-[#e8fbff]/50">
                    {realData.statsQualificazione?.overview
                      ?.con_riserva_percentuale ??
                      (
                        (mockData.businesses.partiallyCompliant /
                          mockData.businesses.total) *
                        100
                      ).toFixed(1)}
                    % del totale
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-[#ef4444]/20 to-[#ef4444]/5 border-[#ef4444]/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-[#e8fbff]/70">
                    Non Conformi
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-[#ef4444] mb-1">
                    {realData.statsQualificazione?.overview?.non_conformi ??
                      mockData.businesses.nonCompliant}
                  </div>
                  <div className="text-sm text-[#e8fbff]/50">
                    {realData.statsQualificazione?.overview
                      ?.non_conformi_percentuale ??
                      (
                        (mockData.businesses.nonCompliant /
                          mockData.businesses.total) *
                        100
                      ).toFixed(1)}
                    % del totale
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-[#14b8a6]/20 to-[#14b8a6]/5 border-[#14b8a6]/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-[#e8fbff]/70">
                    Totale Imprese
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-[#14b8a6] mb-1">
                    {realData.statsQualificazione?.overview?.totale ??
                      mockData.businesses.total}
                  </div>
                  <div className="text-sm text-[#e8fbff]/50">nel sistema</div>
                </CardContent>
              </Card>
            </div>

            {/* Scadenze Imminenti - Dati Reali */}
            <Card className="bg-[#1a2332] border-[#ef4444]/30">
              <CardHeader>
                <CardTitle className="text-[#e8fbff] flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-[#ef4444]" />
                  Scadenze Imminenti (
                  {realData.statsQualificazione?.scadenze?.length ??
                    mockData.businesses.atRiskSuspension}
                  )
                  {realData.statsQualificazione?.scadenze && (
                    <span className="text-xs text-[#10b981] ml-2">● Live</span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(
                    realData.statsQualificazione?.scadenze ||
                    mockData.businesses.expiringDocs
                  ).map((item: any, idx: number) => {
                    const isReal = realData.statsQualificazione?.scadenze;
                    const isCritical = isReal
                      ? item.giorni_rimanenti <= 15
                      : item.critical;
                    const businessName = isReal
                      ? item.impresa_nome
                      : item.business;
                    const docType = isReal ? item.tipo_qualifica : item.doc;
                    const daysLeft = isReal ? item.giorni_rimanenti : item.days;

                    return (
                      <div
                        key={idx}
                        className={`flex items-center justify-between p-3 rounded-lg ${
                          isCritical
                            ? "bg-[#ef4444]/10 border border-[#ef4444]/30"
                            : "bg-[#0b1220]"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {isCritical && (
                            <AlertCircle className="h-5 w-5 text-[#ef4444]" />
                          )}
                          <div>
                            <div className="text-[#e8fbff] font-medium">
                              {businessName}
                            </div>
                            <div className="text-sm text-[#e8fbff]/70">
                              {docType}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div
                            className={`text-lg font-bold ${
                              isCritical ? "text-[#ef4444]" : "text-[#f59e0b]"
                            }`}
                          >
                            {daysLeft} giorni
                          </div>
                          <Button size="sm" variant="outline" className="mt-1">
                            Invia Reminder
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Demografia e Indici - Dati Reali */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Demografia */}
              <Card className="bg-[#1a2332] border-[#14b8a6]/30">
                <CardHeader>
                  <CardTitle className="text-[#e8fbff] flex items-center gap-2">
                    <Users className="h-5 w-5 text-[#14b8a6]" />
                    Demografia Imprese
                    {realData.statsQualificazione?.demografia && (
                      <span className="text-xs text-[#10b981] ml-2">
                        ● Live
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-[#0b1220] rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[#e8fbff]/70">Aperture 2026</span>
                        <span className="text-2xl font-bold text-[#10b981]">
                          +
                          {realData.statsQualificazione?.demografia
                            ?.aperture_anno ??
                            mockData.businesses.demographics.openings}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[#e8fbff]/70">
                          Cessazioni 2026
                        </span>
                        <span className="text-2xl font-bold text-[#ef4444]">
                          -
                          {realData.statsQualificazione?.demografia
                            ?.cessazioni_anno ??
                            mockData.businesses.demographics.closures}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-[#14b8a6]/30">
                        <span className="text-[#e8fbff] font-semibold">
                          Crescita Netta
                        </span>
                        <span className="text-2xl font-bold text-[#14b8a6]">
                          +
                          {realData.statsQualificazione?.demografia
                            ?.crescita_netta ??
                            mockData.businesses.demographics.netGrowth}
                        </span>
                      </div>
                    </div>

                    {/* Per Settore - Dati Reali */}
                    <div className="p-3 bg-[#0b1220] rounded-lg">
                      <div className="text-xs text-[#e8fbff]/70 mb-2">
                        Per Settore (Top 5)
                      </div>
                      <div className="text-sm space-y-1">
                        {(
                          realData.statsQualificazione?.demografia?.per_settore?.slice(
                            0,
                            5
                          ) || [
                            { settore: "Alimentare", count: 180 },
                            { settore: "Abbigliamento", count: 95 },
                            { settore: "Artigianato", count: 75 },
                          ]
                        ).map((s: any, i: number) => (
                          <div key={i} className="flex justify-between">
                            <span className="text-[#e8fbff]/70 truncate max-w-[150px]">
                              {s.settore}
                            </span>
                            <span className="text-[#14b8a6] font-semibold">
                              {s.count}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Indici Strategici - Dati Reali */}
              <Card className="bg-[#1a2332] border-[#14b8a6]/30">
                <CardHeader>
                  <CardTitle className="text-[#e8fbff] flex items-center gap-2">
                    <Target className="h-5 w-5 text-[#14b8a6]" />
                    Indici Strategici
                    {realData.statsQualificazione?.indici && (
                      <span className="text-xs text-[#10b981] ml-2">
                        ● Live
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[#e8fbff]">Riqualificazione</span>
                        <span className="text-2xl font-bold text-[#14b8a6]">
                          {realData.statsQualificazione?.indici
                            ?.riqualificazione ??
                            mockData.businesses.indices.requalification}
                        </span>
                      </div>
                      <div className="w-full bg-[#0b1220] rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-[#14b8a6] to-[#10b981] h-3 rounded-full"
                          style={{
                            width: `${realData.statsQualificazione?.indici?.riqualificazione ?? mockData.businesses.indices.requalification}%`,
                          }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[#e8fbff]">Digitalizzazione</span>
                        <span className="text-2xl font-bold text-[#8b5cf6]">
                          {realData.statsQualificazione?.indici
                            ?.digitalizzazione ??
                            mockData.businesses.indices.digitalization}
                        </span>
                      </div>
                      <div className="w-full bg-[#0b1220] rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-[#8b5cf6] to-[#a78bfa] h-3 rounded-full"
                          style={{
                            width: `${mockData.businesses.indices.digitalization}%`,
                          }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[#e8fbff]">Sostenibilità</span>
                        <span className="text-2xl font-bold text-[#10b981]">
                          {realData.statsQualificazione?.indici
                            ?.sostenibilita ??
                            mockData.businesses.indices.sustainability}
                        </span>
                      </div>
                      <div className="w-full bg-[#0b1220] rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-[#10b981] to-[#34d399] h-3 rounded-full"
                          style={{
                            width: `${realData.statsQualificazione?.indici?.sostenibilita ?? mockData.businesses.indices.sustainability}%`,
                          }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[#e8fbff]">Conformità</span>
                        <span className="text-2xl font-bold text-[#06b6d4]">
                          {realData.statsQualificazione?.indici?.conformita?.toFixed(
                            1
                          ) ?? "97.1"}
                        </span>
                      </div>
                      <div className="w-full bg-[#0b1220] rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-[#06b6d4] to-[#22d3ee] h-3 rounded-full"
                          style={{
                            width: `${realData.statsQualificazione?.indici?.conformita ?? 97}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Formazione e Bandi */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Formazione */}
              <Card className="bg-[#1a2332] border-[#14b8a6]/30">
                <CardHeader>
                  <CardTitle className="text-[#e8fbff] flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-[#14b8a6]" />
                    Formazione
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="p-3 bg-[#10b981]/10 border border-[#10b981]/30 rounded-lg">
                      <div className="text-sm text-[#e8fbff]/70 mb-1">
                        Completati
                      </div>
                      <div className="text-3xl font-bold text-[#10b981]">
                        {mockData.businesses.training.completed}
                      </div>
                    </div>
                    <div className="p-3 bg-[#f59e0b]/10 border border-[#f59e0b]/30 rounded-lg">
                      <div className="text-sm text-[#e8fbff]/70 mb-1">
                        Programmati
                      </div>
                      <div className="text-3xl font-bold text-[#f59e0b]">
                        {mockData.businesses.training.scheduled}
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="text-sm text-[#e8fbff]/70 mb-2">
                      Top Formatori
                    </div>
                    <div className="space-y-2">
                      {mockData.businesses.training.topTrainers.map(
                        (trainer, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2 bg-[#0b1220] rounded"
                          >
                            <div>
                              <div className="text-[#e8fbff] text-sm">
                                {trainer.name}
                              </div>
                              <div className="text-xs text-[#e8fbff]/50">
                                {trainer.courses} corsi
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Award className="h-4 w-4 text-[#f59e0b]" />
                              <span className="text-[#f59e0b] font-semibold">
                                {trainer.rating}
                              </span>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  <div className="p-3 bg-[#14b8a6]/10 border border-[#14b8a6]/30 rounded-lg">
                    <div className="text-sm text-[#e8fbff]/70 mb-1">
                      Costo Medio Corso
                    </div>
                    <div className="text-2xl font-bold text-[#14b8a6]">
                      €{mockData.businesses.training.avgCost}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Bandi */}
              <Card className="bg-[#1a2332] border-[#14b8a6]/30">
                <CardHeader>
                  <CardTitle className="text-[#e8fbff] flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-[#14b8a6]" />
                    Bandi Attivi
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="p-3 bg-[#8b5cf6]/10 border border-[#8b5cf6]/30 rounded-lg">
                      <div className="text-sm text-[#e8fbff]/70 mb-1">
                        Bandi Aperti
                      </div>
                      <div className="text-3xl font-bold text-[#8b5cf6]">
                        {mockData.businesses.grants.active}
                      </div>
                    </div>
                    <div className="p-3 bg-[#10b981]/10 border border-[#10b981]/30 rounded-lg">
                      <div className="text-sm text-[#e8fbff]/70 mb-1">
                        Success Rate
                      </div>
                      <div className="text-3xl font-bold text-[#10b981]">
                        {mockData.businesses.grants.successRate}%
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="text-sm text-[#e8fbff]/70 mb-2">
                      Top Bandi
                    </div>
                    <div className="space-y-2">
                      {mockData.businesses.grants.topGrants.map(
                        (grant, idx) => (
                          <div
                            key={idx}
                            className="p-3 bg-[#0b1220] rounded-lg"
                          >
                            <div className="text-[#e8fbff] font-medium mb-1">
                              {grant.title}
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-[#e8fbff]/70">
                                {grant.applicants} domande
                              </span>
                              <span className="text-[#10b981] font-semibold">
                                {grant.approved} approvate
                              </span>
                            </div>
                            <div className="text-xs text-[#14b8a6] mt-1">
                              €{grant.amount.toLocaleString()} totali
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top Imprese - Dati Reali */}
            <Card className="bg-[#1a2332] border-[#14b8a6]/30">
              <CardHeader>
                <CardTitle className="text-[#e8fbff] flex items-center gap-2">
                  <Award className="h-5 w-5 text-[#f59e0b]" />
                  Top 5 Imprese per Score Qualificazione
                  {realData.statsQualificazione?.topImprese && (
                    <span className="text-xs text-[#10b981] ml-2">● Live</span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(
                    realData.statsQualificazione?.topImprese ||
                    mockData.businesses.topScoring
                  ).map((business: any, idx: number) => {
                    const isReal = realData.statsQualificazione?.topImprese;
                    const name = isReal
                      ? business.denominazione
                      : business.name;
                    const sector = isReal ? business.settore : business.sector;
                    const score = isReal ? business.score : business.score;
                    const digitalization = isReal
                      ? business.score_digitalizzazione
                      : business.digitalization;

                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-4 bg-[#0b1220] rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#f59e0b] to-[#f97316] flex items-center justify-center">
                            <span className="text-white font-bold text-lg">
                              #{idx + 1}
                            </span>
                          </div>
                          <div>
                            <div className="text-[#e8fbff] font-semibold">
                              {name}
                            </div>
                            <div className="text-sm text-[#e8fbff]/50">
                              {sector}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-bold text-[#10b981] mb-1">
                            {score}
                          </div>
                          <div className="text-xs text-[#e8fbff]/70">
                            Digitalizzazione: {digitalization}%
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 14: SEGNALAZIONI & IOT */}
          <TabsContent value="civic" className="space-y-6">
            <CivicReportsProvider>
              {/* Pannello Segnalazioni Civiche con dati reali e config TCC */}
              <CivicReportsPanel />
              {/* Mappa Termica Segnalazioni */}
              <CivicReportsHeatmap />
            </CivicReportsProvider>

            {/* Mappa Rete HUB Italia - Segnalazioni Civiche */}
            <GestioneHubMapWrapper />

            <Card className="bg-[#1a2332] border-[#06b6d4]/30">
              <CardHeader>
                <CardTitle className="text-[#e8fbff] flex items-center gap-2">
                  <CloudRain className="h-5 w-5 text-[#06b6d4]" />
                  Sensori IoT Ambientali (ARPAE Emilia-Romagna)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="p-4 bg-[#10b981]/10 border border-[#10b981]/30 rounded-lg">
                    <div className="text-sm text-[#e8fbff]/70 mb-1">PM10</div>
                    <div className="text-3xl font-bold text-[#10b981]">
                      {mockData.iotSensors.airQuality.pm10}
                    </div>
                    <div className="text-xs text-[#e8fbff]/50 mt-1">µg/m³</div>
                  </div>
                  <div className="p-4 bg-[#10b981]/10 border border-[#10b981]/30 rounded-lg">
                    <div className="text-sm text-[#e8fbff]/70 mb-1">PM2.5</div>
                    <div className="text-3xl font-bold text-[#10b981]">
                      {mockData.iotSensors.airQuality.pm25}
                    </div>
                    <div className="text-xs text-[#e8fbff]/50 mt-1">µg/m³</div>
                  </div>
                  <div className="p-4 bg-[#f59e0b]/10 border border-[#f59e0b]/30 rounded-lg">
                    <div className="text-sm text-[#e8fbff]/70 mb-1">NO₂</div>
                    <div className="text-3xl font-bold text-[#f59e0b]">
                      {mockData.iotSensors.airQuality.no2}
                    </div>
                    <div className="text-xs text-[#e8fbff]/50 mt-1">µg/m³</div>
                  </div>
                  <div className="p-4 bg-[#06b6d4]/10 border border-[#06b6d4]/30 rounded-lg">
                    <div className="text-sm text-[#e8fbff]/70 mb-1">
                      Temperatura
                    </div>
                    <div className="text-3xl font-bold text-[#06b6d4]">
                      {mockData.iotSensors.weather.temp}°C
                    </div>
                    <div className="text-xs text-[#e8fbff]/50 mt-1">
                      Umidità: {mockData.iotSensors.weather.humidity}%
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 15: COMUNI */}
          <TabsContent value="comuni" className="space-y-6">
            <ComuniPanel />
          </TabsContent>

          {/* TAB 16: CONTROLLI/SANZIONI */}
          <TabsContent value="inspections" className="space-y-6">
            <ControlliSanzioniPanel />
          </TabsContent>
          <TabsContent value="notifications" className="space-y-6">
            <NotificationsPanel />
          </TabsContent>

          {/* TAB 18: CENTRO MOBILITÀ - Dati GTFS Reali da MIHUB_API_BASE_URL */}
          <TabsContent value="mobility" className="space-y-6">
            <Card className="bg-[#1a2332] border-[#3b82f6]/30">
              <CardHeader>
                <CardTitle className="text-[#e8fbff] flex items-center gap-2">
                  <Train className="h-5 w-5 text-[#3b82f6]" />
                  Centro Mobilità GTFS - Rete Trasporti Italia
                  {gtfsStats && (
                    <span className="text-xs text-[#10b981] ml-2">
                      ● Live API
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="p-4 bg-[#3b82f6]/10 border border-[#3b82f6]/30 rounded-lg">
                    <div className="text-sm text-[#e8fbff]/70 mb-1">
                      Totale Fermate
                    </div>
                    <div className="text-3xl font-bold text-[#3b82f6]">
                      {gtfsStats?.totalStops?.toLocaleString() || "21.206"}
                    </div>
                    <div className="text-xs text-[#e8fbff]/50 mt-1">
                      TPER + Trenitalia
                    </div>
                  </div>
                  <div className="p-4 bg-[#10b981]/10 border border-[#10b981]/30 rounded-lg">
                    <div className="text-sm text-[#e8fbff]/70 mb-1">
                      Fermate Bus
                    </div>
                    <div className="text-3xl font-bold text-[#10b981]">
                      {gtfsStats?.busStops?.toLocaleString() || "21.176"}
                    </div>
                    <div className="text-xs text-[#e8fbff]/50 mt-1">
                      TPER Bologna/Ferrara
                    </div>
                  </div>
                  <div className="p-4 bg-[#f59e0b]/10 border border-[#f59e0b]/30 rounded-lg">
                    <div className="text-sm text-[#e8fbff]/70 mb-1">
                      Stazioni Treni
                    </div>
                    <div className="text-3xl font-bold text-[#f59e0b]">
                      {gtfsStats?.trainStops?.toLocaleString() || "30"}
                    </div>
                    <div className="text-xs text-[#e8fbff]/50 mt-1">
                      Trenitalia
                    </div>
                  </div>
                  <div className="p-4 bg-[#0b1220] border border-[#14b8a6]/20 rounded-lg">
                    <div className="text-sm text-[#e8fbff]/70 mb-1">
                      Linee Totali
                    </div>
                    <div className="text-3xl font-bold text-[#e8fbff]">
                      {gtfsStats?.totalRoutes || "37"}
                    </div>
                    <div className="text-xs text-[#e8fbff]/50 mt-1">
                      Bus + Treni
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-[#e8fbff] font-semibold mb-3">
                    Fermate Principali (da API GTFS)
                  </h4>
                  {gtfsLoading ? (
                    <div className="text-center py-4 text-[#e8fbff]/50">
                      Caricamento dati GTFS...
                    </div>
                  ) : gtfsStops.length > 0 ? (
                    <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2">
                      {/* Mescola fermate da tutti i provider: prendi alcune TPER, alcune Trenitalia, alcune Tiemme */}
                      {(() => {
                        const tperStops = gtfsStops
                          .filter((s: any) => s.provider === "tper")
                          .slice(0, 10);
                        const trainStops = gtfsStops
                          .filter((s: any) => s.stop_type === "train")
                          .slice(0, 5);
                        const tiemmeStops = gtfsStops
                          .filter(
                            (s: any) =>
                              s.provider === "tiemme" &&
                              !s.stop_name?.includes("(Tmp)")
                          )
                          .slice(0, 5);
                        // Combina e ordina per numero di routes (decrescente)
                        const mixedStops = [
                          ...tperStops,
                          ...trainStops,
                          ...tiemmeStops,
                        ].sort(
                          (a: any, b: any) =>
                            (b.routes?.length || 0) - (a.routes?.length || 0)
                        );
                        return mixedStops.map((stop: any, idx: number) => (
                          <div
                            key={stop.stop_id || idx}
                            className="p-4 bg-[#0b1220] rounded-lg flex items-center justify-between hover:bg-[#0b1220]/80 transition-colors"
                          >
                            <div className="flex-1">
                              <div className="text-[#e8fbff] font-semibold">
                                {stop.stop_name}
                              </div>
                              <div className="text-sm text-[#e8fbff]/70 flex items-center gap-2">
                                <span>
                                  {stop.stop_type === "bus" ? "🚌" : "🚂"}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded text-xs font-medium ${
                                    stop.provider === "tper"
                                      ? "bg-blue-500/20 text-blue-400"
                                      : stop.provider === "trenitalia"
                                        ? "bg-green-500/20 text-green-400"
                                        : "bg-orange-500/20 text-orange-400"
                                  }`}
                                >
                                  {stop.provider?.toUpperCase() || "TPER"}
                                </span>
                                <span className="text-[#e8fbff]/50">
                                  {stop.region}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-[#10b981]">
                                {stop.routes?.length || 0} linee
                              </div>
                              <div className="text-xs text-[#e8fbff]/50">
                                {parseFloat(stop.stop_lat)?.toFixed(4)},{" "}
                                {parseFloat(stop.stop_lon)?.toFixed(4)}
                              </div>
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-[#e8fbff]/50">
                      Attiva il layer Trasporti sulla mappa per caricare i dati
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#1a2332] border-[#3b82f6]/30">
              <CardHeader>
                <CardTitle className="text-[#e8fbff] flex items-center gap-2">
                  <ParkingCircle className="h-5 w-5 text-[#3b82f6]" />
                  Parcheggi Bologna
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-[#0b1220] rounded-lg">
                    <div className="text-sm text-[#e8fbff]/70 mb-1">
                      Posti Totali
                    </div>
                    <div className="text-3xl font-bold text-[#e8fbff]">
                      {mockData.mobility.parkingSpots}
                    </div>
                  </div>
                  <div className="p-4 bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-lg">
                    <div className="text-sm text-[#e8fbff]/70 mb-1">
                      Occupati
                    </div>
                    <div className="text-3xl font-bold text-[#ef4444]">
                      {mockData.mobility.parkingOccupied}
                    </div>
                  </div>
                  <div className="p-4 bg-[#10b981]/10 border border-[#10b981]/30 rounded-lg">
                    <div className="text-sm text-[#e8fbff]/70 mb-1">
                      Disponibili
                    </div>
                    <div className="text-3xl font-bold text-[#10b981]">
                      {mockData.mobility.parkingAvailable}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Grafici Trend */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-[#1a2332] border-[#3b82f6]/30">
                <CardHeader>
                  <CardTitle className="text-[#e8fbff] flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-[#3b82f6]" />
                    Trend Passeggeri Settimanale
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart
                      data={[
                        { day: "Lun", passeggeri: 3200 },
                        { day: "Mar", passeggeri: 3450 },
                        { day: "Mer", passeggeri: 3100 },
                        { day: "Gio", passeggeri: 3600 },
                        { day: "Ven", passeggeri: 3800 },
                        { day: "Sab", passeggeri: 2900 },
                        { day: "Dom", passeggeri: 2400 },
                      ]}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#3b82f6"
                        opacity={0.1}
                      />
                      <XAxis dataKey="day" stroke="#e8fbff" />
                      <YAxis stroke="#e8fbff" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1a2332",
                          border: "1px solid #3b82f6",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="passeggeri"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ fill: "#3b82f6" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-[#1a2332] border-[#10b981]/30">
                <CardHeader>
                  <CardTitle className="text-[#e8fbff] flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-[#10b981]" />
                    Utilizzo Linee per Fascia Oraria
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={[
                        { fascia: "6-9", bus: 850, tram: 420 },
                        { fascia: "9-12", bus: 620, tram: 380 },
                        { fascia: "12-15", bus: 480, tram: 290 },
                        { fascia: "15-18", bus: 720, tram: 450 },
                        { fascia: "18-21", bus: 890, tram: 520 },
                      ]}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#10b981"
                        opacity={0.1}
                      />
                      <XAxis dataKey="fascia" stroke="#e8fbff" />
                      <YAxis stroke="#e8fbff" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1a2332",
                          border: "1px solid #10b981",
                        }}
                      />
                      <Legend />
                      <Bar dataKey="bus" fill="#3b82f6" />
                      <Bar dataKey="tram" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Mappa Interattiva - Riusa la mappa del Gemello Digitale con HUB e Mercati */}
            <Card className="bg-[#1a2332] border-[#3b82f6]/30">
              <CardHeader>
                <CardTitle className="text-[#e8fbff] flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-[#3b82f6]" />
                  Mappa Trasporti Pubblici - Rete HUB Italia
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg">
                  {/* Riutilizzo del componente GestioneHubMapWrapper che mostra HUB, Mercati e layer Trasporti */}
                  <GestioneHubMapWrapper />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 19: REPORT & DOCUMENTAZIONE */}
          <TabsContent value="reports" className="space-y-6">
            {/* Sezione Originale Ripristinata: Card e Link Documentazione */}
            <LegacyReportCards />

            {/* Nuova Sezione: Navigatore Interattivo (Append, non Replace) */}
            <div className="pt-8 border-t border-[#1e293b]">
              <h3 className="text-xl font-bold text-[#e8fbff] mb-4 flex items-center gap-2">
                <Activity className="h-6 w-6 text-[#a855f7]" />
                Navigatore Interattivo Analisi
              </h3>
              <NativeReportComponent />
            </div>
          </TabsContent>

          {/* TAB 20: INTEGRAZIONI */}
          <TabsContent value="integrations" className="space-y-6">
            <Integrazioni />
          </TabsContent>

          {/* TAB 21: PIATTAFORME PA (PDND, App IO, ANPR, SSO) */}
          <TabsContent value="settings" className="space-y-6">
            <PiattaformePA />
          </TabsContent>

          {/* TAB 22: GESTIONE MERCATI */}
          <TabsContent value="mercati" className="space-y-6">
            <GestioneMercati />
          </TabsContent>

          {/* TAB 23: IMPRESE & CONCESSIONI */}
          <TabsContent value="imprese" className="space-y-6">
            {/* Statistiche Imprese */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border-cyan-500/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-cyan-400 text-sm mb-1">
                    <Building2 className="w-4 h-4" />
                    Imprese Totali
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {impreseStats.total}
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-emerald-400 text-sm mb-1">
                    <FileText className="w-4 h-4" />
                    Concessioni Attive
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {impreseStats.concessioni}
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-purple-400 text-sm mb-1">
                    <Users className="w-4 h-4" />
                    Comuni Coperti
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {impreseStats.comuni}
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-orange-400 text-sm mb-1">
                    <TrendingUp className="w-4 h-4" />
                    Media Concess./Impresa
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {impreseStats.media}
                  </div>
                </CardContent>
              </Card>
            </div>
            {/* Componente Imprese & Concessioni */}
            <MarketCompaniesTab marketId="ALL" stalls={[]} />
          </TabsContent>

          {/* TAB 24: DOCUMENTAZIONE - ENTI FORMATORI & BANDI */}
          <TabsContent value="docs" className="space-y-6">
            {/* Sotto-tab per Formazione e Bandi */}
            <Tabs
              value={docsSubTab}
              onValueChange={setDocsSubTab}
              className="w-full"
            >
              <TabsList className="bg-[#1a2332] border border-[#3b82f6]/20 mb-6">
                <TabsTrigger
                  value="formazione"
                  className="data-[state=active]:bg-[#3b82f6]/20 data-[state=active]:text-[#3b82f6]"
                >
                  <GraduationCap className="w-4 h-4 mr-2" />
                  Enti Formatori
                </TabsTrigger>
                <TabsTrigger
                  value="bandi"
                  className="data-[state=active]:bg-[#10b981]/20 data-[state=active]:text-[#10b981]"
                >
                  <Landmark className="w-4 h-4 mr-2" />
                  Associazioni & Bandi
                </TabsTrigger>
                <TabsTrigger
                  value="scia-pratiche"
                  className="data-[state=active]:bg-[#f59e0b]/20 data-[state=active]:text-[#f59e0b]"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  SCIA & Pratiche
                </TabsTrigger>
                {isAssociazioneImpersonation() && (
                  <>
                    <TabsTrigger
                      value="scheda-pubblica"
                      className="data-[state=active]:bg-[#06b6d4]/20 data-[state=active]:text-[#06b6d4]"
                    >
                      <Building2 className="w-4 h-4 mr-2" />
                      Scheda Pubblica
                    </TabsTrigger>
                    <TabsTrigger
                      value="servizi-associazione"
                      className="data-[state=active]:bg-[#10b981]/20 data-[state=active]:text-[#10b981]"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Servizi
                    </TabsTrigger>
                    <TabsTrigger
                      value="corsi-associazione"
                      className="data-[state=active]:bg-[#3b82f6]/20 data-[state=active]:text-[#3b82f6]"
                    >
                      <GraduationCap className="w-4 h-4 mr-2" />
                      Corsi
                    </TabsTrigger>
                    <TabsTrigger
                      value="wallet-associazione"
                      className="data-[state=active]:bg-[#f59e0b]/20 data-[state=active]:text-[#f59e0b]"
                    >
                      <Landmark className="w-4 h-4 mr-2" />
                      Wallet
                    </TabsTrigger>
                    <TabsTrigger
                      value="associati"
                      className="data-[state=active]:bg-[#8b5cf6]/20 data-[state=active]:text-[#8b5cf6]"
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Associati
                    </TabsTrigger>
                  </>
                )}
              </TabsList>

              {/* SOTTO-TAB: ENTI FORMATORI */}
              <TabsContent value="formazione" className="space-y-6">
                {/* KPI Formazione */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 text-blue-400 text-sm mb-1">
                        <Building2 className="w-4 h-4" />
                        Enti Accreditati
                        {realData.formazioneStats && (
                          <span className="text-xs text-[#10b981]">● Live</span>
                        )}
                      </div>
                      <div className="text-2xl font-bold text-white">
                        {realData.formazioneStats?.stats?.enti?.totale ?? 0}
                      </div>
                      <div className="text-xs text-[#e8fbff]/50">
                        Rating medio:{" "}
                        {realData.formazioneStats?.stats?.enti?.rating_medio ??
                          "-"}
                        /5
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border-cyan-500/20">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 text-cyan-400 text-sm mb-1">
                        <BookOpen className="w-4 h-4" />
                        Corsi Programmati
                      </div>
                      <div className="text-2xl font-bold text-white">
                        {realData.formazioneStats?.stats?.corsi?.programmati ??
                          0}
                      </div>
                      <div className="text-xs text-[#e8fbff]/50">
                        {realData.formazioneStats?.stats?.corsi
                          ?.iscritti_totali ?? 0}{" "}
                        iscritti totali
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 text-emerald-400 text-sm mb-1">
                        <FileCheck className="w-4 h-4" />
                        Attestati Registrati
                        {realData.formazioneStats?.stats?.attestati && (
                          <span className="text-xs text-[#10b981]">● Live</span>
                        )}
                      </div>
                      <div className="text-2xl font-bold text-white">
                        {realData.formazioneStats?.stats?.attestati?.totale ??
                          0}
                      </div>
                      <div className="text-xs text-[#e8fbff]/50">
                        {realData.formazioneStats?.stats?.attestati?.attivi ??
                          0}{" "}
                        attivi
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 text-red-400 text-sm mb-1">
                        <AlertTriangle className="w-4 h-4" />
                        In Scadenza
                      </div>
                      <div className="text-2xl font-bold text-white">
                        {realData.formazioneStats?.stats?.attestati
                          ?.in_scadenza_30 ?? 0}
                      </div>
                      <div className="text-xs text-[#e8fbff]/50">
                        {realData.formazioneStats?.stats?.attestati?.scaduti ??
                          0}{" "}
                        scaduti
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Lista Enti Formatori */}
                <Card className="bg-[#1a2332] border-[#3b82f6]/20">
                  <CardHeader>
                    <CardTitle className="text-[#e8fbff] flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-[#3b82f6]" />
                      Enti Formatori Accreditati
                      {realData.formazioneStats?.enti && (
                        <span className="text-xs text-[#10b981] ml-2">
                          ● Live
                        </span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {(realData.formazioneStats?.enti || []).map(
                        (ente: any, idx: number) => (
                          <div
                            key={ente.id || idx}
                            className="flex items-center justify-between p-3 bg-[#0b1220] rounded-lg border border-[#3b82f6]/10"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${idx === 0 ? "bg-yellow-500" : idx === 1 ? "bg-gray-400" : idx === 2 ? "bg-amber-600" : "bg-[#3b82f6]/30"}`}
                              >
                                #{idx + 1}
                              </div>
                              <div>
                                <div className="text-[#e8fbff] font-medium">
                                  {ente.nome}
                                </div>
                                <div className="text-xs text-[#e8fbff]/50">
                                  {(() => {
                                    try {
                                      const spec =
                                        typeof ente.specializzazioni ===
                                        "string"
                                          ? JSON.parse(ente.specializzazioni)
                                          : ente.specializzazioni;
                                      return Array.isArray(spec)
                                        ? spec.join(", ")
                                        : "Formazione generale";
                                    } catch {
                                      return "Formazione generale";
                                    }
                                  })()}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center gap-1 text-yellow-400">
                                <Star className="w-4 h-4 fill-current" />
                                <span className="font-bold">
                                  {ente.rating || "-"}
                                </span>
                              </div>
                              <div className="text-xs text-[#e8fbff]/50">
                                {ente.corsi_count || 0} corsi
                              </div>
                            </div>
                          </div>
                        )
                      )}
                      {(!realData.formazioneStats?.enti ||
                        realData.formazioneStats.enti.length === 0) && (
                        <div className="text-center text-[#e8fbff]/50 py-8">
                          <GraduationCap className="w-12 h-12 mx-auto mb-2 opacity-30" />
                          <p>Caricamento enti formatori...</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Corsi Disponibili */}
                <Card className="bg-[#1a2332] border-[#3b82f6]/20">
                  <CardHeader>
                    <CardTitle className="text-[#e8fbff] flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-[#3b82f6]" />
                      Corsi Disponibili
                      {realData.formazioneStats?.corsi && (
                        <span className="text-xs text-[#10b981] ml-2">
                          ● Live
                        </span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(realData.formazioneStats?.corsi || []).map(
                        (corso: any, idx: number) => (
                          <div
                            key={corso.id || idx}
                            className="p-4 bg-[#0b1220] rounded-lg border border-[#3b82f6]/10"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <div className="text-[#e8fbff] font-medium">
                                  {corso.titolo}
                                </div>
                                <div className="text-xs text-[#e8fbff]/50">
                                  {(() => {
                                    const impState = getImpersonationParams();
                                    return impState.isImpersonating && impState.associazioneNome
                                      ? impState.associazioneNome
                                      : corso.ente_nome;
                                  })()}
                                </div>
                              </div>
                              <Badge
                                className={`${corso.tipo_attestato === "HACCP" ? "bg-emerald-500/20 text-emerald-400" : corso.tipo_attestato === "Antincendio" ? "bg-red-500/20 text-red-400" : "bg-blue-500/20 text-blue-400"}`}
                              >
                                {corso.tipo_attestato}
                              </Badge>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <div className="text-[#e8fbff]/70">
                                <span className="text-cyan-400 font-bold">
                                  €{corso.prezzo || 0}
                                </span>{" "}
                                · {corso.durata_ore || 0}h
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="text-[#e8fbff]/50">
                                  {corso.posti_disponibili || 0}/
                                  {corso.posti_totali || 0} posti
                                </div>
                                <button
                                  onClick={() => {
                                    const nuovoPrezzo = prompt(`Modifica prezzo per "${corso.titolo}"\nPrezzo attuale: €${corso.prezzo || 0}\n\nInserisci nuovo prezzo:`, corso.prezzo || "0");
                                    if (nuovoPrezzo !== null && !isNaN(Number(nuovoPrezzo))) {
                                      fetch(`${MIHUB_API_BASE_URL}/formazione/corsi/${corso.id}/prezzo`, {
                                        method: "PUT",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ prezzo: parseFloat(nuovoPrezzo) })
                                      }).then(r => r.json()).then(d => {
                                        if (d.success) {
                                          toast.success(`Prezzo aggiornato a €${nuovoPrezzo}`);
                                          // Ricarica stats
                                          window.location.reload();
                                        } else toast.error("Errore aggiornamento prezzo");
                                      }).catch(() => toast.error("Errore di rete"));
                                    }
                                  }}
                                  className="p-1 text-[#3b82f6] hover:text-[#60a5fa] transition-colors"
                                  title="Modifica prezzo"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(`Eliminare il corso "${corso.titolo}"?`)) {
                                      fetch(`${MIHUB_API_BASE_URL}/formazione/corsi/${corso.id}`, {
                                        method: "DELETE"
                                      }).then(r => r.json()).then(d => {
                                        if (d.success) {
                                          toast.success("Corso eliminato");
                                          window.location.reload();
                                        } else toast.error("Errore eliminazione");
                                      }).catch(() => toast.error("Errore di rete"));
                                    }
                                  }}
                                  className="p-1 text-[#ef4444] hover:text-[#f87171] transition-colors"
                                  title="Elimina corso"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                            {corso.data_inizio && (
                              <div className="mt-2 text-xs text-[#e8fbff]/50">
                                <Calendar className="w-3 h-3 inline mr-1" />
                                Inizio:{" "}
                                {new Date(corso.data_inizio).toLocaleDateString(
                                  "it-IT"
                                )}
                              </div>
                            )}
                          </div>
                        )
                      )}
                      {(!realData.formazioneStats?.corsi ||
                        realData.formazioneStats.corsi.length === 0) && (
                        <div className="col-span-2 text-center text-[#e8fbff]/50 py-8">
                          <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-30" />
                          <p>Caricamento corsi...</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Lista Imprese con Attestati - Scadenze */}
                <Card className="bg-[#1a2332] border-[#f59e0b]/20">
                  <CardHeader>
                    <CardTitle className="text-[#e8fbff] flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-[#f59e0b]" />
                      Scadenze Attestati Imprese e Team
                      {realData.formazioneStats?.stats?.scadenze_imprese && (
                        <span className="text-xs text-[#10b981] ml-2">
                          ● Live
                        </span>
                      )}
                    </CardTitle>
                    <CardDescription className="text-[#e8fbff]/50">
                      Attestati impresa e collaboratori in scadenza/scaduti
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2">
                      {(
                        realData.formazioneStats?.stats?.scadenze_imprese || []
                      ).map((item: any, idx: number) => (
                        <div
                          key={item.id || idx}
                          className={`flex items-center justify-between p-3 rounded-lg border ${
                            item.stato_scadenza === "scaduto"
                              ? "bg-red-500/10 border-red-500/30"
                              : item.stato_scadenza === "urgente"
                                ? "bg-orange-500/10 border-orange-500/30"
                                : item.stato_scadenza === "in_scadenza"
                                  ? "bg-yellow-500/10 border-yellow-500/30"
                                  : "bg-[#0b1220] border-[#3b82f6]/10"
                          }`}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-[#e8fbff]/50" />
                              <span className="text-[#e8fbff] font-medium">
                                {item.impresa_nome}
                              </span>
                              {item.collaboratore_nome && (
                                <Badge className="bg-purple-500/20 text-purple-300 text-[10px] ml-1">
                                  👤 {item.collaboratore_nome}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-xs text-[#e8fbff]/50">
                              <span className="flex items-center gap-1">
                                <FileCheck className="w-3 h-3" />
                                {item.tipo}
                              </span>
                              {item.destinatario_tipo === 'collaboratore' && (
                                <span className="text-purple-400">TEAM</span>
                              )}
                              <span>{item.ente_rilascio}</span>
                              {item.numero_certificato && (
                                <span>#{item.numero_certificato}</span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div
                              className={`text-sm font-bold ${
                                item.stato_scadenza === "scaduto"
                                  ? "text-red-400"
                                  : item.stato_scadenza === "urgente"
                                    ? "text-orange-400"
                                    : item.stato_scadenza === "in_scadenza"
                                      ? "text-yellow-400"
                                      : "text-emerald-400"
                              }`}
                            >
                              {item.stato_scadenza === "scaduto"
                                ? `Scaduto da ${Math.abs(item.giorni_rimanenti)} gg`
                                : item.giorni_rimanenti <= 0
                                  ? "Scaduto"
                                  : `${item.giorni_rimanenti} giorni`}
                            </div>
                            <div className="text-xs text-[#e8fbff]/50">
                              Scade:{" "}
                              {new Date(item.data_scadenza).toLocaleDateString(
                                "it-IT"
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      {(!realData.formazioneStats?.stats?.scadenze_imprese ||
                        realData.formazioneStats.stats.scadenze_imprese
                          .length === 0) && (
                        <div className="text-center text-[#e8fbff]/50 py-8">
                          <FileCheck className="w-12 h-12 mx-auto mb-2 opacity-30" />
                          <p>Nessun attestato registrato</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* FORM REGISTRAZIONE ATTESTATO */}
                <Card className="bg-[#1a2332] border-[#10b981]/20">
                  <CardHeader>
                    <CardTitle className="text-[#e8fbff] flex items-center gap-2">
                      <FileCheck className="h-5 w-5 text-[#10b981]" />
                      Registra Nuovo Attestato
                      <Badge className="bg-emerald-500/20 text-emerald-400 ml-2">
                        Nuovo
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form
                      onSubmit={async e => {
                        e.preventDefault();
                        const form = e.target as HTMLFormElement;
                        const formData = new FormData(form);
                        const collaboratoreId = formData.get("collaboratore_id");
                        const data = {
                          impresa_id: parseInt(
                            formData.get("impresa_id") as string
                          ),
                          collaboratore_id: collaboratoreId ? parseInt(collaboratoreId as string) : null,
                          tipo_qualifica: formData.get("tipo_qualifica"),
                          ente_rilascio: formData.get("ente_rilascio"),
                          numero_attestato: formData.get("numero_attestato"),
                          data_rilascio: formData.get("data_rilascio"),
                          data_scadenza: formData.get("data_scadenza"),
                          ore_formazione:
                            parseInt(
                              formData.get("ore_formazione") as string
                            ) || null,
                          docente: formData.get("docente"),
                          note: formData.get("note"),
                        };
                        try {
                          const res = await authenticatedFetch(
                            `${import.meta.env.VITE_API_URL || "https://api.mio-hub.me"}/api/formazione/attestati`,
                            {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify(data),
                            }
                          );
                          const result = await res.json();
                          if (result.success) {
                            alert("✅ " + result.message);
                            form.reset();
                          } else {
                            alert("❌ Errore: " + result.error);
                          }
                        } catch (err) {
                          alert("❌ Errore di connessione");
                        }
                      }}
                      className="space-y-4"
                    >
                      {/* Ricerca Impresa + Selettore Destinatario */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm text-[#e8fbff]/70">
                            Cerca Impresa *
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="Cerca per nome, P.IVA o CF..."
                              className="w-full p-3 bg-[#0b1220] border border-[#3b82f6]/20 rounded-lg text-[#e8fbff] placeholder-[#e8fbff]/30 focus:border-[#10b981] focus:outline-none"
                              onChange={async e => {
                                const q = e.target.value;
                                if (q.length < 2) return;
                                try {
                                  const res = await fetch(
                                    `${import.meta.env.VITE_API_URL || "https://api.mio-hub.me"}/api/formazione/imprese/search?q=${encodeURIComponent(q)}`
                                  );
                                  const data = await res.json();
                                  const list =
                                    document.getElementById("imprese-list");
                                  if (list && data.success) {
                                    // Pulisci il contenuto precedente
                                    list.textContent = "";
                                    data.data.forEach((i: any) => {
                                      const div = document.createElement("div");
                                      div.className =
                                        "p-2 hover:bg-[#3b82f6]/20 cursor-pointer rounded";
                                      div.textContent = `${i.denominazione} - ${i.partita_iva} - ${i.comune || ""}`;
                                      div.addEventListener("click", () => {
                                        const idInput = document.getElementById(
                                          "impresa_id"
                                        ) as HTMLInputElement;
                                        const nomeInput =
                                          document.getElementById(
                                            "impresa_nome"
                                          ) as HTMLInputElement;
                                        if (idInput)
                                          idInput.value = String(i.id);
                                        if (nomeInput)
                                          nomeInput.value = `${i.denominazione} (${i.partita_iva})`;
                                        list.textContent = "";
                                      });
                                      list.appendChild(div);
                                    });
                                  }
                                } catch {}
                              }}
                            />
                            <div
                              id="imprese-list"
                              className="absolute z-10 w-full bg-[#1a2332] border border-[#3b82f6]/20 rounded-lg mt-1 max-h-40 overflow-y-auto text-[#e8fbff] text-sm"
                            ></div>
                          </div>
                          <input
                            type="hidden"
                            name="impresa_id"
                            id="impresa_id"
                            required
                          />
                          <input
                            type="text"
                            id="impresa_nome"
                            readOnly
                            placeholder="Impresa selezionata"
                            className="w-full p-2 bg-[#0b1220]/50 border border-[#10b981]/30 rounded text-[#10b981] text-sm"
                          />
                        </div>

                        {/* Selettore Destinatario: Impresa o Collaboratore */}
                        <div className="space-y-2">
                          <label className="text-sm text-[#e8fbff]/70">
                            Destinatario *
                          </label>
                          <select
                            id="destinatario_tipo"
                            className="w-full p-3 bg-[#0b1220] border border-[#3b82f6]/20 rounded-lg text-[#e8fbff] focus:border-[#10b981] focus:outline-none"
                            onChange={async (e) => {
                              const tipo = e.target.value;
                              const collabSelect = document.getElementById('collaboratore_select') as HTMLSelectElement;
                              const collabContainer = document.getElementById('collaboratore_container');
                              if (tipo === 'collaboratore') {
                                if (collabContainer) collabContainer.style.display = 'block';
                                // Carica collaboratori dell'impresa selezionata
                                const impresaId = (document.getElementById('impresa_id') as HTMLInputElement)?.value;
                                if (impresaId && collabSelect) {
                                  try {
                                    const res = await fetch(`${import.meta.env.VITE_API_URL || 'https://api.mio-hub.me'}/api/collaboratori?impresa_id=${impresaId}`);
                                    const data = await res.json();
                                    collabSelect.innerHTML = '<option value="">Seleziona collaboratore...</option>';
                                    if (data.success && data.data) {
                                      data.data.forEach((c: any) => {
                                        const opt = document.createElement('option');
                                        opt.value = String(c.id);
                                        opt.textContent = `${c.nome} ${c.cognome} - ${c.ruolo || 'Collaboratore'}`;
                                        collabSelect.appendChild(opt);
                                      });
                                    }
                                  } catch {}
                                }
                              } else {
                                if (collabContainer) collabContainer.style.display = 'none';
                              }
                            }}
                          >
                            <option value="impresa">Impresa (DURC, Antimafia...)</option>
                            <option value="collaboratore">Collaboratore (Sicurezza, HACCP...)</option>
                          </select>
                          <div id="collaboratore_container" style={{display: 'none'}}>
                            <select
                              id="collaboratore_select"
                              name="collaboratore_id"
                              className="w-full p-2 mt-2 bg-[#0b1220] border border-[#14b8a6]/30 rounded-lg text-[#14b8a6] text-sm focus:border-[#10b981] focus:outline-none"
                            >
                              <option value="">Seleziona collaboratore...</option>
                            </select>
                            <p className="text-xs text-[#e8fbff]/40 mt-1">Seleziona prima un'impresa per caricare i collaboratori</p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm text-[#e8fbff]/70">
                            Tipo Attestato *
                          </label>
                          <select
                            name="tipo_qualifica"
                            required
                            className="w-full p-3 bg-[#0b1220] border border-[#3b82f6]/20 rounded-lg text-[#e8fbff] focus:border-[#10b981] focus:outline-none"
                            onChange={(e) => {
                              const tipo = e.target.value;
                              // Mappa validità (anni) e ore formazione per tipo attestato
                              const CONFIG: Record<string, {anni: number, ore: number}> = {
                                'DURC': {anni: 1, ore: 0},
                                'ONORABILITA': {anni: 5, ore: 0},
                                'ANTIMAFIA': {anni: 1, ore: 0},
                                'SICUREZZA_LAVORO': {anni: 5, ore: 8},
                                'ANTINCENDIO': {anni: 3, ore: 8},
                                'PRIMO_SOCCORSO': {anni: 3, ore: 12},
                                'RSPP': {anni: 5, ore: 32},
                                'PREPOSTO': {anni: 2, ore: 8},
                                'HACCP': {anni: 3, ore: 8},
                                'SAB': {anni: 5, ore: 120},
                                'REC': {anni: 5, ore: 0},
                                'CORSO_ALIMENTARE': {anni: 3, ore: 8},
                                'ISO 9001': {anni: 3, ore: 0},
                                'ISO 14001': {anni: 3, ore: 0},
                                'ISO 22000': {anni: 3, ore: 0},
                                'CONCESSIONE MERCATO': {anni: 10, ore: 0},
                              };
                              const config = CONFIG[tipo];
                              if (config) {
                                // Auto-calcola data scadenza dalla data rilascio
                                const dataRilascioInput = document.querySelector('input[name="data_rilascio"]') as HTMLInputElement;
                                const dataScadenzaInput = document.querySelector('input[name="data_scadenza"]') as HTMLInputElement;
                                const oreInput = document.querySelector('input[name="ore_formazione"]') as HTMLInputElement;
                                
                                if (dataRilascioInput && dataRilascioInput.value && dataScadenzaInput) {
                                  const rilascio = new Date(dataRilascioInput.value);
                                  rilascio.setFullYear(rilascio.getFullYear() + config.anni);
                                  dataScadenzaInput.value = rilascio.toISOString().split('T')[0];
                                } else if (dataScadenzaInput) {
                                  // Se non c'è data rilascio, usa oggi come base
                                  const oggi = new Date();
                                  oggi.setFullYear(oggi.getFullYear() + config.anni);
                                  dataScadenzaInput.value = oggi.toISOString().split('T')[0];
                                }
                                
                                // Auto-compila ore formazione
                                if (oreInput && config.ore > 0) {
                                  oreInput.value = String(config.ore);
                                }
                              }
                            }}
                          >
                            <option value="">Seleziona tipo...</option>
                            {/* Requisiti Obbligatori */}
                            <option value="DURC">
                              DURC - Regolarità Contributiva
                            </option>
                            <option value="ONORABILITA">
                              ONORABILITA - Requisiti Morali (Art. 71 D.Lgs.
                              59/2010)
                            </option>
                            <option value="ANTIMAFIA">
                              ANTIMAFIA - Dichiarazione (Art. 67 D.Lgs.
                              159/2011)
                            </option>
                            {/* Formazione Obbligatoria Sicurezza */}
                            <option value="SICUREZZA_LAVORO">
                              SICUREZZA LAVORATORI - Formazione Base (D.Lgs. 81/08)
                            </option>
                            <option value="ANTINCENDIO">
                              ANTINCENDIO - Addetto Prevenzione Incendi (D.M. 02/09/2021)
                            </option>
                            <option value="PRIMO_SOCCORSO">
                              PRIMO SOCCORSO - Addetto (D.M. 388/2003)
                            </option>
                            <option value="RSPP">
                              RSPP - Responsabile Sicurezza (D.Lgs. 81/08 Art. 34)
                            </option>
                            <option value="PREPOSTO">
                              PREPOSTO - Formazione Preposti (D.Lgs. 81/08 Art. 37)
                            </option>
                            {/* Certificazioni Alimentari */}
                            <option value="HACCP">
                              HACCP - Sicurezza Alimentare (Reg. CE 852/2004)
                            </option>
                            <option value="SAB">
                              SAB - Somministrazione Alimenti e Bevande (L. 287/91)
                            </option>
                            <option value="REC">
                              REC - Registro Esercenti Commercio
                            </option>
                            <option value="CORSO_ALIMENTARE">
                              CORSO ALIMENTARE - Formazione Regionale
                            </option>
                            {/* Certificazioni Qualità */}
                            <option value="ISO 9001">ISO 9001 - Qualità</option>
                            <option value="ISO 14001">
                              ISO 14001 - Ambiente
                            </option>
                            <option value="ISO 22000">
                              ISO 22000 - Sicurezza Alimentare
                            </option>
                            {/* Altro */}
                            <option value="CONCESSIONE MERCATO">
                              CONCESSIONE MERCATO
                            </option>
                            <option value="ALTRO">ALTRO</option>
                          </select>
                        </div>
                      </div>

                      {/* Date e Ente */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm text-[#e8fbff]/70">
                            Data Rilascio *
                          </label>
                          <input
                            type="date"
                            name="data_rilascio"
                            required
                            className="w-full p-3 bg-[#0b1220] border border-[#3b82f6]/20 rounded-lg text-[#e8fbff] focus:border-[#10b981] focus:outline-none"
                            onChange={(e) => {
                              // Ricalcola data scadenza quando cambia data rilascio
                              const CONFIG: Record<string, number> = {
                                'DURC': 1, 'ONORABILITA': 5, 'ANTIMAFIA': 1,
                                'SICUREZZA_LAVORO': 5, 'ANTINCENDIO': 3, 'PRIMO_SOCCORSO': 3,
                                'RSPP': 5, 'PREPOSTO': 2, 'HACCP': 3, 'SAB': 5,
                                'REC': 5, 'CORSO_ALIMENTARE': 3,
                                'ISO 9001': 3, 'ISO 14001': 3, 'ISO 22000': 3,
                                'CONCESSIONE MERCATO': 10,
                              };
                              const tipoSelect = document.querySelector('select[name="tipo_qualifica"]') as HTMLSelectElement;
                              const dataScadenzaInput = document.querySelector('input[name="data_scadenza"]') as HTMLInputElement;
                              if (tipoSelect && tipoSelect.value && CONFIG[tipoSelect.value] && dataScadenzaInput && e.target.value) {
                                const rilascio = new Date(e.target.value);
                                rilascio.setFullYear(rilascio.getFullYear() + CONFIG[tipoSelect.value]);
                                dataScadenzaInput.value = rilascio.toISOString().split('T')[0];
                              }
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm text-[#e8fbff]/70">
                            Data Scadenza *
                          </label>
                          <input
                            type="date"
                            name="data_scadenza"
                            required
                            className="w-full p-3 bg-[#0b1220] border border-[#3b82f6]/20 rounded-lg text-[#e8fbff] focus:border-[#10b981] focus:outline-none"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm text-[#e8fbff]/70">
                            Ente Rilascio
                          </label>
                          <input
                            type="text"
                            name="ente_rilascio"
                            placeholder="Nome ente formatore"
                            defaultValue={(() => {
                              const imp = getImpersonationParams();
                              return imp.isImpersonating && imp.associazioneNome ? imp.associazioneNome : '';
                            })()}
                            className="w-full p-3 bg-[#0b1220] border border-[#3b82f6]/20 rounded-lg text-[#e8fbff] placeholder-[#e8fbff]/30 focus:border-[#10b981] focus:outline-none"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm text-[#e8fbff]/70">
                            N. Attestato
                          </label>
                          <input
                            type="text"
                            name="numero_attestato"
                            placeholder="Es: ATT-2026-001"
                            className="w-full p-3 bg-[#0b1220] border border-[#3b82f6]/20 rounded-lg text-[#e8fbff] placeholder-[#e8fbff]/30 focus:border-[#10b981] focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Dettagli Corso */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm text-[#e8fbff]/70">
                            Ore Formazione
                          </label>
                          <input
                            type="number"
                            name="ore_formazione"
                            min="1"
                            placeholder="Es: 8"
                            className="w-full p-3 bg-[#0b1220] border border-[#3b82f6]/20 rounded-lg text-[#e8fbff] placeholder-[#e8fbff]/30 focus:border-[#10b981] focus:outline-none"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm text-[#e8fbff]/70">
                            Docente
                          </label>
                          <input
                            type="text"
                            name="docente"
                            placeholder="Nome docente"
                            className="w-full p-3 bg-[#0b1220] border border-[#3b82f6]/20 rounded-lg text-[#e8fbff] placeholder-[#e8fbff]/30 focus:border-[#10b981] focus:outline-none"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm text-[#e8fbff]/70">
                            Note
                          </label>
                          <input
                            type="text"
                            name="note"
                            placeholder="Note aggiuntive"
                            className="w-full p-3 bg-[#0b1220] border border-[#3b82f6]/20 rounded-lg text-[#e8fbff] placeholder-[#e8fbff]/30 focus:border-[#10b981] focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Submit */}
                      <div className="flex justify-end gap-3 pt-4">
                        <button
                          type="reset"
                          className="px-6 py-3 bg-[#0b1220] border border-[#e8fbff]/20 rounded-lg text-[#e8fbff]/70 hover:bg-[#1a2332] transition-colors"
                        >
                          Annulla
                        </button>
                        <button
                          type="submit"
                          className="px-6 py-3 bg-gradient-to-r from-[#10b981] to-[#3b82f6] rounded-lg text-white font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
                        >
                          <FileCheck className="w-4 h-4" />
                          Registra Attestato
                        </button>
                      </div>
                    </form>
                  </CardContent>
                </Card>

                {/* LISTA ISCRIZIONI AI CORSI */}
                <Card className="bg-[#1a2332] border-[#8b5cf6]/20">
                  <CardHeader>
                    <CardTitle className="text-[#e8fbff] flex items-center gap-2">
                      <Users className="h-5 w-5 text-[#8b5cf6]" />
                      Imprese Iscritte ai Corsi
                      {realData.formazioneStats?.iscrizioni && (
                        <span className="text-xs text-[#10b981] ml-2">
                          ● Live
                        </span>
                      )}
                      <Badge className="bg-purple-500/20 text-purple-400 ml-2">
                        Nuovo
                      </Badge>
                    </CardTitle>
                    <CardDescription className="text-[#e8fbff]/50">
                      Iscrizioni registrate dall'app imprese -{" "}
                      {realData.formazioneStats?.iscrizioni?.conteggi?.totale ||
                        0}{" "}
                      totali
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* KPI Iscrizioni */}
                    <div className="grid grid-cols-4 gap-3 mb-4">
                      <div className="bg-[#0b1220] p-3 rounded-lg border border-[#8b5cf6]/20 text-center">
                        <div className="text-2xl font-bold text-[#8b5cf6]">
                          {realData.formazioneStats?.iscrizioni?.conteggi
                            ?.iscritti || 0}
                        </div>
                        <div className="text-xs text-[#e8fbff]/50">
                          Iscritti
                        </div>
                      </div>
                      <div className="bg-[#0b1220] p-3 rounded-lg border border-[#10b981]/20 text-center">
                        <div className="text-2xl font-bold text-[#10b981]">
                          {realData.formazioneStats?.iscrizioni?.conteggi
                            ?.confermati || 0}
                        </div>
                        <div className="text-xs text-[#e8fbff]/50">
                          Confermati
                        </div>
                      </div>
                      <div className="bg-[#0b1220] p-3 rounded-lg border border-[#3b82f6]/20 text-center">
                        <div className="text-2xl font-bold text-[#3b82f6]">
                          {realData.formazioneStats?.iscrizioni?.conteggi
                            ?.completati || 0}
                        </div>
                        <div className="text-xs text-[#e8fbff]/50">
                          Completati
                        </div>
                      </div>
                      <div className="bg-[#0b1220] p-3 rounded-lg border border-[#ef4444]/20 text-center">
                        <div className="text-2xl font-bold text-[#ef4444]">
                          {realData.formazioneStats?.iscrizioni?.conteggi
                            ?.annullati || 0}
                        </div>
                        <div className="text-xs text-[#e8fbff]/50">
                          Annullati
                        </div>
                      </div>
                    </div>

                    {/* Lista Iscrizioni */}
                    <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2">
                      {(
                        realData.formazioneStats?.iscrizioni
                          ?.iscrizioni_recenti || []
                      ).map((item: any, idx: number) => (
                        <div
                          key={item.id || idx}
                          className={`flex items-center justify-between p-3 rounded-lg border ${
                            item.stato === "COMPLETATO"
                              ? "bg-blue-500/10 border-blue-500/30"
                              : item.stato === "CONFERMATO"
                                ? "bg-green-500/10 border-green-500/30"
                                : item.stato === "ANNULLATO"
                                  ? "bg-red-500/10 border-red-500/30"
                                  : "bg-purple-500/10 border-purple-500/30"
                          }`}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-[#e8fbff]">
                                {item.impresa_nome}
                              </span>
                              <Badge
                                className={`text-xs ${
                                  item.stato === "COMPLETATO"
                                    ? "bg-blue-500/20 text-blue-400"
                                    : item.stato === "CONFERMATO"
                                      ? "bg-green-500/20 text-green-400"
                                      : item.stato === "ANNULLATO"
                                        ? "bg-red-500/20 text-red-400"
                                        : "bg-purple-500/20 text-purple-400"
                                }`}
                              >
                                {item.stato}
                              </Badge>
                            </div>
                            <div className="text-sm text-[#e8fbff]/60 mt-1">
                              <span className="text-[#3b82f6]">
                                {item.corso_titolo}
                              </span>
                              {item.ente_nome && (
                                <span className="ml-2">• {item.ente_nome}</span>
                              )}
                            </div>
                            {item.utente_nome && (
                              <div className="text-xs text-[#e8fbff]/40 mt-1">
                                Partecipante: {item.utente_nome}
                              </div>
                            )}
                          </div>
                          <div className="text-right min-w-[230px]">
                            <div className="text-sm text-[#e8fbff]/70">
                              {item.corso_data
                                ? new Date(item.corso_data).toLocaleDateString(
                                    "it-IT",
                                    {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                    }
                                  )
                                : "-"}
                            </div>
                            <div className="text-xs text-[#e8fbff]/40">
                              Iscritto:{" "}
                              {item.data_iscrizione
                                ? new Date(
                                    item.data_iscrizione
                                  ).toLocaleDateString("it-IT")
                                : "-"}
                            </div>
                            <div className="mt-2 flex flex-wrap justify-end gap-2">
                              {item.stato === "COMPLETATO" ? (
                                <span className="px-2 py-1 rounded-md bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs">
                                  Corso fatto
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  className="px-2 py-1 rounded-md bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-blue-300 text-xs"
                                  onClick={async () => {
                                    if (!item.corso_id) {
                                      alert("ID corso mancante: aggiorna la pagina e riprova.");
                                      return;
                                    }
                                    const impersonation = getImpersonationParams();
                                    const assocId = impersonation.associazioneId || new URLSearchParams(window.location.search).get("associazione_id") || "1";
                                    const MIHUB_API =
                                      import.meta.env.VITE_MIHUB_API_BASE_URL ||
                                      "https://api.mio-hub.me/api";
                                    try {
                                      const response = await authenticatedFetch(
                                        `${MIHUB_API}/associazioni/${assocId}/corsi/${item.corso_id}/iscrizioni/${item.id}/completa`,
                                        { method: "POST" }
                                      );
                                      const data = await response.json();
                                      if (data.success) {
                                        alert("✅ Corso segnato come fatto.");
                                        window.location.reload();
                                      } else {
                                        alert("❌ Errore: " + data.error);
                                      }
                                    } catch (err) {
                                      alert("❌ Errore durante il completamento del corso");
                                    }
                                  }}
                                >
                                  Corso fatto
                                </button>
                              )}
                              <button
                                type="button"
                                className="px-2 py-1 rounded-md bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs disabled:opacity-50"
                                disabled={Boolean(item.attestato_rilasciato)}
                                onClick={async () => {
                                  if (!item.corso_id) {
                                    alert("ID corso mancante: aggiorna la pagina e riprova.");
                                    return;
                                  }
                                  const impersonation = getImpersonationParams();
                                  const assocId = impersonation.associazioneId || new URLSearchParams(window.location.search).get("associazione_id") || "1";
                                  const MIHUB_API =
                                    import.meta.env.VITE_MIHUB_API_BASE_URL ||
                                    "https://api.mio-hub.me/api";
                                  try {
                                    const response = await authenticatedFetch(
                                      `${MIHUB_API}/associazioni/${assocId}/corsi/${item.corso_id}/rilascia-attestato`,
                                      {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ iscrizione_id: item.id }),
                                      }
                                    );
                                    const data = await response.json();
                                    if (data.success) {
                                      alert("✅ Attestato generato e inviato all'impresa.");
                                      window.location.reload();
                                    } else {
                                      alert("❌ Errore: " + data.error);
                                    }
                                  } catch (err) {
                                    alert("❌ Errore durante la generazione attestato");
                                  }
                                }}
                              >
                                {item.attestato_rilasciato ? "Attestato inviato" : "Genera attestato"}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                      {(!realData.formazioneStats?.iscrizioni
                        ?.iscrizioni_recenti ||
                        realData.formazioneStats.iscrizioni.iscrizioni_recenti
                          .length === 0) && (
                        <div className="text-center text-[#e8fbff]/50 py-8">
                          <Users className="w-12 h-12 mx-auto mb-2 opacity-30" />
                          <p>Nessuna iscrizione registrata</p>
                          <p className="text-xs mt-1">
                            Le imprese potranno iscriversi ai corsi dall'app
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Form Invio Notifiche Enti Formatori */}
                <Card className="bg-[#1a2332] border-[#3b82f6]/20">
                  <CardHeader>
                    <CardTitle className="text-[#e8fbff] flex items-center gap-2">
                      <Bell className="h-5 w-5 text-[#3b82f6]" />
                      Invia Notifica alle Imprese
                    </CardTitle>
                    <CardDescription className="text-[#e8fbff]/50">
                      Invia comunicazioni informative o promozionali alle
                      imprese iscritte
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form
                      onSubmit={async e => {
                        e.preventDefault();
                        const form = e.target as HTMLFormElement;
                        const formData = new FormData(form);
                        const MIHUB_API =
                          import.meta.env.VITE_MIHUB_API_BASE_URL ||
                          "https://api.mio-hub.me/api";

                        setInvioNotificaLoading(true);
                        try {
                          const targetTipo = formData.get("target_tipo");
                          const targetId = formData.get("target_id");
                          const impersonation = getImpersonationParams();
                          const associazioneId = impersonation.associazioneId || new URLSearchParams(window.location.search).get("associazione_id") || "1";
                          let targetNome = null;

                          if (targetTipo === "CORSO") {
                            const corsoId = formData.get("corso_id");
                            if (!corsoId) {
                              alert("Seleziona il corso a cui inviare la notifica.");
                              setInvioNotificaLoading(false);
                              return;
                            }

                            const response = await authenticatedFetch(
                              `${MIHUB_API}/associazioni/${associazioneId}/notifiche-corso`,
                              {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  corso_id: parseInt(corsoId as string, 10),
                                  titolo: formData.get("titolo"),
                                  messaggio: formData.get("messaggio"),
                                  tipo_messaggio: formData.get("tipo_messaggio"),
                                  modalita: formData.get("modalita_corso") || "ONLINE",
                                  link_corso: entiCorsoModalita === "ONLINE" ? entiCorsoLink.trim() || null : null,
                                  sede_corso: entiCorsoModalita === "SEDE" ? entiCorsoSede.trim() || null : null,
                                }),
                              }
                            );
                            const data = await response.json();
                            if (data.success) {
                              alert(
                                `✅ Notifica corso inviata a ${data.data.destinatari} imprese iscritte a "${data.data.corso_titolo}".`
                              );
                              form.reset();
                              setEntiTargetTipo("TUTTI");
                              setEntiCorsoDettagliAperti(false);
                              setEntiCorsoModalita("ONLINE");
                              setEntiCorsoLink("");
                              setEntiCorsoSede("");
                            } else {
                              alert("❌ Errore: " + data.error);
                            }
                            return;
                          }

                          if (targetTipo === "MERCATO" && targetId) {
                            const mercato = mercatiList.find(
                              m => m.id === parseInt(targetId as string)
                            );
                            targetNome = mercato?.name || mercato?.nome;
                          } else if (targetTipo === "HUB" && targetId) {
                            const hub = hubList.find(
                              h => h.hub_id === parseInt(targetId as string)
                            );
                            targetNome = hub?.comune_nome;
                          } else if (targetTipo === "IMPRESA" && targetId) {
                            const impresa = impreseList.find(
                              i => i.id === parseInt(targetId as string)
                            );
                            targetNome = impresa?.denominazione;
                          }

                          const response = await authenticatedFetch(
                            `${MIHUB_API}/notifiche/send`,
                            {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                mittente_tipo: "ENTE_FORMATORE",
                                mittente_id: 1,
                                mittente_nome: "Ente Formatore",
                                titolo: formData.get("titolo"),
                                messaggio: formData.get("messaggio"),
                                tipo_messaggio: formData.get("tipo_messaggio"),
                                target_tipo: targetTipo,
                                target_id: targetId || null,
                                target_nome: targetNome,
                              }),
                            }
                          );
                          const data = await response.json();
                          if (data.success) {
                            alert(
                              `✅ Notifica inviata con successo a ${data.data.destinatari_count} destinatari!`
                            );
                            form.reset();
                          } else {
                            alert("❌ Errore: " + data.error);
                          }
                        } catch (err) {
                          alert("❌ Errore invio notifica");
                        } finally {
                          setInvioNotificaLoading(false);
                        }
                      }}
                      className="space-y-4"
                    >
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-[#e8fbff]/70 mb-1">
                            Destinatari
                          </label>
                          <select
                            name="target_tipo"
                            id="enti_target_tipo"
                            value={entiTargetTipo}
                            className="w-full bg-[#0b1220] border border-[#3b82f6]/30 rounded-lg p-2 text-[#e8fbff]"
                            required
                            onChange={e => {
                              setEntiTargetTipo(e.target.value);
                              if (e.target.value !== "CORSO") {
                                setEntiCorsoDettagliAperti(false);
                                setEntiCorsoLink("");
                                setEntiCorsoSede("");
                              }
                              const targetIdSelect = document.getElementById(
                                "enti_target_id"
                              ) as HTMLSelectElement;
                              const targetIdContainer = document.getElementById(
                                "enti_target_id_container"
                              );
                              if (targetIdContainer) {
                                targetIdContainer.style.display = [
                                  "MERCATO",
                                  "HUB",
                                  "IMPRESA",
                                ].includes(e.target.value)
                                  ? "block"
                                  : "none";
                              }
                              if (targetIdSelect) {
                                targetIdSelect.innerHTML =
                                  '<option value="">Seleziona...</option>';
                                if (e.target.value === "MERCATO") {
                                  mercatiList.forEach(m => {
                                    const opt =
                                      document.createElement("option");
                                    opt.value = m.id;
                                    opt.textContent = m.name || m.nome;
                                    targetIdSelect.appendChild(opt);
                                  });
                                } else if (e.target.value === "HUB") {
                                  hubList.forEach(h => {
                                    const opt =
                                      document.createElement("option");
                                    opt.value = h.hub_id;
                                    opt.textContent = h.comune_nome;
                                    targetIdSelect.appendChild(opt);
                                  });
                                } else if (e.target.value === "IMPRESA") {
                                  impreseList.forEach(i => {
                                    const opt =
                                      document.createElement("option");
                                    opt.value = i.id;
                                    opt.textContent = i.denominazione;
                                    targetIdSelect.appendChild(opt);
                                  });
                                }
                              }
                            }}
                          >
                            <option value="TUTTI">Tutte le Imprese</option>
                            <option value="CORSO">Imprese iscritte a un corso...</option>
                            <option value="MERCATO">
                              Imprese del Mercato...
                            </option>
                            <option value="HUB">Negozi dell'HUB...</option>
                            <option value="IMPRESA">Impresa Singola...</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm text-[#e8fbff]/70 mb-1">
                            Tipo Messaggio
                          </label>
                          <select
                            name="tipo_messaggio"
                            className="w-full bg-[#0b1220] border border-[#3b82f6]/30 rounded-lg p-2 text-[#e8fbff]"
                            required
                          >
                            <option value="INFORMATIVA">Informativa</option>
                            <option value="PROMOZIONALE">
                              Promozionale (Corsi)
                            </option>
                          </select>
                        </div>
                      </div>
                      {entiTargetTipo === "CORSO" && (
                        <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-4 space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm text-[#e8fbff]/70 mb-1">
                                Corso
                              </label>
                              <select
                                name="corso_id"
                                className="w-full bg-[#0b1220] border border-[#3b82f6]/30 rounded-lg p-2 text-[#e8fbff]"
                                required={entiTargetTipo === "CORSO"}
                              >
                                <option value="">Seleziona il corso...</option>
                                {(realData.formazioneStats?.corsi || []).map((corso: any) => (
                                  <option key={corso.id} value={corso.id}>
                                    {corso.titolo} — {corso.ente_nome || corso.sede || "corso"}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="flex items-end">
                              <button
                                type="button"
                                onClick={() => setEntiCorsoDettagliAperti(true)}
                                className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] text-white font-medium hover:opacity-90"
                              >
                                Configura link online o sede
                              </button>
                            </div>
                          </div>
                          <p className="text-xs text-[#e8fbff]/50">
                            La notifica verrà inviata solo alle imprese iscritte al corso selezionato.
                          </p>
                        </div>
                      )}

                      {entiCorsoDettagliAperti && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
                          <div className="w-full max-w-2xl rounded-xl border border-blue-500/30 bg-[#111827] p-5 shadow-2xl">
                            <div className="flex items-start justify-between gap-4 mb-4">
                              <div>
                                <h3 className="text-lg font-semibold text-[#e8fbff]">
                                  Dettagli accesso corso
                                </h3>
                                <p className="text-sm text-[#e8fbff]/60">
                                  Inserisci il collegamento streaming oppure le specifiche della sede. Verranno aggiunti al messaggio inviato alle imprese iscritte.
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => setEntiCorsoDettagliAperti(false)}
                                className="px-3 py-1 rounded-md border border-white/10 text-[#e8fbff]/70 hover:bg-white/10"
                              >
                                Chiudi
                              </button>
                            </div>
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm text-[#e8fbff]/70 mb-1">
                                  Modalità corso
                                </label>
                                <select
                                  name="modalita_corso"
                                  value={entiCorsoModalita}
                                  onChange={e => setEntiCorsoModalita(e.target.value as "ONLINE" | "SEDE")}
                                  className="w-full bg-[#0b1220] border border-[#3b82f6]/30 rounded-lg p-2 text-[#e8fbff]"
                                >
                                  <option value="ONLINE">Corso online / streaming</option>
                                  <option value="SEDE">Corso in sede</option>
                                </select>
                              </div>
                              {entiCorsoModalita === "ONLINE" ? (
                                <div className="space-y-3">
                                  <label className="block text-sm text-[#e8fbff]/70 mb-1">
                                    Piattaforma corso
                                  </label>
                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setEntiCorsoPiattaforma("A99X")}
                                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                        (entiCorsoPiattaforma || "A99X") === "A99X"
                                          ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/25"
                                          : "bg-[#0b1220] border border-[#3b82f6]/30 text-[#e8fbff]/70 hover:border-purple-500/50"
                                      }`}
                                    >
                                      ⚡ A99X
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEntiCorsoPiattaforma("ESTERNO")}
                                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                        entiCorsoPiattaforma === "ESTERNO"
                                          ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/25"
                                          : "bg-[#0b1220] border border-[#3b82f6]/30 text-[#e8fbff]/70 hover:border-blue-500/50"
                                      }`}
                                    >
                                      🔗 Link Esterno
                                    </button>
                                  </div>
                                  {(entiCorsoPiattaforma || "A99X") === "A99X" ? (
                                    <div>
                                      <label className="block text-sm text-[#e8fbff]/70 mb-1">
                                        Link A99X (Cal.com)
                                      </label>
                                      <input
                                        type="url"
                                        name="link_a99x"
                                        placeholder="https://cal.miohub.it/..."
                                        value={entiCorsoLink}
                                        onChange={e => setEntiCorsoLink(e.target.value)}
                                        className="w-full bg-[#0b1220] border border-purple-500/30 rounded-lg p-2 text-[#e8fbff]"
                                      />
                                      <p className="text-xs text-purple-400/70 mt-1">Le imprese iscritte riceveranno il link diretto alla videoconferenza A99X</p>
                                    </div>
                                  ) : (
                                    <div>
                                      <label className="block text-sm text-[#e8fbff]/70 mb-1">
                                        Link accesso piattaforma streaming
                                      </label>
                                      <input
                                        type="url"
                                        name="link_corso"
                                        placeholder="https://..."
                                        value={entiCorsoLink}
                                        onChange={e => setEntiCorsoLink(e.target.value)}
                                        className="w-full bg-[#0b1220] border border-[#3b82f6]/30 rounded-lg p-2 text-[#e8fbff]"
                                      />
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div>
                                  <label className="block text-sm text-[#e8fbff]/70 mb-1">
                                    Specifiche sede corso
                                  </label>
                                  <textarea
                                    name="sede_corso"
                                    rows={3}
                                    placeholder="Es: Bologna, Via..., aula..., orario..., referente..."
                                    value={entiCorsoSede}
                                    onChange={e => setEntiCorsoSede(e.target.value)}
                                    className="w-full bg-[#0b1220] border border-[#3b82f6]/30 rounded-lg p-2 text-[#e8fbff]"
                                  />
                                </div>
                              )}
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => setEntiCorsoDettagliAperti(false)}
                                  className="px-4 py-2 rounded-lg bg-[#3b82f6] text-white font-medium hover:bg-blue-600"
                                >
                                  Salva dettagli
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div
                        id="enti_target_id_container"
                        style={{ display: "none" }}
                      >
                        <label className="block text-sm text-[#e8fbff]/70 mb-1">
                          Seleziona Destinatario Specifico
                        </label>
                        <select
                          name="target_id"
                          id="enti_target_id"
                          className="w-full bg-[#0b1220] border border-[#3b82f6]/30 rounded-lg p-2 text-[#e8fbff]"
                        >
                          <option value="">Seleziona...</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm text-[#e8fbff]/70 mb-1">
                          Titolo
                        </label>
                        <input
                          type="text"
                          name="titolo"
                          placeholder="Es: Nuovo corso HACCP disponibile"
                          className="w-full bg-[#0b1220] border border-[#3b82f6]/30 rounded-lg p-2 text-[#e8fbff]"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-[#e8fbff]/70 mb-1">
                          Messaggio
                        </label>
                        <textarea
                          name="messaggio"
                          rows={4}
                          placeholder="Scrivi il messaggio da inviare alle imprese..."
                          className="w-full bg-[#0b1220] border border-[#3b82f6]/30 rounded-lg p-2 text-[#e8fbff]"
                          required
                        />
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={invioNotificaLoading}
                          className="px-6 py-3 bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] rounded-lg text-white font-medium hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
                        >
                          {invioNotificaLoading ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              Invio in corso...
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4" />
                              Invia Notifica
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </CardContent>
                </Card>

                {/* Lista Messaggi - Enti Formatori */}
                <Card className="bg-[#1a2332] border-[#3b82f6]/20">
                  <CardHeader>
                    <CardTitle className="text-[#e8fbff] flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-[#3b82f6]" />
                      Messaggi
                      {(notificheRisposteEnti || []).filter(
                        (r: any) => !r.letta
                      ).length > 0 && (
                        <Badge className="bg-red-500 text-white ml-2">
                          {
                            (notificheRisposteEnti || []).filter(
                              (r: any) => !r.letta
                            ).length
                          }{" "}
                          nuove
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="text-[#e8fbff]/50">
                      Messaggi inviati e ricevuti
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Filtri */}
                    <div className="flex gap-2 mb-4">
                      <button
                        onClick={() => setFiltroMessaggiEnti("tutti")}
                        className={`px-3 py-1 rounded-full text-sm ${filtroMessaggiEnti === "tutti" ? "bg-blue-500 text-white" : "bg-[#0b1220] text-[#e8fbff]/70 hover:bg-blue-500/20"}`}
                      >
                        Tutti
                      </button>
                      <button
                        onClick={() => setFiltroMessaggiEnti("inviati")}
                        className={`px-3 py-1 rounded-full text-sm ${filtroMessaggiEnti === "inviati" ? "bg-blue-500 text-white" : "bg-[#0b1220] text-[#e8fbff]/70 hover:bg-blue-500/20"}`}
                      >
                        Inviati ({(messaggiInviatiEnti || []).length})
                      </button>
                      <button
                        onClick={() => setFiltroMessaggiEnti("ricevuti")}
                        className={`px-3 py-1 rounded-full text-sm ${filtroMessaggiEnti === "ricevuti" ? "bg-blue-500 text-white" : "bg-[#0b1220] text-[#e8fbff]/70 hover:bg-blue-500/20"}`}
                      >
                        Ricevuti ({(notificheRisposteEnti || []).length})
                      </button>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto space-y-3">
                      {/* Messaggi Inviati */}
                      {(filtroMessaggiEnti === "tutti" ||
                        filtroMessaggiEnti === "inviati") &&
                        (messaggiInviatiEnti || []).map(
                          (msg: any, idx: number) => {
                            const msgKey = msg._rowKey || `inv-enti-${msg.id || idx}`;
                            const isExpanded = expandedMessaggioId === msgKey;
                            return (
                            <div
                              key={msgKey}
                              className="p-3 rounded-lg border bg-blue-500/5 border-blue-500/20 cursor-pointer transition-all hover:border-blue-500/40"
                              onClick={() => setExpandedMessaggioId(isExpanded ? null : msgKey)}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Send className="w-4 h-4 text-blue-400" />
                                  <span className="text-[#e8fbff] font-medium">
                                    Inviato
                                  </span>
                                  <Badge className="bg-blue-500/20 text-blue-400 text-xs">
                                    {msg.destinatario_impresa_nome
                                      ? `→ ${msg.destinatario_impresa_nome}`
                                      : `→ ${msg.destinatari || 0} imprese`}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-[#e8fbff]/50">
                                    {new Date(msg.created_at).toLocaleDateString(
                                      "it-IT",
                                      {
                                        day: "2-digit",
                                        month: "short",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      }
                                    )}
                                  </span>
                                  <Eye className="w-4 h-4 text-blue-400/60 hover:text-blue-400" />
                                </div>
                              </div>
                              <p className="text-sm text-[#e8fbff]/80">
                                {msg.titolo}
                              </p>
                              {isExpanded && msg.messaggio && (
                                <div className="mt-2 p-2 bg-blue-500/10 rounded-md border border-blue-500/20">
                                  <p className="text-sm text-[#e8fbff]/70 whitespace-pre-wrap">{msg.messaggio}</p>
                                </div>
                              )}
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-xs text-[#e8fbff]/50">
                                  {msg.destinatario_impresa_nome
                                    ? `Stato: ${msg.destinatario_stato || "INVIATO"}`
                                    : `Letti: ${msg.lette || 0}/${msg.destinatari || 0}`}
                                </span>
                                {isExpanded ? <ChevronUp className="w-3 h-3 text-[#e8fbff]/40" /> : <ChevronDown className="w-3 h-3 text-[#e8fbff]/40" />}
                              </div>
                            </div>
                            );
                          }
                        )}
                      {/* Messaggi Ricevuti */}
                      {(filtroMessaggiEnti === "tutti" ||
                        filtroMessaggiEnti === "ricevuti") &&
                        (notificheRisposteEnti || []).map(
                          (risposta: any, idx: number) => {
                            const ricKey = `ric-enti-${risposta.id || idx}`;
                            const isExpanded = expandedMessaggioId === ricKey;
                            return (
                            <div
                              key={ricKey}
                              onClick={() => {
                                segnaRispostaComeLetta(risposta);
                                setExpandedMessaggioId(isExpanded ? null : ricKey);
                              }}
                              className={`p-3 rounded-lg border cursor-pointer transition-all hover:scale-[1.01] ${!risposta.letta ? "bg-blue-500/10 border-blue-500/30" : "bg-[#0b1220] border-[#3b82f6]/20"}`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  {risposta.letta ? (
                                    <MailOpen className="w-4 h-4 text-[#e8fbff]/40" />
                                  ) : (
                                    <Mail className="w-4 h-4 text-amber-400" />
                                  )}
                                  <span className="text-[#e8fbff] font-medium">
                                    {risposta.mittente_nome || "Impresa"}
                                  </span>
                                  {!risposta.letta && (
                                    <Badge className="bg-amber-500 text-white text-xs">
                                      Nuova
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-[#e8fbff]/50">
                                    {new Date(
                                      risposta.created_at
                                    ).toLocaleDateString("it-IT", {
                                      day: "2-digit",
                                      month: "short",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                  <Eye className="w-4 h-4 text-blue-400/60 hover:text-blue-400" />
                                </div>
                              </div>
                              <p className="text-sm text-[#e8fbff]/80">
                                {risposta.titolo}
                              </p>
                              {isExpanded ? (
                                <div className="mt-2 p-2 bg-blue-500/10 rounded-md border border-blue-500/20">
                                  <p className="text-sm text-[#e8fbff]/70 whitespace-pre-wrap">{risposta.messaggio}</p>
                                </div>
                              ) : (
                                <p className="text-xs text-[#e8fbff]/60 mt-1 line-clamp-2">
                                  {risposta.messaggio}
                                </p>
                              )}
                              <div className="flex justify-end mt-1">
                                {isExpanded ? <ChevronUp className="w-3 h-3 text-[#e8fbff]/40" /> : <ChevronDown className="w-3 h-3 text-[#e8fbff]/40" />}
                              </div>
                            </div>
                            );
                          }
                        )}
                      {/* Empty states */}
                      {filtroMessaggiEnti === "inviati" &&
                        (messaggiInviatiEnti || []).length === 0 && (
                          <div className="text-center text-[#e8fbff]/50 py-8">
                            <Send className="w-12 h-12 mx-auto mb-2 opacity-30" />
                            <p>Nessun messaggio inviato</p>
                          </div>
                        )}
                      {filtroMessaggiEnti === "ricevuti" &&
                        (notificheRisposteEnti || []).length === 0 && (
                          <div className="text-center text-[#e8fbff]/50 py-8">
                            <Mail className="w-12 h-12 mx-auto mb-2 opacity-30" />
                            <p>Nessuna risposta ricevuta</p>
                          </div>
                        )}
                      {filtroMessaggiEnti === "tutti" &&
                        (messaggiInviatiEnti || []).length === 0 &&
                        (notificheRisposteEnti || []).length === 0 && (
                          <div className="text-center text-[#e8fbff]/50 py-8">
                            <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-30" />
                            <p>Nessun messaggio</p>
                          </div>
                        )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* SOTTO-TAB: ASSOCIAZIONI & BANDI */}
              <TabsContent value="bandi" className="space-y-6">
                {/* KPI Bandi */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 text-emerald-400 text-sm mb-1">
                        <Landmark className="w-4 h-4" />
                        Associazioni Partner
                        {realData.bandiStats && (
                          <span className="text-xs text-[#10b981]">● Live</span>
                        )}
                      </div>
                      <div className="text-2xl font-bold text-white">
                        {realData.bandiStats?.stats?.associazioni?.totale ?? 0}
                      </div>
                      <div className="text-xs text-[#e8fbff]/50">
                        Success rate:{" "}
                        {realData.bandiStats?.stats?.associazioni
                          ?.success_rate_medio ?? "-"}
                        %
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border-cyan-500/20">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 text-cyan-400 text-sm mb-1">
                        <FileText className="w-4 h-4" />
                        Bandi Aperti
                      </div>
                      <div className="text-2xl font-bold text-white">
                        {realData.bandiStats?.stats?.bandi?.aperti ?? 0}
                      </div>
                      <div className="text-xs text-[#e8fbff]/50">
                        {realData.bandiStats?.stats?.bandi?.in_scadenza ?? 0} in
                        scadenza
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 text-yellow-400 text-sm mb-1">
                        <HandCoins className="w-4 h-4" />
                        Importo Totale
                      </div>
                      <div className="text-2xl font-bold text-white">
                        €
                        {(
                          (realData.bandiStats?.stats?.bandi?.importo_totale ??
                            0) / 1000
                        ).toFixed(0)}
                        K
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 text-purple-400 text-sm mb-1">
                        <Target className="w-4 h-4" />
                        Rating Medio
                      </div>
                      <div className="text-2xl font-bold text-white">
                        {realData.bandiStats?.stats?.associazioni
                          ?.rating_medio ?? "-"}
                        /5
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Lista Associazioni */}
                <Card className="bg-[#1a2332] border-[#10b981]/20">
                  <CardHeader>
                    <CardTitle className="text-[#e8fbff] flex items-center gap-2">
                      <Landmark className="h-5 w-5 text-[#10b981]" />
                      Associazioni Partner
                      {realData.bandiStats?.associazioni && (
                        <span className="text-xs text-[#10b981] ml-2">
                          ● Live
                        </span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {(realData.bandiStats?.associazioni || []).map(
                        (assoc: any, idx: number) => (
                          <div
                            key={assoc.id || idx}
                            className="flex items-center justify-between p-3 bg-[#0b1220] rounded-lg border border-[#10b981]/10"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${idx === 0 ? "bg-yellow-500" : idx === 1 ? "bg-gray-400" : idx === 2 ? "bg-amber-600" : "bg-[#10b981]/30"}`}
                              >
                                #{idx + 1}
                              </div>
                              <div>
                                <div className="text-[#e8fbff] font-medium">
                                  {assoc.nome}
                                </div>
                                <div className="text-xs text-[#e8fbff]/50">
                                  {assoc.tipo_ente} ·{" "}
                                  {(() => {
                                    try {
                                      const spec =
                                        typeof assoc.specializzazioni ===
                                        "string"
                                          ? JSON.parse(assoc.specializzazioni)
                                          : assoc.specializzazioni;
                                      return Array.isArray(spec)
                                        ? spec.join(", ")
                                        : "Generale";
                                    } catch {
                                      return "Generale";
                                    }
                                  })()}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center gap-1 text-emerald-400">
                                <TrendingUp className="w-4 h-4" />
                                <span className="font-bold">
                                  {assoc.success_rate || 0}%
                                </span>
                              </div>
                              <div className="text-xs text-[#e8fbff]/50">
                                {assoc.pratiche_gestite || 0} pratiche
                              </div>
                            </div>
                          </div>
                        )
                      )}
                      {(!realData.bandiStats?.associazioni ||
                        realData.bandiStats.associazioni.length === 0) && (
                        <div className="text-center text-[#e8fbff]/50 py-8">
                          <Landmark className="w-12 h-12 mx-auto mb-2 opacity-30" />
                          <p>Caricamento associazioni...</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Catalogo Bandi */}
                <Card className="bg-[#1a2332] border-[#10b981]/20">
                  <CardHeader>
                    <CardTitle className="text-[#e8fbff] flex items-center gap-2">
                      <FileText className="h-5 w-5 text-[#10b981]" />
                      Catalogo Bandi Attivi
                      {realData.bandiStats?.catalogo && (
                        <span className="text-xs text-[#10b981] ml-2">
                          ● Live
                        </span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(realData.bandiStats?.catalogo || []).map(
                        (bando: any, idx: number) => (
                          <div
                            key={bando.id || idx}
                            className="p-4 bg-[#0b1220] rounded-lg border border-[#10b981]/10"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <div className="text-[#e8fbff] font-medium">
                                  {bando.titolo}
                                </div>
                                <div className="text-xs text-[#e8fbff]/50">
                                  {bando.ente_erogatore}
                                </div>
                              </div>
                              <Badge
                                className={`${bando.tipo_ente === "regionale" ? "bg-blue-500/20 text-blue-400" : bando.tipo_ente === "nazionale" ? "bg-purple-500/20 text-purple-400" : "bg-emerald-500/20 text-emerald-400"}`}
                              >
                                {bando.tipo_ente}
                              </Badge>
                            </div>
                            <div className="flex justify-between items-center text-sm mb-2">
                              <div className="text-yellow-400 font-bold">
                                €{((bando.importo_max || 0) / 1000).toFixed(0)}K
                                max
                              </div>
                              <div className="text-[#e8fbff]/50">
                                Fondo: €
                                {((bando.fondo_totale || 0) / 1000).toFixed(0)}K
                              </div>
                            </div>
                            <div className="flex justify-between items-center text-xs text-[#e8fbff]/50">
                              <div>
                                <Calendar className="w-3 h-3 inline mr-1" />
                                Scade:{" "}
                                {bando.scadenza
                                  ? new Date(bando.scadenza).toLocaleDateString(
                                      "it-IT"
                                    )
                                  : "N/D"}
                              </div>
                              <div className="text-emerald-400">
                                {bando.settori_target?.slice(0, 2).join(", ") ||
                                  "Tutti i settori"}
                              </div>
                            </div>
                          </div>
                        )
                      )}
                      {(!realData.bandiStats?.catalogo ||
                        realData.bandiStats.catalogo.length === 0) && (
                        <div className="col-span-2 text-center text-[#e8fbff]/50 py-8">
                          <FileText className="w-12 h-12 mx-auto mb-2 opacity-30" />
                          <p>Caricamento bandi...</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* CATALOGO SERVIZI ASSOCIAZIONI */}
                <Card className="bg-[#1a2332] border-[#8b5cf6]/20">
                  <CardHeader>
                    <CardTitle className="text-[#e8fbff] flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-[#8b5cf6]" />
                      Servizi Professionali
                      {realData.bandiStats?.servizi && (
                        <span className="text-xs text-[#10b981] ml-2">
                          ● Live
                        </span>
                      )}
                      <Badge className="bg-purple-500/20 text-purple-400 ml-2">
                        Nuovo
                      </Badge>
                    </CardTitle>
                    <CardDescription className="text-[#e8fbff]/50">
                      DURC, SCIA, Contabilità, Paghe, Consulenza -{" "}
                      {realData.bandiStats?.servizi?.length || 0} servizi
                      disponibili
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
                      {[
                        {
                          cat: "REGOLARIZZAZIONE",
                          nome: "DURC",
                          icona: Shield,
                          colore: "red",
                        },
                        {
                          cat: "PRATICHE",
                          nome: "SCIA & Pratiche",
                          icona: FileText,
                          colore: "blue",
                        },
                        {
                          cat: "CONTABILITA",
                          nome: "Contabilità",
                          icona: Calculator,
                          colore: "green",
                        },
                        {
                          cat: "PAGHE",
                          nome: "Paghe",
                          icona: Users,
                          colore: "yellow",
                        },
                        {
                          cat: "CONSULENZA",
                          nome: "Consulenza",
                          icona: Briefcase,
                          colore: "purple",
                        },
                        {
                          cat: "ASSOCIATIVO",
                          nome: "Associativo",
                          icona: Award,
                          colore: "cyan",
                        },
                      ].map(({ cat, nome, icona: Icona, colore }) => {
                        const count = (
                          realData.bandiStats?.servizi || []
                        ).filter((s: any) => s.categoria === cat).length;
                        return (
                          <div
                            key={cat}
                            className={`bg-[#0b1220] p-3 rounded-lg border border-${colore}-500/20 text-center`}
                          >
                            <Icona
                              className={`w-6 h-6 mx-auto mb-1 text-${colore}-400`}
                            />
                            <div className="text-lg font-bold text-white">
                              {count}
                            </div>
                            <div className="text-xs text-[#e8fbff]/50">
                              {nome}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
                      {(realData.bandiStats?.servizi || [])
                        .slice(0, 12)
                        .map((servizio: any, idx: number) => (
                          <div
                            key={servizio.id || idx}
                            className="flex items-center justify-between p-3 bg-[#0b1220] rounded-lg border border-[#8b5cf6]/10"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-[#e8fbff]">
                                  {servizio.nome}
                                </span>
                                <Badge
                                  className={`text-xs ${
                                    servizio.categoria === "REGOLARIZZAZIONE"
                                      ? "bg-red-500/20 text-red-400"
                                      : servizio.categoria === "PRATICHE"
                                        ? "bg-blue-500/20 text-blue-400"
                                        : servizio.categoria === "CONTABILITA"
                                          ? "bg-green-500/20 text-green-400"
                                          : servizio.categoria === "PAGHE"
                                            ? "bg-yellow-500/20 text-yellow-400"
                                            : servizio.categoria ===
                                                "CONSULENZA"
                                              ? "bg-purple-500/20 text-purple-400"
                                              : "bg-cyan-500/20 text-cyan-400"
                                  }`}
                                >
                                  {servizio.categoria}
                                </Badge>
                              </div>
                              <div className="text-xs text-[#e8fbff]/50 mt-1">
                                {servizio.associazione_nome ||
                                  "Tutte le associazioni"}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-bold text-[#10b981]">
                                €
                                {servizio.prezzo_associati ||
                                  servizio.prezzo_base}
                              </div>
                              {servizio.prezzo_base !==
                                servizio.prezzo_associati && (
                                <div className="text-xs text-[#e8fbff]/30 line-through">
                                  €{servizio.prezzo_base}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>

                {/* RICHIESTE SERVIZI DALLE IMPRESE */}
                <Card className="bg-[#1a2332] border-[#f59e0b]/20">
                  <CardHeader>
                    <CardTitle className="text-[#e8fbff] flex items-center gap-2">
                      <ClipboardCheck className="h-5 w-5 text-[#f59e0b]" />
                      Richieste Servizi
                      {realData.bandiStats?.richieste && (
                        <span className="text-xs text-[#10b981] ml-2">
                          ● Live
                        </span>
                      )}
                      <Badge className="bg-orange-500/20 text-orange-400 ml-2">
                        Nuovo
                      </Badge>
                    </CardTitle>
                    <CardDescription className="text-[#e8fbff]/50">
                      Richieste dalle imprese -{" "}
                      {realData.bandiStats?.richieste?.conteggi?.totale || 0}{" "}
                      totali
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* KPI Richieste */}
                    <div className="grid grid-cols-5 gap-3 mb-4">
                      <div className="bg-[#0b1220] p-3 rounded-lg border border-[#f59e0b]/20 text-center">
                        <div className="text-2xl font-bold text-[#f59e0b]">
                          {realData.bandiStats?.richieste?.conteggi
                            ?.in_attesa || 0}
                        </div>
                        <div className="text-xs text-[#e8fbff]/50">
                          In Attesa
                        </div>
                      </div>
                      <div className="bg-[#0b1220] p-3 rounded-lg border border-[#3b82f6]/20 text-center">
                        <div className="text-2xl font-bold text-[#3b82f6]">
                          {realData.bandiStats?.richieste?.conteggi
                            ?.in_lavorazione || 0}
                        </div>
                        <div className="text-xs text-[#e8fbff]/50">
                          In Lavorazione
                        </div>
                      </div>
                      <div className="bg-[#0b1220] p-3 rounded-lg border border-[#10b981]/20 text-center">
                        <div className="text-2xl font-bold text-[#10b981]">
                          {realData.bandiStats?.richieste?.conteggi
                            ?.completate || 0}
                        </div>
                        <div className="text-xs text-[#e8fbff]/50">
                          Completate
                        </div>
                      </div>
                      <div className="bg-[#0b1220] p-3 rounded-lg border border-[#ef4444]/20 text-center">
                        <div className="text-2xl font-bold text-[#ef4444]">
                          {realData.bandiStats?.richieste?.conteggi?.urgenti ||
                            0}
                        </div>
                        <div className="text-xs text-[#e8fbff]/50">Urgenti</div>
                      </div>
                      <div className="bg-[#0b1220] p-3 rounded-lg border border-[#e8fbff]/10 text-center">
                        <div className="text-2xl font-bold text-[#e8fbff]">
                          {realData.bandiStats?.richieste?.conteggi?.totale ||
                            0}
                        </div>
                        <div className="text-xs text-[#e8fbff]/50">Totale</div>
                      </div>
                    </div>

                    {/* Lista Richieste */}
                    <div className="max-h-[350px] overflow-y-auto space-y-2 pr-2">
                      {(
                        realData.bandiStats?.richieste?.richieste_recenti || []
                      ).map((item: any, idx: number) => (
                        <div
                          key={item.id || idx}
                          className={`flex items-center justify-between p-3 rounded-lg border ${
                            item.priorita === "URGENTE"
                              ? "bg-red-500/10 border-red-500/30"
                              : item.priorita === "ALTA"
                                ? "bg-orange-500/10 border-orange-500/30"
                                : item.stato === "COMPLETATA"
                                  ? "bg-green-500/10 border-green-500/30"
                                  : item.stato === "IN_LAVORAZIONE"
                                    ? "bg-blue-500/10 border-blue-500/30"
                                    : "bg-[#0b1220] border-[#e8fbff]/10"
                          }`}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-[#e8fbff]">
                                {item.impresa_nome}
                              </span>
                              <Badge
                                className={`text-xs ${
                                  item.stato === "COMPLETATA"
                                    ? "bg-green-500/20 text-green-400"
                                    : item.stato === "IN_LAVORAZIONE"
                                      ? "bg-blue-500/20 text-blue-400"
                                      : item.stato === "ANNULLATA"
                                        ? "bg-gray-500/20 text-gray-400"
                                        : "bg-orange-500/20 text-orange-400"
                                }`}
                              >
                                {item.stato}
                              </Badge>
                              {item.priorita === "URGENTE" && (
                                <Badge className="bg-red-500/20 text-red-400 text-xs">
                                  URGENTE
                                </Badge>
                              )}
                              {item.priorita === "ALTA" && (
                                <Badge className="bg-orange-500/20 text-orange-400 text-xs">
                                  ALTA
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-[#e8fbff]/60 mt-1">
                              <span className="text-[#8b5cf6]">
                                {item.servizio_nome}
                              </span>
                              <span className="ml-2 text-[#e8fbff]/40">
                                ({item.servizio_categoria})
                              </span>
                            </div>
                            {item.operatore_assegnato && (
                              <div className="text-xs text-[#e8fbff]/40 mt-1">
                                Operatore: {item.operatore_assegnato}
                              </div>
                            )}
                          </div>
                          <div className="text-right flex flex-col items-end gap-1">
                            <div className="text-xs text-[#e8fbff]/50">
                              {item.data_richiesta
                                ? new Date(
                                    item.data_richiesta
                                  ).toLocaleDateString("it-IT")
                                : "-"}
                            </div>
                            {(item.stato === 'RICHIESTA' || item.stato === 'PAGATO') && (
                              <button
                                onClick={async () => {
                                  try {
                                    const MIHUB_API = import.meta.env.VITE_MIHUB_API_BASE_URL || 'https://api.mio-hub.me/api';
                                    await fetch(`${MIHUB_API}/bandi/richieste/${item.id}`, {
                                      method: 'PUT',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ stato: 'IN_LAVORAZIONE' })
                                    });
                                    window.location.reload();
                                  } catch(e) { console.error(e); }
                                }}
                                className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded hover:bg-blue-500/30 transition-colors"
                              >
                                Prendi in carico
                              </button>
                            )}
                            {item.stato === 'IN_LAVORAZIONE' && (
                              <button
                                onClick={async () => {
                                  try {
                                    const MIHUB_API = import.meta.env.VITE_MIHUB_API_BASE_URL || 'https://api.mio-hub.me/api';
                                    await fetch(`${MIHUB_API}/bandi/richieste/${item.id}`, {
                                      method: 'PUT',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ stato: 'COMPLETATA' })
                                    });
                                    window.location.reload();
                                  } catch(e) { console.error(e); }
                                }}
                                className="text-xs px-2 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded hover:bg-green-500/30 transition-colors"
                              >
                                Completa
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                      {(!realData.bandiStats?.richieste?.richieste_recenti ||
                        realData.bandiStats.richieste.richieste_recenti
                          .length === 0) && (
                        <div className="text-center text-[#e8fbff]/50 py-8">
                          <ClipboardCheck className="w-12 h-12 mx-auto mb-2 opacity-30" />
                          <p>Nessuna richiesta registrata</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* IMPRESE CON PROBLEMI DI REGOLARITÀ */}
                <Card className="bg-[#1a2332] border-[#ef4444]/20">
                  <CardHeader>
                    <CardTitle className="text-[#e8fbff] flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-[#ef4444]" />
                      Imprese con Problemi di Regolarità
                      {realData.bandiStats?.regolarita && (
                        <span className="text-xs text-[#10b981] ml-2">
                          ● Live
                        </span>
                      )}
                      <Badge className="bg-red-500/20 text-red-400 ml-2">
                        Attenzione
                      </Badge>
                    </CardTitle>
                    <CardDescription className="text-[#e8fbff]/50">
                      DURC irregolare, SCIA scaduta, Autorizzazioni mancanti
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* KPI Regolarità */}
                    <div className="grid grid-cols-5 gap-3 mb-4">
                      <div className="bg-[#0b1220] p-3 rounded-lg border border-[#ef4444]/20 text-center">
                        <div className="text-2xl font-bold text-[#ef4444]">
                          {realData.bandiStats?.regolarita?.conteggi
                            ?.irregolari || 0}
                        </div>
                        <div className="text-xs text-[#e8fbff]/50">
                          Irregolari
                        </div>
                      </div>
                      <div className="bg-[#0b1220] p-3 rounded-lg border border-[#f59e0b]/20 text-center">
                        <div className="text-2xl font-bold text-[#f59e0b]">
                          {realData.bandiStats?.regolarita?.conteggi?.scaduti ||
                            0}
                        </div>
                        <div className="text-xs text-[#e8fbff]/50">Scaduti</div>
                      </div>
                      <div className="bg-[#0b1220] p-3 rounded-lg border border-yellow-500/20 text-center">
                        <div className="text-2xl font-bold text-yellow-400">
                          {realData.bandiStats?.regolarita?.conteggi
                            ?.in_scadenza || 0}
                        </div>
                        <div className="text-xs text-[#e8fbff]/50">
                          In Scadenza
                        </div>
                      </div>
                      <div className="bg-[#0b1220] p-3 rounded-lg border border-[#8b5cf6]/20 text-center">
                        <div className="text-2xl font-bold text-[#8b5cf6]">
                          {realData.bandiStats?.regolarita?.conteggi
                            ?.da_verificare || 0}
                        </div>
                        <div className="text-xs text-[#e8fbff]/50">
                          Da Verificare
                        </div>
                      </div>
                      <div className="bg-[#0b1220] p-3 rounded-lg border border-[#10b981]/20 text-center">
                        <div className="text-2xl font-bold text-[#10b981]">
                          {realData.bandiStats?.regolarita?.conteggi
                            ?.regolari || 0}
                        </div>
                        <div className="text-xs text-[#e8fbff]/50">
                          Regolari
                        </div>
                      </div>
                    </div>

                    {/* Conteggi per Tipo */}
                    <div className="grid grid-cols-5 gap-2 mb-4">
                      {(realData.bandiStats?.regolarita?.per_tipo || []).map(
                        (tipo: any) => (
                          <div
                            key={tipo.tipo}
                            className="bg-[#0b1220] p-2 rounded border border-[#e8fbff]/10 text-center"
                          >
                            <div className="text-xs text-[#e8fbff]/50">
                              {tipo.tipo}
                            </div>
                            <div className="text-sm font-bold text-white">
                              {tipo.totale}
                            </div>
                            {tipo.problematici > 0 && (
                              <div className="text-xs text-[#ef4444]">
                                {tipo.problematici} problemi
                              </div>
                            )}
                          </div>
                        )
                      )}
                    </div>

                    {/* Lista Imprese Problematiche */}
                    <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2">
                      {(
                        realData.bandiStats?.regolarita
                          ?.imprese_problematiche || []
                      ).map((item: any, idx: number) => (
                        <div
                          key={item.id || idx}
                          className={`flex items-center justify-between p-3 rounded-lg border ${
                            item.stato === "IRREGOLARE"
                              ? "bg-red-500/10 border-red-500/30"
                              : item.stato === "SCADUTO"
                                ? "bg-orange-500/10 border-orange-500/30"
                                : item.stato === "IN_SCADENZA"
                                  ? "bg-yellow-500/10 border-yellow-500/30"
                                  : "bg-purple-500/10 border-purple-500/30"
                          }`}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-[#e8fbff]">
                                {item.impresa_nome}
                              </span>
                              <Badge
                                className={`text-xs ${
                                  item.stato === "IRREGOLARE"
                                    ? "bg-red-500/20 text-red-400"
                                    : item.stato === "SCADUTO"
                                      ? "bg-orange-500/20 text-orange-400"
                                      : item.stato === "IN_SCADENZA"
                                        ? "bg-yellow-500/20 text-yellow-400"
                                        : "bg-purple-500/20 text-purple-400"
                                }`}
                              >
                                {item.stato}
                              </Badge>
                              <Badge className="bg-[#e8fbff]/10 text-[#e8fbff]/70 text-xs">
                                {item.tipo}
                              </Badge>
                            </div>
                            <div className="text-sm text-[#e8fbff]/60 mt-1">
                              {item.impresa_piva && (
                                <span>P.IVA: {item.impresa_piva}</span>
                              )}
                              {item.impresa_comune && (
                                <span className="ml-2">
                                  • {item.impresa_comune}
                                </span>
                              )}
                            </div>
                            {item.note && (
                              <div className="text-xs text-[#e8fbff]/40 mt-1">
                                {item.note}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            {item.data_scadenza && (
                              <div
                                className={`text-sm font-bold ${
                                  item.giorni_rimanenti < 0
                                    ? "text-[#ef4444]"
                                    : item.giorni_rimanenti <= 30
                                      ? "text-[#f59e0b]"
                                      : "text-yellow-400"
                                }`}
                              >
                                {item.giorni_rimanenti < 0
                                  ? `Scaduto da ${Math.abs(item.giorni_rimanenti)} gg`
                                  : `${item.giorni_rimanenti} gg`}
                              </div>
                            )}
                            <div className="text-xs text-[#e8fbff]/50">
                              {item.data_scadenza
                                ? new Date(
                                    item.data_scadenza
                                  ).toLocaleDateString("it-IT")
                                : "N/D"}
                            </div>
                          </div>
                        </div>
                      ))}
                      {(!realData.bandiStats?.regolarita
                        ?.imprese_problematiche ||
                        realData.bandiStats.regolarita.imprese_problematiche
                          .length === 0) && (
                        <div className="text-center text-[#e8fbff]/50 py-8">
                          <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-30 text-[#10b981]" />
                          <p>Tutte le imprese sono in regola!</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Form Invio Notifiche Associazioni */}
                <Card className="bg-[#1a2332] border-[#10b981]/20">
                  <CardHeader>
                    <CardTitle className="text-[#e8fbff] flex items-center gap-2">
                      <Bell className="h-5 w-5 text-[#10b981]" />
                      Invia Notifica alle Imprese
                    </CardTitle>
                    <CardDescription className="text-[#e8fbff]/50">
                      Invia comunicazioni su bandi, servizi o avvisi importanti
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form
                      onSubmit={async e => {
                        e.preventDefault();
                        const form = e.target as HTMLFormElement;
                        const formData = new FormData(form);
                        const MIHUB_API =
                          import.meta.env.VITE_MIHUB_API_BASE_URL ||
                          "https://api.mio-hub.me/api";

                        setInvioNotificaLoading(true);
                        try {
                          const targetTipo = formData.get("target_tipo");
                          const targetId = formData.get("target_id");
                          const impersonation = getImpersonationParams();
                          const associazioneId = impersonation.associazioneId || new URLSearchParams(window.location.search).get("associazione_id") || "1";
                          const associazioneNome = impersonation.associazioneNome || new URLSearchParams(window.location.search).get("associazione_nome") || "Associazione di Categoria";
                          let targetNome = null;

                          if (targetTipo === "CORSO") {
                            const corsoId = formData.get("corso_id");
                            if (!corsoId) {
                              alert("Seleziona il corso a cui inviare la notifica.");
                              setInvioNotificaLoading(false);
                              return;
                            }

                            const response = await authenticatedFetch(
                              `${MIHUB_API}/associazioni/${associazioneId}/notifiche-corso`,
                              {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  corso_id: parseInt(corsoId as string, 10),
                                  titolo: formData.get("titolo"),
                                  messaggio: formData.get("messaggio"),
                                  tipo_messaggio: formData.get("tipo_messaggio"),
                                  modalita: formData.get("modalita_corso") || "ONLINE",
                                  link_corso: assocCorsoModalita === "ONLINE" ? assocCorsoLink.trim() || null : null,
                                  sede_corso: assocCorsoModalita === "SEDE" ? assocCorsoSede.trim() || null : null,
                                }),
                              }
                            );
                            const data = await response.json();
                            if (data.success) {
                              alert(
                                `✅ Notifica corso inviata a ${data.data.destinatari} imprese iscritte a "${data.data.corso_titolo}".`
                              );
                              form.reset();
                              setAssocTargetTipo("TUTTI");
                              setAssocCorsoDettagliAperti(false);
                              setAssocCorsoModalita("ONLINE");
                              setAssocCorsoLink("");
                              setAssocCorsoSede("");
                            } else {
                              alert("❌ Errore: " + data.error);
                            }
                            return;
                          }

                          if (targetTipo === "MERCATO" && targetId) {
                            const mercato = mercatiList.find(
                              m => m.id === parseInt(targetId as string)
                            );
                            targetNome = mercato?.name || mercato?.nome;
                          } else if (targetTipo === "HUB" && targetId) {
                            const hub = hubList.find(
                              h => h.hub_id === parseInt(targetId as string)
                            );
                            targetNome = hub?.comune_nome;
                          } else if (targetTipo === "IMPRESA" && targetId) {
                            const impresa = impreseList.find(
                              i => i.id === parseInt(targetId as string)
                            );
                            targetNome = impresa?.denominazione;
                          }

                          const response = await authenticatedFetch(
                            `${MIHUB_API}/notifiche/send`,
                            {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                mittente_tipo: "ASSOCIAZIONE",
                                mittente_id: parseInt(associazioneId, 10),
                                mittente_nome: associazioneNome,
                                titolo: formData.get("titolo"),
                                messaggio: formData.get("messaggio"),
                                tipo_messaggio: formData.get("tipo_messaggio"),
                                target_tipo: targetTipo,
                                target_id: targetId || null,
                                target_nome: targetNome,
                              }),
                            }
                          );
                          const data = await response.json();
                          if (data.success) {
                            alert(
                              `✅ Notifica inviata con successo a ${data.data.destinatari_count} destinatari!`
                            );
                            form.reset();
                            setAssocTargetTipo("TUTTI");
                          } else {
                            alert("❌ Errore: " + data.error);
                          }
                        } catch (err) {
                          alert("❌ Errore invio notifica");
                        } finally {
                          setInvioNotificaLoading(false);
                        }
                      }}
                      className="space-y-4"
                    >
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-[#e8fbff]/70 mb-1">
                            Destinatari
                          </label>
                          <select
                            name="target_tipo"
                            id="assoc_target_tipo"
                            value={assocTargetTipo}
                            className="w-full bg-[#0b1220] border border-[#10b981]/30 rounded-lg p-2 text-[#e8fbff]"
                            required
                            onChange={e => {
                              setAssocTargetTipo(e.target.value);
                              if (e.target.value !== "CORSO") {
                                setAssocCorsoDettagliAperti(false);
                                setAssocCorsoLink("");
                                setAssocCorsoSede("");
                              }
                              const targetIdSelect = document.getElementById(
                                "assoc_target_id"
                              ) as HTMLSelectElement;
                              const targetIdContainer = document.getElementById(
                                "assoc_target_id_container"
                              );
                              if (targetIdContainer) {
                                targetIdContainer.style.display = [
                                  "MERCATO",
                                  "HUB",
                                  "IMPRESA",
                                ].includes(e.target.value)
                                  ? "block"
                                  : "none";
                              }
                              if (targetIdSelect) {
                                targetIdSelect.innerHTML =
                                  '<option value="">Seleziona...</option>';
                                if (e.target.value === "MERCATO") {
                                  mercatiList.forEach(m => {
                                    const opt =
                                      document.createElement("option");
                                    opt.value = m.id;
                                    opt.textContent = m.name || m.nome;
                                    targetIdSelect.appendChild(opt);
                                  });
                                } else if (e.target.value === "HUB") {
                                  hubList.forEach(h => {
                                    const opt =
                                      document.createElement("option");
                                    opt.value = h.hub_id;
                                    opt.textContent = h.comune_nome;
                                    targetIdSelect.appendChild(opt);
                                  });
                                } else if (e.target.value === "IMPRESA") {
                                  impreseList.forEach(i => {
                                    const opt =
                                      document.createElement("option");
                                    opt.value = i.id;
                                    opt.textContent = i.denominazione;
                                    targetIdSelect.appendChild(opt);
                                  });
                                }
                              }
                            }}
                          >
                            <option value="TUTTI">Tutte le Imprese</option>
                            <option value="CORSO">Imprese iscritte a un corso...</option>
                            <option value="MERCATO">
                              Imprese del Mercato...
                            </option>
                            <option value="HUB">Negozi dell'HUB...</option>
                            <option value="IMPRESA">Impresa Singola...</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm text-[#e8fbff]/70 mb-1">
                            Tipo Messaggio
                          </label>
                          <select
                            name="tipo_messaggio"
                            className="w-full bg-[#0b1220] border border-[#10b981]/30 rounded-lg p-2 text-[#e8fbff]"
                            required
                          >
                            <option value="INFORMATIVA">Informativa</option>
                            <option value="PROMOZIONALE">
                              Promozionale (Bandi/Servizi/Corsi)
                            </option>
                          </select>
                        </div>
                      </div>
                      {assocTargetTipo === "CORSO" && (
                        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm text-[#e8fbff]/70 mb-1">
                                Corso
                              </label>
                              <select
                                name="corso_id"
                                className="w-full bg-[#0b1220] border border-[#10b981]/30 rounded-lg p-2 text-[#e8fbff]"
                                required={assocTargetTipo === "CORSO"}
                              >
                                <option value="">Seleziona il corso...</option>
                                {(realData.formazioneStats?.corsi || []).map((corso: any) => (
                                  <option key={corso.id} value={corso.id}>
                                    {corso.titolo} — {corso.ente_nome || corso.sede || "corso"}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="flex items-end">
                              <button
                                type="button"
                                onClick={() => setAssocCorsoDettagliAperti(true)}
                                className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-blue-500 text-white font-medium hover:opacity-90"
                              >
                                Configura link online o sede
                              </button>
                            </div>
                          </div>
                          <p className="text-xs text-[#e8fbff]/50">
                            La notifica verrà inviata solo alle imprese iscritte al corso selezionato.
                          </p>
                        </div>
                      )}

                      {assocCorsoDettagliAperti && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
                          <div className="w-full max-w-2xl rounded-xl border border-emerald-500/30 bg-[#111827] p-5 shadow-2xl">
                            <div className="flex items-start justify-between gap-4 mb-4">
                              <div>
                                <h3 className="text-lg font-semibold text-[#e8fbff]">
                                  Dettagli accesso corso
                                </h3>
                                <p className="text-sm text-[#e8fbff]/60">
                                  Inserisci il collegamento streaming oppure le specifiche della sede. Verranno aggiunti al messaggio inviato alle imprese iscritte.
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => setAssocCorsoDettagliAperti(false)}
                                className="px-3 py-1 rounded-md border border-white/10 text-[#e8fbff]/70 hover:bg-white/10"
                              >
                                Chiudi
                              </button>
                            </div>
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm text-[#e8fbff]/70 mb-1">
                                  Modalità corso
                                </label>
                                <select
                                  name="modalita_corso"
                                  value={assocCorsoModalita}
                                  onChange={e => setAssocCorsoModalita(e.target.value as "ONLINE" | "SEDE")}
                                  className="w-full bg-[#0b1220] border border-[#10b981]/30 rounded-lg p-2 text-[#e8fbff]"
                                >
                                  <option value="ONLINE">Corso online / streaming</option>
                                  <option value="SEDE">Corso in sede</option>
                                </select>
                              </div>
                              {assocCorsoModalita === "ONLINE" ? (
                                <div className="space-y-3">
                                  <label className="block text-sm text-[#e8fbff]/70 mb-1">
                                    Piattaforma corso
                                  </label>
                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setAssocCorsoPiattaforma("A99X")}
                                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                        (assocCorsoPiattaforma || "A99X") === "A99X"
                                          ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/25"
                                          : "bg-[#0b1220] border border-[#10b981]/30 text-[#e8fbff]/70 hover:border-purple-500/50"
                                      }`}
                                    >
                                      ⚡ A99X
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setAssocCorsoPiattaforma("ESTERNO")}
                                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                        assocCorsoPiattaforma === "ESTERNO"
                                          ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/25"
                                          : "bg-[#0b1220] border border-[#10b981]/30 text-[#e8fbff]/70 hover:border-blue-500/50"
                                      }`}
                                    >
                                      🔗 Link Esterno
                                    </button>
                                  </div>
                                  {(assocCorsoPiattaforma || "A99X") === "A99X" ? (
                                    <div>
                                      <label className="block text-sm text-[#e8fbff]/70 mb-1">
                                        Link A99X (Cal.com)
                                      </label>
                                      <input
                                        type="url"
                                        name="link_a99x"
                                        placeholder="https://cal.miohub.it/..."
                                        value={assocCorsoLink}
                                        onChange={e => setAssocCorsoLink(e.target.value)}
                                        className="w-full bg-[#0b1220] border border-purple-500/30 rounded-lg p-2 text-[#e8fbff]"
                                      />
                                      <p className="text-xs text-purple-400/70 mt-1">Le imprese iscritte riceveranno il link diretto alla videoconferenza A99X</p>
                                    </div>
                                  ) : (
                                    <div>
                                      <label className="block text-sm text-[#e8fbff]/70 mb-1">
                                        Link accesso piattaforma streaming
                                      </label>
                                      <input
                                        type="url"
                                        name="link_corso"
                                        placeholder="https://..."
                                        value={assocCorsoLink}
                                        onChange={e => setAssocCorsoLink(e.target.value)}
                                        className="w-full bg-[#0b1220] border border-[#10b981]/30 rounded-lg p-2 text-[#e8fbff]"
                                      />
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div>
                                  <label className="block text-sm text-[#e8fbff]/70 mb-1">
                                    Specifiche sede corso
                                  </label>
                                  <textarea
                                    name="sede_corso"
                                    rows={3}
                                    placeholder="Es: Bologna, Via..., aula..., orario..., referente..."
                                    value={assocCorsoSede}
                                    onChange={e => setAssocCorsoSede(e.target.value)}
                                    className="w-full bg-[#0b1220] border border-[#10b981]/30 rounded-lg p-2 text-[#e8fbff]"
                                  />
                                </div>
                              )}
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => setAssocCorsoDettagliAperti(false)}
                                  className="px-4 py-2 rounded-lg bg-emerald-500 text-white font-medium hover:bg-emerald-600"
                                >
                                  Salva dettagli
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div
                        id="assoc_target_id_container"
                        style={{ display: "none" }}
                      >
                        <label className="block text-sm text-[#e8fbff]/70 mb-1">
                          Seleziona Destinatario Specifico
                        </label>
                        <select
                          name="target_id"
                          id="assoc_target_id"
                          className="w-full bg-[#0b1220] border border-[#10b981]/30 rounded-lg p-2 text-[#e8fbff]"
                        >
                          <option value="">Seleziona...</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm text-[#e8fbff]/70 mb-1">
                          Titolo
                        </label>
                        <input
                          type="text"
                          name="titolo"
                          placeholder="Es: Nuovo bando contributi digitalizzazione"
                          className="w-full bg-[#0b1220] border border-[#10b981]/30 rounded-lg p-2 text-[#e8fbff]"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-[#e8fbff]/70 mb-1">
                          Messaggio
                        </label>
                        <textarea
                          name="messaggio"
                          rows={4}
                          placeholder="Scrivi il messaggio da inviare alle imprese..."
                          className="w-full bg-[#0b1220] border border-[#10b981]/30 rounded-lg p-2 text-[#e8fbff]"
                          required
                        />
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={invioNotificaLoading}
                          className="px-6 py-3 bg-gradient-to-r from-[#10b981] to-[#3b82f6] rounded-lg text-white font-medium hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
                        >
                          {invioNotificaLoading ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              Invio in corso...
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4" />
                              Invia Notifica
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </CardContent>
                </Card>

                {/* Lista Messaggi - Associazioni */}
                <Card className="bg-[#1a2332] border-[#10b981]/20">
                  <CardHeader>
                    <CardTitle className="text-[#e8fbff] flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-[#10b981]" />
                      Messaggi
                      {(notificheRisposteAssoc || []).filter(
                        (r: any) => !r.letta
                      ).length > 0 && (
                        <Badge className="bg-red-500 text-white ml-2">
                          {
                            (notificheRisposteAssoc || []).filter(
                              (r: any) => !r.letta
                            ).length
                          }{" "}
                          nuove
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="text-[#e8fbff]/50">
                      Messaggi inviati e ricevuti
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Filtri */}
                    <div className="flex gap-2 mb-4">
                      <button
                        onClick={() => setFiltroMessaggiAssoc("tutti")}
                        className={`px-3 py-1 rounded-full text-sm ${filtroMessaggiAssoc === "tutti" ? "bg-emerald-500 text-white" : "bg-[#0b1220] text-[#e8fbff]/70 hover:bg-emerald-500/20"}`}
                      >
                        Tutti
                      </button>
                      <button
                        onClick={() => setFiltroMessaggiAssoc("inviati")}
                        className={`px-3 py-1 rounded-full text-sm ${filtroMessaggiAssoc === "inviati" ? "bg-emerald-500 text-white" : "bg-[#0b1220] text-[#e8fbff]/70 hover:bg-emerald-500/20"}`}
                      >
                        Inviati ({(messaggiInviatiAssoc || []).length})
                      </button>
                      <button
                        onClick={() => setFiltroMessaggiAssoc("ricevuti")}
                        className={`px-3 py-1 rounded-full text-sm ${filtroMessaggiAssoc === "ricevuti" ? "bg-emerald-500 text-white" : "bg-[#0b1220] text-[#e8fbff]/70 hover:bg-emerald-500/20"}`}
                      >
                        Ricevuti ({(notificheRisposteAssoc || []).length})
                      </button>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto space-y-3">
                      {/* Messaggi Inviati */}
                      {(filtroMessaggiAssoc === "tutti" ||
                        filtroMessaggiAssoc === "inviati") &&
                        (messaggiInviatiAssoc || []).map(
                          (msg: any, idx: number) => {
                            const msgKey = msg._rowKey || `inv-assoc-${msg.id || idx}`;
                            const isExpanded = expandedMessaggioId === msgKey;
                            return (
                            <div
                              key={msgKey}
                              className="p-3 rounded-lg border bg-emerald-500/5 border-emerald-500/20 cursor-pointer transition-all hover:border-emerald-500/40"
                              onClick={() => setExpandedMessaggioId(isExpanded ? null : msgKey)}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Send className="w-4 h-4 text-emerald-400" />
                                  <span className="text-[#e8fbff] font-medium">
                                    Inviato
                                  </span>
                                  <Badge className="bg-emerald-500/20 text-emerald-400 text-xs">
                                    {msg.destinatario_impresa_nome
                                      ? `→ ${msg.destinatario_impresa_nome}`
                                      : `→ ${msg.destinatari || 0} imprese`}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-[#e8fbff]/50">
                                    {new Date(msg.created_at).toLocaleDateString(
                                      "it-IT",
                                      {
                                        day: "2-digit",
                                        month: "short",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      }
                                    )}
                                  </span>
                                  <Eye className="w-4 h-4 text-emerald-400/60 hover:text-emerald-400" />
                                </div>
                              </div>
                              <p className="text-sm text-[#e8fbff]/80">
                                {msg.titolo}
                              </p>
                              {isExpanded && msg.messaggio && (
                                <div className="mt-2 p-2 bg-emerald-500/10 rounded-md border border-emerald-500/20">
                                  <p className="text-sm text-[#e8fbff]/70 whitespace-pre-wrap">{msg.messaggio}</p>
                                </div>
                              )}
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-xs text-[#e8fbff]/50">
                                  {msg.destinatario_impresa_nome
                                    ? `Stato: ${msg.destinatario_stato || "INVIATO"}`
                                    : `Letti: ${msg.lette || 0}/${msg.destinatari || 0}`}
                                </span>
                                {isExpanded ? <ChevronUp className="w-3 h-3 text-[#e8fbff]/40" /> : <ChevronDown className="w-3 h-3 text-[#e8fbff]/40" />}
                              </div>
                            </div>
                            );
                          }
                        )}
                      {/* Messaggi Ricevuti */}
                      {(filtroMessaggiAssoc === "tutti" ||
                        filtroMessaggiAssoc === "ricevuti") &&
                        (notificheRisposteAssoc || []).map(
                          (risposta: any, idx: number) => {
                            const ricKey = `ric-assoc-${risposta.id || idx}`;
                            const isExpanded = expandedMessaggioId === ricKey;
                            return (
                            <div
                              key={ricKey}
                              onClick={() => {
                                segnaRispostaComeLetta(risposta);
                                setExpandedMessaggioId(isExpanded ? null : ricKey);
                              }}
                              className={`p-3 rounded-lg border cursor-pointer transition-all hover:scale-[1.01] ${!risposta.letta ? "bg-emerald-500/10 border-emerald-500/30" : "bg-[#0b1220] border-[#10b981]/20"}`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  {risposta.letta ? (
                                    <MailOpen className="w-4 h-4 text-[#e8fbff]/40" />
                                  ) : (
                                    <Mail className="w-4 h-4 text-amber-400" />
                                  )}
                                  <span className="text-[#e8fbff] font-medium">
                                    {risposta.mittente_nome || "Impresa"}
                                  </span>
                                  {!risposta.letta && (
                                    <Badge className="bg-amber-500 text-white text-xs">
                                      Nuova
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-[#e8fbff]/50">
                                    {new Date(
                                      risposta.created_at
                                    ).toLocaleDateString("it-IT", {
                                      day: "2-digit",
                                      month: "short",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                  <Eye className="w-4 h-4 text-emerald-400/60 hover:text-emerald-400" />
                                </div>
                              </div>
                              <p className="text-sm text-[#e8fbff]/80">
                                {risposta.titolo}
                              </p>
                              {isExpanded ? (
                                <div className="mt-2 p-2 bg-emerald-500/10 rounded-md border border-emerald-500/20">
                                  <p className="text-sm text-[#e8fbff]/70 whitespace-pre-wrap">{risposta.messaggio}</p>
                                </div>
                              ) : (
                                <p className="text-xs text-[#e8fbff]/60 mt-1 line-clamp-2">
                                  {risposta.messaggio}
                                </p>
                              )}
                              <div className="flex justify-end mt-1">
                                {isExpanded ? <ChevronUp className="w-3 h-3 text-[#e8fbff]/40" /> : <ChevronDown className="w-3 h-3 text-[#e8fbff]/40" />}
                              </div>
                            </div>
                            );
                          }
                        )}
                      {/* Empty states */}
                      {filtroMessaggiAssoc === "inviati" &&
                        (messaggiInviatiAssoc || []).length === 0 && (
                          <div className="text-center text-[#e8fbff]/50 py-8">
                            <Send className="w-12 h-12 mx-auto mb-2 opacity-30" />
                            <p>Nessun messaggio inviato</p>
                          </div>
                        )}
                      {filtroMessaggiAssoc === "ricevuti" &&
                        (notificheRisposteAssoc || []).length === 0 && (
                          <div className="text-center text-[#e8fbff]/50 py-8">
                            <Mail className="w-12 h-12 mx-auto mb-2 opacity-30" />
                            <p>Nessuna risposta ricevuta</p>
                          </div>
                        )}
                      {filtroMessaggiAssoc === "tutti" &&
                        (messaggiInviatiAssoc || []).length === 0 &&
                        (notificheRisposteAssoc || []).length === 0 && (
                          <div className="text-center text-[#e8fbff]/50 py-8">
                            <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-30" />
                            <p>Nessun messaggio</p>
                          </div>
                        )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* SOTTO-TAB: SCIA & PRATICHE (Associazioni di Categoria) */}
              <TabsContent value="scia-pratiche" className="space-y-6">
                <SuapPanel mode="associazione" />
              </TabsContent>

              {/* SOTTO-TAB OPERATIVO: SCHEDA PUBBLICA ASSOCIAZIONE */}
              {isAssociazioneImpersonation() && (
                <TabsContent value="scheda-pubblica" className="space-y-6">
                  <SchedaPubblicaPanel />
                </TabsContent>
              )}

              {/* SOTTO-TAB OPERATIVO: SERVIZI ASSOCIAZIONE */}
              {isAssociazioneImpersonation() && (
                <TabsContent value="servizi-associazione" className="space-y-6">
                  <GestioneServiziAssociazionePanel />
                </TabsContent>
              )}

              {/* SOTTO-TAB OPERATIVO: CORSI ASSOCIAZIONE */}
              {isAssociazioneImpersonation() && (
                <TabsContent value="corsi-associazione" className="space-y-6">
                  <GestioneCorsiAssociazionePanel />
                </TabsContent>
              )}

              {/* SOTTO-TAB OPERATIVO: WALLET ASSOCIAZIONE */}
              {isAssociazioneImpersonation() && (
                <TabsContent value="wallet-associazione" className="space-y-6">
                  <WalletAssociazionePanel />
                </TabsContent>
              )}

              {/* SOTTO-TAB OPERATIVO: ASSOCIATI / TESSERATI */}
              {isAssociazioneImpersonation() && (
                <TabsContent value="associati" className="space-y-6">
                  <PresenzeAssociatiPanel />
                </TabsContent>
              )}
            </Tabs>
          </TabsContent>

          {/* TAB 25: A99X — Agenda Intelligente */}
          <TabsContent value="mio" className="space-y-6">
            {/* POPUP NOTIFICA INVITO - angolo alto destra */}
            {a99xInvitoPopup && (
              <div className={`fixed top-4 right-4 z-[100] max-w-sm animate-pulse shadow-2xl rounded-xl border-2 p-4 ${
                (a99xInvitoPopup.urgenza || 3) >= 4 ? 'bg-[#ef4444]/95 border-[#ef4444] shadow-red-500/40' :
                (a99xInvitoPopup.urgenza || 3) >= 3 ? 'bg-[#f59e0b]/95 border-[#f59e0b] shadow-amber-500/40' :
                'bg-[#10b981]/95 border-[#10b981] shadow-green-500/40'
              }`}>
                <div className="flex items-start gap-3">
                  <div className="text-2xl">{(a99xInvitoPopup.urgenza || 3) >= 4 ? '\ud83d\udea8' : (a99xInvitoPopup.urgenza || 3) >= 3 ? '\ud83d\udce8' : '\ud83d\udcc5'}</div>
                  <div className="flex-1">
                    <p className="text-white font-bold text-sm">Hai un invito da confermare!</p>
                    <p className="text-white/90 text-xs mt-1">{a99xInvitoPopup.titolo}</p>
                    <p className="text-white/70 text-[10px] mt-0.5">
                      {a99xInvitoPopup.data_inizio ? new Date(a99xInvitoPopup.data_inizio).toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                    </p>
                    <div className="flex gap-2 mt-2">
                      {a99xInvitoPopup.token && (
                        <>
                          <button onClick={() => { rispondiA99xInvito(a99xInvitoPopup.token, 'accetta'); setA99xInvitoPopup(null); }} className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white text-[10px] font-bold rounded border border-white/30">ACCETTA</button>
                          <button onClick={() => { rispondiA99xInvito(a99xInvitoPopup.token, 'rifiuta'); setA99xInvitoPopup(null); }} className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white/80 text-[10px] rounded border border-white/20">RIFIUTA</button>
                        </>
                      )}
                      <button onClick={() => setA99xInvitoPopup(null)} className="px-2 py-1 text-white/50 hover:text-white text-[10px]">Chiudi</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Header A99X Operativo */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Zap className="h-6 w-6 text-[#8b5cf6]" />
                <h2 className="text-xl font-bold text-[#e8fbff]">A99X — Agenda Intelligente</h2>
                <Badge className="bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30 text-[10px]">Operativo</Badge>
              </div>
              <div className="flex items-center gap-2">
                {a99xSubTab === 'dashboard' && (
                  <button
                    onClick={() => setA99xNuovaRiunione(true)}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg text-sm font-medium hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg shadow-purple-500/25 flex items-center gap-2"
                  >
                    <CalendarDays className="h-4 w-4" />
                    Nuova Riunione
                  </button>
                )}
                {a99xSubTab === 'disponibilita' && (
                  <button
                    onClick={() => setA99xNuovaDisp(true)}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg text-sm font-medium hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg shadow-purple-500/25 flex items-center gap-2"
                  >
                    <CalendarDays className="h-4 w-4" />
                    Nuova Disponibilità
                  </button>
                )}
                {a99xSubTab === 'assessori' && (
                  <button
                    onClick={() => setA99xNuovoAssessore(true)}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg text-sm font-medium hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg shadow-purple-500/25 flex items-center gap-2"
                  >
                    <Users className="h-4 w-4" />
                    Nuovo Assessore
                  </button>
                )}
              </div>
            </div>

            {/* Sotto-tab Navigation */}
            <div className="flex gap-1 bg-[#0b1220] rounded-xl p-1 border border-[#8b5cf6]/20">
              {[
                { id: 'dashboard' as const, label: 'Dashboard', icon: '⚡' },
                { id: 'calendario' as const, label: 'Calendario', icon: '📅' },
                { id: 'invita' as const, label: 'Invita Riunione', icon: '📨' },
                { id: 'disponibilita' as const, label: 'Disponibilità', icon: '🕐' },
                { id: 'prenotazioni' as const, label: 'Prenotazioni', icon: '📋' },
                { id: 'assessori' as const, label: 'Assessori', icon: '👥' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setA99xSubTab(tab.id)}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                    a99xSubTab === tab.id
                      ? 'bg-gradient-to-r from-purple-600/30 to-blue-600/30 text-[#e8fbff] border border-[#8b5cf6]/40 shadow-lg shadow-purple-500/10'
                      : 'text-[#e8fbff]/50 hover:text-[#e8fbff]/80 hover:bg-[#1a2332]/50'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* ===== SUB-TAB: DASHBOARD ===== */}
            {a99xSubTab === 'dashboard' && (<>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-[#1a2332] border-[#8b5cf6]/30">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-[#8b5cf6]">{a99xRiunioni.filter((r: any) => r.stato === 'PROGRAMMATA').length}</p>
                  <p className="text-xs text-[#e8fbff]/60">Riunioni Programmate</p>
                </CardContent>
              </Card>
              <Card className="bg-[#1a2332] border-[#14b8a6]/30">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-[#14b8a6]">{a99xTask.filter((t: any) => t.stato === 'DA_FARE').length}</p>
                  <p className="text-xs text-[#e8fbff]/60">Task Da Fare</p>
                </CardContent>
              </Card>
              <Card className="bg-[#1a2332] border-[#f59e0b]/30">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-[#f59e0b]">{a99xTask.filter((t: any) => t.stato === 'IN_CORSO').length}</p>
                  <p className="text-xs text-[#e8fbff]/60">Task In Corso</p>
                </CardContent>
              </Card>
              <Card className="bg-[#1a2332] border-[#ef4444]/30">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-[#ef4444]">{a99xTask.filter((t: any) => t.stato === 'SCADUTO').length}</p>
                  <p className="text-xs text-[#e8fbff]/60">Task Scaduti</p>
                </CardContent>
              </Card>
            </div>

            {/* Prossime Riunioni */}
            <Card className="bg-[#1a2332] border-[#8b5cf6]/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-[#e8fbff] text-base flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-[#8b5cf6]" />
                  Prossime Riunioni
                </CardTitle>
              </CardHeader>
              <CardContent>
                {a99xRiunioni.length === 0 ? (
                  <div className="text-center py-8">
                    <Video className="h-10 w-10 text-[#8b5cf6]/30 mx-auto mb-3" />
                    <p className="text-[#e8fbff]/50 text-sm">Nessuna riunione programmata</p>
                    <p className="text-[#e8fbff]/30 text-xs mt-1">Clicca "Nuova Riunione" per crearne una</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {a99xRiunioni.slice(0, 5).map((riunione: any) => (
                      <div key={riunione.id} className="bg-[#0b1220] border border-[#8b5cf6]/20 rounded-lg p-4 flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-[#e8fbff] font-medium text-sm">{riunione.titolo}</h4>
                            <Badge className={`text-[9px] ${
                              riunione.priorita_livello === 'CRITICA' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                              riunione.priorita_livello === 'ALTA' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
                              riunione.priorita_livello === 'MEDIA' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                              'bg-green-500/20 text-green-400 border-green-500/30'
                            }`}>{riunione.priorita_livello || 'NORMALE'}</Badge>
                          </div>
                          <p className="text-[#e8fbff]/50 text-xs">
                            {new Date(riunione.data_inizio).toLocaleString('it-IT', { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            {' • '}{riunione.durata_minuti} min
                            {riunione.tipo && ` • ${riunione.tipo}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {riunione.jitsi_link && (
                            <a
                              href={riunione.jitsi_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 bg-[#14b8a6]/20 border border-[#14b8a6]/30 text-[#14b8a6] rounded-lg text-xs font-medium hover:bg-[#14b8a6]/30 transition-all flex items-center gap-1"
                            >
                              <Video className="h-3 w-3" />
                              Jitsi
                            </a>
                          )}
                          <Badge className={`text-[9px] ${
                            riunione.stato === 'PROGRAMMATA' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                            riunione.stato === 'IN_CORSO' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                            'bg-gray-500/20 text-gray-400 border-gray-500/30'
                          }`}>{riunione.stato}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Task Follow-up */}
            <Card className="bg-[#1a2332] border-[#3b82f6]/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-[#e8fbff] text-base flex items-center gap-2">
                  <ListTodo className="h-4 w-4 text-[#3b82f6]" />
                  Task Follow-up
                </CardTitle>
              </CardHeader>
              <CardContent>
                {a99xTask.length === 0 ? (
                  <div className="text-center py-8">
                    <ListTodo className="h-10 w-10 text-[#3b82f6]/30 mx-auto mb-3" />
                    <p className="text-[#e8fbff]/50 text-sm">Nessun task attivo</p>
                    <p className="text-[#e8fbff]/30 text-xs mt-1">I task vengono generati automaticamente dopo le riunioni</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {a99xTask.slice(0, 8).map((task: any) => (
                      <div key={task.id} className="bg-[#0b1220] border border-[#3b82f6]/20 rounded-lg p-3 flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-[#e8fbff] text-sm font-medium">{task.titolo}</p>
                          <p className="text-[#e8fbff]/40 text-xs">
                            {task.scadenza && `Scadenza: ${new Date(task.scadenza).toLocaleDateString('it-IT')}`}
                            {task.assegnato_a_nome && ` • ${task.assegnato_a_nome}`}
                          </p>
                        </div>
                        <Badge className={`text-[9px] ${
                          task.stato === 'DA_FARE' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                          task.stato === 'IN_CORSO' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                          task.stato === 'COMPLETATO' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                          'bg-red-500/20 text-red-400 border-red-500/30'
                        }`}>{task.stato}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Formula Priorità + Info */}
            <Card className="bg-[#1a2332] border-[#f59e0b]/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Calculator className="h-4 w-4 text-[#f59e0b]" />
                  <span className="text-[#e8fbff] font-medium text-sm">Algoritmo Priorità</span>
                  <div className="bg-[#0b1220] rounded-lg px-3 py-1 font-mono">
                    <span className="text-[#f59e0b] text-sm">P = U × I × D × S</span>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  <div className="text-center bg-[#0b1220] rounded-lg p-2">
                    <p className="text-xs text-[#f59e0b] font-bold">U</p>
                    <p className="text-[9px] text-[#e8fbff]/50">Urgenza</p>
                  </div>
                  <div className="text-center bg-[#0b1220] rounded-lg p-2">
                    <p className="text-xs text-[#f59e0b] font-bold">I</p>
                    <p className="text-[9px] text-[#e8fbff]/50">Importanza</p>
                  </div>
                  <div className="text-center bg-[#0b1220] rounded-lg p-2">
                    <p className="text-xs text-[#f59e0b] font-bold">D</p>
                    <p className="text-[9px] text-[#e8fbff]/50">Dipendenze</p>
                  </div>
                  <div className="text-center bg-[#0b1220] rounded-lg p-2">
                    <p className="text-xs text-[#f59e0b] font-bold">S</p>
                    <p className="text-[9px] text-[#e8fbff]/50">Stakeholder</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            </>)}

            {/* ===== SUB-TAB: CALENDARIO ===== */}
            {a99xSubTab === 'calendario' && (
              <Card className="bg-[#1a2332] border-[#8b5cf6]/30">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-[#e8fbff] text-base flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-[#8b5cf6]" />
                      Calendario
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <button onClick={() => { const d = new Date(a99xCalendarioData); d.setDate(d.getDate() - 7); setA99xCalendarioData(d); }} className="px-2 py-1 bg-[#0b1220] border border-[#8b5cf6]/30 rounded text-[#e8fbff]/70 text-xs hover:border-[#8b5cf6]">&larr;</button>
                      <span className="text-[#e8fbff] text-sm font-medium min-w-[180px] text-center">
                        {a99xCalendarioVista === 'settimana'
                          ? `${(() => { const d = new Date(a99xCalendarioData); const day = d.getDay(); const diff = d.getDate() - day + (day === 0 ? -6 : 1); d.setDate(diff); return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' }); })()} - ${(() => { const d = new Date(a99xCalendarioData); const day = d.getDay(); const diff = d.getDate() - day + (day === 0 ? 0 : 7); d.setDate(diff); return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' }); })()}`
                          : a99xCalendarioData.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })
                        }
                      </span>
                      <button onClick={() => { const d = new Date(a99xCalendarioData); d.setDate(d.getDate() + 7); setA99xCalendarioData(d); }} className="px-2 py-1 bg-[#0b1220] border border-[#8b5cf6]/30 rounded text-[#e8fbff]/70 text-xs hover:border-[#8b5cf6]">&rarr;</button>
                      <button onClick={() => setA99xCalendarioData(new Date())} className="px-3 py-1 bg-[#8b5cf6]/20 border border-[#8b5cf6]/30 rounded text-[#8b5cf6] text-xs font-medium">Oggi</button>
                      <div className="flex bg-[#0b1220] rounded-lg border border-[#8b5cf6]/20 overflow-hidden">
                        <button onClick={() => setA99xCalendarioVista('settimana')} className={`px-3 py-1 text-xs font-medium transition-all ${a99xCalendarioVista === 'settimana' ? 'bg-[#8b5cf6]/30 text-[#8b5cf6]' : 'text-[#e8fbff]/50'}`}>Settimana</button>
                        <button onClick={() => setA99xCalendarioVista('mese')} className={`px-3 py-1 text-xs font-medium transition-all ${a99xCalendarioVista === 'mese' ? 'bg-[#8b5cf6]/30 text-[#8b5cf6]' : 'text-[#e8fbff]/50'}`}>Mese</button>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {a99xCalendarioVista === 'settimana' ? (
                    <div className="grid grid-cols-7 gap-2">
                      {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map((g, i) => {
                        const d = new Date(a99xCalendarioData);
                        const day = d.getDay();
                        const diff = d.getDate() - day + (day === 0 ? -6 : 1) + i;
                        const cellDate = new Date(d);
                        cellDate.setDate(diff);
                        const dateStr = cellDate.toISOString().split('T')[0];
                        const isToday = dateStr === new Date().toISOString().split('T')[0];
                        const dayRiunioni = a99xRiunioni.filter((r: any) => r.data_inizio && r.data_inizio.startsWith(dateStr));
                        const dayPren = a99xPrenotazioni.filter((p: any) => p.data_appuntamento === dateStr);
                        const dayInviti = a99xInvitiRicevuti.filter((inv: any) => inv.data_inizio && inv.data_inizio.startsWith(dateStr));
                        return (
                          <div key={i} className={`bg-[#0b1220] rounded-lg p-3 min-h-[120px] border ${isToday ? 'border-[#8b5cf6]' : 'border-[#8b5cf6]/10'}`}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] text-[#e8fbff]/50 font-medium">{g}</span>
                              <span className={`text-sm font-bold ${isToday ? 'text-[#8b5cf6] bg-[#8b5cf6]/20 w-7 h-7 rounded-full flex items-center justify-center' : 'text-[#e8fbff]/70'}`}>{cellDate.getDate()}</span>
                            </div>
                            <div className="space-y-1">
                              {dayRiunioni.map((r: any) => (
                                <div key={r.id} className="bg-[#8b5cf6]/15 border border-[#8b5cf6]/30 rounded px-2 py-1">
                                  <p className="text-[9px] text-[#8b5cf6] font-medium truncate">{r.titolo}</p>
                                  <p className="text-[8px] text-[#e8fbff]/40">{new Date(r.data_inizio).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                              ))}
                              {dayInviti.map((inv: any) => (
                                <div key={`inv-${inv.id}`} className={`rounded px-2 py-1 border ${inv.partecipante_stato === 'INVITATO' ? 'bg-[#f59e0b]/15 border-[#f59e0b]/30' : inv.partecipante_stato === 'CONFERMATO' ? 'bg-[#10b981]/15 border-[#10b981]/30' : 'bg-[#ef4444]/15 border-[#ef4444]/30'}`}>
                                  <p className={`text-[9px] font-medium truncate ${inv.partecipante_stato === 'INVITATO' ? 'text-[#f59e0b]' : inv.partecipante_stato === 'CONFERMATO' ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>{inv.titolo}</p>
                                  <p className="text-[8px] text-[#e8fbff]/40">{new Date(inv.data_inizio).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })} - Invito</p>
                                  {inv.partecipante_stato === 'INVITATO' && inv.token && (
                                    <div className="flex gap-1 mt-1">
                                      <button onClick={() => rispondiA99xInvito(inv.token, 'accetta')} className="text-[8px] bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30 rounded px-1.5 py-0.5 hover:bg-[#10b981]/40">Accetta</button>
                                      <button onClick={() => rispondiA99xInvito(inv.token, 'rifiuta')} className="text-[8px] bg-[#ef4444]/20 text-[#ef4444] border border-[#ef4444]/30 rounded px-1.5 py-0.5 hover:bg-[#ef4444]/40">Rifiuta</button>
                                    </div>
                                  )}
                                </div>
                              ))}
                              {dayPren.map((p: any) => (
                                <div key={p.id} className="bg-[#14b8a6]/15 border border-[#14b8a6]/30 rounded px-2 py-1">
                                  <p className="text-[9px] text-[#14b8a6] font-medium truncate">{p.nome} {p.cognome}</p>
                                  <p className="text-[8px] text-[#e8fbff]/40">{p.ora_inizio} - Prenotazione</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="grid grid-cols-7 gap-1">
                      {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map((g) => (
                        <div key={g} className="text-center text-[10px] text-[#e8fbff]/40 font-medium py-1">{g}</div>
                      ))}
                      {(() => {
                        const year = a99xCalendarioData.getFullYear();
                        const month = a99xCalendarioData.getMonth();
                        const firstDay = new Date(year, month, 1);
                        const startDay = (firstDay.getDay() + 6) % 7;
                        const daysInMonth = new Date(year, month + 1, 0).getDate();
                        const cells = [];
                        for (let i = 0; i < startDay; i++) cells.push(<div key={`e-${i}`} />);
                        for (let d = 1; d <= daysInMonth; d++) {
                          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                          const isToday = dateStr === new Date().toISOString().split('T')[0];
                          const hasRiunioni = a99xRiunioni.some((r: any) => r.data_inizio && r.data_inizio.startsWith(dateStr));
                          const hasPren = a99xPrenotazioni.some((p: any) => p.data_appuntamento === dateStr);
                          const hasInviti = a99xInvitiRicevuti.some((inv: any) => inv.data_inizio && inv.data_inizio.startsWith(dateStr));
                          cells.push(
                            <div key={d} className={`text-center py-2 rounded-lg cursor-pointer transition-all hover:bg-[#1a2332] ${isToday ? 'bg-[#8b5cf6]/20 border border-[#8b5cf6]/40' : ''}`}>
                              <span className={`text-xs ${isToday ? 'text-[#8b5cf6] font-bold' : 'text-[#e8fbff]/70'}`}>{d}</span>
                              <div className="flex justify-center gap-0.5 mt-1">
                                {hasRiunioni && <div className="w-1.5 h-1.5 rounded-full bg-[#8b5cf6]"></div>}
                                {hasInviti && <div className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]"></div>}
                                {hasPren && <div className="w-1.5 h-1.5 rounded-full bg-[#14b8a6]"></div>}
                              </div>
                            </div>
                          );
                        }
                        return cells;
                      })()}
                    </div>
                  )}
                  <div className="flex items-center gap-4 mt-4 pt-3 border-t border-[#8b5cf6]/10">
                    <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#8b5cf6]"></div><span className="text-[10px] text-[#e8fbff]/50">Riunioni</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]"></div><span className="text-[10px] text-[#e8fbff]/50">Inviti Ricevuti</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#14b8a6]"></div><span className="text-[10px] text-[#e8fbff]/50">Prenotazioni</span></div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ===== SUB-TAB: DISPONIBILITA ===== */}
            {a99xSubTab === 'disponibilita' && (
              <div className="space-y-4">
                <Card className="bg-[#1a2332] border-[#8b5cf6]/30">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-[#e8fbff] text-base flex items-center gap-2">
                      <Clock className="h-4 w-4 text-[#8b5cf6]" />
                      Slot Disponibilit\u00e0 Configurati
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {a99xDisponibilita.length === 0 ? (
                      <div className="text-center py-8">
                        <Clock className="h-10 w-10 text-[#8b5cf6]/30 mx-auto mb-3" />
                        <p className="text-[#e8fbff]/50 text-sm">Nessuno slot configurato</p>
                        <p className="text-[#e8fbff]/30 text-xs mt-1">Clicca "Nuova Disponibilit\u00e0" per creare slot prenotabili dai cittadini</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {a99xDisponibilita.map((disp: any) => {
                          const giorni = ['', 'Luned\u00ec', 'Marted\u00ec', 'Mercoled\u00ec', 'Gioved\u00ec', 'Venerd\u00ec', 'Sabato', 'Domenica'];
                          return (
                            <div key={disp.id} className="bg-[#0b1220] border border-[#8b5cf6]/20 rounded-lg p-4 flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="text-[#e8fbff] font-medium text-sm">{disp.proprietario_nome || 'Ufficio'}</h4>
                                  <Badge className={`text-[9px] ${disp.attivo ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>{disp.attivo ? 'Attivo' : 'Disattivato'}</Badge>
                                  <Badge className="text-[9px] bg-[#8b5cf6]/20 text-[#8b5cf6] border-[#8b5cf6]/30">{disp.modalita}</Badge>
                                </div>
                                <p className="text-[#e8fbff]/50 text-xs">
                                  {giorni[disp.giorno_settimana] || 'N/D'} \u2022 {disp.ora_inizio} - {disp.ora_fine} \u2022 Slot {disp.durata_slot_minuti}min \u2022 Max {disp.max_prenotazioni_slot} per slot
                                  {disp.sede_indirizzo && ` \u2022 \ud83d\udccd ${disp.sede_indirizzo}`}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <button onClick={async () => {
                                  try {
                                    const apiUrl = import.meta.env.VITE_API_URL || 'https://api.miohub.it';
                                    await fetch(`${apiUrl}/api/a99x/disponibilita/${disp.id}`, {
                                      method: 'PUT',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ attivo: !disp.attivo })
                                    });
                                    fetchA99xData();
                                  } catch (err) { console.error(err); }
                                }} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${disp.attivo ? 'bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30' : 'bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30'}`}>
                                  {disp.attivo ? 'Disattiva' : 'Attiva'}
                                </button>
                                <button onClick={async () => {
                                  if (!confirm('Eliminare questo slot?')) return;
                                  try {
                                    const apiUrl = import.meta.env.VITE_API_URL || 'https://api.miohub.it';
                                    await fetch(`${apiUrl}/api/a99x/disponibilita/${disp.id}`, { method: 'DELETE' });
                                    fetchA99xData();
                                  } catch (err) { console.error(err); }
                                }} className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs hover:bg-red-500/20">
                                  Elimina
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Link pubblico prenotazione */}
                <Card className="bg-[#1a2332] border-[#14b8a6]/30">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#14b8a6]/20 flex items-center justify-center">
                        <ExternalLink className="h-5 w-5 text-[#14b8a6]" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[#e8fbff] font-medium text-sm">Link Pubblico Prenotazione</p>
                        <p className="text-[#e8fbff]/50 text-xs">Condividi questo link con i cittadini per prenotare appuntamenti</p>
                      </div>
                      <button onClick={() => {
                        const url = `${import.meta.env.VITE_API_URL || 'https://api.miohub.it'}/tools/prenota-appuntamento.html?comune=${comuneIdFromUrl || '1'}`;
                        navigator.clipboard.writeText(url);
                        alert('Link copiato negli appunti!');
                      }} className="px-4 py-2 bg-[#14b8a6]/20 border border-[#14b8a6]/30 text-[#14b8a6] rounded-lg text-xs font-medium hover:bg-[#14b8a6]/30 transition-all">
                        Copia Link
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ===== SUB-TAB: PRENOTAZIONI ===== */}
            {a99xSubTab === 'prenotazioni' && (
              <Card className="bg-[#1a2332] border-[#8b5cf6]/30">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-[#e8fbff] text-base flex items-center gap-2">
                      <FileText className="h-4 w-4 text-[#14b8a6]" />
                      Prenotazioni Ricevute
                      <Badge className="bg-[#14b8a6]/20 text-[#14b8a6] border-[#14b8a6]/30 text-[10px]">{a99xPrenotazioni.length}</Badge>
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  {a99xPrenotazioni.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-10 w-10 text-[#14b8a6]/30 mx-auto mb-3" />
                      <p className="text-[#e8fbff]/50 text-sm">Nessuna prenotazione ricevuta</p>
                      <p className="text-[#e8fbff]/30 text-xs mt-1">Le prenotazioni dei cittadini appariranno qui</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {a99xPrenotazioni.map((pren: any) => {
                        const statoColors: Record<string, string> = {
                          'CONFERMATA': 'bg-green-500/20 text-green-400 border-green-500/30',
                          'IN_ATTESA': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
                          'COMPLETATA': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
                          'ANNULLATA': 'bg-red-500/20 text-red-400 border-red-500/30',
                          'RIFIUTATA': 'bg-red-500/20 text-red-400 border-red-500/30',
                          'NO_SHOW': 'bg-gray-500/20 text-gray-400 border-gray-500/30',
                        };
                        return (
                          <div key={pren.id} className="bg-[#0b1220] border border-[#14b8a6]/20 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-[#14b8a6] font-mono text-sm font-bold">{pren.codice_prenotazione}</span>
                                <Badge className={`text-[9px] ${statoColors[pren.stato] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>{pren.stato}</Badge>
                                <Badge className="text-[9px] bg-[#8b5cf6]/20 text-[#8b5cf6] border-[#8b5cf6]/30">{pren.modalita || 'PRESENZA'}</Badge>
                              </div>
                              <div className="flex items-center gap-1">
                                {(pren.stato === 'CONFERMATA' || pren.stato === 'IN_ATTESA') && (
                                  <>
                                    <button onClick={async () => {
                                      try {
                                        const apiUrl = import.meta.env.VITE_API_URL || 'https://api.miohub.it';
                                        await fetch(`${apiUrl}/api/a99x/prenotazioni/${pren.id}/stato`, {
                                          method: 'PUT',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ stato: 'COMPLETATA' })
                                        });
                                        fetchA99xData();
                                      } catch (err) { console.error(err); }
                                    }} className="px-2 py-1 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded text-[10px] font-medium hover:bg-blue-500/30">Completata</button>
                                    <button onClick={async () => {
                                      try {
                                        const apiUrl = import.meta.env.VITE_API_URL || 'https://api.miohub.it';
                                        await fetch(`${apiUrl}/api/a99x/prenotazioni/${pren.id}/stato`, {
                                          method: 'PUT',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ stato: 'NO_SHOW' })
                                        });
                                        fetchA99xData();
                                      } catch (err) { console.error(err); }
                                    }} className="px-2 py-1 bg-gray-500/20 border border-gray-500/30 text-gray-400 rounded text-[10px] font-medium hover:bg-gray-500/30">No Show</button>
                                    <button onClick={async () => {
                                      try {
                                        const apiUrl = import.meta.env.VITE_API_URL || 'https://api.miohub.it';
                                        await fetch(`${apiUrl}/api/a99x/prenotazioni/${pren.id}/stato`, {
                                          method: 'PUT',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ stato: 'ANNULLATA' })
                                        });
                                        fetchA99xData();
                                      } catch (err) { console.error(err); }
                                    }} className="px-2 py-1 bg-red-500/20 border border-red-500/30 text-red-400 rounded text-[10px] font-medium hover:bg-red-500/30">Annulla</button>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                              <div>
                                <p className="text-[#e8fbff]/40">Richiedente</p>
                                <p className="text-[#e8fbff] font-medium">{pren.nome} {pren.cognome}</p>
                              </div>
                              <div>
                                <p className="text-[#e8fbff]/40">Data</p>
                                <p className="text-[#e8fbff] font-medium">{pren.data_appuntamento ? new Date(pren.data_appuntamento + 'T00:00:00').toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' }) : 'N/D'}</p>
                              </div>
                              <div>
                                <p className="text-[#e8fbff]/40">Orario</p>
                                <p className="text-[#e8fbff] font-medium">{pren.ora_inizio} - {pren.ora_fine}</p>
                              </div>
                              <div>
                                <p className="text-[#e8fbff]/40">Oggetto</p>
                                <p className="text-[#e8fbff] font-medium truncate">{pren.oggetto}</p>
                              </div>
                            </div>
                            {pren.email && <p className="text-[#e8fbff]/30 text-[10px] mt-2">{pren.email} {pren.telefono && `\u2022 ${pren.telefono}`}</p>}
                            {pren.jitsi_link && <a href={pren.jitsi_link} target="_blank" rel="noopener noreferrer" className="text-[#14b8a6] text-[10px] mt-1 inline-block hover:underline">\ud83c\udf10 Link Videoconferenza</a>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* ===== SUB-TAB: ASSESSORI ===== */}
            {a99xSubTab === 'assessori' && (
              <Card className="bg-[#1a2332] border-[#8b5cf6]/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-[#e8fbff] text-base flex items-center gap-2">
                    <Users className="h-4 w-4 text-[#f59e0b]" />
                    Assessori e Funzionari
                    <Badge className="bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/30 text-[10px]">{a99xAssessori.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {a99xAssessori.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="h-10 w-10 text-[#f59e0b]/30 mx-auto mb-3" />
                      <p className="text-[#e8fbff]/50 text-sm">Nessun assessore registrato</p>
                      <p className="text-[#e8fbff]/30 text-xs mt-1">Clicca "Nuovo Assessore" per aggiungere funzionari al sistema</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {a99xAssessori.map((ass: any) => (
                        <div key={ass.id} className="bg-[#0b1220] border border-[#f59e0b]/20 rounded-lg p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#f59e0b]/30 to-[#8b5cf6]/30 flex items-center justify-center">
                              <span className="text-sm font-bold text-[#f59e0b]">{(ass.nome || '?')[0]}{(ass.cognome || '?')[0]}</span>
                            </div>
                            <div className="flex-1">
                              <p className="text-[#e8fbff] font-medium text-sm">{ass.nome} {ass.cognome}</p>
                              <p className="text-[#f59e0b] text-xs">{ass.ruolo || 'Funzionario'}</p>
                              {ass.settore && <p className="text-[#e8fbff]/40 text-[10px]">{ass.settore}</p>}
                            </div>
                            <Badge className={`text-[9px] ${ass.attivo !== false ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>{ass.attivo !== false ? 'Attivo' : 'Inattivo'}</Badge>
                          </div>
                          <div className="mt-3 flex items-center gap-3 text-[10px] text-[#e8fbff]/40">
                            {ass.email && <span>{ass.email}</span>}
                            {ass.telefono && <span>{ass.telefono}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* ===== SUB-TAB: INVITA RIUNIONE ===== */}
            {a99xSubTab === 'invita' && (
              <Card className="bg-[#1a2332] border-[#8b5cf6]/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-[#e8fbff] text-base flex items-center gap-2">
                    <Send className="h-4 w-4 text-[#8b5cf6]" />
                    Invita a Riunione
                    <Badge className="bg-[#8b5cf6]/20 text-[#8b5cf6] border-[#8b5cf6]/30 text-[10px]">Cerca e Invita</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Successo */}
                  {a99xInvitaSuccesso && (
                    <div className="bg-[#10b981]/10 border border-[#10b981]/30 rounded-lg p-4">
                      <p className="text-[#10b981] font-medium text-sm">Inviti inviati con successo!</p>
                      <p className="text-[#e8fbff]/60 text-xs mt-1">{a99xInvitaSuccesso.inviti_inviati} inviti inviati per "{a99xInvitaSuccesso.riunione?.titolo}"</p>
                      {a99xInvitaSuccesso.jitsi_link && <p className="text-[#8b5cf6] text-xs mt-1">Link Jitsi: {a99xInvitaSuccesso.jitsi_link}</p>}
                      <button onClick={() => setA99xInvitaSuccesso(null)} className="mt-2 text-xs text-[#e8fbff]/40 hover:text-[#e8fbff]/70">Chiudi</button>
                    </div>
                  )}

                  {/* Barra Ricerca */}
                  <div>
                    <label className="block text-sm text-[#e8fbff]/70 mb-1">Cerca Destinatari (Comune, Settore, Assessore, Impresa)</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#8b5cf6]/50" />
                      <input
                        value={a99xInvitaSearch}
                        onChange={(e) => { setA99xInvitaSearch(e.target.value); searchA99xContatti(e.target.value); }}
                        placeholder="Cerca per nome, settore, email, comune..."
                        className="w-full bg-[#0b1220] border border-[#8b5cf6]/30 rounded-lg pl-10 pr-3 py-2.5 text-[#e8fbff] text-sm focus:border-[#8b5cf6] focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Risultati Ricerca */}
                  {a99xInvitaResults.length > 0 && (
                    <div className="bg-[#0b1220] border border-[#8b5cf6]/20 rounded-lg max-h-48 overflow-y-auto">
                      {a99xInvitaResults.map((r: any, idx: number) => {
                        const isSelected = a99xInvitaSelezionati.some((s: any) => s.tipo === r.tipo && s.id === r.id && s.email === r.email);
                        const tipoBadge: any = { SETTORE: { bg: 'bg-[#14b8a6]/20', text: 'text-[#14b8a6]', border: 'border-[#14b8a6]/30' }, IMPRESA: { bg: 'bg-[#f59e0b]/20', text: 'text-[#f59e0b]', border: 'border-[#f59e0b]/30' }, ASSESSORE: { bg: 'bg-[#8b5cf6]/20', text: 'text-[#8b5cf6]', border: 'border-[#8b5cf6]/30' }, COMUNE: { bg: 'bg-[#3b82f6]/20', text: 'text-[#3b82f6]', border: 'border-[#3b82f6]/30' } };
                        const badge = tipoBadge[r.tipo] || tipoBadge.COMUNE;
                        return (
                          <div
                            key={`${r.tipo}-${r.id}-${idx}`}
                            onClick={() => { if (!isSelected) setA99xInvitaSelezionati([...a99xInvitaSelezionati, r]); }}
                            className={`p-3 border-b border-[#8b5cf6]/10 cursor-pointer hover:bg-[#1a2332]/50 transition-all ${isSelected ? 'opacity-40' : ''}`}
                          >
                            <div className="flex items-center gap-2">
                              <Badge className={`${badge.bg} ${badge.text} ${badge.border} text-[9px]`}>{r.tipo}</Badge>
                              <span className="text-[#e8fbff] text-sm font-medium">{r.nome}</span>
                              {r.comune_nome && <span className="text-[#e8fbff]/40 text-[10px]">({r.comune_nome})</span>}
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-[10px] text-[#e8fbff]/50">
                              {r.ruolo && <span>{r.ruolo}</span>}
                              {r.email && <span>{r.email}</span>}
                              {r.telefono && <span>{r.telefono}</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Selezionati (Chips) */}
                  {a99xInvitaSelezionati.length > 0 && (
                    <div>
                      <label className="block text-sm text-[#e8fbff]/70 mb-1">Invitati Selezionati ({a99xInvitaSelezionati.length})</label>
                      <div className="flex flex-wrap gap-2">
                        {a99xInvitaSelezionati.map((s: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-1.5 bg-[#8b5cf6]/20 border border-[#8b5cf6]/30 rounded-full px-3 py-1">
                            <span className="text-[#e8fbff] text-xs">{s.nome}</span>
                            <button onClick={() => setA99xInvitaSelezionati(a99xInvitaSelezionati.filter((_: any, i: number) => i !== idx))} className="text-[#e8fbff]/40 hover:text-red-400 text-xs ml-1">x</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Form Riunione */}
                  <div className="border-t border-[#8b5cf6]/20 pt-4 space-y-3">
                    <div>
                      <label className="block text-sm text-[#e8fbff]/70 mb-1">Titolo Riunione *</label>
                      <input
                        value={a99xInvitaForm.titolo}
                        onChange={(e) => setA99xInvitaForm({...a99xInvitaForm, titolo: e.target.value})}
                        placeholder="Es: Riunione SUAP con impresa XYZ"
                        className="w-full bg-[#0b1220] border border-[#8b5cf6]/30 rounded-lg p-2.5 text-[#e8fbff] text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-sm text-[#e8fbff]/70 mb-1">Data e Ora *</label>
                        <input
                          type="datetime-local"
                          value={a99xInvitaForm.data_inizio}
                          onChange={(e) => setA99xInvitaForm({...a99xInvitaForm, data_inizio: e.target.value})}
                          className="w-full bg-[#0b1220] border border-[#8b5cf6]/30 rounded-lg p-2.5 text-[#e8fbff] text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-[#e8fbff]/70 mb-1">Durata (min)</label>
                        <input
                          type="number"
                          value={a99xInvitaForm.durata_minuti}
                          onChange={(e) => setA99xInvitaForm({...a99xInvitaForm, durata_minuti: e.target.value})}
                          className="w-full bg-[#0b1220] border border-[#8b5cf6]/30 rounded-lg p-2.5 text-[#e8fbff] text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-[#e8fbff]/70 mb-1">Modalita</label>
                        <select
                          value={a99xInvitaForm.modalita}
                          onChange={(e) => setA99xInvitaForm({...a99xInvitaForm, modalita: e.target.value})}
                          className="w-full bg-[#0b1220] border border-[#8b5cf6]/30 rounded-lg p-2.5 text-[#e8fbff] text-sm"
                        >
                          <option value="ONLINE">Online (Jitsi)</option>
                          <option value="PRESENZA">In Presenza</option>
                          <option value="IBRIDO">Ibrido</option>
                        </select>
                      </div>
                    </div>
                    {(a99xInvitaForm.modalita === 'PRESENZA' || a99xInvitaForm.modalita === 'IBRIDO') && (
                      <div>
                        <label className="block text-sm text-[#e8fbff]/70 mb-1">Indirizzo Sede</label>
                        <input
                          value={a99xInvitaForm.sede_indirizzo}
                          onChange={(e) => setA99xInvitaForm({...a99xInvitaForm, sede_indirizzo: e.target.value})}
                          placeholder="Via Roma 1, Bologna"
                          className="w-full bg-[#0b1220] border border-[#8b5cf6]/30 rounded-lg p-2.5 text-[#e8fbff] text-sm"
                        />
                      </div>
                    )}
                    <div>
                      <label className="block text-sm text-[#e8fbff]/70 mb-1">Temi / Ordine del Giorno (separati da virgola)</label>
                      <input
                        value={a99xInvitaForm.temi}
                        onChange={(e) => setA99xInvitaForm({...a99xInvitaForm, temi: e.target.value})}
                        placeholder="Autorizzazione commerciale, Verifica documentale, Budget"
                        className="w-full bg-[#0b1220] border border-[#8b5cf6]/30 rounded-lg p-2.5 text-[#e8fbff] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-[#e8fbff]/70 mb-1">Descrizione / Note</label>
                      <textarea
                        value={a99xInvitaForm.descrizione}
                        onChange={(e) => setA99xInvitaForm({...a99xInvitaForm, descrizione: e.target.value})}
                        placeholder="Note aggiuntive, ordine del giorno dettagliato..."
                        rows={3}
                        className="w-full bg-[#0b1220] border border-[#8b5cf6]/30 rounded-lg p-2.5 text-[#e8fbff] text-sm resize-none"
                      />
                    </div>
                    {/* Priorita P = U x I x D x S */}
                    <div className="bg-[#0b1220] border border-[#8b5cf6]/20 rounded-lg p-3">
                      <p className="text-[#8b5cf6] text-xs font-medium mb-2">Priorita (P = U x I x D x S)</p>
                      <div className="grid grid-cols-4 gap-2">
                        <div className="text-center">
                          <label className="text-[#e8fbff]/50 text-[10px]">Urgenza</label>
                          <input type="number" min="1" max="5" value={a99xInvitaForm.urgenza} onChange={(e) => setA99xInvitaForm({...a99xInvitaForm, urgenza: e.target.value})} className="w-full bg-[#1a2332] border border-[#8b5cf6]/30 rounded p-1.5 text-[#e8fbff] text-sm text-center" />
                        </div>
                        <div className="text-center">
                          <label className="text-[#e8fbff]/50 text-[10px]">Importanza</label>
                          <input type="number" min="1" max="5" value={a99xInvitaForm.importanza} onChange={(e) => setA99xInvitaForm({...a99xInvitaForm, importanza: e.target.value})} className="w-full bg-[#1a2332] border border-[#8b5cf6]/30 rounded p-1.5 text-[#e8fbff] text-sm text-center" />
                        </div>
                        <div className="text-center">
                          <label className="text-[#e8fbff]/50 text-[10px]">Dipendenze</label>
                          <input type="number" min="1" max="5" value={a99xInvitaForm.dipendenze} onChange={(e) => setA99xInvitaForm({...a99xInvitaForm, dipendenze: e.target.value})} className="w-full bg-[#1a2332] border border-[#8b5cf6]/30 rounded p-1.5 text-[#e8fbff] text-sm text-center" />
                        </div>
                        <div className="text-center">
                          <label className="text-[#e8fbff]/50 text-[10px]">Stakeholder</label>
                          <input type="number" min="1" max="5" value={a99xInvitaForm.stakeholder} onChange={(e) => setA99xInvitaForm({...a99xInvitaForm, stakeholder: e.target.value})} className="w-full bg-[#1a2332] border border-[#8b5cf6]/30 rounded p-1.5 text-[#e8fbff] text-sm text-center" />
                        </div>
                      </div>
                      <p className="text-center text-[#8b5cf6] text-xs mt-2">Score: {(parseInt(a99xInvitaForm.urgenza)||1) * (parseInt(a99xInvitaForm.importanza)||1) * (parseInt(a99xInvitaForm.dipendenze)||1) * (parseInt(a99xInvitaForm.stakeholder)||1)}</p>
                    </div>
                    {/* Bottone Invio */}
                    <button
                      onClick={inviaA99xRiunione}
                      disabled={a99xInvitaLoading || !a99xInvitaForm.titolo || !a99xInvitaForm.data_inizio || a99xInvitaSelezionati.length === 0}
                      className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium text-sm hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg shadow-purple-500/25 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Send className="h-4 w-4" />
                      {a99xInvitaLoading ? 'Invio in corso...' : `Invia Inviti + Genera Link Jitsi (${a99xInvitaSelezionati.length} destinatari)`}
                    </button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Dialog Nuova Riunione */}
            {a99xNuovaRiunione && (
              <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setA99xNuovaRiunione(false)}>
                <div className="bg-[#1a2332] border border-[#8b5cf6]/30 rounded-xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[#e8fbff] font-bold text-lg flex items-center gap-2">
                      <CalendarDays className="h-5 w-5 text-[#8b5cf6]" />
                      Nuova Riunione
                    </h3>
                    <button onClick={() => setA99xNuovaRiunione(false)} className="text-[#e8fbff]/50 hover:text-[#e8fbff]">✕</button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-[#e8fbff]/70 mb-1">Titolo *</label>
                      <input
                        value={a99xFormTitolo}
                        onChange={(e) => setA99xFormTitolo(e.target.value)}
                        placeholder="Es: Riunione SUAP con impresa XYZ"
                        className="w-full bg-[#0b1220] border border-[#8b5cf6]/30 rounded-lg p-2.5 text-[#e8fbff] text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm text-[#e8fbff]/70 mb-1">Data e Ora *</label>
                        <input
                          type="datetime-local"
                          value={a99xFormData}
                          onChange={(e) => setA99xFormData(e.target.value)}
                          className="w-full bg-[#0b1220] border border-[#8b5cf6]/30 rounded-lg p-2.5 text-[#e8fbff] text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-[#e8fbff]/70 mb-1">Durata (min)</label>
                        <input
                          type="number"
                          value={a99xFormDurata}
                          onChange={(e) => setA99xFormDurata(e.target.value)}
                          placeholder="30"
                          className="w-full bg-[#0b1220] border border-[#8b5cf6]/30 rounded-lg p-2.5 text-[#e8fbff] text-sm"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm text-[#e8fbff]/70 mb-1">Tipo</label>
                        <select
                          value={a99xFormTipo}
                          onChange={(e) => setA99xFormTipo(e.target.value)}
                          className="w-full bg-[#0b1220] border border-[#8b5cf6]/30 rounded-lg p-2.5 text-[#e8fbff] text-sm"
                        >
                          <option value="INTERNA">Interna</option>
                          <option value="INTER_SETTORE">Inter-settore</option>
                          <option value="GIUNTA">Giunta</option>
                          <option value="CONSIGLIO">Consiglio</option>
                          <option value="CON_CITTADINO">Con Cittadino</option>
                          <option value="CON_IMPRESA">Con Impresa</option>
                          <option value="CONSULENZA">Consulenza</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm text-[#e8fbff]/70 mb-1">Modalità</label>
                        <select
                          value={a99xFormModalita}
                          onChange={(e) => setA99xFormModalita(e.target.value)}
                          className="w-full bg-[#0b1220] border border-[#8b5cf6]/30 rounded-lg p-2.5 text-[#e8fbff] text-sm"
                        >
                          <option value="ONLINE">Online (Jitsi)</option>
                          <option value="IN_SEDE">In Sede</option>
                          <option value="MISTA">Mista</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-[#e8fbff]/70 mb-1">Descrizione</label>
                      <textarea
                        value={a99xFormDescrizione}
                        onChange={(e) => setA99xFormDescrizione(e.target.value)}
                        placeholder="Ordine del giorno, note..."
                        rows={3}
                        className="w-full bg-[#0b1220] border border-[#8b5cf6]/30 rounded-lg p-2.5 text-[#e8fbff] text-sm resize-none"
                      />
                    </div>
                    {/* Priorità */}
                    <div className="bg-[#0b1220] border border-[#f59e0b]/20 rounded-lg p-3">
                      <p className="text-xs text-[#f59e0b] font-medium mb-2">Priorità (P = U × I × D × S)</p>
                      <div className="grid grid-cols-4 gap-2">
                        <div>
                          <label className="text-[9px] text-[#e8fbff]/50">Urgenza</label>
                          <input type="number" min="1" max="5" value={a99xFormU} onChange={(e) => setA99xFormU(e.target.value)} className="w-full bg-[#1a2332] border border-[#f59e0b]/30 rounded p-1 text-[#e8fbff] text-sm text-center" />
                        </div>
                        <div>
                          <label className="text-[9px] text-[#e8fbff]/50">Importanza</label>
                          <input type="number" min="1" max="5" value={a99xFormI} onChange={(e) => setA99xFormI(e.target.value)} className="w-full bg-[#1a2332] border border-[#f59e0b]/30 rounded p-1 text-[#e8fbff] text-sm text-center" />
                        </div>
                        <div>
                          <label className="text-[9px] text-[#e8fbff]/50">Dipendenze</label>
                          <input type="number" min="1" max="5" value={a99xFormD} onChange={(e) => setA99xFormD(e.target.value)} className="w-full bg-[#1a2332] border border-[#f59e0b]/30 rounded p-1 text-[#e8fbff] text-sm text-center" />
                        </div>
                        <div>
                          <label className="text-[9px] text-[#e8fbff]/50">Stakeholder</label>
                          <input type="number" min="1" max="5" value={a99xFormS} onChange={(e) => setA99xFormS(e.target.value)} className="w-full bg-[#1a2332] border border-[#f59e0b]/30 rounded p-1 text-[#e8fbff] text-sm text-center" />
                        </div>
                      </div>
                      <p className="text-center text-[#f59e0b] text-xs mt-2 font-mono">
                        Score: {(parseInt(a99xFormU) || 3) * (parseInt(a99xFormI) || 3) * (parseInt(a99xFormD) || 1) * (parseInt(a99xFormS) || 1)}
                      </p>
                    </div>
                    <button
                      onClick={async () => {
                        try {
                          const res = await fetch(`${import.meta.env.VITE_API_URL || 'https://api.miohub.it'}/api/a99x/riunioni`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              comune_id: comuneIdFromUrl || '1',
                              titolo: a99xFormTitolo,
                              descrizione: a99xFormDescrizione,
                              tipo: a99xFormTipo,
                              modalita: a99xFormModalita,
                              data_inizio: a99xFormData,
                              durata_minuti: parseInt(a99xFormDurata) || 30,
                              urgenza: parseInt(a99xFormU) || 3,
                              importanza: parseInt(a99xFormI) || 3,
                              dipendenze: parseInt(a99xFormD) || 1,
                              stakeholder: parseInt(a99xFormS) || 1,
                              genera_jitsi: a99xFormModalita !== 'IN_SEDE'
                            })
                          });
                          const data = await res.json();
                          if (data.success) {
                            setA99xNuovaRiunione(false);
                            setA99xFormTitolo('');
                            setA99xFormDescrizione('');
                            setA99xFormData('');
                            // Refresh riunioni
                            fetchA99xData();
                          }
                        } catch (err) {
                          console.error('Errore creazione riunione:', err);
                        }
                      }}
                      disabled={!a99xFormTitolo || !a99xFormData}
                      className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Crea Riunione {a99xFormModalita !== 'IN_SEDE' && '+ Genera Link Jitsi'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Dialog Nuova Disponibilità */}
            {a99xNuovaDisp && (
              <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setA99xNuovaDisp(false)}>
                <div className="bg-[#1a2332] border border-[#8b5cf6]/30 rounded-xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[#e8fbff] font-bold text-lg flex items-center gap-2">
                      <CalendarDays className="h-5 w-5 text-[#8b5cf6]" />
                      Nuova Disponibilit\u00e0
                    </h3>
                    <button onClick={() => setA99xNuovaDisp(false)} className="text-[#e8fbff]/50 hover:text-[#e8fbff]">&times;</button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-[#e8fbff]/70 mb-1">Nome Ufficio / Assessore *</label>
                      <input value={a99xDispForm.proprietario_nome} onChange={(e) => setA99xDispForm({...a99xDispForm, proprietario_nome: e.target.value})} placeholder="Es: Ufficio SUAP, Ass. Rossi" className="w-full bg-[#0b1220] border border-[#8b5cf6]/30 rounded-lg p-2.5 text-[#e8fbff] text-sm" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm text-[#e8fbff]/70 mb-1">Giorno Settimana *</label>
                        <select value={a99xDispForm.giorno_settimana} onChange={(e) => setA99xDispForm({...a99xDispForm, giorno_settimana: e.target.value})} className="w-full bg-[#0b1220] border border-[#8b5cf6]/30 rounded-lg p-2.5 text-[#e8fbff] text-sm">
                          <option value="1">Luned\u00ec</option>
                          <option value="2">Marted\u00ec</option>
                          <option value="3">Mercoled\u00ec</option>
                          <option value="4">Gioved\u00ec</option>
                          <option value="5">Venerd\u00ec</option>
                          <option value="6">Sabato</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm text-[#e8fbff]/70 mb-1">Modalit\u00e0</label>
                        <select value={a99xDispForm.modalita} onChange={(e) => setA99xDispForm({...a99xDispForm, modalita: e.target.value})} className="w-full bg-[#0b1220] border border-[#8b5cf6]/30 rounded-lg p-2.5 text-[#e8fbff] text-sm">
                          <option value="PRESENZA">In Sede</option>
                          <option value="ONLINE">Online (Jitsi)</option>
                          <option value="MISTA">Mista</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm text-[#e8fbff]/70 mb-1">Ora Inizio *</label>
                        <input type="time" value={a99xDispForm.ora_inizio} onChange={(e) => setA99xDispForm({...a99xDispForm, ora_inizio: e.target.value})} className="w-full bg-[#0b1220] border border-[#8b5cf6]/30 rounded-lg p-2.5 text-[#e8fbff] text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm text-[#e8fbff]/70 mb-1">Ora Fine *</label>
                        <input type="time" value={a99xDispForm.ora_fine} onChange={(e) => setA99xDispForm({...a99xDispForm, ora_fine: e.target.value})} className="w-full bg-[#0b1220] border border-[#8b5cf6]/30 rounded-lg p-2.5 text-[#e8fbff] text-sm" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm text-[#e8fbff]/70 mb-1">Durata Slot (min)</label>
                        <input type="number" value={a99xDispForm.durata_slot_minuti} onChange={(e) => setA99xDispForm({...a99xDispForm, durata_slot_minuti: e.target.value})} className="w-full bg-[#0b1220] border border-[#8b5cf6]/30 rounded-lg p-2.5 text-[#e8fbff] text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm text-[#e8fbff]/70 mb-1">Max Prenotazioni/Slot</label>
                        <input type="number" value={a99xDispForm.max_prenotazioni_slot} onChange={(e) => setA99xDispForm({...a99xDispForm, max_prenotazioni_slot: e.target.value})} className="w-full bg-[#0b1220] border border-[#8b5cf6]/30 rounded-lg p-2.5 text-[#e8fbff] text-sm" />
                      </div>
                    </div>
                    {(a99xDispForm.modalita === 'PRESENZA' || a99xDispForm.modalita === 'MISTA') && (
                      <div>
                        <label className="block text-sm text-[#e8fbff]/70 mb-1">Indirizzo Sede</label>
                        <input value={a99xDispForm.sede_indirizzo} onChange={(e) => setA99xDispForm({...a99xDispForm, sede_indirizzo: e.target.value})} placeholder="Via Roma 1, Bologna" className="w-full bg-[#0b1220] border border-[#8b5cf6]/30 rounded-lg p-2.5 text-[#e8fbff] text-sm" />
                      </div>
                    )}
                    <button
                      onClick={async () => {
                        try {
                          const apiUrl = import.meta.env.VITE_API_URL || 'https://api.miohub.it';
                          const res = await fetch(`${apiUrl}/api/a99x/disponibilita`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              comune_id: comuneIdFromUrl || '1',
                              proprietario_nome: a99xDispForm.proprietario_nome,
                              giorno_settimana: parseInt(a99xDispForm.giorno_settimana),
                              ora_inizio: a99xDispForm.ora_inizio,
                              ora_fine: a99xDispForm.ora_fine,
                              durata_slot_minuti: parseInt(a99xDispForm.durata_slot_minuti) || 30,
                              max_prenotazioni_slot: parseInt(a99xDispForm.max_prenotazioni_slot) || 1,
                              modalita: a99xDispForm.modalita,
                              sede_indirizzo: a99xDispForm.sede_indirizzo || null
                            })
                          });
                          const data = await res.json();
                          if (data.success) {
                            setA99xNuovaDisp(false);
                            setA99xDispForm({ proprietario_nome: '', giorno_settimana: '1', ora_inizio: '09:00', ora_fine: '13:00', durata_slot_minuti: '30', max_prenotazioni_slot: '1', modalita: 'PRESENZA', sede_indirizzo: '' });
                            fetchA99xData();
                          } else {
                            alert(data.error || 'Errore nella creazione');
                          }
                        } catch (err) {
                          console.error('Errore creazione disponibilit\u00e0:', err);
                        }
                      }}
                      disabled={!a99xDispForm.proprietario_nome}
                      className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Crea Disponibilit\u00e0
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Dialog Nuovo Assessore */}
            {a99xNuovoAssessore && (
              <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setA99xNuovoAssessore(false)}>
                <div className="bg-[#1a2332] border border-[#f59e0b]/30 rounded-xl p-6 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[#e8fbff] font-bold text-lg flex items-center gap-2">
                      <Users className="h-5 w-5 text-[#f59e0b]" />
                      Nuovo Assessore / Funzionario
                    </h3>
                    <button onClick={() => setA99xNuovoAssessore(false)} className="text-[#e8fbff]/50 hover:text-[#e8fbff]">&times;</button>
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm text-[#e8fbff]/70 mb-1">Nome *</label>
                        <input value={a99xAssForm.nome} onChange={(e) => setA99xAssForm({...a99xAssForm, nome: e.target.value})} placeholder="Mario" className="w-full bg-[#0b1220] border border-[#f59e0b]/30 rounded-lg p-2.5 text-[#e8fbff] text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm text-[#e8fbff]/70 mb-1">Cognome *</label>
                        <input value={a99xAssForm.cognome} onChange={(e) => setA99xAssForm({...a99xAssForm, cognome: e.target.value})} placeholder="Rossi" className="w-full bg-[#0b1220] border border-[#f59e0b]/30 rounded-lg p-2.5 text-[#e8fbff] text-sm" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-[#e8fbff]/70 mb-1">Ruolo *</label>
                      <input value={a99xAssForm.ruolo} onChange={(e) => setA99xAssForm({...a99xAssForm, ruolo: e.target.value})} placeholder="Es: Assessore al Commercio, Resp. SUAP" className="w-full bg-[#0b1220] border border-[#f59e0b]/30 rounded-lg p-2.5 text-[#e8fbff] text-sm" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm text-[#e8fbff]/70 mb-1">Email *</label>
                        <input type="email" value={a99xAssForm.email} onChange={(e) => setA99xAssForm({...a99xAssForm, email: e.target.value})} placeholder="mario.rossi@comune.it" className="w-full bg-[#0b1220] border border-[#f59e0b]/30 rounded-lg p-2.5 text-[#e8fbff] text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm text-[#e8fbff]/70 mb-1">Telefono</label>
                        <input type="tel" value={a99xAssForm.telefono} onChange={(e) => setA99xAssForm({...a99xAssForm, telefono: e.target.value})} placeholder="+39 333 1234567" className="w-full bg-[#0b1220] border border-[#f59e0b]/30 rounded-lg p-2.5 text-[#e8fbff] text-sm" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-[#e8fbff]/70 mb-1">Settore</label>
                      <input value={a99xAssForm.settore} onChange={(e) => setA99xAssForm({...a99xAssForm, settore: e.target.value})} placeholder="Es: Commercio, Urbanistica, Ambiente" className="w-full bg-[#0b1220] border border-[#f59e0b]/30 rounded-lg p-2.5 text-[#e8fbff] text-sm" />
                    </div>
                    <button
                      onClick={async () => {
                        try {
                          const apiUrl = import.meta.env.VITE_API_URL || 'https://api.miohub.it';
                          const res = await fetch(`${apiUrl}/api/a99x/assessori`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              comune_id: comuneIdFromUrl || '1',
                              ...a99xAssForm
                            })
                          });
                          const data = await res.json();
                          if (data.success) {
                            setA99xNuovoAssessore(false);
                            setA99xAssForm({ nome: '', cognome: '', ruolo: '', email: '', telefono: '', settore: '' });
                            fetchA99xData();
                          } else {
                            alert(data.error || 'Errore nella creazione');
                          }
                        } catch (err) {
                          console.error('Errore creazione assessore:', err);
                        }
                      }}
                      disabled={!a99xAssForm.nome || !a99xAssForm.cognome || !a99xAssForm.email}
                      className="w-full py-3 bg-gradient-to-r from-[#f59e0b] to-[#ef4444] text-white rounded-lg font-medium hover:from-[#d97706] hover:to-[#dc2626] transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Aggiungi Assessore
                    </button>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* TAB: MAPPA GIS - Ora usa GestioneHubMapWrapper (Vista Italia HUB) */}
          <TabsContent value="mappa" className="space-y-4">
            {/* BUS HUB Editor - Schermo Intero */}
            {showBusHubEditor ? (
              <div className="fixed inset-0 z-[100] bg-[#0b1220]">
                <BusHubEditor
                  onClose={() => setShowBusHubEditor(false)}
                  onSave={async data => {
                    // Dati ricevuti da editor, processa salvataggio
                    try {
                      // Estrai i dati nel formato corretto per il backend
                      const areaGeojson =
                        data.hub_geojson?.area?.geometry || null;
                      const cornerGeojson = data.hub_geojson?.corner || null;
                      const centerCoords = data.hub_geojson?.center?.geometry
                        ?.coordinates || [data.center?.lng, data.center?.lat];

                      // Se abbiamo un hubId, aggiorna l'hub esistente
                      if (data.hubId) {
                        const API_BASE_URL =
                          import.meta.env.VITE_MIHUB_API_URL ||
                          "https://api.mio-hub.me";
                        const response = await authenticatedFetch(
                          `${API_BASE_URL}/api/hub/locations/${data.hubId}`,
                          {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              areaGeojson: areaGeojson
                                ? JSON.stringify(areaGeojson)
                                : null,
                              cornerGeojson: cornerGeojson
                                ? JSON.stringify(cornerGeojson)
                                : null,
                              centerLat: centerCoords[1],
                              centerLng: centerCoords[0],
                            }),
                          }
                        );
                        if (response.ok) {
                          // Hub aggiornato con successo
                        } else {
                          console.error(
                            "Errore aggiornamento hub:",
                            await response.text()
                          );
                        }
                      }
                      setShowBusHubEditor(false);
                    } catch (err) {
                      console.error("Errore salvataggio:", err);
                    }
                  }}
                />
              </div>
            ) : (
              <>
                {/* Pulsante BUS HUB - Accesso rapido all'editor */}
                <div className="flex justify-end px-4">
                  <Button
                    onClick={() => setShowBusHubEditor(true)}
                    className="bg-[#f59e0b] hover:bg-[#d97706] text-white font-medium px-6"
                  >
                    <Bus className="h-4 w-4 mr-2" />
                    BUS HUB Editor
                  </Button>
                </div>
                {/* Vista Italia HUB */}
                <GestioneHubMapWrapper />
              </>
            )}
          </TabsContent>

          {/* TAB: GESTIONE HUB */}
          <TabsContent value="workspace" className="space-y-6">
            <GestioneHubPanel />
          </TabsContent>
        </Tabs>
      </div>

      {/* Modale Documentazione */}
      <DocModal
        content={docModalContent}
        onClose={() => setDocModalContent(null)}
      />
    </div>
  );
}

// ============================================================================
// LOGS SECTION (System + Guardian)
// ============================================================================
function LogsSection() {
  const [guardianLogs, setGuardianLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBusHubEditor, setShowBusHubEditor] = useState(false);

  useEffect(() => {
    // Load Guardian logs from backend API
    const fetchLogs = async () => {
      try {
        const response = await getLogs({ limit: 100 });
        setGuardianLogs(response.logs);
        setLoading(false);
      } catch (err) {
        console.error("Error loading Guardian logs:", err);
        setLoading(false);
      }
    };
    fetchLogs();
    // Refresh every 30 seconds
    const interval = setInterval(fetchLogs, 30000);
    return () => clearInterval(interval);
  }, []);

  // Calculate stats from Guardian logs
  const stats = {
    total: guardianLogs.length,
    allowed: guardianLogs.filter(log => log.success === true).length,
    denied: guardianLogs.filter(
      log => log.success === false && log.statusCode !== null
    ).length,
    error: guardianLogs.filter(
      log => log.success === false && log.statusCode === null
    ).length,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "allowed":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "denied":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "error":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString("it-IT", {
      timeZone: "Europe/Rome",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // Mock system logs
  const systemLogs = [
    {
      id: 1,
      timestamp: new Date().toISOString(),
      level: "info",
      app: "DMS_HUB",
      type: "API_CALL",
      message: "GET /api/markets/list - 200 OK",
      userEmail: "system",
    },
    {
      id: 2,
      timestamp: new Date(Date.now() - 60000).toISOString(),
      level: "info",
      app: "DMS_HUB",
      type: "DATABASE",
      message: "Query executed successfully",
      userEmail: "admin@dms.it",
    },
    {
      id: 3,
      timestamp: new Date(Date.now() - 120000).toISOString(),
      level: "warn",
      app: "MIHUB",
      type: "RATE_LIMIT",
      message: "Rate limit approaching for agent: mio",
      userEmail: "system",
    },
  ];

  return (
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-[#14b8a6]/20 to-[#14b8a6]/5 border-[#14b8a6]/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-[#e8fbff] text-sm">Totale Log</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-[#14b8a6]">
              {stats.total}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-[#10b981]/20 to-[#10b981]/5 border-[#10b981]/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-[#e8fbff] text-sm">Allowed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-[#10b981]">
              {stats.allowed}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-[#ef4444]/20 to-[#ef4444]/5 border-[#ef4444]/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-[#e8fbff] text-sm">Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-[#ef4444]">
              {stats.denied}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-[#f59e0b]/20 to-[#f59e0b]/5 border-[#f59e0b]/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-[#e8fbff] text-sm">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-[#f59e0b]">
              {stats.error}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs: System Logs + Guardian Logs */}
      <Tabs defaultValue="guardian" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-[#1a2332] border border-[#14b8a6]/30">
          <TabsTrigger
            value="system"
            className="data-[state=active]:bg-[#14b8a6] data-[state=active]:text-white"
          >
            System Logs
          </TabsTrigger>
          <TabsTrigger
            value="guardian"
            className="data-[state=active]:bg-[#14b8a6] data-[state=active]:text-white"
          >
            Guardian Logs
          </TabsTrigger>
        </TabsList>

        {/* System Logs Tab */}
        <TabsContent value="system" className="mt-4">
          <Card className="bg-[#1a2332] border-[#14b8a6]/30">
            <CardHeader>
              <CardTitle className="text-[#e8fbff] flex items-center gap-2">
                <Terminal className="h-5 w-5 text-[#14b8a6]" />
                System Logs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {systemLogs.map(log => (
                  <div
                    key={log.id}
                    className="p-3 rounded-lg border bg-[#0b1220] border-[#14b8a6]/20"
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded border ${
                            log.level === "info"
                              ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                              : log.level === "warn"
                                ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                                : "bg-red-500/20 text-red-400 border-red-500/30"
                          }`}
                        >
                          {log.level.toUpperCase()}
                        </span>
                        <span className="text-xs text-[#e8fbff]/70">
                          {log.app}
                        </span>
                        <span className="text-xs text-[#e8fbff]/50">•</span>
                        <span className="text-xs text-[#e8fbff]/50">
                          {log.type}
                        </span>
                      </div>
                      <span className="text-xs text-[#e8fbff]/50">
                        {formatTimestamp(log.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-[#e8fbff] font-mono">
                      {log.message}
                    </p>
                    <div className="text-xs text-[#e8fbff]/50 mt-1">
                      User: {log.userEmail}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Guardian Logs Tab */}
        <TabsContent value="guardian" className="mt-4">
          <Card className="bg-[#1a2332] border-[#14b8a6]/30">
            <CardHeader>
              <CardTitle className="text-[#e8fbff] flex items-center gap-2">
                <Shield className="h-5 w-5 text-[#14b8a6]" />
                Guardian API Logs
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-[#e8fbff]/60">
                  Caricamento log Guardian...
                </div>
              ) : (
                <div className="space-y-2">
                  {guardianLogs.map((log, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border ${
                        log.status === "denied" || log.status === "error"
                          ? "bg-[#ef4444]/10 border-[#ef4444]/30"
                          : "bg-[#0b1220] border-[#14b8a6]/20"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded border ${getStatusBadge(log.status)}`}
                          >
                            {log.status.toUpperCase()}
                          </span>
                          <span className="text-xs text-[#e8fbff]/70">
                            {log.agent}
                          </span>
                          <span className="text-xs text-[#e8fbff]/50">•</span>
                          <span className="text-xs text-[#e8fbff]/50">
                            {log.method}
                          </span>
                        </div>
                        <span className="text-xs text-[#e8fbff]/50">
                          {formatTimestamp(log.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-[#e8fbff] mb-1 font-mono">
                        {log.path}
                      </p>
                      {log.reason && (
                        <div className="flex items-center gap-2 text-xs text-[#e8fbff]/50">
                          <span>📝 {log.reason}</span>
                        </div>
                      )}
                      {log.risk_level && (
                        <div className="flex items-center gap-2 text-xs text-[#e8fbff]/50 mt-1">
                          <span>Risk: {log.risk_level}</span>
                          {log.require_confirmation && (
                            <span>• Require Confirmation</span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        {/* TAB: MAPPA GIS - Ora usa GestioneHubMapWrapper (Vista Italia HUB) */}
        <TabsContent value="mappa" className="space-y-4">
          {/* BUS HUB Editor - Schermo Intero */}
          {showBusHubEditor ? (
            <div className="fixed inset-0 z-[100] bg-[#0b1220]">
              <BusHubEditor
                onClose={() => setShowBusHubEditor(false)}
                onSave={async data => {
                  // Dati ricevuti da editor, processa salvataggio
                  try {
                    // Estrai i dati nel formato corretto per il backend
                    const areaGeojson =
                      data.hub_geojson?.area?.geometry || null;
                    const cornerGeojson = data.hub_geojson?.corner || null;
                    const centerCoords = data.hub_geojson?.center?.geometry
                      ?.coordinates || [data.center?.lng, data.center?.lat];

                    // Se abbiamo un hubId, aggiorna l'hub esistente
                    if (data.hubId) {
                      const API_BASE_URL =
                        import.meta.env.VITE_MIHUB_API_URL ||
                        "https://api.mio-hub.me";
                      const response = await authenticatedFetch(
                        `${API_BASE_URL}/api/hub/locations/${data.hubId}`,
                        {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            areaGeojson: areaGeojson
                              ? JSON.stringify(areaGeojson)
                              : null,
                            cornerGeojson: cornerGeojson
                              ? JSON.stringify(cornerGeojson)
                              : null,
                            centerLat: centerCoords[1],
                            centerLng: centerCoords[0],
                          }),
                        }
                      );
                      if (response.ok) {
                        // Hub aggiornato con successo
                      } else {
                        console.error(
                          "Errore aggiornamento hub:",
                          await response.text()
                        );
                      }
                    }
                    setShowBusHubEditor(false);
                  } catch (err) {
                    console.error("Errore salvataggio:", err);
                  }
                }}
              />
            </div>
          ) : (
            <>
              {/* Pulsante BUS HUB - Accesso rapido all'editor */}
              <div className="flex justify-end px-4">
                <Button
                  onClick={() => setShowBusHubEditor(true)}
                  className="bg-[#f59e0b] hover:bg-[#d97706] text-white font-medium px-6"
                >
                  <Bus className="h-4 w-4 mr-2" />
                  BUS HUB Editor
                </Button>
              </div>
              {/* Vista Italia HUB */}
              <GestioneHubMapWrapper />
            </>
          )}
        </TabsContent>

        {/* TAB: GESTIONE HUB (placeholder vuoto) */}
        <TabsContent value="workspace" className="space-y-6">
          <Card className="bg-[#1a2332] border-[#06b6d4]/30">
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Globe className="h-16 w-16 text-[#06b6d4]/40 mx-auto mb-4" />
                <p className="text-[#e8fbff]/60 text-lg">Gestione HUB</p>
                <p className="text-sm text-[#e8fbff]/40 mt-2">
                  Contenuto da definire
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <PanicButton />
    </>
  );
}

const DocModal: React.FC<{
  content: { title: string; content: string } | null;
  onClose: () => void;
}> = ({ content, onClose }) => {
  if (!content) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-[#1a2332] border border-[#06b6d4]/30 rounded-lg p-6 max-w-2xl w-full"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-[#e8fbff] mb-4">
          {content.title}
        </h2>
        <div
          className="text-[#e8fbff]/80 space-y-4"
          dangerouslySetInnerHTML={{ __html: content.content }}
        />
        <Button
          onClick={onClose}
          className="mt-6 bg-[#06b6d4] hover:bg-[#06b6d4]/80"
        >
          Chiudi
        </Button>
      </div>
    </div>
  );
};
// Force rebuild Sun Jan 11 22:54:53 EST 2026
