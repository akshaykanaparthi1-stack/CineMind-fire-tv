import type { UserProfile } from '../types';

export const SAMPLE_PROFILES: UserProfile[] = [
  {
    id: 'dad',
    name: 'David (Dad)',
    avatar: '👨‍💼',
    color: '#3b82f6', // blue
    role: 'Parent',
    favoriteMoods: ['Adventurous', 'Excited', 'Curious'],
    favoriteGenres: ['Science Fiction', 'Action', 'Thriller'],
    maxAgeRating: 'R',
    likes: ['interstellar', 'spider-verse', 'dune-2', 'top-gun-maverick'],
    dislikes: ['super-mario']
  },
  {
    id: 'mom',
    name: 'Elena (Mom)',
    avatar: '👩‍🏫',
    color: '#ec4899', // pink/rose
    role: 'Parent',
    favoriteMoods: ['Curious', 'Relaxed', 'Romantic'],
    favoriteGenres: ['Drama', 'Comedy', 'Science Fiction'],
    maxAgeRating: 'R',
    likes: ['past-lives', 'everything-everywhere', 'knives-out', 'paddington-2'],
    dislikes: ['john-wick-4']
  },
  {
    id: 'maya',
    name: 'Maya (15y)',
    avatar: '🎧',
    color: '#a855f7', // purple
    role: 'Teen',
    favoriteMoods: ['Excited', 'Adventurous', 'Happy'],
    favoriteGenres: ['Animation', 'Action', 'Comedy'],
    maxAgeRating: 'PG-13',
    likes: ['spider-verse', 'mitchells-vs-machines', 'knives-out', 'dune-2'],
    dislikes: []
  },
  {
    id: 'leo',
    name: 'Leo (8y)',
    avatar: '🚀',
    color: '#ff9900', // amazon amber
    role: 'Kid',
    favoriteMoods: ['Happy', 'Adventurous', 'Excited'],
    favoriteGenres: ['Animation', 'Family', 'Comedy'],
    maxAgeRating: 'PG',
    likes: ['super-mario', 'paddington-2', 'mitchells-vs-machines', 'wall-e'],
    dislikes: ['interstellar', 'past-lives']
  },
  {
    id: 'grandma',
    name: 'Rose (Grandma)',
    avatar: '👵',
    color: '#10b981', // emerald
    role: 'Parent',
    favoriteMoods: ['Relaxed', 'Happy', 'Romantic'],
    favoriteGenres: ['Comedy', 'Family', 'Drama'],
    maxAgeRating: 'PG-13',
    likes: ['paddington-2', 'knives-out', 'past-lives'],
    dislikes: ['dune-2', 'john-wick-4']
  }
];
