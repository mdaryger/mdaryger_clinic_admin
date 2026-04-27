import type { FirebaseOptions } from 'firebase/app';

import { firebaseEnv, type AppEnv } from './env';

const PROJECT_IDS: Record<AppEnv, string> = {
  dev: 'medicall-dev-f7395',
  prod: 'medicall-prod-35394',
};

const createConfig = (expectedProjectId: string): FirebaseOptions => {
  if (firebaseEnv.projectId !== expectedProjectId) {
    throw new Error(
      `Firebase projectId "${firebaseEnv.projectId}" does not match "${firebaseEnv.appEnv}" project "${expectedProjectId}".`,
    );
  }

  return {
    apiKey: firebaseEnv.apiKey,
    authDomain: firebaseEnv.authDomain,
    projectId: firebaseEnv.projectId,
    storageBucket: firebaseEnv.storageBucket,
    messagingSenderId: firebaseEnv.messagingSenderId,
    appId: firebaseEnv.appId,
  };
};

export const selectedFirebaseConfig = createConfig(PROJECT_IDS[firebaseEnv.appEnv]);
export const firebaseConfig = selectedFirebaseConfig;
