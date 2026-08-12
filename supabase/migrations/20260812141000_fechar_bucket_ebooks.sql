-- O bucket ebooks estava público e sem nenhuma policy: a URL do arquivo era
-- permanente, funcionava deslogado e nunca expirava. Bastava repassar o link
-- para qualquer pessoa baixar um livro pago.
--
-- Fechando o bucket, a leitura passa a exigir URL assinada:
--   - upload pessoal (ebooks/<user_id>/...): o próprio dono assina, pelo app
--   - livro da loja (ebooks/ebooks-loja/...): SÓ a função ler-ebook assina,
--     depois de conferir a compra. Nenhuma policy libera essa pasta para
--     usuário comum, nem para leitura.
UPDATE storage.buckets SET public = FALSE WHERE id = 'ebooks';

-- Cada um enxerga e mexe apenas na própria pasta.
DROP POLICY IF EXISTS "ebooks_select_proprio" ON storage.objects;
CREATE POLICY "ebooks_select_proprio" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'ebooks' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "ebooks_insert_proprio" ON storage.objects;
CREATE POLICY "ebooks_insert_proprio" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'ebooks' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "ebooks_delete_proprio" ON storage.objects;
CREATE POLICY "ebooks_delete_proprio" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'ebooks' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Admin administra o catálogo da loja (subir e trocar o arquivo do livro).
DROP POLICY IF EXISTS "ebooks_loja_admin" ON storage.objects;
CREATE POLICY "ebooks_loja_admin" ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'ebooks' AND (storage.foldername(name))[1] = 'ebooks-loja' AND is_admin())
WITH CHECK (bucket_id = 'ebooks' AND (storage.foldername(name))[1] = 'ebooks-loja' AND is_admin());
