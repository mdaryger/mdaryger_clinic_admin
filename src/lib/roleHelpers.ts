import { normalizeRole, type NormalizedRole, type RoleLike } from '../types/utils';

export const PROFILE_COLLECTIONS: NormalizedRole[] = [
  'super_admin',
  'admin',
  'clinic_admin',
  'clinic_branch_admin',
];

export function isSuperAdminRole(role: RoleLike): boolean {
  return normalizeRole(role) === 'super_admin';
}

export function isClinicAdminRole(role: RoleLike): boolean {
  return normalizeRole(role) === 'clinic_admin';
}

export function isBranchAdminRole(role: RoleLike): boolean {
  return normalizeRole(role) === 'clinic_branch_admin';
}

export function isClinicScopedRole(role: RoleLike): boolean {
  const normalizedRole = normalizeRole(role);

  return normalizedRole === 'clinic_admin' || normalizedRole === 'clinic_branch_admin';
}

export { normalizeRole };
