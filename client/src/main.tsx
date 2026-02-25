import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";
import App from "./App";
import { getLoginUrl } from "./const";
import "./index.css";
// Force CDN cache invalidation - timestamp: 1763685966

const queryClient = new QueryClient();

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof Error)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  window.location.href = getLoginUrl();
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);

// Global error monitoring — cattura errori non gestiti e li invia al backend REST
const API_ERROR_URL = `${(import.meta.env.VITE_MIHUB_API_URL || 'https://api.mio-hub.me')}/api/logs/client-error`;

window.addEventListener('error', (event) => {
  if (event.error) {
    fetch(API_ERROR_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: event.error?.message || event.message,
        stack: event.error?.stack?.slice(0, 2000),
        url: window.location.href,
        userAgent: navigator.userAgent,
      }),
    }).catch(() => {});
  }
});

window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  fetch(API_ERROR_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: reason?.message || String(reason),
      stack: reason?.stack?.slice(0, 2000),
      url: window.location.href,
      userAgent: navigator.userAgent,
    }),
  }).catch(() => {});
});

// Registra Service Worker per PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // SW registration failed silently
    });
  });
}
