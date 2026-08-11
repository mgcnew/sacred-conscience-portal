-- Anexos de Transações Financeiras (comprovantes, notas fiscais, recibos)
-- Usado por src/hooks/queries/useFluxoCaixa.ts
CREATE TABLE IF NOT EXISTS public.anexos_transacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transacao_id UUID NOT NULL REFERENCES public.transacoes_financeiras(id) ON DELETE CASCADE,
  nome_arquivo TEXT NOT NULL,
  url TEXT NOT NULL,
  tipo_arquivo TEXT,
  tamanho INTEGER,
  descricao TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.anexos_transacoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admin gerencia anexos transacoes" ON public.anexos_transacoes;
CREATE POLICY "Super admin gerencia anexos transacoes"
  ON public.anexos_transacoes FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_permissoes up
      JOIN public.permissoes p ON up.permissao_id = p.id
      WHERE up.user_id = auth.uid()
        AND p.nome IN ('super_admin', 'ver_financeiro')
    )
  );

CREATE INDEX IF NOT EXISTS idx_anexos_transacoes_transacao
  ON public.anexos_transacoes(transacao_id);

-- Bucket de comprovantes financeiros
INSERT INTO storage.buckets (id, name, public)
VALUES ('comprovantes', 'comprovantes', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Comprovantes leitura autenticada" ON storage.objects;
CREATE POLICY "Comprovantes leitura autenticada"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'comprovantes');

DROP POLICY IF EXISTS "Comprovantes upload financeiro" ON storage.objects;
CREATE POLICY "Comprovantes upload financeiro"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'comprovantes' AND
    EXISTS (
      SELECT 1 FROM public.user_permissoes up
      JOIN public.permissoes p ON up.permissao_id = p.id
      WHERE up.user_id = auth.uid()
        AND p.nome IN ('super_admin', 'ver_financeiro')
    )
  );

DROP POLICY IF EXISTS "Comprovantes delete financeiro" ON storage.objects;
CREATE POLICY "Comprovantes delete financeiro"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'comprovantes' AND
    EXISTS (
      SELECT 1 FROM public.user_permissoes up
      JOIN public.permissoes p ON up.permissao_id = p.id
      WHERE up.user_id = auth.uid()
        AND p.nome IN ('super_admin', 'ver_financeiro')
    )
  );
