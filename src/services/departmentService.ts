import {
  collection,
  getDocs,
  orderBy,
  query,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';

import { db } from '../firebase/firebase';
import type { DoctorType } from './doctorService';

const DEPARTMENTS_COLLECTION = 'departments';

export type Department = {
  id: string;
  doctorType?: DoctorType;
  names: {
    ru?: string;
    en?: string;
  };
  isActive?: boolean;
};

function normalizeDepartment(snapshot: QueryDocumentSnapshot<DocumentData>): Department {
  const data = snapshot.data() as Record<string, unknown>;
  const rawNames = data.names as Record<string, unknown> | undefined;

  return {
    id: snapshot.id,
    doctorType: data.doctorType === 'kids' || data.doctorType === 'adults' ? data.doctorType : undefined,
    names: {
      ru: typeof rawNames?.ru === 'string' ? rawNames.ru : undefined,
      en: typeof rawNames?.en === 'string' ? rawNames.en : undefined,
    },
    isActive: typeof data.isActive === 'boolean' ? data.isActive : undefined,
  };
}

function sortDepartments(departments: Department[]): Department[] {
  return departments.sort((left, right) => {
    const leftName = left.names.ru || left.names.en || left.id;
    const rightName = right.names.ru || right.names.en || right.id;

    return leftName.localeCompare(rightName);
  });
}

export async function getDepartmentsByDoctorType(doctorType: DoctorType): Promise<Department[]> {
  try {
    const snapshot = await getDocs(
      query(
        collection(db, DEPARTMENTS_COLLECTION),
        where('doctorType', '==', doctorType),
        where('isActive', '==', true),
        orderBy('names.en', 'asc'),
      ),
    );

    return snapshot.docs.map(normalizeDepartment);
  } catch {
    try {
      const snapshot = await getDocs(
        query(
          collection(db, DEPARTMENTS_COLLECTION),
          where('doctorType', '==', doctorType),
          where('isActive', '==', true),
        ),
      );

      return sortDepartments(snapshot.docs.map(normalizeDepartment));
    } catch {
      const snapshot = await getDocs(
        query(collection(db, DEPARTMENTS_COLLECTION), where('doctorType', '==', doctorType)),
      );

      return sortDepartments(snapshot.docs.map(normalizeDepartment));
    }
  }
}

export function getDepartmentDisplayName(department: Department): string {
  return department.names.ru || department.names.en || department.id;
}
