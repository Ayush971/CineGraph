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

// Diary types
export interface DiaryEntryCreate {
  movie_id: number;
  watched_date: string;
  rating?: number;
  review?: string;
  is_rewatch: boolean;
}

export interface DiaryEntryUpdate {
  watched_date?: string;
  rating?: number;
  review?: string;
  is_rewatch?: boolean;
}

export interface DiaryEntryResponse {
  id: number;
  user_id: number;
  movie_id: number;
  watched_date: string;
  rating?: number;
  review?: string;
  is_rewatch: boolean;
  created_at: string;
  updated_at?: string;
  movie: {
    id: number;
    tmdb_id: number;
    title: string;
    poster_path?: string;
    release_date?: string;
  };
}

export interface DiaryStats {
  total_movies: number;
  total_entries: number;
  average_rating?: number;
  total_rewatches: number;
  films_this_year: number;
  films_this_month: number;
}

export interface MovieLogStatus {
  logged: boolean;
  entries: Array<{
    id: number;
    watched_date: string;
    rating?: number;
    review?: string;
    is_rewatch: boolean;
  }>;
  latest?: {
    id: number;
    watched_date: string;
    rating?: number;
    review?: string;
    is_rewatch: boolean;
  };
}

// List types
export interface MovieList {
  id: number;
  user_id: number;
  title: string;
  description?: string;
  is_public: boolean;
  created_at: string;
  updated_at?: string;
  item_count: number;
  owner_username: string;
}

export interface MovieListCreate {
  title: string;
  description?: string;
  is_public: boolean;
}

export interface MovieListUpdate {
  title?: string;
  description?: string;
  is_public?: boolean;
}

export interface ListItemMovie {
  id: number;
  tmdb_id: number;
  title: string;
  poster_path?: string;
  release_date?: string;
  backdrop_path?: string;
  runtime?: number;
}

export interface ListItem {
  id: number;
  list_id: number;
  movie_id: number;
  rank: number;
  notes?: string;
  added_at: string;
  movie: ListItemMovie;
}

export interface ListItemCreate {
  movie_id: number;
  rank?: number;
  notes?: string;
}

export interface ListDetailResponse {
  id: number;
  user_id: number;
  title: string;
  description?: string;
  is_public: boolean;
  created_at: string;
  updated_at?: string;
  owner_username: string;
  items: ListItem[];
}

export interface ListReorderItem {
  item_id: number;
  rank: number;
}

// ==================== SOCIAL FEATURES ====================

export interface CommentAuthor {
  id: number;
  username: string;
  avatar_url?: string;
}

export interface CommentCreate {
  content: string;
  parent_id?: number;
}

export interface CommentTree {
  id: number;
  movie_id: number;
  user_id: number;
  parent_id?: number;
  content: string;
  is_edited: boolean;
  created_at: string;
  updated_at?: string;
  author: CommentAuthor;
  like_count: number;
  user_liked: boolean;
  reply_count: number;
  replies: CommentTree[];
}

export interface FollowUser {
  id: number;
  username: string;
  avatar_url?: string;
  bio?: string;
}

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  avatar_url?: string;
  bio?: string;
  created_at: string;
  follower_count: number;
  following_count: number;
  is_following: boolean;
  total_movies_watched: number;
  total_lists: number;
}

export interface ActivityItem {
  type: string;
  user: FollowUser;
  movie_title: string;
  movie_id: number;
  movie_poster?: string;
  detail?: string;
  timestamp: string;
}

export interface ActivityFeed {
  items: ActivityItem[];
  has_more: boolean;
}

export interface LikeStatus {
  liked: boolean;
  like_count: number;
}

// ==================== ACHIEVEMENTS ====================

export interface Achievement {
  id: number;
  title: string;
  description: string;
  icon: string;
  criteria_type: string;
  category: string;
  tier: string;
}

export interface UserAchievement {
  achievement: Achievement;
  earned_at: string;
}

export interface AchievementProgress {
  achievement: Achievement;
  earned: boolean;
  earned_at?: string;
  current: number;
  target: number;
  progress_text: string;
}

// ==================== ANALYTICS ====================

export interface GenreBreakdown {
  genre: string;
  count: number;
  percentage: number;
}

export interface MonthlyCount {
  month: number;
  year: number;
  count: number;
  label: string;
}

export interface DecadeCount {
  decade: string;
  count: number;
}

export interface PersonCount {
  person_id: number;
  name: string;
  profile_path?: string;
  count: number;
}

export interface WatchStreakData {
  current_streak: number;
  longest_streak: number;
  last_watched?: string;
}

export interface RatingDistribution {
  rating: number;
  count: number;
}

export interface AnalyticsOverview {
  genres: GenreBreakdown[];
  monthly: MonthlyCount[];
  decades: DecadeCount[];
  top_actors: PersonCount[];
  top_directors: PersonCount[];
  streaks: WatchStreakData;
  total_runtime_hours: number;
  average_rating?: number;
  total_movies: number;
}

// ==================== RECOMMENDATIONS ====================

export interface Recommendation {
  tmdb_id: number;
  title: string;
  poster_path?: string;
  release_date?: string;
  vote_average?: number;
  score: number;
  reason?: string;
}

export interface RecommendationResponse {
  items: Recommendation[];
}

export interface YearInReview {
  year: number;
  total_movies: number;
  total_hours: number;
  total_entries: number;
  average_rating?: number;
  top_genre?: string;
  top_actor?: PersonCount;
  top_director?: PersonCount;
  top_rated_movie?: {
    title: string;
    tmdb_id: number;
    poster_path?: string;
    rating: number;
  };
  monthly: MonthlyCount[];
  genres: GenreBreakdown[];
  rating_distribution: RatingDistribution[];
  most_watched_month?: string;
  longest_streak: number;
}