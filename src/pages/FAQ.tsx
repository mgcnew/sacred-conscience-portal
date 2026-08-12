import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AlertTriangle, MessageCircle, Leaf, Shield, Sparkles, Heart } from 'lucide-react';
import { PageContainer } from '@/components/shared';
import { APP_CONFIG } from '@/config/app';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import FadeIn from '@/components/ui/FadeIn';

const faqCategories = [
  {
    id: 'preparacao',
    title: 'Preparação',
    emoji: '🌿',
    color: {
      pill: 'bg-forest/10 text-forest border-forest/20',
      pillActive: 'bg-forest text-white border-forest',
      icon: 'bg-forest/10 text-forest',
      card: 'border-forest/20',
      accent: 'bg-forest/5',
    },
    items: [
      {
        emoji: '🥗',
        question: 'Como devo me preparar fisicamente (Dieta)?',
        answer: 'Recomendamos uma dieta leve nos 3 dias antes da cerimônia. Evite carnes vermelhas, alimentos processados, excesso de sal e açúcar, álcool e drogas recreativas. No dia da cerimônia, faça refeições leves e jejum de sólidos pelo menos 4 horas antes do início.',
      },
      {
        emoji: '🎒',
        question: 'O que devo levar para a cerimônia?',
        answer: 'Traga roupas confortáveis e claras (se possível), agasalho (pode fazer frio), garrafa de água, repelente, colchonete ou tapete de yoga (se não fornecido), cobertor e travesseiro. Um caderno para anotações também é recomendado.',
      },
      {
        emoji: '👕',
        question: 'Qual a vestimenta adequada?',
        answer: 'Pedimos roupas confortáveis, discretas e preferencialmente claras. Evite roupas muito curtas, decotadas ou com estampas agressivas. O ambiente é sagrado e o conforto auxilia no processo.',
      },
    ],
  },
  {
    id: 'cerimonia',
    title: 'Cerimônia',
    emoji: '🕯️',
    color: {
      pill: 'bg-sacred-gold/10 text-sacred-gold-ink border-sacred-gold/20',
      pillActive: 'bg-sacred-gold text-sacred-gold-foreground border-sacred-gold',
      icon: 'bg-sacred-gold/10 text-sacred-gold-ink',
      card: 'border-sacred-gold/20',
      accent: 'bg-sacred-gold/5',
    },
    items: [
      {
        emoji: '⏱️',
        question: 'Quanto tempo dura uma cerimônia?',
        answer: 'As cerimônias geralmente duram entre 4 a 6 horas, podendo se estender dependendo da energia do grupo e do trabalho realizado. Recomendamos não ter compromissos logo após.',
      },
      {
        emoji: '🤲',
        question: 'O que acontece se eu passar mal?',
        answer: 'O mal-estar físico (vômito ou diarreia) é chamado de "purga" e é considerado parte do processo de limpeza. Temos uma equipe de guardiões treinados para lhe dar suporte, levar ao banheiro e cuidar de você com todo carinho e segurança.',
      },
      {
        emoji: '👥',
        question: 'Posso levar acompanhante?',
        answer: 'Sim, mas o acompanhante também deve participar da cerimônia e passar pelo mesmo processo de inscrição e anamnese. Não permitimos observadores que não consagrem a medicina, para manter a egrégora protegida.',
      },
    ],
  },
  {
    id: 'seguranca',
    title: 'Segurança',
    emoji: '🛡️',
    color: {
      pill: 'bg-earth/10 text-earth border-earth/20',
      pillActive: 'bg-earth text-earth-foreground border-earth',
      icon: 'bg-earth/10 text-earth',
      card: 'border-earth/20',
      accent: 'bg-earth/5',
    },
    items: [
      {
        emoji: '⚠️',
        question: 'Quem NÃO pode consagrar Ayahuasca?',
        answer: 'Pessoas com histórico de esquizofrenia, transtorno bipolar, surtos psicóticos ou que façam uso de medicamentos controlados (antidepressivos ISRS, inibidores da MAO) devem passar por uma avaliação rigorosa. É OBRIGATÓRIO informar todos os medicamentos na ficha de anamnese.',
      },
      {
        emoji: '🔬',
        question: 'A Ayahuasca vicia?',
        answer: 'Não. Estudos científicos e a tradição mostram que a Ayahuasca não causa dependência química. Pelo contrário, é frequentemente utilizada no tratamento de dependências de álcool e outras drogas.',
      },
      {
        emoji: '🛡️',
        question: 'É seguro participar?',
        answer: 'Sim, quando realizada em ambiente controlado, com condutores experientes e respeito às contraindicações. Nossa equipe é treinada para oferecer suporte físico, emocional e espiritual durante todo o processo.',
      },
    ],
  },
  {
    id: 'integracao',
    title: 'Integração',
    emoji: '🌱',
    color: {
      pill: 'bg-river/10 text-river border-river/20',
      pillActive: 'bg-river text-river-foreground border-river',
      icon: 'bg-river/10 text-river',
      card: 'border-river/20',
      accent: 'bg-river/5',
    },
    items: [
      {
        emoji: '🏠',
        question: 'Como é o retorno para casa?',
        answer: 'Recomendamos que você descanse após a cerimônia. Evite dirigir imediatamente se ainda sentir efeitos. Alimente-se de forma leve e beba bastante água.',
      },
      {
        emoji: '🌱',
        question: 'O que é a integração?',
        answer: 'É o processo de trazer os ensinamentos da cerimônia para o seu dia a dia. Recomendamos anotar seus insights, meditar, estar em contato com a natureza e, se necessário, conversar com nossos terapeutas para ajudar a assimilar a experiência.',
      },
    ],
  },
];

const FAQ: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [showWelcome, setShowWelcome] = useState(false);
  const [activeSection, setActiveSection] = useState('preparacao');
  const [userName, setUserName] = useState('');
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data?.full_name) setUserName(data.full_name.split(' ')[0]);
      });
  }, [user?.id]);

  const whatsappHref = (() => {
    const msg = userName
      ? `Olá! Sou ${userName} e estou no aplicativo ${APP_CONFIG.name}. Li o FAQ mas ainda tenho algumas dúvidas. Podem me ajudar?`
      : `Olá! Estou no aplicativo ${APP_CONFIG.name}. Li o FAQ mas ainda tenho algumas dúvidas. Podem me ajudar?`;
    return `https://wa.me/${APP_CONFIG.contacts.whatsappLider}?text=${encodeURIComponent(msg)}`;
  })();

  useEffect(() => {
    if (location.state?.fromInscription) {
      setShowWelcome(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <PageContainer maxWidth="lg">

      {/* Banner de boas-vindas — só aparece ao vir da inscrição */}
      {showWelcome && (
        <div className="relative overflow-hidden rounded-2xl mb-8 bg-primary/10 border border-primary/20">
          <button
            onClick={() => setShowWelcome(false)}
            className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors p-1"
          >
            ✕
          </button>
          <div className="p-5 relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-primary">Sua jornada começa aqui</span>
            </div>
            <h2 className="font-display text-lg font-semibold text-foreground mb-2 leading-snug">
              A preparação é parte da cerimônia 🌿
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Reserva alguns minutos para ler estas orientações com calma. Chegar bem preparado faz toda a diferença — para você e para todos que partilharão o espaço sagrado.
            </p>
          </div>
        </div>
      )}

      {/* Hero */}
      <FadeIn>
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-4">
          <Leaf className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-semibold text-primary">Orientações Sagradas</span>
        </div>
        <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-3">
          Tudo o que precisa saber
        </h1>
        <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
          Preparação, cerimônia, segurança e integração — leia com atenção e chegue pronto para viver plenamente esta experiência.
        </p>
      </div>
      </FadeIn>

      {/* Quick-nav pills */}
      <FadeIn delay={80}>
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 mb-8 scrollbar-none">
        {faqCategories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => scrollToSection(cat.id)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border whitespace-nowrap transition-all shrink-0',
              activeSection === cat.id ? cat.color.pillActive : cat.color.pill
            )}
          >
            <span>{cat.emoji}</span>
            {cat.title}
          </button>
        ))}
      </div>
      </FadeIn>

      {/* Categorias */}
      <div className="space-y-6">
        {faqCategories.map((category, i) => (
          <FadeIn key={category.id} delay={i * 80}>
          <div
            ref={el => { sectionRefs.current[category.id] = el; }}
            className={cn('rounded-2xl border overflow-hidden scroll-mt-20', category.color.card)}
          >
            {/* Category header */}
            <div className={cn('flex items-center gap-3 px-5 py-4', category.color.accent)}>
              <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center text-base', category.color.icon)}>
                {category.emoji}
              </div>
              <h2 className="font-display font-bold text-base text-foreground">{category.title}</h2>
              <span className="ml-auto text-xs text-muted-foreground">{category.items.length} tópicos</span>
            </div>

            {/* Accordion */}
            <div className="px-2 pb-2">
              <Accordion type="single" collapsible className="w-full">
                {category.items.map((item, i) => (
                  <AccordionItem
                    key={i}
                    value={`${category.id}-${i}`}
                    className="border-none"
                  >
                    <AccordionTrigger className="text-left px-3 py-4 font-medium text-sm text-foreground/90 hover:text-foreground hover:no-underline gap-3 [&>svg]:shrink-0">
                      <span className="flex items-center gap-2.5">
                        <span className="text-base leading-none">{item.emoji}</span>
                        {item.question}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="px-3 pb-4">
                      <p className="text-sm text-muted-foreground leading-relaxed pl-8">
                        {item.answer}
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
          </FadeIn>
        ))}
      </div>

      {/* Aviso de segurança */}
      <FadeIn>
      <div className="mt-6 flex items-start gap-3 p-4 rounded-2xl bg-warning-subtle border border-warning/25">
        <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-foreground mb-0.5">Informação médica obrigatória</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Informe <strong>todos</strong> os medicamentos e condições de saúde na sua ficha de anamnese. Ocultar informações coloca sua saúde em risco. Nossa equipe mantém total sigilo.
          </p>
        </div>
      </div>
      </FadeIn>

      {/* Footer CTA */}
      <FadeIn delay={60}>
      <div className="mt-8 rounded-2xl bg-primary/8 border border-primary/15 p-6 text-center">
        <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-3">
          <Heart className="w-5 h-5 text-primary" />
        </div>
        <h3 className="font-display font-semibold text-foreground mb-1">Ficou com alguma dúvida?</h3>
        <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
          Nossa equipe está disponível para te acolher e responder com carinho antes da cerimônia.
        </p>
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 active:scale-95 transition-all"
        >
          <MessageCircle className="w-4 h-4" />
          Falar com a equipe
        </a>
      </div>
      </FadeIn>

    </PageContainer>
  );
};

export default FAQ;
