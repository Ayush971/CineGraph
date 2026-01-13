import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { moviesAPI } from '../services/api';
import MovieCard from '../components/MovieCard';
import LoadingSpinner from '../components/LoadingSpinner';
import type { Movie } from '../types';

const SearchPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const searchMovies = async () => {
      if (!query) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const response = await moviesAPI.search(query, page);
        setMovies(response.data.results);
        setTotalPages(response.data.total_pages);
      } catch (err) {
        setError('Failed to search movies');
        console.error('Error searching movies:', err);
      } finally {
        setLoading(false);
      }
    };

    searchMovies();
  }, [query, page]);

  const handleNextPage = () => {
    if (page < totalPages) {
      setPage(page + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevPage = () => {
    if (page > 1) {
      setPage(page - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-red-500 text-xl">{error}</p>
      </div>
    );
  }

  if (!query) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-center text-gray-400">
          Enter a search query to find movies
        </h1>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Search Results for "{query}"
        </h1>
        <p className="text-gray-400">
          Found {movies.length > 0 ? `${movies.length} results` : 'no results'}
        </p>
      </div>

      {movies.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {movies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-12">
              <button
                onClick={handlePrevPage}
                disabled={page === 1}
                className="px-6 py-3 bg-surface-light rounded-lg hover:bg-surface transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              <span className="text-gray-400">
                Page {page} of {totalPages}
              </span>
              
              <button
                onClick={handleNextPage}
                disabled={page === totalPages}
                className="px-6 py-3 bg-surface-light rounded-lg hover:bg-surface transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-xl text-gray-400">
            No movies found for "{query}"
          </p>
          <p className="text-gray-500 mt-2">
            Try searching with different keywords
          </p>
        </div>
      )}
    </div>
  );
};

export default SearchPage;