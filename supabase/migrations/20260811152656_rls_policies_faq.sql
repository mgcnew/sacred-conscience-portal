-- faq tinha RLS habilitado e NENHUMA policy, ficando inacessível
-- (advisor: rls_enabled_no_policy).
-- Conteúdo institucional público: leitura liberada, escrita só para admin.

CREATE POLICY "FAQ leitura publica"
  ON public.faq FOR SELECT
  USING (true);

CREATE POLICY "FAQ escrita admin"
  ON public.faq FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.role IN ('admin', 'super_admin')
    )
  );
