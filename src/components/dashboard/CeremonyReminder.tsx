import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, ChevronRight, Bell, Sparkles } from 'lucide-react';
import { useCerimoniasProximas } from '@/hooks/queries';
import { useAuth } from '@/contexts/AuthContext';
import { ROUTES } from '@/constants';
import type { InscricaoComCerimonia } from '@/types';

/**
 * Componente de lembrete de cerimônias próximas - Refatorado para visual integrado
 */
const CeremonyReminder: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: cerimoniasProximas, isLoading } = useCerimoniasProximas(user?.id);

  const formatarData = (dataStr: string): string => {
    const data = new Date(dataStr + 'T00:00:00');
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);

    const dataComparacao = new Date(data);
    dataComparacao.setHours(0, 0, 0, 0);

    if (dataComparacao.getTime() === hoje.getTime()) return 'Hoje';
    if (dataComparacao.getTime() === amanha.getTime()) return 'Amanhã';

    return data.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  const calcularDiasRestantes = (dataStr: string): number => {
    const data = new Date(dataStr + 'T00:00:00');
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    data.setHours(0, 0, 0, 0);

    const diffTime = data.getTime() - hoje.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  if (isLoading || !cerimoniasProximas || cerimoniasProximas.length === 0) {
    return null;
  }

  return (
    <div className="animate-fade-in-up">
      <Card className="border-none bg-gradient-to-r from-primary/10 via-primary/5 to-transparent shadow-none overflow-hidden rounded-3xl relative">
        {/* Subtle decorative background icon */}
        <Sparkles className="absolute -right-4 -top-4 w-24 h-24 text-primary/5 rotate-12 pointer-events-none" />

        <CardContent className="p-5 md:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center gap-6">
            <div className="flex items-center gap-4 shrink-0">
              <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center shadow-inner">
                <Bell className="w-6 h-6 text-primary animate-soft-pulse" />
              </div>
              <div className="min-w-0">
                <h3 className="font-display text-lg font-bold text-foreground leading-tight">
                  Cerimônia Chegando
                </h3>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-0.5">
                  Prepare seu coração
                </p>
              </div>
            </div>

            <div className="flex-1 space-y-3">
              {cerimoniasProximas.map((inscricao: InscricaoComCerimonia) => {
                const diasRestantes = calcularDiasRestantes(inscricao.cerimonias.data);

                return (
                  <div
                    key={inscricao.id}
                    className="flex flex-col md:flex-row md:items-center gap-4 p-4 rounded-2xl bg-card border border-primary/10 shadow-sm"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="font-display font-bold text-foreground">
                          {inscricao.cerimonias.nome || inscricao.cerimonias.medicina_principal}
                        </span>
                        {diasRestantes === 0 ? (
                          <Badge className="bg-red-500 hover:bg-red-600 text-[10px] font-bold h-5 uppercase tracking-wider">É Hoje!</Badge>
                        ) : diasRestantes === 1 ? (
                          <Badge className="bg-amber-500 hover:bg-amber-600 text-[10px] font-bold h-5 uppercase tracking-wider">Amanhã</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px] font-bold h-5 uppercase tracking-wider">Tudo pronto</Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5 font-medium">
                          <Calendar className="w-3.5 h-3.5 opacity-60" />
                          {formatarData(inscricao.cerimonias.data)}
                        </span>
                        <span className="flex items-center gap-1.5 font-medium">
                          <Clock className="w-3.5 h-3.5 opacity-60" />
                          {inscricao.cerimonias.horario}
                        </span>
                        <span className="flex items-center gap-1.5 font-medium min-w-0">
                          <MapPin className="w-3.5 h-3.5 opacity-60" />
                          <span className="truncate">{inscricao.cerimonias.local}</span>
                        </span>
                      </div>
                    </div>

                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => navigate(ROUTES.CERIMONIAS)}
                      className="rounded-full px-6 font-bold text-xs h-9 shadow-md shadow-primary/20"
                    >
                      Ver Detalhes
                      <ChevronRight className="w-3.5 h-3.5 ml-1.5" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CeremonyReminder;
