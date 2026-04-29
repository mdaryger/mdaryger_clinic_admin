import { Badge, type BadgeTone } from './Badge';
import { useI18n } from '../../i18n/useI18n';

type StatusChipProps = {
  status?: string | null;
};

function getTone(status: string): BadgeTone {
  const normalized = status.toLowerCase().replace(/_/g, '');
  const toneMap: Record<string, BadgeTone> = {
    pending: 'yellow',
    new: 'yellow',
    searching: 'blue',
    accepted: 'primary',
    approved: 'primary',
    inprogress: 'orange',
    scheduled: 'orange',
    doctoronway: 'orange',
    doctorarrived: 'teal',
    completed: 'green',
    done: 'green',
    cancelled: 'red',
    rejected: 'red',
    blocked: 'red',
    inactive: 'red',
    draft: 'slate',
    review: 'blue',
    active: 'green',
  };

  return toneMap[normalized] ?? 'slate';
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
