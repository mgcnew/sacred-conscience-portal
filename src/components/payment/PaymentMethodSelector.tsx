import React, { useState, useEffect } from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { CreditCard, Smartphone } from 'lucide-react';

interface TaxaMP {
  id: string;
  forma_pagamento: string;
  nome_exibicao: string;
  taxa_percentual: number;
  parcelas: number;
  ativo: boolean;
  ordem: number;
}

interface PaymentMethodSelectorProps {
  valorBase: number; // em centavos
  onSelect: (forma: string, valorFinal: number) => void;
  selectedMethod: string;
}

const formatCurrency = (centavos: number): string => {
  return (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const getIcon = (forma: string) => {
  if (forma === 'pix') return <Smartphone className="w-5 h-5 text-green-500" />;
  if (forma === 'debito') return <CreditCard className="w-5 h-5 text-blue-500" />;
  return <CreditCard className="w-5 h-5 text-primary" />;
};

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  valorBase,
  onSelect,
  selectedMethod,
}) => {
  const [taxas, setTaxas] = useState<TaxaMP[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTaxas = async () => {
      const { data, error } = await supabase
        .from('config_taxas_mp')
        .select('*')
        .eq('ativo', true)
        .order('ordem');

      if (!error && data) {
        setTaxas(data);
      }
      setLoading(false);
    };

    fetchTaxas();
  }, []);

  const calcularValorFinal = (taxa: TaxaMP): number => {
    const taxaValor = Math.round(valorBase * (taxa.taxa_percentual / 100));
    return valorBase + taxaValor;
  };

  const handleSelect = (forma: string) => {
    const taxa = taxas.find(t => t.forma_pagamento === forma);
    if (taxa) {
      const valorFinal = calcularValorFinal(taxa);
      onSelect(forma, valorFinal);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map(i => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
          Valor Base
        </p>
        <span className="text-sm font-bold text-foreground bg-background px-2 py-0.5 rounded-full border">
          {formatCurrency(valorBase)}
        </span>
      </div>
      
      <RadioGroup value={selectedMethod} onValueChange={handleSelect} className="space-y-1.5">
        {taxas.map((taxa) => {
          const valorFinal = calcularValorFinal(taxa);
          const taxaValor = valorFinal - valorBase;
          const valorParcela = taxa.parcelas > 1 ? Math.ceil(valorFinal / taxa.parcelas) : null;

          return (
            <div key={taxa.id} className="relative">
              <RadioGroupItem
                value={taxa.forma_pagamento}
                id={taxa.forma_pagamento}
                className="peer sr-only"
              />
              <Label
                htmlFor={taxa.forma_pagamento}
                className="flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all duration-200
                  peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 peer-data-[state=checked]:shadow-sm
                  hover:border-primary/40 hover:bg-muted/50 active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-background border shadow-sm">
                    {getIcon(taxa.forma_pagamento)}
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-sm font-bold leading-none">{taxa.nome_exibicao}</p>
                    {taxa.parcelas > 1 ? (
                      <p className="text-[10px] text-primary font-medium">
                        {taxa.parcelas}x de {formatCurrency(valorParcela!)}
                      </p>
                    ) : (
                      <p className="text-[10px] text-muted-foreground">À vista no Pix/Débito</p>
                    )}
                  </div>
                </div>
                <div className="text-right space-y-0.5">
                  <p className="text-sm font-black text-primary leading-none">{formatCurrency(valorFinal)}</p>
                  {taxaValor > 0 && (
                    <p className="text-[9px] text-muted-foreground font-medium">
                      +{formatCurrency(taxaValor)} taxa
                    </p>
                  )}
                </div>
              </Label>
            </div>
          );
        })}
      </RadioGroup>
    </div>
  );
};


export default PaymentMethodSelector;
