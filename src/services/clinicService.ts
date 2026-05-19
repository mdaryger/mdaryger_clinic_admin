import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';

import { db } from '../firebase/firebase';
import type { Clinic, CreateClinicData, UpdateClinicData } from '../types/clinic';
import { deleteClinicCascade } from './functionsService';
import { uploadFile } from './storageService';

const CLINICS_COLLECTION = 'clinics';
const CLINICS_COUNTER_ID = 'clinics';

function normalizeClinic(snapshot: QueryDocumentSnapshot<DocumentData>): Clinic {
  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as Clinic;
}

function getFileExtension(file: File): string {
  const extension = file.name.split('.').pop()?.toLowerCase();

  return extension || 'bin';
}

function parseClinicNumber(id: string): number | null {
  const match = /^clinic_(\d+)$/.exec(id);

  return match ? Number(match[1]) : null;
}

async function uploadClinicImages(clinicId: string, logoFile?: File, coverFile?: File) {
  const [logoUrl, coverImageUrl] = await Promise.all([
    logoFile ? uploadFile(`clinics/${clinicId}/logo.${getFileExtension(logoFile)}`, logoFile) : Promise.resolve(undefined),
    coverFile ? uploadFile(`clinics/${clinicId}/cover.${getFileExtension(coverFile)}`, coverFile) : Promise.resolve(undefined),
  ]);

  return { logoUrl, coverImageUrl };
}

export async function getAllClinics(): Promise<Clinic[]> {
  const snapshot = await getDocs(collection(db, CLINICS_COLLECTION));

  return snapshot.docs.map(normalizeClinic);
}

export async function getClinicById(id: string): Promise<Clinic | null> {
  const snapshot = await getDoc(doc(db, CLINICS_COLLECTION, id));

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as Clinic;
}

export async function getActiveClinics(): Promise<Clinic[]> {
  const snapshot = await getDocs(query(collection(db, CLINICS_COLLECTION), where('isActive', '==', true)));

  return snapshot.docs.map(normalizeClinic);
}

export async function getClinicsByCity(cityId: string): Promise<Clinic[]> {
  const snapshot = await getDocs(query(collection(db, CLINICS_COLLECTION), where('cityId', '==', cityId)));

  return snapshot.docs.map(normalizeClinic);
}

export async function createClinic(data: CreateClinicData, logoFile?: File, coverFile?: File): Promise<Clinic> {
  const clinicId = await runTransaction(db, async (transaction) => {
    const clinicsSnapshot = await getDocs(collection(db, CLINICS_COLLECTION));
    const counterRef = doc(db, 'counters', CLINICS_COUNTER_ID);
    const counterSnapshot = await transaction.get(counterRef);
    const counterLast = counterSnapshot.exists() ? Number(counterSnapshot.data().last ?? 0) : 0;
    const maxFromIds = clinicsSnapshot.docs.reduce((max, clinicDoc) => {
      const clinicNumber = parseClinicNumber(clinicDoc.id);

      return clinicNumber && clinicNumber > max ? clinicNumber : max;
    }, 0);
    const nextNumber = Math.max(counterLast, maxFromIds) + 1;
    const nextId = `clinic_${String(nextNumber).padStart(3, '0')}`;
    const clinicRef = doc(db, CLINICS_COLLECTION, nextId);

    transaction.set(clinicRef, {
      id: nextId,
      ...data,
      logoUrl: data.logoUrl ?? '',
      coverImageUrl: data.coverImageUrl ?? '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    transaction.set(counterRef, { last: nextNumber, updatedAt: serverTimestamp() }, { merge: true });

    return nextId;
  });

  const uploads = await uploadClinicImages(clinicId, logoFile, coverFile);
  const uploadData = Object.fromEntries(Object.entries(uploads).filter(([, value]) => Boolean(value)));

  if (Object.keys(uploadData).length > 0) {
    await updateDoc(doc(db, CLINICS_COLLECTION, clinicId), {
      ...uploadData,
      updatedAt: serverTimestamp(),
    });
  }

  const clinic = await getClinicById(clinicId);

  if (!clinic) {
    throw new Error(`Clinic ${clinicId} was created but could not be loaded.`);
  }

  return clinic;
}

export async function updateClinic(
  id: string,
  data: UpdateClinicData,
  logoFile?: File,
  coverFile?: File,
): Promise<void> {
  const uploads = await uploadClinicImages(id, logoFile, coverFile);
  const uploadData = Object.fromEntries(Object.entries(uploads).filter(([, value]) => Boolean(value)));

  await updateDoc(doc(db, CLINICS_COLLECTION, id), {
    id,
    ...data,
    ...uploadData,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteClinic(id: string): Promise<void> {
  await deleteClinicCascade(id);
}
