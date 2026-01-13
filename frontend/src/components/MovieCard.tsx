import React from 'react';
import { Link } from 'react-router-dom';
import { type Movie } from '../types';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

interface MovieCardProps {
  movie: Movie;
}

const MovieCard: React.FC<MovieCardProps> = ({ movie }) => {
  const posterUrl = movie.poster_path 
    ? `${TMDB_IMAGE_BASE}${movie.poster_path}` 
    : 'https://via.placeholder.com/500x750?text=No+Poster';

  const year = movie.release_date 
    ? new Date(movie.release_date).getFullYear() 
    : 'TBA';

  return (
    <Link 
      to={`/movie/${movie.id}`}
      className="group cursor-pointer transition-transform hover:scale-105"
    >
      <div className="relative overflow-hidden rounded-lg shadow-lg">
        <img 
          src={posterUrl} 
          alt={movie.title}
          className="w-full h-auto object-cover"
          loading="lazy"
        />
        
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-70 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="text-center px-4">
            <p className="text-white font-semibold text-sm">View Details</p>
          </div>
        </div>
      </div>
      
      <div className="mt-2">
        <h3 className="text-white font-semibold text-sm line-clamp-2">
          {movie.title}
        </h3>
        <div className="flex items-center justify-between mt-1">
          <p className="text-gray-400 text-xs">{year}</p>
          {movie.vote_average && (
            <p className="text-yellow-400 text-xs">
              ⭐ {movie.vote_average.toFixed(1)}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
};

export default MovieCard;