import { ArrowLeft } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';

import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { ErrorState } from '../../components/ui/ErrorState';
import { LoadingState } from '../../components/ui/LoadingState';
import { PageHeader } from '../../components/ui/PageHeader';
import { AdminUserForm } from '../../features/admin-users/AdminUserForm';
import { useI18n } from '../../i18n/useI18n';
import { getAdminUserById, updateAdminUser, type AdminUser, type UpdateAdminUserData } from '../../services/adminUserService';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';

export function EditAdminUserPage() {
  const { t } = useI18n();
  const { userId } = useParams();
  const navigate = useNavigate();
  const { clinic, clinicId, isClinicAdmin } = useAuthStore();
  const showToast = useToastStore((state) => state.showToast);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAdminUser = useCallback(async () => {
    if (!userId) {
      setError(t('adminUsers.missingId'));
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const adminUserData = await getAdminUserById(userId);

      if (adminUserData && clinicId && adminUserData.clinicId !== clinicId) {
        setAdminUser(null);
        setError(t('adminUsers.unavailableCurrentClinic'));
        return;
      }

      setAdminUser(adminUserData);
    } catch (unknownError) {
      setError(unknownError instanceof Error ? unknownError.message : t('adminUsers.loadFailed'));
    } finally {
      setIsLoading(false);
    }
  }, [clinicId, t, userId]);

  useEffect(() => {
    void loadAdminUser();
  }, [loadAdminUser]);

  if (!isClinicAdmin) {
    return <Navigate to="/home" replace />;
  }

  if (!clinicId) {
    return <Navigate to="/admin-users" replace />;
  }

  if (isLoading) {
    return <LoadingState label={t('adminUsers.loadingOne')} />;
  }

  if (error) {
    return <ErrorState title={t('adminUsers.updateFailedTitle')} description={error} actionLabel={t('common.retry')} onAction={() => void loadAdminUser()} />;
  }

  if (!adminUser) {
    return <ErrorState title={t('adminUsers.notFoundTitle')} description={t('adminUsers.notFoundDescription')} />;
  }

  const handleSubmit = async (data: UpdateAdminUserData) => {
    setIsSubmitting(true);

    try {
      const updatedAdminUser = await updateAdminUser(adminUser.id, data);
      showToast({ type: 'success', title: t('adminUsers.updateSuccess') });
      navigate(`/admin-users/${updatedAdminUser.id}`);
    } catch (unknownError) {
      const message = unknownError instanceof Error ? unknownError.message : t('adminUsers.updateFailed');
      showToast({ type: 'error', title: t('adminUsers.updateFailedTitle'), description: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('adminUsers.editTitle')}
        description={t('adminUsers.editDescription')}
        actions={
          <Link to={`/admin-users/${adminUser.id}`}>
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
          <AdminUserForm
            clinicId={clinicId}
            clinic={clinic}
            adminUser={adminUser}
            mode="edit"
            isSubmitting={isSubmitting}
            onSubmit={(data) => handleSubmit(data as UpdateAdminUserData)}
            onCancel={() => navigate(`/admin-users/${adminUser.id}`)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
