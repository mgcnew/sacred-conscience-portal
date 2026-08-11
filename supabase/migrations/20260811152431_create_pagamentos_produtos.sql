-- Pedidos de produto com pagamento manual (Pix / dinheiro).
-- Usado por src/components/loja/CheckoutModal.tsx.
-- Pagamentos online do Mercado Pago continuam em public.pagamentos.
-- valor_total em CENTAVOS, igual a public.pagamentos.valor_centavos.
CREATE TABLE IF NOT EXISTS public.pagamentos_produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  produto_id UUID REFERENCES public.produtos(id) ON DELETE SET NULL,
  quantidade INTEGER NOT NULL DEFAULT 1 CHECK (quantidade > 0),
  valor_total INTEGER NOT NULL CHECK (valor_total >= 0),
  forma_pagamento TEXT NOT NULL CHECK (forma_pagamento IN ('pix', 'dinheiro')),
  status TEXT NOT NULL DEFAULT 'pendente'
    CHECK (status IN ('pendente', 'confirmado', 'cancelado')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ
);

COMMENT ON TABLE public.pagamentos_produtos IS
  'Pedidos de produto pagos manualmente (Pix/dinheiro). valor_total em centavos.';

ALTER TABLE public.pagamentos_produtos ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_pagamentos_produtos_user    ON public.pagamentos_produtos(user_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_produtos_produto ON public.pagamentos_produtos(produto_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_produtos_status  ON public.pagamentos_produtos(status);

-- Usuário cria e vê os próprios pedidos
DROP POLICY IF EXISTS "Usuario cria proprio pedido de produto" ON public.pagamentos_produtos;
CREATE POLICY "Usuario cria proprio pedido de produto"
  ON public.pagamentos_produtos FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Usuario ve proprios pedidos de produto" ON public.pagamentos_produtos;
CREATE POLICY "Usuario ve proprios pedidos de produto"
  ON public.pagamentos_produtos FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admin / financeiro vê e gerencia todos
DROP POLICY IF EXISTS "Admin ve todos os pedidos de produto" ON public.pagamentos_produtos;
CREATE POLICY "Admin ve todos os pedidos de produto"
  ON public.pagamentos_produtos FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_permissoes up
      JOIN public.permissoes p ON up.permissao_id = p.id
      WHERE up.user_id = auth.uid()
        AND p.nome IN ('super_admin', 'ver_financeiro')
    )
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
        AND r.role IN ('admin', 'super_admin')
    )
  );

DROP POLICY IF EXISTS "Admin atualiza pedidos de produto" ON public.pagamentos_produtos;
CREATE POLICY "Admin atualiza pedidos de produto"
  ON public.pagamentos_produtos FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_permissoes up
      JOIN public.permissoes p ON up.permissao_id = p.id
      WHERE up.user_id = auth.uid()
        AND p.nome IN ('super_admin', 'ver_financeiro')
    )
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
        AND r.role IN ('admin', 'super_admin')
    )
  );
