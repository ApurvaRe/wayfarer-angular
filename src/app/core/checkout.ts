import {
  ROOMS,
  roomAvailabilityError,
  stayNights, RoomSearch
} from '../../data/room';


export type PaymentOutcome = 'success' | 'declined';

export interface GuestDetails {
  name: string;
  email: string;
}

export interface DemoBooking {
  id: string;
  paymentId: string;
  roomId: string;
  roomName: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  guest: GuestDetails;
  total: number;
  status: 'Demo confirmed';
  createdAt: string;
}

const STORAGE_KEY = 'wayfarer-demo-checkouts';

export function createCheckoutId(): string {
  return 'WF-' + (
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
}

export function checkoutSummary(
  roomId: string,
  search: RoomSearch
) {
  const room = ROOMS.find(item => item.id === roomId);

  if (!room) {
    return null;
  }

  const nights = stayNights(search);
  const subtotal = room.price * nights;
  const taxes = Math.round(subtotal * 0.12);

  return {
    room,
    nights,
    subtotal,
    taxes,
    total: subtotal + taxes,
    error: roomAvailabilityError(room, search)
  };
}

function readBookings(): DemoBooking[] {
  try {
    const value = JSON.parse(
      localStorage.getItem(STORAGE_KEY) ?? '[]'
    );

    if (!Array.isArray(value)) {
      throw new Error();
    }

    return value as DemoBooking[];
  } catch {
    throw new Error('Unable to read saved demo bookings.');
  }
}

export async function processDemoCheckout(
  checkoutId: string,
  roomId: string,
  search: RoomSearch,
  guest: GuestDetails,
  outcome: PaymentOutcome
): Promise<DemoBooking> {
  const previous = readBookings().find(
    booking => booking.id === checkoutId
  );

  // A retry with the same ID returns the existing confirmation.
  if (previous) {
    return previous;
  }

  const summary = checkoutSummary(roomId, search);

  if (!summary || summary.error) {
    throw new Error(
      summary?.error ?? 'This room no longer exists.'
    );
  }

  if (guest.name.trim().length < 2) {
    throw new Error('Enter your full name.');
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guest.email.trim())) {
    throw new Error('Enter a valid email address.');
  }

  // Dummy gateway delay. No external payment request is made.
  await new Promise<void>(resolve => {
    setTimeout(resolve, 1500);
  });

  if (outcome === 'declined') {
    throw new Error(
      'Demo payment declined. Select a successful payment and try again.'
    );
  }

  const bookings = readBookings();

  const existing = bookings.find(
    booking => booking.id === checkoutId
  );

  if (existing) {
    return existing;
  }

  const booking: DemoBooking = {
    id: checkoutId,
    paymentId: `DEMO-PAY-${checkoutId}`,
    roomId: summary.room.id,
    roomName: summary.room.name,
    checkIn: search.checkIn,
    checkOut: search.checkOut,
    guests: search.guests,
    guest: {
      name: guest.name.trim(),
      email: guest.email.trim()
    },
    total: summary.total,
    status: 'Demo confirmed',
    createdAt: new Date().toISOString()
  };

  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([booking, ...bookings])
    );
  } catch {
    throw new Error(
      'Unable to save the demo booking. No real payment was taken.'
    );
  }

  return booking;
}

export function getDemoBooking(
  bookingId: string
): DemoBooking | null {
  return readBookings().find(
    booking => booking.id === bookingId
  ) ?? null;
}