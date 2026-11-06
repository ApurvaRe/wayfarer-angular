// Import the initialized Firebase Authentication instance.
import { auth } from './firebase';

// Define the roles supported by this application.
export type UserRole = 'admin' | 'user';

/**
 * Reads the signed-in user's role from Firebase ID token claims.
 * Returns null when signed out or when the account changes during the lookup.
 */
export async function getCurrentRole(): Promise<UserRole | null> {
  // Wait until Firebase finishes restoring the initial authentication session.
  // Without this, currentUser could temporarily be null during page startup.
  await auth.authStateReady();

  // Capture the currently signed-in Firebase user.
  const user = auth.currentUser;

  // No authenticated user means there is no role to return.
  if (!user) {
    return null;
  }

  // Get the user's ID token details, including custom claims.
  // Firebase refreshes the token when necessary; this does not force a refresh.
  const token = await user.getIdTokenResult();

  // The token request is asynchronous.
  // If the user signed out or switched accounts while waiting,
  // discard the previous account's result.
  if (auth.currentUser?.uid !== user.uid) {
    return null;
  }

  // Only the boolean claim admin: true grants the admin role.
  // Every other signed-in user receives the normal user role.
  return token.claims['admin'] === true ? 'admin' : 'user';
}