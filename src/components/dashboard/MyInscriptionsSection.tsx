import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, AlertCircle, BookOpen, CheckCircle2, ChevronRight, CreditCard } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import StatusBadge from "@/components/shared/StatusBadge";
import { InscriptionSkeleton } from "./skeletons/InscriptionSkeleton";
import { ROUTES } from "@/constants/routes";
import { useConfirmarPresenca } from "@/hooks/queries/useConfirmacaoPresenca";
import type { MyInscription } from "@/hooks/queries/useMyInscriptions";

interface MyInscriptionsSectionProps {
  inscriptions: MyInscription[];
  isLoading: boolean;
  error: Error | null;
}

/**
 * Seção de minhas inscrições em cerimônias - Refatorada para visual minimalista
 */
export function MyInscriptionsSection({
  inscriptions,
  isLoading,
  error,
}: MyInscriptionsSectionProps) {
  const navigate = useNavigate();
  const confirmarPresenca = useConfirmarPresenca();

  if (isLoading) {
    return <InscriptionSkeleton count={3} />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground bg-muted/10 rounded-3xl border border-dashed border-border">
        <AlertCircle className="h-10 w-10 mb-3 opacity-20" />
        <p className="font-medium">Erro ao carregar suas inscrições</p>
      </div>
    );
  }

  if (!inscriptions || inscriptions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground bg-muted/5 rounded-3xl border border-dashed border-border px-6 text-center">
        <BookOpen className="h-10 w-10 mb-3 opacity-20" />
        <p className="font-medium mb-2">Você ainda não tem inscrições</p>
        <p className="text-sm opacity-60 mb-6 max-w-xs">
          Explore nosso cronograma e participe de sua primeira cerimônia conosco.
        </p>
        <Button
          variant="outline"
          className="rounded-full font-bold px-8 border-primary/30 text-primary hover:bg-primary/5"
          onClick={() => navigate(ROUTES.CERIMONIAS)}
        >
          Ver Cronograma
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        {inscriptions.map((inscription) => {
          const [year, month, day] = inscription.cerimonia.data.split('-').map(Number);
          const ceremonyDate = new Date(year, month - 1, day);

          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const daysUntil = differenceInDays(ceremonyDate, today);
          const isUpcoming = daysUntil >= 0 && daysUntil <= 3;
          const isPast = daysUntil < 0;

          return (
            <Card
              key={inscription.id}
              className={`group overflow-hidden border-border/40 shadow-none hover:border-primary/40 transition-all duration-300 rounded-3xl cursor-pointer bg-card/50 ${isUpcoming ? "ring-1 ring-amber-500/20 bg-amber-500/[0.01]" : ""
                }`}
              onClick={() => {
                const targetTab = isPast ? '?tab=historico' : '';
                if (!inscription.pago && inscription.status !== 'cancelada') {
                  navigate(`${ROUTES.CERIMONIAS}${targetTab}#pagar-${inscription.cerimonia.id}`);
                } else {
                  navigate(`${ROUTES.CERIMONIAS}${targetTab}#${inscription.cerimonia.id}`);
                }
              }}
            >
              <CardContent className="p-0">
                <div className="p-5 md:p-6">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-display font-bold text-lg text-foreground group-hover:text-primary transition-colors truncate">
                          {inscription.cerimonia.nome || "Cerimônia"}
                        </h3>
                        <StatusBadge
                          status={
                            inscription.status === "confirmada"
                              ? "success"
                              : inscription.status === "cancelada"
                                ? "error"
                                : "pending"
                          }
                          label={
                            inscription.status === "confirmada"
                              ? "Confirmada"
                              : inscription.status === "cancelada"
                                ? "Cancelada"
                                : "Pendente"
                          }
                          className="text-[10px] uppercase font-bold tracking-wider rounded-lg h-5"
                        />
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground/80">
                        <Calendar className="h-3.5 w-3.5 opacity-60" />
                        <span className="font-medium">
                          {format(ceremonyDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 md:pt-1">
                      {isUpcoming && (
                        <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-none font-bold text-[10px] uppercase tracking-wider h-6">
                          {daysUntil === 0 ? "🔔 Hoje" : daysUntil === 1 ? "🔔 Amanhã" : `Em ${daysUntil} dias`}
                        </Badge>
                      )}
                      {inscription.pago ? (
                        <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none font-bold text-[10px] uppercase tracking-wider h-6">
                          Pago
                        </Badge>
                      ) : inscription.status !== 'cancelada' && (
                        <Badge variant="destructive" className="bg-red-500/10 text-red-600 dark:text-red-400 border-none font-bold text-[10px] uppercase tracking-wider h-6">
                          Aguardando Pagamento
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-border/30">
                    {!inscription.pago && inscription.status !== 'cancelada' && (
                      <Button
                        size="sm"
                        className="w-full sm:w-auto rounded-full font-bold text-xs bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/20"
                        onClick={(e) => {
                          e.stopPropagation();
                          const targetTab = isPast ? '?tab=historico' : '';
                          navigate(`${ROUTES.CERIMONIAS}${targetTab}#pagar-${inscription.cerimonia.id}`);
                        }}
                      >
                        <CreditCard className="w-3.5 h-3.5 mr-2" />
                        Pagar Agora
                      </Button>
                    )}

                    {daysUntil >= 0 && daysUntil <= 7 && inscription.pago && (
                      inscription.presenca_confirmada ? (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 px-4 py-2 rounded-full">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Presença Confirmada</span>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full sm:w-auto rounded-full font-bold text-xs border-primary/30 text-primary hover:bg-primary/5"
                          onClick={(e) => {
                            e.stopPropagation();
                            confirmarPresenca.mutate(inscription.id);
                          }}
                          disabled={confirmarPresenca.isPending}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mr-2 text-primary" />
                          Confirmar Presença
                        </Button>
                      )
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      className="group-hover:translate-x-1 transition-transform p-0 h-auto hover:bg-transparent text-primary font-bold text-xs uppercase tracking-widest sm:ml-auto hidden sm:flex items-center gap-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        const targetTab = isPast ? '?tab=historico' : '';
                        navigate(`${ROUTES.CERIMONIAS}${targetTab}#${inscription.cerimonia.id}`);
                      }}
                    >
                      Detalhes <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
