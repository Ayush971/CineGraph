import axios, { type AxiosInstance } from 'axios';
import type { 
  UserCreate, 
  UserLogin, 
  AuthResponse, 
  MovieListResponse, 
  MovieDetail, 
  User,
  DiaryEntryCreate,
  DiaryEntryUpdate,
  DiaryEntryResponse,
  DiaryStats,
  MovieLogStatus,
  MovieList,
  MovieListCreate,
  MovieListUpdate,
  ListDetailResponse,
  ListItem,
  ListItemCreate,
  ListReorderItem
} from '../types';

const API_BASE_URL = 'http://localhost:8000';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auth API
export const authAPI = {
  register: (userData: UserCreate) => 
    api.post<AuthResponse>('/auth/register', userData),
  
  login: (credentials: UserLogin) => 
    api.post<AuthResponse>('/auth/login', credentials),
  
  getMe: () => 
    api.get<User>('/auth/me'),
};

// Movies API
export const moviesAPI = {
  getPopular: (page: number = 1) => 
    api.get<MovieListResponse>(`/movies/popular?page=${page}`),
  
  getNowPlaying: (page: number = 1) => 
    api.get<MovieListResponse>(`/movies/now-playing?page=${page}`),
  
  getUpcoming: (page: number = 1) => 
    api.get<MovieListResponse>(`/movies/upcoming?page=${page}`),
  
  getTopRated: (page: number = 1) => 
    api.get<MovieListResponse>(`/movies/top-rated?page=${page}`),
  
  search: (query: string, page: number = 1) => 
    api.get<MovieListResponse>(`/movies/search?query=${query}&page=${page}`),
  
  getDetails: (movieId: number) => 
    api.get<MovieDetail>(`/movies/${movieId}`),
  
  getWatchProviders: (movieId: number) => 
    api.get(`/movies/${movieId}/watch-providers`),
};

// Diary API
export const diaryAPI = {
  create: (entry: DiaryEntryCreate) => 
    api.post<DiaryEntryResponse>('/diary/entries', entry),
  
  getAll: (params?: { skip?: number; limit?: number; sort_by?: string }) => 
    api.get<DiaryEntryResponse[]>('/diary/entries', { params }),
  
  getById: (id: number) => 
    api.get<DiaryEntryResponse>(`/diary/entries/${id}`),
  
  update: (id: number, entry: DiaryEntryUpdate) => 
    api.put<DiaryEntryResponse>(`/diary/entries/${id}`, entry),
  
  delete: (id: number) => 
    api.delete(`/diary/entries/${id}`),
  
  getForMovie: (movieId: number) => 
    api.get<MovieLogStatus>(`/diary/entries/movie/${movieId}`),
  
  getStats: () => 
    api.get<DiaryStats>('/diary/stats'),
};

// Lists API
export const listsAPI = {
  create: (data: MovieListCreate) =>
    api.post<MovieList>('/lists/', data),

  getMyLists: () =>
    api.get<MovieList[]>('/lists/'),

  getDetail: (listId: number) =>
    api.get<ListDetailResponse>(`/lists/${listId}`),

  update: (listId: number, data: MovieListUpdate) =>
    api.put<MovieList>(`/lists/${listId}`, data),

  delete: (listId: number) =>
    api.delete(`/lists/${listId}`),

  discover: (params?: { skip?: number; limit?: number; search?: string }) =>
    api.get<MovieList[]>('/lists/discover', { params }),

  getShared: (listId: number) =>
    api.get<ListDetailResponse>(`/lists/share/${listId}`),

  addItem: (listId: number, item: ListItemCreate) =>
    api.post<ListItem>(`/lists/${listId}/items`, item),

  reorderItems: (listId: number, items: ListReorderItem[]) =>
    api.put<ListItem[]>(`/lists/${listId}/items/reorder`, { items }),

  removeItem: (listId: number, itemId: number) =>
    api.delete(`/lists/${listId}/items/${itemId}`),
};

// Comments API
export const commentsAPI = {
  getForMovie: (tmdbId: number, sort: string = 'newest') =>
    api.get(`/comments/movie/${tmdbId}?sort=${sort}`),

  getCount: (tmdbId: number) =>
    api.get<{ count: number }>(`/comments/movie/${tmdbId}/count`),

  create: (tmdbId: number, data: { content: string; parent_id?: number }) =>
    api.post(`/comments/movie/${tmdbId}`, data),

  update: (commentId: number, data: { content: string }) =>
    api.put(`/comments/${commentId}`, data),

  delete: (commentId: number) =>
    api.delete(`/comments/${commentId}`),
};

// Social API
export const socialAPI = {
  follow: (userId: number) =>
    api.post(`/social/follow/${userId}`),

  unfollow: (userId: number) =>
    api.delete(`/social/follow/${userId}`),

  getFollowers: (userId: number) =>
    api.get(`/social/followers/${userId}`),

  getFollowing: (userId: number) =>
    api.get(`/social/following/${userId}`),

  getProfile: (userId: number) =>
    api.get(`/social/profile/${userId}`),

  getFeed: (params?: { skip?: number; limit?: number }) =>
    api.get('/social/feed', { params }),
};

// Likes API
export const likesAPI = {
  toggle: (targetType: string, targetId: number) =>
    api.post('/likes/toggle', { target_type: targetType, target_id: targetId }),

  getStatus: (targetType: string, targetId: number) =>
    api.get(`/likes/status/${targetType}/${targetId}`),
};

export default api;