import React, { createContext, useContext, useState, useCallback } from 'react';

interface AnimationContextType {
  isAnimating: boolean;
  setAnimating: (animating: boolean) => void;
}

const AnimationContext = createContext<AnimationContextType | undefined>(undefined);

export function AnimationProvider({ children }: { children: React.ReactNode }) {
  const [isAnimating, setIsAnimating] = useState(false);

  const setAnimating = useCallback((animating: boolean) => {
    // Aggiungiamo un piccolo debounce/log per debug
    if (animating) {
      console.log('[AnimationContext] Animazione INIZIATA - Polling in pausa');
    } else {
      console.log('[AnimationContext] Animazione FINITA - Polling ripreso');
    }
    setIsAnimating(animating);
  }, []);

  return (
    <AnimationContext.Provider value={{ isAnimating, setAnimating }}>
      {children}
    </AnimationContext.Provider>
  );
}

export function useAnimation() {
  const context = useContext(AnimationContext);
  if (context === undefined) {
    throw new Error('useAnimation must be used within an AnimationProvider');
  }
  return context;
}
