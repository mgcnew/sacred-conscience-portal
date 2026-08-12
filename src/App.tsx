import { lazy, useEffect } from "react";
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
import { LazyRoute } from "@/components/shared/RouteErrorBoundary";

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
            <Route path={ROUTES.AUTH} element={<LazyRoute><Auth /></LazyRoute>} />
            <Route
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route path={ROUTES.HOME} element={<LazyRoute><Index /></LazyRoute>} />
              <Route path={ROUTES.ANAMNESE} element={<LazyRoute><Anamnese /></LazyRoute>} />
              <Route path={ROUTES.CERIMONIAS} element={<LazyRoute><Cerimonias /></LazyRoute>} />
              <Route path={ROUTES.CURSOS} element={<LazyRoute><Cursos /></LazyRoute>} />
              <Route path={ROUTES.MEDICINAS} element={<LazyRoute><Medicinas /></LazyRoute>} />
              <Route path={ROUTES.PARTILHAS} element={<LazyRoute><Partilhas /></LazyRoute>} />
              <Route path={ROUTES.GALERIA} element={<LazyRoute><Galeria /></LazyRoute>} />
              <Route path={ROUTES.LOJA} element={<LazyRoute><Loja /></LazyRoute>} />
              <Route path={ROUTES.BIBLIOTECA} element={<LazyRoute><Biblioteca /></LazyRoute>} />
              {/* A rota de upload tem um segmento estático a mais, então o
                  react-router a prioriza sobre /biblioteca/ler/:ebookId. */}
              <Route path={`${ROUTES.LEITURA_UPLOAD}/:ebookId`} element={<LazyRoute><Leitura origem="upload" /></LazyRoute>} />
              <Route path={`${ROUTES.LEITURA}/:ebookId`} element={<LazyRoute><Leitura /></LazyRoute>} />
              <Route path={ROUTES.ESTUDOS} element={<LazyRoute><Estudos /></LazyRoute>} />
              <Route path={ROUTES.ESTUDO_DETALHE} element={<LazyRoute><EstudoDetalhe /></LazyRoute>} />
              <Route path={ROUTES.SOBRE_NOS} element={<LazyRoute><SobreNos /></LazyRoute>} />
              <Route path={ROUTES.HISTORICO} element={<LazyRoute><Historico /></LazyRoute>} />
              <Route path={ROUTES.FAQ} element={<LazyRoute><FAQ /></LazyRoute>} />
              <Route path={ROUTES.EMERGENCIA} element={<LazyRoute><Emergencia /></LazyRoute>} />
              <Route path={ROUTES.CONFIGURACOES} element={<LazyRoute><Settings /></LazyRoute>} />
              <Route path={ROUTES.INSIGHTS} element={<LazyRoute><Insights /></LazyRoute>} />
              <Route path={ROUTES.GUARDIAO_VISOES} element={<LazyRoute><GuardiaoVisoes /></LazyRoute>} />
              <Route
                path={ROUTES.ADMIN}
                element={
                  <ProtectedRoute requireAdmin>
                    <LazyRoute><Admin /></LazyRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path={ROUTES.FINANCEIRO}
                element={
                  <ProtectedRoute requireAdmin>
                    <LazyRoute><Financeiro /></LazyRoute>
                  </ProtectedRoute>
                }
              />
            </Route>
            <Route path="*" element={<LazyRoute><NotFound /></LazyRoute>} />
          </Routes>
        </BrowserRouter>
        </TooltipProvider>
      </NotificationProvider>
    </AuthProvider>
  </QueryClientProvider>
  );
};

export default App;
