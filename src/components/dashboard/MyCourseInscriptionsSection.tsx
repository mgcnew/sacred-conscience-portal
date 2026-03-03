import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, Calendar, Clock, ChevronRight, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ROUTES } from '@/constants';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const MyCourseInscriptionsSection: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: inscricoes, isLoading } = useQuery({
    queryKey: ['minhas-inscricoes-cursos-dashboard', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inscricoes_cursos')
        .select(`
          id,
          pago,
          cursos_eventos (
            id, nome, data_inicio, horario_inicio, banner_url, gratuito
          )
        `)
        .eq('user_id', user!.id)
        .gte('cursos_eventos.data_inicio', new Date().toISOString().split('T')[0])
        .order('data_inscricao', { ascending: false })
        .limit(2);

      if (error) throw error;
      return data?.filter(i => i.cursos_eventos) || [];
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            Meus Cursos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-16 bg-muted rounded-lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!inscricoes?.length) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            Meus Cursos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            <p className="text-sm">Você ainda não está inscrito em nenhum curso</p>
            <Button variant="link" size="sm" onClick={() => navigate(ROUTES.CURSOS)}>
              Ver cursos disponíveis
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            Meus Cursos
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.CURSOS)}>
            Ver mais
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {inscricoes.map((inscricao: any) => (
          <div
            key={inscricao.id}
            className="flex gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
          >
            {inscricao.cursos_eventos?.banner_url ? (
              <img
                src={inscricao.cursos_eventos.banner_url}
                alt={inscricao.cursos_eventos.nome}
                className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-14 h-14 rounded-lg bg-green-100 dark:bg-green-800 flex items-center justify-center flex-shrink-0">
                <GraduationCap className="w-5 h-5 text-green-600" />
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-sm truncate">{inscricao.cursos_eventos?.nome}</h4>
                <Badge className="bg-green-600 text-white text-xs px-1.5 py-0">
                  Inscrito
                </Badge>
              </div>
              
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>
                    {inscricao.cursos_eventos?.data_inicio && 
                      format(new Date(inscricao.cursos_eventos.data_inicio), "dd 'de' MMM", { locale: ptBR })
                    }
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{inscricao.cursos_eventos?.horario_inicio?.slice(0, 5)}</span>
                </div>
              </div>

              {!inscricao.cursos_eventos?.gratuito && !inscricao.pago && (
                <Badge variant="outline" className="mt-1 text-xs text-amber-600 border-amber-300">
                  Pagamento pendente
                </Badge>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default MyCourseInscriptionsSection;
