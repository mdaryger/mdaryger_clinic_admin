import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';

import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { PageHeader } from '../../components/ui/PageHeader';
import { DoctorForm } from '../../features/doctors/DoctorForm';
import { createDoctor, type DoctorFormData, type DoctorFiles } from '../../services/doctorService';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';

type DoctorMode = 'clinic' | 'branch';

function getDoctorMode(pathname: string): DoctorMode {
  return pathname.startsWith('/branch-doctors') ? 'branch' : 'clinic';
}

function getDoctorBasePath(mode: DoctorMode): string {
  return mode === 'clinic' ? '/clinic-doctors' : '/branch-doctors';
}

export function CreateDoctorPage() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const mode = getDoctorMode(pathname);
  const basePath = getDoctorBasePath(mode);
  const { clinic, clinicId, clinicBranchId, isClinicAdmin, isBranchAdmin } = useAuthStore();
  const showToast = useToastStore((state) => state.showToast);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if ((mode === 'clinic' && !isClinicAdmin) || (mode === 'branch' && !isBranchAdmin)) {
    return <Navigate to="/home" replace />;
  }

  if (!clinicId) {
    return <Navigate to={basePath} replace />;
  }

  const clinicName = typeof clinic?.name === 'string' ? clinic.name : '';

  async function handleSubmit(payload: { data: DoctorFormData; files: DoctorFiles; auth?: { password: string } }) {
    setIsSubmitting(true);

    try {
      const doctor = await createDoctor(
        {
          ...payload.data,
          clinicBranchId: mode === 'branch' ? clinicBranchId ?? '' : payload.data.clinicBranchId,
        },
        payload.files,
        { password: payload.auth?.password ?? '' },
      );
      showToast({ type: 'success', title: 'Doctor created' });
      navigate(`${basePath}/${doctor.id}`);
    } catch (unknownError) {
      const message = unknownError instanceof Error ? unknownError.message : 'Unable to create doctor.';
      showToast({ type: 'error', title: 'Create failed', description: message });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create doctor"
        description="Set up a doctor profile, account, and weekly schedule."
        actions={
          <Link to={basePath}>
            <Button type="button" variant="secondary">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back
            </Button>
          </Link>
        }
      />

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-slate-950">Doctor profile</h2>
        </CardHeader>
        <CardContent>
          <DoctorForm
            clinicId={clinicId}
            clinicName={clinicName}
            defaultClinicBranchId={clinicBranchId ?? undefined}
            lockClinicBranch={mode === 'branch'}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
            onCancel={() => navigate(basePath)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
