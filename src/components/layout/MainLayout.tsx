import React from 'react';
import { Outlet, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Loader2, Info, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ModeToggle } from '@/components/mode-toggle';
import { ROUTES } from '@/constants';
import NotificationBell from '@/components/layout/NotificationBell';
import Sidebar from '@/components/layout/Sidebar';
import BottomNav from '@/components/layout/BottomNav';
import { WelcomeModal, InstallPWAPrompt, OnboardingTutorial, AnamneseWelcomeModal } from '@/components/shared';
import PWAUpdatePrompt from '@/components/shared/PWAUpdatePrompt';
import { ScrollToTop } from '@/components/ui/scroll-to-top';
import { useUserAnamnese } from '@/hooks/queries/useProfiles';
import { useOnboarding } from '@/hooks/useOnboarding';
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
  const [userName, setUserName] = React.useState<string>('');
  const [userAvatar, setUserAvatar] = React.useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(() => {
    const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    return saved === 'true';
  });

  // Verificar se usuário tem anamnese preenchida
  const { data: anamnese, isLoading: isLoadingAnamnese } = useUserAnamnese(user?.id);
  
  // Tutorial onboarding
  const { showTutorial, completeOnboarding, closeTutorial } = useOnboarding();
  
  // Páginas sem footer nem scroll externo (ex: chats)
  const isChatPage = location.pathname === ROUTES.GUARDIAO_VISOES;

  // Páginas que não requerem anamnese (a própria página de anamnese e auth)
  const isAnamnesePage = location.pathname === ROUTES.ANAMNESE;
  const requiresAnamnese = !isAnamnesePage && !isLoadingAnamnese && !anamnese;

  // Buscar nome e avatar do usuário do perfil e salvar dados do pré-cadastro
  React.useEffect(() => {
    const fetchAndUpdateProfile = async () => {
      if (!user?.id) return;
      
      try {
        // Verificar se há dados de pré-cadastro no localStorage
        const preRegisterData = localStorage.getItem('pre_register_data');
        
        // Primeiro, verificar se o profile já existe
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .eq('id', user.id)
          .maybeSingle();
        
        if (preRegisterData) {
          const { nome, dataNascimento } = JSON.parse(preRegisterData);
          
          if (existingProfile) {
            // Profile existe - atualizar com dados do pré-cadastro (sempre atualiza para garantir)
            const { error: updateError } = await supabase
              .from('profiles')
              .update({
                full_name: nome,
                birth_date: dataNascimento,
              })
              .eq('id', user.id);
            
            if (updateError) {
              console.error('Erro ao atualizar profile:', updateError);
            }
          } else {
            // Profile não existe - criar novo
            const { error: insertError } = await supabase
              .from('profiles')
              .insert({
                id: user.id,
                full_name: nome,
                birth_date: dataNascimento,
                created_at: new Date().toISOString(),
              });
            
            if (insertError) {
              console.error('Erro ao criar profile:', insertError);
            }
          }
          
          // Limpar dados do localStorage após usar
          localStorage.removeItem('pre_register_data');
          setUserName(nome);
          
        } else if (!existingProfile) {
          // Não tem pré-cadastro e não tem profile - criar profile vazio
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              created_at: new Date().toISOString(),
            });
          
          if (insertError) {
            console.error('Erro ao criar profile vazio:', insertError);
          }
        }

        // Buscar dados atualizados do profile
        const { data } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', user.id)
          .single();
        
        if (data?.full_name) {
          setUserName(data.full_name);
        }
        if (data?.avatar_url) {
          setUserAvatar(data.avatar_url);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    fetchAndUpdateProfile();
  }, [user?.id]);

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

  // Se está carregando a verificação de anamnese, mostrar loading
  if (isLoadingAnamnese && !isAnamnesePage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
      <OnboardingTutorial
        isAdmin={isAdmin}
        isOpen={showTutorial}
        onClose={closeTutorial}
        onComplete={completeOnboarding}
      />
      
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar
          isAdmin={isAdmin}
          collapsed={sidebarCollapsed}
          onToggle={handleToggleSidebar}
          onSignOut={handleSignOut}
        />
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b border-border/30 px-4">
        <div className="flex h-16 items-center justify-between">
          <div
            className="flex items-center gap-2.5 cursor-pointer hover:bg-muted/50 active:bg-muted/70 rounded-xl px-1.5 py-1 -ml-1.5 transition-colors"
            onClick={() => navigate(ROUTES.HOME)}
          >
            <Avatar className="w-10 h-10 ring-2 ring-primary/30 ring-offset-2 ring-offset-background shadow-sm">
              <AvatarImage src={userAvatar || undefined} alt={userName} />
              <AvatarFallback className="bg-gradient-to-br from-primary/25 to-secondary/15 text-primary text-sm font-semibold">
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
      <BottomNav
        isAdmin={isAdmin}
        isSuperAdmin={isSuperAdmin()}
        onSignOut={handleSignOut}
      />

      {/* Desktop Topbar (minimal) */}
      <div className={cn(
        "hidden lg:block fixed top-0 right-0 z-30 h-14 border-b border-border bg-background/95 backdrop-blur-md transition-all duration-300",
        sidebarCollapsed ? "left-16" : "left-56"
      )}>
        <div className="flex h-full items-center justify-between px-6">
          <div
            className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 rounded-xl px-2 py-1 -ml-2 transition-colors"
            onClick={() => navigate(ROUTES.HOME)}
          >
            <Avatar className="w-9 h-9 ring-2 ring-primary/30 ring-offset-2 ring-offset-background">
              <AvatarImage src={userAvatar || undefined} alt={userName} />
              <AvatarFallback className="bg-gradient-to-br from-primary/25 to-secondary/15 text-primary text-sm">
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
        "pt-20 lg:pt-14",
        isChatPage ? "pb-16 lg:pb-0" : "pb-20 lg:pb-0",
        sidebarCollapsed ? "lg:pl-16" : "lg:pl-56"
      )}>
        <div key={location.pathname} className="page-transition">
          <Outlet />
        </div>
      </main>

      {/* Scroll to Top */}
      {!isChatPage && <ScrollToTop />}
    </div>
  );
};

export default MainLayout;
