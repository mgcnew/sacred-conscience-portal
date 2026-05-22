import React, { useState } from 'react';
import { Info, User, Sparkles, Heart, BookOpen, Award, Leaf, Star } from 'lucide-react';
import { PageContainer } from '@/components/shared';
import { cn } from '@/lib/utils';
import FadeIn from '@/components/ui/FadeIn';

const SobreNos: React.FC = () => {
  const [tab, setTab] = useState<'templo' | 'mestre'>('templo');

  return (
    <PageContainer maxWidth="lg">

      {/* Hero */}
      <FadeIn>
        <div className="relative overflow-hidden rounded-3xl mb-8 bg-gradient-to-br from-primary/20 via-primary/8 to-transparent border border-primary/20">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-40 h-40 rounded-full bg-primary/8 blur-2xl pointer-events-none" />
          <div className="relative z-10 px-6 py-10 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/15 border border-primary/25 mb-4">
              <Leaf className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-semibold text-primary">Desde 2021</span>
            </div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-3 leading-tight">
              Templo Xamânico<br />Consciência Divinal
            </h1>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
              Um espaço sagrado dedicado ao despertar da consciência, ao acolhimento amoroso e à cura espiritual.
            </p>
          </div>
        </div>
      </FadeIn>

      {/* Tabs */}
      <FadeIn delay={80}>
        <div className="flex border-b border-border mb-8">
          <button
            onClick={() => setTab('templo')}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all -mb-px',
              tab === 'templo'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>O Templo</span>
          </button>
          <button
            onClick={() => setTab('mestre')}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all -mb-px',
              tab === 'mestre'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            <User className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Mestre de Cerimônia</span>
            <span className="sm:hidden">Mestre</span>
          </button>
        </div>
      </FadeIn>

      {/* Tab — O Templo */}
      {tab === 'templo' && (
        <div className="space-y-6">

          <FadeIn>
            <div className="space-y-4 text-foreground/90 leading-relaxed text-sm md:text-base">
              <p>
                Somos um <strong>Templo Xamânico Universalista</strong>, um espaço sagrado dedicado ao despertar da consciência, ao acolhimento amoroso e à cura espiritual. Aqui, caminhamos guiados por Deus, por Jesus Cristo e pelos mentores espirituais, valorizando a luz divina que habita em cada ser.
              </p>
              <p>
                Em nosso templo, consagramos com profundo respeito e responsabilidade as medicinas sagradas <strong>Ayahuasca</strong>, <strong>Rapé</strong>, <strong>Sananga</strong>, entre outras ferramentas de cura ancestral e espiritual. Também realizamos trabalhos de energização, harmonização, limpeza espiritual e vivências que despertam o autoconhecimento e a conexão com o sagrado.
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={80}>
            <div className="rounded-2xl bg-primary/5 border border-primary/15 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Heart className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold uppercase tracking-wider text-primary">Nossa Missão</span>
              </div>
              <p className="text-sm text-foreground/90 leading-relaxed">
                Acreditamos que <strong>todos são bem-vindos</strong>. Não limitamos ninguém, pois compreendemos que cada alma está em seu próprio caminho de evolução. A única condição para caminhar conosco é crer em Deus, pois é Ele quem guia, protege e ilumina nossos trabalhos.
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={120}>
            <div className="space-y-4 text-foreground/90 leading-relaxed text-sm md:text-base">
              <p>
                Desde nossa fundação, em <strong>2021</strong>, temos dedicado cada cerimônia ao amor, ao equilíbrio e ao propósito maior de servir ao próximo. Ao longo desses anos, presenciamos inúmeras histórias de superação e renascimento — relatos de cura, transformação e libertação que surgem ao final de cada trabalho, e até mesmo meses depois.
              </p>
              <p>
                Cada testemunho é para nós uma bênção, uma confirmação do quanto o caminho é sagrado e do quanto Deus age através das medicinas e das vivências espirituais.
              </p>
            </div>
          </FadeIn>

          {/* Stats */}
          <FadeIn delay={160}>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: '2021', label: 'Fundação' },
                { value: '3+', label: 'Medicinas' },
                { value: '∞', label: 'Vidas tocadas' },
              ].map(({ value, label }) => (
                <div key={label} className="rounded-2xl bg-muted/60 border border-border/50 p-4 text-center">
                  <p className="font-display text-2xl font-bold text-primary leading-none mb-1">{value}</p>
                  <p className="text-[11px] text-muted-foreground font-medium">{label}</p>
                </div>
              ))}
            </div>
          </FadeIn>

          <FadeIn delay={200}>
            <div className="rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/15 p-5 text-center">
              <Sparkles className="w-5 h-5 text-primary mx-auto mb-2" />
              <p className="font-display text-sm font-semibold text-foreground mb-1">
                Se você sente o chamado, permita-se viver essa experiência.
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Venha fazer parte do nosso templo e caminhar conosco rumo à consciência divina.
              </p>
            </div>
          </FadeIn>
        </div>
      )}

      {/* Tab — Mestre de Cerimônia */}
      {tab === 'mestre' && (
        <div className="space-y-6">

          {/* Perfil */}
          <FadeIn>
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <div className="shrink-0">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border-4 border-primary/20 flex items-center justify-center shadow-lg">
                    <User className="w-14 h-14 text-primary/40" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-primary flex items-center justify-center shadow-md">
                    <Star className="w-4 h-4 text-primary-foreground fill-current" />
                  </div>
                </div>
              </div>
              <div className="text-center sm:text-left">
                <h2 className="font-display text-xl font-bold text-foreground mb-1">
                  Txai Raimundo Ferreira Lima
                </h2>
                <p className="text-sm text-primary font-medium mb-2">Mestre de Cerimônia · Guia Espiritual</p>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
                  Quase 50 anos de caminhada espiritual, guardião das tradições ancestrais e dedicado servidor da luz divina.
                </p>
              </div>
            </div>
          </FadeIn>

          {/* Credenciais */}
          <FadeIn delay={80}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { icon: Heart, label: 'Experiência', value: '~50 anos de caminhada', color: 'text-rose-500', bg: 'bg-rose-500/8 border-rose-500/15' },
                { icon: Award, label: 'Formação', value: 'Casa AUYA', color: 'text-amber-500', bg: 'bg-amber-500/8 border-amber-500/15' },
                { icon: BookOpen, label: 'Acadêmico', value: 'Bacharel em Teologia', color: 'text-sky-500', bg: 'bg-sky-500/8 border-sky-500/15' },
              ].map(({ icon: Icon, label, value, color, bg }) => (
                <div key={label} className={cn('flex items-center gap-3 p-4 rounded-2xl border', bg)}>
                  <Icon className={cn('w-6 h-6 shrink-0', color)} />
                  <div>
                    <p className="text-xs font-bold text-foreground">{label}</p>
                    <p className="text-xs text-muted-foreground leading-snug mt-0.5">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </FadeIn>

          {/* Bio */}
          <FadeIn delay={120}>
            <div className="space-y-4 text-sm md:text-base text-foreground/90 leading-relaxed">
              <p>
                Com quase <strong>50 anos de caminhada espiritual</strong>, Txai Raimundo é um guardião das tradições ancestrais e um dedicado servidor da luz divina. Sua jornada é marcada pela busca incessante pelo conhecimento sagrado e pelo compromisso de guiar almas em seus processos de cura e transformação.
              </p>
              <p>
                Formado pela <strong>Casa AUYA</strong>, uma das mais respeitadas instituições formadoras de mestres de cerimônia no Brasil, Txai Raimundo traz consigo a sabedoria e os ensinamentos transmitidos por grandes mestres da tradição ayahuasqueira.
              </p>
              <p>
                Além de sua formação xamânica, possui <strong>bacharelados em Teologia</strong>, o que lhe confere uma visão ampla e universalista da espiritualidade — acolhendo pessoas de diferentes crenças e tradições, sempre respeitando a individualidade de cada caminhante.
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={160}>
            <div className="rounded-2xl bg-primary/5 border border-primary/15 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold uppercase tracking-wider text-primary">Sua Condução</span>
              </div>
              <p className="text-sm text-foreground/90 leading-relaxed">
                Marcada pelo <strong>amor, pela firmeza e pela sabedoria</strong>. Em cada cerimônia, Txai Raimundo cria um ambiente seguro e sagrado, onde os participantes podem se entregar ao processo de cura com confiança e entrega. Seu olhar atento e sua presença serena são faróis que iluminam o caminho daqueles que buscam a reconexão com o divino.
              </p>
            </div>
          </FadeIn>
        </div>
      )}

    </PageContainer>
  );
};

export default SobreNos;
