import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { diaryAPI } from '../services/api';
import StarRating from './StarRating';
import Button from './ui/Button';
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

  // We're editing an existing entry only if it has a real database id.
  // A pre-filled object (e.g. just a rating from the movie page) has no id
  // and should create a new entry, not update one.
  const isEditing = !!existingEntry?.id;

  // Initialize form with existing entry data
  useEffect(() => {
    if (existingEntry) {
      setWatchedDate(
        existingEntry.watched_date || new Date().toISOString().split('T')[0]
      );
      setRating(existingEntry.rating || 0);
      setReview(existingEntry.review || '');
      setIsRewatch(existingEntry.is_rewatch || false);
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
      if (isEditing) {
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

  const inputClasses =
    'w-full px-4 py-3 bg-surface-3 border border-line rounded-md text-ink placeholder:text-ink-faint focus:outline-none focus:border-tungsten-400/60 focus:shadow-[var(--shadow-glow)] transition-[border-color,box-shadow] duration-150';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 bg-void/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="bg-surface-2 border border-line-strong rounded-2xl shadow-[var(--shadow-lift)] max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-surface-2/95 backdrop-blur-sm border-b border-line px-7 py-5 flex justify-between items-center z-10">
          <div>
            <p className="meta !text-tungsten-300 mb-1">Log Sheet</p>
            <h2 className="font-display font-semibold text-xl">
              {isEditing ? 'Edit Entry' : movieTitle}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 flex items-center justify-center rounded-md text-ink-mute hover:text-ink hover:bg-surface-3 transition-colors cursor-pointer text-xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-7">
          {isEditing && (
            <p className="text-ink-mute font-medium mb-6">{movieTitle}</p>
          )}

          {error && (
            <div className="bg-danger/10 border border-danger/40 text-danger px-4 py-3 rounded-md mb-6 text-sm">
              {error}
            </div>
          )}

          {/* Watched Date */}
          <div className="mb-6">
            <label className="meta block mb-2">Watched Date</label>
            <input
              type="date"
              value={watchedDate}
              onChange={(e) => setWatchedDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className={inputClasses}
              required
            />
          </div>

          {/* Rating */}
          <div className="mb-6">
            <label className="meta block mb-2">Rating · Optional</label>
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
                className="text-sm text-ink-faint hover:text-ink mt-2 transition-colors cursor-pointer"
              >
                Clear rating
              </button>
            )}
          </div>

          {/* Review */}
          <div className="mb-6">
            <label className="meta block mb-2">Review · Optional</label>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Share your thoughts about this movie…"
              rows={5}
              maxLength={5000}
              className={`${inputClasses} resize-none`}
            />
            <p className="meta !text-[0.65rem] !text-ink-faint mt-1.5">
              {review.length} / 5000
            </p>
          </div>

          {/* Rewatch Checkbox */}
          <div className="mb-8">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={isRewatch}
                onChange={(e) => setIsRewatch(e.target.checked)}
                className="w-5 h-5 accent-[#FF7847] bg-surface-3 border-line rounded"
              />
              <span className="text-sm text-ink-mute group-hover:text-ink transition-colors">
                I've watched this before (rewatch)
              </span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Saving…' : isEditing ? 'Update Entry' : 'Save Entry'}
            </Button>
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default DiaryEntryModal;
