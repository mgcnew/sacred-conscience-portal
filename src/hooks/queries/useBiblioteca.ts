import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// ============================================
// Tipos
// ============================================

export interface EbookMarcador {
  id: string;
  user_id: string;
  ebook_pessoal_id: string | null;
  biblioteca_id: string | null;
  pagina: number;
  titulo: string | null;
  cor: string;
  /** EPUB CFI: o ponto exato do texto, que sobrevive a mudanças de fonte. */
  localizacao: string | null;
  created_at: string;
}

export interface EbookAnotacao {
  id: string;
  user_id: string;
  ebook_pessoal_id: string | null;
  biblioteca_id: string | null;
  pagina: number | null;
  texto: string;
  trecho_selecionado: string | null;
  /** EPUB CFI: o ponto exato do texto, que sobrevive a mudanças de fonte. */
  localizacao: string | null;
  created_at: string;
  updated_at: string;
}

export interface EbookConfigLeitura {
  id: string;
  user_id: string;
  tema: 'light' | 'sepia' | 'dark';
  tamanho_fonte: number;
}

// ============================================
// Marcadores
// ============================================

export const useMarcadores = (ebookPessoalId?: string, bibliotecaId?: string) => {
  return useQuery({
    queryKey: ['ebook-marcadores', ebookPessoalId, bibliotecaId],
    queryFn: async () => {
      let query = supabase.from('ebook_marcadores').select('*');
      
      if (ebookPessoalId) {
        query = query.eq('ebook_pessoal_id', ebookPessoalId);
      } else if (bibliotecaId) {
        query = query.eq('biblioteca_id', bibliotecaId);
      }
      
      const { data, error } = await query.order('pagina');
      if (error) throw error;
      return data as EbookMarcador[];
    },
    enabled: !!(ebookPessoalId || bibliotecaId),
  });
};

export const useCreateMarcador = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (marcador: Omit<EbookMarcador, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('ebook_marcadores')
        .insert(marcador)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['ebook-marcadores', variables.ebook_pessoal_id, variables.biblioteca_id] 
      });
    },
  });
};

export const useDeleteMarcador = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ebookPessoalId, bibliotecaId }: { 
      id: string; 
      ebookPessoalId?: string; 
      bibliotecaId?: string;
    }) => {
      const { error } = await supabase
        .from('ebook_marcadores')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return { ebookPessoalId, bibliotecaId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: ['ebook-marcadores', data.ebookPessoalId, data.bibliotecaId] 
      });
    },
  });
};

// ============================================
// Anotações
// ============================================

export const useAnotacoes = (ebookPessoalId?: string, bibliotecaId?: string) => {
  return useQuery({
    queryKey: ['ebook-anotacoes', ebookPessoalId, bibliotecaId],
    queryFn: async () => {
      let query = supabase.from('ebook_anotacoes').select('*');
      
      if (ebookPessoalId) {
        query = query.eq('ebook_pessoal_id', ebookPessoalId);
      } else if (bibliotecaId) {
        query = query.eq('biblioteca_id', bibliotecaId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data as EbookAnotacao[];
    },
    enabled: !!(ebookPessoalId || bibliotecaId),
  });
};

export const useCreateAnotacao = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (anotacao: Omit<EbookAnotacao, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('ebook_anotacoes')
        .insert(anotacao)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['ebook-anotacoes', variables.ebook_pessoal_id, variables.biblioteca_id] 
      });
    },
  });
};

export const useUpdateAnotacao = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, texto, ebookPessoalId, bibliotecaId }: { 
      id: string; 
      texto: string;
      ebookPessoalId?: string;
      bibliotecaId?: string;
    }) => {
      const { data, error } = await supabase
        .from('ebook_anotacoes')
        .update({ texto, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return { data, ebookPessoalId, bibliotecaId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ 
        queryKey: ['ebook-anotacoes', result.ebookPessoalId, result.bibliotecaId] 
      });
    },
  });
};

export const useDeleteAnotacao = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ebookPessoalId, bibliotecaId }: { 
      id: string; 
      ebookPessoalId?: string;
      bibliotecaId?: string;
    }) => {
      const { error } = await supabase
        .from('ebook_anotacoes')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return { ebookPessoalId, bibliotecaId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: ['ebook-anotacoes', data.ebookPessoalId, data.bibliotecaId] 
      });
    },
  });
};

// ============================================
// Configurações de Leitura
// ============================================

export const useConfigLeitura = (userId?: string) => {
  return useQuery({
    queryKey: ['ebook-config-leitura', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ebook_config_leitura')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) throw error;
      
      // Retornar config padrão se não existir
      return data as EbookConfigLeitura | null;
    },
    enabled: !!userId,
  });
};

export const useUpsertConfigLeitura = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: { user_id: string; tema?: string; tamanho_fonte?: number }) => {
      const { data, error } = await supabase
        .from('ebook_config_leitura')
        .upsert(
          { ...config, updated_at: new Date().toISOString() },
          { onConflict: 'user_id' }
        )
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ebook-config-leitura', variables.user_id] });
    },
  });
};

// ============================================
// Upload de Capa
// ============================================

export const useUploadCapa = () => {
  return useMutation({
    mutationFn: async ({ userId, file }: { userId: string; file: File }) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('ebook-capas')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('ebook-capas')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    },
  });
};

// ============================================
// Atualizar Progresso de Leitura
// ============================================

export const useUpdateProgressoEbookPessoal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, pagina, progresso }: { id: string; pagina: number; progresso: number }) => {
      const { error } = await supabase
        .from('ebooks_pessoais')
        .update({
          pagina_atual: pagina,
          progresso,
          ultima_leitura: new Date().toISOString(),
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ebooks-pessoais'] });
    },
  });
};
