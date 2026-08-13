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

/**
 * Chave da lista de marcadores de um livro.
 *
 * Existe para que quem lê e quem grava usem exatamente a mesma. A tela chama
 * `useMarcadores(idUpload, idCompra)` com `undefined` no lado que não se
 * aplica, e a gravação invalidava com o `null` que vai para a coluna do banco
 * — e `null` e `undefined` são chaves diferentes para o React Query. O
 * resultado era o marcador entrar no banco e a lista aberta na tela não
 * mostrar. Normalizar aqui, num lugar só, é o que impede o par de separar de
 * novo.
 */
export const chaveMarcadores = (
  ebookPessoalId?: string | null,
  bibliotecaId?: string | null,
) => ['ebook-marcadores', ebookPessoalId ?? null, bibliotecaId ?? null] as const;

export const useMarcadores = (ebookPessoalId?: string, bibliotecaId?: string) => {
  return useQuery({
    queryKey: chaveMarcadores(ebookPessoalId, bibliotecaId),
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
        queryKey: chaveMarcadores(variables.ebook_pessoal_id, variables.biblioteca_id),
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
        queryKey: chaveMarcadores(data.ebookPessoalId, data.bibliotecaId),
      });
    },
  });
};

// ============================================
// Anotações
// ============================================

/** Mesma normalização dos marcadores. Ver o comentário em `chaveMarcadores`. */
export const chaveAnotacoes = (
  ebookPessoalId?: string | null,
  bibliotecaId?: string | null,
) => ['ebook-anotacoes', ebookPessoalId ?? null, bibliotecaId ?? null] as const;

export const useAnotacoes = (ebookPessoalId?: string, bibliotecaId?: string) => {
  return useQuery({
    queryKey: chaveAnotacoes(ebookPessoalId, bibliotecaId),
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
        queryKey: chaveAnotacoes(variables.ebook_pessoal_id, variables.biblioteca_id),
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
        queryKey: chaveAnotacoes(result.ebookPessoalId, result.bibliotecaId),
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
        queryKey: chaveAnotacoes(data.ebookPessoalId, data.bibliotecaId),
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
// Acesso ao arquivo do livro
// ============================================

export interface AcessoLivro {
  /** URL assinada, de curta duração. */
  url: string;
  /** Preenchido só na compra: vira a marca d'água do leitor. */
  leitor: { nome: string | null; email: string | null } | null;
}

/**
 * O bucket `ebooks` é privado. O caminho dentro dele é o que sobra depois de
 * `/ebooks/` na URL antiga gravada no banco.
 */
const caminhoNoBucket = (valor: string): string | null => {
  if (!valor) return null;
  if (!valor.startsWith('http')) return valor.replace(/^\/+/, '');
  const i = valor.indexOf('/ebooks/');
  if (i === -1) return null;
  return decodeURIComponent(valor.slice(i + '/ebooks/'.length).split('?')[0]);
};

/**
 * Resolve a URL para abrir o livro.
 *
 * Compra: passa pela função `ler-ebook`, que confere em biblioteca_usuario
 * antes de assinar — a pasta da loja não tem policy de leitura, então não há
 * como um usuário assinar sozinho.
 * Upload: o arquivo é do próprio dono, que assina direto pelo app.
 *
 * A URL não é revalidada enquanto o leitor está aberto: trocar a url no meio
 * da leitura faria o EpubReader recarregar o livro e perder o lugar. O arquivo
 * inteiro já foi baixado na abertura, então a expiração não atrapalha.
 */
export const useAcessoLivro = (
  origem: 'compra' | 'upload',
  id?: string,
  arquivoUrl?: string | null,
) => {
  return useQuery({
    queryKey: ['acesso-livro', origem, id],
    enabled: !!id && (origem === 'compra' || !!arquivoUrl),
    staleTime: Infinity,
    // Curto de propósito: uma URL guardada por muito tempo chegaria expirada
    // na próxima abertura.
    gcTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 1,
    queryFn: async (): Promise<AcessoLivro> => {
      if (origem === 'compra') {
        const { data, error } = await supabase.functions.invoke('ler-ebook', {
          body: { produto_id: id },
        });
        if (error) throw new Error(data?.error || 'Não foi possível liberar o livro.');
        if (!data?.url) throw new Error(data?.error || 'Livro indisponível.');
        return { url: data.url, leitor: data.leitor ?? null };
      }

      const caminho = caminhoNoBucket(arquivoUrl!);
      if (!caminho) throw new Error('Caminho do arquivo inválido.');
      const { data, error } = await supabase.storage
        .from('ebooks')
        .createSignedUrl(caminho, 60 * 5);
      if (error || !data?.signedUrl) throw new Error('Não foi possível abrir o arquivo.');
      return { url: data.signedUrl, leitor: null };
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
