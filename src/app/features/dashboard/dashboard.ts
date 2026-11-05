import {
  Component,
  DestroyRef,
  computed,
  inject,
  signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';

import {
  DESTINATIONS,
  Destination
} from '../../../data/destination';

import {
  watchDestinations,
  ManagedDestination
} from '../../core/destination-store';

type DisplayDestination = Destination | ManagedDestination;

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly query = signal('');
  readonly category = signal('All');
  readonly error = signal('');

  readonly destinations =
    signal<DisplayDestination[]>([...DESTINATIONS]);

  readonly selectedDestination =
    signal<DisplayDestination | null>(null);

  readonly categories = computed(() => [
    'All',
    ...new Set(this.destinations().map(item => item.category))
  ]);

  readonly filteredDestinations = computed(() => {
    const query = this.query().trim().toLowerCase();

    return this.destinations().filter(destination => {
      const matchesCategory =
        this.category() === 'All' ||
        destination.category === this.category();

      const matchesQuery =
        `${destination.name} ${destination.country}`
          .toLowerCase()
          .includes(query);

      return matchesCategory && matchesQuery;
    });
  });

  constructor() {
    // Assumes false means "visible destinations only".
    const unsubscribe = watchDestinations(
      false,
      savedDestinations => {
        const combined = new Map<string, DisplayDestination>();

        for (const destination of DESTINATIONS) {
          combined.set(destination.id, destination);
        }

        for (const destination of savedDestinations) {
          combined.set(destination.id, destination);
        }

        this.destinations.set([...combined.values()]);
        this.error.set('');
      },
      failure => {
        this.error.set(failure.message);
      }
    );

    this.destroyRef.onDestroy(unsubscribe);
  }

  selectDestination(destination: DisplayDestination): void {
    void this.router.navigate(['/rooms'], {
      queryParams: {
        destination: destination.id
      }
    });
  }

  backToDestinations(): void {
    this.selectedDestination.set(null);
  }

  resetFilters(): void {
    this.query.set('');
    this.category.set('All');
  }
}