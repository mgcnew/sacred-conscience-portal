import { lazy, Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import MainLayout from "@/components/layout/MainLayout";
import PWAInstallPrompt from "@/components/pwa/PWAInstallPrompt";
import NotificationPermission from "@/components/pwa/NotificationPermission";
import OneSignalInit from "@/components/pwa/OneSignalInit";
import UpdateNotification from "@/components/UpdateNotification";
import { ROUTES } from "@/constants";

// Páginas críticas - carregamento imediato
import Auth from "./pages/Auth";
import Index from "./pages/Index";

// Lazy loading para páginas secundárias
const Anamnese = lazy(() => import("./pages/Anamnese"));
const Cerimonias = lazy(() => import("./pages/Cerimonias"));
const Cursos = lazy(() => import("./pages/Cursos"));
const Medicinas = lazy(() => import("./pages/Medicinas"));
const Partilhas = lazy(() => import("./pages/Depoimentos"));
const Galeria = lazy(() => import("./pages/Galeria"));
const Loja = lazy(() => import("./pages/Loja"));
const Biblioteca = lazy(() => import("./pages/Biblioteca"));
const Leitura = lazy(() => import("./pages/Leitura"));
const Estudos = lazy(() => import("./pages/Estudos"));
const EstudoDetalhe = lazy(() => import("./pages/EstudoDetalhe"));
const SobreNos = lazy(() => import("./pages/SobreNos"));
const Historico = lazy(() => import("./pages/Historico"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Emergencia = lazy(() => import("./pages/Emergencia"));
const Admin = lazy(() => import("./pages/Admin"));
const Financeiro = lazy(() => import("./pages/Financeiro"));
const Settings = lazy(() => import("./pages/Settings"));
const Insights = lazy(() => import("./pages/Insights"));
const GuardiaoVisoes = lazy(() => import("./pages/GuardiaoVisoes"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Loading fallback minimalista
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

// QueryClient otimizado para mobile
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos - reduz refetches
      gcTime: 1000 * 60 * 30, // 30 minutos em cache
      refetchOnWindowFocus: false, // Evita refetch ao voltar para aba
      retry: 1, // Menos retries = mais rápido em caso de erro
    },
  },
});

const App = () => {
  useEffect(() => {
    const el = document.getElementById('splash-screen');
    if (!el) return;
    const MIN_MS = 2000;
    const elapsed = Date.now() - ((window as any).__splashStart ?? Date.now());
    const delay = Math.max(0, MIN_MS - elapsed);
    const t = setTimeout(() => {
      el.style.opacity = '0';
      setTimeout(() => el.remove(), 700);
    }, delay);
    return () => clearTimeout(t);
  }, []);

  return (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <NotificationProvider>
        <TooltipProvider>
          <Toaster />
          <PWAInstallPrompt />
          <NotificationPermission />
          <OneSignalInit />
          <UpdateNotification />
          <BrowserRouter>
          <Routes>
            <Route path={ROUTES.AUTH} element={<Auth />} />
            <Route
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route path={ROUTES.HOME} element={<Index />} />
              <Route path={ROUTES.ANAMNESE} element={<Suspense fallback={<PageLoader />}><Anamnese /></Suspense>} />
              <Route path={ROUTES.CERIMONIAS} element={<Suspense fallback={<PageLoader />}><Cerimonias /></Suspense>} />
              <Route path={ROUTES.CURSOS} element={<Suspense fallback={<PageLoader />}><Cursos /></Suspense>} />
              <Route path={ROUTES.MEDICINAS} element={<Suspense fallback={<PageLoader />}><Medicinas /></Suspense>} />
              <Route path={ROUTES.PARTILHAS} element={<Suspense fallback={<PageLoader />}><Partilhas /></Suspense>} />
              <Route path={ROUTES.GALERIA} element={<Suspense fallback={<PageLoader />}><Galeria /></Suspense>} />
              <Route path={ROUTES.LOJA} element={<Suspense fallback={<PageLoader />}><Loja /></Suspense>} />
              <Route path={ROUTES.BIBLIOTECA} element={<Suspense fallback={<PageLoader />}><Biblioteca /></Suspense>} />
              <Route path={`${ROUTES.LEITURA}/:ebookId`} element={<Suspense fallback={<PageLoader />}><Leitura /></Suspense>} />
              <Route path={ROUTES.ESTUDOS} element={<Suspense fallback={<PageLoader />}><Estudos /></Suspense>} />
              <Route path={ROUTES.ESTUDO_DETALHE} element={<Suspense fallback={<PageLoader />}><EstudoDetalhe /></Suspense>} />
              <Route path={ROUTES.SOBRE_NOS} element={<Suspense fallback={<PageLoader />}><SobreNos /></Suspense>} />
              <Route path={ROUTES.HISTORICO} element={<Suspense fallback={<PageLoader />}><Historico /></Suspense>} />
              <Route path={ROUTES.FAQ} element={<Suspense fallback={<PageLoader />}><FAQ /></Suspense>} />
              <Route path={ROUTES.EMERGENCIA} element={<Suspense fallback={<PageLoader />}><Emergencia /></Suspense>} />
              <Route path={ROUTES.CONFIGURACOES} element={<Suspense fallback={<PageLoader />}><Settings /></Suspense>} />
              <Route path={ROUTES.INSIGHTS} element={<Suspense fallback={<PageLoader />}><Insights /></Suspense>} />
              <Route path={ROUTES.GUARDIAO_VISOES} element={<Suspense fallback={<PageLoader />}><GuardiaoVisoes /></Suspense>} />
              <Route
                path={ROUTES.ADMIN}
                element={
                  <ProtectedRoute requireAdmin>
                    <Suspense fallback={<PageLoader />}><Admin /></Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path={ROUTES.FINANCEIRO}
                element={
                  <ProtectedRoute requireAdmin>
                    <Suspense fallback={<PageLoader />}><Financeiro /></Suspense>
                  </ProtectedRoute>
                }
              />
            </Route>
            <Route path="*" element={<Suspense fallback={<PageLoader />}><NotFound /></Suspense>} />
          </Routes>
        </BrowserRouter>
        </TooltipProvider>
      </NotificationProvider>
    </AuthProvider>
  </QueryClientProvider>
  );
};

export default App;
