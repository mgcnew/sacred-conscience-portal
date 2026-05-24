-- =====================================================
-- Sistema de Notificações Automáticas
-- =====================================================

-- Primeiro, verificar/atualizar estrutura da tabela notificacoes
ALTER TABLE notificacoes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE notificacoes ADD COLUMN IF NOT EXISTS url TEXT;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_notificacoes_user_id ON notificacoes(user_id);

-- =====================================================
-- Função auxiliar para buscar admins
-- =====================================================
CREATE OR REPLACE FUNCTION get_admin_user_ids()
RETURNS TABLE(user_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT up.user_id
  FROM user_permissoes up
  JOIN permissoes p ON up.permissao_id = p.id
  WHERE p.nome = 'super_admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 1. NOTIFICAÇÃO: Nova Anamnese (para admins)
-- =====================================================
CREATE OR REPLACE FUNCTION notify_new_anamnese()
RETURNS TRIGGER AS $$
DECLARE
  admin_id UUID;
  user_name TEXT;
BEGIN
  -- Buscar nome do usuário
  user_name := NEW.nome_completo;
  
  -- Notificar cada admin
  FOR admin_id IN SELECT * FROM get_admin_user_ids()
  LOOP
    INSERT INTO notificacoes (user_id, tipo, titulo, mensagem, url)
    VALUES (
      admin_id,
      'anamnese',
      'Nova Ficha de Anamnese',
      user_name || ' preencheu a ficha de anamnese.',
      '/admin'
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_new_anamnese ON anamneses;
CREATE TRIGGER trigger_notify_new_anamnese
  AFTER INSERT ON anamneses
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_anamnese();

-- =====================================================
-- 2. NOTIFICAÇÃO: Nova Inscrição (para admins + usuário)
-- =====================================================
CREATE OR REPLACE FUNCTION notify_new_inscricao()
RETURNS TRIGGER AS $$
DECLARE
  admin_id UUID;
  cerimonia_nome TEXT;
  user_name TEXT;
BEGIN
  -- Buscar nome da cerimônia
  SELECT COALESCE(nome, medicina_principal, 'Cerimônia') INTO cerimonia_nome
  FROM cerimonias WHERE id = NEW.cerimonia_id;
  
  -- Buscar nome do usuário
  SELECT COALESCE(full_name, 'Usuário') INTO user_name
  FROM profiles WHERE id = NEW.user_id;
  
  -- Notificar o próprio usuário
  INSERT INTO notificacoes (user_id, tipo, titulo, mensagem, url)
  VALUES (
    NEW.user_id,
    'inscricao',
    'Inscrição Confirmada!',
    'Sua inscrição na cerimônia "' || cerimonia_nome || '" foi registrada.',
    '/cerimonias'
  );
  
  -- Notificar cada admin
  FOR admin_id IN SELECT * FROM get_admin_user_ids()
  LOOP
    IF admin_id != NEW.user_id THEN
      INSERT INTO notificacoes (user_id, tipo, titulo, mensagem, url)
      VALUES (
        admin_id,
        'inscricao',
        'Nova Inscrição',
        user_name || ' se inscreveu em "' || cerimonia_nome || '".',
        '/admin'
      );
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_new_inscricao ON inscricoes;
CREATE TRIGGER trigger_notify_new_inscricao
  AFTER INSERT ON inscricoes
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_inscricao();

-- =====================================================
-- 3. NOTIFICAÇÃO: Cancelamento de Inscrição (para admins)
-- =====================================================
CREATE OR REPLACE FUNCTION notify_cancel_inscricao()
RETURNS TRIGGER AS $$
DECLARE
  admin_id UUID;
  cerimonia_nome TEXT;
  user_name TEXT;
BEGIN
  -- Buscar nome da cerimônia
  SELECT COALESCE(nome, medicina_principal, 'Cerimônia') INTO cerimonia_nome
  FROM cerimonias WHERE id = OLD.cerimonia_id;
  
  -- Buscar nome do usuário
  SELECT COALESCE(full_name, 'Usuário') INTO user_name
  FROM profiles WHERE id = OLD.user_id;
  
  -- Notificar cada admin
  FOR admin_id IN SELECT * FROM get_admin_user_ids()
  LOOP
    INSERT INTO notificacoes (user_id, tipo, titulo, mensagem, url)
    VALUES (
      admin_id,
      'cancelamento',
      'Inscrição Cancelada',
      user_name || ' cancelou inscrição em "' || cerimonia_nome || '".',
      '/admin'
    );
  END LOOP;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_cancel_inscricao ON inscricoes;
CREATE TRIGGER trigger_notify_cancel_inscricao
  AFTER DELETE ON inscricoes
  FOR EACH ROW
  EXECUTE FUNCTION notify_cancel_inscricao();

-- =====================================================
-- 4. NOTIFICAÇÃO: Novo Depoimento (para admins)
-- =====================================================
CREATE OR REPLACE FUNCTION notify_new_depoimento()
RETURNS TRIGGER AS $$
DECLARE
  admin_id UUID;
  user_name TEXT;
BEGIN
  -- Buscar nome do usuário
  SELECT COALESCE(full_name, 'Usuário') INTO user_name
  FROM profiles WHERE id = NEW.user_id;
  
  -- Notificar cada admin
  FOR admin_id IN SELECT * FROM get_admin_user_ids()
  LOOP
    INSERT INTO notificacoes (user_id, tipo, titulo, mensagem, url)
    VALUES (
      admin_id,
      'depoimento',
      'Nova Partilha para Aprovar',
      user_name || ' enviou uma partilha aguardando aprovação.',
      '/partilhas?moderar=1'
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_new_depoimento ON depoimentos;
CREATE TRIGGER trigger_notify_new_depoimento
  AFTER INSERT ON depoimentos
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_depoimento();

-- =====================================================
-- 5. NOTIFICAÇÃO: Depoimento Aprovado (para usuário)
-- =====================================================
CREATE OR REPLACE FUNCTION notify_depoimento_aprovado()
RETURNS TRIGGER AS $$
BEGIN
  -- Só notificar se mudou de não aprovado para aprovado
  IF OLD.aprovado = false AND NEW.aprovado = true THEN
    INSERT INTO notificacoes (user_id, tipo, titulo, mensagem, url)
    VALUES (
      NEW.user_id,
      'aprovacao',
      'Partilha Aprovada!',
      'Sua partilha foi aprovada e já está visível para todos.',
      '/partilhas'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_depoimento_aprovado ON depoimentos;
CREATE TRIGGER trigger_notify_depoimento_aprovado
  AFTER UPDATE ON depoimentos
  FOR EACH ROW
  EXECUTE FUNCTION notify_depoimento_aprovado();

-- =====================================================
-- 6. NOTIFICAÇÃO: Pagamento Confirmado (para admins + usuário)
-- =====================================================
CREATE OR REPLACE FUNCTION notify_pagamento_confirmado()
RETURNS TRIGGER AS $$
DECLARE
  admin_id UUID;
  user_name TEXT;
BEGIN
  -- Só notificar se mudou para aprovado
  IF (OLD.mp_status IS DISTINCT FROM 'approved') AND NEW.mp_status = 'approved' THEN
    -- Buscar nome do usuário
    SELECT COALESCE(full_name, 'Usuário') INTO user_name
    FROM profiles WHERE id = NEW.user_id;
    
    -- Notificar o usuário
    INSERT INTO notificacoes (user_id, tipo, titulo, mensagem, url)
    VALUES (
      NEW.user_id,
      'pagamento',
      'Pagamento Confirmado!',
      'Seu pagamento de ' || NEW.descricao || ' foi aprovado.',
      CASE WHEN NEW.tipo = 'produto' THEN '/loja' ELSE '/cerimonias' END
    );
    
    -- Notificar admins
    FOR admin_id IN SELECT * FROM get_admin_user_ids()
    LOOP
      IF admin_id != NEW.user_id THEN
        INSERT INTO notificacoes (user_id, tipo, titulo, mensagem, url)
        VALUES (
          admin_id,
          'pagamento',
          'Pagamento Recebido',
          user_name || ' - ' || NEW.descricao,
          '/admin'
        );
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_pagamento ON pagamentos;
CREATE TRIGGER trigger_notify_pagamento
  AFTER UPDATE ON pagamentos
  FOR EACH ROW
  EXECUTE FUNCTION notify_pagamento_confirmado();

-- =====================================================
-- RLS para notificacoes (usuário vê apenas suas)
-- =====================================================
ALTER TABLE notificacoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own notifications" ON notificacoes;
CREATE POLICY "Users can read own notifications" ON notificacoes
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own notifications" ON notificacoes;
CREATE POLICY "Users can update own notifications" ON notificacoes
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- Permitir inserção via triggers (SECURITY DEFINER)
DROP POLICY IF EXISTS "System can insert notifications" ON notificacoes;
CREATE POLICY "System can insert notifications" ON notificacoes
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- =====================================================
-- Grants
-- =====================================================
GRANT SELECT, UPDATE ON notificacoes TO authenticated;
