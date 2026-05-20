import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Inscricao, InscricaoComRelacionamentos, InscricaoComCerimonia } from '@/types';

export interface CerimoniaPassada {
  id: string;
  nome: string | null;
  data: string;
  horario: string;
  local: string;
  medicina_principal: string | null;
  vagas: number | null;
  valor: number | null;
  total_inscritos: number;
  total_presentes: number;
  total_pagos: number;
  inscricoes: {
    id: string;
    pago: boolean;
    cancelada: boolean | null;
    presenca_confirmada: boolean | null;
    user_id: string;
  }[];
}

export interface ParticipanteCerimonia {
  id: string;
  pago: boolean;
  cancelada: boolean | null;
  presenca_confirmada: boolean | null;
  forma_pagamento: string | null;
  data_inscricao: string;
  profiles: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

/**
 * Hook para buscar inscrições do usuário logado
 * Requirements: 6.2
 */
export const useMinhasInscricoes = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['minhas-inscricoes', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inscricoes')
        .select('cerimonia_id')
        .eq('user_id', userId!)
        .or('cancelada.is.null,cancelada.eq.false');

      if (error) throw error;
      return data.map((i) => i.cerimonia_id);
    },
  });
};

/**
 * Hook para buscar todas as inscrições com relacionamentos (Admin)
 * Requirements: 6.2
 */
export const useInscricoesAdmin = () => {
  return useQuery({
    queryKey: ['admin-inscricoes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inscricoes')
        .select(`
          *,
          profiles:user_id (*),
          cerimonias:cerimonia_id (*)
        `)
        .order('data_inscricao', { ascending: false });
      if (error) throw error;
      return data as InscricaoComRelacionamentos[];
    },
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
};

/**
 * Hook para buscar histórico de inscrições do usuário
 * Requirements: 4.1, 4.2, 6.2
 */
export const useHistoricoInscricoes = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['historico-inscricoes', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inscricoes')
        .select(`
          *,
          cerimonias (
            id,
            nome,
            data,
            horario,
            local,
            medicina_principal,
            banner_url
          )
        `)
        .eq('user_id', userId!)
        .or('cancelada.is.null,cancelada.eq.false')
        .order('cerimonias(data)', { ascending: false });

      if (error) throw error;
      return data as InscricaoComCerimonia[];
    },
  });
};

/**
 * Hook para buscar cerimônias próximas do usuário (próximos 3 dias)
 * Requirements: 8.2
 */
export const useCerimoniasProximas = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['cerimonias-proximas', userId],
    enabled: !!userId,
    queryFn: async () => {
      const hoje = new Date();
      const tresDias = new Date();
      tresDias.setDate(hoje.getDate() + 3);

      const hojeStr = hoje.toISOString().split('T')[0];
      const tresDiasStr = tresDias.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('inscricoes')
        .select(`
          *,
          cerimonias (
            id,
            nome,
            data,
            horario,
            local,
            medicina_principal,
            banner_url
          )
        `)
        .eq('user_id', userId!)
        .or('cancelada.is.null,cancelada.eq.false')
        .gte('cerimonias.data', hojeStr)
        .lte('cerimonias.data', tresDiasStr);

      if (error) throw error;
      
      // Filtrar inscrições que têm cerimônias válidas (dentro do período)
      const inscricoesComCerimonia = (data as InscricaoComCerimonia[]).filter(
        (inscricao) => inscricao.cerimonias !== null
      );

      // Ordenar por data da cerimônia
      return inscricoesComCerimonia.sort((a, b) =>
        new Date(a.cerimonias.data).getTime() - new Date(b.cerimonias.data).getTime()
      );
    },
  });
};

/**
 * Hook para buscar todas as cerimônias passadas com estatísticas (Admin/Guardião)
 */
export const useHistoricoCerimoniasAdmin = (enabled: boolean) => {
  return useQuery({
    queryKey: ['historico-cerimonias-admin'],
    enabled,
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const hoje = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('cerimonias')
        .select(`
          id,
          nome,
          data,
          horario,
          local,
          medicina_principal,
          vagas,
          valor,
          inscricoes (
            id,
            pago,
            cancelada,
            presenca_confirmada,
            user_id
          )
        `)
        .lt('data', hoje)
        .order('data', { ascending: false });

      if (error) throw error;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data || []).map((c: any): CerimoniaPassada => {
        const inscricoesAtivas = (c.inscricoes || []).filter((i: any) => !i.cancelada);
        return {
          id: c.id,
          nome: c.nome,
          data: c.data,
          horario: c.horario,
          local: c.local,
          medicina_principal: c.medicina_principal,
          vagas: c.vagas,
          valor: c.valor,
          inscricoes: c.inscricoes || [],
          total_inscritos: inscricoesAtivas.length,
          total_presentes: inscricoesAtivas.filter((i: any) => i.presenca_confirmada).length,
          total_pagos: inscricoesAtivas.filter((i: any) => i.pago).length,
        };
      });
    },
  });
};

/**
 * Hook para buscar participantes de uma cerimônia específica (Admin/Guardião)
 */
export const useParticipantesCerimonia = (cerimoniaId: string | null) => {
  return useQuery({
    queryKey: ['participantes-cerimonia', cerimoniaId],
    enabled: !!cerimoniaId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inscricoes')
        .select(`
          id,
          pago,
          cancelada,
          presenca_confirmada,
          forma_pagamento,
          data_inscricao,
          profiles:user_id (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('cerimonia_id', cerimoniaId!)
        .order('data_inscricao', { ascending: true });

      if (error) throw error;
      return data as ParticipanteCerimonia[];
    },
  });
};
