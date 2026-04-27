import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Checkbox } from '../../components/ui/Checkbox';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { settingsSchema, type SettingsSchemaValues } from '../../lib/validation/settingsSchema';
import type { Clinic, UpdateClinicData } from '../../types/clinic';

type ClinicSettingsFormProps = {
  clinic: Clinic;
  isSubmitting?: boolean;
  onSubmit: (data: UpdateClinicData) => Promise<void> | void;
  onCancel: () => void;
};

function getDefaultValues(clinic: Clinic): SettingsSchemaValues {
  return {
    name: clinic.name,
    description: clinic.description ?? '',
    address: clinic.address,
    phone: clinic.phone,
    email: clinic.email ?? '',
    website: clinic.website ?? '',
    workingHours: clinic.workingHours ?? '',
    contactPersonName: clinic.contactPersonName ?? '',
    contactPersonPhone: clinic.contactPersonPhone ?? '',
    contactPersonEmail: clinic.contactPersonEmail ?? '',
    isProcedureRoom: clinic.isProcedureRoom,
    procedureRoomPrice: clinic.procedureRoomPrice,
    isTraumaCenter: clinic.isTraumaCenter,
  };
}

export function ClinicSettingsForm({
  clinic,
  isSubmitting = false,
  onSubmit,
  onCancel,
}: ClinicSettingsFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isDirty },
  } = useForm<SettingsSchemaValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: getDefaultValues(clinic),
  });

  const isProcedureRoom = watch('isProcedureRoom');

  const submitForm = (values: SettingsSchemaValues) => {
    void onSubmit({
      name: values.name,
      description: values.description ?? '',
      address: values.address,
      phone: values.phone,
      email: values.email,
      website: values.website,
      workingHours: values.workingHours ?? '',
      contactPersonName: values.contactPersonName ?? '',
      contactPersonPhone: values.contactPersonPhone ?? '',
      contactPersonEmail: values.contactPersonEmail,
      isProcedureRoom: values.isProcedureRoom,
      procedureRoomPrice: values.isProcedureRoom ? values.procedureRoomPrice : null,
      isTraumaCenter: values.isTraumaCenter,
    });
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit(submitForm)}>
      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-slate-950">Clinic profile</h2>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Input label="Name" error={errors.name?.message} {...register('name')} />
          <Input label="Phone" error={errors.phone?.message} {...register('phone')} />
          <Input className="sm:col-span-2" label="Address" error={errors.address?.message} {...register('address')} />
          <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
          <Input label="Website" type="url" error={errors.website?.message} {...register('website')} />
          <Input label="Working hours" error={errors.workingHours?.message} {...register('workingHours')} />
          <div className="sm:col-span-2">
            <Textarea label="Description" error={errors.description?.message} {...register('description')} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-slate-950">Contact person</h2>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <Input label="Name" error={errors.contactPersonName?.message} {...register('contactPersonName')} />
          <Input label="Phone" error={errors.contactPersonPhone?.message} {...register('contactPersonPhone')} />
          <Input label="Email" type="email" error={errors.contactPersonEmail?.message} {...register('contactPersonEmail')} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-slate-950">Capabilities</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Checkbox label="Procedure room" description="Enable this if the clinic provides procedure room services." {...register('isProcedureRoom')} />
            <Checkbox label="Trauma center" description="Enable this if the clinic operates as a trauma center." {...register('isTraumaCenter')} />
          </div>
          <div className="max-w-sm">
            <Input
              label="Procedure room price"
              type="number"
              step="0.01"
              disabled={!isProcedureRoom}
              error={errors.procedureRoomPrice?.message}
              {...register('procedureRoomPrice')}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting} disabled={!isDirty}>
          Save changes
        </Button>
      </div>
    </form>
  );
}
