import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Calendar, Image, Grid2x2, LogOut, Leaf } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/constants';
import { getAllNavItems } from '@/constants/navigation';

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

  return (
    <>
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border/40 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-center justify-around h-16 px-1">
          {MAIN_TABS.map(({ icon: Icon, label, path }) => {
            const isActive = location.pathname === path;
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className="flex flex-col items-center gap-0.5 min-w-[72px] py-2 group"
              >
                <div className="relative flex flex-col items-center">
                  {isActive && (
                    <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                  )}
                  <div
                    className={cn(
                      'w-11 h-9 rounded-2xl flex items-center justify-center transition-all duration-200',
                      isActive ? 'bg-primary/12' : 'group-active:bg-muted/60'
                    )}
                  >
                    <Icon
                      className={cn(
                        'w-5 h-5 transition-colors duration-200',
                        isActive ? 'text-primary' : 'text-muted-foreground'
                      )}
                      strokeWidth={isActive ? 2.2 : 1.8}
                    />
                  </div>
                </div>
                <span
                  className={cn(
                    'text-[10px] font-medium transition-colors duration-200',
                    isActive ? 'text-primary' : 'text-muted-foreground'
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
                <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
              )}
              <div
                className={cn(
                  'w-11 h-9 rounded-2xl flex items-center justify-center transition-all duration-200',
                  isMoreActive ? 'bg-primary/12' : 'group-active:bg-muted/60'
                )}
              >
                <Grid2x2
                  className={cn(
                    'w-5 h-5 transition-colors duration-200',
                    isMoreActive ? 'text-primary' : 'text-muted-foreground'
                  )}
                  strokeWidth={isMoreActive ? 2.2 : 1.8}
                />
              </div>
            </div>
            <span
              className={cn(
                'text-[10px] font-medium transition-colors duration-200',
                isMoreActive ? 'text-primary' : 'text-muted-foreground'
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

          <div className="px-4 pb-6" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1.5rem)' }}>
            <div className="grid grid-cols-3 gap-3 mb-5">
              {moreItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => handleMoreItemClick(item.path)}
                    className={cn(
                      'flex flex-col items-center gap-2 p-3 rounded-2xl transition-all duration-150 active:scale-95',
                      isActive
                        ? 'bg-primary/12 text-primary'
                        : 'bg-muted/50 text-muted-foreground hover:bg-muted active:bg-muted'
                    )}
                  >
                    <item.icon
                      className={cn('w-6 h-6', isActive && 'text-primary')}
                      strokeWidth={isActive ? 2.2 : 1.8}
                    />
                    <span className="text-[11px] font-medium text-center leading-tight">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="h-px bg-border/60 mb-4" />

            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-destructive hover:bg-destructive/8 active:bg-destructive/12 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium text-sm">Sair da conta</span>
            </button>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default BottomNav;
