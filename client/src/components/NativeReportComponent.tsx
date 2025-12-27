import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Store, MapPin, Wallet, Bot, Network, 
  FileText, Database, Code, ArrowRight, Download,
  LayoutDashboard, Shield, Activity, Layers, Server, Cpu
} from 'lucide-react';

// Definizione delle slide e dei metadati (riutilizzati dal SystemBlueprintNavigator)
const BLUEPRINT_SLIDES = {
  overview: [
    { id: 'ecosystem', title: 'Ecosistema DMS Hub', image: '/ecosystem_overview_generated.webp', desc: 'Panoramica architetturale completa' },
    { id: 'core', title: 'Core Business', image: '/core_business_generated.webp', desc: 'Gestione mercati e flussi operativi' },
    { id: 'integrations', title: 'Integrazioni', image: '/integrations_generated.webp', desc: 'Connettori TPER, Guardian e AI' },
    { id: 'updates', title: 'Blueprint Updates', image: '/blueprint_updates_generated.webp', desc: 'Stato aggiornato del sistema' }
  ],
  modules: [
    { 
      id: 'markets', 
      title: 'Gestione Mercati', 
      icon: Store,
      image: '/tech_markets_generated.webp',
      color: 'text-[#14b8a6]',
      borderColor: 'border-[#14b8a6]',
      desc: 'Modulo core per anagrafiche e assegnazioni'
    },
    { 
      id: 'gis', 
      title: 'GIS & Mappe', 
      icon: MapPin,
      image: '/tech_gis_generated.webp',
      color: 'text-[#10b981]',
      borderColor: 'border-[#10b981]',
      desc: 'Visualizzazione geospaziale avanzata'
    },
    { 
      id: 'wallet', 
      title: 'Wallet & Finanza', 
      icon: Wallet,
      image: '/tech_wallet_generated.webp',
      color: 'text-[#f59e0b]',
      borderColor: 'border-[#f59e0b]',
      desc: 'Gestione finanziaria e PagoPA'
    },
    { 
      id: 'agents', 
      title: 'MIO Agent & AI', 
      icon: Bot,
      image: '/tech_agents_generated.webp',
      color: 'text-[#8b5cf6]',
      borderColor: 'border-[#8b5cf6]',
      desc: 'Orchestrazione agenti autonomi'
    },
    { 
      id: 'integrations', 
      title: 'Connettività', 
      icon: Network,
      image: '/tech_integrations_generated.webp',
      color: 'text-[#06b6d4]',
      borderColor: 'border-[#06b6d4]',
      desc: 'Ponte verso sistemi esterni'
    }
  ]
};

export function NativeReportComponent() {
  const [activeTab, setActiveTab] = useState('architecture');
  const [activeModule, setActiveModule] = useState(BLUEPRINT_SLIDES.modules[0]);

  const renderContent = () => {
    switch (activeTab) {
      case 'architecture':
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Sidebar: Module Navigation */}
              <div className="lg:col-span-4 space-y-4">
                <Card className="bg-[#1a2332] border-[#06b6d4]/30 h-full">
                  <CardHeader>
                    <CardTitle className="text-[#e8fbff] text-lg">Moduli di Sistema</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {BLUEPRINT_SLIDES.modules.map((module) => (
                      <div 
                        key={module.id}
                        onClick={() => setActiveModule(module)}
                        className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 group ${
                          activeModule.id === module.id 
                            ? `bg-[#0b1220] ${module.borderColor} shadow-[0_0_15px_rgba(6,182,212,0.15)]` 
                            : 'bg-[#0b1220]/50 border-transparent hover:bg-[#0b1220] hover:border-[#e8fbff]/10'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-md bg-[#1a2332] ${module.color}`}>
                              <module.icon className="h-5 w-5" />
                            </div>
                            <div>
                              <h3 className={`font-semibold ${activeModule.id === module.id ? 'text-[#e8fbff]' : 'text-[#e8fbff]/70'}`}>
                                {module.title}
                              </h3>
                              <p className="text-xs text-[#e8fbff]/40">{module.desc}</p>
                            </div>
                          </div>
                          <ArrowRight className={`h-4 w-4 transition-transform ${
                            activeModule.id === module.id ? 'text-[#06b6d4] translate-x-1' : 'text-[#e8fbff]/20'
                          }`} />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Right Content: Interactive Blueprint Visualization */}
              <div className="lg:col-span-8">
                <Card className="bg-[#0b1220] border-[#06b6d4]/30 overflow-hidden h-full flex flex-col">
                  <div className="relative flex-1 min-h-[500px] bg-black/40 group">
                    {/* Main Slide Image */}
                    <img 
                      src={activeModule.image} 
                      alt={activeModule.title}
                      className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-[1.02]"
                    />
                    
                    {/* Overlay Info */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#0b1220] via-[#0b1220]/90 to-transparent p-6 pt-12">
                      <div className="flex items-center gap-3 mb-2">
                        <activeModule.icon className={`h-6 w-6 ${activeModule.color}`} />
                        <h3 className="text-2xl font-bold text-[#e8fbff]">{activeModule.title}</h3>
                      </div>
                      <p className="text-[#e8fbff]/80 max-w-2xl">
                        Visualizzazione tecnica dell'architettura, dei flussi dati e dei componenti core del modulo.
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        );
      case 'dataflow':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
             {BLUEPRINT_SLIDES.overview.map((slide) => (
              <Card 
                key={slide.id}
                className="bg-[#1a2332] border-[#06b6d4]/20 hover:border-[#06b6d4]/50 transition-colors cursor-pointer group overflow-hidden"
                onClick={() => window.open(slide.image, '_blank')}
              >
                <div className="h-48 overflow-hidden relative">
                  <img 
                    src={slide.image} 
                    alt={slide.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-80 group-hover:opacity-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1a2332] to-transparent" />
                </div>
                <CardContent className="pt-4 relative">
                  <h4 className="text-[#e8fbff] font-semibold mb-1 group-hover:text-[#06b6d4] transition-colors">
                    {slide.title}
                  </h4>
                  <p className="text-sm text-[#e8fbff]/50">
                    {slide.desc}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        );
      case 'database':
        return (
          <div className="p-8 text-center text-[#e8fbff]/60 animate-in fade-in duration-300">
            <Database className="h-16 w-16 mx-auto mb-4 text-[#06b6d4]/40" />
            <h3 className="text-xl font-semibold text-[#e8fbff] mb-2">Struttura Database</h3>
            <p>Visualizzazione schema ER e relazioni tra le 57 tabelle del sistema.</p>
            <Button className="mt-6 bg-[#06b6d4] hover:bg-[#06b6d4]/80" onClick={() => window.open('/drizzle/schema.ts', '_blank')}>
              <Code className="h-4 w-4 mr-2" />
              Vedi Schema Code
            </Button>
          </div>
        );
      case 'components':
        return (
          <div className="p-8 text-center text-[#e8fbff]/60 animate-in fade-in duration-300">
            <Layers className="h-16 w-16 mx-auto mb-4 text-[#a855f7]/40" />
            <h3 className="text-xl font-semibold text-[#e8fbff] mb-2">Componenti Frontend</h3>
            <p>Catalogo dei componenti React riutilizzabili e design system.</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-[800px] bg-[#0b1220] rounded-xl border border-[#1e293b] overflow-hidden">
      {/* Sidebar di Navigazione */}
      <div className="w-64 bg-[#1a2332] border-r border-[#1e293b] flex flex-col">
        <div className="p-6 border-b border-[#1e293b]">
          <h2 className="text-xl font-bold text-[#e8fbff] flex items-center gap-2">
            <Activity className="h-6 w-6 text-[#a855f7]" />
            Analisi Sistema
          </h2>
          <p className="text-xs text-[#e8fbff]/50 mt-1">MioHub Technical Report</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => setActiveTab('architecture')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'architecture' 
                ? 'bg-[#a855f7]/10 text-[#a855f7]' 
                : 'text-[#e8fbff]/70 hover:bg-[#e8fbff]/5 hover:text-[#e8fbff]'
            }`}
          >
            <Server className="h-4 w-4" />
            Architettura
          </button>
          
          <button
            onClick={() => setActiveTab('dataflow')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'dataflow' 
                ? 'bg-[#a855f7]/10 text-[#a855f7]' 
                : 'text-[#e8fbff]/70 hover:bg-[#e8fbff]/5 hover:text-[#e8fbff]'
            }`}
          >
            <Activity className="h-4 w-4" />
            Flusso Dati
          </button>
          
          <button
            onClick={() => setActiveTab('database')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'database' 
                ? 'bg-[#a855f7]/10 text-[#a855f7]' 
                : 'text-[#e8fbff]/70 hover:bg-[#e8fbff]/5 hover:text-[#e8fbff]'
            }`}
          >
            <Database className="h-4 w-4" />
            Database
          </button>
          
          <button
            onClick={() => setActiveTab('components')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'components' 
                ? 'bg-[#a855f7]/10 text-[#a855f7]' 
                : 'text-[#e8fbff]/70 hover:bg-[#e8fbff]/5 hover:text-[#e8fbff]'
            }`}
          >
            <Layers className="h-4 w-4" />
            Componenti
          </button>
        </nav>

        <div className="p-4 border-t border-[#1e293b]">
          <Button 
            variant="outline" 
            className="w-full border-[#06b6d4]/30 text-[#06b6d4] hover:bg-[#06b6d4]/10"
            onClick={() => window.open('/BLUEPRINT.md', '_blank')}
          >
            <Download className="h-4 w-4 mr-2" />
            Scarica Report
          </Button>
        </div>
      </div>

      {/* Area Contenuto Principale */}
      <div className="flex-1 overflow-y-auto bg-[#0b1220] p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#e8fbff] mb-2">
              {activeTab === 'architecture' && 'Panoramica Architetturale'}
              {activeTab === 'dataflow' && 'Flussi Dati & Processi'}
              {activeTab === 'database' && 'Schema Database'}
              {activeTab === 'components' && 'Libreria Componenti'}
            </h1>
            <p className="text-[#e8fbff]/60">
              {activeTab === 'architecture' && 'Struttura ad alto livello del sistema DMS HUB e moduli core.'}
              {activeTab === 'dataflow' && 'Analisi dei flussi informativi tra frontend, backend e servizi esterni.'}
              {activeTab === 'database' && 'Mappatura delle entità e relazioni del database PostgreSQL.'}
              {activeTab === 'components' && 'Documentazione dei componenti UI e delle interfacce utente.'}
            </p>
          </div>

          {renderContent()}
        </div>
      </div>
    </div>
  );
}
