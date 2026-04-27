import { z } from 'zod';

const nullableNumber = z.preprocess((value) => {
  if (value === '' || value === undefined || value === null) {
    return null;
  }

  return value;
}, z.coerce.number().nullable());

export const clinicSchema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    country: z.string().optional(),
    countryId: z.string().min(1, 'Country ID is required'),
    city: z.string().optional(),
    cityId: z.string().min(1, 'City ID is required'),
    address: z.string().min(1, 'Address is required'),
    phone: z.string().min(1, 'Phone is required'),
    email: z.string().email('Enter a valid email').or(z.literal('')),
    website: z.string().url('Enter a valid URL').or(z.literal('')),
    workingHours: z.string().optional(),
    description: z.string().optional(),
    contactPersonName: z.string().optional(),
    contactPersonPhone: z.string().optional(),
    contactPersonEmail: z.string().email('Enter a valid email').or(z.literal('')),
    isActive: z.boolean(),
    isVerified: z.boolean(),
    isProcedureRoom: z.boolean(),
    procedureRoomPrice: nullableNumber,
    isTraumaCenter: z.boolean(),
    latitude: nullableNumber,
    longitude: nullableNumber,
  })
  .superRefine((values, context) => {
    if (values.isProcedureRoom && (values.procedureRoomPrice === null || Number.isNaN(values.procedureRoomPrice))) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['procedureRoomPrice'],
        message: 'Procedure room price is required',
      });
    }
  });

export type ClinicSchemaValues = z.infer<typeof clinicSchema>;
