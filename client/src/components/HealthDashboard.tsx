/**
 * Health Dashboard Component
 * 
 * Sistema di monitoraggio centralizzato per tutti i servizi MioHub.
 * Mostra lo stato in tempo reale di: Database, Storage, Backend, Guardian, MIO Agent, PDND, Frontend.
 * 
 * REGOLE PER NUOVI AGENTI:
 * 1. NON modificare questo componente senza aggiornare il Blueprint
 * 2. Ogni nuovo servizio monitorato deve essere aggiunto anche nel backend (health-monitor.js)
 * 3. Gli alert critici vengono salvati nel database per storico
 * 
 * @version 1.0.0
 * @date 2024-12-29
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  Database, 
  Server, 
  Cloud, 
  Shield, 
  Bot, 
  Globe, 
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  Zap
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.mio-hub.me';

interface ServiceStatus {
  name: string;
  status: 'ok' | 'slow' | 'down';
  latency: number;
  details?: any;
  error?: string;
  lastCheck: string;
}

interface HealthReport {
  status: 'healthy' | 'degraded' | 'critical';
  timestamp: string;
  checkDuration: number;
  services: Record<string, ServiceStatus>;
  alerts: Array<{
    level: 'warning' | 'critical';
    service: string;
    message: string;
  }>;
  summary: {
    total: number;
    healthy: number;
    degraded: number;
    down: number;
  };
}

const serviceIcons: Record<string, any> = {
  database: Database,
  storage: Cloud,
  backend: Server,
  guardian: Shield,
  mio_agent: Bot,
  pdnd: Globe,
  frontend: Activity
};

const serviceColors: Record<string, string> = {
  database: '#06b6d4',
  storage: '#8b5cf6',
  backend: '#10b981',
  guardian: '#f59e0b',
  mio_agent: '#ec4899',
  pdnd: '#3b82f6',
  frontend: '#14b8a6'
};

export default function HealthDashboard() {
  const queryClient = useQueryClient();
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Query health status
  const { data: healthData, isLoading, error, refetch, isFetching } = useQuery<HealthReport>({
    queryKey: ['health-full'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/api/health/full`);
      if (!response.ok) throw new Error('Health check failed');
      return response.json();
    },
    retry: 1,
    refetchInterval: autoRefresh ? 30000 : false, // Auto-refresh ogni 30s
    staleTime: 10000,
  });

  // Query history
  const { data: historyData } = useQuery({
    queryKey: ['health-history'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/api/health/history?limit=20`);
      if (!response.ok) throw new Error('History fetch failed');
      return response.json();
    },
    retry: 1,
    refetchInterval: autoRefresh ? 60000 : false,
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ok':
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'slow':
        return <AlertTriangle className="h-5 w-5 text-yellow-400" />;
      case 'down':
        return <XCircle className="h-5 w-5 text-red-400" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ok':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Online</Badge>;
      case 'slow':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Lento</Badge>;
      case 'down':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Offline</Badge>;
      default:
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Unknown</Badge>;
    }
  };

  const getOverallStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'from-green-500/20 to-green-500/5 border-green-500/30';
      case 'degraded':
        return 'from-yellow-500/20 to-yellow-500/5 border-yellow-500/30';
      case 'critical':
        return 'from-red-500/20 to-red-500/5 border-red-500/30';
      default:
        return 'from-gray-500/20 to-gray-500/5 border-gray-500/30';
    }
  };

  const formatLatency = (ms: number) => {
    if (ms < 100) return <span className="text-green-400">{ms}ms</span>;
    if (ms < 500) return <span className="text-yellow-400">{ms}ms</span>;
    return <span className="text-red-400">{ms}ms</span>;
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('it-IT', {
      timeZone: 'Europe/Rome',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header con Status Generale */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity className="h-6 w-6 text-[#14b8a6]" />
          <h2 className="text-xl font-bold text-[#e8fbff]">Health Monitor</h2>
          {healthData && (
            <Badge className={`${
              healthData.status === 'healthy' ? 'bg-green-500/20 text-green-400' :
              healthData.status === 'degraded' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-red-500/20 text-red-400'
            }`}>
              {healthData.status === 'healthy' ? '✓ Tutti i Servizi Online' :
               healthData.status === 'degraded' ? '⚠ Alcuni Servizi Degradati' :
               '✕ Servizi Critici Offline'}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`border-[#14b8a6]/30 ${autoRefresh ? 'bg-[#14b8a6]/20' : ''}`}
          >
            <Zap className={`h-4 w-4 mr-1 ${autoRefresh ? 'text-[#14b8a6]' : 'text-gray-400'}`} />
            Auto-Refresh {autoRefresh ? 'ON' : 'OFF'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="border-[#14b8a6]/30"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {healthData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className={`bg-gradient-to-br ${getOverallStatusColor(healthData.status)} border`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-[#e8fbff] text-sm">Stato Generale</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">
                {healthData.status === 'healthy' ? (
                  <span className="text-green-400">Operativo</span>
                ) : healthData.status === 'degraded' ? (
                  <span className="text-yellow-400">Degradato</span>
                ) : (
                  <span className="text-red-400">Critico</span>
                )}
              </div>
              <p className="text-xs text-[#e8fbff]/60 mt-1">
                Check: {healthData.checkDuration}ms
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/20 to-green-500/5 border-green-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-[#e8fbff] text-sm">Servizi Online</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-green-400">{healthData.summary.healthy}</div>
              <p className="text-xs text-[#e8fbff]/60 mt-1">di {healthData.summary.total} totali</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 border-yellow-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-[#e8fbff] text-sm">Servizi Lenti</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-yellow-400">{healthData.summary.degraded}</div>
              <p className="text-xs text-[#e8fbff]/60 mt-1">latenza elevata</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500/20 to-red-500/5 border-red-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-[#e8fbff] text-sm">Servizi Offline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-red-400">{healthData.summary.down}</div>
              <p className="text-xs text-[#e8fbff]/60 mt-1">non raggiungibili</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Services Grid */}
      <Card className="bg-[#1a2332] border-[#14b8a6]/30">
        <CardHeader>
          <CardTitle className="text-[#e8fbff] flex items-center gap-2">
            <Server className="h-5 w-5 text-[#14b8a6]" />
            Stato Servizi
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-center py-8 text-red-400">
              <XCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-semibold mb-2">Impossibile contattare il sistema di monitoraggio</p>
              <p className="text-sm text-[#e8fbff]/60">
                Verifica che il backend sia attivo su Hetzner
              </p>
            </div>
          ) : isLoading ? (
            <div className="text-center py-8 text-[#e8fbff]/60">
              <RefreshCw className="h-8 w-8 animate-spin text-[#14b8a6] mx-auto mb-4" />
              Verifica servizi in corso...
            </div>
          ) : healthData ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Object.entries(healthData.services).map(([key, service]) => {
                const Icon = serviceIcons[key] || Server;
                const color = serviceColors[key] || '#14b8a6';
                
                return (
                  <div
                    key={key}
                    className={`p-4 rounded-lg border transition-all ${
                      service.status === 'ok' 
                        ? 'bg-[#0b1220] border-[#14b8a6]/20 hover:border-[#14b8a6]/40' 
                        : service.status === 'slow'
                        ? 'bg-yellow-500/5 border-yellow-500/30 hover:border-yellow-500/50'
                        : 'bg-red-500/5 border-red-500/30 hover:border-red-500/50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div 
                          className="p-2 rounded-lg"
                          style={{ backgroundColor: `${color}20` }}
                        >
                          <Icon className="h-5 w-5" style={{ color }} />
                        </div>
                        <div>
                          <h4 className="font-semibold text-[#e8fbff] text-sm">{service.name}</h4>
                          <p className="text-xs text-[#e8fbff]/50">{key}</p>
                        </div>
                      </div>
                      {getStatusIcon(service.status)}
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[#e8fbff]/60">Stato</span>
                        {getStatusBadge(service.status)}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[#e8fbff]/60">Latenza</span>
                        <span className="text-xs font-mono">
                          {formatLatency(service.latency)}
                        </span>
                      </div>
                      {service.error && (
                        <div className="mt-2 p-2 bg-red-500/10 rounded text-xs text-red-400">
                          {service.error}
                        </div>
                      )}
                      {service.details && (
                        <div className="mt-2 text-xs text-[#e8fbff]/40">
                          {service.details.configured !== undefined && (
                            <span>{service.details.configured ? '✓ Configurato' : '✕ Non configurato'}</span>
                          )}
                          {service.details.uptime && (
                            <span>Uptime: {Math.floor(service.details.uptime / 60)}m</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Alerts Section */}
      {healthData && healthData.alerts.length > 0 && (
        <Card className="bg-[#1a2332] border-red-500/30">
          <CardHeader>
            <CardTitle className="text-[#e8fbff] flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              Alert Attivi ({healthData.alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {healthData.alerts.map((alert, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border ${
                    alert.level === 'critical'
                      ? 'bg-red-500/10 border-red-500/30'
                      : 'bg-yellow-500/10 border-yellow-500/30'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {alert.level === 'critical' ? (
                      <XCircle className="h-4 w-4 text-red-400" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-yellow-400" />
                    )}
                    <span className={`text-sm font-semibold ${
                      alert.level === 'critical' ? 'text-red-400' : 'text-yellow-400'
                    }`}>
                      {alert.level.toUpperCase()}
                    </span>
                    <span className="text-xs text-[#e8fbff]/50">•</span>
                    <span className="text-xs text-[#e8fbff]/70">{alert.service}</span>
                  </div>
                  <p className="text-sm text-[#e8fbff] mt-1">{alert.message}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* History Section */}
      {historyData && historyData.history && historyData.history.length > 0 && (
        <Card className="bg-[#1a2332] border-[#14b8a6]/30">
          <CardHeader>
            <CardTitle className="text-[#e8fbff] flex items-center gap-2">
              <Clock className="h-5 w-5 text-[#14b8a6]" />
              Storico Check (ultimi 20)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {historyData.history.map((check: any, idx: number) => (
                <div
                  key={idx}
                  className={`px-3 py-1 rounded-full text-xs ${
                    check.status === 'healthy'
                      ? 'bg-green-500/20 text-green-400'
                      : check.status === 'degraded'
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}
                  title={`${check.timestamp} - ${check.alerts} alert`}
                >
                  {formatTimestamp(check.timestamp)}
                  {check.alerts > 0 && ` (${check.alerts})`}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Last Update Footer */}
      {healthData && (
        <div className="text-center text-xs text-[#e8fbff]/40">
          Ultimo aggiornamento: {new Date(healthData.timestamp).toLocaleString('it-IT', { timeZone: 'Europe/Rome' })}
          {autoRefresh && ' • Auto-refresh attivo (30s)'}
        </div>
      )}
    </div>
  );
}
