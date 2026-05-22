import React from 'react';
import { useInView } from '@/hooks/useInView';
import { cn } from '@/lib/utils';

interface FadeInProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
}

const FadeIn: React.FC<FadeInProps> = ({
  children,
  className,
  delay = 0,
  duration = 450,
}) => {
  const { ref, inView } = useInView();

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={cn(
        'transition-[opacity,transform] ease-out will-change-[opacity,transform]',
        inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5',
        className
      )}
      style={{ transitionDuration: `${duration}ms`, transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

export default FadeIn;
