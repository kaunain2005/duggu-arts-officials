import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

let firebaseApp: FirebaseApp | null = null;
let firebaseAuth: Auth | null = null;
let firebaseDb: Firestore | null = null;
let initializationError: Error | null = null;

function validateConfig(): { apiKey: string; projectId: string } {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (!apiKey || apiKey === "your-firebase-api-key" || apiKey.startsWith("your-")) {
    throw new Error(
      "Firebase client configuration missing: NEXT_PUBLIC_FIREBASE_API_KEY is not set. " +
      "Please configure your environment variables in .env.local"
    );
  }

  if (!projectId || projectId === "your-project-id" || projectId.startsWith("your-")) {
    throw new Error(
      "Firebase client configuration missing: NEXT_PUBLIC_FIREBASE_PROJECT_ID is not set. " +
      "Please configure your environment variables in .env.local"
    );
  }

  return { apiKey, projectId };
}

function getFirebaseConfig() {
  const { apiKey, projectId } = validateConfig();

  return {
    apiKey,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || `${projectId}.firebaseapp.com`,
    projectId,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };
}

export function getFirebaseApp(): FirebaseApp {
  if (initializationError) {
    throw initializationError;
  }

  if (firebaseApp) return firebaseApp;

  try {
    const config = getFirebaseConfig();
    firebaseApp = getApps().length === 0 ? initializeApp(config) : getApps()[0];
    return firebaseApp;
  } catch (error) {
    initializationError = error instanceof Error ? error : new Error("Failed to initialize Firebase");
    throw initializationError;
  }
}

export function getFirebaseAuth(): Auth {
  if (firebaseAuth) return firebaseAuth;
  firebaseAuth = getAuth(getFirebaseApp());
  return firebaseAuth;
}

export function getFirebaseDb(): Firestore {
  if (firebaseDb) return firebaseDb;
  firebaseDb = getFirestore(getFirebaseApp());
  return firebaseDb;
}

export function isFirebaseConfigured(): boolean {
  try {
    validateConfig();
    return true;
  } catch {
    return false;
  }
}

export function getInitializationError(): Error | null {
  return initializationError;
}

// Reset for testing (not for production use)
export function _resetFirebaseClient(): void {
  firebaseApp = null;
  firebaseAuth = null;
  firebaseDb = null;
  initializationError = null;
}