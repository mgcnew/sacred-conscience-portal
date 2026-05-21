/**
 * Tipos centralizados do Portal Consciência Divinal
 * Requirements: 6.1
 */

// ============================================
// Entidades Base do Banco de Dados
// ============================================

export interface Profile {
  id: string;
  full_name: string | null;
  birth_date: string | null;
  referral_source: string | null;
  referral_name: string | null;
  created_at: string;
  email?: string;
  email_notifications: boolean;
  whatsapp_notifications: boolean;
  avatar_url?: string | null;
  // Campos de bloqueio
  bloqueado?: boolean | null;
  bloqueado_em?: string | null;
  bloqueado_por?: string | null;
  motivo_bloqueio?: string | null;
  bloqueado_cerimonias?: boolean | null;
  bloqueado_cursos?: boolean | null;
}

export interface Anamnese {
  id: string;
  user_id: string;
  nome_completo: string;
  data_nascimento?: string | null;
  telefone?: string | null;
  contato_emergencia?: string | null;
  nome_contato_emergencia?: string | null;
  parentesco_contato?: string | null;
  // Condições de saúde
  sem_doencas?: boolean | null;
  pressao_alta: boolean | null;
  problemas_cardiacos: boolean | null;
  historico_convulsivo: boolean | null;
  diabetes?: boolean | null;
  problemas_respiratorios?: boolean | null;
  problemas_renais?: boolean | null;
  problemas_hepaticos?: boolean | null;
  transtorno_psiquiatrico?: boolean | null;
  transtorno_psiquiatrico_qual?: string | null;
  gestante_lactante?: boolean | null;
  uso_antidepressivos: boolean | null;
  tipo_antidepressivo?: string | null;
  uso_medicamentos: string | null;
  alergias: string | null;
  cirurgias_recentes?: string | null;
  // Substâncias
  sem_vicios?: boolean | null;
  tabaco?: boolean | null;
  tabaco_frequencia?: string | null;
  alcool?: boolean | null;
  alcool_frequencia?: string | null;
  cannabis?: boolean | null;
  outras_substancias?: string | null;
  // Experiência
  ja_consagrou: boolean | null;
  quantas_vezes_consagrou?: string | null;
  como_foi_experiencia?: string | null;
  intencao?: string | null;
  restricao_alimentar?: string | null;
  // Como conheceu
  como_conheceu?: string | null;
  indicado_por?: string | null;
  // Consentimentos
  aceite_contraindicacoes?: boolean | null;
  aceite_livre_vontade?: boolean | null;
  aceite_termo_responsabilidade?: boolean | null;
  aceite_uso_imagem?: boolean | null;
  aceite_permanencia?: boolean | null;
  // Liberação (para contraindicações)
  liberado_participar?: boolean | null;
  liberado_por?: string | null;
  liberado_em?: string | null;
  updated_at: string;
}

export interface MedicinaDB {
  id: string;
  nome: string;
  descricao: string | null;
  ativo: boolean;
  created_at: string;
}

export interface TipoConsagracao {
  id: string;
  nome: string;
  descricao: string | null;
  ativo: boolean;
}

export interface Cerimonia {
  id: string;
  nome: string | null;
  tipo_consagracao_id: string | null;
  data: string;
  horario: string;
  local: string;
  descricao: string | null;
  medicina_principal: string | null;
  vagas: number | null;
  valor: number | null;
  observacoes: string | null;
  banner_url: string | null;
  // Relacionamentos opcionais (quando carregados com join)
  tipos_consagracao?: TipoConsagracao | null;
  cerimonias_medicinas?: { medicinas: MedicinaDB }[];
}

export interface Inscricao {
  id: string;
  user_id: string;
  cerimonia_id: string;
  data_inscricao: string;
  forma_pagamento: string | null;
  pago: boolean;
  observacoes_admin: string | null;
  presenca_confirmada?: boolean | null;
  // Campos de cancelamento
  cancelada?: boolean | null;
  cancelada_em?: string | null;
  cancelada_por?: string | null;
  motivo_cancelamento?: string | null;
}


export interface Depoimento {
  id: string;
  user_id: string;
  cerimonia_id: string | null;
  texto: string;
  aprovado: boolean;
  created_at: string;
  approved_at?: string | null;
}

export interface Notificacao {
  id: string;
  tipo: string;
  titulo: string;
  mensagem: string;
  lida: boolean;
  created_at: string;
}

export interface Role {
  id: string;
  role: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role_id: string;
}

export interface MedicinaConteudo {
  id: string;
  nome: string;
  descricao: string;
  icon: string;
  beneficios: string[];
  contraindicacoes: string[];
  preparacao: string;
}

/** @deprecated use MedicinaConteudo para conteúdo estático */
export type Medicina = MedicinaConteudo;

// ============================================
// Tipos com Relacionamentos
// ============================================

export interface InscricaoComCerimonia extends Inscricao {
  cerimonias: Pick<Cerimonia, 'id' | 'nome' | 'data' | 'horario' | 'local' | 'medicina_principal' | 'banner_url' | 'cerimonias_medicinas'>;
}

export interface InscricaoComRelacionamentos extends Inscricao {
  profiles: Profile;
  cerimonias: Cerimonia;
}

export interface DepoimentoComRelacionamentos extends Depoimento {
  profiles: Pick<Profile, 'full_name' | 'avatar_url'>;
  cerimonias: Pick<Cerimonia, 'nome' | 'medicina_principal' | 'data'> | null;
}

// ============================================
// Tipos de Roles
// ============================================

export type UserRoleType = 'admin' | 'guardiao' | 'consagrador';

// ============================================
// Tipos de Filtros
// ============================================

export type AnamneseFilterType = 'todos' | 'com_ficha' | 'sem_ficha';
export type DateFilterType = 'todos' | 'hoje' | 'semana' | 'mes' | 'personalizado';


// ============================================
// Galeria
// ============================================

export type GaleriaTipo = 'foto' | 'video';

export interface GaleriaItem {
  id: string;
  cerimonia_id: string | null;
  titulo: string | null;
  descricao: string | null;
  tipo: GaleriaTipo;
  url: string;
  thumbnail_url: string | null;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface GaleriaItemComCerimonia extends GaleriaItem {
  cerimonias: Pick<Cerimonia, 'id' | 'nome' | 'data' | 'medicina_principal'> | null;
}

// ============================================
// Loja / Produtos
// ============================================

export type TipoProduto = 'produto' | 'livro' | 'ebook';

export interface Produto {
  id: string;
  nome: string;
  descricao: string | null;
  preco: number;
  preco_promocional: number | null;
  categoria: string | null;
  imagem_url: string | null;
  arquivo_url?: string | null;
  paginas?: number | null;
  is_ebook?: boolean;
  tipo_produto?: TipoProduto;
  estoque: number;
  ativo: boolean;
  destaque: boolean;
  created_at: string;
  updated_at: string;
}

export interface CategoriaProduto {
  id: string;
  nome: string;
  icone: string | null;
  ordem: number;
  ativo: boolean;
}


// ============================================
// Biblioteca (Ebooks comprados)
// ============================================

export interface BibliotecaUsuario {
  id: string;
  user_id: string;
  produto_id: string;
  pagamento_id: string | null;
  pagina_atual: number;
  progresso: number;
  ultima_leitura: string | null;
  created_at: string;
  produto?: Produto;
}

// ============================================
// Ebooks Pessoais (uploads do usuário)
// ============================================

export interface EbookPessoal {
  id: string;
  user_id: string;
  titulo: string;
  autor: string | null;
  capa_url: string | null;
  arquivo_url: string;
  tipo_arquivo: 'pdf' | 'docx' | 'doc';
  tamanho_bytes: number | null;
  pagina_atual: number;
  progresso: number;
  ultima_leitura: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// Cursos e Eventos
// ============================================

export interface CursoEvento {
  id: string;
  nome: string;
  descricao: string | null;
  data_inicio: string;
  data_fim: string | null;
  horario_inicio: string;
  horario_fim: string | null;
  responsavel: string;
  valor: number; // em centavos, 0 = gratuito
  gratuito: boolean;
  vagas: number | null;
  local: string | null;
  observacoes: string | null;
  banner_url: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface InscricaoCurso {
  id: string;
  user_id: string;
  curso_id: string;
  data_inscricao: string;
  forma_pagamento: string | null;
  pago: boolean;
  observacoes: string | null;
}

export interface InscricaoCursoComRelacionamentos extends InscricaoCurso {
  profiles: Profile;
  cursos_eventos: CursoEvento;
}

// ============================================
// Fluxo de Caixa
// ============================================

export type TipoTransacao = 'entrada' | 'saida';

export interface CategoriaFinanceira {
  id: string;
  nome: string;
  tipo: TipoTransacao;
  cor: string | null;
  icone: string | null;
  ativo: boolean;
  created_at: string;
}

export interface TransacaoFinanceira {
  id: string;
  tipo: TipoTransacao;
  categoria_id: string | null;
  descricao: string;
  valor: number; // em centavos
  data: string;
  forma_pagamento: string | null;
  referencia_tipo: string | null; // 'inscricao', 'produto', 'curso', 'manual'
  referencia_id: string | null;
  observacoes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Campos de reconciliação
  reconciliada?: boolean;
  reconciliada_em?: string | null;
  reconciliada_por?: string | null;
}

export interface TransacaoComCategoria extends TransacaoFinanceira {
  categoria: CategoriaFinanceira | null;
}


// ============================================
// Materiais / Estudos Pós-Consagração
// ============================================

export interface Material {
  id: string;
  titulo: string;
  resumo: string;
  conteudo: string;
  imagem_url: string | null;
  categoria: string;
  publicado: boolean;
  destaque: boolean;
  autor_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface MaterialComAutor extends Material {
  autor?: Pick<Profile, 'full_name' | 'avatar_url'> | null;
}

// ============================================
// Diário / Insights pessoais
// ============================================

export type HumorType = 'ótimo' | 'bem' | 'neutro' | 'difícil' | 'intenso';

export interface DiarioEntrada {
  id: string;
  user_id: string;
  cerimonia_id: string | null;
  conteudo: string;
  humor: HumorType | null;
  data: string;
  created_at: string;
  updated_at: string;
  // Relacionamento opcional
  cerimonias?: Pick<Cerimonia, 'id' | 'nome' | 'data' | 'medicina_principal'> | null;
}
