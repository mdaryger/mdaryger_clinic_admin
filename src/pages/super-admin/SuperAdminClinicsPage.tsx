import { Plus } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';

import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { ErrorState } from '../../components/ui/ErrorState';
import { LoadingState } from '../../components/ui/LoadingState';
import { PageHeader } from '../../components/ui/PageHeader';
import { SearchInput } from '../../components/ui/SearchInput';
import { ClinicForm } from '../../features/clinics/ClinicForm';
import { useI18n } from '../../i18n/useI18n';
import { ClinicTable } from '../../features/clinics/ClinicTable';
import {
  createClinic,
  deleteClinic,
  getAllClinics,
  updateClinic,
} from '../../services/clinicService';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import type { Clinic, ClinicFormData } from '../../types/clinic';

type FormPayload = {
  data: ClinicFormData;
  logoFile?: File;
  coverFile?: File;
};

export function SuperAdminClinicsPage() {
  const { t } = useI18n();
  const isSuperAdmin = useAuthStore((state) => state.isSuperAdmin);
  const showToast = useToastStore((state) => state.showToast);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClinic, setEditingClinic] = useState<Clinic | null>(null);
  const [deletingClinic, setDeletingClinic] = useState<Clinic | null>(null);
  const formContainerRef = useRef<HTMLDivElement | null>(null);

  const loadClinics = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      setClinics(await getAllClinics());
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : t('superAdmin.loadClinicsFailed');
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadClinics();
  }, [loadClinics]);

  useEffect(() => {
    if (!isFormOpen) {
      return;
    }

    formContainerRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }, [isFormOpen, editingClinic]);

  const filteredClinics = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return clinics;
    }

    return clinics.filter((clinic) =>
      [clinic.name, clinic.city, clinic.phone, clinic.email].some((value) => value.toLowerCase().includes(query)),
    );
  }, [clinics, search]);

  if (!isSuperAdmin) {
    return <Navigate to="/home" replace />;
  }

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingClinic(null);
  };

  const handleSubmit = async ({ data, logoFile, coverFile }: FormPayload) => {
    setIsSubmitting(true);

    try {
      if (editingClinic) {
        await updateClinic(editingClinic.id, data, logoFile, coverFile);
        showToast({ type: 'success', title: t('superAdmin.updateSuccess') });
      } else {
        await createClinic(data, logoFile, coverFile);
        showToast({ type: 'success', title: t('superAdmin.createSuccess') });
      }

      closeForm();
      await loadClinics();
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : t('superAdmin.saveFailed');
      showToast({ type: 'error', title: t('superAdmin.saveFailed'), description: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingClinic) {
      return;
    }

    setIsSubmitting(true);

    try {
      await deleteClinic(deletingClinic.id);
      showToast({ type: 'success', title: t('superAdmin.deleteSuccess') });
      setDeletingClinic(null);
      await loadClinics();
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : t('superAdmin.deleteFailed');
      showToast({ type: 'error', title: t('superAdmin.deleteFailed'), description: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader
        title={t('superAdmin.clinicsTitle')}
        description={t('superAdmin.clinicsDescription')}
        actions={
          <Button
            type="button"
            onClick={() => {
              setEditingClinic(null);
              setIsFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t('superAdmin.createClinic')}
          </Button>
        }
      />

      {isFormOpen ? (
        <div ref={formContainerRef}>
          <Card className="mb-6">
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-950">{editingClinic ? t('superAdmin.editClinicTitle') : t('superAdmin.createClinicTitle')}</h2>
          </CardHeader>
          <CardContent>
            <ClinicForm clinic={editingClinic} isSubmitting={isSubmitting} onSubmit={handleSubmit} onCancel={closeForm} />
          </CardContent>
          </Card>
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <SearchInput value={search} onChange={(event) => setSearch(event.target.value)} onClear={() => setSearch('')} placeholder={t('superAdmin.searchClinics')} />
        </CardHeader>
        <CardContent>
          {isLoading ? <LoadingState label={t('superAdmin.loadingClinics')} /> : null}
          {error ? <ErrorState title={t('superAdmin.loadClinicsFailed')} description={error} actionLabel={t('common.retry')} onAction={() => void loadClinics()} /> : null}
          {!isLoading && !error ? (
            <ClinicTable
              clinics={filteredClinics}
              onEdit={(clinic) => {
                setEditingClinic(clinic);
                setIsFormOpen(true);
              }}
              onDelete={setDeletingClinic}
            />
          ) : null}
        </CardContent>
      </Card>

      <ConfirmDialog
        isOpen={Boolean(deletingClinic)}
        title={t('superAdmin.deleteClinic')}
        description={t('superAdmin.deleteClinicDescription', { name: deletingClinic?.name ?? t('superAdmin.clinicsTitle').toLowerCase() })}
        confirmLabel={t('superAdmin.deleteClinic')}
        isLoading={isSubmitting}
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeletingClinic(null)}
      />
    </>
  );
}
