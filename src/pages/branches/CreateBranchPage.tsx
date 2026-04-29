import { ArrowLeft } from 'lucide-react';
import { Link, Navigate, useNavigate } from 'react-router-dom';

import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { PageHeader } from '../../components/ui/PageHeader';
import { BranchForm } from '../../features/branches/BranchForm';
import { useI18n } from '../../i18n/useI18n';
import { createBranch, type BranchFormData } from '../../services/branchService';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { useState } from 'react';

export function CreateBranchPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { clinicId, isClinicAdmin } = useAuthStore();
  const showToast = useToastStore((state) => state.showToast);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isClinicAdmin) {
    return <Navigate to="/home" replace />;
  }

  if (!clinicId) {
    return <Navigate to="/clinic-branches" replace />;
  }

  const handleSubmit = async (data: BranchFormData) => {
    setIsSubmitting(true);

    try {
      const branch = await createBranch({
        ...data,
        clinicId,
        isActive: true,
      });
      showToast({ type: 'success', title: t('branches.createSuccess') });
      navigate(`/clinic-branches/${branch.id}`);
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : t('branches.createFailed');
      showToast({ type: 'error', title: t('branches.createFailedTitle'), description: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('branches.createTitle')}
        description={t('branches.createDescription')}
        actions={
          <Link to="/clinic-branches">
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
          <BranchForm clinicId={clinicId} isSubmitting={isSubmitting} onSubmit={handleSubmit} onCancel={() => navigate('/clinic-branches')} />
        </CardContent>
      </Card>
    </div>
  );
}
