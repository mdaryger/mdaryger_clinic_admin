import { normalizeRole, type RoleLike } from '../types/utils';

import { formatDate } from './date';

type NameLike = {
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  middleName?: string | null;
  displayName?: string | null;
};

export function formatCurrency(value: unknown): string {
  const amount = typeof value === 'number' ? value : Number(value ?? 0);

  if (Number.isNaN(amount)) {
    return '-';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatPhone(value: unknown): string {
  const phone = String(value ?? '').trim();

  return phone || '-';
}

export function formatFullName(user: NameLike): string {
  const parts = [
    user.firstName || user.name,
    user.lastName,
    user.middleName,
  ].filter(Boolean);

  if (parts.length > 0) {
    return parts.join(' ');
  }

  return user.displayName || '-';
}

export function formatRole(role: RoleLike): string {
  const normalizedRole = normalizeRole(role);

  switch (normalizedRole) {
    case 'super_admin':
      return 'Super admin';
    case 'clinic_branch_admin':
      return 'Clinic branch admin';
    case 'clinic_admin':
      return 'Clinic admin';
    case 'admin':
      return 'Admin';
    default:
      return String(role ?? 'Unknown');
  }
}

export function formatStatus(status: unknown): string {
  const label = String(status ?? 'unknown');

  return label.replace(/_/g, ' ');
}

export function formatUrgency(urgency: unknown): string {
  return String(urgency ?? 'normal');
}

export { formatDate };
