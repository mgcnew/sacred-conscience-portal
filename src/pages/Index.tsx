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
import { PhotoCarousel } from '@/components/dashboard/PhotoCarousel';

// Shared components
import { SectionErrorBoundary } from '@/components/shared';
import ConvitePartilhaModal from '@/components/shared/ConvitePartilhaModal';

// Custom hooks
import { useUpcomingCeremonies } from '@/hooks/queries/useUpcomingCeremonies';
import { useMyInscriptions } from '@/hooks/queries/useMyInscriptions';
import { useLatestPhotos } from '@/hooks/queries/useLatestPhotos';

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
  const {
    data: photos = [],
    isLoading: photosLoading,
    error: photosError,
  } = useLatestPhotos(6);

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

  // Dashboard Section Header Component
  const SectionHeader = ({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) => (
    <div className="flex items-center justify-between mb-4 px-1">
      <h2 className="font-display text-xl md:text-2xl font-bold tracking-tight">{title}</h2>
      {action && (
        <Button
          variant="ghost"
          size="sm"
          className="text-primary font-medium text-xs hover:bg-primary/5 h-8 px-3 rounded-full"
          onClick={onAction}
        >
          {action}
        </Button>
      )}
    </div>
  );

  // Desktop Side Actions
  const SideActions = () => (
    <div className="hidden md:flex flex-col gap-4 sticky top-24">
      <div className="space-y-3">
        <h3 className="font-display text-sm font-bold uppercase tracking-widest text-muted-foreground/60 px-1">Acesso Rápido</h3>
        <div className="grid grid-cols-1 gap-2">
          {[
            { label: 'Cerimônias', icon: CalendarDays, route: ROUTES.CERIMONIAS, color: 'text-primary' },
            { label: 'Galeria de Fotos', icon: Image, route: ROUTES.GALERIA, color: 'text-amber-600' },
            { label: 'Partilhas', icon: Users, route: ROUTES.PARTILHAS, color: 'text-emerald-700' },
            { label: 'Nossa Loja', icon: ShoppingBag, route: ROUTES.LOJA, color: 'text-rose-600' },
          ].map((item) => (
            <Button
              key={item.label}
              variant="outline"
              className="justify-start gap-3 h-12 border-border/40 hover:border-primary/30 hover:bg-primary/5 transition-all group"
              onClick={() => navigate(item.route)}
            >
              <item.icon className={`w-5 h-5 ${item.color} group-hover:scale-110 transition-transform`} />
              <span className="font-medium">{item.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Social Links Side Card */}
      <Card className="border-border/40 bg-muted/30 shadow-none mt-4">
        <CardContent className="p-4 flex flex-col gap-4">
          <p className="text-xs text-muted-foreground font-medium text-center">Acompanhe nossa jornada nas redes sociais</p>
          <div className="flex justify-center gap-4">
            <a
              href="https://www.instagram.com/temploxamaniconscienciadivinal"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-xl bg-gradient-to-tr from-purple-500 to-pink-500 text-white shadow-md hover:scale-110 transition-transform"
            >
              <Instagram className="w-5 h-5" />
            </a>
            <a
              href={`https://wa.me/${APP_CONFIG.contacts.whatsappLider}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-xl bg-green-500 text-white shadow-md hover:scale-110 transition-transform"
            >
              <MessageCircle className="w-5 h-5" />
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Mobile Story-like Quick Actions
  const QuickActions = () => (
    <div className="flex gap-2 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-none md:hidden">
      {[
        { label: 'Eventos', icon: CalendarDays, route: ROUTES.CERIMONIAS },
        { label: 'Galeria', icon: Image, route: ROUTES.GALERIA },
        { label: 'Partilhas', icon: Users, route: ROUTES.PARTILHAS },
        { label: 'Loja', icon: ShoppingBag, route: ROUTES.LOJA },
      ].map((item) => (
        <button
          key={item.label}
          onClick={() => navigate(item.route)}
          className="flex flex-col items-center gap-1.5 min-w-[72px] group relative"
        >
          <div className="w-[60px] h-[60px] rounded-3xl p-[2px] bg-primary/20 group-active:scale-95 transition-transform">
            <div className="w-full h-full rounded-[22px] bg-card flex items-center justify-center overflow-hidden relative border border-border/50 shadow-sm">
              <item.icon className="w-6 h-6 text-primary/80" />
            </div>
          </div>
          <span className="text-[10px] font-medium text-muted-foreground text-center truncate w-full">{item.label}</span>
        </button>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen overflow-x-hidden pb-20 md:pb-6">
      {/* Modal de convite para partilhar */}
      <ConvitePartilhaModal />

      {/* Hero Section Mobile - Compacto com Stories */}
      <div className="md:hidden pt-4 px-4 bg-background border-b border-border/40 pb-2 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div>
              <h1 className="font-display text-xl font-bold text-primary">Consciência Divinal</h1>
              <p className="text-xs text-muted-foreground">Portal de Medicinas Sagradas</p>
            </div>
            {(hasAnamnese === false || isAnamneseComplete === false) && (
              <button
                onClick={() => navigate(ROUTES.ANAMNESE)}
                className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center animate-pulse hover:bg-amber-600 transition-colors"
                title="Atenção: Cadastro Pendente"
              >
                <span className="text-xs font-bold">!</span>
              </button>
            )}
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="rounded-full relative"
            onClick={() => navigate(ROUTES.HISTORICO)}
          >
            <AlertCircle className="w-6 h-6" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-background" />
          </Button>
        </div>
        <QuickActions />
      </div>

      {/* Hero Section Desktop - Refined Typographic Approach */}
      <div className="hidden md:block bg-background border-b border-border/40 overflow-hidden relative">
        <div className="container max-w-6xl mx-auto px-6 py-12 lg:py-16 relative z-10">
          <div className="max-w-2xl animate-fade-in-up">
            <h1 className="font-display text-4xl lg:text-5xl font-bold text-foreground mb-4 leading-tight">
              Seja bem-vindo ao portal da <span className="text-primary italic">Consciência Divinal</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed max-w-lg">
              Um espaço dedicado à cura, estudos e expansão da consciência através das medicinas sagradas da floresta.
            </p>
            <div className="flex items-center gap-4">
              <Button
                onClick={() => navigate(ROUTES.CERIMONIAS)}
                className="rounded-full px-8 font-bold text-base shadow-lg shadow-primary/20 h-12"
              >
                Ver Cronograma
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate(ROUTES.SOBRE_NOS)}
                className="rounded-full px-8 font-bold text-base h-12"
              >
                Conheça a Nossa Casa
              </Button>
            </div>
          </div>
        </div>

        {/* Decorative elements - Subtle depth */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
        <div className="absolute top-1/2 -right-16 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2" />
        <div className="absolute bottom-8 right-12 w-32 h-32 border border-primary/20 rounded-full animate-soft-pulse hidden lg:block" />
      </div>

      <div className="container max-w-6xl mx-auto py-10 px-4">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] lg:grid-cols-[1fr_380px] gap-10 lg:gap-16">
          {/* Main Content Column */}
          <div className="space-y-16">
            {/* Lembrete de Cerimônias Próximas */}
            <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <CeremonyReminder />
            </div>

            {/* Próximas Cerimônias Section */}
            <section className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <SectionHeader
                title="Próximas Cerimônias"
                action="Ver cronograma completo"
                onAction={() => navigate(ROUTES.CERIMONIAS)}
              />
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
            </section>

            {/* Inscriptions Section (if any) */}
            {inscriptions.length > 0 && (
              <section className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                <SectionHeader title="Suas Inscrições" />
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
              </section>
            )}

            {/* Courses and Store */}
            <section className="animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              <SectionHeader title="Conhecimento & Expansão" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Card
                  className="group overflow-hidden cursor-pointer border-border/40 shadow-none hover:border-primary/40 hover:bg-primary/[0.02] transition-all duration-300 rounded-3xl bg-card/50"
                  onClick={() => navigate(ROUTES.CURSOS)}
                >
                  <CardContent className="p-6 md:p-8 flex flex-col gap-4">
                    <div className="w-14 h-14 shrink-0 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-500">
                      <GraduationCap className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-xl mb-2 group-hover:text-primary transition-colors">Cursos Presenciais</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Aprofunde sua conexão espiritual através de nossos cursos teóricos e vivenciais guiados.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card
                  className="group overflow-hidden cursor-pointer border-border/40 shadow-none hover:border-amber-500/40 hover:bg-amber-500/[0.02] transition-all duration-300 rounded-3xl bg-card/50"
                  onClick={() => navigate(ROUTES.LOJA)}
                >
                  <CardContent className="p-6 md:p-8 flex flex-col gap-4">
                    <div className="w-14 h-14 shrink-0 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 group-hover:scale-110 group-hover:bg-amber-500/20 transition-all duration-500">
                      <ShoppingBag className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-xl mb-2 group-hover:text-amber-600 transition-colors">Arte & Instrumentos</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Explore nossa coleção de instrumentos de poder e artesanatos produzidos pela comunidade.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Community/Gallery Section */}
            <section className="animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
              <SectionHeader title="Momentos da Nossa Egrégora" action="Acessar Galeria" onAction={() => navigate(ROUTES.GALERIA)} />
              <Card className="border-border/40 shadow-2xl shadow-primary/5 overflow-hidden bg-card/50 rounded-3xl">
                <CardContent className="p-0">
                  <PhotoCarousel photos={photos} isLoading={photosLoading} error={photosError} />
                </CardContent>
              </Card>
            </section>

            {/* Quote with more weight */}
            <div className="py-12 text-center max-w-lg mx-auto animate-fade-in" style={{ animationDelay: '0.6s' }}>
              <blockquote className="font-display text-xl md:text-2xl italic text-muted-foreground leading-relaxed">
                "A medicina não cura, ela revela. O caminho da cura está dentro de você."
              </blockquote>
              <div className="mt-4 w-12 h-1 px-0 mx-auto bg-primary/20 rounded-full" />
            </div>
          </div>

          {/* Sidebar Column */}
          <aside className="space-y-6">
            {/* Anamnese Card in Sidebar */}
            {(hasAnamnese === false || isAnamneseComplete === false) && (
              <Card className="border-none shadow-lg shadow-amber-500/10 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent overflow-hidden animate-fade-in-up">
                <div className="bg-amber-500 px-4 py-1.5 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-white" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white">Prontuário Pendente</span>
                </div>
                <CardContent className="p-5">
                  <h3 className="font-display font-bold text-base mb-2">
                    {hasAnamnese === false ? 'Complete sua Anamnese' : 'Atualize seu Cadastro'}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                    Sua segurança é nossa prioridade. Complete seus dados de saúde para participar das nossas cerimônias.
                  </p>
                  <Button
                    onClick={() => navigate(ROUTES.ANAMNESE)}
                    size="sm"
                    className="w-full font-bold rounded-full bg-amber-600 hover:bg-amber-700 text-white border-none h-10 shadow-md shadow-amber-600/20"
                  >
                    {hasAnamnese === false ? 'Começar Agora' : 'Atualizar Dados'}
                  </Button>
                </CardContent>
              </Card>
            )}

            <SideActions />
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Index;
