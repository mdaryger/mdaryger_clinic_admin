import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';

import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { PageHeader } from '../../components/ui/PageHeader';
import { AdminUserForm } from '../../features/admin-users/AdminUserForm';
import { createAdminUser, type CreateAdminUserData } from '../../services/adminUserService';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';

export function CreateAdminUserPage() {
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
      showToast({ type: 'success', title: 'Admin user created' });
      navigate(`/admin-users/${adminUser.id}`);
    } catch (unknownError) {
      const message = unknownError instanceof Error ? unknownError.message : 'Unable to create admin user.';
      showToast({ type: 'error', title: 'Create failed', description: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create admin user"
        description="Add a clinic admin or branch admin without affecting the current session."
        actions={
          <Link to="/admin-users">
            <Button type="button" variant="secondary">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back
            </Button>
          </Link>
        }
      />

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-slate-950">Admin user profile</h2>
        </CardHeader>
        <CardContent>
          <AdminUserForm clinicId={clinicId} clinic={clinic} isSubmitting={isSubmitting} onSubmit={handleSubmit} onCancel={() => navigate('/admin-users')} />
        </CardContent>
      </Card>
    </div>
  );
}
