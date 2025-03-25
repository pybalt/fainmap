/**
 * Cache durations in milliseconds
 */
export const CACHE_DURATIONS = {
  CAREERS: 1000 * 60 * 60 * 6, // 6 hours
  SUBJECTS: 1000 * 60 * 60 * 6, // 6 hours
  PROGRESS: 1000 * 60 * 60 * 24 * 7 // 7 days
};

/**
 * Storage keys
 */
export const STORAGE_KEYS = {
  CAREERS: 'careers',
  CAREERS_TIMESTAMP: 'careers_timestamp',
  SELECTED_CAREER: 'selectedCareer',
  SUBJECTS_PREFIX: 'subjects_',
  SUBJECTS_TIMESTAMP_PREFIX: 'subjects_timestamp_',
  PROGRESS_PREFIX: 'progress_'
}; 