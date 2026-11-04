import { Component, computed, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import {
  DESTINATIONS,
  Destination
} from '../../../data/destination';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})

export class Dashboard {
   readonly query = signal('');
  readonly category = signal('All');
  private readonly router = inject(Router);

  readonly categories = [
    'All',
    'Beaches',
    'Mountains',
    'Culture'
  ];

  readonly selectedDestination =
    signal<Destination | null>(null);

    readonly filteredDestinations = computed(() => {
    const query = this.query().trim().toLowerCase();

    return DESTINATIONS.filter(destination => {
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

selectDestination(destination: Destination): void {
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