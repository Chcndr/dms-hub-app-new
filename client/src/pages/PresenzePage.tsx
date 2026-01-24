/**
 * Presenze - Redirect all'app DMS Heroku
 * Pagina wrapper che reindirizza all'app per la gestione presenze
 * v3.70.0
 */

import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { 
  ClipboardList, ExternalLink, ArrowLeft, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const HEROKU_APP_URL = 'https://lapsy-dms.herokuapp.com/index.html';

export default function PresenzePage() {
  const [, setLocation] = useLocation();
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    // Countdown e redirect automatico
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          window.open(HEROKU_APP_URL, '_blank');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleOpenNow = () => {
    window.open(HEROKU_APP_URL, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#0b1220] text-[#e8fbff] flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1a2332] to-[#0b1220] border-b border-[#14b8a6]/20 p-4">
        <div className="container mx-auto flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setLocation('/')}
            className="text-[#e8fbff]/70 hover:text-[#e8fbff]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Torna alla Home
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <Card className="bg-[#1a2332] border-[#14b8a6]/20 max-w-md w-full">
          <CardContent className="p-8 text-center space-y-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-[#14b8a6] to-[#3b82f6] flex items-center justify-center">
              <ClipboardList className="w-10 h-10 text-white" />
            </div>
            
            <div>
              <h1 className="text-2xl font-bold text-[#e8fbff] mb-2">
                Gestione Presenze
              </h1>
              <p className="text-[#e8fbff]/60">
                Stai per essere reindirizzato all'app per la gestione delle presenze in mercato
              </p>
            </div>

            {countdown > 0 ? (
              <div className="flex items-center justify-center gap-3 text-[#14b8a6]">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Apertura in {countdown} secondi...</span>
              </div>
            ) : (
              <p className="text-green-400">App aperta in una nuova scheda</p>
            )}

            <div className="space-y-3">
              <Button 
                onClick={handleOpenNow}
                className="w-full bg-[#14b8a6] hover:bg-[#14b8a6]/80 text-white"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Apri Ora
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => setLocation('/')}
                className="w-full border-[#14b8a6]/30 text-[#e8fbff] hover:bg-[#14b8a6]/10"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Torna alla Home
              </Button>
            </div>

            <p className="text-xs text-[#e8fbff]/40">
              L'app si aprirà in una nuova scheda del browser
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
