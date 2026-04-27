import { collection, getDocs, orderBy, query, type DocumentData, type QueryDocumentSnapshot } from 'firebase/firestore';

import { db } from '../firebase/firebase';

const COUNTRIES_COLLECTION = 'countries';

export type Country = {
  id: string;
  name: string;
  code?: string;
  isActive?: boolean;
};

function normalizeCountry(snapshot: QueryDocumentSnapshot<DocumentData>): Country {
  const data = snapshot.data() as Record<string, unknown>;

  return {
    id: snapshot.id,
    name: String(data.name ?? ''),
    code: typeof data.code === 'string' ? data.code : undefined,
    isActive: typeof data.isActive === 'boolean' ? data.isActive : undefined,
  };
}

export async function getAllCountries(): Promise<Country[]> {
  try {
    const snapshot = await getDocs(query(collection(db, COUNTRIES_COLLECTION), orderBy('name', 'asc')));

    return snapshot.docs.map(normalizeCountry);
  } catch {
    const snapshot = await getDocs(collection(db, COUNTRIES_COLLECTION));

    return snapshot.docs.map(normalizeCountry).sort((left, right) => left.name.localeCompare(right.name));
  }
}
