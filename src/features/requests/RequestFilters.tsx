import { SearchInput } from '../../components/ui/SearchInput';
import { Select } from '../../components/ui/Select';
import { useI18n } from '../../i18n/useI18n';

type RequestFiltersProps = {
  search: string;
  status: string;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
};

export function RequestFilters({
  search,
  status,
  onSearchChange,
  onStatusChange,
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
      <Select className="max-w-xs" value={status} onChange={(event) => onStatusChange(event.target.value)}>
        <option value="all">{t('requests.allStatuses')}</option>
        <option value="pending">{t('requests.status.pending')}</option>
        <option value="accepted">{t('requests.status.accepted')}</option>
        <option value="inProgress">{t('requests.status.inProgress')}</option>
        <option value="completed">{t('requests.status.completed')}</option>
        <option value="cancelled">{t('requests.status.cancelled')}</option>
      </Select>
    </div>
  );
}
