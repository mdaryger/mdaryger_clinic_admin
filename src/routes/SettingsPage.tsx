import { Settings } from 'lucide-react';

import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';

export function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" description="Configure Firebase, users, and clinic admin preferences." />
      <EmptyState
        icon={Settings}
        title="Settings are ready for wiring"
        description="Configuration forms and access controls can be added in this section."
      />
    </>
  );
}
