import { Pencil } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { ErrorState } from '../../components/ui/ErrorState';
import { LoadingState } from '../../components/ui/LoadingState';
import { PageHeader } from '../../components/ui/PageHeader';
import { BranchForm } from '../../features/branches/BranchForm';
import { useI18n } from '../../i18n/useI18n';
import { getBranchById, updateBranch, type BranchFormData, type ClinicBranch } from '../../services/branchService';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';

function booleanTone(value: boolean): 'green' | 'slate' {
  return value ? 'green' : 'slate';
}

function DetailItem({ label, value }: { label: string; value: string }) {
  const { t } = useI18n();

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm text-slate-950">{value || t('settings.notSpecified')}</p>
    </div>
  );
}

export function BranchSettingsPage() {
  const { t } = useI18n();
  const { clinicId, clinicBranchId, isBranchAdmin } = useAuthStore();
  const showToast = useToastStore((state) => state.showToast);
  const [branch, setBranch] = useState<ClinicBranch | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBranch = useCallback(async () => {
    if (!clinicBranchId) {
      setBranch(null);
      setError(t('dashboard.branchUnavailable'));
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const branchData = await getBranchById(clinicBranchId);

      if (!branchData) {
        setBranch(null);
        setError(t('branches.notFoundDescription'));
        return;
      }

      setBranch(branchData);
    } catch (loadError) {
      setBranch(null);
      setError(loadError instanceof Error ? loadError.message : t('settings.branchSaveFailed'));
    } finally {
      setIsLoading(false);
    }
  }, [clinicBranchId, t]);

  useEffect(() => {
    void loadBranch();
  }, [loadBranch]);

  if (!isBranchAdmin) {
    return <Navigate to="/home" replace />;
  }

  if (!clinicId) {
    return <Navigate to="/branch-overview" replace />;
  }

  if (isLoading) {
    return <LoadingState label={t('branches.loadingOne')} />;
  }

  if (error) {
    return (
      <ErrorState
        title={t('settings.saveFailedTitle')}
        description={error}
        actionLabel={t('common.retry')}
        onAction={() => void loadBranch()}
      />
    );
  }

  if (!branch) {
    return <ErrorState title={t('branches.notFoundTitle')} description={t('branches.notFoundDescription')} />;
  }

  const handleSave = async (data: BranchFormData) => {
    setIsSubmitting(true);

    try {
      await updateBranch(branch.id, data);
      await loadBranch();
      setIsEditing(false);
      showToast({ type: 'success', title: t('settings.branchSaved') });
    } catch (unknownError) {
      const message = unknownError instanceof Error ? unknownError.message : t('settings.branchSaveFailed');
      showToast({ type: 'error', title: t('settings.saveFailedTitle'), description: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('settings.pageTitle')}
        description={t('settings.branchPageDescription')}
        actions={
          !isEditing ? (
            <Button type="button" onClick={() => setIsEditing(true)}>
              <Pencil className="h-4 w-4" aria-hidden="true" />
              {t('settings.edit')}
            </Button>
          ) : null
        }
      />

      {isEditing ? (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-950">{t('settings.branchProfile')}</h2>
          </CardHeader>
          <CardContent>
            <BranchForm
              branch={branch}
              clinicId={clinicId}
              isSubmitting={isSubmitting}
              onSubmit={handleSave}
              onCancel={() => setIsEditing(false)}
              showMainBranchOption={false}
            />
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <div className="flex flex-wrap gap-2">
                <Badge tone={booleanTone(branch.isActive)}>{branch.isActive ? t('branches.activeBadge') : t('branches.inactiveBadge')}</Badge>
                {'isVerified' in branch && typeof branch.isVerified === 'boolean' ? (
                  <Badge tone={branch.isVerified ? 'primary' : 'yellow'}>
                    {branch.isVerified ? t('clinicOverview.verified') : t('clinicOverview.unverified')}
                  </Badge>
                ) : null}
              </div>
            </CardHeader>
            <CardContent className="grid gap-5 sm:grid-cols-2">
              <DetailItem label={t('settings.name')} value={branch.name} />
              <DetailItem label={t('settings.phone')} value={branch.phone} />
              <DetailItem label={t('settings.address')} value={branch.address} />
              <DetailItem
                label={t('settings.workingHours')}
                value={branch.isAroundTheClock ? t('branches.aroundTheClock') : [branch.openingHours, branch.closingHours].filter(Boolean).join(' - ')}
              />
              <DetailItem label={t('settings.email')} value={branch.email} />
              <DetailItem label={t('settings.website')} value={branch.website} />
              <div className="sm:col-span-2">
                <DetailItem label={t('settings.description')} value={branch.description} />
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <h2 className="text-base font-semibold text-slate-950">{t('settings.contactPerson')}</h2>
              </CardHeader>
              <CardContent className="grid gap-5 sm:grid-cols-2">
                <DetailItem label={t('settings.name')} value={branch.branchManagerName} />
                <DetailItem label={t('settings.phone')} value={branch.branchManagerPhone} />
                <DetailItem label={t('settings.email')} value={branch.branchManagerEmail} />
                <DetailItem label={t('branches.cityCountry')} value={[branch.city, branch.country].filter(Boolean).join(', ')} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="text-base font-semibold text-slate-950">{t('settings.capabilities')}</h2>
              </CardHeader>
              <CardContent className="space-y-4">
                <DetailItem
                  label={t('branches.mainBranch')}
                  value={branch.isMainBranch ? t('branches.mainBadge') : t('branches.regularBadge')}
                />
                <DetailItem
                  label={t('branches.aroundTheClock')}
                  value={branch.isAroundTheClock ? t('settings.enabled') : t('settings.disabled')}
                />
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
