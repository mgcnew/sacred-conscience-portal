import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Camera,
  CameraOff,
  Clock,
  CreditCard,
  FileText,
  ChevronDown,
  ChevronUp,
  Pill,
  UserCheck,
  UserX,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { formatDateBR } from '@/lib/date-utils';

interface AnamneseDetalhes {
  id: string;
  user_id: string;
  aceite_uso_imagem: boolean;
  uso_medicamentos: string | null;
  uso_antidepressivos: boolean;
  tipo_antidepressivo: string | null;
  pressao_alta: boolean;
  problemas_cardiacos: boolean;
  problemas_respiratorios: boolean;
  problemas_renais: boolean;
  problemas_hepaticos: boolean;
  historico_convulsivo: boolean;
  diabetes: boolean;
  transtorno_psiquiatrico: boolean;
  transtorno_psiquiatrico_qual: string | null;
  gestante_lactante: boolean;
  alergias: string | null;
  restricao_alimentar: string | null;
}

interface InscritoComDetalhes {
  id: string;
  user_id: string;
  cerimonia_id: string;
  forma_pagamento: string | null;
  pago: boolean;
  cancelada: boolean;
  presenca_confirmada: boolean;
  data_inscricao: string;
  profile: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  anamnese: AnamneseDetalhes | null;
  pagamento: {
    id: string;
    mp_status: string | null;
    valor_centavos: number;
  } | null;
}

interface Cerimonia {
  id: string;
  nome: string | null;
  medicina_principal: string;
  data: string;
}

const ListaPresentes: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedCerimonia, setSelectedCerimonia] = useState<string>('');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [updatingPresencaId, setUpdatingPresencaId] = useState<string | null>(null);

  // Helper para verificar se tem condições de saúde
  const temCondicoesSaude = (anamnese: AnamneseDetalhes | null): boolean => {
    if (!anamnese) return false;
    return (
      anamnese.pressao_alta ||
      anamnese.problemas_cardiacos ||
      anamnese.problemas_respiratorios ||
      anamnese.problemas_renais ||
      anamnese.problemas_hepaticos ||
      anamnese.historico_convulsivo ||
      anamnese.diabetes ||
      anamnese.transtorno_psiquiatrico ||
      anamnese.gestante_lactante ||
      anamnese.uso_antidepressivos
    );
  };

  // Helper para listar condições de saúde
  const getCondicoesSaude = (anamnese: AnamneseDetalhes): string[] => {
    const condicoes: string[] = [];
    if (anamnese.pressao_alta) condicoes.push('Pressão Alta');
    if (anamnese.problemas_cardiacos) condicoes.push('Problemas Cardíacos');
    if (anamnese.problemas_respiratorios) condicoes.push('Problemas Respiratórios');
    if (anamnese.problemas_renais) condicoes.push('Problemas Renais');
    if (anamnese.problemas_hepaticos) condicoes.push('Problemas Hepáticos');
    if (anamnese.historico_convulsivo) condicoes.push('Histórico Convulsivo');
    if (anamnese.diabetes) condicoes.push('Diabetes');
    if (anamnese.transtorno_psiquiatrico) condicoes.push('Transtorno Psiquiátrico');
    if (anamnese.gestante_lactante) condicoes.push('Gestante/Lactante');
    if (anamnese.uso_antidepressivos) condicoes.push('Uso de Antidepressivos');
    return condicoes;
  };

  // Buscar cerimônias futuras
  const { data: cerimonias, isLoading: loadingCerimonias } = useQuery({
    queryKey: ['cerimonias-futuras-lista'],
    queryFn: async () => {
      const hoje = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('cerimonias')
        .select('id, nome, medicina_principal, data')
        .gte('data', hoje)
        .order('data', { ascending: true });
      if (error) throw error;
      return data as Cerimonia[];
    },
  });

  // Buscar inscritos da cerimônia selecionada
  const { data: inscritos, isLoading: loadingInscritos } = useQuery({
    queryKey: ['inscritos-cerimonia', selectedCerimonia],
    enabled: !!selectedCerimonia,
    queryFn: async () => {
      // Buscar inscrições (não canceladas)
      const { data: inscricoes, error: errInsc } = await supabase
        .from('inscricoes')
        .select('id, user_id, cerimonia_id, forma_pagamento, pago, cancelada, presenca_confirmada, data_inscricao')
        .eq('cerimonia_id', selectedCerimonia)
        .eq('cancelada', false)
        .order('data_inscricao', { ascending: true });

      if (errInsc) throw errInsc;
      if (!inscricoes?.length) return [];

      const userIds = inscricoes.map(i => i.user_id);

      // Buscar profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);

      // Buscar anamneses
      const { data: anamneses } = await supabase
        .from('anamneses')
        .select(`
          id, user_id, aceite_uso_imagem, uso_medicamentos, uso_antidepressivos, 
          tipo_antidepressivo, pressao_alta, problemas_cardiacos, problemas_respiratorios,
          problemas_renais, problemas_hepaticos, historico_convulsivo, diabetes,
          transtorno_psiquiatrico, transtorno_psiquiatrico_qual, gestante_lactante,
          alergias, restricao_alimentar
        `)
        .in('user_id', userIds);

      // Buscar pagamentos
      const inscricaoIds = inscricoes.map(i => i.id);
      const { data: pagamentos } = await supabase
        .from('pagamentos')
        .select('id, inscricao_id, mp_status, valor_centavos')
        .in('inscricao_id', inscricaoIds);

      // Montar dados completos
      return inscricoes.map(insc => ({
        ...insc,
        profile: profiles?.find(p => p.id === insc.user_id) || null,
        anamnese: anamneses?.find(a => a.user_id === insc.user_id) || null,
        pagamento: pagamentos?.find(p => p.inscricao_id === insc.id) || null,
      })) as InscritoComDetalhes[];
    },
  });

  // Estatísticas
  const stats = useMemo(() => {
    if (!inscritos) return { total: 0, pagos: 0, pendentes: 0, presentes: 0, comCondicoes: 0, autorizamImagem: 0, usaMedicamentos: 0 };

    const pagos = inscritos.filter(i => i.pago || i.pagamento?.mp_status === 'approved').length;
    const presentes = inscritos.filter(i => i.presenca_confirmada).length;
    const comCondicoes = inscritos.filter(i => temCondicoesSaude(i.anamnese)).length;
    const autorizamImagem = inscritos.filter(i => i.anamnese?.aceite_uso_imagem).length;
    const usaMedicamentos = inscritos.filter(i => i.anamnese?.uso_medicamentos && i.anamnese.uso_medicamentos.trim() !== '').length;

    return {
      total: inscritos.length,
      pagos,
      pendentes: inscritos.length - pagos,
      presentes,
      comCondicoes,
      autorizamImagem,
      usaMedicamentos,
    };
  }, [inscritos]);

  const togglePresencaMutation = useMutation({
    mutationFn: async ({ id, atual }: { id: string; atual: boolean }) => {
      const { error } = await supabase
        .from('inscricoes')
        .update({ presenca_confirmada: !atual })
        .eq('id', id);
      if (error) throw error;
    },
    onMutate: ({ id }) => setUpdatingPresencaId(id),
    onSettled: () => {
      setUpdatingPresencaId(null);
      queryClient.invalidateQueries({ queryKey: ['inscritos-cerimonia', selectedCerimonia] });
      queryClient.invalidateQueries({ queryKey: ['admin-inscricoes'] });
    },
  });

  const toggleExpand = (id: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const getStatusPagamento = (inscrito: InscritoComDetalhes) => {
    if (inscrito.pago || inscrito.pagamento?.mp_status === 'approved') {
      return { label: 'Pago', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle };
    }
    if (inscrito.forma_pagamento === 'dinheiro' || inscrito.forma_pagamento === 'presencial') {
      return { label: 'Presencial', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: Clock };
    }
    if (inscrito.forma_pagamento === 'pix') {
      return { label: 'PIX Pendente', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: Clock };
    }
    if (inscrito.pagamento?.mp_status === 'pending') {
      return { label: 'Pendente', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', icon: Clock };
    }
    return { label: 'Aguardando', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400', icon: CreditCard };
  };

  return (
    <div className="space-y-4">
      {/* Seletor de Cerimônia */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex-1 w-full">
              <Select value={selectedCerimonia} onValueChange={setSelectedCerimonia}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione uma cerimônia..." />
                </SelectTrigger>
                <SelectContent>
                  {loadingCerimonias ? (
                    <div className="p-2 text-center text-muted-foreground">Carregando...</div>
                  ) : cerimonias?.length === 0 ? (
                    <div className="p-2 text-center text-muted-foreground">Nenhuma cerimônia futura</div>
                  ) : (
                    cerimonias?.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nome || c.medicina_principal} - {formatDateBR(c.data)}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      {selectedCerimonia && inscritos && (
        <div className="grid grid-cols-2 md:grid-cols-7 gap-2">
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-lg font-bold">{stats.total}</p>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-500" />
              <div>
                <p className="text-xs text-muted-foreground">Presentes</p>
                <p className="text-lg font-bold text-emerald-600">{stats.presentes}</p>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <div>
                <p className="text-xs text-muted-foreground">Pagos</p>
                <p className="text-lg font-bold text-green-600">{stats.pagos}</p>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <div>
                <p className="text-xs text-muted-foreground">Pendentes</p>
                <p className="text-lg font-bold text-amber-600">{stats.pendentes}</p>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <div>
                <p className="text-xs text-muted-foreground">Condições</p>
                <p className="text-lg font-bold text-red-600">{stats.comCondicoes}</p>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <Pill className="w-4 h-4 text-purple-500" />
              <div>
                <p className="text-xs text-muted-foreground">Medicamentos</p>
                <p className="text-lg font-bold text-purple-600">{stats.usaMedicamentos}</p>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-blue-500" />
              <div>
                <p className="text-xs text-muted-foreground">Autorizam Img</p>
                <p className="text-lg font-bold text-blue-600">{stats.autorizamImagem}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Lista de Inscritos */}
      {!selectedCerimonia ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-muted-foreground">Selecione uma cerimônia para ver os inscritos</p>
          </CardContent>
        </Card>
      ) : loadingInscritos ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : inscritos?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-muted-foreground">Nenhum inscrito nesta cerimônia</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {inscritos?.map((inscrito, index) => {
            const statusPag = getStatusPagamento(inscrito);
            const isExpanded = expandedCards.has(inscrito.id);
            const StatusIcon = statusPag.icon;

            const isUpdating = updatingPresencaId === inscrito.id;

            return (
              <Card
                key={inscrito.id}
                className={cn("overflow-hidden transition-colors", inscrito.presenca_confirmada && "border-emerald-300 dark:border-emerald-700")}
              >
                <CardContent className="p-0">
                  {/* Header do card - sempre visível */}
                  <div className="p-3 flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-6 shrink-0">{index + 1}.</span>
                    <Avatar className="w-9 h-9 shrink-0">
                      <AvatarImage src={inscrito.profile?.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {inscrito.profile?.full_name?.charAt(0)?.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <button
                      onClick={() => toggleExpand(inscrito.id)}
                      className="flex-1 min-w-0 text-left"
                    >
                      <p className="font-medium text-sm truncate">
                        {inscrito.profile?.full_name || 'Sem nome'}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={cn("text-xs", statusPag.color)}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusPag.label}
                        </Badge>
                        {temCondicoesSaude(inscrito.anamnese) && (
                          <Badge variant="outline" className="text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Atenção
                          </Badge>
                        )}
                        {inscrito.anamnese?.uso_medicamentos && (
                          <Badge variant="outline" className="text-xs bg-primary/12 dark:bg-primary/20 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                            <Pill className="w-3 h-3 mr-1" />
                            Medicamentos
                          </Badge>
                        )}
                      </div>
                    </button>
                    {/* Presence toggle button */}
                    <Button
                      size="sm"
                      variant={inscrito.presenca_confirmada ? 'default' : 'outline'}
                      className={cn(
                        "h-9 w-9 p-0 shrink-0 rounded-full",
                        inscrito.presenca_confirmada && "bg-emerald-600 hover:bg-emerald-700 border-emerald-600"
                      )}
                      disabled={isUpdating}
                      onClick={() => togglePresencaMutation.mutate({ id: inscrito.id, atual: inscrito.presenca_confirmada })}
                      aria-label={inscrito.presenca_confirmada ? 'Desmarcar presença' : 'Marcar presença'}
                    >
                      {inscrito.presenca_confirmada
                        ? <UserCheck className="w-4 h-4" />
                        : <UserX className="w-4 h-4 text-muted-foreground" />
                      }
                    </Button>
                    <button
                      onClick={() => toggleExpand(inscrito.id)}
                      className="shrink-0 p-1 text-muted-foreground"
                      aria-label="Expandir detalhes"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Detalhes expandidos */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-2 border-t bg-muted/30 space-y-3">
                      {/* Ficha de Anamnese */}
                      <div className="flex items-start gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <div className="flex-1">
                          <p className="text-xs font-medium text-muted-foreground mb-1">Condições de Saúde</p>
                          {inscrito.anamnese ? (
                            <div className="space-y-2">
                              {temCondicoesSaude(inscrito.anamnese) ? (
                                <div className="space-y-1">
                                  <Badge variant="destructive" className="text-xs">
                                    <AlertTriangle className="w-3 h-3 mr-1" />
                                    Possui condições de saúde
                                  </Badge>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {getCondicoesSaude(inscrito.anamnese).map((cond, idx) => (
                                      <Badge key={idx} variant="outline" className="text-xs bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400">
                                        {cond}
                                      </Badge>
                                    ))}
                                  </div>
                                  {inscrito.anamnese.transtorno_psiquiatrico && inscrito.anamnese.transtorno_psiquiatrico_qual && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Transtorno: {inscrito.anamnese.transtorno_psiquiatrico_qual}
                                    </p>
                                  )}
                                  {inscrito.anamnese.uso_antidepressivos && inscrito.anamnese.tipo_antidepressivo && (
                                    <p className="text-xs text-muted-foreground">
                                      Antidepressivo: {inscrito.anamnese.tipo_antidepressivo}
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <Badge variant="outline" className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Sem condições de saúde declaradas
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <Badge variant="outline" className="text-xs bg-gray-100 dark:bg-muted text-gray-600">
                              <XCircle className="w-3 h-3 mr-1" />
                              Ficha não preenchida
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Medicamentos */}
                      {inscrito.anamnese && (
                        <div className="flex items-start gap-2">
                          <Pill className="w-4 h-4 text-muted-foreground mt-0.5" />
                          <div className="flex-1">
                            <p className="text-xs font-medium text-muted-foreground mb-1">Medicamentos em uso</p>
                            {inscrito.anamnese.uso_medicamentos ? (
                              <p className="text-xs bg-purple-50 dark:bg-purple-950/30 p-2 rounded text-purple-700 dark:text-purple-300">
                                {inscrito.anamnese.uso_medicamentos}
                              </p>
                            ) : (
                              <span className="text-xs text-muted-foreground">Nenhum</span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Alergias e Restrições */}
                      {inscrito.anamnese && (inscrito.anamnese.alergias || inscrito.anamnese.restricao_alimentar) && (
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5" />
                          <div className="flex-1 space-y-1">
                            {inscrito.anamnese.alergias && (
                              <div>
                                <p className="text-xs font-medium text-muted-foreground">Alergias</p>
                                <p className="text-xs text-amber-700 dark:text-amber-300">{inscrito.anamnese.alergias}</p>
                              </div>
                            )}
                            {inscrito.anamnese.restricao_alimentar && (
                              <div>
                                <p className="text-xs font-medium text-muted-foreground">Restrição Alimentar</p>
                                <p className="text-xs text-amber-700 dark:text-amber-300">{inscrito.anamnese.restricao_alimentar}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Autorização de Imagem */}
                      <div className={`flex items-center gap-2 p-2 rounded ${inscrito.anamnese?.aceite_uso_imagem ? 'bg-green-50 dark:bg-green-950/30' : 'bg-amber-50 dark:bg-amber-950/30'}`}>
                        {inscrito.anamnese?.aceite_uso_imagem ? (
                          <>
                            <Camera className="w-4 h-4 text-green-600 dark:text-green-400" />
                            <span className="text-xs text-green-700 dark:text-green-300 font-medium">Autoriza uso de imagem</span>
                          </>
                        ) : (
                          <>
                            <CameraOff className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                            <span className="text-xs text-amber-700 dark:text-amber-300 font-medium">NÃO autoriza uso de imagem</span>
                          </>
                        )}
                      </div>

                      {/* Data de inscrição */}
                      <p className="text-xs text-muted-foreground">
                        Inscrito em: {format(new Date(inscrito.data_inscricao), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ListaPresentes;
