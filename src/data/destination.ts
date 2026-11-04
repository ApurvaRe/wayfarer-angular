export interface Destination {
  id: string;
  name: string;
  country: string;
  category: string;
  image: string;
  description: string;
  highlights: string[];
}

const image = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1000&q=85`;

export const DESTINATIONS: Destination[] = [
  {
    id: 'bali',
    name: 'Bali',
    country: 'Indonesia',
    category: 'Beaches',
    image: image('photo-1537996194471-e657df975ab4'),
    description:
      'Discover tropical beaches, peaceful temples, and beautiful rice terraces. Bali offers a mix of relaxation, culture, and adventure.',
    highlights: ['Beaches', 'Temples', 'Rice terraces'],
  },
  {
    id: 'goa',
    name: 'Goa',
    country: 'India',
    category: 'Beaches',
    image: image('photo-1512343879784-a960bf40e7f2'),
    description:
      'Explore sun-filled beaches, colorful Portuguese streets, local markets, and relaxed coastal stays.',
    highlights: ['Beach activities', 'Local food', 'Heritage walks'],
  },
  {
    id: 'manali',
    name: 'Manali',
    country: 'India',
    category: 'Mountains',
    image: image('photo-1626621341517-bbf3d9990a23'),
    description:
      'Enjoy mountain views, pine forests, riverside walks, and cozy stays in the Himalayas.',
    highlights: ['Mountain views', 'Trekking', 'Riverside stays'],
  },
  {
    id: 'jaipur',
    name: 'Jaipur',
    country: 'India',
    category: 'Culture',
    image: image('photo-1599661046827-dacff0c0f09a'),
    description:
      'Experience Rajasthan through magnificent palaces, historic forts, colorful markets, and traditional hospitality.',
    highlights: ['Palaces', 'Historic forts', 'Shopping'],
  },
];