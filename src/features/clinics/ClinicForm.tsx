import { zodResolver } from '@hookform/resolvers/zod';
import { Upload } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '../../components/ui/Button';
import { Checkbox } from '../../components/ui/Checkbox';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
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
    formState: { errors },
  } = useForm<ClinicSchemaValues>({
    resolver: zodResolver(clinicSchema),
    defaultValues: getDefaultValues(clinic),
  });

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
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Name" error={errors.name?.message} {...register('name')} />
        <Input label="Phone" error={errors.phone?.message} {...register('phone')} />
        <Input label="Country" error={errors.country?.message} {...register('country')} />
        <Input label="Country ID" error={errors.countryId?.message} {...register('countryId')} />
        <Input label="City" error={errors.city?.message} {...register('city')} />
        <Input label="City ID" error={errors.cityId?.message} {...register('cityId')} />
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
          <input className="mt-3 text-sm" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => setLogoFile(event.target.files?.[0])} />
        </label>
        <label className="block rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4">
          <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <Upload className="h-4 w-4 text-primary" aria-hidden="true" />
            Cover upload
          </span>
          <input className="mt-3 text-sm" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => setCoverFile(event.target.files?.[0])} />
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
