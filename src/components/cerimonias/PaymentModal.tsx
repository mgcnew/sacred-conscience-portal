import { useState, useEffect, useCallback, memo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from "@/components/ui/drawer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2, Copy, CreditCard, Loader2, ArrowLeft, Smartphone, Banknote, ShieldCheck } from "lucide-react";
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { APP_CONFIG } from '@/config/app';
import { useIsMobile } from '@/hooks/useIsMobile';
import PaymentMethodSelector from '@/components/payment/PaymentMethodSelector';
import { cn } from "@/lib/utils";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (paymentMethod: string) => void;
  ceremonyTitle: string;
  ceremonyValue: number | null;
  ceremonyId: string;
  userId: string;
  userEmail: string;
  userName: string;
  isPending: boolean;
}

const PIX_KEY = APP_CONFIG.pix.chave;
const PIX_NOME = APP_CONFIG.pix.favorecido;

const formatValue = (centavos: number | null): string => {
  if (!centavos) return 'A consultar';
  return (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

// Conteúdo compartilhado
const PaymentContent: React.FC<{
  ceremonyTitle: string;
  ceremonyValue: number | null;
  paymentMethod: string;
  setPaymentMethod: (v: string) => void;
  handleCopyPixKey: () => void;
  showMPOptions: boolean;
  selectedMPMethod: string;
  onMPMethodSelect: (forma: string, valorFinal: number) => void;
  onBackFromMP: () => void;
  valorComTaxa: number;
}> = ({ ceremonyTitle, ceremonyValue, paymentMethod, setPaymentMethod, handleCopyPixKey, showMPOptions, selectedMPMethod, onMPMethodSelect, onBackFromMP, valorComTaxa }) => (
  <div className="space-y-4">
    {/* Tela de seleção de forma de pagamento MP */}
    {showMPOptions && ceremonyValue ? (
      <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onBackFromMP} 
          className="mb-2 -ml-2 h-8 text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Voltar
        </Button>
        
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Escolha como pagar online</p>
          <h4 className="font-display text-lg leading-tight text-foreground">{ceremonyTitle}</h4>
        </div>

        <div className="rounded-xl border bg-muted/30 p-1">
          <PaymentMethodSelector
            valorBase={ceremonyValue}
            onSelect={onMPMethodSelect}
            selectedMethod={selectedMPMethod}
          />
        </div>

        {selectedMPMethod && valorComTaxa > 0 && (
          <div className="bg-primary/5 p-4 rounded-2xl border border-primary/20 flex items-center justify-between animate-in zoom-in-95 duration-300">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Total Final</p>
              <p className="text-2xl font-black text-primary">{formatValue(valorComTaxa)}</p>
            </div>
            <div className="text-right">
              <Badge variant="secondary" className="bg-green-500/10 text-green-600 hover:bg-green-500/10 border-none text-[10px] py-0 px-2">
                AUTO-CONFIRMA
              </Badge>
              <p className="text-[9px] text-muted-foreground mt-1">Processado pelo Mercado Pago</p>
            </div>
          </div>
        )}
      </div>
    ) : (
      <div className="animate-in fade-in slide-in-from-left-4 duration-300 space-y-5">
        {/* Resumo Compacto */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10">
          <div className="space-y-0.5">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Contribuição</p>
            <h4 className="font-display text-sm font-semibold text-foreground line-clamp-1">{ceremonyTitle}</h4>
          </div>
          <div className="text-right">
            <p className="text-xl font-black text-primary font-display">{formatValue(ceremonyValue)}</p>
          </div>
        </div>

        {/* Alerta de Prazo */}
        <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-800/80 dark:text-amber-200/80 leading-snug">
            Para garantir sua vaga, realize a contribuição até <span className="font-bold text-amber-600 dark:text-amber-400">5 dias antes</span> da cerimônia.
          </p>
        </div>

        {/* Aviso de responsabilidade */}
        <div className="flex items-start gap-3 p-3 rounded-xl bg-primary/5 border border-primary/15">
          <span className="text-base leading-none mt-0.5">🌿</span>
          <p className="text-[11px] text-foreground/70 leading-snug">
            Cada vaga é preciosa e pode ser a jornada de outra pessoa. <span className="font-semibold text-foreground/90">Confirme apenas se tiver certeza da sua presença.</span> Caso precise desistir, avise-nos com pelo menos <span className="font-semibold text-foreground/90">3 dias de antecedência</span> — assim honramos o espaço sagrado e quem aguarda uma oportunidade.
          </p>
        </div>

        {/* Seleção de Pagamento Visual */}
        <div className="space-y-3">
          <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold ml-1">
            Forma de Pagamento
          </Label>
          <div className="grid grid-cols-1 gap-2">
            {[
              { id: 'online', label: 'Pagar Online', desc: 'Pix ou Cartão (Auto-confirma)', icon: CreditCard, color: 'text-primary' },
              { id: 'pix', label: 'Pix Manual', desc: 'Envio de comprovante necessário', icon: Smartphone, color: 'text-green-500' },
              { id: 'dinheiro', label: 'Dinheiro', desc: 'No local da cerimônia', icon: Banknote, color: 'text-amber-500' }
            ].map((method) => (
              <button
                key={method.id}
                onClick={() => setPaymentMethod(method.id)}
                className={cn(
                  "flex items-center gap-4 p-3 rounded-xl border-2 text-left transition-all duration-200 active:scale-[0.98]",
                  paymentMethod === method.id 
                    ? "border-primary bg-primary/5 shadow-sm" 
                    : "border-border/50 bg-card hover:border-primary/30 hover:bg-muted/30"
                )}
              >
                <div className={cn("p-2 rounded-lg bg-background shadow-sm", method.color)}>
                  <method.icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground">{method.label}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{method.desc}</p>
                </div>
                {paymentMethod === method.id && (
                  <CheckCircle2 className="w-5 h-5 text-primary animate-in zoom-in duration-300" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Detalhes específicos por método */}
        {paymentMethod === 'online' && (
          <div className="p-3 rounded-xl bg-green-500/5 border border-green-500/10 flex items-center gap-3 animate-in slide-in-from-top-2">
            <ShieldCheck className="w-5 h-5 text-green-600 shrink-0" />
            <p className="text-[11px] text-green-700 dark:text-green-400 font-medium">
              Pagamento 100% seguro com confirmação instantânea após a transação.
            </p>
          </div>
        )}

        {paymentMethod === 'pix' && (
          <div className="space-y-2 animate-in slide-in-from-top-2">
            <div className="p-4 rounded-xl border border-dashed border-primary/30 bg-primary/5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Chave Pix (CNPJ)</span>
                <Button size="sm" variant="ghost" className="h-7 px-2 text-primary hover:bg-primary/10" onClick={handleCopyPixKey}>
                  <Copy className="w-3 h-3 mr-1.5" />
                  <span className="text-[10px]">Copiar</span>
                </Button>
              </div>
              <p className="font-mono text-sm font-bold tracking-wider text-center py-2 bg-background/50 rounded-lg border border-primary/10">
                {PIX_KEY}
              </p>
              <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground">
                <span>Favorecido:</span>
                <span className="font-bold text-foreground">{PIX_NOME}</span>
              </div>
            </div>
            <p className="text-[10px] text-center text-muted-foreground italic">
              * Após pagar, sua inscrição ficará como "pendente" até conferirmos o comprovante.
            </p>
          </div>
        )}
      </div>
    )}
  </div>
);

// Botões compartilhados
const PaymentButtons: React.FC<{
  onClose: () => void;
  handleConfirm: () => void;
  paymentMethod: string;
  isPending: boolean;
  isProcessingOnline: boolean;
  isMobile?: boolean;
  showMPOptions: boolean;
  selectedMPMethod: string;
}> = ({ onClose, handleConfirm, paymentMethod, isPending, isProcessingOnline, isMobile, showMPOptions, selectedMPMethod }) => {
  const getButtonText = () => {
    if (isProcessingOnline) return <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Iniciando...</>;
    if (isPending) return "Confirmando...";
    if (paymentMethod === 'online' && !showMPOptions) return "Continuar para Pagamento";
    if (paymentMethod === 'online' && showMPOptions) return "Pagar Agora";
    return "Confirmar Presença";
  };

  const isDisabled = () => {
    if (!paymentMethod || isPending || isProcessingOnline) return true;
    if (paymentMethod === 'online' && showMPOptions && !selectedMPMethod) return true;
    return false;
  };

  return (
    <div className={cn("flex gap-2 w-full", isMobile ? "flex-col-reverse" : "justify-end")}>
      <Button 
        variant="ghost" 
        onClick={onClose} 
        className={cn("rounded-xl h-11 font-bold text-muted-foreground", isMobile ? "w-full" : "px-6")}
      >
        Cancelar
      </Button>
      <Button
        onClick={handleConfirm}
        disabled={isDisabled()}
        className={cn(
          "rounded-xl h-11 font-bold transition-all shadow-lg", 
          isMobile ? "w-full" : "px-8",
          paymentMethod === 'online' ? "bg-primary hover:bg-primary/90 shadow-primary/20" : "bg-primary"
        )}
      >
        {getButtonText()}
      </Button>
    </div>
  );
};


const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen, onClose, onConfirm, ceremonyTitle, ceremonyValue,
  ceremonyId, userId, userEmail, userName, isPending
}) => {
  const isMobile = useIsMobile();
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [isProcessingOnline, setIsProcessingOnline] = useState(false);
  const [showMPOptions, setShowMPOptions] = useState(false);
  const [selectedMPMethod, setSelectedMPMethod] = useState<string>("");
  const [valorComTaxa, setValorComTaxa] = useState<number>(0);

  useEffect(() => {
    if (!isOpen) {
      setPaymentMethod("");
      setIsProcessingOnline(false);
      setShowMPOptions(false);
      setSelectedMPMethod("");
      setValorComTaxa(0);
    }
  }, [isOpen]);

  const handleMPMethodSelect = (forma: string, valorFinal: number) => {
    setSelectedMPMethod(forma);
    setValorComTaxa(valorFinal);
  };

  const handleConfirm = async () => {
    if (!paymentMethod) return;

    // Se escolheu online mas ainda não selecionou a forma de pagamento MP
    if (paymentMethod === 'online' && !showMPOptions) {
      setShowMPOptions(true);
      return;
    }

    // Pagamento online com forma selecionada
    if (paymentMethod === 'online' && selectedMPMethod && valorComTaxa > 0) {
      setIsProcessingOnline(true);
      try {
        const { data: inscricao, error: inscricaoError } = await supabase
          .from('inscricoes')
          .insert({ user_id: userId, cerimonia_id: ceremonyId, forma_pagamento: 'online' })
          .select('id')
          .single();

        if (inscricaoError) throw inscricaoError;

        const response = await supabase.functions.invoke('create-checkout', {
          body: {
            inscricao_id: inscricao.id,
            cerimonia_id: ceremonyId,
            cerimonia_nome: ceremonyTitle,
            valor_centavos: valorComTaxa, // Valor com taxa
            valor_original: ceremonyValue, // Valor original para registro
            forma_pagamento_mp: selectedMPMethod,
            user_email: userEmail,
            user_name: userName,
          },
        });

        if (response.error) throw new Error(response.error.message);

        const url = response.data.checkout_url || response.data.sandbox_url;
        if (url) window.location.href = url;
        else throw new Error('URL de checkout não retornada');
      } catch (error) {
        console.error('Erro ao criar checkout:', error);
        toast.error('Erro ao processar pagamento', {
          description: 'Tente novamente ou escolha outra forma de pagamento.',
        });
        setIsProcessingOnline(false);
      }
      return;
    }

    onConfirm(paymentMethod);
  };

  const handleBackFromMP = () => {
    setShowMPOptions(false);
    setSelectedMPMethod("");
    setValorComTaxa(0);
  };

  const handleCopyPixKey = useCallback(() => {
    navigator.clipboard.writeText(PIX_KEY);
    toast.success('Chave Pix copiada!');
  }, []);

  if (!isOpen) return null;

  // Mobile: Drawer
  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DrawerContent className="max-h-[95vh]">
          <div className="mx-auto w-12 h-1.5 bg-muted rounded-full mt-4 mb-2" />
          <DrawerHeader className="pb-2">
            <DrawerTitle className="font-display text-2xl font-bold text-primary text-center">
              {showMPOptions ? 'Pagamento Online' : 'Confirmar Presença'}
            </DrawerTitle>
          </DrawerHeader>
          <div className="px-5 pb-6 overflow-y-auto">
            <PaymentContent
              ceremonyTitle={ceremonyTitle}
              ceremonyValue={ceremonyValue}
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              handleCopyPixKey={handleCopyPixKey}
              showMPOptions={showMPOptions}
              selectedMPMethod={selectedMPMethod}
              onMPMethodSelect={handleMPMethodSelect}
              onBackFromMP={handleBackFromMP}
              valorComTaxa={valorComTaxa}
            />
          </div>
          <DrawerFooter className="pt-2 border-t bg-muted/10">
            <PaymentButtons
              onClose={onClose}
              handleConfirm={handleConfirm}
              paymentMethod={paymentMethod}
              isPending={isPending}
              isProcessingOnline={isProcessingOnline}
              isMobile
              showMPOptions={showMPOptions}
              selectedMPMethod={selectedMPMethod}
            />
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: Dialog
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[440px] p-0 overflow-hidden rounded-[2rem] border-none shadow-2xl">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="font-display text-2xl font-bold text-primary">
            {showMPOptions ? 'Pagamento Online' : 'Confirmar Presença'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="p-6 pt-4">
          <PaymentContent
            ceremonyTitle={ceremonyTitle}
            ceremonyValue={ceremonyValue}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            handleCopyPixKey={handleCopyPixKey}
            showMPOptions={showMPOptions}
            selectedMPMethod={selectedMPMethod}
            onMPMethodSelect={handleMPMethodSelect}
            onBackFromMP={handleBackFromMP}
            valorComTaxa={valorComTaxa}
          />
        </div>

        <div className="p-6 pt-4 bg-muted/20 border-t flex justify-end">
          <PaymentButtons
            onClose={onClose}
            handleConfirm={handleConfirm}
            paymentMethod={paymentMethod}
            isPending={isPending}
            isProcessingOnline={isProcessingOnline}
            showMPOptions={showMPOptions}
            selectedMPMethod={selectedMPMethod}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};


export default memo(PaymentModal);
