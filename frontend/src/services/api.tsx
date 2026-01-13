import axios, { type AxiosInstance } from "axios";
import type {
  UserCreate,
  UserLogin,
  AuthResponse,
  MovieListResponse,
  MovieDetail,
} from "../types";

const API_BASE_URL = "http://localhost:8000";

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
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
    api.post<AuthResponse>("/auth/register", userData),

  login: (credentials: UserLogin) =>
    api.post<AuthResponse>("/auth/login", credentials),

  getMe: () => api.get<{ user: any }>("/auth/me"),
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

  getDetails: (movieId: number) => api.get<MovieDetail>(`/movies/${movieId}`),

  getWatchProviders: (movieId: number) =>
    api.get<any>(`/movies/${movieId}/watch-providers`),
};

export default api;
