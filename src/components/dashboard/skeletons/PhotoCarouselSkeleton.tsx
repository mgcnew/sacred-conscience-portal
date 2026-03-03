import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

/**
 * Skeleton animado para área do carrossel de fotos
 * Requirements: 5.3
 */
export function PhotoCarouselSkeleton() {
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <Skeleton className="h-6 w-40" />
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Main carousel image skeleton - compact size */}
        <div className="relative h-48 sm:h-56 md:h-64 w-full overflow-hidden rounded-lg">
          <Skeleton className="h-full w-full" />
        </div>
        
        {/* Navigation dots skeleton */}
        <div className="flex items-center justify-center gap-1.5">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-1.5 w-1.5 rounded-full" />
          ))}
          <Skeleton className="ml-2 h-3 w-8" />
        </div>
      </CardContent>
    </Card>
  );
}
