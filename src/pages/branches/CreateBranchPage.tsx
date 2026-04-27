import { ArrowLeft } from 'lucide-react';
import { Link, Navigate, useNavigate } from 'react-router-dom';

import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { PageHeader } from '../../components/ui/PageHeader';
import { BranchForm } from '../../features/branches/BranchForm';
import { createBranch, type BranchFormData } from '../../services/branchService';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { useState } from 'react';

export function CreateBranchPage() {
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
      showToast({ type: 'success', title: 'Branch created' });
      navigate(`/clinic-branches/${branch.id}`);
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'Unable to create branch.';
      showToast({ type: 'error', title: 'Create failed', description: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create branch"
        description="Add a new clinic branch with contact and manager details."
        actions={
          <Link to="/clinic-branches">
            <Button type="button" variant="secondary">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back
            </Button>
          </Link>
        }
      />

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-slate-950">Branch profile</h2>
        </CardHeader>
        <CardContent>
          <BranchForm clinicId={clinicId} isSubmitting={isSubmitting} onSubmit={handleSubmit} onCancel={() => navigate('/clinic-branches')} />
        </CardContent>
      </Card>
    </div>
  );
}
