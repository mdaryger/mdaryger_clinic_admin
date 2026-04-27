import { Users } from 'lucide-react';

import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';

export function PatientsPage() {
  return (
    <>
      <PageHeader title="Patients" description="Review patient records and clinic relationships." />
      <EmptyState
        icon={Users}
        title="No patients yet"
        description="Patient data views will live here after the API and permissions are ready."
      />
    </>
  );
}
