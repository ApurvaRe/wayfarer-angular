import {
  Component,
  DestroyRef,
  inject,
  signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  deleteDestination,
  saveDestination,
  setDestinationVisibility,
  watchDestinations
} from '../../core/destination-store';
import type { ManagedDestination } from '../../core/destination-store';

const emptyForm = () => ({
  id: '',
  name: '',
  country: '',
  category: '',
  image: '',
  description: '',
  highlights: '',
  isVisible: true
});

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <main class="admin-page">
      <a routerLink="/dashboard">← Back to destinations</a>
      <h1>Manage destinations</h1>

      @if (error()) {
        <p role="alert">{{ error() }}</p>
      }

      @if (message()) {
        <p role="status">{{ message() }}</p>
      }

      <form #destinationForm="ngForm" (ngSubmit)="submit()"
            class="admin-form">
        <h2>{{ editing ? 'Edit destination' : 'Add destination' }}</h2>

        <fieldset [disabled]="busy()">
          @for (field of fields; track field.key) {
            <label>
              {{ field.label }}
              <input
                [type]="field.key === 'image' ? 'url' : 'text'"
                [name]="field.key"
                [(ngModel)]="form[field.key]"
                [disabled]="field.key === 'id' && editing"
                [required]="field.key !== 'highlights'"
              >
            </label>
          }

          <label>
            <input
              type="checkbox"
              name="isVisible"
              [(ngModel)]="form.isVisible"
            >
            Visible to users
          </label>

          <button
            type="submit"
            [disabled]="busy() || destinationForm.invalid"
          >
            {{ busy() ? 'Working…' : editing ? 'Save changes' : 'Add destination' }}
          </button>

          @if (editing) {
            <button type="button" (click)="reset()">Cancel editing</button>
          }
        </fieldset>
      </form>

      <h2>Saved destinations</h2>

      @if (loading()) {
        <p role="status">Loading destinations…</p>
      } @else {
        <div class="admin-list">
          @for (destination of destinations(); track destination.id) {
            <article>
              <h3>{{ destination.name }}</h3>
              <p>{{ destination.country }} · {{ destination.category }}</p>
              <p>{{ destination.isVisible ? 'Visible' : 'Hidden' }}</p>

              <button [disabled]="busy()" (click)="edit(destination)">
                Edit
              </button>

              <button [disabled]="busy()" (click)="toggle(destination)">
                {{ destination.isVisible ? 'Hide' : 'Show' }}
              </button>

              <button [disabled]="busy()" (click)="remove(destination)">
                Delete
              </button>
            </article>
          } @empty {
            <p>No destinations yet. Add your first destination above.</p>
          }
        </div>
      }
    </main>
  `,
  styleUrl: './admin.scss'
})
export class Admin {
  private readonly destroyRef = inject(DestroyRef);

  readonly destinations = signal<ManagedDestination[]>([]);
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly message = signal('');

  readonly fields: {
    key: Exclude<keyof ReturnType<typeof emptyForm>, 'isVisible'>;
    label: string;
  }[] = [
    { key: 'id', label: 'Destination ID (example: bali)' },
    { key: 'name', label: 'Destination name' },
    { key: 'country', label: 'Country' },
    { key: 'category', label: 'Category' },
    { key: 'image', label: 'Image URL (HTTPS)' },
    { key: 'description', label: 'Description' },
    { key: 'highlights', label: 'Highlights, separated by commas' }
  ];

  form = emptyForm();
  editing = false;

  constructor() {
    const unsubscribe = watchDestinations(
      true,
      items => {
        this.destinations.set(items);
        this.loading.set(false);
      },
      failure => {
        this.error.set(failure.message);
        this.loading.set(false);
      }
    );

    this.destroyRef.onDestroy(unsubscribe);
  }

  reset(): void {
    this.form = emptyForm();
    this.editing = false;
  }

  edit(destination: ManagedDestination): void {
    this.form = {
      ...destination,
      highlights: destination.highlights.join(', ')
    };
    this.editing = true;
    this.error.set('');
    this.message.set('');
  }

  async submit(): Promise<void> {
    await this.perform(async () => {
      const { id, highlights, ...details } = this.form;

      await saveDestination(
        id,
        { ...details, highlights: highlights.split(',') },
        this.editing
      );

      this.reset();
    }, 'Destination saved.');
  }

  async toggle(destination: ManagedDestination): Promise<void> {
    await this.perform(
      () => setDestinationVisibility(
        destination.id,
        !destination.isVisible
      ),
      'Visibility updated.'
    );
  }

  async remove(destination: ManagedDestination): Promise<void> {
    if (!window.confirm('Delete ' + destination.name + '?')) return;

    await this.perform(async () => {
      await deleteDestination(destination.id);

      if (this.form.id === destination.id) this.reset();
    }, 'Destination deleted.');
  }

  private async perform(
    action: () => Promise<void>,
    successMessage: string
  ): Promise<void> {
    if (this.busy()) return;

    this.busy.set(true);
    this.error.set('');
    this.message.set('');

    try {
      await action();
      this.message.set(successMessage);
    } catch (failure: unknown) {
      this.error.set(
        failure instanceof Error ? failure.message : 'Operation failed.'
      );
    } finally {
      this.busy.set(false);
    }
  }
}