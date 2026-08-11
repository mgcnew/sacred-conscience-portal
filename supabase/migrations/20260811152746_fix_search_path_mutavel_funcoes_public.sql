-- Fixa o search_path das funções do schema public.
-- Sem isso, funções SECURITY DEFINER podem ser induzidas a resolver nomes
-- em um schema controlado pelo chamador (search_path hijacking).
-- Omitir pg_temp da lista impede o sequestro via tabela temporária.
--
-- Apenas adiciona configuração: nenhum corpo de função é alterado.
-- Aplicado sobre 62 funções (53 SECURITY DEFINER, 44 usadas em triggers).
-- Idempotente: só altera funções que ainda não têm search_path definido.
DO $$
DECLARE
  r record;
  n int := 0;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace ns ON ns.oid = p.pronamespace
    WHERE ns.nspname = 'public'
      AND p.prokind = 'f'
      AND NOT EXISTS (
        SELECT 1 FROM unnest(coalesce(p.proconfig, '{}')) c
        WHERE c LIKE 'search_path=%'
      )
  LOOP
    EXECUTE format('ALTER FUNCTION %s SET search_path = public', r.sig);
    n := n + 1;
  END LOOP;
  RAISE NOTICE 'search_path fixado em % funcoes', n;
END $$;
