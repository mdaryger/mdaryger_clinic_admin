export type NormalizedRole = 'super_admin' | 'admin' | 'clinic_admin' | 'clinic_branch_admin';
export type RoleLike = NormalizedRole | 'superAdmin' | 'clinicAdmin' | 'clinicBranchAdmin' | string | null | undefined;

const ROLE_MAP: Record<string, NormalizedRole> = {
  super_admin: 'super_admin',
  superAdmin: 'super_admin',
  admin: 'admin',
  clinic_admin: 'clinic_admin',
  clinicAdmin: 'clinic_admin',
  clinic_branch_admin: 'clinic_branch_admin',
  clinicBranchAdmin: 'clinic_branch_admin',
};

export function normalizeRole(role: RoleLike): NormalizedRole | null {
  if (!role) {
    return null;
  }

  return ROLE_MAP[role] ?? null;
}
