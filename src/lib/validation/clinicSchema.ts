import { z } from 'zod';

const nullableNumber = z.preprocess((value) => {
  if (value === '' || value === undefined || value === null) {
    return null;
  }

  return value;
}, z.coerce.number().nullable());

export function createClinicSchema(t: (key: string) => string) {
  return z
    .object({
      name: z.string().min(1, t('validation.requiredName')),
      country: z.string().optional(),
      countryId: z.string().min(1, t('validation.requiredCountry')),
      city: z.string().optional(),
      cityId: z.string().min(1, t('validation.requiredCity')),
      address: z.string().min(1, t('validation.requiredAddress')),
      phone: z.string().min(1, t('validation.requiredPhone')),
      email: z.string().email(t('validation.validEmail')).or(z.literal('')),
      website: z.string().url(t('validation.validUrl')).or(z.literal('')),
      workingHours: z.string().optional(),
      description: z.string().optional(),
      contactPersonName: z.string().optional(),
      contactPersonPhone: z.string().optional(),
      contactPersonEmail: z.string().email(t('validation.validEmail')).or(z.literal('')),
      isActive: z.boolean(),
      isVerified: z.boolean(),
      isProcedureRoom: z.boolean(),
      procedureRoomPrice: nullableNumber,
      isTraumaCenter: z.boolean(),
      traumaCenterPrice: nullableNumber,
      latitude: nullableNumber,
      longitude: nullableNumber,
    })
    .superRefine((values, context) => {
      if (values.isProcedureRoom && (values.procedureRoomPrice === null || Number.isNaN(values.procedureRoomPrice))) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['procedureRoomPrice'],
          message: t('validation.requiredProcedureRoomPrice'),
        });
      }
      if (values.isTraumaCenter && (values.traumaCenterPrice === null || Number.isNaN(values.traumaCenterPrice))) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['traumaCenterPrice'],
          message: t('validation.requiredTraumaCenterPrice'),
        });
      }
    });
}

export type ClinicSchemaValues = z.infer<ReturnType<typeof createClinicSchema>>;
