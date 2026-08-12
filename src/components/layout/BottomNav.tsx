import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Calendar, Image, Grid2x2, LogOut, Leaf, Heart, Sun, Moon, Info, HelpCircle } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { useTheme } from '@/components/theme-provider';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/constants';
import { getAllNavItems } from '@/constants/navigation';

// Mapa de cores por rota — icon (ativo), bg (pílula ativa), dot (indicador)
const NAV_COLORS: Record<string, { icon: string; bg: string; dot: string; label: string }> = {
  [ROUTES.HOME]:           { icon: 'text-primary', bg: 'bg-primary/12', dot: 'bg-primary', label: 'text-primary' },
  [ROUTES.CERIMONIAS]:     { icon: 'text-sacred-gold-ink', bg: 'bg-sacred-gold/12', dot: 'bg-sacred-gold', label: 'text-sacred-gold-ink' },
  [ROUTES.GALERIA]:        { icon: 'text-sacred-gold-ink', bg: 'bg-sacred-gold/12', dot: 'bg-sacred-gold', label: 'text-sacred-gold-ink' },
  [ROUTES.ANAMNESE]:       { icon: 'text-primary', bg: 'bg-primary/12', dot: 'bg-primary', label: 'text-primary' },
  [ROUTES.INSIGHTS]:       { icon: 'text-primary', bg: 'bg-primary/12', dot: 'bg-primary', label: 'text-primary' },
  [ROUTES.MEDICINAS]:      { icon: 'text-river', bg: 'bg-river/12', dot: 'bg-river', label: 'text-river' },
  [ROUTES.ESTUDOS]:        { icon: 'text-river', bg: 'bg-river/12', dot: 'bg-river', label: 'text-river' },
  [ROUTES.CURSOS]:         { icon: 'text-sacred-gold-ink', bg: 'bg-sacred-gold/12', dot: 'bg-sacred-gold', label: 'text-sacred-gold-ink' },
  [ROUTES.BIBLIOTECA]:     { icon: 'text-river', bg: 'bg-river/12', dot: 'bg-river', label: 'text-river' },
  [ROUTES.PARTILHAS]:      { icon: 'text-sacred-gold-ink', bg: 'bg-sacred-gold/12', dot: 'bg-sacred-gold', label: 'text-sacred-gold-ink' },
  [ROUTES.LOJA]:           { icon: 'text-earth', bg: 'bg-earth/12', dot: 'bg-earth', label: 'text-earth' },
  [ROUTES.CONFIGURACOES]:  { icon: 'text-earth', bg: 'bg-earth/12', dot: 'bg-earth', label: 'text-earth' },
  [ROUTES.ADMIN]:          { icon: 'text-earth', bg: 'bg-earth/12', dot: 'bg-earth', label: 'text-earth' },
  [ROUTES.FINANCEIRO]:     { icon: 'text-earth', bg: 'bg-earth/12', dot: 'bg-earth', label: 'text-earth' },
};

const DEFAULT_COLOR = { icon: 'text-primary', bg: 'bg-primary/12', dot: 'bg-primary', label: 'text-primary' };
const getNavColor = (path: string) => NAV_COLORS[path] ?? DEFAULT_COLOR;

// Cor fixa para o botão "Mais" quando algum item do drawer está ativo
const MORE_ACTIVE_COLOR = { icon: 'text-primary', bg: 'bg-primary/12', dot: 'bg-primary', label: 'text-primary' };

const MAIN_TABS = [
  { icon: Home, label: 'Início', path: ROUTES.HOME },
  { icon: Calendar, label: 'Cerimônias', path: ROUTES.CERIMONIAS },
  { icon: Image, label: 'Galeria', path: ROUTES.GALERIA },
] as const;

const MAIN_TAB_PATHS = new Set<string>([ROUTES.HOME, ROUTES.CERIMONIAS, ROUTES.GALERIA]);

interface BottomNavProps {
  isAdmin: boolean;
  isSuperAdmin: boolean;
  onSignOut: () => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ isAdmin, isSuperAdmin, onSignOut }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';

  const allNavItems = getAllNavItems(isAdmin, isSuperAdmin);
  const moreItems = allNavItems.filter((item) => !MAIN_TAB_PATHS.has(item.path));
  const isMoreActive = moreItems.some((item) => item.path === location.pathname);

  const handleMoreItemClick = (path: string) => {
    navigate(path);
    setMoreOpen(false);
  };

  const handleSignOut = () => {
    setMoreOpen(false);
    onSignOut();
  };

  const handleEmergency = () => {
    navigate(ROUTES.EMERGENCIA);
    setMoreOpen(false);
  };

  return (
    <>
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border/40 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-center justify-around h-16 px-1">
          {MAIN_TABS.map(({ icon: Icon, label, path }) => {
            const isActive = location.pathname === path;
            const c = getNavColor(path);
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className="flex flex-col items-center gap-0.5 min-w-[72px] py-2 group"
              >
                <div className="relative flex flex-col items-center">
                  {isActive && (
                    <span className={cn('absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full', c.dot)} />
                  )}
                  <div
                    className={cn(
                      'w-11 h-9 rounded-2xl flex items-center justify-center transition-all duration-200',
                      isActive ? c.bg : 'group-active:bg-muted/60'
                    )}
                  >
                    <Icon
                      className={cn(
                        'w-5 h-5 transition-colors duration-200',
                        isActive ? c.icon : 'text-muted-foreground'
                      )}
                      strokeWidth={isActive ? 2.2 : 1.8}
                    />
                  </div>
                </div>
                <span
                  className={cn(
                    'text-[10px] font-medium transition-colors duration-200',
                    isActive ? c.label : 'text-muted-foreground'
                  )}
                >
                  {label}
                </span>
              </button>
            );
          })}

          {/* Mais */}
          <button
            onClick={() => setMoreOpen(true)}
            className="flex flex-col items-center gap-0.5 min-w-[72px] py-2 group"
          >
            <div className="relative flex flex-col items-center">
              {isMoreActive && (
                <span className={cn('absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full', MORE_ACTIVE_COLOR.dot)} />
              )}
              <div
                className={cn(
                  'w-11 h-9 rounded-2xl flex items-center justify-center transition-all duration-200',
                  isMoreActive ? MORE_ACTIVE_COLOR.bg : 'group-active:bg-muted/60'
                )}
              >
                <Grid2x2
                  className={cn(
                    'w-5 h-5 transition-colors duration-200',
                    isMoreActive ? MORE_ACTIVE_COLOR.icon : 'text-muted-foreground'
                  )}
                  strokeWidth={isMoreActive ? 2.2 : 1.8}
                />
              </div>
            </div>
            <span
              className={cn(
                'text-[10px] font-medium transition-colors duration-200',
                isMoreActive ? MORE_ACTIVE_COLOR.label : 'text-muted-foreground'
              )}
            >
              Mais
            </span>
          </button>
        </div>
      </nav>

      {/* More Drawer */}
      <Drawer open={moreOpen} onOpenChange={setMoreOpen}>
        <DrawerContent>
          <div className="mx-auto w-10 h-1 rounded-full bg-muted-foreground/20 mt-2 mb-1" />
          <DrawerHeader className="pb-3 pt-2">
            <DrawerTitle className="text-base flex items-center gap-2">
              <Leaf className="w-4 h-4 text-primary" />
              Menu
            </DrawerTitle>
          </DrawerHeader>

          <div className="px-4" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1.5rem)' }}>
            {/* Nav grid */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              {moreItems.map((item) => {
                const isActive = location.pathname === item.path;
                const c = getNavColor(item.path);
                return (
                  <button
                    key={item.path}
                    onClick={() => handleMoreItemClick(item.path)}
                    className={cn(
                      'flex flex-col items-center gap-2 p-3 rounded-2xl transition-all duration-150 active:scale-95',
                      isActive ? c.bg : 'bg-muted/50 hover:bg-muted'
                    )}
                  >
                    <item.icon
                      className={cn(
                        'w-6 h-6 transition-colors',
                        isActive ? c.icon : cn(c.icon, 'opacity-50')
                      )}
                      strokeWidth={isActive ? 2.2 : 1.8}
                    />
                    <span className={cn(
                      'text-[11px] font-medium text-center leading-tight transition-colors',
                      isActive ? c.label : 'text-muted-foreground'
                    )}>
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="h-px bg-border/60 mb-3" />

            {/* Actions row */}
            <div className="flex items-center gap-2">
              {/* Emergency */}
              <button
                onClick={handleEmergency}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-3 rounded-xl bg-destructive/10 text-destructive active:bg-destructive/20 transition-colors"
              >
                <Heart className="w-5 h-5 fill-current" />
                <span className="font-medium text-sm">Emergência</span>
              </button>

              {/* Sobre Nós */}
              <button
                onClick={() => { navigate(ROUTES.SOBRE_NOS); setMoreOpen(false); }}
                className="flex items-center justify-center w-12 h-12 rounded-xl bg-muted/50 text-muted-foreground active:bg-muted transition-colors"
                aria-label="Sobre Nós"
              >
                <Info className="w-5 h-5" />
              </button>

              {/* FAQ */}
              <button
                onClick={() => { navigate(ROUTES.FAQ); setMoreOpen(false); }}
                className="flex items-center justify-center w-12 h-12 rounded-xl bg-muted/50 text-muted-foreground active:bg-muted transition-colors"
                aria-label="FAQ"
              >
                <HelpCircle className="w-5 h-5" />
              </button>

              {/* Theme toggle */}
              <button
                onClick={() => setTheme(isDark ? 'light' : 'dark')}
                className="flex items-center justify-center w-12 h-12 rounded-xl bg-muted/50 text-muted-foreground active:bg-muted transition-colors"
                aria-label="Alternar tema"
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              {/* Sign out */}
              <button
                onClick={handleSignOut}
                className="flex items-center justify-center w-12 h-12 rounded-xl text-destructive bg-destructive/8 active:bg-destructive/15 transition-colors"
                aria-label="Sair"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default BottomNav;
