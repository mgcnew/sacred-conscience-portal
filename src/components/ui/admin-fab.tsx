import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Plus, X, type LucideIcon } from 'lucide-react';

interface FabAction {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'destructive';
}

interface AdminFabProps {
  actions: FabAction[];
  className?: string;
}

export const AdminFab: React.FC<AdminFabProps> = ({ actions, className }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (actions.length === 1) {
    const action = actions[0];
    return createPortal(
      <Button
        onClick={action.onClick}
        className={cn(
          'fixed bottom-20 right-4 z-[200] rounded-full shadow-lg h-14 w-14 p-0',
          'bg-primary hover:bg-primary/90 text-primary-foreground',
          'transition-all duration-200 hover:scale-105 active:scale-95',
          className
        )}
        aria-label={action.label}
      >
        <action.icon className="w-6 h-6" />
      </Button>,
      document.body
    );
  }

  return createPortal(
    <div className={cn('fixed bottom-20 right-4 z-[200]', className)}>
      {/* Ações expandidas */}
      <div
        className={cn(
          'absolute bottom-16 right-0 flex flex-col gap-2 items-end transition-all duration-200',
          isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        )}
      >
        {actions.map((action, index) => (
          <div
            key={index}
            className="flex items-center gap-2 animate-fade-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <span className="bg-background/95 backdrop-blur-sm text-foreground text-sm px-3 py-1.5 rounded-lg shadow-md whitespace-nowrap">
              {action.label}
            </span>
            <Button
              onClick={() => {
                action.onClick();
                setIsOpen(false);
              }}
              variant={action.variant === 'destructive' ? 'destructive' : 'secondary'}
              className="rounded-full h-12 w-12 p-0 shadow-lg hover:scale-105 active:scale-95 transition-transform"
              aria-label={action.label}
            >
              <action.icon className="w-5 h-5" />
            </Button>
          </div>
        ))}
      </div>

      {/* Botão principal */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'rounded-full shadow-lg h-14 w-14 p-0',
          'bg-primary hover:bg-primary/90 text-primary-foreground',
          'transition-all duration-200 hover:scale-105 active:scale-95',
          isOpen && 'rotate-45'
        )}
        aria-label={isOpen ? 'Fechar menu' : 'Abrir menu de ações'}
        aria-expanded={isOpen}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
      </Button>

      {/* Overlay para fechar ao clicar fora */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[-1]"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>,
    document.body
  );
};

export default AdminFab;
