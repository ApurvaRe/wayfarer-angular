import { inject } from '@angular/core';
import { Router } from '@angular/router';
import type { CanActivateFn } from '@angular/router';
import { getCurrentRole } from './user-role';

export const authGuard: CanActivateFn = async (_route, state) => {
  const router = inject(Router);

  try {
    const role = await getCurrentRole();

    return role !== null
      ? true
      : router.createUrlTree(['/login'], {
          queryParams: { returnUrl: state.url }
        });
  } catch {
    return router.createUrlTree(['/login']);
  }
};

export const adminGuard: CanActivateFn = async (_route, state) => {
  const router = inject(Router);

  try {
    const role = await getCurrentRole();

    if (role === null) {
      return router.createUrlTree(['/login'], {
        queryParams: { returnUrl: state.url }
      });
    }

    return role === 'admin'
      ? true
      : router.createUrlTree(['/dashboard']);
  } catch {
    return router.createUrlTree(['/dashboard']);
  }
};