import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, Phone, BellRing, CheckCircle2, UserMinus, ArrowRight } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useFilaEspera, useAvisarDaFila, useRemoverDaFila } from '@/hooks/queries/useListaEspera';

interface Props {
  cerimoniaId: string;
  cerimoniaNome: string;
  /** Vagas livres agora (vagas − inscritos ativos). Null = sem limite. */
  vagasLivres: number | null;
}

/** Link de WhatsApp a partir de um telefone digitado livremente. */
const linkWhatsApp = (telefone: string) => {
  const so = telefone.replace(/\D/g, '');
  const comPais = so.length <= 11 ? `55${so}` : so;
  return `https://wa.me/${comPais}`;
};

const ListaEsperaAdmin: React.FC<Props> = ({ cerimoniaId, cerimoniaNome, vagasLivres }) => {
  const { data: fila, isLoading } = useFilaEspera(cerimoniaId);
  const avisar = useAvisarDaFila();
  const remover = useRemoverDaFila();

  if (isLoading) {
    return (
      <div className="space-y-2 px-4 pb-4">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-14 w-full" />
      </div>
    );
  }

  if (!fila?.length) return null;

  // Quem deve ser chamado primeiro: o de menor posição ainda não avisado.
  const proximo = fila.find((f) => !f.notificado);
  const aguardando = fila.filter((f) => !f.notificado).length;
  const temVaga = vagasLivres !== null && vagasLivres > 0;

  return (
    <div className="px-4 pb-4 pt-1">
      <div className="rounded-xl border border-border overflow-hidden">
        {/* Cabeçalho */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 bg-muted/50 border-b border-border">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-warning" />
            <span className="font-semibold text-sm">Lista de espera</span>
            <Badge variant="secondary" className="text-[11px]">
              {fila.length} {fila.length === 1 ? 'pessoa' : 'pessoas'}
            </Badge>
          </div>

          {temVaga ? (
            <Badge className="bg-success text-success-foreground text-[11px]">
              {vagasLivres} {vagasLivres === 1 ? 'vaga livre' : 'vagas livres'} — pode chamar
            </Badge>
          ) : (
            <span className="text-[11px] text-muted-foreground">
              Sem vaga livre no momento
            </span>
          )}
        </div>

        {/* Quem chamar primeiro */}
        {proximo && (
          <div className="flex flex-wrap items-center gap-2 px-3 py-2 bg-warning-subtle border-b border-border">
            <ArrowRight className="w-3.5 h-3.5 text-warning shrink-0" />
            <span className="text-xs">
              Próximo a chamar: <strong>{proximo.nome}</strong>
              {aguardando > 1 && (
                <span className="text-muted-foreground"> · {aguardando} aguardando aviso</span>
              )}
            </span>
          </div>
        )}

        {/* Fila em ordem */}
        <ul className="divide-y divide-border">
          {fila.map((item) => {
            const ehProximo = item.id === proximo?.id;
            return (
              <li
                key={item.id}
                className={cn(
                  'flex flex-wrap items-center gap-3 px-3 py-2.5',
                  ehProximo && 'bg-warning-subtle/40'
                )}
              >
                {/* Posição */}
                <span
                  className={cn(
                    'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                    item.notificado
                      ? 'bg-muted text-muted-foreground'
                      : 'bg-warning text-warning-foreground'
                  )}
                >
                  {item.posicao}
                </span>

                {/* Pessoa */}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{item.nome}</p>
                  <p className="text-[11px] text-muted-foreground">
                    Entrou em {format(parseISO(item.created_at), "d 'de' MMM, HH:mm", { locale: ptBR })}
                    {item.notificado && item.notificado_em && (
                      <> · avisado em {format(parseISO(item.notificado_em), 'd/MM', { locale: ptBR })}</>
                    )}
                  </p>
                </div>

                {/* Estado */}
                {item.notificado ? (
                  <Badge variant="secondary" className="text-[10px] gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Avisado
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] border-warning/40 text-warning">
                    Aguardando
                  </Badge>
                )}

                {/* Ações */}
                <div className="flex items-center gap-1 shrink-0">
                  {item.telefone && (
                    <Button asChild size="sm" variant="ghost" className="h-8 px-2" title={item.telefone}>
                      <a href={linkWhatsApp(item.telefone)} target="_blank" rel="noopener noreferrer">
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                    </Button>
                  )}

                  {!item.notificado && (
                    <Button
                      size="sm"
                      variant={ehProximo ? 'default' : 'outline'}
                      className="h-8 px-2.5 text-xs"
                      disabled={avisar.isPending}
                      onClick={() =>
                        avisar.mutate({
                          id: item.id,
                          userId: item.user_id,
                          cerimoniaId,
                          cerimoniaNome,
                        })
                      }
                    >
                      <BellRing className="w-3.5 h-3.5 mr-1" />
                      Avisar
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 px-2 text-muted-foreground hover:text-destructive"
                    title="Remover da fila"
                    disabled={remover.isPending}
                    onClick={() => remover.mutate({ id: item.id, cerimoniaId })}
                  >
                    <UserMinus className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default ListaEsperaAdmin;
