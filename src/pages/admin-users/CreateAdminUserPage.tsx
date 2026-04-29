import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';

import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { PageHeader } from '../../components/ui/PageHeader';
import { AdminUserForm } from '../../features/admin-users/AdminUserForm';
import { useI18n } from '../../i18n/useI18n';
import { createAdminUser, type CreateAdminUserData } from '../../services/adminUserService';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';

export function CreateAdminUserPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { clinic, clinicId, isClinicAdmin } = useAuthStore();
  const showToast = useToastStore((state) => state.showToast);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isClinicAdmin) {
    return <Navigate to="/home" replace />;
  }

  if (!clinicId) {
    return <Navigate to="/admin-users" replace />;
  }

  const handleSubmit = async (data: CreateAdminUserData) => {
    setIsSubmitting(true);

    try {
      const adminUser = await createAdminUser(data);
      showToast({ type: 'success', title: t('adminUsers.createSuccess') });
      navigate(`/admin-users/${adminUser.id}`);
    } catch (unknownError) {
      const message = unknownError instanceof Error ? unknownError.message : t('adminUsers.createFailed');
      showToast({ type: 'error', title: t('adminUsers.createFailedTitle'), description: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('adminUsers.createTitle')}
        description={t('adminUsers.createDescription')}
        actions={
          <Link to="/admin-users">
            <Button type="button" variant="secondary">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              {t('adminUsers.back')}
            </Button>
          </Link>
        }
      />

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-slate-950">{t('adminUsers.profileTitle')}</h2>
        </CardHeader>
        <CardContent>
          <AdminUserForm clinicId={clinicId} clinic={clinic} isSubmitting={isSubmitting} onSubmit={handleSubmit} onCancel={() => navigate('/admin-users')} />
        </CardContent>
      </Card>
    </div>
  );
}
