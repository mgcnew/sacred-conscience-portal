import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, AlertCircle, BookOpen, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

/**
 * Seção de minhas inscrições em cerimônias
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */
export function MyInscriptionsSection({
  inscriptions,
  isLoading,
  error,
}: MyInscriptionsSectionProps) {
  const navigate = useNavigate();
  const confirmarPresenca = useConfirmarPresenca();

  // Loading state (Req 5.3)
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BookOpen className="h-5 w-5" />
            Minhas Consagrações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <InscriptionSkeleton count={3} />
        </CardContent>
      </Card>
    );
  }

  // Error state (Req 5.4)
  if (error) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BookOpen className="h-5 w-5" />
            Minhas Consagrações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <AlertCircle className="h-12 w-12 mb-2" />
            <p>Erro ao carregar inscrições</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state (Req 3.4)
  if (!inscriptions || inscriptions.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BookOpen className="h-5 w-5" />
            Minhas Consagrações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mb-2" />
            <p className="text-center mb-4">
              Você ainda não participou de nenhuma cerimônia.
            </p>
            <Button
              variant="default"
              onClick={() => navigate(ROUTES.CERIMONIAS)}
            >
              Participar da primeira cerimônia
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <BookOpen className="h-5 w-5" />
          Minhas Consagrações
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Inscription cards (Req 3.2) */}
        <div className="space-y-3">
          {inscriptions.map((inscription) => {
            // Calculate days until ceremony (Req 3.5)
            // Parse date string as local time to avoid timezone issues
            const [year, month, day] = inscription.cerimonia.data.split('-').map(Number);
            const ceremonyDate = new Date(year, month - 1, day); // month is 0-indexed
            
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const daysUntil = differenceInDays(ceremonyDate, today);
            const isUpcoming = daysUntil >= 0 && daysUntil <= 7;

            return (
              <Card
                key={inscription.id}
                className={`overflow-hidden cursor-pointer transition-colors hover:bg-accent/50 ${
                  isUpcoming ? "border-amber-500/50 bg-amber-500/5" : ""
                }`}
                onClick={() => {
                  if (!inscription.pago && inscription.status !== 'cancelada') {
                    navigate(`${ROUTES.CERIMONIAS}#pagar-${inscription.cerimonia.id}`);
                  } else {
                    navigate(`${ROUTES.CERIMONIAS}#${inscription.cerimonia.id}`);
                  }
                }}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col gap-3">
                    {/* Ceremony name and status (Req 3.2) */}
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-base leading-tight flex-1">
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

                    {/* Date (Req 3.2) */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {format(ceremonyDate, "dd 'de' MMMM 'de' yyyy", {
                          locale: ptBR,
                        })}
                      </span>
                    </div>

                    {/* Upcoming ceremony highlight (Req 3.5) */}
                    {isUpcoming && (
                      <div className="text-sm font-medium text-amber-700 dark:text-amber-400">
                        {daysUntil === 0
                          ? "🔔 Hoje!"
                          : daysUntil === 1
                          ? "🔔 Amanhã!"
                          : `🔔 Em ${daysUntil} dias`}
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      {/* Botão de Pagar - Prioridade se não pago */}
                      {!inscription.pago && inscription.status !== 'cancelada' && (
                        <Button
                          size="sm"
                          variant="destructive"
                          className="w-full sm:w-auto h-8 text-xs font-bold"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`${ROUTES.CERIMONIAS}#pagar-${inscription.cerimonia.id}`);
                          }}
                        >
                          Pagar Agora
                        </Button>
                      )}

                      {/* Botão de confirmar presença - só aparece para cerimônias futuras e pagas */}
                      {daysUntil >= 0 && daysUntil <= 7 && inscription.pago && (
                        inscription.presenca_confirmada ? (
                          <div className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">Presença confirmada</span>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-primary border-primary/30 hover:bg-primary/10 w-full sm:w-auto"
                            onClick={(e) => {
                              e.stopPropagation();
                              confirmarPresenca.mutate(inscription.id);
                            }}
                            disabled={confirmarPresenca.isPending}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1 flex-shrink-0" />
                            <span className="truncate">Confirmar presença</span>
                          </Button>
                        )
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="sm:ml-auto w-full sm:w-auto"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`${ROUTES.CERIMONIAS}#${inscription.cerimonia.id}`);
                        }}
                      >
                        Ver detalhes
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
