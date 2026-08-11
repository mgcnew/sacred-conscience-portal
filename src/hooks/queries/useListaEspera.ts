import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ListaEsperaItem {
  id: string;
  user_id: string;
  cerimonia_id: string;
  posicao: number;
  notificado: boolean;
  created_at: string;
}

// Buscar posição do usuário na lista de espera de uma cerimônia
export function useMinhaListaEspera(userId?: string) {
  return useQuery({
    queryKey: ['minha-lista-espera', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('lista_espera_cerimonias')
        .select('*')
        .eq('user_id', userId);
      if (error) throw error;
      return data as ListaEsperaItem[];
    },
    enabled: !!userId,
  });
}

// Verificar se usuário está na lista de espera de uma cerimônia específica
export function usePosicaoListaEspera(userId?: string, cerimoniaId?: string) {
  return useQuery({
    queryKey: ['posicao-lista-espera', userId, cerimoniaId],
    queryFn: async () => {
      if (!userId || !cerimoniaId) return null;
      const { data, error } = await supabase
        .from('lista_espera_cerimonias')
        .select('posicao')
        .eq('user_id', userId)
        .eq('cerimonia_id', cerimoniaId)
        .maybeSingle();
      if (error) throw error;
      return data?.posicao ?? null;
    },
    enabled: !!userId && !!cerimoniaId,
  });
}

// Entrar na lista de espera
export function useEntrarListaEspera() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, cerimoniaId }: { userId: string; cerimoniaId: string }) => {
      const { data, error } = await supabase
        .from('lista_espera_cerimonias')
        .insert({ user_id: userId, cerimonia_id: cerimoniaId })
        .select('posicao')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success('Você entrou na lista de espera!', {
        description: `Sua posição na fila: ${data.posicao}º lugar`,
      });
      queryClient.invalidateQueries({ queryKey: ['minha-lista-espera'] });
      queryClient.invalidateQueries({ queryKey: ['posicao-lista-espera'] });
    },
    onError: (error: Error) => {
      if (error.message.includes('duplicate')) {
        toast.info('Você já está na lista de espera desta cerimônia');
      } else {
        toast.error('Erro ao entrar na lista de espera');
      }
    },
  });
}

// Sair da lista de espera
export function useSairListaEspera() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, cerimoniaId }: { userId: string; cerimoniaId: string }) => {
      const { error } = await supabase
        .from('lista_espera_cerimonias')
        .delete()
        .eq('user_id', userId)
        .eq('cerimonia_id', cerimoniaId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Você saiu da lista de espera');
      queryClient.invalidateQueries({ queryKey: ['minha-lista-espera'] });
      queryClient.invalidateQueries({ queryKey: ['posicao-lista-espera'] });
    },
    onError: () => {
      toast.error('Erro ao sair da lista de espera');
    },
  });
}

// ---------------------------------------------------------------
// Admin — fila de espera de uma cerimônia
// ---------------------------------------------------------------

export interface FilaEsperaItem {
  id: string;
  user_id: string;
  posicao: number;
  notificado: boolean;
  notificado_em: string | null;
  created_at: string;
  nome: string;
  telefone: string | null;
}

/**
 * Fila de espera de uma cerimônia, em ordem de chegada, com contato.
 *
 * lista_espera_cerimonias.user_id referencia auth.users e não profiles,
 * então o PostgREST não embute o perfil direto — daí a busca em duas
 * etapas em vez de um único select com join.
 */
export function useFilaEspera(cerimoniaId?: string, enabled = true) {
  return useQuery({
    queryKey: ['fila-espera', cerimoniaId],
    enabled: !!cerimoniaId && enabled,
    staleTime: 1000 * 30,
    queryFn: async (): Promise<FilaEsperaItem[]> => {
      const { data: fila, error } = await supabase
        .from('lista_espera_cerimonias')
        .select('id, user_id, posicao, notificado, notificado_em, created_at')
        .eq('cerimonia_id', cerimoniaId!)
        .order('posicao', { ascending: true });
      if (error) throw error;
      if (!fila?.length) return [];

      const ids = fila.map((f) => f.user_id);
      const [{ data: perfis }, { data: anamneses }] = await Promise.all([
        supabase.from('profiles').select('id, full_name').in('id', ids),
        supabase.from('anamneses').select('user_id, telefone').in('user_id', ids),
      ]);

      const nomePorId = new Map((perfis ?? []).map((p) => [p.id, p.full_name]));
      const telPorId = new Map((anamneses ?? []).map((a) => [a.user_id, a.telefone]));

      return fila.map((f) => ({
        ...f,
        nome: nomePorId.get(f.user_id) ?? 'Sem nome',
        telefone: telPorId.get(f.user_id) ?? null,
      }));
    },
  });
}

/**
 * Marca alguém da fila como avisado e cria a notificação no app.
 * Usado quando o admin chama a pessoa para uma vaga que abriu.
 */
export function useAvisarDaFila() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      userId,
      cerimoniaNome,
    }: {
      id: string;
      userId: string;
      cerimoniaId: string;
      cerimoniaNome: string;
    }) => {
      const { error } = await supabase
        .from('lista_espera_cerimonias')
        .update({ notificado: true, notificado_em: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;

      const { error: notifError } = await supabase.from('notificacoes').insert({
        user_id: userId,
        tipo: 'lista_espera',
        titulo: 'Vaga disponível! 🎉',
        mensagem: `Uma vaga abriu na cerimônia "${cerimoniaNome}". Corra para garantir seu lugar!`,
      });
      if (notifError) throw notifError;
    },
    onSuccess: (_d, vars) => {
      toast.success('Pessoa avisada', { description: 'A notificação foi enviada no app.' });
      queryClient.invalidateQueries({ queryKey: ['fila-espera', vars.cerimoniaId] });
    },
    onError: () => toast.error('Erro ao avisar a pessoa'),
  });
}

/** Remove alguém da fila (desistiu, ou já foi inscrito). */
export function useRemoverDaFila() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: string; cerimoniaId: string }) => {
      const { error } = await supabase.from('lista_espera_cerimonias').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      toast.success('Removido da fila');
      queryClient.invalidateQueries({ queryKey: ['fila-espera', vars.cerimoniaId] });
    },
    onError: () => toast.error('Erro ao remover da fila'),
  });
}
