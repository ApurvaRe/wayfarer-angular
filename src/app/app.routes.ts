import { Routes } from '@angular/router';
import { adminGuard, authGuard } from './core/access.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login')
        .then(component => component.Login)
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/register/register')
        .then(component => component.Register)
  },
  {
    path: 'dashboard',
      canActivate: [authGuard],

    loadComponent: () =>
      import('./features/dashboard/dashboard')
        .then(component => component.Dashboard)
  },
  {
    path: 'rooms',
    loadComponent: () =>
      import('./features/rooms/rooms')
        .then(component => component.Rooms)
  },
  {
    path: 'rooms/:id',
    loadComponent: () =>
      import('./features/room-details/room-details')
        .then(component => component.RoomDetails)
  },
  {
    path: 'booking/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/checkout/checkout')
        .then(component => component.Checkout)
  },
  {
    path: 'booking-success/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/booking-success/booking-success')
        .then(component => component.BookingSuccess)
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./features/admin/admin')
        .then(component => component.Admin)
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];