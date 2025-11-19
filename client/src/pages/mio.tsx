// Redirect to Dashboard PA MIO Agent tab
import { useEffect } from 'react';
import { useLocation } from 'wouter';

export default function MIOPage() {
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    setLocation('/dashboard-pa?tab=mio');
  }, [setLocation]);
  
  return (
    <div className="flex items-center justify-center h-screen bg-[#0a0f1a]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8b5cf6] mx-auto mb-4"></div>
        <p className="text-[#e8fbff]/70">Reindirizzamento a Dashboard PA...</p>
      </div>
    </div>
  );
}
