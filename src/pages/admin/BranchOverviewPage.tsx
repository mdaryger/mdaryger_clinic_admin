import { Activity, Building2, Clock3, Mail, MapPin, Phone, Stethoscope, UserRound } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { Badge } from '../../components/ui/Badge';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { ErrorState } from '../../components/ui/ErrorState';
import { LoadingState } from '../../components/ui/LoadingState';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatCard } from '../../components/ui/StatCard';
import { getBranchDashboardData } from '../../services/dashboardService';
import { useAuthStore } from '../../store/authStore';

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm text-slate-950">{value || 'Not specified'}</p>
    </div>
  );
}

export function BranchOverviewPage() {
  const { clinicBranchId, clinicId } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [branchData, setBranchData] = useState<Awaited<ReturnType<typeof getBranchDashboardData>> | null>(null);

  const loadOverview = useCallback(async () => {
    if (!clinicId || !clinicBranchId) {
      setBranchData(null);
      setError('Branch data is not available for this user.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getBranchDashboardData(clinicId, clinicBranchId);
      setBranchData(data);
    } catch (unknownError) {
      setBranchData(null);
      setError(unknownError instanceof Error ? unknownError.message : 'Failed to load branch overview.');
    } finally {
      setLoading(false);
    }
  }, [clinicBranchId, clinicId]);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  if (loading) {
    return <LoadingState label="Loading branch overview..." />;
  }

  if (error || !branchData?.branch) {
    return (
      <ErrorState
        title="Branch overview unavailable"
        description={error ?? 'Branch data was not found for this account.'}
        actionLabel="Try again"
        onAction={() => void loadOverview()}
      />
    );
  }

  const { branch } = branchData;
  const workingHours = [branch.openingHours, branch.closingHours].filter(Boolean).join(' - ');

  return (
    <div className="space-y-6">
      <PageHeader
        title={typeof branch.name === 'string' && branch.name.trim() ? branch.name : branch.id}
        description="Branch profile and operational snapshot."
        actions={
          <div className="flex flex-wrap gap-2">
            <Badge tone={branch.isActive ? 'green' : 'slate'}>{branch.isActive ? 'Active' : 'Inactive'}</Badge>
            {typeof branch.isVerified === 'boolean' ? (
              <Badge tone={branch.isVerified ? 'primary' : 'yellow'}>
                {branch.isVerified ? 'Verified' : 'Unverified'}
              </Badge>
            ) : null}
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Branch doctors" value={branchData.totalDoctors} icon={Stethoscope} helperText="Doctors assigned to this branch" />
        <StatCard label="Active doctors" value={branchData.activeDoctors} icon={UserRound} helperText="Currently active doctor profiles" />
        <StatCard label="Available doctors" value={branchData.availableDoctors} icon={Building2} helperText="Ready to take new requests" />
        <StatCard label="Active requests" value={branchData.activeRequestsCount} icon={Activity} helperText="Visible active request load" />
      </div>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold text-slate-950">Branch details</h2>
          </CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2">
            <DetailItem label="Address" value={typeof branch.address === 'string' ? branch.address : 'Not specified'} />
            <DetailItem
              label="City / Country"
              value={[branch.city, branch.country].filter((value): value is string => typeof value === 'string' && value.length > 0).join(', ') || 'Not specified'}
            />
            <DetailItem
              label="Working hours"
              value={workingHours || 'Not specified'}
            />
            <DetailItem
              label="Description"
              value={typeof branch.description === 'string' ? branch.description : 'Not specified'}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold text-slate-950">Contacts</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Phone className="mt-0.5 h-4 w-4 text-slate-400" />
              <div>
                <p className="text-sm font-medium text-slate-950">Phone</p>
                <p className="text-sm text-slate-600">{typeof branch.phone === 'string' ? branch.phone : 'Not specified'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="mt-0.5 h-4 w-4 text-slate-400" />
              <div>
                <p className="text-sm font-medium text-slate-950">Email</p>
                <p className="text-sm text-slate-600">{typeof branch.email === 'string' ? branch.email : 'Not specified'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 text-slate-400" />
              <div>
                <p className="text-sm font-medium text-slate-950">Location</p>
                <p className="text-sm text-slate-600">
                  {[branch.city, branch.country].filter((value): value is string => typeof value === 'string' && value.length > 0).join(', ') || 'Not specified'}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock3 className="mt-0.5 h-4 w-4 text-slate-400" />
              <div>
                <p className="text-sm font-medium text-slate-950">Working hours</p>
                <p className="text-sm text-slate-600">{workingHours || 'Not specified'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
