import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from './Button';

type PaginationControlsProps = {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
};

export function PaginationControls({ page, pageCount, onPageChange }: PaginationControlsProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm text-slate-600">
        Page <span className="font-semibold text-slate-900">{page}</span> of{' '}
        <span className="font-semibold text-slate-900">{pageCount}</span>
      </p>
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="icon" onClick={() => onPageChange(page - 1)} disabled={page <= 1} aria-label="Previous page">
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pageCount}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
