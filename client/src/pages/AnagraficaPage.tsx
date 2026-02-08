/**
 * Anagrafica Impresa - Placeholder
 * Pagina per gestire anagrafica, posteggi e dati impresa
 * v3.70.0
 */

import { useLocation } from 'wouter';
import { 
  Menu, ArrowLeft, Building2, MapPin, FileText, Users, Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function AnagraficaPage() {
  const [, setLocation] = useLocation();

  const menuItems = [
    { icon: Building2, label: 'Dati Impresa', description: 'Gestisci i dati anagrafici della tua impresa', disabled: true },
    { icon: MapPin, label: 'Posteggi', description: 'Visualizza i posteggi assegnati', disabled: true },
    { icon: FileText, label: 'Documenti', description: 'Gestisci documenti e certificati', disabled: true },
    { icon: Users, label: 'Collaboratori', description: 'Gestisci i collaboratori autorizzati', disabled: true },
    { icon: Settings, label: 'Impostazioni', description: 'Preferenze e notifiche', disabled: true },
  ];

  return (
    <div className="min-h-screen bg-[#0b1220] text-[#e8fbff]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1a2332] to-[#0b1220] border-b border-[#14b8a6]/20 p-2 sm:p-4">
        <div className="w-full sm:container sm:mx-auto flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setLocation('/')}
            className="text-[#e8fbff]/70 hover:text-[#e8fbff] px-1 sm:px-3"
          >
            <ArrowLeft className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Torna alla Home</span>
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#14b8a6] to-[#3b82f6] flex items-center justify-center">
              <Menu className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#e8fbff]">Anagrafica</h1>
              <p className="text-sm text-[#e8fbff]/50">Gestione dati impresa</p>
            </div>
          </div>
          <div className="w-8 sm:w-24" /> {/* Spacer per centrare */}
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full px-1 sm:container sm:mx-auto sm:p-6 p-2">
        <Card className="bg-[#1a2332] border-[#14b8a6]/20 mb-3 sm:mb-6">
          <CardHeader>
            <CardTitle className="text-[#e8fbff] flex items-center gap-2">
              <Menu className="w-5 h-5 text-[#14b8a6]" />
              Menu Anagrafica
            </CardTitle>
            <CardDescription className="text-[#e8fbff]/50">
              Seleziona una sezione per gestire i dati della tua impresa
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {menuItems.map((item, index) => (
                <button
                  key={index}
                  disabled={item.disabled}
                  className={`p-4 rounded-lg border text-left transition-all ${
                    item.disabled 
                      ? 'bg-[#0b1220]/50 border-[#14b8a6]/10 opacity-50 cursor-not-allowed'
                      : 'bg-[#0b1220] border-[#14b8a6]/20 hover:border-[#14b8a6]/50 hover:bg-[#14b8a6]/5'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#14b8a6]/10 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-5 h-5 text-[#14b8a6]" />
                    </div>
                    <div>
                      <h3 className="font-medium text-[#e8fbff]">{item.label}</h3>
                      <p className="text-sm text-[#e8fbff]/50">{item.description}</p>
                      {item.disabled && (
                        <span className="text-xs text-[#f59e0b] mt-1 inline-block">
                          In sviluppo
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="bg-[#14b8a6]/10 border-[#14b8a6]/30">
          <CardContent className="p-4">
            <p className="text-sm text-[#e8fbff]/70 text-center">
              🚧 Questa sezione è in fase di sviluppo. Le funzionalità saranno disponibili a breve.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
