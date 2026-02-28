import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface Tariff {
  id: number;
  market_id: number;
  year: number;
  tariff_per_sqm: string;
  market_days_per_year: number;
  created_at: string;
}

interface MarketTariffSettingsProps {
  marketId: number;
  marketName: string;
}

export function MarketTariffSettings({
  marketId,
  marketName,
}: MarketTariffSettingsProps) {
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [loading, setLoading] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear());
  const [tariffPerSqm, setTariffPerSqm] = useState("");
  const [marketDays, setMarketDays] = useState("");

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

  useEffect(() => {
    if (marketId) {
      fetchTariffs();
    }
  }, [marketId]);

  const fetchTariffs = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/tariffs/${marketId}`);
      const data = await response.json();
      if (data.success) {
        setTariffs(data.data);
        // Pre-fill with current year if exists
        const currentYearTariff = data.data.find(
          (t: Tariff) => t.year === new Date().getFullYear()
        );
        if (currentYearTariff) {
          setTariffPerSqm(currentYearTariff.tariff_per_sqm);
          setMarketDays(currentYearTariff.market_days_per_year.toString());
        } else {
          setTariffPerSqm("");
          setMarketDays("");
        }
      }
    } catch (error) {
      console.error("Error fetching tariffs:", error);
      toast.error("Errore nel caricamento delle tariffe");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!tariffPerSqm || !marketDays) {
      toast.error("Inserisci tariffa e giorni di mercato");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/tariffs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          market_id: marketId,
          year: year,
          tariff_per_sqm: parseFloat(tariffPerSqm),
          market_days_per_year: parseInt(marketDays),
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success("Tariffa salvata con successo");
        fetchTariffs();
      } else {
        toast.error("Errore nel salvataggio: " + data.error);
      }
    } catch (error) {
      console.error("Error saving tariff:", error);
      toast.error("Errore di connessione");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mt-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">
          Configurazione Tariffe - {marketName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label htmlFor="year">Anno</Label>
              <Input
                id="year"
                type="number"
                value={year}
                onChange={e => setYear(parseInt(e.target.value))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="tariff">€/mq</Label>
              <Input
                id="tariff"
                type="number"
                step="0.01"
                value={tariffPerSqm}
                onChange={e => setTariffPerSqm(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="days">Giorni/Anno</Label>
              <Input
                id="days"
                type="number"
                value={marketDays}
                onChange={e => setMarketDays(e.target.value)}
                placeholder="52"
              />
            </div>
          </div>

          <Button onClick={handleSave} disabled={loading} className="w-full">
            {loading ? "Salvataggio..." : "Salva Tariffa"}
          </Button>

          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2 text-gray-500">
              Storico Tariffe
            </h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {tariffs.length === 0 ? (
                <p className="text-xs text-gray-400">
                  Nessuna tariffa configurata
                </p>
              ) : (
                tariffs.map(t => (
                  <div
                    key={t.id}
                    className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded"
                  >
                    <span className="font-medium">{t.year}</span>
                    <div className="text-right">
                      <div className="font-bold">
                        € {Number(t.tariff_per_sqm).toFixed(2)} /mq
                      </div>
                      <div className="text-xs text-gray-500">
                        {t.market_days_per_year} giorni
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
