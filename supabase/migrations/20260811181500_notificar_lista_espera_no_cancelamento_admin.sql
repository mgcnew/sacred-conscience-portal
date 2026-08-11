-- A fila de espera só era avisada quando a inscrição era APAGADA, que é o
-- caminho de quando o próprio usuário desiste (Cerimonias.tsx faz .delete()).
-- O cancelamento feito pelo admin marca cancelada = true (UPDATE) e nunca
-- disparava o aviso: a vaga abria e ninguém da fila ficava sabendo.
CREATE OR REPLACE FUNCTION public.notificar_proximo_lista_espera()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cerimonia_alvo UUID;
  proximo_id UUID;
  cerimonia_nome TEXT;
  vaga_abriu BOOLEAN := FALSE;
BEGIN
  IF TG_OP = 'DELETE' THEN
    cerimonia_alvo := OLD.cerimonia_id;
    vaga_abriu := TRUE;
  ELSIF TG_OP = 'UPDATE' THEN
    -- só quando a inscrição passa a cancelada agora
    IF COALESCE(OLD.cancelada, FALSE) = FALSE AND COALESCE(NEW.cancelada, FALSE) = TRUE THEN
      cerimonia_alvo := NEW.cerimonia_id;
      vaga_abriu := TRUE;
    END IF;
  END IF;

  IF NOT vaga_abriu THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  SELECT le.user_id INTO proximo_id
  FROM lista_espera_cerimonias le
  WHERE le.cerimonia_id = cerimonia_alvo
    AND COALESCE(le.notificado, FALSE) = FALSE
  ORDER BY le.posicao ASC
  LIMIT 1;

  IF proximo_id IS NOT NULL THEN
    SELECT COALESCE(nome, medicina_principal, 'Cerimônia') INTO cerimonia_nome
    FROM cerimonias WHERE id = cerimonia_alvo;

    INSERT INTO notificacoes (user_id, tipo, titulo, mensagem)
    VALUES (
      proximo_id,
      'lista_espera',
      'Vaga disponível! 🎉',
      'Uma vaga abriu na cerimônia "' || cerimonia_nome || '". Corra para garantir seu lugar!'
    );

    UPDATE lista_espera_cerimonias
    SET notificado = TRUE, notificado_em = NOW()
    WHERE user_id = proximo_id AND cerimonia_id = cerimonia_alvo;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- O trigger de DELETE já existe (trigger_notificar_lista_espera).
-- Este cobre o cancelamento por update.
DROP TRIGGER IF EXISTS trigger_notificar_lista_espera_cancelada ON public.inscricoes;
CREATE TRIGGER trigger_notificar_lista_espera_cancelada
  AFTER UPDATE OF cancelada ON public.inscricoes
  FOR EACH ROW
  EXECUTE FUNCTION public.notificar_proximo_lista_espera();
