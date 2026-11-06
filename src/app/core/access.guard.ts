// Access Angular services inside functional guards.
import { inject } from '@angular/core';

// Create redirect URLs when access is denied.
import { Router } from '@angular/router';

// Type describing a function that controls route access.
import type { CanActivateFn } from '@angular/router';

// Returns 'admin', 'user', or null when signed out.
import { getCurrentRole } from './user-role';

/**
 * Protects pages that require any authenticated user.
 * Both normal users and admins can access these pages.
 */
export const authGuard: CanActivateFn = async (_route, state) => {
  // Get the Angular Router before awaiting asynchronous work.
  const router = inject(Router);

  try {
    // Wait for Firebase session restoration and read the user's role.
    const role = await getCurrentRole();

    // A non-null role means the user is authenticated.
    // Otherwise, redirect to login and preserve the requested URL.
    return role !== null
      ? true
      : router.createUrlTree(['/login'], {
          queryParams: { returnUrl: state.url }
        });
  } catch {
    // If checking authentication fails, deny access and redirect to login.
    return router.createUrlTree(['/login']);
  }
};

/**
 * Protects pages reserved for administrators.
 * Signed-out users go to login.
 * Authenticated normal users go to the dashboard.
 */
export const adminGuard: CanActivateFn = async (_route, state) => {
  const router = inject(Router);

  try {
    // Resolve the signed-in user's role from Firebase token claims.
    const role = await getCurrentRole();

    // Require login before checking administrator access.
    if (role === null) {
      return router.createUrlTree(['/login'], {
        queryParams: { returnUrl: state.url }
      });
    }

    // Allow administrators; redirect normal users to the dashboard.
    return role === 'admin'
      ? true
      : router.createUrlTree(['/dashboard']);
  } catch {
    // If role checking fails, deny admin access.
    // The dashboard's authGuard should check authentication separately.
    return router.createUrlTree(['/dashboard']);
  }
};