/**
 * ProtectedRoute - Wrapper che richiede autenticazione per accedere a una route.
 * Redirige a /login se l'utente non è autenticato.
 * Se adminOnly=true, richiede che l'utente sia super_admin o abbia ruolo admin/pa.
 */
import { useFirebaseAuth } from "@/contexts/FirebaseAuthContext";
import { useLocation } from "wouter";

interface ProtectedRouteProps {
  component: React.ComponentType<any>;
  adminOnly?: boolean;
}

export default function ProtectedRoute({
  component: Component,
  adminOnly = false,
  ...rest
}: ProtectedRouteProps) {
  const { isAuthenticated, loading, user } = useFirebaseAuth();
  const [, setLocation] = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-teal-400 animate-pulse text-lg">
          Caricamento...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    setLocation("/login");
    return null;
  }

  if (adminOnly) {
    const isAdmin = user?.isSuperAdmin || user?.role === "pa";
    if (!isAdmin) {
      setLocation("/");
      return null;
    }
  }

  return <Component {...rest} />;
}
