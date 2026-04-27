import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  reload,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  type Unsubscribe,
  type User,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type DocumentData,
  type QueryConstraint,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';

import { auth, db } from '../firebase/firebase';
import { PROFILE_COLLECTIONS, isClinicScopedRole, normalizeRole } from '../lib/roleHelpers';
import type { AuthProfile, AuthProfileSource, LoadedAuthProfile } from '../types/auth';
import type { NormalizedRole } from '../types/utils';

type ProfileLookupResult = {
  profile: AuthProfile;
  source: AuthProfileSource;
};

const COLLECTION_ROLE_MAP: Record<string, NormalizedRole> = {
  super_admin: 'super_admin',
  admin: 'admin',
  clinic_admin: 'clinic_admin',
  clinic_branch_admin: 'clinic_branch_admin',
};

function getRoleFromCollectionName(collectionName: string): NormalizedRole | null {
  return COLLECTION_ROLE_MAP[collectionName] ?? null;
}

function withResolvedProfileRole(
  profile: AuthProfile,
  source: AuthProfileSource | null,
): AuthProfile {
  if (normalizeRole(profile.role)) {
    return profile;
  }

  const inferredRole = source ? getRoleFromCollectionName(source.collectionName) : null;

  if (!inferredRole) {
    return profile;
  }

  return {
    ...profile,
    role: inferredRole,
  };
}

function normalizeDocument<T extends Record<string, unknown>>(snapshot: QueryDocumentSnapshot<DocumentData>): T {
  const normalizedDocument = {
    id: snapshot.id,
    ...snapshot.data(),
  };

  return normalizedDocument as unknown as T;
}

async function getProfileByDocId(collectionName: string, uid: string): Promise<ProfileLookupResult | null> {
  const snapshot = await getDoc(doc(db, collectionName, uid));

  if (!snapshot.exists()) {
    return null;
  }

  return {
    profile: {
      id: snapshot.id,
      uid,
      ...snapshot.data(),
    } as AuthProfile,
    source: {
      collectionName,
      id: snapshot.id,
    },
  };
}

async function queryProfile(
  collectionName: string,
  constraints: QueryConstraint[],
): Promise<ProfileLookupResult | null> {
  const snapshot = await getDocs(query(collection(db, collectionName), ...constraints, limit(1)));
  const [documentSnapshot] = snapshot.docs;

  if (!documentSnapshot) {
    return null;
  }

  return {
    profile: normalizeDocument<AuthProfile>(documentSnapshot),
    source: {
      collectionName,
      id: documentSnapshot.id,
    },
  };
}

async function findSuperAdminProfile(user: User): Promise<ProfileLookupResult | null> {
  return (
    (await getProfileByDocId('super_admin', user.uid)) ??
    (await queryProfile('super_admin', [where('id', '==', user.uid)])) ??
    (user.email ? await queryProfile('super_admin', [where('email', '==', user.email)]) : null)
  );
}

async function findProfileInCollection(collectionName: string, user: User): Promise<ProfileLookupResult | null> {
  return (
    (await getProfileByDocId(collectionName, user.uid)) ??
    (await queryProfile(collectionName, [where('id', '==', user.uid)])) ??
    (user.email ? await queryProfile(collectionName, [where('email', '==', user.email)]) : null)
  );
}

function createFallbackProfile(user: User): AuthProfile {
  console.warn('TODO: Auth profile not found in Firestore. Using in-memory fallback admin profile.');

  return {
    id: user.uid,
    uid: user.uid,
    email: user.email,
    role: 'admin',
    displayName: user.displayName,
  };
}

async function findUserProfile(user: User): Promise<ProfileLookupResult | null> {
  const superAdminProfile = await findSuperAdminProfile(user);

  if (superAdminProfile) {
    return superAdminProfile;
  }

  for (const collectionName of PROFILE_COLLECTIONS.filter((name) => name !== 'super_admin')) {
    const profile = await findProfileInCollection(collectionName, user);

    if (profile) {
      return profile;
    }
  }

  return null;
}

async function loadClinic(profile: AuthProfile, role: string | null): Promise<Record<string, unknown> | null> {
  if (!isClinicScopedRole(role) || !profile.clinicId) {
    return null;
  }

  const snapshot = await getDoc(doc(db, 'clinics', profile.clinicId));

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  };
}

async function updateLastLoginAt(source: AuthProfileSource | null): Promise<void> {
  if (!source) {
    return;
  }

  await updateDoc(doc(db, source.collectionName, source.id), {
    lastLoginAt: serverTimestamp(),
  });
}

export async function loadAuthenticatedUserProfile(user: User): Promise<LoadedAuthProfile> {
  const lookupResult = await findUserProfile(user);
  const profile = withResolvedProfileRole(lookupResult?.profile ?? createFallbackProfile(user), lookupResult?.source ?? null);
  const role = normalizeRole(profile.role) ?? 'admin';
  const clinicId = typeof profile.clinicId === 'string' ? profile.clinicId : null;
  const clinicBranchId = typeof profile.clinicBranchId === 'string' ? profile.clinicBranchId : null;
  const clinic = await loadClinic(profile, role);

  return {
    firebaseUser: user,
    profile,
    role,
    clinic,
    clinicId,
    clinicBranchId,
    source: lookupResult?.source ?? null,
  };
}

export async function login(email: string, password: string): Promise<LoadedAuthProfile> {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  const loadedProfile = await loadAuthenticatedUserProfile(credential.user);
  await updateLastLoginAt(loadedProfile.source);

  return loadedProfile;
}

export async function logout(): Promise<void> {
  await signOut(auth);
}

export async function registerWithEmail(email: string, password: string): Promise<User> {
  const credential = await createUserWithEmailAndPassword(auth, email, password);

  return credential.user;
}

export async function sendPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

export async function sendEmailVerificationToCurrentUser(): Promise<void> {
  if (!auth.currentUser) {
    throw new Error('No current user is available for email verification.');
  }

  await sendEmailVerification(auth.currentUser);
}

export async function reloadCurrentUser(): Promise<User | null> {
  if (!auth.currentUser) {
    return null;
  }

  await reload(auth.currentUser);

  return auth.currentUser;
}

export function listenAuthState(callback: (user: User | null) => void): Unsubscribe {
  return onAuthStateChanged(auth, callback);
}
