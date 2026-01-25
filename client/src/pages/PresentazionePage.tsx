import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { 
  ChevronLeft, ChevronRight, Home, Maximize2, Minimize2, 
  Download, Play, Pause, Store
} from 'lucide-react';

// URLs delle slide su CDN
const SLIDES = [
  { id: 1, url: 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663032452543/uksymqBnVBNuFnWw.webp', title: 'MIO HUB DMS - Copertina' },
  { id: 2, url: 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663032452543/KhbMUXyDkNedwLpP.webp', title: 'Il Problema: Sistema Frammentato' },
  { id: 3, url: 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663032452543/YdZoDZIOQCncLMjY.webp', title: 'La Soluzione: DMS al Centro' },
  { id: 4, url: 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663032452543/HPdxryhoRbZvhPuu.webp', title: 'Dato di Qualità in Tempo Reale' },
  { id: 5, url: 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663032452543/DKJsuNWvhKsIQpzu.webp', title: 'Automazione SUAP' },
  { id: 6, url: 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663032452543/TYsdtMoiwNRWytIu.webp', title: 'Wallet e Canone' },
  { id: 7, url: 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663032452543/wuuUVxmrLpCrvWqY.webp', title: 'Digitalizzazione Operativa' },
  { id: 8, url: 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663032452543/dockUvcmUkmpVEku.webp', title: 'Carbon Credit' },
  { id: 9, url: 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663032452543/KTwbmTAAvpPUbUcZ.webp', title: 'Bolkestein' },
  { id: 10, url: 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663032452543/MyCgobkxPjeSAEBk.webp', title: 'Ecosistema Connesso' },
  { id: 11, url: 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663032452543/JfMcqtwPFYhPNljw.webp', title: 'Gemello Digitale' },
  { id: 12, url: 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663032452543/ypTbZFiLBCqLYkCM.webp', title: 'AI Agent' },
  { id: 13, url: 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663032452543/KOPzbSPQkKkQiKjl.webp', title: 'Hub Urbani' },
  { id: 14, url: 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663032452543/kNrGqJkFBjddJxSx.webp', title: 'App Cittadino' },
  { id: 15, url: 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663032452543/odCRSiXrsDTHYWcq.webp', title: 'Rinascita Commercio' },
  { id: 16, url: 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663032452543/nbekMsRzHmdZlOpL.webp', title: 'Showcase Reale' },
  { id: 17, url: 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663032452543/ripPjddkJvebgWIQ.webp', title: 'Infrastruttura Abilitante' },
  { id: 18, url: 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663032452543/JNdJeOZhDaidhiZO.webp', title: 'TPASS Esempio' },
  { id: 19, url: 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663032452543/CkqwoVQfpROfCetU.webp', title: 'Risultati Misurabili' },
  { id: 20, url: 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663032452543/LKIGfTsZegKZCvGP.webp', title: 'Conformità Normativa' },
  { id: 21, url: 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663032452543/lvLHOhhOSDWpLZeq.webp', title: 'Investimento' },
  { id: 22, url: 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663032452543/ievKgyqxjnsCXKMX.webp', title: 'Visione Nazionale' },
  { id: 23, url: 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663032452543/WCSgxqUQyKLKPfMA.webp', title: 'Citazione Istituzionale' },
  { id: 24, url: 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663032452543/qkoukfIGPkqQeklp.webp', title: 'Call to Action' },
];

export default function PresentazionePage() {
  const [, setLocation] = useLocation();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAutoplay, setIsAutoplay] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Preload immagini adiacenti
  useEffect(() => {
    const preloadImages = [
      currentSlide > 0 ? SLIDES[currentSlide - 1].url : null,
      SLIDES[currentSlide].url,
      currentSlide < SLIDES.length - 1 ? SLIDES[currentSlide + 1].url : null,
    ].filter(Boolean);

    preloadImages.forEach(url => {
      if (url) {
        const img = new Image();
        img.src = url;
      }
    });
  }, [currentSlide]);

  // Autoplay
  useEffect(() => {
    if (!isAutoplay) return;
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev < SLIDES.length - 1 ? prev + 1 : 0));
    }, 5000);
    return () => clearInterval(interval);
  }, [isAutoplay]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === ' ') {
      e.preventDefault();
      setCurrentSlide(prev => Math.min(prev + 1, SLIDES.length - 1));
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setCurrentSlide(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Escape') {
      if (isFullscreen) {
        document.exitFullscreen?.();
        setIsFullscreen(false);
      }
    } else if (e.key === 'f' || e.key === 'F') {
      toggleFullscreen();
    }
  }, [isFullscreen]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsLoading(true);
  };

  const nextSlide = () => {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide(prev => prev + 1);
      setIsLoading(true);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
      setIsLoading(true);
    }
  };

  return (
    <div className={`min-h-screen bg-[#0a1628] flex flex-col ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Header */}
      {!isFullscreen && (
        <header className="bg-primary/95 backdrop-blur-sm text-primary-foreground p-4 shadow-lg border-b border-primary/20">
          <div className="w-full px-4 md:px-8 flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setLocation('/')}>
              <Store className="w-8 h-8" />
              <div>
                <h1 className="text-xl font-bold">DMS Hub</h1>
                <p className="text-xs opacity-90">Gemello Digitale del Commercio</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation('/')}
                className="bg-primary-foreground/10 border-primary-foreground/30 hover:bg-primary-foreground/20 text-primary-foreground"
              >
                <Home className="w-4 h-4 mr-2" />
                Home
              </Button>
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 relative">
        {/* Slide Container */}
        <div className="relative w-full max-w-6xl aspect-video bg-black/50 rounded-lg overflow-hidden shadow-2xl">
          {/* Loading indicator */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          
          {/* Slide Image */}
          <img
            src={SLIDES[currentSlide].url}
            alt={SLIDES[currentSlide].title}
            className="w-full h-full object-contain"
            onLoad={() => setIsLoading(false)}
            draggable={false}
          />

          {/* Navigation Arrows */}
          <button
            onClick={prevSlide}
            disabled={currentSlide === 0}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 rounded-full text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          <button
            onClick={nextSlide}
            disabled={currentSlide === SLIDES.length - 1}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 rounded-full text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRight className="w-8 h-8" />
          </button>

          {/* Slide Counter */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 px-4 py-2 rounded-full text-white text-sm font-medium">
            {currentSlide + 1} / {SLIDES.length}
          </div>
        </div>

        {/* Controls Bar */}
        <div className="mt-6 flex items-center gap-4 flex-wrap justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAutoplay(!isAutoplay)}
            className="bg-white/10 border-white/30 hover:bg-white/20 text-white"
          >
            {isAutoplay ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
            {isAutoplay ? 'Pausa' : 'Auto'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleFullscreen}
            className="bg-white/10 border-white/30 hover:bg-white/20 text-white"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4 mr-2" /> : <Maximize2 className="w-4 h-4 mr-2" />}
            {isFullscreen ? 'Esci' : 'Fullscreen'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open('https://files.manuscdn.com/user_upload_by_module/session_file/310419663032452543/NOayPdmvIaypDakv.pdf', '_blank')}
            className="bg-white/10 border-white/30 hover:bg-white/20 text-white"
          >
            <Download className="w-4 h-4 mr-2" />
            Scarica PDF
          </Button>
        </div>

        {/* Slide Title */}
        <div className="mt-4 text-center">
          <h2 className="text-xl font-semibold text-white">{SLIDES[currentSlide].title}</h2>
        </div>

        {/* Thumbnail Navigation */}
        <div className="mt-6 w-full max-w-6xl overflow-x-auto pb-4">
          <div className="flex gap-2 justify-center min-w-max px-4">
            {SLIDES.map((slide, index) => (
              <button
                key={slide.id}
                onClick={() => goToSlide(index)}
                className={`relative w-20 h-12 rounded overflow-hidden border-2 transition-all flex-shrink-0 ${
                  index === currentSlide 
                    ? 'border-primary ring-2 ring-primary/50' 
                    : 'border-white/20 hover:border-white/50'
                }`}
              >
                <img
                  src={slide.url}
                  alt={`Slide ${index + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <span className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs py-0.5">
                  {index + 1}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Keyboard hints */}
        <div className="mt-4 text-white/50 text-sm text-center">
          <span className="hidden md:inline">
            Usa ← → per navigare • Spazio per avanzare • F per fullscreen • Esc per uscire
          </span>
          <span className="md:hidden">
            Swipe o usa le frecce per navigare
          </span>
        </div>
      </main>

      {/* Fullscreen exit button */}
      {isFullscreen && (
        <button
          onClick={toggleFullscreen}
          className="fixed top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white z-50"
        >
          <Minimize2 className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}
