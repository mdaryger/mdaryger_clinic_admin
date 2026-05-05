export function escapeCsvValue(value: unknown): string {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

export function convertRowsToCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) {
    return '';
  }

  const headers = Object.keys(rows[0]);
  const lines = [
    headers.map((header) => escapeCsvValue(header)).join(','),
    ...rows.map((row) => headers.map((header) => escapeCsvValue(row[header])).join(',')),
  ];

  return lines.join('\n');
}

export function exportToCsv(filename: string, rows: Record<string, unknown>[]): void {
  const BOM = '﻿';
  const csvContent = BOM + convertRowsToCsv(rows);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = filename;
  anchor.click();

  URL.revokeObjectURL(url);
}
