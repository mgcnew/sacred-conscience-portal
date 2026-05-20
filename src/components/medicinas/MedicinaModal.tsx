import { useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import type { Medicina } from '@/constants/medicinas';

interface MedicinaModalProps {
  medicinas: Medicina[];
  currentIndex: number;
  onNavigate: (index: number) => void;
  onClose: () => void;
}

/** Converte **negrito** e parágrafos duplos em elementos React */
function renderDetalhes(text: string) {
  return text
    .trim()
    .split(/\n\s*\n/)
    .map((para, pi) => {
      const parts = para.trim().split(/\*\*(.+?)\*\*/g);
      return (
        <p key={pi} className="leading-relaxed text-foreground/85 text-sm">
          {parts.map((part, i) =>
            i % 2 === 1
              ? <strong key={i} className="font-semibold text-foreground">{part}</strong>
              : part
          )}
        </p>
      );
    });
}

const MedicinaModal = ({ medicinas, currentIndex, onNavigate, onClose }: MedicinaModalProps) => {
  const isMobile = useIsMobile();
  const medicina = medicinas[currentIndex];
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < medicinas.length - 1;

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft' && hasPrev) onNavigate(currentIndex - 1);
    if (e.key === 'ArrowRight' && hasNext) onNavigate(currentIndex + 1);
  }, [currentIndex, hasPrev, hasNext, onNavigate]);

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  if (!medicina) return null;

  const IconComponent = medicina.icone;

  const navBar = (hasPrev || hasNext) && (
    <div className="flex items-center justify-between px-1 py-2 border-b border-border/50">
      <button
        onClick={() => hasPrev && onNavigate(currentIndex - 1)}
        disabled={!hasPrev}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors px-2 py-1 rounded-md hover:bg-muted"
      >
        <ChevronLeft className="w-4 h-4" />
        {hasPrev ? medicinas[currentIndex - 1].nome : 'Anterior'}
      </button>

      <span className="text-xs text-muted-foreground font-medium">
        {currentIndex + 1} / {medicinas.length}
      </span>

      <button
        onClick={() => hasNext && onNavigate(currentIndex + 1)}
        disabled={!hasNext}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors px-2 py-1 rounded-md hover:bg-muted"
      >
        {hasNext ? medicinas[currentIndex + 1].nome : 'Próxima'}
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );

  const content = (
    <div className="space-y-5">
      {/* Imagem com fallback */}
      <div className="relative rounded-xl overflow-hidden bg-muted aspect-video">
        <img
          src={medicina.imagem}
          alt={medicina.nome}
          className="w-full h-full object-cover"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
        {/* Fallback visível se imagem falhar */}
        <div className="absolute inset-0 -z-10 flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
          <IconComponent className={`w-16 h-16 opacity-20 ${medicina.cor}`} />
        </div>
      </div>

      {/* Detalhes com markdown */}
      <div className="space-y-3">
        {renderDetalhes(medicina.detalhes)}
      </div>

      {/* Benefícios */}
      <div className="bg-muted/50 rounded-xl p-4 border border-border/50">
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          Principais Benefícios
        </h3>
        <ul className="space-y-2">
          {medicina.beneficios.map((beneficio, index) => (
            <li key={index} className="flex items-start gap-2 text-muted-foreground text-sm">
              <span className="mt-2 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
              <span>{beneficio}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open onOpenChange={(open) => !open && onClose()}>
        <DrawerContent className="max-h-[92vh] flex flex-col">
          <div className="mx-auto w-12 h-1.5 rounded-full bg-muted-foreground/20 mt-2 mb-1 shrink-0" />
          <DrawerHeader className="pb-2 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 shrink-0">
                <IconComponent className={`w-5 h-5 ${medicina.cor}`} />
              </div>
              <div className="min-w-0">
                <DrawerTitle className="text-xl text-primary truncate">{medicina.nome}</DrawerTitle>
                <p className="text-xs text-muted-foreground mt-0.5">{medicina.origem}</p>
              </div>
            </div>
          </DrawerHeader>
          {navBar && <div className="px-4 shrink-0">{navBar}</div>}
          <div className="flex-1 overflow-y-auto px-4 pb-6 pt-3">
            {content}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b shrink-0">
          <DialogHeader>
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10 shrink-0">
                <IconComponent className={`w-6 h-6 ${medicina.cor}`} />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-2xl text-primary">{medicina.nome}</DialogTitle>
                <p className="text-sm text-muted-foreground mt-0.5">{medicina.origem}</p>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Navegação */}
        {navBar && <div className="px-6 shrink-0">{navBar}</div>}

        {/* Conteúdo scrollável */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {content}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MedicinaModal;
