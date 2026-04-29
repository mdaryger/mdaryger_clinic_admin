import { SearchInput } from '../../components/ui/SearchInput';
import { Select } from '../../components/ui/Select';
import { useI18n } from '../../i18n/useI18n';

type RequestFiltersProps = {
  search: string;
  status: string;
  urgency: string;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onUrgencyChange: (value: string) => void;
};

export function RequestFilters({
  search,
  status,
  urgency,
  onSearchChange,
  onStatusChange,
  onUrgencyChange,
}: RequestFiltersProps) {
  const { t } = useI18n();

  return (
    <div className="space-y-4">
      <SearchInput
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        onClear={() => onSearchChange('')}
        placeholder={t('requests.searchPlaceholder')}
      />
      <div className="grid gap-4 md:grid-cols-2">
        <Select value={status} onChange={(event) => onStatusChange(event.target.value)}>
          <option value="all">{t('requests.allStatuses')}</option>
          <option value="pending">{t('requests.status.pending')}</option>
          <option value="searching">{t('requests.status.searching')}</option>
          <option value="accepted">{t('requests.status.accepted')}</option>
          <option value="inProgress">{t('requests.status.inProgress')}</option>
          <option value="doctorOnWay">{t('requests.status.doctorOnWay')}</option>
          <option value="doctorArrived">{t('requests.status.doctorArrived')}</option>
          <option value="completed">{t('requests.status.completed')}</option>
          <option value="cancelled">{t('requests.status.cancelled')}</option>
        </Select>
        <Select value={urgency} onChange={(event) => onUrgencyChange(event.target.value)}>
          <option value="all">{t('requests.allUrgencyLevels')}</option>
          <option value="low">{t('requests.urgency.low')}</option>
          <option value="medium">{t('requests.urgency.medium')}</option>
          <option value="high">{t('requests.urgency.high')}</option>
          <option value="urgent">{t('requests.urgency.urgent')}</option>
        </Select>
      </div>
    </div>
  );
}
