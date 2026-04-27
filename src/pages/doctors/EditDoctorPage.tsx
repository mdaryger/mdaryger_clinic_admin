import { ArrowLeft } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';

import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { ErrorState } from '../../components/ui/ErrorState';
import { LoadingState } from '../../components/ui/LoadingState';
import { PageHeader } from '../../components/ui/PageHeader';
import { DoctorForm } from '../../features/doctors/DoctorForm';
import { getDoctorById, updateDoctor, type Doctor, type DoctorFiles, type DoctorFormData } from '../../services/doctorService';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';

type DoctorMode = 'clinic' | 'branch';

function getDoctorMode(pathname: string): DoctorMode {
  return pathname.startsWith('/branch-doctors') ? 'branch' : 'clinic';
}

function getDoctorBasePath(mode: DoctorMode): string {
  return mode === 'clinic' ? '/clinic-doctors' : '/branch-doctors';
}

export function EditDoctorPage() {
  const { pathname } = useLocation();
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const mode = getDoctorMode(pathname);
  const basePath = getDoctorBasePath(mode);
  const { clinic, clinicId, clinicBranchId, isClinicAdmin, isBranchAdmin } = useAuthStore();
  const showToast = useToastStore((state) => state.showToast);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDoctor = useCallback(async () => {
    if (!doctorId) {
      setError('Doctor id is missing.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const doctorData = await getDoctorById(doctorId);

      if (doctorData) {
        if (clinicId && doctorData.clinicId !== clinicId) {
          setDoctor(null);
          setError('This doctor is not available for the current clinic.');
          return;
        }

        if (mode === 'branch' && clinicBranchId && doctorData.clinicBranchId !== clinicBranchId) {
          setDoctor(null);
          setError('This doctor is not available for the current branch.');
          return;
        }
      }

      setDoctor(doctorData);
    } catch (unknownError) {
      setError(unknownError instanceof Error ? unknownError.message : 'Unable to load doctor.');
    } finally {
      setIsLoading(false);
    }
  }, [clinicBranchId, clinicId, doctorId, mode]);

  useEffect(() => {
    void loadDoctor();
  }, [loadDoctor]);

  if ((mode === 'clinic' && !isClinicAdmin) || (mode === 'branch' && !isBranchAdmin)) {
    return <Navigate to="/home" replace />;
  }

  if (isLoading) {
    return <LoadingState label="Loading doctor..." />;
  }

  if (error) {
    return <ErrorState title="Unable to load doctor" description={error} actionLabel="Retry" onAction={() => void loadDoctor()} />;
  }

  if (!doctor || !clinicId) {
    return <ErrorState title="Doctor not found" description="The requested doctor does not exist." />;
  }

  const doctorName = [doctor.name, doctor.lastName].filter(Boolean).join(' ');
  const clinicName = typeof clinic?.name === 'string' ? clinic.name : doctor.clinicName;
  const doctorBranchId = doctor.clinicBranchId;

  async function handleSubmit(payload: { data: DoctorFormData; files: DoctorFiles }) {
    if (!doctorId) {
      return;
    }

    setIsSubmitting(true);

    try {
      await updateDoctor(
        doctorId,
        {
          ...payload.data,
          clinicBranchId: mode === 'branch' ? clinicBranchId ?? doctorBranchId : payload.data.clinicBranchId,
        },
        payload.files,
      );
      showToast({ type: 'success', title: 'Doctor updated' });
      navigate(`${basePath}/${doctorId}`);
    } catch (unknownError) {
      const message = unknownError instanceof Error ? unknownError.message : 'Unable to update doctor.';
      showToast({ type: 'error', title: 'Update failed', description: message });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit ${doctorName}`}
        description="Update doctor profile data and replace supporting documents if needed."
        actions={
          <Link to={`${basePath}/${doctor.id}`}>
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
            doctor={doctor}
            clinicId={clinicId}
            clinicName={clinicName}
            defaultClinicBranchId={clinicBranchId ?? undefined}
            lockClinicBranch={mode === 'branch'}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
            onCancel={() => navigate(`${basePath}/${doctor.id}`)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
