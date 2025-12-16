import { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Store,
  ArrowLeft,
  Search,
  Star,
  MapPin,
  Phone,
  Mail,
  Leaf,
  Award,
  Facebook,
  Instagram,
  Globe,
  MessageCircle,
  Navigation,
} from 'lucide-react';
import { Link } from 'wouter';
import { toast } from 'sonner';
import { MIHUB_API_BASE_URL } from '@/config/api';

const API_BASE_URL = MIHUB_API_BASE_URL;

interface Product {
  id: string;
  name: string;
  price: number;
  image?: string;
}

interface Impresa {
  id: number;
  denominazione: string;
  partita_iva?: string;
  codice_fiscale?: string;
  settore?: string;
  comune?: string;
  indirizzo?: string;
  telefono?: string;
  email?: string;
  pec?: string;
  rappresentante_legale?: string;
  // Campi vetrina (da aggiungere al database)
  vetrina_immagine_principale?: string;
  vetrina_gallery?: string[];
  vetrina_descrizione?: string;
  social_facebook?: string;
  social_instagram?: string;
  social_website?: string;
  social_whatsapp?: string;
  rating?: number;
  products?: Product[];
}

export default function VetrinePage() {
  const [, params] = useRoute('/vetrine/:id');
  const [, navigate] = useLocation();
  const [imprese, setImprese] = useState<Impresa[]>([]);
  const [selectedImpresa, setSelectedImpresa] = useState<Impresa | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        if (params?.id) {
          // Carica impresa singola
          const response = await fetch(`${API_BASE_URL}/api/imprese/${params.id}`);
          const result = await response.json();
          if (result.success && result.data) {
            setSelectedImpresa(result.data);
          } else {
            toast.error('Impresa non trovata');
            navigate('/vetrine');
          }
        } else {
          // Carica lista imprese
          const response = await fetch(`${API_BASE_URL}/api/imprese`);
          const result = await response.json();
          if (result.success) {
            setImprese(result.data || []);
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Errore nel caricamento dei dati');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [params?.id]);

  const filteredImprese = imprese.filter(
    (impresa) =>
      impresa.denominazione.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (impresa.settore && impresa.settore.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleBookProduct = (product: Product) => {
    toast.success(`Prodotto "${product.name}" prenotato! Ritira in negozio.`);
  };

  const handleNavigate = (impresa: Impresa) => {
    if (impresa.indirizzo) {
      // Integrazione ShoppingRoute - apre pagina route con indirizzo
      navigate(`/route?destination=${encodeURIComponent(impresa.indirizzo)}`);
    } else {
      toast.error('Indirizzo non disponibile');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Caricamento vetrina...</p>
        </div>
      </div>
    );
  }

  // Vista dettaglio impresa
  if (selectedImpresa) {
    const rating = Number(selectedImpresa.rating) || 4.5; // Default rating se non presente

    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="bg-primary text-primary-foreground p-3 shadow-md">
          <div className="container max-w-2xl flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="text-primary-foreground hover:bg-primary-foreground/20"
              onClick={() => navigate('/vetrine')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Store className="h-6 w-6" />
              <h1 className="text-lg font-bold">Vetrina Negozio</h1>
            </div>
          </div>
        </header>

        <div className="container py-6 max-w-4xl space-y-6">
          {/* Immagine Principale */}
          {selectedImpresa.vetrina_immagine_principale && (
            <div className="w-full h-64 rounded-lg overflow-hidden shadow-lg">
              <img
                src={selectedImpresa.vetrina_immagine_principale}
                alt={selectedImpresa.denominazione}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Info Negozio */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">{selectedImpresa.denominazione}</CardTitle>
                  <CardDescription className="mt-1">{selectedImpresa.settore || 'Commercio'}</CardDescription>
                </div>
                <div className="flex items-center gap-1 text-amber-500">
                  <Star className="h-5 w-5 fill-current" />
                  <span className="font-semibold">{rating.toFixed(1)}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Descrizione */}
              {selectedImpresa.vetrina_descrizione && (
                <p className="text-muted-foreground">{selectedImpresa.vetrina_descrizione}</p>
              )}

              {/* Certificazioni/Badge */}
              {selectedImpresa.settore && (
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <Leaf className="h-3 w-3 mr-1" />
                    {selectedImpresa.settore}
                  </Badge>
                </div>
              )}

              {/* Contatti */}
              <div className="space-y-2 text-sm">
                {selectedImpresa.indirizzo && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{selectedImpresa.indirizzo}, {selectedImpresa.comune}</span>
                  </div>
                )}
                {selectedImpresa.telefono && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <a href={`tel:${selectedImpresa.telefono}`} className="hover:text-primary">
                      {selectedImpresa.telefono}
                    </a>
                  </div>
                )}
                {selectedImpresa.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <a href={`mailto:${selectedImpresa.email}`} className="hover:text-primary">
                      {selectedImpresa.email}
                    </a>
                  </div>
                )}
              </div>

              {/* Social Media */}
              {(selectedImpresa.social_facebook || selectedImpresa.social_instagram || 
                selectedImpresa.social_website || selectedImpresa.social_whatsapp) && (
                <div className="pt-4 border-t">
                  <h3 className="text-sm font-semibold mb-3">Seguici su:</h3>
                  <div className="flex gap-3">
                    {selectedImpresa.social_facebook && (
                      <a
                        href={selectedImpresa.social_facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                      >
                        <Facebook className="h-5 w-5" />
                      </a>
                    )}
                    {selectedImpresa.social_instagram && (
                      <a
                        href={selectedImpresa.social_instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-full bg-pink-100 text-pink-600 hover:bg-pink-200 transition-colors"
                      >
                        <Instagram className="h-5 w-5" />
                      </a>
                    )}
                    {selectedImpresa.social_website && (
                      <a
                        href={selectedImpresa.social_website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                      >
                        <Globe className="h-5 w-5" />
                      </a>
                    )}
                    {selectedImpresa.social_whatsapp && (
                      <a
                        href={`https://wa.me/${selectedImpresa.social_whatsapp.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-full bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
                      >
                        <MessageCircle className="h-5 w-5" />
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Azioni */}
              <div className="grid grid-cols-2 gap-3 pt-4">
                {selectedImpresa.telefono && (
                  <Button variant="outline" asChild>
                    <a href={`tel:${selectedImpresa.telefono}`}>
                      <Phone className="h-4 w-4 mr-2" />
                      Chiama
                    </a>
                  </Button>
                )}
                {selectedImpresa.indirizzo && (
                  <Button 
                    variant="outline"
                    onClick={() => handleNavigate(selectedImpresa)}
                  >
                    <Navigation className="h-4 w-4 mr-2" />
                    Come Arrivare
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Gallery Immagini */}
          {selectedImpresa.vetrina_gallery && selectedImpresa.vetrina_gallery.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Galleria Prodotti</CardTitle>
                <CardDescription>Le nostre specialità</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {selectedImpresa.vetrina_gallery.map((imageUrl, index) => (
                    <div
                      key={index}
                      className="aspect-square rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                    >
                      <img
                        src={imageUrl}
                        alt={`Prodotto ${index + 1}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Prodotti (se presenti) */}
          {selectedImpresa.products && selectedImpresa.products.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Prodotti</CardTitle>
                <CardDescription>Catalogo disponibile</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedImpresa.products.map((product) => (
                    <div
                      key={product.id}
                      className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-semibold">{product.name}</h3>
                        <span className="text-lg font-bold text-primary">
                          €{product.price.toFixed(2)}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        className="w-full"
                        onClick={() => handleBookProduct(product)}
                      >
                        Prenota
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  // Vista lista imprese
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground p-3 shadow-md">
        <div className="container max-w-2xl flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/20">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Store className="h-6 w-6" />
            <h1 className="text-lg font-bold">Vetrine Commercianti</h1>
          </div>
        </div>
      </header>

      <div className="container py-6 max-w-4xl space-y-6">
        {/* Ricerca */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca negozio o categoria..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Lista Imprese */}
        <div className="space-y-4">
          {filteredImprese.map((impresa) => (
            <Card
              key={impresa.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate(`/vetrine/${impresa.id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{impresa.denominazione}</CardTitle>
                    <CardDescription>{impresa.settore || 'Commercio'}</CardDescription>
                  </div>
                  <div className="flex items-center gap-1 text-amber-500">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="text-sm font-semibold">{(Number(impresa.rating) || 4.5).toFixed(1)}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  {impresa.vetrina_descrizione || `${impresa.denominazione} - ${impresa.comune}`}
                </p>
                <div className="flex flex-wrap gap-2">
                  {impresa.settore && (
                    <Badge variant="secondary" className="text-xs">
                      {impresa.settore}
                    </Badge>
                  )}
                  {impresa.comune && (
                    <Badge variant="outline" className="text-xs">
                      <MapPin className="h-3 w-3 mr-1" />
                      {impresa.comune}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredImprese.length === 0 && (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              <Store className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nessun negozio trovato</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
