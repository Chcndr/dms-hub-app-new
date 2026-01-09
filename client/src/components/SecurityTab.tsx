/**
 * SecurityTab Component - VERSIONE COMPLETA
 * Tab Sicurezza per la DashboardPA con dati reali dal backend
 * Include form per gestione ruoli, permessi, IP blocking
 * 
 * @version 2.0.0
 * @date 9 Gennaio 2026
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Shield,
  Users,
  Key,
  UserCheck,
  AlertCircle,
  Activity,
  Lock,
  Unlock,
  Eye,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Database,
  FileText,
  Settings,
  ChevronRight,
  Plus,
  Edit,
  Trash2,
  Download,
  Ban,
  UserPlus,
  Search,
  Filter
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getSecurityStats,
  getRoles,
  getPermissions,
  getRolePermissionsMatrix,
  getSecurityHealth,
  getSecurityEvents,
  getLoginAttempts,
  getIPBlacklist,
  blockIP,
  unblockIP,
  type SecurityStats,
  type UserRole,
  type Permission,
  type RolePermission,
  type SecurityEvent,
  type LoginAttempt,
  type IPBlacklist
} from '@/api/securityClient';
import { ORCHESTRATORE_API_BASE_URL } from '@/config/api';

export default function SecurityTab() {
  const [activeSubTab, setActiveSubTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Data states
  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [permissionsByCategory, setPermissionsByCategory] = useState<Record<string, Permission[]>>({});
  const [matrix, setMatrix] = useState<RolePermission[]>([]);
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loginAttempts, setLoginAttempts] = useState<LoginAttempt[]>([]);
  const [ipBlacklist, setIPBlacklist] = useState<IPBlacklist[]>([]);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [healthStatus, setHealthStatus] = useState<'healthy' | 'degraded' | 'unhealthy' | 'loading'>('loading');

  // Dialog states
  const [showCreateRoleDialog, setShowCreateRoleDialog] = useState(false);
  const [showAssignRoleDialog, setShowAssignRoleDialog] = useState(false);
  const [showBlockIPDialog, setShowBlockIPDialog] = useState(false);
  const [showResolveEventDialog, setShowResolveEventDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null);
  
  // Form states
  const [newRole, setNewRole] = useState({
    code: '',
    name: '',
    description: '',
    sector: 'pa',
    level: 50,
    can_delegate: false
  });
  
  const [assignRole, setAssignRole] = useState({
    userId: '',
    roleId: '',
    territoryType: 'comune',
    territoryId: ''
  });
  
  const [newBlockIP, setNewBlockIP] = useState({
    ip_address: '',
    reason: '',
    is_permanent: false,
    expires_hours: 24
  });
  
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [
        statsRes,
        rolesRes,
        permissionsRes,
        matrixRes,
        healthRes,
        eventsRes,
        loginsRes,
        blacklistRes
      ] = await Promise.all([
        getSecurityStats(),
        getRoles(),
        getPermissions(),
        getRolePermissionsMatrix(),
        getSecurityHealth(),
        getSecurityEvents({ limit: 20 }),
        getLoginAttempts({ limit: 20 }),
        getIPBlacklist(true)
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (rolesRes.success) setRoles(rolesRes.data);
      if (permissionsRes.success) {
        setPermissions(permissionsRes.data);
        setPermissionsByCategory(permissionsRes.byCategory);
      }
      if (matrixRes.success) setMatrix(matrixRes.data);
      if (healthRes.success) setHealthStatus(healthRes.status as any);
      if (eventsRes.success) setEvents(eventsRes.data);
      if (loginsRes.success) setLoginAttempts(loginsRes.data);
      if (blacklistRes.success) setIPBlacklist(blacklistRes.data);
      
      toast.success('Dati sicurezza caricati');
    } catch (err: any) {
      console.error('Error loading security data:', err);
      setError(err.message);
      toast.error('Errore nel caricamento dati sicurezza');
    } finally {
      setLoading(false);
    }
  };

  // API Actions
  const handleCreateRole = async () => {
    if (!newRole.code || !newRole.name) {
      toast.error('Codice e nome sono obbligatori');
      return;
    }
    
    setActionLoading(true);
    try {
      const response = await fetch(`${ORCHESTRATORE_API_BASE_URL}/api/security/roles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRole)
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Ruolo creato con successo');
        setShowCreateRoleDialog(false);
        setNewRole({ code: '', name: '', description: '', sector: 'pa', level: 50, can_delegate: false });
        loadData();
      } else {
        toast.error(data.error || 'Errore nella creazione del ruolo');
      }
    } catch (err: any) {
      toast.error('Errore: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignRole = async () => {
    if (!assignRole.userId || !assignRole.roleId) {
      toast.error('Utente e ruolo sono obbligatori');
      return;
    }
    
    setActionLoading(true);
    try {
      const response = await fetch(`${ORCHESTRATORE_API_BASE_URL}/api/security/roles/${assignRole.roleId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: parseInt(assignRole.userId),
          territory_type: assignRole.territoryType,
          territory_id: assignRole.territoryId || null
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Ruolo assegnato con successo');
        setShowAssignRoleDialog(false);
        setAssignRole({ userId: '', roleId: '', territoryType: 'comune', territoryId: '' });
        loadData();
      } else {
        toast.error(data.error || 'Errore nell\'assegnazione del ruolo');
      }
    } catch (err: any) {
      toast.error('Errore: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleBlockIP = async () => {
    if (!newBlockIP.ip_address) {
      toast.error('Indirizzo IP obbligatorio');
      return;
    }
    
    // Validate IP format
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(newBlockIP.ip_address)) {
      toast.error('Formato IP non valido');
      return;
    }
    
    setActionLoading(true);
    try {
      const expiresAt = newBlockIP.is_permanent 
        ? null 
        : new Date(Date.now() + newBlockIP.expires_hours * 60 * 60 * 1000).toISOString();
      
      const result = await blockIP({
        ip_address: newBlockIP.ip_address,
        reason: newBlockIP.reason || 'Blocco manuale da Security Tab',
        is_permanent: newBlockIP.is_permanent,
        expires_at: expiresAt || undefined
      });
      
      if (result.success) {
        toast.success(`IP ${newBlockIP.ip_address} bloccato`);
        setShowBlockIPDialog(false);
        setNewBlockIP({ ip_address: '', reason: '', is_permanent: false, expires_hours: 24 });
        loadData();
      }
    } catch (err: any) {
      toast.error('Errore: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnblockIP = async (ip: string) => {
    setActionLoading(true);
    try {
      const result = await unblockIP(ip);
      if (result.success) {
        toast.success(`IP ${ip} sbloccato`);
        loadData();
      }
    } catch (err: any) {
      toast.error('Errore: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolveEvent = async () => {
    if (!selectedEvent) return;
    
    setActionLoading(true);
    try {
      const response = await fetch(`${ORCHESTRATORE_API_BASE_URL}/api/security/events/${selectedEvent.id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolution_notes: resolutionNotes })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Evento risolto');
        setShowResolveEventDialog(false);
        setSelectedEvent(null);
        setResolutionNotes('');
        loadData();
      } else {
        toast.error(data.error || 'Errore nella risoluzione');
      }
    } catch (err: any) {
      toast.error('Errore: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleExportAudit = async () => {
    try {
      window.open(`${ORCHESTRATORE_API_BASE_URL}/api/security/audit/export?format=csv`, '_blank');
      toast.success('Export avviato');
    } catch (err: any) {
      toast.error('Errore export: ' + err.message);
    }
  };

  const getSectorBadgeColor = (sector: string) => {
    switch (sector) {
      case 'system': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'pa': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'commerce': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'inspection': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'services': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      case 'external': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      case 'citizen': return 'bg-teal-500/20 text-teal-400 border-teal-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-500';
      case 'high': return 'text-orange-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin text-[#14b8a6] mx-auto mb-4" />
          <p className="text-[#e8fbff]/60">Caricamento dati sicurezza...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-4" />
          <p className="text-red-400 font-semibold mb-2">Errore nel caricamento</p>
          <p className="text-[#e8fbff]/60 text-sm mb-4">{error}</p>
          <Button onClick={loadData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Riprova
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con Health Status e Azioni */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#e8fbff]">Sicurezza e RBAC</h2>
          <p className="text-[#e8fbff]/60 mt-1">
            Gestione ruoli, permessi e monitoraggio sicurezza
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={
            healthStatus === 'healthy' 
              ? 'bg-green-500/20 text-green-400 border-green-500/30'
              : healthStatus === 'degraded'
              ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
              : 'bg-red-500/20 text-red-400 border-red-500/30'
          }>
            {healthStatus === 'healthy' ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <AlertCircle className="h-3 w-3 mr-1" />}
            {healthStatus.charAt(0).toUpperCase() + healthStatus.slice(1)}
          </Badge>
          <Button onClick={handleExportAudit} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Audit
          </Button>
          <Button onClick={loadData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Aggiorna
          </Button>
        </div>
      </div>

      {/* Sub-tabs */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-[#0a1628]">
          <TabsTrigger value="overview">
            <Shield className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="roles">
            <Users className="h-4 w-4 mr-2" />
            Ruoli ({roles.length})
          </TabsTrigger>
          <TabsTrigger value="permissions">
            <Key className="h-4 w-4 mr-2" />
            Permessi ({permissions.length})
          </TabsTrigger>
          <TabsTrigger value="events">
            <Activity className="h-4 w-4 mr-2" />
            Eventi
          </TabsTrigger>
          <TabsTrigger value="access">
            <Lock className="h-4 w-4 mr-2" />
            Accessi
          </TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-[#1a2332] to-[#0b1220] border-[#14b8a6]/30">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-[#e8fbff]/70">Ruoli Definiti</CardTitle>
                <Users className="h-5 w-5 text-[#14b8a6]" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-[#e8fbff]">{stats?.roles.total || 0}</div>
                <p className="text-xs text-[#e8fbff]/50 mt-1">{stats?.roles.mappings || 0} mappature</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-[#1a2332] to-[#0b1220] border-[#8b5cf6]/30">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-[#e8fbff]/70">Permessi Totali</CardTitle>
                <Key className="h-5 w-5 text-[#8b5cf6]" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-[#8b5cf6]">{stats?.roles.permissions || 0}</div>
                <p className="text-xs text-[#e8fbff]/50 mt-1">{Object.keys(permissionsByCategory).length} categorie</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-[#1a2332] to-[#0b1220] border-[#ef4444]/30">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-[#e8fbff]/70">Eventi Sicurezza</CardTitle>
                <AlertCircle className="h-5 w-5 text-[#ef4444]" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-[#ef4444]">{stats?.security.events.unresolved || 0}</div>
                <p className="text-xs text-[#e8fbff]/50 mt-1">non risolti su {stats?.security.events.total || 0}</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-[#1a2332] to-[#0b1220] border-[#f59e0b]/30">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-[#e8fbff]/70">IP Bloccati</CardTitle>
                <Lock className="h-5 w-5 text-[#f59e0b]" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-[#f59e0b]">{stats?.security.blockedIPs || 0}</div>
                <p className="text-xs text-[#e8fbff]/50 mt-1">attualmente attivi</p>
              </CardContent>
            </Card>
          </div>

          {/* Severity Distribution */}
          <Card className="bg-[#1a2332] border-[#14b8a6]/30">
            <CardHeader>
              <CardTitle className="text-[#e8fbff] flex items-center gap-2">
                <Shield className="h-5 w-5 text-[#14b8a6]" />
                Eventi per Severità (ultimi 7 giorni)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <div className="p-4 bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-lg">
                  <div className="text-2xl font-bold text-[#ef4444] mb-1">{stats?.security.events.critical || 0}</div>
                  <div className="text-sm text-[#e8fbff]/70">Critical</div>
                </div>
                <div className="p-4 bg-[#f59e0b]/10 border border-[#f59e0b]/30 rounded-lg">
                  <div className="text-2xl font-bold text-[#f59e0b] mb-1">{stats?.security.events.high || 0}</div>
                  <div className="text-sm text-[#e8fbff]/70">High</div>
                </div>
                <div className="p-4 bg-[#eab308]/10 border border-[#eab308]/30 rounded-lg">
                  <div className="text-2xl font-bold text-[#eab308] mb-1">{stats?.security.events.medium || 0}</div>
                  <div className="text-sm text-[#e8fbff]/70">Medium</div>
                </div>
                <div className="p-4 bg-[#14b8a6]/10 border border-[#14b8a6]/30 rounded-lg">
                  <div className="text-2xl font-bold text-[#14b8a6] mb-1">{stats?.security.events.low || 0}</div>
                  <div className="text-sm text-[#e8fbff]/70">Low</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Login Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-[#1a2332] border-[#14b8a6]/30">
              <CardHeader>
                <CardTitle className="text-[#e8fbff] flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-[#14b8a6]" />
                  Login (ultimi 7 giorni)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-[#0b1220] rounded-lg">
                    <div className="text-2xl font-bold text-[#e8fbff]">{stats?.logins.total || 0}</div>
                    <div className="text-sm text-[#e8fbff]/70">Totali</div>
                  </div>
                  <div className="text-center p-4 bg-[#10b981]/10 rounded-lg">
                    <div className="text-2xl font-bold text-[#10b981]">{stats?.logins.successful || 0}</div>
                    <div className="text-sm text-[#e8fbff]/70">Successo</div>
                  </div>
                  <div className="text-center p-4 bg-[#ef4444]/10 rounded-lg">
                    <div className="text-2xl font-bold text-[#ef4444]">{stats?.logins.failed || 0}</div>
                    <div className="text-sm text-[#e8fbff]/70">Falliti</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#1a2332] border-[#14b8a6]/30">
              <CardHeader>
                <CardTitle className="text-[#e8fbff] flex items-center gap-2">
                  <Database className="h-5 w-5 text-[#14b8a6]" />
                  Sistema RBAC
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-[#0b1220] rounded-lg">
                    <span className="text-[#e8fbff]/70">Ruoli</span>
                    <span className="text-[#e8fbff] font-bold">{stats?.roles.total || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-[#0b1220] rounded-lg">
                    <span className="text-[#e8fbff]/70">Permessi</span>
                    <span className="text-[#e8fbff] font-bold">{stats?.roles.permissions || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-[#0b1220] rounded-lg">
                    <span className="text-[#e8fbff]/70">Mappature</span>
                    <span className="text-[#e8fbff] font-bold">{stats?.roles.mappings || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ROLES TAB */}
        <TabsContent value="roles" className="space-y-6">
          {/* Actions Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#e8fbff]/50" />
                <Input
                  placeholder="Cerca ruolo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-[#0b1220] border-[#14b8a6]/30 text-[#e8fbff] w-64"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Dialog open={showAssignRoleDialog} onOpenChange={setShowAssignRoleDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Assegna Ruolo
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-[#1a2332] border-[#14b8a6]/30">
                  <DialogHeader>
                    <DialogTitle className="text-[#e8fbff]">Assegna Ruolo a Utente</DialogTitle>
                    <DialogDescription className="text-[#e8fbff]/60">
                      Assegna un ruolo RBAC a un utente del sistema
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label className="text-[#e8fbff]">ID Utente</Label>
                      <Input
                        placeholder="Es: 123"
                        value={assignRole.userId}
                        onChange={(e) => setAssignRole({...assignRole, userId: e.target.value})}
                        className="bg-[#0b1220] border-[#14b8a6]/30 text-[#e8fbff]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[#e8fbff]">Ruolo</Label>
                      <Select value={assignRole.roleId} onValueChange={(v) => setAssignRole({...assignRole, roleId: v})}>
                        <SelectTrigger className="bg-[#0b1220] border-[#14b8a6]/30 text-[#e8fbff]">
                          <SelectValue placeholder="Seleziona ruolo" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1a2332] border-[#14b8a6]/30">
                          {roles.map(role => (
                            <SelectItem key={role.id} value={role.id.toString()} className="text-[#e8fbff]">
                              {role.name} ({role.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[#e8fbff]">Tipo Territorio</Label>
                      <Select value={assignRole.territoryType} onValueChange={(v) => setAssignRole({...assignRole, territoryType: v})}>
                        <SelectTrigger className="bg-[#0b1220] border-[#14b8a6]/30 text-[#e8fbff]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1a2332] border-[#14b8a6]/30">
                          <SelectItem value="comune" className="text-[#e8fbff]">Comune</SelectItem>
                          <SelectItem value="provincia" className="text-[#e8fbff]">Provincia</SelectItem>
                          <SelectItem value="regione" className="text-[#e8fbff]">Regione</SelectItem>
                          <SelectItem value="nazionale" className="text-[#e8fbff]">Nazionale</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[#e8fbff]">ID Territorio (opzionale)</Label>
                      <Input
                        placeholder="Es: ISTAT code"
                        value={assignRole.territoryId}
                        onChange={(e) => setAssignRole({...assignRole, territoryId: e.target.value})}
                        className="bg-[#0b1220] border-[#14b8a6]/30 text-[#e8fbff]"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowAssignRoleDialog(false)}>
                      Annulla
                    </Button>
                    <Button onClick={handleAssignRole} disabled={actionLoading} className="bg-[#14b8a6] hover:bg-[#14b8a6]/80">
                      {actionLoading ? 'Assegnazione...' : 'Assegna'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              
              <Dialog open={showCreateRoleDialog} onOpenChange={setShowCreateRoleDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-[#14b8a6] hover:bg-[#14b8a6]/80">
                    <Plus className="h-4 w-4 mr-2" />
                    Nuovo Ruolo
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-[#1a2332] border-[#14b8a6]/30">
                  <DialogHeader>
                    <DialogTitle className="text-[#e8fbff]">Crea Nuovo Ruolo</DialogTitle>
                    <DialogDescription className="text-[#e8fbff]/60">
                      Definisci un nuovo ruolo nel sistema RBAC
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[#e8fbff]">Codice *</Label>
                        <Input
                          placeholder="es: market_manager"
                          value={newRole.code}
                          onChange={(e) => setNewRole({...newRole, code: e.target.value})}
                          className="bg-[#0b1220] border-[#14b8a6]/30 text-[#e8fbff]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[#e8fbff]">Nome *</Label>
                        <Input
                          placeholder="es: Gestore Mercato"
                          value={newRole.name}
                          onChange={(e) => setNewRole({...newRole, name: e.target.value})}
                          className="bg-[#0b1220] border-[#14b8a6]/30 text-[#e8fbff]"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[#e8fbff]">Descrizione</Label>
                      <Textarea
                        placeholder="Descrizione del ruolo..."
                        value={newRole.description}
                        onChange={(e) => setNewRole({...newRole, description: e.target.value})}
                        className="bg-[#0b1220] border-[#14b8a6]/30 text-[#e8fbff]"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[#e8fbff]">Settore</Label>
                        <Select value={newRole.sector} onValueChange={(v) => setNewRole({...newRole, sector: v})}>
                          <SelectTrigger className="bg-[#0b1220] border-[#14b8a6]/30 text-[#e8fbff]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#1a2332] border-[#14b8a6]/30">
                            <SelectItem value="system" className="text-[#e8fbff]">System</SelectItem>
                            <SelectItem value="pa" className="text-[#e8fbff]">PA</SelectItem>
                            <SelectItem value="commerce" className="text-[#e8fbff]">Commerce</SelectItem>
                            <SelectItem value="inspection" className="text-[#e8fbff]">Inspection</SelectItem>
                            <SelectItem value="services" className="text-[#e8fbff]">Services</SelectItem>
                            <SelectItem value="external" className="text-[#e8fbff]">External</SelectItem>
                            <SelectItem value="citizen" className="text-[#e8fbff]">Citizen</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[#e8fbff]">Livello (10-100)</Label>
                        <Input
                          type="number"
                          min="10"
                          max="100"
                          value={newRole.level}
                          onChange={(e) => setNewRole({...newRole, level: parseInt(e.target.value)})}
                          className="bg-[#0b1220] border-[#14b8a6]/30 text-[#e8fbff]"
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowCreateRoleDialog(false)}>
                      Annulla
                    </Button>
                    <Button onClick={handleCreateRole} disabled={actionLoading} className="bg-[#14b8a6] hover:bg-[#14b8a6]/80">
                      {actionLoading ? 'Creazione...' : 'Crea Ruolo'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Roles List */}
          <Card className="bg-[#1a2332] border-[#14b8a6]/30">
            <CardHeader>
              <CardTitle className="text-[#e8fbff] flex items-center gap-2">
                <Users className="h-5 w-5 text-[#14b8a6]" />
                Ruoli Sistema ({roles.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {roles
                  .filter(role => 
                    searchTerm === '' || 
                    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    role.code.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((role) => (
                  <div 
                    key={role.id}
                    className="flex items-center justify-between p-4 bg-[#0b1220] rounded-lg hover:bg-[#0b1220]/80 cursor-pointer transition-colors"
                    onClick={() => setSelectedRole(selectedRole?.id === role.id ? null : role)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-[#14b8a6]/20 flex items-center justify-center">
                        <span className="text-[#14b8a6] font-bold">{role.level}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[#e8fbff] font-medium">{role.name}</span>
                          {role.is_system && (
                            <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs">
                              System
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-[#e8fbff]/50">{role.code}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge className={getSectorBadgeColor(role.sector)}>
                        {role.sector}
                      </Badge>
                      <div className="text-right">
                        <div className="text-[#14b8a6] font-bold">{role.permissions_count}</div>
                        <div className="text-xs text-[#e8fbff]/50">permessi</div>
                      </div>
                      <ChevronRight className={`h-5 w-5 text-[#e8fbff]/30 transition-transform ${selectedRole?.id === role.id ? 'rotate-90' : ''}`} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Role Detail */}
          {selectedRole && (
            <Card className="bg-[#1a2332] border-[#8b5cf6]/30">
              <CardHeader>
                <CardTitle className="text-[#e8fbff] flex items-center gap-2">
                  <Key className="h-5 w-5 text-[#8b5cf6]" />
                  Permessi di {selectedRole.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-[#e8fbff]/70 mb-4">{selectedRole.description}</div>
                <div className="flex flex-wrap gap-2">
                  {matrix
                    .filter(m => m.role_id === selectedRole.id)
                    .map((m, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {m.permission_code}
                        <span className="ml-1 text-[#14b8a6]">({m.scope})</span>
                      </Badge>
                    ))
                  }
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* PERMISSIONS TAB */}
        <TabsContent value="permissions" className="space-y-6">
          {Object.entries(permissionsByCategory).map(([category, perms]) => (
            <Card key={category} className="bg-[#1a2332] border-[#14b8a6]/30">
              <CardHeader>
                <CardTitle className="text-[#e8fbff] flex items-center gap-2">
                  <Key className="h-5 w-5 text-[#14b8a6]" />
                  {category.charAt(0).toUpperCase() + category.slice(1)} ({perms.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {perms.map((perm) => (
                    <div key={perm.id} className="p-3 bg-[#0b1220] rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[#e8fbff] font-medium text-sm">{perm.code}</span>
                        {perm.is_sensitive && (
                          <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">
                            Sensitive
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-[#e8fbff]/50">{perm.description}</div>
                      <div className="text-xs text-[#14b8a6] mt-1">{perm.roles_count} ruoli</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* EVENTS TAB */}
        <TabsContent value="events" className="space-y-6">
          <Card className="bg-[#1a2332] border-[#14b8a6]/30">
            <CardHeader>
              <CardTitle className="text-[#e8fbff] flex items-center gap-2">
                <Activity className="h-5 w-5 text-[#14b8a6]" />
                Eventi Sicurezza Recenti
              </CardTitle>
            </CardHeader>
            <CardContent>
              {events.length === 0 ? (
                <div className="text-center py-8 text-[#e8fbff]/50">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-[#10b981]" />
                  <p>Nessun evento di sicurezza registrato</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {events.map((event) => (
                    <div key={event.id} className="flex items-center justify-between p-4 bg-[#0b1220] rounded-lg">
                      <div className="flex items-center gap-4">
                        <AlertCircle className={`h-5 w-5 ${getSeverityColor(event.severity)}`} />
                        <div>
                          <div className="text-[#e8fbff] font-medium">{event.event_type}</div>
                          <div className="text-sm text-[#e8fbff]/50">{event.description}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge className={
                          event.is_resolved 
                            ? 'bg-green-500/20 text-green-400 border-green-500/30'
                            : 'bg-red-500/20 text-red-400 border-red-500/30'
                        }>
                          {event.is_resolved ? 'Risolto' : 'Aperto'}
                        </Badge>
                        <div className="text-xs text-[#e8fbff]/50">
                          {new Date(event.created_at).toLocaleString('it-IT')}
                        </div>
                        {!event.is_resolved && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEvent(event);
                              setShowResolveEventDialog(true);
                            }}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Risolvi
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Resolve Event Dialog */}
          <Dialog open={showResolveEventDialog} onOpenChange={setShowResolveEventDialog}>
            <DialogContent className="bg-[#1a2332] border-[#14b8a6]/30">
              <DialogHeader>
                <DialogTitle className="text-[#e8fbff]">Risolvi Evento</DialogTitle>
                <DialogDescription className="text-[#e8fbff]/60">
                  Segna l'evento come risolto e aggiungi note
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {selectedEvent && (
                  <div className="p-3 bg-[#0b1220] rounded-lg">
                    <div className="text-[#e8fbff] font-medium">{selectedEvent.event_type}</div>
                    <div className="text-sm text-[#e8fbff]/50">{selectedEvent.description}</div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label className="text-[#e8fbff]">Note di Risoluzione</Label>
                  <Textarea
                    placeholder="Descrivi come è stato risolto l'evento..."
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    className="bg-[#0b1220] border-[#14b8a6]/30 text-[#e8fbff]"
                    rows={4}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowResolveEventDialog(false)}>
                  Annulla
                </Button>
                <Button onClick={handleResolveEvent} disabled={actionLoading} className="bg-[#14b8a6] hover:bg-[#14b8a6]/80">
                  {actionLoading ? 'Risoluzione...' : 'Segna come Risolto'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ACCESS TAB */}
        <TabsContent value="access" className="space-y-6">
          {/* Block IP Button */}
          <div className="flex justify-end">
            <Dialog open={showBlockIPDialog} onOpenChange={setShowBlockIPDialog}>
              <DialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Ban className="h-4 w-4 mr-2" />
                  Blocca IP
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#1a2332] border-[#ef4444]/30">
                <DialogHeader>
                  <DialogTitle className="text-[#e8fbff]">Blocca Indirizzo IP</DialogTitle>
                  <DialogDescription className="text-[#e8fbff]/60">
                    Aggiungi un IP alla blacklist per bloccare l'accesso
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label className="text-[#e8fbff]">Indirizzo IP *</Label>
                    <Input
                      placeholder="Es: 192.168.1.100"
                      value={newBlockIP.ip_address}
                      onChange={(e) => setNewBlockIP({...newBlockIP, ip_address: e.target.value})}
                      className="bg-[#0b1220] border-[#ef4444]/30 text-[#e8fbff]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#e8fbff]">Motivo</Label>
                    <Textarea
                      placeholder="Motivo del blocco..."
                      value={newBlockIP.reason}
                      onChange={(e) => setNewBlockIP({...newBlockIP, reason: e.target.value})}
                      className="bg-[#0b1220] border-[#ef4444]/30 text-[#e8fbff]"
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="permanent"
                        checked={newBlockIP.is_permanent}
                        onChange={(e) => setNewBlockIP({...newBlockIP, is_permanent: e.target.checked})}
                        className="rounded"
                      />
                      <Label htmlFor="permanent" className="text-[#e8fbff]">Blocco permanente</Label>
                    </div>
                    {!newBlockIP.is_permanent && (
                      <div className="flex items-center gap-2">
                        <Label className="text-[#e8fbff]">Durata (ore):</Label>
                        <Input
                          type="number"
                          min="1"
                          max="8760"
                          value={newBlockIP.expires_hours}
                          onChange={(e) => setNewBlockIP({...newBlockIP, expires_hours: parseInt(e.target.value)})}
                          className="bg-[#0b1220] border-[#ef4444]/30 text-[#e8fbff] w-24"
                        />
                      </div>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowBlockIPDialog(false)}>
                    Annulla
                  </Button>
                  <Button onClick={handleBlockIP} disabled={actionLoading} variant="destructive">
                    {actionLoading ? 'Blocco...' : 'Blocca IP'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Login Attempts */}
            <Card className="bg-[#1a2332] border-[#14b8a6]/30">
              <CardHeader>
                <CardTitle className="text-[#e8fbff] flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-[#14b8a6]" />
                  Tentativi di Login Recenti
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loginAttempts.length === 0 ? (
                  <div className="text-center py-8 text-[#e8fbff]/50">
                    <Clock className="h-12 w-12 mx-auto mb-4" />
                    <p>Nessun tentativo di login registrato</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {loginAttempts.map((attempt) => (
                      <div key={attempt.id} className="flex items-center justify-between p-3 bg-[#0b1220] rounded-lg">
                        <div className="flex items-center gap-3">
                          {attempt.success ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <div>
                            <div className="text-sm text-[#e8fbff]">{attempt.email_attempted}</div>
                            <div className="text-xs text-[#e8fbff]/50">{attempt.ip_address}</div>
                          </div>
                        </div>
                        <div className="text-xs text-[#e8fbff]/50">
                          {new Date(attempt.created_at).toLocaleString('it-IT')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* IP Blacklist */}
            <Card className="bg-[#1a2332] border-[#ef4444]/30">
              <CardHeader>
                <CardTitle className="text-[#e8fbff] flex items-center gap-2">
                  <Lock className="h-5 w-5 text-[#ef4444]" />
                  IP Bloccati ({ipBlacklist.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {ipBlacklist.length === 0 ? (
                  <div className="text-center py-8 text-[#e8fbff]/50">
                    <Unlock className="h-12 w-12 mx-auto mb-4 text-[#10b981]" />
                    <p>Nessun IP bloccato</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {ipBlacklist.map((ip) => (
                      <div key={ip.id} className="flex items-center justify-between p-3 bg-[#0b1220] rounded-lg">
                        <div>
                          <div className="text-sm text-[#e8fbff] font-mono">{ip.ip_address}</div>
                          <div className="text-xs text-[#e8fbff]/50">{ip.reason}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          {ip.is_permanent ? (
                            <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">
                              Permanente
                            </Badge>
                          ) : (
                            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
                              Temporaneo
                            </Badge>
                          )}
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleUnblockIP(ip.ip_address)}
                            disabled={actionLoading}
                          >
                            <Unlock className="h-4 w-4 text-green-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
