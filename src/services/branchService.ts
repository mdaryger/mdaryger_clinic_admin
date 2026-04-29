import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  deleteDoc,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';

import { db } from '../firebase/firebase';

const CLINIC_BRANCHES_COLLECTION = 'clinic_branches';

export type WorkingDay =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export type ClinicBranch = {
  id: string;
  clinicId: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  cityId: string;
  country: string;
  countryId: string;
  description: string;
  district: string;
  email: string;
  website: string;
  latitude: number | null;
  longitude: number | null;
  openingHours: string;
  closingHours: string;
  workingDays: WorkingDay[];
  isActive: boolean;
  isMainBranch: boolean;
  branchManagerName: string;
  branchManagerPhone: string;
  branchManagerEmail: string;
  createdAt: unknown;
  updatedAt: unknown;
};

export type BranchFormData = Omit<ClinicBranch, 'id' | 'createdAt' | 'updatedAt'>;

function normalizeBranch(snapshot: QueryDocumentSnapshot<DocumentData>): ClinicBranch {
  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as ClinicBranch;
}

export async function getBranchesByClinicId(clinicId: string): Promise<ClinicBranch[]> {
  try {
    const snapshot = await getDocs(
      query(
        collection(db, CLINIC_BRANCHES_COLLECTION),
        where('clinicId', '==', clinicId),
        orderBy('createdAt', 'desc'),
      ),
    );

    return snapshot.docs.map(normalizeBranch);
  } catch {
    const snapshot = await getDocs(
      query(collection(db, CLINIC_BRANCHES_COLLECTION), where('clinicId', '==', clinicId)),
    );

    return snapshot.docs.map(normalizeBranch);
  }
}

export async function getActiveBranchesByClinicId(clinicId: string): Promise<ClinicBranch[]> {
  try {
    const snapshot = await getDocs(
      query(
        collection(db, CLINIC_BRANCHES_COLLECTION),
        where('clinicId', '==', clinicId),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc'),
      ),
    );

    return snapshot.docs.map(normalizeBranch);
  } catch {
    const snapshot = await getDocs(
      query(
        collection(db, CLINIC_BRANCHES_COLLECTION),
        where('clinicId', '==', clinicId),
        where('isActive', '==', true),
      ),
    );

    return snapshot.docs.map(normalizeBranch);
  }
}

export async function getBranchById(branchId: string): Promise<ClinicBranch | null> {
  if (!branchId.trim()) {
    return null;
  }

  const snapshot = await getDoc(doc(db, CLINIC_BRANCHES_COLLECTION, branchId));

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as ClinicBranch;
}

export async function createBranch(data: BranchFormData): Promise<ClinicBranch> {
  const collectionRef = collection(db, CLINIC_BRANCHES_COLLECTION);
  const documentRef = doc(collectionRef);

  await setDoc(documentRef, {
    id: documentRef.id,
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  const createdBranch = await getBranchById(documentRef.id);

  if (!createdBranch) {
    throw new Error(`Branch ${documentRef.id} was created but could not be loaded.`);
  }

  return createdBranch;
}

export async function updateBranch(branchId: string, data: Partial<BranchFormData>): Promise<void> {
  await updateDoc(doc(db, CLINIC_BRANCHES_COLLECTION, branchId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function updateBranchStatus(branchId: string, isActive: boolean): Promise<void> {
  await updateDoc(doc(db, CLINIC_BRANCHES_COLLECTION, branchId), {
    isActive,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteBranch(branchId: string): Promise<void> {
  await deleteDoc(doc(db, CLINIC_BRANCHES_COLLECTION, branchId));
}
