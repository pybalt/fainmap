import { Career } from '../../types/database';
import { CACHE_DURATIONS, STORAGE_KEYS } from './constants';

/**
 * Service for caching career data
 */
const careerCache = {
  /**
   * Get cached careers if valid
   */
  getCareers(): Career[] | null {
    const cachedData = localStorage.getItem(STORAGE_KEYS.CAREERS);
    const timestamp = localStorage.getItem(STORAGE_KEYS.CAREERS_TIMESTAMP);
    
    if (!cachedData || !timestamp) {
      return null;
    }
    
    // Check if cache is still valid
    const currentTime = Date.now();
    const cacheTime = parseInt(timestamp, 10);
    
    if (currentTime - cacheTime > CACHE_DURATIONS.CAREERS) {
      return null; // Cache expired
    }
    
    try {
      return JSON.parse(cachedData);
    } catch (error) {
      console.error('Error parsing cached careers:', error);
      return null;
    }
  },
  
  /**
   * Store careers in cache
   */
  setCareers(careers: Career[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CAREERS, JSON.stringify(careers));
      localStorage.setItem(STORAGE_KEYS.CAREERS_TIMESTAMP, Date.now().toString());
    } catch (error) {
      console.error('Error caching careers:', error);
    }
  },
  
  /**
   * Get selected career ID from localStorage
   */
  getSelectedCareer(): string | null {
    return localStorage.getItem(STORAGE_KEYS.SELECTED_CAREER);
  },
  
  /**
   * Store selected career ID in localStorage
   */
  setSelectedCareer(careerId: string): void {
    localStorage.setItem(STORAGE_KEYS.SELECTED_CAREER, careerId);
  }
};

export default careerCache; 