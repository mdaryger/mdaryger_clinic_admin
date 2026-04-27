import { Building2, CheckCircle2, Clock3, Mail, MapPin, Phone, ShieldCheck, UserRound } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { Badge } from '../../components/ui/Badge';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { ErrorState } from '../../components/ui/ErrorState';
import { LoadingState } from '../../components/ui/LoadingState';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatCard } from '../../components/ui/StatCard';
import { asClinicRecord, getClinicDashboardData, type ClinicDashboardData } from '../../services/dashboardService';
import { useAuthStore } from '../../store/authStore';

function booleanTone(value: boolean): 'green' | 'slate' {
  return value ? 'green' : 'slate';
}

function booleanLabel(value: boolean, trueLabel: string, falseLabel: string): string {
  return value ? trueLabel : falseLabel;
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm text-slate-950">{value || 'Not specified'}</p>
    </div>
  );
}

export function ClinicOverviewPage() {
  const { clinic, clinicId } = useAuthStore();
  const [dashboard, setDashboard] = useState<ClinicDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clinicRecord = useMemo(() => asClinicRecord(clinic), [clinic]);

  const loadOverview = useCallback(async () => {
    if (!clinicId) {
      setDashboard(null);
      setError('Clinic is not available for this user.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getClinicDashboardData(clinicId);
      setDashboard(data);
    } catch (unknownError) {
      setDashboard(null);
      setError(unknownError instanceof Error ? unknownError.message : 'Failed to load clinic overview.');
    } finally {
      setLoading(false);
    }
  }, [clinicId]);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  if (loading) {
    return <LoadingState label="Loading clinic overview..." />;
  }

  if (error || !clinicRecord) {
    return (
      <ErrorState
        title="Clinic overview unavailable"
        description={error ?? 'Clinic data was not found for this account.'}
        actionLabel="Try again"
        onAction={() => void loadOverview()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={clinicRecord.name}
        description="Current clinic profile and operational snapshot."
        actions={
          <div className="flex flex-wrap gap-2">
            <Badge tone={booleanTone(clinicRecord.isActive)}>
              {booleanLabel(clinicRecord.isActive, 'Active', 'Inactive')}
            </Badge>
            <Badge tone={clinicRecord.isVerified ? 'primary' : 'yellow'}>
              {booleanLabel(clinicRecord.isVerified, 'Verified', 'Unverified')}
            </Badge>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Branches" value={dashboard?.totalBranches ?? 0} icon={Building2} helperText="Registered clinic branches" />
        <StatCard label="Doctors" value={dashboard?.totalDoctors ?? 0} icon={UserRound} helperText="All clinic doctors" />
        <StatCard label="Active doctors" value={dashboard?.activeDoctors ?? 0} icon={ShieldCheck} helperText="Currently active doctor profiles" />
        <StatCard label="Active requests" value={dashboard?.activeRequestsCount ?? 0} icon={CheckCircle2} helperText="Open requests across the clinic" />
      </div>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold text-slate-950">Clinic details</h2>
          </CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2">
            <DetailItem label="Description" value={clinicRecord.description || 'Not specified'} />
            <DetailItem label="Address" value={clinicRecord.address || 'Not specified'} />
            <DetailItem label="City / Country" value={[clinicRecord.city, clinicRecord.country].filter(Boolean).join(', ') || 'Not specified'} />
            <DetailItem label="Working hours" value={clinicRecord.workingHours || 'Not specified'} />
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
                <p className="text-sm text-slate-600">{clinicRecord.phone || 'Not specified'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="mt-0.5 h-4 w-4 text-slate-400" />
              <div>
                <p className="text-sm font-medium text-slate-950">Email</p>
                <p className="text-sm text-slate-600">{clinicRecord.email || 'Not specified'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 text-slate-400" />
              <div>
                <p className="text-sm font-medium text-slate-950">Address</p>
                <p className="text-sm text-slate-600">{clinicRecord.address || 'Not specified'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock3 className="mt-0.5 h-4 w-4 text-slate-400" />
              <div>
                <p className="text-sm font-medium text-slate-950">Working hours</p>
                <p className="text-sm text-slate-600">{clinicRecord.workingHours || 'Not specified'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold text-slate-950">Contact person</h2>
          </CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2">
            <DetailItem label="Name" value={clinicRecord.contactPersonName || 'Not specified'} />
            <DetailItem label="Phone" value={clinicRecord.contactPersonPhone || 'Not specified'} />
            <DetailItem label="Email" value={clinicRecord.contactPersonEmail || 'Not specified'} />
            <DetailItem label="Website" value={clinicRecord.website || 'Not specified'} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold text-slate-950">Capabilities</h2>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Badge tone={booleanTone(clinicRecord.isProcedureRoom)}>
              {booleanLabel(clinicRecord.isProcedureRoom, 'Procedure room available', 'No procedure room')}
            </Badge>
            <Badge tone={booleanTone(clinicRecord.isTraumaCenter)}>
              {booleanLabel(clinicRecord.isTraumaCenter, 'Trauma center', 'No trauma center')}
            </Badge>
            <Badge tone={booleanTone(clinicRecord.isActive)}>
              {booleanLabel(clinicRecord.isActive, 'Clinic is active', 'Clinic is inactive')}
            </Badge>
            <Badge tone={clinicRecord.isVerified ? 'primary' : 'yellow'}>
              {booleanLabel(clinicRecord.isVerified, 'Clinic verified', 'Clinic not verified')}
            </Badge>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

