import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Leaf, Clock, ExternalLink, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { useHistoricoInscricoes, useMeusDepoimentosAprovados } from '@/hooks/queries';
import { ROUTES } from '@/constants';
import { formatDateBR, formatDateExtensoBR, parseDateString } from '@/lib/date-utils';
import type { Cerimonia } from '@/types';
import { useConfirmarPresenca } from '@/hooks/queries/useConfirmacaoPresenca';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface CerimoniasHistoricoProps {
  userId?: string;
  onOpenPayment?: (cerimonia: Cerimonia) => void;
}

const CerimoniasHistorico: React.FC<CerimoniasHistoricoProps> = ({ userId, onOpenPayment }) => {
  const navigate = useNavigate();
  const { data: inscricoes, isLoading } = useHistoricoInscricoes(userId);
  const { data: depoimentosAprovados } = useMeusDepoimentosAprovados(userId);
  const confirmarPresenca = useConfirmarPresenca();

  const handleConfirmarPresenca = (inscricaoId: string, cerimoniaId: string) => {
    confirmarPresenca.mutate(inscricaoId, {
      onSuccess: () => {
        toast.success('Presença confirmada com sucesso!', {
          description: 'Gostaria de compartilhar como foi sua experiência?',
          action: {
            label: 'Partilhar',
            onClick: () => navigate(`${ROUTES.PARTILHAS}?cerimonia=${cerimoniaId}`)
          },
          duration: 8000,
        });
      }
    });
  };

  const { passadas, futuras } = useMemo(() => {
    if (!inscricoes) return { passadas: [], futuras: [] };
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    return {
      passadas: inscricoes.filter((i) => parseDateString(i.cerimonias.data) < hoje),
      futuras: inscricoes.filter((i) => parseDateString(i.cerimonias.data) >= hoje),
    };
  }, [inscricoes]);

  const cerimoniaComDepoimento = useMemo(() => {
    if (!depoimentosAprovados) return new Set<string>();
    return new Set(depoimentosAprovados.filter((d) => d.cerimonia_id).map((d) => d.cerimonia_id));
  }, [depoimentosAprovados]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Próximas Participações */}
      {futuras.length > 0 && (
        <section>
          <h2 className="text-xl font-display font-semibold text-foreground mb-4">
            Próximas Participações
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {futuras.map((inscricao) => (
              <Card key={inscricao.id} className="overflow-hidden border-border/50 bg-card">
                {inscricao.cerimonias.banner_url && (
                  <div className="h-32 w-full overflow-hidden relative">
                    <img
                      src={inscricao.cerimonias.banner_url}
                      alt={inscricao.cerimonias.nome || 'Cerimônia'}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  </div>
                )}
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-display font-semibold">{inscricao.cerimonias.nome || 'Cerimônia'}</h3>
                      <p className="text-sm text-muted-foreground">{inscricao.cerimonias.medicina_principal}</p>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 shrink-0">
                      Próxima
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-primary" />
                      {formatDateBR(inscricao.cerimonias.data)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4 text-primary" />
                      {inscricao.cerimonias.horario.slice(0, 5)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 text-primary shrink-0" />
                    <span className="truncate">{inscricao.cerimonias.local}</span>
                  </div>
                  <div className="pt-2 border-t border-border/50 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {inscricao.forma_pagamento || 'Pagamento não especificado'}
                    </span>
                    <div className="flex items-center gap-2">
                      {!inscricao.pago && onOpenPayment ? (
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          className="h-7 text-xs px-2"
                          onClick={() => onOpenPayment(inscricao.cerimonias as unknown as Cerimonia)}
                        >
                          Pagar Agora
                        </Button>
                      ) : (
                        <div className="flex items-center gap-2">
                          {!inscricao.presenca_confirmada && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-7 text-xs px-2 border-primary/50 text-primary hover:bg-primary/10"
                              onClick={() => handleConfirmarPresenca(inscricao.id, inscricao.cerimonia_id)}
                              disabled={confirmarPresenca.isPending}
                            >
                              Confirmar Presença
                            </Button>
                          )}
                          <Badge variant={inscricao.pago ? 'default' : 'outline'} className="text-xs">
                            {inscricao.pago ? '✓ Pago' : 'Pendente'}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Cerimônias Realizadas */}
      <section>
        <h2 className="text-xl font-display font-semibold text-foreground mb-4">
          Cerimônias Realizadas
        </h2>

        {passadas.length === 0 ? (
          <Card className="text-center py-12 border-dashed border-2 bg-card/50">
            <CardContent className="space-y-4">
              <Leaf className="w-12 h-12 text-muted-foreground mx-auto opacity-50" />
              <div>
                <p className="text-lg text-muted-foreground font-display">
                  Você ainda não participou de nenhuma cerimônia.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Explore as próximas cerimônias e comece sua jornada!
                </p>
              </div>
              <Link to={ROUTES.CERIMONIAS}>
                <Button className="mt-2">
                  <Calendar className="w-4 h-4 mr-2" />
                  Ver próximas cerimônias
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {passadas.map((inscricao) => (
              <Card key={inscricao.id} className="border-border/50 bg-card">
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="flex-1 space-y-2">
                      <div>
                        <h3 className="font-display font-semibold">{inscricao.cerimonias.nome || 'Cerimônia'}</h3>
                        <p className="text-sm text-muted-foreground">{inscricao.cerimonias.medicina_principal}</p>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-primary" />
                          {formatDateExtensoBR(inscricao.cerimonias.data)}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4 text-primary" />
                          {inscricao.cerimonias.local}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant={inscricao.pago ? 'default' : 'outline'} className="text-xs">
                          {inscricao.pago ? '✓ Pago' : 'Pendente'}
                        </Badge>
                        {cerimoniaComDepoimento.has(inscricao.cerimonia_id) && (
                          <Link to={ROUTES.PARTILHAS}>
                            <Badge variant="outline" className="text-xs cursor-pointer hover:bg-primary/10">
                              <ExternalLink className="w-3 h-3 mr-1" /> Ver minha partilha
                            </Badge>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Partilhas Publicadas */}
      {depoimentosAprovados && depoimentosAprovados.length > 0 && (
        <section>
          <h2 className="text-xl font-display font-semibold text-foreground mb-4">
            Minhas Partilhas Publicadas
          </h2>
          <div className="space-y-3">
            {depoimentosAprovados.map((depoimento) => (
              <Card key={depoimento.id} className="border-border/50 bg-card">
                <CardContent className="p-4 space-y-3">
                  <p className="text-foreground italic leading-relaxed">"{depoimento.texto}"</p>
                  <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(depoimento.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 text-xs">
                      ✓ Publicado
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default CerimoniasHistorico;
