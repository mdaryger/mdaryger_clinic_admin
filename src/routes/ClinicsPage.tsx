import { Building2 } from 'lucide-react';

import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';

export function ClinicsPage() {
  return (
    <>
      <PageHeader title="Clinics" description="Manage clinic profiles and operational details." />
      <EmptyState
        icon={Building2}
        title="No clinics yet"
        description="Clinic management screens will appear here as the product grows."
      />
    </>
  );
}
