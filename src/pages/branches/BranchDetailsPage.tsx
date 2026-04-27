import { ArrowLeft, CalendarClock, Mail, MapPin, Phone, ShieldCheck, Stethoscope, UserRound } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';

import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { ErrorState } from '../../components/ui/ErrorState';
import { LoadingState } from '../../components/ui/LoadingState';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatCard } from '../../components/ui/StatCard';
import { getBranchById, type ClinicBranch } from '../../services/branchService';
import { getBranchDashboardData } from '../../services/dashboardService';
import { useAuthStore } from '../../store/authStore';

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-sm text-slate-950">{value || 'Not specified'}</p>
    </div>
  );
}

function getDoctorName(doctor: Record<string, unknown>): string {
  const name = typeof doctor.name === 'string' ? doctor.name : '';
  const firstName = typeof doctor.firstName === 'string' ? doctor.firstName : '';
  const lastName = typeof doctor.lastName === 'string' ? doctor.lastName : '';
  const fullName = `${name || firstName} ${lastName}`.trim();

  if (fullName) {
    return fullName;
  }

  return typeof doctor.displayName === 'string' && doctor.displayName.trim() ? doctor.displayName : String(doctor.id ?? 'Doctor');
}

export function BranchDetailsPage() {
  const { branchId } = useParams();
  const { clinicId, isClinicAdmin } = useAuthStore();
  const [branch, setBranch] = useState<ClinicBranch | null>(null);
  const [dashboard, setDashboard] = useState<Awaited<ReturnType<typeof getBranchDashboardData>> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBranchDetails = useCallback(async () => {
    if (!branchId) {
      setError('Branch id is missing.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const branchData = await getBranchById(branchId);

      if (!branchData) {
        setBranch(null);
        setDashboard(null);
        return;
      }

      if (clinicId && branchData.clinicId !== clinicId) {
        setBranch(null);
        setDashboard(null);
        setError('This branch is not available for the current clinic.');
        return;
      }

      setBranch(branchData);

      if (clinicId) {
        setDashboard(await getBranchDashboardData(clinicId, branchId));
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load branch details.');
    } finally {
      setIsLoading(false);
    }
  }, [branchId, clinicId]);

  useEffect(() => {
    void loadBranchDetails();
  }, [loadBranchDetails]);

  const requestSummary = useMemo(() => {
    if (!dashboard) {
      return [];
    }

    const counts = dashboard.requests.reduce<Record<string, number>>((accumulator, request) => {
      accumulator[request.requestType] = (accumulator[request.requestType] ?? 0) + 1;
      return accumulator;
    }, {});

    return Object.entries(counts);
  }, [dashboard]);

  if (!isClinicAdmin) {
    return <Navigate to="/home" replace />;
  }

  if (isLoading) {
    return <LoadingState label="Loading branch..." />;
  }

  if (error) {
    return <ErrorState title="Unable to load branch" description={error} actionLabel="Retry" onAction={() => void loadBranchDetails()} />;
  }

  if (!branch) {
    return <ErrorState title="Branch not found" description="The requested branch does not exist." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={branch.name}
        description={[branch.city, branch.country].filter(Boolean).join(', ') || 'Branch details'}
        actions={
          <Link to="/clinic-branches">
            <Button type="button" variant="secondary">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back
            </Button>
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Doctors" value={dashboard?.totalDoctors ?? 0} icon={Stethoscope} helperText="Assigned to this branch" />
        <StatCard label="Active doctors" value={dashboard?.activeDoctors ?? 0} icon={ShieldCheck} helperText="Currently active profiles" />
        <StatCard label="Available doctors" value={dashboard?.availableDoctors ?? 0} icon={UserRound} helperText="Ready for new requests" />
        <StatCard label="Active requests" value={dashboard?.activeRequestsCount ?? 0} icon={CalendarClock} helperText="Current request load" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap gap-2">
                <Badge tone={branch.isActive ? 'green' : 'slate'}>{branch.isActive ? 'Active' : 'Inactive'}</Badge>
                <Badge tone={branch.isMainBranch ? 'primary' : 'slate'}>{branch.isMainBranch ? 'Main branch' : 'Regular branch'}</Badge>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <DetailItem label="Address" value={branch.address} />
              <DetailItem label="City / Country" value={[branch.city, branch.country].filter(Boolean).join(', ')} />
              <DetailItem label="Opening hours" value={branch.openingHours} />
              <DetailItem label="Closing hours" value={branch.closingHours} />
              <DetailItem label="Description" value={branch.description} />
              <DetailItem label="Working days" value={branch.workingDays.join(', ')} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold text-slate-950">Related doctors</h2>
            </CardHeader>
            <CardContent>
              {dashboard?.doctors.length ? (
                <div className="space-y-3">
                  {dashboard.doctors.slice(0, 6).map((doctor) => (
                    <div key={doctor.id} className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
                      <div>
                        <p className="text-sm font-semibold text-slate-950">{getDoctorName(doctor)}</p>
                        <p className="text-sm text-slate-600">
                          {typeof doctor.specialty === 'string' && doctor.specialty.trim() ? doctor.specialty : doctor.id}
                        </p>
                      </div>
                      <Badge tone={doctor.isActive ? 'green' : 'slate'}>{doctor.isActive ? 'Active' : doctor.status ?? 'Inactive'}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No doctors assigned yet.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold text-slate-950">Contacts</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-sm font-medium text-slate-950">Phone</p>
                  <p className="text-sm text-slate-600">{branch.phone || 'Not specified'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-sm font-medium text-slate-950">Email</p>
                  <p className="text-sm text-slate-600">{branch.email || 'Not specified'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-sm font-medium text-slate-950">Website</p>
                  <p className="text-sm text-slate-600">{branch.website || 'Not specified'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold text-slate-950">Manager</h2>
            </CardHeader>
            <CardContent className="grid gap-4">
              <DetailItem label="Name" value={branch.branchManagerName} />
              <DetailItem label="Phone" value={branch.branchManagerPhone} />
              <DetailItem label="Email" value={branch.branchManagerEmail} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold text-slate-950">Related requests summary</h2>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Total requests</span>
                <span className="text-sm font-semibold text-slate-950">{dashboard?.requests.length ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Active requests</span>
                <span className="text-sm font-semibold text-slate-950">{dashboard?.activeRequestsCount ?? 0}</span>
              </div>
              {requestSummary.length ? (
                requestSummary.map(([requestType, count]) => (
                  <div key={requestType} className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">{requestType}</span>
                    <span className="text-sm font-semibold text-slate-950">{count}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No related requests yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
