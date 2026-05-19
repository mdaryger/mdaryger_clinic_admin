"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAuthUser = void 0;
const admin = require("firebase-admin");
const https_1 = require("firebase-functions/v2/https");
admin.initializeApp();
exports.deleteAuthUser = (0, https_1.onCall)(async (request) => {
    var _a;
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }
    const callerUid = request.auth.uid;
    const callerRecord = await admin.auth().getUser(callerUid);
    const callerClaims = (_a = callerRecord.customClaims) !== null && _a !== void 0 ? _a : {};
    const isAdmin = callerClaims['role'] === 'clinicAdmin' || callerClaims['role'] === 'clinicBranchAdmin';
    if (!isAdmin) {
        // Fall back to checking Firestore collections if no custom claims are set.
        const [clinicAdminSnap, branchAdminSnap] = await Promise.all([
            admin.firestore().collection('clinic_admin').doc(callerUid).get(),
            admin.firestore().collection('clinic_branch_admin').doc(callerUid).get(),
        ]);
        if (!clinicAdminSnap.exists && !branchAdminSnap.exists) {
            throw new https_1.HttpsError('permission-denied', 'Only clinic administrators can delete users.');
        }
    }
    const { uid } = request.data;
    if (!uid || typeof uid !== 'string') {
        throw new https_1.HttpsError('invalid-argument', 'A valid uid must be provided.');
    }
    try {
        await admin.auth().deleteUser(uid);
    }
    catch (error) {
        const errorCode = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : null;
        const errorMessage = typeof error === 'object' && error !== null && 'message' in error ? String(error.message) : 'Unknown error';
        console.error('Failed to delete auth user.', {
            callerUid,
            uid,
            errorCode,
            errorMessage,
        });
        if (errorCode === 'auth/user-not-found') {
            throw new https_1.HttpsError('not-found', `Authentication user "${uid}" was not found.`);
        }
        throw new https_1.HttpsError('internal', errorCode ? `Failed to delete auth user: ${errorCode}` : errorMessage);
    }
    return { success: true };
});
//# sourceMappingURL=index.js.map