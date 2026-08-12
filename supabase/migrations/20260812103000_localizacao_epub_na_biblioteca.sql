-- Um EPUB não tem página fixa: o texto reflui conforme o tamanho da fonte e da
-- tela, então "página 42" não aponta para o mesmo trecho em dois aparelhos.
-- O EPUB CFI é o endereço estável de um ponto dentro do livro. pagina_atual e
-- progresso continuam sendo gravados para as barras de progresso da estante.
ALTER TABLE public.biblioteca_usuario ADD COLUMN IF NOT EXISTS localizacao TEXT;
ALTER TABLE public.ebooks_pessoais   ADD COLUMN IF NOT EXISTS localizacao TEXT;

COMMENT ON COLUMN public.biblioteca_usuario.localizacao IS 'EPUB CFI do ponto onde a leitura parou';
COMMENT ON COLUMN public.ebooks_pessoais.localizacao   IS 'EPUB CFI do ponto onde a leitura parou';
