import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Calendar, Image, Grid2x2, LogOut, Leaf, Heart, Sun, Moon } from 'lucide-react';
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
  [ROUTES.HOME]:          { icon: 'text-primary',     bg: 'bg-primary/12',     dot: 'bg-primary',     label: 'text-primary' },
  [ROUTES.CERIMONIAS]:    { icon: 'text-emerald-500', bg: 'bg-emerald-500/12', dot: 'bg-emerald-500', label: 'text-emerald-600 dark:text-emerald-400' },
  [ROUTES.GALERIA]:       { icon: 'text-blue-500',    bg: 'bg-blue-500/12',    dot: 'bg-blue-500',    label: 'text-blue-600 dark:text-blue-400' },
  [ROUTES.ANAMNESE]:      { icon: 'text-rose-500',    bg: 'bg-rose-500/12',    dot: 'bg-rose-500',    label: 'text-rose-600 dark:text-rose-400' },
  [ROUTES.INSIGHTS]:      { icon: 'text-violet-500',  bg: 'bg-violet-500/12',  dot: 'bg-violet-500',  label: 'text-violet-600 dark:text-violet-400' },
  [ROUTES.MEDICINAS]:     { icon: 'text-green-600',   bg: 'bg-green-600/12',   dot: 'bg-green-600',   label: 'text-green-700 dark:text-green-400' },
  [ROUTES.ESTUDOS]:       { icon: 'text-sky-500',     bg: 'bg-sky-500/12',     dot: 'bg-sky-500',     label: 'text-sky-600 dark:text-sky-400' },
  [ROUTES.CURSOS]:        { icon: 'text-indigo-500',  bg: 'bg-indigo-500/12',  dot: 'bg-indigo-500',  label: 'text-indigo-600 dark:text-indigo-400' },
  [ROUTES.BIBLIOTECA]:    { icon: 'text-purple-500',  bg: 'bg-purple-500/12',  dot: 'bg-purple-500',  label: 'text-purple-600 dark:text-purple-400' },
  [ROUTES.PARTILHAS]:     { icon: 'text-pink-500',    bg: 'bg-pink-500/12',    dot: 'bg-pink-500',    label: 'text-pink-600 dark:text-pink-400' },
  [ROUTES.LOJA]:          { icon: 'text-amber-600',   bg: 'bg-amber-500/12',   dot: 'bg-amber-500',   label: 'text-amber-700 dark:text-amber-400' },
  [ROUTES.CONFIGURACOES]: { icon: 'text-slate-500',   bg: 'bg-slate-500/12',   dot: 'bg-slate-500',   label: 'text-slate-600 dark:text-slate-400' },
  [ROUTES.ADMIN]:         { icon: 'text-red-500',     bg: 'bg-red-500/12',     dot: 'bg-red-500',     label: 'text-red-600 dark:text-red-400' },
  [ROUTES.FINANCEIRO]:    { icon: 'text-teal-500',    bg: 'bg-teal-500/12',    dot: 'bg-teal-500',    label: 'text-teal-600 dark:text-teal-400' },
};

const DEFAULT_COLOR = { icon: 'text-primary', bg: 'bg-primary/12', dot: 'bg-primary', label: 'text-primary' };
const getNavColor = (path: string) => NAV_COLORS[path] ?? DEFAULT_COLOR;

// Cor fixa para o botão "Mais" quando algum item do drawer está ativo
const MORE_ACTIVE_COLOR = { icon: 'text-violet-500', bg: 'bg-violet-500/12', dot: 'bg-violet-500', label: 'text-violet-600 dark:text-violet-400' };

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
                className="flex-1 flex items-center justify-center gap-2 px-3 py-3 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 active:bg-red-500/20 transition-colors"
              >
                <Heart className="w-5 h-5 fill-current" />
                <span className="font-medium text-sm">Emergência</span>
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
                className="flex-1 flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-destructive bg-destructive/8 active:bg-destructive/15 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium text-sm">Sair</span>
              </button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default BottomNav;
