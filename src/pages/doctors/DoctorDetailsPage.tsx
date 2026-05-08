import { ArrowLeft, ExternalLink, Mail, MapPin, Pencil, Phone, Trash2, UserCircle2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';

import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { ErrorState } from '../../components/ui/ErrorState';
import { LoadingState } from '../../components/ui/LoadingState';
import { PageHeader } from '../../components/ui/PageHeader';
import { DoctorScheduleView } from '../../features/doctors/DoctorScheduleView';
import { useI18n } from '../../i18n/useI18n';
import { getBranchById } from '../../services/branchService';
import { getCitiesByCountry, type City } from '../../services/cityService';
import { getAllCountries, type Country } from '../../services/countryService';
import { deleteDoctor, getDoctorById, type Doctor } from '../../services/doctorService';
import { getDepartmentsByDoctorType, getDepartmentDisplayName, type Department } from '../../services/departmentService';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { formatPhone } from '../../utils/formatters';

type DoctorMode = 'clinic' | 'branch';

function getDoctorMode(pathname: string): DoctorMode {
  return pathname.startsWith('/branch-doctors') ? 'branch' : 'clinic';
}

function getDoctorBasePath(mode: DoctorMode): string {
  return mode === 'clinic' ? '/clinic-doctors' : '/branch-doctors';
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-sm text-slate-950">{value}</p>
    </div>
  );
}

export function DoctorDetailsPage() {
  const { t } = useI18n();
  const { pathname } = useLocation();
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const mode = getDoctorMode(pathname);
  const basePath = getDoctorBasePath(mode);
  const { clinicId, clinicBranchId, isClinicAdmin, isBranchAdmin } = useAuthStore();
  const showToast = useToastStore((state) => state.showToast);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [department, setDepartment] = useState<Department | null>(null);
  const [country, setCountry] = useState<Country | null>(null);
  const [city, setCity] = useState<City | null>(null);
  const [branchName, setBranchName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const loadDoctor = useCallback(async () => {
    if (!doctorId) {
      setError(t('doctors.missingId'));
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
          setError(t('doctors.unavailableCurrentClinic'));
          return;
        }

        if (mode === 'branch' && clinicBranchId && doctorData.clinicBranchId !== clinicBranchId) {
          setDoctor(null);
          setError(t('doctors.unavailableCurrentBranch'));
          return;
        }
      }

      setDoctor(doctorData);

      if (!doctorData) {
        return;
      }

      const [branchesData, countries, departments] = await Promise.all([
        doctorData.clinicBranchId ? getBranchById(doctorData.clinicBranchId) : Promise.resolve(null),
        getAllCountries(),
        getDepartmentsByDoctorType(doctorData.doctorType),
      ]);

      setBranchName(branchesData?.name ?? '');
      setCountry(countries.find((item) => item.id === doctorData.countryId) ?? null);
      setDepartment(departments.find((item) => item.id === doctorData.departmentId) ?? null);

      if (doctorData.countryId) {
        const cities = await getCitiesByCountry(doctorData.countryId);
        setCity(cities.find((item) => item.id === doctorData.cityId) ?? null);
      } else {
        setCity(null);
      }
    } catch (unknownError) {
      setError(unknownError instanceof Error ? unknownError.message : t('doctors.loadFailed'));
    } finally {
      setIsLoading(false);
    }
  }, [clinicBranchId, clinicId, doctorId, mode, t]);

  useEffect(() => {
    void loadDoctor();
  }, [loadDoctor]);

  const documentLinks = useMemo(() => {
    if (!doctor) {
      return [];
    }

    return [
      { label: t('doctors.diploma'), url: doctor.diplomaUrl },
      { label: t('doctors.passport'), url: doctor.passportUrl },
      { label: t('doctors.licence'), url: doctor.licenceUrl },
      { label: t('doctors.certificate'), url: doctor.certificateUrl },
      { label: t('doctors.specialLicence'), url: doctor.specialLicenceUrl },
    ].filter((item) => item.url);
  }, [doctor, t]);

  if ((mode === 'clinic' && !isClinicAdmin) || (mode === 'branch' && !isBranchAdmin)) {
    return <Navigate to="/home" replace />;
  }

  if (isLoading) {
    return <LoadingState label={t('doctors.loadingOne')} />;
  }

  if (error) {
    return <ErrorState title={t('doctors.loadFailed')} description={error} actionLabel={t('common.retry')} onAction={() => void loadDoctor()} />;
  }

  if (!doctor) {
    return <ErrorState title={t('doctors.notFoundTitle')} description={t('doctors.notFoundDescription')} />;
  }

  const doctorName = [doctor.name, doctor.lastName, doctor.middleName].filter(Boolean).join(' ');

  async function handleDelete() {
    if (!doctorId) {
      return;
    }

    setIsDeleting(true);

    try {
      await deleteDoctor(doctorId);
      showToast({ type: 'success', title: t('doctors.deleteSuccess') });
      navigate(basePath);
    } catch (unknownError) {
      const message = unknownError instanceof Error ? unknownError.message : t('doctors.deleteFailed');
      showToast({ type: 'error', title: t('doctors.deleteFailed'), description: message });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={doctorName}
        description={doctor.specialist || t('doctors.detailsFallback')}
        actions={
          <>
            <Link to={basePath}>
              <Button type="button" variant="secondary">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                {t('doctors.back')}
              </Button>
            </Link>
            <Link to={`${basePath}/${doctor.id}/edit`}>
              <Button type="button" variant="secondary">
                <Pencil className="h-4 w-4" aria-hidden="true" />
                {t('doctors.edit')}
              </Button>
            </Link>
            <Button type="button" variant="danger" onClick={() => setIsDeleteDialogOpen(true)}>
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              {t('doctors.delete')}
            </Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center">
              {doctor.avatar ? (
                <img src={doctor.avatar} alt={doctorName} className="h-28 w-28 rounded-full object-cover" />
              ) : (
                <div className="flex h-28 w-28 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <UserCircle2 className="h-16 w-16" aria-hidden="true" />
                </div>
              )}
              <h2 className="mt-4 text-xl font-semibold text-slate-950">{doctorName}</h2>
              <p className="mt-1 text-sm text-slate-600">{doctor.specialist || '-'}</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <Badge tone={doctor.isActive ? 'green' : 'slate'}>{doctor.isActive ? t('doctors.active') : t('doctors.inactive')}</Badge>
                <Badge tone={doctor.isVerified ? 'primary' : 'slate'}>{doctor.isVerified ? t('doctors.verified') : t('doctors.unverified')}</Badge>
                <Badge tone={doctor.isOnline ? 'green' : 'slate'}>{doctor.isOnline ? t('doctors.online') : t('doctors.offline')}</Badge>
                <Badge tone={doctor.busy ? 'yellow' : 'green'}>{doctor.busy ? t('doctors.busy') : t('doctors.free')}</Badge>
                <Badge tone={doctor.isAvailable ? 'blue' : 'slate'}>{doctor.isAvailable ? t('doctors.available') : t('doctors.unavailable')}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold text-slate-950">{t('doctors.profile')}</h2>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <DetailItem label={t('doctors.department')} value={department ? getDepartmentDisplayName(department) : doctor.departmentId || t('doctors.notSpecified')} />
              <DetailItem label={t('doctors.doctorType')} value={doctor.doctorType === 'adults' ? t('doctors.doctorTypeAdults') : doctor.doctorType === 'kids' ? t('doctors.doctorTypeKids') : t('doctors.notSpecified')} />
              <DetailItem label={t('doctors.gender')} value={doctor.gender === 'male' ? t('doctors.genderMale') : doctor.gender === 'female' ? t('doctors.genderFemale') : t('doctors.genderOther')} />
              <DetailItem label={t('doctors.clinic')} value={doctor.clinicName || t('doctors.notSpecified')} />
              <DetailItem label={t('doctors.branch')} value={branchName || doctor.clinicBranchId || t('doctors.notSpecified')} />
              <DetailItem label={t('doctors.cityCountry')} value={[city?.name.ru || city?.name.en, country?.name].filter(Boolean).join(', ') || t('doctors.notSpecified')} />
              <DetailItem label={t('doctors.priceExperience')} value={`${doctor.price} ${t('doctors.somSuffix')} / ${doctor.experience} ${t('doctors.yearsSuffix')}`} />
            </CardContent>
          </Card>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <h2 className="text-base font-semibold text-slate-950">{t('doctors.contacts')}</h2>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Mail className="mt-0.5 h-4 w-4 text-slate-400" />
                  <div>
                    <p className="text-sm font-medium text-slate-950">Email</p>
                    <p className="text-sm text-slate-600">{doctor.email || t('doctors.notSpecified')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="mt-0.5 h-4 w-4 text-slate-400" />
                  <div>
                    <p className="text-sm font-medium text-slate-950">{t('doctors.phone')}</p>
                    <p className="text-sm text-slate-600">{doctor.phone ? formatPhone(doctor.phone) : t('doctors.notSpecified')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 text-slate-400" />
                  <div>
                    <p className="text-sm font-medium text-slate-950">{t('doctors.currentLocation')}</p>
                    <p className="text-sm text-slate-600">
                      {doctor.currentLocation?.latitude ?? '-'}, {doctor.currentLocation?.longitude ?? '-'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="text-base font-semibold text-slate-950">{t('doctors.metrics')}</h2>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <DetailItem label={t('doctors.balance')} value={String(doctor.balance)} />
                <DetailItem label={t('doctors.revenue')} value={String(doctor.revenue)} />
                <DetailItem label={t('doctors.averageRating')} value={String(doctor.averageRating)} />
                <DetailItem label={t('doctors.reviewCount')} value={String(doctor.reviewCount)} />
                <DetailItem label={t('doctors.serviceRadius')} value={`${doctor.serviceRadius} ${t('doctors.kmSuffix')}`} />
                <DetailItem label={t('doctors.locationTracking')} value={doctor.locationTrackingEnabled ? t('doctors.enabled') : t('doctors.disabled')} />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold text-slate-950">{t('doctors.documents')}</h2>
            </CardHeader>
            <CardContent>
              {documentLinks.length ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {documentLinks.map((documentLink) => (
                    <a
                      key={documentLink.label}
                      href={documentLink.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-primary hover:text-primary"
                    >
                      <span>{documentLink.label}</span>
                      <ExternalLink className="h-4 w-4" aria-hidden="true" />
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">{t('doctors.noDocuments')}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold text-slate-950">{t('doctors.schedule')}</h2>
            </CardHeader>
            <CardContent>
              <DoctorScheduleView weekSlots={doctor.weekSlots} />
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        title={t('doctors.deleteConfirmTitle')}
        description={t('doctors.deleteConfirmDescription', { name: doctorName })}
        confirmLabel={t('doctors.delete')}
        cancelLabel={t('common.cancel')}
        isLoading={isDeleting}
        onConfirm={() => void handleDelete()}
        onCancel={() => setIsDeleteDialogOpen(false)}
      />
    </div>
  );
}
