import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getNavGroups, NavItem } from '@/constants/navigation';
import { useCheckPermissao } from '@/components/auth/PermissionGate';
import { ROUTES } from '@/constants';

// Mapa de cores por rota — espelhado do BottomNav
const NAV_COLORS: Record<string, { icon: string; bg: string; hover: string; text: string }> = {
  [ROUTES.HOME]:          { icon: 'text-primary',     bg: 'bg-primary/10',     hover: 'hover:bg-primary/15',     text: 'text-primary' },
  [ROUTES.CERIMONIAS]:    { icon: 'text-emerald-500', bg: 'bg-emerald-500/10', hover: 'hover:bg-emerald-500/15', text: 'text-emerald-600 dark:text-emerald-400' },
  [ROUTES.GALERIA]:       { icon: 'text-blue-500',    bg: 'bg-blue-500/10',    hover: 'hover:bg-blue-500/15',    text: 'text-blue-600 dark:text-blue-400' },
  [ROUTES.ANAMNESE]:      { icon: 'text-rose-500',    bg: 'bg-rose-500/10',    hover: 'hover:bg-rose-500/15',    text: 'text-rose-600 dark:text-rose-400' },
  [ROUTES.INSIGHTS]:      { icon: 'text-violet-500',  bg: 'bg-violet-500/10',  hover: 'hover:bg-violet-500/15',  text: 'text-violet-600 dark:text-violet-400' },
  [ROUTES.MEDICINAS]:     { icon: 'text-green-600',   bg: 'bg-green-600/10',   hover: 'hover:bg-green-600/15',   text: 'text-green-700 dark:text-green-400' },
  [ROUTES.ESTUDOS]:       { icon: 'text-sky-500',     bg: 'bg-sky-500/10',     hover: 'hover:bg-sky-500/15',     text: 'text-sky-600 dark:text-sky-400' },
  [ROUTES.CURSOS]:        { icon: 'text-indigo-500',  bg: 'bg-indigo-500/10',  hover: 'hover:bg-indigo-500/15',  text: 'text-indigo-600 dark:text-indigo-400' },
  [ROUTES.BIBLIOTECA]:    { icon: 'text-purple-500',  bg: 'bg-purple-500/10',  hover: 'hover:bg-purple-500/15',  text: 'text-purple-600 dark:text-purple-400' },
  [ROUTES.PARTILHAS]:     { icon: 'text-pink-500',    bg: 'bg-pink-500/10',    hover: 'hover:bg-pink-500/15',    text: 'text-pink-600 dark:text-pink-400' },
  [ROUTES.LOJA]:          { icon: 'text-amber-600',   bg: 'bg-amber-500/10',   hover: 'hover:bg-amber-500/15',   text: 'text-amber-700 dark:text-amber-400' },
  [ROUTES.CONFIGURACOES]: { icon: 'text-slate-500',   bg: 'bg-slate-500/10',   hover: 'hover:bg-slate-500/15',   text: 'text-slate-600 dark:text-slate-400' },
  [ROUTES.ADMIN]:         { icon: 'text-red-500',     bg: 'bg-red-500/10',     hover: 'hover:bg-red-500/15',     text: 'text-red-600 dark:text-red-400' },
  [ROUTES.FINANCEIRO]:    { icon: 'text-teal-500',    bg: 'bg-teal-500/10',    hover: 'hover:bg-teal-500/15',    text: 'text-teal-600 dark:text-teal-400' },
};

const DEFAULT_COLOR = { icon: 'text-primary', bg: 'bg-primary/10', hover: 'hover:bg-primary/15', text: 'text-primary' };
const getNavColor = (path: string) => NAV_COLORS[path] ?? DEFAULT_COLOR;

interface SidebarProps {
  isAdmin: boolean;
  collapsed: boolean;
  onToggle: () => void;
  onSignOut: () => void;
}

const NavButton: React.FC<{
  item: NavItem;
  isActive: boolean;
  collapsed: boolean;
  onClick: () => void;
}> = ({ item, isActive, collapsed, onClick }) => {
  const isHighlight = item.highlight;
  const c = getNavColor(item.path);

  const button = (
    <Button
      variant="ghost"
      className={cn(
        'w-full justify-start gap-3 h-10 transition-all',
        collapsed ? 'px-2 justify-center' : 'px-3',
        isActive
          ? cn(c.bg, c.text, 'font-medium', c.hover)
          : isHighlight
            ? 'text-red-600 hover:text-red-700 hover:bg-red-50 dark:bg-red-500/10 dark:hover:bg-red-950/30'
            : 'text-muted-foreground hover:text-foreground hover:bg-accent'
      )}
      onClick={onClick}
    >
      <item.icon
        className={cn(
          'w-5 h-5 shrink-0 transition-colors',
          isActive ? c.icon : isHighlight ? 'text-red-500' : 'text-muted-foreground'
        )}
      />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Button>
  );

  if (collapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={10}>
          {item.label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return button;
};

export const Sidebar: React.FC<SidebarProps> = ({
  isAdmin,
  collapsed,
  onToggle,
  onSignOut,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSuperAdmin } = useCheckPermissao();
  const navGroups = getNavGroups(isAdmin, isSuperAdmin());

  return (
    <TooltipProvider>
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen border-r border-border bg-background transition-all duration-300',
          collapsed ? 'w-16' : 'w-56'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header - h-14 para alinhar com topbar */}
          <div
            className={cn(
              'flex h-14 items-center border-b border-border',
              collapsed ? 'justify-center px-2' : 'justify-start px-4'
            )}
          >
            {!collapsed ? (
              <div className="flex flex-col leading-tight">
                <span className="font-display text-base font-semibold tracking-wide text-primary">
                  Consciência
                </span>
                <span className="font-display text-[11px] font-medium tracking-widest text-muted-foreground">
                  DIVINAL
                </span>
              </div>
            ) : (
              <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center shrink-0">
                <span className="font-display text-sm font-bold text-primary tracking-tight">CD</span>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto px-2 py-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <nav className="flex flex-col gap-1">
              {navGroups.map((group, groupIndex) => (
                <React.Fragment key={group.label}>
                  {/* Separator between groups (except first) */}
                  {groupIndex > 0 && <div className="my-3 h-px bg-border" />}

                  {/* Group label (only when expanded) */}
                  {!collapsed && (
                    <span className="px-3 mb-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {group.label}
                    </span>
                  )}

                  {/* Group items */}
                  {group.items.map((item) => (
                    <NavButton
                      key={item.path}
                      item={item}
                      isActive={location.pathname === item.path}
                      collapsed={collapsed}
                      onClick={() => navigate(item.path)}
                    />
                  ))}
                </React.Fragment>
              ))}
            </nav>
          </div>

          {/* Footer */}
          <div className="border-t border-border p-2">
            {/* Toggle Button */}
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'w-full justify-center h-9 text-muted-foreground hover:text-foreground',
                !collapsed && 'justify-start px-3 gap-3'
              )}
              onClick={onToggle}
            >
              {collapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <>
                  <ChevronLeft className="w-4 h-4" />
                  <span>Recolher</span>
                </>
              )}
            </Button>

            {/* Sign Out */}
            {collapsed ? (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-center h-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={onSignOut}
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={10}>
                  Sair
                </TooltipContent>
              </Tooltip>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start px-3 gap-3 h-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={onSignOut}
              >
                <LogOut className="w-4 h-4" />
                <span>Sair</span>
              </Button>
            )}
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
};

export default Sidebar;
