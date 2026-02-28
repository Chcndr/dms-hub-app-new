/**
 * CivicReportsContext - Context per comunicazione tra lista segnalazioni e mappa
 * Permette di centrare la mappa quando si clicca su una segnalazione nella lista
 */
import React, { createContext, useContext, useState, ReactNode } from "react";

interface SelectedReport {
  id: number;
  lat: number;
  lng: number;
  type: string;
}

interface CivicReportsContextType {
  selectedReport: SelectedReport | null;
  setSelectedReport: (report: SelectedReport | null) => void;
}

const CivicReportsContext = createContext<CivicReportsContextType | undefined>(
  undefined
);

export function CivicReportsProvider({ children }: { children: ReactNode }) {
  const [selectedReport, setSelectedReport] = useState<SelectedReport | null>(
    null
  );

  return (
    <CivicReportsContext.Provider value={{ selectedReport, setSelectedReport }}>
      {children}
    </CivicReportsContext.Provider>
  );
}

export function useCivicReports() {
  const context = useContext(CivicReportsContext);
  if (context === undefined) {
    throw new Error(
      "useCivicReports must be used within a CivicReportsProvider"
    );
  }
  return context;
}

export default CivicReportsContext;
