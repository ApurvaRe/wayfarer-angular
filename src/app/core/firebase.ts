import { FirebaseError, getApps, initializeApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword, getAuth, signInWithEmailAndPassword, signOut,
  updateProfile, GoogleAuthProvider, FacebookAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyARWQDJPYWPGVZisUv-d969qc393okuJCI',
  authDomain: 'travel-booking-68118.firebaseapp.com',
  projectId: 'travel-booking-68118',
  appId: '1:922576891691:web:3ee6c11ef8711e6bcb5f6e'
};

const app =
  getApps().find(item => item.name === '[DEFAULT]') ??
  initializeApp(firebaseConfig);

export const auth = getAuth(app);
export function getDb() {
  return getFirestore(app);
}
export function loginUser(email: string, password: string) {
  return signInWithEmailAndPassword(
    auth,
    email.trim(),
    password
  );
}

export async function registerUser(
  name: string,
  email: string,
  password: string
) {
  const credential = await createUserWithEmailAndPassword(
    auth,
    email.trim(),
    password
  );

  // Account creation and profile updates are separate operations.
  // A failed name update must not be reported as failed registration.
  let profileSaved = true;

  try {
    await updateProfile(credential.user, {
      displayName: name.trim()
    });
  } catch {
    profileSaved = false;
  }

  return {
    user: credential.user,
    profileSaved
  };
}

export function logoutUser() {
  return signOut(auth);
}

export function getAuthError(error: unknown): string {
  if (!(error instanceof FirebaseError)) {
    return 'Something went wrong. Please try again.';
  }

  switch (error.code) {
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'Unable to sign in. Check your email and password.';

    case 'auth/email-already-in-use':
      return 'An account already exists with this email. Try signing in.';

    case 'auth/invalid-email':
      return 'Enter a valid email address.';

    case 'auth/weak-password':
    case 'auth/password-does-not-meet-requirements':
      return 'Your password does not meet the required password policy.';

    case 'auth/operation-not-allowed':
return 'Enable the selected sign-in provider in Firebase Console.';

    case 'auth/network-request-failed':
      return 'Check your internet connection and try again.';

    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.';

    case 'auth/user-disabled':
      return 'This account has been disabled. Contact support.';

      case 'auth/popup-closed-by-user':
  return 'Sign-in was cancelled. Please try again.';

case 'auth/popup-blocked':
  return 'Allow popups for this site and try again.';

case 'auth/cancelled-popup-request':
  return 'Complete the sign-in window already open.';

case 'auth/unauthorized-domain':
  return 'Add this hostname to Firebase Authorized domains.';

case 'auth/account-exists-with-different-credential':
  return 'This email already uses another sign-in method. Use your original method.';

    default:
      return 'Authentication failed. Please try again.';
  }

}

export function loginWithSocial(
  providerName: 'google' | 'facebook'
) {
  const provider =
    providerName === 'google'
      ? new GoogleAuthProvider()
      : new FacebookAuthProvider();

  if (provider instanceof GoogleAuthProvider) {
    provider.setCustomParameters({
      prompt: 'select_account'
    });
  }

  return signInWithPopup(auth, provider);
}