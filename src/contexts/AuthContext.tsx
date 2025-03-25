import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  isAuthenticated: boolean;
  userLegajo: string | null;
  login: (legajo: string) => void;
  logout: () => void;
  checkAuthentication: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userLegajo, setUserLegajo] = useState<string | null>(null);
  const navigate = useNavigate();

  // Check if user is authenticated on mount
  useEffect(() => {
    const legajo = localStorage.getItem('userLegajo');
    if (legajo) {
      setIsAuthenticated(true);
      setUserLegajo(legajo);
    }
  }, []);

  /**
   * Log in a user by setting their legajo in localStorage
   */
  const login = (legajo: string) => {
    localStorage.setItem('userLegajo', legajo);
    setIsAuthenticated(true);
    setUserLegajo(legajo);
  };

  /**
   * Log out a user by removing their legajo from localStorage
   */
  const logout = () => {
    localStorage.removeItem('userLegajo');
    setIsAuthenticated(false);
    setUserLegajo(null);
    navigate('/');
  };

  /**
   * Check if the user is authenticated
   */
  const checkAuthentication = () => {
    const legajo = localStorage.getItem('userLegajo');
    return !!legajo;
  };

  const value = {
    isAuthenticated,
    userLegajo,
    login,
    logout,
    checkAuthentication
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 