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
} from 'lucide-react';
import { ROUTES } from '@/constants';
import { APP_CONFIG } from '@/config/app';
import { useTheme } from '@/components/theme-provider';

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

  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Modal de convite para partilhar */}
      <ConvitePartilhaModal />

      {/* Hero Section - Imagem muda conforme o tema */}
      <div 
        className="relative bg-cover bg-center bg-no-repeat h-48 md:h-64 lg:h-72 animate-fade-in transition-all duration-500"
        style={{
          backgroundImage: isDark ? 'url(/hero-dark.png)' : 'url(/hero-light.png)',
        }}
        role="banner"
        aria-label="Banner do Portal Consciência Divinal"
      >
        {/* Degradê na parte inferior para transição suave */}
        <div className="absolute bottom-0 left-0 right-0 h-16 md:h-24 bg-gradient-to-t from-background to-transparent" />
      </div>

      <div className="container max-w-6xl mx-auto py-4 md:py-6 px-4">

        {/* Lembrete de Cerimônias Próximas */}
        <CeremonyReminder />

        {/* Anamnese Alert */}
        {(hasAnamnese === false || isAnamneseComplete === false) && (
          <Card className="mb-6 border-primary/30 bg-primary/5">
            <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 sm:hidden">
                  <h3 className="font-medium text-foreground">
                    {hasAnamnese === false ? 'Complete sua Ficha' : 'Atualize sua Ficha'}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {hasAnamnese === false ? 'Necessário para participar' : 'Novos campos obrigatórios'}
                  </p>
                </div>
              </div>

              <div className="hidden sm:block flex-1">
                <h3 className="font-medium text-foreground">
                  {hasAnamnese === false ? 'Complete sua Ficha de Anamnese' : 'Atualização de Cadastro Obrigatória'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {hasAnamnese === false 
                    ? 'Para participar das cerimônias, você precisa preencher sua ficha de saúde.'
                    : 'Adicionamos novos campos de segurança (Documento e Assinatura). Por favor, atualize sua ficha.'}
                </p>
              </div>

              <Button
                onClick={() => navigate(ROUTES.ANAMNESE)}
                size="sm"
                className="w-full sm:w-auto"
              >
                {hasAnamnese === false ? 'Preencher' : 'Atualizar'}
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Próximas Cerimônias e Cursos - Grid */}
        <div className="grid gap-4 md:grid-cols-2 mb-6">
          <SectionErrorBoundary
            sectionTitle="Próximas Cerimônias"
            sectionIcon={<CalendarDays className="h-5 w-5" />}
          >
            <UpcomingCeremoniesSection
              ceremonies={ceremonies}
              isLoading={ceremoniesLoading}
              error={ceremoniesError}
              hasAnamnese={(hasAnamnese ?? true) && isAnamneseComplete}
            />
          </SectionErrorBoundary>

          <SectionErrorBoundary
            sectionTitle="Próximos Cursos"
            sectionIcon={<GraduationCap className="h-5 w-5" />}
          >
            <UpcomingCoursesSection limit={2} />
          </SectionErrorBoundary>
        </div>

        {/* Minhas Inscrições - Grid */}
        <div className="grid gap-4 md:grid-cols-2 mb-6">
          <SectionErrorBoundary
            sectionTitle="Minhas Consagrações"
            sectionIcon={<BookOpen className="h-5 w-5" />}
          >
            <MyInscriptionsSection
              inscriptions={inscriptions}
              isLoading={inscriptionsLoading}
              error={inscriptionsError}
            />
          </SectionErrorBoundary>

          <MyCourseInscriptionsSection />
        </div>

        {/* Shop CTA */}
        <Card
          className="overflow-hidden cursor-pointer border-secondary/30 bg-gradient-to-r from-secondary/10 via-primary/5 to-secondary/10 hover:shadow-md transition-shadow"
          onClick={() => navigate(ROUTES.LOJA)}
        >
          <CardContent className="flex flex-col sm:flex-row items-center gap-4 p-5">
            <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
              <ShoppingBag className="w-6 h-6 text-secondary" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="font-display text-base font-semibold text-foreground mb-0.5">
                🛍️ Conheça Nossa Loja
              </h3>
              <p className="text-sm text-muted-foreground">
                Artesanatos sagrados e itens especiais para sua jornada.
              </p>
            </div>
            <Button size="sm" className="flex-shrink-0">
              Visitar
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </CardContent>
        </Card>

        {/* Quote */}
        <div className="mt-10 text-center">
          <blockquote className="font-display text-lg md:text-xl italic text-muted-foreground max-w-xl mx-auto">
            "A medicina não cura, ela revela. O caminho da cura está dentro de você."
          </blockquote>
        </div>

        {/* Social Links */}
        <div className="mt-6 flex justify-center gap-3">
          <a
            href="https://www.instagram.com/temploxamaniconscienciadivinal"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm hover:opacity-90 transition-opacity"
          >
            <Instagram className="w-4 h-4" />
            <span className="font-medium">Instagram</span>
          </a>
          <a
            href={`https://wa.me/${APP_CONFIG.contacts.whatsappLider}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500 text-white text-sm hover:opacity-90 transition-opacity"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="font-medium">WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default Index;
