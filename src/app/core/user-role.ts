import { auth } from './firebase';

export type UserRole = 'admin' | 'user';

export async function getCurrentRole(): Promise<UserRole | null> {
  // Wait for Firebase to restore a previously signed-in session.
  await auth.authStateReady();

  const user = auth.currentUser;

  if (!user) {
    return null;
  }

  const token = await user.getIdTokenResult();

  // Ignore a result if the account changed while loading.
  if (auth.currentUser?.uid !== user.uid) {
    return null;
  }

  return token.claims['admin'] === true ? 'admin' : 'user';
}