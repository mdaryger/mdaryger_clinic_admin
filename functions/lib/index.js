"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteClinicCascade = exports.deleteAuthUser = void 0;
const admin = require("firebase-admin");
const https_1 = require("firebase-functions/v2/https");
admin.initializeApp();
const REQUEST_COLLECTIONS = [
    'home_visit_requests',
    'clinic_visit_requests',
    'home_visit_requests_plan',
];
const CLINIC_BRANCHES_COLLECTION = 'clinic_branches';
const CLINIC_ADMIN_COLLECTION = 'clinic_admin';
const CLINIC_BRANCH_ADMIN_COLLECTION = 'clinic_branch_admin';
const DOCTORS_COLLECTION = 'doctors';
const CLINICS_COLLECTION = 'clinics';
const APPOINTMENTS_COLLECTION = 'appointments';
const FIRESTORE_BATCH_LIMIT = 450;
const QUERY_IN_LIMIT = 10;
const REQUEST_DOCTOR_ID_FIELDS = ['doctorId', 'selectedDoctorId', 'visitedDoctorId'];
const REQUEST_BRANCH_ID_FIELDS = [
    'clinicBranchId',
    'branchId',
    'filialId',
    'branch_id',
    'clinic_branch_id',
];
function getErrorCode(error) {
    return typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : null;
}
function getErrorMessage(error) {
    return typeof error === 'object' && error !== null && 'message' in error ? String(error.message) : 'Unknown error';
}
async function isCallerSuperAdmin(callerUid) {
    var _a;
    const callerRecord = await admin.auth().getUser(callerUid);
    const callerClaims = (_a = callerRecord.customClaims) !== null && _a !== void 0 ? _a : {};
    if (callerClaims['role'] === 'super_admin' || callerClaims['role'] === 'superAdmin') {
        return true;
    }
    const superAdminSnap = await admin.firestore().collection('super_admin').doc(callerUid).get();
    return superAdminSnap.exists;
}
async function isCallerClinicAdmin(callerUid) {
    var _a;
    const callerRecord = await admin.auth().getUser(callerUid);
    const callerClaims = (_a = callerRecord.customClaims) !== null && _a !== void 0 ? _a : {};
    const isAdmin = callerClaims['role'] === 'clinicAdmin' || callerClaims['role'] === 'clinicBranchAdmin';
    if (isAdmin) {
        return true;
    }
    const [clinicAdminSnap, branchAdminSnap] = await Promise.all([
        admin.firestore().collection(CLINIC_ADMIN_COLLECTION).doc(callerUid).get(),
        admin.firestore().collection(CLINIC_BRANCH_ADMIN_COLLECTION).doc(callerUid).get(),
    ]);
    return clinicAdminSnap.exists || branchAdminSnap.exists;
}
async function deleteDocuments(documents) {
    for (let index = 0; index < documents.length; index += FIRESTORE_BATCH_LIMIT) {
        const batch = admin.firestore().batch();
        const chunk = documents.slice(index, index + FIRESTORE_BATCH_LIMIT);
        chunk.forEach((documentSnapshot) => {
            batch.delete(documentSnapshot.ref);
        });
        await batch.commit();
    }
}
function chunkValues(values, chunkSize) {
    const chunks = [];
    for (let index = 0; index < values.length; index += chunkSize) {
        chunks.push(values.slice(index, index + chunkSize));
    }
    return chunks;
}
async function getDocumentsByFieldValues(firestore, collectionName, fieldName, values) {
    if (values.length === 0) {
        return [];
    }
    const chunks = chunkValues(Array.from(new Set(values)), QUERY_IN_LIMIT);
    const snapshots = await Promise.all(chunks.map((chunk) => firestore.collection(collectionName).where(fieldName, 'in', chunk).get()));
    return snapshots.flatMap((snapshot) => snapshot.docs);
}
exports.deleteAuthUser = (0, https_1.onCall)(async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }
    const callerUid = request.auth.uid;
    const hasPermission = await isCallerClinicAdmin(callerUid);
    if (!hasPermission) {
        throw new https_1.HttpsError('permission-denied', 'Only clinic administrators can delete users.');
    }
    const { uid } = request.data;
    if (!uid || typeof uid !== 'string') {
        throw new https_1.HttpsError('invalid-argument', 'A valid uid must be provided.');
    }
    try {
        await admin.auth().deleteUser(uid);
    }
    catch (error) {
        const errorCode = getErrorCode(error);
        const errorMessage = getErrorMessage(error);
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
exports.deleteClinicCascade = (0, https_1.onCall)(async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }
    const callerUid = request.auth.uid;
    const hasPermission = await isCallerSuperAdmin(callerUid);
    if (!hasPermission) {
        throw new https_1.HttpsError('permission-denied', 'Only super admins can delete clinics.');
    }
    const { clinicId } = request.data;
    if (!clinicId || typeof clinicId !== 'string') {
        throw new https_1.HttpsError('invalid-argument', 'A valid clinicId must be provided.');
    }
    const firestore = admin.firestore();
    const clinicRef = firestore.collection(CLINICS_COLLECTION).doc(clinicId);
    const clinicSnapshot = await clinicRef.get();
    if (!clinicSnapshot.exists) {
        throw new https_1.HttpsError('not-found', `Clinic "${clinicId}" was not found.`);
    }
    const [clinicAdminsSnapshot, branchAdminsSnapshot, doctorsSnapshot, branchesSnapshot, appointmentsSnapshot, ...requestSnapshots] = await Promise.all([
        firestore.collection(CLINIC_ADMIN_COLLECTION).where('clinicId', '==', clinicId).get(),
        firestore.collection(CLINIC_BRANCH_ADMIN_COLLECTION).where('clinicId', '==', clinicId).get(),
        firestore.collection(DOCTORS_COLLECTION).where('clinicId', '==', clinicId).get(),
        firestore.collection(CLINIC_BRANCHES_COLLECTION).where('clinicId', '==', clinicId).get(),
        firestore.collection(APPOINTMENTS_COLLECTION).where('clinicId', '==', clinicId).get(),
        ...REQUEST_COLLECTIONS.map((collectionName) => firestore.collection(collectionName).where('clinicId', '==', clinicId).get()),
    ]);
    const doctorIds = doctorsSnapshot.docs.map((documentSnapshot) => documentSnapshot.id);
    const branchIds = branchesSnapshot.docs.map((documentSnapshot) => documentSnapshot.id);
    const authUserIds = Array.from(new Set([
        ...clinicAdminsSnapshot.docs.map((documentSnapshot) => documentSnapshot.id),
        ...branchAdminsSnapshot.docs.map((documentSnapshot) => documentSnapshot.id),
        ...doctorIds,
    ]));
    for (const uid of authUserIds) {
        try {
            await admin.auth().deleteUser(uid);
        }
        catch (error) {
            const errorCode = getErrorCode(error);
            if (errorCode === 'auth/user-not-found') {
                continue;
            }
            console.error('Failed to delete auth user during clinic cascade deletion.', {
                callerUid,
                clinicId,
                uid,
                errorCode,
                errorMessage: getErrorMessage(error),
            });
            throw new https_1.HttpsError('internal', errorCode ? `Failed to delete clinic auth user: ${errorCode}` : getErrorMessage(error));
        }
    }
    const extraAppointmentSnapshots = doctorIds.length
        ? await getDocumentsByFieldValues(firestore, APPOINTMENTS_COLLECTION, 'doctorId', doctorIds)
        : [];
    const extraRequestSnapshots = (await Promise.all(REQUEST_COLLECTIONS.flatMap((collectionName) => [
        ...REQUEST_DOCTOR_ID_FIELDS.map((fieldName) => getDocumentsByFieldValues(firestore, collectionName, fieldName, doctorIds)),
        ...REQUEST_BRANCH_ID_FIELDS.map((fieldName) => getDocumentsByFieldValues(firestore, collectionName, fieldName, branchIds)),
    ]))).flat();
    const documentsToDelete = Array.from(new Map([
        ...clinicAdminsSnapshot.docs,
        ...branchAdminsSnapshot.docs,
        ...doctorsSnapshot.docs,
        ...branchesSnapshot.docs,
        ...appointmentsSnapshot.docs,
        ...extraAppointmentSnapshots,
        ...requestSnapshots.flatMap((snapshot) => snapshot.docs),
        ...extraRequestSnapshots,
        clinicSnapshot,
    ].map((documentSnapshot) => [documentSnapshot.ref.path, documentSnapshot])).values());
    await deleteDocuments(documentsToDelete.filter((documentSnapshot) => documentSnapshot.exists));
    return {
        success: true,
        deletedAuthUsers: authUserIds.length,
        deletedFirestoreDocuments: documentsToDelete.length,
    };
});
//# sourceMappingURL=index.js.map