import React from 'react';
import { cn } from '@/lib/utils';

interface PageContainerProps {
  children: React.ReactNode;
  /** Largura máxima do container: 'sm' (640px), 'md' (768px), 'lg' (1024px), 'xl' (1280px), '2xl' (1536px), '3xl' (1600px), '4xl' (1800px), '5xl' (2000px), '6xl' (2200px), '7xl' (2400px) */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl';
  className?: string;
  /** Remove o padding inferior (útil para telas fullscreen como chat) */
  noPaddingBottom?: boolean;
}

const maxWidthClasses = {
  sm: 'max-w-2xl',
  md: 'max-w-3xl',
  lg: 'max-w-4xl',
  xl: 'max-w-5xl',
  '2xl': 'max-w-6xl',
  '3xl': 'max-w-7xl',
  '4xl': 'max-w-[1800px]',
  '5xl': 'max-w-[2000px]',
  '6xl': 'max-w-[2200px]',
  '7xl': 'max-w-[2400px]',
};

/**
 * Componente container padrão para páginas
 * Padroniza espaçamentos, margens e largura máxima
 */
const PageContainer: React.FC<PageContainerProps> = ({
  children,
  maxWidth = 'lg',
  className,
  noPaddingBottom = false,
}) => {
  return (
    // Sem `min-h-screen`: o <main> do MainLayout já tem, e somar mais uma
    // tela inteira ao py-4 e ao pb-20 daqui garantia barra de rolagem em
    // toda página curta, mesmo sem conteúdo que passasse da dobra.
    <div className={cn(
      "py-4 md:py-6 bg-background/50",
      noPaddingBottom ? "pb-0" : "pb-20"
    )}>
      <div className={cn('container mx-auto', maxWidthClasses[maxWidth], className)}>
        {children}
      </div>
    </div>
  );
};

export default PageContainer;
