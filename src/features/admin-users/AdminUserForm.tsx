import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { useI18n } from '../../i18n/useI18n';
import { createAdminUserSchema, type AdminUserSchemaValues } from '../../lib/validation/adminUserSchema';
import { getBranchesByClinicId, type ClinicBranch } from '../../services/branchService';
import type { AdminUser, AdminUserRole, CreateAdminUserData, UpdateAdminUserData } from '../../services/adminUserService';

type AdminUserFormProps = {
  clinicId: string;
  clinic?: Record<string, unknown> | null;
  isSubmitting?: boolean;
  mode?: 'create' | 'edit';
  adminUser?: AdminUser | null;
  onSubmit: (data: CreateAdminUserData | UpdateAdminUserData) => Promise<void> | void;
  onCancel?: () => void;
};

export function AdminUserForm({
  clinicId,
  clinic = null,
  isSubmitting = false,
  mode = 'create',
  adminUser = null,
  onSubmit,
  onCancel,
}: AdminUserFormProps) {
  const { t } = useI18n();
  const [branches, setBranches] = useState<ClinicBranch[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(true);
  const isEditMode = mode === 'edit';
  const clinicName =
    clinic && typeof clinic.name === 'string' && clinic.name.trim().length > 0
      ? clinic.name.trim()
      : '';
  const mainClinicLabel = clinicName
    ? `${t('adminUsers.mainClinic')} - ${clinicName}`
    : t('adminUsers.mainClinic');
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AdminUserSchemaValues>({
    resolver: zodResolver(createAdminUserSchema(!isEditMode)),
    defaultValues: {
      role: adminUser?.normalizedRole === 'clinic_branch_admin' ? 'clinicBranchAdmin' : 'clinicAdmin',
      clinicBranchId: adminUser?.clinicBranchId ?? '',
      firstName: adminUser?.firstName ?? '',
      lastName: adminUser?.lastName ?? '',
      email: adminUser?.email ?? '',
      phone: adminUser?.phone ?? '',
      password: '',
      confirmPassword: '',
    },
  });

  const selectedRole = watch('role');

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      try {
        const data = await getBranchesByClinicId(clinicId);

        if (!isMounted) {
          return;
        }

        setBranches(data);
      } finally {
        if (isMounted) {
          setBranchesLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [clinicId]);

  useEffect(() => {
    if (selectedRole !== 'clinicBranchAdmin') {
      setValue('clinicBranchId', '');
    }
  }, [selectedRole, setValue]);

  const submitForm = (values: AdminUserSchemaValues) => {
    if (isEditMode) {
      void onSubmit({
        role: values.role as AdminUserRole,
        firstName: values.firstName,
        lastName: values.lastName,
        phone: values.phone,
        clinicId,
        clinicBranchId: values.role === 'clinicBranchAdmin' ? values.clinicBranchId : undefined,
        clinic,
      });
      return;
    }

    void onSubmit({
      role: values.role as AdminUserRole,
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      phone: values.phone,
      password: values.password ?? '',
      clinicId,
      clinicBranchId: values.role === 'clinicBranchAdmin' ? values.clinicBranchId : undefined,
      clinic,
    });
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit(submitForm)}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Select label={t('adminUsers.role')} error={errors.role?.message} {...register('role')}>
          <option value="clinicAdmin">{t('adminUsers.clinicAdmin')}</option>
          <option value="clinicBranchAdmin">{t('adminUsers.branchAdmin')}</option>
        </Select>
        <Select
          label={t('adminUsers.branch')}
          error={errors.clinicBranchId?.message}
          disabled={selectedRole !== 'clinicBranchAdmin' || branchesLoading || branches.length === 0}
          value={selectedRole === 'clinicBranchAdmin' ? watch('clinicBranchId') : '__main_clinic__'}
          onChange={(event) => setValue('clinicBranchId', event.target.value, { shouldValidate: true })}
        >
          {selectedRole !== 'clinicBranchAdmin' ? (
            <option value="__main_clinic__">{mainClinicLabel}</option>
          ) : null}
          {selectedRole === 'clinicBranchAdmin' ? (
            <>
              <option value="" disabled>
                {branchesLoading
                  ? t('adminUsers.loadingBranches')
                  : branches.length === 0
                    ? t('adminUsers.noBranchesAvailable')
                    : t('adminUsers.selectBranch')}
              </option>
              <option value="" disabled>
                {mainClinicLabel}
              </option>
            </>
          ) : null}
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.name}
            </option>
          ))}
        </Select>
        <Input label={t('adminUsers.firstName')} error={errors.firstName?.message} {...register('firstName')} />
        <Input label={t('adminUsers.lastName')} error={errors.lastName?.message} {...register('lastName')} />
        <Input label={t('adminUsers.email')} type="email" error={errors.email?.message} disabled={isEditMode} {...register('email')} />
        <Input label={t('adminUsers.phone')} error={errors.phone?.message} {...register('phone')} />
        {!isEditMode ? <Input label={t('adminUsers.password')} type="password" error={errors.password?.message} {...register('password')} /> : null}
        {!isEditMode ? <Input label={t('adminUsers.confirmPassword')} type="password" error={errors.confirmPassword?.message} {...register('confirmPassword')} /> : null}
      </div>

      <div className="flex justify-end gap-2">
        {onCancel ? (
          <Button type="button" variant="secondary" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
        ) : null}
        <Button type="submit" isLoading={isSubmitting}>
          {isEditMode ? t('adminUsers.updateAdminUser') : t('adminUsers.createAdminUser')}
        </Button>
      </div>
    </form>
  );
}
