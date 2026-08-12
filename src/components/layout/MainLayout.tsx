import React from 'react';
import { Outlet, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Loader2, Info, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ModeToggle } from '@/components/mode-toggle';
import { ROUTES } from '@/constants';
import NotificationBell from '@/components/layout/NotificationBell';
import Sidebar from '@/components/layout/Sidebar';
import BottomNav from '@/components/layout/BottomNav';
import { WelcomeModal, InstallPWAPrompt, AnamneseWelcomeModal } from '@/components/shared';
import CompleteProfileModal from '@/components/shared/CompleteProfileModal';
import PWAUpdatePrompt from '@/components/shared/PWAUpdatePrompt';
import { ScrollToTop } from '@/components/ui/scroll-to-top';
import { useUserAnamnese, useMeuPerfil } from '@/hooks/queries/useProfiles';
import { useCheckPermissao } from '@/components/auth/PermissionGate';

const SIDEBAR_COLLAPSED_KEY = 'sidebar-collapsed';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

const MainLayout: React.FC = () => {
  const { user, isAdmin, signOut } = useAuth();
  const { isSuperAdmin } = useCheckPermissao();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(() => {
    const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    return saved === 'true';
  });

  const { data: profile, isLoading: isProfileLoading } = useMeuPerfil(user?.id);
  const userName = profile?.full_name || '';
  const userAvatar = profile?.avatar_url || null;
  const profileIncomplete = !isProfileLoading && !!user && (!profile?.full_name || !profile?.birth_date);

  // Verificar se usuário tem anamnese preenchida
  const { data: anamnese, isLoading: isLoadingAnamnese } = useUserAnamnese(user?.id);
  
  // Páginas sem footer nem scroll externo (ex: chats)
  const isChatPage = location.pathname === ROUTES.GUARDIAO_VISOES;

  // A leitura ocupa a tela inteira: nada de cabeçalho, barra inferior ou
  // sidebar por cima do livro. Sem isso a navegação do app tapa o rodapé do
  // leitor e o painel de configurações.
  const isLeituraPage = location.pathname.startsWith(ROUTES.LEITURA);

  // Páginas que não requerem anamnese (a própria página de anamnese e auth)
  const isAnamnesePage = location.pathname === ROUTES.ANAMNESE;
  const requiresAnamnese = !isAnamnesePage && !isLoadingAnamnese && !anamnese;

  const handleSignOut = async () => {
    await signOut();
    navigate(ROUTES.AUTH);
  };

  const handleToggleSidebar = () => {
    setSidebarCollapsed(prev => {
      const newValue = !prev;
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(newValue));
      return newValue;
    });
  };

  // Aguardar carregamento de perfil e anamnese
  if ((isProfileLoading || isLoadingAnamnese) && !isAnamnesePage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Se perfil incompleto, mostrar modal de completar antes de qualquer redirect
  if (profileIncomplete) {
    return (
      <div className="min-h-screen bg-background">
        <CompleteProfileModal />
      </div>
    );
  }

  // Se não tem anamnese e não está na página de anamnese, redirecionar
  if (requiresAnamnese) {
    return <Navigate to={ROUTES.ANAMNESE} replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <PWAUpdatePrompt />
      <WelcomeModal />
      <AnamneseWelcomeModal />
      <InstallPWAPrompt />
      {/* Desktop Sidebar */}
      <div className={cn('hidden', !isLeituraPage && 'lg:block')}>
        <Sidebar
          isAdmin={isAdmin}
          collapsed={sidebarCollapsed}
          onToggle={handleToggleSidebar}
          onSignOut={handleSignOut}
        />
      </div>

      {/* Mobile Header */}
      <div className={cn(
        'lg:hidden fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b border-border/30 px-4',
        isLeituraPage && 'hidden',
      )}>
        <div className="flex h-16 items-center justify-between">
          <div
            className="flex items-center gap-2.5 cursor-pointer hover:bg-muted/50 active:bg-muted/70 rounded-xl px-1.5 py-1 -ml-1.5 transition-colors"
            onClick={() => navigate(ROUTES.HOME)}
          >
            <Avatar className="w-10 h-10 ring-2 ring-primary/30 ring-offset-2 ring-offset-background shadow-sm">
              <AvatarImage src={userAvatar || undefined} alt={userName} />
              <AvatarFallback className="bg-primary/20 text-primary text-sm font-semibold">
                {userName?.charAt(0)?.toUpperCase() || <User className="w-4 h-4" />}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-0">
              <span className="text-[10px] text-muted-foreground font-medium leading-none mb-0.5">
                {getGreeting()}
              </span>
              <span className="text-sm font-semibold text-foreground truncate max-w-[140px] leading-none">
                {userName?.split(' ')[0] || 'Bem-vindo'}
              </span>
            </div>
          </div>

          <NotificationBell />
        </div>
      </div>

      {/* Mobile Bottom Nav */}
      {!isLeituraPage && (
        <BottomNav
          isAdmin={isAdmin}
          isSuperAdmin={isSuperAdmin()}
          onSignOut={handleSignOut}
        />
      )}

      {/* Desktop Topbar (minimal) */}
      <div className={cn(
        "hidden fixed top-0 right-0 z-30 h-14 border-b border-border bg-background/95 backdrop-blur-md transition-all duration-300",
        !isLeituraPage && "lg:block",
        sidebarCollapsed ? "left-16" : "left-56"
      )}>
        <div className="flex h-full items-center justify-between px-6">
          <div
            className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 rounded-xl px-2 py-1 -ml-2 transition-colors"
            onClick={() => navigate(ROUTES.HOME)}
          >
            <Avatar className="w-9 h-9 ring-2 ring-primary/30 ring-offset-2 ring-offset-background">
              <AvatarImage src={userAvatar || undefined} alt={userName} />
              <AvatarFallback className="bg-primary/20 text-primary text-sm">
                {userName?.charAt(0)?.toUpperCase() || <User className="w-4 h-4" />}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-0">
              <span className="text-xs text-muted-foreground font-medium">{getGreeting()}</span>
              <span className="text-sm font-semibold text-foreground">
                {userName || 'Usuário'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigate(ROUTES.SOBRE_NOS)}
              title="Sobre Nós"
              className="w-9 h-9 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <Info className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate(ROUTES.FAQ)}
              title="FAQ"
              className="w-9 h-9 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
            <NotificationBell />
            <ModeToggle />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className={cn(
        "transition-all duration-300",
        isChatPage ? "h-dvh overflow-hidden" : "min-h-screen",
        !isLeituraPage && "pt-20 lg:pt-14",
        !isLeituraPage && (isChatPage ? "pb-16 lg:pb-0" : "pb-20 lg:pb-0"),
        !isLeituraPage && (sidebarCollapsed ? "lg:pl-16" : "lg:pl-56")
      )}>
        {/* A leitura não entra na transição de página: o .page-transition anima
            com transform e vira o bloco de contenção dos filhos position:fixed,
            zerando a altura da área de leitura. */}
        {isLeituraPage ? (
          <Outlet />
        ) : (
          <div key={location.pathname} className="page-transition">
            <Outlet />
          </div>
        )}
      </main>

      {/* Scroll to Top */}
      {!isChatPage && !isLeituraPage && <ScrollToTop />}
    </div>
  );
};

export default MainLayout;
