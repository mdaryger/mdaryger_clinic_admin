import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '../../components/ui/Button';
import { Checkbox } from '../../components/ui/Checkbox';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { useCities } from '../../hooks/useCities';
import { useCountries } from '../../hooks/useCountries';
import { branchSchema, type BranchSchemaValues } from '../../lib/validation/branchSchema';
import type { BranchFormData, ClinicBranch, WorkingDay } from '../../services/branchService';

type BranchFormProps = {
  branch?: ClinicBranch | null;
  clinicId: string;
  isSubmitting?: boolean;
  onSubmit: (data: BranchFormData) => Promise<void> | void;
  onCancel?: () => void;
};

const defaultWorkingDays: WorkingDay[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

function getDefaultValues(branch?: ClinicBranch | null): BranchSchemaValues {
  return {
    name: branch?.name ?? '',
    address: branch?.address ?? '',
    country: branch?.country ?? '',
    countryId: branch?.countryId ?? '',
    city: branch?.city ?? '',
    cityId: branch?.cityId ?? '',
    phone: branch?.phone ?? '',
    email: branch?.email ?? '',
    website: branch?.website ?? '',
    description: branch?.description ?? '',
    openingHours: branch?.openingHours ?? '',
    closingHours: branch?.closingHours ?? '',
    isMainBranch: branch?.isMainBranch ?? false,
    branchManagerName: branch?.branchManagerName ?? '',
    branchManagerPhone: branch?.branchManagerPhone ?? '',
    branchManagerEmail: branch?.branchManagerEmail ?? '',
  };
}

export function BranchForm({ branch, clinicId, isSubmitting = false, onSubmit, onCancel }: BranchFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BranchSchemaValues>({
    resolver: zodResolver(branchSchema),
    defaultValues: getDefaultValues(branch),
  });
  const selectedCountryId = watch('countryId');
  const { countries, loading: countriesLoading } = useCountries(true);
  const { cities, loading: citiesLoading } = useCities(selectedCountryId);

  useEffect(() => {
    if (!selectedCountryId) {
      setValue('cityId', '');
      setValue('city', '');
      return;
    }

    const currentCityExists = cities.some((city) => city.id === watch('cityId'));

    if (!currentCityExists) {
      setValue('cityId', '');
      setValue('city', '');
    }
  }, [cities, selectedCountryId, setValue, watch]);

  const handleCountryChange = (countryId: string) => {
    const country = countries.find((item) => item.id === countryId);
    setValue('countryId', countryId, { shouldValidate: true });
    setValue('country', country?.name ?? '', { shouldValidate: true });
  };

  const handleCityChange = (cityId: string) => {
    const city = cities.find((item) => item.id === cityId);
    const cityName = city?.name.ru || city?.name.en || '';
    setValue('cityId', cityId, { shouldValidate: true });
    setValue('city', cityName, { shouldValidate: true });
  };

  const submitForm = (values: BranchSchemaValues) => {
    void onSubmit({
      clinicId,
      name: values.name,
      address: values.address,
      country: values.country ?? '',
      countryId: values.countryId,
      city: values.city ?? '',
      cityId: values.cityId,
      phone: values.phone,
      email: values.email,
      website: values.website,
      description: values.description ?? '',
      district: branch?.district ?? '',
      latitude: branch?.latitude ?? null,
      longitude: branch?.longitude ?? null,
      openingHours: values.openingHours,
      closingHours: values.closingHours,
      workingDays: branch?.workingDays?.length ? branch.workingDays : defaultWorkingDays,
      isActive: branch?.isActive ?? true,
      isMainBranch: values.isMainBranch,
      branchManagerName: values.branchManagerName,
      branchManagerPhone: values.branchManagerPhone,
      branchManagerEmail: values.branchManagerEmail,
    });
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit(submitForm)}>
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
          value={watch('cityId')}
          onChange={(event) => handleCityChange(event.target.value)}
          disabled={!selectedCountryId || citiesLoading}
        >
          <option value="">
            {!selectedCountryId ? 'Select country first' : citiesLoading ? 'Loading cities...' : 'Select city'}
          </option>
          {cities.map((city) => (
            <option key={city.id} value={city.id}>
              {city.name.ru || city.name.en}
            </option>
          ))}
        </Select>
        <Input className="sm:col-span-2" label="Address" error={errors.address?.message} {...register('address')} />
        <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
        <Input label="Website" type="url" placeholder="https://example.com" error={errors.website?.message} {...register('website')} />
        <Input label="Opening hours" type="time" error={errors.openingHours?.message} {...register('openingHours')} />
        <Input label="Closing hours" type="time" error={errors.closingHours?.message} {...register('closingHours')} />
      </div>

      <Textarea label="Description" error={errors.description?.message} {...register('description')} />

      <div className="grid gap-4 sm:grid-cols-3">
        <Input label="Branch manager name" error={errors.branchManagerName?.message} {...register('branchManagerName')} />
        <Input label="Branch manager phone" error={errors.branchManagerPhone?.message} {...register('branchManagerPhone')} />
        <Input label="Branch manager email" type="email" error={errors.branchManagerEmail?.message} {...register('branchManagerEmail')} />
      </div>

      <Checkbox label="Main branch" description="Marks this branch as the primary clinic location." {...register('isMainBranch')} />

      <div className="flex justify-end gap-2">
        {onCancel ? (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" isLoading={isSubmitting}>
          {branch ? 'Update branch' : 'Create branch'}
        </Button>
      </div>
    </form>
  );
}
