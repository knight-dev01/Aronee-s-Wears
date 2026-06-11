import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// CRITICAL: The app will break without specifying the custom databaseId
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Configure Google Provider with proper scopes and settings
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('profile');
googleProvider.addScope('email');
googleProvider.setCustomParameters({
  'prompt': 'select_account'
});

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error Detailed Context: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Function to log in using Google Popup with improved error handling
export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    console.log('Google Sign-In successful:', result.user.email);
    return result.user;
  } catch (error: any) {
    console.error('Auth Sign-In Error:', error);
    
    // Provide specific error messages for common issues
    if (error?.code === 'auth/popup-blocked') {
      throw new Error('Google Sign-In popup was blocked. Please enable popups for this site.');
    }
    if (error?.code === 'auth/network-request-failed') {
      throw new Error('Network error. Please check your internet connection.');
    }
    if (error?.code === 'auth/cancelled-popup-request') {
      throw new Error('Google Sign-In was cancelled.');
    }
    
    throw error;
  }
}

// Function to log out
export async function logoutUser() {
  try {
    await signOut(auth);
    console.log('User logged out successfully');
  } catch (error) {
    console.error('Auth Sign-Out Error:', error);
    throw error;
  }
}
