import React, { useState, useEffect } from 'react';
import { moviesAPI } from '../services/api';
import MovieCard from '../components/MovieCard';
import LoadingSpinner from '../components/LoadingSpinner';
import type { Movie } from '../types';

const MoviesHomePage: React.FC = () => {
  const [popularMovies, setPopularMovies] = useState<Movie[]>([]);
  const [nowPlaying, setNowPlaying] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const [popularRes, nowPlayingRes] = await Promise.all([
          moviesAPI.getPopular(),
          moviesAPI.getNowPlaying(),
        ]);
        
        setPopularMovies(popularRes.data.results.slice(0, 12));
        setNowPlaying(nowPlayingRes.data.results.slice(0, 12));
      } catch (err) {
        setError('Failed to fetch movies');
        console.error('Error fetching movies:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, []);


  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-red-500 text-xl">{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section with Search */}
        {/* Popular Movies Section */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">Popular Movies</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {popularMovies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        </section>

        {/* Now Playing Section */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">Now Playing</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {nowPlaying.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default MoviesHomePage;