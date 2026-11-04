import { Component, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';

import {
  readRoomSearch,
  roomSearchQuery
} from '../../../data/room';

import {
  checkoutSummary,
  createCheckoutId,
  processDemoCheckout
} from '../../core/checkout';

import type {
  DemoBooking,
  PaymentOutcome
} from '../../core/checkout';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [ReactiveFormsModule, CurrencyPipe, RouterLink],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss'
})
export class Checkout {
  private readonly route = inject(ActivatedRoute);
  private readonly checkoutId = createCheckoutId();
private readonly router = inject(Router);
  readonly roomId =
    this.route.snapshot.paramMap.get('id') ?? '';

  readonly search = readRoomSearch(
    this.route.snapshot.queryParamMap
  );

  readonly query = roomSearchQuery(this.search);
  readonly summary = checkoutSummary(this.roomId, this.search);

  readonly processing = signal(false);
  readonly error = signal('');
  readonly confirmation = signal<DemoBooking | null>(null);

  readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(2),
        Validators.pattern(/\S/)
      ]
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email]
    }),
    outcome: new FormControl<PaymentOutcome>('success', {
      nonNullable: true
    }),
    agree: new FormControl(false, {
      nonNullable: true,
      validators: [Validators.requiredTrue]
    }),
    paymentMethod: new FormControl<'card' | 'paypal' | 'googlepay'>(
  'card',
  { nonNullable: true }
),
  });

  async pay(): Promise<void> {
    if (this.processing() || this.confirmation()) {
      return;
    }

    this.error.set('');
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      this.error.set(
        'Enter your name, a valid email, and accept the demo notice.'
      );
      return;
    }

    if (!this.summary || this.summary.error) {
      this.error.set(
        this.summary?.error ?? 'Room not found.'
      );
      return;
    }

    this.processing.set(true);

    try {
      const values = this.form.getRawValue();

      const booking = await processDemoCheckout(
        this.checkoutId,
        this.roomId,
        this.search,
        { name: values.name, email: values.email },
        values.outcome
      );

      this.confirmation.set(booking);
      await this.router.navigate(
  ['/booking-success', booking.id],
  { replaceUrl: true }
);
    } catch (error: unknown) {
      this.error.set(
        error instanceof Error
          ? error.message
          : 'Demo checkout failed. Please try again.'
      );
    } finally {
      this.processing.set(false);
    }
  }
}

function readBookings(): DemoBooking[] {
  try {
    const saved = localStorage.getItem(
      'wayfarer-demo-checkouts'
    );

    const bookings: unknown = JSON.parse(saved ?? '[]');

    if (!Array.isArray(bookings)) {
      throw new Error('Invalid booking data.');
    }

    return bookings as DemoBooking[];
  } catch {
    throw new Error('Unable to read saved demo bookings.');
  }
}

export function getDemoBooking(
  bookingId: string
): DemoBooking | null {
  return readBookings().find(
    booking => booking.id === bookingId
  ) ?? null;
}