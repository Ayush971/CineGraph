import React, { useState, useEffect } from 'react';
import { diaryAPI } from '../services/api';
import StarRating from './StarRating';
import type { DiaryEntryCreate, DiaryEntryUpdate } from '../types';

interface DiaryEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  movieId: number;
  movieTitle: string;
  existingEntry?: {
    id: number;
    watched_date: string;
    rating?: number;
    review?: string;
    is_rewatch: boolean;
  };
  onSuccess: () => void;
}

const DiaryEntryModal: React.FC<DiaryEntryModalProps> = ({
  isOpen,
  onClose,
  movieId,
  movieTitle,
  existingEntry,
  onSuccess,
}) => {
  const [watchedDate, setWatchedDate] = useState('');
  const [rating, setRating] = useState<number>(0);
  const [review, setReview] = useState('');
  const [isRewatch, setIsRewatch] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Initialize form with existing entry data
  useEffect(() => {
    if (existingEntry) {
      setWatchedDate(existingEntry.watched_date);
      setRating(existingEntry.rating || 0);
      setReview(existingEntry.review || '');
      setIsRewatch(existingEntry.is_rewatch);
    } else {
      // Default to today's date
      setWatchedDate(new Date().toISOString().split('T')[0]);
      setRating(0);
      setReview('');
      setIsRewatch(false);
    }
  }, [existingEntry, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (existingEntry) {
        // Update existing entry
        const updateData: DiaryEntryUpdate = {
          watched_date: watchedDate,
          rating: rating > 0 ? rating : undefined,
          review: review.trim() || undefined,
          is_rewatch: isRewatch,
        };
        await diaryAPI.update(existingEntry.id, updateData);
      } else {
        // Create new entry
        const newEntry: DiaryEntryCreate = {
          movie_id: movieId,
          watched_date: watchedDate,
          rating: rating > 0 ? rating : undefined,
          review: review.trim() || undefined,
          is_rewatch: isRewatch,
        };
        await diaryAPI.create(newEntry);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save diary entry');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-surface border-b border-surface-light p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold">
            {existingEntry ? 'Edit Entry' : 'Log Movie'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Movie Title */}
          <div className="mb-6">
            <p className="text-lg font-semibold text-gray-300">
              {movieTitle}
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {/* Watched Date */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Watched Date
            </label>
            <input
              type="date"
              value={watchedDate}
              onChange={(e) => setWatchedDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 bg-surface-light border border-gray-700 rounded focus:outline-none focus:border-primary transition-colors"
              required
            />
          </div>

          {/* Rating */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Rating (Optional)
            </label>
            <StarRating
              rating={rating}
              maxRating={10}
              size="large"
              interactive={true}
              onRate={(newRating) => setRating(newRating)}
            />
            {rating > 0 && (
              <button
                type="button"
                onClick={() => setRating(0)}
                className="text-sm text-gray-400 hover:text-white mt-2"
              >
                Clear rating
              </button>
            )}
          </div>

          {/* Review */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Review (Optional)
            </label>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Share your thoughts about this movie..."
              rows={5}
              maxLength={5000}
              className="w-full px-4 py-3 bg-surface-light border border-gray-700 rounded focus:outline-none focus:border-primary transition-colors resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              {review.length} / 5000 characters
            </p>
          </div>

          {/* Rewatch Checkbox */}
          <div className="mb-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isRewatch}
                onChange={(e) => setIsRewatch(e.target.checked)}
                className="w-5 h-5 bg-surface-light border-gray-700 rounded focus:ring-primary"
              />
              <span className="text-sm">
                I've watched this before (rewatch)
              </span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-primary text-white rounded font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : existingEntry ? 'Update Entry' : 'Save Entry'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-surface-light text-white rounded font-semibold hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DiaryEntryModal;