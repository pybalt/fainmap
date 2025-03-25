import { useState, useEffect, useCallback } from 'react';
import { Theme } from '../types/theme';

// Define the light and dark themes
const lightTheme: Theme = {
  name: 'Light',
  bgColor: 'bg-gray-100',
  headerBg: 'bg-white',
  cardBg: 'bg-white',
  textColor: 'text-gray-900',
  secondaryText: 'text-gray-500'
};

const darkTheme: Theme = {
  name: 'Dark',
  bgColor: 'bg-gray-900',
  headerBg: 'bg-gray-800',
  cardBg: 'bg-gray-800',
  textColor: 'text-white',
  secondaryText: 'text-gray-400'
};

/**
 * Hook for managing theme state with dark mode detection
 */
export const useTheme = () => {
  const [currentTheme, setCurrentTheme] = useState<Theme>(lightTheme);
  
  // Media query for dark mode
  const prefersDarkMode = 
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-color-scheme: dark)')
      : null;
      
  /**
   * Update theme based on dark mode preference
   */
  const updateTheme = useCallback((isDarkMode: boolean) => {
    setCurrentTheme(isDarkMode ? darkTheme : lightTheme);
  }, []);
  
  // Set initial theme based on user preference
  useEffect(() => {
    if (prefersDarkMode) {
      updateTheme(prefersDarkMode.matches);
    }
  }, [prefersDarkMode, updateTheme]);
  
  // Listen for changes in dark mode preference
  useEffect(() => {
    if (!prefersDarkMode) return;
    
    const handleChange = (e: MediaQueryListEvent) => {
      updateTheme(e.matches);
    };
    
    prefersDarkMode.addEventListener('change', handleChange);
    
    return () => {
      prefersDarkMode.removeEventListener('change', handleChange);
    };
  }, [prefersDarkMode, updateTheme]);
  
  return { 
    currentTheme,
    lightTheme,
    darkTheme,
    updateTheme
  };
}; 