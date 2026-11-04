import { Component, computed, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import {
  getSavedSearches,
  removeSavedSearch,
  saveSearch
} from '../../core/saved-searches';
import type { SavedSearch } from '../../core/saved-searches';

import { DESTINATIONS } from '../../../data/destination';
import {
  dateAfter,
  findRooms,
  readRoomSearch,
  searchError,
  stayNights,
  type Room
} from '../../../data/room';

@Component({
  selector: 'app-rooms',
  standalone: true,
  imports: [FormsModule, CurrencyPipe, RouterLink],
  templateUrl: './rooms.html',
  styleUrl: './rooms.scss'
})
export class Rooms {
  private readonly route = inject(ActivatedRoute);

  readonly destinations = DESTINATIONS;
  readonly today = dateAfter(0);

  filters = readRoomSearch(this.route.snapshot.queryParamMap);

  readonly applied = signal({ ...this.filters });
  readonly error = signal(searchError(this.filters));

  readonly results = computed(() =>
    this.error() ? [] : findRooms(this.applied())
  );

  readonly nights = computed(() =>
    stayNights(this.applied())
  );

  readonly savedSearches = signal<SavedSearch[]>([]);
  readonly savedSearchMessage = signal('');
readonly pageSize = 5;
readonly currentPage = signal(1);

readonly totalPages = computed(() =>
  Math.ceil(this.results().length / this.pageSize)
);

readonly paginatedRooms = computed(() => {
  const start = (this.currentPage() - 1) * this.pageSize;

  return this.sortedRooms().slice(start, start + this.pageSize);
});

readonly pageNumbers = computed(() => {
  const total = this.totalPages();
  const current = this.currentPage();

  // Show at most five numbered buttons.
  const start = Math.max(1, Math.min(current - 2, total - 4));
  const end = Math.min(total, start + 4);

  return Array.from(
    { length: Math.max(0, end - start + 1) },
    (_, index) => start + index
  );
});

readonly firstResult = computed(() =>
  this.results().length
    ? (this.currentPage() - 1) * this.pageSize + 1
    : 0
);

readonly lastResult = computed(() =>
  Math.min(
    this.currentPage() * this.pageSize,
    this.results().length
  )
);

private sortWorker?: Worker;
private latestSortRequest = 0;

readonly sorting = signal(false);
readonly sortedRooms = signal<Room[]>([]);

private initializeSortWorker(): void {
  // Also prevents worker creation during server-side rendering.
  if (typeof Worker === 'undefined') {
    return;
  }

  this.sortWorker = new Worker(
    new URL('./hotel-sort.worker', import.meta.url),
    { type: 'module' }
  );

this.sortWorker.onmessage = ({ data }) => {
  console.log('[Rooms] Received worker result', data);

  if (data.requestId !== this.latestSortRequest) {
    return;
  }

  this.sortedRooms.set(data.rooms);
  this.sorting.set(false);
};

  this.sortWorker.onerror = () => {
    this.sorting.set(false);
    this.error.set('Unable to sort rooms. Please try again.');
  };
}


ngOnInit(): void {
  this.initializeSortWorker();
}


sortByPrice(rooms: Room[], direction: 'asc' | 'desc'): void {
  const requestId = ++this.latestSortRequest;

  this.currentPage.set(1);

  if (!this.sortWorker) {
    this.sortedRooms.set(
      [...rooms].sort((a, b) =>
        direction === 'asc'
          ? a.price - b.price
          : b.price - a.price
      )
    );
    return;
  }

  this.sorting.set(true);

  this.sortWorker.postMessage({
    requestId,
    rooms,
    direction,
  });
}

goToPage(page: number): void {
  if (
    !Number.isInteger(page) ||
    page < 1 ||
    page > this.totalPages()
  ) {
    return;
  }

  this.currentPage.set(page);
}
  constructor() {
    try {
      this.savedSearches.set(getSavedSearches());
    } catch (error: unknown) {
      this.savedSearchMessage.set(
        this.errorMessage(error, 'Unable to load saved searches.')
      );
    }
  }

search(): void {
  const validationError = searchError(this.filters);

  this.error.set(validationError);
  this.currentPage.set(1);

  if (validationError) {
    return;
  }

  // Keep your existing applied-filters update here.

  const matchingRooms = findRooms(this.filters);

  // Send all matching rooms to the worker BEFORE pagination.
  this.sortByPrice(matchingRooms, 'asc');
}

  destinationName(destinationId: string): string {
    return this.destinations.find(
      destination => destination.id === destinationId
    )?.name ?? 'All destinations';
  }

  saveCurrentSearch(): void {
    this.savedSearchMessage.set('');

    const validationError = searchError(this.applied());

    if (validationError) {
      this.savedSearchMessage.set(validationError);
      return;
    }

    try {
      // Save the criteria used for the displayed results.
      this.savedSearches.set(saveSearch(this.applied()));
      this.savedSearchMessage.set('Search saved successfully.');
    } catch (error: unknown) {
      this.savedSearchMessage.set(
        this.errorMessage(error, 'Unable to save this search.')
      );
    }
  }

  runSavedSearch(saved: SavedSearch): void {
    this.filters = { ...saved.criteria };
    this.search();

    this.savedSearchMessage.set(
      this.error()
        ? 'Saved criteria loaded. Update the invalid fields and search again.'
        : 'Saved search applied.'
    );
  }

  deleteSavedSearch(id: string): void {
    this.savedSearchMessage.set('');

    try {
      this.savedSearches.set(removeSavedSearch(id));
      this.savedSearchMessage.set('Saved search deleted.');
    } catch (error: unknown) {
      this.savedSearchMessage.set(
        this.errorMessage(error, 'Unable to delete this saved search.')
      );
    }
  }

  private errorMessage(error: unknown, fallback: string): string {
    return error instanceof Error ? error.message : fallback;
  }

  ngOnDestroy(): void {
  this.sortWorker?.terminate();
}
}