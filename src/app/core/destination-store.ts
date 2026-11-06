import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  runTransaction,
  updateDoc,
  where
} from 'firebase/firestore';
import { getDb } from './firebase';

export interface ManagedDestination {
  id: string;
  name: string;
  country: string;
  category: string;
  image: string;
  description: string;
  highlights: string[];
  isVisible: boolean;
}

// All destination fields except ID, which is passed separately when saving.
export type DestinationInput = Omit<ManagedDestination, 'id'>;

/**
 * Listens for destination changes in Firestore.
 * When admin is true, requests all destinations; otherwise, only visible ones.
 * Passes the alphabetically sorted list to next and listener errors to fail.
 * Returns an unsubscribe function to stop listening when the component is destroyed.
 * The admin flag selects the query; Firestore rules must enforce authorization.
 */
export function watchDestinations(
  admin: boolean,
  next: (destinations: ManagedDestination[]) => void,
  fail: (error: Error) => void
): () => void {
  const destinations = collection(getDb(), 'destinations');

  const source = admin
    ? destinations
    : query(destinations, where('isVisible', '==', true));

  return onSnapshot(
    source,
    snapshot => {
      const items = snapshot.docs.map(item => ({
        ...item.data(),
        id: item.id
      } as ManagedDestination));

      next(items.sort((a, b) => a.name.localeCompare(b.name)));
    },
    fail
  );
}

/**
 * Validates and cleans destination input, then saves it in a Firestore transaction.
 * When editing is false, rejects an ID that already exists.
 * When editing is true, rejects a document that no longer exists.
 * Replaces the document's fields with the validated data.
 * Throws an error if validation or the database operation fails.
 */
export async function saveDestination(
  id: string,
  input: DestinationInput,
  editing: boolean
): Promise<void> {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) {
    throw new Error('Use a lowercase ID, such as bali or new-york.');
  }

  let image: URL;

  try {
    image = new URL(input.image);
  } catch {
    throw new Error('Enter a valid HTTPS image URL.');
  }

  if (image.protocol !== 'https:') {
    throw new Error('The image URL must use HTTPS.');
  }

  const data: DestinationInput = {
    name: input.name.trim(),
    country: input.country.trim(),
    category: input.category.trim(),
    image: image.href,
    description: input.description.trim(),
    highlights: input.highlights.map(value => value.trim()).filter(Boolean),
    isVisible: input.isVisible
  };

  if (
    data.name.length < 2 ||
    data.name.length > 100 ||
    !data.country ||
    !data.category ||
    !data.description
  ) {
    throw new Error('Complete all fields. Name must be 2–100 characters.');
  }

  if (data.highlights.length > 20) {
    throw new Error('Enter no more than 20 highlights.');
  }

  const reference = doc(getDb(), 'destinations', id);

  await runTransaction(getDb(), async transaction => {
    const existing = await transaction.get(reference);

    if (!editing && existing.exists()) {
      throw new Error('This destination ID already exists.');
    }

    if (editing && !existing.exists()) {
      throw new Error('This destination was deleted. Reload the page.');
    }

    transaction.set(reference, data);
  });
}

/**
 * Updates only the destination's visibility field.
 * Pass true to show it in visible-only queries or false to exclude it.
 * Rejects if the document does not exist or the update fails.
 */
export function setDestinationVisibility(
  id: string,
  isVisible: boolean
): Promise<void> {
  return updateDoc(doc(getDb(), 'destinations', id), { isVisible });
}

/**
 * Deletes the destination document with the given ID from Firestore.
 * Does not delete related hotels, bookings, or static destination data.
 * Returns a promise that resolves when the deletion succeeds.
 */
export function deleteDestination(id: string): Promise<void> {
  return deleteDoc(doc(getDb(), 'destinations', id));
}