/**
 * PiattaformePA — Pannello unificato PDND, App IO, ANPR, SSO, SSU
 *
 * Sostituisce il vecchio tab "Impostazioni" nella Dashboard PA.
 * Gestisce la configurazione e il monitoraggio delle piattaforme nazionali.
 *
 * STATO INTEGRAZIONE:
 * - PDND: Collegato al backend reale (routes/pdnd.js) — mostra stato live
 * - SSU: Collegato al backend reale (routes/ssu-connector.js) — mostra istanze live
 * - Audit Trail: Collegato al backend reale (SSU audit trail)
 * - App IO: Mock (backend non ancora implementato)
 * - ANPR: Mock (backend non ancora implementato, usa PDND quando configurato)
 * - SSO: Semi-live (SPID/CIE via ARPA funzionante, UI mostra stato reale)
 */

import React, { useState } from "react";
import {
  Globe,
  Server,
  Shield,
  Smartphone,
  FileSearch,
  UserCheck,
  CheckCircle,
  XCircle,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Send,
  Search,
  Activity,
  Clock,
  ChevronRight,
  Database,
  Key,
  Lock,
  Wifi,
  WifiOff,
  Play,
  Settings,
  Upload,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  getPdndStatus,
  getPdndVouchers,
  testPdndConnection,
  getSsuStatus,
  getSsuInstances,
  getSsuAuditTrail,
  sendSsuInstance,
  getCombinedAuditTrail,
} from "@/api/piattaformePA";

// ============================================
// Mock Data — Solo per App IO, ANPR e SSO (non ancora integrati)
// ============================================

const MOCK_ESERVICES = [
  {
    id: "dms-mercati",
    name: "API Mercati",
    description: "Dati mercati ambulanti",
    version: "1.0",
    technology: "REST",
    status: "published",
  },
  {
    id: "dms-concessioni",
    name: "API Concessioni",
    description: "Gestione concessioni posteggi",
    version: "1.0",
    technology: "REST",
    status: "draft",
  },
  {
    id: "dms-operatori",
    name: "API Operatori",
    description: "Anagrafica operatori commercio",
    version: "1.0",
    technology: "REST",
    status: "draft",
  },
];

const MOCK_APPIO_STATUS = {
  connected: true,
  mode: "mock" as const,
  hasApiKey: true,
  templatesCount: 3,
};

const MOCK_TEMPLATES = [
  {
    id: "scadenza_concessione",
    name: "Scadenza Concessione",
    subject: "La tua concessione sta per scadere",
    requiredParams: ["nome", "data_scadenza", "mercato"],
  },
  {
    id: "pagamento_canone",
    name: "Avviso Pagamento",
    subject: "Nuovo avviso di pagamento",
    requiredParams: ["importo", "scadenza"],
  },
  {
    id: "comunicazione_mercato",
    name: "Comunicazione Mercato",
    subject: "Comunicazione importante",
    requiredParams: ["messaggio", "mercato"],
  },
];

const MOCK_SSO_STATUS = {
  mockMode: false, // SPID/CIE via ARPA è reale!
  providers: [
    { provider: "spid", isActive: true, isConfigured: true },
    { provider: "cie", isActive: true, isConfigured: true },
    { provider: "cns", isActive: false, isConfigured: false },
    { provider: "eidas", isActive: false, isConfigured: false },
  ],
};

const MOCK_SSO_PROVIDERS = [
  {
    provider: "spid",
    name: "SPID — Sistema Pubblico Identita' Digitale",
    spidLevel: 2,
    isActive: true,
    isConfigured: true,
    environment: "production",
    ssoUrl: "https://accessosicuro.regione.toscana.it",
  },
  {
    provider: "cie",
    name: "CIE — Carta d'Identita' Elettronica",
    spidLevel: 3,
    isActive: true,
    isConfigured: true,
    environment: "production",
    ssoUrl: "https://accessosicuro.regione.toscana.it",
  },
  {
    provider: "cns",
    name: "CNS — Carta Nazionale dei Servizi",
    spidLevel: null,
    isActive: false,
    isConfigured: false,
    environment: "test",
    ssoUrl: "",
  },
  {
    provider: "eidas",
    name: "eIDAS — European Identity",
    spidLevel: null,
    isActive: false,
    isConfigured: false,
    environment: "test",
    ssoUrl: "",
  },
];

const MOCK_CF_DB: Record<
  string,
  {
    nome: string;
    cognome: string;
    dataNascita: string;
    comuneNascita: string;
    indirizzo: string;
    civico: string;
    cap: string;
    comune: string;
    provincia: string;
  }
> = {
  RSSMRA85M01H501Z: {
    nome: "Mario",
    cognome: "Rossi",
    dataNascita: "01/08/1985",
    comuneNascita: "Roma",
    indirizzo: "Via Roma",
    civico: "10",
    cap: "00100",
    comune: "Roma",
    provincia: "RM",
  },
  VRDLGI90A41F205X: {
    nome: "Luigia",
    cognome: "Verdi",
    dataNascita: "01/01/1990",
    comuneNascita: "Milano",
    indirizzo: "Via Milano",
    civico: "5",
    cap: "20100",
    comune: "Milano",
    provincia: "MI",
  },
  BNCGPP75D15L219Y: {
    nome: "Giuseppe",
    cognome: "Bianchi",
    dataNascita: "15/04/1975",
    comuneNascita: "Torino",
    indirizzo: "Corso Torino",
    civico: "22",
    cap: "10100",
    comune: "Torino",
    provincia: "TO",
  },
};

// ============================================
// Sub-componente: PDND Panel (DATI REALI)
// ============================================
function PdndPanel() {
  const statusQuery = useQuery({
    queryKey: ["pdnd-status"],
    queryFn: getPdndStatus,
    refetchInterval: 30000,
  });
  const vouchersQuery = useQuery({
    queryKey: ["pdnd-vouchers"],
    queryFn: getPdndVouchers,
    refetchInterval: 60000,
  });
  const eservicesQuery = useQuery({
    queryKey: ["pdnd-eservices"],
    queryFn: async () => MOCK_ESERVICES, // e-services restano mock (catalogo locale)
  });
  const testMutation = useMutation({
    mutationFn: testPdndConnection,
  });
  const publishMutation = useMutation({
    mutationFn: async (_params: {
      serviceId: string;
      metadata: {
        name: string;
        description: string;
        technology: string;
        version: string;
      };
    }) => {
      await new Promise(r => setTimeout(r, 1000));
      return { success: true };
    },
  });

  const pdnd = statusQuery.data?.pdnd;
  const eservices = eservicesQuery.data;

  return (
    <div className="space-y-4">
      {/* Status Card - DATI REALI */}
      <Card className="bg-[#1a2332] border-[#3b82f6]/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-[#e8fbff] flex items-center gap-2 text-base">
            <Server className="h-5 w-5 text-[#3b82f6]" />
            Stato Connessione PDND
            {pdnd?.configured ? (
              <Badge className="ml-2 bg-emerald-500/20 text-emerald-400 border-emerald-400/30 text-xs">
                Live
              </Badge>
            ) : (
              <Badge className="ml-2 bg-amber-500/20 text-amber-400 border-amber-400/30 text-xs">
                In Preparazione
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-[#0f1729] rounded-lg border border-[#3b82f6]/20">
              <div className="flex items-center gap-2 mb-1">
                {pdnd?.configured ? (
                  <Wifi className="h-4 w-4 text-emerald-400" />
                ) : (
                  <WifiOff className="h-4 w-4 text-amber-400" />
                )}
                <span className="text-xs text-[#e8fbff]/60">Connessione</span>
              </div>
              <p className="text-sm font-semibold text-[#e8fbff]">
                {pdnd?.configured ? "Attiva" : "Non configurato"}
              </p>
            </div>
            <div className="p-3 bg-[#0f1729] rounded-lg border border-[#3b82f6]/20">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="h-4 w-4 text-[#3b82f6]" />
                <span className="text-xs text-[#e8fbff]/60">Ambiente</span>
              </div>
              <p className="text-sm font-semibold text-[#e8fbff]">
                <Badge
                  variant="outline"
                  className={
                    pdnd?.environment === "production"
                      ? "text-emerald-400 border-emerald-400/30"
                      : "text-amber-400 border-amber-400/30"
                  }
                >
                  {pdnd?.environment || "N/A"}
                </Badge>
              </p>
            </div>
            <div className="p-3 bg-[#0f1729] rounded-lg border border-[#3b82f6]/20">
              <div className="flex items-center gap-2 mb-1">
                <Key className="h-4 w-4 text-[#3b82f6]" />
                <span className="text-xs text-[#e8fbff]/60">Client ID</span>
              </div>
              <p className="text-sm font-semibold text-[#e8fbff]">
                {pdnd?.client_id ? (
                  <CheckCircle className="h-4 w-4 text-emerald-400 inline" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-400 inline" />
                )}
              </p>
            </div>
            <div className="p-3 bg-[#0f1729] rounded-lg border border-[#3b82f6]/20">
              <div className="flex items-center gap-2 mb-1">
                <Lock className="h-4 w-4 text-[#3b82f6]" />
                <span className="text-xs text-[#e8fbff]/60">Key ID (RSA)</span>
              </div>
              <p className="text-sm font-semibold text-[#e8fbff]">
                {pdnd?.key_id ? (
                  <CheckCircle className="h-4 w-4 text-emerald-400 inline" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-400 inline" />
                )}
              </p>
            </div>
          </div>

          {/* Voucher Stats */}
          {pdnd?.vouchers && (
            <div className="mt-4 p-3 bg-[#0f1729] rounded-lg border border-[#3b82f6]/10">
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-xs text-[#e8fbff]/60">Voucher Totali</span>
                  <p className="text-lg font-bold text-[#3b82f6]">{pdnd.vouchers.total}</p>
                </div>
                <div>
                  <span className="text-xs text-[#e8fbff]/60">Attivi</span>
                  <p className="text-lg font-bold text-emerald-400">{pdnd.vouchers.active}</p>
                </div>
                <div>
                  <span className="text-xs text-[#e8fbff]/60">Scaduti</span>
                  <p className="text-lg font-bold text-[#e8fbff]/40">{pdnd.vouchers.expired}</p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-3 flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="border-[#3b82f6]/30 text-[#3b82f6] hover:bg-[#3b82f6]/10"
              onClick={() => testMutation.mutate()}
              disabled={testMutation.isPending}
            >
              <RefreshCw
                className={`h-4 w-4 mr-1 ${testMutation.isPending ? "animate-spin" : ""}`}
              />
              Test Connessione
            </Button>
            {testMutation.data && (
              <span className={`text-xs self-center ${testMutation.data.success ? "text-emerald-400" : "text-red-400"}`}>
                {testMutation.data.success ? `OK (${testMutation.data.responseTimeMs}ms)` : "Errore"}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* e-Service Catalog */}
      <Card className="bg-[#1a2332] border-[#3b82f6]/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-[#e8fbff] flex items-center gap-2 text-base">
            <Database className="h-5 w-5 text-[#3b82f6]" />
            Catalogo e-Service
          </CardTitle>
          <CardDescription className="text-[#e8fbff]/50">
            Servizi esposti su PDND per l'interoperabilita' con altre PA
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {eservices?.map(service => (
              <div
                key={service.id}
                className="p-4 bg-[#0f1729] border border-[#3b82f6]/20 rounded-lg"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-[#e8fbff] font-medium text-sm">
                      {service.name}
                    </h4>
                    <p className="text-[#e8fbff]/50 text-xs mt-1">
                      {service.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge
                        variant="outline"
                        className="text-xs text-[#e8fbff]/60 border-[#e8fbff]/20"
                      >
                        v{service.version}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="text-xs text-[#e8fbff]/60 border-[#e8fbff]/20"
                      >
                        {service.technology}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {service.status === "published" ? (
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-400/30">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Pubblicato
                      </Badge>
                    ) : service.status === "draft" ? (
                      <Badge className="bg-amber-500/20 text-amber-400 border-amber-400/30">
                        <Clock className="h-3 w-3 mr-1" />
                        Bozza
                      </Badge>
                    ) : (
                      <Badge className="bg-red-500/20 text-red-400 border-red-400/30">
                        <XCircle className="h-3 w-3 mr-1" />
                        {service.status}
                      </Badge>
                    )}
                    {service.status === "draft" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-[#3b82f6]/30 text-[#3b82f6] hover:bg-[#3b82f6]/10 h-7 text-xs"
                        onClick={() =>
                          publishMutation.mutate({
                            serviceId: service.id,
                            metadata: {
                              name: service.name,
                              description: service.description,
                              technology: service.technology,
                              version: service.version,
                            },
                          })
                        }
                        disabled={publishMutation.isPending}
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Pubblica
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================
// Sub-componente: App IO Panel (MOCK)
// ============================================
function AppIoPanel() {
  const statusQuery = useQuery({
    queryKey: ["appio-status"],
    queryFn: async () => MOCK_APPIO_STATUS,
  });
  const templatesQuery = useQuery({
    queryKey: ["appio-templates"],
    queryFn: async () => MOCK_TEMPLATES,
  });
  const sendMutation = useMutation({
    mutationFn: async (_params: {
      templateId: string;
      fiscalCode: string;
      params: Record<string, string>;
    }) => {
      await new Promise(r => setTimeout(r, 1000));
      return { success: true, messageId: "mock-msg-001" };
    },
  });

  return (
    <div className="space-y-4">
      {/* Status */}
      <Card className="bg-[#1a2332] border-[#10b981]/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-[#e8fbff] flex items-center gap-2 text-base">
            <Smartphone className="h-5 w-5 text-[#10b981]" />
            App IO — Notifiche Cittadini
            <Badge className="ml-2 bg-amber-500/20 text-amber-400 border-amber-400/30 text-xs">
              Mock
            </Badge>
          </CardTitle>
          <CardDescription className="text-[#e8fbff]/50">
            Invio messaggi e notifiche ai cittadini tramite l'app IO
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-[#0f1729] rounded-lg border border-[#10b981]/20">
              <div className="flex items-center gap-2 mb-1">
                {statusQuery.data?.connected ? (
                  <Wifi className="h-4 w-4 text-emerald-400" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-400" />
                )}
                <span className="text-xs text-[#e8fbff]/60">Connessione</span>
              </div>
              <p className="text-sm font-semibold text-[#e8fbff]">
                {statusQuery.data?.connected ? "Simulata" : "Non connesso"}
              </p>
            </div>
            <div className="p-3 bg-[#0f1729] rounded-lg border border-[#10b981]/20">
              <div className="flex items-center gap-2 mb-1">
                <Key className="h-4 w-4 text-[#10b981]" />
                <span className="text-xs text-[#e8fbff]/60">API Key</span>
              </div>
              <p className="text-sm font-semibold text-[#e8fbff]">
                {statusQuery.data?.hasApiKey ? (
                  <CheckCircle className="h-4 w-4 text-emerald-400 inline" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-400 inline" />
                )}
              </p>
            </div>
            <div className="p-3 bg-[#0f1729] rounded-lg border border-[#10b981]/20">
              <div className="flex items-center gap-2 mb-1">
                <Send className="h-4 w-4 text-[#10b981]" />
                <span className="text-xs text-[#e8fbff]/60">Template</span>
              </div>
              <p className="text-lg font-bold text-[#e8fbff]">
                {statusQuery.data?.templatesCount ?? 0}
              </p>
            </div>
            <div className="p-3 bg-[#0f1729] rounded-lg border border-[#10b981]/20">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="h-4 w-4 text-[#10b981]" />
                <span className="text-xs text-[#e8fbff]/60">Modalita'</span>
              </div>
              <p className="text-sm font-semibold text-[#e8fbff]">
                <Badge
                  variant="outline"
                  className="text-amber-400 border-amber-400/30"
                >
                  Mock
                </Badge>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates */}
      <Card className="bg-[#1a2332] border-[#10b981]/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-[#e8fbff] flex items-center gap-2 text-base">
            <Send className="h-5 w-5 text-[#10b981]" />
            Template Messaggi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {templatesQuery.data?.map(template => (
              <div
                key={template.id}
                className="p-4 bg-[#0f1729] border border-[#10b981]/20 rounded-lg"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-[#e8fbff] font-medium text-sm">
                      {template.name}
                    </h4>
                    <p className="text-[#e8fbff]/50 text-xs mt-1">
                      {template.subject}
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                      {template.requiredParams.map(p => (
                        <Badge
                          key={p}
                          variant="outline"
                          className="text-xs text-[#e8fbff]/40 border-[#e8fbff]/10"
                        >
                          {p}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-[#10b981]/30 text-[#10b981] hover:bg-[#10b981]/10 h-7 text-xs"
                    onClick={() =>
                      sendMutation.mutate({
                        templateId: template.id,
                        fiscalCode: "RSSMRA85M01H501Z",
                        params: {},
                      })
                    }
                    disabled={sendMutation.isPending}
                  >
                    <Send className="h-3 w-3 mr-1" />
                    Test Invio
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================
// Sub-componente: ANPR Panel (MOCK)
// ============================================
function AnprPanel() {
  const [searchCF, setSearchCF] = useState("");
  const searchMutation = useMutation({
    mutationFn: async (cf: string) => {
      await new Promise(r => setTimeout(r, 500));
      const result = MOCK_CF_DB[cf.toUpperCase()];
      if (!result) throw new Error("Codice fiscale non trovato");
      return result;
    },
  });

  return (
    <div className="space-y-4">
      {/* Status */}
      <Card className="bg-[#1a2332] border-[#f59e0b]/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-[#e8fbff] flex items-center gap-2 text-base">
            <FileSearch className="h-5 w-5 text-[#f59e0b]" />
            ANPR — Anagrafe Nazionale
            <Badge className="ml-2 bg-amber-500/20 text-amber-400 border-amber-400/30 text-xs">
              Mock
            </Badge>
          </CardTitle>
          <CardDescription className="text-[#e8fbff]/50">
            Verifica residenza e dati anagrafici tramite ANPR (via PDND)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            <div className="p-3 bg-[#0f1729] rounded-lg border border-[#f59e0b]/20">
              <span className="text-xs text-[#e8fbff]/60">Stato</span>
              <p className="text-sm font-semibold text-amber-400 mt-1">
                In attesa PDND
              </p>
            </div>
            <div className="p-3 bg-[#0f1729] rounded-lg border border-[#f59e0b]/20">
              <span className="text-xs text-[#e8fbff]/60">Accesso via</span>
              <p className="text-sm font-semibold text-[#e8fbff] mt-1">
                PDND e-Service
              </p>
            </div>
            <div className="p-3 bg-[#0f1729] rounded-lg border border-[#f59e0b]/20">
              <span className="text-xs text-[#e8fbff]/60">CF di test</span>
              <p className="text-xs font-mono text-[#e8fbff]/60 mt-1">
                RSSMRA85M01H501Z
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#e8fbff]/30" />
              <input
                type="text"
                placeholder="Inserisci codice fiscale..."
                value={searchCF}
                onChange={e => setSearchCF(e.target.value.toUpperCase())}
                className="w-full pl-9 pr-3 py-2 bg-[#0f1729] border border-[#f59e0b]/20 rounded-lg text-[#e8fbff] text-sm placeholder:text-[#e8fbff]/30 focus:outline-none focus:border-[#f59e0b]/50"
                maxLength={16}
              />
            </div>
            <Button
              size="sm"
              className="bg-[#f59e0b] hover:bg-[#f59e0b]/80 text-black"
              onClick={() => searchMutation.mutate(searchCF)}
              disabled={searchMutation.isPending || searchCF.length < 16}
            >
              <Search className="h-4 w-4 mr-1" />
              Verifica
            </Button>
          </div>

          {/* Results */}
          {searchMutation.data && (
            <div className="mt-4 p-4 bg-[#0f1729] border border-[#f59e0b]/20 rounded-lg">
              <h4 className="text-[#e8fbff] font-medium text-sm mb-3 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
                Risultato Verifica (Mock)
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-[#e8fbff]/40 text-xs">Nome</span>
                  <p className="text-[#e8fbff]">
                    {searchMutation.data.nome} {searchMutation.data.cognome}
                  </p>
                </div>
                <div>
                  <span className="text-[#e8fbff]/40 text-xs">
                    Data Nascita
                  </span>
                  <p className="text-[#e8fbff]">
                    {searchMutation.data.dataNascita}
                  </p>
                </div>
                <div>
                  <span className="text-[#e8fbff]/40 text-xs">Indirizzo</span>
                  <p className="text-[#e8fbff]">
                    {searchMutation.data.indirizzo},{" "}
                    {searchMutation.data.civico}
                  </p>
                </div>
                <div>
                  <span className="text-[#e8fbff]/40 text-xs">Comune</span>
                  <p className="text-[#e8fbff]">
                    {searchMutation.data.comune} ({searchMutation.data.provincia}
                    )
                  </p>
                </div>
              </div>
            </div>
          )}
          {searchMutation.error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-sm flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                {(searchMutation.error as Error).message}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================
// Sub-componente: SSO Panel (SEMI-LIVE via ARPA Toscana)
// ============================================
function SsoPanel() {
  const statusQuery = useQuery({
    queryKey: ["sso-status"],
    queryFn: async () => MOCK_SSO_STATUS,
  });
  const providersQuery = useQuery({
    queryKey: ["sso-providers"],
    queryFn: async () => MOCK_SSO_PROVIDERS,
  });
  const testMutation = useMutation({
    mutationFn: async (params: { provider: string }) => {
      // Test reale per SPID/CIE (verifica che ARPA risponda)
      if (params.provider === "spid" || params.provider === "cie") {
        const start = Date.now();
        try {
          const res = await fetch("https://api.mio-hub.me/api/auth/config");
          const responseTimeMs = Date.now() - start;
          return {
            success: res.ok,
            responseTimeMs,
            errorMessage: res.ok ? undefined : `HTTP ${res.status}`,
          };
        } catch (e) {
          return {
            success: false,
            responseTimeMs: Date.now() - start,
            errorMessage: "Connessione fallita",
          };
        }
      }
      // Mock per CNS/eIDAS
      await new Promise(r => setTimeout(r, 600));
      return {
        success: false,
        responseTimeMs: 0,
        errorMessage: "Provider non configurato",
      };
    },
  });

  const providerIcons: Record<string, React.ReactNode> = {
    spid: <Shield className="h-5 w-5 text-[#0066cc]" />,
    cie: <UserCheck className="h-5 w-5 text-[#003399]" />,
    cns: <Key className="h-5 w-5 text-[#006633]" />,
    eidas: <Globe className="h-5 w-5 text-[#003399]" />,
  };

  const providerColors: Record<string, string> = {
    spid: "#0066cc",
    cie: "#003399",
    cns: "#006633",
    eidas: "#003399",
  };

  return (
    <div className="space-y-4">
      {/* Status */}
      <Card className="bg-[#1a2332] border-[#8b5cf6]/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-[#e8fbff] flex items-center gap-2 text-base">
            <Shield className="h-5 w-5 text-[#8b5cf6]" />
            SSO — Single Sign-On Federato
            <Badge className="ml-2 bg-emerald-500/20 text-emerald-400 border-emerald-400/30 text-xs">
              Live (ARPA)
            </Badge>
          </CardTitle>
          <CardDescription className="text-[#e8fbff]/50">
            Autenticazione SPID, CIE via ARPA Toscana — CNS ed eIDAS in preparazione
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="p-3 bg-[#0f1729] rounded-lg border border-[#8b5cf6]/20">
              <span className="text-xs text-[#e8fbff]/60">Modalita'</span>
              <p className="text-sm font-semibold text-[#e8fbff] mt-1">
                <Badge
                  variant="outline"
                  className="text-emerald-400 border-emerald-400/30"
                >
                  Produzione
                </Badge>
              </p>
            </div>
            <div className="p-3 bg-[#0f1729] rounded-lg border border-[#8b5cf6]/20">
              <span className="text-xs text-[#e8fbff]/60">Provider Totali</span>
              <p className="text-lg font-bold text-[#e8fbff] mt-1">
                {statusQuery.data?.providers.length ?? 0}
              </p>
            </div>
            <div className="p-3 bg-[#0f1729] rounded-lg border border-[#8b5cf6]/20">
              <span className="text-xs text-[#e8fbff]/60">Attivi</span>
              <p className="text-lg font-bold text-emerald-400 mt-1">
                {statusQuery.data?.providers.filter((p: any) => p.isActive)
                  .length ?? 0}
              </p>
            </div>
            <div className="p-3 bg-[#0f1729] rounded-lg border border-[#8b5cf6]/20">
              <span className="text-xs text-[#e8fbff]/60">Configurati</span>
              <p className="text-lg font-bold text-[#8b5cf6] mt-1">
                {statusQuery.data?.providers.filter((p: any) => p.isConfigured)
                  .length ?? 0}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Provider Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {providersQuery.data?.map(provider => {
          const color = providerColors[provider.provider] || "#8b5cf6";
          return (
            <Card
              key={provider.provider}
              className="bg-[#1a2332] border-[#8b5cf6]/20"
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: `${color}20` }}
                    >
                      {providerIcons[provider.provider]}
                    </div>
                    <div>
                      <h4 className="text-[#e8fbff] font-medium text-sm">
                        {provider.name}
                      </h4>
                      <p className="text-[#e8fbff]/40 text-xs mt-1">
                        Provider: {provider.provider.toUpperCase()}
                      </p>
                      {provider.spidLevel && (
                        <Badge
                          variant="outline"
                          className="text-xs mt-1 text-[#e8fbff]/50 border-[#e8fbff]/20"
                        >
                          Livello {provider.spidLevel}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {provider.isActive ? (
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-400/30">
                        Attivo
                      </Badge>
                    ) : (
                      <Badge className="bg-[#e8fbff]/10 text-[#e8fbff]/40 border-[#e8fbff]/10">
                        Non attivo
                      </Badge>
                    )}
                    <Badge
                      variant="outline"
                      className="text-xs text-[#e8fbff]/40 border-[#e8fbff]/10"
                    >
                      {provider.environment}
                    </Badge>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-[#e8fbff]/5 flex justify-between items-center">
                  <div className="text-xs text-[#e8fbff]/30">
                    {provider.ssoUrl ? (
                      <span className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3 text-emerald-400" />
                        Endpoint configurato
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 text-amber-400" />
                        Endpoint da configurare
                      </span>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-[#8b5cf6]/30 text-[#8b5cf6] hover:bg-[#8b5cf6]/10 h-7 text-xs"
                    onClick={() =>
                      testMutation.mutate({ provider: provider.provider })
                    }
                    disabled={testMutation.isPending}
                  >
                    <RefreshCw
                      className={`h-3 w-3 mr-1 ${testMutation.isPending ? "animate-spin" : ""}`}
                    />
                    Test
                  </Button>
                </div>

                {/* Test Result */}
                {testMutation.data &&
                  testMutation.variables?.provider === provider.provider && (
                    <div className="mt-2 p-2 bg-[#0f1729] rounded-lg border border-[#8b5cf6]/10">
                      <div className="flex items-center gap-2">
                        {testMutation.data.success ? (
                          <CheckCircle className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-400" />
                        )}
                        <span
                          className={`text-xs ${testMutation.data.success ? "text-emerald-400" : "text-red-400"}`}
                        >
                          {testMutation.data.success
                            ? "Connessione OK"
                            : "Errore connessione"}
                        </span>
                        <span className="text-xs text-[#e8fbff]/30 ml-auto">
                          {testMutation.data.responseTimeMs}ms
                        </span>
                      </div>
                      {testMutation.data.errorMessage && (
                        <p className="text-xs text-red-400/70 mt-1">
                          {testMutation.data.errorMessage}
                        </p>
                      )}
                    </div>
                  )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ============================================
// Sub-componente: SSU Panel (DATI REALI)
// ============================================
function SsuPanel() {
  const statusQuery = useQuery({
    queryKey: ["ssu-status"],
    queryFn: getSsuStatus,
    refetchInterval: 30000,
  });
  const instancesQuery = useQuery({
    queryKey: ["ssu-instances"],
    queryFn: () => getSsuInstances({ limit: 10 }),
    refetchInterval: 30000,
  });

  const ssu = statusQuery.data?.ssu;

  const statoColors: Record<string, string> = {
    pending: "#f59e0b",
    sent: "#3b82f6",
    receipted: "#10b981",
    completed: "#10b981",
    correction_requested: "#ef4444",
    integration_requested: "#f97316",
    cancelled: "#6b7280",
    failed: "#ef4444",
  };

  const statoLabels: Record<string, string> = {
    pending: "In attesa",
    sent: "Inviata",
    receipted: "Ricevuta",
    completed: "Completata",
    correction_requested: "Regolarizzazione",
    integration_requested: "Integrazione",
    cancelled: "Annullata",
    failed: "Fallita",
  };

  return (
    <div className="space-y-4">
      {/* Status Card */}
      <Card className="bg-[#1a2332] border-[#14b8a6]/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-[#e8fbff] flex items-center gap-2 text-base">
            <Upload className="h-5 w-5 text-[#14b8a6]" />
            SSU — Sportello Unico (Front Office)
            {ssu?.enabled ? (
              <Badge className="ml-2 bg-emerald-500/20 text-emerald-400 border-emerald-400/30 text-xs">
                Attivo
              </Badge>
            ) : (
              <Badge className="ml-2 bg-amber-500/20 text-amber-400 border-amber-400/30 text-xs">
                In Configurazione
              </Badge>
            )}
          </CardTitle>
          <CardDescription className="text-[#e8fbff]/50">
            Connettore Front Office per invio pratiche SUAP al Back Office del Comune
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-[#0f1729] rounded-lg border border-[#14b8a6]/20">
              <span className="text-xs text-[#e8fbff]/60">Stato</span>
              <p className="text-sm font-semibold text-[#e8fbff] mt-1">
                {ssu?.enabled ? "Connesso" : "Non connesso"}
              </p>
            </div>
            <div className="p-3 bg-[#0f1729] rounded-lg border border-[#14b8a6]/20">
              <span className="text-xs text-[#e8fbff]/60">Istanze Totali</span>
              <p className="text-lg font-bold text-[#14b8a6] mt-1">
                {ssu?.instances.total ?? 0}
              </p>
            </div>
            <div className="p-3 bg-[#0f1729] rounded-lg border border-[#14b8a6]/20">
              <span className="text-xs text-[#e8fbff]/60">In Corso</span>
              <p className="text-lg font-bold text-amber-400 mt-1">
                {ssu?.instances.pending ?? 0}
              </p>
            </div>
            <div className="p-3 bg-[#0f1729] rounded-lg border border-[#14b8a6]/20">
              <span className="text-xs text-[#e8fbff]/60">Completate</span>
              <p className="text-lg font-bold text-emerald-400 mt-1">
                {ssu?.instances.completed ?? 0}
              </p>
            </div>
          </div>

          {/* Config info */}
          <div className="mt-4 p-3 bg-[#0f1729] rounded-lg border border-[#14b8a6]/10">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[#e8fbff]/40">Front Office URL</span>
                <p className="text-[#e8fbff] font-mono mt-1 truncate">
                  {ssu?.frontOfficeUrl || "N/A"}
                </p>
              </div>
              <div>
                <span className="text-[#e8fbff]/40">Back Office URL</span>
                <p className="text-[#e8fbff] font-mono mt-1 truncate">
                  {ssu?.backOfficeUrl || "Non configurato"}
                </p>
              </div>
              <div>
                <span className="text-[#e8fbff]/40">CUI Context</span>
                <p className="text-[#e8fbff] font-mono mt-1">
                  {ssu?.cuiContext || "N/A"}
                </p>
              </div>
              <div>
                <span className="text-[#e8fbff]/40">Max Retry</span>
                <p className="text-[#e8fbff] font-mono mt-1">
                  {ssu?.maxRetries ?? 3}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instances List */}
      <Card className="bg-[#1a2332] border-[#14b8a6]/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-[#e8fbff] flex items-center gap-2 text-base">
            <Database className="h-5 w-5 text-[#14b8a6]" />
            Istanze SSU Recenti
          </CardTitle>
        </CardHeader>
        <CardContent>
          {instancesQuery.data?.instances && instancesQuery.data.instances.length > 0 ? (
            <div className="space-y-2">
              {instancesQuery.data.instances.map((inst) => (
                <div
                  key={inst.id}
                  className="flex items-center gap-3 p-3 bg-[#0f1729] border border-[#e8fbff]/5 rounded-lg"
                >
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: statoColors[inst.stato_ssu] || "#6b7280" }}
                  />
                  <Badge
                    variant="outline"
                    className="text-xs"
                    style={{
                      color: statoColors[inst.stato_ssu] || "#6b7280",
                      borderColor: `${statoColors[inst.stato_ssu] || "#6b7280"}40`,
                    }}
                  >
                    {statoLabels[inst.stato_ssu] || inst.stato_ssu}
                  </Badge>
                  <span className="text-[#e8fbff] text-sm flex-1 font-mono truncate">
                    {inst.cui_uuid.substring(0, 8)}...
                  </span>
                  <span className="text-[#e8fbff]/40 text-xs">
                    {inst.ente_destinatario}
                  </span>
                  <span className="text-[#e8fbff]/20 text-xs">
                    {new Date(inst.created_at).toLocaleString("it-IT", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[#e8fbff]/30 text-sm text-center py-8">
              Nessuna istanza SSU inviata. Le pratiche SUAP completate appariranno qui dopo l'invio al Back Office.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================
// Sub-componente: Audit Trail Panel (DATI REALI)
// ============================================
function AuditTrailPanel() {
  const [platformFilter, setPlatformFilter] = useState<string | undefined>(
    undefined
  );

  const auditQuery = useQuery({
    queryKey: ["piattaforme-audit", platformFilter],
    queryFn: async () => {
      const combined = await getCombinedAuditTrail();
      if (platformFilter) {
        return {
          items: combined.items.filter(i => i.platform === platformFilter),
        };
      }
      return combined;
    },
    refetchInterval: 30000,
  });

  const statsQuery = useQuery({
    queryKey: ["piattaforme-audit-stats"],
    queryFn: async () => {
      const combined = await getCombinedAuditTrail();
      const items = combined.items;
      const now = Date.now();
      return {
        last24h: items.filter(
          i => now - new Date(i.created_at).getTime() < 86400000
        ).length,
        last7d: items.filter(
          i => now - new Date(i.created_at).getTime() < 604800000
        ).length,
        byPlatform: [
          { platform: "ssu", count: items.filter(i => i.platform === "ssu").length },
          { platform: "pdnd", count: items.filter(i => i.platform === "pdnd").length },
          { platform: "appio", count: items.filter(i => i.platform === "appio").length },
          { platform: "sso", count: items.filter(i => i.platform === "sso").length },
        ],
      };
    },
    refetchInterval: 30000,
  });

  const platformColors: Record<string, string> = {
    pdnd: "#3b82f6",
    appio: "#10b981",
    anpr: "#f59e0b",
    sso: "#8b5cf6",
    ssu: "#14b8a6",
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-[#1a2332] border-[#14b8a6]/20">
          <CardContent className="p-4">
            <span className="text-xs text-[#e8fbff]/60">Ultime 24h</span>
            <p className="text-2xl font-bold text-[#14b8a6] mt-1">
              {statsQuery.data?.last24h ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-[#1a2332] border-[#14b8a6]/20">
          <CardContent className="p-4">
            <span className="text-xs text-[#e8fbff]/60">Ultimi 7 giorni</span>
            <p className="text-2xl font-bold text-[#14b8a6] mt-1">
              {statsQuery.data?.last7d ?? 0}
            </p>
          </CardContent>
        </Card>
        {(
          statsQuery.data?.byPlatform as Array<{
            platform: string;
            count: number;
          }>
        )
          ?.filter(item => item.count > 0)
          ?.slice(0, 2)
          .map(item => (
            <Card
              key={item.platform}
              className="bg-[#1a2332] border-[#14b8a6]/20"
            >
              <CardContent className="p-4">
                <span className="text-xs text-[#e8fbff]/60">
                  {item.platform?.toUpperCase()}
                </span>
                <p className="text-2xl font-bold text-[#e8fbff] mt-1">
                  {item.count ?? 0}
                </p>
              </CardContent>
            </Card>
          ))}
      </div>

      {/* Filter */}
      <Card className="bg-[#1a2332] border-[#14b8a6]/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-[#e8fbff] flex items-center gap-2 text-base">
            <Activity className="h-5 w-5 text-[#14b8a6]" />
            Registro Operazioni
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Button
              size="sm"
              variant={!platformFilter ? "default" : "outline"}
              className={
                !platformFilter
                  ? "bg-[#14b8a6] text-white"
                  : "border-[#14b8a6]/30 text-[#e8fbff]/60"
              }
              onClick={() => setPlatformFilter(undefined)}
            >
              Tutte
            </Button>
            {["ssu", "pdnd", "appio", "anpr", "sso"].map(p => (
              <Button
                key={p}
                size="sm"
                variant={platformFilter === p ? "default" : "outline"}
                className={
                  platformFilter === p
                    ? `text-white`
                    : `border-[#e8fbff]/20 text-[#e8fbff]/60`
                }
                style={
                  platformFilter === p
                    ? { backgroundColor: platformColors[p] }
                    : {}
                }
                onClick={() => setPlatformFilter(p)}
              >
                {p.toUpperCase()}
              </Button>
            ))}
          </div>

          {/* Lista */}
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {(
              auditQuery.data?.items as Array<{
                id: number;
                platform: string;
                action: string;
                status: string;
                user_email: string;
                created_at: string;
                duration_ms?: number;
              }>
            )?.map(item => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 bg-[#0f1729] border border-[#e8fbff]/5 rounded-lg"
              >
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor:
                      item.status === "success"
                        ? "#10b981"
                        : item.status === "error"
                          ? "#ef4444"
                          : "#f59e0b",
                  }}
                />
                <Badge
                  variant="outline"
                  className="text-xs"
                  style={{
                    color: platformColors[item.platform],
                    borderColor: `${platformColors[item.platform]}40`,
                  }}
                >
                  {item.platform}
                </Badge>
                <span className="text-[#e8fbff] text-sm flex-1">
                  {item.action}
                </span>
                <span className="text-[#e8fbff]/30 text-xs">
                  {item.user_email?.split("@")[0]}
                </span>
                {item.duration_ms && (
                  <span className="text-[#e8fbff]/20 text-xs">
                    {item.duration_ms}ms
                  </span>
                )}
                <span className="text-[#e8fbff]/20 text-xs">
                  {new Date(item.created_at).toLocaleString("it-IT", {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            ))}
            {(!auditQuery.data?.items ||
              (auditQuery.data.items as unknown[]).length === 0) && (
              <p className="text-[#e8fbff]/30 text-sm text-center py-8">
                Nessuna operazione registrata. Le operazioni SSU e PDND appariranno qui automaticamente.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================
// Componente Principale
// ============================================
export default function PiattaformePA() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#e8fbff] flex items-center gap-2">
            <Globe className="h-6 w-6 text-[#14b8a6]" />
            Piattaforme PA
          </h2>
          <p className="text-[#e8fbff]/50 text-sm mt-1">
            PDND, App IO, ANPR, SSO e SSU — Interoperabilita' e identita' digitale
          </p>
        </div>
      </div>

      {/* Sub-tabs */}
      <Tabs defaultValue="pdnd" className="w-full">
        <TabsList className="bg-[#0f1729] border border-[#e8fbff]/10 p-1">
          <TabsTrigger
            value="pdnd"
            className="data-[state=active]:bg-[#3b82f6]/20 data-[state=active]:text-[#3b82f6]"
          >
            <Server className="h-4 w-4 mr-2" />
            PDND
          </TabsTrigger>
          <TabsTrigger
            value="ssu"
            className="data-[state=active]:bg-[#14b8a6]/20 data-[state=active]:text-[#14b8a6]"
          >
            <Upload className="h-4 w-4 mr-2" />
            SSU
          </TabsTrigger>
          <TabsTrigger
            value="appio"
            className="data-[state=active]:bg-[#10b981]/20 data-[state=active]:text-[#10b981]"
          >
            <Smartphone className="h-4 w-4 mr-2" />
            App IO
          </TabsTrigger>
          <TabsTrigger
            value="anpr"
            className="data-[state=active]:bg-[#f59e0b]/20 data-[state=active]:text-[#f59e0b]"
          >
            <FileSearch className="h-4 w-4 mr-2" />
            ANPR
          </TabsTrigger>
          <TabsTrigger
            value="sso"
            className="data-[state=active]:bg-[#8b5cf6]/20 data-[state=active]:text-[#8b5cf6]"
          >
            <Shield className="h-4 w-4 mr-2" />
            SSO
          </TabsTrigger>
          <TabsTrigger
            value="audit"
            className="data-[state=active]:bg-[#14b8a6]/20 data-[state=active]:text-[#14b8a6]"
          >
            <Activity className="h-4 w-4 mr-2" />
            Audit Trail
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pdnd" className="mt-4">
          <PdndPanel />
        </TabsContent>

        <TabsContent value="ssu" className="mt-4">
          <SsuPanel />
        </TabsContent>

        <TabsContent value="appio" className="mt-4">
          <AppIoPanel />
        </TabsContent>

        <TabsContent value="anpr" className="mt-4">
          <AnprPanel />
        </TabsContent>

        <TabsContent value="sso" className="mt-4">
          <SsoPanel />
        </TabsContent>

        <TabsContent value="audit" className="mt-4">
          <AuditTrailPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
