-- Marcadores, anotações e configuração de leitura da Biblioteca de ebooks.
-- Usado por src/hooks/queries/useBiblioteca.ts

CREATE TABLE IF NOT EXISTS public.ebook_marcadores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ebook_pessoal_id UUID REFERENCES public.ebooks_pessoais(id) ON DELETE CASCADE,
  biblioteca_id UUID REFERENCES public.biblioteca_usuario(id) ON DELETE CASCADE,
  pagina INTEGER NOT NULL,
  titulo TEXT,
  cor TEXT DEFAULT '#fbbf24',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT ebook_marcador_check CHECK (
    (ebook_pessoal_id IS NOT NULL AND biblioteca_id IS NULL) OR
    (ebook_pessoal_id IS NULL AND biblioteca_id IS NOT NULL)
  )
);

CREATE TABLE IF NOT EXISTS public.ebook_anotacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ebook_pessoal_id UUID REFERENCES public.ebooks_pessoais(id) ON DELETE CASCADE,
  biblioteca_id UUID REFERENCES public.biblioteca_usuario(id) ON DELETE CASCADE,
  pagina INTEGER,
  texto TEXT NOT NULL,
  trecho_selecionado TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT ebook_anotacao_check CHECK (
    (ebook_pessoal_id IS NOT NULL AND biblioteca_id IS NULL) OR
    (ebook_pessoal_id IS NULL AND biblioteca_id IS NOT NULL)
  )
);

CREATE TABLE IF NOT EXISTS public.ebook_config_leitura (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  tema TEXT DEFAULT 'sepia' CHECK (tema IN ('light', 'sepia', 'dark')),
  tamanho_fonte INTEGER DEFAULT 18 CHECK (tamanho_fonte >= 12 AND tamanho_fonte <= 32),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ebook_marcadores     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ebook_anotacoes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ebook_config_leitura ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuario gerencia proprios marcadores" ON public.ebook_marcadores;
CREATE POLICY "Usuario gerencia proprios marcadores"
  ON public.ebook_marcadores FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Usuario gerencia proprias anotacoes" ON public.ebook_anotacoes;
CREATE POLICY "Usuario gerencia proprias anotacoes"
  ON public.ebook_anotacoes FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Usuario gerencia propria config de leitura" ON public.ebook_config_leitura;
CREATE POLICY "Usuario gerencia propria config de leitura"
  ON public.ebook_config_leitura FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_ebook_marcadores_user       ON public.ebook_marcadores(user_id);
CREATE INDEX IF NOT EXISTS idx_ebook_marcadores_pessoal    ON public.ebook_marcadores(ebook_pessoal_id);
CREATE INDEX IF NOT EXISTS idx_ebook_marcadores_biblioteca ON public.ebook_marcadores(biblioteca_id);
CREATE INDEX IF NOT EXISTS idx_ebook_anotacoes_user        ON public.ebook_anotacoes(user_id);
CREATE INDEX IF NOT EXISTS idx_ebook_anotacoes_pessoal     ON public.ebook_anotacoes(ebook_pessoal_id);
CREATE INDEX IF NOT EXISTS idx_ebook_anotacoes_biblioteca  ON public.ebook_anotacoes(biblioteca_id);

-- Bucket de capas de ebook
INSERT INTO storage.buckets (id, name, public)
VALUES ('ebook-capas', 'ebook-capas', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Capas de ebooks leitura publica" ON storage.objects;
CREATE POLICY "Capas de ebooks leitura publica"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'ebook-capas');

DROP POLICY IF EXISTS "Capas de ebooks upload autenticado" ON storage.objects;
CREATE POLICY "Capas de ebooks upload autenticado"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'ebook-capas' AND owner_id = auth.uid()::text);

DROP POLICY IF EXISTS "Capas de ebooks delete proprio" ON storage.objects;
CREATE POLICY "Capas de ebooks delete proprio"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'ebook-capas' AND owner_id = auth.uid()::text);
