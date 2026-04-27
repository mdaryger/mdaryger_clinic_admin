import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  type DocumentData,
  type DocumentSnapshot,
  type PartialWithFieldValue,
  type QueryConstraint,
  type QueryDocumentSnapshot,
  type WithFieldValue,
} from 'firebase/firestore';

import { db } from '../firebase/firebase';

type PlainObject = Record<string, unknown>;

function normalizeSnapshot<T>(snapshot: DocumentSnapshot<DocumentData> | QueryDocumentSnapshot<DocumentData>): T {
  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as T;
}

export async function getDocSafe<T>(collectionName: string, id: string): Promise<T | null> {
  const snapshot = await getDoc(doc(db, collectionName, id));

  if (!snapshot.exists()) {
    return null;
  }

  return normalizeSnapshot<T>(snapshot);
}

export async function getCollectionSafe<T>(collectionName: string): Promise<T[]> {
  const snapshot = await getDocs(collection(db, collectionName));

  return snapshot.docs.map((documentSnapshot) => normalizeSnapshot<T>(documentSnapshot));
}

export async function queryCollectionSafe<T>(
  collectionName: string,
  constraints: QueryConstraint[],
): Promise<T[]> {
  const collectionRef = collection(db, collectionName);
  const snapshot = await getDocs(query(collectionRef, ...constraints));

  return snapshot.docs.map((documentSnapshot) => normalizeSnapshot<T>(documentSnapshot));
}

export async function createDocSafe<T extends PlainObject>(
  collectionName: string,
  id: string,
  data: T,
): Promise<void> {
  await setDoc(doc(db, collectionName, id), data as WithFieldValue<DocumentData>);
}

export async function updateDocSafe<T extends PlainObject>(
  collectionName: string,
  id: string,
  data: Partial<T>,
): Promise<void> {
  await updateDoc(doc(db, collectionName, id), data as PartialWithFieldValue<DocumentData>);
}

export async function deleteDocSafe(collectionName: string, id: string): Promise<void> {
  await deleteDoc(doc(db, collectionName, id));
}
