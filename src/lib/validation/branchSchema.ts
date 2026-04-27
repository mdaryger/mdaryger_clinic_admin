import { z } from 'zod';

const emailField = z.string().email('Enter a valid email').or(z.literal(''));
const websiteField = z.string().url('Enter a valid URL').or(z.literal(''));

export const branchSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  address: z.string().min(1, 'Address is required'),
  country: z.string().optional(),
  countryId: z.string().min(1, 'Country is required'),
  city: z.string().optional(),
  cityId: z.string().min(1, 'City is required'),
  phone: z.string().min(1, 'Phone is required'),
  email: emailField,
  website: websiteField,
  description: z.string().optional(),
  openingHours: z.string().min(1, 'Opening time is required'),
  closingHours: z.string().min(1, 'Closing time is required'),
  isMainBranch: z.boolean(),
  branchManagerName: z.string().min(1, 'Manager name is required'),
  branchManagerPhone: z.string().min(1, 'Manager phone is required'),
  branchManagerEmail: emailField,
});

export type BranchSchemaValues = z.infer<typeof branchSchema>;
