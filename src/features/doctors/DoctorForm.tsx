import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '../../components/ui/Button';
import { Checkbox } from '../../components/ui/Checkbox';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { useCities } from '../../hooks/useCities';
import { useCountries } from '../../hooks/useCountries';
import { useDepartments } from '../../hooks/useDepartments';
import { createDoctorSchema, type DoctorSchemaValues } from '../../lib/validation/doctorSchema';
import { getBranchesByClinicId, type ClinicBranch } from '../../services/branchService';
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
  const [branches, setBranches] = useState<ClinicBranch[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(true);
  const { countries, loading: countriesLoading } = useCountries(true);
  const isCreateMode = !doctor;
  const requireClinicBranch = !lockClinicBranch;
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
  const selectedBranchId = watch('clinicBranchId');
  const selectedCityId = watch('cityId');
  const selectedDepartmentId = watch('departmentId');
  const { cities, loading: citiesLoading } = useCities(selectedCountryId);
  const { departments, loading: departmentsLoading } = useDepartments(selectedDoctorType);

  useEffect(() => {
    let isMounted = true;

    setBranchesLoading(true);

    void (async () => {
      try {
        const data = await getBranchesByClinicId(clinicId);

        if (!isMounted) {
          return;
        }

        setBranches(data);

        if (!doctor && defaultClinicBranchId) {
          setValue('clinicBranchId', defaultClinicBranchId, { shouldValidate: true });
        }
      } finally {
        if (isMounted) {
          setBranchesLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [clinicId, defaultClinicBranchId, doctor, setValue]);

  useEffect(() => {
    const currentCityExists = cities.some((city) => city.id === selectedCityId);

    if (!currentCityExists) {
      setValue('cityId', '');
    }
  }, [cities, selectedCityId, setValue]);

  useEffect(() => {
    const currentDepartmentExists = departments.some((department) => department.id === selectedDepartmentId);

    if (!currentDepartmentExists) {
      setValue('departmentId', '');
    }
  }, [departments, selectedDepartmentId, setValue]);

  const selectedBranch = useMemo(
    () => branches.find((branch) => branch.id === selectedBranchId) ?? null,
    [branches, selectedBranchId],
  );

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
        clinicBranchId: values.clinicBranchId ?? '',
        departmentId: values.departmentId,
        cityId: values.cityId,
        countryId: values.countryId,
        districtId: values.districtId ?? '',
        specialist: values.specialist,
        registrationNumber: values.registrationNumber,
        workPlace: values.workPlace,
        experience: values.experience,
        price: values.price,
        doctorType: values.doctorType,
        avatar: values.avatar,
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
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Input label="First name" error={errors.name?.message} {...register('name')} />
        <Input label="Last name" error={errors.lastName?.message} {...register('lastName')} />
        <Input label="Middle name" error={errors.middleName?.message} {...register('middleName')} />
        <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
        <Input label="Phone" error={errors.phone?.message} {...register('phone')} />
        <Select label="Gender" error={errors.gender?.message} {...register('gender')}>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </Select>
        {!doctor ? (
          <>
            <Input label="Password" type="password" error={errors.password?.message} {...register('password')} />
            <Input label="Confirm password" type="password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
          </>
        ) : null}
        <Select
          label="Doctor type"
          error={errors.doctorType?.message}
          value={selectedDoctorType}
          onChange={(event) => setValue('doctorType', event.target.value as DoctorType, { shouldValidate: true })}
        >
          <option value="adults">Adults</option>
          <option value="kids">Kids</option>
        </Select>
        <Select
          label="Branch"
          error={errors.clinicBranchId?.message}
          value={selectedBranchId}
          disabled={branchesLoading || lockClinicBranch}
          onChange={(event) => setValue('clinicBranchId', event.target.value, { shouldValidate: true })}
        >
          <option value="">{branchesLoading ? 'Loading branches...' : 'Select branch'}</option>
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.name}
            </option>
          ))}
        </Select>
        <Select
          label="Department"
          error={errors.departmentId?.message}
          value={watch('departmentId')}
          disabled={departmentsLoading}
          onChange={(event) => setValue('departmentId', event.target.value, { shouldValidate: true })}
        >
          <option value="">{departmentsLoading ? 'Loading departments...' : 'Select department'}</option>
          {departments.map((department) => (
            <option key={department.id} value={department.id}>
              {department.names.ru || department.names.en || department.id}
            </option>
          ))}
        </Select>
        <Select
          label="Country"
          error={errors.countryId?.message}
          value={selectedCountryId}
          disabled={countriesLoading}
          onChange={(event) => setValue('countryId', event.target.value, { shouldValidate: true })}
        >
          <option value="">{countriesLoading ? 'Loading countries...' : 'Select country'}</option>
          {countries.map((country) => (
            <option key={country.id} value={country.id}>
              {country.name}
            </option>
          ))}
        </Select>
        <Select
          label="City"
          error={errors.cityId?.message}
          value={watch('cityId')}
          disabled={!selectedCountryId || citiesLoading}
          onChange={(event) => setValue('cityId', event.target.value, { shouldValidate: true })}
        >
          <option value="">{!selectedCountryId ? 'Select country first' : citiesLoading ? 'Loading cities...' : 'Select city'}</option>
          {cities.map((city) => (
            <option key={city.id} value={city.id}>
              {city.name.ru || city.name.en}
            </option>
          ))}
        </Select>
        <Input label="District ID" error={errors.districtId?.message} {...register('districtId')} />
        <Input label="Speciality" error={errors.specialist?.message} {...register('specialist')} />
        <Input label="Registration number" error={errors.registrationNumber?.message} {...register('registrationNumber')} />
        <Input label="Work place" error={errors.workPlace?.message} {...register('workPlace')} />
        <Input label="Experience (years)" type="number" min="0" error={errors.experience?.message} {...register('experience')} />
        <Input label="Price" type="number" min="0" error={errors.price?.message} {...register('price')} />
        <Input label="Service radius (km)" type="number" min="0" error={errors.serviceRadius?.message} {...register('serviceRadius')} />
        <Input label="Avatar URL" error={errors.avatar?.message} {...register('avatar')} />
        <Input label="Latitude" type="number" step="any" error={errors.currentLatitude?.message} {...register('currentLatitude')} />
        <Input label="Longitude" type="number" step="any" error={errors.currentLongitude?.message} {...register('currentLongitude')} />
        <Input label="Balance" type="number" min="0" error={errors.balance?.message} {...register('balance')} />
        <Input label="Revenue" type="number" min="0" error={errors.revenue?.message} {...register('revenue')} />
        <Input label="Average rating" type="number" min="0" step="0.1" error={errors.averageRating?.message} {...register('averageRating')} />
        <Input label="Review count" type="number" min="0" error={errors.reviewCount?.message} {...register('reviewCount')} />
      </div>

      {selectedBranch ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Selected branch: <span className="font-semibold text-slate-900">{selectedBranch.name}</span>
        </div>
      ) : null}

      <Textarea label="About me" error={errors.aboutMe?.message} {...register('aboutMe')} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Checkbox label="Verified" {...register('isVerified')} />
        <Checkbox label="Active" {...register('isActive')} />
        <Checkbox label="Busy" {...register('busy')} />
        <Checkbox label="Online" {...register('isOnline')} />
        <Checkbox label="Available" {...register('isAvailable')} />
        <Checkbox label="Location tracking enabled" {...register('locationTrackingEnabled')} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <label className="block rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4">
          <span className="block text-sm font-medium text-slate-700">Diploma file</span>
          <input
            className="mt-3 text-sm"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            onChange={(event) => setValue('diplomaFile', event.target.files?.[0], { shouldValidate: true })}
          />
          {errors.diplomaFile?.message ? <span className="mt-1 block text-xs font-medium text-red-600">{errors.diplomaFile.message as string}</span> : null}
        </label>
        <label className="block rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4">
          <span className="block text-sm font-medium text-slate-700">Passport file</span>
          <input
            className="mt-3 text-sm"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            onChange={(event) => setValue('passportFile', event.target.files?.[0], { shouldValidate: true })}
          />
          {errors.passportFile?.message ? <span className="mt-1 block text-xs font-medium text-red-600">{errors.passportFile.message as string}</span> : null}
        </label>
        <label className="block rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4">
          <span className="block text-sm font-medium text-slate-700">Certificate file</span>
          <input
            className="mt-3 text-sm"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            onChange={(event) => setValue('certificateFile', event.target.files?.[0], { shouldValidate: true })}
          />
        </label>
        <label className="block rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4">
          <span className="block text-sm font-medium text-slate-700">Special licence file</span>
          <input
            className="mt-3 text-sm"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            onChange={(event) => setValue('specialLicenceFile', event.target.files?.[0], { shouldValidate: true })}
          />
        </label>
      </div>

      <div className="space-y-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-950">Weekly schedule</h3>
          <p className="mt-1 text-sm text-slate-600">Configure slots by weekday, duration, and working periods.</p>
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
      </div>

      <div className="flex justify-end gap-2">
        {onCancel ? (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" isLoading={isSubmitting}>
          {doctor ? 'Update doctor' : 'Create doctor'}
        </Button>
      </div>
    </form>
  );
}
