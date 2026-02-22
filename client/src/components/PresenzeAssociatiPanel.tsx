/**
 * TesseratiAssociazionePanel - Pannello Tesserati dell'Associazione
 * Mostra le imprese tesserate (che pagano la quota annuale) di un'associazione
 * Visibile solo durante impersonificazione associazione
 *
 * Endpoint backend:
 *   GET /api/associazioni/:id/tesseramenti?stats_only=true  → stats
 *   GET /api/associazioni/:id/tesseramenti                  → lista con dati impresa in JOIN
 *
 * @version 2.0.0
 */
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Users, CheckCircle, XCircle, CreditCard,
  RefreshCw, Loader2, Search, Building2, Calendar
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { getImpersonationParams } from '@/hooks/useImpersonation';
import { MIHUB_API_BASE_URL } from '@/config/api';

const API_BASE_URL = MIHUB_API_BASE_URL;

interface Tesseramento {
  id: number;
  associazione_id: number;
  impresa_id: number;
  anno: number;
  data_tesseramento: string;
  data_scadenza?: string;
  quota_annuale?: number;
  stato: 'attivo' | 'scaduto' | 'sospeso' | 'revocato';
  note?: string;
  // Dati impresa dal JOIN
  impresa_nome?: string;
  impresa_codice_fiscale?: string;
  impresa_partita_iva?: string;
  impresa_citta?: string;
}

interface TesseramentiStats {
  totale_tesserati: number;
  attivi: number;
  scaduti: number;
  sospesi: number;
  quota_totale_incassata?: number;
}

const STATO_COLORS: Record<string, { text: string; border: string; bg: string }> = {
  attivo: { text: 'text-[#10b981]', border: 'border-[#10b981]/50', bg: 'bg-[#10b981]' },
  scaduto: { text: 'text-[#ef4444]', border: 'border-[#ef4444]/50', bg: 'bg-[#ef4444]' },
  sospeso: { text: 'text-[#f59e0b]', border: 'border-[#f59e0b]/50', bg: 'bg-[#f59e0b]' },
  revocato: { text: 'text-[#6b7280]', border: 'border-[#6b7280]/50', bg: 'bg-[#6b7280]' },
};

const STATO_LABELS: Record<string, string> = {
  attivo: 'Attivo',
  scaduto: 'Scaduto',
  sospeso: 'Sospeso',
  revocato: 'Revocato',
};

export default function PresenzeAssociatiPanel() {
  const [tesseramenti, setTesseramenti] = useState<Tesseramento[]>([]);
  const [stats, setStats] = useState<TesseramentiStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const impState = getImpersonationParams();
  const associazioneId = impState.associazioneId;
  const associazioneNome = impState.associazioneNome
    ? decodeURIComponent(impState.associazioneNome)
    : null;

  const loadTesseramenti = useCallback(async () => {
    if (!associazioneId) return;
    setLoading(true);
    try {
      // Carica stats
      const statsRes = await fetch(
        `${API_BASE_URL}/api/associazioni/${associazioneId}/tesseramenti?stats_only=true`
      );
      const statsData = await statsRes.json();
      if (statsData.success && statsData.data) {
        setStats(statsData.data);
      }

      // Carica lista tesseramenti
      const res = await fetch(
        `${API_BASE_URL}/api/associazioni/${associazioneId}/tesseramenti`
      );
      const data = await res.json();
      if (data.success && data.data) {
        setTesseramenti(data.data);
      } else {
        setTesseramenti([]);
      }
    } catch (error) {
      console.error('Errore caricamento tesseramenti:', error);
      setTesseramenti([]);
      setStats({
        totale_tesserati: 0,
        attivi: 0,
        scaduti: 0,
        sospesi: 0,
      });
    } finally {
      setLoading(false);
    }
  }, [associazioneId]);

  useEffect(() => {
    loadTesseramenti();
  }, [loadTesseramenti]);

  const filteredTesseramenti = tesseramenti.filter((t) => {
    const query = searchQuery.toLowerCase();
    return (
      (t.impresa_nome?.toLowerCase().includes(query) ?? false) ||
      (t.impresa_codice_fiscale?.toLowerCase().includes(query) ?? false) ||
      (t.impresa_partita_iva?.toLowerCase().includes(query) ?? false) ||
      (t.impresa_citta?.toLowerCase().includes(query) ?? false)
    );
  });

  if (!associazioneId) {
    return (
      <Card className="bg-[#1a2332] border-[#3b82f6]/30">
        <CardContent className="flex items-center justify-center h-40">
          <p className="text-[#e8fbff]/50">Nessuna associazione selezionata</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-[#1a2332] border-[#3b82f6]/30">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-[#e8fbff] flex items-center gap-2">
            <Users className="h-5 w-5 text-[#3b82f6]" />
            Tesserati
            {associazioneNome && (
              <Badge variant="outline" className="ml-2 text-[#3b82f6] border-[#3b82f6]/50">
                {associazioneNome}
              </Badge>
            )}
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={loadTesseramenti}
            className="border-[#3b82f6]/30 text-[#3b82f6]"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardHeader>
      </Card>

      {/* KPI */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-[#1a2332] border-[#3b82f6]/30">
            <CardContent className="pt-4 text-center">
              <Users className="h-6 w-6 mx-auto mb-2 text-[#3b82f6]" />
              <p className="text-2xl font-bold text-[#e8fbff]">{stats.totale_tesserati}</p>
              <p className="text-xs text-[#e8fbff]/60">Tesserati Totali</p>
            </CardContent>
          </Card>
          <Card className="bg-[#1a2332] border-[#10b981]/30">
            <CardContent className="pt-4 text-center">
              <CheckCircle className="h-6 w-6 mx-auto mb-2 text-[#10b981]" />
              <p className="text-2xl font-bold text-[#10b981]">{stats.attivi}</p>
              <p className="text-xs text-[#e8fbff]/60">Attivi</p>
            </CardContent>
          </Card>
          <Card className="bg-[#1a2332] border-[#ef4444]/30">
            <CardContent className="pt-4 text-center">
              <XCircle className="h-6 w-6 mx-auto mb-2 text-[#ef4444]" />
              <p className="text-2xl font-bold text-[#ef4444]">{stats.scaduti}</p>
              <p className="text-xs text-[#e8fbff]/60">Scaduti</p>
            </CardContent>
          </Card>
          <Card className="bg-[#1a2332] border-[#f59e0b]/30">
            <CardContent className="pt-4 text-center">
              <CreditCard className="h-6 w-6 mx-auto mb-2 text-[#f59e0b]" />
              <p className="text-2xl font-bold text-[#f59e0b]">{stats.sospesi}</p>
              <p className="text-xs text-[#e8fbff]/60">Sospesi</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lista */}
      <Card className="bg-[#1a2332] border-[#3b82f6]/30">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-[#e8fbff]/50" />
            <Input
              placeholder="Cerca per nome impresa, CF, P.IVA o citta..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#0b1220] border-[#3b82f6]/20 text-[#e8fbff] placeholder-[#e8fbff]/30"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-[#3b82f6]" />
            </div>
          ) : filteredTesseramenti.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-[#e8fbff]/50">
              <Users className="h-8 w-8 mb-2 opacity-40" />
              <p>Nessun tesseramento trovato</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTesseramenti.map((t) => {
                const colors = STATO_COLORS[t.stato] ?? STATO_COLORS.attivo;
                return (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-3 bg-[#0b1220] rounded-lg border border-[#3b82f6]/10"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${colors.bg}`} />
                      <div>
                        <p className="text-sm font-medium text-[#e8fbff]">
                          {t.impresa_nome ?? `Impresa #${t.impresa_id}`}
                        </p>
                        <p className="text-xs text-[#e8fbff]/50 flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {t.impresa_citta ?? '—'}
                          {t.impresa_partita_iva && (
                            <span>· P.IVA {t.impresa_partita_iva}</span>
                          )}
                        </p>
                        <p className="text-xs text-[#e8fbff]/40 flex items-center gap-1 mt-0.5">
                          <Calendar className="h-3 w-3" />
                          Anno {t.anno}
                          {t.quota_annuale != null && (
                            <span>· Quota: {t.quota_annuale.toFixed(2)} EUR</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={`${colors.text} ${colors.border}`}
                    >
                      {STATO_LABELS[t.stato] ?? t.stato}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
