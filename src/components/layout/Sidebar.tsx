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
  [ROUTES.HOME]:           { icon: 'text-primary', bg: 'bg-primary/10', hover: 'hover:bg-primary/15', text: 'text-primary' },
  [ROUTES.CERIMONIAS]:     { icon: 'text-sacred-gold-ink', bg: 'bg-sacred-gold/10', hover: 'hover:bg-sacred-gold/15', text: 'text-sacred-gold-ink' },
  [ROUTES.GALERIA]:        { icon: 'text-sacred-gold-ink', bg: 'bg-sacred-gold/10', hover: 'hover:bg-sacred-gold/15', text: 'text-sacred-gold-ink' },
  [ROUTES.ANAMNESE]:       { icon: 'text-primary', bg: 'bg-primary/10', hover: 'hover:bg-primary/15', text: 'text-primary' },
  [ROUTES.INSIGHTS]:       { icon: 'text-primary', bg: 'bg-primary/10', hover: 'hover:bg-primary/15', text: 'text-primary' },
  [ROUTES.MEDICINAS]:      { icon: 'text-river', bg: 'bg-river/10', hover: 'hover:bg-river/15', text: 'text-river' },
  [ROUTES.ESTUDOS]:        { icon: 'text-river', bg: 'bg-river/10', hover: 'hover:bg-river/15', text: 'text-river' },
  [ROUTES.CURSOS]:         { icon: 'text-sacred-gold-ink', bg: 'bg-sacred-gold/10', hover: 'hover:bg-sacred-gold/15', text: 'text-sacred-gold-ink' },
  [ROUTES.BIBLIOTECA]:     { icon: 'text-river', bg: 'bg-river/10', hover: 'hover:bg-river/15', text: 'text-river' },
  [ROUTES.PARTILHAS]:      { icon: 'text-sacred-gold-ink', bg: 'bg-sacred-gold/10', hover: 'hover:bg-sacred-gold/15', text: 'text-sacred-gold-ink' },
  [ROUTES.LOJA]:           { icon: 'text-earth', bg: 'bg-earth/10', hover: 'hover:bg-earth/15', text: 'text-earth' },
  [ROUTES.CONFIGURACOES]:  { icon: 'text-earth', bg: 'bg-earth/10', hover: 'hover:bg-earth/15', text: 'text-earth' },
  [ROUTES.ADMIN]:          { icon: 'text-earth', bg: 'bg-earth/10', hover: 'hover:bg-earth/15', text: 'text-earth' },
  [ROUTES.FINANCEIRO]:     { icon: 'text-earth', bg: 'bg-earth/10', hover: 'hover:bg-earth/15', text: 'text-earth' },
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
            ? 'text-destructive hover:bg-destructive/10'
            : 'text-muted-foreground hover:text-foreground hover:bg-accent'
      )}
      onClick={onClick}
    >
      <item.icon
        className={cn(
          'w-5 h-5 shrink-0 transition-colors',
          isActive ? c.icon : isHighlight ? 'text-destructive' : 'text-muted-foreground'
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
            {/* Recolhida, a barra mostrava as letras "CD" numa caixinha. Um
                templo com emblema próprio se apresenta pelo emblema. */}
            <img
              src="/emblema.png"
              alt=""
              width={32}
              height={32}
              className="w-8 h-8 object-contain shrink-0"
            />
            {!collapsed && (
              <div className="flex flex-col leading-tight ml-2.5">
                <span className="font-display text-base font-semibold tracking-wide text-primary">
                  Consciência
                </span>
                <span className="font-display text-[11px] font-medium tracking-widest text-muted-foreground">
                  DIVINAL
                </span>
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
