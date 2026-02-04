import React, { useState, memo, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, CheckCircle2, Copy, CreditCard, Loader2, Minus, Plus, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';
import { APP_CONFIG } from '@/config/app';
import PaymentMethodSelector from '@/components/payment/PaymentMethodSelector';
import type { Produto } from '@/types';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  produto: Produto | null;
  userEmail: string;
  userName: string;
}

const PIX_KEY = APP_CONFIG.pix.chave;
const PIX_NOME = APP_CONFIG.pix.favorecido;

// Conteúdo do produto e quantidade
const ProductContent: React.FC<{
  produto: Produto;
  quantidade: number;
  maxQuantidade: number;
  valorUnitario: number;
  valorTotal: number;
  onQuantidadeChange: (delta: number) => void;
  setQuantidade: (q: number) => void;
  paymentMethod: string;
  setPaymentMethod: (v: string) => void;
  handleCopyPixKey: () => void;
}> = ({ produto, quantidade, maxQuantidade, valorUnitario, valorTotal, onQuantidadeChange, setQuantidade, paymentMethod, setPaymentMethod, handleCopyPixKey }) => (
  <div className="space-y-4">
    <div className="flex gap-4">
      {produto.imagem_url && (
        <img
          src={produto.imagem_url}
          alt={produto.nome}
          className="w-20 h-20 object-cover rounded-lg"
          decoding="async"
        />
      )}
      <div className="flex-1">
        <h4 className="font-medium">{produto.nome}</h4>
        <p className="text-sm text-muted-foreground">
          {valorUnitario.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} cada
        </p>
      </div>
    </div>

    <div className="space-y-2">
      <Label>Quantidade</Label>
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onQuantidadeChange(-1)}
          disabled={quantidade <= 1}
        >
          <Minus className="w-4 h-4" />
        </Button>
        <Input
          type="number"
          value={quantidade}
          onChange={(e) => {
            const val = parseInt(e.target.value);
            if (val >= 1 && val <= maxQuantidade) setQuantidade(val);
          }}
          className="w-20 text-center"
          min={1}
          max={maxQuantidade}
        />
        <Button
          variant="outline"
          size="icon"
          onClick={() => onQuantidadeChange(1)}
          disabled={quantidade >= maxQuantidade}
        >
          <Plus className="w-4 h-4" />
        </Button>
        <span className="text-sm text-muted-foreground">({produto.estoque} disponíveis)</span>
      </div>
    </div>

    <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
      <div className="flex justify-between items-center">
        <span className="text-muted-foreground">Total:</span>
        <span className="text-2xl font-bold text-primary">
          {valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </span>
      </div>
    </div>

    <div className="space-y-2">
      <Label className="text-sm">Forma de Pagamento</Label>
      <Select onValueChange={setPaymentMethod} value={paymentMethod}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Selecione como pagar" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="online">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Pagar Online (Pix, Cartão)
            </div>
          </SelectItem>
          <SelectItem value="pix">Pix Manual</SelectItem>
          <SelectItem value="dinheiro">Dinheiro (no local)</SelectItem>
        </SelectContent>
      </Select>
    </div>

    {paymentMethod === 'online' && (
      <div className="bg-green-500/10 p-3 rounded-lg border border-green-500/20 space-y-2">
        <p className="text-sm font-medium text-foreground flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-green-600" />
          Pagamento Seguro
        </p>
        <p className="text-xs text-muted-foreground">
          Escolha entre PIX, Cartão de crédito ou débito.
        </p>
        <p className="text-xs text-green-600 font-medium">
          ✓ Confirmação automática após pagamento
        </p>
      </div>
    )}

    {paymentMethod === 'pix' && (
      <div className="bg-primary/5 p-3 rounded-lg border border-primary/20 space-y-2">
        <p className="text-sm font-medium text-foreground flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-primary" />
          Dados Pix
        </p>
        <div className="bg-background p-2 rounded border border-border space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs text-muted-foreground">Chave Pix</p>
              <code className="text-sm font-mono">{PIX_KEY}</code>
            </div>
            <Button size="sm" variant="ghost" onClick={handleCopyPixKey}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          <div className="pt-2 border-t border-border text-xs">
            <span className="text-muted-foreground">Favorecido: </span>
            <span className="font-medium">{PIX_NOME}</span>
          </div>
        </div>
        <p className="text-xs text-amber-600">
          Envie o comprovante para confirmar seu pedido.
        </p>
      </div>
    )}

    {paymentMethod === 'dinheiro' && (
      <div className="bg-amber-500/10 p-3 rounded-lg border border-amber-500/20">
        <p className="text-sm text-amber-700 dark:text-amber-400">
          Pagamento será realizado na retirada do produto.
        </p>
      </div>
    )}
  </div>
);

const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  produto,
  userEmail,
  userName,
}) => {
  const isMobile = useIsMobile();
  const [quantidade, setQuantidade] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [showMPOptions, setShowMPOptions] = useState(false);
  const [selectedMPMethod, setSelectedMPMethod] = useState('');
  const [valorComTaxa, setValorComTaxa] = useState(0);

  if (!produto) return null;

  const precoEmCentavos = produto.preco_promocional || produto.preco;
  const valorUnitario = precoEmCentavos / 100;
  const valorTotalBase = precoEmCentavos * quantidade;
  const valorTotal = valorUnitario * quantidade;
  const maxQuantidade = Math.min(produto.estoque || 10, 10);

  const handleQuantidadeChange = (delta: number) => {
    const novaQuantidade = quantidade + delta;
    if (novaQuantidade >= 1 && novaQuantidade <= maxQuantidade) setQuantidade(novaQuantidade);
  };

  const handleCopyPixKey = useCallback(() => {
    navigator.clipboard.writeText(PIX_KEY);
    toast.success('Chave Pix copiada!');
  }, []);

  const handleMPMethodSelect = (forma: string, valorFinal: number) => {
    setSelectedMPMethod(forma);
    setValorComTaxa(valorFinal);
  };

  const handleBackFromMP = () => {
    setShowMPOptions(false);
    setSelectedMPMethod('');
    setValorComTaxa(0);
  };

  const handleClose = () => {
    setQuantidade(1);
    setPaymentMethod('');
    setShowMPOptions(false);
    setSelectedMPMethod('');
    setValorComTaxa(0);
    onClose();
  };

  const handleConfirm = async () => {
    if (!paymentMethod) return;

    // Se escolheu online mas ainda não selecionou a forma de pagamento MP
    if (paymentMethod === 'online' && !showMPOptions) {
      setShowMPOptions(true);
      return;
    }

    // Pagamento online com forma selecionada - vai para Mercado Pago
    if (paymentMethod === 'online' && selectedMPMethod && valorComTaxa > 0) {
      setIsProcessing(true);
      try {
        const response = await supabase.functions.invoke('create-checkout', {
          body: {
            tipo: 'produto',
            produto_id: produto.id,
            produto_nome: produto.nome,
            quantidade,
            valor_centavos: valorComTaxa,
            valor_original: valorTotalBase,
            forma_pagamento_mp: selectedMPMethod,
            user_email: userEmail,
            user_name: userName,
          },
        });

        if (response.error) throw new Error(response.error.message);

        const url = response.data.checkout_url || response.data.sandbox_url;
        if (url) {
          window.location.href = url;
        } else {
          throw new Error('URL de checkout não retornada');
        }
      } catch (error) {
        console.error('Erro ao criar checkout:', error);
        toast.error('Erro ao processar compra', {
          description: 'Tente novamente mais tarde.',
        });
        setIsProcessing(false);
      }
      return;
    }

    // Pagamento PIX manual ou Dinheiro - cria pedido pendente
    if (paymentMethod === 'pix' || paymentMethod === 'dinheiro') {
      setIsProcessing(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        const { error } = await supabase.from('pagamentos_produtos').insert({
          user_id: user.id,
          produto_id: produto.id,
          quantidade,
          valor_total: valorTotalBase,
          forma_pagamento: paymentMethod,
          status: 'pendente',
        });

        if (error) throw error;

        toast.success('Pedido registrado!', {
          description: paymentMethod === 'pix' 
            ? 'Envie o comprovante do Pix para confirmar.' 
            : 'Pagamento será realizado na retirada.',
        });
        handleClose();
      } catch (error) {
        console.error('Erro ao registrar pedido:', error);
        toast.error('Erro ao registrar pedido', {
          description: 'Tente novamente mais tarde.',
        });
        setIsProcessing(false);
      }
    }
  };

  const getButtonText = () => {
    if (isProcessing) return <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processando...</>;
    if (!paymentMethod) return 'Selecione a forma de pagamento';
    if (paymentMethod === 'online' && !showMPOptions) return 'Escolher forma de pagamento';
    if (paymentMethod === 'online' && showMPOptions && selectedMPMethod) {
      return <><CreditCard className="w-4 h-4 mr-2" />Pagar {(valorComTaxa / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</>;
    }
    if (paymentMethod === 'online' && showMPOptions && !selectedMPMethod) return 'Selecione uma opção';
    if (paymentMethod === 'pix') return 'Confirmar Pedido (Pix)';
    if (paymentMethod === 'dinheiro') return 'Confirmar Pedido (Presencial)';
    return 'Confirmar';
  };

  const isButtonDisabled = () => {
    if (!paymentMethod || isProcessing) return true;
    if (paymentMethod === 'online' && showMPOptions && !selectedMPMethod) return true;
    return false;
  };

  // Conteúdo da seleção de pagamento MP
  const mpOptionsContent = (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={handleBackFromMP} className="-ml-2">
        <ArrowLeft className="w-4 h-4 mr-1" />
        Voltar
      </Button>
      
      <div className="text-center mb-4">
        <p className="text-sm text-muted-foreground">Escolha como pagar</p>
        <p className="text-lg font-semibold">{produto.nome} ({quantidade}x)</p>
      </div>

      <PaymentMethodSelector
        valorBase={valorTotalBase}
        onSelect={handleMPMethodSelect}
        selectedMethod={selectedMPMethod}
      />

      {selectedMPMethod && valorComTaxa > 0 && (
        <div className="bg-green-500/10 p-3 rounded-lg border border-green-500/20 text-center">
          <p className="text-xs text-muted-foreground">Total a pagar</p>
          <p className="text-2xl font-bold text-green-600">
            {(valorComTaxa / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
          <p className="text-xs text-green-600 mt-1">✓ Pagamento seguro via Mercado Pago</p>
        </div>
      )}
    </div>
  );

  const buttons = (
    <>
      <Button variant="outline" onClick={handleClose} className={isMobile ? "w-full" : ""}>
        Cancelar
      </Button>
      <Button 
        onClick={handleConfirm} 
        disabled={isButtonDisabled()} 
        className={isMobile ? "w-full" : ""}
      >
        {getButtonText()}
      </Button>
    </>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DrawerContent className="h-[85vh]">
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-primary" />
              {showMPOptions ? 'Forma de Pagamento' : 'Finalizar Compra'}
            </DrawerTitle>
            <DrawerDescription>
              {showMPOptions ? 'Escolha como deseja pagar' : 'Confirme os detalhes do seu pedido'}
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-2 overflow-y-auto flex-1">
            {showMPOptions ? mpOptionsContent : (
              <ProductContent
                produto={produto}
                quantidade={quantidade}
                maxQuantidade={maxQuantidade}
                valorUnitario={valorUnitario}
                valorTotal={valorTotal}
                onQuantidadeChange={handleQuantidadeChange}
                setQuantidade={setQuantidade}
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                handleCopyPixKey={handleCopyPixKey}
              />
            )}
          </div>
          <DrawerFooter>{buttons}</DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-primary" />
            {showMPOptions ? 'Forma de Pagamento' : 'Finalizar Compra'}
          </DialogTitle>
          <DialogDescription>
            {showMPOptions ? 'Escolha como deseja pagar' : 'Confirme os detalhes do seu pedido'}
          </DialogDescription>
        </DialogHeader>
        {showMPOptions ? mpOptionsContent : (
          <ProductContent
            produto={produto}
            quantidade={quantidade}
            maxQuantidade={maxQuantidade}
            valorUnitario={valorUnitario}
            valorTotal={valorTotal}
            onQuantidadeChange={handleQuantidadeChange}
            setQuantidade={setQuantidade}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            handleCopyPixKey={handleCopyPixKey}
          />
        )}
        <DialogFooter className="gap-2">{buttons}</DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default memo(CheckoutModal);
