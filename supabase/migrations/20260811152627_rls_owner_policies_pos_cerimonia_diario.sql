-- pos_cerimonia e diario tinham RLS habilitado e NENHUMA policy, o que as
-- tornava totalmente inacessíveis (advisor: rls_enabled_no_policy).
-- Ambas têm user_id: acesso restrito ao próprio dono.
--
-- Nota: public.diario é legado — o app usa public.diario_entradas.
-- Candidata a remoção (estava com 0 linhas quando esta migration foi criada).

CREATE POLICY "Usuario gerencia proprio pos_cerimonia"
  ON public.pos_cerimonia FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Usuario gerencia proprio diario"
  ON public.diario FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
