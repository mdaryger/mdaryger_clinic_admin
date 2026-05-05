import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { useBranches } from '../../hooks/useBranches';
import { useCities } from '../../hooks/useCities';
import { useCountries } from '../../hooks/useCountries';
import { useDepartments } from '../../hooks/useDepartments';
import { useI18n } from '../../i18n/useI18n';
import { createDoctorSchema, type DoctorSchemaValues } from '../../lib/validation/doctorSchema';
import {
  createDefaultWeekSlots,
  type Doctor,
  type DoctorAuthData,
  type DoctorFiles,
  type DoctorFormData,
  type DoctorType,
  type Gender,
} from '../../services/doctorService';
import { DoctorScheduleEditor } from './DoctorScheduleEditor';

type DoctorFormSubmitPayload = {
  data: DoctorFormData;
  files: DoctorFiles;
  auth?: DoctorAuthData;
};

type DoctorFormProps = {
  doctor?: Doctor | null;
  clinicId: string;
  clinicName: string;
  defaultClinicBranchId?: string;
  lockClinicBranch?: boolean;
  isSubmitting?: boolean;
  onSubmit: (payload: DoctorFormSubmitPayload) => Promise<void> | void;
  onCancel?: () => void;
};

function getDefaultValues(doctor?: Doctor | null, defaultClinicBranchId?: string): DoctorSchemaValues {
  return {
    name: doctor?.name ?? '',
    lastName: doctor?.lastName ?? '',
    middleName: doctor?.middleName ?? '',
    email: doctor?.email ?? '',
    phone: doctor?.phone ?? '',
    gender: (doctor?.gender ?? 'male') as Gender,
    clinicBranchId: doctor?.clinicBranchId ?? defaultClinicBranchId ?? '',
    departmentId: doctor?.departmentId ?? '',
    countryId: doctor?.countryId ?? '',
    cityId: doctor?.cityId ?? '',
    districtId: doctor?.districtId ?? '',
    specialist: doctor?.specialist ?? '',
    registrationNumber: doctor?.registrationNumber ?? '',
    workPlace: doctor?.workPlace ?? '',
    experience: doctor?.experience ?? 0,
    price: doctor?.price ?? 0,
    doctorType: (doctor?.doctorType ?? 'adults') as DoctorType,
    avatar: doctor?.avatar ?? '',
    aboutMe: doctor?.aboutMe ?? '',
    currentLatitude: doctor?.currentLocation?.latitude ?? null,
    currentLongitude: doctor?.currentLocation?.longitude ?? null,
    locationTrackingEnabled: doctor?.locationTrackingEnabled ?? false,
    serviceRadius: doctor?.serviceRadius ?? 0,
    isVerified: doctor?.isVerified ?? false,
    isActive: doctor?.isActive ?? true,
    busy: doctor?.busy ?? false,
    isOnline: doctor?.isOnline ?? false,
    isAvailable: doctor?.isAvailable ?? true,
    balance: doctor?.balance ?? 0,
    revenue: doctor?.revenue ?? 0,
    averageRating: doctor?.averageRating ?? 0,
    reviewCount: doctor?.reviewCount ?? 0,
    password: '',
    confirmPassword: '',
    weekSlots: doctor?.weekSlots ?? createDefaultWeekSlots(),
    diplomaFile: undefined,
    passportFile: undefined,
    certificateFile: undefined,
    specialLicenceFile: undefined,
  };
}

export function DoctorForm({
  doctor,
  clinicId,
  clinicName,
  defaultClinicBranchId,
  lockClinicBranch = false,
  isSubmitting = false,
  onSubmit,
  onCancel,
}: DoctorFormProps) {
  const { t } = useI18n();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const { countries, loading: countriesLoading } = useCountries(true);
  const isCreateMode = !doctor;
  const requireClinicBranch = false;
  const doctorSchema = useMemo(
    () => createDoctorSchema({ isCreate: isCreateMode, requireClinicBranch }),
    [isCreateMode, requireClinicBranch],
  );
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<DoctorSchemaValues>({
    resolver: zodResolver(doctorSchema),
    defaultValues: getDefaultValues(doctor, defaultClinicBranchId),
  });
  const selectedCountryId = watch('countryId');
  const selectedDoctorType = watch('doctorType');
  const selectedCityId = watch('cityId');
  const selectedDepartmentId = watch('departmentId');
  const { cities, loading: citiesLoading } = useCities(selectedCountryId);
  const { departments, loading: departmentsLoading } = useDepartments(selectedDoctorType);
  const { branches, loading: branchesLoading } = useBranches(clinicId);

  useEffect(() => {
    if (!countries.length || selectedCountryId) {
      return;
    }

    const kyrgyzstan = countries.find((country) => {
      const normalizedName = country.name.trim().toLowerCase();

      return normalizedName === 'kyrgyzstan' || normalizedName === 'кыргызстан';
    });

    if (kyrgyzstan) {
      setValue('countryId', kyrgyzstan.id, { shouldValidate: true });
    }
  }, [countries, selectedCountryId, setValue]);

  useEffect(() => {
    if (citiesLoading) return;
    const currentCityExists = cities.some((city) => city.id === selectedCityId);

    if (selectedCityId && !currentCityExists) {
      setValue('cityId', '');
    }
  }, [cities, citiesLoading, selectedCityId, setValue]);

  useEffect(() => {
    if (departmentsLoading) return;
    const currentDepartmentExists = departments.some((department) => department.id === selectedDepartmentId);

    if (selectedDepartmentId && !currentDepartmentExists) {
      setValue('departmentId', '');
      setValue('specialist', '');
    }
  }, [departments, departmentsLoading, selectedDepartmentId, setValue]);

  const submitForm = (values: DoctorSchemaValues) => {
    const payload: DoctorFormSubmitPayload = {
      data: {
        name: values.name,
        lastName: values.lastName,
        middleName: values.middleName ?? '',
        email: values.email,
        phone: values.phone,
        gender: values.gender,
        clinicId,
        clinicName,
        clinicBranchId: lockClinicBranch ? defaultClinicBranchId ?? doctor?.clinicBranchId ?? '' : values.clinicBranchId ?? '',
        departmentId: values.departmentId,
        cityId: values.cityId,
        countryId: values.countryId,
        districtId: values.districtId ?? '',
        specialist: values.specialist,
        registrationNumber: values.registrationNumber ?? '',
        workPlace: values.workPlace ?? '',
        experience: values.experience,
        price: values.price,
        doctorType: values.doctorType,
        avatar: values.avatar ?? '',
        aboutMe: values.aboutMe ?? '',
        currentLocation: {
          latitude: values.currentLatitude,
          longitude: values.currentLongitude,
        },
        locationTrackingEnabled: values.locationTrackingEnabled,
        serviceRadius: values.serviceRadius,
        isVerified: values.isVerified,
        isActive: values.isActive,
        busy: values.busy,
        isOnline: values.isOnline,
        isAvailable: values.isAvailable,
        balance: values.balance,
        revenue: values.revenue,
        averageRating: values.averageRating,
        reviewCount: values.reviewCount,
        diplomaUrl: doctor?.diplomaUrl ?? '',
        licenceUrl: doctor?.licenceUrl ?? '',
        passportUrl: doctor?.passportUrl ?? '',
        certificateUrl: doctor?.certificateUrl ?? '',
        specialLicenceUrl: doctor?.specialLicenceUrl ?? '',
        weekSlots: values.weekSlots as DoctorFormData['weekSlots'],
      },
      files: {
        diplomaFile: values.diplomaFile,
        passportFile: values.passportFile,
        certificateFile: values.certificateFile,
        specialLicenceFile: values.specialLicenceFile,
      },
    };

    if (!doctor) {
      payload.auth = {
        password: values.password || '',
      };
    }

    void onSubmit(payload);
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit(submitForm)}>
      <input type="hidden" {...register('countryId')} />

      <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-950">Основная информация</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Имя" error={errors.name?.message} {...register('name')} />
          <Input label="Фамилия" error={errors.lastName?.message} {...register('lastName')} />
          <Input className="sm:col-span-2" label="Отчество" error={errors.middleName?.message} {...register('middleName')} />
          <Input className="sm:col-span-2" label="Электронная почта" type="email" error={errors.email?.message} {...register('email')} />
          {!doctor ? (
            <>
              <div className="relative sm:col-span-2">
                <Input
                  className="pr-12"
                  label="Пароль"
                  type={isPasswordVisible ? 'text' : 'password'}
                  error={errors.password?.message}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setIsPasswordVisible((value) => !value)}
                  className="absolute right-3 top-8 inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                  aria-label={isPasswordVisible ? 'Скрыть пароль' : 'Показать пароль'}
                >
                  {isPasswordVisible ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                </button>
              </div>
              <div className="relative sm:col-span-2">
                <Input
                  className="pr-12"
                  label="Подтвердите пароль"
                  type={isConfirmPasswordVisible ? 'text' : 'password'}
                  error={errors.confirmPassword?.message}
                  {...register('confirmPassword')}
                />
                <button
                  type="button"
                  onClick={() => setIsConfirmPasswordVisible((value) => !value)}
                  className="absolute right-3 top-8 inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                  aria-label={isConfirmPasswordVisible ? 'Скрыть пароль' : 'Показать пароль'}
                >
                  {isConfirmPasswordVisible ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                </button>
              </div>
            </>
          ) : null}
          <Input className="sm:col-span-2" label="Телефон" error={errors.phone?.message} {...register('phone')} />
          <Select
            className="sm:col-span-2"
            label="Пол"
            error={errors.gender?.message}
            value={watch('gender')}
            onChange={(event) => setValue('gender', event.target.value as Gender, { shouldValidate: true })}
          >
            <option value="male">Мужской</option>
            <option value="female">Женский</option>
            <option value="other">Не выбрано</option>
          </Select>
        </div>
      </section>

      <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-950">Профессиональная информация</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            className="sm:col-span-2"
            label="Тип врача"
            error={errors.doctorType?.message}
            value={selectedDoctorType}
            onChange={(event) => setValue('doctorType', event.target.value as DoctorType, { shouldValidate: true })}
          >
            <option value="adults">Взрослые</option>
            <option value="kids">Дети</option>
          </Select>
          <Select
            className="sm:col-span-2"
            label="Специалист"
            error={errors.departmentId?.message || errors.specialist?.message}
            value={watch('departmentId')}
            disabled={departmentsLoading}
            onChange={(event) => {
              const departmentId = event.target.value;
              const department = departments.find((item) => item.id === departmentId);
              const specialist = department ? department.names.ru || department.names.en || department.id : '';

              setValue('departmentId', departmentId, { shouldValidate: true });
              setValue('specialist', specialist, { shouldValidate: true });
            }}
          >
            <option value="">{departmentsLoading ? 'Загрузка специализаций...' : 'Выберите специалиста'}</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.names.ru || department.names.en || department.id}
              </option>
            ))}
          </Select>
          <Input label="Опыт" type="number" min="0" error={errors.experience?.message} {...register('experience')} />
          <Input label="Цена (сом)" type="number" min="0" error={errors.price?.message} {...register('price')} />
        </div>
      </section>

      <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-950">Местоположение и филиал</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Город"
            error={errors.cityId?.message}
            value={watch('cityId')}
            disabled={!selectedCountryId || citiesLoading || countriesLoading}
            onChange={(event) => setValue('cityId', event.target.value, { shouldValidate: true })}
          >
            <option value="">{!selectedCountryId ? 'Загрузка страны...' : citiesLoading ? 'Загрузка городов...' : 'Выберите город'}</option>
            {cities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name.ru || city.name.en}
              </option>
            ))}
          </Select>
          <Select
            label="Филиал"
            error={errors.clinicBranchId?.message}
            value={watch('clinicBranchId')}
            disabled={lockClinicBranch || branchesLoading}
            onChange={(event) => setValue('clinicBranchId', event.target.value, { shouldValidate: true })}
          >
            <option value="">{branchesLoading ? 'Загрузка филиалов...' : 'Не выбрано'}</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </Select>
        </div>
      </section>

      <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-950">Документы</h3>
        <div className="grid gap-4">
          <label className="block rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4">
            <span className="block text-sm font-medium text-slate-700">Загрузить Диплом</span>
            <input
              className="mt-3 text-sm"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={(event) => setValue('diplomaFile', event.target.files?.[0], { shouldValidate: true })}
            />
            {errors.diplomaFile?.message ? <span className="mt-1 block text-xs font-medium text-red-600">{errors.diplomaFile.message as string}</span> : null}
          </label>
          <label className="block rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4">
            <span className="block text-sm font-medium text-slate-700">Загрузить Паспорт</span>
            <input
              className="mt-3 text-sm"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={(event) => setValue('passportFile', event.target.files?.[0], { shouldValidate: true })}
            />
            {errors.passportFile?.message ? <span className="mt-1 block text-xs font-medium text-red-600">{errors.passportFile.message as string}</span> : null}
          </label>
        </div>
      </section>

      <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <h3 className="text-lg font-semibold text-slate-950">График работы врача</h3>
          <p className="mt-1 text-sm text-slate-600">Отметьте рабочие дни, укажите время приема и создайте слоты для записи.</p>
        </div>
        <Controller
          control={control}
          name="weekSlots"
          render={({ field }) => (
            <DoctorScheduleEditor
              value={field.value as DoctorFormData['weekSlots']}
              onChange={field.onChange}
            />
          )}
        />
      </section>

      <div className="flex justify-end gap-2">
        {onCancel ? (
          <Button type="button" variant="secondary" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
        ) : null}
        <Button type="submit" isLoading={isSubmitting}>
          {doctor ? t('doctors.editTitle') : t('doctors.createTitle')}
        </Button>
      </div>
    </form>
  );
}
