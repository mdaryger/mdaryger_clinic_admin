import { z } from 'zod';

export const adminUserSchema = z
  .object({
    role: z.enum(['clinicAdmin', 'clinicBranchAdmin']),
    clinicBranchId: z.string().optional(),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Enter a valid email'),
    phone: z.string().min(1, 'Phone is required'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Confirm password is required'),
  })
  .superRefine((values, context) => {
    if (values.role === 'clinicBranchAdmin' && !values.clinicBranchId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['clinicBranchId'],
        message: 'Branch is required',
      });
    }

    if (values.password !== values.confirmPassword) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['confirmPassword'],
        message: 'Passwords do not match',
      });
    }
  });

export type AdminUserSchemaValues = z.infer<typeof adminUserSchema>;
