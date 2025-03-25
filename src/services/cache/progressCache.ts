import { STORAGE_KEYS } from './constants';

/**
 * Service for caching student progress
 */
const progressCache = {
  /**
   * Get cached progress for a student and career
   */
  getProgress(studentId: string, careerId: number): any | null {
    const key = `${STORAGE_KEYS.PROGRESS_PREFIX}${studentId}_${careerId}`;
    const cachedData = localStorage.getItem(key);
    
    if (!cachedData) {
      return null;
    }
    
    try {
      return JSON.parse(cachedData);
    } catch (error) {
      console.error(`Error parsing cached progress for student ${studentId}, career ${careerId}:`, error);
      return null;
    }
  },
  
  /**
   * Store progress for a student and career
   */
  setProgress(studentId: string, careerId: number, progressData: any): void {
    try {
      const key = `${STORAGE_KEYS.PROGRESS_PREFIX}${studentId}_${careerId}`;
      localStorage.setItem(key, JSON.stringify({
        ...progressData,
        lastUpdated: new Date().toISOString()
      }));
    } catch (error) {
      console.error(`Error caching progress for student ${studentId}, career ${careerId}:`, error);
    }
  },
  
  /**
   * Clear progress cache for a student and career
   */
  clearProgressCache(studentId: string, careerId: number): void {
    const key = `${STORAGE_KEYS.PROGRESS_PREFIX}${studentId}_${careerId}`;
    localStorage.removeItem(key);
  }
};

export default progressCache; 