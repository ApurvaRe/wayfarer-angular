import { Component, computed, inject, signal, afterNextRender } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  ROOMS,
  dateAfter,
  readRoomSearch,
  roomAvailabilityError,
  roomPhotos,
  roomSearchQuery,
  stayNights
} from '../../../data/room';
import type { RoomSearch } from '../../../data/room';
import { DatePipe } from '@angular/common';
interface RoomReview {
  id: string;
  roomId: string;
  author: string;
  rating: number;
  comment: string;
  createdAt: string;
}
const REVIEW_STORAGE_KEY = 'wayfarer-room-reviews';

function isRoomReview(value: unknown): value is RoomReview {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const review = value as Record<string, unknown>;

  return (
    typeof review['id'] === 'string' &&
    typeof review['roomId'] === 'string' &&
    typeof review['author'] === 'string' &&
    typeof review['rating'] === 'number' &&
    Number.isInteger(review['rating']) &&
    review['rating'] >= 1 &&
    review['rating'] <= 5 &&
    typeof review['comment'] === 'string' &&
    typeof review['createdAt'] === 'string' &&
    !Number.isNaN(Date.parse(review['createdAt']))
  );
}
@Component({
  selector: 'app-room-details',
  standalone: true,
  imports: [CurrencyPipe, FormsModule, RouterLink, DatePipe],
  templateUrl: './room-details.html',
  styleUrl: './room-details.scss'
})




export class RoomDetails {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly params = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap
  });

  private readonly queryParams = toSignal(
    this.route.queryParamMap,
    { initialValue: this.route.snapshot.queryParamMap }
  );

  readonly bookingReview =
    this.route.snapshot.data['bookingReview'] === true;

  readonly today = dateAfter(0);
  readonly activePhoto = signal(0);

  readonly room = computed(() =>
    ROOMS.find(item => item.id === this.params().get('id'))
  );

  readonly search = computed(() =>
    readRoomSearch(this.queryParams())
  );

  readonly query = computed(() =>
    roomSearchQuery(this.search())
  );

  readonly photos = computed(() => {
    const room = this.room();
    return room ? roomPhotos(room) : [];
  });

  readonly selectedPhoto = computed(() =>
    this.photos()[this.activePhoto()] ?? this.photos()[0] ?? ''
  );

  readonly availabilityError = computed(() => {
    const room = this.room();

    return room
      ? roomAvailabilityError(room, this.search())
      : 'Room not found.';
  });

  readonly nights = computed(() => stayNights(this.search()));

  readonly subtotal = computed(() =>
    (this.room()?.price ?? 0) * this.nights()
  );

  readonly taxes = computed(() =>
    Math.round(this.subtotal() * 0.12)
  );

  readonly total = computed(() =>
    this.subtotal() + this.taxes()
  );
readonly allReviews = signal<RoomReview[]>([]);
readonly reviewError = signal('');
readonly reviewMessage = signal('');
readonly reviewsReady = signal(false);

reviewAuthor = '';
reviewRating = 5;
reviewComment = '';


readonly roomReviews = computed(() => {
  const selectedRoom = this.room();

  if (!selectedRoom) {
    return [];
  }

  return this.allReviews()
    .filter(review => review.roomId === String(selectedRoom.id))
    .sort(
      (a, b) =>
        Date.parse(b.createdAt) - Date.parse(a.createdAt)
    );
});

readonly averageReviewRating = computed(() => {
  const reviews = this.roomReviews();

  if (!reviews.length) {
    return null;
  }

  const total = reviews.reduce(
    (sum, review) => sum + review.rating,
    0
  );

  return (total / reviews.length).toFixed(1);
});

// Runs in the browser after rendering, so localStorage is safe with SSR.
private readonly initializeReviews = afterNextRender(() => {
  try {
    this.allReviews.set(this.readStoredReviews());
    this.reviewsReady.set(true);
  } catch {
    this.reviewError.set(
      'Reviews could not be loaded. Browser storage may be unavailable.'
    );
  }
});

private readStoredReviews(): RoomReview[] {
  const raw = localStorage.getItem(REVIEW_STORAGE_KEY);

  if (!raw) {
    return [];
  }

  const parsed: unknown = JSON.parse(raw);

  if (!Array.isArray(parsed) || !parsed.every(isRoomReview)) {
    throw new Error('Invalid review data.');
  }

  return parsed;
}

submitReview(): void {
  this.reviewError.set('');
  this.reviewMessage.set('');

  const selectedRoom = this.room();

  if (!selectedRoom || !this.reviewsReady()) {
    return;
  }

  const author = this.reviewAuthor.trim();
  const comment = this.reviewComment.trim();
  const rating = Number(this.reviewRating);

  if (!author || author.length > 60) {
    this.reviewError.set('Enter your name using up to 60 characters.');
    return;
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    this.reviewError.set('Select a rating between 1 and 5.');
    return;
  }

  if (comment.length < 10 || comment.length > 1000) {
    this.reviewError.set(
      'Write a review between 10 and 1,000 characters.'
    );
    return;
  }

  try {
    // Read again to retain reviews saved by another tab.
    const existing = this.readStoredReviews();

    const review: RoomReview = {
      id: crypto.randomUUID(),
      roomId: String(selectedRoom.id),
      author,
      rating,
      comment,
      createdAt: new Date().toISOString()
    };

    const updated = [review, ...existing];

    localStorage.setItem(
      REVIEW_STORAGE_KEY,
      JSON.stringify(updated)
    );

    this.allReviews.set(updated);
    this.reviewComment = '';
    this.reviewRating = 5;
    this.reviewMessage.set('Your review has been added.');
  } catch {
    this.reviewError.set(
      'Your review could not be saved. Check browser storage and try again.'
    );
  }
}
  updateSearch<K extends keyof RoomSearch>(
    field: K,
    value: RoomSearch[K]
  ): void {
    const next = { ...this.search(), [field]: value };

    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: roomSearchQuery(next),
      replaceUrl: true
    });
  }

  proceedToBooking(): void {
    const room = this.room();

    if (!room || this.availabilityError()) {
      return;
    }

    void this.router.navigate(['/booking', room.id], {
      queryParams: this.query()
    });
  }
}