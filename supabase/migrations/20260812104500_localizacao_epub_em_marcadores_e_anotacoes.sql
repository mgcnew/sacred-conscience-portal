-- Marcador e anotação guardam só o número da página, que num EPUB não é um
-- ponto fixo do texto. Sem o CFI, voltar a um marcador cairia em outro trecho
-- assim que o leitor mudasse o corpo da fonte.
ALTER TABLE public.ebook_marcadores ADD COLUMN IF NOT EXISTS localizacao TEXT;
ALTER TABLE public.ebook_anotacoes  ADD COLUMN IF NOT EXISTS localizacao TEXT;

COMMENT ON COLUMN public.ebook_marcadores.localizacao IS 'EPUB CFI do ponto marcado';
COMMENT ON COLUMN public.ebook_anotacoes.localizacao  IS 'EPUB CFI do ponto anotado';
