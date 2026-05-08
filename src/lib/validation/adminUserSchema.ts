import { z } from 'zod';

export function createAdminUserSchema(requirePassword: boolean) {
  return z
    .object({
      role: z.enum(['clinicAdmin', 'clinicBranchAdmin']),
      clinicBranchId: z.string().optional(),
      firstName: z.string().min(1, 'First name is required'),
      lastName: z.string().min(1, 'Last name is required'),
      email: z.string().email('Enter a valid email'),
      phone: z.string().min(1, 'Phone is required'),
      password: requirePassword
        ? z.string().min(6, 'Password must be at least 6 characters')
        : z.string().optional().default(''),
      confirmPassword: requirePassword
        ? z.string().min(1, 'Confirm password is required')
        : z.string().optional().default(''),
    })
    .superRefine((values, context) => {
      if (values.role === 'clinicBranchAdmin' && !values.clinicBranchId) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['clinicBranchId'],
          message: 'Branch is required',
        });
      }

      if (requirePassword && values.password !== values.confirmPassword) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['confirmPassword'],
          message: 'Passwords do not match',
        });
      }
    });
}

export const adminUserSchema = createAdminUserSchema(true);

export type AdminUserSchemaValues = z.infer<typeof adminUserSchema>;
