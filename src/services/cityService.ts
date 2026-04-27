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

const CITIES_COLLECTION = 'cities';

export type CityName = {
  ru?: string;
  en?: string;
};

export type City = {
  id: string;
  countryId: string;
  isActive?: boolean;
  name: CityName;
};

function normalizeCity(snapshot: QueryDocumentSnapshot<DocumentData>): City {
  const data = snapshot.data() as Record<string, unknown>;
  const rawName = data.name as Record<string, unknown> | undefined;

  return {
    id: snapshot.id,
    countryId: String(data.countryId ?? ''),
    isActive: typeof data.isActive === 'boolean' ? data.isActive : undefined,
    name: {
      ru: typeof rawName?.ru === 'string' ? rawName.ru : undefined,
      en: typeof rawName?.en === 'string' ? rawName.en : undefined,
    },
  };
}

function sortCities(cities: City[]): City[] {
  return cities.sort((left, right) => {
    const leftName = left.name.ru || left.name.en || left.id;
    const rightName = right.name.ru || right.name.en || right.id;

    return leftName.localeCompare(rightName);
  });
}

export async function getCitiesByCountry(countryId: string): Promise<City[]> {
  if (!countryId) {
    return [];
  }

  try {
    const activeSnapshot = await getDocs(
      query(
        collection(db, CITIES_COLLECTION),
        where('countryId', '==', countryId),
        where('isActive', '==', true),
        orderBy('name.en', 'asc'),
      ),
    );

    if (activeSnapshot.docs.length > 0) {
      return activeSnapshot.docs.map(normalizeCity);
    }
  } catch {
    // Some environments may miss the composite index for the ordered query.
  }

  try {
    const activeSnapshot = await getDocs(
      query(collection(db, CITIES_COLLECTION), where('countryId', '==', countryId), where('isActive', '==', true)),
    );

    if (activeSnapshot.docs.length > 0) {
      return sortCities(activeSnapshot.docs.map(normalizeCity));
    }
  } catch {
    // Legacy environments may not store isActive on city documents.
  }

  const snapshot = await getDocs(
    query(collection(db, CITIES_COLLECTION), where('countryId', '==', countryId)),
  );

  return sortCities(snapshot.docs.map(normalizeCity));
}
