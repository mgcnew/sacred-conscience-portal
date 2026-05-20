import {
  Home,
  FileText,
  Calendar,
  Leaf,
  HelpCircle,
  Settings,
  Heart,
  Shield,
  MessageSquareQuote,
  Image,
  Info,
  ShoppingBag,
  Library,
  GraduationCap,
  BookOpen,
  LucideIcon,
} from 'lucide-react';
import { ROUTES, AppRoute } from '@/constants/routes';

export interface NavItem {
  icon: LucideIcon;
  label: string;
  path: AppRoute;
  adminOnly?: boolean;
  highlight?: boolean; // Para itens que precisam de destaque visual
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

// ========================================
// GRUPOS DE NAVEGAÇÃO (organizados por contexto)
// ========================================

// 📌 Essencial - ações frequentes do usuário
export const essentialNavItems: NavItem[] = [
  { icon: Home, label: 'Início', path: ROUTES.HOME },
  { icon: FileText, label: 'Minha Ficha', path: ROUTES.ANAMNESE },
  { icon: Calendar, label: 'Cerimônias', path: ROUTES.CERIMONIAS },
  { icon: GraduationCap, label: 'Cursos', path: ROUTES.CURSOS },
];

// 📚 Conteúdo - exploração e aprendizado
export const contentNavItems: NavItem[] = [
  { icon: Leaf, label: 'Medicinas', path: ROUTES.MEDICINAS },
  { icon: BookOpen, label: 'Estudos', path: ROUTES.ESTUDOS },
  { icon: Library, label: 'Biblioteca', path: ROUTES.BIBLIOTECA },
  { icon: Image, label: 'Galeria', path: ROUTES.GALERIA },
];

// 🛒 Comunidade & Loja
export const communityNavItems: NavItem[] = [
  { icon: MessageSquareQuote, label: 'Partilhas', path: ROUTES.PARTILHAS },
  { icon: ShoppingBag, label: 'Loja', path: ROUTES.LOJA },
];

// ℹ️ Informações & Suporte
export const supportNavItems: NavItem[] = [
  { icon: Info, label: 'Sobre Nós', path: ROUTES.SOBRE_NOS },
  { icon: HelpCircle, label: 'FAQ', path: ROUTES.FAQ },
  { icon: Heart, label: 'Emergência', path: ROUTES.EMERGENCIA, highlight: true },
];

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

// ========================================
// EXPORTS PARA COMPATIBILIDADE
// ========================================

// Mantém compatibilidade com código existente
export const mainNavItems = essentialNavItems;
export const secondaryNavItems = [
  ...contentNavItems,
  ...communityNavItems,
  ...supportNavItems,
];

// Grupos organizados para sidebar desktop
export const getNavGroups = (isAdmin: boolean): NavGroup[] => {
  const groups: NavGroup[] = [
    { label: 'Principal', items: essentialNavItems },
    { label: 'Conteúdo', items: contentNavItems },
    { label: 'Comunidade', items: communityNavItems },
    { label: 'Suporte', items: supportNavItems },
    { label: 'Sistema', items: [settingsNavItem, ...(isAdmin ? [adminNavItem] : [])] },
  ];
  return groups;
};

// Lista plana para menu mobile
export const getAllNavItems = (isAdmin: boolean): NavItem[] => {
  const items = [
    ...essentialNavItems,
    ...contentNavItems,
    ...communityNavItems,
    ...supportNavItems,
    settingsNavItem,
  ];
  if (isAdmin) {
    items.push(adminNavItem);
  }
  return items;
};
