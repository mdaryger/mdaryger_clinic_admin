import { Badge } from './Badge';

type StatusChipProps = {
  status?: string | null;
};

function getTone(status: string): 'slate' | 'green' | 'yellow' | 'red' | 'blue' {
  const normalized = status.toLowerCase();

  if (['active', 'approved', 'completed', 'done'].includes(normalized)) {
    return 'green';
  }

  if (['pending', 'new', 'in_progress', 'scheduled'].includes(normalized)) {
    return 'yellow';
  }

  if (['rejected', 'cancelled', 'blocked', 'inactive'].includes(normalized)) {
    return 'red';
  }

  if (['draft', 'review'].includes(normalized)) {
    return 'blue';
  }

  return 'slate';
}

export function StatusChip({ status }: StatusChipProps) {
  const label = status ?? 'unknown';

  return <Badge tone={getTone(label)}>{label.replace(/_/g, ' ')}</Badge>;
}
