import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { useI18n } from '../../i18n/useI18n';
import { adminUserSchema, type AdminUserSchemaValues } from '../../lib/validation/adminUserSchema';
import { getBranchesByClinicId, type ClinicBranch } from '../../services/branchService';
import type { AdminUserRole, CreateAdminUserData } from '../../services/adminUserService';

type AdminUserFormProps = {
  clinicId: string;
  clinic?: Record<string, unknown> | null;
  isSubmitting?: boolean;
  onSubmit: (data: CreateAdminUserData) => Promise<void> | void;
  onCancel?: () => void;
};

export function AdminUserForm({
  clinicId,
  clinic = null,
  isSubmitting = false,
  onSubmit,
  onCancel,
}: AdminUserFormProps) {
  const { t } = useI18n();
  const [branches, setBranches] = useState<ClinicBranch[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(true);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AdminUserSchemaValues>({
    resolver: zodResolver(adminUserSchema),
    defaultValues: {
      role: 'clinicAdmin',
      clinicBranchId: '',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
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
    void onSubmit({
      role: values.role as AdminUserRole,
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      phone: values.phone,
      password: values.password,
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
          disabled={selectedRole !== 'clinicBranchAdmin' || branchesLoading}
          {...register('clinicBranchId')}
        >
          <option value="">
            {selectedRole !== 'clinicBranchAdmin'
              ? t('adminUsers.branchNotRequired')
              : branchesLoading
                ? t('adminUsers.loadingBranches')
                : t('adminUsers.selectBranch')}
          </option>
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.name}
            </option>
          ))}
        </Select>
        <Input label={t('adminUsers.firstName')} error={errors.firstName?.message} {...register('firstName')} />
        <Input label={t('adminUsers.lastName')} error={errors.lastName?.message} {...register('lastName')} />
        <Input label={t('adminUsers.email')} type="email" error={errors.email?.message} {...register('email')} />
        <Input label={t('adminUsers.phone')} error={errors.phone?.message} {...register('phone')} />
        <Input label={t('adminUsers.password')} type="password" error={errors.password?.message} {...register('password')} />
        <Input label={t('adminUsers.confirmPassword')} type="password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
      </div>

      <div className="flex justify-end gap-2">
        {onCancel ? (
          <Button type="button" variant="secondary" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
        ) : null}
        <Button type="submit" isLoading={isSubmitting}>
          {t('adminUsers.createAdminUser')}
        </Button>
      </div>
    </form>
  );
}
