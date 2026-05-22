import {
  Home,
  FileText,
  Calendar,
  Leaf,
  Settings,
  Shield,
  MessageSquareQuote,
  Image,
  ShoppingBag,
  Library,
  GraduationCap,
  BookOpen,
  Wallet,
  Sparkles,
  Eye,
  LucideIcon,
} from 'lucide-react';
import { ROUTES, AppRoute } from '@/constants/routes';

export interface NavItem {
  icon: LucideIcon;
  label: string;
  path: AppRoute;
  adminOnly?: boolean;
  superAdminOnly?: boolean;
  highlight?: boolean; // Para itens que precisam de destaque visual
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

// ========================================
// GRUPOS DE NAVEGAÇÃO (organizados por contexto)
// ========================================

// 📌 Principal - ações frequentes do usuário
export const essentialNavItems: NavItem[] = [
  { icon: Home, label: 'Início', path: ROUTES.HOME },
  { icon: FileText, label: 'Minha Ficha', path: ROUTES.ANAMNESE },
  { icon: Calendar, label: 'Cerimônias', path: ROUTES.CERIMONIAS },
  { icon: Sparkles, label: 'Insights', path: ROUTES.INSIGHTS },
  { icon: Eye, label: 'Guardião das Visões', path: ROUTES.GUARDIAO_VISOES, highlight: true },
];

// 📚 Aprender - conteúdo educativo
export const contentNavItems: NavItem[] = [
  { icon: Leaf, label: 'Medicinas', path: ROUTES.MEDICINAS },
  { icon: BookOpen, label: 'Estudos', path: ROUTES.ESTUDOS },
  { icon: GraduationCap, label: 'Cursos', path: ROUTES.CURSOS },
  { icon: Library, label: 'Biblioteca', path: ROUTES.BIBLIOTECA },
];

// 👥 Comunidade - conexão e memória do grupo
export const communityNavItems: NavItem[] = [
  { icon: MessageSquareQuote, label: 'Partilhas', path: ROUTES.PARTILHAS },
  { icon: Image, label: 'Galeria', path: ROUTES.GALERIA },
];

// 🛒 Loja
export const lojaNavItems: NavItem[] = [
  { icon: ShoppingBag, label: 'Loja', path: ROUTES.LOJA },
];

// ℹ️ Suporte (sem itens visíveis — Emergência foi movida para o topbar)
export const supportNavItems: NavItem[] = [];

// ⚙️ Sistema
export const settingsNavItem: NavItem = {
  icon: Settings,
  label: 'Configurações',
  path: ROUTES.CONFIGURACOES,
};

export const adminNavItem: NavItem = {
  icon: Shield,
  label: 'Admin',
  path: ROUTES.ADMIN,
  adminOnly: true,
};

export const financeiroNavItem: NavItem = {
  icon: Wallet,
  label: 'Financeiro',
  path: ROUTES.FINANCEIRO,
  superAdminOnly: true,
};

// ========================================
// EXPORTS PARA COMPATIBILIDADE
// ========================================

// Mantém compatibilidade com código existente
export const mainNavItems = essentialNavItems;
export const secondaryNavItems = [
  ...contentNavItems,
  ...communityNavItems,
  ...lojaNavItems,
  ...supportNavItems,
];

// Grupos organizados para sidebar desktop
export const getNavGroups = (isAdmin: boolean, isSuperAdmin = false): NavGroup[] => {
  const sistemaItems = [
    settingsNavItem,
    ...(isAdmin ? [adminNavItem] : []),
    ...(isSuperAdmin ? [financeiroNavItem] : []),
  ];
  return [
    { label: 'Principal', items: essentialNavItems },
    { label: 'Aprender', items: contentNavItems },
    { label: 'Comunidade', items: communityNavItems },
    { label: 'Loja', items: lojaNavItems },
    { label: 'Sistema', items: sistemaItems },
  ];
};

// Lista plana para menu mobile
export const getAllNavItems = (isAdmin: boolean, isSuperAdmin = false): NavItem[] => {
  const items = [
    ...essentialNavItems,
    ...contentNavItems,
    ...communityNavItems,
    ...lojaNavItems,
    ...supportNavItems,
    settingsNavItem,
  ];
  if (isAdmin) items.push(adminNavItem);
  if (isSuperAdmin) items.push(financeiroNavItem);
  return items;
};
