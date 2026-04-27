import type { User } from 'firebase/auth';

import type { NormalizedRole, RoleLike } from './utils';

export type AuthUser = {
  id: string;
  email: string | null;
};

export type AuthProfile = {
  id: string;
  uid: string;
  email: string | null;
  role: RoleLike;
  clinicId?: string | null;
  clinicBranchId?: string | null;
  displayName?: string | null;
  lastLoginAt?: unknown;
  [key: string]: unknown;
};

export type AuthProfileSource = {
  collectionName: string;
  id: string;
};

export type LoadedAuthProfile = {
  firebaseUser: User;
  profile: AuthProfile;
  role: NormalizedRole;
  clinic: Record<string, unknown> | null;
  clinicId: string | null;
  clinicBranchId: string | null;
  source: AuthProfileSource | null;
};
