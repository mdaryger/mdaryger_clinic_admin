import { ArrowLeft } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';

import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { ErrorState } from '../../components/ui/ErrorState';
import { LoadingState } from '../../components/ui/LoadingState';
import { PageHeader } from '../../components/ui/PageHeader';
import { BranchForm } from '../../features/branches/BranchForm';
import { useI18n } from '../../i18n/useI18n';
import { getBranchById, getBranchesByClinicId, updateBranch, type BranchFormData, type ClinicBranch } from '../../services/branchService';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';

export function EditBranchPage() {
  const { t } = useI18n();
  const { branchId } = useParams();
  const navigate = useNavigate();
  const { clinicId, isClinicAdmin } = useAuthStore();
  const showToast = useToastStore((state) => state.showToast);
  const [branch, setBranch] = useState<ClinicBranch | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingBranchData, setPendingBranchData] = useState<BranchFormData | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const loadBranch = useCallback(async () => {
    if (!branchId) {
      setError(t('branches.missingId'));
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const branchData = await getBranchById(branchId);

      if (!branchData) {
        setBranch(null);
        return;
      }

      if (clinicId && branchData.clinicId !== clinicId) {
        setBranch(null);
        setError(t('branches.unavailableCurrentClinic'));
        return;
      }

      setBranch(branchData);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : t('branches.loadFailed'));
    } finally {
      setIsLoading(false);
    }
  }, [branchId, clinicId, t]);

  useEffect(() => {
    void loadBranch();
  }, [loadBranch]);

  if (!isClinicAdmin) {
    return <Navigate to="/home" replace />;
  }

  if (isLoading) {
    return <LoadingState label={t('branches.loadingOne')} />;
  }

  if (error) {
    return <ErrorState title={t('branches.updateFailedTitle')} description={error} actionLabel={t('common.retry')} onAction={() => void loadBranch()} />;
  }

  if (!branch || !clinicId || !branchId) {
    return <ErrorState title={t('branches.notFoundTitle')} description={t('branches.notFoundDescription')} />;
  }

  const submitBranch = async (data: BranchFormData) => {
    setIsSubmitting(true);

    try {
      await updateBranch(branchId, data);
      showToast({ type: 'success', title: t('branches.updateSuccess') });
      navigate(`/clinic-branches/${branchId}`);
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : t('branches.updateFailed');
      showToast({ type: 'error', title: t('branches.updateFailedTitle'), description: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (data: BranchFormData) => {
    if (!data.isMainBranch || branch.isMainBranch) {
      await submitBranch(data);
      return;
    }

    const branches = await getBranchesByClinicId(clinicId);
    const currentMainBranch = branches.find((item) => item.isMainBranch && item.id !== branchId);

    if (!currentMainBranch) {
      await submitBranch(data);
      return;
    }

    setPendingBranchData(data);
    setIsConfirmOpen(true);
  };

  const handleConfirmMainBranch = async () => {
    if (!pendingBranchData) {
      setIsConfirmOpen(false);
      return;
    }

    setIsConfirmOpen(false);
    const data = pendingBranchData;
    setPendingBranchData(null);
    await submitBranch(data);
  };

  const handleCancelConfirm = () => {
    setIsConfirmOpen(false);
    setPendingBranchData(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${t('branches.editTitle')}: ${branch.name}`}
        description={t('branches.editDescription')}
        actions={
          <Link to={`/clinic-branches/${branch.id}`}>
            <Button type="button" variant="secondary">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              {t('branches.back')}
            </Button>
          </Link>
        }
      />

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-slate-950">{t('branches.branchProfile')}</h2>
        </CardHeader>
        <CardContent>
          <BranchForm branch={branch} clinicId={clinicId} isSubmitting={isSubmitting} onSubmit={handleSubmit} onCancel={() => navigate(`/clinic-branches/${branch.id}`)} />
        </CardContent>
      </Card>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        title={t('branches.mainBranchConfirmTitle')}
        description={t('branches.mainBranchConfirmDescription')}
        confirmLabel={t('branches.mainBranchConfirmAction')}
        cancelLabel={t('common.cancel')}
        isLoading={isSubmitting}
        onConfirm={() => void handleConfirmMainBranch()}
        onCancel={handleCancelConfirm}
      />
    </div>
  );
}
