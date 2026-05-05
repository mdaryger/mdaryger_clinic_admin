export type ClinicLocation = {
  latitude: number | null;
  longitude: number | null;
};

export type Clinic = {
  id: string;
  name: string;
  address: string;
  city: string;
  cityId: string;
  country: string;
  countryId: string;
  phone: string;
  workingHours: string;
  email: string;
  website: string;
  description: string;
  logoUrl: string;
  coverImageUrl: string;
  isProcedureRoom: boolean;
  procedureRoomPrice: number | null;
  isTraumaCenter: boolean;
  traumaCenterPrice: number | null;
  location: ClinicLocation;
  isActive: boolean;
  isVerified: boolean;
  contactPersonName: string;
  contactPersonPhone: string;
  contactPersonEmail: string;
  createdAt: unknown;
  updatedAt: unknown;
};

export type ClinicFormData = Omit<Clinic, 'id' | 'logoUrl' | 'coverImageUrl' | 'createdAt' | 'updatedAt'> & {
  logoUrl?: string;
  coverImageUrl?: string;
};

export type CreateClinicData = ClinicFormData;
export type UpdateClinicData = Partial<ClinicFormData>;
