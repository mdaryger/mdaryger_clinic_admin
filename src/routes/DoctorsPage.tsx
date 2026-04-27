import { Stethoscope } from 'lucide-react';

import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';

export function DoctorsPage() {
  return (
    <>
      <PageHeader title="Doctors" description="Manage specialists, schedules, and clinic assignments." />
      <EmptyState
        icon={Stethoscope}
        title="No doctors yet"
        description="Doctor profiles and schedule tools will be connected here."
      />
    </>
  );
}
