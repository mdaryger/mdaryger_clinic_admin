export type AppEnv = 'dev' | 'prod';

const APP_ENVS = ['dev', 'prod'] as const;

function getRequiredEnv(name: keyof ImportMetaEnv): string {
  const value = import.meta.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getAppEnv(): AppEnv {
  const env = import.meta.env.VITE_APP_ENV;

  if (APP_ENVS.includes(env as AppEnv)) {
    return env as AppEnv;
  }

  throw new Error('VITE_APP_ENV must be either "dev" or "prod".');
}

export const firebaseEnv = {
  appEnv: getAppEnv(),
  apiKey: getRequiredEnv('VITE_FIREBASE_API_KEY'),
  authDomain: getRequiredEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: getRequiredEnv('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: getRequiredEnv('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getRequiredEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getRequiredEnv('VITE_FIREBASE_APP_ID'),
} as const;
