import { Download, Plus } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';

import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { ErrorState } from '../../components/ui/ErrorState';
import { LoadingState } from '../../components/ui/LoadingState';
import { PageHeader } from '../../components/ui/PageHeader';
import { SearchInput } from '../../components/ui/SearchInput';
import { Select } from '../../components/ui/Select';
import { BranchTable } from '../../features/branches/BranchTable';
import { useI18n } from '../../i18n/useI18n';
import {
  getBranchesByClinicId,
  updateBranchStatus,
  type ClinicBranch,
} from '../../services/branchService';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { exportToCsv } from '../../utils/csvExport';
import { formatDate } from '../../utils/formatters';
import { matchesSearchQuery } from '../../utils/search';

export function ClinicBranchesPage() {
  const { t } = useI18n();
  const { clinicId, isClinicAdmin } = useAuthStore();
  const showToast = useToastStore((state) => state.showToast);
  const [branches, setBranches] = useState<ClinicBranch[]>([]);
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('all');
  const [activeFilter, setActiveFilter] = useState('all');
  const [mainBranchFilter, setMainBranchFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBranches = useCallback(async () => {
    if (!clinicId) {
      setBranches([]);
      setError(t('branches.clinicUnavailable'));
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      setBranches(await getBranchesByClinicId(clinicId));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : t('branches.loadFailed'));
    } finally {
      setIsLoading(false);
    }
  }, [clinicId, t]);

  useEffect(() => {
    void loadBranches();
  }, [loadBranches]);

  const cityOptions = useMemo(() => {
    return Array.from(new Set(branches.map((branch) => branch.city).filter(Boolean))).sort((left, right) => left.localeCompare(right));
  }, [branches]);

  const filteredBranches = useMemo(() => {
    return branches.filter((branch) => {
      const matchesQuery = matchesSearchQuery([branch.name, branch.address, branch.phone, branch.city], search);
      const matchesCity = cityFilter === 'all' || branch.city === cityFilter;
      const matchesActive =
        activeFilter === 'all' ||
        (activeFilter === 'active' && branch.isActive) ||
        (activeFilter === 'inactive' && !branch.isActive);
      const matchesMainBranch =
        mainBranchFilter === 'all' ||
        (mainBranchFilter === 'main' && branch.isMainBranch) ||
        (mainBranchFilter === 'regular' && !branch.isMainBranch);

      return matchesQuery && matchesCity && matchesActive && matchesMainBranch;
    });
  }, [activeFilter, branches, cityFilter, mainBranchFilter, search]);

  if (!isClinicAdmin) {
    return <Navigate to="/home" replace />;
  }

  const handleToggleActive = async (branch: ClinicBranch) => {
    setIsSubmitting(true);

    try {
      await updateBranchStatus(branch.id, !branch.isActive);
      showToast({
        type: 'success',
        title: !branch.isActive ? t('branches.activated') : t('branches.deactivated'),
      });
      await loadBranches();
    } catch (toggleError) {
      const message = toggleError instanceof Error ? toggleError.message : t('branches.updateFailed');
      showToast({ type: 'error', title: t('branches.updateFailed'), description: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const exportBranches = () => {
    exportToCsv(
      'clinic-branches.csv',
      filteredBranches.map((branch) => ({
        Name: branch.name,
        City: branch.city,
        Address: branch.address,
        Phone: branch.phone,
        Active: branch.isActive ? 'Yes' : 'No',
        'Main Branch': branch.isMainBranch ? 'Yes' : 'No',
        'Created At': formatDate(branch.createdAt),
      })),
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('branches.pageTitle')}
        description={t('branches.pageDescription')}
        actions={
          <>
            <Button type="button" variant="secondary" onClick={exportBranches} disabled={filteredBranches.length === 0}>
              <Download className="h-4 w-4" aria-hidden="true" />
              {t('branches.export')}
            </Button>
            <Link to="/clinic-branches/create">
              <Button type="button">
                <Plus className="h-4 w-4" aria-hidden="true" />
                {t('branches.create')}
              </Button>
            </Link>
          </>
        }
      />

      <Card>
        <CardHeader className="space-y-4">
          <SearchInput
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onClear={() => setSearch('')}
            placeholder={t('branches.searchPlaceholder')}
          />
          <div className="grid gap-4 md:grid-cols-3">
            <Select value={cityFilter} onChange={(event) => setCityFilter(event.target.value)}>
              <option value="all">{t('branches.allCities')}</option>
              {cityOptions.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </Select>
            <Select value={activeFilter} onChange={(event) => setActiveFilter(event.target.value)}>
              <option value="all">{t('branches.allStatuses')}</option>
              <option value="active">{t('branches.activeOnly')}</option>
              <option value="inactive">{t('branches.inactiveOnly')}</option>
            </Select>
            <Select value={mainBranchFilter} onChange={(event) => setMainBranchFilter(event.target.value)}>
              <option value="all">{t('branches.allBranches')}</option>
              <option value="main">{t('branches.mainOnly')}</option>
              <option value="regular">{t('branches.regularOnly')}</option>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? <LoadingState label={t('branches.loading')} /> : null}
          {error ? <ErrorState title={t('branches.loadFailed')} description={error} actionLabel={t('branches.retry')} onAction={() => void loadBranches()} /> : null}
          {!isLoading && !error ? <BranchTable branches={filteredBranches} onToggleActive={(branch) => void handleToggleActive(branch)} /> : null}
          {isSubmitting && !isLoading ? <p className="mt-4 text-sm text-slate-500">{t('branches.updatingStatus')}</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
