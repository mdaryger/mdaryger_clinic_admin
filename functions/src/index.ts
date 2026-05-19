import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';

admin.initializeApp();

export const deleteAuthUser = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }

  const callerUid = request.auth.uid;
  const callerRecord = await admin.auth().getUser(callerUid);
  const callerClaims = callerRecord.customClaims ?? {};
  const isAdmin = callerClaims['role'] === 'clinicAdmin' || callerClaims['role'] === 'clinicBranchAdmin';

  if (!isAdmin) {
    // Fall back to checking Firestore collections if no custom claims are set.
    const [clinicAdminSnap, branchAdminSnap] = await Promise.all([
      admin.firestore().collection('clinic_admin').doc(callerUid).get(),
      admin.firestore().collection('clinic_branch_admin').doc(callerUid).get(),
    ]);

    if (!clinicAdminSnap.exists && !branchAdminSnap.exists) {
      throw new HttpsError('permission-denied', 'Only clinic administrators can delete users.');
    }
  }

  const { uid } = request.data as { uid: string };

  if (!uid || typeof uid !== 'string') {
    throw new HttpsError('invalid-argument', 'A valid uid must be provided.');
  }

  try {
    await admin.auth().deleteUser(uid);
  } catch (error) {
    const errorCode =
      typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : null;
    const errorMessage =
      typeof error === 'object' && error !== null && 'message' in error ? String(error.message) : 'Unknown error';

    console.error('Failed to delete auth user.', {
      callerUid,
      uid,
      errorCode,
      errorMessage,
    });

    if (errorCode === 'auth/user-not-found') {
      throw new HttpsError('not-found', `Authentication user "${uid}" was not found.`);
    }

    throw new HttpsError('internal', errorCode ? `Failed to delete auth user: ${errorCode}` : errorMessage);
  }

  return { success: true };
});
