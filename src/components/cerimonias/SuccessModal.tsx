import { useState, memo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Sparkles, Heart, ArrowRight, CheckCircle2 } from "lucide-react";
import { useIsMobile } from '@/hooks/useIsMobile';

const DEFAULT_ITENS = [
  '🧻 2 rolos de papel higiênico',
  '🍎 Alimentos para partilha',
  '🕯️ Uma vela',
];

const EMOJI_MAP: { keywords: string[]; emoji: string }[] = [
  { keywords: ['papel higiênico', 'papel higienico', 'papel'], emoji: '🧻' },
  { keywords: ['alimento', 'comida', 'fruta', 'lanche', 'partilha'], emoji: '🍎' },
  { keywords: ['vela', 'velas'], emoji: '🕯️' },
  { keywords: ['água', 'agua', 'garrafa'], emoji: '💧' },
  { keywords: ['roupa', 'roupas', 'vestimenta', 'vestuário'], emoji: '👕' },
  { keywords: ['cobertor', 'manta', 'colchão', 'colchonete'], emoji: '🛏️' },
  { keywords: ['travesseiro', 'almofada'], emoji: '🪄' },
  { keywords: ['toalha'], emoji: '🏳️' },
  { keywords: ['documento', 'rg', 'identidade', 'cpf'], emoji: '🪪' },
  { keywords: ['dinheiro', 'pagamento', 'pix'], emoji: '💰' },
  { keywords: ['medicamento', 'remédio', 'remedio'], emoji: '💊' },
  { keywords: ['incenso'], emoji: '🌿' },
  { keywords: ['cristal', 'pedra'], emoji: '💎' },
  { keywords: ['caderno', 'diário', 'diario', 'caneta'], emoji: '📓' },
  { keywords: ['flor', 'flores'], emoji: '🌸' },
  { keywords: ['terço', 'terco', 'rosário', 'rosario'], emoji: '📿' },
  { keywords: ['sapato', 'sandália', 'sandalia', 'chinelo'], emoji: '👟' },
];

function addEmojiToItem(item: string): string {
  const lower = item.toLowerCase();
  // Já tem emoji no início — não adicionar
  if (/^\p{Emoji}/u.test(item.trim())) return item;
  const match = EMOJI_MAP.find(({ keywords }) =>
    keywords.some(kw => lower.includes(kw))
  );
  return match ? `${match.emoji} ${item}` : item;
}

interface SuccessModalProps {
  isOpen: boolean;
  onComplete: () => void;
  ceremonyName: string;
  itensLevar?: string | null;
}

// Conteúdo Step 1
const Step1Content: React.FC<{ ceremonyName: string }> = ({ ceremonyName }) => (
  <div className="space-y-4 text-center">
    <div className="mx-auto w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center">
      <Sparkles className="w-7 h-7 text-primary" />
    </div>

    <div className="space-y-2">
      <h3 className="font-display text-xl text-primary">🎉 Parabéns!</h3>
      <p className="text-sm">
        Presença confirmada para <span className="text-primary font-medium">{ceremonyName}</span>
      </p>
    </div>

    <div className="bg-primary/5 p-3 rounded-lg border border-primary/10">
      <Heart className="w-4 h-4 text-primary mx-auto mb-2" />
      <p className="text-xs text-muted-foreground italic leading-relaxed">
        "Uma nova jornada se inicia. Que esta cerimônia traga luz e as transformações que sua alma busca."
      </p>
    </div>
  </div>
);

// Conteúdo Step 2 — itens dinâmicos por cerimônia
const Step2Content: React.FC<{ itensLevar?: string | null }> = ({ itensLevar }) => {
  const itens = itensLevar
    ? itensLevar.split('\n').map(l => l.trim()).filter(Boolean).map(addEmojiToItem)
    : DEFAULT_ITENS;

  return (
    <div className="space-y-4 text-center">
      <div className="mx-auto w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center">
        <img src="/emblema.png" alt="Consciência Divinal" className="w-9 h-9 object-contain" />
      </div>

      <div className="space-y-2">
        <h3 className="font-display text-xl text-primary">📝 O que levar?</h3>
        <p className="text-xs text-muted-foreground">
          Com cuidado e intenção, prepare o que levar:
        </p>
      </div>

      <div className="bg-primary/5 p-3 rounded-lg border border-primary/20 space-y-2.5 text-left">
        {itens.map((item, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <p className="text-sm font-medium leading-snug">{item}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const SuccessModal: React.FC<SuccessModalProps> = ({ isOpen, onComplete, ceremonyName, itensLevar }) => {
  const isMobile = useIsMobile();
  const [step, setStep] = useState<1 | 2>(1);

  const handleNext = () => setStep(2);
  const handleFinish = () => {
    setStep(1);
    onComplete();
  };

  if (!isOpen) return null;

  const buttonText = step === 1 ? "Próximo" : "Entendi, ver orientações";
  const handleClick = step === 1 ? handleNext : handleFinish;

  // Mobile: Drawer
  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={() => {}}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="sr-only">
            <DrawerTitle>Confirmação</DrawerTitle>
            <DrawerDescription>Inscrição confirmada</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 py-2">
            {step === 1 ? <Step1Content ceremonyName={ceremonyName} /> : <Step2Content itensLevar={itensLevar} />}
          </div>
          <DrawerFooter>
            <Button onClick={handleClick} className="w-full gap-2">
              {buttonText}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: Dialog
  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md [&>button]:hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Confirmação</DialogTitle>
          <DialogDescription>Inscrição confirmada</DialogDescription>
        </DialogHeader>
        {step === 1 ? <Step1Content ceremonyName={ceremonyName} /> : <Step2Content itensLevar={itensLevar} />}
        <DialogFooter>
          <Button onClick={handleClick} className="w-full gap-2">
            {buttonText}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default memo(SuccessModal);
