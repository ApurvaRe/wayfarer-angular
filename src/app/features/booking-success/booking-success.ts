import { Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { getDemoBooking } from '../../core/checkout';
import type { DemoBooking } from '../../core/checkout';
import { ROOMS } from '../../../data/room';

@Component({
  selector: 'app-booking-success',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, DatePipe],
  templateUrl: './booking-success.html',
  styleUrl: './booking-success.scss'
})
export class BookingSuccess {
  private readonly route = inject(ActivatedRoute);

  readonly booking = signal<DemoBooking | null>(null);
  readonly error = signal('');

  readonly room = computed(() =>
    ROOMS.find(item => item.id === this.booking()?.roomId)
  );

  constructor() {
    const bookingId =
      this.route.snapshot.paramMap.get('id') ?? '';

    try {
      this.booking.set(getDemoBooking(bookingId));
    } catch {
      this.error.set('Unable to load your demo confirmation.');
    }
  }
}