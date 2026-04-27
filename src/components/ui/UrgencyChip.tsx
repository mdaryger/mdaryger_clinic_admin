import { Badge } from './Badge';

type Urgency = 'low' | 'medium' | 'high' | 'urgent' | string;

type UrgencyChipProps = {
  urgency?: Urgency | null;
};

export function UrgencyChip({ urgency }: UrgencyChipProps) {
  const label = urgency ?? 'normal';
  const normalized = label.toLowerCase();
  const tone = normalized === 'urgent' || normalized === 'high' ? 'red' : normalized === 'medium' ? 'yellow' : 'green';

  return <Badge tone={tone}>{label}</Badge>;
}
