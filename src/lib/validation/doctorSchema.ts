import { z } from 'zod';

import type { DoctorType, Gender } from '../../services/doctorService';

const doctorSlotSchema = z.object({
  id: z.string(),
  start: z.string(),
  end: z.string(),
  enabled: z.boolean(),
});

const daySlotsSchema = z.object({
  slotDuration: z.union([z.literal(1800), z.literal(3600)]),
  morningStart: z.string(),
  morningEnd: z.string(),
  eveningStart: z.string(),
  eveningEnd: z.string(),
  locked: z.boolean(),
  slots: z.array(doctorSlotSchema),
});

const numericRequired = z.preprocess((value) => {
  if (value === '' || value === undefined || value === null) {
    return undefined;
  }

  return value;
}, z.coerce.number({
  invalid_type_error: 'Enter a number',
}).min(0, 'Enter a valid number'));

const experienceField = z.preprocess((value) => {
  if (value === '' || value === undefined || value === null) return undefined;
  return value;
}, z.coerce.number({ invalid_type_error: 'Enter a number' }).min(0, 'Enter a valid number').max(80, 'Max 80 years'));

const priceField = z.preprocess((value) => {
  if (value === '' || value === undefined || value === null) return undefined;
  return value;
}, z.coerce.number({ invalid_type_error: 'Enter a number' }).min(0, 'Enter a valid number').max(1_000_000, 'Max 1 000 000'));

const nullableCoordinate = z.preprocess((value) => {
  if (value === '' || value === undefined || value === null) {
    return null;
  }

  return value;
}, z.coerce.number().nullable());

export function createDoctorSchema(options: { isCreate: boolean; requireClinicBranch: boolean }) {
  return z
    .object({
      name: z.string().min(1, 'First name is required'),
      lastName: z.string().min(1, 'Last name is required'),
      middleName: z.string().optional(),
      email: z.string().email('Enter a valid email'),
      phone: z.string().min(1, 'Phone is required'),
      gender: z.enum(['male', 'female', 'other'] satisfies [Gender, ...Gender[]]),
      clinicBranchId: options.requireClinicBranch ? z.string().optional() : z.string().optional(),
      departmentId: z.string().min(1, 'Department is required'),
      countryId: z.string().min(1, 'Country is required'),
      cityId: z.string().min(1, 'City is required'),
      districtId: z.string().optional(),
      specialist: z.string().min(1, 'Speciality is required'),
      registrationNumber: z.string().optional(),
      workPlace: z.string().optional(),
      experience: experienceField,
      price: priceField,
      doctorType: z.enum(['adults', 'kids'] satisfies [DoctorType, ...DoctorType[]]),
      avatar: z.string().url('Enter a valid URL').or(z.literal('')).optional(),
      aboutMe: z.string().optional(),
      currentLatitude: nullableCoordinate,
      currentLongitude: nullableCoordinate,
      locationTrackingEnabled: z.boolean(),
      serviceRadius: numericRequired,
      isVerified: z.boolean(),
      isActive: z.boolean(),
      busy: z.boolean(),
      isOnline: z.boolean(),
      isAvailable: z.boolean(),
      balance: numericRequired,
      revenue: numericRequired,
      averageRating: numericRequired,
      reviewCount: numericRequired,
      password: options.isCreate ? z.string().min(6, 'Password must be at least 6 characters') : z.string().optional(),
      confirmPassword: options.isCreate ? z.string().min(1, 'Confirm password is required') : z.string().optional(),
      weekSlots: z.record(daySlotsSchema),
      diplomaFile: options.isCreate ? z.instanceof(File, { message: 'Diploma file is required' }) : z.instanceof(File).optional().or(z.undefined()),
      passportFile: options.isCreate ? z.instanceof(File, { message: 'Passport file is required' }) : z.instanceof(File).optional().or(z.undefined()),
      certificateFile: z.instanceof(File).optional().or(z.undefined()),
      specialLicenceFile: z.instanceof(File).optional().or(z.undefined()),
    })
    .superRefine((values, context) => {
      if (options.isCreate && values.password !== values.confirmPassword) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['confirmPassword'],
          message: 'Passwords do not match',
        });
      }
    });
}

export type DoctorSchemaValues = z.infer<ReturnType<typeof createDoctorSchema>>;
