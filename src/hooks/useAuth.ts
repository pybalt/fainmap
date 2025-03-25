import { useState, useEffect } from 'react';

/**
 * Hook to manage authentication state
 */
export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userLegajo, setUserLegajo] = useState<string | null>(null);
  const [loadingAuth, setLoadingAuth] = useState<boolean>(true);

  useEffect(() => {
    // Check for user details in local storage
    const storedUserLegajo = localStorage.getItem('userLegajo');
    const storedToken = localStorage.getItem('token');
    
    if (storedUserLegajo && storedToken) {
      setUserLegajo(storedUserLegajo);
      setIsAuthenticated(true);
    }
    
    setLoadingAuth(false);
  }, []);

  // Function to handle login
  const login = async (legajo: string, token: string) => {
    localStorage.setItem('userLegajo', legajo);
    localStorage.setItem('token', token);
    setUserLegajo(legajo);
    setIsAuthenticated(true);
    return true;
  };

  // Function to handle logout
  const logout = () => {
    localStorage.removeItem('userLegajo');
    localStorage.removeItem('token');
    localStorage.removeItem('selectedCareer');
    setUserLegajo(null);
    setIsAuthenticated(false);
  };

  return {
    isAuthenticated,
    userLegajo,
    loadingAuth,
    login,
    logout
  };
};

export default useAuth; 