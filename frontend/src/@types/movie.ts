export const AGE_RATINGS = ["P", "K", "T13", "T16", "T18"] as const;

export type AgeRating = (typeof AGE_RATINGS)[number];

export type Movie = {
  id: string;
  slug: string;
  title: string;
  description: string;
  durationMin: number;
  rating: AgeRating;
  posterUrl: string;
  backdropUrl: string;
  genres: string[];
  nowShowing: boolean;
  trailerUrl?: string;
};

export type Showtime = {
  id: string;
  movieSlug: string;
  cinema: string;
  room: string;
  startsAt: string;
  priceBase: number;
  closed?: boolean;
};
