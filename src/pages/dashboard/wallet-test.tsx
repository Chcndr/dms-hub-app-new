import { useState } from "react";
import { CompanyWallet } from "@/components/CompanyWallet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function WalletTestPage() {
  const [companyId, setCompanyId] = useState("1");
  const [activeId, setActiveId] = useState(1);

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center gap-4 p-4 bg-gray-100 rounded-lg">
        <span className="font-medium">Test Wallet Impresa ID:</span>
        <Input
          className="w-24"
          value={companyId}
          onChange={e => setCompanyId(e.target.value)}
        />
        <Button onClick={() => setActiveId(parseInt(companyId))}>Carica</Button>
      </div>

      <CompanyWallet
        companyId={activeId}
        companyName={`Impresa Test #${activeId}`}
      />
    </div>
  );
}
