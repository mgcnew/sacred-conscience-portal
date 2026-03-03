import { Calendar, MapPin, Users, AlertCircle, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CeremonySkeleton } from "./skeletons/CeremonySkeleton";
import { ROUTES } from "@/constants/routes";
import { formatDateExtensoBR } from "@/lib/date-utils";
import type { CerimoniasComVagas } from "@/hooks/queries/useUpcomingCeremonies";

interface UpcomingCeremoniesSectionProps {
  ceremonies: CerimoniasComVagas[];
  isLoading: boolean;
  error: Error | null;
  hasAnamnese: boolean;
}

/**
 * Seção de próximas cerimônias disponíveis - Refatorada para visual minimalista
 */
export function UpcomingCeremoniesSection({
  ceremonies,
  isLoading,
  error,
  hasAnamnese,
}: UpcomingCeremoniesSectionProps) {
  const navigate = useNavigate();

  if (isLoading) {
    return <CeremonySkeleton count={3} />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground bg-muted/10 rounded-3xl border border-dashed border-border">
        <AlertCircle className="h-10 w-10 mb-3 opacity-20" />
        <p className="font-medium">Não foi possível carregar as cerimônias</p>
      </div>
    );
  }

  if (!ceremonies || ceremonies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground bg-muted/5 rounded-3xl border border-dashed border-border">
        <Calendar className="h-10 w-10 mb-3 opacity-20" />
        <p className="font-medium">Nenhuma cerimônia agendada para os próximos dias</p>
        <p className="text-xs opacity-60 mt-1">Fique atento às nossas redes sociais para novidades.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Anamnese warning */}
      {!hasAnamnese && (
        <Alert className="border-amber-500/20 bg-amber-500/[0.03] rounded-2xl py-3 px-4 animate-fade-in shadow-sm">
          <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500 mt-0.5" />
          <AlertDescription className="text-sm font-medium text-amber-800 dark:text-amber-400">
            Complete sua{" "}
            <button
              onClick={() => navigate(ROUTES.ANAMNESE)}
              className="underline underline-offset-4 decoration-amber-500/30 hover:decoration-amber-500 transition-all"
            >
              ficha de anamnese
            </button>{" "}
            para garantir sua vaga.
          </AlertDescription>
        </Alert>
      )}

      {/* Ceremony cards */}
      <div className="grid grid-cols-1 gap-4">
        {ceremonies.map((ceremony, index) => (
          <Card
            key={ceremony.id}
            className="group overflow-hidden border-border/40 shadow-none hover:border-primary/40 hover:bg-primary/[0.01] transition-all duration-300 rounded-3xl cursor-pointer bg-card/50"
            onClick={() => navigate(`${ROUTES.CERIMONIAS}#${ceremony.id}`)}
          >
            <CardContent className="p-0">
              <div className="p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="hidden sm:flex flex-col items-center justify-center w-14 h-14 rounded-2xl bg-muted/30 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors shrink-0">
                    <span className="text-[10px] uppercase font-bold tracking-tighter opacity-60">
                      {new Date(ceremony.data + 'T00:00:00').toLocaleDateString('pt-BR', { month: 'short' })}
                    </span>
                    <span className="text-xl font-display font-bold leading-none">
                      {new Date(ceremony.data + 'T00:00:00').getDate()}
                    </span>
                  </div>

                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-display font-bold text-lg text-foreground group-hover:text-primary transition-colors truncate">
                        {ceremony.nome || "Cerimônia Sagrada"}
                      </h3>
                      {ceremony.medicina_principal && (
                        <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-bold py-0 h-5 bg-background/50">
                          {ceremony.medicina_principal}
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground/80">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 opacity-60" />
                        <span>{formatDateExtensoBR(ceremony.data)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <MapPin className="h-3.5 w-3.5 opacity-60" />
                        <span className="truncate">{ceremony.local}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between md:flex-col md:items-end gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-border/40">
                  <Badge
                    variant={ceremony.vagas_disponiveis > 0 ? "secondary" : "outline"}
                    className={`rounded-full px-3 py-0.5 text-xs font-medium border-none shadow-sm ${ceremony.vagas_disponiveis > 0
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "bg-muted/50 text-muted-foreground"
                      }`}
                  >
                    <Users className="h-3 w-3 mr-1.5" />
                    {ceremony.vagas_disponiveis > 0
                      ? `${ceremony.vagas_disponiveis} vagas`
                      : "Esgotado"}
                  </Badge>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="group-hover:translate-x-1 transition-transform p-0 h-auto hover:bg-transparent text-primary font-bold text-xs uppercase tracking-widest hidden md:flex items-center gap-1"
                  >
                    Detalhes <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
