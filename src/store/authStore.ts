import type { User } from 'firebase/auth';
import { create } from 'zustand';

import { auth } from '../firebase/firebase';
import {
  listenAuthState,
  loadAuthenticatedUserProfile,
  login as loginWithEmail,
  logout as logoutFromFirebase,
} from '../services/authService';
import type { AuthProfile, LoadedAuthProfile } from '../types/auth';
import type { NormalizedRole } from '../types/utils';

type ClinicState = Record<string, unknown> | null;

type AuthStateValues = {
  firebaseUser: User | null;
  profile: AuthProfile | null;
  role: NormalizedRole | null;
  clinic: ClinicState;
  clinicId: string | null;
  clinicBranchId: string | null;
  isLoading: boolean;
  isInitialized: boolean;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  isClinicAdmin: boolean;
  isBranchAdmin: boolean;
};

type AuthStateMethods = {
  initAuthListener: () => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  clearAuth: () => void;
};

export type AuthStore = AuthStateValues & AuthStateMethods;

const emptyAuthState: AuthStateValues = {
  firebaseUser: null,
  profile: null,
  role: null,
  clinic: null,
  clinicId: null,
  clinicBranchId: null,
  isLoading: false,
  isInitialized: false,
  isAuthenticated: false,
  isSuperAdmin: false,
  isClinicAdmin: false,
  isBranchAdmin: false,
};

let authUnsubscribe: (() => void) | null = null;

function createLoadedState(loadedProfile: LoadedAuthProfile): AuthStateValues {
  return {
    firebaseUser: loadedProfile.firebaseUser,
    profile: loadedProfile.profile,
    role: loadedProfile.role,
    clinic: loadedProfile.clinic,
    clinicId: loadedProfile.clinicId,
    clinicBranchId: loadedProfile.clinicBranchId,
    isLoading: false,
    isInitialized: true,
    isAuthenticated: true,
    isSuperAdmin: loadedProfile.role === 'super_admin',
    isClinicAdmin: loadedProfile.role === 'clinic_admin',
    isBranchAdmin: loadedProfile.role === 'clinic_branch_admin',
  };
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  ...emptyAuthState,

  initAuthListener: () => {
    if (authUnsubscribe) {
      return;
    }

    set({ isLoading: true });

    authUnsubscribe = listenAuthState((firebaseUser) => {
      if (!firebaseUser) {
        set({
          ...emptyAuthState,
          isInitialized: true,
        });
        return;
      }

      set({ isLoading: true });

      void loadAuthenticatedUserProfile(firebaseUser)
        .then((loadedProfile) => {
          set(createLoadedState(loadedProfile));
        })
        .catch((error: unknown) => {
          console.error('Failed to load auth profile from Firestore.', error);
          set({
            ...emptyAuthState,
            firebaseUser,
            isInitialized: true,
          });
        });
    });
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true });

    try {
      const loadedProfile = await loginWithEmail(email, password);
      set(createLoadedState(loadedProfile));
    } catch (error) {
      set({ isLoading: false, isInitialized: true });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    await logoutFromFirebase();
    get().clearAuth();
  },

  refreshProfile: async () => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      get().clearAuth();
      return;
    }

    set({ isLoading: true });

    try {
      const loadedProfile = await loadAuthenticatedUserProfile(currentUser);
      set(createLoadedState(loadedProfile));
    } catch (error) {
      set({ isLoading: false, isInitialized: true });
      throw error;
    }
  },

  clearAuth: () => {
    set({
      ...emptyAuthState,
      isInitialized: true,
    });
  },
}));
