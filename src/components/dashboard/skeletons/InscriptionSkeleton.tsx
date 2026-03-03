import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

interface InscriptionSkeletonProps {
  count?: number;
}

/**
 * Skeleton animado para cards de inscrições
 * Requirements: 5.3
 */
export function InscriptionSkeleton({ count = 3 }: InscriptionSkeletonProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex flex-col gap-3">
              {/* Ceremony name and status badge */}
              <div className="flex items-center justify-between gap-2">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              
              {/* Date row */}
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-4 w-32" />
              </div>
              
              {/* Action button */}
              <div className="flex justify-end">
                <Skeleton className="h-8 w-24 rounded-md" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
