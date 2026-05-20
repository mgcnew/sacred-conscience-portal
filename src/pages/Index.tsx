import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  AlertCircle,
  CalendarDays,
  BookOpen,
  ShoppingBag,
  Instagram,
  MessageCircle,
  GraduationCap,
  Users,
  Image,
  Leaf,
  Bell,
} from 'lucide-react';
import { ROUTES } from '@/constants';
import { APP_CONFIG } from '@/config/app';

// Dashboard components
import { UpcomingCeremoniesSection } from '@/components/dashboard/UpcomingCeremoniesSection';
import { MyInscriptionsSection } from '@/components/dashboard/MyInscriptionsSection';
import CeremonyReminder from '@/components/dashboard/CeremonyReminder';

// Shared components
import { SectionErrorBoundary } from '@/components/shared';
import ConvitePartilhaModal from '@/components/shared/ConvitePartilhaModal';

// Custom hooks
import { useUpcomingCeremonies } from '@/hooks/queries/useUpcomingCeremonies';
import { useMyInscriptions } from '@/hooks/queries/useMyInscriptions';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

const Index: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [hasAnamnese, setHasAnamnese] = useState<boolean | null>(null);
  const [isAnamneseComplete, setIsAnamneseComplete] = useState<boolean>(true);

  const firstName = user?.user_metadata?.full_name?.split(' ')[0]
    || user?.user_metadata?.name?.split(' ')[0]
    || user?.email?.split('@')[0]
    || '';

  const firstInitial = firstName.charAt(0).toUpperCase();

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
          setIsAnamneseComplete(!!(data.documento_valor && data.assinatura));
        }
      }
    };

    checkAnamnese();
  }, [user]);

  const anamnesePending = hasAnamnese === false || isAnamneseComplete === false;

  const quickActions = [
    { label: 'Eventos', icon: CalendarDays, route: ROUTES.CERIMONIAS, color: 'text-primary' },
    { label: 'Galeria', icon: Image, route: ROUTES.GALERIA, color: 'text-primary' },
    { label: 'Partilhas', icon: Users, route: ROUTES.PARTILHAS, color: 'text-primary' },
    { label: 'Loja', icon: ShoppingBag, route: ROUTES.LOJA, color: 'text-amber-600' },
  ];

  const QuickActionsScroll = () => (
    <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
      {quickActions.map(({ label, icon: Icon, route, color }) => (
        <button
          key={label}
          onClick={() => navigate(route)}
          className="flex flex-col items-center gap-1.5 min-w-[80px] group"
        >
          <div className="w-[64px] h-[64px] rounded-2xl bg-card border border-border/50 shadow-sm flex items-center justify-center group-active:scale-95 transition-transform">
            <Icon className={`w-6 h-6 ${color}`} />
          </div>
          <span className="text-[11px] font-medium text-muted-foreground text-center">{label}</span>
        </button>
      ))}
    </div>
  );

  const QuickActionsGrid = () => (
    <div className="grid grid-cols-2 gap-2">
      {quickActions.map(({ label, icon: Icon, route, color }) => (
        <button
          key={label}
          onClick={() => navigate(route)}
          className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card border border-border/50 shadow-sm hover:bg-accent/40 active:scale-95 transition-all text-center"
        >
          <Icon className={`w-5 h-5 ${color}`} />
          <span className="text-xs font-semibold text-foreground">{label}</span>
        </button>
      ))}
    </div>
  );

  const SocialLinks = () => (
    <div className="flex justify-center gap-3">
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
  );

  return (
    <div className="min-h-screen overflow-x-hidden pb-24 md:pb-8">
      <ConvitePartilhaModal />

      {/* Sticky Header */}
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-border/40">
        <div className="container max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          {/* Left: Avatar + Greeting */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0">
              {firstInitial || '?'}
            </div>
            <div className="hidden sm:block min-w-0">
              <p className="text-[11px] text-muted-foreground leading-none">{getGreeting()}</p>
              <p className="text-sm font-semibold leading-tight truncate">{firstName || 'Bem-vindo'}</p>
            </div>
          </div>

          {/* Center: Logo */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Leaf className="w-4 h-4 text-primary" />
            <span className="font-display text-sm font-bold text-primary whitespace-nowrap">Consciência Divinal</span>
          </div>

          {/* Right: Alert + Bell */}
          <div className="flex items-center gap-1 shrink-0">
            {anamnesePending && (
              <button
                onClick={() => navigate(ROUTES.ANAMNESE)}
                className="w-8 h-8 rounded-full bg-amber-500/15 text-amber-600 flex items-center justify-center hover:bg-amber-500/25 transition-colors"
                title="Cadastro pendente"
              >
                <span className="text-xs font-bold">!</span>
              </button>
            )}
            <Button
              size="icon"
              variant="ghost"
              className="rounded-full relative"
              onClick={() => navigate(ROUTES.CONFIGURACOES)}
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full border border-background" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container max-w-6xl mx-auto px-4 py-5">

        {/* Mobile greeting */}
        <div className="sm:hidden mb-5">
          <p className="text-xs text-muted-foreground">{getGreeting()},</p>
          <h1 className="text-xl font-bold">{firstName ? `${firstName} 👋` : 'Bem-vindo 👋'}</h1>
        </div>

        {/* Mobile Quick Actions */}
        <div className="lg:hidden mb-6">
          <QuickActionsScroll />
        </div>

        {/* Two-column grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 items-start">

          {/* Main column */}
          <div className="space-y-6 min-w-0">

            {/* Anamnese alert */}
            {anamnesePending && (
              <Card className="border-none shadow-sm bg-amber-500/8 overflow-hidden">
                <div className="bg-amber-500/15 px-4 py-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                    Atenção Necessária
                  </span>
                </div>
                <CardContent className="p-4">
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
                </CardContent>
              </Card>
            )}

            {/* Ceremony Reminder */}
            <CeremonyReminder />

            {/* Upcoming Ceremonies */}
            <section>
              <div className="flex items-center justify-between mb-3 px-0.5">
                <h2 className="font-display text-lg font-bold">Próximos Eventos</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-primary text-xs h-8"
                  onClick={() => navigate(ROUTES.CERIMONIAS)}
                >
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
            </section>

            {/* My Inscriptions */}
            {(inscriptions.length > 0 || inscriptionsLoading) && (
              <section>
                <div className="flex items-center justify-between mb-3 px-0.5">
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
              </section>
            )}

            {/* Cursos + Loja grid — mobile & desktop main column */}
            <div className="grid grid-cols-2 gap-3">
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
                    <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                      Expanda seus conhecimentos
                    </p>
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
                    <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                      Artesanatos sagrados
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Mobile: Quote + Social */}
            <div className="lg:hidden space-y-5 pt-2 pb-4">
              <blockquote className="font-display text-center text-base md:text-lg italic text-muted-foreground px-2">
                "A medicina não cura, ela revela. O caminho da cura está dentro de você."
              </blockquote>
              <SocialLinks />
            </div>
          </div>

          {/* Desktop Sidebar */}
          <aside className="hidden lg:flex flex-col gap-4 sticky top-20">
            {/* Quick Actions 2×2 */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 px-0.5">
                Acesso Rápido
              </h3>
              <QuickActionsGrid />
            </div>

            {/* Sacred Quote */}
            <div className="rounded-xl bg-primary/5 border border-primary/10 p-4">
              <Leaf className="w-4 h-4 text-primary/60 mb-2" />
              <blockquote className="font-display text-sm italic text-muted-foreground leading-relaxed">
                "A medicina não cura, ela revela. O caminho da cura está dentro de você."
              </blockquote>
            </div>

            {/* Social Links */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 px-0.5">
                Comunidade
              </h3>
              <SocialLinks />
            </div>
          </aside>

        </div>
      </div>
    </div>
  );
};

export default Index;
