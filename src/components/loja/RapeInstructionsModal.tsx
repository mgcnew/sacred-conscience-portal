import React, { memo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Leaf, Heart, AlertCircle } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface RapeInstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const InstructionsContent: React.FC = () => (
  <div className="space-y-4">
    <div className="bg-green-500/10 p-4 rounded-lg border border-green-500/20">
      <p className="text-sm text-green-700 dark:text-green-400 font-medium">
        ✓ Seu pagamento foi confirmado! Você receberá um email com os detalhes do pedido.
      </p>
    </div>

    <div className="space-y-3">
      <h4 className="font-medium text-foreground flex items-center gap-2">
        <Heart className="w-4 h-4 text-primary" />
        Instruções para o Bom Uso
      </h4>
      
      <div className="bg-primary/5 p-4 rounded-lg space-y-3 text-sm">
        <p className="text-muted-foreground">
          <strong className="text-foreground">Preparação:</strong> Antes de usar o rapé, encontre um local tranquilo e silencioso. 
          Faça uma breve meditação ou oração para conectar-se com a medicina.
        </p>
        
        <p className="text-muted-foreground">
          <strong className="text-foreground">Intenção:</strong> Defina uma intenção clara antes de cada uso. 
          O rapé é uma medicina sagrada que trabalha com suas intenções e orações.
        </p>
        
        <p className="text-muted-foreground">
          <strong className="text-foreground">Dosagem:</strong> Comece com pequenas quantidades, especialmente se for iniciante. 
          Uma quantidade do tamanho de uma ervilha para cada narina é suficiente.
        </p>
        
        <p className="text-muted-foreground">
          <strong className="text-foreground">Aplicação:</strong> Use um aplicador (kuripe para autoaplicação ou tepi para aplicação por outra pessoa). 
          Sopre de forma firme e constante.
        </p>
        
        <p className="text-muted-foreground">
          <strong className="text-foreground">Após o uso:</strong> Permaneça em silêncio por alguns minutos. 
          Deixe a medicina trabalhar. Evite assoar o nariz imediatamente.
        </p>
      </div>

      <div className="bg-amber-500/10 p-4 rounded-lg border border-amber-500/20">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-amber-700 dark:text-amber-400">Cuidados Importantes</p>
            <ul className="text-muted-foreground mt-1 space-y-1">
              <li>• Armazene em local seco e fresco</li>
              <li>• Mantenha longe do alcance de crianças</li>
              <li>• Não use se estiver grávida ou amamentando</li>
              <li>• Evite uso excessivo ou recreativo</li>
              <li>• Respeite a medicina e use com consciência</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const RapeInstructionsModal: React.FC<RapeInstructionsModalProps> = ({ isOpen, onClose }) => {
  const isMobile = useIsMobile();

  if (!isOpen) return null;

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle className="font-display text-xl text-primary flex items-center gap-2">
              <Leaf className="w-5 h-5" />
              Compra Realizada com Sucesso!
            </DrawerTitle>
            <DrawerDescription>Orientações sagradas para o bom uso do Rapé</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-2 overflow-y-auto">
            <InstructionsContent />
          </div>
          <DrawerFooter>
            <Button onClick={onClose} className="w-full">Entendi, Gratidão!</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-primary flex items-center gap-2">
            <Leaf className="w-5 h-5" />
            Compra Realizada com Sucesso!
          </DialogTitle>
          <DialogDescription>Orientações sagradas para o bom uso do Rapé</DialogDescription>
        </DialogHeader>
        <InstructionsContent />
        <DialogFooter>
          <Button onClick={onClose} className="w-full">Entendi, Gratidão!</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default memo(RapeInstructionsModal);
