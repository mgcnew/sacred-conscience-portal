/**
 * Constantes de rotas do portal
 * Centraliza todas as rotas para facilitar manutenção e evitar strings hardcoded
 */

export const ROUTES = {
  // Autenticação
  AUTH: '/auth',
  
  // Páginas principais (protegidas)
  HOME: '/',
  ANAMNESE: '/anamnese',
  CERIMONIAS: '/cerimonias',
  MEDICINAS: '/medicinas',
  PARTILHAS: '/partilhas',
  GALERIA: '/galeria',
  LOJA: '/loja',
  SOBRE_NOS: '/sobre-nos',
  HISTORICO: '/historico',
  FAQ: '/faq',
  EMERGENCIA: '/emergencia',
  CONFIGURACOES: '/configuracoes',
  
  // Biblioteca
  BIBLIOTECA: '/biblioteca',
  LEITURA: '/biblioteca/ler',
  
  // Estudos/Materiais pós-consagração
  ESTUDOS: '/estudos',
  
  // Admin (requer permissão)
  ADMIN: '/admin',
  
  // Cursos e Eventos
  CURSOS: '/cursos',
  
} as const;

/**
 * Tipo para as rotas disponíveis
 */
export type AppRoute = typeof ROUTES[keyof typeof ROUTES];

/**
 * Rotas que não requerem autenticação
 */
export const PUBLIC_ROUTES: AppRoute[] = [
  ROUTES.AUTH,
];

/**
 * Rotas que requerem permissão de admin
 */
export const ADMIN_ROUTES: AppRoute[] = [
  ROUTES.ADMIN,
];
