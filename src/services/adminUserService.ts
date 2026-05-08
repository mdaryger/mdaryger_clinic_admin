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
import { normalizeRole } from '../lib/roleHelpers';

const CLINIC_ADMIN_COLLECTION = 'clinic_admin';
const CLINIC_BRANCH_ADMIN_COLLECTION = 'clinic_branch_admin';

export type AdminUserRole = 'clinicAdmin' | 'clinicBranchAdmin';

export type AdminUser = {
  id: string;
  uid: string;
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  phone: string;
  role: AdminUserRole | 'clinic_admin' | 'clinic_branch_admin';
  normalizedRole: 'clinic_admin' | 'clinic_branch_admin';
  clinicId: string;
  clinicBranchId?: string | null;
  clinic?: Record<string, unknown> | null;
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: unknown;
  updatedAt: unknown;
  lastLoginAt?: unknown;
};

export type CreateAdminUserData = {
  role: AdminUserRole;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  clinicId: string;
  clinicBranchId?: string;
  clinic?: Record<string, unknown> | null;
};

export type UpdateAdminUserData = {
  role: AdminUserRole;
  firstName: string;
  lastName: string;
  phone: string;
  clinicId: string;
  clinicBranchId?: string;
  clinic?: Record<string, unknown> | null;
};

function getCollectionNameByRole(role: AdminUserRole | 'clinic_admin' | 'clinic_branch_admin'): string {
  return normalizeRole(role) === 'clinic_branch_admin' ? CLINIC_BRANCH_ADMIN_COLLECTION : CLINIC_ADMIN_COLLECTION;
}

function normalizeAdminUser(snapshot: QueryDocumentSnapshot<DocumentData>, collectionName: string): AdminUser {
  const data = snapshot.data() as Record<string, unknown>;
  const role = typeof data.role === 'string' ? data.role : collectionName;
  const normalizedRole = normalizeRole(role) === 'clinic_branch_admin' ? 'clinic_branch_admin' : 'clinic_admin';

  return {
    id: snapshot.id,
    uid: snapshot.id,
    firstName: String(data.firstName ?? ''),
    lastName: String(data.lastName ?? ''),
    displayName: String(data.displayName ?? `${String(data.firstName ?? '')} ${String(data.lastName ?? '')}`.trim()),
    email: String(data.email ?? ''),
    phone: String(data.phone ?? ''),
    role: role as AdminUser['role'],
    normalizedRole,
    clinicId: String(data.clinicId ?? ''),
    clinicBranchId: typeof data.clinicBranchId === 'string' ? data.clinicBranchId : null,
    clinic: (data.clinic as Record<string, unknown> | null | undefined) ?? null,
    isActive: Boolean(data.isActive),
    isEmailVerified: Boolean(data.isEmailVerified),
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    lastLoginAt: data.lastLoginAt,
  };
}

export async function getClinicAdminsByClinicId(clinicId: string): Promise<AdminUser[]> {
  const snapshot = await getDocs(query(collection(db, CLINIC_ADMIN_COLLECTION), where('clinicId', '==', clinicId)));

  return snapshot.docs.map((documentSnapshot) => normalizeAdminUser(documentSnapshot, CLINIC_ADMIN_COLLECTION));
}

export async function getBranchAdminsByClinicId(clinicId: string): Promise<AdminUser[]> {
  const snapshot = await getDocs(query(collection(db, CLINIC_BRANCH_ADMIN_COLLECTION), where('clinicId', '==', clinicId)));

  return snapshot.docs.map((documentSnapshot) => normalizeAdminUser(documentSnapshot, CLINIC_BRANCH_ADMIN_COLLECTION));
}

export async function getAdminUsersByClinicId(clinicId: string): Promise<AdminUser[]> {
  const [clinicAdmins, branchAdmins] = await Promise.all([
    getClinicAdminsByClinicId(clinicId),
    getBranchAdminsByClinicId(clinicId),
  ]);

  return [...clinicAdmins, ...branchAdmins];
}

export async function getAdminUserById(userId: string): Promise<AdminUser | null> {
  const [clinicAdminSnapshot, branchAdminSnapshot] = await Promise.all([
    getDoc(doc(db, CLINIC_ADMIN_COLLECTION, userId)),
    getDoc(doc(db, CLINIC_BRANCH_ADMIN_COLLECTION, userId)),
  ]);

  if (clinicAdminSnapshot.exists()) {
    return normalizeAdminUser(clinicAdminSnapshot as QueryDocumentSnapshot<DocumentData>, CLINIC_ADMIN_COLLECTION);
  }

  if (branchAdminSnapshot.exists()) {
    return normalizeAdminUser(branchAdminSnapshot as QueryDocumentSnapshot<DocumentData>, CLINIC_BRANCH_ADMIN_COLLECTION);
  }

  return null;
}

export async function createAdminUser(data: CreateAdminUserData): Promise<AdminUser> {
  const secondaryApp = initializeApp(selectedFirebaseConfig, `admin-user-create-${Date.now()}`);
  const secondaryAuth = getAuth(secondaryApp);
  const collectionName = getCollectionNameByRole(data.role);

  try {
    const credential = await createUserWithEmailAndPassword(secondaryAuth, data.email, data.password);
    const uid = credential.user.uid;
    const roleValue = data.role === 'clinicBranchAdmin' ? 'clinicBranchAdmin' : 'clinicAdmin';

    await setDoc(doc(db, collectionName, uid), {
      uid,
      firstName: data.firstName,
      lastName: data.lastName,
      displayName: `${data.firstName} ${data.lastName}`.trim(),
      email: data.email,
      phone: data.phone,
      role: roleValue,
      clinicId: data.clinicId,
      clinicBranchId: data.role === 'clinicBranchAdmin' ? data.clinicBranchId ?? '' : null,
      clinic: data.clinic ?? null,
      isActive: true,
      isEmailVerified: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const createdUser = await getAdminUserById(uid);

    if (!createdUser) {
      throw new Error(`Admin user ${uid} was created but could not be loaded.`);
    }

    return createdUser;
  } catch (error) {
    if (secondaryAuth.currentUser) {
      try {
        await deleteUser(secondaryAuth.currentUser);
      } catch {
        // Best effort cleanup for partial admin user creation.
      }
    }

    throw error;
  } finally {
    try {
      await signOut(secondaryAuth);
    } catch {
      // Ignore secondary auth cleanup errors.
    }

    await deleteApp(secondaryApp);
  }
}

export async function updateAdminStatus(
  userId: string,
  role: AdminUser['role'],
  isActive: boolean,
): Promise<void> {
  await updateDoc(doc(db, getCollectionNameByRole(role), userId), {
    isActive,
    updatedAt: serverTimestamp(),
  });
}

export async function updateAdminUser(
  userId: string,
  data: UpdateAdminUserData,
): Promise<AdminUser> {
  const existingUser = await getAdminUserById(userId);

  if (!existingUser) {
    throw new Error(`Admin user ${userId} not found.`);
  }

  const currentCollectionName = getCollectionNameByRole(existingUser.role);
  const targetRole = data.role === 'clinicBranchAdmin' ? 'clinicBranchAdmin' : 'clinicAdmin';
  const targetCollectionName = getCollectionNameByRole(targetRole);
  const payload = {
    uid: existingUser.uid,
    firstName: data.firstName,
    lastName: data.lastName,
    displayName: `${data.firstName} ${data.lastName}`.trim(),
    email: existingUser.email,
    phone: data.phone,
    role: targetRole,
    clinicId: data.clinicId,
    clinicBranchId: data.role === 'clinicBranchAdmin' ? data.clinicBranchId ?? '' : null,
    clinic: data.clinic ?? existingUser.clinic ?? null,
    isActive: existingUser.isActive,
    isEmailVerified: existingUser.isEmailVerified,
    createdAt: existingUser.createdAt,
    updatedAt: serverTimestamp(),
    lastLoginAt: existingUser.lastLoginAt ?? null,
  };

  if (currentCollectionName === targetCollectionName) {
    await updateDoc(doc(db, currentCollectionName, userId), {
      ...payload,
    });
  } else {
    await setDoc(doc(db, targetCollectionName, userId), payload);
    await deleteDoc(doc(db, currentCollectionName, userId));
  }

  const updatedUser = await getAdminUserById(userId);

  if (!updatedUser) {
    throw new Error(`Admin user ${userId} was updated but could not be loaded.`);
  }

  return updatedUser;
}

// TODO: In production, replace createAdminUser with a secure Cloud Function.
