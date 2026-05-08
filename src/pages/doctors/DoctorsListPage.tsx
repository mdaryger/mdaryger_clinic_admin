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
import { useI18n } from '../../i18n/useI18n';
import { getBranchById, getBranchesByClinicId, type ClinicBranch } from '../../services/branchService';
import {
  getDoctorsByBranchId,
  getDoctorsByClinicId,
  updateDoctorStatus,
  type Doctor,
} from '../../services/doctorService';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { exportToCsv } from '../../utils/csvExport';
import { formatDate, formatFullName, formatPhone } from '../../utils/formatters';
import { matchesSearchQuery } from '../../utils/search';

type DoctorMode = 'clinic' | 'branch';

function getDoctorMode(pathname: string): DoctorMode {
  return pathname.startsWith('/branch-doctors') ? 'branch' : 'clinic';
}

function getDoctorBasePath(mode: DoctorMode): string {
  return mode === 'clinic' ? '/clinic-doctors' : '/branch-doctors';
}

export function DoctorsListPage() {
  const { t } = useI18n();
  const { pathname } = useLocation();
  const mode = getDoctorMode(pathname);
  const basePath = getDoctorBasePath(mode);
  const { clinicId, clinicBranchId, isClinicAdmin, isBranchAdmin } = useAuthStore();
  const showToast = useToastStore((state) => state.showToast);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [branches, setBranches] = useState<ClinicBranch[]>([]);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
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
          throw new Error(t('dashboard.branchUnavailable'));
        }

        const [doctorsData, branchData] = await Promise.all([
          getDoctorsByBranchId(clinicBranchId),
          getBranchById(clinicBranchId),
        ]);

        setDoctors(doctorsData);
        setBranches(branchData ? [branchData] : []);
      }
    } catch (unknownError) {
      setError(unknownError instanceof Error ? unknownError.message : t('doctors.loadListFailed'));
    } finally {
      setIsLoading(false);
    }
  }, [clinicBranchId, clinicId, mode, t]);

  useEffect(() => {
    void loadDoctors();
  }, [loadDoctors]);

  const handleToggleActive = useCallback(async (doctor: Doctor) => {
    setIsSubmitting(true);

    try {
      await updateDoctorStatus(doctor.id, !doctor.isActive);
      showToast({ type: 'success', title: !doctor.isActive ? t('doctors.activateDoctor') : t('doctors.deactivateDoctor') });
      await loadDoctors();
    } catch (unknownError) {
      const message = unknownError instanceof Error ? unknownError.message : t('doctors.updateFailed');
      showToast({ type: 'error', title: t('doctors.updateFailed'), description: message });
    } finally {
      setIsSubmitting(false);
    }
  }, [loadDoctors, showToast, t]);

  const filteredDoctors = useMemo(() => {
    return doctors.filter((doctor) => {
      const matchesSearch = matchesSearchQuery(
        [formatFullName(doctor), doctor.email, doctor.phone, doctor.specialist],
        search,
      );
      const matchesActive = activeFilter === 'all' || (activeFilter === 'yes' ? doctor.isActive : !doctor.isActive);
      const matchesBusy = busyFilter === 'all' || (busyFilter === 'yes' ? doctor.busy : !doctor.busy);

      return matchesSearch && matchesActive && matchesBusy;
    });
  }, [activeFilter, busyFilter, doctors, search]);

  const branchMap = useMemo(
    () => new Map(branches.map((branch) => [branch.id, branch.name])),
    [branches],
  );

  const columns = useMemo<DataTableColumn<Doctor>[]>(() => [
    {
      key: 'doctor',
      header: t('doctors.doctor'),
      className: 'min-w-[240px]',
      cell: (doctor) => (
        <div className="space-y-1">
          <p className="font-semibold text-slate-950">{formatFullName(doctor)}</p>
          <p className="text-sm text-slate-600">{doctor.specialist || '-'}</p>
        </div>
      ),
    },
    {
      key: 'contacts',
      header: t('doctors.contacts'),
      className: 'min-w-[220px]',
      cell: (doctor) => (
        <div className="space-y-1">
          <p className="text-sm text-slate-900">{doctor.email || '-'}</p>
          <p className="whitespace-nowrap text-sm text-slate-600">{formatPhone(doctor.phone)}</p>
        </div>
      ),
    },
    {
      key: 'clinicBranch',
      header: mode === 'clinic' ? t('doctors.clinicBranch') : t('doctors.branch'),
      className: 'min-w-[190px]',
      cell: (doctor) => {
        const branchLabel = branchMap.get(doctor.clinicBranchId) ?? doctor.clinicBranchId ?? '';

        return mode === 'clinic' ? (
          <div className="space-y-1">
            <p className="font-medium text-slate-900">{doctor.clinicName || t('doctors.notSpecified')}</p>
            <p className="text-sm text-slate-600">{branchLabel || t('doctors.notSpecified')}</p>
          </div>
        ) : (
          <span>{branchLabel || t('doctors.notSpecified')}</span>
        );
      },
    },
    {
      key: 'workInfo',
      header: t('doctors.priceExperience'),
      className: 'min-w-[150px]',
      cell: (doctor) => (
        <div className="space-y-1">
          <p className="font-medium text-slate-900">{doctor.price} {t('doctors.somSuffix')}</p>
          <p className="text-sm text-slate-600">{doctor.experience} {t('doctors.yearsSuffix')}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: t('doctors.status'),
      className: 'min-w-[220px]',
      cell: (doctor) => (
        <div className="grid gap-2 sm:grid-cols-2">
          <Badge tone={doctor.isActive ? 'green' : 'slate'}>{doctor.isActive ? t('doctors.active') : t('doctors.inactive')}</Badge>
          <Badge tone={doctor.busy ? 'yellow' : 'green'}>{doctor.busy ? t('doctors.busy') : t('doctors.free')}</Badge>
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: t('doctors.created'),
      className: 'min-w-[140px] whitespace-nowrap',
      cell: (doctor) => formatDate(doctor.createdAt),
    },
    {
      key: 'actions',
      header: t('doctors.actions'),
      className: 'min-w-[150px] text-right',
      cell: (doctor) => (
        <div className="flex justify-end gap-2">
          <Link to={`${basePath}/${doctor.id}`}>
            <Button type="button" variant="secondary" size="icon" aria-label={t('doctors.openDoctor')}>
              <Eye className="h-4 w-4" aria-hidden="true" />
            </Button>
          </Link>
          <Link to={`${basePath}/${doctor.id}/edit`}>
            <Button type="button" variant="secondary" size="icon" aria-label={t('doctors.editDoctor')}>
              <Pencil className="h-4 w-4" aria-hidden="true" />
            </Button>
          </Link>
          <Button
            type="button"
            variant="secondary"
            size="icon"
            aria-label={doctor.isActive ? t('doctors.deactivateDoctor') : t('doctors.activateDoctor')}
            onClick={() => void handleToggleActive(doctor)}
          >
            <Power className="h-4 w-4 text-red-500" aria-hidden="true" />
          </Button>
        </div>
      ),
    },
  ], [basePath, branchMap, handleToggleActive, mode, t]);

  if ((mode === 'clinic' && !isClinicAdmin) || (mode === 'branch' && !isBranchAdmin)) {
    return <Navigate to="/home" replace />;
  }

  function handleExportCsv() {
    exportToCsv(
      `${mode}-doctors.csv`,
      filteredDoctors.map((doctor) => ({
        'ФИО': formatFullName(doctor),
        'Email': doctor.email,
        'Телефон': doctor.phone,
        'Специалист': doctor.specialist,
        'Тип врача': doctor.doctorType === 'adults' ? 'Взрослые' : 'Дети',
        'Клиника': doctor.clinicName,
        'Филиал': branchMap.get(doctor.clinicBranchId) ?? '',
        'Цена (сом)': String(Math.round(doctor.price)),
        'Опыт (лет)': String(Math.round(doctor.experience)),
        'Активен': doctor.isActive ? 'Да' : 'Нет',
        'Проверен': doctor.isVerified ? 'Да' : 'Нет',
        'Онлайн': doctor.isOnline ? 'Да' : 'Нет',
        'Свободен': doctor.busy ? 'Нет' : 'Да',
        'Дата создания': formatDate(doctor.createdAt),
      })),
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={mode === 'clinic' ? t('doctors.pageTitle') : t('doctors.branchPageTitle')}
        actions={
          <>
            <Button type="button" variant="secondary" onClick={handleExportCsv} disabled={filteredDoctors.length === 0}>
              <Download className="h-4 w-4" aria-hidden="true" />
              {t('doctors.export')}
            </Button>
            <Link to={`${basePath}/create`}>
              <Button type="button">
                <Plus className="h-4 w-4" aria-hidden="true" />
                {t('doctors.create')}
              </Button>
            </Link>
          </>
        }
      />

      <Card>
        <CardHeader className="space-y-4">
          <SearchInput value={search} onChange={(event) => setSearch(event.target.value)} onClear={() => setSearch('')} placeholder={t('doctors.searchPlaceholder')} />
          <div className="grid gap-4 md:grid-cols-5">
            <Select value={activeFilter} onChange={(event) => setActiveFilter(event.target.value)}>
              <option value="all">{t('doctors.activeFilter')}</option>
              <option value="yes">{t('doctors.activeYes')}</option>
              <option value="no">{t('doctors.activeNo')}</option>
            </Select>
            <Select value={busyFilter} onChange={(event) => setBusyFilter(event.target.value)}>
              <option value="all">{t('doctors.busyFilter')}</option>
              <option value="yes">{t('doctors.busyYes')}</option>
              <option value="no">{t('doctors.busyNo')}</option>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? <LoadingState label={t('doctors.loadingMany')} /> : null}
          {error ? <ErrorState title={t('doctors.loadListFailed')} description={error} actionLabel={t('common.retry')} onAction={() => void loadDoctors()} /> : null}
          {!isLoading && !error ? (
            <DataTable
              columns={columns}
              data={filteredDoctors}
              getRowKey={(doctor) => doctor.id}
              emptyTitle={t('doctors.emptyTitle')}
              emptyDescription={t('doctors.emptyDescription')}
            />
          ) : null}
          {isSubmitting && !isLoading ? <p className="mt-4 text-sm text-slate-500">{t('doctors.updatingStatus')}</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
