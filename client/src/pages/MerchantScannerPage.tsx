import MerchantQRScanner from '@/components/MerchantQRScanner';

export default function MerchantScannerPage() {
  // In produzione, shopId verrebbe dal contesto di autenticazione del commerciante
  const shopId = 1; // Banco Frutta BIO Mario
  const shopName = "Banco Frutta BIO Mario";

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto">
        <MerchantQRScanner shopId={shopId} shopName={shopName} />
      </div>
    </div>
  );
}
