import { DESTINATIONS } from './destination';

export interface Room {
  id: string;
  destinationId: string;
  name: string;
  location: string;
  image: string;
  price: number;
  maxGuests: number;
  rating: number;
  amenities: string[];
  unavailable: {
    checkIn: string;
    checkOut: string;
  }[];
  description?: string;
photos?: string[];
}

export interface RoomSearch {
  destination: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  maxPrice: number;
  breakfast: boolean;
}

export function dateAfter(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')
  ].join('-');
}

export function defaultSearch(destination = ''): RoomSearch {
  return {
    destination,
    checkIn: dateAfter(7),
    checkOut: dateAfter(10),
    guests: 2,
    maxPrice: 15000,
    breakfast: false
  };
}

export const ROOMS: Room[] = DESTINATIONS.flatMap((destination, i) => [
  {
    id: `${destination.id}-deluxe`,
    destinationId: destination.id,
    name: `${destination.name} Deluxe Room`,
    location: `${destination.name}, ${destination.country}`,
    image:
      'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=900&q=85',
    price: 3500 + i * 700,
    maxGuests: 2,
    rating: 4.8,
    amenities: ['Free Wi-Fi', 'Air conditioning', 'Breakfast included'],
    unavailable: [
      {
        checkIn: '2026-12-24',
        checkOut: '2026-12-28'
      }
    ]
  },
  {
    id: `${destination.id}-family`,
    destinationId: destination.id,
    name: `${destination.name} Family Suite`,
    location: `${destination.name}, ${destination.country}`,
    image:
      'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=900&q=85',
    price: 6000 + i * 800,
    maxGuests: 4,
    rating: 4.7,
    amenities: ['Free Wi-Fi', 'Private bathroom', 'Free parking'],
    unavailable: []
  }
]);

function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00Z`);

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
}

export function searchError(search: RoomSearch): string {
  if (
    !validDate(search.checkIn) ||
    !validDate(search.checkOut) ||
    search.checkIn < dateAfter(0) ||
    search.checkOut <= search.checkIn
  ) {
    return 'Select a check-in date today or later and a later check-out date.';
  }

  if (
    !Number.isInteger(search.guests) ||
    search.guests < 1 ||
    search.guests > 6
  ) {
    return 'Choose between 1 and 6 guests.';
  }

  if (!Number.isFinite(search.maxPrice) || search.maxPrice <= 0) {
    return 'Enter a positive nightly budget.';
  }

  if (
    search.destination &&
    !DESTINATIONS.some(item => item.id === search.destination)
  ) {
    return 'Select a valid destination.';
  }

  return '';
}

export function stayNights(search: RoomSearch): number {
  if (!validDate(search.checkIn) || !validDate(search.checkOut)) {
    return 0;
  }

  return Math.max(
    0,
    Math.round(
      (
        Date.parse(`${search.checkOut}T00:00:00Z`) -
        Date.parse(`${search.checkIn}T00:00:00Z`)
      ) / 86400000
    )
  );
}

export function findRooms(search: RoomSearch): Room[] {
  if (searchError(search)) {
    return [];
  }

  return ROOMS.filter(room => {
    const blocked = room.unavailable.some(stay =>
      search.checkIn < stay.checkOut &&
      search.checkOut > stay.checkIn
    );

    return (
      (!search.destination ||
        room.destinationId === search.destination) &&
      room.maxGuests >= search.guests &&
      room.price <= search.maxPrice &&
      (!search.breakfast ||
        room.amenities.includes('Breakfast included')) &&
      !blocked
    );
  });
}


export function readRoomSearch(
  params: { get(name: string): string | null }
): RoomSearch {
  const defaults = defaultSearch(
    params.get('destination') ?? ''
  );

  return {
    ...defaults,
    checkIn: params.get('checkIn') ?? defaults.checkIn,
    checkOut: params.get('checkOut') ?? defaults.checkOut,
    guests: Number(params.get('guests') ?? defaults.guests),
    maxPrice: Number(params.get('maxPrice') ?? defaults.maxPrice),
    breakfast: params.get('breakfast') === 'true'
  };
}

export function roomSearchQuery(
  search: RoomSearch
): Record<string, string> {
  return {
    destination: search.destination,
    checkIn: search.checkIn,
    checkOut: search.checkOut,
    guests: String(search.guests),
    maxPrice: String(search.maxPrice),
    breakfast: String(search.breakfast)
  };
}

export function roomAvailabilityError(
  room: Room,
  search: RoomSearch
): string {
  // Budget and breakfast filter the results, not room availability.
  const validationError = searchError({
    ...search,
    destination: room.destinationId,
    maxPrice: Number.MAX_SAFE_INTEGER,
    breakfast: false
  });

  if (validationError) {
    return validationError;
  }

  if (search.guests > room.maxGuests) {
    return `This room accommodates up to ${room.maxGuests} guests.`;
  }

  const blocked = room.unavailable.some(stay =>
    search.checkIn < stay.checkOut &&
    search.checkOut > stay.checkIn
  );

  return blocked
    ? 'This room is unavailable for the selected dates.'
    : '';
}

export function roomPhotos(room: Room): string[] {
  // Illustrative fallback images for the sample catalog.
  const additionalPhotos = room.photos ?? [
    'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1200&q=85'
  ];

  return [...new Set([room.image, ...additionalPhotos])];
}