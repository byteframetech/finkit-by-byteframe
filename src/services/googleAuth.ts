import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App singleton
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Google Auth Provider with drive.appdata scope
const provider = new GoogleAuthProvider();
export const DRIVE_APPDATA_SCOPE = 'https://www.googleapis.com/auth/drive.appdata';

provider.addScope(DRIVE_APPDATA_SCOPE);
provider.setCustomParameters({
  prompt: 'select_account',
});

// In-memory access token cache (Strict security: never stored in localStorage / sessionStorage)
let isSigningIn = false;
let cachedAccessToken: string | null = null;
let tokenExpiryTimestamp: number | null = null;

/**
 * Initialize auth listener.
 * Clears access token on user sign-out or session end.
 */
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken && (!tokenExpiryTimestamp || Date.now() < tokenExpiryTimestamp)) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // Needs fresh user-gesture popup to obtain new OAuth token for drive.appdata
        cachedAccessToken = null;
        tokenExpiryTimestamp = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      tokenExpiryTimestamp = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Interactive Google Sign-In with popup.
 * Obtains OAuth Access Token with drive.appdata scope.
 */
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to retrieve Google OAuth access token from authorization response.');
    }

    cachedAccessToken = credential.accessToken;
    // Standard Google OAuth token validity is ~3600 seconds (1 hour)
    tokenExpiryTimestamp = Date.now() + 55 * 60 * 1000;

    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('[GoogleAuth] Sign-in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Retrieves the currently active in-memory access token if not expired.
 */
export const getAccessToken = async (): Promise<string | null> => {
  if (tokenExpiryTimestamp && Date.now() >= tokenExpiryTimestamp) {
    cachedAccessToken = null;
    return null;
  }
  return cachedAccessToken;
};

/**
 * Retrieves the current Firebase user.
 */
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

/**
 * Checks if the user is currently authenticated with a valid token.
 */
export const isAuthenticated = (): boolean => {
  return !!auth.currentUser && !!cachedAccessToken && (!tokenExpiryTimestamp || Date.now() < tokenExpiryTimestamp);
};

/**
 * Signs the user out and clears all in-memory credentials.
 */
export const logout = async (): Promise<void> => {
  await signOut(auth);
  cachedAccessToken = null;
  tokenExpiryTimestamp = null;
};
