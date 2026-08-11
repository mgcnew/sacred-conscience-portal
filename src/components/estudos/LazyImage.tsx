import { useState, useRef, useEffect, memo } from 'react';
import { cn } from '@/lib/utils';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
}

/**
 * Componente de imagem com lazy loading usando IntersectionObserver
 * Carrega a imagem apenas quando entra no viewport
 */
const LazyImage: React.FC<LazyImageProps> = ({ src, alt, className, fallback }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!imgRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '100px', // Pré-carrega 100px antes de entrar no viewport
        threshold: 0,
      }
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, []);

  const handleLoad = () => setIsLoaded(true);
  const handleError = () => setHasError(true);

  return (
    <div ref={imgRef} className={cn('relative overflow-hidden bg-muted', className)}>
      {/* Placeholder/Skeleton enquanto carrega */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 animate-pulse bg-muted" />
      )}

      {/* Fallback em caso de erro */}
      {hasError && fallback}

      {/* Imagem real - só renderiza quando está no viewport */}
      {isInView && !hasError && (
        <img
          src={src}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'w-full h-full object-cover transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
          loading="lazy"
          decoding="async"
        />
      )}
    </div>
  );
};

export default memo(LazyImage);
