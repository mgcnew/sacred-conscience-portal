import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Sparkles,
  ClipboardList,
  Leaf,
  MessageCircleHeart,
  ArrowRight,
  Quote,
} from 'lucide-react';
import { ROUTES } from '@/constants';

const WELCOME_SHOWN_KEY = 'welcome_modal_shown';

const WelcomeModal: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!user) return;
    const shownUsers = JSON.parse(localStorage.getItem(WELCOME_SHOWN_KEY) || '[]');
    if (!shownUsers.includes(user.id)) {
      const timer = setTimeout(() => setIsOpen(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const handleClose = () => {
    if (!user) return;
    const shownUsers = JSON.parse(localStorage.getItem(WELCOME_SHOWN_KEY) || '[]');
    if (!shownUsers.includes(user.id)) {
      shownUsers.push(user.id);
      localStorage.setItem(WELCOME_SHOWN_KEY, JSON.stringify(shownUsers));
    }
    setIsOpen(false);
  };

  const handleNavigate = (route: string) => {
    handleClose();
    navigate(route);
  };

  const steps = [
    {
      icon: Sparkles,
      title: 'Bem-vindo(a)',
      subtitle: 'à Consciência Divinal',
      content: (
        <div className="space-y-6 text-center">
          <div className="relative py-4">
            <Quote className="w-8 h-8 text-amber-500/30 absolute -top-1 left-0" />
            <p className="text-base italic text-amber-700 dark:text-amber-100/90 font-light px-6 leading-relaxed">
              "Quem sabe o Criador não trouxe você aqui pra tomar uma xícara de chá conosco"
            </p>
            <Quote className="w-8 h-8 text-amber-500/30 absolute -bottom-1 right-0 rotate-180" />
          </div>

          <div className="w-16 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent mx-auto" />

          <p className="text-muted-foreground text-sm">
            É uma alegria imensa ter você conosco nesta jornada de autoconhecimento e cura.
            Este é um espaço sagrado de acolhimento.
          </p>
        </div>
      ),
    },
    {
      icon: ClipboardList,
      title: 'Sua Ficha',
      subtitle: 'de Anamnese',
      content: (
        <div className="space-y-5">
          <p className="text-muted-foreground text-center text-sm">
            Para que possamos te acolher da melhor forma, é <span className="text-amber-600 dark:text-amber-400 font-semibold">obrigatório</span> que você
            preencha sua <span className="text-amber-600 dark:text-amber-400 font-medium">Ficha de Anamnese</span>.
          </p>

          <div className="bg-destructive/8 rounded-xl p-4 border border-destructive/20">
            <p className="text-sm text-destructive/90 dark:text-red-400">
              ⚠️ <strong>Importante:</strong> Sem a ficha preenchida, você não poderá:
            </p>
            <ul className="text-sm text-destructive/70 dark:text-red-400/80 mt-2 space-y-1 ml-4">
              <li>• Se inscrever em cerimônias</li>
              <li>• Acessar a loja</li>
              <li>• Usar a biblioteca</li>
            </ul>
          </div>

          <div className="bg-amber-500/8 rounded-xl p-4 border border-amber-500/20">
            <p className="text-sm text-amber-700 dark:text-amber-300/90">
              📋 A ficha nos ajuda a entender sua história, condições de saúde e
              expectativas, garantindo uma experiência segura e personalizada.
            </p>
          </div>

          <Button
            className="w-full bg-amber-600 hover:bg-amber-700 text-white"
            onClick={() => handleNavigate(ROUTES.ANAMNESE)}
          >
            <ClipboardList className="w-4 h-4 mr-2" />
            Preencher Minha Ficha Agora
          </Button>
        </div>
      ),
    },
    {
      icon: Leaf,
      title: 'Conheça',
      subtitle: 'as Medicinas Sagradas',
      content: (
        <div className="space-y-5">
          <p className="text-muted-foreground text-center text-sm">
            Antes de participar de uma cerimônia, recomendamos que você conheça
            as <span className="text-emerald-600 dark:text-emerald-400 font-medium">Medicinas Sagradas</span> que trabalhamos.
          </p>

          <p className="text-muted-foreground/70 text-center text-xs">
            Entender sobre cada medicina te ajudará a se preparar melhor e
            aproveitar ao máximo sua experiência.
          </p>

          <Button
            variant="outline"
            className="w-full border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
            onClick={() => handleNavigate(ROUTES.MEDICINAS)}
          >
            <Leaf className="w-4 h-4 mr-2" />
            Conhecer as Medicinas
          </Button>
        </div>
      ),
    },
    {
      icon: MessageCircleHeart,
      title: 'Partilhas',
      subtitle: 'da Comunidade',
      content: (
        <div className="space-y-5">
          <p className="text-muted-foreground text-center text-sm">
            Se você está com dúvidas ou receios, saiba que isso é completamente normal.
          </p>

          <p className="text-muted-foreground text-center text-sm">
            Convidamos você a ler as <span className="text-rose-600 dark:text-rose-400 font-medium">Partilhas</span> de
            outros participantes — relatos reais de experiências transformadoras.
          </p>

          <div className="bg-rose-500/8 rounded-xl p-4 border border-rose-500/20">
            <p className="text-sm text-rose-700 dark:text-rose-300/90 text-center">
              💛 Você não está sozinho(a) nessa jornada.<br />
              Estamos aqui para te apoiar em cada passo.
            </p>
          </div>

          <Button
            variant="outline"
            className="w-full border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10"
            onClick={() => handleNavigate(ROUTES.PARTILHAS)}
          >
            <MessageCircleHeart className="w-4 h-4 mr-2" />
            Ver Partilhas
          </Button>
        </div>
      ),
    },
  ];

  const currentStep = steps[step];
  const isLastStep = step === steps.length - 1;
  const Icon = currentStep.icon;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md w-[calc(100%-2rem)] rounded-2xl p-0 flex flex-col max-h-[90dvh] overflow-hidden">
        {/* Header com gradiente — fixo */}
        <div className="relative pt-7 pb-4 px-6 bg-gradient-to-b from-muted/60 to-transparent shrink-0">
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-amber-500/30 rounded-full blur-3xl" />
          </div>

          <div className="relative mx-auto mb-3 w-14 h-14 rounded-full bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 flex items-center justify-center">
            <Icon className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </div>

          <div className="text-center relative">
            <h2 className="text-xl font-display text-foreground tracking-wide">
              {currentStep.title}
            </h2>
            <p className="text-amber-600/80 dark:text-amber-400/80 text-xs font-light tracking-widest uppercase mt-0.5">
              {currentStep.subtitle}
            </p>
          </div>
        </div>

        {/* Conteúdo — scrollável */}
        <div className="px-6 py-4 overflow-y-auto flex-1">
          {currentStep.content}
        </div>

        {/* Indicadores de progresso — fixo */}
        <div className="flex justify-center gap-2 py-3 border-t border-border/50 shrink-0">
          {steps.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step
                  ? 'bg-amber-500 w-8'
                  : i < step
                    ? 'bg-amber-500/50 w-1.5'
                    : 'bg-border w-1.5 hover:bg-muted-foreground/40'
              }`}
            />
          ))}
        </div>

        {/* Footer — fixo */}
        <DialogFooter className="flex-row gap-2 sm:justify-between px-6 pb-5 pt-2 shrink-0">
          {step > 0 ? (
            <Button
              variant="ghost"
              onClick={() => setStep(s => s - 1)}
              className="text-muted-foreground hover:text-foreground"
            >
              Voltar
            </Button>
          ) : (
            <Button
              variant="ghost"
              onClick={handleClose}
              className="text-muted-foreground/70 hover:text-muted-foreground hover:bg-transparent text-sm"
            >
              Pular
            </Button>
          )}

          {isLastStep ? (
            <Button
              onClick={handleClose}
              className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white border-0"
            >
              Começar Jornada
              <Sparkles className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={() => setStep(s => s + 1)}
              className="gap-1"
            >
              Próximo
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeModal;
