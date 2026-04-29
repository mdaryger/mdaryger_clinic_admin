import { Badge } from './Badge';
import { useI18n } from '../../i18n/useI18n';

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
  const { t } = useI18n();
  const normalized = label.toLowerCase().replace(/_/g, '');
  const localizedLabelMap: Record<string, string> = {
    active: t('doctors.active'),
    inactive: t('doctors.inactive'),
    approved: t('requests.status.accepted'),
    completed: t('requests.status.completed'),
    done: t('requests.status.completed'),
    pending: t('requests.status.pending'),
    new: t('requests.status.pending'),
    searching: t('requests.status.searching'),
    accepted: t('requests.status.accepted'),
    inprogress: t('requests.status.inProgress'),
    scheduled: t('requests.status.inProgress'),
    doctoronway: t('requests.status.doctorOnWay'),
    doctorarrived: t('requests.status.doctorArrived'),
    cancelled: t('requests.status.cancelled'),
    blocked: t('requests.status.cancelled'),
    rejected: t('requests.status.cancelled'),
    review: t('requests.status.review'),
    draft: t('requests.status.draft'),
    unknown: t('requests.status.unknown'),
  };

  return <Badge tone={getTone(label)}>{localizedLabelMap[normalized] ?? label.replace(/_/g, ' ')}</Badge>;
}
