import { Download, Eye, Pencil, Plus, Power } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';

import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { DataTable, type DataTableColumn } from '../../components/ui/DataTable';
import { ErrorState } from '../../components/ui/ErrorState';
import { LoadingState } from '../../components/ui/LoadingState';
import { PageHeader } from '../../components/ui/PageHeader';
import { SearchInput } from '../../components/ui/SearchInput';
import { Select } from '../../components/ui/Select';
import { getBranchesByClinicId, type ClinicBranch } from '../../services/branchService';
import {
  getDoctorsByBranchId,
  getDoctorsByClinicId,
  updateDoctorStatus,
  type Doctor,
} from '../../services/doctorService';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { exportToCsv } from '../../utils/csvExport';
import { formatDate, formatFullName } from '../../utils/formatters';
import { matchesSearchQuery } from '../../utils/search';

type DoctorMode = 'clinic' | 'branch';

function getDoctorMode(pathname: string): DoctorMode {
  return pathname.startsWith('/branch-doctors') ? 'branch' : 'clinic';
}

function getDoctorBasePath(mode: DoctorMode): string {
  return mode === 'clinic' ? '/clinic-doctors' : '/branch-doctors';
}

export function DoctorsListPage() {
  const { pathname } = useLocation();
  const mode = getDoctorMode(pathname);
  const basePath = getDoctorBasePath(mode);
  const { clinicId, clinicBranchId, isClinicAdmin, isBranchAdmin } = useAuthStore();
  const showToast = useToastStore((state) => state.showToast);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [branches, setBranches] = useState<ClinicBranch[]>([]);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [verifiedFilter, setVerifiedFilter] = useState('all');
  const [availableFilter, setAvailableFilter] = useState('all');
  const [onlineFilter, setOnlineFilter] = useState('all');
  const [busyFilter, setBusyFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDoctors = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (mode === 'clinic') {
        if (!clinicId) {
          throw new Error('Clinic is not available for this user.');
        }

        const [doctorsData, branchesData] = await Promise.all([
          getDoctorsByClinicId(clinicId),
          getBranchesByClinicId(clinicId),
        ]);

        setDoctors(doctorsData);
        setBranches(branchesData);
      } else {
        if (!clinicBranchId) {
          throw new Error('Branch is not available for this user.');
        }

        setDoctors(await getDoctorsByBranchId(clinicBranchId));
        setBranches([]);
      }
    } catch (unknownError) {
      setError(unknownError instanceof Error ? unknownError.message : 'Unable to load doctors.');
    } finally {
      setIsLoading(false);
    }
  }, [clinicBranchId, clinicId, mode]);

  useEffect(() => {
    void loadDoctors();
  }, [loadDoctors]);

  const handleToggleActive = useCallback(async (doctor: Doctor) => {
    setIsSubmitting(true);

    try {
      await updateDoctorStatus(doctor.id, !doctor.isActive);
      showToast({ type: 'success', title: !doctor.isActive ? 'Doctor activated' : 'Doctor deactivated' });
      await loadDoctors();
    } catch (unknownError) {
      const message = unknownError instanceof Error ? unknownError.message : 'Unable to update doctor status.';
      showToast({ type: 'error', title: 'Update failed', description: message });
    } finally {
      setIsSubmitting(false);
    }
  }, [loadDoctors, showToast]);

  const filteredDoctors = useMemo(() => {
    return doctors.filter((doctor) => {
      const matchesSearch = matchesSearchQuery(
        [formatFullName(doctor), doctor.email, doctor.phone, doctor.specialist],
        search,
      );
      const matchesActive = activeFilter === 'all' || (activeFilter === 'yes' ? doctor.isActive : !doctor.isActive);
      const matchesVerified = verifiedFilter === 'all' || (verifiedFilter === 'yes' ? doctor.isVerified : !doctor.isVerified);
      const matchesAvailable = availableFilter === 'all' || (availableFilter === 'yes' ? doctor.isAvailable : !doctor.isAvailable);
      const matchesOnline = onlineFilter === 'all' || (onlineFilter === 'yes' ? doctor.isOnline : !doctor.isOnline);
      const matchesBusy = busyFilter === 'all' || (busyFilter === 'yes' ? doctor.busy : !doctor.busy);

      return matchesSearch && matchesActive && matchesVerified && matchesAvailable && matchesOnline && matchesBusy;
    });
  }, [activeFilter, availableFilter, busyFilter, doctors, onlineFilter, search, verifiedFilter]);

  const branchMap = useMemo(
    () => new Map(branches.map((branch) => [branch.id, branch.name])),
    [branches],
  );

  const columns = useMemo<DataTableColumn<Doctor>[]>(() => [
    {
      key: 'fullName',
      header: 'Full name',
      cell: (doctor) => (
        <div>
          <p className="font-semibold text-slate-950">{formatFullName(doctor)}</p>
          <p className="text-xs text-slate-500">{doctor.id}</p>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      cell: (doctor) => doctor.email || '-',
    },
    {
      key: 'phone',
      header: 'Phone',
      cell: (doctor) => doctor.phone || '-',
    },
    {
      key: 'specialist',
      header: 'Specialist',
      cell: (doctor) => doctor.specialist || '-',
    },
    {
      key: 'clinicBranch',
      header: mode === 'clinic' ? 'Clinic / branch' : 'Branch',
      cell: (doctor) =>
        mode === 'clinic'
          ? `${doctor.clinicName || '-'} / ${branchMap.get(doctor.clinicBranchId) ?? doctor.clinicBranchId ?? '-'}`
          : branchMap.get(doctor.clinicBranchId) ?? doctor.clinicBranchId ?? '-',
    },
    {
      key: 'price',
      header: 'Price',
      cell: (doctor) => doctor.price,
    },
    {
      key: 'experience',
      header: 'Experience',
      cell: (doctor) => `${doctor.experience} y`,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (doctor) => (
        <div className="flex flex-wrap gap-2">
          <Badge tone={doctor.isActive ? 'green' : 'slate'}>{doctor.isActive ? 'Active' : 'Inactive'}</Badge>
          <Badge tone={doctor.isVerified ? 'primary' : 'slate'}>{doctor.isVerified ? 'Verified' : 'Unverified'}</Badge>
          <Badge tone={doctor.isAvailable ? 'blue' : 'slate'}>{doctor.isAvailable ? 'Available' : 'Unavailable'}</Badge>
          <Badge tone={doctor.isOnline ? 'green' : 'slate'}>{doctor.isOnline ? 'Online' : 'Offline'}</Badge>
          <Badge tone={doctor.busy ? 'yellow' : 'green'}>{doctor.busy ? 'Busy' : 'Free'}</Badge>
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      cell: (doctor) => formatDate(doctor.createdAt),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      cell: (doctor) => (
        <div className="flex justify-end gap-2">
          <Link to={`${basePath}/${doctor.id}`}>
            <Button type="button" variant="secondary" size="icon" aria-label="Open doctor details">
              <Eye className="h-4 w-4" aria-hidden="true" />
            </Button>
          </Link>
          <Link to={`${basePath}/${doctor.id}/edit`}>
            <Button type="button" variant="secondary" size="icon" aria-label="Edit doctor">
              <Pencil className="h-4 w-4" aria-hidden="true" />
            </Button>
          </Link>
          <Button
            type="button"
            variant="secondary"
            size="icon"
            aria-label={doctor.isActive ? 'Deactivate doctor' : 'Activate doctor'}
            onClick={() => void handleToggleActive(doctor)}
          >
            <Power className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      ),
    },
  ], [basePath, branchMap, handleToggleActive, mode]);

  if ((mode === 'clinic' && !isClinicAdmin) || (mode === 'branch' && !isBranchAdmin)) {
    return <Navigate to="/home" replace />;
  }

  function handleExportCsv() {
    exportToCsv(
      `${mode}-doctors.csv`,
      filteredDoctors.map((doctor) => ({
        'Full Name': formatFullName(doctor),
        Email: doctor.email,
        Phone: doctor.phone,
        Specialist: doctor.specialist,
        Price: doctor.price,
        Experience: doctor.experience,
        Active: doctor.isActive ? 'Yes' : 'No',
        Verified: doctor.isVerified ? 'Yes' : 'No',
        'Created At': formatDate(doctor.createdAt),
      })),
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={mode === 'clinic' ? 'Clinic doctors' : 'Branch doctors'}
        description="Manage doctor profiles, statuses, and schedule-ready staff."
        actions={
          <>
            <Button type="button" variant="secondary" onClick={handleExportCsv} disabled={filteredDoctors.length === 0}>
              <Download className="h-4 w-4" aria-hidden="true" />
              Export CSV
            </Button>
            <Link to={`${basePath}/create`}>
              <Button type="button">
                <Plus className="h-4 w-4" aria-hidden="true" />
                Create doctor
              </Button>
            </Link>
          </>
        }
      />

      <Card>
        <CardHeader className="space-y-4">
          <SearchInput value={search} onChange={(event) => setSearch(event.target.value)} onClear={() => setSearch('')} placeholder="Search by full name, email, phone, or specialist" />
          <div className="grid gap-4 md:grid-cols-5">
            <Select value={activeFilter} onChange={(event) => setActiveFilter(event.target.value)}>
              <option value="all">All active states</option>
              <option value="yes">Active</option>
              <option value="no">Inactive</option>
            </Select>
            <Select value={verifiedFilter} onChange={(event) => setVerifiedFilter(event.target.value)}>
              <option value="all">All verification states</option>
              <option value="yes">Verified</option>
              <option value="no">Unverified</option>
            </Select>
            <Select value={availableFilter} onChange={(event) => setAvailableFilter(event.target.value)}>
              <option value="all">All availability states</option>
              <option value="yes">Available</option>
              <option value="no">Unavailable</option>
            </Select>
            <Select value={onlineFilter} onChange={(event) => setOnlineFilter(event.target.value)}>
              <option value="all">All online states</option>
              <option value="yes">Online</option>
              <option value="no">Offline</option>
            </Select>
            <Select value={busyFilter} onChange={(event) => setBusyFilter(event.target.value)}>
              <option value="all">All workload states</option>
              <option value="yes">Busy</option>
              <option value="no">Free</option>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? <LoadingState label="Loading doctors..." /> : null}
          {error ? <ErrorState title="Unable to load doctors" description={error} actionLabel="Retry" onAction={() => void loadDoctors()} /> : null}
          {!isLoading && !error ? (
            <DataTable
              columns={columns}
              data={filteredDoctors}
              getRowKey={(doctor) => doctor.id}
              emptyTitle="No doctors found"
              emptyDescription="Create a doctor or adjust the current filters."
            />
          ) : null}
          {isSubmitting && !isLoading ? <p className="mt-4 text-sm text-slate-500">Updating doctor status...</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
