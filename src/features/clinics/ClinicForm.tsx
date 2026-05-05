import { zodResolver } from '@hookform/resolvers/zod';
import { Upload } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '../../components/ui/Button';
import { Checkbox } from '../../components/ui/Checkbox';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { useCities } from '../../hooks/useCities';
import { useCountries } from '../../hooks/useCountries';
import { useI18n } from '../../i18n/useI18n';
import { createClinicSchema, type ClinicSchemaValues } from '../../lib/validation/clinicSchema';
import type { Clinic, ClinicFormData } from '../../types/clinic';

type ClinicFormSubmitData = {
  data: ClinicFormData;
  logoFile?: File;
  coverFile?: File;
};

type ClinicFormProps = {
  clinic?: Clinic | null;
  isSubmitting?: boolean;
  onSubmit: (payload: ClinicFormSubmitData) => Promise<void> | void;
  onCancel?: () => void;
};

function getDefaultValues(clinic?: Clinic | null): ClinicSchemaValues {
  return {
    name: clinic?.name ?? '',
    country: clinic?.country ?? '',
    countryId: clinic?.countryId ?? '',
    city: clinic?.city ?? '',
    cityId: clinic?.cityId ?? '',
    address: clinic?.address ?? '',
    phone: clinic?.phone ?? '',
    email: clinic?.email ?? '',
    website: clinic?.website ?? '',
    workingHours: clinic?.workingHours ?? '',
    description: clinic?.description ?? '',
    contactPersonName: clinic?.contactPersonName ?? '',
    contactPersonPhone: clinic?.contactPersonPhone ?? '',
    contactPersonEmail: clinic?.contactPersonEmail ?? '',
    isActive: clinic?.isActive ?? true,
    isVerified: clinic?.isVerified ?? false,
    isProcedureRoom: clinic?.isProcedureRoom ?? false,
    procedureRoomPrice: clinic?.procedureRoomPrice ?? null,
    isTraumaCenter: clinic?.isTraumaCenter ?? false,
    traumaCenterPrice: clinic?.traumaCenterPrice ?? null,
    latitude: clinic?.location.latitude ?? null,
    longitude: clinic?.location.longitude ?? null,
  };
}

export function ClinicForm({ clinic, isSubmitting = false, onSubmit, onCancel }: ClinicFormProps) {
  const { t } = useI18n();
  const [logoFile, setLogoFile] = useState<File | undefined>();
  const [coverFile, setCoverFile] = useState<File | undefined>();
  const clinicSchema = useMemo(() => createClinicSchema(t), [t]);
  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ClinicSchemaValues>({
    resolver: zodResolver(clinicSchema),
    defaultValues: getDefaultValues(clinic),
  });
  const selectedCountryId = watch('countryId');
  const selectedCityId = watch('cityId');
  const isProcedureRoom = watch('isProcedureRoom');
  const isTraumaCenter = watch('isTraumaCenter');
  const { countries, loading: countriesLoading } = useCountries(true);
  const { cities, loading: citiesLoading } = useCities(selectedCountryId);

  useEffect(() => {
    reset(getDefaultValues(clinic));
    setLogoFile(undefined);
    setCoverFile(undefined);
  }, [clinic, reset]);

  useEffect(() => {
    if (!selectedCountryId) {
      setValue('cityId', '');
      setValue('city', '');
      return;
    }

    if (citiesLoading) {
      return;
    }

    const currentCityExists = cities.some((city) => city.id === selectedCityId);

    if (selectedCityId && !currentCityExists) {
      setValue('cityId', '');
      setValue('city', '');
    }
  }, [cities, citiesLoading, selectedCityId, selectedCountryId, setValue]);

  const handleCountryChange = (countryId: string) => {
    const country = countries.find((item) => item.id === countryId);

    setValue('countryId', countryId, { shouldValidate: true });
    setValue('country', country?.name ?? '', { shouldValidate: true });
    setValue('cityId', '', { shouldValidate: true });
    setValue('city', '', { shouldValidate: true });
  };

  const handleCityChange = (cityId: string) => {
    const city = cities.find((item) => item.id === cityId);
    const cityName = city?.name.ru || city?.name.en || '';

    setValue('cityId', cityId, { shouldValidate: true });
    setValue('city', cityName, { shouldValidate: true });
  };

  const submitForm = (values: ClinicSchemaValues) => {
    const data: ClinicFormData = {
      name: values.name,
      address: values.address,
      city: values.city ?? '',
      cityId: values.cityId,
      country: values.country ?? '',
      countryId: values.countryId,
      phone: values.phone ?? '',
      workingHours: values.workingHours ?? '',
      email: values.email,
      website: values.website,
      description: values.description ?? '',
      logoUrl: clinic?.logoUrl ?? '',
      coverImageUrl: clinic?.coverImageUrl ?? '',
      isProcedureRoom: values.isProcedureRoom,
      procedureRoomPrice: values.isProcedureRoom ? values.procedureRoomPrice : null,
      isTraumaCenter: values.isTraumaCenter,
      traumaCenterPrice: values.isTraumaCenter ? values.traumaCenterPrice : null,
      location: {
        latitude: values.latitude,
        longitude: values.longitude,
      },
      isActive: values.isActive,
      isVerified: values.isVerified,
      contactPersonName: values.contactPersonName ?? '',
      contactPersonPhone: values.contactPersonPhone ?? '',
      contactPersonEmail: values.contactPersonEmail,
    };

    void onSubmit({ data, logoFile, coverFile });
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit(submitForm)}>
      <input type="hidden" {...register('country')} />
      <input type="hidden" {...register('countryId')} />
      <input type="hidden" {...register('city')} />
      <input type="hidden" {...register('cityId')} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input label={t('superAdmin.name')} error={errors.name?.message} {...register('name')} />
        <Input label={t('superAdmin.phone')} error={errors.phone?.message} {...register('phone')} />
        <Select
          label={t('superAdmin.country')}
          error={errors.countryId?.message}
          value={selectedCountryId}
          onChange={(event) => handleCountryChange(event.target.value)}
          disabled={countriesLoading}
        >
          <option value="">{countriesLoading ? t('superAdmin.loadingCountries') : t('superAdmin.selectCountry')}</option>
          {countries.map((country) => (
            <option key={country.id} value={country.id}>
              {country.name}
            </option>
          ))}
        </Select>
        <Select
          label={t('superAdmin.city')}
          error={errors.cityId?.message}
          value={selectedCityId}
          onChange={(event) => handleCityChange(event.target.value)}
          disabled={!selectedCountryId || citiesLoading}
        >
          <option value="">
            {!selectedCountryId ? t('superAdmin.selectCountryFirst') : citiesLoading ? t('superAdmin.loadingCities') : t('superAdmin.selectCity')}
          </option>
          {cities.map((city) => (
            <option key={city.id} value={city.id}>
              {city.name.ru || city.name.en || city.id}
            </option>
          ))}
        </Select>
        <Input className="sm:col-span-2" label={t('superAdmin.address')} error={errors.address?.message} {...register('address')} />
        <Input label={t('superAdmin.email')} type="email" error={errors.email?.message} {...register('email')} />
        <Input label={t('superAdmin.website')} type="url" placeholder={t('superAdmin.websitePlaceholder')} error={errors.website?.message} {...register('website')} />
        <Input label={t('superAdmin.workingHours')} placeholder={t('superAdmin.workingHoursPlaceholder')} error={errors.workingHours?.message} {...register('workingHours')} />
        <Input label={t('superAdmin.latitude')} type="number" step="any" error={errors.latitude?.message} {...register('latitude')} />
        <Input label={t('superAdmin.longitude')} type="number" step="any" error={errors.longitude?.message} {...register('longitude')} />
      </div>

      <Textarea label={t('superAdmin.description')} error={errors.description?.message} {...register('description')} />

      <div className="grid gap-4 sm:grid-cols-3">
        <Input label={t('superAdmin.contactName')} error={errors.contactPersonName?.message} {...register('contactPersonName')} />
        <Input label={t('superAdmin.contactPhone')} error={errors.contactPersonPhone?.message} {...register('contactPersonPhone')} />
        <Input label={t('superAdmin.contactEmail')} type="email" error={errors.contactPersonEmail?.message} {...register('contactPersonEmail')} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4">
          <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <Upload className="h-4 w-4 text-primary" aria-hidden="true" />
            {t('superAdmin.logoUpload')}
          </span>
          {clinic?.logoUrl ? (
            <div className="mt-3">
              <img src={clinic.logoUrl} alt={`${clinic.name} logo`} className="h-24 w-24 rounded-lg border border-slate-200 object-cover" />
            </div>
          ) : null}
          <input className="mt-3 text-sm" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => setLogoFile(event.target.files?.[0])} />
          {logoFile ? <p className="mt-2 text-sm text-slate-500">{t('superAdmin.selectedFile', { name: logoFile.name })}</p> : null}
        </label>
        <label className="block rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4">
          <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <Upload className="h-4 w-4 text-primary" aria-hidden="true" />
            {t('superAdmin.coverUpload')}
          </span>
          {clinic?.coverImageUrl ? (
            <div className="mt-3">
              <img src={clinic.coverImageUrl} alt={`${clinic.name} cover`} className="h-24 w-full rounded-lg border border-slate-200 object-cover" />
            </div>
          ) : null}
          <input className="mt-3 text-sm" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => setCoverFile(event.target.files?.[0])} />
          {coverFile ? <p className="mt-2 text-sm text-slate-500">{t('superAdmin.selectedFile', { name: coverFile.name })}</p> : null}
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Checkbox label={t('superAdmin.active')} {...register('isActive')} />
        <Checkbox label={t('superAdmin.verified')} {...register('isVerified')} />
        <Checkbox label={t('superAdmin.procedureRoom')} {...register('isProcedureRoom')} />
        <Checkbox label={t('superAdmin.traumaCenter')} {...register('isTraumaCenter')} />
      </div>
      {isProcedureRoom && (
        <div className="max-w-xs">
          <Input
            label={t('superAdmin.procedureRoomPrice')}
            type="number"
            step="0.01"
            error={errors.procedureRoomPrice?.message}
            {...register('procedureRoomPrice')}
          />
        </div>
      )}
      {isTraumaCenter && (
        <div className="max-w-xs">
          <Input
            label={t('superAdmin.traumaCenterPrice')}
            type="number"
            step="0.01"
            error={errors.traumaCenterPrice?.message}
            {...register('traumaCenterPrice')}
          />
        </div>
      )}

      <div className="flex justify-end gap-2">
        {onCancel ? (
          <Button type="button" variant="secondary" onClick={onCancel}>
            {t('superAdmin.cancel')}
          </Button>
        ) : null}
        <Button type="submit" isLoading={isSubmitting}>
          {clinic ? t('superAdmin.updateClinicAction') : t('superAdmin.createClinicAction')}
        </Button>
      </div>
    </form>
  );
}
