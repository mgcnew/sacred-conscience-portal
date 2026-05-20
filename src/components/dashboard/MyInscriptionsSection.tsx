import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, AlertCircle, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
      <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
        <AlertCircle className="h-10 w-10" />
        <p className="text-sm">Erro ao carregar inscrições</p>
      </div>
    );
  }

  if (!inscriptions || inscriptions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {inscriptions.map((inscription) => {
        const [year, month, day] = inscription.cerimonia.data.split('-').map(Number);
        const ceremonyDate = new Date(year, month - 1, day);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const daysUntil = differenceInDays(ceremonyDate, today);
        const isUpcoming = daysUntil >= 0 && daysUntil <= 7;
        const isPast = daysUntil < 0;

        return (
          <Card
            key={inscription.id}
            className={`overflow-hidden cursor-pointer border border-border/60 shadow-sm hover:shadow-md transition-all active:scale-[0.99] ${
              isUpcoming ? "border-amber-500/50 bg-amber-500/5 hover:border-amber-500/70" : "hover:border-primary/30"
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
            <CardContent className="p-3">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-semibold text-sm leading-tight flex-1">
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
                />
              </div>

              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2.5">
                <Calendar className="h-3 w-3 shrink-0" />
                <span>
                  {format(ceremonyDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </span>
              </div>

              {isUpcoming && (
                <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-2.5">
                  {daysUntil === 0 ? "🔔 Hoje!" : daysUntil === 1 ? "🔔 Amanhã!" : `🔔 Em ${daysUntil} dias`}
                </p>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2">
                {!inscription.pago && inscription.status !== 'cancelada' && (
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-7 text-xs font-bold"
                    onClick={(e) => {
                      e.stopPropagation();
                      const targetTab = isPast ? '?tab=historico' : '';
                      navigate(`${ROUTES.CERIMONIAS}${targetTab}#pagar-${inscription.cerimonia.id}`);
                    }}
                  >
                    Pagar Agora
                  </Button>
                )}

                {daysUntil >= 0 && daysUntil <= 7 && inscription.pago && (
                  inscription.presenca_confirmada ? (
                    <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>Presença confirmada</span>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs text-primary border-primary/30 hover:bg-primary/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        confirmarPresenca.mutate(inscription.id);
                      }}
                      disabled={confirmarPresenca.isPending}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1 shrink-0" />
                      Confirmar presença
                    </Button>
                  )
                )}

                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs ml-auto"
                  onClick={(e) => {
                    e.stopPropagation();
                    const targetTab = isPast ? '?tab=historico' : '';
                    navigate(`${ROUTES.CERIMONIAS}${targetTab}#${inscription.cerimonia.id}`);
                  }}
                >
                  Ver detalhes
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
