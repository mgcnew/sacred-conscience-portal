import React, { memo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';
import { Package, ShoppingCart, Star, ShieldCheck, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Produto } from '@/types';

interface LojaInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  produto: Produto | null;
  onComprar: () => void;
}

const formatPrice = (centavos: number): string => {
  return (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const InfoContent: React.FC<{
  produto: Produto;
  onComprar: () => void;
  onClose: () => void;
}> = ({ produto, onComprar, onClose }) => (
  <div className="space-y-6">
    {/* Imagem do Produto */}
    <div className="relative rounded-[2rem] overflow-hidden aspect-square bg-muted shadow-inner">
      {produto.imagem_url ? (
        <img
          src={produto.imagem_url}
          alt={produto.nome}
          className="w-full h-full object-cover"
          decoding="async"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Package className="w-20 h-20 text-muted-foreground/20" />
        </div>
      )}
      
      {/* Badges na Imagem */}
      <div className="absolute top-4 left-4 flex flex-col gap-2">
        {produto.destaque && (
          <Badge className="bg-amber-500 hover:bg-amber-500 text-[10px] uppercase font-black tracking-widest border-none px-3 h-6 shadow-lg">
            <Star className="w-3 h-3 mr-1 fill-white" /> Destaque
          </Badge>
        )}
        {produto.preco_promocional && (
          <Badge className="bg-red-500 hover:bg-red-500 text-[10px] uppercase font-black tracking-widest border-none px-3 h-6 shadow-lg">
            {Math.round((1 - produto.preco_promocional / produto.preco) * 100)}% OFF
          </Badge>
        )}
      </div>
    </div>

    {/* Detalhes do Produto */}
    <div className="space-y-4 px-1">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          {produto.categoria && (
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
              {produto.categoria}
            </span>
          )}
          <h3 className="font-display text-2xl font-bold leading-tight text-foreground">
            {produto.nome}
          </h3>
        </div>
      </div>

      {produto.descricao && (
        <div className="bg-muted/30 p-4 rounded-2xl border border-border/40">
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {produto.descricao}
          </p>
        </div>
      )}

      {/* Preço e Estoque */}
      <div className="flex items-center justify-between py-4 border-y border-dashed">
        <div className="flex flex-col">
          {produto.preco_promocional ? (
            <div className="flex flex-col -space-y-1">
              <span className="text-xs text-muted-foreground line-through opacity-60">
                {formatPrice(produto.preco)}
              </span>
              <span className="text-3xl font-black text-primary">
                {formatPrice(produto.preco_promocional)}
              </span>
            </div>
          ) : (
            <span className="text-3xl font-black text-foreground">
              {formatPrice(produto.preco)}
            </span>
          )}
        </div>
        
        <div className="text-right space-y-1">
          {produto.estoque > 5 ? (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-green-500/10 rounded-full w-fit ml-auto">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span className="text-[10px] font-bold text-green-600 uppercase">Em estoque</span>
            </div>
          ) : produto.estoque > 0 ? (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 rounded-full w-fit ml-auto">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-[10px] font-bold text-amber-600 uppercase">Apenas {produto.estoque}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-destructive/10 rounded-full w-fit ml-auto">
              <div className="w-1.5 h-1.5 rounded-full bg-destructive" />
              <span className="text-[10px] font-bold text-destructive uppercase">Esgotado</span>
            </div>
          )}
          <p className="text-[10px] text-muted-foreground">Disponível para entrega imediata</p>
        </div>
      </div>

      {/* Selo de Confiança */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10">
        <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
        <p className="text-[11px] text-muted-foreground leading-snug">
          Produto artesanal consagrado. Garantia de procedência e qualidade para sua jornada espiritual.
        </p>
      </div>

      <Button
        className={cn(
          "w-full rounded-2xl h-14 text-lg font-black uppercase tracking-widest transition-all shadow-xl active:scale-95",
          produto.estoque === 0 ? "bg-muted" : "bg-primary hover:bg-primary/90 shadow-primary/20"
        )}
        disabled={produto.estoque === 0}
        onClick={() => {
          onClose();
          onComprar();
        }}
      >
        {produto.estoque === 0 ? (
          'Produto Esgotado'
        ) : (
          <>
            <ShoppingCart className="w-5 h-5 mr-3" />
            Comprar Agora
          </>
        )}
      </Button>
    </div>
  </div>
);

const LojaInfoModal: React.FC<LojaInfoModalProps> = ({
  isOpen, onClose, produto, onComprar
}) => {
  const isMobile = useIsMobile();

  if (!isOpen || !produto) return null;

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DrawerContent className="max-h-[95vh] rounded-t-[3rem] border-none shadow-2xl">
          <div className="mx-auto w-12 h-1.5 bg-muted rounded-full mt-4 mb-2" />
          <div className="px-6 pb-10 pt-4 overflow-y-auto">
            <InfoContent produto={produto} onComprar={onComprar} onClose={onClose} />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl p-0 overflow-hidden rounded-[3rem] border-none shadow-2xl">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 z-20 h-10 w-10 rounded-full bg-background/80 backdrop-blur-md flex items-center justify-center shadow-lg hover:bg-background transition-colors active:scale-90"
        >
          <X className="w-5 h-5 text-foreground" />
        </button>
        <div className="p-8 max-h-[90vh] overflow-y-auto scrollbar-none">
          <InfoContent produto={produto} onComprar={onComprar} onClose={onClose} />
        </div>
      </DialogContent>
    </Dialog>
  );
};


export default memo(LojaInfoModal);
