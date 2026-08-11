import { Calendar, MapPin, Users, AlertCircle, Leaf } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CeremonySkeleton } from "./skeletons/CeremonySkeleton";
import { ROUTES } from "@/constants/routes";
import type { CerimoniasComVagas } from "@/hooks/queries/useUpcomingCeremonies";

interface UpcomingCeremoniesSectionProps {
  ceremonies: CerimoniasComVagas[];
  isLoading: boolean;
  error: Error | null;
  hasAnamnese: boolean;
}

const medicinaBadgeClass = (medicina: string | null) => {
  if (!medicina) return null;
  const m = medicina.toLowerCase();
  if (m.includes('ayahuasca') || m.includes('hoasca') || m.includes('daime'))
    return 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400';
  if (m.includes('rapé') || m.includes('rape'))
    return 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400';
  if (m.includes('sananga'))
    return 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400';
  if (m.includes('kambô') || m.includes('kambo'))
    return 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400';
  return 'bg-primary/12 dark:bg-primary/20 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400';
};

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
      <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
        <AlertCircle className="h-10 w-10" />
        <p className="text-sm">Erro ao carregar cerimônias</p>
      </div>
    );
  }

  if (!ceremonies || ceremonies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2 text-center">
        <Calendar className="h-10 w-10" />
        <p className="text-sm">
          Não há cerimônias disponíveis no momento.
          <br />
          <span className="text-xs">Novas datas serão anunciadas em breve!</span>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {!hasAnamnese && (
        <Alert className="border-amber-500/50 bg-amber-500/10">
          <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
          <AlertDescription className="text-sm">
            Você precisa preencher sua{" "}
            <button
              onClick={() => navigate(ROUTES.ANAMNESE)}
              className="font-medium underline underline-offset-2 hover:text-amber-700 dark:hover:text-amber-400"
            >
              ficha de anamnese
            </button>{" "}
            antes de se inscrever nas cerimônias.
          </AlertDescription>
        </Alert>
      )}

      {ceremonies.map((ceremony) => {
        const [year, month, day] = ceremony.data.split('-').map(Number);
        const dateObj = new Date(year, month - 1, day);
        const dayNum = dateObj.getDate();
        const monthShort = dateObj.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');

        return (
          <Card
            key={ceremony.id}
            className="overflow-hidden cursor-pointer border border-border/60 shadow-sm hover:shadow-md hover:border-primary/30 transition-all active:scale-[0.99]"
            onClick={() => navigate(`${ROUTES.CERIMONIAS}#${ceremony.id}`)}
          >
            <CardContent className="p-0">
              {/* Banner — só aparece quando a cerimônia tem imagem */}
              {ceremony.banner_url && (
                <div className="relative h-[100px] w-full overflow-hidden">
                  <img
                    src={ceremony.banner_url}
                    alt={ceremony.nome || 'Cerimônia'}
                    className="w-full h-full object-cover"
                  />
                  {/* Gradiente para proteger legibilidade do conteúdo abaixo */}
                  <div className="absolute inset-0 bg-background/50" />
                  {/* Data sobreposta no banner */}
                  <div className="absolute bottom-2 left-3 flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-white drop-shadow leading-none">{dayNum}</span>
                    <span className="text-xs font-semibold text-white/80 uppercase tracking-wide drop-shadow">{monthShort}</span>
                  </div>
                  {/* Vagas sobreposta no banner */}
                  <div className="absolute bottom-2 right-3">
                    <Badge
                      variant={ceremony.vagas_disponiveis > 0 ? "default" : "secondary"}
                      className="flex items-center gap-1 text-[10px] h-5 shadow"
                    >
                      <Users className="h-2.5 w-2.5" />
                      {ceremony.vagas_disponiveis > 0
                        ? `${ceremony.vagas_disponiveis} ${ceremony.vagas_disponiveis === 1 ? "vaga" : "vagas"}`
                        : "Esgotado"}
                    </Badge>
                  </div>
                </div>
              )}

              <div className="flex items-stretch">
                {/* Date badge — só aparece quando NÃO há banner */}
                {!ceremony.banner_url && (
                  <div className="flex flex-col items-center justify-center bg-primary/8 border-r border-border/40 px-3 py-4 min-w-[60px]">
                    <span className="text-xl font-bold text-primary leading-none">{dayNum}</span>
                    <span className="text-[10px] font-semibold text-primary/70 uppercase tracking-wide mt-0.5">
                      {monthShort}
                    </span>
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 p-3 min-w-0">
                  <h3 className="font-semibold text-sm leading-tight truncate mb-1.5">
                    {ceremony.nome || "Cerimônia"}
                  </h3>
                  {ceremony.medicina_principal && (() => {
                    const cls = medicinaBadgeClass(ceremony.medicina_principal);
                    return cls ? (
                      <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full mb-1.5 ${cls}`}>
                        <Leaf className="w-2.5 h-2.5" />
                        {ceremony.medicina_principal}
                      </span>
                    ) : null;
                  })()}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">{ceremony.local}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    {/* Vagas — só aparece aqui quando não há banner (quando há, está no banner) */}
                    {!ceremony.banner_url && (
                      <Badge
                        variant={ceremony.vagas_disponiveis > 0 ? "default" : "secondary"}
                        className="flex items-center gap-1 text-[10px] h-5"
                      >
                        <Users className="h-2.5 w-2.5" />
                        {ceremony.vagas_disponiveis > 0
                          ? `${ceremony.vagas_disponiveis} ${ceremony.vagas_disponiveis === 1 ? "vaga" : "vagas"}`
                          : "Esgotado"}
                      </Badge>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs text-primary px-2 ml-auto"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`${ROUTES.CERIMONIAS}#${ceremony.id}`);
                      }}
                    >
                      Ver detalhes
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
