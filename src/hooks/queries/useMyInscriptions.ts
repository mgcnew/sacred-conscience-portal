import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Verifica se o usuário já participou de ao menos uma cerimônia
 * (inscrição com presenca_confirmada = true e não cancelada)
 */
export const useTemConsagracao = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['tem-consagracao', userId],
    enabled: !!userId,
    staleTime: 1000 * 60 * 10,
    queryFn: async (): Promise<boolean> => {
      const { data, error } = await supabase
        .from('inscricoes')
        .select('id')
        .eq('user_id', userId!)
        .eq('presenca_confirmada', true)
        .or('cancelada.is.null,cancelada.eq.false')
        .limit(1);

      if (error) throw error;
      return (data?.length ?? 0) > 0;
    },
  });
};

/**
 * Dados da cerimônia na inscrição
 */
interface CerimoniaData {
  id: string;
  nome: string | null;
  data: string;
  horario: string;
  local: string;
  medicina_principal: string | null;
}

/**
 * Inscrição do usuário com dados da cerimônia
 */
export interface MyInscription {
  id: string;
  status: 'confirmada' | 'pendente' | 'cancelada';
  pago: boolean;
  data_inscricao: string;
  presenca_confirmada: boolean;
  confirmado_em: string | null;
  cerimonia: CerimoniaData;
}

/**
 * Hook para buscar inscrições do usuário
 * Requirements: 3.1 - Seção Minhas Consagrações
 *
 * @param onlyUpcoming - quando true, retorna apenas cerimônias futuras (>= hoje), ordenadas da mais próxima para a mais distante
 */
export const useMyInscriptions = (userId: string | undefined, limit = 3, onlyUpcoming = false) => {
  return useQuery({
    queryKey: ['my-inscriptions', userId, limit, onlyUpcoming],
    enabled: !!userId,
    queryFn: async (): Promise<MyInscription[]> => {
      // Busca mais registros quando filtramos por data, para garantir `limit` resultados após o filtro
      const fetchLimit = onlyUpcoming ? limit * 5 : limit;

      const { data, error } = await supabase
        .from('inscricoes')
        .select(`
          id,
          pago,
          data_inscricao,
          presenca_confirmada,
          confirmado_em,
          cerimonias (
            id,
            nome,
            data,
            horario,
            local,
            medicina_principal
          )
        `)
        .eq('user_id', userId!)
        .or('cancelada.is.null,cancelada.eq.false')
        .order('data_inscricao', { ascending: false })
        .limit(fetchLimit);

      if (error) throw error;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const inscriptions: MyInscription[] = (data || [])
        .filter((item: { cerimonias: unknown }) => item.cerimonias !== null)
        .map((item: { id: string; pago: boolean; data_inscricao: string; presenca_confirmada: boolean; confirmado_em: string | null; cerimonias: unknown }) => {
          const status: 'confirmada' | 'pendente' | 'cancelada' = item.pago
            ? 'confirmada'
            : 'pendente';

          return {
            id: item.id,
            status,
            pago: item.pago,
            data_inscricao: item.data_inscricao,
            presenca_confirmada: item.presenca_confirmada ?? false,
            confirmado_em: item.confirmado_em,
            cerimonia: item.cerimonias as CerimoniaData,
          };
        })
        .filter((i: MyInscription) => {
          if (!onlyUpcoming) return true;
          const [y, m, d] = i.cerimonia.data.split('-').map(Number);
          return new Date(y, m - 1, d) >= today;
        })
        // Mais próxima primeiro quando onlyUpcoming, mais recente primeiro nos outros casos
        .sort((a: MyInscription, b: MyInscription) =>
          onlyUpcoming
            ? new Date(a.cerimonia.data).getTime() - new Date(b.cerimonia.data).getTime()
            : new Date(b.cerimonia.data).getTime() - new Date(a.cerimonia.data).getTime()
        )
        .slice(0, limit);

      return inscriptions;
    },
    staleTime: 1000 * 60 * 2,
  });
};
