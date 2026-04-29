import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Checkbox } from '../../components/ui/Checkbox';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { useI18n } from '../../i18n/useI18n';
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
  const { t } = useI18n();
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
          <h2 className="text-base font-semibold text-slate-950">{t('settings.clinicProfile')}</h2>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Input label={t('settings.name')} error={errors.name?.message} {...register('name')} />
          <Input label={t('settings.phone')} error={errors.phone?.message} {...register('phone')} />
          <Input className="sm:col-span-2" label={t('settings.address')} error={errors.address?.message} {...register('address')} />
          <Input label={t('settings.email')} type="email" error={errors.email?.message} {...register('email')} />
          <Input label={t('settings.website')} type="url" error={errors.website?.message} {...register('website')} />
          <Input label={t('settings.workingHours')} error={errors.workingHours?.message} {...register('workingHours')} />
          <div className="sm:col-span-2">
            <Textarea label={t('settings.description')} error={errors.description?.message} {...register('description')} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-slate-950">{t('settings.contactPerson')}</h2>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <Input label={t('settings.name')} error={errors.contactPersonName?.message} {...register('contactPersonName')} />
          <Input label={t('settings.phone')} error={errors.contactPersonPhone?.message} {...register('contactPersonPhone')} />
          <Input label={t('settings.email')} type="email" error={errors.contactPersonEmail?.message} {...register('contactPersonEmail')} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-slate-950">{t('settings.capabilities')}</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Checkbox label={t('settings.procedureRoom')} description={t('settings.procedureRoomDescription')} {...register('isProcedureRoom')} />
            <Checkbox label={t('settings.traumaCenter')} description={t('settings.traumaCenterDescription')} {...register('isTraumaCenter')} />
          </div>
          <div className="max-w-sm">
            <Input
              label={t('settings.procedureRoomPrice')}
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
          {t('common.cancel')}
        </Button>
        <Button type="submit" isLoading={isSubmitting} disabled={!isDirty}>
          {t('settings.saveChanges')}
        </Button>
      </div>
    </form>
  );
}
