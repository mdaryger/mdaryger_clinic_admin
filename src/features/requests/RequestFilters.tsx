import { SearchInput } from '../../components/ui/SearchInput';
import { Select } from '../../components/ui/Select';

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
  return (
    <div className="space-y-4">
      <SearchInput
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        onClear={() => onSearchChange('')}
        placeholder="Search by patient, phone, or doctor"
      />
      <div className="grid gap-4 md:grid-cols-2">
        <Select value={status} onChange={(event) => onStatusChange(event.target.value)}>
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="searching">Searching</option>
          <option value="accepted">Accepted</option>
          <option value="inProgress">In progress</option>
          <option value="doctorOnWay">Doctor on way</option>
          <option value="doctorArrived">Doctor arrived</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </Select>
        <Select value={urgency} onChange={(event) => onUrgencyChange(event.target.value)}>
          <option value="all">All urgency levels</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </Select>
      </div>
    </div>
  );
}
