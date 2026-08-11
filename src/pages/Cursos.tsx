import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  GraduationCap, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  User,
  Info
} from 'lucide-react';
import { PageHeader, PageContainer } from '@/components/shared';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import CursoPaymentModal from '@/components/cursos/CursoPaymentModal';
import CursoInfoModal from '@/components/cursos/CursoInfoModal';
import { 
  useCursosFuturos, 
  useMinhasInscricoesCursos, 
  useVagasCursos,
  useInscreverCurso,
  useCancelarInscricaoCurso 
} from '@/hooks/queries';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { CursoEvento } from '@/types';

const Cursos: React.FC = () => {
  const { user } = useAuth();
  const [selectedCurso, setSelectedCurso] = useState<CursoEvento | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [cursoToView, setCursoToView] = useState<CursoEvento | null>(null);
  const [formaPagamento, setFormaPagamento] = useState('pix');

  const { data: cursos, isLoading } = useCursosFuturos();
  const { data: minhasInscricoes } = useMinhasInscricoesCursos(user?.id);
  
  const cursoIds = useMemo(() => cursos?.map(c => c.id) || [], [cursos]);
  const { data: vagasUsadas } = useVagasCursos(cursoIds);

  const inscreverMutation = useInscreverCurso();
  const cancelarMutation = useCancelarInscricaoCurso();

  // Buscar nome do usuário para pagamento online
  const { data: userProfile } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  const isUserInscrito = (cursoId: string) => minhasInscricoes?.includes(cursoId);

  const getVagasDisponiveis = (curso: CursoEvento) => {
    if (!curso.vagas) return null;
    const usadas = vagasUsadas?.[curso.id] || 0;
    return curso.vagas - usadas;
  };

  const isCursoEsgotado = (curso: CursoEvento) => {
    const vagas = getVagasDisponiveis(curso);
    return vagas !== null && vagas <= 0;
  };

  const handleOpenPayment = useCallback((curso: CursoEvento) => {
    setSelectedCurso(curso);
    setIsPaymentModalOpen(true);
  }, []);

  const handleConfirmInscricao = useCallback(() => {
    if (!selectedCurso || !user) return;

    inscreverMutation.mutate(
      { 
        cursoId: selectedCurso.id, 
        userId: user.id,
        formaPagamento: selectedCurso.gratuito ? 'gratuito' : formaPagamento
      },
      {
        onSuccess: () => {
          toast.success('Inscrição realizada!', {
            description: `Você está inscrito em "${selectedCurso.nome}"`,
          });
          setIsPaymentModalOpen(false);
          setSelectedCurso(null);
        },
        onError: () => {
          toast.error('Erro ao realizar inscrição', {
            description: 'Tente novamente mais tarde.',
          });
        },
      }
    );
  }, [selectedCurso, user, formaPagamento, inscreverMutation]);

  const handleCancelar = useCallback((cursoId: string) => {
    if (!user) return;
    cancelarMutation.mutate(
      { cursoId, userId: user.id },
      {
        onSuccess: () => {
          toast.success('Inscrição cancelada');
        },
        onError: () => {
          toast.error('Erro ao cancelar inscrição');
        },
      }
    );
  }, [user, cancelarMutation]);

  const handleViewInfo = useCallback((curso: CursoEvento) => {
    setCursoToView(curso);
    setIsInfoModalOpen(true);
  }, []);

  const handleClosePayment = useCallback(() => {
    setIsPaymentModalOpen(false);
    setSelectedCurso(null);
  }, []);

  const handleCloseInfo = useCallback(() => {
    setIsInfoModalOpen(false);
    setCursoToView(null);
  }, []);

  const formatarValor = (valor: number) => {
    return (valor / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <PageContainer maxWidth="xl">
      <PageHeader
        icon={GraduationCap}
        title="Cursos e Eventos"
        description="Formações, workshops e encontros especiais."
      />

      {!cursos || cursos.length === 0 ? (
        <Card className="text-center py-12 border-dashed border-2 bg-card/50">
          <CardContent>
            <GraduationCap className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-xl text-muted-foreground font-display">
              Nenhum curso ou evento agendado no momento.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Fique atento, em breve teremos novidades!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cursos.map((curso) => (
            <Card key={curso.id} className="border-border/50 bg-card overflow-hidden flex flex-col">
              {/* Banner */}
              <div className="h-44 w-full overflow-hidden relative bg-muted">
                {curso.banner_url ? (
                  <img
                    src={curso.banner_url}
                    alt={curso.nome}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/12">
                    <GraduationCap className="w-16 h-16 text-primary/30" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40" />
                
                <button
                  type="button"
                  className="absolute top-2 right-2 h-8 w-8 rounded-full bg-background/80 flex items-center justify-center shadow-md"
                  onClick={() => handleViewInfo(curso)}
                >
                  <Info className="w-4 h-4 text-primary" />
                </button>

                <div className="absolute bottom-3 left-3 right-3">
                  <h3 className="text-white font-display text-lg font-semibold drop-shadow-md leading-tight mb-1">
                    {curso.nome}
                  </h3>
                  <Badge className={`${curso.gratuito ? 'bg-green-600' : 'bg-primary/90'} text-white border-none`}>
                    {curso.gratuito ? 'Gratuito' : formatarValor(curso.valor)}
                  </Badge>
                </div>
              </div>

              <CardHeader className="pb-2 pt-4">
                {isUserInscrito(curso.id) && (
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 border-green-200 dark:border-green-500/30 flex gap-1 items-center w-fit mb-2">
                    <CheckCircle2 className="w-3 h-3" /> Inscrito
                  </Badge>
                )}

                <div className="flex items-center gap-2 text-foreground font-medium">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span>
                    {format(new Date(curso.data_inicio), "dd 'de' MMMM", { locale: ptBR })}
                    {curso.data_fim && curso.data_fim !== curso.data_inicio && (
                      <> a {format(new Date(curso.data_fim), "dd 'de' MMMM", { locale: ptBR })}</>
                    )}
                  </span>
                </div>
                <CardDescription className="flex items-center gap-2 text-base text-muted-foreground">
                  <Clock className="w-4 h-4 text-primary" />
                  {curso.horario_inicio.slice(0, 5)}
                  {curso.horario_fim && ` - ${curso.horario_fim.slice(0, 5)}`}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3 flex-grow">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="w-4 h-4 text-primary" />
                  <span className="text-sm">{curso.responsavel}</span>
                </div>

                {curso.local && (
                  <div className="flex items-start gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm">{curso.local}</span>
                  </div>
                )}

                {curso.descricao && (
                  <p className="text-sm text-muted-foreground line-clamp-2 italic border-l-2 border-primary/20 pl-3">
                    {curso.descricao}
                  </p>
                )}

                {curso.vagas && (
                  <div className={`flex items-center gap-2 text-sm font-medium p-2 rounded-lg ${
                    isCursoEsgotado(curso) 
                      ? 'bg-destructive/10 text-destructive' 
                      : 'bg-secondary/10 text-foreground'
                  }`}>
                    {isCursoEsgotado(curso) ? (
                      <>
                        <AlertCircle className="w-4 h-4" />
                        <span>Esgotado</span>
                      </>
                    ) : (
                      <>
                        <Users className="w-4 h-4 text-primary" />
                        <span>{getVagasDisponiveis(curso)} vagas disponíveis</span>
                      </>
                    )}
                  </div>
                )}
              </CardContent>

              <CardFooter className="pt-4 border-t border-border/50 bg-muted/30 flex flex-col gap-2">
                {isUserInscrito(curso.id) ? (
                  <div className="w-full flex flex-col gap-2">
                    <Button className="w-full bg-green-600 hover:bg-green-700 text-white cursor-default opacity-90">
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Vaga Garantida
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" className="w-full text-destructive hover:text-destructive/90 hover:bg-destructive/10">
                          <XCircle className="w-4 h-4 mr-2" /> Cancelar Inscrição
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Cancelar Inscrição?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja cancelar sua inscrição neste curso/evento?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Voltar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleCancelar(curso.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Sim, Cancelar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ) : isCursoEsgotado(curso) ? (
                  <Button className="w-full" disabled>
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Vagas Esgotadas
                  </Button>
                ) : (
                  <Button
                    className="w-full bg-primary hover:bg-primary/90"
                    onClick={() => handleOpenPayment(curso)}
                  >
                    Inscrever-se
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Inscrição/Pagamento */}
      <CursoPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={handleClosePayment}
        curso={selectedCurso}
        formaPagamento={formaPagamento}
        setFormaPagamento={setFormaPagamento}
        onConfirm={handleConfirmInscricao}
        isPending={inscreverMutation.isPending}
        userId={user?.id || ''}
        userEmail={user?.email || ''}
        userName={userProfile?.full_name || user?.email || ''}
      />

      {/* Modal de Informações */}
      <CursoInfoModal
        isOpen={isInfoModalOpen}
        onClose={handleCloseInfo}
        curso={cursoToView}
        isInscrito={cursoToView ? isUserInscrito(cursoToView.id) : false}
        isEsgotado={cursoToView ? isCursoEsgotado(cursoToView) : false}
        vagasDisponiveis={cursoToView ? getVagasDisponiveis(cursoToView) : null}
        onInscrever={() => cursoToView && handleOpenPayment(cursoToView)}
      />
    </PageContainer>
  );
};

export default Cursos;
