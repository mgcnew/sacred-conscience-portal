import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MessageSquare, AlertCircle, FileText, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TestimonialSkeleton } from "./skeletons/TestimonialSkeleton";
import { ROUTES } from "@/constants/routes";
import type { MyTestimonial } from "@/hooks/queries/useMyTestimonials";

interface MyTestimonialsSectionProps {
  testimonials: MyTestimonial[];
  isLoading: boolean;
  error: Error | null;
}

/**
 * Seção de meus depoimentos
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */
export function MyTestimonialsSection({
  testimonials,
  isLoading,
  error,
}: MyTestimonialsSectionProps) {
  const navigate = useNavigate();

  // Helper function to truncate text (Req 4.2)
  const truncateText = (text: string, maxLength: number = 150): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + "...";
  };

  // Loading state (Req 5.3)
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageSquare className="h-5 w-5" />
            Minhas Partilhas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TestimonialSkeleton count={3} />
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
            <MessageSquare className="h-5 w-5" />
            Minhas Partilhas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <AlertCircle className="h-12 w-12 mb-2" />
            <p>Erro ao carregar depoimentos</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state (Req 4.4)
  if (!testimonials || testimonials.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageSquare className="h-5 w-5" />
            Minhas Partilhas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mb-2" />
            <p className="text-center mb-4">
              Você ainda não compartilhou nenhuma experiência.
            </p>
            <Button
              variant="default"
              onClick={() => navigate(ROUTES.PARTILHAS)}
            >
              Compartilhar experiência
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
          <MessageSquare className="h-5 w-5" />
          Minhas Partilhas
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Testimonial cards (Req 4.2) */}
        <div className="space-y-3">
          {testimonials.map((testimonial) => {
            // Parse date (Req 4.2)
            const createdDate = new Date(testimonial.created_at);

            return (
              <Card
                key={testimonial.id}
                className="overflow-hidden cursor-pointer transition-colors hover:bg-accent/50"
                onClick={() => navigate(ROUTES.PARTILHAS)}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col gap-3">
                    {/* Status badge (Req 4.2, 4.5) */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        {/* Truncated text (Req 4.2) */}
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {truncateText(testimonial.texto)}
                        </p>
                      </div>
                      {/* Pending indicator (Req 4.5) */}
                      {!testimonial.aprovado && (
                        <Badge
                          variant="secondary"
                          className="flex items-center gap-1 shrink-0 bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
                        >
                          <Clock className="h-3 w-3" />
                          Aguardando aprovação
                        </Badge>
                      )}
                      {testimonial.aprovado && (
                        <Badge
                          variant="default"
                          className="shrink-0"
                        >
                          Aprovado
                        </Badge>
                      )}
                    </div>

                    {/* Date (Req 4.2) */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {format(createdDate, "dd 'de' MMMM 'de' yyyy", {
                          locale: ptBR,
                        })}
                      </span>

                      {/* Action button (Req 4.3) */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(ROUTES.PARTILHAS);
                        }}
                      >
                        Ver todos
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
