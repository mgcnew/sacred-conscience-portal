import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, Calendar, Clock, ChevronRight, User } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ROUTES } from '@/constants';
import { useCursosFuturos } from '@/hooks/queries';

interface UpcomingCoursesSectionProps {
  limit?: number;
}

/**
 * Seção de próximos cursos - Refatorada para visual minimalista
 */
export const UpcomingCoursesSection: React.FC<UpcomingCoursesSectionProps> = ({ limit = 2 }) => {
  const navigate = useNavigate();
  const { data: cursos, isLoading } = useCursosFuturos();

  const cursosLimitados = cursos?.slice(0, limit) || [];

  const formatarValor = (valor: number) => {
    return (valor / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-24 bg-muted/20 animate-pulse rounded-3xl" />
        ))}
      </div>
    );
  }

  if (!cursosLimitados.length) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-muted-foreground bg-muted/5 rounded-3xl border border-dashed border-border px-6 text-center">
        <GraduationCap className="w-10 h-10 mb-2 opacity-20" />
        <p className="text-sm font-medium">Nenhum curso presencial agendado</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {cursosLimitados.map((curso) => (
        <Card
          key={curso.id}
          className="group overflow-hidden border-border/40 shadow-none hover:border-primary/40 transition-all duration-300 rounded-3xl cursor-pointer bg-card/50"
          onClick={() => navigate(ROUTES.CURSOS)}
        >
          <CardContent className="p-0">
            <div className="flex items-center gap-4 p-4 md:p-5">
              <div className="w-20 h-20 shrink-0 overflow-hidden rounded-2xl bg-primary/5">
                {curso.banner_url ? (
                  <img
                    src={curso.banner_url}
                    alt={curso.nome}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/10">
                    <GraduationCap className="w-8 h-8 text-primary/40" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h4 className="font-display font-bold text-base text-foreground group-hover:text-primary transition-colors truncate">
                    {curso.nome}
                  </h4>
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-none font-bold text-[10px] uppercase h-5 shrink-0">
                    {curso.gratuito ? 'Gratuito' : formatarValor(curso.valor)}
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground/80">
                  <div className="flex items-center gap-1.5 font-medium">
                    <Calendar className="w-3.5 h-3.5 opacity-60" />
                    <span>{format(new Date(curso.data_inicio), "dd 'de' MMM", { locale: ptBR })}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-medium">
                    <Clock className="w-3.5 h-3.5 opacity-60" />
                    <span>{curso.horario_inicio.slice(0, 5)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-medium min-w-0">
                    <User className="w-3.5 h-3.5 opacity-60" />
                    <span className="truncate">{curso.responsavel}</span>
                  </div>
                </div>
              </div>

              <div className="hidden sm:flex self-center ml-2">
                <div className="w-8 h-8 rounded-full bg-muted/30 group-hover:bg-primary/20 flex items-center justify-center transition-colors">
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default UpcomingCoursesSection;
