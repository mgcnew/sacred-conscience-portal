import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
  // Page size selector (optional — omit to use original layout)
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  totalItems?: number;
}

export const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  isLoading = false,
  pageSize,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20],
  totalItems,
}) => {
  const hasPageSizeSelector = pageSize !== undefined && onPageSizeChange !== undefined;

  // Build compact page number list: always show first, last, current ± 1, with ellipsis
  const getPageNumbers = (): (number | 'ellipsis')[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | 'ellipsis')[] = [1];
    if (currentPage > 3) pages.push('ellipsis');
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push('ellipsis');
    pages.push(totalPages);
    return pages;
  };

  const itemStart = pageSize ? (currentPage - 1) * pageSize + 1 : null;
  const itemEnd = pageSize && totalItems ? Math.min(currentPage * pageSize, totalItems) : null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6 pt-4 border-t">
      {/* Left: page size selector or simple page label */}
      <div className="flex items-center gap-3">
        {hasPageSizeSelector ? (
          <>
            <span className="text-sm text-muted-foreground whitespace-nowrap">Exibir</span>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => {
                onPageSizeChange!(Number(v));
                onPageChange(1);
              }}
            >
              <SelectTrigger className="h-8 w-[70px] text-sm md:h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((opt) => (
                  <SelectItem key={opt} value={String(opt)}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground whitespace-nowrap">por página</span>
            {totalItems !== undefined && itemStart && itemEnd && (
              <span className="text-sm text-muted-foreground hidden md:inline">
                · {itemStart}–{itemEnd} de {totalItems}
              </span>
            )}
          </>
        ) : (
          <div className="text-sm text-muted-foreground">
            Página <span className="font-medium">{currentPage}</span> de{' '}
            <span className="font-medium">{totalPages}</span>
          </div>
        )}
      </div>

      {/* Right: navigation */}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1 || isLoading}
          className="h-8 w-8 p-0"
          aria-label="Página anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        {getPageNumbers().map((page, idx) =>
          page === 'ellipsis' ? (
            <span key={`ellipsis-${idx}`} className="px-1 text-muted-foreground text-sm select-none">
              …
            </span>
          ) : (
            <Button
              key={page}
              variant={page === currentPage ? 'default' : 'outline'}
              size="sm"
              onClick={() => onPageChange(page)}
              disabled={isLoading}
              className="h-8 w-8 p-0 text-sm"
            >
              {page}
            </Button>
          )
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || isLoading}
          className="h-8 w-8 p-0"
          aria-label="Próxima página"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
