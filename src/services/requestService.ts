import { collection, doc, getDoc, getDocs, query, where, type DocumentData, type QueryDocumentSnapshot } from 'firebase/firestore';

import { db } from '../firebase/firebase';

export type RequestSource = 'homeVisit' | 'clinicVisit' | 'plannedHomeVisit';

const BRANCH_REQUEST_KEYS = [
  'clinicBranchId',
  'branchId',
  'filialId',
  'branch_id',
  'clinic_branch_id',
] as const;

const REQUEST_SOURCE_MAP: Record<RequestSource, string> = {
  homeVisit: 'home_visit_requests',
  clinicVisit: 'clinic_visit_requests',
  plannedHomeVisit: 'home_visit_requests_plan',
};

export type RequestRecord = {
  id: string;
  source: RequestSource;
  doctorId?: string;
  selectedDoctorId?: string;
  visitedDoctorId?: string;
  patientName?: string;
  patientPhone?: string;
  patientAddress?: string;
  patientGender?: string;
  patientNotes?: string;
  visitReason?: string;
  symptoms?: string;
  doctorType?: string;
  departmentId?: string;
  cityId?: string;
  countryId?: string;
  clinicId?: string;
  doctorName?: string;
  doctorPhone?: string;
  doctorSpecialist?: string;
  doctorAvatar?: string;
  doctorNotes?: string;
  doctorNoteAboutVisit?: string;
  status?: string;
  urgency?: string;
  cost?: number;
  estimatedPrice?: number;
  finalPrice?: number;
  paymentStatus?: string;
  cancellationReason?: string;
  cancelledBy?: string;
  patientRating?: number;
  patientReview?: string;
  reviewedAt?: unknown;
  createdAt?: unknown;
  acceptedAt?: unknown;
  startedAt?: unknown;
  completedAt?: unknown;
  cancelledAt?: unknown;
  updatedAt?: unknown;
  latitude?: number | null;
  longitude?: number | null;
  timeDoctorToPatients?: unknown;
  isActive?: boolean;
  [key: string]: unknown;
};

function getCollectionName(source: RequestSource): string {
  return REQUEST_SOURCE_MAP[source];
}

export function getRequestBranchId(request: RequestRecord): string | null {
  for (const key of BRANCH_REQUEST_KEYS) {
    const value = request[key];

    if (typeof value === 'string' && value.length > 0) {
      return value;
    }
  }

  return null;
}

export function matchesRequestBranch(request: RequestRecord, clinicBranchId: string): boolean {
  const requestBranchId = getRequestBranchId(request);

  return !requestBranchId || requestBranchId === clinicBranchId;
}

function normalizeRequestDocument(
  source: RequestSource,
  snapshot: QueryDocumentSnapshot<DocumentData>,
): RequestRecord {
  const data = snapshot.data() as Record<string, unknown>;
  const normalized: RequestRecord = {
    id: snapshot.id,
    source,
    ...data,
  };

  if (source === 'plannedHomeVisit' && typeof normalized.selectedDoctorId === 'string' && normalized.selectedDoctorId) {
    normalized.doctorId = normalized.selectedDoctorId;
  }

  if (!normalized.doctorId && typeof data.doctorId === 'string') {
    normalized.doctorId = data.doctorId;
  }

  return normalized;
}

async function getRequestsByField(source: RequestSource, fieldName: string, fieldValue: string): Promise<RequestRecord[]> {
  const snapshot = await getDocs(query(collection(db, getCollectionName(source)), where(fieldName, '==', fieldValue)));

  return snapshot.docs.map((documentSnapshot) => normalizeRequestDocument(source, documentSnapshot));
}

export async function getRequestsByClinicId(source: RequestSource, clinicId: string): Promise<RequestRecord[]> {
  return getRequestsByField(source, 'clinicId', clinicId);
}

export async function getRequestsByBranchId(
  source: RequestSource,
  clinicId: string,
  clinicBranchId: string,
): Promise<RequestRecord[]> {
  const clinicRequests = await getRequestsByClinicId(source, clinicId);

  return clinicRequests.filter((request) => matchesRequestBranch(request, clinicBranchId));
}

export async function getRequestsByCityId(source: RequestSource, cityId: string): Promise<RequestRecord[]> {
  return getRequestsByField(source, 'cityId', cityId);
}

export async function getRequestsByCountryId(source: RequestSource, countryId: string): Promise<RequestRecord[]> {
  return getRequestsByField(source, 'countryId', countryId);
}

export async function getRequestById(source: RequestSource, requestId: string): Promise<RequestRecord | null> {
  const snapshot = await getDoc(doc(db, getCollectionName(source), requestId));

  if (!snapshot.exists()) {
    return null;
  }

  return normalizeRequestDocument(source, snapshot as QueryDocumentSnapshot<DocumentData>);
}

export function getRequestSourceLabel(source: RequestSource): string {
  if (source === 'clinicVisit') {
    return 'Clinic visit';
  }

  if (source === 'plannedHomeVisit') {
    return 'Planned home visit';
  }

  return 'Home visit';
}

export function getRequestSourceFromPathname(pathname: string, searchParams?: URLSearchParams): RequestSource {
  if (pathname.startsWith('/clinic-visit-requests')) {
    return 'clinicVisit';
  }

  if (pathname.startsWith('/branch-clinic-visit-requests')) {
    return 'clinicVisit';
  }

  if (pathname.startsWith('/home-visit-requests-plan')) {
    return 'plannedHomeVisit';
  }

  if (pathname.startsWith('/branch-home-visit-requests-plan')) {
    return 'plannedHomeVisit';
  }

  if (pathname.startsWith('/branch-home-requests')) {
    return 'homeVisit';
  }

  if (pathname.startsWith('/branch-requests')) {
    const querySource = searchParams?.get('source');

    if (querySource === 'clinicVisit' || querySource === 'plannedHomeVisit' || querySource === 'homeVisit') {
      return querySource;
    }
  }

  return 'homeVisit';
}

export function isBranchRequestPath(pathname: string): boolean {
  return (
    pathname.startsWith('/branch-requests') ||
    pathname.startsWith('/branch-home-requests') ||
    pathname.startsWith('/branch-clinic-visit-requests') ||
    pathname.startsWith('/branch-home-visit-requests-plan')
  );
}

export function getRequestListBasePath(pathname: string): string {
  if (pathname.startsWith('/clinic-visit-requests')) {
    return '/clinic-visit-requests';
  }

  if (pathname.startsWith('/home-visit-requests-plan')) {
    return '/home-visit-requests-plan';
  }

  if (pathname.startsWith('/clinic-requests')) {
    return '/clinic-requests';
  }

  if (pathname.startsWith('/branch-clinic-visit-requests')) {
    return '/branch-clinic-visit-requests';
  }

  if (pathname.startsWith('/branch-home-visit-requests-plan')) {
    return '/branch-home-visit-requests-plan';
  }

  if (pathname.startsWith('/branch-home-requests')) {
    return '/branch-home-requests';
  }

  return '/branch-requests';
}
