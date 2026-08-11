import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserAnamnese } from '@/hooks/queries/useProfiles';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ClipboardList, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';
import { ROUTES } from '@/constants';

const STORAGE_KEY = 'anamnese-onboarding-v1';

const hasSeenModal = (userId: string): boolean => {
  try {
    const seen: string[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return seen.includes(userId);
  } catch {
    return false;
  }
};

const markModalSeen = (userId: string) => {
  try {
    const seen: string[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (!seen.includes(userId)) {
      seen.push(userId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seen));
    }
  } catch {}
};

const AnamneseWelcomeModal: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState(false);

  const { data: anamnese } = useUserAnamnese(user?.id);
  const hasAnamnese = !!anamnese;

  useEffect(() => {
    if (!user?.id) return;
    if (hasSeenModal(user.id)) return;

    const t = setTimeout(() => setOpen(true), 1500);
    return () => clearTimeout(t);
  }, [user?.id]);

  const dismiss = () => {
    if (user?.id) markModalSeen(user.id);
    setOpen(false);
  };

  const handleGoToAnamnese = () => {
    dismiss();
    navigate(ROUTES.ANAMNESE);
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md w-[calc(100vw-2rem)] max-h-[90vh] p-0 flex flex-col rounded-2xl border-none shadow-2xl [&>button]:hidden overflow-hidden">

        {/* Header fixo com glow */}
        <div className="relative overflow-hidden bg-primary/10 pt-6 pb-4 px-6 text-center shrink-0">
          <div className="relative z-10">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-white shadow-md flex items-center justify-center mb-3">
              <img
                src="/logo-conciencia.webp"
                alt="Consciência Divinal"
                className="w-10 h-10 object-contain"
              />
            </div>
            <h2 className="font-display text-lg font-bold text-foreground leading-snug">
              Seja bem-vindo(a) à sua jornada 🌿
            </h2>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Estamos felizes em ter você no Portal Sagrado da Consciência Divinal.
            </p>
          </div>
        </div>

        {/* Corpo scrollável */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 overscroll-contain scrollbar-mystical">

          {/* O que é a anamnese */}
          <div className="space-y-2.5">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Primeiro passo essencial
            </p>
            {[
              {
                icon: ClipboardList,
                color: 'text-primary bg-primary/10',
                text: 'A Ficha de Anamnese é o seu histórico de saúde e intenções — ela permite que nossa equipe te acolha com segurança e cuidado em cada cerimônia.',
              },
              {
                icon: CheckCircle2,
                color: 'text-emerald-600 bg-emerald-500/10',
                text: 'Todas as informações são confidenciais e utilizadas exclusivamente para garantir a sua segurança espiritual e física.',
              },
            ].map(({ icon: Icon, color, text }, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${color}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
              </div>
            ))}
          </div>

          {/* Alerta */}
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-500/8 border border-amber-500/25">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
              <strong>Atenção:</strong> A confirmação de presença em cerimônias só é possível após o preenchimento completo da ficha de anamnese.
            </p>
          </div>

        </div>

        {/* Footer fixo */}
        <div className="px-6 pb-5 pt-3 flex flex-col gap-3 border-t border-border/40 shrink-0 bg-background">
          {/* Checkbox sempre visível */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <Checkbox
              checked={checked}
              onCheckedChange={(v) => setChecked(!!v)}
              className="mt-0.5 shrink-0"
            />
            <span className="text-sm text-foreground/80 leading-relaxed group-hover:text-foreground transition-colors select-none">
              Compreendo a importância da ficha de anamnese e estou ciente de que preciso preenchê-la para participar das cerimônias.
            </span>
          </label>
          <Button
            onClick={handleGoToAnamnese}
            className="w-full gap-2 font-semibold"
            disabled={!checked}
          >
            <ClipboardList className="w-4 h-4" />
            {hasAnamnese ? 'Ver minha ficha de anamnese' : 'Preencher minha ficha agora'}
            <ArrowRight className="w-4 h-4 ml-auto" />
          </Button>
          <Button
            variant="ghost"
            onClick={dismiss}
            disabled={!checked}
            className="w-full text-muted-foreground text-sm"
          >
            {hasAnamnese ? 'Já está preenchida, continuar' : 'Fazer mais tarde'}
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
};

export default AnamneseWelcomeModal;
