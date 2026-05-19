import { httpsCallable } from 'firebase/functions';

import { functions } from '../firebase/firebase';

const deleteAuthUserFn = httpsCallable<{ uid: string }, { success: boolean }>(functions, 'deleteAuthUser');

export async function deleteAuthUser(uid: string): Promise<void> {
  await deleteAuthUserFn({ uid });
}
