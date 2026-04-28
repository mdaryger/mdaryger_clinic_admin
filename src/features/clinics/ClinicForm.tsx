import { zodResolver } from '@hookform/resolvers/zod';
import { Upload } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '../../components/ui/Button';
import { Checkbox } from '../../components/ui/Checkbox';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { useCities } from '../../hooks/useCities';
import { useCountries } from '../../hooks/useCountries';
import { clinicSchema, type ClinicSchemaValues } from '../../lib/validation/clinicSchema';
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
    latitude: clinic?.location.latitude ?? null,
    longitude: clinic?.location.longitude ?? null,
  };
}

export function ClinicForm({ clinic, isSubmitting = false, onSubmit, onCancel }: ClinicFormProps) {
  const [logoFile, setLogoFile] = useState<File | undefined>();
  const [coverFile, setCoverFile] = useState<File | undefined>();
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
        <Input label="Name" error={errors.name?.message} {...register('name')} />
        <Input label="Phone" error={errors.phone?.message} {...register('phone')} />
        <Select
          label="Country"
          error={errors.countryId?.message}
          value={selectedCountryId}
          onChange={(event) => handleCountryChange(event.target.value)}
          disabled={countriesLoading}
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
          value={selectedCityId}
          onChange={(event) => handleCityChange(event.target.value)}
          disabled={!selectedCountryId || citiesLoading}
        >
          <option value="">
            {!selectedCountryId ? 'Select country first' : citiesLoading ? 'Loading cities...' : 'Select city'}
          </option>
          {cities.map((city) => (
            <option key={city.id} value={city.id}>
              {city.name.ru || city.name.en || city.id}
            </option>
          ))}
        </Select>
        <Input className="sm:col-span-2" label="Address" error={errors.address?.message} {...register('address')} />
        <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
        <Input label="Website" type="url" placeholder="https://example.com" error={errors.website?.message} {...register('website')} />
        <Input label="Working hours" placeholder="Mon-Fri 09:00-18:00" error={errors.workingHours?.message} {...register('workingHours')} />
        <Input label="Procedure room price" type="number" step="0.01" error={errors.procedureRoomPrice?.message} {...register('procedureRoomPrice')} />
        <Input label="Latitude" type="number" step="any" error={errors.latitude?.message} {...register('latitude')} />
        <Input label="Longitude" type="number" step="any" error={errors.longitude?.message} {...register('longitude')} />
      </div>

      <Textarea label="Description" error={errors.description?.message} {...register('description')} />

      <div className="grid gap-4 sm:grid-cols-3">
        <Input label="Contact name" error={errors.contactPersonName?.message} {...register('contactPersonName')} />
        <Input label="Contact phone" error={errors.contactPersonPhone?.message} {...register('contactPersonPhone')} />
        <Input label="Contact email" type="email" error={errors.contactPersonEmail?.message} {...register('contactPersonEmail')} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4">
          <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <Upload className="h-4 w-4 text-primary" aria-hidden="true" />
            Logo upload
          </span>
          {clinic?.logoUrl ? (
            <div className="mt-3">
              <img src={clinic.logoUrl} alt={`${clinic.name} logo`} className="h-24 w-24 rounded-lg border border-slate-200 object-cover" />
            </div>
          ) : null}
          <input className="mt-3 text-sm" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => setLogoFile(event.target.files?.[0])} />
          {logoFile ? <p className="mt-2 text-sm text-slate-500">Selected: {logoFile.name}</p> : null}
        </label>
        <label className="block rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4">
          <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <Upload className="h-4 w-4 text-primary" aria-hidden="true" />
            Cover upload
          </span>
          {clinic?.coverImageUrl ? (
            <div className="mt-3">
              <img src={clinic.coverImageUrl} alt={`${clinic.name} cover`} className="h-24 w-full rounded-lg border border-slate-200 object-cover" />
            </div>
          ) : null}
          <input className="mt-3 text-sm" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => setCoverFile(event.target.files?.[0])} />
          {coverFile ? <p className="mt-2 text-sm text-slate-500">Selected: {coverFile.name}</p> : null}
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Checkbox label="Active" {...register('isActive')} />
        <Checkbox label="Verified" {...register('isVerified')} />
        <Checkbox label="Procedure room" {...register('isProcedureRoom')} />
        <Checkbox label="Trauma center" {...register('isTraumaCenter')} />
      </div>

      <div className="flex justify-end gap-2">
        {onCancel ? (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" isLoading={isSubmitting}>
          {clinic ? 'Update clinic' : 'Create clinic'}
        </Button>
      </div>
    </form>
  );
}
