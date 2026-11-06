import { Injectable } from '@angular/core';
import {
  getAuthError,
  loginUser,
  logoutUser,
  registerUser,
  loginWithSocial
} from './firebase';
import { getCurrentRole } from './user-role';
import { signOut, getAuth } from 'firebase/auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  login(email: string, password: string) {
    return loginUser(email, password);
  }

  register(name: string, email: string, password: string) {
    return registerUser(name, email, password);
  }

  // Use your initialized Firebase Auth instance.
async logout(): Promise<void> {
  await signOut(getAuth());
}

  loginSocial(provider: 'google' | 'facebook') {
    return loginWithSocial(provider);
  }

  errorMessage(error: unknown): string {
    return getAuthError(error);
  }

  getRole() {
    return getCurrentRole();
  }

  async isAdmin(): Promise<boolean> {
    return (await this.getRole()) === 'admin';
  }
}