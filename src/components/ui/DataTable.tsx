import type { ReactNode } from 'react';

import { cn } from '../../utils/cn';
import { EmptyState } from './EmptyState';

export type DataTableColumn<T> = {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  className?: string;
};

type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  data: T[];
  getRowKey: (row: T, index: number) => string;
  emptyTitle?: string;
  emptyDescription?: string;
};

export function DataTable<T>({
  columns,
  data,
  getRowKey,
  emptyTitle = 'No data',
  emptyDescription = 'Records will appear here when available.',
}: DataTableProps<T>) {
  if (data.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn('px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500', column.className)}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((row, index) => (
              <tr key={getRowKey(row, index)} className="hover:bg-slate-50">
                {columns.map((column) => (
                  <td key={column.key} className={cn('px-4 py-3 text-sm text-slate-700', column.className)}>
                    {column.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
