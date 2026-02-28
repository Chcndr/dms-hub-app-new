import MIHUBDashboard from "@/components/MIHUBDashboard";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function MIHUBPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="h-screen w-full bg-[#0a0f1a] flex flex-col">
      {/* Top Bar */}
      <div className="bg-[#1a2332] border-b border-[#8b5cf6]/30 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setLocation("/dashboard-pa?tab=mio")}
              className="flex items-center gap-2 px-4 py-2 bg-[#8b5cf6]/10 hover:bg-[#8b5cf6]/20 border border-[#8b5cf6]/30 rounded-lg transition-all text-[#e8fbff]"
            >
              <ArrowLeft className="h-4 w-4" />
              Torna alla Dashboard
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <h1 className="text-xl font-bold text-[#e8fbff]">
                MIHUB Control Center
              </h1>
              <p className="text-xs text-[#e8fbff]/50">
                Multi-Agent Coordination System
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[#10b981] rounded-full animate-pulse"></div>
              <span className="text-xs text-[#10b981]">4 Agenti Attivi</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="flex-1 overflow-auto">
        <MIHUBDashboard />
      </div>
    </div>
  );
}
