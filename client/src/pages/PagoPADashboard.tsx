import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, CreditCard, Receipt, FileText } from "lucide-react";
import CompanyWallet from "@/components/CompanyWallet";
import MarketTariffSettings from "@/components/MarketTariffSettings";

export default function PagoPADashboard() {
  const [activeTab, setActiveTab] = useState("wallet");

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Gestione Pagamenti e Wallet</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
          <TabsTrigger value="wallet" className="gap-2">
            <Wallet className="h-4 w-4" />
            Wallet Operatori
          </TabsTrigger>
          <TabsTrigger value="pagopa" className="gap-2">
            <CreditCard className="h-4 w-4" />
            PagoPA
          </TabsTrigger>
          <TabsTrigger value="tariffe" className="gap-2">
            <Receipt className="h-4 w-4" />
            Tariffe
          </TabsTrigger>
          <TabsTrigger value="riconciliazione" className="gap-2">
            <FileText className="h-4 w-4" />
            Riconciliazione
          </TabsTrigger>
        </TabsList>

        <TabsContent value="wallet" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Wallet Operatori Mercatali</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Qui mostriamo il componente CompanyWallet. 
                  In un contesto reale, passeremmo l'ID dell'impresa selezionata.
                  Per ora mostriamo un selettore o una lista generale. */}
              <div className="p-4 border rounded-md bg-muted/20 mb-4">
                <p className="text-sm text-muted-foreground">
                  Seleziona un'impresa per visualizzare il dettaglio del wallet.
                  (Demo: visualizzazione per impresa ID 1)
                </p>
              </div>
              <CompanyWallet companyId={1} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pagopa" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Storico Ricariche PagoPA</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-10 text-muted-foreground">
                Funzionalità di storico globale ricariche in arrivo.
                Vedi il dettaglio nel tab "Wallet Operatori".
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tariffe" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurazione Tariffe Mercatali</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 border rounded-md bg-muted/20 mb-4">
                <p className="text-sm text-muted-foreground">
                  Configura le tariffe annuali per i mercati.
                  (Demo: visualizzazione per mercato ID 1)
                </p>
              </div>
              <MarketTariffSettings marketId={1} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="riconciliazione" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Riconciliazione Giornaliera</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-10 space-y-4">
                <FileText className="h-16 w-16 text-muted-foreground/50" />
                <p className="text-muted-foreground">
                  Nessuna riconciliazione pendente per oggi.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
