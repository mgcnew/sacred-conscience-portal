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
  Sparkles,
  Eye,
} from 'lucide-react';
import { ROUTES } from '@/constants';
import { APP_CONFIG } from '@/config/app';

// Dashboard components
import { UpcomingCeremoniesSection } from '@/components/dashboard/UpcomingCeremoniesSection';
import { MyInscriptionsSection } from '@/components/dashboard/MyInscriptionsSection';
import CeremonyReminder from '@/components/dashboard/CeremonyReminder';
import AdminReminders from '@/components/dashboard/AdminReminders';

// Shared components
import { SectionErrorBoundary } from '@/components/shared';
import ConvitePartilhaModal from '@/components/shared/ConvitePartilhaModal';

// Custom hooks
import { useUpcomingCeremonies } from '@/hooks/queries/useUpcomingCeremonies';
import { useMyInscriptions } from '@/hooks/queries/useMyInscriptions';
import FadeIn from '@/components/ui/FadeIn';


const Index: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [hasAnamnese, setHasAnamnese] = useState<boolean | null>(null);
  const [isAnamneseComplete, setIsAnamneseComplete] = useState<boolean>(true);


  const {
    data: ceremonies = [],
    isLoading: ceremoniesLoading,
    error: ceremoniesError,
  } = useUpcomingCeremonies(3);

  const {
    data: inscriptions = [],
    isLoading: inscriptionsLoading,
    error: inscriptionsError,
  } = useMyInscriptions(user?.id, 1, true);

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

  // Próxima cerimônia inscrita (futura)
  const nextUpcomingInscription = React.useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return inscriptions
      .filter(i => {
        const [y, m, d] = i.cerimonia.data.split('-').map(Number);
        return new Date(y, m - 1, d) >= today;
      })
      .sort((a, b) => a.cerimonia.data.localeCompare(b.cerimonia.data))[0] ?? null;
  }, [inscriptions]);

  /**
   * As cores vêm da mesma divisão da navegação: Cerimônias, Galeria e
   * Partilhas são a Roda (ouro), a Loja é a Casa (terra). A Home declarava as
   * suas próprias — Galeria era `blue-500` aqui e ouro na barra de baixo, a
   * Loja era `amber-600` aqui e terra lá —, então o mesmo destino trocava de
   * cor conforme por onde a pessoa chegasse.
   *
   * "Eventos" também virou "Cerimônias": era a única tela do app que chamava
   * a consagração de evento.
   */
  const quickActions = [
    { label: 'Cerimônias', icon: CalendarDays, route: ROUTES.CERIMONIAS, color: 'text-sacred-gold-ink', bg: 'bg-sacred-gold/12' },
    { label: 'Galeria', icon: Image, route: ROUTES.GALERIA, color: 'text-sacred-gold-ink', bg: 'bg-sacred-gold/12' },
    { label: 'Partilhas', icon: Users, route: ROUTES.PARTILHAS, color: 'text-sacred-gold-ink', bg: 'bg-sacred-gold/12' },
    { label: 'Loja', icon: ShoppingBag, route: ROUTES.LOJA, color: 'text-earth', bg: 'bg-earth/12' },
  ];

  const HeroStrip = () => {
    if (inscriptionsLoading) return null;

    if (nextUpcomingInscription) {
      const [y, m, d] = nextUpcomingInscription.cerimonia.data.split('-').map(Number);
      const date = new Date(y, m - 1, d);
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const days = Math.round((date.getTime() - today.getTime()) / 86400000);
      const isNear = days <= 3;
      const label = days === 0 ? 'Hoje!' : days === 1 ? 'Amanhã!' : `${days} dias`;

      return (
        <div className={`rounded-2xl border p-4 mb-6 ${
          isNear
            ? 'bg-sacred-gold/10 border-sacred-gold/30'
            : 'bg-primary/8 border-primary/20'
        }`}>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground mb-0.5">Próxima cerimônia</p>
              <p className="font-display font-semibold text-sm leading-tight truncate">
                {nextUpcomingInscription.cerimonia.nome || 'Cerimônia'}
              </p>
              {nextUpcomingInscription.cerimonia.medicina_principal && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {nextUpcomingInscription.cerimonia.medicina_principal}
                </p>
              )}
            </div>
            <div className="text-right shrink-0">
              <p className={`text-2xl font-bold leading-none ${isNear ? 'text-sacred-gold-ink' : 'text-primary'}`}>
                {label}
              </p>
              {days > 1 && <p className="text-[10px] text-muted-foreground">restantes</p>}
            </div>
          </div>
        </div>
      );
    }

    // Sem cerimônia marcada, aqui ficava a mesma citação que já aparece mais
    // abaixo na versão do celular — a frase saía duas vezes na mesma tela.
    // No lugar dela, o passo que a pessoa precisa dar.
    return (
      <button
        type="button"
        onClick={() => navigate(ROUTES.CERIMONIAS)}
        className="w-full text-left rounded-2xl bg-primary/8 border border-primary/15 px-4 py-3 mb-6 active:scale-[0.99] transition-transform"
      >
        <p className="text-xs text-muted-foreground mb-0.5">Nenhuma cerimônia marcada</p>
        <p className="font-display font-semibold text-sm text-primary">
          Ver o calendário do templo
        </p>
      </button>
    );
  };

  const QuickActionsScroll = () => (
    <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
      {quickActions.map(({ label, icon: Icon, route, color, bg }) => (
        <button
          key={label}
          onClick={() => navigate(route)}
          className="flex flex-col items-center gap-1.5 min-w-[80px] group"
        >
          <div className={`w-[64px] h-[64px] rounded-2xl ${bg} border border-border/30 shadow-sm flex items-center justify-center group-active:scale-95 transition-transform`}>
            <Icon className={`w-6 h-6 ${color}`} />
          </div>
          <span className="text-[11px] font-medium text-muted-foreground text-center">{label}</span>
        </button>
      ))}
    </div>
  );

  const QuickActionsGrid = () => (
    <div className="grid grid-cols-2 gap-2">
      {quickActions.map(({ label, icon: Icon, route, color, bg }) => (
        <button
          key={label}
          onClick={() => navigate(route)}
          className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card border border-border/50 shadow-sm hover:bg-accent/40 active:scale-95 transition-all text-center"
        >
          <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-0.5`}>
            <Icon className={`w-5 h-5 ${color}`} />
          </div>
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
        aria-label="Instagram do templo"
        className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center shadow-md active:scale-90 transition-transform"
      >
        <Instagram className="w-5 h-5" />
      </a>
      <a
        href={`https://wa.me/${APP_CONFIG.contacts.whatsappLider}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="WhatsApp do templo"
        className="w-10 h-10 rounded-full bg-success text-success-foreground flex items-center justify-center shadow-md active:scale-90 transition-transform"
      >
        <MessageCircle className="w-5 h-5" />
      </a>
    </div>
  );

  return (
    <div className="overflow-x-hidden">
      <ConvitePartilhaModal />


      {/* Main Content */}
      <div className="container max-w-6xl mx-auto px-4 py-5">

        {/* A Home é a única tela sem título — o maior texto dela era um número
            de contagem de dias. Como um <h1> visível empurraria a próxima
            cerimônia para fora da dobra no celular, ele fica só para o leitor
            de tela, que precisa dele para anunciar onde a pessoa está. */}
        <h1 className="sr-only">Portal do Templo Consciência Divinal</h1>



        {/* Hero strip — contexto da próxima cerimônia */}
        <FadeIn>
          <HeroStrip />
        </FadeIn>

        {/* Mobile Quick Actions */}
        <FadeIn delay={80} className="lg:hidden mb-6">
          <QuickActionsScroll />
        </FadeIn>

        {/* Two-column grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 items-start">

          {/* Main column */}
          <div className="space-y-6 min-w-0">

            {/* Anamnese alert */}
            {anamnesePending && (
              <Card className="border-none shadow-sm bg-warning-subtle overflow-hidden">
                <div className="bg-warning/15 px-4 py-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-warning" />
                  <span className="text-xs font-bold uppercase tracking-wider text-warning">
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

            {/* Admin Reminders */}
            {isAdmin && <AdminReminders />}

            {/* Upcoming Ceremonies */}
            <FadeIn delay={60}>
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
            </FadeIn>

            {/* My Inscriptions */}
            {(inscriptions.length > 0 || inscriptionsLoading) && (
            <FadeIn delay={80}>
              <section>
                <div className="flex items-center justify-between mb-3 px-0.5">
                  <h2 className="font-display text-lg font-bold">Próximas Inscrições</h2>
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
            </FadeIn>
            )}

            {/* Explore o Templo */}
            <FadeIn delay={100}>
            <section>
              <h2 className="font-display text-lg font-bold mb-3 px-0.5">Explore o Templo</h2>
              <div className="grid grid-cols-2 gap-3">
                {/* Uma das quatro cores do logo por atalho. O card fica sobre
                    superfície sólida com anel colorido, para ter contorno
                    definido nos dois temas — um tinte fraco desaparecia no
                    fundo escuro. */}
                {([
                  { label: 'Cursos', desc: 'Expanda seus conhecimentos', icon: GraduationCap, route: ROUTES.CURSOS, tint: 'bg-earth/10 ring-earth/25', chip: 'bg-earth/15', color: 'text-earth' },
                  { label: 'Guardião', desc: 'Interprete suas visões', icon: Eye, route: ROUTES.GUARDIAO_VISOES, tint: 'bg-sacred-gold/10 ring-sacred-gold/25', chip: 'bg-sacred-gold/15', color: 'text-sacred-gold-ink' },
                  { label: 'Medicinas', desc: 'Conheça as plantas', icon: Leaf, route: ROUTES.MEDICINAS, tint: 'bg-primary/10 ring-primary/25', chip: 'bg-primary/15', color: 'text-primary' },
                  { label: 'Estudos', desc: 'Pós-consagração', icon: BookOpen, route: ROUTES.ESTUDOS, tint: 'bg-river/10 ring-river/25', chip: 'bg-river/15', color: 'text-river' },
                ] as const).map(({ label, desc, icon: Icon, route, tint, chip, color }) => (
                  <Card
                    key={label}
                    className={`overflow-hidden cursor-pointer border-none shadow-sm ring-1 ${tint} active:scale-95 transition-transform`}
                    onClick={() => navigate(route)}
                  >
                    <CardContent className="p-3.5 flex flex-col gap-2.5">
                      <div className={`w-9 h-9 rounded-xl ${chip} flex items-center justify-center`}>
                        <Icon className={`w-[18px] h-[18px] ${color}`} />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm leading-tight">{label}</h3>
                        <p className="text-xs text-muted-foreground leading-snug mt-0.5">{desc}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
            </FadeIn>

            {/* Mobile: Quote + Social */}
            <FadeIn delay={120}>
            <div className="lg:hidden space-y-5 pt-2 pb-4">
              <blockquote className="font-display text-center text-base md:text-lg italic text-muted-foreground px-2">
                "A medicina não cura, ela revela. O caminho da cura está dentro de você."
              </blockquote>
              <SocialLinks />
            </div>
            </FadeIn>
          </div>

          {/* Desktop Sidebar */}
          <aside className="hidden lg:flex flex-col gap-4 sticky top-20">
            {/* Próxima cerimônia — countdown */}
            {nextUpcomingInscription && (() => {
              const [y, m, d] = nextUpcomingInscription.cerimonia.data.split('-').map(Number);
              const date = new Date(y, m - 1, d);
              const today = new Date(); today.setHours(0, 0, 0, 0);
              const days = Math.round((date.getTime() - today.getTime()) / 86400000);
              const isNear = days <= 3;
              return (
                <div className={`rounded-xl border p-4 ${isNear ? 'bg-sacred-gold/10 border-sacred-gold/30' : 'bg-primary/5 border-primary/15'}`}>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Sua próxima cerimônia</p>
                  <p className="font-display font-semibold text-sm leading-tight mb-1 truncate">
                    {nextUpcomingInscription.cerimonia.nome || 'Cerimônia'}
                  </p>
                  <div className="flex items-end justify-between gap-2">
                    <p className="text-xs text-muted-foreground">
                      {nextUpcomingInscription.cerimonia.medicina_principal || ''}
                    </p>
                    <p className={`text-xl font-bold leading-none ${isNear ? 'text-sacred-gold-ink' : 'text-primary'}`}>
                      {days === 0 ? 'Hoje!' : days === 1 ? 'Amanhã!' : `${days}d`}
                    </p>
                  </div>
                </div>
              );
            })()}

            {/* Quick Actions 2×2 */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 px-0.5">
                Acesso Rápido
              </h3>
              <QuickActionsGrid />
            </div>

            {/* Sua jornada */}
            {inscriptions.length > 0 && (
              <div className="rounded-xl bg-primary/8 border border-primary/15 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Sua Jornada</p>
                </div>
                <p className="text-2xl font-bold text-primary dark:text-primary leading-none">
                  {inscriptions.length}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {inscriptions.length === 1 ? 'inscrição registrada' : 'inscrições registradas'}
                </p>
              </div>
            )}

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
