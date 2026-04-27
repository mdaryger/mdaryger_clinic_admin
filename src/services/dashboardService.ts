import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';

import type { ClinicBranch } from './branchService';
import { db } from '../firebase/firebase';
import type { Clinic } from '../types/clinic';

const CLINIC_BRANCHES_COLLECTION = 'clinic_branches';
const DOCTORS_COLLECTION = 'doctors';
const REQUEST_COLLECTIONS = [
  'home_visit_requests',
  'clinic_visit_requests',
  'home_visit_requests_plan',
] as const;
const ACTIVE_REQUEST_STATUSES = new Set([
  'pending',
  'searching',
  'accepted',
  'inProgress',
  'doctorOnWay',
  'doctorArrived',
]);
const ACTIVE_DOCTOR_STATUSES = new Set(['active', 'available', 'busy', 'online']);
const AVAILABLE_DOCTOR_STATUSES = new Set(['available', 'online']);
const BRANCH_REQUEST_KEYS = [
  'clinicBranchId',
  'branchId',
  'filialId',
  'branch_id',
  'clinic_branch_id',
] as const;

type RequestCollectionName = (typeof REQUEST_COLLECTIONS)[number];

export type DashboardBranch = ClinicBranch & {
  [key: string]: unknown;
};

export type DashboardDoctor = {
  id: string;
  name?: string;
  clinicId?: string | null;
  clinicBranchId?: string | null;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  specialty?: string;
  isActive?: boolean;
  isAvailable?: boolean;
  status?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
  [key: string]: unknown;
};

export type DashboardRequest = {
  id: string;
  clinicId?: string | null;
  clinicBranchId?: string | null;
  status?: string;
  isActive?: boolean;
  patientName?: string;
  firstName?: string;
  lastName?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
  requestType: RequestCollectionName;
  [key: string]: unknown;
};

export type ClinicDashboardData = {
  branches: DashboardBranch[];
  doctors: DashboardDoctor[];
  requests: DashboardRequest[];
  activeRequests: DashboardRequest[];
  latestBranches: DashboardBranch[];
  latestDoctors: DashboardDoctor[];
  latestRequests: DashboardRequest[];
  totalBranches: number;
  totalDoctors: number;
  activeDoctors: number;
  activeRequestsCount: number;
};

export type BranchDashboardData = {
  branch: DashboardBranch | null;
  doctors: DashboardDoctor[];
  requests: DashboardRequest[];
  activeRequests: DashboardRequest[];
  latestDoctors: DashboardDoctor[];
  latestRequests: DashboardRequest[];
  totalDoctors: number;
  activeDoctors: number;
  availableDoctors: number;
  activeRequestsCount: number;
};

function normalizeCollectionDocument<T extends Record<string, unknown>>(
  id: string,
  data: Record<string, unknown>,
): T {
  return {
    id,
    ...data,
  } as unknown as T;
}

function toMillis(value: unknown): number {
  if (!value) {
    return 0;
  }

  if (typeof value === 'number') {
    return value;
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  if (typeof value === 'string') {
    const parsed = Date.parse(value);

    return Number.isNaN(parsed) ? 0 : parsed;
  }

  if (typeof value === 'object') {
    const timestampLike = value as { toDate?: () => Date; seconds?: number };

    if (typeof timestampLike.toDate === 'function') {
      return timestampLike.toDate().getTime();
    }

    if (typeof timestampLike.seconds === 'number') {
      return timestampLike.seconds * 1000;
    }
  }

  return 0;
}

function sortByLatest<T extends { createdAt?: unknown; updatedAt?: unknown }>(items: T[]): T[] {
  return [...items].sort((left, right) => {
    const leftTime = Math.max(toMillis(left.updatedAt), toMillis(left.createdAt));
    const rightTime = Math.max(toMillis(right.updatedAt), toMillis(right.createdAt));

    return rightTime - leftTime;
  });
}

function isDoctorActive(doctor: DashboardDoctor): boolean {
  if (doctor.isActive === true) {
    return true;
  }

  return typeof doctor.status === 'string' && ACTIVE_DOCTOR_STATUSES.has(doctor.status);
}

function isDoctorAvailable(doctor: DashboardDoctor): boolean {
  if (doctor.isAvailable === true) {
    return true;
  }

  return typeof doctor.status === 'string' && AVAILABLE_DOCTOR_STATUSES.has(doctor.status);
}

function isRequestActive(request: DashboardRequest): boolean {
  return request.isActive === true && typeof request.status === 'string' && ACTIVE_REQUEST_STATUSES.has(request.status);
}

function getBranchRequestId(request: DashboardRequest): string | null {
  for (const key of BRANCH_REQUEST_KEYS) {
    const value = request[key];

    if (typeof value === 'string' && value.length > 0) {
      return value;
    }
  }

  return null;
}

async function getCollectionByField<T extends Record<string, unknown>>(
  collectionName: string,
  fieldName: string,
  fieldValue: string,
): Promise<T[]> {
  const snapshot = await getDocs(query(collection(db, collectionName), where(fieldName, '==', fieldValue)));

  return snapshot.docs.map((documentSnapshot) =>
    normalizeCollectionDocument<T>(documentSnapshot.id, documentSnapshot.data()),
  );
}

async function getRequestCollectionByClinic(
  collectionName: RequestCollectionName,
  clinicId: string,
): Promise<DashboardRequest[]> {
  const snapshot = await getDocs(query(collection(db, collectionName), where('clinicId', '==', clinicId)));

  return snapshot.docs.map((documentSnapshot) => ({
    ...normalizeCollectionDocument<DashboardRequest>(documentSnapshot.id, documentSnapshot.data()),
    requestType: collectionName,
  }));
}

async function getAllClinicRequests(clinicId: string): Promise<DashboardRequest[]> {
  const requestCollections = await Promise.all(
    REQUEST_COLLECTIONS.map((collectionName) => getRequestCollectionByClinic(collectionName, clinicId)),
  );

  return requestCollections.flat();
}

function filterRequestsForBranch(requests: DashboardRequest[], clinicBranchId: string): DashboardRequest[] {
  return requests.filter((request) => {
    const branchRequestId = getBranchRequestId(request);

    if (!branchRequestId) {
      return true;
    }

    return branchRequestId === clinicBranchId;
  });
}

export async function getClinicDashboardData(clinicId: string): Promise<ClinicDashboardData> {
  const [branches, doctors, requests] = await Promise.all([
    getCollectionByField<DashboardBranch>(CLINIC_BRANCHES_COLLECTION, 'clinicId', clinicId),
    getCollectionByField<DashboardDoctor>(DOCTORS_COLLECTION, 'clinicId', clinicId),
    getAllClinicRequests(clinicId),
  ]);

  const activeRequests = requests.filter(isRequestActive);
  const activeDoctors = doctors.filter(isDoctorActive);

  return {
    branches,
    doctors,
    requests,
    activeRequests,
    latestBranches: sortByLatest(branches).slice(0, 5),
    latestDoctors: sortByLatest(doctors).slice(0, 5),
    latestRequests: sortByLatest(requests).slice(0, 5),
    totalBranches: branches.length,
    totalDoctors: doctors.length,
    activeDoctors: activeDoctors.length,
    activeRequestsCount: activeRequests.length,
  };
}

export async function getBranchDashboardData(
  clinicId: string,
  clinicBranchId: string,
): Promise<BranchDashboardData> {
  const [branchSnapshot, doctors, clinicRequests] = await Promise.all([
    getDoc(doc(db, CLINIC_BRANCHES_COLLECTION, clinicBranchId)),
    getCollectionByField<DashboardDoctor>(DOCTORS_COLLECTION, 'clinicBranchId', clinicBranchId),
    getAllClinicRequests(clinicId),
  ]);

  const branch = branchSnapshot.exists()
    ? normalizeCollectionDocument<DashboardBranch>(branchSnapshot.id, branchSnapshot.data())
    : null;
  const requests = filterRequestsForBranch(clinicRequests, clinicBranchId);
  const activeRequests = requests.filter(isRequestActive);
  const activeDoctors = doctors.filter(isDoctorActive);
  const availableDoctors = doctors.filter(isDoctorAvailable);

  return {
    branch,
    doctors,
    requests,
    activeRequests,
    latestDoctors: sortByLatest(doctors).slice(0, 5),
    latestRequests: sortByLatest(requests).slice(0, 5),
    totalDoctors: doctors.length,
    activeDoctors: activeDoctors.length,
    availableDoctors: availableDoctors.length,
    activeRequestsCount: activeRequests.length,
  };
}

export function asClinicRecord(clinic: Record<string, unknown> | null): Clinic | null {
  if (!clinic) {
    return null;
  }

  return clinic as Clinic;
}
