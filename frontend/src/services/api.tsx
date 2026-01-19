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
  MovieLogStatus
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

export default api;