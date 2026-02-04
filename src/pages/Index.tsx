import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  AlertCircle,
  ChevronRight,
  CalendarDays,
  BookOpen,
  ShoppingBag,
  Instagram,
  MessageCircle,
  GraduationCap,
  Users,
  Image,
} from 'lucide-react';
import { ROUTES } from '@/constants';
import { APP_CONFIG } from '@/config/app';
import { useTheme } from '@/components/theme-provider';
import { useIsMobile } from '@/hooks/use-mobile';

// Dashboard components
import { UpcomingCeremoniesSection } from '@/components/dashboard/UpcomingCeremoniesSection';
import { UpcomingCoursesSection } from '@/components/dashboard/UpcomingCoursesSection';
import { MyInscriptionsSection } from '@/components/dashboard/MyInscriptionsSection';
import { MyCourseInscriptionsSection } from '@/components/dashboard/MyCourseInscriptionsSection';
import CeremonyReminder from '@/components/dashboard/CeremonyReminder';

// Shared components
import { SectionErrorBoundary } from '@/components/shared';
import ConvitePartilhaModal from '@/components/shared/ConvitePartilhaModal';

// Custom hooks
import { useUpcomingCeremonies } from '@/hooks/queries/useUpcomingCeremonies';
import { useMyInscriptions } from '@/hooks/queries/useMyInscriptions';

const Index: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isMobile = useIsMobile();
  const [hasAnamnese, setHasAnamnese] = useState<boolean | null>(null);
  const [isAnamneseComplete, setIsAnamneseComplete] = useState<boolean>(true);

  // Determinar se está no modo escuro (verificando a classe no HTML)
  const [isDark, setIsDark] = useState(false);
  
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    
    checkDarkMode();
    
    // Observer para detectar mudanças no tema
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    
    return () => observer.disconnect();
  }, [theme]);

  // Fetch data using custom hooks
  const {
    data: ceremonies = [],
    isLoading: ceremoniesLoading,
    error: ceremoniesError,
  } = useUpcomingCeremonies(3);
  const {
    data: inscriptions = [],
    isLoading: inscriptionsLoading,
    error: inscriptionsError,
  } = useMyInscriptions(user?.id, 3);

  // Check if user has anamnese and if it's complete
  useEffect(() => {
    const checkAnamnese = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('anamneses')
        .select('id, documento_valor, assinatura')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!error) {
        setHasAnamnese(!!data);
        if (data) {
          // Verificar se os novos campos obrigatórios estão preenchidos
          const complete = !!(data.documento_valor && data.assinatura);
          setIsAnamneseComplete(complete);
        }
      }
    };

    checkAnamnese();
  }, [user]);

  // Mobile Story-like Quick Actions
  const QuickActions = () => (
    <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-none md:hidden">
      <button 
        onClick={() => navigate(ROUTES.CERIMONIAS)}
        className="flex flex-col items-center gap-2 min-w-[72px] group"
      >
        <div className="w-[68px] h-[68px] rounded-full p-[2px] bg-gradient-to-tr from-primary via-purple-500 to-amber-500 group-active:scale-95 transition-transform">
          <div className="w-full h-full rounded-full border-2 border-background bg-card flex items-center justify-center overflow-hidden relative">
            <CalendarDays className="w-7 h-7 text-primary" />
          </div>
        </div>
        <span className="text-[11px] font-medium text-center truncate w-full">Eventos</span>
      </button>

      <button 
        onClick={() => navigate(ROUTES.GALERIA)}
        className="flex flex-col items-center gap-2 min-w-[72px] group"
      >
        <div className="w-[68px] h-[68px] rounded-full p-[2px] bg-gradient-to-tr from-gray-300 via-gray-400 to-gray-300 group-active:scale-95 transition-transform">
          <div className="w-full h-full rounded-full border-2 border-background bg-card flex items-center justify-center overflow-hidden relative">
            <Image className="w-7 h-7 text-muted-foreground" />
          </div>
        </div>
        <span className="text-[11px] font-medium text-center truncate w-full">Galeria</span>
      </button>

      <button 
        onClick={() => navigate(ROUTES.PARTILHAS)}
        className="flex flex-col items-center gap-2 min-w-[72px] group"
      >
        <div className="w-[68px] h-[68px] rounded-full p-[2px] bg-gradient-to-tr from-gray-300 via-gray-400 to-gray-300 group-active:scale-95 transition-transform">
          <div className="w-full h-full rounded-full border-2 border-background bg-card flex items-center justify-center overflow-hidden relative">
            <Users className="w-7 h-7 text-muted-foreground" />
          </div>
        </div>
        <span className="text-[11px] font-medium text-center truncate w-full">Partilhas</span>
      </button>

      <button 
        onClick={() => navigate(ROUTES.LOJA)}
        className="flex flex-col items-center gap-2 min-w-[72px] group"
      >
        <div className="w-[68px] h-[68px] rounded-full p-[2px] bg-gradient-to-tr from-amber-300 via-amber-500 to-amber-300 group-active:scale-95 transition-transform">
          <div className="w-full h-full rounded-full border-2 border-background bg-card flex items-center justify-center overflow-hidden relative">
            <ShoppingBag className="w-7 h-7 text-amber-600" />
          </div>
        </div>
        <span className="text-[11px] font-medium text-center truncate w-full">Loja</span>
      </button>
    </div>
  );

  return (
    <div className="min-h-screen overflow-x-hidden pb-20 md:pb-6">
      {/* Modal de convite para partilhar */}
      <ConvitePartilhaModal />

      {/* Hero Section Mobile - Compacto com Stories */}
      <div className="md:hidden pt-4 px-4 bg-background border-b border-border/40 pb-2 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="font-display text-xl font-bold text-primary">Consciência Divinal</h1>
            <p className="text-xs text-muted-foreground">Portal de Medicinas Sagradas</p>
          </div>
          <Button 
            size="icon" 
            variant="ghost" 
            className="rounded-full relative"
            onClick={() => navigate(ROUTES.NOTIFICATIONS)}
          >
            <AlertCircle className="w-6 h-6" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-background" />
          </Button>
        </div>
        <QuickActions />
      </div>

      {/* Hero Section Desktop */}
      <div 
        className="hidden md:block relative bg-cover bg-center bg-no-repeat h-64 lg:h-72 animate-fade-in transition-all duration-500"
        style={{
          backgroundImage: isDark ? 'url(/hero-dark.png)' : 'url(/hero-light.png)',
        }}
        role="banner"
        aria-label="Banner do Portal Consciência Divinal"
      >
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
      </div>

      <div className="container max-w-6xl mx-auto py-2 md:py-6 px-4 space-y-6">

        {/* Lembrete de Cerimônias Próximas */}
        <CeremonyReminder />

        {/* Anamnese Alert - Estilo Feed */}
        {(hasAnamnese === false || isAnamneseComplete === false) && (
          <Card className="border-none shadow-sm bg-primary/5 overflow-hidden">
            <div className="bg-primary/10 px-4 py-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold uppercase tracking-wider text-primary">Atenção Necessária</span>
            </div>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <h3 className="font-bold text-base mb-1">
                    {hasAnamnese === false ? 'Complete sua Ficha de Anamnese' : 'Atualize seu Cadastro'}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {hasAnamnese === false 
                      ? 'Para garantir sua segurança nas cerimônias, precisamos conhecer seu histórico de saúde.'
                      : 'Novos requisitos de segurança foram adicionados. Por favor, atualize seus dados.'}
                  </p>
                  <Button
                    onClick={() => navigate(ROUTES.ANAMNESE)}
                    size="sm"
                    className="w-full font-bold rounded-full"
                  >
                    {hasAnamnese === false ? 'Preencher Ficha' : 'Atualizar Agora'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Próximas Cerimônias - Estilo Feed */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="font-display text-lg font-bold">Próximos Eventos</h2>
            <Button variant="ghost" size="sm" className="text-primary text-xs h-8" onClick={() => navigate(ROUTES.CERIMONIAS)}>
              Ver todos
            </Button>
          </div>
          <SectionErrorBoundary
            sectionTitle="Próximas Cerimônias"
            sectionIcon={<CalendarDays className="h-5 w-5" />}
            hideHeader={true}
          >
            <UpcomingCeremoniesSection
              ceremonies={ceremonies}
              isLoading={ceremoniesLoading}
              error={ceremoniesError}
              hasAnamnese={(hasAnamnese ?? true) && isAnamneseComplete}
            />
          </SectionErrorBoundary>
        </div>

        {/* Minhas Inscrições - Estilo Feed */}
        {inscriptions.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="font-display text-lg font-bold">Suas Inscrições</h2>
            </div>
            <SectionErrorBoundary
              sectionTitle="Minhas Consagrações"
              sectionIcon={<BookOpen className="h-5 w-5" />}
              hideHeader={true}
            >
              <MyInscriptionsSection
                inscriptions={inscriptions}
                isLoading={inscriptionsLoading}
                error={inscriptionsError}
              />
            </SectionErrorBoundary>
          </div>
        )}

        {/* Cursos e Loja Grid Mobile */}
        <div className="grid grid-cols-2 gap-3 md:gap-6">
          <Card 
            className="overflow-hidden cursor-pointer border-none shadow-sm bg-gradient-to-br from-primary/5 to-primary/10 active:scale-95 transition-transform"
            onClick={() => navigate(ROUTES.CURSOS)}
          >
            <CardContent className="p-4 flex flex-col items-center text-center gap-2">
              <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center shadow-sm text-primary">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Cursos</h3>
                <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">Expanda seus conhecimentos</p>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="overflow-hidden cursor-pointer border-none shadow-sm bg-gradient-to-br from-amber-500/5 to-amber-500/10 active:scale-95 transition-transform"
            onClick={() => navigate(ROUTES.LOJA)}
          >
            <CardContent className="p-4 flex flex-col items-center text-center gap-2">
              <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center shadow-sm text-amber-600">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Loja</h3>
                <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">Artesanatos sagrados</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quote */}
        <div className="py-6 text-center px-4">
          <blockquote className="font-display text-base md:text-xl italic text-muted-foreground">
            "A medicina não cura, ela revela. O caminho da cura está dentro de você."
          </blockquote>
        </div>

        {/* Social Links */}
        <div className="flex justify-center gap-3 pb-6">
          <a
            href="https://www.instagram.com/temploxamaniconscienciadivinal"
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 text-white flex items-center justify-center shadow-md active:scale-90 transition-transform"
          >
            <Instagram className="w-5 h-5" />
          </a>
          <a
            href={`https://wa.me/${APP_CONFIG.contacts.whatsappLider}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center shadow-md active:scale-90 transition-transform"
          >
            <MessageCircle className="w-5 h-5" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default Index;
