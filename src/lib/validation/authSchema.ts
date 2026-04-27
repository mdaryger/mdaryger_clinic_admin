import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const passwordConfirmationBaseSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Confirm your password'),
});

export const passwordConfirmationSchema = passwordConfirmationBaseSchema
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

export type LoginSchemaValues = z.infer<typeof loginSchema>;
export type PasswordConfirmationSchemaValues = z.infer<typeof passwordConfirmationSchema>;
