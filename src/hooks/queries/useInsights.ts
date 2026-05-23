import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { DiarioEntrada, HumorType, InscricaoComCerimonia } from '@/types';

// -------------------------------------------------------
// Estatísticas de jornada do usuário
// -------------------------------------------------------

export interface JornadaStats {
  totalCerimonias: number;
  primeiraCerimonia: string | null;
  ultimaCerimonia: string | null;
  medicinasExperimentadas: string[];
  presencasConfirmadas: number;
}

export const useJornadaStats = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['insights-stats', userId],
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inscricoes')
        .select(`
          id,
          presenca_confirmada,
          cancelada,
          data_inscricao,
          cerimonias (
            id, nome, data, medicina_principal
          )
        `)
        .eq('user_id', userId!)
        .neq('cancelada', true)
        .order('data_inscricao', { ascending: true });

      if (error) throw error;

      const inscricoes = (data ?? []) as InscricaoComCerimonia[];
      const presentes = inscricoes.filter((i) => i.presenca_confirmada);

      const medicinasSet = new Set<string>();
      presentes.forEach((i) => {
        const med = i.cerimonias?.medicina_principal;
        if (med) medicinasSet.add(med);
      });

      const datas = presentes
        .map((i) => i.cerimonias?.data)
        .filter(Boolean) as string[];

      return {
        totalCerimonias: presentes.length,
        primeiraCerimonia: datas.length ? datas[0] : null,
        ultimaCerimonia: datas.length ? datas[datas.length - 1] : null,
        medicinasExperimentadas: Array.from(medicinasSet),
        presencasConfirmadas: presentes.length,
      } satisfies JornadaStats;
    },
  });
};

// -------------------------------------------------------
// Timeline de cerimônias do usuário
// -------------------------------------------------------

export const useTimelineCerimonias = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['insights-timeline', userId],
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inscricoes')
        .select(`
          id,
          presenca_confirmada,
          cancelada,
          data_inscricao,
          cerimonias (
            id, nome, data, horario, local, medicina_principal, banner_url
          )
        `)
        .eq('user_id', userId!)
        .neq('cancelada', true)
        .order('data_inscricao', { ascending: false });

      if (error) throw error;
      return (data ?? []) as InscricaoComCerimonia[];
    },
  });
};

// -------------------------------------------------------
// Entradas do diário
// -------------------------------------------------------

export const useDiarioEntradas = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['diario', userId],
    enabled: !!userId,
    staleTime: 1000 * 60 * 2,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('diario_entradas')
        .select(`
          *,
          cerimonias (
            id, nome, data, medicina_principal
          )
        `)
        .eq('user_id', userId!)
        .order('data', { ascending: false });

      if (error) throw error;
      return (data ?? []) as DiarioEntrada[];
    },
  });
};

// -------------------------------------------------------
// Criar entrada no diário
// -------------------------------------------------------

interface CreateEntradaPayload {
  userId: string;
  conteudo: string;
  humor: HumorType | null;
  data: string;
  cerimonia_id?: string | null;
  tipo?: 'diario' | 'guardiao';
}

export const useCreateDiarioEntrada = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateEntradaPayload) => {
      const { data, error } = await supabase
        .from('diario_entradas')
        .insert({
          user_id: payload.userId,
          conteudo: payload.conteudo,
          humor: payload.humor,
          data: payload.data,
          cerimonia_id: payload.cerimonia_id ?? null,
          tipo: payload.tipo ?? 'diario',
        })
        .select()
        .single();

      if (error) throw error;
      return data as DiarioEntrada;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['diario', variables.userId] });
    },
  });
};

// -------------------------------------------------------
// Atualizar entrada no diário
// -------------------------------------------------------

interface UpdateEntradaPayload {
  id: string;
  userId: string;
  conteudo: string;
  humor: HumorType | null;
}

export const useUpdateDiarioEntrada = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateEntradaPayload) => {
      const { data, error } = await supabase
        .from('diario_entradas')
        .update({ conteudo: payload.conteudo, humor: payload.humor })
        .eq('id', payload.id)
        .eq('user_id', payload.userId)
        .select()
        .single();

      if (error) throw error;
      return data as DiarioEntrada;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['diario', variables.userId] });
    },
  });
};

// -------------------------------------------------------
// Deletar entrada no diário
// -------------------------------------------------------

export const useDeleteDiarioEntrada = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, userId }: { id: string; userId: string }) => {
      const { error } = await supabase
        .from('diario_entradas')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['diario', variables.userId] });
    },
  });
};
