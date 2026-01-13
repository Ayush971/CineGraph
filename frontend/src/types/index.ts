// User types
export interface User {
  id: number;
  username: string;
  email: string;
  avatar_url?: string;
  bio?: string;
  created_at: string;
}

export interface UserCreate {
  username: string;
  email: string;
  password: string;
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

// Movie types
export interface Movie {
  id: number;
  title: string;
  overview?: string;
  poster_path?: string;
  backdrop_path?: string;
  release_date?: string;
  vote_average?: number;
  vote_count?: number;
  popularity?: number;
  runtime?: number;
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path?: string;
}

export interface CrewMember {
  id: number;
  name: string;
  job: string;
  profile_path?: string;
}

export interface Credits {
  cast: CastMember[];
  crew: CrewMember[];
}

export interface Genre {
  id: number;
  name: string;
}

export interface MovieDetail extends Movie {
  genres?: Genre[];
  credits?: Credits;
  tmdb_id?: number;
}

export interface MovieListResponse {
  page: number;
  results: Movie[];
  total_pages: number;
  total_results: number;
}