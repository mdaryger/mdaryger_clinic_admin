import { httpsCallable } from 'firebase/functions';

import { functions } from '../firebase/firebase';

const deleteAuthUserFn = httpsCallable<{ uid: string }, { success: boolean }>(functions, 'deleteAuthUser');
const deleteClinicCascadeFn = httpsCallable<
  { clinicId: string },
  { success: boolean; deletedAuthUsers: number; deletedFirestoreDocuments: number }
>(functions, 'deleteClinicCascade');

export async function deleteAuthUser(uid: string): Promise<void> {
  await deleteAuthUserFn({ uid });
}

export async function deleteClinicCascade(clinicId: string): Promise<void> {
  await deleteClinicCascadeFn({ clinicId });
}
