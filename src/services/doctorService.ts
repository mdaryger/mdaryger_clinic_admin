import { createUserWithEmailAndPassword, deleteUser, getAuth, signOut } from 'firebase/auth';
import { deleteApp, initializeApp } from 'firebase/app';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';

import { selectedFirebaseConfig } from '../firebase/config';
import { db } from '../firebase/firebase';
import { uploadFile } from './storageService';

const DOCTORS_COLLECTION = 'doctors';
const REQUEST_COLLECTIONS = [
  'home_visit_requests',
  'clinic_visit_requests',
  'home_visit_requests_plan',
] as const;
const APPOINTMENTS_COLLECTION = 'appointments';

export type DoctorType = 'adults' | 'kids';
export type Gender = 'male' | 'female' | 'other';
export type SlotDuration = 1800 | 3600;

export type DoctorSlot = {
  id: string;
  start: string;
  end: string;
  enabled: boolean;
};

export type DaySlots = {
  slotDuration: SlotDuration;
  morningStart: string;
  morningEnd: string;
  eveningStart: string;
  eveningEnd: string;
  locked: boolean;
  slots: DoctorSlot[];
};

export type WeekSlots = Record<string, DaySlots>;

export type DoctorLocation = {
  latitude: number | null;
  longitude: number | null;
};

export type Doctor = {
  id: string;
  name: string;
  lastName: string;
  middleName: string;
  email: string;
  phone: string;
  gender: Gender;
  clinicId: string;
  clinicName: string;
  clinicBranchId: string;
  departmentId: string;
  cityId: string;
  countryId: string;
  districtId: string;
  specialist: string;
  registrationNumber: string;
  workPlace: string;
  experience: number;
  price: number;
  doctorType: DoctorType;
  avatar: string;
  aboutMe: string;
  currentLocation: DoctorLocation;
  locationTrackingEnabled: boolean;
  serviceRadius: number;
  isVerified: boolean;
  isActive: boolean;
  busy: boolean;
  isOnline: boolean;
  isAvailable: boolean;
  balance: number;
  revenue: number;
  averageRating: number;
  reviewCount: number;
  diplomaUrl: string;
  licenceUrl: string;
  passportUrl: string;
  certificateUrl: string;
  specialLicenceUrl: string;
  createdAt: unknown;
  updatedAt: unknown;
  lastActiveAt: unknown;
  weekSlots: WeekSlots;
};

export type DoctorFormData = Omit<Doctor, 'id' | 'createdAt' | 'updatedAt' | 'lastActiveAt'>;

export type DoctorAuthData = {
  password: string;
};

export type DoctorFiles = {
  diplomaFile?: File;
  passportFile?: File;
  certificateFile?: File;
  specialLicenceFile?: File;
};

function normalizeDoctor(snapshot: QueryDocumentSnapshot<DocumentData>): Doctor {
  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as Doctor;
}

function getFileExtension(file: File): string {
  return file.name.split('.').pop()?.toLowerCase() || 'bin';
}

async function uploadDoctorFiles(doctorId: string, files: DoctorFiles): Promise<Partial<DoctorFormData>> {
  const entries = await Promise.all([
    files.diplomaFile
      ? uploadFile(`doctors/${doctorId}/diploma.${getFileExtension(files.diplomaFile)}`, files.diplomaFile).then((url) => ['diplomaUrl', url] as const)
      : Promise.resolve(null),
    files.passportFile
      ? uploadFile(`doctors/${doctorId}/passport.${getFileExtension(files.passportFile)}`, files.passportFile).then((url) => ['passportUrl', url] as const)
      : Promise.resolve(null),
    files.certificateFile
      ? uploadFile(`doctors/${doctorId}/certificate.${getFileExtension(files.certificateFile)}`, files.certificateFile).then((url) => ['certificateUrl', url] as const)
      : Promise.resolve(null),
    files.specialLicenceFile
      ? uploadFile(`doctors/${doctorId}/special-licence.${getFileExtension(files.specialLicenceFile)}`, files.specialLicenceFile).then((url) => ['specialLicenceUrl', url] as const)
      : Promise.resolve(null),
  ]);

  return Object.fromEntries(entries.filter(Boolean).map((entry) => [entry![0], entry![1]])) as Partial<DoctorFormData>;
}

export function createDefaultDaySlots(): DaySlots {
  return {
    slotDuration: 1800,
    morningStart: '09:00',
    morningEnd: '13:00',
    eveningStart: '14:00',
    eveningEnd: '18:00',
    locked: false,
    slots: [],
  };
}

export function createDefaultWeekSlots(): WeekSlots {
  return {
    0: { ...createDefaultDaySlots(), locked: true },
    1: { ...createDefaultDaySlots(), locked: true },
    2: { ...createDefaultDaySlots(), locked: true },
    3: { ...createDefaultDaySlots(), locked: true },
    4: { ...createDefaultDaySlots(), locked: true },
    5: { ...createDefaultDaySlots(), locked: true },
    6: { ...createDefaultDaySlots(), locked: true },
  };
}

export async function getDoctorsByClinicId(clinicId: string): Promise<Doctor[]> {
  const snapshot = await getDocs(query(collection(db, DOCTORS_COLLECTION), where('clinicId', '==', clinicId)));

  return snapshot.docs.map(normalizeDoctor);
}

export async function getDoctorsByBranchId(clinicBranchId: string): Promise<Doctor[]> {
  const snapshot = await getDocs(query(collection(db, DOCTORS_COLLECTION), where('clinicBranchId', '==', clinicBranchId)));

  return snapshot.docs.map(normalizeDoctor);
}

export async function getDoctorById(doctorId: string): Promise<Doctor | null> {
  const snapshot = await getDoc(doc(db, DOCTORS_COLLECTION, doctorId));

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as Doctor;
}

export async function createDoctor(
  data: DoctorFormData,
  files: DoctorFiles,
  authData: DoctorAuthData,
): Promise<Doctor> {
  if (!authData.password) {
    throw new Error('Doctor password is required for account creation.');
  }

  const secondaryApp = initializeApp(selectedFirebaseConfig, `doctor-create-${Date.now()}`);
  const secondaryAuth = getAuth(secondaryApp);
  let doctorId: string | null = null;

  try {
    const credential = await createUserWithEmailAndPassword(secondaryAuth, data.email, authData.password);
    doctorId = credential.user.uid;

    const uploadedFiles = await uploadDoctorFiles(doctorId, files);

    await setDoc(doc(db, DOCTORS_COLLECTION, doctorId), {
      id: doctorId,
      ...data,
      ...uploadedFiles,
      diplomaUrl: uploadedFiles.diplomaUrl ?? '',
      passportUrl: uploadedFiles.passportUrl ?? '',
      certificateUrl: uploadedFiles.certificateUrl ?? data.certificateUrl ?? '',
      specialLicenceUrl: uploadedFiles.specialLicenceUrl ?? data.specialLicenceUrl ?? '',
      licenceUrl: data.licenceUrl ?? '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastActiveAt: serverTimestamp(),
    });

    const doctor = await getDoctorById(doctorId);

    if (!doctor) {
      throw new Error(`Doctor ${doctorId} was created but could not be loaded.`);
    }

    return doctor;
  } catch (error) {
    if (secondaryAuth.currentUser) {
      try {
        await deleteUser(secondaryAuth.currentUser);
      } catch {
        // Best effort cleanup for partial doctor creation.
      }
    }

    throw error;
  } finally {
    try {
      await signOut(secondaryAuth);
    } catch {
      // Ignore sign-out cleanup errors on the secondary app.
    }
    await deleteApp(secondaryApp);
  }
}

export async function updateDoctor(
  doctorId: string,
  data: Partial<DoctorFormData>,
  files?: DoctorFiles,
): Promise<void> {
  const uploadedFiles = files ? await uploadDoctorFiles(doctorId, files) : {};

  await updateDoc(doc(db, DOCTORS_COLLECTION, doctorId), {
    ...data,
    ...uploadedFiles,
    updatedAt: serverTimestamp(),
  });
}

export async function updateDoctorStatus(doctorId: string, isActive: boolean): Promise<void> {
  await updateDoc(doc(db, DOCTORS_COLLECTION, doctorId), {
    isActive,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteDoctor(doctorId: string): Promise<void> {
  const relatedRequests = await Promise.all(
    REQUEST_COLLECTIONS.map((collectionName) =>
      getDocs(query(collection(db, collectionName), where('selectedDoctorId', '==', doctorId))),
    ),
  );
  const appointmentsSnapshot = await getDocs(
    query(collection(db, APPOINTMENTS_COLLECTION), where('doctorId', '==', doctorId)),
  );

  await Promise.all([
    ...relatedRequests.flatMap((snapshot) =>
      snapshot.docs.map((documentSnapshot) => deleteDoc(doc(db, documentSnapshot.ref.path))),
    ),
    ...appointmentsSnapshot.docs.map((documentSnapshot) => deleteDoc(doc(db, documentSnapshot.ref.path))),
  ]);

  await deleteDoc(doc(db, DOCTORS_COLLECTION, doctorId));

  // TODO: Delete the related Firebase Auth user through a secure Cloud Function.
}
