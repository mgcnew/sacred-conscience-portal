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

          {/* Quem somos */}
          <FadeIn>
            <div className="space-y-4 text-foreground/90 leading-relaxed text-sm md:text-base">
              <p>
                Somos um <strong>Templo Xamânico Universalista</strong>, um espaço sagrado dedicado ao despertar da consciência, ao acolhimento amoroso e à cura espiritual. Aqui, caminhamos guiados por Deus, por Jesus Cristo e pelos mentores espirituais, valorizando a luz divina que habita em cada ser.
              </p>
              <p>
                Em nosso templo, consagramos com profundo respeito e responsabilidade as medicinas sagradas <strong>Ayahuasca</strong>, <strong>Rapé</strong>, <strong>Sananga</strong>, entre outras ferramentas de cura ancestral e espiritual. Também realizamos trabalhos de energização, harmonização, limpeza espiritual e vivências que despertam o autoconhecimento e a reconexão com o sagrado.
              </p>
            </div>
          </FadeIn>

          {/* CTA — Você está seguro aqui */}
          <FadeIn delay={60}>
            <div className="rounded-2xl bg-primary/5 border border-primary/15 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Heart className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold uppercase tracking-wider text-primary">Você está seguro aqui</span>
              </div>
              <p className="text-sm text-foreground/90 leading-relaxed">
                Se é a sua primeira vez ou se carrega dúvidas no coração, saiba: você será recebido com <strong>amor, respeito e cuidado</strong>. Não há julgamentos, não há pressa. Cada pessoa chega com sua história, e nós honramos isso. O nosso espaço é de acolhimento — você não precisa saber nada antes de entrar, apenas precisar vir.
              </p>
            </div>
          </FadeIn>

          {/* Missão */}
          <FadeIn delay={100}>
            <div className="space-y-4 text-foreground/90 leading-relaxed text-sm md:text-base">
              <p>
                Acreditamos que <strong>todos são bem-vindos</strong>. Não limitamos ninguém, pois compreendemos que cada alma está em seu próprio caminho de evolução. A única condição para caminhar conosco é crer em Deus, pois é Ele quem guia, protege e ilumina nossos trabalhos.
              </p>
              <p>
                Desde nossa fundação, em <strong>2021</strong>, temos dedicado cada cerimônia ao amor, ao equilíbrio e ao propósito maior de servir ao próximo. Presenciamos inúmeras histórias de superação, cura e renascimento — relatos que surgem ao final de cada trabalho, e até meses depois, quando as pessoas retornam para compartilhar como as medicinas seguiram agindo em suas vidas.
              </p>
            </div>
          </FadeIn>

          {/* Stats */}
          <FadeIn delay={140}>
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

          {/* Guardiões e ajudadores */}
          <FadeIn delay={180}>
            <div className="rounded-2xl border border-border/60 overflow-hidden">
              <div className="bg-muted/40 px-5 py-3 flex items-center gap-2 border-b border-border/40">
                <Star className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-foreground">Nossa Equipe Sagrada</span>
              </div>
              <div className="p-5 space-y-4 text-sm text-foreground/90 leading-relaxed">
                <p>
                  Você não estará sozinho durante nenhum momento da cerimônia. Além do nosso Mestre, contamos com uma equipe de <strong>Guardiões</strong> — voluntários treinados e comprometidos com a sua segurança física, emocional e espiritual durante todo o trabalho.
                </p>
                <p>
                  Os <strong>Ajudadores</strong> cuidam do espaço, da logística e de tudo o que você precisar: água, banheiro, cobertor, um ombro amigo. São pessoas que já caminharam por aqui e escolheram servir — porque sentiram no próprio coração o quanto um suporte atencioso faz diferença numa noite sagrada.
                </p>
                <p>
                  Juntos, formamos uma família. E quando você cruzar nossa porta, fará parte dela.
                </p>
              </div>
            </div>
          </FadeIn>

          {/* CTA final */}
          <FadeIn delay={220}>
            <div className="rounded-2xl bg-gradient-to-br from-primary/12 to-primary/5 border border-primary/20 p-6 text-center">
              <Sparkles className="w-6 h-6 text-primary mx-auto mb-3" />
              <h3 className="font-display text-base font-bold text-foreground mb-2">
                Se você sente o chamado, permita-se viver essa experiência.
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Venha com seu coração aberto. Nós cuidamos do resto — com amor, respeito e profunda gratidão pela sua confiança.
              </p>
              <p className="text-xs text-primary font-semibold">
                🌿 Bem-vindo ao Templo Xamânico Consciência Divinal
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
                  Quase 50 anos de caminhada espiritual — não em busca de reconhecimento, mas de servir com amor e responsabilidade a cada alma que chega ao templo.
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

          {/* Bio — tranquilizador */}
          <FadeIn delay={120}>
            <div className="space-y-4 text-sm md:text-base text-foreground/90 leading-relaxed">
              <p>
                Quando você se sentar em cerimônia com Txai Raimundo, estará ao lado de alguém que já acompanhou centenas de jornadas — as mais tranquilas e as mais intensas. Sua quase <strong>meia século de caminhada espiritual</strong> não é um título, é experiência vivida: noites passadas em vigília, processos que pedem paciência, e um olhar treinado para perceber o que cada pessoa precisa, mesmo quando ela mesma ainda não sabe.
              </p>
              <p>
                Formado pela <strong>Casa AUYA</strong>, uma das mais respeitadas escolas de formação de mestres de cerimônia no Brasil, Txai Raimundo aprendeu não apenas os rituais, mas a responsabilidade que cada um deles carrega. Sua condução é pautada por protocolos sérios de segurança e por um profundo respeito pelas tradições que guardam essas medicinas há séculos.
              </p>
              <p>
                Sua formação acadêmica em <strong>Teologia</strong> ampliou ainda mais esse olhar — permitindo que ele acolha pessoas de qualquer crença, sem impor caminhos, reconhecendo que o sagrado tem muitos nomes e que o amor é a linguagem comum a todos eles.
              </p>
            </div>
          </FadeIn>

          {/* Caminhada pessoal */}
          <FadeIn delay={160}>
            <div className="rounded-2xl bg-muted/30 border border-border/50 p-5 space-y-3 text-sm text-foreground/90 leading-relaxed">
              <div className="flex items-center gap-2 mb-1">
                <Leaf className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold uppercase tracking-wider text-primary">Uma caminhada de fé e renascimento</span>
              </div>
              <p>
                A jornada de Txai Raimundo foi marcada pela <strong>fé, pela superação e pelo renascimento</strong>. Sempre guiado pela Fonte e pelo Mestre Yeshua, ao longo dos anos percorreu diferentes caminhos espirituais, bebeu de tradições distintas e acumulou um entendimento raro sobre a espiritualidade humana em toda a sua profundidade.
              </p>
              <p>
                Mas essa trajetória não foi feita apenas de luz. Txai Raimundo também enfrentou momentos de <strong>grande dor</strong>. Em um desses caminhos, encarou a própria sombra — um ponto tão escuro que quase tirou dele a chance de continuar.
              </p>
              <p>
                Foi justamente nesse abismo que ele renasceu.
              </p>
              <p>
                É por isso que quando alguém chega ao templo carregando um peso que não consegue nem nomear, ele reconhece. Não pela teoria, mas porque já esteve lá. Essa vivência não o diminui — ela é a raiz da sua compaixão e a razão pela qual tantos se sentem verdadeiramente compreendidos ao seu lado.
              </p>
            </div>
          </FadeIn>

          {/* Como ele conduz */}
          <FadeIn delay={200}>
            <div className="rounded-2xl border border-border/60 overflow-hidden">
              <div className="bg-muted/40 px-5 py-3 flex items-center gap-2 border-b border-border/40">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold uppercase tracking-wider text-foreground">Como ele conduz</span>
              </div>
              <div className="p-5 space-y-3 text-sm text-foreground/90 leading-relaxed">
                <p>
                  Com <strong>firmeza e ternura</strong> ao mesmo tempo. Ele sabe quando estar presente em silêncio e quando se aproximar com uma palavra ou um canto. Nenhum detalhe passa despercebido — e isso não é uma promessa, é o que quem já participou relata, cerimônia após cerimônia.
                </p>
                <p>
                  Se em algum momento você se sentir perdido, com medo ou precisando de apoio, ele e a equipe estarão lá. Você não será abandonado ao processo — será <strong>guiado através dele</strong>.
                </p>
              </div>
            </div>
          </FadeIn>

          {/* CTA tranquilizador */}
          <FadeIn delay={240}>
            <div className="rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/15 p-5 text-center">
              <Heart className="w-5 h-5 text-primary mx-auto mb-2" />
              <p className="font-display text-sm font-semibold text-foreground mb-2">
                Você está em boas mãos.
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Décadas de prática, humildade e cuidado genuíno com cada pessoa — isso é o que você encontrará ao lado de Txai Raimundo. Entre com confiança.
              </p>
            </div>
          </FadeIn>

        </div>
      )}

    </PageContainer>
  );
};

export default SobreNos;
