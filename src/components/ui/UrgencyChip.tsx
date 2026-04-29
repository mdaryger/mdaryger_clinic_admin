import { Badge } from './Badge';
import { useI18n } from '../../i18n/useI18n';

type Urgency = 'low' | 'medium' | 'high' | 'urgent' | string;

type UrgencyChipProps = {
  urgency?: Urgency | null;
};

export function UrgencyChip({ urgency }: UrgencyChipProps) {
  const label = urgency ?? 'normal';
  const normalized = label.toLowerCase();
  const tone = normalized === 'urgent' || normalized === 'high' ? 'red' : normalized === 'medium' ? 'yellow' : 'green';
  const { t } = useI18n();
  const localizedLabelMap: Record<string, string> = {
    low: t('requests.urgency.low'),
    medium: t('requests.urgency.medium'),
    high: t('requests.urgency.high'),
    urgent: t('requests.urgency.urgent'),
    normal: t('requests.urgency.normal'),
  };

  return <Badge tone={tone}>{localizedLabelMap[normalized] ?? label}</Badge>;
}
