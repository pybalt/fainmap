import { useState, useEffect, useCallback } from 'react';
import type { Career } from '../types/database';

// Cache duration constant (6 hours)
const CAREERS_CACHE_DURATION = 1000 * 60 * 60 * 6;

interface UseCareersResult {
  careers: Career[];
  selectedCareer: number | null;
  setSelectedCareer: (careerId: number) => void;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

/**
 * Hook for managing careers data and selection
 */
export const useCareers = (): UseCareersResult => {
  const [careers, setCareers] = useState<Career[]>([]);
  const [selectedCareer, setSelectedCareer] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load careers from API or cache
   */
  const loadCareers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check for cached careers
      const cachedCareers = localStorage.getItem('careers');
      const cacheTimestamp = localStorage.getItem('careers_timestamp');
      
      if (cachedCareers && cacheTimestamp) {
        const currentTime = Date.now();
        const timestamp = parseInt(cacheTimestamp, 10);
        
        // If cache hasn't expired, use it
        if (currentTime - timestamp < CAREERS_CACHE_DURATION) {
          console.log('Using cached careers, timestamp:', new Date(timestamp).toLocaleString());
          const parsedCareers = JSON.parse(cachedCareers);
          setCareers(parsedCareers);
          
          // If there's a saved career selection, use it
          const savedCareer = localStorage.getItem('selectedCareer');
          if (savedCareer) {
            console.log('Selecting saved career:', savedCareer);
            setSelectedCareer(parseInt(savedCareer, 10));
          }
          
          setLoading(false);
          return;
        }
      }
      
      console.log('Careers cache expired or non-existent, loading from server');
      
      // Load from API if no valid cache
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/api/careers`, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Error loading careers: ${response.status} ${response.statusText}`);
      }
      
      const careersData = await response.json();
      
      if (!careersData || careersData.length === 0) {
        setError('No careers found');
        setCareers([]);
        setLoading(false);
        return;
      }
      
      setCareers(careersData);
      
      // Update cache
      localStorage.setItem('careers', JSON.stringify(careersData));
      localStorage.setItem('careers_timestamp', Date.now().toString());
      
      // Select previously selected career if available
      const savedCareer = localStorage.getItem('selectedCareer');
      if (savedCareer) {
        console.log('Selecting saved career:', savedCareer);
        setSelectedCareer(parseInt(savedCareer, 10));
      }
    } catch (error) {
      console.error('Error loading careers:', error);
      setError(error instanceof Error ? error.message : 'Unknown error loading careers');
      setCareers([]);
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Load careers on mount
  useEffect(() => {
    loadCareers();
  }, [loadCareers]);
  
  // Update localStorage when selected career changes
  useEffect(() => {
    if (selectedCareer) {
      localStorage.setItem('selectedCareer', selectedCareer.toString());
    }
  }, [selectedCareer]);
  
  return {
    careers,
    selectedCareer,
    setSelectedCareer,
    loading,
    error,
    reload: loadCareers
  };
}; 