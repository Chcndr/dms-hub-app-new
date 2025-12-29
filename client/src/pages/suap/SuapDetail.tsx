import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle2, XCircle, AlertTriangle, Play, FileText, Clock } from 'lucide-react';
import { getSuapPraticaById, evaluateSuapPratica, SuapPratica, SuapEvento, SuapCheck } from '@/api/suap';
import { Link, useRoute } from 'wouter';
import { toast } from 'sonner';

export default function SuapDetail() {
  const [match, params] = useRoute('/suap/detail/:id');
  const [pratica, setPratica] = useState<SuapPratica & { timeline: SuapEvento[], checks: SuapCheck[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);

  const id = params?.id;

  useEffect(() => {
    if (!id) return;
    loadPratica();
  }, [id]);

  async function loadPratica() {
    try {
      const data = await getSuapPraticaById(id!, 'MOCK_ENTE_001');
      setPratica(data);
    } catch (error) {
      console.error('Failed to load pratica', error);
      toast.error('Errore caricamento pratica');
    } finally {
      setLoading(false);
    }
  }

  async function handleEvaluate() {
    if (!id) return;
    setEvaluating(true);
    try {
      await evaluateSuapPratica(id, 'MOCK_ENTE_001');
      toast.success('Valutazione completata');
      await loadPratica(); // Reload to see updates
    } catch (error) {
      console.error('Evaluation failed', error);
      toast.error('Errore durante la valutazione');
    } finally {
      setEvaluating(false);
    }
  }

  if (loading) return <div className="p-8 text-[#e8fbff]">Caricamento dettaglio...</div>;
  if (!pratica) return <div className="p-8 text-[#e8fbff]">Pratica non trovata</div>;

  return (
    <div className="space-y-8 p-8 bg-[#020817] min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/suap/list">
            <Button variant="ghost" size="icon" className="text-[#e8fbff]/60 hover:text-[#e8fbff]">
              <ArrowLeft className="h-6 w-6" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-[#e8fbff] tracking-tight">{pratica.cui}</h1>
              <Badge variant="outline" className="text-[#e8fbff] border-[#e8fbff]/30">
                {pratica.stato}
              </Badge>
            </div>
            <p className="text-[#e8fbff]/60 mt-2">
              {pratica.tipo_pratica} - {pratica.richiedente_nome} ({pratica.richiedente_cf})
            </p>
          </div>
        </div>
        <div className="flex gap-4">
          <Button 
            onClick={handleEvaluate} 
            disabled={evaluating || pratica.stato === 'APPROVED' || pratica.stato === 'REJECTED'}
            className="bg-[#00f0ff] text-black hover:bg-[#00f0ff]/90"
          >
            {evaluating ? <Clock className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
            Esegui Valutazione
          </Button>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {/* Left Column: Info & Checks */}
        <div className="md:col-span-2 space-y-8">
          {/* Checks Card */}
          <Card className="bg-[#0a1628] border-[#1e293b]">
            <CardHeader>
              <CardTitle className="text-[#e8fbff]">Controlli Automatici</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pratica.checks.length === 0 ? (
                  <p className="text-[#e8fbff]/40 italic">Nessun controllo eseguito ancora.</p>
                ) : (
                  pratica.checks.map((check) => (
                    <div key={check.id} className="flex items-center justify-between p-3 rounded-lg bg-[#1e293b]/30 border border-[#1e293b]">
                      <div className="flex items-center gap-3">
                        {check.esito ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                        <div>
                          <p className="text-sm font-medium text-[#e8fbff]">{check.check_code}</p>
                          <p className="text-xs text-[#e8fbff]/60">Fonte: {check.fonte}</p>
                        </div>
                      </div>
                      <div className="text-xs text-[#e8fbff]/40">
                        {new Date(check.created_at).toLocaleTimeString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Documents Placeholder */}
          <Card className="bg-[#0a1628] border-[#1e293b]">
            <CardHeader>
              <CardTitle className="text-[#e8fbff]">Documentazione</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-32 border-2 border-dashed border-[#1e293b] rounded-lg">
                <p className="text-[#e8fbff]/40">Nessun documento allegato</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Timeline & Score */}
        <div className="space-y-8">
          {/* Score Card */}
          <Card className="bg-[#0a1628] border-[#1e293b]">
            <CardHeader>
              <CardTitle className="text-[#e8fbff]">Punteggio Affidabilità</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <div className="relative flex items-center justify-center h-32 w-32 rounded-full border-8 border-[#1e293b]">
                <span className="text-4xl font-bold text-[#e8fbff]">{pratica.score ?? '-'}</span>
              </div>
              <p className="mt-4 text-sm text-[#e8fbff]/60 text-center">
                Basato su {pratica.checks.length} controlli effettuati
              </p>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card className="bg-[#0a1628] border-[#1e293b]">
            <CardHeader>
              <CardTitle className="text-[#e8fbff]">Timeline Eventi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative border-l border-[#1e293b] ml-2 space-y-6">
                {pratica.timeline.map((event) => (
                  <div key={event.id} className="ml-6 relative">
                    <div className="absolute -left-[29px] h-3 w-3 rounded-full bg-[#00f0ff] border-2 border-[#0a1628]" />
                    <p className="text-xs text-[#e8fbff]/40 mb-1">
                      {new Date(event.created_at).toLocaleString()}
                    </p>
                    <p className="text-sm font-medium text-[#e8fbff]">{event.tipo_evento}</p>
                    <p className="text-xs text-[#e8fbff]/60 mt-1">{event.descrizione}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
