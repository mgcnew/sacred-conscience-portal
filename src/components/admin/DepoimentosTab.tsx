import { memo } from 'react';
import { UseMutationResult } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CardSkeleton } from '@/components/ui/table-skeleton';
import { Badge } from '@/components/ui/badge';
import { LoadingButton } from '@/components/ui/loading-button';
import { MessageSquareQuote, AlertTriangle, CheckCircle2, XCircle, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Depoimento {
  id: string;
  texto: string;
  created_at: string;
  autoriza_instagram?: boolean | null;
  profiles?: { full_name: string | null } | null;
  cerimonias?: { nome: string | null; medicina_principal: string | null } | null;
}

interface DepoimentosTabProps {
  depoimentosPendentes: Depoimento[] | undefined;
  isLoadingDepoimentos: boolean;
  depoimentosError: Error | null;
  approveDepoimentoMutation: UseMutationResult<void, Error, string, unknown>;
  rejectDepoimentoMutation: UseMutationResult<void, Error, string, unknown>;
}

export const DepoimentosTab = memo(({
  depoimentosPendentes,
  isLoadingDepoimentos,
  depoimentosError,
  approveDepoimentoMutation,
  rejectDepoimentoMutation,
}: DepoimentosTabProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquareQuote className="w-5 h-5 text-primary" />
          Moderação de Partilhas
        </CardTitle>
        <CardDescription>
          Aprove ou rejeite partilhas enviadas pelos consagradores.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoadingDepoimentos ? (
          <CardSkeleton count={3} />
        ) : depoimentosError ? (
          <div className="text-center py-12 text-destructive">
            <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-70" />
            <p className="font-medium">Erro ao carregar partilhas</p>
            <p className="text-sm text-muted-foreground mt-1">
              Verifique se você tem permissão de administrador para visualizar as partilhas pendentes.
            </p>

            <p className="text-xs text-muted-foreground mt-2">
              Se o problema persistir, entre em contato com o suporte técnico.
            </p>
          </div>
        ) : depoimentosPendentes && depoimentosPendentes.length > 0 ? (
          <div className="space-y-4">
            {depoimentosPendentes.map((depoimento) => (
              <Card key={depoimento.id} className="border-warning/30 bg-warning-subtle dark:border-warning">
                <CardContent className="pt-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-medium text-primary">
                            {depoimento.profiles?.full_name?.charAt(0).toUpperCase() || '?'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{depoimento.profiles?.full_name || 'Anônimo'}</p>
                          <p className="text-xs">
                            {format(new Date(depoimento.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-auto">
                          {depoimento.autoriza_instagram && (
                            <Badge className="bg-primary text-white border-0">
                              <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                              </svg>
                              Instagram
                            </Badge>
                          )}
                          {depoimento.cerimonias && (
                            <Badge variant="outline">
                              <Calendar className="w-3 h-3 mr-1" />
                              {depoimento.cerimonias.nome || depoimento.cerimonias.medicina_principal}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <p className="text-foreground italic border-l-2 border-primary/30 pl-4">
                        "{depoimento.texto}"
                      </p>
                    </div>

                    <div className="flex flex-row md:flex-col gap-2 justify-end shrink-0 w-full md:w-auto">
                      <LoadingButton
                        size="sm"
                        className="bg-success hover:bg-success flex-1 md:flex-none"
                        onClick={() => approveDepoimentoMutation.mutate(depoimento.id)}
                        loading={approveDepoimentoMutation.isPending}
                        loadingText="..."
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1" /> Aprovar
                      </LoadingButton>
                      <LoadingButton
                        size="sm"
                        variant="outline"
                        className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground flex-1 md:flex-none"
                        onClick={() => rejectDepoimentoMutation.mutate(depoimento.id)}
                        loading={rejectDepoimentoMutation.isPending}
                        loadingText="..."
                      >
                        <XCircle className="w-4 h-4 mr-1" /> Rejeitar
                      </LoadingButton>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">Nenhuma partilha pendente</p>
            <p className="text-sm">Todas as partilhas foram moderadas.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

DepoimentosTab.displayName = 'DepoimentosTab';
