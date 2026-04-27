import type { LucideIcon } from 'lucide-react';

import { Card } from './Card';

type StatCardProps = {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  helperText?: string;
};

export function StatCard({ label, value, icon: Icon, helperText }: StatCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm font-medium text-slate-600">{label}</span>
        {Icon ? <Icon className="h-5 w-5 text-primary" aria-hidden="true" /> : null}
      </div>
      <strong className="mt-3 block text-3xl font-semibold text-slate-950">{value}</strong>
      {helperText ? <p className="mt-1 text-sm text-slate-500">{helperText}</p> : null}
    </Card>
  );
}
