import { SubjectNode } from '../../types/database';
import { CACHE_DURATIONS, STORAGE_KEYS } from './constants';

/**
 * Service for caching subject data
 */
const subjectCache = {
  /**
   * Get cached subjects for a career if valid
   */
  getSubjects(careerId: number): SubjectNode[] | null {
    const key = `${STORAGE_KEYS.SUBJECTS_PREFIX}${careerId}`;
    const timestampKey = `${STORAGE_KEYS.SUBJECTS_TIMESTAMP_PREFIX}${careerId}`;
    
    const cachedData = localStorage.getItem(key);
    const timestamp = localStorage.getItem(timestampKey);
    
    if (!cachedData || !timestamp) {
      return null;
    }
    
    // Check if cache is still valid
    const currentTime = Date.now();
    const cacheTime = parseInt(timestamp, 10);
    
    if (currentTime - cacheTime > CACHE_DURATIONS.SUBJECTS) {
      return null; // Cache expired
    }
    
    try {
      return JSON.parse(cachedData);
    } catch (error) {
      console.error(`Error parsing cached subjects for career ${careerId}:`, error);
      return null;
    }
  },
  
  /**
   * Store subjects for a career in cache
   */
  setSubjects(careerId: number, subjects: SubjectNode[]): void {
    try {
      const key = `${STORAGE_KEYS.SUBJECTS_PREFIX}${careerId}`;
      const timestampKey = `${STORAGE_KEYS.SUBJECTS_TIMESTAMP_PREFIX}${careerId}`;
      
      localStorage.setItem(key, JSON.stringify(subjects));
      localStorage.setItem(timestampKey, Date.now().toString());
    } catch (error) {
      console.error(`Error caching subjects for career ${careerId}:`, error);
    }
  },
  
  /**
   * Clear subject cache for a specific career
   */
  clearSubjectsCache(careerId: number): void {
    const key = `${STORAGE_KEYS.SUBJECTS_PREFIX}${careerId}`;
    const timestampKey = `${STORAGE_KEYS.SUBJECTS_TIMESTAMP_PREFIX}${careerId}`;
    
    localStorage.removeItem(key);
    localStorage.removeItem(timestampKey);
  }
};

export default subjectCache; 