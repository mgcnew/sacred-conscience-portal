import React from 'react';
import { Outlet, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ModeToggle } from '@/components/mode-toggle';
import { ROUTES } from '@/constants';
import NotificationBell from '@/components/layout/NotificationBell';
import Sidebar from '@/components/layout/Sidebar';
import BottomNav from '@/components/layout/BottomNav';
import { WelcomeModal, InstallPWAPrompt, OnboardingTutorial } from '@/components/shared';
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
            className="flex items-center gap-2.5 cursor-pointer active:opacity-70 transition-opacity"
            onClick={() => navigate(ROUTES.HOME)}
          >
            <Avatar className="w-10 h-10 border-2 border-primary/25 shadow-sm">
              <AvatarImage src={userAvatar || undefined} alt={userName} />
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
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
            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate(ROUTES.HOME)}
          >
            <Avatar className="w-9 h-9 border-2 border-primary/20">
              <AvatarImage src={userAvatar || undefined} alt={userName} />
              <AvatarFallback className="bg-primary/10 text-primary text-sm">
                {userName?.charAt(0)?.toUpperCase() || <User className="w-4 h-4" />}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-0">
              <span className="text-xs text-muted-foreground font-medium">Bem-vindo</span>
              <span className="text-sm font-semibold text-foreground">
                {userName || 'Usuário'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <ModeToggle />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className={cn(
        "min-h-screen transition-all duration-300",
        "pt-20 lg:pt-14",
        "pb-24 lg:pb-0",
        sidebarCollapsed ? "lg:pl-16" : "lg:pl-56"
      )}>
        <Outlet />
      </main>

      {/* Scroll to Top */}
      <ScrollToTop />

      {/* Footer */}
      <footer className={cn(
        "border-t border-border py-8 bg-muted/30 transition-all duration-300",
        sidebarCollapsed ? "lg:pl-16" : "lg:pl-56"
      )}>
        <div className="container flex flex-col items-center gap-3">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <button onClick={() => navigate(ROUTES.SOBRE_NOS)} className="hover:text-foreground transition-colors">
              Sobre Nós
            </button>
            <span className="text-border">·</span>
            <button onClick={() => navigate(ROUTES.FAQ)} className="hover:text-foreground transition-colors">
              FAQ
            </button>
          </div>
          <p className="text-xs text-muted-foreground/70">
            © 2024 Consciência Divinal. Com amor e respeito pelas medicinas ancestrais.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
